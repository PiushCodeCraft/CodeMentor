import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { runSessionCode, stopSessionCode } from '../api/sessions.js';

const EXECUTABLE_LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp'];

export default function CodeEditor({
  sessionId,
  initialCode = '',
  language = 'javascript',
  onLanguageChange,
  isReadOnly = false,
  socket,
  currentUserId,
  currentUser,
  onCodeChange,
  comments = [],
  highlightedLine = null,
  onSelectLine,
}) {
  const [code, setCode] = useState(initialCode);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const isRemoteUpdateRef = useRef(false);
  const debounceTimerRef = useRef(null);

  // Execution & Output Console states
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [stdin, setStdin] = useState('');
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState('console'); // 'console' | 'stdin' | 'preview'
  const [consoleHeight, setConsoleHeight] = useState('normal'); // 'normal' (240px) | 'expanded' (360px)
  const [runError, setRunError] = useState('');
  const [copied, setCopied] = useState(false);

  const isExecutable = EXECUTABLE_LANGUAGES.includes(language);
  const isPreviewLanguage = language === 'html' || language === 'css';
  const isJsonLanguage = language === 'json';

  // Sync initial code if it arrives after mount
  useEffect(() => {
    if (initialCode && !code) {
      setCode(initialCode);
    }
  }, [initialCode]);

  // Jump to highlighted line when requested
  useEffect(() => {
    if (editorRef.current && highlightedLine) {
      editorRef.current.revealLineInCenter(highlightedLine);
      editorRef.current.setPosition({ lineNumber: highlightedLine, column: 1 });
      editorRef.current.focus();
    }
  }, [highlightedLine]);

  // Update Monaco line decorations for comments
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const editor = editorRef.current;

    // Group comments by line number
    const commentsByLine = new Map();
    for (const c of comments) {
      if (!commentsByLine.has(c.line)) {
        commentsByLine.set(c.line, []);
      }
      commentsByLine.get(c.line).push(c);
    }

    const newDecorations = [];
    for (const [line, lineComments] of commentsByLine.entries()) {
      const hasOpen = lineComments.some((c) => c.status === 'open');
      const hoverText = lineComments
        .map(
          (c) =>
            `- **${c.author?.name || 'Reviewer'}** (${c.status}): ${c.text}`
        )
        .join('\n');

      newDecorations.push({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: hasOpen
            ? 'comment-line-highlight-open'
            : 'comment-line-highlight-resolved',
          hoverMessage: {
            value: `### 📝 Inline Comments (Line ${line})\n${hoverText}`,
          },
        },
      });
    }

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [comments]);

  // Handle incoming remote code changes via Socket.io
  useEffect(() => {
    if (!socket || !sessionId) return;

    const handleRemoteCodeChange = (data) => {
      if (data.sessionId === sessionId && data.updatedBy !== currentUserId) {
        isRemoteUpdateRef.current = true;
        setCode(data.content);

        if (editorRef.current) {
          const position = editorRef.current.getPosition();
          editorRef.current.setValue(data.content);
          if (position) {
            editorRef.current.setPosition(position);
          }
        }

        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 50);
      }
    };

    // Synchronize execution events across all session participants
    const handleRemoteRunStart = (data) => {
      if (data.sessionId === sessionId) {
        setIsRunning(true);
        setIsConsoleOpen(true);
        setActiveConsoleTab('console');
        setRunError('');
      }
    };

    const handleRemoteRunResult = (data) => {
      if (data.sessionId === sessionId) {
        setIsRunning(false);
        setExecutionResult(data.result);
        setIsConsoleOpen(true);
        if (data.result?.isPreview) {
          setActiveConsoleTab('preview');
        } else {
          setActiveConsoleTab('console');
        }
      }
    };

    const handleRemoteRunStopped = (data) => {
      if (data.sessionId === sessionId) {
        setIsRunning(false);
        setExecutionResult({
          status: 'stopped',
          language,
          stdout: '',
          stderr: `Execution stopped by ${data.stoppedBy?.name || 'participant'}.`,
          exitCode: 130,
          executionTimeMs: 0,
          executedBy: data.stoppedBy,
          executedAt: new Date().toISOString(),
        });
      }
    };

    socket.on('code:change', handleRemoteCodeChange);
    socket.on('code:run_start', handleRemoteRunStart);
    socket.on('code:run_result', handleRemoteRunResult);
    socket.on('code:run_stopped', handleRemoteRunStopped);

    return () => {
      socket.off('code:change', handleRemoteCodeChange);
      socket.off('code:run_start', handleRemoteRunStart);
      socket.off('code:run_result', handleRemoteRunResult);
      socket.off('code:run_stopped', handleRemoteRunStopped);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [socket, sessionId, currentUserId, language]);

  const handleEditorChange = (value) => {
    const newContent = value || '';

    // Ignore changes applied programmatically from remote users
    if (isRemoteUpdateRef.current) return;

    setCode(newContent);
    if (onCodeChange) onCodeChange(newContent);

    // Debounce broadcasting code changes via WebSocket
    if (socket && sessionId) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        socket.emit('code:change', {
          sessionId,
          content: newContent,
        });
      }, 300); // 300ms debounce
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Listen to cursor position to track line selection
    editor.onDidChangeCursorPosition((e) => {
      if (onSelectLine) {
        onSelectLine(e.position.lineNumber);
      }
    });

    // Add keyboard shortcut Ctrl+Enter / Cmd+Enter to run code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (isExecutable && !isRunning) {
        handleRunCode();
      }
    });
  };

  // Run Code handler
  const handleRunCode = async () => {
    if (!sessionId || isRunning) return;

    if (!code || !code.trim()) {
      setRunError('Code is empty. Please enter some code to execute.');
      setIsConsoleOpen(true);
      return;
    }

    setRunError('');
    setIsRunning(true);
    setIsConsoleOpen(true);
    setActiveConsoleTab('console');

    try {
      const res = await runSessionCode(sessionId, {
        code,
        language,
        stdin,
      });

      if (res?.execution) {
        setExecutionResult(res.execution);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Execution failed.';
      setRunError(errMsg);
      setExecutionResult({
        status: 'error',
        language,
        stdout: '',
        stderr: errMsg,
        exitCode: 1,
        executionTimeMs: 0,
        executedAt: new Date().toISOString(),
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Stop running execution handler
  const handleStopCode = async () => {
    try {
      await stopSessionCode(sessionId);
    } catch (err) {
      console.warn('Failed to stop code execution:', err);
    }
  };

  // Format / Validate JSON handler
  const handleFormatJson = () => {
    setIsConsoleOpen(true);
    setActiveConsoleTab('console');
    setRunError('');

    if (!code || !code.trim()) {
      setExecutionResult({
        status: 'empty',
        language: 'json',
        stdout: '',
        stderr: 'No JSON content to format.',
        exitCode: 0,
      });
      return;
    }

    try {
      const parsed = JSON.parse(code);
      const formatted = JSON.stringify(parsed, null, 2);
      setCode(formatted);
      if (editorRef.current) {
        editorRef.current.setValue(formatted);
      }
      if (socket && sessionId) {
        socket.emit('code:change', { sessionId, content: formatted });
      }
      setExecutionResult({
        status: 'success',
        language: 'json',
        stdout: formatted,
        stderr: '',
        message: '✓ Valid JSON formatted successfully in editor.',
        exitCode: 0,
        executionTimeMs: 1,
      });
    } catch (err) {
      setExecutionResult({
        status: 'syntax_error',
        language: 'json',
        stdout: '',
        stderr: `JSON SyntaxError: ${err.message}`,
        exitCode: 1,
        executionTimeMs: 1,
      });
    }
  };

  // Copy console output
  const handleCopyOutput = () => {
    const textToCopy = [
      executionResult?.stdout,
      executionResult?.stderr,
      executionResult?.compileOutput,
    ]
      .filter(Boolean)
      .join('\n\n');

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Clear output console
  const handleClearOutput = () => {
    setExecutionResult(null);
    setRunError('');
  };

  return (
    <div className="w-full h-full min-h-[520px] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Editor Top Bar with Actions */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>

          <span className="text-slate-400 font-mono font-medium hidden sm:inline">Monaco Editor</span>

          <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-mono text-[11px] uppercase font-semibold">
            {language}
          </span>

          {highlightedLine && (
            <span className="text-[11px] font-mono text-amber-700 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
              Line #{highlightedLine}
            </span>
          )}

          <span className="text-slate-400 font-mono hidden md:inline">
            {code ? `${code.split('\n').length} lines` : '0 lines'}
          </span>
        </div>

        {/* Execution & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Run Code / Stop Button for Executable Languages */}
          {isExecutable && (
            <>
              {isRunning ? (
                <button
                  onClick={handleStopCode}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer animate-pulse"
                  title="Stop code execution"
                >
                  <div className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={handleRunCode}
                  disabled={isReadOnly}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer group"
                  title="Run Code (Ctrl + Enter)"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">▶</span>
                  <span>Run Code</span>
                </button>
              )}
            </>
          )}

          {/* HTML / CSS Live Preview Trigger */}
          {isPreviewLanguage && (
            <button
              onClick={() => {
                setIsConsoleOpen(true);
                setActiveConsoleTab('preview');
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <span>👁️</span>
              <span>Live Preview</span>
            </button>
          )}

          {/* JSON Validator / Formatter */}
          {isJsonLanguage && (
            <button
              onClick={handleFormatJson}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-600/30 cursor-pointer"
            >
              <span>✓</span>
              <span>Format &amp; Validate</span>
            </button>
          )}

          {/* Toggle Output Console */}
          <button
            onClick={() => setIsConsoleOpen(!isConsoleOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 cursor-pointer ${
              isConsoleOpen
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Output Console panel"
          >
            <span>🖥️ Console</span>
            {executionResult && !isConsoleOpen && (
              <span
                className={`w-2 h-2 rounded-full ${
                  executionResult.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'
                }`}
              ></span>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Container */}
      <div className="flex-grow min-h-[380px] relative">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="light"
          options={{
            fontSize: 13,
            fontFamily: "Fira Code, Consolas, 'Courier New', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            readOnly: isReadOnly,
            padding: { top: 12, bottom: 12 },
            glyphMargin: true,
          }}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          loading={
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2"></div>
              Loading Monaco Editor...
            </div>
          }
        />
      </div>

      {/* Output Console Panel */}
      {isConsoleOpen && (
        <div
          className={`border-t border-slate-800 bg-slate-950 flex flex-col transition-all duration-200 ${
            consoleHeight === 'expanded' ? 'h-80' : 'h-60'
          }`}
        >
          {/* Console Header */}
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
            {/* Console Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveConsoleTab('console')}
                className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeConsoleTab === 'console'
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>&gt;_ Output</span>
                {isRunning && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                )}
              </button>

              {isExecutable && (
                <button
                  onClick={() => setActiveConsoleTab('stdin')}
                  className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeConsoleTab === 'stdin'
                      ? 'bg-slate-800 text-slate-100 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Stdin Input</span>
                  {stdin && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  )}
                </button>
              )}

              {isPreviewLanguage && (
                <button
                  onClick={() => setActiveConsoleTab('preview')}
                  className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeConsoleTab === 'preview'
                      ? 'bg-slate-800 text-slate-100 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Live Preview</span>
                </button>
              )}
            </div>

            {/* Execution Status Badges */}
            <div className="flex items-center gap-3">
              {isRunning ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <span>Executing in Sandbox...</span>
                </div>
              ) : executionResult ? (
                <div className="flex items-center gap-2">
                  {/* Status pill */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                      executionResult.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : executionResult.status === 'timed_out'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : executionResult.status === 'stopped'
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {executionResult.status === 'success'
                      ? `✓ Exit 0`
                      : executionResult.status === 'timed_out'
                      ? `⏱️ Timed Out`
                      : executionResult.status === 'stopped'
                      ? `⏹ Stopped`
                      : `✕ Error (${executionResult.exitCode ?? 1})`}
                  </span>

                  {/* Execution Duration */}
                  {typeof executionResult.executionTimeMs === 'number' && (
                    <span className="text-[11px] font-mono text-slate-400">
                      ⚡ {executionResult.executionTimeMs}ms
                    </span>
                  )}

                  {/* Executed by tag */}
                  {executionResult.executedBy && (
                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      by {executionResult.executedBy.name || 'User'}
                    </span>
                  )}
                </div>
              ) : null}

              {/* Console Toolbar Controls */}
              <div className="flex items-center gap-1 text-slate-400">
                {(executionResult?.stdout || executionResult?.stderr) && (
                  <button
                    onClick={handleCopyOutput}
                    className="p-1 hover:text-slate-200 rounded cursor-pointer"
                    title="Copy Output"
                  >
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                )}

                {executionResult && (
                  <button
                    onClick={handleClearOutput}
                    className="p-1 hover:text-slate-200 rounded cursor-pointer"
                    title="Clear Output"
                  >
                    ✕ Clear
                  </button>
                )}

                <button
                  onClick={() =>
                    setConsoleHeight(consoleHeight === 'normal' ? 'expanded' : 'normal')
                  }
                  className="p-1 hover:text-slate-200 rounded cursor-pointer text-xs"
                  title={consoleHeight === 'normal' ? 'Expand Console' : 'Collapse Console'}
                >
                  {consoleHeight === 'normal' ? '▲ Expand' : '▼ Collapse'}
                </button>

                <button
                  onClick={() => setIsConsoleOpen(false)}
                  className="p-1 hover:text-slate-200 rounded cursor-pointer"
                  title="Close Console Panel"
                >
                  — Minimize
                </button>
              </div>
            </div>
          </div>

          {/* Console Content Body */}
          <div className="flex-grow overflow-y-auto p-3 font-mono text-xs text-slate-300">
            {/* Tab 1: Terminal Output */}
            {activeConsoleTab === 'console' && (
              <div className="space-y-2">
                {isRunning ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-xs">Executing code in isolated container sandbox...</p>
                    <p className="text-[11px] text-slate-500">
                      Enforcing memory limits, output controls &amp; 5000ms execution timeout.
                    </p>
                  </div>
                ) : runError ? (
                  <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg text-red-400 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>✕</span>
                      <span>Execution Error</span>
                    </div>
                    <p className="text-xs">{runError}</p>
                  </div>
                ) : executionResult ? (
                  <div className="space-y-2">
                    {/* Informative message for JSON validation */}
                    {executionResult.message && (
                      <div className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 p-2 rounded-lg">
                        {executionResult.message}
                      </div>
                    )}

                    {/* Compilation diagnostics */}
                    {executionResult.compileOutput && (
                      <div className="p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          Compilation Diagnostics:
                        </div>
                        <pre className="whitespace-pre-wrap text-amber-300 font-mono text-xs">
                          {executionResult.compileOutput}
                        </pre>
                      </div>
                    )}

                    {/* Standard Output (stdout) */}
                    {executionResult.stdout ? (
                      <pre className="whitespace-pre-wrap font-mono text-slate-200 leading-relaxed">
                        {executionResult.stdout}
                      </pre>
                    ) : (
                      !executionResult.stderr &&
                      !executionResult.compileOutput && (
                        <div className="text-slate-500 italic py-2">
                          [Program finished with exit code {executionResult.exitCode ?? 0} and no stdout output]
                        </div>
                      )
                    )}

                    {/* Standard Error / Runtime Traceback (stderr) */}
                    {executionResult.stderr && (
                      <div className="p-2.5 bg-red-950/25 border border-red-500/30 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                          {executionResult.status === 'timed_out'
                            ? 'Timeout Diagnostics:'
                            : 'Runtime Error / Traceback:'}
                        </div>
                        <pre className="whitespace-pre-wrap text-red-300 font-mono text-xs">
                          {executionResult.stderr}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 py-6 text-center space-y-1">
                    <p className="text-slate-400">Output Console is ready.</p>
                    <p className="text-[11px] text-slate-600">
                      {isExecutable
                        ? 'Click "Run Code" above or press Ctrl+Enter to execute in sandbox.'
                        : isPreviewLanguage
                        ? 'HTML/CSS preview available in Live Preview tab.'
                        : 'JSON validation and formatting available above.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Standard Input (Stdin) */}
            {activeConsoleTab === 'stdin' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Provide inputs for interactive scripts (e.g., Python input(), Java Scanner):</span>
                  {stdin && (
                    <button
                      onClick={() => setStdin('')}
                      className="text-indigo-400 hover:underline cursor-pointer"
                    >
                      Clear Stdin
                    </button>
                  )}
                </div>
                <textarea
                  rows={6}
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter inputs line by line..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                ></textarea>
                <div className="flex justify-end">
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Run Code with Stdin &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: HTML / CSS Live Preview */}
            {activeConsoleTab === 'preview' && (
              <div className="space-y-2 h-full flex flex-col">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Sandboxed Live Document Preview</span>
                  <span className="font-mono text-slate-500">iframe sandbox="allow-scripts"</span>
                </div>
                <div className="flex-grow min-h-[160px] rounded-lg overflow-hidden border border-slate-800 bg-white">
                  <iframe
                    title="Live Code Preview"
                    srcDoc={
                      language === 'html'
                        ? code
                        : `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${code}</style></head><body style="font-family:sans-serif;padding:20px;"><h2>CSS Style Preview</h2><p>This is preview sample text styled by your editor rules.</p><div style="margin-top:10px;" class="card">Sample Card Element</div></body></html>`
                    }
                    sandbox="allow-scripts"
                    className="w-full h-full min-h-[160px]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Minimized Console Indicator Bar */}
      {!isConsoleOpen && (
        <div className="px-4 py-1.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <button
            onClick={() => setIsConsoleOpen(true)}
            className="flex items-center gap-2 hover:text-slate-200 cursor-pointer font-mono"
          >
            <span>&gt;_ Output Console</span>
            {isRunning && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-bold animate-pulse text-[10px]">
                Running...
              </span>
            )}
            {executionResult && !isRunning && (
              <span
                className={`px-1.5 py-0.2 rounded-full font-bold text-[10px] ${
                  executionResult.status === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {executionResult.status === 'success' ? '✓ Exit 0' : '✕ Error'}
              </span>
            )}
          </button>

          <span className="text-[10px] text-slate-600 hidden sm:inline">
            Ctrl+Enter to Run
          </span>
        </div>
      )}
    </div>
  );
}

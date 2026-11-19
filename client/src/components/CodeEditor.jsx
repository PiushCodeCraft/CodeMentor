import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor({
  sessionId,
  initialCode = '',
  language = 'javascript',
  isReadOnly = false,
  socket,
  currentUserId,
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

    socket.on('code:change', handleRemoteCodeChange);

    return () => {
      socket.off('code:change', handleRemoteCodeChange);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [socket, sessionId, currentUserId]);

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
  };

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Editor Top Bar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>
          <span className="text-slate-400 font-mono font-medium">Monaco Editor</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-600 font-mono text-[11px] uppercase font-semibold">
            {language}
          </span>
          {highlightedLine && (
            <span className="text-[11px] font-mono text-amber-700 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
              Inspecting Line #{highlightedLine}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isReadOnly ? (
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-700 font-mono text-[11px]">
              🔒 Read-Only (Completed)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-600 font-mono text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Live Sync Active
            </span>
          )}
          <span className="text-slate-400 font-mono">
            {code ? `${code.split('\n').length} lines` : '0 lines'}
          </span>
        </div>
      </div>

      {/* Monaco Container */}
      <div className="flex-grow min-h-[450px]">
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
    </div>
  );
}

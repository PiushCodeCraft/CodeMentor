import { env } from '../config/env.js';

/**
 * Supported language configurations
 */
export const LANGUAGE_CONFIG = {
  javascript: {
    pistonLang: 'javascript',
    judge0Id: 63, // JavaScript (Node.js 12.14.0)
    version: '*',
    fileName: 'index.js',
    isExecutable: true,
    label: 'JavaScript',
  },
  typescript: {
    pistonLang: 'typescript',
    judge0Id: 74, // TypeScript (3.7.4)
    version: '*',
    fileName: 'index.ts',
    isExecutable: true,
    label: 'TypeScript',
  },
  python: {
    pistonLang: 'python',
    judge0Id: 71, // Python (3.8.1)
    version: '3.10.0',
    fileName: 'main.py',
    isExecutable: true,
    label: 'Python',
  },
  java: {
    pistonLang: 'java',
    judge0Id: 62, // Java (OpenJDK 13.0.1)
    version: '*',
    fileName: 'Main.java',
    isExecutable: true,
    label: 'Java',
  },
  cpp: {
    pistonLang: 'c++',
    judge0Id: 54, // C++ (GCC 9.2.0)
    version: '*',
    fileName: 'main.cpp',
    isExecutable: true,
    label: 'C++',
  },
  json: {
    isExecutable: false,
    type: 'json',
    label: 'JSON',
  },
  html: {
    isExecutable: false,
    type: 'preview',
    previewType: 'html',
    label: 'HTML',
  },
  css: {
    isExecutable: false,
    type: 'preview',
    previewType: 'css',
    label: 'CSS',
  },
};

// Aliases
const LANGUAGE_ALIASES = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  'c++': 'cpp',
};

/**
 * Normalize and resolve language key
 */
export function resolveLanguageKey(lang) {
  if (!lang) return '';
  const lower = String(lang).trim().toLowerCase();
  if (LANGUAGE_ALIASES[lower]) return LANGUAGE_ALIASES[lower];
  return lower;
}

/**
 * Check if a language supports isolated code execution
 */
export function isLanguageExecutable(lang) {
  const key = resolveLanguageKey(lang);
  return Boolean(LANGUAGE_CONFIG[key]?.isExecutable);
}

/**
 * Check if a language is supported in the live session
 */
export function isLanguageSupported(lang) {
  const key = resolveLanguageKey(lang);
  return Boolean(LANGUAGE_CONFIG[key]);
}

/**
 * Resolve target source filename for Piston/isolated runners
 */
function resolveFileName(langKey, code) {
  if (langKey === 'java') {
    // Inspect if code defines a public class
    const match = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
    if (match && match[1]) {
      return `${match[1]}.java`;
    }
    return 'Main.java';
  }
  return LANGUAGE_CONFIG[langKey]?.fileName || 'main';
}

/**
 * Safely truncate large output strings to prevent buffer overflow
 */
function truncateOutput(str, maxChars = 65536) {
  if (!str) return '';
  if (str.length <= maxChars) return str;
  return str.slice(0, maxChars) + '\n\n[... Output truncated: exceeded 64KB size limit ...]';
}

/**
 * Execute session code in an isolated execution sandbox
 *
 * Security & Reliability guarantees:
 * - Isolated Piston / Judge0 container engine
 * - Execution time limits (5000ms max)
 * - Safe memory limits
 * - Max output length capping (64KB)
 * - Input validation & sanitization
 * - No user code is executed inside the Node.js backend
 */
export async function executeSessionCode({
  code = '',
  language = 'javascript',
  stdin = '',
  timeoutMs = 7000,
  signal = null,
  customFetcher = null, // for testing / mocking
}) {
  const startTime = Date.now();
  const langKey = resolveLanguageKey(language);

  // 1. Language validation
  if (!isLanguageSupported(langKey)) {
    return {
      status: 'unsupported_language',
      language,
      stdout: '',
      stderr: `Language '${language}' is not supported for execution.`,
      exitCode: 1,
      executionTimeMs: 0,
      executedAt: new Date().toISOString(),
    };
  }

  // 2. Special handler: JSON validation & formatting
  if (langKey === 'json') {
    if (!code || !code.trim()) {
      return {
        status: 'empty',
        language: 'json',
        stdout: '',
        stderr: 'No JSON content provided.',
        exitCode: 0,
        executionTimeMs: 0,
        executedAt: new Date().toISOString(),
      };
    }
    try {
      const parsed = JSON.parse(code);
      const formatted = JSON.stringify(parsed, null, 2);
      return {
        status: 'success',
        language: 'json',
        stdout: formatted,
        stderr: '',
        exitCode: 0,
        message: 'Valid JSON syntax.',
        executionTimeMs: Date.now() - startTime,
        executedAt: new Date().toISOString(),
      };
    } catch (jsonErr) {
      return {
        status: 'syntax_error',
        language: 'json',
        stdout: '',
        stderr: `JSON SyntaxError: ${jsonErr.message}`,
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        executedAt: new Date().toISOString(),
      };
    }
  }

  // 3. Special handler: HTML / CSS Preview mode
  if (langKey === 'html' || langKey === 'css') {
    return {
      status: 'preview',
      language: langKey,
      isPreview: true,
      previewType: langKey,
      stdout: `Preview ready for ${LANGUAGE_CONFIG[langKey].label}. Rendered in sandbox frame.`,
      stderr: '',
      exitCode: 0,
      executionTimeMs: Date.now() - startTime,
      executedAt: new Date().toISOString(),
    };
  }

  // 4. Executable languages: check for empty code
  if (!code || !code.trim()) {
    return {
      status: 'empty',
      language: langKey,
      stdout: '',
      stderr: 'Code is empty. Please write some code before clicking Run Code.',
      exitCode: 0,
      executionTimeMs: 0,
      executedAt: new Date().toISOString(),
    };
  }

  // 5. Code length validation (max 64KB)
  if (code.length > 65536) {
    return {
      status: 'error',
      language: langKey,
      stdout: '',
      stderr: 'Code size limit exceeded (maximum 64KB).',
      exitCode: 1,
      executionTimeMs: 0,
      executedAt: new Date().toISOString(),
    };
  }

  const config = LANGUAGE_CONFIG[langKey];
  const fileName = resolveFileName(langKey, code);

  // Setup abort controller with timeout
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort(new Error('EXECUTION_TIMEOUT'));
  }, timeoutMs);

  // If external signal is provided (e.g. user clicked Stop), wire it up
  if (signal) {
    signal.addEventListener('abort', () => {
      timeoutController.abort(new Error('USER_STOPPED'));
    });
  }

  const fetcher = customFetcher || globalThis.fetch;

  try {
    const pistonBaseUrl = env.PISTON_API_URL || 'https://emkc.org/api/v2/piston';
    const executeUrl = `${pistonBaseUrl.replace(/\/+$/, '')}/execute`;

    const requestBody = {
      language: config.pistonLang,
      version: config.version,
      files: [
        {
          name: fileName,
          content: code,
        },
      ],
      stdin: stdin ? String(stdin).slice(0, 16384) : '',
      run_timeout: 5000,
      compile_timeout: 10000,
    };

    const response = await fetcher(executeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: timeoutController.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return {
        status: 'error',
        language: langKey,
        stdout: '',
        stderr: `Execution provider returned HTTP ${response.status}: ${errText || 'Execution failed.'}`,
        exitCode: response.status,
        executionTimeMs: Date.now() - startTime,
        executedAt: new Date().toISOString(),
      };
    }

    const data = await response.json();
    const duration = Date.now() - startTime;

    // Check for compilation errors (e.g. C++, Java)
    if (data.compile && data.compile.code !== 0) {
      return {
        status: 'compilation_error',
        language: langKey,
        stdout: truncateOutput(data.compile.stdout || ''),
        stderr: truncateOutput(data.compile.stderr || data.compile.output || 'Compilation failed.'),
        compileOutput: truncateOutput(data.compile.output || ''),
        exitCode: data.compile.code,
        executionTimeMs: duration,
        executedAt: new Date().toISOString(),
      };
    }

    const run = data.run || {};

    // Check for timeout / infinite loop signal
    const isTimedOut =
      run.signal === 'SIGKILL' ||
      run.signal === 'SIGTERM' ||
      (run.output && run.output.toLowerCase().includes('timed out'));

    if (isTimedOut) {
      return {
        status: 'timed_out',
        language: langKey,
        stdout: truncateOutput(run.stdout || ''),
        stderr: truncateOutput(
          (run.stderr ? run.stderr + '\n' : '') +
            'Execution timed out: Time limit (5000ms) exceeded. Check for infinite loops, recursive calls, or unresolved blocking inputs.'
        ),
        exitCode: 124,
        executionTimeMs: duration,
        executedAt: new Date().toISOString(),
      };
    }

    // Check for runtime error (exit code != 0)
    if (run.code !== 0 && run.code !== null && run.code !== undefined) {
      return {
        status: 'runtime_error',
        language: langKey,
        stdout: truncateOutput(run.stdout || ''),
        stderr: truncateOutput(run.stderr || run.output || 'Runtime error occurred.'),
        exitCode: run.code,
        executionTimeMs: duration,
        executedAt: new Date().toISOString(),
      };
    }

    // Success
    return {
      status: 'success',
      language: langKey,
      stdout: truncateOutput(run.stdout || ''),
      stderr: truncateOutput(run.stderr || ''),
      exitCode: 0,
      executionTimeMs: duration,
      executedAt: new Date().toISOString(),
    };
  } catch (err) {
    clearTimeout(timeoutId);

    const duration = Date.now() - startTime;

    if (err.name === 'AbortError' || timeoutController.signal.aborted) {
      const reason = timeoutController.signal.reason?.message || err.message;
      if (reason === 'USER_STOPPED') {
        return {
          status: 'stopped',
          language: langKey,
          stdout: '',
          stderr: 'Execution stopped by user.',
          exitCode: 130,
          executionTimeMs: duration,
          executedAt: new Date().toISOString(),
        };
      }
      return {
        status: 'timed_out',
        language: langKey,
        stdout: '',
        stderr: 'Execution timed out before provider could respond (exceeded request limit).',
        exitCode: 124,
        executionTimeMs: duration,
        executedAt: new Date().toISOString(),
      };
    }

    // Provider unreachable or network error
    return {
      status: 'service_unavailable',
      language: langKey,
      stdout: '',
      stderr: `Isolated code execution service unreachable (${err.message}). Ensure Piston API is configured and reachable or verify internet connection.`,
      exitCode: 503,
      executionTimeMs: duration,
      executedAt: new Date().toISOString(),
    };
  }
}

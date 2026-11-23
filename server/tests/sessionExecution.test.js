import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import {
  executeSessionCode,
  isLanguageExecutable,
  isLanguageSupported,
  resolveLanguageKey,
} from '../src/services/sessionExecutionService.js';
import { activeSessionExecutions } from '../src/controllers/sessionController.js';

describe('Live Session Code Execution Suite', () => {
  // ==========================================
  // 1. Language Resolution & Support
  // ==========================================
  it('should identify supported and executable languages accurately', () => {
    assert.strictEqual(isLanguageSupported('javascript'), true);
    assert.strictEqual(isLanguageSupported('python'), true);
    assert.strictEqual(isLanguageSupported('typescript'), true);
    assert.strictEqual(isLanguageSupported('java'), true);
    assert.strictEqual(isLanguageSupported('cpp'), true);
    assert.strictEqual(isLanguageSupported('c++'), true);
    assert.strictEqual(isLanguageSupported('html'), true);
    assert.strictEqual(isLanguageSupported('css'), true);
    assert.strictEqual(isLanguageSupported('json'), true);
    assert.strictEqual(isLanguageSupported('brainfuck'), false);

    assert.strictEqual(isLanguageExecutable('javascript'), true);
    assert.strictEqual(isLanguageExecutable('python'), true);
    assert.strictEqual(isLanguageExecutable('html'), false);
    assert.strictEqual(isLanguageExecutable('css'), false);
    assert.strictEqual(isLanguageExecutable('json'), false);
    assert.strictEqual(isLanguageExecutable('unknown'), false);
  });

  // ==========================================
  // 2. JavaScript Output
  // ==========================================
  it('should parse and return JavaScript execution output cleanly', async () => {
    const mockFetcher = async () => ({
      ok: true,
      json: async () => ({
        language: 'javascript',
        version: '18.15.0',
        run: {
          stdout: 'CodeMentor Live JS Output\n[1, 2, 3]\n',
          stderr: '',
          code: 0,
          signal: null,
        },
      }),
    });

    const result = await executeSessionCode({
      code: 'console.log("CodeMentor Live JS Output"); console.log([1, 2, 3]);',
      language: 'javascript',
      customFetcher: mockFetcher,
    });

    assert.strictEqual(result.status, 'success');
    assert.strictEqual(result.exitCode, 0);
    assert.ok(result.stdout.includes('CodeMentor Live JS Output'));
    assert.strictEqual(result.stderr, '');
    assert.strictEqual(typeof result.executionTimeMs, 'number');
  });

  // ==========================================
  // 3. Python Output
  // ==========================================
  it('should parse and return Python execution output cleanly', async () => {
    const mockFetcher = async () => ({
      ok: true,
      json: async () => ({
        language: 'python',
        version: '3.10.0',
        run: {
          stdout: 'CodeMentor Live Python Output 42\n',
          stderr: '',
          code: 0,
          signal: null,
        },
      }),
    });

    const result = await executeSessionCode({
      code: 'print("CodeMentor Live Python Output", 42)',
      language: 'python',
      customFetcher: mockFetcher,
    });

    assert.strictEqual(result.status, 'success');
    assert.strictEqual(result.exitCode, 0);
    assert.ok(result.stdout.includes('CodeMentor Live Python Output 42'));
    assert.strictEqual(result.stderr, '');
  });

  // ==========================================
  // 4. Compilation Errors
  // ==========================================
  it('should handle and surface compilation errors (e.g. C++/Java)', async () => {
    const mockFetcher = async () => ({
      ok: true,
      json: async () => ({
        language: 'c++',
        version: '10.2.0',
        compile: {
          stdout: '',
          stderr: 'main.cpp:2:5: error: expected ";" before "return"',
          output: 'main.cpp:2:5: error: expected ";" before "return"',
          code: 1,
        },
        run: {
          stdout: '',
          stderr: '',
          code: null,
        },
      }),
    });

    const result = await executeSessionCode({
      code: 'int main() { int x = 5 return 0; }',
      language: 'cpp',
      customFetcher: mockFetcher,
    });

    assert.strictEqual(result.status, 'compilation_error');
    assert.strictEqual(result.exitCode, 1);
    assert.ok(result.stderr.includes('error: expected ";"'));
    assert.ok(result.compileOutput.includes('main.cpp:2:5'));
  });

  // ==========================================
  // 5. Runtime Errors
  // ==========================================
  it('should capture and display runtime errors with nonzero exit code', async () => {
    const mockFetcher = async () => ({
      ok: true,
      json: async () => ({
        language: 'python',
        version: '3.10.0',
        run: {
          stdout: '',
          stderr: 'ZeroDivisionError: division by zero\n',
          code: 1,
          signal: null,
        },
      }),
    });

    const result = await executeSessionCode({
      code: 'x = 1 / 0',
      language: 'python',
      customFetcher: mockFetcher,
    });

    assert.strictEqual(result.status, 'runtime_error');
    assert.strictEqual(result.exitCode, 1);
    assert.ok(result.stderr.includes('ZeroDivisionError: division by zero'));
  });

  // ==========================================
  // 6. Infinite Loop & Timeouts
  // ==========================================
  it('should detect infinite loop signals (SIGKILL) and return timed_out status', async () => {
    const mockFetcher = async () => ({
      ok: true,
      json: async () => ({
        language: 'javascript',
        version: '18.15.0',
        run: {
          stdout: '',
          stderr: '',
          code: null,
          signal: 'SIGKILL',
          output: 'Process timed out after 5000ms\n',
        },
      }),
    });

    const result = await executeSessionCode({
      code: 'while (true) {}',
      language: 'javascript',
      customFetcher: mockFetcher,
    });

    assert.strictEqual(result.status, 'timed_out');
    assert.strictEqual(result.exitCode, 124);
    assert.ok(result.stderr.includes('timed out'));
  });

  // ==========================================
  // 7. Empty Code Validation
  // ==========================================
  it('should reject empty code without calling execution provider', async () => {
    let fetchCalled = false;
    const mockFetcher = async () => {
      fetchCalled = true;
    };

    const result = await executeSessionCode({
      code: '   \n  \t  ',
      language: 'python',
      customFetcher: mockFetcher,
    });

    assert.strictEqual(fetchCalled, false);
    assert.strictEqual(result.status, 'empty');
    assert.ok(result.stderr.includes('Code is empty'));
  });

  // ==========================================
  // 8. Unsupported Language Handling
  // ==========================================
  it('should cleanly reject unsupported languages', async () => {
    const result = await executeSessionCode({
      code: '+++++ [ > +++++ < - ]',
      language: 'brainfuck',
    });

    assert.strictEqual(result.status, 'unsupported_language');
    assert.ok(result.stderr.includes('not supported'));
  });

  // ==========================================
  // 9. JSON Validation & Formatting
  // ==========================================
  it('should validate and pretty-print valid JSON', async () => {
    const result = await executeSessionCode({
      code: '{"name":"CodeMentor","tokens":100}',
      language: 'json',
    });

    assert.strictEqual(result.status, 'success');
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout, '{\n  "name": "CodeMentor",\n  "tokens": 100\n}');
  });

  it('should catch and report JSON syntax errors', async () => {
    const result = await executeSessionCode({
      code: '{"name": "broken",}',
      language: 'json',
    });

    assert.strictEqual(result.status, 'syntax_error');
    assert.strictEqual(result.exitCode, 1);
    assert.ok(result.stderr.includes('JSON SyntaxError'));
  });

  // ==========================================
  // 10. HTML/CSS Live Preview Mode
  // ==========================================
  it('should recognize HTML and CSS as live preview documents', async () => {
    const htmlResult = await executeSessionCode({
      code: '<h1>Hello World</h1>',
      language: 'html',
    });

    assert.strictEqual(htmlResult.status, 'preview');
    assert.strictEqual(htmlResult.isPreview, true);
    assert.strictEqual(htmlResult.previewType, 'html');

    const cssResult = await executeSessionCode({
      code: 'body { color: blue; }',
      language: 'css',
    });

    assert.strictEqual(cssResult.status, 'preview');
    assert.strictEqual(cssResult.isPreview, true);
    assert.strictEqual(cssResult.previewType, 'css');
  });

  // ==========================================
  // 11. User Stop / Abort Handling
  // ==========================================
  it('should handle execution stop via AbortController signal', async () => {
    const controller = new AbortController();

    const mockFetcher = async (_url, options) => {
      // Simulate delayed execution
      return new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          reject(new Error('USER_STOPPED'));
        });
      });
    };

    // Stop shortly after starting
    setTimeout(() => {
      controller.abort();
    }, 20);

    const result = await executeSessionCode({
      code: 'import time; time.sleep(10)',
      language: 'python',
      signal: controller.signal,
      customFetcher: mockFetcher,
    });

    assert.strictEqual(result.status, 'stopped');
    assert.ok(result.stderr.includes('stopped by user'));
  });

  // ==========================================
  // 12. Session Route Protections
  // ==========================================
  it('POST /api/sessions/:id/run should reject unauthenticated requests with 401', async () => {
    const res = await request(app)
      .post('/api/sessions/507f191e810c19729de860e1/run')
      .send({ code: 'console.log(1)', language: 'javascript' });

    assert.strictEqual(res.status, 401);
  });

  it('POST /api/sessions/:id/stop-run should reject unauthenticated requests with 401', async () => {
    const res = await request(app)
      .post('/api/sessions/507f191e810c19729de860e1/stop-run');

    assert.strictEqual(res.status, 401);
  });

  // ==========================================
  // 13. Duplicate Execution Prevention
  // ==========================================
  it('should track active executions per session in activeSessionExecutions map', () => {
    const testSessionId = 'session_mock_concurrency_test';
    const testController = new AbortController();

    assert.strictEqual(activeSessionExecutions.has(testSessionId), false);

    activeSessionExecutions.set(testSessionId, testController);
    assert.strictEqual(activeSessionExecutions.has(testSessionId), true);

    // Cleanup
    activeSessionExecutions.delete(testSessionId);
    assert.strictEqual(activeSessionExecutions.has(testSessionId), false);
  });
});

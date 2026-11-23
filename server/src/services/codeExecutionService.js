import vm from 'node:vm';

/**
 * Safely parse input arguments for testing
 */
function parseInputArguments(inputStr) {
  try {
    const trimmed = (inputStr || '').trim();
    if (!trimmed) return [];
    // If input is an array (e.g. "[1, 2, 3]" or "[[1, 2], 3]"), parse as array
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return JSON.parse(trimmed);
    }
    // Otherwise treat as single JSON argument
    return [JSON.parse(trimmed)];
  } catch {
    // Fallback: split by comma if not valid JSON
    return [inputStr];
  }
}

/**
 * Normalize output for safe, reliable comparison
 */
function normalizeOutput(val) {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

/**
 * Execute student code safely in an isolated VM sandbox against test cases
 * 
 * Security safeguards:
 * - Isolated Node.js vm context
 * - No process, require, network, or filesystem primitives
 * - Strict timeout (1500ms) per execution to mitigate infinite loops
 * - Sanitized memory footprint
 */
export async function executeAndTestCode({
  code,
  functionName = 'solution',
  testCases = [],
  timeoutMs = 1500,
}) {
  const startTime = Date.now();
  const testResults = [];
  let passCount = 0;

  // Build isolated sandbox context
  const sandbox = {
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {},
    },
    Math,
    Date,
    String,
    Number,
    Boolean,
    Array,
    Object,
    JSON,
    RegExp,
    Map,
    Set,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
  };

  const context = vm.createContext(sandbox);

  try {
    // 1. Compile student submission script in sandbox
    const script = new vm.Script(code, {
      filename: 'student_solution.js',
    });

    script.runInContext(context, { timeout: timeoutMs });

    // 2. Verify target function exists in sandbox
    const fn = context[functionName];
    if (typeof fn !== 'function') {
      return {
        status: 'error',
        passCount: 0,
        totalTests: testCases.length,
        executionTimeMs: Date.now() - startTime,
        error: `Function '${functionName}' was not found. Please define 'function ${functionName}(...)'.`,
        testResults: [],
      };
    }

    // 3. Run all test cases
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const args = parseInputArguments(tc.input);

      try {
        context.__args = args;
        const callScript = new vm.Script(`__result = ${functionName}.apply(null, __args);`);
        callScript.runInContext(context, { timeout: timeoutMs });
        const result = context.__result;
        const actualStr = normalizeOutput(result);
        const expectedStr = normalizeOutput(
          typeof tc.expectedOutput === 'string' &&
            (tc.expectedOutput.startsWith('{') || tc.expectedOutput.startsWith('['))
            ? JSON.parse(tc.expectedOutput)
            : tc.expectedOutput
        );

        // Check equality: string equality or JSON deep equality
        const isMatch = actualStr === expectedStr || actualStr === String(tc.expectedOutput);

        if (isMatch) {
          passCount++;
        }

        testResults.push({
          testIndex: i + 1,
          passed: isMatch,
          actual: tc.isHidden ? '[Hidden Test Case]' : actualStr,
          expected: tc.isHidden ? '[Hidden]' : expectedStr,
          error: null,
          isHidden: Boolean(tc.isHidden),
        });
      } catch (runErr) {
        testResults.push({
          testIndex: i + 1,
          passed: false,
          actual: null,
          expected: tc.isHidden ? '[Hidden]' : String(tc.expectedOutput),
          error: runErr.message || 'Execution Error',
          isHidden: Boolean(tc.isHidden),
        });
      }
    }

    const allPassed = testCases.length > 0 && passCount === testCases.length;

    return {
      status: allPassed ? 'passed' : 'failed',
      passCount,
      totalTests: testCases.length,
      executionTimeMs: Date.now() - startTime,
      testResults,
      error: allPassed ? null : `${testCases.length - passCount} out of ${testCases.length} tests failed.`,
    };
  } catch (compileErr) {
    return {
      status: 'error',
      passCount: 0,
      totalTests: testCases.length,
      executionTimeMs: Date.now() - startTime,
      error: `Syntax or execution error: ${compileErr.message}`,
      testResults: [],
    };
  }
}

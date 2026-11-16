/**
 * AI Pre-Review Service (Phase 8)
 * Analyzes code snippets for bugs, risks, and improvements.
 * Supports Google Gemini API with intelligent heuristic fallback
 * to guarantee graceful degradation without blocking requests.
 */

/**
 * Intelligent heuristic fallback code analyzer
 * Analyzes code structure, syntax patterns, and common code smells
 */
export const analyzeCodeHeuristically = ({ title, description, code, tech = [] }) => {
  const codeLines = (code || '').split('\n');
  const codeLength = codeLines.length;
  const lowerCode = (code || '').toLowerCase();
  const techStr = (tech || []).join(', ');

  const bugs = [];
  const risks = [];
  const improvements = [];

  // 1. Bug and Syntax Checks
  if (lowerCode.includes('== ') && !lowerCode.includes('=== ')) {
    bugs.push('Loose equality (`==`) detected instead of strict equality (`===`). This can lead to unexpected type coercion bugs.');
  }

  if (lowerCode.includes('.map(') && !lowerCode.includes('key=') && (lowerCode.includes('<div') || lowerCode.includes('<li') || lowerCode.includes('<tr'))) {
    bugs.push('React JSX list rendered via `.map()` appears to be missing a unique `key` prop on the top-level returned element.');
  }

  if (lowerCode.includes('setstate(') || lowerCode.includes('set') && lowerCode.includes('prev =>')) {
    // State update pattern is ok
  } else if (lowerCode.includes('.push(') && (lowerCode.includes('state') || lowerCode.includes('items') || lowerCode.includes('list'))) {
    bugs.push('Direct array mutation detected (e.g. `.push()`). In reactive frameworks like React, mutating state directly prevents re-renders.');
  }

  if (lowerCode.includes('async ') && !lowerCode.includes('try') && !lowerCode.includes('.catch(')) {
    bugs.push('Asynchronous function lacks `try...catch` block or `.catch()` rejection handler, risking unhandled promise rejections.');
  }

  if (bugs.length === 0) {
    bugs.push('No obvious syntax errors detected at first glance. Verify runtime edge cases during the live session.');
  }

  // 2. Risks & Edge Cases
  if (lowerCode.includes('fetch(') || lowerCode.includes('axios.') || lowerCode.includes('http')) {
    risks.push('Network calls detected: ensure appropriate loading states, network timeouts, and graceful UI error handling are implemented.');
  }

  if (lowerCode.includes('localstorage') || lowerCode.includes('sessionstorage')) {
    risks.push('Client-side storage access: ensure operations are wrapped in try-catch in case of private browsing storage restrictions.');
  }

  if (lowerCode.includes('password') || lowerCode.includes('secret') || lowerCode.includes('api_key') || lowerCode.includes('apikey')) {
    risks.push('Potential hardcoded credentials or API keys detected in code snippet. Secrets should always be loaded via environment variables.');
  }

  if (lowerCode.includes('any') && (techStr.toLowerCase().includes('typescript') || lowerCode.includes(': any'))) {
    risks.push('Use of TypeScript `any` type bypasses type safety. Consider replacing with specific interfaces or `unknown`.');
  }

  if (codeLength > 80) {
    risks.push('Single snippet exceeds 80 lines: consider modularizing into smaller, single-responsibility components or utility helpers.');
  }

  if (risks.length === 0) {
    risks.push('Ensure input validation is handled for boundary conditions (null, undefined, empty strings, and large payloads).');
  }

  // 3. Recommended Improvements
  if (lowerCode.includes('console.log')) {
    improvements.push('Remove debug `console.log()` statements before finalizing production code.');
  }

  if (techStr.toLowerCase().includes('react') || lowerCode.includes('useeffect')) {
    improvements.push('Verify dependency arrays in `useEffect` and `useCallback` hooks to prevent stale closures or infinite re-render loops.');
  }

  if (!lowerCode.includes('const ') && lowerCode.includes('var ')) {
    improvements.push('Replace legacy `var` declarations with block-scoped `const` and `let`.');
  }

  improvements.push('Add unit tests or input boundary assertions to validate happy and failure paths.');
  improvements.push(`Review tech stack conventions for [${techStr || 'JavaScript/Fullstack'}] during the live session.`);

  return [
    `### 🤖 CodeMentor AI Pre-Review Summary`,
    `**Context**: *${title || 'Review Request'}* ${techStr ? `(${techStr})` : ''}`,
    ``,
    `#### 🐛 Potential Bugs & Issues`,
    ...bugs.map((b) => `- ${b}`),
    ``,
    `#### ⚠️ Risks & Edge Cases`,
    ...risks.map((r) => `- ${r}`),
    ``,
    `#### 💡 Recommended Improvements`,
    ...improvements.map((i) => `- ${i}`),
    ``,
    `*Generated automatically by CodeMentor AI Pre-Review Assistant to assist the mentor.*`,
  ].join('\n');
};

/**
 * Generate AI Code Pre-Review
 * Calls Google Gemini API if GEMINI_API_KEY is available;
 * otherwise gracefully falls back to the intelligent heuristic analyzer.
 *
 * @param {Object} options
 * @param {string} options.title Request title
 * @param {string} options.description Request description
 * @param {string} options.code Submitted code snippet
 * @param {Array<string>} options.tech Technology tags
 * @returns {Promise<string>} Markdown summary of code review
 */
export const generateCodeReview = async ({ title, description, code, tech = [] }) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const prompt = `You are a senior developer conducting a pre-review on CodeMentor Live to help the mentor.
Analyze the following code snippet:
Title: ${title}
Description: ${description || 'None'}
Tech: ${tech.join(', ')}

Code:
\`\`\`
${code.slice(0, 4000)}
\`\`\`

Provide a concise, helpful summary in markdown format with these exact headings:
### 🤖 CodeMentor AI Pre-Review Summary
#### 🐛 Potential Bugs & Issues
- (bullet points)
#### ⚠️ Risks & Edge Cases
- (bullet points)
#### 💡 Recommended Improvements
- (bullet points)

Keep it actionable, polite, and under 250 words.`;

      // Call Google Gemini API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 500,
            },
          }),
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText && aiText.trim().length > 0) {
          return aiText.trim();
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed or timed out, falling back to local heuristic analyzer:', err.message);
    }
  }

  // Graceful fallback to heuristic pattern analyzer
  return analyzeCodeHeuristically({ title, description, code, tech });
};

export default {
  generateCodeReview,
  analyzeCodeHeuristically,
};


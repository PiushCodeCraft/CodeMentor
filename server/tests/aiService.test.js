import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import {
  generateCodeReview,
  analyzeCodeHeuristically,
  parseAiSummary,
} from '../src/services/aiService.js';

describe('AI Pre-Review Suite (Phase 8)', () => {
  it('generateCodeReview should return a markdown pre-review with bugs, risks, and improvements', async () => {
    const summary = await generateCodeReview({
      title: 'React state not updating',
      description: 'Items pushed to array do not trigger re-render',
      code: `
        async function fetchUser(id) {
          const res = await fetch('/api/user/' + id);
          const data = await res.json();
          items.push(data);
          if (data.id == id) {
            console.log(data);
          }
        }
      `,
      tech: ['React', 'JavaScript'],
    });

    assert.ok(typeof summary === 'string');
    assert.ok(summary.length > 50);
    assert.ok(summary.includes('AI Pre-Review Summary'));
    assert.ok(summary.includes('Bugs'));
    assert.ok(summary.includes('Risks'));
    assert.ok(summary.includes('Improvements'));
  });

  it('analyzeCodeHeuristically should identify loose equality and direct state mutations', () => {
    const summary = analyzeCodeHeuristically({
      title: 'Buggy state',
      description: 'Why is component not re-rendering?',
      code: `
        if (a == b) {
          state.items.push(newItem);
        }
      `,
      tech: ['React'],
    });

    assert.ok(summary.includes('Loose equality'));
    assert.ok(summary.includes('Direct array mutation'));
  });

  it('analyzeCodeHeuristically should flag potential hardcoded credentials and secret keys', () => {
    const summary = analyzeCodeHeuristically({
      title: 'API connection code',
      code: `const api_key = "AIzaSyD-sample-secret-key-12345";`,
      tech: ['Node.js'],
    });

    assert.ok(summary.includes('hardcoded credentials or API keys'));
  });

  it('analyzeCodeHeuristically should handle empty or unusual inputs gracefully', () => {
    const summary = analyzeCodeHeuristically({
      title: '',
      description: '',
      code: '',
      tech: [],
    });

    assert.ok(typeof summary === 'string');
    assert.ok(summary.includes('AI Pre-Review Summary'));
  });

  it('analyzeCodeHeuristically should flag unclosed intervals and query injection patterns', () => {
    const summary = analyzeCodeHeuristically({
      title: 'Poll server',
      code: `setInterval(() => { fetch('/api/data'); }, 1000); const query = "SELECT * FROM users WHERE id = " + \`\${userId}\`;`,
      tech: ['Node.js', 'SQL'],
    });

    assert.ok(summary.includes('setInterval'));
    assert.ok(summary.includes('Dynamic query string interpolation'));
  });

  it('parseAiSummary should partition markdown output into structured arrays', () => {
    const sample = `### 🤖 CodeMentor AI Pre-Review Summary
**Context**: *Testing* (JavaScript)

#### 🐛 Potential Bugs & Issues
- Bug item 1
- Bug item 2

#### ⚠️ Risks & Edge Cases
- Risk item 1

#### 💡 Recommended Improvements
- Tip item 1`;

    const parsed = parseAiSummary(sample);
    assert.strictEqual(parsed.bugs.length, 2);
    assert.strictEqual(parsed.risks.length, 1);
    assert.strictEqual(parsed.improvements.length, 1);
    assert.strictEqual(parsed.bugs[0], 'Bug item 1');
  });

  it('POST /api/requests/:id/ai-review should reject unauthenticated requests with 401', async () => {
    const res = await request(app).post('/api/requests/507f191e810c19729de860e1/ai-review');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });
});


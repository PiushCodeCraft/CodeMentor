import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import {
  generateCodeReview,
  analyzeCodeHeuristically,
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

  it('POST /api/requests/:id/ai-review should reject unauthenticated requests with 401', async () => {
    const res = await request(app).post('/api/requests/507f191e810c19729de860e1/ai-review');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });
});


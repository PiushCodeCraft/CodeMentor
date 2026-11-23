import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Request from '../models/Request.js';
import Challenge from '../models/Challenge.js';
import Assignment from '../models/Assignment.js';
import TokenPackage from '../models/TokenPackage.js';
import { generateCodeReview } from '../services/aiService.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error('MONGO_URI is missing from .env file');
}

export const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas.');

    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
    const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);

    // 1. Seed or Upsert Admin User
    const adminUser = await User.findOneAndUpdate(
      { email: 'admin@codementor.live' },
      {
        name: 'System Administrator',
        email: 'admin@codementor.live',
        passwordHash: adminPasswordHash,
        role: 'admin',
        isApproved: true,
        credits: 9999,
        bio: 'CodeMentor Live Platform Administrator.',
        skills: ['Fullstack', 'DevOps', 'Architecture'],
      },
      { upsert: true, new: true, setDefaultsOnInsert: false }
    );
    console.log('✓ Admin user verified:', adminUser.email);

    // 2. Seed Students
    const student1 = await User.findOneAndUpdate(
      { email: 'student.alice@example.com' },
      {
        name: 'Alice Johnson',
        email: 'student.alice@example.com',
        passwordHash: defaultPasswordHash,
        role: 'student',
        isApproved: true,
        credits: 100,
        bio: 'CS sophomore building fullstack React applications.',
      },
      { upsert: true, new: true }
    );

    const student2 = await User.findOneAndUpdate(
      { email: 'student.bob@example.com' },
      {
        name: 'Bob Smith',
        email: 'student.bob@example.com',
        passwordHash: defaultPasswordHash,
        role: 'student',
        isApproved: true,
        credits: 100,
        bio: 'Self-taught developer learning Node.js and REST APIs.',
      },
      { upsert: true, new: true }
    );
    console.log('✓ Student users verified:', student1.email, student2.email);

    // 3. Seed Mentors (Approved & Veteran)
    const mentorVeteran = await User.findOneAndUpdate(
      { email: 'sarah.mentor@example.com' },
      {
        name: 'Sarah Connor',
        email: 'sarah.mentor@example.com',
        passwordHash: defaultPasswordHash,
        role: 'mentor',
        isApproved: true,
        isAvailable: true,
        reputation: 160,
        ratingAvg: 4.9,
        ratingCount: 12,
        credits: 250,
        badges: ['First Review', 'Top Rated', '10 Reviews', 'Mentor Pro'],
        skills: ['React', 'TypeScript', 'Node.js', 'Next.js'],
        bio: 'Staff Frontend Engineer with 7 years of production React experience.',
      },
      { upsert: true, new: true }
    );

    const mentorStandard = await User.findOneAndUpdate(
      { email: 'david.mentor@example.com' },
      {
        name: 'David Miller',
        email: 'david.mentor@example.com',
        passwordHash: defaultPasswordHash,
        role: 'mentor',
        isApproved: true,
        isAvailable: true,
        reputation: 40,
        ratingAvg: 4.6,
        ratingCount: 3,
        credits: 75,
        badges: ['First Review'],
        skills: ['Python', 'FastAPI', 'Docker', 'PostgreSQL'],
        bio: 'Backend engineer passionate about high-throughput APIs and database design.',
      },
      { upsert: true, new: true }
    );

    // 4. Seed Pending Mentor (Awaiting Admin Approval)
    const mentorPending = await User.findOneAndUpdate(
      { email: 'alex.pending@example.com' },
      {
        name: 'Alex Vance',
        email: 'alex.pending@example.com',
        passwordHash: defaultPasswordHash,
        role: 'mentor',
        isApproved: false, // Pending approval!
        isAvailable: true,
        reputation: 0,
        ratingAvg: 0,
        ratingCount: 0,
        credits: 50,
        badges: [],
        skills: ['Go', 'Kubernetes', 'Microservices'],
        bio: 'Cloud infrastructure engineer applying to help students with distributed systems.',
      },
      { upsert: true, new: true }
    );
    console.log('✓ Mentor users verified (including pending approval):', mentorPending.email);

    // 5. Seed Sample Review Requests
    const sampleCode = `import React, { useState, useEffect } from 'react';

export default function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        // Bug: state mutation
        users.push(...data);
        setUsers(users);
      });
  }, []);

  return (
    <div>
      {users.map(u => (
        <div>{u.name}</div>
      ))}
    </div>
  );
}`;

    const aiSummary = await generateCodeReview({
      title: 'React state mutation and missing keys in list',
      description: 'Items pushed to array do not trigger re-render on initial fetch.',
      code: sampleCode,
      tech: ['React', 'JavaScript'],
    });

    const sampleRequest = await Request.findOneAndUpdate(
      { title: 'React state not updating after fetch' },
      {
        student: student1._id,
        title: 'React state not updating after fetch',
        description:
          'I am fetching user data from an API, but the list on screen never updates after the network response finishes. Why does setUsers not trigger a re-render?',
        code: sampleCode,
        tech: ['React', 'JavaScript'],
        difficulty: 'beginner',
        price: 20,
        status: 'open',
        aiSummary,
      },
      { upsert: true, new: true }
    );
    console.log('✓ Sample review request seeded with AI Pre-Review:', sampleRequest.title);

    // ==========================================
    // 5. Seed Token Economy Packages & Challenges
    // ==========================================
    console.log('\nSeeding Token Economy System...');

    // A. Seed Token Packages
    const packages = [
      {
        name: 'Starter Pack',
        tokens: 50,
        price: 99,
        currency: 'INR',
        badge: 'Beginner Choice',
        description: 'Ideal for getting started with your first code review bounties.',
        sortOrder: 1,
        isActive: true,
      },
      {
        name: 'Standard Pack',
        tokens: 150,
        price: 249,
        currency: 'INR',
        badge: 'Most Popular',
        description: 'Great value for active learners submitting multiple review requests.',
        sortOrder: 2,
        isActive: true,
      },
      {
        name: 'Premium Pro Pack',
        tokens: 500,
        price: 699,
        currency: 'INR',
        badge: 'Best Value',
        description: 'Maximum tokens for advanced mentor sessions and live code pairing.',
        sortOrder: 3,
        isActive: true,
      },
    ];

    for (const pkg of packages) {
      await TokenPackage.findOneAndUpdate({ name: pkg.name }, pkg, { upsert: true });
    }
    console.log('✓ Token Packages seeded (3 packages)');

    // B. Seed Coding Challenges
    const challenges = [
      {
        title: 'Two Sum Problem',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input would have exactly one solution, and you may not use the same element twice.',
        difficulty: 'beginner',
        reward: 5,
        category: 'Algorithms',
        language: 'javascript',
        functionName: 'solution',
        starterCode: `function solution(nums, target) {
  // Your code here
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
        examples: [
          { input: '[2, 7, 11, 15], 9', output: '[0, 1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
          { input: '[3, 2, 4], 6', output: '[1, 2]', explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].' },
        ],
        constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists.'],
        testCases: [
          { input: '[[2, 7, 11, 15], 9]', expectedOutput: '[0, 1]', isHidden: false },
          { input: '[[3, 2, 4], 6]', expectedOutput: '[1, 2]', isHidden: false },
          { input: '[[3, 3], 6]', expectedOutput: '[0, 1]', isHidden: true },
        ],
        isActive: true,
      },
      {
        title: 'Valid Parentheses',
        description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. Open brackets must be closed by the same type of brackets in the correct order.',
        difficulty: 'intermediate',
        reward: 10,
        category: 'Data Structures',
        language: 'javascript',
        functionName: 'solution',
        starterCode: `function solution(s) {
  // Return true if valid, false otherwise
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else if (map[char]) {
      if (stack.pop() !== map[char]) return false;
    }
  }
  return stack.length === 0;
}`,
        examples: [
          { input: '"()"', output: 'true', explanation: 'Valid simple brackets.' },
          { input: '"()[]{}"', output: 'true', explanation: 'All pairs properly closed.' },
          { input: '"(]"', output: 'false', explanation: 'Mismatched closing bracket.' },
        ],
        constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only "()[]{}"'],
        testCases: [
          { input: '["()"]', expectedOutput: 'true', isHidden: false },
          { input: '["()[]{}"]', expectedOutput: 'true', isHidden: false },
          { input: '["(]"]', expectedOutput: 'false', isHidden: false },
          { input: '["([)]"]', expectedOutput: 'false', isHidden: true },
          { input: '["{[]}"]', expectedOutput: 'true', isHidden: true },
        ],
        isActive: true,
      },
      {
        title: 'Reverse Words in String',
        description: 'Given an input string s, reverse the order of the words. A word is defined as a sequence of non-space characters. The words in s will be separated by at least one space.',
        difficulty: 'beginner',
        reward: 5,
        category: 'Strings',
        language: 'javascript',
        functionName: 'solution',
        starterCode: `function solution(s) {
  // Your code here
  return s.trim().split(/\\s+/).reverse().join(' ');
}`,
        examples: [
          { input: '"the sky is blue"', output: '"blue is sky the"', explanation: 'Words are reversed.' },
          { input: '"  hello world  "', output: '"world hello"', explanation: 'Extra spaces removed.' },
        ],
        constraints: ['1 <= s.length <= 10^4'],
        testCases: [
          { input: '["the sky is blue"]', expectedOutput: 'blue is sky the', isHidden: false },
          { input: '["  hello world  "]', expectedOutput: 'world hello', isHidden: false },
          { input: '["a good   example"]', expectedOutput: 'example good a', isHidden: true },
        ],
        isActive: true,
      },
      {
        title: 'LRU Cache Design',
        description: 'Simulate a Least Recently Used (LRU) cache with a given capacity. Given a sequence of get/put operations represented as array of actions and arguments, return array of results (return value or null).',
        difficulty: 'advanced',
        reward: 20,
        category: 'System Design',
        language: 'javascript',
        functionName: 'solution',
        starterCode: `function solution(operations, capacity) {
  // operations is array of: ['put', key, val] or ['get', key]
  // Return array of results for each operation ('null' for put, value or -1 for get)
  const cache = new Map();
  const results = [];
  
  for (const op of operations) {
    if (op[0] === 'put') {
      const [, key, val] = op;
      if (cache.has(key)) {
        cache.delete(key);
      } else if (cache.size >= capacity) {
        // Evict oldest (first key in Map)
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
      }
      cache.set(key, val);
      results.push(null);
    } else if (op[0] === 'get') {
      const [, key] = op;
      if (!cache.has(key)) {
        results.push(-1);
      } else {
        const val = cache.get(key);
        cache.delete(key);
        cache.set(key, val);
        results.push(val);
      }
    }
  }
  return results;
}`,
        examples: [
          {
            input: '[[["put", 1, 1], ["put", 2, 2], ["get", 1], ["put", 3, 3], ["get", 2]], 2]',
            output: '[null, null, 1, null, -1]',
            explanation: 'Key 2 was evicted because key 1 was accessed before put 3.',
          },
        ],
        constraints: ['1 <= capacity <= 3000', '0 <= key <= 10^4', '0 <= value <= 10^5'],
        testCases: [
          {
            input: '[[["put", 1, 1], ["put", 2, 2], ["get", 1], ["put", 3, 3], ["get", 2]], 2]',
            expectedOutput: '[null,null,1,null,-1]',
            isHidden: false,
          },
          {
            input: '[[["get", 2], ["put", 2, 6], ["get", 1], ["put", 1, 5], ["put", 1, 2], ["get", 1], ["get", 2]], 2]',
            expectedOutput: '[-1,null,-1,null,null,2,6]',
            isHidden: true,
          },
        ],
        isActive: true,
      },
    ];

    for (const ch of challenges) {
      await Challenge.findOneAndUpdate({ title: ch.title }, ch, { upsert: true });
    }
    console.log(`✓ Coding Challenges seeded (${challenges.length} challenges)`);

    // C. Seed Assignments
    const assignments = [
      {
        title: 'Fullstack Task Manager with JWT Auth',
        instructions: 'Build a production-grade RESTful Task Management API with Express and MongoDB, plus a React dashboard with protected routes, task filtering, and status updates.',
        reward: 15,
        difficulty: 'intermediate',
        category: 'Full Stack',
        deliverables: 'GitHub repository URL with clear README and setup instructions, along with optional deployment link.',
        isActive: true,
      },
      {
        title: 'Real-Time WebSocket Notification Feed',
        instructions: 'Implement bidirectional WebSocket notifications using Socket.io or native WebSockets. Include notification dismissal, read status toggling, and sound alerts.',
        reward: 20,
        difficulty: 'advanced',
        category: 'WebSockets & Networking',
        deliverables: 'GitHub repository URL with live test instructions and demo link.',
        isActive: true,
      },
      {
        title: 'Responsive Portfolio with Clean Light & Dark Themes',
        instructions: 'Create an accessible, mobile-responsive developer portfolio showcasing project cards, skills grid, contact form, and smooth theme toggling.',
        reward: 15,
        difficulty: 'beginner',
        category: 'Frontend & UI',
        deliverables: 'GitHub repository URL and live Netlify/Vercel link.',
        isActive: true,
      },
    ];

    for (const asg of assignments) {
      await Assignment.findOneAndUpdate({ title: asg.title }, asg, { upsert: true });
    }
    console.log(`✓ Assignments seeded (${assignments.length} assignments)`);

    console.log('\n=========================================');
    console.log('🌱 Database Seeding Completed Successfully!');
    console.log('Admin login: admin@codementor.live / AdminPass123!');
    console.log('Mentor login: sarah.mentor@example.com / Password123!');
    console.log('Pending mentor: alex.pending@example.com / Password123!');
    console.log('Student login: student.alice@example.com / Password123!');
    console.log('=========================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
};

// Execute if run directly
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}


import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Request from '../models/Request.js';
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


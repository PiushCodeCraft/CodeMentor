
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const { Schema } = mongoose;

// ==========================================
// 1. CHALLENGE MODEL
// ==========================================

const challengeSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner",
  },
  reward: { type: Number, required: true, default: 5, min: 1 },
  category: { type: String, default: "Algorithms", trim: true },
  language: { type: String, default: "javascript" },
  functionName: { type: String, required: true, default: "solution" },
  starterCode: { type: String, required: true },
  examples: [{
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: "" },
  }],
  constraints: [{ type: String }],
  testCases: [{
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

challengeSchema.index({ difficulty: 1, isActive: 1 });
challengeSchema.index({ category: 1 });

// ==========================================
// 2. ASSIGNMENT MODEL
// ==========================================

const assignmentSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  instructions: { type: String, required: true },
  reward: { type: Number, required: true, default: 15, min: 1 },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "intermediate",
  },
  category: { type: String, default: "Full Stack", trim: true },
  deliverables: {
    type: String,
    default: "GitHub repository URL and optional live deployment",
  },
  deadline: { type: Date, default: null },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

assignmentSchema.index({ difficulty: 1, isActive: 1 });
assignmentSchema.index({ category: 1 });

// ==========================================
// 3. LEARNING TASK MODEL
// ==========================================

const learningTaskSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ["tutorial", "module", "weekly_goal", "onboarding"],
    default: "onboarding",
  },
  reward: { type: Number, required: true, default: 10, min: 1 },
  externalUrl: { type: String, default: "" },
  actionLabel: { type: String, default: "Complete Task" },
  estimatedMinutes: { type: Number, default: 15 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

learningTaskSchema.index({ type: 1, isActive: 1 });

// ==========================================
// 4. REGISTER MODELS
// ==========================================

const Challenge =
  mongoose.models.Challenge ||
  mongoose.model("Challenge", challengeSchema);

const Assignment =
  mongoose.models.Assignment ||
  mongoose.model("Assignment", assignmentSchema);

const LearningTask =
  mongoose.models.LearningTask ||
  mongoose.model("LearningTask", learningTaskSchema);

// ==========================================
// 5. CODING CHALLENGES
// ==========================================

const challenges = [
  {
    title: "Two Sum",
    description: "Given an array and a target, return the indices of two numbers whose sum equals the target.",
    difficulty: "beginner",
    reward: 5,
    category: "Arrays",
    language: "javascript",
    functionName: "solution",
    starterCode: `function solution(nums, target) {
  // Write your code here
}`,
    examples: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        explanation: "2 + 7 = 9",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10000",
      "Exactly one solution exists",
      "Do not use the same element twice",
    ],
    testCases: [
      { input: "[[2,7,11,15],9]", expectedOutput: "[0,1]", isHidden: false },
      { input: "[[3,2,4],6]", expectedOutput: "[1,2]", isHidden: false },
      { input: "[[3,3],6]", expectedOutput: "[0,1]", isHidden: true },
    ],
    isActive: true,
  },
  {
    title: "Reverse a String",
    description: "Return the given string in reverse order.",
    difficulty: "beginner",
    reward: 5,
    category: "Strings",
    language: "javascript",
    functionName: "solution",
    starterCode: `function solution(str) {
  // Write your code here
}`,
    examples: [
      { input: '"hello"', output: '"olleh"', explanation: "Reverse the characters." },
    ],
    constraints: ["Input is a string"],
    testCases: [
      { input: '["hello"]', expectedOutput: '"olleh"', isHidden: false },
      { input: '["CodeMentor"]', expectedOutput: '"rotneM edoC"', isHidden: true },
    ],
    isActive: true,
  },
  {
    title: "Find the Largest Number",
    description: "Return the largest number in a non-empty array.",
    difficulty: "beginner",
    reward: 5,
    category: "Arrays",
    language: "javascript",
    functionName: "solution",
    starterCode: `function solution(nums) {
  // Write your code here
}`,
    examples: [
      { input: "[4, 9, 2, 7]", output: "9", explanation: "9 is the largest." },
    ],
    constraints: ["Array contains at least one number"],
    testCases: [
      { input: "[[4,9,2,7]]", expectedOutput: "9", isHidden: false },
      { input: "[[-8,-2,-10]]", expectedOutput: "-2", isHidden: true },
    ],
    isActive: true,
  },
  {
    title: "Valid Palindrome",
    description: "Check whether a string is a palindrome after removing spaces and punctuation and ignoring case.",
    difficulty: "intermediate",
    reward: 10,
    category: "Strings",
    language: "javascript",
    functionName: "solution",
    starterCode: `function solution(str) {
  // Write your code here
}`,
    examples: [
      { input: '"racecar"', output: "true", explanation: "It reads the same both ways." },
    ],
    constraints: ["Ignore case", "Ignore punctuation and spaces"],
    testCases: [
      { input: '["A man, a plan, a canal: Panama"]', expectedOutput: "true", isHidden: false },
      { input: '["race a car"]', expectedOutput: "false", isHidden: false },
      { input: '[" "]', expectedOutput: "true", isHidden: true },
    ],
    isActive: true,
  },
  {
    title: "First Non-Repeating Character",
    description: "Return the index of the first character that occurs only once. Return -1 if none exists.",
    difficulty: "intermediate",
    reward: 10,
    category: "Hash Maps",
    language: "javascript",
    functionName: "solution",
    starterCode: `function solution(str) {
  // Write your code here
}`,
    examples: [
      { input: '"leetcode"', output: "0", explanation: "The first character is unique." },
    ],
    constraints: ["Input contains lowercase English letters"],
    testCases: [
      { input: '["leetcode"]', expectedOutput: "0", isHidden: false },
      { input: '["loveleetcode"]', expectedOutput: "2", isHidden: false },
      { input: '["aabb"]', expectedOutput: "-1", isHidden: true },
    ],
    isActive: true,
  },
  {
    title: "Merge Two Sorted Arrays",
    description: "Merge two sorted arrays into one sorted array.",
    difficulty: "intermediate",
    reward: 10,
    category: "Arrays",
    language: "javascript",
    functionName: "solution",
    starterCode: `function solution(first, second) {
  // Write your code here
}`,
    examples: [
      { input: "[1,3,5] and [2,4,6]", output: "[1,2,3,4,5,6]", explanation: "Merge in ascending order." },
    ],
    constraints: ["Both arrays are sorted"],
    testCases: [
      { input: "[[1,3,5],[2,4,6]]", expectedOutput: "[1,2,3,4,5,6]", isHidden: false },
      { input: "[[],[1,2]]", expectedOutput: "[1,2]", isHidden: true },
    ],
    isActive: true,
  },
  {
    title: "Maximum Subarray Sum",
    description: "Find the largest sum of a contiguous non-empty subarray.",
    difficulty: "advanced",
    reward: 20,
    category: "Dynamic Programming",
    language: "javascript",
    functionName: "solution",
    starterCode: `function solution(nums) {
  // Write your code here
}`,
    examples: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "[4,-1,2,1] has sum 6." },
    ],
    constraints: ["Array must be non-empty"],
    testCases: [
      { input: "[[-2,1,-3,4,-1,2,1,-5,4]]", expectedOutput: "6", isHidden: false },
      { input: "[[1]]", expectedOutput: "1", isHidden: false },
      { input: "[[-5,-2,-8]]", expectedOutput: "-2", isHidden: true },
    ],
    isActive: true,
  },
  {
    title: "Longest Substring Without Repeating Characters",
    description: "Return the length of the longest substring without repeated characters.",
    difficulty: "advanced",
    reward: 20,
    category: "Sliding Window",
    language: "javascript",
    functionName: "solution",
    starterCode: `function solution(str) {
  // Write your code here
}`,
    examples: [
      { input: '"abcabcbb"', output: "3", explanation: '"abc" is the longest substring.' },
    ],
    constraints: ["0 <= str.length <= 50000"],
    testCases: [
      { input: '["abcabcbb"]', expectedOutput: "3", isHidden: false },
      { input: '["bbbbb"]', expectedOutput: "1", isHidden: false },
      { input: '["pwwkew"]', expectedOutput: "3", isHidden: true },
    ],
    isActive: true,
  },
];

// ==========================================
// 6. ASSIGNMENTS
// ==========================================

const assignments = [
  {
    title: "Build a Responsive Portfolio Website",
    instructions: "Create a portfolio with introduction, skills, projects, education, and contact sections. Make it responsive across mobile, tablet, and desktop.",
    reward: 15,
    difficulty: "beginner",
    category: "Frontend Development",
    deliverables: "GitHub repository URL and screenshots",
    isActive: true,
  },
  {
    title: "Develop a REST API for a Task Manager",
    instructions: "Build APIs to create, list, update, complete, and delete tasks. Include validation and error handling.",
    reward: 20,
    difficulty: "intermediate",
    category: "Backend Development",
    deliverables: "GitHub repository URL, README, and Postman collection",
    isActive: true,
  },
  {
    title: "Create a React Dashboard",
    instructions: "Build a dashboard with reusable components, sidebar, summary cards, table, search, and filters.",
    reward: 20,
    difficulty: "intermediate",
    category: "React",
    deliverables: "GitHub repository and screenshots",
    isActive: true,
  },
  {
    title: "Build a MERN Authentication Module",
    instructions: "Create registration and login with MongoDB, Express, and React. Hash passwords and protect private routes.",
    reward: 25,
    difficulty: "advanced",
    category: "MERN Stack",
    deliverables: "GitHub repository and README",
    isActive: true,
  },
  {
    title: "Create a Real-Time Chat Application",
    instructions: "Build a chat application with rooms, timestamps, and live messaging using Socket.IO.",
    reward: 30,
    difficulty: "advanced",
    category: "Real-Time Applications",
    deliverables: "GitHub repository and demo",
    isActive: true,
  },
  {
    title: "Write Unit Tests for JavaScript Utilities",
    instructions: "Create five utility functions and write automated tests for normal cases and edge cases.",
    reward: 15,
    difficulty: "beginner",
    category: "Testing",
    deliverables: "GitHub repository and test results",
    isActive: true,
  },
];

// ==========================================
// 7. LEARNING TASKS
// ==========================================

const learningTasks = [
  {
    title: "Welcome to CodeMentor Live",
    description: "Explore your dashboard, update your profile, and locate challenges, assignments, and mentors.",
    type: "onboarding",
    reward: 5,
    actionLabel: "Explore Dashboard",
    estimatedMinutes: 5,
    isActive: true,
  },
  {
    title: "JavaScript Fundamentals",
    description: "Learn variables, data types, operators, loops, functions, and scope.",
    type: "tutorial",
    reward: 10,
    externalUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    actionLabel: "Start Learning",
    estimatedMinutes: 30,
    isActive: true,
  },
  {
    title: "Understand Array Methods",
    description: "Practice map, filter, reduce, find, some, and every.",
    type: "module",
    reward: 10,
    externalUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array",
    actionLabel: "Study Arrays",
    estimatedMinutes: 25,
    isActive: true,
  },
  {
    title: "Learn Git and GitHub",
    description: "Practice init, status, add, commit, branch, merge, pull, and push.",
    type: "tutorial",
    reward: 10,
    externalUrl: "https://docs.github.com/en/get-started",
    actionLabel: "Learn Git",
    estimatedMinutes: 35,
    isActive: true,
  },
  {
    title: "Weekly Coding Habit",
    description: "Solve one coding problem on at least four different days this week.",
    type: "weekly_goal",
    reward: 15,
    actionLabel: "Start Weekly Goal",
    estimatedMinutes: 60,
    isActive: true,
  },
  {
    title: "REST API Fundamentals",
    description: "Understand HTTP methods, status codes, JSON, and CRUD operations.",
    type: "module",
    reward: 10,
    externalUrl: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
    actionLabel: "Study REST APIs",
    estimatedMinutes: 30,
    isActive: true,
  },
  {
    title: "Introduction to MongoDB",
    description: "Learn documents, collections, CRUD operations, filters, and indexes.",
    type: "tutorial",
    reward: 10,
    externalUrl: "https://www.mongodb.com/docs/manual/introduction/",
    actionLabel: "Learn MongoDB",
    estimatedMinutes: 30,
    isActive: true,
  },
  {
    title: "Plan Your Learning Week",
    description: "Set one technical learning goal, one project goal, and one practice goal.",
    type: "weekly_goal",
    reward: 15,
    actionLabel: "Set Weekly Goals",
    estimatedMinutes: 15,
    isActive: true,
  },
];

// ==========================================
// 8. INSERT OR UPDATE WITHOUT DUPLICATES
// ==========================================

async function seedCollection(Model, records) {
  let inserted = 0;
  let updated = 0;

  for (const record of records) {
    const result = await Model.updateOne(
      { title: record.title },
      { $set: record },
      { upsert: true, runValidators: true }
    );

    if (result.upsertedCount) inserted++;
    else if (result.modifiedCount) updated++;
  }

  return { inserted, updated, total: records.length };
}

// ==========================================
// 9. MAIN EXECUTION
// ==========================================

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from your .env file");
  }

  await mongoose.connect(process.env.MONGO_URI);

  console.log("MongoDB connected:", mongoose.connection.name);

  const challengeResult = await seedCollection(Challenge, challenges);
  const assignmentResult = await seedCollection(Assignment, assignments);
  const learningResult = await seedCollection(LearningTask, learningTasks);

  console.log("\n========== SEED RESULTS ==========");

  console.table([
    { collection: "challenges", ...challengeResult },
    { collection: "assignments", ...assignmentResult },
    { collection: "learningtasks", ...learningResult },
  ]);

  console.log("\nAll content seeded successfully!");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

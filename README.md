# CodeMentor Live 🚀

> **A Real-Time Mentorship and Code-Review Marketplace for Students**  
> Event: **MERNova** | Stack: **MongoDB, Express.js, React, Node.js** | Mode: **Solo Project**

---

## 📌 Project Overview

CodeMentor Live connects students who are stuck on programming challenges with experienced developers (mentors). The platform features:
- **Live Shared Monaco Editor**: Real-time collaborative code editor with line decorations.
- **Inline Code Comments**: Line-specific comments with resolve/unresolve workflows.
- **Real-Time Collaboration**: WebSockets (Socket.io) for live chat, presence, and session state.
- **AI Pre-Review**: Automated code analysis (bugs, risks, improvements) powered by LLMs.
- **Reputation & Badges**: Rating system and leaderboard for mentors.

---

## 📁 Repository Structure

```text
codementor-live/
|-- server/
|   |-- src/
|   |   |-- config/        (db.js, env.js)
|   |   |-- models/        (User.js, Request.js, Session.js, Notification.js, Message.js, Comment.js, Review.js, Transaction.js)
|   |   |-- routes/        (auth.js, users.js, requests.js, sessions.js, notifications.js, comments.js, reviews.js, leaderboard.js, health.js)
|   |   |-- controllers/   (authController.js, userController.js, requestController.js, sessionController.js, notificationController.js, commentController.js, reviewController.js, leaderboardController.js)
|   |   |-- services/      (ratingService.js, aiService.js)
|   |   |-- middleware/    (auth.js, role.js, validate.js)
|   |   |-- sockets/       (index.js, sessionHandlers.js)
|   |   |-- utils/         (jwt.js)
|   |   `-- app.js, server.js
|   |-- tests/             (auth.test.js, requests.test.js, acceptFlow.test.js, liveSession.test.js, comments.test.js, reviews.test.js, aiService.test.js, health.test.js)
|   |-- .env.example
|   `-- package.json
|-- client/
|   |-- src/
|   |   |-- api/           (axios.js, requests.js, sessions.js, comments.js, reviews.js)
|   |   |-- components/    (Navbar.jsx, ProtectedRoute.jsx, RequestCard.jsx, NotificationBell.jsx, CodeEditor.jsx, ChatBox.jsx, CommentPanel.jsx, ReviewModal.jsx, AiPreReviewCard.jsx)
|   |   |-- pages/         (Login.jsx, Register.jsx, Dashboard.jsx, Profile.jsx, Requests.jsx, NewRequest.jsx, RequestDetail.jsx, Mentors.jsx, Session.jsx, Leaderboard.jsx)
|   |   |-- store/         (authStore.js)
|   |   |-- hooks/         (useAuth.js, useSocket.js)
|   |   |-- App.jsx
|   |   |-- index.css
|   |   `-- main.jsx
|   |-- .env.example
|   |-- tailwind.config.js
|   |-- postcss.config.js
|   |-- vite.config.js
|   `-- package.json
|-- .gitignore
|-- .env.example
|-- PROJECT.md
`-- README.md
```

---

## 🛠️ Phases Implemented

### Phase 1: Setup & Health Check
- Express server configuration with Helmet, CORS, Cookie-Parser, Dotenv, and Zod.
- MongoDB Atlas connection setup with Mongoose.
- Health check route at `GET /api/health`.
- Vite + React + Tailwind CSS client boilerplate.

### Phase 2: Authentication & Role-Based Authorization
- **User Schema**: Name, email, passwordHash, role (`student`, `mentor`, `admin`), skills, bio, avatar, `isApproved`, `isAvailable`, `ratingAvg`, `ratingCount`, `reputation`, `credits` (default 100), `badges`.
- **Security**: Passwords hashed with `bcryptjs`, dual JWT flow (15m access / 7d refresh) in `httpOnly` cookies with transparent silent refresh on client.
- **Role Control**: `requireRole` middleware and client `ProtectedRoute`.

### Phase 3: Profiles & Review Requests
- **Request Model**: `student` (ref), `title`, `description`, `code`, `repoUrl`, `tech[]`, `difficulty`, `price`, `status`, `aiSummary`, `mentor` (ref).
- **Compound & Text Indexes**: Indexed on `(status, tech, createdAt)`, text search on `title` and `description`.
- **Credit Wallet Safeguards**: Posting with credit bounty validates and deducts credits from student wallet; cancellation automatically refunds unspent credits.

### Phase 4: Accept Flow & Session Initialization
- **Atomic Acceptance**: `POST /api/requests/:id/accept` uses atomic `findOneAndUpdate` with condition `status = 'open'` to prevent race conditions or double accepts by multiple mentors.
- **Session Model**: 1-to-1 link between Request, Student, and Mentor storing `codeSnapshot`, detected `language`, and `startedAt`.
- **Notification Model & Flow**: Automatically alerts students when their request is accepted with a direct session link.

### Phase 5: Live Session Core (Real-Time WebSockets)
- **Socket.io Authentication**: `io.use` middleware validates JWT tokens before admitting sockets to collaboration rooms.
- **Real-Time Rooms & Presence**: `session:join` admits authorized participants and broadcasts `presence:update` (Student 🟢, Mentor 🟢).
- **Live Monaco Code Editor**: Powered by `@monaco-editor/react` with two-way `code:change` synchronization and debounced snapshot persistence.
- **Real-Time Session Chat**: `chat:send` persists chat messages to the `Message` collection and broadcasts `chat:message` in real-time.

### Phase 6: Line-Level Inline Comments
- **Comment Model**: `session` (ref), `author` (ref), `line` (number >= 1), `text`, `status` (`open`, `resolved`).
- **REST Endpoints**:
  - `GET /api/sessions/:id/comments`: Fetch all comments for a session ordered by line.
  - `POST /api/sessions/:id/comments`: Add inline comment on a specific line; triggers notification for other participant.
  - `PATCH /api/comments/:id/resolve`: Resolve or reopen an inline comment (Student or Reviewer).
- **Socket.io Real-Time Synchronization**:
  - `comment:add` & `comment:added`: Live broadcast of inline code feedback.
  - `comment:resolve` & `comment:resolved`: Instant update of resolution state across active session participants.
- **Monaco Line Decorations**:
  - Visual line highlights and hover previews on commented code lines.
  - Distinct visual styling for open vs. resolved comments.
  - Clicking on a comment jumps directly to the corresponding line in the editor.
- **CommentPanel Component**: Interactive list grouped by line number, filterable by Open/Resolved, with line number feedback inputs and resolution toggles.

### Phase 7: Ratings, Reputation & Leaderboard
- **Review Model**: `session` (ref, unique), `student` (ref), `mentor` (ref, indexed), `rating` (1-5 integer), `comment` (max 1000 chars).
- **Transaction Model**: `from` (ref), `to` (ref), `amount`, `request` (ref), `type` (`bounty_payout`, `escrow_lock`, `refund`).
- **Rating Aggregation via MongoDB Pipeline**: `recomputeMentorRating` groups reviews by mentor ID and recalculates `ratingAvg` and `ratingCount` with precision rounding.
- **Reputation & Badges Engine**:
  - `evaluateMentorRewards`: Awards base completion reputation (+10) + quality multiplier (`rating * 2`).
  - Automatically transfers bounty credits from request to the mentor's wallet upon completion.
  - Dynamically unlocks badges: `First Review` (>= 1 review), `Top Rated` (>= 4.5 avg with 3+ reviews), `10 Reviews` (>= 10 reviews), `Mentor Pro` (>= 50 rep), `Master Reviewer` (>= 25 reviews).
- **Mentor Leaderboard (`/leaderboard`)**:
  - Ranked podium for Top 3 Grand Champions (🥇 1st Gold, 🥈 2nd Silver, 🥉 3rd Bronze).
  - Search & skill filter with live standings.
  - Comprehensive badges and reputation stats showcase.
- **ReviewModal Component & Flow**:
  - Interactive 1-5 star selector with real-time hover feedback and qualitative descriptors.
  - Post-session rating prompt in `Session.jsx` with direct review display on completed sessions.
  - Achievements section integrated into `Profile.jsx`.

### Phase 8: AI Pre-Review Assistant (Wow Feature)
- **AI Service (`aiService.js`)**:
  - Automated code analysis generating structured reviews covering:
    - 🐛 **Potential Bugs & Issues**: Loose equality, missing keys in JSX, unhandled async promise rejections, direct state mutations.
    - ⚠️ **Risks & Edge Cases**: Network timeouts, missing storage error handling, hardcoded secrets/API keys, boundary assertions.
    - 💡 **Recommended Improvements**: Removing debug logs, hook dependency audits, modern ES6+ replacements, unit testing guidelines.
  - **Graceful Degradation Architecture**: Calls Google Gemini API (`GEMINI_API_KEY`) with automatic timeout and fallback to intelligent local heuristic analysis (as required by Section 16 of `PROJECT.md`). Code review requests never fail or get blocked due to API rate limits or network issues.
- **Auto-Scan on Request Submission**: Automatically generates and saves `aiSummary` upon request creation (`POST /api/requests`).
- **On-Demand AI Trigger (`POST /api/requests/:id/ai-review`)**: Allows mentors and students to re-run or generate the AI analysis on demand.
- **Frontend AI Assistant Component (`AiPreReviewCard.jsx`)**:
  - Highlights bugs, risks, and recommendations with distinct visual badges.
  - One-click copy markdown to clipboard.
  - Live re-analysis action with animated status indicators.
- **In-Session Mentor Reference**: Dedicated `🤖 AI Insights` tab integrated into the live session split workspace (`Session.jsx`) so mentors can consult AI pre-review findings alongside the shared Monaco code editor.

---

## ⚡ Socket.io Events Reference

| Event | Direction | Description |
| :--- | :--- | :--- |
| `session:join` | Client &rarr; Server | Join session room after participant validation |
| `presence:update` | Server &rarr; Client | Real-time list of online participants in the room |
| `code:change` | Both | Synchronize editor code changes between student and mentor |
| `chat:send` | Client &rarr; Server | Submit chat message to the session room |
| `chat:message` | Server &rarr; Client | Broadcast chat message with sender info and timestamp |
| `comment:add` | Client &rarr; Server | Submit line-level inline feedback |
| `comment:added` | Server &rarr; Client | Broadcast new inline comment with author info |
| `comment:resolve` | Client &rarr; Server | Resolve or reopen an inline comment |
| `comment:resolved` | Server &rarr; Client | Broadcast comment resolution change to room |
| `session:end` | Both | Conclude review session and freeze editor to read-only |

---

## 📡 REST API Endpoints

### Requests & AI Pre-Review API (Phase 3 & Phase 8)
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/requests` | Student / Admin | Create review request (auto-triggers AI pre-review) |
| `GET` | `/api/requests` | Auth | List & filter review requests |
| `GET` | `/api/requests/:id` | Auth | Fetch full request details, code, and AI summary |
| `POST` | `/api/requests/:id/ai-review` | Auth | Trigger / re-generate AI code pre-review |
| `PATCH` | `/api/requests/:id/cancel` | Student Owner | Cancel review request and refund escrow credits |

### Reviews & Leaderboard API (Phase 7)
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews` | Student / Admin | Submit post-session rating (1-5★) & feedback |
| `GET` | `/api/reviews/session/:sessionId` | Auth | Get submitted review for a specific session |
| `GET` | `/api/reviews/mentor/:mentorId` | Auth | Get all reviews received by a mentor |
| `GET` | `/api/leaderboard` | Auth | Retrieve ranked mentors by reputation & rating |

### Comments API (Phase 6)
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/sessions/:id/comments` | Participant | Retrieve all inline comments for a session |
| `POST` | `/api/sessions/:id/comments` | Participant | Add a line-specific inline comment |
| `PATCH` | `/api/comments/:id/resolve` | Participant | Resolve or reopen an inline comment |

### Sessions API
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/sessions/:id/messages` | Participant | Retrieve chat message history for the session |
| `POST` | `/api/sessions/:id/end` | Participant | Conclude review session, archive editor, and notify participants |
| `GET` | `/api/sessions/:id` | Participant | Get session details, code snapshot, and participants |
| `GET` | `/api/sessions` | Auth | List current user's active/past sessions |
| `POST` | `/api/requests/:id/accept` | Mentor | Atomically accept an open request and initialize Session |

---

## 🚀 How to Run the Project

### 1. Server

```bash
cd server
npm run dev
```

Run test suite:
```bash
npm test
```

### 2. Client

```bash
cd client
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.
Open two browser windows to test:
1. Student submitting a review request.
2. Mentor accepting the request.
3. Both joining the live session with shared Monaco code editor, live chat, and line-level inline comments with instant resolve/unresolve!





  

🌱 Database Seeding Completed Successfully!
Admin login: admin@codementor.live / AdminPass123!
Mentor login: sarah.mentor@example.com / Password123!
Pending mentor: alex.pending@example.com / Password123!
Student login: student.alice@example.com / Password123!

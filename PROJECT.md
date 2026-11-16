CodeMentor Live
A Real-Time Mentorship and Code-Review Marketplace for Students

Project Report and Design Document
Event: MERNova
Stack: MongoDB, Express.js, React, Node.js (MERN)
Team: Solo project
Submitted by: [Your Name]
Date: November 2026

 Table of Contents



 1. Project Overview
CodeMentor Live is a two-sided web platform where students who are stuck on code can get it reviewed live by experienced developers (mentors). A student posts a review request with their code, a mentor accepts it, and both join a live session with a shared code editor, real-time chat, and line-level inline comments. After the session, the student rates the mentor and the mentor earns reputation.
The platform is built entirely on the MERN stack and adds real-time collaboration with Socket.io and an optional AI pre-review that gives mentors a head start.
1.1 Quick Facts
Item	Details
Project name	CodeMentor Live
Type	Two-sided marketplace + real-time collaboration web app
Stack	MongoDB, Express.js, React, Node.js
Real-time layer	Socket.io (WebSockets)
Users	Student, Mentor, Admin
Standout feature	Live shared Monaco editor with inline code comments
Bonus feature	AI pre-review of submitted code
Development mode	Solo, time-boxed MVP

2. Problem Statement
Beginner and intermediate developers regularly get stuck on bugs, design decisions, and code quality, but they face these problems:
•	No access to reviewers. Most students do not know any senior developer who can look at their code.
•	Existing options are poor. Forums give slow, generic answers; paid mentoring platforms are expensive and often tied to long contracts.
•	Feedback lacks context. Replies on forums are not tied to specific lines of code, so learners struggle to apply them.
•	Mentors have no easy way to give back. Experienced developers who want to help have no lightweight, structured place to do so and build a reputation.
3. Proposed Solution
CodeMentor Live connects both sides in one flow:
1.	A student submits a review request (code snippet or GitHub link, tech tag, difficulty, and a price in credits or free).
2.	Mentors browse and filter open requests, then accept one that matches their skills.
3.	Both users enter a live session room with a shared Monaco editor, real-time chat, and presence indicators.
4.	The mentor leaves inline comments on specific lines, which the student can resolve or reopen.
5.	The session ends, the student rates the mentor, and credits and reputation points are updated.
6.	The full review (code, comments, chat) is saved so the student can revisit it later.
3.1 Objectives
•	Build a secure, role-based, production-style MERN application.
•	Deliver reliable real-time collaboration between two users in a session.
•	Provide a fair reputation and rating system to build trust.
•	Keep the architecture clean enough to scale and extend.
3.2 Unique Selling Points
•	Line-level inline comments instead of generic replies.
•	Live session instead of asynchronous back-and-forth.
•	AI pre-review that saves mentor time and gives students instant feedback.
•	Reputation, badges, and leaderboard that reward helpful mentors.
4. User Roles and Permissions
Role	What they can do
Student	Register, create and manage review requests, join sessions they own, chat, resolve comments, rate mentors, view history and wallet.
Mentor	Register with skills, browse and accept requests, join sessions, add inline comments, view earnings, reputation, and badges.
Admin	View all users, approve or suspend mentors, review reports, see platform statistics.

5. Features
5.1 MVP Features (must build)
•	Registration and login with JWT (access and refresh tokens) and role selection.
•	Mentor profile: skills, bio, experience, rating, availability toggle.
•	Create, list, filter, and search review requests (tech stack, difficulty, status).
•	Accept request flow with status transitions (open, accepted, in progress, completed, cancelled).
•	Live session room: shared Monaco editor, real-time chat, presence (who is online).
•	Line-level inline comments with resolve and unresolve.
•	Post-session rating and review; mentor rating average recalculated.
•	Notifications (in-app, real-time) for accepted requests, new comments, and session completion.
•	Basic admin panel: approve mentors, list users.
5.2 Wow Features (pick one or two if time permits)
•	AI pre-review: when a request is posted, the backend sends the code to an LLM API (Claude or Gemini) and stores a short summary of bugs, risks, and improvements, shown to the mentor.
•	Smart mentor matching: rank mentors by skill overlap, rating, and response time.
•	Credits wallet: simulated credits instead of real payments (avoids payment gateway risk in a solo build). Razorpay test mode can be added later.
•	Leaderboard and badges: top mentors this week; badges such as First Review and 10 Reviews.
5.3 Out of Scope (to keep the project finishable)
•	Video or voice calls, real money payments, mobile apps, multi-file project editing.
6. Technology Stack
Layer	Technology	Why it is used
Frontend	React (Vite), React Router	Fast SPA with component reuse and quick dev server.
Styling	Tailwind CSS	Rapid, consistent UI without writing much CSS.
State	Zustand (client), TanStack React Query (server)	Simple global state plus caching and refetching of API data.
Code editor	Monaco Editor (@monaco-editor/react)	The editor that powers VS Code; syntax highlighting and line decorations.
Backend	Node.js, Express.js	Lightweight REST API with a large ecosystem.
Real-time	Socket.io	Rooms, events, and automatic reconnection for live sessions.
Database	MongoDB with Mongoose	Flexible documents suit requests, comments, and sessions; strong indexing and aggregation.
Auth	JWT, bcrypt, httpOnly cookies	Stateless, secure authentication.
Validation	Zod	Schema-based validation of request bodies.
Security	Helmet, CORS, express-rate-limit, mongo-sanitize	Protects against common web attacks.
AI (optional)	Claude or Gemini API	Automated first-pass code review.
Testing	Jest, Supertest	API and logic tests.
DevOps	Git and GitHub, dotenv, Docker (optional)	Version control, config, and portability.
Deployment	Vercel (frontend), Render (backend), MongoDB Atlas (database)	Free-tier friendly hosting.

7. System Architecture
The system follows a classic three-tier architecture with an added real-time channel.
+-------------------------------+
|        React Frontend         |
|  Vite, Tailwind, Monaco,      |
|  Zustand, React Query         |
+---------------+---------------+
                |
     REST (HTTPS/JSON) + WebSocket (Socket.io)
                |
+---------------v---------------+
|     Express API + Socket.io   |
|  routes > controllers >       |
|  services > models            |
+-------+---------------+-------+
        |               |
+-------v-------+  +----v-----------+
| MongoDB Atlas |  | AI API (opt.)  |
|  (Mongoose)   |  | Claude/Gemini  |
+---------------+  +----------------+

7.1 Layers
•	Presentation layer (React): pages, components, hooks, API client, and socket client.
•	API layer (Express): routes map URLs to controllers; middleware handles auth, roles, validation, and errors.
•	Service layer: business logic such as accepting requests, computing ratings, and calling the AI API.
•	Data layer (Mongoose): schemas, indexes, and queries.
•	Real-time layer (Socket.io): authenticated socket connections, one room per session.
8. Data Flow
8.1 Authentication Flow
1.	User submits email and password to POST /api/auth/register or /login.
2.	Server validates input (Zod), hashes the password (bcrypt), and stores the user.
3.	Server issues a short-lived access token (15 min) and a refresh token (7 days) in httpOnly cookies.
4.	Protected routes pass through the auth middleware, which verifies the token and attaches req.user.
5.	When the access token expires, the client calls /api/auth/refresh to obtain a new one silently.
8.2 Review Request Flow
Student  -> POST /api/requests {title, code, tech, difficulty, price}
Server   -> validate -> save Request (status: open)
Server   -> (optional) call AI API -> save aiSummary on the request
Server   -> emit 'request:new' to online mentors with matching skills
Mentor   -> GET /api/requests?tech=react&status=open  (browse and filter)
Mentor   -> POST /api/requests/:id/accept
Server   -> atomic update (only if status is still 'open') -> create Session
Server   -> emit 'request:accepted' to the student -> notification saved

The accept step uses an atomic findOneAndUpdate with the condition status = open, so two mentors cannot accept the same request at the same time.
8.3 Live Session Flow (Socket.io)
1. Client connects to Socket.io with the access token (verified in io.use middleware)
2. Client emits  'session:join'  {sessionId}
3. Server checks the user is the student or mentor of that session, joins the room
4. Server emits  'presence:update' to the room (who is online)
5. Editing:   client emits 'code:change' {sessionId, content}
              server saves latest snapshot (debounced) and broadcasts to the other user
6. Commenting: mentor emits 'comment:add' {line, text}
              server saves Comment, broadcasts 'comment:added' to the room
7. Chat:      client emits 'chat:send' {text} -> saved and broadcast to the room
8. End:       either side emits 'session:end' -> status set to completed -> rating prompt

For the MVP, the editor sync uses last-write-wins with a debounced broadcast, which is enough for two users where typically one writes at a time. If time remains, Yjs can be added for conflict-free simultaneous editing.
8.4 Rating and Reputation Flow
1.	After completion, the student submits a rating (1 to 5) and an optional review.
2.	Server stores the Review, then recomputes the mentor's average rating with an aggregation.
3.	Credits move from the student's wallet to the mentor's wallet (if the request was paid).
4.	Reputation points are added and badges are checked and awarded.
8.5 Overall Data Flow Summary
[Student UI] --REST--> [Express] --> [MongoDB]  (create request)
                           |
                           +--> [AI API] --> aiSummary saved on request
                           |
[Mentor UI]  <--REST--  [Express] <-- [MongoDB]  (browse requests)
[Mentor UI]  --REST-->  [Express] --> create Session, notify student
[Student UI] <==Socket.io room==> [Server] <==Socket.io room==> [Mentor UI]
                  (code sync, comments, chat, presence)
[Student UI] --REST--> [Express] --> save Review, update rating, move credits

9. Database Design (MongoDB)
9.1 Collections
Collection	Key fields
users	name, email (unique), passwordHash, role (student/mentor/admin), skills[], bio, avatar, isApproved, ratingAvg, ratingCount, reputation, credits, badges[], createdAt
requests	student (ref), title, description, code, repoUrl, tech[], difficulty, price, status, aiSummary, mentor (ref), createdAt
sessions	request (ref), student (ref), mentor (ref), codeSnapshot, language, status, startedAt, endedAt
comments	session (ref), author (ref), line, text, status (open/resolved), createdAt
messages	session (ref), sender (ref), text, createdAt
reviews	session (ref), student (ref), mentor (ref), rating, comment, createdAt
notifications	user (ref), type, message, link, isRead, createdAt
transactions	from (ref), to (ref), amount, request (ref), type, createdAt

9.2 Relationships
User (student) 1 ---- * Request
Request        1 ---- 1 Session   (created when a mentor accepts)
User (mentor)  1 ---- * Session
Session        1 ---- * Comment
Session        1 ---- * Message
Session        1 ---- 1 Review
User           1 ---- * Notification

9.3 Indexes
•	users: unique index on email; index on role and skills.
•	requests: compound index on (status, tech, createdAt); text index on title and description.
•	comments and messages: index on (session, createdAt).
•	reviews: index on mentor for fast rating aggregation.
10. REST API Design
Method	Endpoint	Purpose	Access
POST	/api/auth/register	Create account	Public
POST	/api/auth/login	Login, set cookies	Public
POST	/api/auth/refresh	Issue new access token	Public
POST	/api/auth/logout	Clear cookies	Auth
GET	/api/users/me	Current user profile	Auth
PUT	/api/users/me	Update profile and skills	Auth
GET	/api/mentors	List and filter mentors	Auth
POST	/api/requests	Create review request	Student
GET	/api/requests	List with filters and pagination	Auth
GET	/api/requests/:id	Request details	Auth
POST	/api/requests/:id/accept	Accept a request	Mentor
PATCH	/api/requests/:id/cancel	Cancel a request	Student
GET	/api/sessions/:id	Session details, code, comments	Participant
POST	/api/sessions/:id/end	End session	Participant
GET	/api/sessions/:id/comments	List inline comments	Participant
PATCH	/api/comments/:id/resolve	Resolve or reopen comment	Student
POST	/api/reviews	Rate mentor after session	Student
GET	/api/notifications	List notifications	Auth
PATCH	/api/notifications/:id/read	Mark as read	Auth
GET	/api/leaderboard	Top mentors	Auth
GET	/api/admin/users	List all users	Admin
PATCH	/api/admin/mentors/:id/approve	Approve mentor	Admin

10.1 Socket.io Events
Event	Direction	Description
session:join	Client to server	Join a session room after authorization check.
presence:update	Server to client	Who is currently online in the room.
code:change	Both	Send and receive editor content updates.
comment:add / comment:added	Both	Add an inline comment and broadcast it.
chat:send / chat:message	Both	Send and receive chat messages.
session:end	Both	End the session and trigger the rating prompt.
notification:new	Server to client	Push a new notification to a user.

11. Folder Structure
codementor-live/
|-- server/
|   |-- src/
|   |   |-- config/        (db.js, env.js)
|   |   |-- models/        (User, Request, Session, Comment, Message, Review, Notification)
|   |   |-- routes/        (auth, users, requests, sessions, reviews, admin)
|   |   |-- controllers/
|   |   |-- services/      (requestService, ratingService, aiService)
|   |   |-- middleware/    (auth, role, validate, errorHandler, rateLimit)
|   |   |-- sockets/       (index.js, sessionHandlers.js)
|   |   |-- utils/
|   |   `-- app.js, server.js
|   |-- tests/
|   `-- package.json
|-- client/
|   |-- src/
|   |   |-- api/           (axios instance, query hooks)
|   |   |-- components/    (Navbar, RequestCard, ChatBox, CodeEditor, CommentPanel)
|   |   |-- pages/         (Login, Register, Dashboard, Requests, NewRequest, Session, Profile, Admin)
|   |   |-- store/         (authStore.js, uiStore.js)
|   |   |-- hooks/         (useSocket.js, useAuth.js)
|   |   `-- App.jsx, main.jsx
|   `-- package.json
`-- README.md

12. Security Measures
•	Passwords hashed with bcrypt; never stored or returned in plain text.
•	JWT in httpOnly, secure, sameSite cookies to reduce XSS and CSRF risk.
•	Role-based middleware on every protected route.
•	Zod validation on all request bodies; mongo-sanitize against NoSQL injection.
•	Helmet headers, strict CORS origin, and rate limiting on auth and AI endpoints.
•	Socket connections authenticated; users can only join sessions they belong to.
•	Submitted code is stored and displayed as text only and is never executed on the server.
•	Environment variables for all secrets (.env, never committed).
13. Implementation Plan (Solo, ASAP)
This plan assumes focused work and keeps the scope tight. Adjust days to your deadline; the order matters more than the dates.
Phase	Tasks	Time
1. Setup	Repos, Vite + Express boilerplate, MongoDB Atlas, env config, folder structure.	0.5 day
2. Auth and roles	Register, login, refresh, role middleware, protected routes in React.	1 day
3. Profiles and requests	Mentor profile, create/list/filter requests, request detail page.	1.5 days
4. Accept flow	Accept endpoint with atomic update, session creation, notifications.	0.5 day
5. Live session (core)	Socket.io auth, rooms, Monaco editor sync, chat, presence.	2 days
6. Inline comments	Line comments on Monaco, resolve/unresolve, real-time broadcast.	1 day
7. Ratings and reputation	Review form, rating aggregation, credits, leaderboard.	1 day
8. AI pre-review (wow)	aiService, store summary, show on request page.	0.5 day
9. Admin and polish	Mentor approval, loading/error states, responsive UI, seed data.	1 day
10. Test and deploy	Key API tests, deploy to Vercel and Render, README, demo video.	1 day

Total: about 10 days. If you have fewer days, drop phases 7 (credits and leaderboard) and 8 first, then simplify admin. Never drop phases 2 to 6; they are the heart of the project.
14. Testing Strategy
•	API tests (Jest + Supertest): auth, create request, accept request (including the double-accept case), review submission.
•	Manual real-time test: open two browser windows (student and mentor) and verify code sync, chat, comments, and presence.
•	Edge cases: token expiry, unauthorized session access, disconnect and reconnect during a session.
15. Deployment
Part	Platform	Notes
Frontend	Vercel	Set VITE_API_URL to the backend URL.
Backend	Render (web service)	Supports WebSockets; set env variables and CORS origin.
Database	MongoDB Atlas (free tier)	Whitelist the backend IP; use a dedicated DB user.

Note: free Render instances sleep after inactivity. Open the app once before a demo to wake it.
16. Challenges and Solutions
Challenge	Solution
Two mentors accepting the same request	Atomic findOneAndUpdate with status = open condition.
Editor sync conflicts	Last-write-wins with debounce for MVP; Yjs as a future upgrade.
Comments drifting when code changes	Anchor comments to line numbers at the time of review and show a snapshot reference.
Unauthorized socket access	JWT verification in io.use and membership check on join.
AI API cost or failure	Make it optional, rate-limit it, and fail gracefully without blocking requests.

17. Future Enhancements
•	Real payments with Razorpay and mentor payouts.
•	Conflict-free editing with Yjs and multi-file projects.
•	Voice or video calls with WebRTC.
•	Session replay of editor changes.
•	Smart mentor matching using skills, ratings, and response time.
•	Mobile app with React Native.
18. Conclusion
CodeMentor Live solves a real problem for learners by combining a marketplace, real-time collaboration, and AI assistance in a single MERN application. It demonstrates authentication and authorization, REST API design, WebSockets, database modeling, and deployment, while remaining achievable as a solo project through a clearly scoped MVP.
Appendix: Demo Script (2 minutes)
1.	Show the landing page and explain the problem in one sentence.
2.	Log in as a student in one browser window and post a review request with code.
3.	Show the AI pre-review summary appearing on the request.
4.	Log in as a mentor in a second window, find the request, and accept it.
5.	Enter the live session in both windows: edit code, chat, and add inline comments live.
6.	End the session, submit a rating, and show the mentor's updated reputation and leaderboard.

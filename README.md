# Kvizník – Czech classroom quiz app

A lightweight classroom-response experience built for Czech teachers and students. Create quick multiple-choice quizzes, distribute a 6-character room code, and watch responses from 30+ students roll in live.

## Features

- **Rapid authoring** – add unlimited questions and up to six options per question.
- **Instant sharing** – automatically generates a short session code for students.
- **Student experience** – learners enter the code, see the quiz, and submit/update answers from any device.
- **Live monitoring** – real-time aggregate counts per option plus an itemized table of student responses via WebSockets.
- **In-memory storage** – perfect for quick sessions and demos (data resets whenever the API restarts).

## Project structure

```
socrative-clone/
├── server/   # Express + Socket.IO API
└── client/   # Vite + React front-end (teacher + student panels)
```

## Prerequisites

- Node.js **20.19+** (or 22.12+) – newer Vite releases expect this minimum.
- npm (bundled with Node).

## Setup & running locally

1. **Install dependencies**
   ```bash
   cd server
   npm install

   cd ../client
   npm install
   ```

2. **Run the API**
   ```bash
   cd server
   npm run dev           # or: npm start
   ```
   The API listens on `http://localhost:4000` by default. You can change `PORT` via an environment variable.

3. **Run the React client**
   ```bash
   cd client
   cp .env.example .env  # optional: customize API base via VITE_API_URL
   npm run dev
   ```
   Vite serves the UI at `http://localhost:5173`. The default `VITE_API_URL` expects the API on port 4000, but you can point it to any reachable host.

4. **Build for production (optional)**
   ```bash
   cd client
   npm run build
   npm run preview       # serve the production build locally
   ```

## Usage workflow

1. **Teacher panel**
   - Enter a session title and author your questions (at least two answer options each).
   - Click **Launch Session** to create a room and reveal the 6-character code.
   - Watch the **Live responses** section update instantly as students answer. The summary cards show per-option counts, and the table lists each student's answers.

2. **Student panel**
   - Type the session code and your name, then load the quiz.
   - Select answers and submit. You can resubmit to change answers—teachers always see the latest choices.

3. **Resetting / closing**
   - Stopping the API process clears every in-memory session. An optional `DELETE /api/sessions/:id` endpoint is available if you want to expose a “close room” action later.

## API overview

- `POST /api/sessions` – create a session `{ title, questions: [{ text, options[] }] }`.
- `GET /api/sessions/:id` – fetch session details (questions, answers snapshot, summary counts).
- `POST /api/sessions/:id/answers` – submit/update a student's answers.
- `DELETE /api/sessions/:id` – close & remove a room (broadcasts `sessionClosed` over Socket.IO).
- WebSocket event `joinSession` – subscribe to real-time updates for a session.

> ⚠️ Persistence: responses live purely in memory. Deploy behind a process manager or add a database if you need durability beyond a single runtime.

## Scaling notes

- Each session was designed for classrooms (30+ concurrent students). Socket.IO fan-out keeps updates efficient for much larger groups.
- Enable HTTPS + auth (not included) before exposing it to the public internet.

Enjoy fast formative assessments! Contributions or enhancements (auth, persistence, richer question types) can plug into the existing API + React structure.

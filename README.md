# Kvizn�k � Czech classroom quiz app

A lightweight classroom-response experience built for Czech teachers and students. Teachers log in, create multiple-choice quizzes, and watch 30+ students submit answers in real time. Students only see the public workspace and never need an account.

## Features

- **Separate teacher/student UIs** � `/teacher` is hidden behind a login, `/student` stays open for quick access.
- **Database-backed auth** � credentials live in a SQLite database, seeded via script or env defaults.
- **Rapid authoring** � add unlimited questions with up to six options each and instantly share a six-character room code.
- **Live monitoring** � Socket.IO streams aggregate counts plus a per-student table (only visible to authenticated teachers).
- **In-memory quiz storage** � great for quick sessions; restart the API to reset everything.

## Project structure

```
kviznik/
+-- server/   # Express + Socket.IO API, SQLite auth store
+-- client/   # Vite + React SPA (home + teacher + student routes)
```

## Prerequisites

- Node.js **20.19+** (or >=22.12). Newer Vite releases expect this baseline.
- npm (ships with Node).

## Server setup

1. **Install deps and configure `.env`**
   ```bash
   cd server
   npm install
   ```
   Edit `server/.env` to set `PORT`, `JWT_SECRET`, `DB_PATH`, and default teacher credentials.

2. **Seed a teacher user**
   - Either set `ADMIN_USERNAME` + `ADMIN_PASSWORD` in `.env` before the first boot (the store auto-seeds once), **or** run the script:
     ```bash
     npm run create:teacher my-user my-secret
     ```

3. **Start the API**
   ```bash
   npm run dev   # or: npm start
   ```
   Defaults to `http://localhost:5000`. Set `PORT=5000 npm run dev` to change. The SQLite file lives under `server/data/` unless you override `DB_PATH`.

## Client setup

1. **Install deps & configure `.env`**
   ```bash
   cd client
   npm install
   ```
   Update `client/.env` so `VITE_API_URL` points at your API host/port.

2. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open the printed URL (usually `http://localhost:5173`). Routes:
   - `/` � landing page with quick links.
   - `/teacher` � login ? session builder + live dashboard.
   - `/student` � public workspace for entering a code and submitting answers.

3. **Build for production (optional)**
   ```bash
   npm run build
   npm run preview
   ```
   Deploy `client/dist` behind Nginx/Cloudflare while the Node API stays running.

## Teacher workflow

1. Sign in at `/teacher` using the seeded credentials.
2. Create questions or attach to an existing room code.
3. Share the code with students. The dashboard streams summaries plus a per-student table, and you can close a room via `DELETE /api/sessions/:code`.

## Student workflow

1. Visit `/student`, enter the six-character code and a display name.
2. Pick answers and submit. Students may resend answers anytime; teachers always see the latest responses.

## API quick reference

- `POST /api/auth/login` � exchange username/password for a JWT.
- `POST /api/sessions` *(auth)* � create a quiz session.
- `GET /api/sessions/:code` � public questions for students.
- `GET /api/teacher/sessions/:code` *(auth)* � teacher view (answers + summary).
- `POST /api/sessions/:code/answers` � submit/update responses.
- `DELETE /api/sessions/:code` *(auth)* � close a session and notify listeners.
- Socket.IO: emit `joinSession` with `{ sessionId, token }` to stream live results (teachers only).

> ?? Quiz/answer data still lives in memory. Use an external store if you need persistence beyond a single Node process.

## Cloudflare Tunnel / Nginx notes

- Serve the React build from Nginx, proxy `/api` and `/socket.io` to the Node port, then point Cloudflare Tunnel at the Nginx port (e.g., 90 if 80 is taken by CasaOS).
- Ensure the Nginx worker (www-data) can read `client/dist` (`chmod o+rx` on `/home/tonda/Projects/kviznik/...`).

Enjoy building Czech classroom quizzes with real-time insights!



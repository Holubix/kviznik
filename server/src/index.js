const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { randomUUID } = require('crypto');

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const sessions = new Map();

const SESSION_CODE_LENGTH = 6;
const SESSION_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const createSessionCode = () => {
  let code = '';
  for (let i = 0; i < SESSION_CODE_LENGTH; i += 1) {
    const idx = Math.floor(Math.random() * SESSION_CODE_CHARS.length);
    code += SESSION_CODE_CHARS[idx];
  }
  return sessions.has(code) ? createSessionCode() : code;
};

const sanitizeQuestion = (question) => {
  const text = (question?.text || '').trim();
  const options = Array.isArray(question?.options)
    ? question.options.map((opt) => (opt || '').trim()).filter(Boolean)
    : [];

  if (!text || options.length < 2) {
    return null;
  }

  return {
    id: randomUUID(),
    text,
    options
  };
};

const serializeSession = (session) => ({
  id: session.id,
  title: session.title,
  questions: session.questions,
  answers: Object.values(session.answers)
});

const buildSummary = (session) =>
  session.questions.map((question) => {
    const counts = question.options.map((option, index) => {
      let count = 0;
      Object.values(session.answers).forEach((answer) => {
        if (answer.responses?.[question.id] === index) {
          count += 1;
        }
      });

      return { option, count };
    });

    return {
      questionId: question.id,
      questionText: question.text,
      counts
    };
  });

const emitUpdates = (session) => {
  io.to(session.id).emit('answersUpdated', {
    session: serializeSession(session),
    summary: buildSummary(session)
  });
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/sessions', (req, res) => {
  const { title, questions } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'A session title is required.' });
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return res
      .status(400)
      .json({ error: 'Please provide at least one multiple choice question.' });
  }

  const normalizedQuestions = questions
    .map(sanitizeQuestion)
    .filter((question) => question !== null);

  if (normalizedQuestions.length !== questions.length) {
    return res
      .status(400)
      .json({ error: 'Every question must include text and two or more options.' });
  }

  const sessionId = createSessionCode();
  const session = {
    id: sessionId,
    title: title.trim(),
    createdAt: new Date().toISOString(),
    questions: normalizedQuestions,
    answers: {}
  };

  sessions.set(sessionId, session);

  res
    .status(201)
    .json({ sessionId, session: serializeSession(session), summary: buildSummary(session) });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  res.json({ session: serializeSession(session), summary: buildSummary(session) });
});

app.post('/api/sessions/:sessionId/answers', (req, res) => {
  const session = sessions.get(req.params.sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  const { studentName, responses } = req.body;

  if (!studentName || typeof studentName !== 'string') {
    return res.status(400).json({ error: 'Student name is required.' });
  }

  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) {
    return res
      .status(400)
      .json({ error: 'Responses must be an object keyed by question id.' });
  }

  const trimmedName = studentName.trim();
  if (!trimmedName) {
    return res.status(400).json({ error: 'Student name cannot be empty.' });
  }

  const normalizedResponses = {};
  session.questions.forEach((question) => {
    if (typeof responses[question.id] === 'number') {
      const chosen = responses[question.id];
      if (chosen >= 0 && chosen < question.options.length) {
        normalizedResponses[question.id] = chosen;
      }
    }
  });

  session.answers[trimmedName] = {
    studentName: trimmedName,
    responses: normalizedResponses,
    submittedAt: new Date().toISOString()
  };

  emitUpdates(session);

  res.json({ success: true });
});

app.delete('/api/sessions/:sessionId', (req, res) => {
  if (!sessions.has(req.params.sessionId)) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  sessions.delete(req.params.sessionId);
  io.to(req.params.sessionId).emit('sessionClosed');
  res.json({ success: true });
});

io.on('connection', (socket) => {
  socket.on('joinSession', ({ sessionId }) => {
    if (!sessionId || !sessions.has(sessionId)) {
      socket.emit('sessionError', 'Session not found.');
      return;
    }

    socket.join(sessionId);
    const session = sessions.get(sessionId);
    socket.emit('answersUpdated', {
      session: serializeSession(session),
      summary: buildSummary(session)
    });

    socket.on('disconnect', () => {
      socket.leave(sessionId);
    });
  });
});

server.listen(PORT, () => {
  /* eslint-disable no-console */
  console.log(`API & realtime server listening on port ${PORT}`);
});

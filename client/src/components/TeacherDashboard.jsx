import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const createQuestion = () => ({
  text: '',
  options: ['', '']
});

const getAnswerLabel = (question, answerIndex) => {
  if (answerIndex === undefined || answerIndex === null) {
    return '--';
  }

  return question.options[answerIndex] ?? '--';
};

const TeacherDashboard = ({ authToken, user, onLogout }) => {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([createQuestion()]);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [existingCode, setExistingCode] = useState('');
  const [attachStatus, setAttachStatus] = useState('idle');

  const totalResponses = answers.length;

  const sanitizedQuestions = useMemo(
    () =>
      questions.map((question) => ({
        ...question,
        options: question.options.map((option) => option.trim())
      })),
    [questions]
  );

  const authHeaders = useMemo(
    () => ({
      Authorization: 'Bearer ' + authToken,
      'Content-Type': 'application/json'
    }),
    [authToken]
  );

  const fetchTeacherSession = async (code) => {
    const response = await fetch(API_BASE_URL + '/api/teacher/sessions/' + code, {
      headers: { Authorization: 'Bearer ' + authToken }
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to fetch session.');
    }
    setSession(payload.session);
    setAnswers(payload.session?.answers ?? []);
    setSummary(payload.summary ?? []);
    setSuccessMessage('Session synced. Students can now join with code ' + payload.session.id + '.');
  };

  useEffect(() => {
    if (!session?.id || !authToken) {
      return undefined;
    }

    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
      auth: { token: authToken }
    });

    socket.emit('joinSession', { sessionId: session.id, token: authToken });
    socket.on('answersUpdated', (payload) => {
      setSession(payload.session);
      setAnswers(payload.session?.answers ?? []);
      setSummary(payload.summary ?? []);
    });

    socket.on('sessionClosed', () => {
      setSuccessMessage('This session was closed.');
    });

    socket.on('sessionError', (message) => {
      setError(message);
    });

    return () => {
      socket.disconnect();
    };
  }, [session?.id, authToken]);

  const updateQuestionText = (index, text) => {
    setQuestions((previous) => {
      const updated = [...previous];
      updated[index] = { ...updated[index], text };
      return updated;
    });
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions((previous) => {
      const updated = [...previous];
      const question = { ...updated[questionIndex] };
      const questionOptions = [...question.options];
      questionOptions[optionIndex] = value;
      question.options = questionOptions;
      updated[questionIndex] = question;
      return updated;
    });
  };

  const addOption = (questionIndex) => {
    setQuestions((previous) => {
      const updated = [...previous];
      if (updated[questionIndex].options.length >= 6) {
        return updated;
      }
      updated[questionIndex] = {
        ...updated[questionIndex],
        options: [...updated[questionIndex].options, '']
      };
      return updated;
    });
  };

  const removeOption = (questionIndex, optionIndex) => {
    setQuestions((previous) => {
      const updated = [...previous];
      const currentOptions = updated[questionIndex].options;
      if (currentOptions.length <= 2) {
        return updated;
      }
      const nextOptions = currentOptions.filter((_, idx) => idx !== optionIndex);
      updated[questionIndex] = { ...updated[questionIndex], options: nextOptions };
      return updated;
    });
  };

  const addQuestion = () => {
    setQuestions((previous) => [...previous, createQuestion()]);
  };

  const removeQuestion = (index) => {
    setQuestions((previous) => {
      if (previous.length === 1) {
        return previous;
      }
      return previous.filter((_, idx) => idx !== index);
    });
  };

  const handleCreateSession = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const formattedQuestions = sanitizedQuestions.map((question) => ({
      text: question.text.trim(),
      options: question.options.filter((option) => option.trim().length > 0)
    }));

    if (formattedQuestions.some((question) => !question.text)) {
      setError('Please fill in the text for each question.');
      return;
    }

    if (formattedQuestions.some((question) => question.options.length < 2)) {
      setError('Each question must have at least two answer options.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL + '/api/sessions', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: title.trim() || 'Quick Quiz',
          questions: formattedQuestions
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Could not create session.');
      }
      setSession(payload.session);
      setAnswers(payload.session?.answers ?? []);
      setSummary(payload.summary ?? []);
      setSuccessMessage('Session ready! Share the code ' + payload.session.id + ' with students.');
    } catch (createError) {
      setError(createError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAttachSession = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!existingCode.trim()) {
      setError('Enter a session code to monitor.');
      return;
    }

    setAttachStatus('loading');
    try {
      await fetchTeacherSession(existingCode.trim());
      setAttachStatus('ready');
    } catch (attachError) {
      setAttachStatus('idle');
      setError(attachError.message);
    }
  };

  if (!authToken) {
    return null;
  }

  return (
    <div className="panel teacher-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Teacher</p>
          <h2>Manage sessions</h2>
        </div>
        <div className="teacher-meta">
          <span>{user?.username}</span>
          <button type="button" className="secondary-button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </div>

      <form className="stack" onSubmit={handleCreateSession}>
        <label className="stack">
          <span>Session title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Morning quiz, exit ticket..."
          />
        </label>

        <div className="question-list stack">
          <div className="question-list-header">
            <span>Questions</span>
            <button
              type="button"
              className="link-button"
              onClick={addQuestion}
            >
              + Add question
            </button>
          </div>

          {questions.map((question, questionIndex) => (
            <div className="question-card stack" key={'question-' + questionIndex}>
              <div className="question-card-header">
                <strong>Question {questionIndex + 1}</strong>
                {questions.length > 1 ? (
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => removeQuestion(questionIndex)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <input
                value={question.text}
                onChange={(event) => updateQuestionText(questionIndex, event.target.value)}
                placeholder="What is photosynthesis?"
              />

              <div className="option-list stack">
                {question.options.map((option, optionIndex) => (
                  <div className="option-row" key={'option-' + optionIndex}>
                    <input
                      value={option}
                      onChange={(event) =>
                        updateOption(questionIndex, optionIndex, event.target.value)
                      }
                      placeholder={'Option ' + (optionIndex + 1)}
                    />
                    {question.options.length > 2 ? (
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => removeOption(questionIndex, optionIndex)}
                      >
                        ?
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              {question.options.length < 6 ? (
                <button
                  type="button"
                  className="link-button"
                  onClick={() => addOption(questionIndex)}
                >
                  + Add option
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {error ? <div className="alert error">{error}</div> : null}
        {successMessage ? <div className="alert success">{successMessage}</div> : null}

        <button type="submit" className="primary-button" disabled={loading}>
          {session?.id ? 'Update Session' : 'Launch Session'}
        </button>
      </form>

      <form className="attach-form" onSubmit={handleAttachSession}>
        <p className="eyebrow">Monitor an existing code</p>
        <div className="attach-row">
          <input
            value={existingCode}
            onChange={(event) => setExistingCode(event.target.value.toUpperCase())}
            placeholder="Enter code"
          />
          <button type="submit" className="secondary-button" disabled={attachStatus === 'loading'}>
            Attach
          </button>
        </div>
      </form>

      {session?.id ? (
        <div className="stack monitoring">
          <div className="share-card">
            <div>
              <p className="eyebrow">Share code</p>
              <p className="session-code">{session.id}</p>
            </div>
            <p className="share-copy">
              Students open the student page and enter this code plus their name.
            </p>
          </div>

          <div className="summary">
            <div className="summary-header">
              <h3>Live responses</h3>
              <span>{totalResponses} student(s)</span>
            </div>

            {summary.length === 0 ? (
              <p className="muted">Responses will appear here in real time.</p>
            ) : (
              summary.map((question) => (
                <div className="summary-card" key={question.questionId + '-summary'}>
                  <h4>{question.questionText}</h4>
                  <ul>
                    {question.counts.map((entry, optionIndex) => (
                      <li key={question.questionId + '-' + optionIndex}>
                        <span>{entry.option}</span>
                        <strong>{entry.count}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>

          <div className="responses-table">
            <h3>Individual answers</h3>
            {answers.length === 0 ? (
              <p className="muted">No answers yet.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      {session.questions.map((question) => (
                        <th key={question.id}>{question.text}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {answers.map((answer) => (
                      <tr key={answer.studentName}>
                        <td>{answer.studentName}</td>
                        {session.questions.map((question) => (
                          <td key={answer.studentName + '-' + question.id}>
                            {getAnswerLabel(question, answer.responses?.[question.id])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="muted">Launch or attach to a session to start monitoring responses.</p>
      )}
    </div>
  );
};

export default TeacherDashboard;

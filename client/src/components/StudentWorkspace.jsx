import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const StudentWorkspace = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [session, setSession] = useState(null);
  const [responses, setResponses] = useState({});
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchSession = async () => {
    if (!sessionCode.trim()) {
      setError('Enter a session code.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setStatus('loading-session');

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionCode.trim()}`);
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Session not found.');
      }
      const payload = await response.json();
      setSession(payload.session);
      setResponses({});
      setStatus('session-loaded');
    } catch (lookupError) {
      setStatus('idle');
      setSession(null);
      setError(lookupError.message);
    }
  };

  const handleJoinSubmit = async (event) => {
    event.preventDefault();
    await fetchSession();
  };

  const updateResponse = (questionId, optionIndex) => {
    setResponses((previous) => ({
      ...previous,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitAnswers = async (event) => {
    event.preventDefault();
    setError('');

    if (!studentName.trim()) {
      setError('Please enter your name first.');
      return;
    }

    if (!session?.id) {
      setError('Load the session before submitting.');
      return;
    }

    setStatus('submitting');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/sessions/${session.id}/answers`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: studentName.trim(),
            responses
          })
        }
      );

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Could not submit answers.');
      }

      setSuccessMessage('Answers submitted! You can update them anytime.');
      setStatus('answered');
    } catch (submitError) {
      setStatus('session-loaded');
      setError(submitError.message);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Students</p>
          <h2>Join & Answer</h2>
        </div>
        {status === 'answered' ? <span className="status success">Submitted</span> : null}
      </div>

      <form className="stack" onSubmit={handleJoinSubmit}>
        <label className="stack">
          <span>Session code</span>
          <input
            value={sessionCode}
            onChange={(event) => setSessionCode(event.target.value.toUpperCase())}
            placeholder="Enter the 6-letter code"
          />
        </label>

        <label className="stack">
          <span>Your name</span>
          <input
            value={studentName}
            onChange={(event) => setStudentName(event.target.value)}
            placeholder="How should we call you?"
          />
        </label>

        <button
          type="submit"
          className="primary-button"
          disabled={status === 'loading-session'}
        >
          {session ? 'Reload Session' : 'Load Questions'}
        </button>
      </form>

      {!session && error ? <div className="alert error">{error}</div> : null}

      {session ? (
        <form className="stack" onSubmit={handleSubmitAnswers}>
          <div className="session-details">
            <strong>{session.title}</strong>
            <span>{session.questions.length} question(s)</span>
          </div>

          {session.questions.map((question, questionIndex) => (
            <div className="question-card stack" key={question.id}>
              <strong>
                {questionIndex + 1}. {question.text}
              </strong>

              <div className="choices">
                {question.options.map((option, optionIndex) => (
                  <label className="choice" key={`${question.id}-${optionIndex}`}>
                    <input
                      type="radio"
                      name={question.id}
                      value={optionIndex}
                      checked={responses[question.id] === optionIndex}
                      onChange={() => updateResponse(question.id, optionIndex)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {error ? <div className="alert error">{error}</div> : null}
          {successMessage ? <div className="alert success">{successMessage}</div> : null}

          <button
            type="submit"
            className="secondary-button"
            disabled={status === 'submitting'}
          >
            {status === 'answered' ? 'Update Answers' : 'Submit Answers'}
          </button>
        </form>
      ) : null}
    </div>
  );
};

export default StudentWorkspace;

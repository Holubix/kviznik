import { useState } from 'react';

const LoginForm = ({ onSubmit, error, loading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ username, password });
  };

  return (
    <form className="panel stack" onSubmit={handleSubmit}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Teacher access</p>
          <h2>Sign in to Kvizník</h2>
        </div>
      </div>

      <label className="stack">
        <span>Username</span>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="teacher"
          autoComplete="username"
        />
      </label>

      <label className="stack">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••"
          autoComplete="current-password"
        />
      </label>

      {error ? <div className="alert error">{error}</div> : null}

      <button type="submit" className="primary-button" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
};

export default LoginForm;
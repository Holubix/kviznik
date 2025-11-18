import { useState } from 'react';
import TeacherDashboard from '../components/TeacherDashboard';
import LoginForm from '../components/LoginForm';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TeacherPage = () => {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('kviznik_token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kviznik_user'));
    } catch (error) {
      return null;
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async ({ username, password }) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_BASE_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Could not sign in.');
      }

      const payload = await response.json();
      localStorage.setItem('kviznik_token', payload.token);
      localStorage.setItem('kviznik_user', JSON.stringify(payload.user));
      setAuthToken(payload.token);
      setUser(payload.user);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kviznik_token');
    localStorage.removeItem('kviznik_user');
    setAuthToken(null);
    setUser(null);
  };

  return (
    <section className="page">
      {authToken ? (
        <TeacherDashboard authToken={authToken} user={user} onLogout={handleLogout} />
      ) : (
        <LoginForm onSubmit={handleLogin} error={error} loading={loading} />
      )}
    </section>
  );
};

export default TeacherPage;
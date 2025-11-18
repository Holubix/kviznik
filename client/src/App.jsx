import { Link, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TeacherPage from './pages/TeacherPage';
import StudentPage from './pages/StudentPage';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="site-header">
        <div className="brand">
          <p className="eyebrow">Kvizník</p>
          <h1>Ceské kvízy bez zbytecné práce</h1>
          <p className="muted">
            Vyberte režim, který potrebujete. Ucitelé vytvárejí relaci, studenti jen zadají kód a
            odpovedí.
          </p>
        </div>
        <nav className="site-nav">
          <Link to="/">Domu</Link>
          <Link to="/teacher">Ucitel</Link>
          <Link to="/student">Student</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/teacher" element={<TeacherPage />} />
          <Route path="/student" element={<StudentPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
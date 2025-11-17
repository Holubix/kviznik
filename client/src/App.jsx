import './App.css';
import StudentWorkspace from './components/StudentWorkspace';
import TeacherDashboard from './components/TeacherDashboard';

function App() {
  return (
    <div className="app">
      <header>
        <div>
          <p className="eyebrow">Kvizník</p>
          <h1>České kvízy bez zbytečné práce</h1>
          <p className="muted">
            Launch a quick check-in, let up to 30+ students respond in real time, and review
            aggregated data from a single dashboard.
          </p>
        </div>
      </header>

      <main className="layout">
        <TeacherDashboard />
        <StudentWorkspace />
      </main>
    </div>
  );
}

export default App;

import { useEffect, useState } from 'react';
import StartScreen from './components/StartScreen.jsx';
import Quiz from './components/Quiz.jsx';
import Results from './components/Results.jsx';
import StudyMode from './components/StudyMode.jsx';
import { TITLE, buildSession, scoreSession, storage } from './quiz.js';

export default function App() {
  const [session, setSession] = useState(() => storage.loadSession());
  const [screen, setScreen] = useState(() => {
    const s = storage.loadSession();
    return s?.finished ? 'results' : 'start';
  });
  const [history, setHistory] = useState(() => storage.loadHistory());
  const [starred, setStarred] = useState(() => storage.loadStarred());
  const [stats, setStats] = useState(() => storage.loadStats());
  const [theme, setTheme] = useState(() => storage.loadTheme());

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    storage.saveTheme(theme);
  }, [theme]);

  // Persist every change to active session
  useEffect(() => {
    if (session) storage.saveSession(session);
    else storage.clearSession();
  }, [session]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  const toggleStar = (id) => {
    const updated = storage.toggleStarred(id);
    setStarred(updated);
  };

  const addStarredBatch = (ids) => {
    const updated = storage.addStarredBatch(ids);
    setStarred(updated);
  };

  const start = (config, questionIds) => {
    setSession(buildSession(config, questionIds));
    setScreen('quiz');
  };

  const finish = (finalSession) => {
    const done = { ...finalSession, finished: true };
    const score = scoreSession(done);
    // Update history
    setHistory(
      storage.addHistory({
        date: Date.now(),
        label: done.config.label,
        mode: done.config.mode,
        correct: score.correct,
        total: score.total,
        pct: score.pct,
        elapsed: done.elapsed,
      })
    );
    // Record question stats
    const updatedStats = storage.recordSessionAttempts(done);
    setStats(updatedStats);

    setSession(done);
    setScreen('results');
  };

  const goHome = () => {
    if (session?.finished) setSession(null);
    setScreen('start');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <button className="brand" onClick={goHome} title="Return to start">
            <span className="logo">✳</span>
            <span className="brand-text">{TITLE}</span>
          </button>

          <nav className="header-nav">
            <button
              className={`nav-btn ${screen === 'start' ? 'active' : ''}`}
              onClick={goHome}
            >
              Quiz Home
            </button>
            <button
              className={`nav-btn ${screen === 'study' ? 'active' : ''}`}
              onClick={() => setScreen('study')}
            >
              Study Bank
            </button>
            {starred.length > 0 && (
              <button
                className="nav-btn star-counter"
                onClick={() => setScreen('study')}
                title="View starred questions in study bank"
              >
                ★ {starred.length}
              </button>
            )}
            <button
              className="theme-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </nav>
        </div>
      </header>

      <main className="container">
        {screen === 'start' && (
          <StartScreen
            onStart={start}
            resumable={session && !session.finished ? session : null}
            onResume={() => setScreen('quiz')}
            onDiscard={() => setSession(null)}
            history={history}
            onClearHistory={() => {
              storage.clearHistory();
              setHistory([]);
            }}
            starred={starred}
            stats={stats}
            onOpenStudy={() => setScreen('study')}
          />
        )}

        {screen === 'quiz' && session && (
          <Quiz
            session={session}
            onChange={setSession}
            onFinish={finish}
            onExit={() => setScreen('start')}
            starred={starred}
            onToggleStar={toggleStar}
          />
        )}

        {screen === 'results' && session && (
          <Results
            session={session}
            onRestart={start}
            onHome={goHome}
            onOpenStudy={() => setScreen('study')}
            starred={starred}
            onToggleStar={toggleStar}
            onStarBatch={addStarredBatch}
          />
        )}

        {screen === 'study' && (
          <StudyMode
            starred={starred}
            onToggleStar={toggleStar}
            stats={stats}
            onStartQuiz={start}
            onBack={goHome}
          />
        )}
      </main>
    </div>
  );
}

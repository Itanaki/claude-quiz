import { useEffect, useState } from 'react';
import StartScreen from './components/StartScreen.jsx';
import Quiz from './components/Quiz.jsx';
import Results from './components/Results.jsx';
import { TITLE, buildSession, scoreSession, storage } from './quiz.js';

export default function App() {
  const [session, setSession] = useState(() => storage.loadSession());
  const [screen, setScreen] = useState(() => {
    const s = storage.loadSession();
    return s?.finished ? 'results' : 'start';
  });
  const [history, setHistory] = useState(() => storage.loadHistory());

  // Persist every change to the active session so progress survives refreshes.
  useEffect(() => {
    if (session) storage.saveSession(session);
    else storage.clearSession();
  }, [session]);

  const start = (config, questionIds) => {
    setSession(buildSession(config, questionIds));
    setScreen('quiz');
  };

  const finish = (finalSession) => {
    const done = { ...finalSession, finished: true };
    const score = scoreSession(done);
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
        <button className="brand" onClick={goHome} title="Home">
          <span className="logo">✳</span>
          <span>{TITLE}</span>
        </button>
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
          />
        )}

        {screen === 'quiz' && session && (
          <Quiz session={session} onChange={setSession} onFinish={finish} onExit={() => setScreen('start')} />
        )}

        {screen === 'results' && session && (
          <Results session={session} onRestart={start} onHome={goHome} />
        )}
      </main>
    </div>
  );
}

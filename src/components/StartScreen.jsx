import { useState } from 'react';
import { ALL_QUESTIONS, DOMAINS, PASS_MARK, formatTime, scoreSession } from '../quiz.js';

const countByDomain = ALL_QUESTIONS.reduce((acc, q) => {
  acc[q.domain] = (acc[q.domain] || 0) + 1;
  return acc;
}, {});

export default function StartScreen({ onStart, resumable, onResume, onDiscard, history, onClearHistory }) {
  const [scope, setScope] = useState('all'); // all | domains | random
  const [selected, setSelected] = useState(() => DOMAINS.map((d) => d.id));
  const [randomCount, setRandomCount] = useState(50);
  const [mode, setMode] = useState('practice'); // practice | exam
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [timed, setTimed] = useState(false);
  const [minutes, setMinutes] = useState(60);

  const domainIds = scope === 'domains' ? selected : DOMAINS.map((d) => d.id);
  const available = domainIds.reduce((n, id) => n + (countByDomain[id] || 0), 0);
  const total = scope === 'random' ? Math.min(randomCount, available) : available;

  const toggleDomain = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].sort((a, b) => a - b)));

  const handleStart = () => {
    if (!total) return;
    const label =
      scope === 'all'
        ? 'Full exam (all domains)'
        : scope === 'random'
        ? `Random ${total} questions`
        : selected.length === 1
        ? `Domain ${selected[0]}: ${DOMAINS.find((d) => d.id === selected[0]).name}`
        : `${selected.length} selected domains`;
    onStart({
      label,
      mode,
      domains: domainIds,
      count: scope === 'random' ? total : null,
      shuffleQuestions: scope === 'random' ? true : shuffleQuestions,
      shuffleOptions,
      timeLimit: timed ? Math.max(1, Number(minutes) || 1) * 60 : null,
    });
  };

  const resumeScore = resumable ? scoreSession(resumable) : null;

  return (
    <div className="start">
      <section className="card hero">
        <h1>Mock Exam Quiz</h1>
        <p className="muted">
          {ALL_QUESTIONS.length} questions across {DOMAINS.length} domains. Practice with instant feedback, or take it
          in exam mode and get scored at the end.
        </p>
      </section>

      {resumable && (
        <section className="card resume">
          <div>
            <strong>Quiz in progress:</strong> {resumable.config.label}
            <div className="muted small">
              {resumeScore.answered}/{resumeScore.total} answered · {resumable.config.mode} mode ·{' '}
              {formatTime(resumable.elapsed)} elapsed
            </div>
          </div>
          <div className="row">
            <button className="btn primary" onClick={onResume}>
              Resume
            </button>
            <button className="btn ghost" onClick={onDiscard}>
              Discard
            </button>
          </div>
        </section>
      )}

      <section className="card">
        <h2>1. Choose questions</h2>
        <div className="seg">
          {[
            ['all', `All questions (${ALL_QUESTIONS.length})`],
            ['domains', 'By domain'],
            ['random', 'Random set'],
          ].map(([v, l]) => (
            <button key={v} className={scope === v ? 'active' : ''} onClick={() => setScope(v)}>
              {l}
            </button>
          ))}
        </div>

        {scope === 'random' && (
          <label className="field">
            Number of questions
            <input
              type="number"
              min="1"
              max={ALL_QUESTIONS.length}
              value={randomCount}
              onChange={(e) => setRandomCount(Math.max(1, Math.min(ALL_QUESTIONS.length, Number(e.target.value) || 1)))}
            />
            <span className="row gap-sm">
              {[10, 25, 50, 100].map((n) => (
                <button key={n} className="chip" onClick={() => setRandomCount(n)}>
                  {n}
                </button>
              ))}
            </span>
          </label>
        )}

        {scope === 'domains' && (
          <>
            <div className="row gap-sm wrap" style={{ margin: '12px 0' }}>
              <button className="chip" onClick={() => setSelected(DOMAINS.map((d) => d.id))}>
                Select all
              </button>
              <button className="chip" onClick={() => setSelected([])}>
                Clear
              </button>
            </div>
            <div className="domain-grid">
              {DOMAINS.map((d) => (
                <label key={d.id} className={`domain-item ${selected.includes(d.id) ? 'on' : ''}`}>
                  <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggleDomain(d.id)} />
                  <span>
                    <b>D{d.id}.</b> {d.name}
                  </span>
                  <span className="count">{countByDomain[d.id]}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2>2. Settings</h2>
        <div className="seg">
          <button className={mode === 'practice' ? 'active' : ''} onClick={() => setMode('practice')}>
            Practice mode
          </button>
          <button className={mode === 'exam' ? 'active' : ''} onClick={() => setMode('exam')}>
            Exam mode
          </button>
        </div>
        <p className="muted small">
          {mode === 'practice'
            ? 'See whether you are right, plus the rationale, immediately after each answer.'
            : 'No feedback until you submit. You can change answers and flag questions for review.'}
        </p>

        <div className="toggles">
          {scope !== 'random' && (
            <label className="toggle">
              <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} />
              Shuffle question order
            </label>
          )}
          <label className="toggle">
            <input type="checkbox" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} />
            Shuffle answer choices
          </label>
          <label className="toggle">
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
            Time limit
            {timed && (
              <>
                <input
                  type="number"
                  className="inline-num"
                  min="1"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
                minutes
              </>
            )}
          </label>
        </div>
      </section>

      <div className="start-bar">
        <span>
          <b>{total}</b> question{total === 1 ? '' : 's'} · pass mark {PASS_MARK}%
        </span>
        <button className="btn primary lg" disabled={!total} onClick={handleStart}>
          Start quiz →
        </button>
      </div>

      {history.length > 0 && (
        <section className="card">
          <div className="row between">
            <h2>Recent attempts</h2>
            <button className="btn ghost small" onClick={onClearHistory}>
              Clear
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Quiz</th>
                <th>Mode</th>
                <th>Score</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td>{new Date(h.date).toLocaleString()}</td>
                  <td>{h.label}</td>
                  <td className="cap">{h.mode}</td>
                  <td className={h.pct >= PASS_MARK ? 'good' : 'bad'}>
                    {h.correct}/{h.total} ({h.pct}%)
                  </td>
                  <td>{formatTime(h.elapsed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

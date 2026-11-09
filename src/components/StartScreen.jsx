import { useState } from 'react';
import { ALL_QUESTIONS, DOMAINS, DOMAIN_NAMES, PASS_MARK, formatTime, scoreSession } from '../quiz.js';

const countByDomain = ALL_QUESTIONS.reduce((acc, q) => {
  acc[q.domain] = (acc[q.domain] || 0) + 1;
  return acc;
}, {});

export default function StartScreen({
  onStart,
  resumable,
  onResume,
  onDiscard,
  history,
  onClearHistory,
  starred = [],
  stats = {},
  onOpenStudy,
  onOpenFlashcards,
  onOpenReadiness,
}) {
  const [scope, setScope] = useState('all'); // all | domains | random | starred | weak
  const [selected, setSelected] = useState(() => DOMAINS.map((d) => d.id));
  const [randomCount, setRandomCount] = useState(50);
  const [mode, setMode] = useState('practice'); // practice | exam
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [timed, setTimed] = useState(false);
  const [minutes, setMinutes] = useState(60);

  // Identify weak questions from past stats
  const weakQuestionIds = Object.entries(stats)
    .filter(([_, s]) => s.wrong > 0 && s.lastCorrect === false)
    .map(([id]) => Number(id));

  const domainIds = scope === 'domains' ? selected : DOMAINS.map((d) => d.id);
  const available = domainIds.reduce((n, id) => n + (countByDomain[id] || 0), 0);

  let totalQuestionsCount = available;
  if (scope === 'random') totalQuestionsCount = Math.min(randomCount, available);
  else if (scope === 'starred') totalQuestionsCount = starred.length;
  else if (scope === 'weak') totalQuestionsCount = weakQuestionIds.length;

  const toggleDomain = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].sort((a, b) => a - b)));

  const handleStart = () => {
    if (!totalQuestionsCount) return;

    if (scope === 'starred') {
      onStart(
        {
          label: `Starred Questions (${starred.length})`,
          mode,
          domains: DOMAINS.map((d) => d.id),
          count: null,
          shuffleQuestions: true,
          shuffleOptions,
          timeLimit: timed ? Math.max(1, Number(minutes) || 1) * 60 : null,
        },
        starred
      );
      return;
    }

    if (scope === 'weak') {
      onStart(
        {
          label: `Targeted Review: Weak Areas (${weakQuestionIds.length})`,
          mode,
          domains: DOMAINS.map((d) => d.id),
          count: null,
          shuffleQuestions: true,
          shuffleOptions,
          timeLimit: timed ? Math.max(1, Number(minutes) || 1) * 60 : null,
        },
        weakQuestionIds
      );
      return;
    }

    const label =
      scope === 'all'
        ? 'Full mock exam (all 300 questions)'
        : scope === 'random'
        ? `Random ${totalQuestionsCount} questions`
        : selected.length === 1
        ? `Domain ${selected[0]}: ${DOMAINS.find((d) => d.id === selected[0]).name}`
        : `${selected.length} selected domains (${totalQuestionsCount} questions)`;

    onStart({
      label,
      mode,
      domains: domainIds,
      count: scope === 'random' ? totalQuestionsCount : null,
      shuffleQuestions: scope === 'random' ? true : shuffleQuestions,
      shuffleOptions,
      timeLimit: timed ? Math.max(1, Number(minutes) || 1) * 60 : null,
    });
  };

  // Quick preset starters
  const startPreset = (presetType) => {
    if (presetType === 'simulation') {
      onStart({
        label: 'Exam Simulation (60 Questions, 75 mins)',
        mode: 'exam',
        domains: DOMAINS.map((d) => d.id),
        count: 60,
        shuffleQuestions: true,
        shuffleOptions: true,
        timeLimit: 75 * 60,
      });
    } else if (presetType === 'quick15') {
      onStart({
        label: 'Quick Practice (15 Questions)',
        mode: 'practice',
        domains: DOMAINS.map((d) => d.id),
        count: 15,
        shuffleQuestions: true,
        shuffleOptions: true,
        timeLimit: null,
      });
    } else if (presetType === 'practice30') {
      onStart({
        label: 'Standard Practice (30 Questions)',
        mode: 'practice',
        domains: DOMAINS.map((d) => d.id),
        count: 30,
        shuffleQuestions: true,
        shuffleOptions: true,
        timeLimit: null,
      });
    }
  };

  const resumeScore = resumable ? scoreSession(resumable) : null;

  return (
    <div className="start">
      <section className="card hero">
        <div className="row between wrap gap-sm">
          <div>
            <h1>Claude Certified Associate – Foundations</h1>
            <p className="muted">
              Interactive preparation app featuring all <b>300 questions</b> and <b>26 domains</b> from the mock exam.
            </p>
          </div>
          <div className="row wrap gap-sm">
            <button className="btn outline small" onClick={onOpenFlashcards} title="Interactive card flip study mode">
              🃏 Flashcards
            </button>
            <button className="btn outline small" onClick={onOpenStudy} title="Search questions and study rationales">
              📖 Question Bank
            </button>
            <button className="btn outline small" onClick={onOpenReadiness} title="View mastery progress by domain">
              📊 Mastery &amp; Readiness
            </button>
          </div>
        </div>
      </section>

      {/* Quick Launch Presets */}
      <section className="card presets-card">
        <div className="row between wrap gap-sm">
          <div>
            <h3>Quick Launch Presets</h3>
            <span className="muted tiny">Jump straight into a tailored session</span>
          </div>
          <div className="row wrap gap-sm">
            <button className="btn small" onClick={() => startPreset('quick15')}>
              ⚡ 15 Qs Practice
            </button>
            <button className="btn small" onClick={() => startPreset('practice30')}>
              🎯 30 Qs Practice
            </button>
            <button className="btn primary small" onClick={() => startPreset('simulation')}>
              🏆 Official Simulation (60 Qs · 75 min)
            </button>
          </div>
        </div>
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
              Resume Quiz
            </button>
            <button className="btn ghost" onClick={onDiscard}>
              Discard
            </button>
          </div>
        </section>
      )}

      <section className="card">
        <h2>1. Custom Question Selection</h2>
        <div className="seg">
          {[
            ['all', `All (${ALL_QUESTIONS.length})`],
            ['domains', 'By Domain'],
            ['random', 'Random Set'],
            ['starred', `★ Starred (${starred.length})`],
            ['weak', `Weak Areas (${weakQuestionIds.length})`],
          ].map(([v, l]) => (
            <button
              key={v}
              className={scope === v ? 'active' : ''}
              onClick={() => setScope(v)}
              disabled={(v === 'starred' && starred.length === 0) || (v === 'weak' && weakQuestionIds.length === 0)}
            >
              {l}
            </button>
          ))}
        </div>

        {scope === 'starred' && starred.length === 0 && (
          <p className="muted small" style={{ marginTop: '10px' }}>
            No starred questions yet. You can star questions during quizzes or in the Study Guide.
          </p>
        )}

        {scope === 'weak' && weakQuestionIds.length === 0 && (
          <p className="muted small" style={{ marginTop: '10px' }}>
            No missed questions logged yet. Take a quiz first to identify topics needing review.
          </p>
        )}

        {scope === 'random' && (
          <div className="field">
            <span>Number of questions:</span>
            <input
              type="number"
              min="1"
              max={ALL_QUESTIONS.length}
              value={randomCount}
              onChange={(e) => setRandomCount(Math.max(1, Math.min(ALL_QUESTIONS.length, Number(e.target.value) || 1)))}
            />
            <span className="row gap-sm">
              {[15, 30, 50, 75, 100].map((n) => (
                <button key={n} className="chip" onClick={() => setRandomCount(n)}>
                  {n}
                </button>
              ))}
            </span>
          </div>
        )}

        {scope === 'domains' && (
          <>
            <div className="row gap-sm wrap" style={{ margin: '14px 0 10px' }}>
              <button className="chip" onClick={() => setSelected(DOMAINS.map((d) => d.id))}>
                Select all
              </button>
              <button className="chip" onClick={() => setSelected([])}>
                Clear all
              </button>
              <span className="tiny muted" style={{ alignSelf: 'center' }}>
                {selected.length} of {DOMAINS.length} domains selected
              </span>
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
        <h2>2. Quiz Mode &amp; Options</h2>
        <div className="seg">
          <button className={mode === 'practice' ? 'active' : ''} onClick={() => setMode('practice')}>
            Practice Mode
          </button>
          <button className={mode === 'exam' ? 'active' : ''} onClick={() => setMode('exam')}>
            Exam Simulation
          </button>
        </div>
        <p className="muted small" style={{ margin: '8px 0 14px' }}>
          {mode === 'practice'
            ? '💡 Immediate feedback: see whether your answer is correct and read the rationale right away.'
            : '⏱ Simulated exam: no hints or answers until you submit. Flag questions and review anytime.'}
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
            Shuffle answer choices (recommended — balances choice letters)
          </label>
          <label className="toggle">
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
            Time limit:
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
          Ready to begin: <b>{totalQuestionsCount}</b> question{totalQuestionsCount === 1 ? '' : 's'} · Pass mark {PASS_MARK}%
        </span>
        <button className="btn primary lg" disabled={!totalQuestionsCount} onClick={handleStart}>
          Start Quiz →
        </button>
      </div>

      {history.length > 0 && (
        <section className="card">
          <div className="row between">
            <h2>Recent Quiz Attempts</h2>
            <button className="btn ghost small" onClick={onClearHistory}>
              Clear history
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
                  <td>
                    {new Date(h.date).toLocaleDateString()}{' '}
                    {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
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

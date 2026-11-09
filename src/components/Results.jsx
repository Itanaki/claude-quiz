import { useMemo, useState } from 'react';
import { DOMAIN_NAMES, LETTERS, PASS_MARK, formatTime, getQuestion, scoreSession } from '../quiz.js';

export default function Results({ session, onRestart, onHome, onOpenStudy, starred = [], onToggleStar, onStarBatch }) {
  const score = useMemo(() => scoreSession(session), [session]);
  const [filter, setFilter] = useState('incorrect'); // all | incorrect | flagged | unanswered
  const passed = score.pct >= PASS_MARK;

  const rows = session.items.map((item, i) => {
    const q = getQuestion(item.id);
    const given = session.answers[q.id];
    const status = !given ? 'unanswered' : given === q.answer ? 'correct' : 'incorrect';
    return { item, i, q, given, status, flagged: session.flagged.includes(q.id) };
  });

  const visible = rows.filter((r) =>
    filter === 'all'
      ? true
      : filter === 'flagged'
      ? r.flagged
      : filter === 'incorrect'
      ? r.status === 'incorrect' || r.status === 'unanswered'
      : r.status === filter
  );

  const missedIds = rows.filter((r) => r.status !== 'correct').map((r) => r.q.id);
  const flaggedIds = rows.filter((r) => r.flagged).map((r) => r.q.id);
  const allIds = rows.map((r) => r.q.id);

  const retry = (ids, label) => onRestart({ ...session.config, label }, ids);

  const handleStarAllMissed = () => {
    if (onStarBatch && missedIds.length) {
      onStarBatch(missedIds);
      alert(`Added ${missedIds.length} missed question(s) to your Starred list!`);
    }
  };

  return (
    <div className="results">
      <section className={`card score-card ${passed ? 'pass' : 'fail'}`}>
        <div className="score-ring" style={{ '--p': score.pct }}>
          <span>{score.pct}%</span>
        </div>
        <div className="score-info">
          <h1>{passed ? 'Exam Passed! 🎉' : 'Needs More Practice'}</h1>
          <p className="muted">
            {session.config.label} · {session.config.mode} mode · pass mark {PASS_MARK}%
          </p>
          <div className="stats">
            <div><b className="good">{score.correct}</b><span>Correct</span></div>
            <div><b className="bad">{score.incorrect}</b><span>Incorrect</span></div>
            <div><b>{score.unanswered}</b><span>Unanswered</span></div>
            <div><b>{formatTime(session.elapsed)}</b><span>Time</span></div>
          </div>
          <div className="row gap-sm wrap">
            {missedIds.length > 0 && (
              <button className="btn primary" onClick={() => retry(missedIds, `Retry ${missedIds.length} missed questions`)}>
                Retry missed ({missedIds.length})
              </button>
            )}
            {flaggedIds.length > 0 && (
              <button className="btn" onClick={() => retry(flaggedIds, `Retry ${flaggedIds.length} flagged questions`)}>
                Retry flagged ({flaggedIds.length})
              </button>
            )}
            <button className="btn" onClick={() => retry(allIds, session.config.label)}>
              Restart same quiz
            </button>
            {missedIds.length > 0 && onStarBatch && (
              <button className="btn ghost" onClick={handleStarAllMissed} title="Save missed questions to study bank">
                ★ Star all missed
              </button>
            )}
            <button className="btn ghost" onClick={onHome}>
              New quiz
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Score by domain ({score.byDomain.length} domains in this quiz)</h2>
        <div className="domain-bars">
          {score.byDomain.map((d) => {
            const pct = Math.round((d.correct / d.total) * 100);
            return (
              <div key={d.id} className="domain-bar">
                <div className="row between small">
                  <span>
                    <b>D{d.id}.</b> {d.name}
                  </span>
                  <span className={pct >= PASS_MARK ? 'good' : 'bad'}>
                    {d.correct}/{d.total} ({pct}%)
                  </span>
                </div>
                <div className="progress thin">
                  <div className={pct >= PASS_MARK ? '' : 'low'} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="row between wrap gap-sm">
          <h2>Review answers</h2>
          <div className="seg small">
            {[
              ['incorrect', `Missed (${missedIds.length})`],
              ['flagged', `Flagged (${flaggedIds.length})`],
              ['all', `All (${rows.length})`],
            ].map(([v, l]) => (
              <button key={v} className={filter === v ? 'active' : ''} onClick={() => setFilter(v)}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 && (
          <p className="muted" style={{ padding: '20px 0' }}>
            No questions to show in this view. Excellent job!
          </p>
        )}

        <div className="review-list">
          {visible.map(({ item, i, q, given, status, flagged }) => {
            const isStarred = starred.includes(q.id);
            return (
              <article key={q.id} className={`review ${status}`}>
                <div className="row between small muted">
                  <span>
                    #{i + 1} · Q{q.id} · Domain {q.domain}: {DOMAIN_NAMES[q.domain]}
                    {flagged && ' · ⚑ flagged'}
                  </span>
                  <div className="row gap-sm">
                    {onToggleStar && (
                      <button
                        className={`star-btn small ${isStarred ? 'starred' : ''}`}
                        onClick={() => onToggleStar(q.id)}
                      >
                        {isStarred ? '★ Starred' : '☆ Star'}
                      </button>
                    )}
                    <span className={`badge ${status}`}>{status}</span>
                  </div>
                </div>
                <h3>{q.question}</h3>
                <ul className="review-options">
                  {item.order.map((key, idx) => {
                    const opt = q.options.find((o) => o.key === key);
                    const cls = key === q.answer ? 'correct' : key === given ? 'wrong' : '';
                    return (
                      <li key={key} className={cls}>
                        <span className="letter">{LETTERS[idx]}</span>
                        <span className="text">{opt.text}</span>
                        {key === q.answer && <span className="mark">✔ correct</span>}
                        {key === given && key !== q.answer && <span className="mark">✘ your answer</span>}
                      </li>
                    );
                  })}
                </ul>
                <p className="rationale">
                  <b>Rationale:</b> {q.rationale}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

import { useEffect, useCallback, useRef, useState } from 'react';
import { DOMAIN_NAMES, LETTERS, formatTime, getQuestion, scoreSession } from '../quiz.js';
import { playSound } from '../utils/audio.js';

export default function Quiz({ session, onChange, onFinish, onExit, starred = [], onToggleStar, soundEnabled = true }) {
  const { items, answers, flagged, current, config, elapsed } = session;
  const item = items[current];
  const q = getQuestion(item.id);
  const chosen = answers[q.id];
  const isPractice = config.mode === 'practice';
  const revealed = isPractice && !!chosen; // practice mode locks & reveals after answering
  const isFlagged = flagged.includes(q.id);
  const isStarred = starred.includes(q.id);
  const answeredCount = Object.keys(answers).length;
  const remaining = config.timeLimit ? config.timeLimit - elapsed : null;
  const [filterNav, setFilterNav] = useState('all'); // all | unanswered | flagged

  /* ---------- timer ---------- */
  useEffect(() => {
    const t = setInterval(() => onChange((s) => ({ ...s, elapsed: s.elapsed + 1 })), 1000);
    return () => clearInterval(t);
  }, [onChange]);

  const timedOut = useRef(false);
  useEffect(() => {
    if (remaining !== null && remaining <= 0 && !timedOut.current) {
      timedOut.current = true;
      playSound('complete', soundEnabled);
      onFinish(session); // time is up: auto-submit
    }
  }, [remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- actions ---------- */
  const goTo = useCallback(
    (i) => onChange((s) => ({ ...s, current: Math.max(0, Math.min(s.items.length - 1, i)) })),
    [onChange]
  );

  const choose = useCallback(
    (key) => {
      if (revealed) return;
      if (isPractice) {
        if (key === q.answer) {
          playSound('correct', soundEnabled);
        } else {
          playSound('wrong', soundEnabled);
        }
      } else {
        playSound('click', soundEnabled);
      }
      onChange((s) => ({ ...s, answers: { ...s.answers, [q.id]: key } }));
    },
    [revealed, isPractice, q.answer, q.id, soundEnabled, onChange]
  );

  const toggleFlag = useCallback(
    () =>
      onChange((s) => ({
        ...s,
        flagged: s.flagged.includes(q.id) ? s.flagged.filter((x) => x !== q.id) : [...s.flagged, q.id],
      })),
    [q.id, onChange]
  );

  const submit = useCallback(() => {
    const unanswered = items.length - answeredCount;
    const msg = unanswered
      ? `You have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. Submit anyway?`
      : 'Submit your answers and see your results?';
    if (window.confirm(msg)) {
      playSound('complete', soundEnabled);
      onFinish(session);
    }
  }, [items.length, answeredCount, onFinish, session, soundEnabled]);

  /* ---------- keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const idx = ['1', '2', '3', '4', '5', '6'].indexOf(k) >= 0 ? Number(k) - 1 : LETTERS.map((l) => l.toLowerCase()).indexOf(k);
      if (idx >= 0 && idx < item.order.length) choose(item.order[idx]);
      else if (k === 'arrowright') goTo(current + 1);
      else if (k === 'arrowleft') goTo(current - 1);
      else if (k === 'f') toggleFlag();
      else if (k === 's' && onToggleStar) onToggleStar(q.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, choose, goTo, current, toggleFlag, onToggleStar, q.id]);

  const liveScore = isPractice ? scoreSession(session) : null;
  const isLast = current === items.length - 1;

  // Question palette filtering
  const visibleIndices = items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => {
      if (filterNav === 'flagged') return flagged.includes(it.id);
      if (filterNav === 'unanswered') return !answers[it.id];
      return true;
    });

  return (
    <div className="quiz">
      {/* ---------- status bar ---------- */}
      <div className="card status">
        <div className="row between wrap gap-sm">
          <div>
            <div className="muted small">
              Question {current + 1} of {items.length} · {config.mode === 'exam' ? 'Exam' : 'Practice'} mode
            </div>
            <div className="domain-tag">
              Domain {q.domain}: {DOMAIN_NAMES[q.domain]}
            </div>
          </div>
          <div className="row gap-sm">
            {liveScore && (
              <span className="pill">
                ✔ {liveScore.correct} · ✘ {liveScore.incorrect}
              </span>
            )}
            <span className={`pill ${remaining !== null && remaining < 60 ? 'danger' : ''}`}>
              ⏱ {remaining !== null ? formatTime(remaining) + ' left' : formatTime(elapsed)}
            </span>
          </div>
        </div>
        <div className="progress" title={`${answeredCount} of ${items.length} answered`}>
          <div style={{ width: `${(answeredCount / items.length) * 100}%` }} />
        </div>
        <div className="row between tiny muted">
          <span>{answeredCount} of {items.length} answered</span>
          <span>{items.length - answeredCount} remaining</span>
        </div>
      </div>

      <div className="quiz-body">
        {/* ---------- question ---------- */}
        <div className="card question-card">
          <div className="row between">
            <span className="qnum">Q{q.id}</span>
            <div className="row gap-sm">
              <button
                className={`btn ghost small ${isStarred ? 'starred-on' : ''}`}
                onClick={() => onToggleStar && onToggleStar(q.id)}
                title="Star question for permanent study list (Shortcut: S)"
              >
                {isStarred ? '★ Starred' : '☆ Star'}
              </button>
              <button
                className={`btn ghost small ${isFlagged ? 'flag-on' : ''}`}
                onClick={toggleFlag}
                title="Flag for review in this quiz attempt (Shortcut: F)"
              >
                {isFlagged ? '⚑ Flagged' : '⚐ Flag'}
              </button>
            </div>
          </div>
          <h2 className="question">{q.question}</h2>

          <div className="options">
            {item.order.map((key, i) => {
              const opt = q.options.find((o) => o.key === key);
              let cls = 'option';
              if (chosen === key) cls += ' selected';
              if (revealed && key === q.answer) cls += ' correct';
              if (revealed && chosen === key && key !== q.answer) cls += ' wrong';
              return (
                <button key={key} className={cls} onClick={() => choose(key)} disabled={revealed}>
                  <span className="letter">{LETTERS[i]}</span>
                  <span className="text">{opt.text}</span>
                  {revealed && key === q.answer && <span className="mark">✔</span>}
                  {revealed && chosen === key && key !== q.answer && <span className="mark">✘</span>}
                </button>
              );
            })}
          </div>

          {revealed && (
            <div className={`feedback ${chosen === q.answer ? 'ok' : 'no'}`}>
              <strong>
                {chosen === q.answer
                  ? 'Correct!'
                  : `Incorrect — the answer is ${LETTERS[item.order.indexOf(q.answer)]}.`}
              </strong>
              <p>{q.rationale}</p>
            </div>
          )}

          <div className="nav row between">
            <button className="btn" onClick={() => goTo(current - 1)} disabled={current === 0}>
              ← Previous
            </button>
            {isLast ? (
              <button className="btn primary" onClick={submit}>
                Submit quiz
              </button>
            ) : (
              <button className="btn primary" onClick={() => goTo(current + 1)}>
                Next →
              </button>
            )}
          </div>
          <div className="muted tiny hint">
            Shortcuts: <b>1–4</b> / <b>A–D</b> to answer · <b>← →</b> to navigate · <b>F</b> to flag · <b>S</b> to star
          </div>
        </div>

        {/* ---------- question navigator ---------- */}
        <aside className="card navigator">
          <div className="row between">
            <h3>Questions</h3>
            <span className="tiny muted">{answeredCount}/{items.length}</span>
          </div>

          <div className="seg tiny" style={{ margin: '8px 0' }}>
            <button className={filterNav === 'all' ? 'active' : ''} onClick={() => setFilterNav('all')}>
              All
            </button>
            <button className={filterNav === 'unanswered' ? 'active' : ''} onClick={() => setFilterNav('unanswered')}>
              Unanswered
            </button>
            <button className={filterNav === 'flagged' ? 'active' : ''} onClick={() => setFilterNav('flagged')}>
              Flagged ({flagged.length})
            </button>
          </div>

          <div className="palette">
            {visibleIndices.map(({ it, i }) => {
              const a = answers[it.id];
              let cls = 'cell';
              if (a) cls += isPractice ? (a === getQuestion(it.id).answer ? ' c-ok' : ' c-no') : ' c-ans';
              if (flagged.includes(it.id)) cls += ' c-flag';
              if (starred.includes(it.id)) cls += ' c-star';
              if (i === current) cls += ' c-cur';
              return (
                <button key={it.id} className={cls} onClick={() => goTo(i)} title={`Question ${i + 1}`}>
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="legend tiny muted">
            {isPractice ? (
              <>
                <span><i className="cell c-ok" /> correct</span>
                <span><i className="cell c-no" /> wrong</span>
              </>
            ) : (
              <span><i className="cell c-ans" /> answered</span>
            )}
            <span><i className="cell c-flag" /> flag</span>
            <span><i className="cell c-star" /> star</span>
          </div>

          <div className="stack">
            <button className="btn primary block" onClick={submit}>
              Submit quiz
            </button>
            <button className="btn ghost block" onClick={onExit}>
              Save &amp; exit
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

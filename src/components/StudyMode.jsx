import { useMemo, useState } from 'react';
import { ALL_QUESTIONS, DOMAINS, DOMAIN_NAMES, LETTERS } from '../quiz.js';

export default function StudyMode({ starred, onToggleStar, stats, onStartQuiz, onBack }) {
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [filterType, setFilterType] = useState('all'); // all | starred | wrong | never
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [revealedIds, setRevealedIds] = useState(() => new Set());
  const [jumpId, setJumpId] = useState('');

  const filtered = useMemo(() => {
    const qTerm = search.trim().toLowerCase();
    return ALL_QUESTIONS.filter((q) => {
      if (selectedDomain !== 'all' && q.domain !== Number(selectedDomain)) return false;
      const isStarred = starred.includes(q.id);
      const st = stats[q.id];
      if (filterType === 'starred' && !isStarred) return false;
      if (filterType === 'wrong' && (!st || st.lastCorrect !== false)) return false;
      if (filterType === 'never' && st && st.attempts > 0) return false;

      if (!qTerm) return true;
      if (String(q.id).includes(qTerm)) return true;
      if (q.question.toLowerCase().includes(qTerm)) return true;
      if (q.rationale.toLowerCase().includes(qTerm)) return true;
      if (q.options.some((o) => o.text.toLowerCase().includes(qTerm))) return true;
      return false;
    });
  }, [search, selectedDomain, filterType, starred, stats]);

  const toggleReveal = (id) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleJump = (e) => {
    e.preventDefault();
    const id = Number(jumpId);
    if (!id || id < 1 || id > 300) return;
    const el = document.getElementById(`study-q-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setRevealedIds((s) => new Set([...s, id]));
    }
  };

  const startQuizFromHere = () => {
    if (!filtered.length) return;
    const label =
      filterType === 'starred'
        ? `Starred questions (${filtered.length})`
        : selectedDomain !== 'all'
        ? `Domain ${selectedDomain}: ${DOMAIN_NAMES[selectedDomain]} (${filtered.length})`
        : search
        ? `Filtered: "${search}" (${filtered.length})`
        : `Custom study set (${filtered.length})`;

    onStartQuiz(
      {
        label,
        mode: 'practice',
        domains: DOMAINS.map((d) => d.id),
        shuffleQuestions: true,
        shuffleOptions: true,
        timeLimit: null,
      },
      filtered.map((q) => q.id)
    );
  };

  return (
    <div className="study-mode">
      <div className="card">
        <div className="row between wrap gap-sm">
          <div>
            <h1>Question Bank &amp; Study Guide</h1>
            <p className="muted small">
              Browse all 300 mock exam questions, study rationales, search concepts, and star questions for focused review.
            </p>
          </div>
          <button className="btn ghost" onClick={onBack}>
            ← Back to Home
          </button>
        </div>

        <div className="study-controls">
          <div className="field-group">
            <input
              type="text"
              className="search-input"
              placeholder="Search questions, options, topics (e.g. injection, rate limit)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="btn small ghost" onClick={() => setSearch('')}>
                Clear
              </button>
            )}
          </div>

          <div className="row wrap gap-sm">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="select-domain"
            >
              <option value="all">All Domains (26 domains)</option>
              {DOMAINS.map((d) => (
                <option key={d.id} value={d.id}>
                  D{d.id}. {d.name}
                </option>
              ))}
            </select>

            <div className="seg small">
              {[
                ['all', `All (${ALL_QUESTIONS.length})`],
                ['starred', `★ Starred (${starred.length})`],
                ['wrong', 'Previously missed'],
                ['never', 'Unattempted'],
              ].map(([v, l]) => (
                <button
                  key={v}
                  className={filterType === v ? 'active' : ''}
                  onClick={() => setFilterType(v)}
                >
                  {l}
                </button>
              ))}
            </div>

            <form onSubmit={handleJump} className="row gap-sm jump-form">
              <input
                type="number"
                min="1"
                max="300"
                placeholder="Q#"
                className="inline-num"
                value={jumpId}
                onChange={(e) => setJumpId(e.target.value)}
              />
              <button type="submit" className="btn small">
                Jump
              </button>
            </form>
          </div>

          <div className="row between wrap gap-sm study-subbar">
            <span className="muted small">
              Showing <b>{filtered.length}</b> of {ALL_QUESTIONS.length} questions
            </span>
            <div className="row gap-sm">
              <button
                className="btn small"
                onClick={() => {
                  setShowAllAnswers((v) => !v);
                  if (!showAllAnswers) setRevealedIds(new Set(filtered.map((q) => q.id)));
                  else setRevealedIds(new Set());
                }}
              >
                {showAllAnswers ? 'Hide all answers' : 'Show all answers'}
              </button>
              {filtered.length > 0 && (
                <button className="btn primary small" onClick={startQuizFromHere}>
                  Practice these {filtered.length} questions →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="study-list">
        {filtered.length === 0 ? (
          <div className="card muted" style={{ textAlign: 'center', padding: '40px' }}>
            No questions match your current search/filters.
          </div>
        ) : (
          filtered.map((q) => {
            const isRevealed = showAllAnswers || revealedIds.has(q.id);
            const isStarred = starred.includes(q.id);
            const st = stats[q.id];
            return (
              <article key={q.id} id={`study-q-${q.id}`} className="card study-card">
                <div className="row between small muted">
                  <span>
                    <b>Q{q.id}</b> · Domain {q.domain}: {DOMAIN_NAMES[q.domain]}
                  </span>
                  <div className="row gap-sm">
                    {st && st.attempts > 0 && (
                      <span className="stat-pill" title={`${st.correct}/${st.attempts} correct`}>
                        {Math.round((st.correct / st.attempts) * 100)}% accuracy ({st.attempts} try)
                      </span>
                    )}
                    <button
                      className={`star-btn ${isStarred ? 'starred' : ''}`}
                      onClick={() => onToggleStar(q.id)}
                      title={isStarred ? 'Remove from starred' : 'Star for review'}
                    >
                      {isStarred ? '★ Starred' : '☆ Star'}
                    </button>
                  </div>
                </div>

                <h3 className="study-question">{q.question}</h3>

                <ul className="study-options">
                  {q.options.map((opt, i) => {
                    const isAnswer = opt.key === q.answer;
                    return (
                      <li
                        key={opt.key}
                        className={`study-option ${isRevealed && isAnswer ? 'correct' : ''}`}
                      >
                        <span className="letter">{LETTERS[i]}</span>
                        <span className="text">{opt.text}</span>
                        {isRevealed && isAnswer && <span className="mark">✔ Correct Answer</span>}
                      </li>
                    );
                  })}
                </ul>

                {isRevealed ? (
                  <div className="feedback ok study-rationale">
                    <div className="row between">
                      <strong>Answer: {q.answer}</strong>
                      <button className="btn ghost tiny" onClick={() => toggleReveal(q.id)}>
                        Hide
                      </button>
                    </div>
                    <p>
                      <b>Rationale:</b> {q.rationale}
                    </p>
                  </div>
                ) : (
                  <div className="row between" style={{ marginTop: '12px' }}>
                    <button className="btn ghost small" onClick={() => toggleReveal(q.id)}>
                      Reveal answer &amp; rationale
                    </button>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

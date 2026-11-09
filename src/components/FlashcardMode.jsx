import { useState, useMemo, useEffect, useCallback } from 'react';
import { ALL_QUESTIONS, DOMAINS, DOMAIN_NAMES, LETTERS, shuffle } from '../quiz.js';
import { playSound } from '../utils/audio.js';

export default function FlashcardMode({ starred, onToggleStar, onBack, soundEnabled = true }) {
  const [deckType, setDeckType] = useState('all'); // all | starred | domain
  const [selectedDomain, setSelectedDomain] = useState(1);
  const [shuffled, setShuffled] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState(() => new Set());
  const [reviewLater, setReviewLater] = useState(() => new Set());

  // Base question pool
  const pool = useMemo(() => {
    let list = ALL_QUESTIONS;
    if (deckType === 'starred') {
      list = ALL_QUESTIONS.filter((q) => starred.includes(q.id));
    } else if (deckType === 'domain') {
      list = ALL_QUESTIONS.filter((q) => q.domain === selectedDomain);
    }
    return shuffled ? shuffle(list) : list;
  }, [deckType, selectedDomain, shuffled, starred]);

  // Reset card index & flip state when pool changes
  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [deckType, selectedDomain, shuffled]);

  const current = pool[index];
  const isStarred = current ? starred.includes(current.id) : false;

  const nextCard = useCallback(() => {
    if (index < pool.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  }, [index, pool.length]);

  const prevCard = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setFlipped(false);
    }
  }, [index]);

  const flipCard = useCallback(() => {
    playSound('click', soundEnabled);
    setFlipped((f) => !f);
  }, [soundEnabled]);

  const markMastered = useCallback(() => {
    if (!current) return;
    playSound('correct', soundEnabled);
    setMastered((m) => new Set([...m, current.id]));
    setReviewLater((r) => {
      const next = new Set(r);
      next.delete(current.id);
      return next;
    });
    nextCard();
  }, [current, soundEnabled, nextCard]);

  const markReview = useCallback(() => {
    if (!current) return;
    playSound('wrong', soundEnabled);
    setReviewLater((r) => new Set([...r, current.id]));
    setMastered((m) => {
      const next = new Set(m);
      next.delete(current.id);
      return next;
    });
    nextCard();
  }, [current, soundEnabled, nextCard]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        flipCard();
      } else if (e.key === 'ArrowRight') {
        nextCard();
      } else if (e.key === 'ArrowLeft') {
        prevCard();
      } else if (e.key === '1') {
        markReview();
      } else if (e.key === '2') {
        markMastered();
      } else if (e.key.toLowerCase() === 's' && current) {
        onToggleStar(current.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipCard, nextCard, prevCard, markReview, markMastered, onToggleStar, current]);

  if (!pool.length) {
    return (
      <div className="flashcards-screen">
        <div className="card text-center" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <h2>No questions in this deck</h2>
          <p className="muted">
            {deckType === 'starred'
              ? 'You have not starred any questions yet. Browse the Question Bank to star some!'
              : 'No questions match the selected filter.'}
          </p>
          <div className="row gap-sm" style={{ justifyContent: 'center', marginTop: '16px' }}>
            <button className="btn primary" onClick={() => setDeckType('all')}>
              Study All Questions
            </button>
            <button className="btn ghost" onClick={onBack}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcards-screen">
      <div className="card">
        <div className="row between wrap gap-sm">
          <div>
            <h1>Flashcard Study Mode</h1>
            <p className="muted small">
              Self-test your knowledge card by card. Tap or press Space to reveal the rationale.
            </p>
          </div>
          <button className="btn ghost" onClick={onBack}>
            ← Back to Home
          </button>
        </div>

        <div className="row between wrap gap-sm" style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          <div className="row gap-sm wrap">
            <div className="seg small">
              <button className={deckType === 'all' ? 'active' : ''} onClick={() => setDeckType('all')}>
                All (300)
              </button>
              <button
                className={deckType === 'starred' ? 'active' : ''}
                onClick={() => setDeckType('starred')}
                disabled={starred.length === 0}
              >
                ★ Starred ({starred.length})
              </button>
              <button className={deckType === 'domain' ? 'active' : ''} onClick={() => setDeckType('domain')}>
                By Domain
              </button>
            </div>

            {deckType === 'domain' && (
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(Number(e.target.value))}
                className="select-domain"
              >
                {DOMAINS.map((d) => (
                  <option key={d.id} value={d.id}>
                    D{d.id}. {d.name}
                  </option>
                ))}
              </select>
            )}

            <button
              className={`chip ${shuffled ? 'active' : ''}`}
              onClick={() => setShuffled((s) => !s)}
              title="Shuffle card order"
            >
              🔀 {shuffled ? 'Shuffled' : 'Sequential'}
            </button>
          </div>

          <div className="row gap-sm small">
            <span className="good">✔ {mastered.size} mastered</span>
            <span className="bad">✘ {reviewLater.size} repeat</span>
            <span className="pill">
              {index + 1} / {pool.length}
            </span>
          </div>
        </div>

        <div className="progress thin" style={{ marginTop: '10px' }}>
          <div style={{ width: `${((index + 1) / pool.length) * 100}%` }} />
        </div>
      </div>

      {/* Flip Card Container */}
      <div className="flashcard-container" onClick={flipCard}>
        <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
          {/* Card Front */}
          <div className="card-face card-front">
            <div className="row between small muted">
              <span>
                <b>Q{current.id}</b> · Domain {current.domain}: {DOMAIN_NAMES[current.domain]}
              </span>
              <button
                className={`star-btn ${isStarred ? 'starred' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(current.id);
                }}
              >
                {isStarred ? '★ Starred' : '☆ Star'}
              </button>
            </div>

            <div className="card-body">
              <h2 className="card-question">{current.question}</h2>
              <ul className="flashcard-options">
                {current.options.map((opt, i) => (
                  <li key={opt.key}>
                    <span className="letter">{LETTERS[i]}</span>
                    <span>{opt.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-footer muted tiny">
              <span>Click card or press <b>Space</b> to reveal answer</span>
            </div>
          </div>

          {/* Card Back */}
          <div className="card-face card-back">
            <div className="row between small muted">
              <span>
                <b>Q{current.id} Answer &amp; Rationale</b>
              </span>
              <span className="good font-bold">Domain {current.domain}</span>
            </div>

            <div className="card-body">
              <div className="answer-badge">
                Correct Choice: <b>{current.answer}</b> —{' '}
                {current.options.find((o) => o.key === current.answer)?.text}
              </div>

              <div className="flashcard-rationale">
                <strong>Why this is correct:</strong>
                <p>{current.rationale}</p>
              </div>
            </div>

            <div className="card-footer muted tiny">
              <span>Click card or press <b>Space</b> to flip back</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="card flashcard-actions">
        <div className="row between wrap gap-sm">
          <div className="row gap-sm">
            <button className="btn" onClick={prevCard} disabled={index === 0}>
              ← Previous
            </button>
            <button className="btn primary" onClick={flipCard}>
              {flipped ? 'Show Question' : 'Reveal Answer'}
            </button>
            <button className="btn" onClick={nextCard} disabled={index === pool.length - 1}>
              Next →
            </button>
          </div>

          <div className="row gap-sm">
            <button className="btn danger-outline" onClick={markReview} title="Shortcut: Press 1">
              ✘ Still Learning (1)
            </button>
            <button className="btn success-outline" onClick={markMastered} title="Shortcut: Press 2">
              ✔ Mastered (2)
            </button>
          </div>
        </div>
        <div className="muted tiny text-center hint" style={{ marginTop: '10px' }}>
          Shortcuts: <b>Space</b> to flip · <b>← →</b> cards · <b>1</b> repeat · <b>2</b> mastered · <b>S</b> star
        </div>
      </div>
    </div>
  );
}

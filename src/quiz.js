import data from './data/questions.json';

export const TITLE = data.title;
export const DOMAINS = data.domains;
export const ALL_QUESTIONS = data.questions;
export const DOMAIN_NAMES = Object.fromEntries(DOMAINS.map((d) => [d.id, d.name]));
export const PASS_MARK = 70; // percentage needed to "pass" a quiz attempt
export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds a new quiz session.
 * Each item stores the original question id plus the display order of option keys,
 * so answers are always checked against the original answer key even when shuffled.
 */
export function buildSession(config, questionIds) {
  let pool = questionIds
    ? ALL_QUESTIONS.filter((q) => questionIds.includes(q.id))
    : ALL_QUESTIONS.filter((q) => config.domains.includes(q.domain));

  if (config.shuffleQuestions) pool = shuffle(pool);
  if (!questionIds && config.count && config.count < pool.length) pool = pool.slice(0, config.count);

  return {
    config,
    items: pool.map((q) => ({
      id: q.id,
      order: config.shuffleOptions ? shuffle(q.options.map((o) => o.key)) : q.options.map((o) => o.key),
    })),
    answers: {}, // question id -> original option key
    flagged: [], // question ids
    current: 0,
    elapsed: 0, // seconds
    startedAt: Date.now(),
    finished: false,
  };
}

export const getQuestion = (() => {
  const map = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));
  return (id) => map.get(id);
})();

export function scoreSession(session) {
  const byDomain = new Map();
  let correct = 0;
  let answered = 0;
  for (const item of session.items) {
    const q = getQuestion(item.id);
    const given = session.answers[item.id];
    const ok = given === q.answer;
    if (given) answered++;
    if (ok) correct++;
    const d = byDomain.get(q.domain) || { id: q.domain, name: DOMAIN_NAMES[q.domain], correct: 0, total: 0 };
    d.total++;
    if (ok) d.correct++;
    byDomain.set(q.domain, d);
  }
  const total = session.items.length;
  return {
    correct,
    answered,
    incorrect: answered - correct,
    unanswered: total - answered,
    total,
    pct: total ? Math.round((correct / total) * 100) : 0,
    byDomain: [...byDomain.values()].sort((a, b) => a.id - b.id),
  };
}

export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/* ---------- localStorage helpers ---------- */
const SESSION_KEY = 'cca-quiz-session';
const HISTORY_KEY = 'cca-quiz-history';

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export const storage = {
  loadSession: () => read(SESSION_KEY, null),
  saveSession: (s) => localStorage.setItem(SESSION_KEY, JSON.stringify(s)),
  clearSession: () => localStorage.removeItem(SESSION_KEY),
  loadHistory: () => read(HISTORY_KEY, []),
  addHistory: (entry) => {
    const h = [entry, ...read(HISTORY_KEY, [])].slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
    return h;
  },
  clearHistory: () => localStorage.removeItem(HISTORY_KEY),
};

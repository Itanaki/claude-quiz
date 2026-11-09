import { useMemo } from 'react';
import { ALL_QUESTIONS, DOMAINS, DOMAIN_NAMES, PASS_MARK } from '../quiz.js';

export default function ReadinessDashboard({ stats = {}, history = [], starred = [], onStartQuiz, onBack, onImportData }) {
  // Aggregate stats across domains
  const domainAnalytics = useMemo(() => {
    return DOMAINS.map((domain) => {
      const qs = ALL_QUESTIONS.filter((q) => q.domain === domain.id);
      let attempted = 0;
      let correct = 0;
      let totalAttempts = 0;

      qs.forEach((q) => {
        const st = stats[q.id];
        if (st && st.attempts > 0) {
          attempted++;
          correct += st.correct;
          totalAttempts += st.attempts;
        }
      });

      const accuracy = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;
      const coverage = Math.round((attempted / qs.length) * 100);

      let status = 'unattempted';
      if (attempted > 0) {
        if (accuracy >= 80 && coverage >= 50) status = 'mastered';
        else if (accuracy >= 65) status = 'good';
        else status = 'needs-review';
      }

      return {
        ...domain,
        totalQuestions: qs.length,
        attempted,
        coverage,
        accuracy,
        status,
      };
    });
  }, [stats]);

  // Overall calculations
  const totalAttempted = Object.values(stats).filter((s) => s.attempts > 0).length;
  const overallCoverage = Math.round((totalAttempted / ALL_QUESTIONS.length) * 100);

  const totalHits = Object.values(stats).reduce((acc, s) => acc + s.correct, 0);
  const totalTries = Object.values(stats).reduce((acc, s) => acc + s.attempts, 0);
  const overallAccuracy = totalTries > 0 ? Math.round((totalHits / totalTries) * 100) : 0;

  // Readiness index (weighted 60% accuracy, 40% coverage)
  const readinessIndex = Math.min(100, Math.round(overallAccuracy * 0.6 + overallCoverage * 0.4));

  const startDomainQuiz = (domainId) => {
    onStartQuiz({
      label: `Domain ${domainId}: ${DOMAIN_NAMES[domainId]}`,
      mode: 'practice',
      domains: [domainId],
      count: null,
      shuffleQuestions: true,
      shuffleOptions: true,
      timeLimit: null,
    });
  };

  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      stats,
      history,
      starred,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-quiz-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (onImportData) onImportData(parsed);
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="readiness-dashboard">
      <div className="card">
        <div className="row between wrap gap-sm">
          <div>
            <h1>Exam Readiness &amp; Domain Mastery</h1>
            <p className="muted small">
              Track your preparation coverage, identify weak domains, and backup your practice progress.
            </p>
          </div>
          <button className="btn ghost" onClick={onBack}>
            ← Back to Home
          </button>
        </div>

        {/* Big Readiness Score */}
        <div className="readiness-hero">
          <div className="score-ring" style={{ '--p': readinessIndex }}>
            <span>{readinessIndex}%</span>
          </div>
          <div className="readiness-meta">
            <h2>{readinessIndex >= PASS_MARK ? 'Exam Ready! 🎯' : 'Preparation In Progress'}</h2>
            <p className="muted small">
              Readiness considers question coverage ({overallCoverage}%) and historical answer accuracy ({overallAccuracy}%).
            </p>
            <div className="stats">
              <div>
                <b>{totalAttempted} / {ALL_QUESTIONS.length}</b>
                <span>Questions Practiced</span>
              </div>
              <div>
                <b className={overallAccuracy >= PASS_MARK ? 'good' : 'bad'}>{overallAccuracy}%</b>
                <span>Average Accuracy</span>
              </div>
              <div>
                <b>{history.length}</b>
                <span>Mock Tests Taken</span>
              </div>
              <div>
                <b style={{ color: 'var(--star)' }}>{starred.length}</b>
                <span>Starred Questions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Breakdown Table */}
      <div className="card">
        <div className="row between wrap gap-sm" style={{ marginBottom: '14px' }}>
          <h2>Domain Mastery Breakdown (26 Domains)</h2>
          <span className="tiny muted">Pass threshold: {PASS_MARK}%</span>
        </div>

        <div className="table-responsive">
          <table className="table domain-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Coverage</th>
                <th>Accuracy</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {domainAnalytics.map((d) => (
                <tr key={d.id}>
                  <td>
                    <b>D{d.id}.</b> {d.name}
                  </td>
                  <td>
                    {d.attempted} / {d.totalQuestions} ({d.coverage}%)
                  </td>
                  <td>
                    <span className={d.accuracy >= PASS_MARK ? 'good' : d.attempted === 0 ? 'muted' : 'bad'}>
                      {d.attempted > 0 ? `${d.accuracy}%` : '—'}
                    </span>
                  </td>
                  <td>
                    {d.status === 'mastered' && <span className="badge correct">★ Mastered</span>}
                    {d.status === 'good' && <span className="badge correct">Proficient</span>}
                    {d.status === 'needs-review' && <span className="badge incorrect">Needs Review</span>}
                    {d.status === 'unattempted' && <span className="badge" style={{ background: 'var(--bg)' }}>Unattempted</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn small" onClick={() => startDomainQuiz(d.id)}>
                      Practice D{d.id} →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backup and Data Management */}
      <div className="card">
        <h2>Data &amp; Backup</h2>
        <p className="muted small">
          Your quiz history, accuracy analytics, and starred questions are stored locally in your browser. You can export a backup or transfer it to another computer.
        </p>
        <div className="row wrap gap-sm" style={{ marginTop: '14px' }}>
          <button className="btn" onClick={handleExport}>
            📥 Export Progress (JSON)
          </button>
          <label className="btn" style={{ cursor: 'pointer' }}>
            📤 Import Progress
            <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
          </label>
        </div>
      </div>
    </div>
  );
}

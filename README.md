# Claude Certified Associate – Foundations Quiz

A feature-complete, responsive React quiz application built from the 300-question mock exam across all 26 domains.

## Quick Start

```bash
npm install
npm run dev
```

Then open the local URL (usually http://localhost:5173).

## Features

### 1. Quiz Taking & Modes
- **Practice Mode**: Immediate right/wrong feedback and official rationale after answering each question.
- **Exam Simulation**: No feedback or hints until submission; answers can be changed at any time; full score report at the end.
- **Timer & Auto-submit**: Optional configurable countdown timer with automatic submission on expiration, or untimed with elapsed timer.
- **Full Navigation**: Previous/Next controls, question palette grid with state colors (answered, flagged, starred), jump-to-question.
- **Keyboard Shortcuts**:
  - `1–4` or `A–D`: Select option
  - `←` / `→`: Navigate previous / next question
  - `F`: Flag / unflag question for review
  - `S`: Star question to personal study bank

### 2. Flexible Question Selection
- **All 300 questions**: Full mock exam covering all 26 domains.
- **By Domain**: Multi-select any combination of the 26 domains (e.g. prompt injection, MCP, evaluation, architecture).
- **Random Set**: Pick a custom number of questions (e.g. 15, 30, 50, 100).
- **★ Starred Questions**: Practice only your starred questions.
- **Weak Areas Practice**: Auto-targets questions you answered incorrectly in past quiz sessions.
- **Choice Shuffling**: Enabled by default to eliminate option bias while preserving correct answer mapping.

### 3. Question Bank & Study Guide
- Interactive searchable catalog of all 300 questions.
- Real-time search across question stems, options, and rationales.
- Filter by domain, starred status, previously missed, or unattempted.
- One-click "Reveal All" or per-question toggle for answers and rationales.
- Launch a custom practice quiz directly from any filtered view.

### 4. Review & Analytics
- Visual score gauge and Pass / Needs Improvement indicator (70% pass mark).
- Per-domain breakdown showing score and percentage bar for each domain in the quiz.
- Filterable answer review: Missed questions, Flagged questions, or All questions.
- One-click **Retry Missed Questions** or **Retry Flagged Questions**.
- One-click **Star All Missed Questions** for long-term review.
- Recent quiz history table with scores, dates, and times.

### 5. UI & Polish
- **Dark / Light theme** with automatic preference detection and manual toggle.
- Mobile and tablet responsive layout.
- Session auto-persistence in `localStorage` so refreshing never loses your progress.

## Project Structure

- `src/data/questions.json`: All 300 questions, options, answers, and rationales.
- `src/quiz.js`: Domain definitions, session generation, scoring logic, and storage helpers.
- `src/components/StartScreen.jsx`: Question scope picker, mode selector, history table.
- `src/components/Quiz.jsx`: Interactive quiz runner with shortcuts and question palette.
- `src/components/Results.jsx`: Scorecard, domain breakdown, review list, retries.
- `src/components/StudyMode.jsx`: Searchable question bank and study guide.
- `src/App.jsx`: Top-level app routing, theme management, persistent state.
- `src/index.css`: Clean, accessible styling with full dark mode support.

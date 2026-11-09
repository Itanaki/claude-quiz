# Claude Certified Associate – Foundations Quiz

A simple React (Vite) quiz app built from the 300-question mock exam (26 domains).

## Run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Features

- **All 300 questions**, grouped into the exam's 26 domains, each with its rationale
- **Question selection**: full exam, pick specific domains, or a random set of N questions
- **Practice mode** (instant right/wrong feedback + rationale) or **Exam mode** (scored at the end)
- Shuffle question order and/or answer choices
- Optional **time limit** with auto-submit; elapsed timer otherwise
- Progress bar, question navigator grid, **flag for review**, previous/next navigation
- Keyboard shortcuts: `1–4` / `A–D` to answer, `←` `→` to navigate, `F` to flag
- **Results**: score, pass/fail (70% pass mark, set in `src/quiz.js`), per-domain breakdown
- **Review** missed / flagged / all questions with correct answers and rationales
- **Retry missed** or **retry flagged** questions
- Progress auto-saved to `localStorage` (resume after refresh) + recent attempt history

## Data

Questions live in `src/data/questions.json` (extracted from the PDF mock exam).

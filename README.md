# Scrum Practice

A comprehensive web app for preparing for Scrum.org certification exams — starting with **PSM I** and **PSPO I**, with more certs, study modes, and learner features on the roadmap.

Built from the Scrum Guide 2020. Calibrated to how the real tests read.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS
- React Router
- Zod (question-bank schema validation at load)
- Deployed on Vercel

## Local development

```bash
npm install
npm run dev         # http://localhost:5173
```

Other scripts:

```bash
npm run build       # produces dist/
npm run preview     # serves the production build locally
npm run typecheck   # tsc --noEmit
```

## Project structure

```
src/
├── main.tsx                # entry + router bootstrap
├── App.tsx                 # routes
├── index.css               # Tailwind + design tokens
├── content/
│   ├── psm1.json           # PSM I question bank (80 questions)
│   └── pspo1.json          # PSPO I question bank (80 questions)
├── lib/
│   ├── schema.ts           # Zod types for questions
│   ├── tracks.ts           # cert tracks + topic colors
│   └── utils.ts            # shuffle, set-equality helpers
├── components/
│   ├── Icons.tsx
│   ├── ExitModal.tsx
│   ├── QuizHeader.tsx
│   ├── QuizCard.tsx
│   ├── Welcome.tsx
│   └── Results.tsx
└── routes/
    ├── Home.tsx            # welcome → quiz → results flow
    └── NotFound.tsx
```

Question banks are plain JSON, validated by Zod at module load. Adding a question is a content edit — no code changes required.

## Deploy (Vercel)

The repo is configured for Vercel's Vite preset.

1. Push this repo to GitHub (see "First push" below if starting fresh).
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. When prompted, choose **Vite** as the Application Preset. Leave the other fields at their defaults.
4. Click Deploy.

Every subsequent push to `main` auto-deploys.

`vercel.json` contains the SPA rewrite rule so client-side routes don't 404 on refresh.

### First push

From this folder:

```bash
git remote add origin https://github.com/<your-username>/scrum-practice.git
git branch -M main
git push -u origin main
```

## Roadmap

This is Increment 1 of a larger build. Planned increments:

1. **Foundation + live deploy** — this increment.
2. **Study modes** — timed mock exam (80 Q / 60 min / 85%), topic drill, shuffled practice.
3. **Progress tracking** — localStorage-backed analytics, weak-area auto-feed, streaks.
4. **Flashcards + spaced repetition** — SM-2 / Leitner scheduler, missed-question review queue.
5. **Additional certs** — PSM II, PSPO II, PSK I, PAL-E, PSU I, SPS (seed sets).
6. **Reading & reference** — embedded Scrum Guide 2020, topic primers, glossary, cheat sheet.
7. **Polish & production** — a11y audit, PWA/offline, PDF export, analytics hook.

## License

Content questions are original. The Scrum Guide is © Ken Schwaber & Jeff Sutherland, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

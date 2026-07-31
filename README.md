# QuantTrain

A Duolingo-style quantitative finance learning platform. 42 interactive lessons across 13 worlds covering statistics, technical indicators, strategy design, backtesting, portfolio construction, and research communication.

## Stack

- **No build step** — vanilla HTML/CSS/JS, deploy as static files
- **Hash-based SPA** — hash routing (`#/login`, `#/map`, `#/lesson/{n}`, `#/quiz/{n}`)
- **LaTeX math** — rendered client-side to styled HTML spans (Greek, fractions, sub/superscripts)
- **Mermaid diagrams** — rendered at runtime via Mermaid.js
- **Quiz data** — Google Sheets via Apps Script (UID + phone-password login, per-student tracking)
- **Deploy** — Netlify (drag-and-drop or git-connected)

## Login & Progress

- Students log in with their college **UID** (username) and **phone number** (password), validated against the `Users` tab of a private Google Sheet
- Each student gets their own sheet tab: stats block (XP, level, streak) + timestamped event log (sign-ins, lesson visits, every quiz attempt with all answers)
- Progress syncs across devices — logging in restores XP/streak/completed quizzes from the sheet
- Guests can browse everything freely but are never recorded
- It's identity tracking, not security — content stays fully open. See `docs/GOOGLE_SHEETS.md`

## Local Development

```bash
# Serve locally
python -m http.server 8000
# Open http://localhost:8000
```

## Project Structure

```
├── index.html          # SPA shell with inlined curriculum data
├── module.md           # Canonical source (42 nodes, parsed into curriculum.json)
├── netlify.toml        # Deployment config
├── css/                # Stylesheets
├── js/                 # SPA logic
│   ├── app.js          # Hash router
│   ├── store.js        # localStorage state
│   ├── sync.js         # Apps Script client (login + tracking)
│   ├── utils.js        # DOM/formatting helpers
│   └── views/
│       ├── login.js
│       ├── worldMap.js
│       ├── lesson.js
│       └── quiz.js
├── apps-script/        # Google Apps Script backend (login validation, per-student tracking)
│   └── Code.gs
├── data/               # Generated curriculum data + roster
│   ├── curriculum.json
│   └── roster.csv      # 21 students (paste into the Users tab)
├── scripts/            # Utility scripts
│   ├── parse-md.js     # Parse module.md → curriculum.json
│   └── sync-html.js    # Sync curriculum data into index.html
├── docs/               # Documentation (AGENTS, ARCHITECTURE, APP_FLOW, DEVELOPMENT, GOOGLE_SHEETS, ...)
└── assets/             # Icons and static assets
```

## Updating Content

1. Edit `module.md` (the canonical source)
2. `node scripts/parse-md.js` → regenerates `data/curriculum.json`
3. `node scripts/sync-html.js` → updates inline data in `index.html`


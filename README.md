# QuantTrain

A Duolingo-style quantitative finance learning platform. 41 interactive lessons across 13 worlds covering statistics, technical indicators, strategy design, backtesting, portfolio construction, and research communication.

## Stack

- **No build step** — vanilla HTML/CSS/JS, deploy as static files
- **Hash-based SPA** — hash routing (`#/login`, `#/map`, `#/lesson/{n}`, `#/quiz/{n}`)
- **LaTeX math** — rendered client-side to styled HTML spans (Greek, fractions, sub/superscripts)
- **Mermaid diagrams** — rendered at runtime via Mermaid.js
- **Quiz data** — Google Sheets via Apps Script (quiz submissions)
- **Deploy** — Netlify (drag-and-drop or git-connected)

## Local Development

```bash
# Serve locally
python -m http.server 8000
# Open http://localhost:8000
```

## Project Structure

```
├── index.html          # SPA shell with inlined curriculum data
├── module.md           # Canonical source (41 nodes, parsed into curriculum.json)
├── netlify.toml        # Deployment config
├── css/                # Stylesheets
├── js/                 # SPA views (login, map, lesson, quiz)
│   └── views/
│       ├── login.js
│       ├── map.js
│       ├── lesson.js
│       └── quiz.js
├── apps-script/        # Google Apps Script for quiz submission
│   └── Code.gs
├── data/               # Generated curriculum data
│   └── curriculum.json
├── scripts/            # Utility scripts
│   ├── parse-md.js     # Parse module.md → curriculum.json
│   ├── fix-curriculum.js
│   └── sync-html.js    # Sync curriculum data into index.html
├── docs/               # Documentation
├── assets/             # Icons and static assets
└── icons/              # (empty)
```

## Updating Content

1. Edit `module.md` (the canonical source)
2. `node scripts/parse-md.js` → regenerates `data/curriculum.json`
3. `node scripts/sync-html.js` → updates inline data in `index.html`


# QuantTrain — Agent Guide

## Project Overview

- **Stack**: Vanilla HTML + CSS + JS (zero frameworks, zero build step, zero npm dependencies)
- **Routing**: Hash-based SPA (`hashchange` event) — `#/login`, `#/map`, `#/lesson/{n}`, `#/quiz/{n}`
- **State**: All user data in `localStorage` via `js/store.js`
- **Content**: `data/curriculum.json` (auto-generated from `module.md` via `scripts/parse-md.js`)
- **Deployment**: Static site on Netlify (no server, no backend)

## Critical Rules (DO NOT VIOLATE)

- NEVER add a build step, bundler, npm dependency, or framework
- NEVER add authentication or access control — content is fully open, no locked nodes
- NEVER add "locked" states to any node or world — all clickable at any time
- NEVER use purple gradients, glassmorphism (`backdrop-filter: blur`), or bounce animations
- NEVER use pure black (`#000`) or pure white (`#fff`)
- NEVER use Inter font — it is the most overused AI-generated font
- ALWAYS use `oklch()` color values from `css/tokens.css`
- ALWAYS read `DESIGN.md` before generating any CSS
- ALWAYS read `ARCHITECTURE.md` before adding a new view or feature
- ALWAYS read `CURRICULUM.md` to verify content accuracy before modifying curriculum data

## Key Files

| File | Purpose |
|---|---|
| `css/tokens.css` | Design tokens (colors, typography, spacing, radii) |
| `css/style.css` | Base reset, typography, layout utilities |
| `css/login.css` | Login/guest gate styles |
| `css/world-map.css` | Skill tree layout |
| `css/lesson.css` | Lesson content styles |
| `css/quiz.css` | Quiz styles |
| `js/app.js` | Router + app init |
| `js/store.js` | localStorageschema — read before reading/writing state |
| `js/utils.js` | DOM helpers, date formatting, scoring |
| `js/views/login.js` | Login/guest gate view |
| `js/views/worldMap.js` | World map renderer |
| `js/views/lesson.js` | Lesson renderer |
| `js/views/quiz.js` | Quiz renderer + submission |
| `data/curriculum.json` | All 41 nodes parsed from module.md |
| `scripts/parse-md.js` | Parser script to generate curriculum.json |
| `apps-script/Code.gs` | Google Apps Script for Sheets + email |

## Color Usage Rules

- **Gold** (`--gold`) — primary accent: CTAs, active nodes, completed state, progress fills, brand mark
- **Patina** (`--patina`) — secondary accent: in-progress state, active indicators, secondary success
- **Error** (`--error`) — vermilion: wrong answers, destructive actions only
- **Text hierarchy**: `--text-heading` > `--text-body` > `--text-muted` > `--text-faint`
- **Surfaces**: `--bg-primary` (page), `--bg-panel` (cards/panels), `--bg-deep` (inset areas)

## Quiz Data Submission

All quiz submissions go to a Google Apps Script Web App via `fetch()` with `mode: "no-cors"`. Schema:

```js
{
  action: "submitQuiz",
  nodeId: 5,
  name: "Alice" | "Guest",
  email: "a@b.com" | "guest@anonymous",
  timestamp: "2026-07-17T14:30:00.000Z",
  responses: [{ question: 1, selected: "B", correct: true }, ...],
  score: 7,
  total: 10
}
```

Failure must be silent — never block the user if the sheet is unreachable.

## Navigation Rules

- `#/login` → default route if no identity in store
- `#/map` → main hub after login
- `#/lesson/{n}` → lesson for node n (1-41)
- `#/quiz/{n}` → quiz for node n (1-41)
- Redirect unknown routes to `#/map`

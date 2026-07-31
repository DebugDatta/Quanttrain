# QuantTrain — Agent Guide

## Project Overview

- **Stack**: Vanilla HTML + CSS + JS (zero frameworks, zero build step, zero npm dependencies)
- **Routing**: Hash-based SPA (`hashchange` event) — `#/login`, `#/map`, `#/lesson/{n}`, `#/quiz/{n}`
- **State**: All user data in `localStorage` via `js/store.js`
- **Content**: `data/curriculum.json` (auto-generated from `module.md` via `scripts/parse-md.js`)
- **Deployment**: Static site on Netlify (frontend only); data backend = Google Apps Script web app + Google Sheets

## Critical Rules (DO NOT VIOLATE)

- NEVER add a build step, bundler, npm dependency, or framework
- NEVER add access control — login is optional identity tracking only; content stays fully open, no locked nodes
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
| `css/responsive.css` | Mobile/responsive breakpoints |
| `js/app.js` | Router + app init |
| `js/store.js` | localStorageschema — read before reading/writing state |
| `js/utils.js` | DOM helpers, date formatting, scoring |
| `js/sync.js` | Apps Script client: login validation (GET) + tracking/writes (POST) |
| `js/views/login.js` | Login/guest gate view |
| `js/views/worldMap.js` | World map renderer |
| `js/views/lesson.js` | Lesson renderer |
| `js/views/quiz.js` | Quiz renderer + submission |
| `data/curriculum.json` | All 42 nodes parsed from module.md |
| `scripts/parse-md.js` | Parser script to generate curriculum.json |
| `apps-script/Code.gs` | Apps Script backend: login validation + per-user tracking in Sheets |

## Color Usage Rules

- **Gold** (`--gold`) — primary accent: CTAs, active nodes, completed state, progress fills, brand mark
- **Patina** (`--patina`) — secondary accent: in-progress state, active indicators, secondary success
- **Error** (`--error`) — vermilion: wrong answers, destructive actions only
- **Text hierarchy**: `--text-heading` > `--text-body` > `--text-muted` > `--text-faint`
- **Surfaces**: `--bg-primary` (page), `--bg-panel` (cards/panels), `--bg-deep` (inset areas)

## Identity, Tracking & Data Submission

Login is **identity tracking only** — never access control. A tracked user is anyone whose UID + phone-number password match the `Users` tab of the sheet; everyone else (guests, unknown UIDs) can browse freely but their actions are **never written to the sheet**.

Writes go to the Apps Script web app via `fetch()` with `mode: "no-cors"` — silent failure, never block the user. Reads use GET (Apps Script sends `Access-Control-Allow-Origin: *`, readable JSON).

Login validation:

```
GET {APPS_SCRIPT_URL}?action=validateLogin&uid={uid}&pass={pass}
  → { ok: false }                                   // any invalid credentials
  → { ok: true, uid, name, year, course, xp, streak, longestStreak,
      lastActive, completedQuizzes, lastVisitedNode }
```

On success, `applyCloudProfile()` in `js/store.js` merges the profile into localStorage (cross-device restore). Guests skip all writes.

Writes (POST text/plain, no-cors, fire-and-forget; timestamps are server-side):

```js
{ action: "trackActivity", uid, event: "login" | "node_enter" | "quiz_start", nodeId }
{ action: "submitQuiz", uid, nodeId, responses: [{ question, selected, correct }], score, total, xp, streak, longestStreak, lastActive, completedQuizzes }
{ action: "syncProgress", uid, xp, streak, longestStreak, lastActive, completedQuizzes, lastVisitedNode }
```

No emails are sent. See `GOOGLE_SHEETS.md` for sheet structure and deployment steps.

## Navigation Rules

- `#/login` → default route if no identity in store
- `#/map` → main hub after login
- `#/lesson/{n}` → lesson for node n (1-42)
- `#/quiz/{n}` → quiz for node n (1-42)
- Redirect unknown routes to `#/map`

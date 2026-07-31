# QuantTrain — Development Guide

## Prerequisites

| Tool | Required For | Notes |
|---|---|---|
| Node.js 16+ | Running `scripts/parse-md.js` | Not needed for the site itself |
| Any browser | Running the site | No server needed — just open `index.html` |
| Text editor | Editing all files | VS Code, Cursor, etc. |
| Git (optional) | Version control | Recommended |
| Netlify account (optional) | Deployment | Free tier is sufficient |

The website itself has **zero build step, zero npm dependencies, zero bundlers**. It's pure HTML/CSS/JS loaded from static files.

---

## Quick Start

### 1. Run the site locally

Just open `index.html` in your browser. That's it. No server, no install.

Alternatively, use any static file server for better MIME-type handling:

```bash
# Python 3
python -m http.server 8000

# Node.js (if you have npx)
npx serve .
```

### 2. Edit content

1. Open `module.md` — this is the source of truth for all curriculum content
2. Make your edits
3. Run the parser:

```bash
node scripts/parse-md.js
```

4. This regenerates `data/curriculum.json`
5. Refresh the browser to see changes

### 3. Make code changes

- Edit any `.html`, `.css`, or `.js` file
- Refresh the browser — no build step needed

---

## Project Walkthrough

### `index.html` — SPA Shell

The single HTML file that loads everything:

```
├── Loads CSS (tokens.css → style.css → view-specific CSS)
├── Loads CDN libraries (highlight.js, mermaid.js)
├── Loads JS (store.js → utils.js → views/*.js → app.js)
└── Contains view containers: <div id="view-login">, <div id="view-map">, etc.
```

**Never add**:
- npm packages or node_modules
- build scripts or bundler config
- framework CDN scripts (React, Vue, etc.)

### `css/tokens.css` — Design Tokens

All colors, typography, spacing, and radii in one file. Uses CSS custom properties with `oklch()` values. Every other CSS file references these tokens. **Do not hardcode raw color values anywhere else.**

```css
/* Example — always reference via var() */
background-color: var(--gold);
color: var(--text-heading);
border: 1px solid var(--hairline-gold);
```

### `css/style.css` — Base Styles

- CSS reset (box-sizing, margin/padding removal)
- Body defaults (background, font, text color)
- Typography (h1-h6, p, code, links)
- Utility classes (`.flex`, `.grid`, `.sr-only`)
- Scrollbar styling

### `css/login.css`, `world-map.css`, `lesson.css`, `quiz.css`

View-specific styles. These are loaded after `style.css` and only apply to their respective views.

### `js/store.js` — State Management

Interface to `localStorage` under the key `"quanttrain"`.

**Always use store functions — never access `localStorage` directly.**

```javascript
// Reading state
store.getIdentity()       // → { type, uid?, name?, year?, course? }
store.getProgress()       // → { completedNodes, completedQuizzes, objectivesChecked, ... }
store.getXp()             // → { total, history }
store.getStreak()         // → { current, longest, lastActive }
store.getBadges()         // → ["first_lesson", ...]
store.getAllData()        // → whole store (used by js/sync.js snapshots)
store.getLevel(xp)        // → level number
store.getXpForNextLevel(xp) // → { current, needed }

// Writing state
store.setIdentity({ type: "tracked", uid: "2605032", name: "Alice", year: "SY", course: "BSc" })
store.clearIdentity()         // logout (keeps progress)
store.applyCloudProfile(profile)  // merge login response into store (cross-device restore)
store.setProgress(p)          // replaces progress object (also checks streak)
store.addXp(amount, source, nodeId)  // e.g. addXp(10, "lesson", 5)
store.addBadge(b)

// Utility
store.resetAll()          // Clears everything (use sparingly)
```

### `js/utils.js` — Helpers

```javascript
// DOM
el(tag, attrs, children)     // Create element with attributes
qs(selector)                 // querySelector shorthand
qsa(selector)                // querySelectorAll shorthand

// Formatting
formatDate(isoString)        // → "17 Jul 2026"
formatTime(isoString)        // → "14:30"
formatScore(score, total)    // → "7/10 (70%)"
formatXP(xp)                 // → "1,240"

// Scoring
calculateLevel(xp)           // → { level: 4, current: 1240, next: 2000, progress: 62% }
calculateStreak(lastActive)  // → { current: 7, isActive: true }
```

### `js/app.js` — Router

Hash-based SPA router. Listens to `hashchange` and `DOMContentLoaded`.

```javascript
const routes = {
  "login":  { view: loginView,  container: "#view-login" },
  "map":    { view: mapView,    container: "#view-map" },
  "lesson": { view: lessonView, container: "#view-lesson" },
  "quiz":   { view: quizView,   container: "#view-quiz" },
};

function router() {
  const hash = location.hash.replace("#/", "").split("/");
  const route = hash[0] || "login";
  const param = hash[1];
  // ...show correct view, hide others, call view.render(param)
}
```

### `js/views/login.js` — Login View

Renders the full-screen login/guest gate form. On submit, calls `sync.validateLogin(uid, pass)`; invalid credentials (or unreachable sheet) show the generic "Wrong credentials" error. On success calls `store.applyCloudProfile(profile)` then routes to `#/map`. Guest Access sets `{ type: "guest" }` — guests are never written to the sheet.

### `js/sync.js` — Apps Script Client

Single module for all sheet traffic:
- `validateLogin(uid, pass)` — GET, returns the profile JSON or `{ ok: false }`
- `track(event, nodeId)` — POST `login` / `node_enter` / `quiz_start` (no-ops for guests)
- `pushQuiz(nodeId, responses, score, total)` — POST full attempt + progress snapshot
- `syncProgress()` — POST XP/streak/completed snapshot (called after lesson XP award)

All writes are `mode: "no-cors"` fire-and-forget — silent failure is by design. `APPS_SCRIPT_URL` is defined here.

### `js/views/worldMap.js` — World Map View

Renders the skill tree with all 13 worlds. Draws node circles, connecting lines, progress bars, and the top stats bar. Reads from `curriculum` data and `store`.

### `js/views/lesson.js` — Lesson View

Renders lesson content from `curriculum.json`. Handles:
- Reading progress scroll tracking
- Objective checkboxes (persisted)
- Code block rendering with highlight.js
- Mermaid diagram rendering
- XP award logic

### `js/views/quiz.js` — Quiz View

Handles the full quiz lifecycle:
- Question display (single/multi-select)
- Immediate answer feedback
- Score calculation
- localStorage save
- Google Sheets submission (async, silent failure, delegated to `js/sync.js`)
- Tracks `quiz_start` events (tracked users only)

The Apps Script URL lives in `js/sync.js` — update it there when redeploying. `quiz.js` imports `pushQuiz`/`track` from `js/sync.js`; it has no direct fetch calls.

### `data/curriculum.json` — Curriculum Data

Auto-generated by `scripts/parse-md.js`. Contains all 42 nodes structured as JSON.

**Never edit this file directly.** Edit `module.md` and re-run the parser.

### `scripts/parse-md.js` — Markdown Parser

Node.js script that reads `module.md` and outputs `data/curriculum.json`.

```bash
# Run from project root
node scripts/parse-md.js
```

The parser:
1. Splits `module.md` by world boundaries (`--- ---`)
2. Splits each world by node boundaries (`## Node`)
3. Extracts hook, objectives, sections, resources, quiz
4. Handles code blocks, mermaid blocks, tables
5. Recognizes `✅` as the correct answer marker in quiz options
6. Writes a validated JSON file

### `apps-script/Code.gs` — Google Apps Script

This file is **not deployed to Netlify**. It's a reference — you copy-paste it into the Google Sheet's Apps Script editor.

---

## Common Workflows

### How to update lesson content

1. Open `module.md`
2. Find the node you want to edit
3. Make content changes (text, code, diagrams, resources)
4. Run `node scripts/parse-md.js`
5. Refresh the browser

### How to add a new quiz question

1. Open `module.md`
2. Find the node's quiz section
3. Add a new numbered question following the existing format
4. Mark the correct answer with `✅` at the end of the option text
5. Run `node scripts/parse-md.js`
6. Refresh the browser

### How to change a color

1. Open `css/tokens.css`
2. Find the token (e.g., `--gold`)
3. Change the `oklch()` value
4. Refresh the browser — all components using that token update automatically

### How to add a new view/route

1. Create `js/views/newView.js` with a `render()` function
2. Create `css/new-view.css`
3. Add a `<div id="view-new-view">` container in `index.html`
4. Add the route entry in `js/app.js` routes object
5. Load the new CSS in `index.html`
6. Update `AGENTS.md` and `ARCHITECTURE.md` with the new route

### How to test quiz submissions

1. Log in with a roster UID (e.g. `2605032` / `8521414230`)
2. Complete any quiz
3. Check the Google Sheet → the student's tab should have a `quiz_attempt` row + updated XP
4. Writes are `no-cors` — no console confirmation is expected; check the sheet directly

### How to reset progress during development

```javascript
// In browser DevTools console:
localStorage.removeItem("quanttrain");
location.reload();
```

### How to debug curriculum.json structure

```javascript
// In browser DevTools console:
fetch("data/curriculum.json")
  .then(r => r.json())
  .then(d => console.log(d.worlds[0].nodes[0].quiz))
```

---

## Google Sheets Setup (Quick Reference)

See `GOOGLE_SHEETS.md` for full instructions. TL;DR:

1. Google Sheet `1SlEkPvIiGFKej2XnSgfwi-jdj1KKnZVYB7ND9wBmfgA` (owned by `datadebug0@gmail.com`)
2. Extensions → Apps Script → paste `apps-script/Code.gs` (its `SPREADSHEET_ID` is already set)
3. Paste the 21-row roster CSV into the `Users` tab (headers: UID, Password, Name, Year, Course)
4. Deploy → New deployment → Web app (Execute as: Me, Access: Anyone)
5. `APPS_SCRIPT_URL` is already hardcoded in `js/sync.js`
6. After any `Code.gs` change: Deploy → Manage deployments → **New version** (URL stays the same)

---

## Netlify Deployment

### Option A: Drag and Drop

1. Go to [app.netlify.com](https://app.netlify.com)
2. Drag the entire `quanttrain/` folder onto the upload area
3. Site is live at `random-name.netlify.app`

### Option B: Git Connected

1. Create a GitHub/GitLab repo with this project
2. Log in to [app.netlify.com](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your repo
5. Deploy settings:
   - **Build command**: (leave empty — no build step)
   - **Publish directory**: (leave as root — `.`)
6. Click "Deploy site"

### The `netlify.toml` File

```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This ensures all routes work on refresh.

---

## File Dependency Graph

```
module.md
    │
    ▼  (node scripts/parse-md.js)
data/curriculum.json
    │
    ▼  (node scripts/sync-html.js → inlined into index.html)
index.html
    │
    ├── css/tokens.css          (no deps)
    ├── css/style.css           (depends on tokens.css)
    ├── css/login.css           (depends on tokens.css + style.css)
    ├── css/world-map.css       (depends on tokens.css + style.css)
    ├── css/lesson.css          (depends on tokens.css + style.css)
    ├── css/quiz.css            (depends on tokens.css + style.css)
    │
    ├── CDN: highlight.js       (code coloring)
    ├── CDN: mermaid.js         (diagram rendering)
    │
    ├── js/store.js             (no deps)
    ├── js/utils.js             (no deps)
    ├── js/sync.js              (depends on store.js)
    ├── js/views/login.js       (depends on store.js, utils.js, sync.js)
    ├── js/views/worldMap.js    (depends on store.js, utils.js, curriculum.json)
    ├── js/views/lesson.js      (depends on store.js, utils.js, curriculum.json, sync.js)
    ├── js/views/quiz.js        (depends on store.js, utils.js, curriculum.json, sync.js)
    └── js/app.js               (depends on all views, store.js, utils.js)
```

---

## Troubleshooting

| Problem | Likely Cause | Solution |
|---|---|---|
| `curriculum.json` is out of sync with `module.md` | Forgot to run the parser | Run `node scripts/parse-md.js` |
| Login always says "Wrong credentials" | Apps Script deployment still on old code version | Deploy → Manage deployments → New version |
| Quiz submissions not reaching sheet | Wrong Apps Script URL or UID not in `Users` tab | Check `APPS_SCRIPT_URL` in `js/sync.js`; check roster in the sheet |
| Mermaid diagram not rendering | Syntax error in mermaid code | Check browser console for mermaid errors |
| Code blocks not highlighted | highlight.js failed to load | Check network tab for CDN URL |
| Site shows blank page | Syntax error in JS | Check browser console for errors |
| Node not found when navigating | URL has wrong node ID (e.g., `#/lesson/99`) | Redirects to `#/map` |
| localStorage progress lost | Browser storage cleared | Normal — user starts fresh |
| Styles look wrong | tokens.css not loaded first | Check `<link>` order in `index.html` |

---

## Coding Conventions

### JavaScript
- ES6 modules not used (no bundler). Use IIFE patterns or script load order.
- All code in `"use strict"` mode
- 2-space indentation
- CamelCase for variables and functions
- Descriptive function names: `renderWorldMap`, `handleQuizSubmit`, `loadCurriculum`
- No external JS libraries beyond CDN-loaded highlight.js and mermaid.js

### CSS
- All colors via `var(--token)` from `tokens.css` — never hardcode
- Class naming: `.view-name-element-state` (e.g., `.map-node-completed`, `.lesson-code-block`)
- 2-space indentation
- Mobile-first responsive design
- No `!important` unless absolutely necessary (document with comment)

### HTML
- Semantic HTML5 elements (`<header>`, `<main>`, `<section>`, `<nav>`)
- IDs for view containers and interactive elements
- `data-*` attributes for state binding
- No inline styles

---

## Development Bad Practices to Avoid

- ❌ Adding npm packages or a `package.json` with dependencies
- ❌ Adding a framework (React, Vue, Svelte, etc.)
- ❌ Adding a CSS framework (Tailwind, Bootstrap, etc.)
- ❌ Using a bundler (Webpack, Vite, Parcel, etc.)
- ❌ Editing `curriculum.json` directly (edit `module.md` + re-run parser)
- ❌ Hardcoding colors (use tokens.css variables)
- ❌ Using `localStorage` directly instead of store functions
- ❌ Adding authentication or server-side code
- ❌ Blocking the user on quiz submission failure

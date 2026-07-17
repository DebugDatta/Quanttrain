# QuantTrain — Architecture

## File Structure

```
C:\Users\PRAMIT\Downloads\QuantTrain\
│
├── index.html                 # SPA shell — loads all CSS + JS
├── netlify.toml               # Netlify redirect rules
├── AGENTS.md                  # AI agent instructions (read this first)
├── ARCHITECTURE.md            # This file — technical architecture
├── CURRICULUM.md              # Original curriculum content (module.md)
├── DESIGN.md                  # Design system & visual language
├── GOOGLE_SHEETS.md           # Sheets integration guide
│
├── module.md                  # Source of truth for all content (3756 lines, 41 nodes)
│
├── scripts/
│   └── parse-md.js            # Node.js script: reads module.md → writes data/curriculum.json
│
├── data/
│   └── curriculum.json        # Auto-generated — all 41 nodes in structured JSON
│
├── css/
│   ├── tokens.css             # Design tokens (colors, typography, spacing, radii)
│   ├── style.css              # Base reset, typography, layout, utilities
│   ├── login.css              # Login/guest gate styles
│   ├── world-map.css          # Skill tree layout for 12 worlds
│   ├── lesson.css             # Lesson content, reading progress bar
│   └── quiz.css               # Quiz questions, feedback states
│
├── js/
│   ├── app.js                 # Hash router + application initialization
│   ├── store.js               # localStorage wrapper (identity, progress, XP, streaks, badges)
│   ├── utils.js               # DOM helpers, date formatting, scoring, event utilities
│   │
│   └── views/
│       ├── login.js           # Login/guest gate view
│       ├── worldMap.js        # World map with skill tree
│       ├── lesson.js          # Lesson content renderer
│       └── quiz.js            # Quiz renderer with submission
│
├── assets/
│   └── icons/                 # SVG icons (logo mark, checkmark, flame, star, etc.)
│
└── apps-script/
    └── Code.gs                # Google Apps Script — copy into Google Sheet
```

## Routing

Hash-based SPA using the `hashchange` event on `window`.

| Hash | View | File | Description |
|---|---|---|---|
| `#/login` | Login / Guest Gate | `js/views/login.js` | Default route if no identity in store |
| `#/map` | World Map | `js/views/worldMap.js` | Main hub — skill tree with all 12 worlds |
| `#/lesson/{n}` | Lesson | `js/views/lesson.js` | Node content page (n = 1-41) |
| `#/quiz/{n}` | Quiz | `js/views/quiz.js` | Interactive quiz (n = 1-41) |

**Router logic** (`js/app.js`):
1. Listen for `hashchange` and on initial `DOMContentLoaded`
2. Parse hash to determine route and params
3. If no identity in store and route is not `#/login` → redirect to `#/login`
4. If identity exists and route is `#/login` → redirect to `#/map`
5. Hide all view containers, show the matching one
6. Call the corresponding view's `render()` function
7. Unknown routes → redirect to `#/map`

## Data Flow

```
module.md  (source of truth)
    │
    ▼  (run: node scripts/parse-md.js)
data/curriculum.json  (all 41 nodes structured)
    │
    ▼  (loaded via <script> tag or fetch in app.js)
JavaScript Objects: worlds → nodes → sections → quiz questions
    │
    ├── worldMap.js  ← reads worlds[] + progress from store
    ├── lesson.js    ← reads nodes[n] + objectives/reading state from store
    └── quiz.js      ← reads quiz[n] + submits score to store + Google Sheets
    │
    ▼
store.js  (localStorage interface)
```

## Store Schema (`js/store.js`)

All state is in `localStorage` under the key `"quanttrain"`. The store module provides getter/setter functions — never access `localStorage` directly.

```js
// Identity
identity: {
  type: "tracked" | "guest",
  name: "Alice Sharma" | null,    // only if tracked
  email: "alice@college.edu" | null  // only if tracked
}

// Progress
progress: {
  completedNodes: [1, 2, 5],              // node IDs where lesson was completed
  completedQuizzes: {                      // node ID → best score
    "1": { score: 4, total: 5 },
    "5": { score: 9, total: 10 }
  },
  objectivesChecked: {                     // node ID → objective indices
    "5": [0, 2, 3]
  },
  lastVisitedNode: 5,                      // for "continue where you left off"
  lastVisitedView: "lesson" | "quiz"
}

// XP & Leveling
xp: {
  total: 1240,
  history: [                               // for future analytics
    { date: "2026-07-15", amount: 10, source: "lesson", nodeId: 1 },
    { date: "2026-07-16", amount: 35, source: "quiz", nodeId: 5 }
  ]
}

// Streaks
streak: {
  current: 7,                              // consecutive days with activity
  longest: 14,
  lastActive: "2026-07-17"                 // YYYY-MM-DD
}

// Badges
badges: ["first_lesson", "world_traveler"]

// Dark mode (not used for now — dark-first always)
darkMode: true
```

### Level Thresholds

| Level | XP Required |
|---|---|
| 1 | 0 |
| 2 | 100 |
| 3 | 250 |
| 4 | 500 |
| 5 | 1000 |
| 6 | 2000 |
| 7 | 3500 |
| 8 | 5000 |
| 9 | 7500 |
| 10 | 10000 |

### XP Sources

| Action | XP | Condition |
|---|---|---|
| Read a lesson | +10 | One-time per node |
| Correct quiz answer | +5 | Per correct answer |
| Perfect quiz (10/10) | +10 bonus | All correct |
| World complete | +50 bonus | All nodes in world completed |

### Streak Rules

- A day is active if any progress is saved (lesson visit, quiz attempt)
- Check streak on every store write: compare `lastActive` to today
- If gap > 48 hours → streak resets to 1
- If same day → no change
- If consecutive day → increment

## curriculum.json Schema

```js
{
  "worlds": [
    {
      "id": 0,
      "title": "Orientation",
      "subtitle": "",
      "description": "...",
      "nodes": [
        {
          "id": 1,
          "worldId": 0,
          "title": "Welcome to Quant Research",
          "order": 1,
          "hook": "Every hedge fund trade...",
          "objectives": [
            "Define quantitative finance and distinguish it from general finance",
            "..."
          ],
          "sections": [
            {
              "type": "text",
              "heading": "What is Quantitative Finance?",
              "content": "Quantitative finance is the application of..."
            },
            {
              "type": "code",
              "heading": "",
              "language": "python",
              "code": "import numpy as np\n...",
              "output": ""
            },
            {
              "type": "mermaid",
              "heading": "",
              "code": "graph TD\n  A[Quantitative Finance] --> B[Mathematics]"
            },
            {
              "type": "table",
              "heading": "Research vs Trading",
              "headers": ["", "Research", "Trading"],
              "rows": [
                ["Goal", "Discover and validate", "Execute and manage"]
              ]
            }
          ],
          "resources": [
            {
              "label": "Khan Academy — Finance and Capital Markets",
              "url": "https://www.khanacademy.org/..."
            }
          ],
          "quiz": [
            {
              "question": "What best distinguishes a quant researcher's job from a trader's?",
              "type": "single",
              "options": [
                { "text": "Researchers use computers, traders don't", "correct": false },
                { "text": "Researchers validate ideas before capital is risked; traders execute and manage live positions", "correct": true },
                { "text": "Traders don't use data", "correct": false },
                { "text": "There's no meaningful difference", "correct": false }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Section Types

| Type | Description | Properties |
|---|---|---|
| `text` | Paragraph text | `heading`, `content` (HTML or markdown text) |
| `code` | Code block | `heading`, `language`, `code`, `output` |
| `mermaid` | Mermaid diagram | `heading`, `code` (mermaid source) |
| `table` | Data table | `heading`, `headers[]`, `rows[][]` |

### Quiz Question Types

| Type | UI | Description |
|---|---|---|
| `single` | Radio buttons | Select one correct answer |
| `multi` | Checkboxes | Select all that apply |

## Google Sheets Submission

Quiz results POST to a Google Apps Script Web App:

```
POST {APPS_SCRIPT_URL}
Content-Type: application/json
Body: {
  action: "submitQuiz",
  nodeId: 5,
  name: string,
  email: string,
  timestamp: string (ISO 8601),
  responses: [{ question: number, selected: string, correct: boolean }],
  score: number,
  total: number
}
```

See `GOOGLE_SHEETS.md` for setup instructions.

## External Libraries (CDN)

| Library | CDN URL | Used In |
|---|---|---|
| highlight.js | `//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.x/highlight.min.js` | `lesson.js` — code syntax highlighting |
| mermaid.js | `//cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js` | `lesson.js` — diagram rendering |

Both loaded via `<script>` tags in `index.html`. No npm, no bundler, no build step.

# QuantTrain — Application Flow

## Overview

```
User opens site
        │
        ▼
  ┌──────────────────────────────┐
  │        #/login               │
  │  (Default route — no        │
  │   identity in localStorage)  │
  └──────────┬───────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
  Guest           Tracked User
  ─────           ────────────
  Click           Enter UID +
  "Guest          phone-number
  Access"         password, click
                  "Enter the Lab"
    │                 │
    ▼                 ▼
  store.js          js/sync.js
  { type:           GET ?action=validateLogin
    "guest" }       ├─ {ok:false} → "Wrong credentials"
                    └─ {ok:true} → applyCloudProfile()
                        store.js
                        { type: "tracked", uid, name,
                          year, course }
    │                 │
    └────────┬────────┘
             ▼
  ┌──────────────────────────────┐
  │         #/map                │
  │  World Map (Main Hub)       │
  └──────────┬───────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
  Lesson           Quiz
  #/lesson/{n}     #/quiz/{n}
```

---

## Screen 1: Login / Guest Gate (`#/login`)

### State: First Visit (no identity in store)

```
┌──────────────────────────────────────────────┐
│                                              │
│                   ⬛                         │
│               QUANT TRAIN                    │
│    Quantitative Research Learning Path        │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  UID (Username)    [______________]  │    │
│  │  Password          [______________]  │    │
│  │                                      │    │
│  │  [  Enter the Lab  ──────▶  ]       │    │
│  │  ───────── or ─────────              │    │
│  │  [  Guest Access  ]                 │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ℹ️  Login with your UID & phone-number     │
│     password to sync progress across        │
│     devices — not required to browse.       │
└──────────────────────────────────────────────┘
```

### Actions

| Action | Trigger | What Happens | localStorage | Next Route |
|---|---|---|---|---|
| Enter the Lab | Click button | Async GET `validateLogin` → on `{ok:true}` apply cloud profile (XP/streak/completed restored) | `{ type: "tracked", uid, name, year, course }` | `#/map` |
| Guest Access | Click button | No validation, no cloud sync | `{ type: "guest" }` | `#/map` |

### State: Returning Visit (identity exists in store)
- Page auto-redirects to `#/map` on load
- No login screen shown
- To reset: click "Logout" in map header → clears local identity + progress → redirects to `#/login` (tracked users restore from cloud on next login)

### Validation Rules
- UID and password must both be non-empty
- Any invalid credentials (wrong UID, wrong password, sheet unreachable) → inline error **"Wrong credentials"** — never says which one was wrong
- Guest Access skips all validation

### Edge Cases
- **Cleared localStorage**: User returns to login as if first visit
- **Wrong credentials**: Show inline error "Wrong credentials"
- **Network down at login**: Same "Wrong credentials" error (silent fail)
- **Logout**: `resetAll()` — clears identity + local progress/XP/streak/badges and the login form, redirects to login. Tracked users are restored from the cloud on next login (their sheet data is preserved), so no cross-student leakage on shared devices; guests start fresh.
- **Cross-device**: Logging in restores cloud XP/streak/completed quizzes via `applyCloudProfile()` (local wins where newer)

---

## Screen 2: World Map (`#/map`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ⬛ QuantTrain    [XP: 1,240]  Lv4    🔥 7-day streak    [⏻]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Overall Progress  [████████████░░░░░░░░░░]  12 / 42 nodes     │
│                                     3 / 13 worlds               │
│                                                                  │
│  Continue where you left off:  [Node 5 — Descriptive Stats]     │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  WORLD 0 — Orientation                         ▓▓▓▓▓▓▓░░  1/1  │
│    (1) ──○──                                             100%  │
│     ●  Completed                                                │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  WORLD 1 — Foundations                          ▓▓▓▓▓░░░░  5/8  │
│    (2) ──(3)──(4)──(5)──(6)──○──○──○                  62%     │
│     ●  ●  ●  ●  ●  ●  ●  ●                                     │
│        In progress → Node 5                                      │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  WORLD 2 — Probability & Statistics              ▓▓▓░░░░░░  2/3 │
│    (9) ──(10)──○──○──○──○                            66%       │
│     ●  ●                                                         │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  ... (Worlds 3 through 12, scrollable)                          │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  WORLD 12 — Professional Quant Research         ░░░░░░░░░  0/3  │
│    ○──○──○                                               0%     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Element Details

| Element | Data Source | Behavior |
|---|---|---|
| XP counter | `store.xp.total` | Shows current total + level badge |
| Streak flame | `store.streak.current` | Shows days count + flame icon |
| Overall progress | `store.progress.completedNodes.length / 42` | Gold fill bar |
| Continue button | `store.progress.lastVisitedNode` | Shows last visited node, clickable |
| World rows | `curriculum.worlds[]` | Worlds ordered by ID |
| World progress bar | `completedInWorld / totalInWorld` | Patina fill, percentage shown |
| World progress % | Count of completed nodes in that world | Updates live |
| Node circles | Each world's `nodes[]` | See states below |

### Node Circle States

| State | Visual | Click Behavior |
|---|---|---|
| Completed (lesson + quiz) | Gold fill `--gold` + white checkmark | Goes to lesson (can retake quiz) |
| Lesson completed, quiz pending | Gold fill with dot indicator | Goes to quiz |
| Never visited | Dimmed outline `--text-faint` | Goes to lesson |
| "Continue" (last visited) | Patina glow + subtle pulse | Goes to last visited view |

**No locked state.** Every circle is clickable regardless of progress.

### Top Bar Actions

| Icon/Button | Action |
|---|---|
| ⬛ QuantTrain logo | Refresh map (no-op if already on map) |
| XP/Level | Expand tooltip showing progress to next level |
| 🔥 Streak | Expand tooltip with streak calendar |
| ⏻ Logout | `resetAll()` → clear identity + local progress → redirect `#/login` (tracked users restore from cloud) |

### Syllabus Drawer

A persistent **Syllabus** floating button (bottom-right) is available on the map, lesson, and quiz pages; it is hidden on the login screen. Available to tracked users and guests.

- Fixed slide-over panel from the right (`--bg-panel`, hairline border, 220ms `--ease-out` translate; backdrop fades 150ms).
- Header shows "Course Outline" + overall count (`completed / 42 nodes`) + close `×`.
- Body lists all 13 worlds as collapsible groups (all open by default); world header toggles its node list and rotates a chevron, `aria-expanded` tracks state.
- Each node row shows a progress dot (gold = lesson + quiz done, patina = lesson done, ring = unvisited) + title, and links to `#/lesson/{id}`.
- The drawer is built lazily on first open, so progress dots are always fresh.
- Close: backdrop click, `×`, Escape (refocuses the Syllabus button), or any navigation (`hashchange` removes the drawer from the DOM).
- The floating button is responsive: safe-area aware (notch / home indicator) and compacted at 768 / 480 / 360px breakpoints.

### Edge Cases
- **No visits yet**: All circles dimmed, "Continue" button hidden
- **World complete**: Full patina bar, 100% label, "Completed" badge on world title
- **All complete**: Confetti/gold animation on overall bar, "🎉 All nodes completed!"

---

## Screen 3: Lesson Page (`#/lesson/{n}`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Map                 Node 5 of 42    [XP: +10 avail]  │
│  [████████████████░░░░░░░░░░░░░░░░░░░░░░░░░]  32% read          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WORLD 1 — Foundations                                           │
│  Node 5: Descriptive Statistics                                  │
│                                                                  │
│  🎯 Hook                                                         │
│  "Before you can say 'this strategy is good,' you need...       │
│                                                                  │
│  📌 Learning Objectives                                          │
│  ☐ Distinguish population vs sample                              │
│  ☑ Compute and interpret mean, median, mode                     │
│  ☐ Compute variance, standard deviation                          │
│  ☐ Detect outliers using Z-scores                               │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  Population vs Sample                                            │
│                                                                  │
│  A population is the entire group you care about...              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ import numpy as np                                          │ │
│  │                                                             │ │
│  │ returns = [0.01, -0.02, 0.015, 0.03, -0.10]                │ │
│  │ mean_return = np.mean(returns)                              │ │
│  │ median_return = np.median(returns)                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──── Mermaid Diagram ───────────────────────────────────────┐  │
│  │  graph LR                                                   │  │
│  │    A[Raw data] --> B[Z-score] --> C{Outlier?}              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  Variance & Standard Deviation                                   │
│                                                                  │
│  Standard deviation is literally what the finance industry       │
│  calls "volatility." This is the single most important number    │
│  in this node.                                                   │
│                                                                  │
│  ┌────────────┬──────────┬──────────────────────┐                │
│  │ Metric     │ Formula  │ Usage                │                │
│  ├────────────┼──────────┼──────────────────────┤                │
│  │ Variance   │ σ²       │ Spread of returns    │                │
│  │ Std Dev    │ σ        │ Volatility measure   │                │
│  └────────────┴──────────┴──────────────────────┘                │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  🔗 Free Resources                                               │
│  ● StatQuest — Statistics Fundamentals (YouTube)                 │
│  ● Khan Academy — Descriptive Statistics                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  [  📝 Take Quiz  ────────────────────────────────▶  ]     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Reading Progress Bar

- Fixed position below the header bar
- Width = `(scrollTop / (scrollHeight - clientHeight)) * 100` percent
- Fill color: `--gold`
- Label: "X% read" at the right end
- Persisted in store so "continue where you left off" can restore scroll position

### Learning Objectives

- Each objective is a clickable checkbox row: `☐` or `☑`
- Toggle state stored in `store.progress.objectivesChecked[nodeId]`
- Persisted across visits, and synced to the sheet via `syncProgress()` on toggle (restored on login, including on other devices)

### Content Sections

| Section Type | Rendering | Source Field |
|---|---|---|
| Hook | Blockquote style with 🎯 | `node.hook` |
| Objectives | Checkbox list | `node.objectives[]` |
| Text | HTML paragraph with subheading | `section.content` + `section.heading` |
| Code | Dark panel with highlight.js + gold left border, line numbers, copy button | `section.code` + `section.language` |
| Mermaid | Rendered diagram with mermaid.js (dark theme config) | `section.code` |
| Table | Clean bordered table, header row highlighted | `section.headers[]` + `section.rows[][]` |
| Resources | Bulleted list with external link icon | `node.resources[].label` + `.url` |

### XP Award

- First time completing a lesson → +10 XP (stored in `xp.history` with source `"lesson"`)
- Award is gated by `alreadyDone` = lesson XP in history OR node already in `completedNodes` (restored from cloud after logout/other devices) — no double award, no wrong "+10 available" label
- XP badge shown in header "XP: +10 available" or "XP: +0 (done)"

### "Take Quiz" Button

- Gold CTA button at the bottom
- Navigates to `#/quiz/{n}`
- If quiz already completed, shows: "📝 Retake Quiz (was 7/10)"

### Edge Cases
- **Direct URL access** (`#/lesson/99`): Redirect to `#/map` with toast "Node not found"
- **Mermaid render failure**: Fallback to raw mermaid code in a code block
- **Missing sections**: Graceful handling — if sections array is empty, show "Coming soon"
- **Very long content**: Scroll progress bar tracks accurately; objectives persist independently

---

## Screen 4: Quiz Page (`#/quiz/{n}`)

### Question State

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Lesson           Quiz: Node 5                        │
│  Progress: [████████████░░░░░░░]  Question 3 of 5               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WORLD 1 — Foundations                                           │
│  Descriptive Statistics Quiz                                     │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  Why is the median more robust to outliers                       │
│  than the mean? (Select one)                                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ○ Median ignores half the data                             │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │  ● Median depends only on the middle value's rank,         │  │
│  │    not on the magnitude of extreme values                  │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │  ○ Mean is always larger than median                        │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │  ○ They're equally robust                                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ✅  Correct!                                              │  │
│  │  The median only cares about rank, so extreme values       │  │
│  │  don't shift it like they do the mean.                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│              [  Next Question  ──────────▶  ]                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Quiz Flow (State Machine)

```
START ──► Show Q1 + options
              │
              ▼ (user selects option)
         User clicks answer
              │
              ▼
         Immediate feedback:
         ├── Correct: patina border + green panel + explanation
         └── Wrong: vermilion border + correct highlighted + explanation
              │
              ▼ (1.5s minimum viewing time)
         "Next Question" button appears
              │
              ▼
         Repeat for Q2, Q3, ..., Qn
              │
              ▼
         ┌──────────────────────────────────────┐
         │        SCORE SCREEN                  │
         │                                      │
         │  🎉 Quiz Complete!                   │
         │                                      │
         │  You scored  7 / 10                  │
         │  [████████████████░░░░░░]  70%       │
         │                                      │
         │  Correct: 7   Incorrect: 3           │
         │                                      │
         │  +35 XP earned!                      │
         │  (7 correct × 5 XP each)             │
         │                                      │
         │  [Review Answers] [Back to Map]     │
         │  [Next Node →]                       │
         └──────────────────────────────────────┘
              │
              ▼
         Save to localStorage:
         ├── store.progress.completedQuizzes[n] = { score, total }
         ├── store.xp.total += (correct * 5)
         └── store.streak.lastActive = today
              │
              ▼
         Submit to Google Apps Script (async, no-cors, silent)
```

### Question Types

| Type | UI | How It Works |
|---|---|---|
| `single` | Radio buttons (○) | User selects one, clicks option or "Submit" |
| `multi` | Checkboxes (☐) | User selects multiple, clicks "Submit" to validate |

### Feedback Details

- **Correct answer selected**: Option gets patina border + green background tint. Explanation panel slides in below.
- **Wrong answer selected** (single): The wrong option gets vermilion border. The correct option gets patina border + green tint. Explanation panel slides in.
- **Wrong answer selected** (multi): All selected options show correct/incorrect. The explanation panel summarizes which were right/wrong.
- **Explanation text**: Comes from the quiz data. Each question has a `feedback` field in `curriculum.json` that explains the correct answer.

### Score Screen

- Shows: score fraction, percentage bar, correct/incorrect count, XP earned
- Buttons:
  - **Download PDF**: generates a light, print-friendly PDF report (name, UID, date/time, node, score, and every question with all options — correct and attempted ones marked) via `js/pdf.js` + pdfmake (lazy-loaded from CDN only on click)
  - **Back to Map**: `#/map`
  - **Next Node**: `#/lesson/{n+1}` (if n < 42)

### Google Sheets Submission (Async)

```javascript
// Triggered automatically on score screen
// Non-blocking — user can navigate away immediately
// Guests and unknown UIDs are dropped server-side

import { pushQuiz, track } from "../sync.js";

track("quiz_start", node.id);        // fired when the quiz opens
pushQuiz(
  node.id,
  responses.map(r => ({ question: r.question, selected: r.selected, correct: r.correct })),
  correctCount,
  total
);
// pushQuiz attaches uid, XP, streak, and completed-quizzes snapshot
// POST text/plain, mode: "no-cors" — silent failure, never blocks the user
```

### What Happens in Google Sheets (Server-Side)

```
POST received by Apps Script Web App
        │
        ▼
  Parse JSON payload { action, uid, ... }
        │
        ▼
  Look up uid in "Users" tab
  ├── Not found / no uid → drop silently (guests are never recorded)
  └── Found
        │
        ▼
  ┌─────────────────────────────────────┐
  │  STEP 1: Get/create student tab     │
  ├─────────────────────────────────────┤
  │                                     │
  │  Tab name = student's name          │
  │  (auto-created with stats block     │
  │   rows 1-12 + event log header      │
  │   at row 13)                        │
  │                                     │
  └─────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────┐
  │  STEP 2: Append event row           │
  ├─────────────────────────────────────┤
  │                                     │
  │  [quiz_attempt, 2026-07-17, 14:30,  │
  │   05, 2,                            │
  │   "B", "Yes", "A", "No", ...,       │
  │   7, 10]                            │
  │                                     │
  │  Server-side timestamps             │
  │  Attempt # = per-node attempt count │
  │                                     │
  └─────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────┐
  │  STEP 3: Update stats block         │
  ├─────────────────────────────────────┤
  │                                     │
  │  XP, Streak, Longest Streak,        │
  │  Last Active, Completed (JSON map   │
  │  of node → {score, total}),         │
  │  Last Visited Node                  │
  │                                     │
  └─────────────────────────────────────┘
        │
        ▼
  (No email is sent)
```

### Tracked vs Guest User Differences

| Aspect | Tracked User | Guest User |
|---|---|---|
| Sheet writes | Full event log + stats on their own tab | None — dropped silently |
| Cloud restore on login | XP/streak/completed pulled from sheet | Not applicable |
| localStorage progress | Yes, saved normally | Yes, saved normally |

### Edge Cases

| Scenario | Behavior |
|---|---|
| **Retake quiz** | Store keeps latest score; sheet appends a new `quiz_attempt` row (attempt # increments per node) |
| **Network failure on submit** | Silent catch. User sees their score on screen. No retry logic (data loss acceptable for college use). |
| **User navigates away mid-quiz** | Progress not saved. Must restart quiz from Q1. |
| **All questions answered correctly** | Perfect score bonus +10 XP. Special score screen message "🎉 Perfect score!" |
| **Guest only quiz** | Nothing reaches the sheet. Useful for demos. |

---

## Complete State Diagram

```
                    ┌──────────┐
                    │ #/login  │
                    └────┬─────┘
                         │ identity stored
                         ▼
                    ┌──────────┐
         ┌─────────│  #/map   │◄──────────────────────┐
         │         └────┬─────┘                       │
         │              │ click node                  │
         │              ▼                             │
         │         ┌──────────┐                       │
         │  ┌──────│#/lesson/n│───────► [Take Quiz]   │
         │  │      └──────────┘                       │
         │  │              ▲                          │
         │  │              │ [Back to Map]            │
         │  │              │                          │
         │  │              ▼                          │
         │  │         ┌──────────┐                    │
         │  │         │ #/quiz/n │                    │
         │  │         └────┬─────┘                    │
         │  │              │ complete                 │
         │  │              ▼                          │
         │  │         ┌──────────┐                    │
         │  │         │  Score   │──► [Next Node] ────┤
         │  │         │  Screen  │──► [Back to Map] ──┘
         │  │         └──────────┘
         │  │
         │  └───────── [Back to Map] ────┘
         │
         └─────────────── [Logout] ────► #/login
```

---

## Data Migration / Reset

| Action | What Happens | How To |
|---|---|---|
| Clear all progress | Deletes entire store | `localStorage.removeItem("quanttrain")` in DevTools |
| Logout | Clears identity + local progress/XP/streak/badges, resets to login | Click Logout in map header (tracked users restore from cloud on next login) |
| Reset single node | Remove node from completed lists | Future feature |
| Export progress | JSON download of store | Future feature |

## Identity is Not Security

The UID/password system is purely **identity tracking and analytics** in Google Sheets. It is not access control:
- Passwords are phone numbers stored in plaintext in the sheet
- Validation happens in the Apps Script web app, but the sheet is only as private as its Google sharing settings
- Anyone with the roster could log in as any student
- Guest users can access all content with no identity at all
- The UI never distinguishes "wrong UID" from "wrong password" — always "Wrong credentials"

This is intentional. The site is fully open. The gate just provides optional attribution and cross-device progress sync for quiz submissions.

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
  Click           Enter name +
  "Guest          email, click
  Access"         "Enter the Lab"
    │                 │
    ▼                 ▼
  store.js          store.js
  { type:           { type: "tracked",
    "guest" }         name: "Alice",
                      email: "a@c.com" }
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
│  │  Full Name      [______________]     │    │
│  │  Email Address  [______________]     │    │
│  │                                      │    │
│  │  [  Enter the Lab  ──────▶  ]       │    │
│  │  ───────── or ─────────              │    │
│  │  [  Guest Access  ]                 │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ℹ️  Name & email are for tracking your      │
│     progress — not required to browse.      │
└──────────────────────────────────────────────┘
```

### Actions

| Action | Trigger | What Happens | localStorage | Next Route |
|---|---|---|---|---|
| Enter the Lab | Click button | Validate email format (basic regex) | `{ type: "tracked", name, email }` | `#/map` |
| Guest Access | Click button | No validation | `{ type: "guest" }` | `#/map` |

### State: Returning Visit (identity exists in store)
- Page auto-redirects to `#/map` on load
- No login screen shown
- To reset: click "Logout" in map settings → clears identity → redirects to `#/login`

### Validation Rules
- Email must contain `@` and a domain (basic regex, not a full RFC check)
- Name must not be empty if "Enter the Lab" is clicked
- Guest Access skips all validation

### Edge Cases
- **Cleared localStorage**: User returns to login as if first visit
- **Invalid email**: Show inline error "Please enter a valid email address"
- **Logout**: Clears identity from store, redirects to login, but preserves XP/progress (user can re-identify and keep their data)

---

## Screen 2: World Map (`#/map`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ⬛ QuantTrain    [XP: 1,240]  Lv4    🔥 7-day streak    [⏻]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Overall Progress  [████████████░░░░░░░░░░]  12 / 41 nodes     │
│                                     3 / 12 worlds               │
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
| Overall progress | `store.progress.completedNodes.length / 41` | Gold fill bar |
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
| ⏻ Logout | Clear identity → redirect `#/login` |

### Edge Cases
- **No visits yet**: All circles dimmed, "Continue" button hidden
- **World complete**: Full patina bar, 100% label, "Completed" badge on world title
- **All complete**: Confetti/gold animation on overall bar, "🎉 All nodes completed!"

---

## Screen 3: Lesson Page (`#/lesson/{n}`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Map                 Node 5 of 41    [XP: +10 avail]  │
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
- Persisted across visits

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

- First time visiting this lesson → +10 XP (stored in `xp.history` with source `"lesson"`)
- Subsequent visits → no XP (checked against `xp.history` entries)
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
- Three buttons:
  - **Review Answers**: Goes back through questions showing correct answers
  - **Back to Map**: `#/map`
  - **Next Node**: `#/lesson/{n+1}` (if n < 41)

### Google Sheets Submission (Async)

```javascript
// Triggered automatically on score screen
// Non-blocking — user can navigate away immediately

const payload = {
  action: "submitQuiz",
  nodeId: 5,
  name: identity.name || "Guest",
  email: identity.email || "guest@anonymous",
  timestamp: new Date().toISOString(),
  responses: [
    { question: 1, selected: "B", correct: true },
    { question: 2, selected: "A", correct: false },
    { question: 3, selected: "C", correct: true },
    // ...
  ],
  score: 7,
  total: 10
};

fetch(APPS_SCRIPT_URL, {
  method: "POST",
  mode: "no-cors",  // Required for Google Apps Script
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
}).catch(err => {
  // Silent failure — never block the user
  console.warn("Quiz submission to sheet failed:", err.message);
});
```

### What Happens in Google Sheets (Server-Side)

```
POST received by Apps Script Web App
        │
        ▼
  Parse JSON payload
        │
        ▼
  ┌─────────────────────────────────────┐
  │  STEP 1: Write to Node_{n} tab     │
  ├─────────────────────────────────────┤
  │                                     │
  │  Check if tab "Node_05" exists      │
  │  ├── No → Create it with headers:   │
  │  │   Timestamp | Date | Time | Name │
  │  │   | Email | Q1_Ans | Q1_Correct │
  │  │   | Q2_Ans | Q2_Correct | ...   │
  │  │   | Score | Total               │
  │  │                                  │
  │  ├── Yes → Use existing tab        │
  │                                     │
  │  Append row:                        │
  │  [2026-07-17T14:30:00,              │
  │   2026-07-17, 14:30,                │
  │   "Alice Sharma",                   │
  │   "alice@college.edu",              │
  │   "B", true,                        │
  │   "A", false,                       │
  │   ...,                              │
  │   7, 10]                            │
  │                                     │
  └─────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────┐
  │  STEP 2: Update Tracker tab        │
  ├─────────────────────────────────────┤
  │                                     │
  │  Find row by email (case-insensitive)│
  │                                     │
  │  ├── Found → Update Node_05 column │
  │  │   Set value to "7/10"           │
  │  │                                 │
  │  ├── Not found → Append new row:   │
  │  │   ["Alice Sharma",              │
  │  │    "alice@college.edu",         │
  │  │    "7/10",                      │
  │  │    ..., "—", ...]               │
  │                                     │
  │  Recalculate:                       │
  │  - Quizzes Taken = count of         │
  │    non-blank score columns          │
  │  - Avg Score = average of all       │
  │    score values                     │
  │                                     │
  └─────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────┐
  │  STEP 3: Send Email Notification   │
  ├─────────────────────────────────────┤
  │                                     │
  │  To: advisor@college.edu           │
  │  CC: (configured 2nd email)        │
  │                                     │
  │  Subject:                           │
  │  "QuantTrain Quiz: Node 05 —       │
  │   Alice Sharma scored 7/10"        │
  │                                     │
  │  Body:                              │
  │  ┌─────────────────────────────┐   │
  │  │ Quiz:    Node 05           │   │
  │  │ Name:    Alice Sharma      │   │
  │  │ Email:   alice@college.edu │   │
  │  │ Date:    2026-07-17        │   │
  │  │ Score:   7 / 10 (70%)      │   │
  │  │                           │   │
  │  │ Responses:                │   │
  │  │ Q1: Answered B → Correct  │   │
  │  │ Q2: Answered A → Wrong    │   │
  │  │ ...                       │   │
  │  └─────────────────────────────┘   │
  │                                     │
  └─────────────────────────────────────┘
```

### Guest vs Tracked User Differences

| Aspect | Tracked User | Guest User |
|---|---|---|
| Name submitted | Their actual name | "Guest" |
| Email submitted | Their actual email | "guest@anonymous" |
| Tracker tab | Row updates for this email | All guests aggregate under "Guest" row |
| Email notification | Full notification sent | May be skipped or tagged as "Guest" |
| localStorage progress | Yes, saved normally | Yes, saved normally |

### Edge Cases

| Scenario | Behavior |
|---|---|
| **Retake quiz** | Previous score overwritten in store. Sheet appends new row (duplicate). Tracker tab shows latest score. |
| **Network failure on submit** | Silent catch. User sees their score on screen. No retry logic (data loss acceptable for college use). |
| **User navigates away mid-quiz** | Progress not saved. Must restart quiz from Q1. |
| **All questions answered correctly** | Perfect score bonus +10 XP. Special score screen message "🎉 Perfect score!" |
| **Guest only quiz** | No identifiable data in sheet. Useful for demos. |

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
| Clear identity only | Keeps XP/progress, resets to login | Click Logout in map |
| Reset single node | Remove node from completed lists | Future feature |
| Export progress | JSON download of store | Future feature |

## Identity is Not Security

The name/email system is purely for **tracking and analytics** in Google Sheets. It is not authentication:
- There is no password
- There is no server-side validation
- Anyone can claim any email
- Guest users can access all content with no identity at all

This is intentional. The site is fully open. The gate just provides optional attribution for quiz submissions.

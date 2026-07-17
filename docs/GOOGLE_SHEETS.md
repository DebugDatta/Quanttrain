# QuantTrain — Google Sheets Integration

## Purpose

Quiz submissions are sent to a Google Sheet for tracking analyst performance. The system stores:

1. **Per-node raw submissions** (each node gets its own tab with time-stamped rows)
2. **Master tracker** (one row per analyst, columns per node showing scores)
3. **Email notifications** (configurable, sent on each quiz submission)

## Sheet Structure

### Tab: `Tracker`

Master roll-up — one row per analyst, one column per node.

| Name | Email | Node_01 | Node_02 | Node_03 | ... | Quizzes Taken | Avg Score |
|---|---|---|---|---|---|---|---|
| Alice Sharma | alice@college.edu | 9/10 | 7/10 | — | — | 2 | 80% |
| Bob Patel | bob@college.edu | 8/10 | — | 6/10 | — | 2 | 70% |
| Demo User | demo@demo.com | — | 5/10 | — | — | 1 | 50% |

- `—` means the analyst hasn't attempted that node's quiz
- `Quizzes Taken` = count of non-empty score columns
- `Avg Score` = average of all scores (ignoring `—`)

### Tab: `Node_01`, `Node_02`, ..., `Node_41`

Raw submission log for each node. Auto-created by the Apps Script when the first submission arrives.

| Timestamp | Date | Time | Name | Email | Q1_Answer | Q1_Correct | Q2_Answer | Q2_Correct | ... | Score | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|

## Apps Script Setup

### Step 1: Create the Google Sheet

1. Go to [sheets.new](https://sheets.new)
2. Rename the default sheet to `QuantTrain Responses`
3. Note the spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

### Step 2: Add the Script

1. In the sheet, go to **Extensions → Apps Script**
2. Delete any placeholder code
3. Paste the contents of `apps-script/Code.gs`
4. Configure the constants at the top of the file:

```js
const CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
  NOTIFICATION_EMAILS: ['you@example.com', 'advisor@college.edu'],
  TRACKER_TAB_NAME: 'Tracker'
};
```

### Step 3: Deploy as Web App

1. Click **Deploy → New deployment**
2. Choose type: **Web app**
3. Execute as: **Me** (uses your Google account permissions)
4. Who has access: **Anyone** (needed for anonymous POSTs from the site)
5. Click **Deploy**
6. Copy the **Web app URL** — it looks like:
   `https://script.google.com/macros/s/abcdef123456/exec`

### Step 4: Configure the Website

1. Open `js/views/quiz.js`
2. Find the `APPS_SCRIPT_URL` constant at the top
3. Replace with your deployed URL:

```js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/abcdef123456/exec';
```

## Testing

1. Open the website in a browser
2. Complete any quiz
3. Check the Google Sheet — a new tab for that node should appear with the submission
4. Check the Tracker tab — a row for that user should update
5. Check email — notification should arrive at configured addresses

## How It Works (Flow)

```
User submits quiz
        │
        ▼
js/views/quiz.js
  └─ fetch(POST → APPS_SCRIPT_URL)
        │
        ▼
Google Apps Script (Code.gs)
  ├─ Parses JSON: { nodeId, name, email, timestamp, responses, score, total }
  ├─ Tracks email quota (50/day for free Gmail)
  ├─ Opens the Google Sheet by ID
  ├─ Gets or creates tab "Node_{nodeId}"
  ├─ Appends raw row [timestamp, date, time, name, email, Q&A pairs..., score, total]
  ├─ Gets or creates tab "Tracker"
  ├─ Finds user row by email:
  │   ├─ Found → update the Node_{nodeId} column cell
  │   └─ Not found → append new row
  ├─ Recalculates Quizzes Taken and Avg Score for that user
  └─ Sends email to NOTIFICATION_EMAILS:
       Subject: "QuantTrain Quiz: Node {n} — {name} scored {score}/{total}"
       Body: Summary of responses
```

## Limitations (Free Tier)

| Resource | Limit | Notes |
|---|---|---|
| Email/day | 100 (Gmail) / 1500 (Google Workspace) | Per script execution |
| Sheet writes | ~20 MB/day | Far more than needed for a college society |
| Execution time | 6 minutes per trigger | More than enough |
| Concurrent users | No hard limit | Requests queue if overwhelmed |

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| No data in sheet | Wrong Apps Script URL in quiz.js | Check the deployed URL |
| Tracker tab not updating | Email mismatch (case, extra spaces) | The script trims and lowercases emails |
| Email not sending | Daily quota exceeded or wrong config | Check NOTIFICATION_EMAILS in Code.gs |
| "Script function not found" | Deployment expired | Re-deploy as new version |
| CORS error in console | Expected — `no-cors` mode is used | Data still reaches the sheet |

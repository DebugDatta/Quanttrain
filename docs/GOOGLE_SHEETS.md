# QuantTrain — Google Sheets Integration

## Purpose

The site is fully static on Netlify. All persistent tracking lives in a Google Sheet, accessed through an Apps Script web app deployed on **datadebug0@gmail.com**. Login (UID + phone-number password) validates against the `Users` tab; every tracked action is appended to that student's own tab with server-side timestamps. Guests and unknown UIDs are silently ignored. **No emails are sent.**

## Current Configuration (hardcoded)

| Item | Value |
|---|---|
| Spreadsheet ID | `1SlEkPvIiGFKej2XnSgfwi-jdj1KKnZVYB7ND9wBmfgA` |
| Web app URL | `https://script.google.com/macros/s/AKfycbz1D7CU-CAplXvSzkD7Osc476nc0-wLGJQE7_eA0DCeRCeVGr2dgKJC3a3FYQC64lfZ/exec` |
| Owner account | datadebug0@gmail.com (keep the sheet private to it) |

`SPREADSHEET_ID` lives in `apps-script/Code.gs`; `APPS_SCRIPT_URL` lives in `js/sync.js`.

## Sheet Structure

### Tab: `Users`

Auto-created by the script if missing. One row per student:

| UID | Password | Name | Year | Course |
|---|---|---|---|---|
| 2605032 | 8521414230 | Aditya Ishaan Singh | FY | BSc IT |
| ... | ... | ... | ... | ... |

UID = username, phone number = password (plaintext — this is identity tracking, not security). Paste the roster CSV under the header row.

### Tab: per student (tab name = their name)

Stats block (rows 1–10):

| A | B |
|---|---|
| UID | 2605032 |
| Name | Aditya Ishaan Singh |
| Year | FY |
| Course | BSc IT |
| XP | 245 |
| Streak | 3 |
| Longest Streak | 5 |
| Last Active | 2026-07-31 |
| Completed | `{"5":{"score":8,"total":10},...}` |
| Last Visited Node | 7 |

Event log (headers at row 12):

| Event | Date | Time | Node | Attempt | Q1_Ans | Q1_Correct | ... | Q10_Ans | Q10_Correct | Score | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|

Events: `login`, `node_enter`, `quiz_start`, `quiz_attempt` (per-question answers, correct flags, score, and per-node attempt number). Dates/times are server-side (`Session.getScriptTimeZone()`).

## Deploying the Apps Script

1. Sheet + script live under datadebug0@gmail.com (script project is bound to the spreadsheet)
2. **Extensions → Apps Script** → replace all code with `apps-script/Code.gs`
3. **Deploy → New deployment → Web app**: Execute as **Me**, Who has access **Anyone**
4. The URL above is already hardcoded in `js/sync.js` — only update it if you redeploy to a new URL
5. After changing `Code.gs`: **Deploy → Manage deployments → Edit → New version** — the URL stays the same

## Roster

21 students, 5 columns: `UID,Password,Name,Year,Course`. The ready-to-paste CSV (header included) is at `data/roster.csv` — copy all 22 lines into cell A1 of the `Users` tab.

## Testing

1. **Wrong credentials** (expect `{"ok":false}`):
   `https://script.google.com/macros/s/AKfycbz1D7CU-CAplXvSzkD7Osc476nc0-wLGJQE7_eA0DCeRCeVGr2dgKJC3a3FYQC64lfZ/exec?action=validateLogin&uid=000000&pass=0`
2. **Valid credentials** (expect `{"ok":true,...}` + a tab named after the student):
   `...?action=validateLogin&uid=2605032&pass=8521414230`
3. Complete a lesson + quiz in the browser → event rows and XP appear in that student's tab
4. Clear `localStorage` → log in again → progress restored (cross-device sync)

## How It Works (Flow)

```
Browser (Netlify)
  ├─ GET  ?action=validateLogin  (CORS *, readable JSON) → profile merged into localStorage
  ├─ POST trackActivity (no-cors, silent) → login / node_enter / quiz_start rows
  ├─ POST submitQuiz    (no-cors, silent) → quiz_attempt row + stats block update
  └─ POST syncProgress  (no-cors, silent) → XP/streak/completed snapshot

Apps Script (Code.gs)
  ├─ doGet  → look up Users tab → { ok: false } | full profile
  ├─ doPost → ignore guests / unknown UIDs
  └─ writes server-timestamped event rows + stats block
```

## Why GET for Reads, POST for Writes

Apps Script web apps reject browser preflight on readable JSON POSTs (CORS). GET responses carry `Access-Control-Allow-Origin: *`, so the browser can read login results. Writes use `mode: "no-cors"` fire-and-forget — they always "succeed" client-side and are never read back.

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Login always "Wrong credentials" | Deployment still on old code version (no `doGet`) | Deploy → Manage deployments → New version |
| Valid login, but no writes | UID not in `Users` tab, or guest session | Paste roster into `Users`; log in with a roster UID |
| Writes go to the wrong sheet | `SPREADSHEET_ID` stale in Code.gs | Update constant, redeploy new version |
| 403 on login GET | Web app access not "Anyone" | Deploy → edit access → Anyone |
| CORS warning on POST | Expected — `no-cors` mode | Data still reaches the sheet |

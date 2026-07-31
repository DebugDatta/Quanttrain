const SPREADSHEET_ID = '1SlEkPvIiGFKej2XnSgfwi-jdj1KKnZVYB7ND9wBmfgA';
const USERS_TAB = 'Users';
const LOG_HEADER_ROW = 13;
const MAX_QUESTIONS = 10;

const LOG_HEADERS = [
  'Event', 'Date', 'Time', 'Node', 'Attempt',
  'Q1_Ans', 'Q2_Ans', 'Q3_Ans', 'Q4_Ans', 'Q5_Ans',
  'Q6_Ans', 'Q7_Ans', 'Q8_Ans', 'Q9_Ans', 'Q10_Ans',
  'Q1_Correct', 'Q2_Correct', 'Q3_Correct', 'Q4_Correct', 'Q5_Correct',
  'Q6_Correct', 'Q7_Correct', 'Q8_Correct', 'Q9_Correct', 'Q10_Correct',
  'Score', 'Total'
];

function doGet(e) {
  try {
    const p = e.parameter || {};
    if (p.action === 'validateLogin') {
      const uid = String(p.uid || '').trim();
      const pass = String(p.pass || '').trim();
      const user = uid && pass ? findUser(uid, pass) : null;
      if (!user) return respond({ ok: false });
      const tab = getOrCreateUserTab(user);
      const s = readStats(tab);
      return respond({
        ok: true,
        uid: user.uid,
        name: user.name,
        year: user.year,
        course: user.course,
        xp: s.xp,
        streak: s.streak,
        longestStreak: s.longestStreak,
        lastActive: s.lastActive,
        completedQuizzes: s.completedQuizzes,
        objectives: s.objectives,
        badges: s.badges,
        visitedNodes: visitedNodeIds(tab),
        lastVisitedNode: s.lastVisitedNode
      });
    }
    return respond({ ok: false });
  } catch (err) {
    console.error('doGet error: ' + err.message);
    return respond({ ok: false });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = String(data.action || '');
    const uid = String(data.uid || '').trim();
    if (!uid) return;
    const user = findUserByUid(uid);
    if (!user) return;
    const tab = getOrCreateUserTab(user);

    if (action === 'submitQuiz') {
      const nodeId = parseInt(data.nodeId, 10);
      const score = parseInt(data.score, 10) || 0;
      const total = parseInt(data.total, 10) || 0;
      const responses = Array.isArray(data.responses) ? data.responses : [];
      logEvent(tab, 'quiz_attempt', {
        nodeId: nodeId,
        attempt: attemptCount(tab, nodeId) + 1,
        responses: responses,
        score: score,
        total: total
      });
      const completed = readStats(tab).completedQuizzes;
      completed[String(nodeId)] = { score: score, total: total };
      writeStats(tab, {
        xp: parseInt(data.xp, 10) || 0,
        streak: parseInt(data.streak, 10) || 0,
        longestStreak: parseInt(data.longestStreak, 10) || 0,
        lastActive: String(data.lastActive || ''),
        completedQuizzes: completed,
        lastVisitedNode: nodeId,
        objectives: data.objectives || null,
        badges: data.badges || null
      });
    } else if (action === 'trackActivity') {
      const ev = String(data.event || '');
      if (['login', 'node_enter', 'quiz_start'].indexOf(ev) !== -1) {
        logEvent(tab, ev, { nodeId: data.nodeId ? parseInt(data.nodeId, 10) : null });
      }
    } else if (action === 'syncProgress') {
      writeStats(tab, {
        xp: parseInt(data.xp, 10) || 0,
        streak: parseInt(data.streak, 10) || 0,
        longestStreak: parseInt(data.longestStreak, 10) || 0,
        lastActive: String(data.lastActive || ''),
        completedQuizzes: data.completedQuizzes && typeof data.completedQuizzes === 'object' ? data.completedQuizzes : null,
        lastVisitedNode: data.lastVisitedNode ? parseInt(data.lastVisitedNode, 10) : null,
        objectives: data.objectives || null,
        badges: data.badges || null
      });
    }
  } catch (err) {
    console.error('doPost error: ' + err.message);
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getUsersSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(USERS_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(USERS_TAB);
    sheet.appendRow(['UID', 'Password', 'Name', 'Year', 'Course']);
  }
  return sheet;
}

function allUsers() {
  const values = getUsersSheet().getDataRange().getValues();
  const users = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const uid = String(row[0] || '').trim();
    if (!uid) continue;
    users.push({
      uid: uid,
      pass: String(row[1] || '').trim(),
      name: String(row[2] || '').trim(),
      year: String(row[3] || '').trim(),
      course: String(row[4] || '').trim()
    });
  }
  return users;
}

function findUser(uid, pass) {
  for (const u of allUsers()) {
    if (u.uid === uid && u.pass === pass) {
      return { uid: u.uid, name: u.name, year: u.year, course: u.course };
    }
  }
  return null;
}

function findUserByUid(uid) {
  for (const u of allUsers()) {
    if (u.uid === uid) {
      return { uid: u.uid, name: u.name, year: u.year, course: u.course };
    }
  }
  return null;
}

function sanitizeTabName(name) {
  let safe = String(name || 'Student').replace(/[\[\]:*?\/\\]/g, ' ').replace(/\s+/g, ' ').trim();
  return safe ? safe.slice(0, 100) : 'Student';
}

function getOrCreateUserTab(user) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const tabName = sanitizeTabName(user.name);
  let sheet = ss.getSheetByName(tabName);
  if (sheet) return sheet;
  sheet = ss.insertSheet(tabName);
  sheet.getRange('A1:B12').setValues([
    ['UID', user.uid],
    ['Name', user.name],
    ['Year', user.year],
    ['Course', user.course],
    ['XP', 0],
    ['Streak', 0],
    ['Longest Streak', 0],
    ['Last Active', ''],
    ['Completed', '{}'],
    ['Last Visited Node', ''],
    ['Objectives', '{}'],
    ['Badges', '[]']
  ]);
  sheet.getRange(LOG_HEADER_ROW, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS]);
  return sheet;
}

function readStats(sheet) {
  const values = sheet.getRange('B1:B12').getValues().map(row => row[0]);
  let completed = {};
  try { completed = JSON.parse(String(values[8] || '{}')) || {}; } catch (err) { completed = {}; }
  let objectives = {};
  try { objectives = JSON.parse(String(values[10] || '{}')) || {}; } catch (err) { objectives = {}; }
  let badges = [];
  try { badges = JSON.parse(String(values[11] || '[]')) || []; } catch (err) { badges = []; }
  const lastVisited = String(values[9] || '').trim();
  return {
    xp: parseInt(values[4], 10) || 0,
    streak: parseInt(values[5], 10) || 0,
    longestStreak: parseInt(values[6], 10) || 0,
    lastActive: String(values[7] || ''),
    completedQuizzes: completed,
    objectives: objectives,
    badges: badges,
    lastVisitedNode: lastVisited ? parseInt(lastVisited, 10) : null
  };
}

function writeStats(sheet, s) {
  if (typeof s.xp === 'number') sheet.getRange('B5').setValue(s.xp);
  if (typeof s.streak === 'number') sheet.getRange('B6').setValue(s.streak);
  if (typeof s.longestStreak === 'number') sheet.getRange('B7').setValue(s.longestStreak);
  if (s.lastActive !== undefined && s.lastActive !== null) sheet.getRange('B8').setValue(s.lastActive);
  if (s.completedQuizzes) sheet.getRange('B9').setValue(JSON.stringify(s.completedQuizzes));
  if (s.lastVisitedNode !== undefined && s.lastVisitedNode !== null) sheet.getRange('B10').setValue(s.lastVisitedNode);
  if (s.objectives) sheet.getRange('B11').setValue(JSON.stringify(s.objectives));
  if (s.badges) sheet.getRange('B12').setValue(JSON.stringify(s.badges));
}

function attemptCount(sheet, nodeId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < LOG_HEADER_ROW) return 0;
  const data = sheet.getRange(LOG_HEADER_ROW, 1, lastRow - LOG_HEADER_ROW + 1, 4).getValues();
  let count = 0;
  for (const row of data) {
    if (String(row[0]) === 'quiz_attempt' && parseInt(row[3], 10) === nodeId) count++;
  }
  return count;
}

function visitedNodeIds(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= LOG_HEADER_ROW) return [];
  const data = sheet.getRange(LOG_HEADER_ROW, 1, lastRow - LOG_HEADER_ROW + 1, 4).getValues();
  const seen = {};
  for (const row of data) {
    if (String(row[0]) === 'node_enter') {
      const id = parseInt(row[3], 10);
      if (!isNaN(id)) seen[id] = true;
    }
  }
  return Object.keys(seen).map(Number);
}

function logEvent(sheet, event, info) {
  const now = new Date();
  const tz = Session.getScriptTimeZone();
  const row = [
    event,
    Utilities.formatDate(now, tz, 'yyyy-MM-dd'),
    Utilities.formatDate(now, tz, 'HH:mm:ss'),
    info.nodeId === undefined || info.nodeId === null ? '' : info.nodeId,
    info.attempt === undefined || info.attempt === null ? '' : info.attempt
  ];
  for (let i = 1; i <= MAX_QUESTIONS; i++) {
    const r = (info.responses || []).find(x => parseInt(x.question, 10) === i);
    row.push(r ? String(r.selected) : '');
    row.push(r ? (r.correct ? 'Yes' : 'No') : '');
  }
  row.push(info.score === undefined || info.score === null ? '' : info.score);
  row.push(info.total === undefined || info.total === null ? '' : info.total);

  const lastRow = sheet.getLastRow();
  const nextRow = lastRow < LOG_HEADER_ROW ? LOG_HEADER_ROW : lastRow + 1;
  sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
}

import { isAdmin, adminLogin, adminLogout } from '../admin/auth.js';
import { fetchStudents, computeDerived, aggregateStats } from '../admin/fetch.js';
import { renderLeaderboard } from '../admin/leaderboard.js';
import { renderStudentCard } from '../admin/cards.js';
import { renderQuizChart } from '../admin/charts.js';
import { renderBadgeWall } from '../admin/badges.js';
import { $, show, navigate, escapeHtml } from '../utils.js';

var cachedStudents = null;

export function render() {
  show('admin-view');
  if (isAdmin()) {
    showDashboard();
  } else {
    showLoginGate();
  }
}

function showLoginGate() {
  var el = $('#admin-content');
  el.innerHTML = ''
    + '<div class="admin-login-gate">'
    + '<div class="admin-login-card">'
    + '<div class="admin-login-brand">QuantTrain</div>'
    + '<div class="admin-login-title">Admin Dashboard</div>'
    + '<div class="admin-login-subtitle">Enter admin credentials to access the performance dashboard.</div>'
    + '<form class="admin-login-form" id="admin-login-form">'
    + '<div><label for="admin-user">Username</label><input type="text" id="admin-user" placeholder="admin.quants" autocomplete="off" /></div>'
    + '<div><label for="admin-pass">Password</label><input type="password" id="admin-pass" placeholder="Password" /></div>'
    + '<div class="admin-login-error" id="admin-login-error">Invalid credentials</div>'
    + '<button type="submit" class="btn btn-primary" id="admin-submit">Access Dashboard</button>'
    + '</form>'
    + '<div style="margin-top:24px"><a href="#/login" style="font-size:0.8rem;color:var(--text-faint)">Back to Student Login</a></div>'
    + '</div></div>';

  $('#admin-login-form').onsubmit = function(e) {
    e.preventDefault();
    var user = $('#admin-user').value.trim();
    var pass = $('#admin-pass').value.trim();
    var err = $('#admin-login-error');
    if (!user || !pass) { err.classList.add('show'); return; }
    err.classList.remove('show');
    var btn = $('#admin-submit');
    btn.disabled = true;
    btn.textContent = 'Authenticating...';
    if (adminLogin(user, pass)) {
      showDashboard();
    } else {
      err.classList.add('show');
      btn.disabled = false;
      btn.textContent = 'Access Dashboard';
    }
  };
}

function showDashboard() {
  var el = $('#admin-content');
  el.innerHTML = ''
    + '<div class="admin-dashboard" id="admin-dashboard">'
    + '<div class="admin-header">'
    + '<div class="admin-header-left">'
    + '<span class="admin-brand">QuantTrain</span>'
    + '<span class="admin-title">Admin Dashboard</span>'
    + '</div>'
    + '<div class="admin-header-right">'
    + '<div class="admin-sync-status syncing" id="admin-sync-status"><span class="admin-sync-dot"></span> Syncing...</div>'
    + '<button class="btn btn-secondary" id="admin-refresh">Refresh</button>'
    + '<button class="btn btn-ghost" id="admin-logout">Logout</button>'
    + '</div></div>'
    + '<div id="admin-stats" class="admin-stats"></div>'
    + '<div class="admin-section"><div class="admin-section-header"><div class="admin-section-title">Leaderboard</div><div class="admin-section-subtitle">Click a student to view details</div></div><div class="admin-leaderboard" id="admin-leaderboard"></div></div>'
    + '<div class="admin-section"><div class="admin-section-header"><div class="admin-section-title">Quiz Performance by Node</div><div class="admin-section-subtitle">Average score across all students</div></div><div class="admin-quiz-chart" id="admin-quiz-chart"></div></div>'
    + '<div class="admin-section"><div class="admin-section-header"><div class="admin-section-title">Badge Wall</div><div class="admin-section-subtitle">Achievement distribution across all students</div></div><div class="admin-badge-wall" id="admin-badge-wall"></div></div>'
    + '</div>'
    + '<div class="admin-student-detail hidden" id="admin-student-detail"></div>';

  $('#admin-logout').onclick = function() { adminLogout(); navigate('#/login'); };
  $('#admin-refresh').onclick = function() { loadDashboardData(); };

  loadDashboardData();
}

function loadDashboardData() {
  var status = $('#admin-sync-status');
  if (status) { status.className = 'admin-sync-status syncing'; status.innerHTML = '<span class="admin-sync-dot"></span> Syncing...'; }

  fetchStudents().then(function(result) {
    if (!result.ok) {
      if (status) { status.className = 'admin-sync-status error'; status.innerHTML = '<span class="admin-sync-dot"></span> Sync failed'; }
      return;
    }
    var students = result.students;
    cachedStudents = students;
    var agg = aggregateStats(students);

    if (status) { status.className = 'admin-sync-status synced'; status.innerHTML = '<span class="admin-sync-dot"></span> Synced ' + students.length + ' students'; }

    var statsEl = $('#admin-stats');
    if (statsEl) {
      statsEl.innerHTML = ''
        + '<div class="admin-stat-card"><div class="admin-stat-icon gold">US</div><div class="admin-stat-value">' + agg.totalStudents + '</div><div class="admin-stat-label">Total Students</div></div>'
        + '<div class="admin-stat-card"><div class="admin-stat-icon gold">XP</div><div class="admin-stat-value">' + agg.avgXp + '</div><div class="admin-stat-label">Avg XP</div></div>'
        + '<div class="admin-stat-card"><div class="admin-stat-icon patina">ON</div><div class="admin-stat-value">' + agg.activeToday + '</div><div class="admin-stat-label">Active Today</div></div>'
        + '<div class="admin-stat-card"><div class="admin-stat-icon gold">SC</div><div class="admin-stat-value">' + agg.avgQuizScore + '%</div><div class="admin-stat-label">Avg Quiz Score</div></div>';
    }

    var lbEl = $('#admin-leaderboard');
    if (lbEl) renderLeaderboard(students, lbEl);

    var qcEl = $('#admin-quiz-chart');
    if (qcEl) renderQuizChart(students, qcEl);

    var bwEl = $('#admin-badge-wall');
    if (bwEl) renderBadgeWall(students, bwEl);

    bindLeaderboardClick(students);
  });
}

function bindLeaderboardClick(students) {
  var lb = $('#admin-leaderboard');
  if (!lb) return;

  function bindRow(row) {
    if (row._bound) return;
    row._bound = true;
    row.style.cursor = 'pointer';
    row.addEventListener('click', function() {
      var cells = this.querySelectorAll('td');
      var name = cells[1] ? cells[1].querySelector('.admin-student-name') : null;
      if (!name) return;
      var studentName = name.textContent;
      var student = students.find(function(s) { return s.name === studentName; });
      if (!student) return;
      showStudentDetail(student);
    });
  }

  var observer = new MutationObserver(function() {
    lb.querySelectorAll('tbody tr').forEach(bindRow);
  });
  observer.observe(lb, { childList: true, subtree: true });

  lb.querySelectorAll('tbody tr').forEach(bindRow);
}

function showStudentDetail(student) {
  var dashboard = $('#admin-dashboard');
  var detail = $('#admin-student-detail');
  if (!dashboard || !detail) return;

  dashboard.classList.add('hidden');
  detail.classList.remove('hidden');

  var d = computeDerived(student);
  var quizzesDone = Object.keys(student.completedQuizzes || {}).length;
  var eventCount = student.eventLog ? student.eventLog.length : 0;

  var html = ''
    + '<div class="admin-detail-topbar">'
    + '<button class="btn btn-ghost admin-back-btn" id="admin-back-btn">&larr; Back to Leaderboard</button>'
    + '<span class="admin-detail-student-name">' + escapeHtml(student.name) + '</span>'
    + '</div>'
    + '<div id="admin-detail-card"></div>';

  detail.innerHTML = html;

  $('#admin-back-btn').onclick = function() { hideStudentDetail(); };

  var cardEl = $('#admin-detail-card');
  if (cardEl) renderStudentCard(student, cardEl);
}

function hideStudentDetail() {
  var dashboard = $('#admin-dashboard');
  var detail = $('#admin-student-detail');
  if (dashboard) dashboard.classList.remove('hidden');
  if (detail) { detail.classList.add('hidden'); detail.innerHTML = ''; }
}

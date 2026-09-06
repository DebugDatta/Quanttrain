import { getCurriculum } from '../utils.js';

export function renderQuizChart(students, container) {
  var data = getCurriculum();
  if (!data) { container.innerHTML = '<p class="text-muted">Curriculum data not available.</p>'; return; }

  var nodes = [];
  for (var wi = 0; wi < data.worlds.length; wi++) {
    var w = data.worlds[wi];
    for (var ni = 0; ni < w.nodes.length; ni++) {
      nodes.push({ id: w.nodes[ni].id, title: w.nodes[ni].title, worldTitle: w.title });
    }
  }

  var html = '';
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var totalScore = 0;
    var totalMax = 0;
    var studentCount = 0;
    for (var si = 0; si < students.length; si++) {
      var q = (students[si].completedQuizzes || {})[String(n.id)];
      if (q) {
        totalScore += q.score;
        totalMax += q.total;
        studentCount++;
      }
    }
    var avgPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    var cls = avgPct >= 80 ? 'high' : avgPct >= 50 ? 'mid' : 'low';

    html += '<div class="admin-quiz-chart-row">'
      + '<span class="admin-quiz-chart-label" title="' + n.title + '">' + n.id + '. ' + n.title + '</span>'
      + '<div class="admin-quiz-chart-track"><div class="admin-quiz-chart-fill ' + cls + '" style="width:' + (avgPct || 2) + '%">'
      + (avgPct > 10 ? '<span class="admin-quiz-chart-score">' + avgPct + '%</span>' : '')
      + '</div></div>'
      + '<span class="admin-quiz-chart-students">' + studentCount + ' students</span>'
      + '</div>';
  }

  container.innerHTML = html;
}

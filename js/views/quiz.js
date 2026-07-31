import { getProgress, setProgress, addXp } from '../store.js';
import { $, $$, show, navigate, getNode, getWorldForNode, getNextNode, escapeHtml } from '../utils.js';
import { pushQuiz, track } from '../sync.js';

var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
var currentNodeId = null, currentQuestion = 0, responses = [], answered = false;

export function render(nodeId) {
  var node = getNode(nodeId);
  if (!node || !node.quiz || !node.quiz.length) { navigate('#/map'); return; }
  currentNodeId = nodeId; currentQuestion = 0; responses = []; answered = false;
  show('quiz-view');
  track('quiz_start', nodeId);
  renderQuestion(node, getWorldForNode(nodeId));
}

function renderQuestion(node, world) {
  var q = node.quiz[currentQuestion];
  var total = node.quiz.length;
  var pct = Math.round((currentQuestion / total) * 100);

  var html = ''
    + '<div class="quiz-topbar">'
    + '<div class="quiz-topbar-top">'
    + '<span class="back-link" id="quiz-back">< Back to Lesson</span>'
    + '<span>Question ' + (currentQuestion + 1) + ' of ' + total + '</span>'
    + '</div>'
    + '<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + pct + '%"></div></div>'
    + '</div>'
    + '<div class="quiz-world-label">World ' + world.id + ' -- ' + world.title + '</div>'
    + '<div class="quiz-title"><h2>' + escapeHtml(node.title) + ' Quiz</h2></div>'
    + '<div class="quiz-question">'
    + '<div class="quiz-question-number">Question ' + (currentQuestion + 1) + '</div>'
    + '<div class="quiz-question-text">' + escapeHtml(q.question) + '</div>'
    + '<div class="quiz-question-type">' + (q.type === 'multi' ? 'Select all that apply' : 'Select one') + '</div>'
    + '</div>'
    + '<div class="quiz-options" id="quiz-options">';

  for (var i = 0; i < q.options.length; i++) {
    html += '<div class="quiz-option" data-idx="' + i + '">'
      + '<span class="option-letter">' + LETTERS[i] + '</span>'
      + '<span>' + escapeHtml(q.options[i].text) + '</span>'
      + '</div>';
  }

  html += '</div>'
    + '<div class="quiz-feedback" id="quiz-feedback"></div>'
    + '<div class="quiz-controls"><button class="btn btn-primary" id="quiz-submit" disabled>Submit Answer</button></div>';

  $('#quiz-content').innerHTML = html;

  $$('.quiz-option').forEach(function(opt) {
    opt.addEventListener('click', function() {
      if (answered) return;
      if (q.type === 'single') {
        $$('.quiz-option').forEach(function(o) { o.classList.remove('selected'); });
        this.classList.add('selected');
        $('#quiz-submit').disabled = false;
      } else {
        this.classList.toggle('selected');
        var anySel = false;
        $$('.quiz-option').forEach(function(o) { if (o.classList.contains('selected')) anySel = true; });
        $('#quiz-submit').disabled = !anySel;
      }
    });
  });

  $('#quiz-back').onclick = function() { navigate('#/lesson/' + node.id); };
  $('#quiz-submit').onclick = function() { handleSubmit(node, world, q); };
}

function handleSubmit(node, world, q) {
  if (answered) {
    if (currentQuestion < node.quiz.length - 1) {
      currentQuestion++; answered = false; renderQuestion(node, world);
    } else {
      showScore(node, world);
    }
    return;
  }
  answered = true;

  var selected = [];
  $$('.quiz-option').forEach(function(o, i) {
    if (o.classList.contains('selected')) selected.push(i);
  });

  var correctIndices = [];
  for (var i = 0; i < q.options.length; i++) {
    if (q.options[i].correct) correctIndices.push(i);
  }

  var isCorrect;
  if (q.type === 'single') {
    isCorrect = selected.length === 1 && correctIndices.indexOf(selected[0]) !== -1;
  } else {
    if (selected.length !== correctIndices.length) {
      isCorrect = false;
    } else {
      isCorrect = selected.every(function(idx) { return correctIndices.indexOf(idx) !== -1; });
    }
  }

  var selectedStr = selected.map(function(i) { return LETTERS[i]; }).join(',');
  responses.push({ question: currentQuestion + 1, selected: selectedStr, correct: isCorrect });

  $$('.quiz-option').forEach(function(o, i) {
    o.classList.add('disabled');
    if (correctIndices.indexOf(i) !== -1) {
      o.classList.add('correct');
    } else if (selected.indexOf(i) !== -1) {
      o.classList.add('wrong');
    }
  });

  var fb = $('#quiz-feedback');
  fb.className = 'quiz-feedback show';
  if (isCorrect) {
    fb.classList.add('correct');
    fb.innerHTML = '<div class="quiz-feedback-status correct-text">CORRECT</div>'
      + '<div class="quiz-feedback-text">' + (q.feedback || 'Well done!') + '</div>';
  } else {
    fb.classList.add('wrong');
    var correctStr = correctIndices.map(function(i) { return LETTERS[i]; }).join(',');
    fb.innerHTML = '<div class="quiz-feedback-status wrong-text">INCORRECT</div>'
      + '<div class="quiz-feedback-text">' + (q.feedback || 'The correct answer was ' + correctStr + '.') + '</div>';
  }

  var btn = $('#quiz-submit');
  btn.textContent = currentQuestion < node.quiz.length - 1 ? 'Next Question >' : 'See Results';
  btn.disabled = false;
}

function showScore(node) {
  var correctCount = 0;
  for (var ri = 0; ri < responses.length; ri++) {
    if (responses[ri].correct) correctCount++;
  }
  var total = node.quiz.length;
  var pct = Math.round((correctCount / total) * 100);
  var xpEarned = correctCount * 5;
  var perfectBonus = correctCount === total ? 10 : 0;
  var totalXp = xpEarned + perfectBonus;

  var progress = getProgress();
  progress.completedQuizzes[node.id] = { score: correctCount, total: total };
  setProgress(progress);
  addXp(xpEarned, 'quiz', node.id);
  if (perfectBonus) addXp(perfectBonus, 'quiz_perfect', node.id);

  var p = getProgress();
  p.lastVisitedNode = node.id; p.lastVisitedView = 'quiz';
  setProgress(p);

  pushQuiz(node.id, responses.map(function(r) {
    return { question: r.question, selected: r.selected, correct: r.correct };
  }), correctCount, total);

  var nextNode = getNextNode(node.id);

  var titleText = correctCount === total ? 'Perfect Score!' : 'Quiz Complete';
  var bonusText = perfectBonus ? ' (includes +10 perfect bonus!)' : '';

  var html = ''
    + '<div class="quiz-score fade-in">'
    + '<div class="quiz-score-title">' + titleText + '</div>'
    + '<div class="quiz-score-fraction"><span id="quiz-score-count">0</span> / ' + total + '</div>'
    + '<div class="quiz-score-label">' + pct + '%</div>'
    + '<div class="quiz-score-bar"><div class="quiz-score-fill" style="width:' + pct + '%"></div></div>'
    + '<div class="quiz-score-detail">'
    + '<div class="quiz-score-detail-item"><div class="quiz-score-detail-num gold">' + correctCount + '</div><div class="quiz-score-detail-label">Correct</div></div>'
    + '<div class="quiz-score-detail-item"><div class="quiz-score-detail-num error">' + (total - correctCount) + '</div><div class="quiz-score-detail-label">Incorrect</div></div>'
    + '</div>'
    + '<div class="quiz-score-xp">+<span id="quiz-score-xp-count">0</span> XP earned' + bonusText + '</div>'
    + '<div class="quiz-score-actions">'
    + '<button class="btn btn-secondary" id="quiz-back-map">Back to Map</button>'
    + (nextNode ? '<button class="btn btn-primary" id="quiz-next-node">Next Node ></button>' : '')
    + '</div>'
    + '</div>';

  $('#quiz-content').innerHTML = html;
  countUp($('#quiz-score-count'), correctCount, 600);
  countUp($('#quiz-score-xp-count'), totalXp, 600);

  $('#quiz-back-map').onclick = function() { navigate('#/map'); };
  if (nextNode) {
    $('#quiz-next-node').onclick = function() { navigate('#/lesson/' + nextNode.id); };
  }
}

function countUp(el, to, duration) {
  if (!el) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { el.textContent = to; return; }
  var start = null;
  function frame(ts) {
    if (start === null) start = ts;
    var t = Math.min(1, (ts - start) / duration);
    var eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(eased * to);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '..', 'data', 'curriculum.json');

// === Section fixes: split text sections containing code fences ===

function splitFencedContent(content) {
  var fenceRe = /^([\s\S]*?)```(\w*)\n?([\s\S]*?)\n?```([\s\S]*)$/;
  var m = content.match(fenceRe);
  if (!m) return null;
  var before = m[1].trim();
  var lang = m[2] || '';
  var code = m[3].replace(/^\n+|\n+$/g, '');
  var after = m[4].trim();
  var sections = [];
  if (before) sections.push({ type: 'text', heading: '', content: before });
  sections.push({ type: lang === 'mermaid' ? 'mermaid' : 'code', heading: '', language: lang === 'mermaid' ? '' : lang, code: code, output: '' });
  if (after) {
    var nested = splitFencedContent(after);
    if (nested) nested.forEach(function(s) { sections.push(s); });
    else sections.push({ type: 'text', heading: '', content: after });
  }
  return sections;
}

var data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
var fixedSections = 0;

data.worlds.forEach(function(w) {
  w.nodes.forEach(function(n) {
    // Fix text sections that contain code fences
    var newSections = [];
    n.sections.forEach(function(s) {
      if (s.type === 'text' && s.content) {
        var split = splitFencedContent(s.content);
        if (split) {
          split.forEach(function(ss) {
            if (!ss.heading && s.heading) ss.heading = s.heading;
            newSections.push(ss);
          });
          fixedSections++;
        } else {
          newSections.push(s);
        }
      } else {
        newSections.push(s);
      }
    });
    n.sections = newSections;

    // Fix quiz types: change single → multi for multi-select questions
    n.quiz.forEach(function(q) {
      var correctCount = q.options.filter(function(o) { return o.correct; }).length;
      if (q.type === 'single' && correctCount > 1) {
        q.type = 'multi';
      }
    });
  });
});

fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), 'utf-8');
console.log('Fixed sections: ' + fixedSections);

// Verify counts
var worlds = 0, nodes = 0, sections = 0, quizzes = 0, multiCount = 0;
data.worlds.forEach(function(w) {
  worlds++;
  w.nodes.forEach(function(n) {
    nodes++;
    sections += n.sections.length;
    quizzes += n.quiz.length;
    n.quiz.forEach(function(q) {
      if (q.type === 'multi') multiCount++;
    });
  });
});
console.log('Worlds: ' + worlds + ', Nodes: ' + nodes + ', Sections: ' + sections + ', Quizzes: ' + quizzes);
console.log('Multi-select quiz questions: ' + multiCount);

// Check for remaining text sections with fences
var remaining = 0;
data.worlds.forEach(function(w) {
  w.nodes.forEach(function(n) {
    n.sections.forEach(function(s) {
      if (s.type === 'text' && s.content && /^[\s\S]*?```\w*\n?[\s\S]*?\n?```[\s\S]*$/.test(s.content)) {
        remaining++;
        console.log('  REMAINING fence in Node ' + n.id + ': ' + s.content.slice(0, 60));
      }
    });
  });
});
if (remaining) console.log('WARNING: ' + remaining + ' sections still have fences!');
else console.log('No remaining fenced text sections.');

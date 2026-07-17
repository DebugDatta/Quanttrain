var fs = require('fs');
var path = require('path');

var HTML_PATH = path.join(__dirname, '..', 'index.html');
var JSON_PATH = path.join(__dirname, '..', 'data', 'curriculum.json');

var html = fs.readFileSync(HTML_PATH, 'utf-8');
var fixedData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

var startTag = '<script id="curriculum-data" type="application/json">';
var endTag = '</script>';

var startIdx = html.indexOf(startTag);
if (startIdx === -1) { console.error('Start tag not found'); process.exit(1); }
var contentStart = startIdx + startTag.length;
var endIdx = html.indexOf(endTag, contentStart);
if (endIdx === -1) { console.error('End tag not found'); process.exit(1); }

var jsonStr = JSON.stringify(fixedData, null, 2);

var newHtml = html.substring(0, contentStart) + '\n' + jsonStr + '\n' + html.substring(endIdx);

fs.writeFileSync(HTML_PATH, newHtml, 'utf-8');

// Verify
var verifyHtml = fs.readFileSync(HTML_PATH, 'utf-8');
var verifyMatch = verifyHtml.match(/<script id="curriculum-data" type="application\/json">([\s\S]*?)<\/script>/);
var verifyData = JSON.parse(verifyMatch[1]);
var secCount = 0, multiCount = 0;
verifyData.worlds.forEach(function(w) { w.nodes.forEach(function(n) {
  secCount += n.sections.length;
  n.quiz.forEach(function(q) { if (q.type === 'multi') multiCount++; });
});});

console.log('Synced index.html: ' + secCount + ' sections, ' + multiCount + ' multi-select');

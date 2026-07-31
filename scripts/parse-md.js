const fs = require("fs");
const path = require("path");

const INPUT = path.join(__dirname, "..", "module.md");
const OUTPUT = path.join(__dirname, "..", "data", "curriculum.json");

function is(line, pat) { return pat.test(line.trim()); }

function extractWorld(line) {
  const m = line.trim().match(/^# WORLD (\d+) — (.+)$/);
  return m ? { id: +m[1], title: m[2].trim() } : null;
}

function extractNode(line) {
  const m = line.trim().match(/^## Node (\d+): (.+)$/);
  return m ? { id: +m[1], title: m[2].trim() } : null;
}

function isFence(line) { return /^```/.test(line.trim()); }

function isSep(line) { return /^---+$/.test(line.trim()); }

function parseResources(raw) {
  const out = [];
  for (const l of raw) {
    const m = l.match(/^\s*-\s*\[(.+?)\]\((https?:\/\/[^\s)]+)\)/);
    if (m) out.push({ label: m[1].trim(), url: m[2].trim() });
  }
  return out;
}

function parseQuiz(raw) {
  const out = [];
  let cur = null;
  for (const r of raw) {
    const l = r.trim();
    if (!l) continue;
    const qm = l.match(/^(\d+)\.\s+\*\*(.+?)\*\*(?:\s*\((.+?)\))?$/);
    if (qm) {
      if (cur) out.push(cur);
      let qtext = qm[2].trim();
      const multiMatch = qtext.match(/^\(([^)]*multi[^)]*)\)\s*/i) || (qm[3] || "").toLowerCase().includes("multi");
      if (multiMatch) qtext = qtext.replace(/^\([^)]*multi[^)]*\)\s*/i, "");
      cur = { question: qtext, type: (multiMatch ? "multi" : "single"), options: [] };
      continue;
    }
    const om = l.match(/^\s*-\s+([A-Z])\)\s+(.+?)(\s*✅\s*)?$/);
    if (om && cur) { cur.options.push({ text: om[2].trim(), correct: !!om[3] }); continue; }
    if (cur && cur.options.length === 0 && !l.startsWith("- ")) cur.question += " " + l;
  }
  if (cur) out.push(cur);
  return out;
}

function parseSection(heading, lines) {
  const content = lines.join("\n").replace(/^\n+|\n+$/g, "").trim();
  if (!content) return null;

  // Handle multiple consecutive fences by extracting them iteratively
  const fenceRe = /^([\s\S]*?)```(\w*)\n?([\s\S]*?)\n?```([\s\S]*)$/;
  function processFences(content, heading) {
    const m = content.match(fenceRe);
    if (!m) return null;
    const before = m[1].trim();
    const lang = m[2] || "";
    const code = m[3].replace(/^\n+|\n+$/g, "");
    const after = m[4].trim();
    const sections = [];
    if (before) sections.push({ type: "text", heading, content: before });
    sections.push({ type: lang === "mermaid" ? "mermaid" : "code", heading: "", language: lang === "mermaid" ? "" : lang, code, output: "" });
    if (after) {
      const nested = processFences(after, "");
      if (nested) nested.forEach(function(s) { sections.push(s); });
      else sections.push({ type: "text", heading: "", content: after });
    }
    return sections;
  }
  const fenceResult = processFences(content, heading);
  if (fenceResult) return fenceResult.length === 1 ? fenceResult[0] : fenceResult;

  // Table
  const rows = content.split("\n").map(l => l.trim()).filter(Boolean);
  const si = rows.findIndex(r => /^\|[-:| ]+\|$/.test(r));
  if (si > 0 && /^\|/.test(rows[si - 1])) {
    return {
      type: "table", heading,
      headers: rows[si - 1].split("|").slice(1, -1).map(c => c.trim().replace(/\*\*/g, "")),
      rows: rows.slice(si + 1).filter(r => /^\|/.test(r)).map(r => r.split("|").slice(1, -1).map(c => c.trim().replace(/\*\*/g, "")))
    };
  }

  // Text
  const clean = content.split("\n").filter(l => !isSep(l.trim())).join("\n").trim();
  return clean ? { type: "text", heading, content: clean } : null;
}

function parseModule(lines) {
  const worlds = [];
  let w = null, n = null;
  let phase = null, heading = "";
  let hubs = []; // hook buffer
  let obuf = []; // objectives buffer
  let rbuf = []; // resources buffer
  let qbuf = []; // quiz buffer
  let sbuf = []; // section buffer
  let inFence = false; // track fence state to avoid false heading matches inside code blocks

  function flush() {
    if (!n) return;
    if (phase === "hook") n.hook = hubs.join("\n").trim();
    else if (phase === "objectives") n.objectives = obuf.map(l => l.replace(/^\s*-\s+/, "").trim()).filter(l => l && !/^---+$/.test(l));
    else if (phase === "resources") n.resources = parseResources(rbuf);
    else if (phase === "quiz") n.quiz = parseQuiz(qbuf);
    else if (phase === "content" && sbuf.length) { const p = parseSection(heading, sbuf); if (p) { if (Array.isArray(p)) p.forEach(s => n.sections.push(s)); else n.sections.push(p); } }
    hubs = []; obuf = []; rbuf = []; qbuf = []; sbuf = []; heading = ""; phase = null; inFence = false;
  }

  let i = 0;
  // skip header
  while (i < lines.length && !isSep(lines[i]) && !is(lines[i], /^# WORLD/) && !is(lines[i], /^## Node/)) i++;

  for (; i < lines.length; i++) {
    const l = lines[i], t = l.trim();

    // Double separator → check if world boundary or within-world node separator
    if (isSep(t) && i + 1 < lines.length && isSep(lines[i+1].trim())) {
      i++; // consume second ---
      // Look ahead past empty lines to determine context
      let look = i + 1;
      while (look < lines.length && !lines[look].trim()) look++;
      const nextContent = look < lines.length ? lines[look].trim() : "";

      if (is(lines[look] || "", /^# WORLD/)) {
        // World boundary
        flush();
        if (n && w) { w.nodes.push(n); n = null; }
        if (w) { worlds.push(w); w = null; }
      } else {
        // Within-world node separator
        flush();
        if (n && w) { w.nodes.push(n); n = null; }
      }
      phase = null;
      continue;
    }

    if (is(l, /^# WORLD/)) { flush(); if (n && w) { w.nodes.push(n); n = null; } if (w) worlds.push(w); const wi = extractWorld(l); w = { id: wi.id, title: wi.title, subtitle: "", nodes: [] }; phase = null; continue; }
    if (is(l, /^## Node/)) { flush(); if (n && w) w.nodes.push(n); const ni = extractNode(l); n = { id: ni.id, worldId: w ? w.id : 0, title: ni.title, order: ni.id, hook: "", objectives: [], sections: [], resources: [], quiz: [] }; phase = null; continue; }
    if (!n) continue;

    if (phase === "content" && /^```/.test(t)) { inFence = !inFence; }

    if (is(l, /^### 🎯 Hook/)) { flush(); phase = "hook"; continue; }
    if (is(l, /^### 📌 Learning Objectives/)) { flush(); phase = "objectives"; continue; }
    if (is(l, /^### 🔗 Free Resources/)) { flush(); phase = "resources"; continue; }
    if (is(l, /^### 📝 Quiz/)) { flush(); phase = "quiz"; continue; }
    if (!inFence && is(l, /^### /)) { flush(); phase = "content"; heading = t.replace(/^###\s+/, "").trim(); continue; }

    if (phase === "hook") hubs.push(l);
    else if (phase === "objectives") obuf.push(l);
    else if (phase === "resources") rbuf.push(l);
    else if (phase === "quiz") qbuf.push(l);
    else if (phase === "content") sbuf.push(l);
  }

  flush();
  if (n && w) w.nodes.push(n);
  if (w) worlds.push(w);
  return worlds;
}

function validate(worlds) {
  const errors = [];
  let total = 0; const ids = new Set();
  for (const w of worlds) {
    for (const n of w.nodes) {
      total++;
      if (ids.has(n.id)) errors.push(`Duplicate node ${n.id}`);
      ids.add(n.id);
      if (!n.hook) errors.push(`Node ${n.id}: missing hook`);
      if (!n.objectives.length) errors.push(`Node ${n.id}: missing objectives`);
      if (!n.resources.length) errors.push(`Node ${n.id}: missing resources`);
      if (!n.quiz.length) errors.push(`Node ${n.id}: missing quiz`);
      for (const q of n.quiz) { if (!q.options.some(o => o.correct)) errors.push(`Node ${n.id}: Q "${q.question.slice(0,50)}..." has no ✅`); }
    }
  }
  if (total !== 42) errors.push(`Expected 42 nodes, got ${total}`);
  return errors;
}

function main() {
  const raw = fs.readFileSync(INPUT, "utf-8");
  const lines = raw.split("\n").map(l => l.replace(/\r$/, ""));
  const worlds = parseModule(lines);
  const errors = validate(worlds);
  if (errors.length) { console.error("Validation errors:"); errors.forEach(e => console.error("  ❌", e)); process.exit(1); }

  const dir = path.dirname(OUTPUT);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify({ worlds }, null, 2), "utf-8");

  let sc = 0, qc = 0;
  for (const w of worlds) for (const n of w.nodes) { sc += n.sections.length; qc += n.quiz.length; }
  console.log(`✅ ${worlds.length} worlds, ${worlds.reduce((a,w) => a + w.nodes.length, 0)} nodes`);
  console.log(`   ${sc} sections, ${qc} quiz questions`);
  console.log(`   → ${OUTPUT}`);
}

main();

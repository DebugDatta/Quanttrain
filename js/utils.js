export const $ = (sel, ctx) => (ctx || document).querySelector(sel);
export const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

export function el(tag, attrs, ...children) {
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') e.className = v;
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    if (typeof c === 'string' || typeof c === 'number') e.appendChild(document.createTextNode(c));
    else if (c.nodeType) e.appendChild(c);
  }
  return e;
}

export function show(viewId) {
  $$('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById(viewId);
  if (view) { view.classList.add('active'); view.classList.remove('fade-in'); void view.offsetWidth; view.classList.add('fade-in'); }
}

export function navigate(hash) { window.location.hash = hash; }

export function getCurriculum() {
  if (window.__curriculum) return window.__curriculum;
  try {
    const d = document.getElementById('curriculum-data');
    if (d) { window.__curriculum = JSON.parse(d.textContent); return window.__curriculum; }
  } catch (e) { console.error('Failed to parse curriculum:', e); }
  return null;
}

export function getNode(nodeId) {
  const data = getCurriculum(); if (!data) return null;
  for (const w of data.worlds) for (const n of w.nodes) { if (n.id === nodeId) return n; }
  return null;
}

export function getWorld(worldId) {
  const data = getCurriculum(); if (!data) return null;
  return data.worlds.find(w => w.id === worldId);
}

export function getWorldForNode(nodeId) {
  const data = getCurriculum(); if (!data) return null;
  for (const w of data.worlds) for (const n of w.nodes) { if (n.id === nodeId) return w; }
  return null;
}

export function getNextNode(nodeId) {
  const data = getCurriculum(); if (!data) return null;
  let found = false;
  for (const w of data.worlds) for (const n of w.nodes) { if (found) return n; if (n.id === nodeId) found = true; }
  return null;
}

var ENTITY_MAP = {
  0x2014: '&mdash;',
  0x2013: '&ndash;',
  0x2192: '&rarr;',
  0x2190: '&larr;',
  0x20B9: '&#8377;',
  0x00B2: '&sup2;',
  0x00B3: '&sup3;',
  0x00D7: '&times;',
  0x00F7: '&divide;',
  0x2212: '&minus;',
  0x2264: '&le;',
  0x2265: '&ge;',
  0x00B1: '&plusmn;',
  0x03A0: '&Pi;',
  0x03A3: '&Sigma;',
  0x03BB: '&lambda;',
  0x2713: '&#10003;',
  0x25B6: '&#9654;',
  0x2714: '&#10004;'
};

export function escapeHtml(str) {
  if (!str) return '';
  var d = document.createElement('div');
  d.textContent = str;
  var html = d.innerHTML;
  return html.replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])|[^\x00-\x7F]/g, function(match, pair) {
    if (pair) {
      var hi = pair.charCodeAt(0);
      var lo = pair.charCodeAt(1);
      var code = (hi - 0xD800) * 0x400 + (lo - 0xDC00) + 0x10000;
      return '&#x' + code.toString(16) + ';';
    }
    return ENTITY_MAP[match.charCodeAt(0)] || '&#' + match.charCodeAt(0) + ';';
  });
}

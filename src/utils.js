'use strict';

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function parseDate(s) {
  if (!s || s === '—') return null;
  const p = s.split('.');
  if (p.length === 3) return new Date(+p[2], +p[1] - 1, +p[0]);
  return null;
}

function fmtDate(d) {
  if (!d) return '—';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toInputDate(s) {
  if (!s || s === '—') return '';
  const p = s.split('.');
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : '';
}

function fromInputDate(v) {
  if (!v) return '';
  const p = v.split('-');
  return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : '';
}

function fmtPrice(n) {
  if (!n && n !== 0) return '—';
  return Number(n).toLocaleString('ru-RU') + ' ₴';
}

function hexToRgba(hex, a) {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

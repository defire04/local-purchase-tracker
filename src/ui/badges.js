'use strict';

const COLOR_PALETTE = [
  '#b91c1c', '#ef4444', '#f87171', '#fca5a5',
  '#e11d48', '#fb7185', '#f472b6', '#ec4899',
  '#c2410c', '#f97316', '#fb923c', '#fdba74',
  '#a16207', '#eab308', '#fbbf24', '#fcd34d',
  '#15803d', '#22c55e', '#4ade80', '#86efac',
  '#047857', '#10b981', '#34d399', '#6ee7b7',
  '#0e7490', '#06b6d4', '#67e8f9',
  '#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#38bdf8',
  '#4338ca', '#818cf8', '#a5b4fc',
  '#6d28d9', '#8b5cf6', '#a78bfa',
  '#7e22ce', '#c084fc',
  '#a21caf', '#e879f9', '#d946ef',
  '#64748b', '#94a3b8', '#8da0bc',
];

function wBadge(ws) {
  const cls = {
    ok: 'badge-ok',
    warn: 'badge-warn',
    expired: 'badge-expired',
    none: 'badge-none',
    returned: 'badge-returned',
    written_off: 'badge-written_off',
  };
  const dot = { ok: 'wdot-ok', warn: 'wdot-warn', expired: 'wdot-expired' };
  const dc = dot[ws.s] ? `<span class="wdot ${dot[ws.s]}"></span>` : '';
  return `<span class="badge ${cls[ws.s] || 'badge-none'}">${dc}${esc(ws.label)}</span>`;
}

function statusBadge(status) {
  const map = {
    active: ['badge-status-active', T.badgeActive],
    returned: ['badge-status-returned', T.badgeReturned],
    written_off: ['badge-status-written_off', T.badgeWrittenOff],
  };
  const [cls, label] = map[status] || ['badge-none', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function shopBadge(shopId) {
  const shop = ShopService.findById(shopId);
  const name = shop ? shop.name : (shopId || '—');
  const color = shop?.color ?? '#8da0bc';
  const style = `background:${hexToRgba(color, .15)};color:${color};border:1px solid ${hexToRgba(color, .3)}`;
  return `<span class="shop-badge" style="${style}">${esc(name)}</span>`;
}

'use strict';

const COLOR_PALETTE = [
  '#b91c1c','#ef4444','#f87171','#fca5a5',
  '#e11d48','#fb7185','#f472b6','#ec4899',
  '#c2410c','#f97316','#fb923c','#fdba74',
  '#a16207','#eab308','#fbbf24','#fcd34d',
  '#15803d','#22c55e','#4ade80','#86efac',
  '#047857','#10b981','#34d399','#6ee7b7',
  '#0e7490','#06b6d4','#67e8f9',
  '#1d4ed8','#3b82f6','#60a5fa','#93c5fd','#38bdf8',
  '#4338ca','#818cf8','#a5b4fc',
  '#6d28d9','#8b5cf6','#a78bfa',
  '#7e22ce','#c084fc',
  '#a21caf','#e879f9','#d946ef',
  '#64748b','#94a3b8','#8da0bc',
];

function shopById(id)     { return Store.shops.find(s => s.id === id); }
function shopName(id)     { const s = shopById(id); return s ? s.name : (id || '—'); }
function catById(id)      { return Store.cats.find(c => c.id === id); }
function catIsService(id) { const c = catById(id); return c && c.isService; }

function warrantyEnd(it) {
  if (!it.warrantyMonths || !it.date) return null;
  const start = parseDate(it.date);
  if (!start) return null;
  const end = new Date(start);
  end.setMonth(end.getMonth() + Number(it.warrantyMonths));
  return end;
}

function warrantyStatus(item) {
  if (item.status === 'returned')    return { s: 'returned',    label: T.wBadgeReturned,   end: null };
  if (item.status === 'written_off') return { s: 'written_off', label: T.wBadgeWrittenOff, end: null };
  if (!item.warrantyMonths)          return { s: 'none',        label: T.wBadgeNone,        end: null };
  const end = warrantyEnd(item);
  if (!end) return { s: 'none', label: T.wBadgeNone, end: null };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ml = Math.round((end - today) / (1000 * 60 * 60 * 24 * 30.44));
  if (ml < 0)  return { s: 'expired', label: T.wBadgeExpired,        end };
  if (ml <= 6) return { s: 'warn',    label: `${ml} ${T.months}`,    end };
  return              { s: 'ok',      label: `${ml} ${T.months}`,    end };
}

function wBadge(ws) {
  const cls = { ok:'badge-ok', warn:'badge-warn', expired:'badge-expired', none:'badge-none', returned:'badge-returned', written_off:'badge-written_off' };
  const dot  = { ok:'wdot-ok', warn:'wdot-warn', expired:'wdot-expired' };
  const dc   = dot[ws.s] ? `<span class="wdot ${dot[ws.s]}"></span>` : '';
  return `<span class="badge ${cls[ws.s] || 'badge-none'}">${dc}${esc(ws.label)}</span>`;
}

function statusBadge(status) {
  const map = {
    active:      ['badge-status-active',      T.badgeActive],
    returned:    ['badge-status-returned',    T.badgeReturned],
    written_off: ['badge-status-written_off', T.badgeWrittenOff],
  };
  const [cls, label] = map[status] || ['badge-none', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function shopBadge(shopId) {
  const s     = shopById(shopId);
  const name  = s ? s.name : (shopId || '—');
  const color = s && s.color ? s.color : '#8da0bc';
  const style = `background:${hexToRgba(color, .15)};color:${color};border:1px solid ${hexToRgba(color, .3)}`;
  return `<span class="shop-badge" style="${style}">${esc(name)}</span>`;
}

function migrateItem(item) {
  if (item.receipt && !item.receipts) {
    const v = item.receipt;
    const isUrl = /^https?:\/\//.test(v);
    const isPdf = /\.pdf$/i.test(v);
    const type = isUrl ? 'url' : isPdf ? 'pdf' : 'photo';
    item.receipts = [{ type, label: T.rcptDefaultLabel[type], value: v }];
    delete item.receipt;
  }
  if (!item.receipts) item.receipts = [];
  return item;
}

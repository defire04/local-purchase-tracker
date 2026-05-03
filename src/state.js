'use strict';

const EV_LABELS = {
  warranty_claim: 'Гарантийный случай',
  repair:         'Ремонт',
  returned:       'Возврат',
  note:           'Заметка'
};

const COLOR_PALETTE = [
  '#60a5fa','#e879f9','#fb923c','#4ade80','#f87171',
  '#a5b4fc','#67e8f9','#86efac','#fdba74','#fb7185',
  '#fcd34d','#34d399','#f472b6','#818cf8','#38bdf8'
];

const RCPT_TYPES = [
  { value: 'url',   label: '🔗 Ссылка' },
  { value: 'pdf',   label: '📄 PDF'    },
  { value: 'photo', label: '📷 Фото'   }
];

let dirHandle = null, dataFH = null, shopsFH = null, catsFH = null;
let data = [], shops = [], cats = [];
let dirty = { data: false, shops: false, cats: false };
let openItemIds = new Set();
let currentView = 'list';
let sortCol = null, sortDir = 'desc';
let groupBy = '';

function shopById(id)     { return shops.find(s => s.id === id); }
function shopName(id)     { const s = shopById(id); return s ? s.name : (id || '—'); }
function catById(id)      { return cats.find(c => c.id === id); }
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
  if (item.status === 'returned')    return { s: 'returned',    label: 'Возврат', end: null };
  if (item.status === 'written_off') return { s: 'written_off', label: 'Списан',  end: null };
  if (!item.warrantyMonths)          return { s: 'none',        label: '—',       end: null };
  const end = warrantyEnd(item);
  if (!end) return { s: 'none', label: '—', end: null };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ml = Math.round((end - today) / (1000 * 60 * 60 * 24 * 30.44));
  if (ml < 0)  return { s: 'expired', label: 'Истекла',     end };
  if (ml <= 6) return { s: 'warn',    label: `${ml} мес.`, end };
  return              { s: 'ok',      label: `${ml} мес.`, end };
}

function wBadge(ws) {
  const cls = { ok:'badge-ok', warn:'badge-warn', expired:'badge-expired', none:'badge-none', returned:'badge-returned', written_off:'badge-written_off' };
  const dot  = { ok:'wdot-ok', warn:'wdot-warn', expired:'wdot-expired' };
  const dc   = dot[ws.s] ? `<span class="wdot ${dot[ws.s]}"></span>` : '';
  return `<span class="badge ${cls[ws.s] || 'badge-none'}">${dc}${esc(ws.label)}</span>`;
}

function statusBadge(status) {
  const map = { active:['badge-status-active','Активен'], returned:['badge-status-returned','Возврат'], written_off:['badge-status-written_off','Списан'] };
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

function defaultShops() { return []; }

function defaultCats() {
  return [
    { id: 'electronics', name: 'Электроника',    isService: false },
    { id: 'clothing',    name: 'Одежда',          isService: false },
    { id: 'furniture',   name: 'Мебель',          isService: false },
    { id: 'appliances',  name: 'Бытовая техника', isService: false },
    { id: 'services',    name: 'Услуги',           isService: true  },
    { id: 'other',       name: 'Разное',           isService: false }
  ];
}

function migrateItem(item) {
  if (item.receipt && !item.receipts) {
    const v = item.receipt;
    const isUrl = /^https?:\/\//.test(v);
    const isPdf = /\.pdf$/i.test(v);
    item.receipts = [{
      type:  isUrl ? 'url' : isPdf ? 'pdf' : 'photo',
      label: isUrl ? 'Чек' : isPdf ? 'PDF чек' : 'Фото чека',
      value: v
    }];
    delete item.receipt;
  }
  if (!item.receipts) item.receipts = [];
  return item;
}

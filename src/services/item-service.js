'use strict';

const ItemService = {
  save(item) {
    const idx = AppContext.data.findIndex(x => x.id === item.id);
    if (idx >= 0) {
      AppContext.data[idx] = item;
    } else {
      AppContext.data.unshift(item);
    }
  },

  remove(id) {
    AppContext.setData(AppContext.data.filter(x => x.id !== id));
    AppContext.openItemIds.delete(id);
  },

  addEvent(id, ev) {
    const it = AppContext.data.find(x => x.id === id);
    if (!it) {
      return null;
    }
    if (!it.events) {
      it.events = [];
    }
    it.events.push(ev);
    return it;
  },

  warrantyEnd(item) {
    if (!item.warrantyMonths || !item.date) {
      return null;
    }
    const start = parseDate(item.date);
    if (!start) {
      return null;
    }
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(item.warrantyMonths));
    return end;
  },

  warrantyStatus(item) {
    if (item.status === 'returned') {
      return { s: 'returned', label: T.wBadgeReturned, end: null };
    }
    if (item.status === 'written_off') {
      return { s: 'written_off', label: T.wBadgeWrittenOff, end: null };
    }
    if (!item.warrantyMonths) {
      return { s: 'none', label: T.wBadgeNone, end: null };
    }
    const end = ItemService.warrantyEnd(item);
    if (!end) {
      return { s: 'none', label: T.wBadgeNone, end: null };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ml = Math.round((end - today) / (1000 * 60 * 60 * 24 * 30.44));
    if (ml < 0) {
      return { s: 'expired', label: T.wBadgeExpired, end };
    }
    if (ml <= 6) {
      return { s: 'warn', label: `${ml} ${T.months}`, end };
    }
    return { s: 'ok', label: `${ml} ${T.months}`, end };
  },
};

'use strict';

const ItemService = {
  save(item) {
    const idx = Store.data.findIndex(x => x.id === item.id);
    if (idx >= 0) Store.data[idx] = item;
    else Store.data.unshift(item);
  },

  remove(id) {
    Store.setData(Store.data.filter(x => x.id !== id));
    Store.openItemIds.delete(id);
  },

  addEvent(id, ev) {
    const it = Store.data.find(x => x.id === id);
    if (!it) return null;
    if (!it.events) it.events = [];
    it.events.push(ev);
    return it;
  },
};

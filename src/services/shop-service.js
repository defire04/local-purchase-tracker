'use strict';

const ShopService = {
  findById(id) {
    return AppContext.shops.find(s => s.id === id);
  },

  getName(id) {
    const shop = ShopService.findById(id);
    return shop ? shop.name : (id || '—');
  },

  save(shop) {
    const idx = AppContext.shops.findIndex(s => s.id === shop.id);
    if (idx >= 0) {
      AppContext.shops[idx] = shop;
    } else {
      AppContext.shops.push(shop);
    }
  },

  remove(id) {
    AppContext.setShops(AppContext.shops.filter(x => x.id !== id));
  },
};

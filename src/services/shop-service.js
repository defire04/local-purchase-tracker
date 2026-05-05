'use strict';

const ShopService = {
  save(shop) {
    const idx = Store.shops.findIndex(s => s.id === shop.id);
    if (idx >= 0) Store.shops[idx] = shop;
    else Store.shops.push(shop);
  },

  remove(id) {
    Store.setShops(Store.shops.filter(x => x.id !== id));
  },
};

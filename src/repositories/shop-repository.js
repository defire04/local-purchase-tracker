'use strict';

const ShopRepository = {
  async load() {
    AppContext.setShopsFH(await getOrCreateFH('shops.json'));
    const raw = await readJSON(AppContext.shopsFH);
    AppContext.setShops(Array.isArray(raw) && raw.length ? raw : []);
  },

  async save() {
    if (!AppContext.dirty.shops && AppContext.shopsFH) {
      return;
    }
    if (!AppContext.shopsFH) {
      AppContext.setShopsFH(await getOrCreateFH('shops.json'));
    }
    await writeJSON(AppContext.shopsFH, AppContext.shops);
  },

  download() {
    downloadJSON('shops.json', AppContext.shops);
  },

  async loadFromFile(file) {
    const raw = await readFileAsJSON(file);
    AppContext.setShops(Array.isArray(raw) && raw.length ? raw : []);
  },
};

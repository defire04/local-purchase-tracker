'use strict';

function migrateItem(item) {
  if (item.receipt && !item.receipts) {
    const v = item.receipt;
    const isUrl = /^https?:\/\//.test(v);
    const isPdf = /\.pdf$/i.test(v);
    let type;
    if (isUrl) {
      type = 'url';
    } else if (isPdf) {
      type = 'pdf';
    } else {
      type = 'photo';
    }
    item.receipts = [{ type, label: T.rcptDefaultLabel[type], value: v }];
    delete item.receipt;
  }
  if (!item.receipts) {
    item.receipts = [];
  }
  return item;
}

const ItemRepository = {
  async load() {
    AppContext.setDataFH(await getOrCreateFH('data.json'));
    const raw = await readJSON(AppContext.dataFH);
    AppContext.setData((Array.isArray(raw) && raw.length ? raw : []).map(migrateItem));
  },

  async save() {
    if (!AppContext.dirty.data && AppContext.dataFH) {
      return;
    }
    if (!AppContext.dataFH) {
      AppContext.setDataFH(await getOrCreateFH('data.json'));
    }
    await writeJSON(AppContext.dataFH, AppContext.data);
  },

  download() {
    downloadJSON('data.json', AppContext.data);
  },

  async loadFromFile(file) {
    const raw = await readFileAsJSON(file);
    AppContext.setData((Array.isArray(raw) ? raw : []).map(migrateItem));
  },
};

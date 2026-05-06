'use strict';

const CategoryRepository = {
  async load() {
    AppContext.setCatsFH(await getOrCreateFH('categories.json'));
    const raw = await readJSON(AppContext.catsFH);
    AppContext.setCats(Array.isArray(raw) && raw.length ? raw : []);
  },

  async save() {
    if (!AppContext.dirty.cats && AppContext.catsFH) {
      return;
    }
    if (!AppContext.catsFH) {
      AppContext.setCatsFH(await getOrCreateFH('categories.json'));
    }
    await writeJSON(AppContext.catsFH, AppContext.cats);
  },

  download() {
    downloadJSON('categories.json', AppContext.cats);
  },

  async loadFromFile(file) {
    const raw = await readFileAsJSON(file);
    AppContext.setCats(Array.isArray(raw) && raw.length ? raw : []);
  },
};

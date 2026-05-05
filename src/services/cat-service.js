'use strict';

const CatService = {
  save(cat) {
    const idx = Store.cats.findIndex(x => x.id === cat.id);
    if (idx >= 0) { Store.cats[idx].name = cat.name; Store.cats[idx].isService = cat.isService; }
    else Store.cats.push(cat);
  },

  remove(id) {
    Store.setCats(Store.cats.filter(x => x.id !== id));
  },
};

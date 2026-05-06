'use strict';

const CategoryService = {
  findById(id) {
    return AppContext.cats.find(c => c.id === id);
  },

  isService(id) {
    return CategoryService.findById(id)?.isService;
  },

  save(category) {
    const idx = AppContext.cats.findIndex(x => x.id === category.id);
    if (idx >= 0) {
      AppContext.cats[idx].name = category.name;
      AppContext.cats[idx].isService = category.isService;
    } else {
      AppContext.cats.push(category);
    }
  },

  remove(id) {
    AppContext.setCats(AppContext.cats.filter(x => x.id !== id));
  },
};

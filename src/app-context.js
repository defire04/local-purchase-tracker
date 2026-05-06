'use strict';

const AppContext = (() => {
  let _dirHandle = null, _dataFH = null, _shopsFH = null, _catsFH = null;
  let _data = [], _shops = [], _cats = [];
  let _dirty = { data: false, shops: false, cats: false };
  let _openItemIds = new Set();
  let _currentView = 'list';
  let _sortCol = null, _sortDir = 'desc';
  let _groupBy = '';

  return {
    get dirHandle()   { return _dirHandle; },
    get dataFH()      { return _dataFH; },
    get shopsFH()     { return _shopsFH; },
    get catsFH()      { return _catsFH; },
    setDirHandle(h)   { _dirHandle = h; },
    setDataFH(h)      { _dataFH = h; },
    setShopsFH(h)     { _shopsFH = h; },
    setCatsFH(h)      { _catsFH = h; },

    get data()        { return _data; },
    get shops()       { return _shops; },
    get cats()        { return _cats; },
    setData(d)        { _data = d; },
    setShops(s)       { _shops = s; },
    setCats(c)        { _cats = c; },

    get dirty()       { return _dirty; },
    markDirty(key)    { _dirty[key] = true; },
    clearDirty()      { _dirty = { data: false, shops: false, cats: false }; },

    get openItemIds() { return _openItemIds; },
    get currentView() { return _currentView; },
    get sortCol()     { return _sortCol; },
    get sortDir()     { return _sortDir; },
    get groupBy()     { return _groupBy; },
    setView(v)        { _currentView = v; },
    setSort(col, dir) { _sortCol = col; _sortDir = dir; },
    setGroupBy(g)     { _groupBy = g; },
  };
})();

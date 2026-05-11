'use strict';

let _toastTm;
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show' + (type ? ' ' + type : '');
  clearTimeout(_toastTm);
  _toastTm = setTimeout(() => (el.className = ''), 3200);
}

let _autoSaveTm;
function markDirty(key) {
  AppContext.markDirty(key);
  document.getElementById('dirtyBadge').style.display = 'flex';
  if (AppContext.dirHandle) {
    clearTimeout(_autoSaveTm);
    _autoSaveTm = setTimeout(() => saveAll(), 600);
  }
}

function clearDirty() {
  AppContext.clearDirty();
  document.getElementById('dirtyBadge').style.display = 'none';
}

function showApp() {
  document.getElementById('connectScreen').style.display = 'none';
  document.getElementById('mainApp').classList.add('visible');
  buildFilters();
  render();
}

function switchView(v) {
  AppContext.setView(v);
  document.getElementById('tabList').classList.toggle('active', v === 'list');
  document.getElementById('tabSettings').classList.toggle('active', v === 'settings');
  document.getElementById('controls').style.display = v === 'list' ? 'flex' : 'none';
  document.getElementById('listView').classList.toggle('active', v === 'list');
  document.getElementById('settingsView').classList.toggle('active', v === 'settings');
  if (v === 'settings') {
    renderSettings();
  }
}

document.addEventListener('click', e => {
  const rcptLink = e.target.closest('[data-receipt]');
  if (rcptLink) {
    e.preventDefault();
    openReceiptFile(rcptLink.dataset.receipt);
    return;
  }

  const el = e.target.closest('[data-action]');
  if (!el) {
    return;
  }
  const action = el.dataset.action;
  const id = el.dataset.id;

  switch (action) {
    case 'toggle-item':   toggleItem(id); break;
    case 'toggle-group':  toggleGroup(id); break;
    case 'sort-col':      handleColSort(el.dataset.col); break;
    case 'edit-item':     openEdit(id); break;
    case 'delete-item':   deleteItem(id); break;
    case 'add-event':     openAddEvent(id); break;
    case 'add-shop':      openAddShop(); break;
    case 'edit-shop':     openEditShop(id); break;
    case 'delete-shop':   deleteShop(id); break;
    case 'add-cat':       openAddCategory(); break;
    case 'edit-cat':      openEditCategory(id); break;
    case 'delete-cat':    deleteCategory(id); break;
    case 'pick-color':    pickColor(el.dataset.color); break;
    case 'remove-row':    el.closest('.spec-row-edit, .ev-edit-row, .receipt-row-edit')?.remove(); break;
    case 'close-modal':   closeModal(el.dataset.modal); break;
    case 'open-import':        openImportModal(); break;
    case 'copy-prompt':        copyImportPrompt(); break;
    case 'import-preview':     previewImport(); break;
    case 'import-save':        saveImport().catch(e => toast(e.message, 'err')); break;
    case 'save-receipt-files': saveReceiptFiles().catch(e => toast(e.message, 'err')); break;
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const sheet = document.getElementById('filterSheet');
    if (sheet && sheet.style.display !== 'none') {
      closeFilterSheet();
      return;
    }
    ['modalItem', 'modalShop', 'modalCat', 'modalEvent', 'modalImport'].forEach(id => {
      if (document.getElementById(id).style.display !== 'none') {
        closeModal(id);
      }
    });
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveAll();
  }
});

['search', 'filterCat', 'filterBrand', 'filterShop', 'filterWarranty', 'filterStatus'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    AppContext.openItemIds.clear();
    updateResetBtn();
    updateFilterCount();
    render();
  });
  el.addEventListener('change', () => {
    AppContext.openItemIds.clear();
    updateResetBtn();
    updateFilterCount();
    render();
  });
});

document.getElementById('groupBy').addEventListener('change', e => {
  AppContext.setGroupBy(e.target.value);
  AppContext.openItemIds.clear();
  render();
});

if (HAS_FSA) {
  const btn = document.getElementById('btnOpenDir');
  btn.style.display = 'flex';
  btn.addEventListener('click', connectDirectory);
}

document.getElementById('fileInput').addEventListener('change', e => {
  if (e.target.files.length) {
    loadMultipleFiles(e.target.files);
  }
});

document.getElementById('btnEmpty').addEventListener('click', () => {
  AppContext.setData([]);
  AppContext.setShops([]);
  AppContext.setCats([]);
  showApp();
});

document.getElementById('listView').classList.add('active');

new ResizeObserver(entries => {
  const h = entries[0]?.contentRect.height;
  if (h) {
    document.documentElement.style.setProperty('--ctrl-h', h + 'px');
  }
}).observe(document.getElementById('controls'));

updateFilterCount();

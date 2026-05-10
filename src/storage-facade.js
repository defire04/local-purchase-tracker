'use strict';

const HAS_FSA = typeof globalThis.showDirectoryPicker === 'function';

async function connectDirectory() {
  try {
    AppContext.setDirHandle(await globalThis.showDirectoryPicker({ mode: 'readwrite' }));
    await readAllFiles();
  } catch (e) {
    if (e.name !== 'AbortError') {
      toast(T.toastOpenErr, 'err');
    }
  }
}

async function getOrCreateFH(name) {
  return AppContext.dirHandle.getFileHandle(name, { create: true });
}

async function readJSON(fh) {
  try {
    const f = await fh.getFile();
    const t = await f.text();
    return t.trim() ? JSON.parse(t) : null;
  } catch {
    return null;
  }
}

async function writeJSON(fh, obj) {
  const w = await fh.createWritable();
  await w.write(JSON.stringify(obj, null, 2));
  await w.close();
}

function downloadJSON(name, obj) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
  a.download = name;
  a.click();
}

async function readFileAsJSON(file) {
  const text = await file.text();
  return JSON.parse(text);
}

async function ensureWritePermission() {
  if (!AppContext.dirHandle) {
    return false;
  }
  const opts = { mode: 'readwrite' };
  if ((await AppContext.dirHandle.queryPermission(opts)) === 'granted') {
    return true;
  }
  try {
    return (await AppContext.dirHandle.requestPermission(opts)) === 'granted';
  } catch {
    return false;
  }
}

async function readAllFiles() {
  try {
    await ItemRepository.load();
    await ShopRepository.load();
    await CategoryRepository.load();
    showApp();
    toast(T.toastLoaded(AppContext.data.length, AppContext.shops.length), AppContext.shops.length ? 'ok' : '');
  } catch (e) {
    console.error(e);
    toast(T.toastReadErr, 'err');
  }
}

async function saveAll() {
  if (AppContext.dirHandle) {
    const ok = await ensureWritePermission();
    if (!ok) {
      toast(T.toastWriteDenied, 'err');
      return;
    }
    try {
      await ItemRepository.save();
      await ShopRepository.save();
      await CategoryRepository.save();
      clearDirty();
      toast(T.toastSaved, 'ok');
      return;
    } catch (e) {
      console.error('FSA write error:', e);
      toast(T.toastWriteErr(e.message), 'err');
      return;
    }
  }
  ItemRepository.download();
  ShopRepository.download();
  CategoryRepository.download();
  clearDirty();
  toast(T.toastDownloaded, 'ok');
}

async function openReceiptFile(filename) {
  if (!AppContext.dirHandle) {
    return;
  }
  try {
    const receiptsDir = await AppContext.dirHandle.getDirectoryHandle('receipts');
    const fh = await receiptsDir.getFileHandle(filename);
    const file = await fh.getFile();
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    toast(T.toastReadErr, 'err');
  }
}

async function loadMultipleFiles(files) {
  const find = name => [...files].find(f => f.name === name);
  const dataFile = find('data.json');
  const shopsFile = find('shops.json');
  const catsFile = find('categories.json');
  if (!dataFile) {
    toast(T.toastReadErr, 'err');
    return;
  }
  try {
    await ItemRepository.loadFromFile(dataFile);
    if (shopsFile) {
      await ShopRepository.loadFromFile(shopsFile).catch(() => {});
    }
    if (catsFile) {
      await CategoryRepository.loadFromFile(catsFile).catch(() => {});
    }
    showApp();
    toast(T.toastLoaded(AppContext.data.length, AppContext.shops.length), 'ok');
  } catch {
    toast(T.toastReadErr, 'err');
  }
}

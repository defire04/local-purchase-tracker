'use strict';

const HAS_FSA = typeof window.showDirectoryPicker === 'function';

async function connectDirectory() {
  try {
    Store.setDirHandle(await window.showDirectoryPicker({ mode: 'readwrite' }));
    await readAllFiles();
  } catch (e) {
    if (e.name !== 'AbortError') toast(T.toastOpenErr, 'err');
  }
}

async function getOrCreateFH(name) {
  return Store.dirHandle.getFileHandle(name, { create: true });
}

async function readJSON(fh) {
  try {
    const f = await fh.getFile();
    const t = await f.text();
    return t.trim() ? JSON.parse(t) : null;
  } catch { return null; }
}

async function writeJSON(fh, obj) {
  const w = await fh.createWritable();
  await w.write(JSON.stringify(obj, null, 2));
  await w.close();
}

async function readAllFiles() {
  try {
    Store.setDataFH(await getOrCreateFH('data.json'));
    Store.setShopsFH(await getOrCreateFH('shops.json'));
    Store.setCatsFH(await getOrCreateFH('categories.json'));
    const d = await readJSON(Store.dataFH);
    const s = await readJSON(Store.shopsFH);
    const c = await readJSON(Store.catsFH);
    Store.setData((Array.isArray(d) && d.length ? d : []).map(migrateItem));
    Store.setShops(Array.isArray(s) && s.length ? s : []);
    Store.setCats(Array.isArray(c) && c.length ? c : []);
    showApp();
    toast(T.toastLoaded(Store.data.length, Store.shops.length), Store.shops.length ? 'ok' : '');
  } catch (e) {
    console.error(e);
    toast(T.toastReadErr, 'err');
  }
}

async function ensureWritePermission() {
  if (!Store.dirHandle) return false;
  const opts = { mode: 'readwrite' };
  if ((await Store.dirHandle.queryPermission(opts)) === 'granted') return true;
  try { return (await Store.dirHandle.requestPermission(opts)) === 'granted'; }
  catch { return false; }
}

async function saveAll() {
  if (Store.dirHandle) {
    const ok = await ensureWritePermission();
    if (!ok) { toast(T.toastWriteDenied, 'err'); return; }
    try {
      if (Store.dirty.data  || !Store.dataFH)  { if (!Store.dataFH)  Store.setDataFH(await getOrCreateFH('data.json'));         await writeJSON(Store.dataFH,  Store.data);  }
      if (Store.dirty.shops || !Store.shopsFH) { if (!Store.shopsFH) Store.setShopsFH(await getOrCreateFH('shops.json'));       await writeJSON(Store.shopsFH, Store.shops); }
      if (Store.dirty.cats  || !Store.catsFH)  { if (!Store.catsFH)  Store.setCatsFH(await getOrCreateFH('categories.json'));   await writeJSON(Store.catsFH,  Store.cats);  }
      clearDirty();
      toast(T.toastSaved, 'ok');
      return;
    } catch (e) {
      console.error('FSA write error:', e);
      toast(T.toastWriteErr(e.message), 'err');
      return;
    }
  }
  downloadJSON('data.json',       Store.data);
  downloadJSON('shops.json',      Store.shops);
  downloadJSON('categories.json', Store.cats);
  clearDirty();
  toast(T.toastDownloaded, 'ok');
}

function downloadJSON(name, obj) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
  a.download = name;
  a.click();
}

function readFileAsJSON(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => { try { res(JSON.parse(e.target.result)); } catch { rej(); } };
    r.onerror = rej;
    r.readAsText(file);
  });
}

async function loadMultipleFiles(files) {
  const find = name => [...files].find(f => f.name === name);
  const df = find('data.json'), sf = find('shops.json'), cf = find('categories.json');
  if (!df) { toast(T.toastReadErr, 'err'); return; }
  try {
    const rawD = await readFileAsJSON(df);
    Store.setData((Array.isArray(rawD) ? rawD : []).map(migrateItem));
    const rawS = sf ? await readFileAsJSON(sf).catch(() => []) : [];
    Store.setShops(Array.isArray(rawS) && rawS.length ? rawS : []);
    const rawC = cf ? await readFileAsJSON(cf).catch(() => []) : [];
    Store.setCats(Array.isArray(rawC) && rawC.length ? rawC : []);
    showApp();
    toast(T.toastLoaded(Store.data.length, Store.shops.length), 'ok');
  } catch { toast(T.toastReadErr, 'err'); }
}

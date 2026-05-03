'use strict';

const HAS_FSA = typeof window.showDirectoryPicker === 'function';

async function connectDirectory() {
  try {
    dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    await readAllFiles();
  } catch (e) {
    if (e.name !== 'AbortError') toast(T.toastOpenErr, 'err');
  }
}

async function getOrCreateFH(name) {
  return dirHandle.getFileHandle(name, { create: true });
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
    dataFH  = await getOrCreateFH('data.json');
    shopsFH = await getOrCreateFH('shops.json');
    catsFH  = await getOrCreateFH('categories.json');
    const d = await readJSON(dataFH);
    const s = await readJSON(shopsFH);
    const c = await readJSON(catsFH);
    data  = (Array.isArray(d) && d.length ? d : []).map(migrateItem);
    shops = Array.isArray(s) && s.length ? s : defaultShops();
    cats  = Array.isArray(c) && c.length ? c : defaultCats();
    showApp();
    toast(T.toastLoaded(data.length, shops.length), shops.length ? 'ok' : '');
  } catch (e) {
    console.error(e);
    toast(T.toastReadErr, 'err');
  }
}

async function ensureWritePermission() {
  if (!dirHandle) return false;
  const opts = { mode: 'readwrite' };
  if ((await dirHandle.queryPermission(opts)) === 'granted') return true;
  try { return (await dirHandle.requestPermission(opts)) === 'granted'; }
  catch { return false; }
}

async function saveAll() {
  if (dirHandle) {
    const ok = await ensureWritePermission();
    if (!ok) {
      toast(T.toastWriteDenied, 'err');
      return;
    }
    try {
      if (dirty.data  || !dataFH)  { if (!dataFH)  dataFH  = await getOrCreateFH('data.json');       await writeJSON(dataFH,  data);  }
      if (dirty.shops || !shopsFH) { if (!shopsFH) shopsFH = await getOrCreateFH('shops.json');      await writeJSON(shopsFH, shops); }
      if (dirty.cats  || !catsFH)  { if (!catsFH)  catsFH  = await getOrCreateFH('categories.json'); await writeJSON(catsFH,  cats);  }
      clearDirty();
      toast(T.toastSaved, 'ok');
      return;
    } catch (e) {
      console.error('FSA write error:', e);
      toast(T.toastWriteErr(e.message), 'err');
      return;
    }
  }
  if (dirty.data)  downloadJSON('data.json',       data);
  if (dirty.shops) downloadJSON('shops.json',      shops);
  if (dirty.cats)  downloadJSON('categories.json', cats);
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
    data  = (Array.isArray(rawD) ? rawD : []).map(migrateItem);
    shops = sf ? await readFileAsJSON(sf).catch(() => defaultShops()) : defaultShops();
    cats  = cf ? await readFileAsJSON(cf).catch(() => defaultCats())  : defaultCats();
    if (!Array.isArray(shops) || !shops.length) shops = defaultShops();
    if (!Array.isArray(cats)  || !cats.length)  cats  = defaultCats();
    showApp();
    toast(T.toastLoaded(data.length, shops.length), 'ok');
  } catch { toast(T.toastReadErr, 'err'); }
}

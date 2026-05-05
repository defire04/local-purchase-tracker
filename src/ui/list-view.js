'use strict';

function render() {
  if (Store.currentView !== 'list') return;
  const list  = getFiltered();
  const total = list.reduce((s, i) => s + (i.price || 0), 0);
  document.getElementById('statCount').textContent = list.length;
  document.getElementById('statSum').textContent   = fmtPrice(total);
  updateResetBtn();

  const el = document.getElementById('listView');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-ico">🔍</div><h3>${T.emptyTitle}</h3><p>${T.emptyText}</p></div>`;
    return;
  }

  const cols = [
    { id: 'name',     label: T.colName,      sortable: true,  cls: 'col-name'     },
    { id: 'brand',    label: T.colBrand,     sortable: true,  cls: 'col-brand'    },
    { id: 'shop',     label: T.colShopOrder, sortable: false, cls: 'col-shop'     },
    { id: 'date',     label: T.colDate,      sortable: true,  cls: 'col-date'     },
    { id: 'price',    label: T.colPrice,     sortable: true,  cls: 'col-price'    },
    { id: 'warranty', label: T.colWarranty,  sortable: true,  cls: 'col-warranty' },
    { id: 'status',   label: T.colStatus,    sortable: false, cls: 'col-status'   },
  ];

  const colgroup = `<colgroup>${cols.map(c => `<col class="${c.cls}">`).join('')}</colgroup>`;
  const thead = `<thead><tr>${cols.map(c => {
    const active = Store.sortCol === c.id;
    const ico    = active ? (Store.sortDir === 'asc' ? '↑' : '↓') : '↕';
    const sc     = c.sortable ? ('th-sort' + (active ? ' active' : '')) : '';
    const da     = c.sortable ? `data-action="sort-col" data-col="${c.id}"` : '';
    return `<th class="th-${c.id} ${c.cls} ${sc}" ${da}>${esc(c.label)}${c.sortable ? `<i class="sort-ico">${ico}</i>` : ''}</th>`;
  }).join('')}</tr></thead>`;

  let tbody = '<tbody>';
  if (isGroupedMode()) { tbody += renderGroupedRows(list); }
  else                 { list.forEach(it => { tbody += renderItemTr(it, null); tbody += renderDetailTr(it); }); }
  tbody += '</tbody>';

  el.innerHTML = `<table class="items-table">${colgroup}${thead}${tbody}</table>`;
}

function getGroupKey(it) {
  switch (Store.groupBy) {
    case 'order':    return (it.shop || '—') + '||' + (it.order || '');
    case 'shop':     return it.shop || '—';
    case 'month': {
      const d = parseDate(it.date);
      return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : '—';
    }
    case 'category': return it.category || '—';
    default:         return (it.shop || '—') + '||' + (it.order || '');
  }
}

function renderGroupedRows(list) {
  const map = new Map();
  list.forEach(it => {
    const key = getGroupKey(it);
    if (!map.has(key)) map.set(key, { key, items: [] });
    map.get(key).items.push(it);
  });

  const groups = [...map.values()].sort((a, b) => {
    const tA = Math.max(...a.items.map(i => parseDate(i.date)?.getTime() || 0));
    const tB = Math.max(...b.items.map(i => parseDate(i.date)?.getTime() || 0));
    return tB - tA;
  });

  const locale = lang === 'uk' ? 'uk-UA' : lang === 'en' ? 'en-US' : 'ru-RU';
  let html = '';

  groups.forEach(g => {
    const gid        = 'g' + g.key.replace(/[^a-z0-9]/gi, '_');
    const sum        = g.items.reduce((s, i) => s + (i.price || 0), 0);
    const latestDate = g.items.reduce((best, i) => {
      const t = parseDate(i.date)?.getTime() || 0;
      return t > (parseDate(best)?.getTime() || 0) ? i.date : best;
    }, '');

    const shopId    = Store.groupBy === 'order' || Store.groupBy === 'shop' ? (g.items[0]?.shop || null) : null;
    const shopColor = shopId ? (shopById(shopId)?.color || null) : null;
    const tdStyle   = shopColor
      ? `background:${hexToRgba(shopColor, 0.1)};border-left:3px solid ${hexToRgba(shopColor, 0.55)};`
      : 'background:var(--bg3);border-left:3px solid var(--border2);';

    let headerInner = '';
    if (Store.groupBy === 'order') {
      const firstName = g.items[0]?.name || '';
      const namePart  = g.items.length === 1
        ? `<span class="g-name">${esc(firstName)}</span>`
        : `<span class="g-name">${esc(firstName)} <span class="g-more">+${g.items.length - 1} ${T.more}</span></span>`;
      const orderPart = g.items[0]?.order ? `<span class="g-order">${esc(g.items[0].order)}</span>` : '';
      headerInner = `${shopBadge(shopId)}${orderPart}${namePart}
        <span class="g-date">${fmtDate(parseDate(latestDate))}</span>
        ${g.items.length > 1 ? `<span class="g-count">${g.items.length} ${T.positions}</span>` : ''}`;
    } else if (Store.groupBy === 'shop') {
      const firstName = g.items[0]?.name || '';
      const namePart  = g.items.length === 1
        ? `<span class="g-name">${esc(firstName)}</span>`
        : `<span class="g-name">${esc(firstName)} <span class="g-more">+${g.items.length - 1} ${T.more}</span></span>`;
      headerInner = `${shopBadge(shopId)}${namePart}
        <span class="g-count">${g.items.length} ${T.positions}</span>`;
    } else if (Store.groupBy === 'month') {
      const [y, m]   = g.key.split('-');
      const monthLbl = g.key === '—' ? '—' : new Date(+y, +m - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      headerInner = `<span class="g-month-label">${esc(monthLbl)}</span>
        <span class="g-count">${g.items.length} ${T.positions}</span>`;
    } else if (Store.groupBy === 'category') {
      const catObj = Store.cats.find(c => c.id === g.key);
      const catLbl = catObj ? catObj.name : (g.key === '—' ? '—' : g.key);
      headerInner = `<span class="g-cat-label">${esc(catLbl)}</span>
        <span class="g-count">${g.items.length} ${T.positions}</span>`;
    }

    html += `<tr class="group-hdr" id="ghdr-${gid}" data-gid="${gid}" data-open="0" data-action="toggle-group" data-id="${gid}">
      <td colspan="7" style="${tdStyle}"><div class="group-hdr-inner">
        <span class="g-chevron" id="chev-${gid}">▶</span>
        ${headerInner}
        <span class="g-sum">${fmtPrice(sum)}</span>
      </div></td></tr>`;

    g.items.forEach(it => { html += renderItemTr(it, gid); html += renderDetailTr(it); });
  });
  return html;
}

function renderItemTr(it, gid) {
  const ws     = warrantyStatus(it);
  const wEnd   = warrantyEnd(it);
  const isOpen = Store.openItemIds.has(it.id);
  const hidden = gid ? ' style="display:none"' : '';
  return `<tr class="item-tr${isOpen ? ' open' : ''}" id="itr-${it.id}"
    data-group="${gid || ''}" data-id="${it.id}" data-action="toggle-item"${hidden}>
    <td class="td-name"><div class="td-name-inner"><span>${esc(it.name)}</span>
      ${it.serialNumber ? `<code style="font-size:.78rem">🔑 ${esc(it.serialNumber)}</code>` : ''}
      <div class="mobile-meta"><span class="mm-price">${fmtPrice(it.price)}</span><span class="mm-warranty">${wBadge(ws)}</span>${statusBadge(it.status)}</div>
    </div></td>
    <td class="td-brand col-brand">${esc(it.brand || '')}</td>
    <td class="td-shop col-shop">${gid ? '' : shopBadge(it.shop) + (it.order ? ` <span class="order-num">${esc(it.order)}</span>` : '')}</td>
    <td class="td-date col-date">${fmtDate(parseDate(it.date))}</td>
    <td class="td-price">${fmtPrice(it.price)}</td>
    <td class="td-warranty"><div class="warranty-cell">${wBadge(ws)}<span class="warranty-date">${wEnd ? fmtDate(wEnd) : ''}</span></div></td>
    <td class="td-status">${statusBadge(it.status)}</td>
  </tr>`;
}

function renderDetailTr(it) {
  const isOpen = Store.openItemIds.has(it.id);
  return `<tr class="detail-tr" id="dtr-${it.id}" style="${isOpen ? '' : 'display:none'}">
    <td colspan="7"><div class="item-detail">${isOpen ? renderDetail(it) : ''}</div></td>
  </tr>`;
}

function renderDetail(it) {
  const isSvc = catIsService(it.category);
  const specs = Object.entries(it.specs || {});
  const wEnd  = warrantyEnd(it);
  const ws    = warrantyStatus(it);
  const rcpts = it.receipts || [];

  let specsHtml = '<div class="detail-specs">';
  if (!isSvc && it.serialNumber)   specsHtml += specRow(T.specSerial,   `<code>${esc(it.serialNumber)}</code>`);
  if (!isSvc && it.warrantyMonths) specsHtml += specRow(T.specWarranty, `${it.warrantyMonths} ${T.months} ${T.until} ${wEnd ? fmtDate(wEnd) : '—'}`);
  if (isSvc  && it.executor)       specsHtml += specRow(T.specExecutor, esc(it.executor));
  specs.forEach(([k, v]) => specsHtml += specRow(k, esc(v)));
  specsHtml += '</div>';
  if (it.note) specsHtml += `<div class="detail-note">${esc(it.note)}</div>`;

  let rightHtml = '';

  const docLinks = [];
  rcpts.forEach(r => {
    const icon  = r.type === 'url' ? '🔗' : r.type === 'pdf' ? '📄' : '📷';
    const label = r.label || (T.rcptDefaultLabel?.[r.type] || r.type);
    const href  = /^https?:\/\//.test(r.value) ? r.value : `./receipts/${encodeURIComponent(r.value)}`;
    docLinks.push(`<a class="btn btn-ghost btn-sm btn-block" href="${esc(href)}" target="_blank">${icon} ${esc(label)}</a>`);
  });
  if (it.link)             docLinks.push(`<a class="btn btn-ghost btn-sm btn-block" href="${esc(it.link)}"   target="_blank">${T.shopLink}</a>`);
  if (it.ekLink && !isSvc) docLinks.push(`<a class="btn btn-ghost btn-sm btn-block" href="${esc(it.ekLink)}" target="_blank">${T.ekLink}</a>`);

  if (docLinks.length) {
    rightHtml += `<div class="dr-section">
      <div class="dr-title">${T.docLinks}</div>
      <div class="detail-links">${docLinks.join('')}</div>
    </div>`;
  }

  const evs = it.events || [];
  if (evs.length) {
    const evMap = { warranty_claim: T.evWarrantyClaim, repair: T.evRepair, returned: T.evReturned, note: T.evNote };
    rightHtml += `<div class="dr-section">
      <div class="dr-title">${T.history}</div>
      ${evs.map(ev => `<div class="ev-compact">
        <div class="ev-compact-header">
          <span class="ev-date">${esc(ev.date || '')}</span>
          <span class="ev-type-label ev-type-${ev.type}">${esc(evMap[ev.type] || ev.type)}</span>
        </div>
        ${ev.note ? `<div class="ev-compact-note">${esc(ev.note)}</div>` : ''}
      </div>`).join('')}
    </div>`;
  }

  rightHtml += `<div class="detail-actions">
    <button class="btn btn-secondary btn-sm btn-block" data-action="edit-item" data-id="${it.id}">${T.editBtn}</button>
    <button class="btn btn-ghost btn-sm btn-block"     data-action="add-event" data-id="${it.id}">${T.eventBtn}</button>
    <button class="btn btn-danger btn-sm btn-block"    data-action="delete-item" data-id="${it.id}">${T.deleteBtn}</button>
  </div>`;

  return `<div class="item-detail-inner">
    <div class="detail-left">${specsHtml}</div>
    <div class="detail-right">${rightHtml}</div>
  </div>`;
}

function specRow(k, v) {
  return `<div class="spec-entry"><div class="spec-k">${esc(k)}</div><div class="spec-v">${v}</div></div>`;
}

function toggleGroup(gid) {
  const hdr    = document.getElementById('ghdr-' + gid);
  const chev   = document.getElementById('chev-' + gid);
  const isOpen = hdr?.dataset.open === '1';
  hdr.dataset.open = isOpen ? '0' : '1';
  if (chev) { chev.textContent = isOpen ? '▶' : '▼'; chev.classList.toggle('open', !isOpen); }
  document.querySelectorAll(`[data-group="${gid}"].item-tr`).forEach(tr => {
    const itemId = tr.dataset.id;
    tr.style.display = isOpen ? 'none' : '';
    const dtr = document.getElementById('dtr-' + itemId);
    if (dtr) {
      if (isOpen) { dtr.style.display = 'none'; Store.openItemIds.delete(itemId); tr.classList.remove('open'); }
      else        { dtr.style.display = Store.openItemIds.has(itemId) ? '' : 'none'; }
    }
  });
}

function toggleItem(id) {
  const itr = document.getElementById('itr-' + id);
  const dtr = document.getElementById('dtr-' + id);
  if (!dtr) return;
  if (Store.openItemIds.has(id)) {
    Store.openItemIds.delete(id);
    itr?.classList.remove('open');
    dtr.style.display = 'none';
  } else {
    Store.openItemIds.add(id);
    itr?.classList.add('open');
    const it = Store.data.find(x => x.id === id);
    if (it) dtr.querySelector('.item-detail').innerHTML = renderDetail(it);
    dtr.style.display = '';
    setTimeout(() => dtr.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }
}

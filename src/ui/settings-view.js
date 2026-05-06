'use strict';

function renderSettings() {
  document.getElementById('settingsView').innerHTML =
    `<div class="settings-grid">${renderShopsCard()}${renderCategoriesCard()}</div>`;
}

function renderShopsCard() {
  const rows = AppContext.shops.map(s => {
    const color = s.color || '#8da0bc';
    const style = `background:${hexToRgba(color, .15)};color:${color};border:1px solid ${hexToRgba(color, .3)}`;
    return `<div class="settings-list-item">
      <div class="sli-info">
        <div class="sli-name"><span class="shop-badge" style="${style}">${esc(s.name)}</span></div>
        <div class="sli-sub">${s.url ? `<a href="${esc(s.url)}" target="_blank">${esc(s.url)}</a>` : ''}${s.note ? ' · ' + esc(s.note) : ''}</div>
      </div>
      <div class="sli-actions">
        <button class="btn btn-ghost btn-sm btn-icon" data-action="edit-shop" data-id="${esc(s.id)}" title="${T.editBtn}">✏️</button>
        <button class="btn btn-danger btn-sm btn-icon" data-action="delete-shop" data-id="${esc(s.id)}" title="${T.deleteBtn}">🗑</button>
      </div>
    </div>`;
  }).join('');

  return `<div class="settings-card">
    <div class="settings-card-hd"><h3>${T.shopsTitle}</h3><button class="btn btn-primary btn-sm" data-action="add-shop">${T.addBtn}</button></div>
    <div class="settings-list">${rows || `<div style="padding:1rem 1.1rem">
      <div style="color:var(--yellow);font-size:.88rem;font-weight:600;margin-bottom:.35rem">${T.shopsNotLoaded}</div>
      <div style="color:var(--text3);font-size:.82rem;line-height:1.6">
        ${T.hintChrome}<br>${T.hintFirefox}
      </div></div>`}</div>
  </div>`;
}

function renderCategoriesCard() {
  const rows = AppContext.cats.map(c => `<div class="settings-list-item">
    <div class="sli-info">
      <div class="sli-name">${esc(c.name)} ${c.isService ? '<span class="tag" style="font-size:.7rem">S</span>' : ''}</div>
    </div>
    <div class="sli-actions">
      <button class="btn btn-ghost btn-sm btn-icon" data-action="edit-cat" data-id="${esc(c.id)}" title="${T.editBtn}">✏️</button>
      <button class="btn btn-danger btn-sm btn-icon" data-action="delete-cat" data-id="${esc(c.id)}" title="${T.deleteBtn}">🗑</button>
    </div>
  </div>`).join('');

  return `<div class="settings-card">
    <div class="settings-card-hd"><h3>${T.catsTitle}</h3><button class="btn btn-primary btn-sm" data-action="add-cat">${T.addBtn}</button></div>
    <div class="settings-list">${rows || `<div style="padding:1rem;color:var(--text3);font-size:.88rem">${T.emptyList}</div>`}</div>
  </div>`;
}

'use strict';

const LANGS = { ru: LANG_RU, uk: LANG_UK, en: LANG_EN };

let lang = localStorage.getItem('pr_lang') || 'ru';
if (!LANGS[lang]) {
  lang = 'ru';
}
let T = LANGS[lang];

function setLang(l) {
  if (!LANGS[l]) {
    return;
  }
  lang = l;
  T = LANGS[lang];
  localStorage.setItem('pr_lang', lang);
  applyTranslations();
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (typeof T[key] === 'string') {
      el.textContent = T[key];
    }
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (typeof T[key] === 'string') {
      el.innerHTML = T[key];
    }
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh;
    if (typeof T[key] === 'string') {
      el.placeholder = T[key];
    }
  });
  document.querySelectorAll('[data-i18n-opt]').forEach(el => {
    const key = el.dataset.i18nOpt;
    if (typeof T[key] === 'string') {
      el.textContent = T[key];
    }
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  if (typeof buildFilters === 'function') {
    buildFilters();
  }
  if (typeof render === 'function' && AppContext?.currentView === 'list') {
    render();
  }
  if (typeof renderSettings === 'function' && AppContext?.currentView === 'settings') {
    renderSettings();
  }
}

document.addEventListener('DOMContentLoaded', () => applyTranslations());

'use strict';

const FxService = (() => {
  const RATE_KEY = 'pr_fx_usd_rate';
  const TS_KEY = 'pr_fx_usd_ts';
  const MAX_AGE_MS = 24 * 60 * 60 * 1000;
  const NBU_URL = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json';

  let _rate = null;

  return {
    loadCached() {
      const stored = Number.parseFloat(localStorage.getItem(RATE_KEY));
      _rate = Number.isFinite(stored) && stored > 0 ? stored : null;
    },

    getRate() {
      return _rate;
    },

    async refreshIfNeeded(onUpdate) {
      const ts = Number.parseInt(localStorage.getItem(TS_KEY), 10);
      if (Number.isFinite(ts) && Date.now() - ts < MAX_AGE_MS) {
        return;
      }
      try {
        const res = await fetch(NBU_URL);
        const arr = await res.json();
        const rate = arr?.[0]?.rate;
        if (!Number.isFinite(rate) || rate <= 0) {
          return;
        }
        _rate = rate;
        localStorage.setItem(RATE_KEY, String(rate));
        localStorage.setItem(TS_KEY, String(Date.now()));
        onUpdate?.(rate);
      } catch {
        // offline or blocked — keep whatever cached rate we already have
      }
    },
  };
})();

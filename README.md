# Purchases Registry

Personal purchase tracker that runs entirely in the browser. Data stays in local JSON files — no server, no cloud.

## Usage

Open `index.html` in your browser.

**Chrome / Brave / Edge** — click "Open folder" and select the `purchases/` folder. Changes save automatically to the files.

> ⚠️ Permission resets on browser restart — you'll need to click "Open folder" again each session.

**Firefox** — click "Select JSON files" and pick all three files at once: `data.json`, `shops.json`, `categories.json`. After changes, click Save to download the updated files and replace the originals.

## Features

- Group purchases by order, shop, month, or category
- Warranty tracking with expiry alerts
- Receipts, PDFs and photos per item
- Export to Excel with date range filter
- Works fully offline

## File structure

```
purchases/
  index.html         # open this
  data.json          # your purchases
  shops.json         # shop list with colors
  categories.json    # categories
  receipts/          # put receipt files here
  src/               # app source
```

## Receipts

Put receipt files (PDF, photos) into the `receipts/` folder, then reference them by filename when adding an item.

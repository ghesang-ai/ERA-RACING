# ERA-RACING Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun dashboard mobile-first ERA-RACING yang membaca 11 campaign dari file Excel menggunakan SheetJS, dengan 4 tab (Dashboard, Grafik, Store, AI Insight), admin page untuk upload data, dan deploy ke Netlify via GitHub.

**Architecture:** Vanilla JS SPA dengan hash-based routing. SheetJS parse file `.xlsx` di browser, data di-cache di localStorage 15 menit. Semua CSS pure dengan CSS Variables. Chart.js untuk visualisasi. Claude API dan Fonnte untuk AI Insight dan WA share.

**Tech Stack:** Vanilla JS, Pure CSS, SheetJS v0.20.3 (CDN), Chart.js v4.4.0 (CDN), Plus Jakarta Sans (Google Fonts), Netlify (hosting), GitHub (repo).

---

## File Map

| File | Tanggung Jawab |
|------|----------------|
| `index.html` | Entry point, HTML shell, CDN imports, meta mobile |
| `admin.html` | Upload file Excel + PIN protection |
| `css/main.css` | CSS Variables, reset, utilities, badge colors |
| `css/dashboard.css` | KPI cards, LOB cards, TSH collapse, progress bars |
| `css/table.css` | Store table, search bar, filter chips, drawer |
| `css/charts.css` | Chart containers |
| `css/mobile.css` | iPhone safe area, touch targets, iOS scroll |
| `js/config.js` | Campaign list, konstanta, helper functions (format angka, warna) |
| `js/data.js` | SheetJS parser adaptive, localStorage cache, load Excel |
| `js/app.js` | AppState, router hash, bottom nav, inisialisasi |
| `js/dashboard.js` | Render KPI cards, LOB summary, TSH collapsible + store table |
| `js/charts.js` | Chart.js: bar horizontal, donut, line multi-campaign |
| `js/store-table.js` | Store list, search, filter, sort, slide-up drawer |
| `js/ai-insight.js` | Claude API call, typewriter render, streaming |
| `js/notif.js` | Fonnte WA send |
| `netlify.toml` | Build config, headers |
| `.gitignore` | Exclude .DS_Store, .superpowers |

---

## Task 1: Project Structure & Config Files

**Files:**
- Modify: `.gitignore`
- Create: `netlify.toml`
- Create: `data/racing.xlsx` (copy dari RACING MEI)
- Create: `js/config.js`

- [ ] **Step 1.1: Update .gitignore**

```
# .gitignore
.DS_Store
.env
node_modules/
.superpowers/
```

- [ ] **Step 1.2: Buat netlify.toml**

```toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Cache-Control = "no-cache, no-store, must-revalidate"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

- [ ] **Step 1.3: Copy file Excel ke folder data/**

```bash
mkdir -p data
cp "RACING MEI/RACING - PROJECT MEI 26.xlsx" data/racing.xlsx
```

- [ ] **Step 1.4: Buat js/config.js**

```javascript
const CONFIG = {
  EXCEL_PATH: 'data/racing.xlsx',
  CACHE_TTL_MS: 15 * 60 * 1000,
  ADMIN_PIN: '1234',

  CAMPAIGNS: [
    'OPPO CLIMBER',
    '1 SHIFT 1 STORE',
    'TELKOMSEL',
    'INDOSAT',
    'XL',
    'RACING VIQOO',
    'RACING OPPO',
    'RACING SAMSUNG TABLET',
    'RACING SAMSUNG A37 - A57',
    'RACING TECNO CAMON 50 SERIES',
    'TV',
  ],

  CAMPAIGN_ICONS: {
    'OPPO CLIMBER': '📱',
    '1 SHIFT 1 STORE': '🏪',
    'TELKOMSEL': '📡',
    'INDOSAT': '🌐',
    'XL': '📶',
    'RACING VIQOO': '🎮',
    'RACING OPPO': '📲',
    'RACING SAMSUNG TABLET': '📟',
    'RACING SAMSUNG A37 - A57': '📷',
    'RACING TECNO CAMON 50 SERIES': '🤳',
    'TV': '📺',
  },
};

function getAchClass(pct) {
  if (pct >= 1.0)  return 'excellent';
  if (pct >= 0.85) return 'good';
  if (pct >= 0.70) return 'warning';
  return 'danger';
}

function getAchColor(pct) {
  if (pct >= 1.0)  return '#10B981';
  if (pct >= 0.85) return '#00D4AA';
  if (pct >= 0.70) return '#F59E0B';
  return '#EF4444';
}

function formatRupiah(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return sign + (abs / 1e12).toFixed(2) + 'T';
  if (abs >= 1e9)  return sign + (abs / 1e9).toFixed(1) + 'B';
  if (abs >= 1e6)  return sign + (abs / 1e6).toFixed(0) + 'jt';
  return sign + Math.round(abs).toLocaleString('id-ID');
}

function formatPct(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return (value * 100).toFixed(1) + '%';
}

function formatMoM(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return sign + (value * 100).toFixed(1) + '%';
}
```

- [ ] **Step 1.5: Commit**

```bash
git add .gitignore netlify.toml data/racing.xlsx js/config.js
git commit -m "feat: project structure, config, excel data"
```

---

## Task 2: CSS Foundation

**Files:**
- Create: `css/main.css`
- Create: `css/dashboard.css`
- Create: `css/table.css`
- Create: `css/charts.css`
- Create: `css/mobile.css`

- [ ] **Step 2.1: Buat css/main.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --bg-tertiary: #334155;
  --accent-primary: #00D4AA;
  --accent-secondary: #0EA5E9;
  --accent-warning: #F59E0B;
  --accent-danger: #EF4444;
  --accent-success: #10B981;
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --border: #334155;
  --shadow: 0 4px 24px rgba(0,0,0,0.4);
  --font-main: 'Plus Jakarta Sans', -apple-system, sans-serif;
  --radius: 12px;
  --radius-sm: 8px;
}

html, body {
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-main);
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  max-width: 480px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
}

/* ── Header ─────────────────────────────── */
.app-header {
  background: linear-gradient(135deg, #1a2744 0%, var(--bg-primary) 100%);
  padding: 14px 16px 10px;
  border-bottom: 1px solid #1e293b;
  flex-shrink: 0;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-box {
  width: 28px;
  height: 28px;
  background: var(--accent-primary);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  color: var(--bg-primary);
  flex-shrink: 0;
}

.app-name {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.app-subtitle {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 1px;
}

.region-badge {
  background: rgba(0,212,170,0.12);
  border: 1px solid rgba(0,212,170,0.35);
  color: var(--accent-primary);
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.5px;
}

.update-row {
  display: flex;
  justify-content: flex-end;
  padding: 4px 16px 0;
  flex-shrink: 0;
}

.update-badge {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 9px;
  padding: 3px 10px;
  border-radius: 20px;
}

/* ── Campaign Tabs ───────────────────────── */
.campaign-tabs {
  display: flex;
  gap: 6px;
  padding: 8px 16px;
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
  border-bottom: 1px solid #1e293b;
  -webkit-overflow-scrolling: touch;
}
.campaign-tabs::-webkit-scrollbar { display: none; }

.pill {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: all .15s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.pill.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--bg-primary);
}

.pill-icon { font-size: 12px; }

/* ── Pages ───────────────────────────────── */
.page {
  display: none;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 8px;
}

.page.active { display: block; }

.section-pad { padding: 12px 16px; }

.section-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

/* ── Skeleton Loading ────────────────────── */
.skeleton {
  background: linear-gradient(90deg, #1E293B 25%, #334155 50%, #1E293B 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Achievement Badges ──────────────────── */
.badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 10px;
}

.badge.excellent { background: rgba(16,185,129,.15); color: #10B981; border: 1px solid rgba(16,185,129,.3); }
.badge.good      { background: rgba(0,212,170,.15);  color: #00D4AA; border: 1px solid rgba(0,212,170,.3); }
.badge.warning   { background: rgba(245,158,11,.15); color: #F59E0B; border: 1px solid rgba(245,158,11,.3); }
.badge.danger    { background: rgba(239,68,68,.15);  color: #EF4444; border: 1px solid rgba(239,68,68,.3); }

/* ── Bottom Nav ──────────────────────────── */
.bottom-nav {
  display: flex;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 4px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: color .15s;
}

.nav-item.active { color: var(--accent-primary); }

.nav-icon { font-size: 18px; line-height: 1; }

/* ── Empty State ─────────────────────────── */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-muted);
}

.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-text { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
.empty-sub  { font-size: 12px; margin-top: 6px; }

/* ── Overlay / Drawer Backdrop ───────────── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  z-index: 40;
  opacity: 0;
  pointer-events: none;
  transition: opacity .2s;
}

.overlay.show {
  opacity: 1;
  pointer-events: all;
}
```

- [ ] **Step 2.2: Buat css/dashboard.css**

```css
/* ── KPI Cards ───────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 10px 16px;
}

.kpi-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
  position: relative;
  overflow: hidden;
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
}

.kpi-card.card-mtd::before    { background: var(--accent-primary); }
.kpi-card.card-target::before { background: var(--accent-secondary); }
.kpi-card.card-pct::before    { background: var(--accent-warning); }
.kpi-card.card-mom::before    { background: var(--accent-danger); }

.kpi-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.kpi-value {
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
  color: var(--text-primary);
}

.kpi-value.color-green  { color: var(--accent-success); }
.kpi-value.color-teal   { color: var(--accent-primary); }
.kpi-value.color-amber  { color: var(--accent-warning); }
.kpi-value.color-red    { color: var(--accent-danger); }
.kpi-value.color-blue   { color: var(--accent-secondary); }

.kpi-sub {
  font-size: 9px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* ── LOB Cards ───────────────────────────── */
.lob-list { padding: 0 16px 4px; }

.lob-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
  margin-bottom: 8px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.lob-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.lob-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
}

.lob-pct {
  font-size: 13px;
  font-weight: 800;
}

.lob-meta {
  font-size: 9px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.progress-bar {
  height: 5px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width .5s ease;
  max-width: 100%;
}

/* ── TSH Section ─────────────────────────── */
.tsh-section { padding: 0 16px 8px; }

.tsh-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-bottom: 6px;
  overflow: hidden;
}

.tsh-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  gap: 8px;
}

.tsh-toggle {
  font-size: 10px;
  color: var(--text-muted);
  transition: transform .2s;
  flex-shrink: 0;
}

.tsh-item.open .tsh-toggle { transform: rotate(90deg); }

.tsh-name {
  flex: 1;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.tsh-meta-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tsh-mtd-text {
  font-size: 10px;
  color: var(--text-muted);
}

/* ── Store Mini Table (inside TSH) ───────── */
.tsh-stores {
  display: none;
  border-top: 1px solid var(--border);
  overflow: hidden;
}

.tsh-item.open .tsh-stores { display: block; }

.store-table-mini {
  width: 100%;
  border-collapse: collapse;
}

.store-table-mini thead tr {
  background: var(--bg-primary);
}

.store-table-mini th {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  padding: 6px 10px;
  text-align: left;
}

.store-table-mini th:last-child { text-align: right; }

.store-table-mini td {
  font-size: 10px;
  color: var(--text-secondary);
  padding: 8px 10px;
  border-top: 1px solid rgba(51,65,85,.5);
}

.store-table-mini td:last-child { text-align: right; }

.store-table-mini tr:nth-child(even) td {
  background: rgba(0,0,0,.15);
}

.store-code {
  font-size: 9px;
  font-weight: 700;
  color: var(--accent-secondary);
  font-family: monospace;
}
```

- [ ] **Step 2.3: Buat css/table.css**

```css
/* ── Store Tab ───────────────────────────── */
.store-controls {
  padding: 10px 16px 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 9px 12px 9px 36px;
  font-size: 13px;
  color: var(--text-primary);
  font-family: var(--font-main);
  outline: none;
  transition: border-color .15s;
}

.search-input:focus { border-color: var(--accent-primary); }
.search-input::placeholder { color: var(--text-muted); }

.filter-chips {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.filter-chips::-webkit-scrollbar { display: none; }

.chip {
  flex-shrink: 0;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  white-space: nowrap;
}

.chip.active {
  background: rgba(0,212,170,.15);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

/* ── Store List ──────────────────────────── */
.store-list { padding: 4px 16px 8px; }

.store-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  margin-bottom: 6px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  min-height: 44px;
}

.store-row:active { background: var(--bg-tertiary); }

.site-code-tag {
  font-size: 9px;
  font-weight: 700;
  color: var(--accent-secondary);
  background: rgba(14,165,233,.1);
  border: 1px solid rgba(14,165,233,.25);
  padding: 3px 6px;
  border-radius: 5px;
  font-family: monospace;
  min-width: 38px;
  text-align: center;
  flex-shrink: 0;
}

.store-info { flex: 1; min-width: 0; }

.store-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.store-meta {
  font-size: 9px;
  color: var(--text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.store-count {
  text-align: center;
  padding: 8px;
  font-size: 10px;
  color: var(--text-muted);
}

/* ── Slide-up Drawer ─────────────────────── */
.drawer {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) translateY(100%);
  width: 100%;
  max-width: 480px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  border-radius: 20px 20px 0 0;
  z-index: 50;
  transition: transform .3s cubic-bezier(.4,0,.2,1);
  max-height: 80vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.drawer.open {
  transform: translateX(-50%) translateY(0);
}

.drawer-handle {
  width: 36px;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  margin: 12px auto 16px;
}

.drawer-title {
  font-size: 14px;
  font-weight: 800;
  padding: 0 20px 4px;
  color: var(--text-primary);
}

.drawer-sub {
  font-size: 11px;
  color: var(--text-muted);
  padding: 0 20px 16px;
}

.drawer-body {
  padding: 0 20px 24px;
}

.drawer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(51,65,85,.5);
  font-size: 11px;
}

.drawer-row:last-child { border-bottom: none; }

.drawer-label { color: var(--text-muted); }
.drawer-val   { color: var(--text-primary); font-weight: 600; }
```

- [ ] **Step 2.4: Buat css/charts.css**

```css
.charts-page { padding: 12px 16px; }

.chart-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
}

.chart-card-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

.chart-wrap {
  position: relative;
  width: 100%;
}
```

- [ ] **Step 2.5: Buat css/mobile.css**

```css
/* iPhone safe area */
.bottom-nav {
  padding-bottom: calc(env(safe-area-inset-bottom) + 4px);
}

.page {
  padding-top: 0;
}

/* Prevent iOS zoom on input focus */
input, select, textarea {
  font-size: 16px !important;
}

/* Touch targets minimum 44px */
.nav-item, .pill, .tsh-header, .store-row, .lob-card,
.chip, .kpi-card {
  min-height: 44px;
  touch-action: manipulation;
}

/* Override for small elements in tables */
.store-table-mini td {
  min-height: unset;
}

/* Smooth momentum scroll iOS */
.campaign-tabs, .filter-chips, .page, .drawer {
  -webkit-overflow-scrolling: touch;
}

/* Prevent overscroll bounce showing white */
html {
  overscroll-behavior: none;
}

/* PWA status bar */
@media (display-mode: standalone) {
  .app-header {
    padding-top: calc(env(safe-area-inset-top) + 14px);
  }
}
```

- [ ] **Step 2.6: Commit**

```bash
git add css/
git commit -m "feat: CSS foundation - design system, dashboard, table, charts, mobile"
```

---

## Task 3: HTML Shell

**Files:**
- Create: `index.html`

- [ ] **Step 3.1: Buat index.html**

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="ERA-RACING">
  <meta name="theme-color" content="#0F172A">
  <meta name="description" content="ERA-RACING Dashboard Region 5 Erajaya Digital">
  <title>ERA-RACING</title>

  <!-- CSS -->
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/dashboard.css">
  <link rel="stylesheet" href="css/table.css">
  <link rel="stylesheet" href="css/charts.css">
  <link rel="stylesheet" href="css/mobile.css">

  <!-- Libraries CDN -->
  <script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>
<div id="app">

  <!-- Header -->
  <header class="app-header">
    <div class="header-row">
      <div class="app-logo">
        <div class="logo-box">ER</div>
        <div>
          <div class="app-name">ERA-RACING</div>
          <div class="app-subtitle" id="header-subtitle">Racing Campaign Monitor · Mei 2026</div>
        </div>
      </div>
      <div class="region-badge">REGION 5</div>
    </div>
  </header>

  <!-- Update badge row -->
  <div class="update-row">
    <div class="update-badge" id="update-badge">Memuat data...</div>
  </div>

  <!-- Campaign Pills (shown on Dashboard, Grafik, AI tabs) -->
  <div class="campaign-tabs" id="campaign-tabs"></div>

  <!-- ── PAGE: DASHBOARD ─────────────────── -->
  <div id="page-dashboard" class="page active">
    <!-- KPI Cards -->
    <div class="kpi-grid" id="kpi-grid">
      <div class="kpi-card skeleton" style="height:80px"></div>
      <div class="kpi-card skeleton" style="height:80px"></div>
      <div class="kpi-card skeleton" style="height:80px"></div>
      <div class="kpi-card skeleton" style="height:80px"></div>
    </div>

    <!-- LOB Summary -->
    <div class="section-pad" style="padding-bottom:0">
      <div class="section-title">Performance per LOB</div>
    </div>
    <div class="lob-list" id="lob-list"></div>

    <!-- TSH Breakdown -->
    <div class="section-pad" style="padding-bottom:0">
      <div class="section-title">TSH Breakdown</div>
    </div>
    <div class="tsh-section" id="tsh-section"></div>
  </div>

  <!-- ── PAGE: GRAFIK ────────────────────── -->
  <div id="page-charts" class="page">
    <div class="charts-page">
      <div class="chart-card">
        <div class="chart-card-title">MtD vs Target per TSH</div>
        <div class="chart-wrap" style="height:220px">
          <canvas id="chart-bar"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-card-title">Distribusi Est% per LOB</div>
        <div class="chart-wrap" style="height:180px">
          <canvas id="chart-donut"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-card-title">Perbandingan Est% Semua Campaign</div>
        <div class="chart-wrap" style="height:220px">
          <canvas id="chart-line"></canvas>
        </div>
      </div>
    </div>
  </div>

  <!-- ── PAGE: STORE ─────────────────────── -->
  <div id="page-store" class="page">
    <div class="store-controls">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input type="search" class="search-input" id="store-search"
               placeholder="Cari kode atau nama toko..." autocomplete="off">
      </div>
      <div class="filter-chips" id="filter-chips">
        <div class="chip active" data-filter="all">Semua</div>
        <div class="chip" data-filter="lob">LOB</div>
        <div class="chip" data-filter="tsh">TSH</div>
        <div class="chip" data-filter="territory">Territory</div>
        <div class="chip" data-filter="sort">Sort ↓</div>
      </div>
    </div>
    <div class="store-list" id="store-list"></div>
  </div>

  <!-- ── PAGE: AI INSIGHT ────────────────── -->
  <div id="page-ai" class="page">
    <div class="section-pad">
      <div style="background:linear-gradient(135deg,#1a2744,var(--bg-primary));border:1px solid rgba(0,212,170,.2);border-radius:var(--radius);padding:16px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,#00D4AA,#0EA5E9);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🤖</div>
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--text-primary)">AI Sales Analysis</div>
          <div style="font-size:10px;color:var(--text-muted)">Claude Sonnet · Region 5</div>
        </div>
      </div>

      <div id="ai-api-warning" style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:var(--radius-sm);padding:12px;margin-bottom:12px;font-size:11px;color:#F59E0B;display:none">
        ⚠️ API Key belum dikonfigurasi. Buka <a href="admin.html" style="color:var(--accent-primary)">/admin</a> untuk mengatur.
      </div>

      <button id="ai-generate-btn" style="width:100%;background:linear-gradient(135deg,#00D4AA,#0EA5E9);border:none;border-radius:var(--radius-sm);padding:13px;font-size:13px;font-weight:700;color:var(--bg-primary);cursor:pointer;margin-bottom:16px;font-family:var(--font-main)">
        ✨ Generate AI Analysis
      </button>

      <div id="ai-output" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius);padding:16px;font-size:12px;color:var(--text-secondary);line-height:1.7;min-height:120px;display:none"></div>

      <button id="wa-share-btn" style="width:100%;background:var(--bg-secondary);border:1px solid #25D366;border-radius:var(--radius-sm);padding:12px;font-size:12px;font-weight:700;color:#25D366;cursor:pointer;margin-top:12px;font-family:var(--font-main);display:none">
        📱 Share ke WhatsApp
      </button>
    </div>
  </div>

  <!-- Overlay for drawer -->
  <div class="overlay" id="overlay"></div>

  <!-- Store Detail Drawer -->
  <div class="drawer" id="store-drawer">
    <div class="drawer-handle"></div>
    <div class="drawer-title" id="drawer-title">—</div>
    <div class="drawer-sub" id="drawer-sub">—</div>
    <div class="drawer-body" id="drawer-body"></div>
  </div>

  <!-- ── BOTTOM NAV ──────────────────────── -->
  <nav class="bottom-nav">
    <div class="nav-item active" data-tab="dashboard">
      <div class="nav-icon">🏁</div>
      <div>Dashboard</div>
    </div>
    <div class="nav-item" data-tab="charts">
      <div class="nav-icon">📊</div>
      <div>Grafik</div>
    </div>
    <div class="nav-item" data-tab="store">
      <div class="nav-icon">🏪</div>
      <div>Store</div>
    </div>
    <div class="nav-item" data-tab="ai">
      <div class="nav-icon">🤖</div>
      <div>AI Insight</div>
    </div>
  </nav>

</div><!-- #app -->

<!-- JS (load order matters) -->
<script src="js/config.js"></script>
<script src="js/data.js"></script>
<script src="js/dashboard.js"></script>
<script src="js/store-table.js"></script>
<script src="js/charts.js"></script>
<script src="js/ai-insight.js"></script>
<script src="js/notif.js"></script>
<script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3.2: Verifikasi di browser**

Buka `index.html` di browser (via `open index.html` atau live server). Harus terlihat:
- Header ERA-RACING + REGION 5 badge
- "Memuat data..." badge
- 4 skeleton KPI cards
- Bottom nav dengan 4 tab

- [ ] **Step 3.3: Commit**

```bash
git add index.html
git commit -m "feat: HTML shell with all page structures and CDN imports"
```

---

## Task 4: SheetJS Data Parser

**Files:**
- Create: `js/data.js`

Ini adalah komponen paling kritis. Parser harus adaptive terhadap variasi kolom antar campaign.

- [ ] **Step 4.1: Buat js/data.js**

```javascript
const DataService = (() => {
  let _workbook = null;

  // ── Helpers ──────────────────────────────
  function _findColIdx(headers) {
    const idx = {};
    headers.forEach((h, i) => {
      if (h === null || h === undefined) return;
      const key = String(h).trim().toLowerCase();
      if (key === 'site code')          idx.siteCode   = i;
      else if (key === 'site desc')     idx.siteDesc   = i;
      else if (key === 'lob')           idx.lob        = i;
      else if (key === 'tsh')           idx.tsh        = i;
      else if (key === 'bu')            idx.bu         = i;
      else if (key === 'status')        idx.status     = i;
      else if (key === 'territory')     idx.territory  = i;
      else if (key === 'april')         idx.april      = i;
      else if (key === 'target 1')      idx.target1    = i;
      else if (key === 'target 2')      idx.target2    = i;
      else if (key.startsWith('target')) idx.target    = i;
      else if (key === 'mtd')           idx.mtd        = i;
      else if (key === 'est' && !key.includes('%')) idx.est = i;
      else if (key.includes('est') && key.includes('%')) idx.estPct = i;
      else if (key === 'mom')           idx.mom        = i;
    });
    return idx;
  }

  function _parseNum(v) {
    if (v === null || v === undefined || v === '') return 0;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  // ── Parse satu campaign sheet ─────────────
  function _parseCampaign(sheetName) {
    const ws = _workbook.Sheets[sheetName];
    if (!ws) return null;

    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

    // Row 0 → periode
    const currentDay = _parseNum(raw[0]?.[0]);
    const totalDays  = _parseNum(raw[0]?.[1]);

    // Row 3 → headers store (kiri) + summary (kanan, mulai cari LOB)
    const headerRow = raw[3] || [];
    const storeIdx  = _findColIdx(headerRow);

    // Cari kolom awal tabel kanan (cari 'LOB' atau 'TSH' setelah kolom 13)
    let summaryStartCol = -1;
    for (let c = 13; c < headerRow.length; c++) {
      const v = String(headerRow[c] || '').trim().toLowerCase();
      if (v === 'lob' || v === 'tsh') { summaryStartCol = c; break; }
    }

    // ── Parse stores ─────────────────────────
    const stores = [];
    for (let r = 4; r < raw.length; r++) {
      const row = raw[r];
      if (!row || !row[storeIdx.siteCode]) break;

      let target = 0;
      if (storeIdx.target !== undefined)  target = _parseNum(row[storeIdx.target]);
      if (storeIdx.target1 !== undefined) target += _parseNum(row[storeIdx.target1]);
      if (storeIdx.target2 !== undefined) target += _parseNum(row[storeIdx.target2]);

      const mtd    = _parseNum(row[storeIdx.mtd]);
      const est    = _parseNum(row[storeIdx.est]);
      const estPct = storeIdx.estPct !== undefined
        ? _parseNum(row[storeIdx.estPct])
        : (target > 0 ? est / target : 0);

      stores.push({
        siteCode:  String(row[storeIdx.siteCode]  || ''),
        siteDesc:  String(row[storeIdx.siteDesc]  || ''),
        lob:       String(row[storeIdx.lob]       || ''),
        tsh:       String(row[storeIdx.tsh]       || ''),
        bu:        String(row[storeIdx.bu]        || ''),
        status:    String(row[storeIdx.status]    || ''),
        territory: String(row[storeIdx.territory] || ''),
        april:     _parseNum(row[storeIdx.april]),
        target,
        mtd,
        est,
        estPct,
        mom: storeIdx.mom !== undefined ? _parseNum(row[storeIdx.mom]) : null,
      });
    }

    // ── Parse tabel ringkasan kanan ───────────
    let lobSummary  = [];
    let tshSummary  = [];
    let grandTotal  = null;

    if (summaryStartCol >= 0) {
      // LOB table: header di row 3, data mulai row 4
      const lobHeaders = _findColIdx(headerRow.slice(summaryStartCol));
      // re-offset karena kita slice
      const lhOffset = summaryStartCol;

      const lobNameCol  = (lobHeaders.lob  !== undefined ? lobHeaders.lob  : 0) + lhOffset;
      const lobAprilCol = (lobHeaders.april !== undefined ? lobHeaders.april : 1) + lhOffset;
      const lobTgtCol   = (lobHeaders.target !== undefined ? lobHeaders.target : 2) + lhOffset;
      const lobMtdCol   = (lobHeaders.mtd   !== undefined ? lobHeaders.mtd   : 3) + lhOffset;
      const lobEstCol   = (lobHeaders.est   !== undefined ? lobHeaders.est   : 4) + lhOffset;
      const lobPctCol   = (lobHeaders.estPct !== undefined ? lobHeaders.estPct : 5) + lhOffset;
      const lobMomCol   = lobHeaders.mom !== undefined ? lobHeaders.mom + lhOffset : -1;

      let tshHeaderRowIdx = -1;

      for (let r = 4; r < raw.length; r++) {
        const row = raw[r];
        if (!row) continue;
        const nameVal = String(row[lobNameCol] || '').trim();
        if (!nameVal) continue;

        // Jika baris ini adalah header TSH table
        if (nameVal.toLowerCase() === 'tsh') {
          tshHeaderRowIdx = r;
          break;
        }

        const entry = {
          name:   nameVal,
          april:  _parseNum(row[lobAprilCol]),
          target: _parseNum(row[lobTgtCol]),
          mtd:    _parseNum(row[lobMtdCol]),
          est:    _parseNum(row[lobEstCol]),
          estPct: _parseNum(row[lobPctCol]),
          mom:    lobMomCol >= 0 ? _parseNum(row[lobMomCol]) : null,
        };

        if (nameVal === 'Grand Total') grandTotal = entry;
        else lobSummary.push(entry);
      }

      // TSH table
      if (tshHeaderRowIdx >= 0) {
        const tshHeaderRowData = raw[tshHeaderRowIdx] || [];
        const tshH = _findColIdx(tshHeaderRowData.slice(summaryStartCol));
        const thOff = summaryStartCol;

        const tshNameCol  = (tshH.tsh !== undefined ? tshH.tsh : 0) + thOff;
        const tshAprilCol = (tshH.april !== undefined ? tshH.april : 1) + thOff;
        const tshTgtCol   = (tshH.target !== undefined ? tshH.target : 2) + thOff;
        const tshMtdCol   = (tshH.mtd !== undefined ? tshH.mtd : 3) + thOff;
        const tshEstCol   = (tshH.est !== undefined ? tshH.est : 4) + thOff;
        const tshPctCol   = (tshH.estPct !== undefined ? tshH.estPct : 5) + thOff;
        const tshMomCol   = tshH.mom !== undefined ? tshH.mom + thOff : -1;

        for (let r = tshHeaderRowIdx + 1; r < raw.length; r++) {
          const row = raw[r];
          if (!row) continue;
          const nameVal = String(row[tshNameCol] || '').trim();
          if (!nameVal) continue;

          tshSummary.push({
            name:   nameVal,
            april:  _parseNum(row[tshAprilCol]),
            target: _parseNum(row[tshTgtCol]),
            mtd:    _parseNum(row[tshMtdCol]),
            est:    _parseNum(row[tshEstCol]),
            estPct: _parseNum(row[tshPctCol]),
            mom:    tshMomCol >= 0 ? _parseNum(row[tshMomCol]) : null,
          });
        }
      }
    }

    return {
      campaign: sheetName,
      currentDay,
      totalDays,
      stores,
      lobSummary,
      tshSummary,
      grandTotal,
    };
  }

  // ── Public API ────────────────────────────
  async function loadWorkbook() {
    // 1. Cek localStorage cache
    const cached = _loadCache();
    if (cached) { return cached; }

    // 2. Cek apakah ada data dari admin upload (stored as base64)
    const uploadedB64 = localStorage.getItem('era_racing_xlsx');
    let arrayBuffer;

    if (uploadedB64) {
      const binary = atob(uploadedB64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      arrayBuffer = bytes.buffer;
    } else {
      // 3. Fetch dari static asset
      const resp = await fetch(CONFIG.EXCEL_PATH + '?t=' + Date.now());
      if (!resp.ok) throw new Error('Gagal memuat file Excel: ' + resp.status);
      arrayBuffer = await resp.arrayBuffer();
    }

    _workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const allData = {};
    for (const name of CONFIG.CAMPAIGNS) {
      if (_workbook.SheetNames.includes(name)) {
        allData[name] = _parseCampaign(name);
      }
    }

    _saveCache(allData);
    return allData;
  }

  function getCampaign(allData, name) {
    return allData[name] || null;
  }

  function getLastUpdateText() {
    const ts = localStorage.getItem('era_racing_last_update');
    if (!ts) return 'Belum pernah';
    const d = new Date(parseInt(ts));
    return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short' })
         + ', ' + d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
  }

  // ── Cache helpers ─────────────────────────
  function _saveCache(data) {
    try {
      localStorage.setItem('era_racing_cache', JSON.stringify(data));
      localStorage.setItem('era_racing_cache_ts', Date.now().toString());
      localStorage.setItem('era_racing_last_update', Date.now().toString());
    } catch(e) { console.warn('Cache save failed:', e); }
  }

  function _loadCache() {
    try {
      const ts  = parseInt(localStorage.getItem('era_racing_cache_ts') || '0');
      if (Date.now() - ts > CONFIG.CACHE_TTL_MS) return null;
      const raw = localStorage.getItem('era_racing_cache');
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }

  function clearCache() {
    localStorage.removeItem('era_racing_cache');
    localStorage.removeItem('era_racing_cache_ts');
  }

  return { loadWorkbook, getCampaign, getLastUpdateText, clearCache };
})();
```

- [ ] **Step 4.2: Commit**

```bash
git add js/data.js
git commit -m "feat: SheetJS adaptive parser with localStorage cache"
```

---

## Task 5: App Router & State

**Files:**
- Create: `js/app.js`

- [ ] **Step 5.1: Buat js/app.js**

```javascript
const AppState = {
  currentCampaign: CONFIG.CAMPAIGNS[0],
  currentTab: 'dashboard',
  allData: {},
  loading: false,
  aiText: '',
};

// ── Init ──────────────────────────────────
async function initApp() {
  _renderCampaignPills();
  _bindNav();
  _bindOverlay();

  try {
    AppState.loading = true;
    AppState.allData = await DataService.loadWorkbook();
    AppState.loading = false;

    document.getElementById('update-badge').textContent =
      'Update: ' + DataService.getLastUpdateText();

    _renderCurrentView();
  } catch (err) {
    AppState.loading = false;
    console.error(err);
    document.getElementById('update-badge').textContent = '⚠️ Gagal memuat data';
    document.getElementById('kpi-grid').innerHTML =
      `<div style="grid-column:1/-1;padding:24px;text-align:center;color:var(--accent-danger);font-size:12px">
        Gagal memuat file Excel.<br>Buka <a href="admin.html" style="color:var(--accent-primary)">halaman admin</a> untuk upload data.
      </div>`;
  }
}

// ── Campaign Pills ────────────────────────
function _renderCampaignPills() {
  const container = document.getElementById('campaign-tabs');
  container.innerHTML = CONFIG.CAMPAIGNS.map(name => `
    <button class="pill ${name === AppState.currentCampaign ? 'active' : ''}"
            data-campaign="${name}">
      <span class="pill-icon">${CONFIG.CAMPAIGN_ICONS[name] || '🏁'}</span>
      ${name}
    </button>
  `).join('');

  container.addEventListener('click', e => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    const campaign = btn.dataset.campaign;
    if (campaign === AppState.currentCampaign) return;
    AppState.currentCampaign = campaign;
    container.querySelectorAll('.pill').forEach(p =>
      p.classList.toggle('active', p.dataset.campaign === campaign)
    );
    _renderCurrentView();
  });
}

// ── Bottom Nav ────────────────────────────
function _bindNav() {
  document.querySelector('.bottom-nav').addEventListener('click', e => {
    const item = e.target.closest('.nav-item');
    if (!item) return;
    const tab = item.dataset.tab;
    if (tab === AppState.currentTab) return;

    document.querySelectorAll('.nav-item').forEach(n =>
      n.classList.toggle('active', n.dataset.tab === tab)
    );

    document.querySelectorAll('.page').forEach(p =>
      p.classList.toggle('active', p.id === 'page-' + tab)
    );

    // Campaign tabs: hide on store page
    const showPills = tab !== 'store';
    document.getElementById('campaign-tabs').style.display = showPills ? '' : 'none';

    AppState.currentTab = tab;
    _renderCurrentView();
  });
}

// ── Overlay ───────────────────────────────
function _bindOverlay() {
  document.getElementById('overlay').addEventListener('click', closeDrawer);
}

function openDrawer() {
  document.getElementById('store-drawer').classList.add('open');
  document.getElementById('overlay').classList.add('show');
}

function closeDrawer() {
  document.getElementById('store-drawer').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

// ── Render current view ───────────────────
function _renderCurrentView() {
  if (AppState.loading) return;
  const campaign = DataService.getCampaign(AppState.allData, AppState.currentCampaign);

  switch (AppState.currentTab) {
    case 'dashboard': renderDashboard(campaign); break;
    case 'charts':    renderCharts(campaign, AppState.allData); break;
    case 'store':     renderStoreTable(campaign); break;
    case 'ai':        renderAiTab(campaign); break;
  }
}

// ── Pull to refresh ───────────────────────
(function setupPullRefresh() {
  let startY = 0;
  const page = document.getElementById('page-dashboard');
  page.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
  page.addEventListener('touchend', e => {
    const delta = e.changedTouches[0].clientY - startY;
    if (delta > 80 && page.scrollTop === 0) {
      DataService.clearCache();
      document.getElementById('update-badge').textContent = 'Memuat ulang...';
      initApp();
    }
  }, { passive: true });
})();

// Boot
document.addEventListener('DOMContentLoaded', initApp);
```

- [ ] **Step 5.2: Commit**

```bash
git add js/app.js
git commit -m "feat: app router, state, campaign switcher, bottom nav"
```

---

## Task 6: Dashboard Renderer

**Files:**
- Create: `js/dashboard.js`

- [ ] **Step 6.1: Buat js/dashboard.js**

```javascript
function renderDashboard(campaign) {
  if (!campaign) {
    document.getElementById('kpi-grid').innerHTML =
      '<div style="grid-column:1/-1;padding:24px;text-align:center;color:var(--text-muted);font-size:12px">Data campaign tidak tersedia</div>';
    return;
  }

  const gt = campaign.grandTotal;
  _renderKpi(gt, campaign);
  _renderLob(campaign.lobSummary);
  _renderTsh(campaign.tshSummary, campaign.stores);
}

// ── KPI Cards ─────────────────────────────
function _renderKpi(gt, campaign) {
  const estPct = gt ? gt.estPct : 0;
  const mom    = gt ? gt.mom : null;
  const mtd    = gt ? gt.mtd : 0;
  const target = gt ? gt.target : 0;

  const pctClass  = getAchClass(estPct);
  const momClass  = (mom !== null && mom >= 0) ? 'color-green' : 'color-red';
  const momSign   = (mom !== null && mom >= 0) ? '+' : '';

  document.getElementById('kpi-grid').innerHTML = `
    <div class="kpi-card card-mtd">
      <div class="kpi-label">Total MtD</div>
      <div class="kpi-value color-teal">${formatRupiah(mtd)}</div>
      <div class="kpi-sub">${campaign.campaign}</div>
    </div>
    <div class="kpi-card card-target">
      <div class="kpi-label">Target ${new Date().toLocaleString('id-ID',{month:'short'})} ${new Date().getFullYear()}</div>
      <div class="kpi-value color-blue">${formatRupiah(target)}</div>
      <div class="kpi-sub">Hari ke-${campaign.currentDay} / ${campaign.totalDays}</div>
    </div>
    <div class="kpi-card card-pct">
      <div class="kpi-label">Est% vs Target</div>
      <div class="kpi-value ${_pctColorClass(estPct)}">${formatPct(estPct)}</div>
      <div class="kpi-sub">vs Target</div>
    </div>
    <div class="kpi-card card-mom">
      <div class="kpi-label">MoM Growth</div>
      <div class="kpi-value ${momClass}">${mom !== null ? momSign + formatPct(mom) : '—'}</div>
      <div class="kpi-sub">vs Bulan Lalu</div>
    </div>
  `;
}

function _pctColorClass(pct) {
  if (pct >= 1.0)  return 'color-green';
  if (pct >= 0.85) return 'color-teal';
  if (pct >= 0.70) return 'color-amber';
  return 'color-red';
}

// ── LOB Cards ─────────────────────────────
function _renderLob(lobSummary) {
  const container = document.getElementById('lob-list');
  if (!lobSummary || lobSummary.length === 0) {
    container.innerHTML = '<div style="padding:12px 16px;color:var(--text-muted);font-size:12px">Data LOB tidak tersedia</div>';
    return;
  }

  container.innerHTML = lobSummary.map(lob => {
    const pct     = lob.estPct;
    const barPct  = Math.min(pct * 100, 100).toFixed(1);
    const color   = getAchColor(pct);
    const achCls  = getAchClass(pct);
    return `
      <div class="lob-card">
        <div class="lob-header">
          <div class="lob-name">${lob.name}</div>
          <div class="lob-pct" style="color:${color}">${formatPct(pct)}</div>
        </div>
        <div class="lob-meta">MtD ${formatRupiah(lob.mtd)} · Target ${formatRupiah(lob.target)}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${barPct}%;background:${color}"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ── TSH Collapsible + Store Table ─────────
function _renderTsh(tshSummary, stores) {
  const container = document.getElementById('tsh-section');
  if (!tshSummary || tshSummary.length === 0) {
    container.innerHTML = '<div style="padding:0 0 12px;color:var(--text-muted);font-size:12px">Data TSH tidak tersedia</div>';
    return;
  }

  container.innerHTML = tshSummary.map((tsh, idx) => {
    const pct    = tsh.estPct;
    const color  = getAchColor(pct);
    const achCls = getAchClass(pct);
    const tshStores = stores.filter(s => s.tsh === tsh.name && s.status === 'Active');

    const storeRows = tshStores.length > 0
      ? tshStores.map((s, i) => `
          <tr>
            <td style="color:var(--text-muted);font-size:9px;width:28px">${i+1}</td>
            <td><span class="store-code">${s.siteCode}</span></td>
            <td style="font-size:10px;color:var(--text-secondary)">${s.siteDesc}</td>
            <td><span class="badge ${getAchClass(s.estPct)}">${formatPct(s.estPct)}</span></td>
          </tr>
        `).join('')
      : '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);font-size:10px;padding:12px">Tidak ada data toko</td></tr>';

    return `
      <div class="tsh-item" id="tsh-${idx}">
        <div class="tsh-header" onclick="toggleTsh('tsh-${idx}')">
          <span class="tsh-toggle">▶</span>
          <span class="tsh-name">${tsh.name}</span>
          <div class="tsh-meta-right">
            <span class="tsh-mtd-text">${formatRupiah(tsh.mtd)}</span>
            <span class="badge ${achCls}">${formatPct(pct)}</span>
          </div>
        </div>
        <div class="tsh-stores">
          <table class="store-table-mini">
            <thead>
              <tr>
                <th>No</th><th>Kode</th><th>Nama Toko</th><th>Ach%</th>
              </tr>
            </thead>
            <tbody>${storeRows}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');
}

function toggleTsh(id) {
  const el = document.getElementById(id);
  el.classList.toggle('open');
}
```

- [ ] **Step 6.2: Verifikasi di browser**

Buka `index.html`. Setelah data dimuat harus terlihat:
- 4 KPI cards dengan data nyata (MtD, Target, Est%, MoM)
- LOB cards dengan progress bar berwarna
- TSH list — klik untuk expand tabel toko

- [ ] **Step 6.3: Commit**

```bash
git add js/dashboard.js
git commit -m "feat: dashboard renderer - KPI cards, LOB progress, TSH collapsible"
```

---

## Task 7: Store Table

**Files:**
- Create: `js/store-table.js`

- [ ] **Step 7.1: Buat js/store-table.js**

```javascript
let _storeAllData  = [];
let _storeFiltered = [];
let _storeSortKey  = 'estPct';
let _storeSortDesc = true;
let _storeSearch   = '';
let _storeFilterLob = 'all';

function renderStoreTable(campaign) {
  if (!campaign) {
    document.getElementById('store-list').innerHTML =
      '<div class="empty-state"><div class="empty-icon">🏪</div><div class="empty-text">Pilih campaign terlebih dahulu</div></div>';
    return;
  }

  _storeAllData = campaign.stores.filter(s => s.status === 'Active');
  _storeSearch  = '';
  _storeFilterLob = 'all';
  _storeSortKey  = 'estPct';
  _storeSortDesc = true;

  document.getElementById('store-search').value = '';
  _buildFilterChips(campaign);
  _applyAndRender();
  _bindStoreEvents(campaign);
}

function _buildFilterChips(campaign) {
  const lobs = [...new Set(campaign.stores.map(s => s.lob).filter(Boolean))].sort();
  const container = document.getElementById('filter-chips');
  container.innerHTML = `
    <div class="chip active" data-filter="all">Semua</div>
    ${lobs.map(l => `<div class="chip" data-filter="lob:${l}">${l}</div>`).join('')}
    <div class="chip" data-filter="sort:estPct">Sort Ach% ↓</div>
    <div class="chip" data-filter="sort:mtd">Sort MtD ↓</div>
  `;

  container.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const f = chip.dataset.filter;

    if (f.startsWith('sort:')) {
      const key = f.split(':')[1];
      if (_storeSortKey === key) { _storeSortDesc = !_storeSortDesc; }
      else { _storeSortKey = key; _storeSortDesc = true; }
      _applyAndRender();
      return;
    }

    container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    if (f === 'all') _storeFilterLob = 'all';
    else if (f.startsWith('lob:')) _storeFilterLob = f.split(':')[1];
    _applyAndRender();
  });
}

function _bindStoreEvents(campaign) {
  document.getElementById('store-search').oninput = e => {
    _storeSearch = e.target.value.toLowerCase().trim();
    _applyAndRender();
  };

  document.getElementById('store-list').addEventListener('click', e => {
    const row = e.target.closest('.store-row');
    if (!row) return;
    const code = row.dataset.code;
    const store = _storeAllData.find(s => s.siteCode === code);
    if (store) _openStoreDrawer(store, campaign);
  });
}

function _applyAndRender() {
  _storeFiltered = _storeAllData.filter(s => {
    const matchSearch = !_storeSearch ||
      s.siteCode.toLowerCase().includes(_storeSearch) ||
      s.siteDesc.toLowerCase().includes(_storeSearch);
    const matchLob = _storeFilterLob === 'all' || s.lob === _storeFilterLob;
    return matchSearch && matchLob;
  });

  _storeFiltered.sort((a, b) => {
    const diff = (b[_storeSortKey] || 0) - (a[_storeSortKey] || 0);
    return _storeSortDesc ? diff : -diff;
  });

  _renderList();
}

function _renderList() {
  const container = document.getElementById('store-list');
  if (_storeFiltered.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-text">Tidak ada toko ditemukan</div></div>';
    return;
  }

  container.innerHTML = _storeFiltered.map(s => `
    <div class="store-row" data-code="${s.siteCode}">
      <div class="site-code-tag">${s.siteCode}</div>
      <div class="store-info">
        <div class="store-name">${s.siteDesc}</div>
        <div class="store-meta">${s.lob} · ${s.territory}</div>
      </div>
      <span class="badge ${getAchClass(s.estPct)}">${formatPct(s.estPct)}</span>
    </div>
  `).join('') + `<div class="store-count">${_storeFiltered.length} toko ditampilkan</div>`;
}

function _openStoreDrawer(store, campaign) {
  document.getElementById('drawer-title').textContent = store.siteDesc;
  document.getElementById('drawer-sub').textContent   = `${store.siteCode} · ${store.territory}`;

  const rows = [
    ['LOB',      store.lob],
    ['TSH',      store.tsh],
    ['BU',       store.bu],
    ['Status',   store.status],
    ['April',    formatRupiah(store.april)],
    ['Target',   formatRupiah(store.target)],
    ['MtD',      formatRupiah(store.mtd)],
    ['Estimasi', formatRupiah(store.est)],
    ['Est%',     `<span class="badge ${getAchClass(store.estPct)}">${formatPct(store.estPct)}</span>`],
    ['MoM',      store.mom !== null ? formatMoM(store.mom) : '—'],
  ];

  document.getElementById('drawer-body').innerHTML = rows.map(([l, v]) => `
    <div class="drawer-row">
      <span class="drawer-label">${l}</span>
      <span class="drawer-val">${v}</span>
    </div>
  `).join('');

  openDrawer();
}
```

- [ ] **Step 7.2: Commit**

```bash
git add js/store-table.js
git commit -m "feat: store table with search, filter chips, sort, slide-up drawer"
```

---

## Task 8: Charts

**Files:**
- Create: `js/charts.js`

- [ ] **Step 8.1: Buat js/charts.js**

```javascript
let _chartBar   = null;
let _chartDonut = null;
let _chartLine  = null;

function renderCharts(campaign, allData) {
  if (!campaign) return;
  _renderBarChart(campaign);
  _renderDonutChart(campaign);
  _renderLineChart(allData);
}

// ── Helpers ───────────────────────────────
function _destroyChart(ref) {
  if (ref) { ref.destroy(); }
  return null;
}

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94A3B8', font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } } } },
};

// ── Bar chart: MtD vs Target per TSH ──────
function _renderBarChart(campaign) {
  _chartBar = _destroyChart(_chartBar);

  const tsh = campaign.tshSummary;
  if (!tsh || tsh.length === 0) return;

  const labels  = tsh.map(t => t.name.length > 14 ? t.name.substring(0,14)+'…' : t.name);
  const mtdData = tsh.map(t => t.mtd);
  const tgtData = tsh.map(t => t.target);

  _chartBar = new Chart(document.getElementById('chart-bar'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'MtD',    data: mtdData, backgroundColor: '#00D4AA', borderRadius: 4 },
        { label: 'Target', data: tgtData, backgroundColor: 'rgba(14,165,233,.3)', borderRadius: 4 },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      indexAxis: 'y',
      scales: {
        x: {
          ticks: { color: '#64748B', callback: v => formatRupiah(v), font: { size: 9 } },
          grid:  { color: 'rgba(51,65,85,.5)' },
        },
        y: {
          ticks: { color: '#94A3B8', font: { size: 9 } },
          grid:  { display: false },
        },
      },
      plugins: { ...CHART_DEFAULTS.plugins, tooltip: {
        callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatRupiah(ctx.raw)}` }
      }},
    },
  });
}

// ── Donut chart: Est% per LOB ──────────────
function _renderDonutChart(campaign) {
  _chartDonut = _destroyChart(_chartDonut);

  const lob = campaign.lobSummary;
  if (!lob || lob.length === 0) return;

  const COLORS = ['#00D4AA', '#0EA5E9', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6'];

  _chartDonut = new Chart(document.getElementById('chart-donut'), {
    type: 'doughnut',
    data: {
      labels: lob.map(l => l.name),
      datasets: [{
        data:            lob.map(l => +(l.estPct * 100).toFixed(1)),
        backgroundColor: COLORS.slice(0, lob.length),
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}%` } },
      },
    },
  });
}

// ── Line chart: Est% semua campaign ───────
function _renderLineChart(allData) {
  _chartLine = _destroyChart(_chartLine);

  const labels = CONFIG.CAMPAIGNS;
  const data   = labels.map(name => {
    const d = allData[name];
    return d && d.grandTotal ? +(d.grandTotal.estPct * 100).toFixed(1) : null;
  });

  const COLORS = data.map(v =>
    v === null ? '#334155' : v >= 100 ? '#10B981' : v >= 85 ? '#00D4AA' : v >= 70 ? '#F59E0B' : '#EF4444'
  );

  _chartLine = new Chart(document.getElementById('chart-line'), {
    type: 'bar',
    data: {
      labels: labels.map(l => l.length > 10 ? l.substring(0,10)+'…' : l),
      datasets: [{
        label: 'Est% vs Target',
        data,
        backgroundColor: COLORS,
        borderRadius: 4,
        skipNull: true,
      }],
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        x: { ticks: { color: '#64748B', font: { size: 8 } }, grid: { display: false } },
        y: {
          min: 0,
          ticks: { color: '#64748B', callback: v => v + '%', font: { size: 9 } },
          grid: { color: 'rgba(51,65,85,.5)' },
        },
      },
      plugins: {
        ...CHART_DEFAULTS.plugins,
        tooltip: { callbacks: { label: ctx => ` Est%: ${ctx.raw}%` } },
        annotation: { annotations: { line100: {
          type: 'line', yMin: 100, yMax: 100,
          borderColor: 'rgba(16,185,129,.5)', borderWidth: 1, borderDash: [4,4],
        }}},
      },
    },
  });
}
```

- [ ] **Step 8.2: Commit**

```bash
git add js/charts.js
git commit -m "feat: Chart.js - bar TSH, donut LOB, bar all-campaign comparison"
```

---

## Task 9: AI Insight & WA Notification

**Files:**
- Create: `js/ai-insight.js`
- Create: `js/notif.js`

- [ ] **Step 9.1: Buat js/ai-insight.js**

```javascript
function renderAiTab(campaign) {
  const apiKey = localStorage.getItem('era_anthropic_key') || '';
  const warning = document.getElementById('ai-api-warning');
  warning.style.display = apiKey ? 'none' : 'block';

  const btn = document.getElementById('ai-generate-btn');
  btn.onclick = () => _generateInsight(campaign, apiKey);

  initNotif(campaign);
}

async function _generateInsight(campaign, apiKey) {
  if (!apiKey) {
    alert('API Key Anthropic belum dikonfigurasi.\nBuka halaman /admin untuk mengatur.');
    return;
  }
  if (!campaign) return;

  const btn = document.getElementById('ai-generate-btn');
  const output = document.getElementById('ai-output');
  const waBtn  = document.getElementById('wa-share-btn');

  btn.disabled = true;
  btn.textContent = '⏳ Menganalisis...';
  output.style.display = 'block';
  output.innerHTML = '<span style="color:var(--text-muted)">Sedang menganalisis data...</span>';
  waBtn.style.display = 'none';
  AppState.aiText = '';

  const gt      = campaign.grandTotal;
  const below70 = campaign.tshSummary.filter(t => t.estPct < 0.7);
  const top3tsh = [...campaign.tshSummary].sort((a,b) => b.estPct - a.estPct).slice(0,3);

  const prompt = `
Analisis performa Racing Campaign: ${campaign.campaign}
Hari ke-${campaign.currentDay} dari ${campaign.totalDays} hari.

Grand Total: MtD ${formatRupiah(gt?.mtd)} dari Target ${formatRupiah(gt?.target)}
Pencapaian Est%: ${formatPct(gt?.estPct)}
MoM: ${gt?.mom !== null ? formatMoM(gt?.mom) : 'N/A'}

TOP 3 LOB:
${campaign.lobSummary.map(l => `- ${l.name}: ${formatPct(l.estPct)} (MtD: ${formatRupiah(l.mtd)})`).join('\n')}

TOP 3 TSH terbaik:
${top3tsh.map(t => `- ${t.name}: ${formatPct(t.estPct)}`).join('\n')}

TSH perlu perhatian (< 70%):
${below70.length > 0 ? below70.map(t => `- ${t.name}: ${formatPct(t.estPct)}`).join('\n') : 'Semua TSH di atas 70%'}

Berikan analisis dalam Bahasa Indonesia dengan format:
📊 **Situasi**: ringkasan 2 kalimat
✅ **Highlight**: 1-2 poin positif
⚠️ **Perhatian**: TSH/toko yang kritis (jika ada)
💡 **Rekomendasi**: 2-3 aksi konkret

Gunakan format markdown bold (**teks**) dan ringkas.
`.trim();

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: 'Kamu adalah AI Sales Analyst untuk Erajaya Digital Region 5. Berikan insight ringkas dan actionable dalam Bahasa Indonesia.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error?.message || 'API error ' + resp.status);
    }

    const data = await resp.json();
    const text = data.content?.[0]?.text || '—';
    AppState.aiText = text;

    // Typewriter effect
    output.innerHTML = '';
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        output.innerHTML = _markdownToHtml(text.substring(0, ++i));
        if (i % 3 === 0) output.scrollTop = output.scrollHeight;
        setTimeout(tick, 8);
      } else {
        waBtn.style.display = 'block';
      }
    };
    tick();
  } catch (err) {
    output.innerHTML = `<span style="color:var(--accent-danger)">⚠️ Gagal: ${err.message}</span>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '✨ Generate AI Analysis';
  }
}

function _markdownToHtml(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--accent-primary)">$1</strong>')
    .replace(/\n/g, '<br>');
}
```

- [ ] **Step 9.2: Buat js/notif.js**

```javascript
function initNotif(campaign) {
  const btn = document.getElementById('wa-share-btn');
  if (!btn) return;

  btn.onclick = async () => {
    const token  = localStorage.getItem('era_fonnte_token') || '';
    const target = localStorage.getItem('era_fonnte_target') || '';

    if (!token || !target) {
      alert('Token Fonnte atau nomor target belum dikonfigurasi.\nBuka halaman /admin untuk mengatur.');
      return;
    }

    if (!AppState.aiText) {
      alert('Generate AI Analysis terlebih dahulu sebelum share.');
      return;
    }

    const gt      = campaign?.grandTotal;
    const below70 = campaign?.tshSummary?.filter(t => t.estPct < 0.7) || [];

    const message = `🏁 *ERA-RACING UPDATE*
📅 Hari ke-${campaign.currentDay}/${campaign.totalDays} — ${campaign.campaign}

*Grand Total:* ${formatPct(gt?.estPct)}
MtD: ${formatRupiah(gt?.mtd)} / Target: ${formatRupiah(gt?.target)}

${below70.length > 0
  ? `⚠️ *TSH Perlu Perhatian (< 70%):*\n${below70.map(t => `• ${t.name}: ${formatPct(t.estPct)}`).join('\n')}`
  : '✅ Semua TSH di atas 70%'}

📊 *AI Analysis:*
${AppState.aiText.replace(/\*\*/g, '*')}

📱 era-racing-reg5.netlify.app`.trim();

    btn.disabled = true;
    btn.textContent = '📡 Mengirim...';

    try {
      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: token },
        body: JSON.stringify({ target, message, typing: true, delay: 2 }),
      });
      btn.textContent = '✅ Terkirim!';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '📱 Share ke WhatsApp';
      }, 3000);
    } catch (err) {
      btn.textContent = '⚠️ Gagal kirim';
      btn.disabled = false;
    }
  };
}
```

- [ ] **Step 9.3: Commit**

```bash
git add js/ai-insight.js js/notif.js
git commit -m "feat: AI Insight (Claude API) + Fonnte WA share"
```

---

## Task 10: Admin Page

**Files:**
- Create: `admin.html`

- [ ] **Step 10.1: Buat admin.html**

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>ERA-RACING Admin</title>
  <script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', -apple-system, sans-serif;
      background: #0F172A;
      color: #F1F5F9;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 48px;
    }

    .header {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo { font-size: 32px; margin-bottom: 8px; }
    h1 { font-size: 20px; font-weight: 800; color: #00D4AA; }
    .sub { font-size: 12px; color: #64748B; margin-top: 4px; }

    .card {
      background: #1E293B;
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 20px;
      width: 100%;
      max-width: 420px;
      margin-bottom: 16px;
    }

    .card-title {
      font-size: 13px;
      font-weight: 700;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 14px;
    }

    /* PIN */
    #pin-screen { text-align: center; }
    .pin-input {
      width: 140px;
      background: #0F172A;
      border: 2px solid #334155;
      border-radius: 8px;
      padding: 12px;
      font-size: 24px;
      color: #F1F5F9;
      text-align: center;
      letter-spacing: 8px;
      font-family: monospace;
      outline: none;
      margin-bottom: 12px;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }

    .pin-input:focus { border-color: #00D4AA; }

    .btn {
      display: block;
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: opacity .15s;
    }

    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .btn-primary { background: linear-gradient(135deg, #00D4AA, #0EA5E9); color: #0F172A; }
    .btn-danger  { background: rgba(239,68,68,.15); border: 1px solid rgba(239,68,68,.3); color: #EF4444; }
    .btn-back    { background: rgba(100,116,139,.1); border: 1px solid #334155; color: #94A3B8; margin-top: 8px; }

    /* Upload */
    .drop-zone {
      border: 2px dashed #334155;
      border-radius: 10px;
      padding: 32px 16px;
      text-align: center;
      cursor: pointer;
      transition: border-color .2s, background .2s;
      margin-bottom: 12px;
    }

    .drop-zone.dragover {
      border-color: #00D4AA;
      background: rgba(0,212,170,.05);
    }

    .drop-icon { font-size: 36px; margin-bottom: 10px; }
    .drop-text { font-size: 13px; color: #94A3B8; }
    .drop-sub  { font-size: 11px; color: #64748B; margin-top: 4px; }

    #file-input { display: none; }

    .status-msg {
      font-size: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      margin-top: 8px;
      display: none;
    }

    .status-msg.success { background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.3); color: #10B981; }
    .status-msg.error   { background: rgba(239,68,68,.1);  border: 1px solid rgba(239,68,68,.3);  color: #EF4444; }
    .status-msg.info    { background: rgba(14,165,233,.1); border: 1px solid rgba(14,165,233,.3); color: #0EA5E9; }

    /* Settings */
    .field { margin-bottom: 14px; }
    .field label { display: block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; margin-bottom: 6px; }
    .field input {
      width: 100%;
      background: #0F172A;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      color: #F1F5F9;
      font-family: inherit;
      outline: none;
    }
    .field input:focus { border-color: #00D4AA; }
    .field .hint { font-size: 10px; color: #64748B; margin-top: 4px; }

    #admin-content { display: none; width: 100%; max-width: 420px; }
  </style>
</head>
<body>

<div class="header">
  <div class="logo">🏁</div>
  <h1>ERA-RACING Admin</h1>
  <div class="sub">Update data & konfigurasi API</div>
</div>

<!-- PIN Screen -->
<div class="card" id="pin-screen">
  <div class="card-title">Masukkan PIN Admin</div>
  <input type="password" class="pin-input" id="pin-input" maxlength="4"
         placeholder="••••" inputmode="numeric">
  <div class="status-msg" id="pin-error">PIN salah. Coba lagi.</div>
  <button class="btn btn-primary" onclick="checkPin()">Masuk</button>
</div>

<!-- Admin Content -->
<div id="admin-content">

  <!-- Upload Excel -->
  <div class="card">
    <div class="card-title">📂 Upload File Excel</div>
    <div class="drop-zone" id="drop-zone" onclick="document.getElementById('file-input').click()">
      <div class="drop-icon">📊</div>
      <div class="drop-text">Drag & drop atau klik untuk pilih file</div>
      <div class="drop-sub">Format: .xlsx | Max: 10MB</div>
    </div>
    <input type="file" id="file-input" accept=".xlsx,.xls">
    <div class="status-msg" id="upload-status"></div>
  </div>

  <!-- API Keys -->
  <div class="card">
    <div class="card-title">🔑 API Keys</div>

    <div class="field">
      <label>Anthropic API Key (AI Insight)</label>
      <input type="password" id="field-anthropic" placeholder="sk-ant-...">
      <div class="hint">Dari console.anthropic.com</div>
    </div>

    <div class="field">
      <label>Fonnte Token (WhatsApp)</label>
      <input type="password" id="field-fonnte" placeholder="Token Fonnte">
      <div class="hint">Dari app.fonnte.com → Device</div>
    </div>

    <div class="field">
      <label>Target WA (nomor / grup ID)</label>
      <input type="text" id="field-wa-target" placeholder="628123456789 atau ID Grup">
      <div class="hint">Format: 628xxx (tanpa + atau spasi)</div>
    </div>

    <div class="field">
      <label>PIN Admin (4 digit)</label>
      <input type="password" id="field-pin" placeholder="Ubah PIN" maxlength="4" inputmode="numeric">
    </div>

    <button class="btn btn-primary" onclick="saveSettings()" style="margin-bottom:8px">💾 Simpan Pengaturan</button>
    <div class="status-msg" id="settings-status"></div>
  </div>

  <!-- Danger Zone -->
  <div class="card">
    <div class="card-title">⚠️ Danger Zone</div>
    <button class="btn btn-danger" onclick="clearAllData()" style="margin-bottom:8px">🗑️ Hapus Semua Data Cache</button>
    <button class="btn btn-back" onclick="window.location='index.html'">← Kembali ke Dashboard</button>
  </div>

</div><!-- admin-content -->

<script>
  const STORED_PIN_KEY = 'era_admin_pin';

  function getAdminPin() {
    return localStorage.getItem(STORED_PIN_KEY) || '1234';
  }

  function checkPin() {
    const val = document.getElementById('pin-input').value;
    if (val === getAdminPin()) {
      document.getElementById('pin-screen').style.display = 'none';
      document.getElementById('admin-content').style.display = 'block';
      loadSettings();
    } else {
      const err = document.getElementById('pin-error');
      err.style.display = 'block';
      err.className = 'status-msg error';
      document.getElementById('pin-input').value = '';
    }
  }

  document.getElementById('pin-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') checkPin();
  });

  // ── File Upload ────────────────────────
  const dropZone = document.getElementById('drop-zone');

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  });

  document.getElementById('file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) processFile(file);
  });

  function processFile(file) {
    if (!file.name.match(/\.xlsx?$/i)) {
      showMsg('upload-status', 'error', '⚠️ File harus berformat .xlsx');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showMsg('upload-status', 'error', '⚠️ File terlalu besar (maks 10MB)');
      return;
    }

    showMsg('upload-status', 'info', '⏳ Membaca file...');

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });

        const sheets = wb.SheetNames;
        const hasOppo = sheets.includes('OPPO CLIMBER');

        if (!hasOppo) {
          showMsg('upload-status', 'error', `⚠️ Sheet "OPPO CLIMBER" tidak ditemukan. Sheet tersedia: ${sheets.join(', ')}`);
          return;
        }

        // Simpan sebagai base64 di localStorage
        const binary = data.reduce((acc, b) => acc + String.fromCharCode(b), '');
        const b64 = btoa(binary);
        localStorage.setItem('era_racing_xlsx', b64);
        localStorage.removeItem('era_racing_cache');
        localStorage.removeItem('era_racing_cache_ts');
        localStorage.setItem('era_racing_last_update', Date.now().toString());

        showMsg('upload-status', 'success',
          `✅ Berhasil! ${sheets.length} sheet terdeteksi: ${sheets.join(', ')}`);

        dropZone.querySelector('.drop-text').textContent = file.name;
        dropZone.querySelector('.drop-sub').textContent =
          `${(file.size / 1024).toFixed(0)} KB · ${sheets.length} sheet`;
      } catch (err) {
        showMsg('upload-status', 'error', '⚠️ Gagal membaca file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ── Settings ───────────────────────────
  function loadSettings() {
    document.getElementById('field-anthropic').value = localStorage.getItem('era_anthropic_key') || '';
    document.getElementById('field-fonnte').value    = localStorage.getItem('era_fonnte_token') || '';
    document.getElementById('field-wa-target').value = localStorage.getItem('era_fonnte_target') || '';
  }

  function saveSettings() {
    const anthropic = document.getElementById('field-anthropic').value.trim();
    const fonnte    = document.getElementById('field-fonnte').value.trim();
    const waTarget  = document.getElementById('field-wa-target').value.trim();
    const newPin    = document.getElementById('field-pin').value.trim();

    if (anthropic) localStorage.setItem('era_anthropic_key', anthropic);
    if (fonnte)    localStorage.setItem('era_fonnte_token', fonnte);
    if (waTarget)  localStorage.setItem('era_fonnte_target', waTarget);
    if (newPin && newPin.length === 4 && /^\d+$/.test(newPin)) {
      localStorage.setItem(STORED_PIN_KEY, newPin);
    }

    showMsg('settings-status', 'success', '✅ Pengaturan disimpan');
  }

  // ── Danger Zone ────────────────────────
  function clearAllData() {
    if (!confirm('Hapus semua cache data? Dashboard akan memuat ulang dari file Excel.')) return;
    ['era_racing_cache','era_racing_cache_ts','era_racing_xlsx','era_racing_last_update']
      .forEach(k => localStorage.removeItem(k));
    showMsg('settings-status', 'success', '✅ Cache dihapus. Reload dashboard untuk memuat ulang.');
  }

  // ── Helper ─────────────────────────────
  function showMsg(id, type, text) {
    const el = document.getElementById(id);
    el.style.display = 'block';
    el.className = 'status-msg ' + type;
    el.textContent = text;
  }
</script>
</body>
</html>
```

- [ ] **Step 10.2: Commit**

```bash
git add admin.html
git commit -m "feat: admin page - PIN protection, Excel upload, API key config"
```

---

## Task 11: GitHub Push & Netlify Deploy

- [ ] **Step 11.1: Buat GitHub repo baru**

Buka https://github.com/new lalu:
- Repository name: `era-racing`
- Visibility: Private
- Jangan centang "Add README"
- Klik "Create repository"

- [ ] **Step 11.2: Push ke GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/era-racing.git
git push -u origin main
```

Ganti `YOUR_USERNAME` dengan username GitHub Anda.

- [ ] **Step 11.3: Deploy ke Netlify**

1. Buka https://app.netlify.com
2. Klik "Add new site" → "Import an existing project"
3. Pilih GitHub → pilih repo `era-racing`
4. Build settings:
   - Build command: *(kosongkan)*
   - Publish directory: `.` (titik)
5. Klik "Deploy site"
6. Setelah deploy selesai, klik "Domain settings" → ubah site name menjadi `era-racing-reg5`

URL final: `https://era-racing-reg5.netlify.app`

- [ ] **Step 11.4: Verifikasi deploy**

Buka `https://era-racing-reg5.netlify.app` di HP. Pastikan:
- Dashboard muncul dengan data OPPO CLIMBER
- KPI cards menampilkan angka yang benar
- Campaign pills bisa di-scroll horizontal
- Tab Grafik menampilkan chart
- Tab Store bisa search dan filter
- `/admin` bisa diakses dengan PIN `1234`

- [ ] **Step 11.5: Update PIN & API keys via /admin**

Buka `https://era-racing-reg5.netlify.app/admin`:
1. Masuk dengan PIN `1234`
2. Ganti PIN ke PIN pilihan Anda
3. Masukkan Anthropic API Key
4. Masukkan Fonnte Token dan nomor target WA
5. Klik "Simpan Pengaturan"

---

## Catatan Penting

### Update Data Excel
Setiap kali ada file Excel terbaru:
1. Buka `https://era-racing-reg5.netlify.app/admin`
2. Masukkan PIN
3. Drag & drop file Excel baru ke area upload
4. Dashboard akan otomatis pakai data terbaru

### API Keys Disimpan di Browser
Anthropic API Key dan Fonnte Token disimpan di `localStorage` browser, bukan di kode. Artinya:
- Aman dari GitHub (tidak ter-commit)
- Perlu diisi ulang jika ganti HP/browser/clear storage
- Untuk akses dari HP berbeda, ulangi langkah 11.5

### Cache 15 Menit
Data Excel di-cache 15 menit di localStorage. Untuk force-refresh:
- Pull-to-refresh di halaman Dashboard (geser ke bawah dari atas)
- Atau hapus cache dari halaman Admin

# ERA-RACING Dashboard — Design Spec
**Tanggal:** 2026-05-26  
**Project:** ERA-RACING | Region 5 Erajaya Digital  
**Status:** Approved for implementation

---

## 1. Ringkasan

Dashboard mobile-first untuk monitoring 11 Racing/Campaign penjualan Region 5 Erajaya Digital (Jakarta, Tangerang, Banten). Data bersumber dari file Excel lokal yang dibaca langsung di browser menggunakan SheetJS — tanpa Google Sheets, tanpa backend server.

---

## 2. Stack Teknis

| Layer | Teknologi |
|-------|-----------|
| Frontend | Vanilla JS (no framework) |
| Styling | Pure CSS + CSS Variables |
| Data | SheetJS (xlsx.js) — baca file `.xlsx` langsung di browser |
| Charts | Chart.js v4 |
| AI Insight | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| WA Notif | Fonnte API (manual trigger dari dashboard) |
| Hosting | Netlify (static deploy, auto-deploy dari GitHub) |
| Version Control | GitHub |

---

## 3. Arsitektur Data

### Cara Kerja
1. File Excel (`RACING - PROJECT MEI 26.xlsx`) disimpan sebagai static asset di repo
2. SheetJS membaca file di browser, parse semua 11 sheet
3. Data di-cache di `localStorage` (expires 15 menit)
4. Halaman `/admin` (tersembunyi) memungkinkan upload file Excel baru → data baru di-parse dan disimpan ke `localStorage`

### Struktur Sheet Excel (per campaign)
```
Row 1    : Info periode (kolom A = hari ke-N, kolom B = total hari bulan)
Row 3    : Nama campaign (judul)
Row 4    : Header kolom store: Site Code, Site Desc, LOB, TSH, BU, Status, Territory, April, Target*, MtD, Est, Est%, MoM
Row 5+   : Data per store (sampai max_row)
Col P+   : Summary LOB (header di row 4, data mulai row 5)
Col P+ (bawah) : Summary TSH (header di row 9 area, data berikutnya)
```

### Variasi Kolom antar Campaign
| Campaign | Variasi | Handling |
|----------|---------|----------|
| 1 SHIFT 1 STORE | Kolom Target bernama "Target ROFO" | Perlakukan sama dengan "Target" |
| RACING SAMSUNG A37-A57 | "Target 1" & "Target 2", tidak ada MoM | Target = Target 1 + Target 2 (gabungan), MoM = N/A |
| TV | Tidak ada kolom Target, tidak ada Est% | Target = 0, Est% = N/A, tampilkan MtD saja |
| Lainnya | Standar: Target, MtD, Est, Est%, MoM | — |

Parser harus **adaptive** — deteksi nama kolom secara dinamis, tidak hardcode posisi. Kolom yang tidak ada ditampilkan sebagai `—` (em dash) di UI.

### 11 Campaign (Sheet Names)
1. OPPO CLIMBER
2. 1 SHIFT 1 STORE
3. TELKOMSEL
4. INDOSAT
5. XL
6. RACING VIQOO
7. RACING OPPO
8. RACING SAMSUNG TABLET
9. RACING SAMSUNG A37 - A57
10. RACING TECNO CAMON 50 SERIES
11. TV

---

## 4. Struktur File

```
era-racing/
├── index.html              ← Entry point, mobile-first PWA
├── data/
│   └── racing.xlsx         ← File Excel (static asset, bisa di-replace via admin)
├── css/
│   ├── main.css            ← CSS Variables, reset, utilities
│   ├── dashboard.css       ← KPI cards, LOB/TSH layout
│   ├── table.css           ← Store table styles
│   ├── charts.css          ← Chart container
│   └── mobile.css          ← iPhone safe area, touch optimizations
├── js/
│   ├── config.js           ← Constants (API keys via env, campaign list)
│   ├── app.js              ← Router, state management, event listeners
│   ├── data.js             ← SheetJS parser, localStorage cache
│   ├── dashboard.js        ← KPI cards + LOB/TSH renderer
│   ├── store-table.js      ← Store table + filter/sort/search
│   ├── charts.js           ← Chart.js visualizations
│   ├── ai-insight.js       ← Claude API integration
│   └── notif.js            ← Fonnte WA integration
├── admin.html              ← Hidden upload page (drag & drop Excel)
├── .gitignore
└── netlify.toml
```

---

## 5. Design System

```css
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
  --font-main: 'Plus Jakarta Sans', sans-serif;
  --radius: 12px;
}
```

**Achievement badge rules:**
- `≥ 100%` → green (`#10B981`)
- `85–99%` → teal (`#00D4AA`)
- `70–84%` → amber (`#F59E0B`)
- `< 70%` → red (`#EF4444`)

---

## 6. UI: 4 Tab Navigation (Bottom Bar)

### Tab 1 — Dashboard
- Header: logo ERA-RACING + badge REGION 5 + subtitle periode
- Campaign pills (horizontal scroll): 11 tab, satu per campaign
- Update timestamp badge (kanan atas)
- KPI Cards 2×2: MtD Total, Target, Est%, MoM Growth
- LOB Summary: progress bar per LOB, tap untuk expand TSH
- TSH Breakdown: collapsible list, tap untuk lihat tabel toko

### Tab 2 — Grafik
- Campaign pills sama seperti Tab 1
- Bar chart horizontal: MtD vs Target per TSH
- Donut chart: distribusi Est% per LOB
- Line chart (multi-campaign): perbandingan Est% antar campaign

### Tab 3 — Store
- Search bar (filter by nama/kode)
- Filter chips: LOB, TSH, Territory, Status
- Sort: Ach%, MtD, Nama
- Tabel toko dengan badge warna achievement
- Tap row → slide-up drawer: detail toko + semua campaign achievement

### Tab 4 — AI Insight
- Campaign pills untuk pilih campaign yang dianalisis
- Tombol "Generate AI Analysis" → call Claude API
- Streaming response dengan typewriter effect
- Tombol "Share ke WhatsApp" → Fonnte API

---

## 7. Admin Page (`/admin`)

- Tidak ada link dari halaman utama (tersembunyi, hanya diketahui user)
- Dilindungi PIN 4 digit sederhana (hardcode di `config.js`) sebelum bisa upload
- Drag & drop area untuk upload file Excel
- Setelah upload: SheetJS parse → simpan ke `localStorage` → redirect ke dashboard
- Validasi: cek minimal ada sheet "OPPO CLIMBER" sebelum menyimpan
- Beri konfirmasi ukuran file dan jumlah sheet yang terdeteksi sebelum menyimpan

---

## 8. State Management

```javascript
const AppState = {
  currentCampaign: 'OPPO CLIMBER',
  currentTab: 'dashboard',
  data: {},          // cache { campaignName: parsedData }
  loading: false,
  filters: { lob: 'all', tsh: 'all', territory: 'all', status: 'active' }
};
```

Routing berbasis hash: `#dashboard/OPPO%20CLIMBER`, `#store`, `#charts`, `#ai`

---

## 9. Integrasi Eksternal

### Claude API (AI Insight)
- Model: `claude-sonnet-4-20250514`
- API key: disimpan di `config.js` (user isi manual, **tidak di-commit ke GitHub**)
- ⚠️ API key terekspos di client-side JS — acceptable untuk penggunaan internal/team kecil, bukan publik
- Prompt: ringkasan situasi + highlight + alert + rekomendasi dalam Bahasa Indonesia

### Fonnte WA
- Token: disimpan di `config.js`
- Trigger: manual via tombol "Share ke WhatsApp"
- Konten: summary campaign + TSH di bawah 70%

---

## 10. Performa & UX

- Skeleton loading saat parse Excel
- Cache localStorage 15 menit
- Lazy render: hanya render tab yang aktif
- Pull-to-refresh di mobile
- Offline indicator
- Filter default: hanya store dengan `Status = Active`

---

## 11. Mobile Optimization

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

- Bottom nav dengan iPhone safe area (`env(safe-area-inset-bottom)`)
- Minimum tap target 44px (Apple HIG)
- `font-size: 16px` pada input (mencegah auto-zoom iOS)
- `-webkit-overflow-scrolling: touch` untuk scroll halus

---

## 12. Netlify Config

```toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Cache-Control = "no-cache, no-store, must-revalidate"
```

---

## 13. Build Order (Urutan Implementasi)

1. Inisialisasi repo + `.gitignore` + `netlify.toml`
2. `css/main.css` — design tokens, reset
3. `index.html` — skeleton HTML, meta mobile
4. `js/config.js` — constants, campaign list
5. `js/data.js` — SheetJS parser (adaptive kolom)
6. `js/dashboard.js` — KPI cards + LOB/TSH
7. `js/store-table.js` — store table + filter
8. `js/charts.js` — Chart.js
9. `js/ai-insight.js` — Claude API
10. `js/notif.js` — Fonnte
11. `js/app.js` — router + state
12. `css/mobile.css` — polish mobile
13. `admin.html` — upload page
14. Deploy ke Netlify via GitHub

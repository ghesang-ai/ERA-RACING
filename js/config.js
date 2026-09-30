const CONFIG = {
  EXCEL_PATH: 'data/racing.xlsx',
  CACHE_TTL_MS: 15 * 60 * 1000,
  ADMIN_PIN: '1234', // Non-secret: PIN is checked client-side, change via /admin page

  // Campaign tabs are built from the Excel sheets (any sheet whose row 4 starts
  // with "Site Code"). Icons below are optional; unknown campaigns get 🏁.
  CAMPAIGN_ICONS: {
    'OPPO CLIMBER': '📱',
    '1 SHIFT 1 STORE': '🏪',
    'TELKOMSEL': '📡',
    'INDOSAT': '🌐',
    'XL': '📶',
    'TV': '📺',
    'BOLTECH': '🛡️',
    'RACING VIVO': '🔵',
    'SAMSUNG S26 FE': '🌟',
    'PO REALME 16 HP': '🟡',
    'HUAWEI MATEPAD': '📟',
    'RACING SAMSUNG': '📷',
    'REDMI NOTE 17': '🟠',
    'RACING VIQOO': '🎮',
    'RACING OPPO': '📲',
    'RACING SAMSUNG TABLET': '📟',
    'RACING SAMSUNG A37 - A57': '📷',
    'RACING TECNO CAMON 50 SERIES': '🤳',
  },
};

// "01 - 29 SEPTEMBER 2026" → "Sep 2026"; "September 2026" when long=true.
function formatPeriodMonth(period, long) {
  const m = String(period || '').match(/([A-Za-z]+)\s+(\d{4})\s*$/);
  if (!m) {
    const d = new Date();
    return d.toLocaleString('id-ID', { month: long ? 'long' : 'short' }) + ' ' + d.getFullYear();
  }
  const name = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  return (long ? name : name.slice(0, 3)) + ' ' + m[2];
}

function _noData(v) { return v === null || v === undefined || !isFinite(v); }

function getAchClass(pct) {
  if (_noData(pct)) return '';
  if (pct >= 1.0)  return 'excellent';
  if (pct >= 0.85) return 'good';
  if (pct >= 0.70) return 'warning';
  return 'danger';
}

function getAchColor(pct) {
  if (_noData(pct)) return '#94A3B8';
  if (pct >= 1.0)  return '#059669';
  if (pct >= 0.85) return '#2563EB';
  if (pct >= 0.70) return '#D97706';
  return '#DC2626';
}

function formatRupiah(value) {
  if (_noData(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return sign + (abs / 1e12).toFixed(2) + 'T';
  if (abs >= 1e9)  return sign + (abs / 1e9).toFixed(1) + 'B';
  if (abs >= 1e6)  return sign + (abs / 1e6).toFixed(1) + 'jt';
  return sign + Math.round(abs).toLocaleString('id-ID');
}

function formatPct(value) {
  if (_noData(value)) return '—';
  return (value * 100).toFixed(1) + '%';
}

function formatMoM(value) {
  if (_noData(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return sign + (value * 100).toFixed(1) + '%';
}

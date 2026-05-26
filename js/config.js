const CONFIG = {
  EXCEL_PATH: 'data/racing.xlsx',
  CACHE_TTL_MS: 15 * 60 * 1000,
  ADMIN_PIN: '1234', // Non-secret: PIN is checked client-side, change via /admin page

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
  if (!isFinite(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return sign + (abs / 1e12).toFixed(2) + 'T';
  if (abs >= 1e9)  return sign + (abs / 1e9).toFixed(1) + 'B';
  if (abs >= 1e6)  return sign + (abs / 1e6).toFixed(1) + 'jt';
  return sign + Math.round(abs).toLocaleString('id-ID');
}

function formatPct(value) {
  if (!isFinite(value)) return '—';
  return (value * 100).toFixed(1) + '%';
}

function formatMoM(value) {
  if (!isFinite(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return sign + (value * 100).toFixed(1) + '%';
}

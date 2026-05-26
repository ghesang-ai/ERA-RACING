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

const AppState = {
  currentCampaign: null,
  currentVariant: null,
  currentTab: 'dashboard',
  allData: {},
  loading: false,
  aiText: '',
};

async function initApp() {
  if (AppState.loading) return;
  _bindOnce();

  try {
    AppState.loading = true;
    AppState.allData = await DataService.loadWorkbook();
    AppState.loading = false;

    const names = Object.keys(AppState.allData);
    if (!names.includes(AppState.currentCampaign)) {
      AppState.currentCampaign = names[0] || null;
      AppState.currentVariant  = null;
    }
    _renderCampaignPills();
    _renderHeaderPeriod();

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

let _bound = false;
function _bindOnce() {
  if (_bound) return;
  _bound = true;
  _bindCampaignPills();
  _bindVariantTabs();
  _bindNav();
  _bindOverlay();
}

function _renderHeaderPeriod() {
  const first = Object.values(AppState.allData)[0];
  if (!first) return;
  document.getElementById('header-subtitle').textContent =
    'Racing Campaign Monitor · ' + formatPeriodMonth(first.period, true);
}

function _renderCampaignPills() {
  const container = document.getElementById('campaign-tabs');
  container.innerHTML = Object.keys(AppState.allData).map(name => `
    <button class="pill ${name === AppState.currentCampaign ? 'active' : ''}"
            data-campaign="${name}">
      <span class="pill-icon">${CONFIG.CAMPAIGN_ICONS[name] || '🏁'}</span>
      ${name}
    </button>
  `).join('');
}

function _bindCampaignPills() {
  const container = document.getElementById('campaign-tabs');
  container.addEventListener('click', e => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    const campaign = btn.dataset.campaign;
    if (campaign === AppState.currentCampaign) return;
    AppState.currentCampaign = campaign;
    AppState.currentVariant  = null;
    container.querySelectorAll('.pill').forEach(p =>
      p.classList.toggle('active', p.dataset.campaign === campaign)
    );
    _renderCurrentView();
  });
}

// Sub-tabs for campaigns with several targets (e.g. VIVO All / 3+, Samsung per model, S26 FE per week).
function _renderVariantTabs(campaign) {
  const container = document.getElementById('variant-tabs');
  const variants = campaign?.variants;
  if (!variants) { container.innerHTML = ''; container.style.display = 'none'; return; }
  const active = campaign.variant || variants[0];
  container.style.display = '';
  container.innerHTML = variants.map(v =>
    `<div class="chip ${v === active ? 'active' : ''}" data-variant="${v}">${v}</div>`
  ).join('');
}

function _bindVariantTabs() {
  document.getElementById('variant-tabs').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip || chip.dataset.variant === AppState.currentVariant) return;
    AppState.currentVariant = chip.dataset.variant;
    _renderCurrentView();
  });
}

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

    const showPills = tab !== 'store';
    document.getElementById('campaign-tabs').style.display = showPills ? '' : 'none';
    document.getElementById('variant-tabs').classList.toggle('hidden', !showPills);

    AppState.currentTab = tab;
    _renderCurrentView();
  });
}

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

function _renderCurrentView() {
  if (AppState.loading) return;
  const campaign = DataService.getCampaign(AppState.allData, AppState.currentCampaign, AppState.currentVariant);
  _renderVariantTabs(campaign);

  switch (AppState.currentTab) {
    case 'dashboard': renderDashboard(campaign); break;
    case 'charts':    renderCharts(campaign, AppState.allData); break;
    case 'store':     renderStoreTable(campaign); break;
    case 'ai':        renderAiTab(campaign); break;
  }
}

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

document.addEventListener('DOMContentLoaded', initApp);

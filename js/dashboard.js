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

function _renderKpi(gt, campaign) {
  const estPct = gt ? gt.estPct : 0;
  const mom    = gt ? gt.mom : null;
  const mtd    = gt ? gt.mtd : 0;
  const target = gt ? gt.target : 0;

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

function _renderTsh(tshSummary, stores) {
  const container = document.getElementById('tsh-section');
  if (!tshSummary || tshSummary.length === 0) {
    container.innerHTML = '<div style="padding:0 0 12px;color:var(--text-muted);font-size:12px">Data TSH tidak tersedia</div>';
    return;
  }

  container.innerHTML = tshSummary.map((tsh, idx) => {
    const pct    = tsh.estPct;
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

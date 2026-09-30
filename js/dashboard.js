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
  const estPct = gt ? gt.estPct : NaN;
  const mom    = gt ? gt.mom : null;
  const mtd    = gt ? gt.mtd : 0;
  const target = gt ? gt.target : 0;
  const est    = gt ? gt.est : 0;

  const momClass  = (mom !== null && mom >= 0) ? 'color-green' : 'color-red';
  const momSign   = (mom !== null && mom >= 0) ? '+' : '';
  const dayText   = campaign.totalDays
    ? `Hari ke-${campaign.currentDay} / ${campaign.totalDays}`
    : `Hari ke-${campaign.currentDay}`;
  const subName   = campaign.variant || (campaign.variants ? campaign.variants[0] : '');
  const month     = formatPeriodMonth(campaign.period);

  const card2 = campaign.hasTarget
    ? _kpiCard('card-target', `Target ${month}`, 'color-blue', formatRupiah(target), dayText)
    : _kpiCard('card-target', 'Estimasi', 'color-blue', formatRupiah(est), dayText);
  const card3 = campaign.hasTarget
    ? _kpiCard('card-pct', 'Est% vs Target', _pctColorClass(estPct), formatPct(estPct), 'vs Target')
    : _kpiCard('card-pct', campaign.prevLabel || 'Bulan Lalu', 'color-amber',
               gt && gt.april !== null ? formatRupiah(gt.april) : '—', 'Bulan Lalu');
  const card4 = mom !== null
    ? _kpiCard('card-mom', 'MoM Growth', momClass, momSign + formatPct(mom), 'vs Bulan Lalu')
    : _kpiCard('card-mom', 'Estimasi', 'color-blue', formatRupiah(est), campaign.period || 'Akhir periode');

  document.getElementById('kpi-grid').innerHTML = `
    ${_kpiCard('card-mtd', 'Total MtD', 'color-teal', formatRupiah(mtd),
               campaign.campaign + (subName ? ' · ' + subName : ''))}
    ${card2}
    ${card3}
    ${card4}
  `;
}

function _kpiCard(cls, label, valueCls, value, sub) {
  return `
    <div class="kpi-card ${cls}">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value ${valueCls}">${value}</div>
      <div class="kpi-sub">${sub}</div>
    </div>`;
}

function _pctColorClass(pct) {
  if (_noData(pct)) return '';
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
    const barPct  = _noData(pct) ? 0 : Math.min(pct * 100, 100).toFixed(1);
    const color   = getAchColor(pct);
    return `
      <div class="lob-card">
        <div class="lob-header">
          <div class="lob-name">${lob.name}</div>
          <div class="lob-pct" style="color:${color}">${formatPct(pct)}</div>
        </div>
        <div class="lob-meta">MtD ${formatRupiah(lob.mtd)} · ${lob.target ? 'Target ' + formatRupiah(lob.target) : 'Est ' + formatRupiah(lob.est)}</div>
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

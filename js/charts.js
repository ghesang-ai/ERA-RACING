let _chartBar   = null;
let _chartDonut = null;
let _chartLine  = null;

function renderCharts(campaign, allData) {
  if (!campaign) return;
  _renderBarChart(campaign);
  _renderDonutChart(campaign);
  _renderLineChart(allData);
}

function _destroyChart(ref) {
  if (ref) { ref.destroy(); }
  return null;
}

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#4B6A8F', font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } } } },
};

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
        { label: 'MtD',    data: mtdData, backgroundColor: '#2563EB', borderRadius: 4 },
        { label: 'Target', data: tgtData, backgroundColor: 'rgba(6,182,212,.25)', borderRadius: 4 },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      indexAxis: 'y',
      scales: {
        x: {
          ticks: { color: '#94A3B8', callback: v => formatRupiah(v), font: { size: 9 } },
          grid:  { color: 'rgba(191,219,254,.6)' },
        },
        y: {
          ticks: { color: '#4B6A8F', font: { size: 9 } },
          grid:  { display: false },
        },
      },
      plugins: { ...CHART_DEFAULTS.plugins, tooltip: {
        callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatRupiah(ctx.raw)}` }
      }},
    },
  });
}

function _renderDonutChart(campaign) {
  _chartDonut = _destroyChart(_chartDonut);

  const lob = campaign.lobSummary;
  if (!lob || lob.length === 0) return;

  const COLORS = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

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

function _renderLineChart(allData) {
  _chartLine = _destroyChart(_chartLine);

  const labels = CONFIG.CAMPAIGNS;
  const data   = labels.map(name => {
    const d = allData[name];
    return d && d.grandTotal ? +(d.grandTotal.estPct * 100).toFixed(1) : null;
  });

  const COLORS = data.map(v =>
    v === null ? '#BFDBFE' : v >= 100 ? '#10B981' : v >= 85 ? '#2563EB' : v >= 70 ? '#F59E0B' : '#EF4444'
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
      },
    },
  });
}

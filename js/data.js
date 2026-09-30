const DataService = (() => {
  let _workbook = null;
  const CACHE_VERSION = 2;

  const MONTHS = [
    'januari','februari','maret','april','mei','juni','juli','agustus',
    'september','oktober','november','desember',
    'january','february','march','may','june','july','august','october','december',
  ];

  // Classify one header cell: { metric, suffix, pct, week }
  // metric: prev | target | mtd | est | mom | stock | week-target | week | other
  function _classify(h) {
    if (h === null || h === undefined) return null;
    const raw = String(h).trim();
    const key = raw.toLowerCase().replace(/\s+/g, ' ');
    if (!key) return null;
    if (MONTHS.includes(key)) return { metric: 'prev', label: raw };
    if (key === 'mom')   return { metric: 'mom' };
    if (key === 'stock') return { metric: 'stock' };

    let m = key.match(/^target w(\d+)$/);
    if (m) return { metric: 'week-target', week: +m[1] };
    m = key.match(/^w(\d+)(%?)$/);
    if (m) return { metric: m[2] ? 'week-pct' : 'week', week: +m[1] };

    m = raw.match(/^(target|mtd|est)(?:\s+(.+?))?\s*(%)?$/i);
    if (m) return { metric: m[1].toLowerCase(), suffix: m[2] ? m[2].trim() : null, pct: !!m[3] };

    return { metric: 'other', label: raw };
  }

  // Header cells from `start` until the first empty cell.
  function _segment(row, start) {
    const out = [];
    for (let c = start; c < row.length; c++) {
      const v = row[c];
      if (v === null || v === undefined || String(v).trim() === '') break;
      out.push({ col: c, raw: String(v).trim(), info: _classify(v) });
    }
    return out;
  }

  // Detect how a sheet's metrics are organised.
  //   single  : one Target/MtD/Est set (Target ROFO etc. included)
  //   suffix  : several sets, e.g. "Target All" / "Target 3+", "Target A17"...
  //   product : no target, only per-product qty columns (HUAWEI MATEPAD)
  //   weekly  : Target W1..Wn + W1..Wn (SAMSUNG S26 FE)
  function _detectMode(metricCols, stores) {
    const infos = metricCols.map(c => c.info).filter(Boolean);
    if (infos.some(i => i.metric === 'week-target')) {
      const weeks = infos.filter(i => i.metric === 'week').map(i => i.week);
      let last = 0;
      for (const w of weeks) {
        const col = metricCols.find(c => c.info && c.info.metric === 'week' && c.info.week === w).col;
        if (stores.some(r => _parseNum(r[col]) > 0)) last = Math.max(last, w);
      }
      last = Math.max(last, 1);
      const variants = [{ name: 'W1-W' + last, weeks: _range(1, last) }];
      for (let w = last; w >= 1; w--) variants.push({ name: 'W' + w, weeks: [w] });
      return { mode: 'weekly', variants };
    }

    const tSuf = new Set(infos.filter(i => i.metric === 'target' && i.suffix).map(i => i.suffix));
    const mSuf = infos.filter(i => i.metric === 'mtd' && i.suffix && !i.pct).map(i => i.suffix);
    const suffixes = [...new Set(mSuf)].filter(s => tSuf.has(s));
    if (suffixes.length > 0) return { mode: 'suffix', variants: suffixes.map(s => ({ name: s, suffix: s })) };

    const hasCore = infos.some(i => ['target','mtd','est'].includes(i.metric));
    if (!hasCore) {
      const products = infos.filter(i => i.metric === 'other').map(i => i.label);
      if (products.length > 0) return { mode: 'product', variants: products.map(p => ({ name: p, product: p })) };
    }
    return { mode: 'single', variants: [{ name: null }] };
  }

  function _range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }

  // Column indices (arrays, values are summed) for one variant in one header segment.
  function _spec(seg, mode, variant) {
    const spec = { prev: [], target: [], mtd: [], est: [], estPct: [], mom: [], stock: [] };
    const first = (arr, col) => { if (arr.length === 0) arr.push(col); };

    for (const { col, info } of seg) {
      if (!info) continue;
      if (info.metric === 'prev')  first(spec.prev, col);
      if (info.metric === 'mom')   first(spec.mom, col);
      if (info.metric === 'stock') first(spec.stock, col);

      if (mode === 'weekly') {
        if (info.metric === 'week-target' && variant.weeks.includes(info.week)) spec.target.push(col);
        if (info.metric === 'week'        && variant.weeks.includes(info.week)) spec.mtd.push(col);
      } else if (mode === 'product') {
        if (info.metric === 'other' && info.label === variant.product) first(spec.mtd, col);
      } else if (mode === 'suffix') {
        if (info.suffix !== variant.suffix) continue;
        if (info.metric === 'target' && !info.pct) first(spec.target, col);
        if (info.metric === 'mtd'    && !info.pct) first(spec.mtd, col);
        if (info.metric === 'est'    && !info.pct) first(spec.est, col);
        if (info.metric === 'est'    &&  info.pct) first(spec.estPct, col);
      } else {
        // Single set: first Target* column (Target / Target ROFO / Target 1), plain MtD & Est.
        if (info.metric === 'target' && !info.pct) first(spec.target, col);
        if (info.metric === 'mtd' && !info.suffix && !info.pct) first(spec.mtd, col);
        if (info.metric === 'est' && !info.suffix && !info.pct) first(spec.est, col);
        if (info.metric === 'est' && info.pct) first(spec.estPct, col);
      }
    }
    // Weekly/product sheets have no Est column: estimate equals actual.
    if (spec.est.length === 0 && (mode === 'weekly' || mode === 'product')) spec.est = spec.mtd.slice();
    return spec;
  }

  function _sum(row, cols) {
    return cols.reduce((acc, c) => acc + _parseNum(row[c]), 0);
  }

  function _values(row, spec) {
    const target = _sum(row, spec.target);
    const mtd    = _sum(row, spec.mtd);
    const est    = _sum(row, spec.est);
    let estPct = NaN;
    if (target !== 0) {
      estPct = spec.estPct.length ? _parseNum(row[spec.estPct[0]])
             : spec.est.length    ? est / target : NaN;
    }
    return {
      april: spec.prev.length ? _parseNum(row[spec.prev[0]]) : null,
      target,
      mtd,
      est,
      estPct,
      mom:   spec.mom.length   ? _parseNum(row[spec.mom[0]])   : null,
      stock: spec.stock.length ? _parseNum(row[spec.stock[0]]) : null,
    };
  }

  function _parseNum(v) {
    if (v === null || v === undefined || v === '') return 0;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  function _isTotal(name) {
    const n = name.toLowerCase();
    return n === 'grand total' || n === 'total';
  }

  // Summary block: header row `hdrRow`, name column `col`. Returns { entries, total, endRow }.
  function _parseBlock(raw, hdrRow, col, mode, variant) {
    const seg  = _segment(raw[hdrRow] || [], col);
    const spec = _spec(seg.slice(1), mode, variant);
    const entries = [];
    let total = null;
    let r = hdrRow + 1;
    for (; r < raw.length; r++) {
      const row = raw[r] || [];
      const name = String(row[col] ?? '').trim();
      if (!name) { if (entries.length || total) break; continue; }
      if (['lob','tsh'].includes(name.toLowerCase())) break;
      const entry = { name, ..._values(row, spec) };
      if (_isTotal(name)) { total = entry; break; }
      entries.push(entry);
    }
    return { entries, total, endRow: r };
  }

  function _parseCampaign(sheetName) {
    const ws = _workbook.Sheets[sheetName];
    if (!ws) return null;

    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

    const currentDay = _parseNum(raw[0]?.[0]);
    const totalDays  = _parseNum(raw[0]?.[1]);
    const title      = String(raw[2]?.[0] || '');
    const periodMatch = title.match(/\(([^)]+)\)/);
    const period     = periodMatch ? periodMatch[1].trim() : '';

    const headerRow = raw[3] || [];
    const storeSeg  = _segment(headerRow, 0);
    if (!storeSeg.length || storeSeg[0].raw.toLowerCase() !== 'site code') return null;
    const col = {};
    storeSeg.forEach(({ col: c, raw: h }) => {
      const k = h.toLowerCase();
      if (['site code','site desc','lob','tsh','bu','status','territory'].includes(k) && col[k] === undefined) col[k] = c;
    });
    const metricCols = storeSeg.filter(s => s.col > (col['territory'] ?? 6));

    const storeRows = [];
    for (let r = 4; r < raw.length; r++) {
      const row = raw[r];
      if (!row || !row[col['site code']]) break;
      if (_isTotal(String(row[col['site code']]).trim())) break;
      storeRows.push(row);
    }

    const { mode, variants } = _detectMode(metricCols, storeRows);
    const prevCol = metricCols.find(c => c.info && c.info.metric === 'prev');

    // Summary blocks live to the right of the store table, after an empty gap.
    const storeEnd = storeSeg.length ? storeSeg[storeSeg.length - 1].col : 0;
    let lobCol = -1, tshCol = -1;
    for (let c = storeEnd + 1; c < headerRow.length; c++) {
      const v = String(headerRow[c] ?? '').trim().toLowerCase();
      if (v === 'lob' && lobCol < 0) lobCol = c;
      if (v === 'tsh' && tshCol < 0) tshCol = c;
    }

    const variantData = {};
    for (const v of variants) {
      const storeSpec = _spec(metricCols, mode, v);
      const stores = storeRows.map(row => ({
        siteCode:  String(row[col['site code']] || ''),
        siteDesc:  String(row[col['site desc']] || ''),
        lob:       String(row[col['lob']]       || ''),
        tsh:       String(row[col['tsh']]       || ''),
        bu:        String(row[col['bu']]        || ''),
        status:    String(row[col['status']]    || ''),
        territory: String(row[col['territory']] || ''),
        ..._values(row, storeSpec),
      }));

      let lobSummary = [], tshSummary = [], grandTotal = null;
      if (lobCol >= 0) {
        const lob = _parseBlock(raw, 3, lobCol, mode, v);
        lobSummary = lob.entries;
        grandTotal = lob.total;

        let tshHdr = -1, tshNameCol = lobCol;
        if (tshCol >= 0) { tshHdr = 3; tshNameCol = tshCol; }
        else {
          for (let r = lob.endRow; r < raw.length; r++) {
            if (String(raw[r]?.[lobCol] ?? '').trim().toLowerCase() === 'tsh') { tshHdr = r; break; }
          }
        }
        if (tshHdr >= 0) {
          const tsh = _parseBlock(raw, tshHdr, tshNameCol, mode, v);
          tshSummary = tsh.entries;
          if (!grandTotal) grandTotal = tsh.total;
        }
      }
      variantData[v.name ?? ''] = { stores, lobSummary, tshSummary, grandTotal };
    }

    const variantNames = variants.map(v => v.name ?? '');
    return {
      campaign: sheetName,
      period,
      currentDay,
      totalDays,
      prevLabel: prevCol ? prevCol.info.label : null,
      hasTarget: Object.values(variantData).some(d => d.stores.some(s => s.target !== 0)),
      variants: variantNames.length > 1 ? variantNames : null,
      variantData,
      ...variantData[variantNames[0]],
    };
  }

  async function loadWorkbook() {
    const cached = _loadCache();
    if (cached) { return cached; }

    const uploadedB64 = localStorage.getItem('era_racing_xlsx');
    let arrayBuffer;

    if (uploadedB64) {
      const binary = atob(uploadedB64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      arrayBuffer = bytes.buffer;
    } else {
      const resp = await fetch(CONFIG.EXCEL_PATH + '?t=' + Date.now());
      if (!resp.ok) throw new Error('Gagal memuat file Excel: ' + resp.status);
      arrayBuffer = await resp.arrayBuffer();
    }

    _workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Every sheet with a store table is a campaign, in workbook order.
    const allData = {};
    for (const name of _workbook.SheetNames) {
      const parsed = _parseCampaign(name);
      if (parsed) allData[name] = parsed;
    }

    _saveCache(allData);
    return allData;
  }

  // Returns the campaign with the chosen variant's data (default: first variant).
  function getCampaign(allData, name, variant) {
    const c = allData[name];
    if (!c) return null;
    if (!c.variants || !variant || !c.variantData[variant]) return c;
    return { ...c, ...c.variantData[variant], variant };
  }

  function getLastUpdateText() {
    const ts = localStorage.getItem('era_racing_last_update');
    if (!ts) return 'Belum pernah';
    const d = new Date(parseInt(ts));
    return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short' })
         + ', ' + d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
  }

  function _saveCache(data) {
    try {
      localStorage.setItem('era_racing_cache', JSON.stringify({ v: CACHE_VERSION, data }));
      localStorage.setItem('era_racing_cache_ts', Date.now().toString());
      localStorage.setItem('era_racing_last_update', Date.now().toString());
    } catch(e) { console.warn('Cache save failed:', e); }
  }

  function _loadCache() {
    try {
      const ts  = parseInt(localStorage.getItem('era_racing_cache_ts') || '0');
      if (Date.now() - ts > CONFIG.CACHE_TTL_MS) return null;
      const raw = localStorage.getItem('era_racing_cache');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Older cache formats (pre-September parser) are discarded.
      return parsed && parsed.v === CACHE_VERSION ? parsed.data : null;
    } catch(e) { return null; }
  }

  function clearCache() {
    localStorage.removeItem('era_racing_cache');
    localStorage.removeItem('era_racing_cache_ts');
    localStorage.removeItem('era_racing_last_update');
  }

  return { loadWorkbook, getCampaign, getLastUpdateText, clearCache };
})();

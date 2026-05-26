const DataService = (() => {
  let _workbook = null;

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

  function _parseCampaign(sheetName) {
    const ws = _workbook.Sheets[sheetName];
    if (!ws) return null;

    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

    const currentDay = _parseNum(raw[0]?.[0]);
    const totalDays  = _parseNum(raw[0]?.[1]);

    const headerRow = raw[3] || [];
    const storeIdx  = _findColIdx(headerRow);

    let summaryStartCol = -1;
    for (let c = 13; c < headerRow.length; c++) {
      const v = String(headerRow[c] || '').trim().toLowerCase();
      if (v === 'lob' || v === 'tsh') { summaryStartCol = c; break; }
    }

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

    let lobSummary  = [];
    let tshSummary  = [];
    let grandTotal  = null;

    if (summaryStartCol >= 0) {
      const lobHeaders = _findColIdx(headerRow.slice(summaryStartCol));
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

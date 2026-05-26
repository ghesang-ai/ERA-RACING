function renderAiTab(campaign) {
  const apiKey = localStorage.getItem('era_anthropic_key') || '';
  const warning = document.getElementById('ai-api-warning');
  warning.style.display = apiKey ? 'none' : 'block';

  const btn = document.getElementById('ai-generate-btn');
  btn.onclick = () => _generateInsight(campaign, apiKey);

  initNotif(campaign);
}

async function _generateInsight(campaign, apiKey) {
  if (!apiKey) {
    alert('API Key Anthropic belum dikonfigurasi.\nBuka halaman /admin untuk mengatur.');
    return;
  }
  if (!campaign) return;

  const btn = document.getElementById('ai-generate-btn');
  const output = document.getElementById('ai-output');
  const waBtn  = document.getElementById('wa-share-btn');

  btn.disabled = true;
  btn.textContent = '⏳ Menganalisis...';
  output.style.display = 'block';
  output.innerHTML = '<span style="color:var(--text-muted)">Sedang menganalisis data...</span>';
  waBtn.style.display = 'none';
  AppState.aiText = '';

  const gt      = campaign.grandTotal;
  const below70 = campaign.tshSummary.filter(t => t.estPct < 0.7);
  const top3tsh = [...campaign.tshSummary].sort((a,b) => b.estPct - a.estPct).slice(0,3);

  const prompt = `
Analisis performa Racing Campaign: ${campaign.campaign}
Hari ke-${campaign.currentDay} dari ${campaign.totalDays} hari.

Grand Total: MtD ${formatRupiah(gt?.mtd)} dari Target ${formatRupiah(gt?.target)}
Pencapaian Est%: ${formatPct(gt?.estPct)}
MoM: ${gt?.mom !== null ? formatMoM(gt?.mom) : 'N/A'}

TOP 3 LOB:
${campaign.lobSummary.map(l => `- ${l.name}: ${formatPct(l.estPct)} (MtD: ${formatRupiah(l.mtd)})`).join('\n')}

TOP 3 TSH terbaik:
${top3tsh.map(t => `- ${t.name}: ${formatPct(t.estPct)}`).join('\n')}

TSH perlu perhatian (< 70%):
${below70.length > 0 ? below70.map(t => `- ${t.name}: ${formatPct(t.estPct)}`).join('\n') : 'Semua TSH di atas 70%'}

Berikan analisis dalam Bahasa Indonesia dengan format:
📊 **Situasi**: ringkasan 2 kalimat
✅ **Highlight**: 1-2 poin positif
⚠️ **Perhatian**: TSH/toko yang kritis (jika ada)
💡 **Rekomendasi**: 2-3 aksi konkret

Gunakan format markdown bold (**teks**) dan ringkas.
`.trim();

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: 'Kamu adalah AI Sales Analyst untuk Erajaya Digital Region 5. Berikan insight ringkas dan actionable dalam Bahasa Indonesia.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error?.message || 'API error ' + resp.status);
    }

    const data = await resp.json();
    const text = data.content?.[0]?.text || '—';
    AppState.aiText = text;

    // Typewriter effect
    output.innerHTML = '';
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        output.innerHTML = _markdownToHtml(text.substring(0, ++i));
        if (i % 3 === 0) output.scrollTop = output.scrollHeight;
        setTimeout(tick, 8);
      } else {
        waBtn.style.display = 'block';
      }
    };
    tick();
  } catch (err) {
    output.innerHTML = `<span style="color:var(--accent-danger)">⚠️ Gagal: ${err.message}</span>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '✨ Generate AI Analysis';
  }
}

function _markdownToHtml(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--accent-primary)">$1</strong>')
    .replace(/\n/g, '<br>');
}

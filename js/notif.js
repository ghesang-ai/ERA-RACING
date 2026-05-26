function initNotif(campaign) {
  const btn = document.getElementById('wa-share-btn');
  if (!btn) return;

  btn.onclick = async () => {
    const token  = localStorage.getItem('era_fonnte_token') || '';
    const target = localStorage.getItem('era_fonnte_target') || '';

    if (!token || !target) {
      alert('Token Fonnte atau nomor target belum dikonfigurasi.\nBuka halaman /admin untuk mengatur.');
      return;
    }

    if (!AppState.aiText) {
      alert('Generate AI Analysis terlebih dahulu sebelum share.');
      return;
    }

    const gt      = campaign?.grandTotal;
    const below70 = campaign?.tshSummary?.filter(t => t.estPct < 0.7) || [];

    const message = `🏁 *ERA-RACING UPDATE*
📅 Hari ke-${campaign.currentDay}/${campaign.totalDays} — ${campaign.campaign}

*Grand Total:* ${formatPct(gt?.estPct)}
MtD: ${formatRupiah(gt?.mtd)} / Target: ${formatRupiah(gt?.target)}

${below70.length > 0
  ? `⚠️ *TSH Perlu Perhatian (< 70%):*\n${below70.map(t => `• ${t.name}: ${formatPct(t.estPct)}`).join('\n')}`
  : '✅ Semua TSH di atas 70%'}

📊 *AI Analysis:*
${AppState.aiText.replace(/\*\*/g, '*')}

📱 era-racing-reg5.netlify.app`.trim();

    btn.disabled = true;
    btn.textContent = '📡 Mengirim...';

    try {
      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: token },
        body: JSON.stringify({ target, message, typing: true, delay: 2 }),
      });
      btn.textContent = '✅ Terkirim!';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '📱 Share ke WhatsApp';
      }, 3000);
    } catch (err) {
      btn.textContent = '⚠️ Gagal kirim';
      btn.disabled = false;
    }
  };
}

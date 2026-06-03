// /api/richiesta-servizio.js
// Notifica via Resend all'admin quando un'azienda invia una richiesta
// per Consulenza Food & Beverage o Analisi del Rischio.

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nomeAzienda, emailAzienda, tipoServizio, areaRichiesta, note } = req.body || {};

    if (!nomeAzienda || !emailAzienda || !tipoServizio || !areaRichiesta) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) {
      console.log('RESEND_API_KEY non configurata');
      return res.status(200).json({ ok: true, warning: 'email non inviata: chiave mancante' });
    }

    const tipoLabel = tipoServizio === 'consulenza_fb'
      ? 'Consulenza Food & Beverage'
      : (tipoServizio === 'analisi_rischio' ? 'Analisi del Rischio' : tipoServizio);

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#fafaf8;">
        <h2 style="color:#1a2e1a;font-family:Georgia,serif;margin:0 0 12px;">📩 Nuova richiesta servizio</h2>
        <p style="color:#555;font-size:14px;margin:0 0 18px;">Un'azienda ha richiesto informazioni tramite la dashboard.</p>
        <div style="background:white;border-radius:10px;padding:18px;border:1px solid #e1e4dd;">
          <p style="margin:0 0 8px;"><strong>Azienda:</strong> ${escapeHtml(nomeAzienda)}</p>
          <p style="margin:0 0 8px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(emailAzienda)}">${escapeHtml(emailAzienda)}</a></p>
          <p style="margin:0 0 8px;"><strong>Servizio:</strong> ${escapeHtml(tipoLabel)}</p>
          <p style="margin:0 0 8px;"><strong>Area richiesta:</strong> ${escapeHtml(areaRichiesta)}</p>
          ${note ? `<p style="margin:12px 0 0;padding-top:12px;border-top:1px solid #eef0ea;"><strong>Note:</strong><br><span style="color:#444;">${escapeHtml(note).replace(/\n/g,'<br>')}</span></p>` : ''}
        </div>
        <p style="color:#888;font-size:12px;margin-top:16px;">StaffAlpine &middot; Notifica automatica dashboard azienda</p>
      </div>
    `;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'StaffAlpine <info@staffalpine.it>',
        to: ['info@staffalpine.it'],
        reply_to: emailAzienda,
        subject: `📩 Richiesta ${tipoLabel} — ${nomeAzienda}`,
        html: htmlBody,
      }),
    });

    if (!resp.ok) {
      const errTxt = await resp.text();
      console.log('Resend errore:', errTxt);
      return res.status(200).json({ ok: true, warning: 'email non inviata', detail: errTxt });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.log('Errore richiesta-servizio:', e);
    return res.status(200).json({ ok: true, warning: 'errore interno' });
  }
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

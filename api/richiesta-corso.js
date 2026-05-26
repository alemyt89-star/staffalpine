// /api/richiesta-corso.js
// Invia email a info@staffalpine.it quando un'azienda richiede informazioni
// su uno dei corsi di formazione gratuiti.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nomeAzienda, emailAzienda, corso, numeroDipendenti, note } = req.body;

  if (!nomeAzienda || !emailAzienda || !corso || !numeroDipendenti) {
    return res.status(400).json({ error: 'Parametri mancanti' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'StaffAlpine <noreply@staffalpine.it>',
        to: 'info@staffalpine.it',
        subject: `🎓 Richiesta corso "${corso}" — ${nomeAzienda}`,
        html: `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#f0f2ee;padding:32px;border-radius:12px;">
  <div style="background:#1a2e1a;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
    <h1 style="color:#e9c46a;margin:0;font-size:22px;">🎓 Nuova Richiesta Corso</h1>
    <p style="color:#52b788;margin:8px 0 0;font-size:13px;">StaffAlpine — Formazione</p>
  </div>
  <div style="background:white;padding:24px;border-radius:8px;">
    <p style="color:#1a2e1a;font-size:15px;line-height:1.6;margin-bottom:18px;">
      Un'azienda ha richiesto informazioni su un corso di formazione:
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <tr>
        <td style="padding:10px;background:#f0f2ee;color:#6b705c;font-weight:bold;width:40%;">Azienda</td>
        <td style="padding:10px;color:#1a2e1a;">${nomeAzienda}</td>
      </tr>
      <tr>
        <td style="padding:10px;background:#f0f2ee;color:#6b705c;font-weight:bold;">Email</td>
        <td style="padding:10px;color:#1a2e1a;"><a href="mailto:${emailAzienda}" style="color:#2d6a4f;">${emailAzienda}</a></td>
      </tr>
      <tr>
        <td style="padding:10px;background:#f0f2ee;color:#6b705c;font-weight:bold;">Corso richiesto</td>
        <td style="padding:10px;color:#1a2e1a;"><strong>${corso}</strong></td>
      </tr>
      <tr>
        <td style="padding:10px;background:#f0f2ee;color:#6b705c;font-weight:bold;">N° dipendenti</td>
        <td style="padding:10px;color:#1a2e1a;"><strong>${numeroDipendenti}</strong></td>
      </tr>
      ${note ? `
      <tr>
        <td style="padding:10px;background:#f0f2ee;color:#6b705c;font-weight:bold;vertical-align:top;">Note</td>
        <td style="padding:10px;color:#2c3e2d;font-style:italic;">"${note}"</td>
      </tr>
      ` : ''}
    </table>
    <div style="background:#fff8e1;border-left:4px solid #c9a84c;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:18px;">
      <p style="color:#5c4a00;font-size:13px;margin:0;">
        💡 <strong>Prossimo passo:</strong> Contatta l'azienda all'email indicata per organizzare il corso.
      </p>
    </div>
    <div style="text-align:center;">
      <a href="https://staffalpine.it/admin.html"
         style="background:#2d6a4f;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
        Vai al pannello Admin →
      </a>
    </div>
  </div>
  <div style="text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #d4d8d0;">
    <p style="color:#6b705c;font-size:12px;margin:0;">
      StaffAlpine — Valle d'Aosta · Notifica interna pannello admin
    </p>
  </div>
</div>
        `
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.message || 'Errore invio email' });
    }
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Errore richiesta corso:', error);
    return res.status(500).json({ error: error.message });
  }
};

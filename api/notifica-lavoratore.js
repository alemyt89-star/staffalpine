module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mansione } = req.body;
  if (!mansione) return res.status(400).json({ error: 'Mansione mancante' });

  try {
    const supabaseUrl = 'https://maeoqoxzjzusjwrdrkbd.supabase.co';
    const supabaseKey = 'sb_publishable_BpRfj-r2oCa-6m1XFdO6Uw_3-xGbzLX';

    // 1. Recupera TUTTE le offerte attive
    const offerteRes = await fetch(
      `${supabaseUrl}/rest/v1/offerte_lavoro?is_attiva=eq.true&select=azienda_id,nome_azienda,ruolo`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const tutteOfferte = await offerteRes.json();
    console.log('Offerte raw:', JSON.stringify(tutteOfferte));

    // 2. Filtra in JavaScript
    const mansioneLC = mansione.toLowerCase().trim();
    const offerte = (tutteOfferte || []).filter(o =>
      o.ruolo && o.ruolo.toLowerCase().trim().includes(mansioneLC)
    );
    console.log(`Compatibili con "${mansione}": ${offerte.length}`);

    if (offerte.length === 0) {
      return res.status(200).json({ success: true, notifiche: 0, msg: 'Nessuna offerta compatibile', debug: tutteOfferte });
    }

    // 3. Aziende uniche
    const aziendeUniche = [...new Map(offerte.map(o => [o.azienda_id, o])).values()];
    const ids = aziendeUniche.map(a => `id=eq.${a.azienda_id}`).join(',');
    const profiliRes = await fetch(
      `${supabaseUrl}/rest/v1/profili_aziende?or=(${ids})&select=id,nome_azienda,email,is_approvata`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const profili = await profiliRes.json();
    console.log('Profili:', JSON.stringify(profili));

    const aziendeDaNotificare = (profili || []).filter(p => p.is_approvata && p.email);
    console.log(`Da notificare: ${aziendeDaNotificare.length}`);

    let inviate = 0;
    for (const azienda of aziendeDaNotificare) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'StaffAlpine <noreply@staffalpine.it>',
          to: azienda.email,
          subject: `🔔 Nuovo lavoratore disponibile — ${mansione}`,
          html: `<div style="font-family:Georgia,serif;padding:32px;background:#f0f2ee;border-radius:12px;max-width:600px;margin:0 auto"><div style="background:#1a2e1a;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px"><h1 style="color:#e9c46a;margin:0">🔔 Nuovo Lavoratore</h1><p style="color:#52b788;margin:8px 0 0">StaffAlpine — Valle d'Aosta</p></div><div style="background:white;padding:24px;border-radius:8px"><p style="color:#1a2e1a">Gentile <strong>${azienda.nome_azienda}</strong>,</p><p style="color:#1a2e1a">Un nuovo lavoratore con mansione <strong>${mansione}</strong> si è registrato e potrebbe essere compatibile con le vostre offerte.</p><div style="text-align:center;margin-top:24px"><a href="https://staffalpine.it/dashboard-azienda.html" style="background:#2d6a4f;color:white;padding:12px 32px;border-radius:8px;text-decoration:none">Vai alla Dashboard →</a></div></div></div>`
        })
      });
      const emailData = await emailRes.json();
      console.log('Email result:', JSON.stringify(emailData));
      inviate++;
    }

    return res.status(200).json({ success: true, notifiche: inviate });

  } catch (error) {
    console.error('Errore:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

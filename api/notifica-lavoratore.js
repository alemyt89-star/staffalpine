export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { settore } = req.body;
  if (!settore) return res.status(400).json({ error: 'Settore mancante' });

  try {
    // Cerca aziende con offerte attive nello stesso settore
    const supabaseUrl = 'https://maeoqoxzjzusjwrdrkbd.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'sb_publishable_BpRfj-r2oCa-6m1XFdO6Uw_3-xGbzLX';

    // 1. Trova offerte attive con stesso settore
    const offerteRes = await fetch(
      `${supabaseUrl}/rest/v1/offerte_lavoro?settore=eq.${encodeURIComponent(settore)}&is_attiva=eq.true&select=azienda_id,nome_azienda`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const offerte = await offerteRes.json();

    if (!offerte || offerte.length === 0) {
      return res.status(200).json({ success: true, notifiche: 0 });
    }

    // 2. Aziende uniche
    const aziendeUniche = [...new Map(offerte.map(o => [o.azienda_id, o])).values()];

    // 3. Recupera email aziende da profili_aziende
    const ids = aziendeUniche.map(a => `id=eq.${a.azienda_id}`).join(',');
    const profiliRes = await fetch(
      `${supabaseUrl}/rest/v1/profili_aziende?or=(${ids})&select=id,nome_azienda,email,is_approvata`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const profili = await profiliRes.json();

    // 4. Invia email solo alle aziende approvate con email valida
    const aziendeDaNotificare = profili.filter(p => p.is_approvata && p.email);
    let inviate = 0;

    for (const azienda of aziendeDaNotificare) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'StaffAlpine <noreply@staffalpine.it>',
          to: azienda.email,
          subject: `🔔 Nuovo lavoratore disponibile — ${settore}`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #f0f2ee; padding: 32px; border-radius: 12px;">
              <div style="background: #1a2e1a; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: #e9c46a; margin: 0; font-size: 22px;">🔔 Nuovo Lavoratore Disponibile</h1>
                <p style="color: #52b788; margin: 8px 0 0;">StaffAlpine — Valle d'Aosta</p>
              </div>
              <div style="background: white; padding: 24px; border-radius: 8px;">
                <p style="color: #1a2e1a; font-size: 16px;">Gentile <strong>${azienda.nome_azienda}</strong>,</p>
                <p style="color: #1a2e1a; font-size: 16px;">
                  Un nuovo lavoratore nel settore <strong>${settore}</strong> si è appena registrato su StaffAlpine
                  e potrebbe essere compatibile con le vostre offerte attive.
                </p>
                <div style="background: #f0f2ee; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #52b788;">
                  <p style="color: #2c3e2d; font-size: 14px; margin: 0;">
                    🔒 Il profilo del lavoratore è <strong>anonimo</strong> — per visualizzarlo accedi alla tua dashboard Premium.
                  </p>
                </div>
                <div style="text-align: center; margin-top: 24px;">
                  <a href="https://staffalpine.it/dashboard-azienda.html"
                     style="background: #2d6a4f; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">
                    Vai alla Dashboard →
                  </a>
                </div>
              </div>
              <p style="color: #6b705c; font-size: 11px; text-align: center; margin-top: 16px;">
                Per non ricevere più queste notifiche, accedi alla dashboard e modifica le preferenze.<br>
                StaffAlpine — Valle d'Aosta
              </p>
            </div>
          `
        })
      });
      inviate++;
    }

    return res.status(200).json({ success: true, notifiche: inviate });

  } catch (error) {
    console.error('Errore notifica lavoratore:', error);
    return res.status(500).json({ error: error.message });
  }
}

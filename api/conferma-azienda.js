export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nomeAzienda, email } = req.body;

  try {
    // 1. Email di conferma all'azienda
    const responseAzienda = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'StaffAlpine <noreply@staffalpine.it>',
        to: email,
        subject: '✅ Registrazione ricevuta — StaffAlpine',
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #f0f2ee; padding: 32px; border-radius: 12px;">
            <div style="background: #1a2e1a; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: #e9c46a; margin: 0; font-size: 24px;">Benvenuti su StaffAlpine</h1>
              <p style="color: #52b788; margin: 8px 0 0;">Valle d'Aosta</p>
            </div>
            <div style="background: white; padding: 24px; border-radius: 8px;">
              <p style="color: #1a2e1a; font-size: 16px;">Gentile <strong>${nomeAzienda}</strong>,</p>
              <p style="color: #1a2e1a; font-size: 16px;">
                La vostra registrazione su StaffAlpine è stata ricevuta con successo. 
                Il vostro profilo è attualmente <strong>in attesa di approvazione</strong>.
              </p>
              <p style="color: #1a2e1a; font-size: 16px;">
                Riceverete una notifica non appena il profilo sarà approvato dal nostro team, 
                solitamente entro 24 ore.
              </p>
              <div style="background: #f0f2ee; padding: 16px; border-radius: 8px; margin-top: 16px; border-left: 4px solid #2d6a4f;">
                <p style="color: #6b705c; font-size: 14px; margin: 0;">
                  Una volta approvati potrete accedere alla vostra dashboard, 
                  visualizzare le recensioni del vostro personale e molto altro.
                </p>
              </div>
              <div style="text-align: center; margin-top: 24px;">
                <a href="https://staffalpine.it" 
                   style="background: #2d6a4f; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">
                  Visita StaffAlpine →
                </a>
              </div>
            </div>
            <p style="color: #6b705c; font-size: 12px; text-align: center; margin-top: 16px;">
              StaffAlpine — Valle d'Aosta | <a href="https://staffalpine.it" style="color: #52b788;">staffalpine.it</a>
            </p>
          </div>
        `
      })
    });

    // 2. Notifica ad Alexandra
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'StaffAlpine <noreply@staffalpine.it>',
        to: 'mititelu.alexandra@tiscali.it',
        subject: '🏢 Nuova azienda registrata — StaffAlpine',
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #f0f2ee; padding: 32px; border-radius: 12px;">
            <div style="background: #1a2e1a; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: #e9c46a; margin: 0; font-size: 24px;">🏢 Nuova Azienda</h1>
              <p style="color: #52b788; margin: 8px 0 0;">StaffAlpine — Valle d'Aosta</p>
            </div>
            <div style="background: white; padding: 24px; border-radius: 8px;">
              <p style="color: #1a2e1a; font-size: 16px;">Una nuova azienda si è registrata e attende approvazione:</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <tr>
                  <td style="padding: 10px; background: #f0f2ee; color: #6b705c; font-weight: bold; width: 40%;">Azienda</td>
                  <td style="padding: 10px; color: #1a2e1a;">${nomeAzienda || 'N/D'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; background: #f0f2ee; color: #6b705c; font-weight: bold;">Email</td>
                  <td style="padding: 10px; color: #1a2e1a;">${email || 'N/D'}</td>
                </tr>
              </table>
              <div style="text-align: center; margin-top: 24px;">
                <a href="https://staffalpine.it/admin.html" 
                   style="background: #2d6a4f; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">
                  Approva nel pannello Admin →
                </a>
              </div>
            </div>
          </div>
        `
      })
    });

    const data = await responseAzienda.json();

    if (!responseAzienda.ok) {
      throw new Error(data.message || 'Errore invio email');
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Errore email azienda:', error);
    return res.status(500).json({ error: error.message });
  }
}

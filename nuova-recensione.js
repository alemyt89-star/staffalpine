export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nomeAzienda, valutazione, mansione } = req.body;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'StaffAlpine <noreply@staffalpine.it>',
        to: 'mititelu.alexandra@tiscali.it',
        subject: '⭐ Nuova recensione su StaffAlpine',
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #f0f2ee; padding: 32px; border-radius: 12px;">
            <div style="background: #1a2e1a; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: #e9c46a; margin: 0; font-size: 24px;">⭐ Nuova Recensione</h1>
              <p style="color: #52b788; margin: 8px 0 0;">StaffAlpine — Valle d'Aosta</p>
            </div>
            <div style="background: white; padding: 24px; border-radius: 8px;">
              <p style="color: #1a2e1a; font-size: 16px;">È arrivata una nuova recensione che richiede la tua approvazione:</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <tr>
                  <td style="padding: 10px; background: #f0f2ee; color: #6b705c; font-weight: bold; width: 40%;">Azienda</td>
                  <td style="padding: 10px; color: #1a2e1a;">${nomeAzienda || 'N/D'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; background: #f0f2ee; color: #6b705c; font-weight: bold;">Mansione</td>
                  <td style="padding: 10px; color: #1a2e1a;">${mansione || 'N/D'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; background: #f0f2ee; color: #6b705c; font-weight: bold;">Valutazione</td>
                  <td style="padding: 10px; color: #1a2e1a;">${valutazione || 'N/D'} / 5</td>
                </tr>
              </table>
              <div style="text-align: center; margin-top: 24px;">
                <a href="https://staffalpine.it/admin.html" 
                   style="background: #2d6a4f; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">
                  Vai al pannello Admin →
                </a>
              </div>
            </div>
            <p style="color: #6b705c; font-size: 12px; text-align: center; margin-top: 16px;">
              StaffAlpine — Valle d'Aosta
            </p>
          </div>
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Errore invio email');
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Errore email recensione:', error);
    return res.status(500).json({ error: error.message });
  }
}

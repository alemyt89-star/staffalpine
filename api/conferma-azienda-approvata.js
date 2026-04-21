module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nomeAzienda, email } = req.body;

  if (!nomeAzienda || !email) {
    return res.status(400).json({ error: 'Parametri mancanti: nomeAzienda e email sono obbligatori' });
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
        to: email,
        subject: '🎉 Profilo approvato — Benvenuti su StaffAlpine!',
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #f0f2ee; padding: 32px; border-radius: 12px;">
            <div style="background: #1a2e1a; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: #e9c46a; margin: 0; font-size: 24px;">StaffAlpine</h1>
              <p style="color: #52b788; margin: 8px 0 0;">Valle d'Aosta</p>
            </div>
            <div style="background: white; padding: 24px; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">✅</span>
                <h2 style="color: #1a2e1a; font-size: 22px; margin: 12px 0 4px;">Profilo Approvato!</h2>
                <p style="color: #6b705c; font-size: 14px; margin: 0;">Il vostro account è ora attivo sulla piattaforma</p>
              </div>

              <p style="color: #1a2e1a; font-size: 16px;">Gentile <strong>${nomeAzienda}</strong>,</p>
              <p style="color: #1a2e1a; font-size: 16px; line-height: 1.6;">
                Siamo lieti di comunicarvi che il vostro profilo aziendale su StaffAlpine è stato
                <strong>verificato e approvato</strong>. Da questo momento potete accedere alla vostra
                dashboard e utilizzare tutti i servizi della piattaforma.
              </p>

              <div style="background: #f0f2ee; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #2d6a4f; font-size: 14px; font-weight: bold; margin: 0 0 12px;">🚀 Cosa potete fare adesso:</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 7px 0; color: #2c3e2d; font-size: 14px;">🏢 &nbsp;Completare il profilo pubblico aziendale</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; color: #2c3e2d; font-size: 14px;">📊 &nbsp;Consultare le recensioni del vostro personale</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; color: #2c3e2d; font-size: 14px;">📢 &nbsp;Pubblicare offerte di lavoro (Piano Premium)</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; color: #2c3e2d; font-size: 14px;">🔍 &nbsp;Accedere al database dei lavoratori (Piano Premium)</td>
                  </tr>
                </table>
              </div>

              <div style="background: #fff8e1; border-left: 4px solid #c9a84c; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="color: #6b705c; font-size: 13px; margin: 0;">
                  💎 <strong>Vuoi accedere a tutte le funzionalità?</strong><br>
                  Con il Piano Premium potete pubblicare offerte, consultare il database talenti
                  e monitorare le recensioni di mercato. Richiedetelo direttamente dalla dashboard.
                </p>
              </div>

              <div style="text-align: center; margin-top: 8px;">
                <a href="https://staffalpine.it/dashboard-azienda.html"
                   style="background: #2d6a4f; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                  Accedi alla Dashboard →
                </a>
              </div>
            </div>

            <p style="color: #6b705c; font-size: 12px; text-align: center; margin-top: 16px;">
              StaffAlpine — Valle d'Aosta &nbsp;|&nbsp;
              <a href="https://staffalpine.it" style="color: #52b788;">staffalpine.it</a>
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
    console.error('Errore email approvazione azienda:', error);
    return res.status(500).json({ error: error.message });
  }
};

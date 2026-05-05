module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailLavoratore, mansione, nomeAzienda, messaggio, contatto } = req.body;

  if (!emailLavoratore) {
    return res.status(400).json({ error: 'Email lavoratore mancante' });
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
        to: emailLavoratore,
        subject: `🔔 Hai ricevuto una proposta di lavoro — StaffAlpine`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #f0f2ee; padding: 32px; border-radius: 12px;">
            <div style="background: #1a2e1a; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: #e9c46a; margin: 0; font-size: 24px;">🔔 Nuova Proposta di Lavoro</h1>
              <p style="color: #52b788; margin: 8px 0 0; font-size: 14px;">StaffAlpine — Valle d'Aosta</p>
            </div>
            <div style="background: white; padding: 28px; border-radius: 8px;">
              <p style="color: #1a2e1a; font-size: 16px; margin-bottom: 8px;">Ciao <strong>${mansione || 'Lavoratore'}</strong>,</p>
              <p style="color: #1a2e1a; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                Hai ricevuto una proposta di lavoro da <strong>${nomeAzienda}</strong> tramite StaffAlpine.
              </p>

              <!-- MESSAGGIO -->
              <div style="background: #f0f2ee; border-left: 4px solid #52b788; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <p style="font-size: 12px; color: #6b705c; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 700;">Il loro messaggio</p>
                <p style="color: #2c3e2d; font-size: 15px; line-height: 1.6; font-style: italic; margin: 0;">"${messaggio}"</p>
              </div>

              <!-- CONTATTO -->
              <div style="background: #e8f5e9; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <p style="font-size: 12px; color: #2d6a4f; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-weight: 700;">Come rispondere</p>
                <p style="color: #1a2e1a; font-size: 15px; font-weight: 600; margin: 0;">📞 ${contatto}</p>
              </div>

              <p style="color: #6b705c; font-size: 13px; line-height: 1.6; margin-bottom: 24px;">
                Puoi anche visualizzare questa proposta nella tua area personale su StaffAlpine, nel tab <strong>Proposte</strong>.
              </p>

              <div style="text-align: center;">
                <a href="https://staffalpine.it/dashboard-lavoratore.html"
                   style="background: #2d6a4f; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
                  Vai alle tue Proposte →
                </a>
              </div>
            </div>
            <div style="text-align:center; margin-top:20px; padding-top:16px; border-top:1px solid #d4d8d0;">
              <p style="color:#6b705c; font-size:12px; margin:0 0 8px;">
                StaffAlpine — Valle d'Aosta · <a href="https://staffalpine.it" style="color:#52b788; text-decoration:none;">staffalpine.it</a>
              </p>
              <p style="color:#9aa093; font-size:11px; margin:0; line-height:1.5;">
                Ricevi questa email perché sei registrato su StaffAlpine.<br>
                Per non ricevere più comunicazioni: <a href="mailto:info@staffalpine.it?subject=Disiscrizione%20StaffAlpine&body=Vorrei%20disiscrivermi%20dalle%20comunicazioni%20email%20di%20StaffAlpine." style="color:#9aa093;">disiscriviti</a>
              </p>
            </div>
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
    console.error('Errore email proposta lavoratore:', error);
    return res.status(500).json({ error: error.message });
  }
}

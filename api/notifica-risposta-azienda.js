// /api/notifica-risposta-azienda.js
// Invia email all'azienda quando un lavoratore risponde "Sono interessato" a una proposta.
// L'email NON contiene nome né contatto del lavoratore: solo conferma anonima.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { aziendaId } = req.body;
  if (!aziendaId) return res.status(400).json({ error: 'aziendaId mancante' });

  try {
    const supabaseUrl = 'https://maeoqoxzjzusjwrdrkbd.supabase.co';
    const supabaseKey = 'sb_publishable_BpRfj-r2oCa-6m1XFdO6Uw_3-xGbzLX';

    // Recupera dati azienda
    const profRes = await fetch(
      `${supabaseUrl}/rest/v1/profili_aziende?id=eq.${aziendaId}&select=nome_azienda,email&is_approvata=eq.true`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const profili = await profRes.json();
    if (!profili || profili.length === 0 || !profili[0].email) {
      return res.status(200).json({ success: false, msg: 'Azienda non trovata o senza email' });
    }
    const azienda = profili[0];

    // Invia email
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'StaffAlpine <noreply@staffalpine.it>',
        to: azienda.email,
        subject: '🎉 Un lavoratore è interessato alla tua proposta — StaffAlpine',
        html: `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#f0f2ee;padding:32px;border-radius:12px;">
  <div style="background:#1a2e1a;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
    <h1 style="color:#e9c46a;margin:0;font-size:22px;">🎉 Risposta Ricevuta</h1>
    <p style="color:#52b788;margin:8px 0 0;font-size:13px;">StaffAlpine — Valle d'Aosta</p>
  </div>
  <div style="background:white;padding:28px;border-radius:8px;">
    <p style="color:#1a2e1a;font-size:16px;margin-bottom:8px;">Gentile <strong>${azienda.nome_azienda}</strong>,</p>
    <p style="color:#1a2e1a;font-size:15px;line-height:1.7;margin-bottom:18px;">
      Un lavoratore ha risposto <strong style="color:#2d6a4f;">"Sono interessato"</strong> a una delle vostre proposte di lavoro inviate tramite StaffAlpine.
    </p>

    <div style="background:#e8f5e9;border-radius:8px;padding:18px 20px;margin-bottom:20px;">
      <p style="color:#2d6a4f;font-size:14px;font-weight:600;margin:0 0 8px;">📞 Cosa succede ora?</p>
      <p style="color:#2c3e2d;font-size:14px;line-height:1.6;margin:0;">
        Il lavoratore ha visualizzato i vostri contatti e potrà mettersi in contatto direttamente con voi nei prossimi giorni.
      </p>
    </div>

    <p style="color:#6b705c;font-size:13px;line-height:1.6;margin-bottom:24px;">
      Per ragioni di tutela della privacy, i dati personali del lavoratore non vengono condivisi automaticamente. Sarà lui a contattarvi.
    </p>

    <div style="text-align:center;">
      <a href="https://staffalpine.it/dashboard-azienda.html"
         style="background:#2d6a4f;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
        Vai alla Dashboard →
      </a>
    </div>
  </div>
  <div style="text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #d4d8d0;">
    <p style="color:#6b705c;font-size:12px;margin:0 0 8px;">
      StaffAlpine — Valle d'Aosta · <a href="https://staffalpine.it" style="color:#52b788;text-decoration:none;">staffalpine.it</a>
    </p>
    <p style="color:#9aa093;font-size:11px;margin:0;line-height:1.5;">
      Ricevi questa email perché sei registrato come azienda su StaffAlpine.<br>
      Per non ricevere più comunicazioni: <a href="mailto:info@staffalpine.it?subject=Disiscrizione%20StaffAlpine&body=Vorrei%20disiscrivermi%20dalle%20comunicazioni%20email%20di%20StaffAlpine." style="color:#9aa093;">disiscriviti</a>
    </p>
  </div>
</div>
        `
      })
    });

    const emailData = await emailRes.json();
    if (!emailRes.ok) {
      return res.status(500).json({ error: emailData.message || 'Errore invio email' });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Errore notifica risposta azienda:', error);
    return res.status(500).json({ error: error.message });
  }
};

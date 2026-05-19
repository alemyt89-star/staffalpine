// /api/cron-digest-aziende.js
// Cron job giornaliero (9:00 UTC) che invia ad ogni azienda con offerte attive
// un digest delle mansioni con nuovi lavoratori registrati nelle ultime 24h.

module.exports = async function handler(req, res) {
  // 1. Sicurezza: verifica CRON_SECRET (Vercel lo invia come Authorization header)
  const authHeader = req.headers.authorization || '';
  const expected = 'Bearer ' + (process.env.CRON_SECRET || '');
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = 'https://maeoqoxzjzusjwrdrkbd.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseKey) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY mancante' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };

  try {
    // 2. Calcola finestra ultime 24h
    const ieri = new Date();
    ieri.setHours(ieri.getHours() - 24);
    const ieriISO = ieri.toISOString();

    // 3. Recupera lavoratori "nuovi" (onboarding completato nelle ultime 24h)
    //    Considero "nuovi" quelli con aggiornato_il negli ultimi 24h E con mansione_principale valorizzata
    const lavRes = await fetch(
      `${supabaseUrl}/rest/v1/esperienze_lavoratori?select=mansione_principale,aggiornato_il&aggiornato_il=gte.${ieriISO}&mansione_principale=not.is.null`,
      { headers }
    );
    const lavoratori = await lavRes.json();

    if (!lavoratori || lavoratori.length === 0) {
      return res.status(200).json({ success: true, msg: 'Nessun nuovo lavoratore nelle ultime 24h', inviate: 0 });
    }

    // 4. Conta lavoratori per mansione (normalizzo lowercase)
    const contoMansioni = {};
    lavoratori.forEach(l => {
      const m = (l.mansione_principale || '').trim();
      if (!m) return;
      const k = m.toLowerCase();
      contoMansioni[k] = (contoMansioni[k] || 0) + 1;
    });

    // 5. Recupera tutte le offerte attive raggruppate per azienda
    const offerteRes = await fetch(
      `${supabaseUrl}/rest/v1/offerte_lavoro?select=azienda_id,nome_azienda,ruolo&is_attiva=eq.true`,
      { headers }
    );
    const offerte = await offerteRes.json();

    if (!offerte || offerte.length === 0) {
      return res.status(200).json({ success: true, msg: 'Nessuna offerta attiva', inviate: 0 });
    }

    // 6. Raggruppa offerte per azienda → mansioni distinte
    const aziendeMap = {};
    offerte.forEach(o => {
      if (!o.azienda_id || !o.ruolo) return;
      if (!aziendeMap[o.azienda_id]) {
        aziendeMap[o.azienda_id] = { nome_azienda: o.nome_azienda, mansioni: new Set() };
      }
      aziendeMap[o.azienda_id].mansioni.add(o.ruolo.trim());
    });

    const aziendeIds = Object.keys(aziendeMap);
    if (aziendeIds.length === 0) {
      return res.status(200).json({ success: true, msg: 'Nessuna azienda da notificare', inviate: 0 });
    }

    // 7. Recupera email aziende approvate
    const idsParam = aziendeIds.map(id => `"${id}"`).join(',');
    const profiliRes = await fetch(
      `${supabaseUrl}/rest/v1/profili_aziende?id=in.(${idsParam})&select=id,nome_azienda,email,is_approvata`,
      { headers }
    );
    const profili = await profiliRes.json();
    const aziendeOk = (profili || []).filter(p => p.is_approvata && p.email);

    // 8. Per ogni azienda → calcola match e invia digest se ci sono novità
    let inviate = 0;
    let errori = 0;
    const dettaglio = [];

    // Funzione helper per pausa tra invii
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    for (const az of aziendeOk) {
      const azData = aziendeMap[az.id];
      if (!azData) continue;

      // Calcola conteggio per ogni mansione richiesta dall'azienda
      const matches = [];
      azData.mansioni.forEach(mansione => {
        const k = mansione.toLowerCase();
        // Match fuzzy: cerca anche varianti (es. "Cameriere" matcha "cameriere", "camerieri")
        let count = contoMansioni[k] || 0;
        // Match parziale: se "Cameriere" → cerca anche chiavi che contengono "camerier"
        if (count === 0) {
          const keyShort = k.length > 5 ? k.slice(0, 5) : k;
          Object.keys(contoMansioni).forEach(kk => {
            if (kk.startsWith(keyShort) || k.startsWith(kk.slice(0, 5))) {
              count += contoMansioni[kk];
            }
          });
        }
        if (count > 0) {
          matches.push({ mansione, count });
        }
      });

      if (matches.length === 0) continue; // niente da notificare

      // Costruisci HTML email
      const righeHTML = matches.map(m =>
        `<li style="margin:6px 0;"><strong>${m.mansione}</strong>: ${m.count} ${m.count === 1 ? 'nuovo' : 'nuovi'}</li>`
      ).join('');

      const emailHTML = `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#f0f2ee;padding:32px;border-radius:12px;">
  <div style="background:#1a2e1a;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
    <h1 style="color:#e9c46a;margin:0;font-size:22px;">🔔 Nuovi Lavoratori</h1>
    <p style="color:#52b788;margin:8px 0 0;font-size:13px;">StaffAlpine — Valle d'Aosta</p>
  </div>
  <div style="background:white;padding:28px;border-radius:8px;">
    <p style="color:#1a2e1a;font-size:16px;margin-bottom:8px;">Gentile <strong>${az.nome_azienda}</strong>,</p>
    <p style="color:#1a2e1a;font-size:15px;line-height:1.6;margin-bottom:16px;">
      Nelle ultime 24 ore si sono registrati lavoratori compatibili con le tue offerte attive:
    </p>
    <ul style="color:#2c3e2d;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 20px;">
      ${righeHTML}
    </ul>
    <p style="color:#6b705c;font-size:13px;line-height:1.6;margin-bottom:24px;">
      Accedi alla tua dashboard per consultare i profili e inviare proposte di lavoro.
    </p>
    <div style="text-align:center;">
      <a href="https://staffalpine.it/dashboard-azienda.html" style="background:#2d6a4f;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
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
</div>`;

      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'StaffAlpine <noreply@staffalpine.it>',
            to: az.email,
            subject: `🔔 Nuovi lavoratori compatibili con le tue offerte — StaffAlpine`,
            html: emailHTML
          })
        });
        const rj = await r.json();
        if (r.ok) {
          inviate++;
          dettaglio.push({ azienda: az.nome_azienda, mansioni: matches });
        } else {
          errori++;
          console.error('Resend errore:', rj);
        }
      } catch (e) {
        errori++;
        console.error('Errore invio:', e.message);
      }

      // Pausa per rispettare il rate limit Resend (max 5 req/sec → uso 300ms tra ogni)
      await sleep(300);
    }

    return res.status(200).json({
      success: true,
      lavoratori_nuovi: lavoratori.length,
      aziende_candidate: aziendeOk.length,
      email_inviate: inviate,
      email_fallite: errori,
      dettaglio
    });

  } catch (error) {
    console.error('Errore cron digest:', error);
    return res.status(500).json({ error: error.message });
  }
};

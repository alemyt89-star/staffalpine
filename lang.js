// StaffAlpine — Gestione lingua IT/FR
(function(){

  // Dizionario traduzioni per testi generati da JS
  const DICT = {
    // Profilo lavoratore
    'Zona': 'Zone',
    'Contratto': 'Contrat',
    'Disponibile dal': 'Disponible dès',
    'Alloggio': 'Hébergement',
    'Richiesto': 'Demandé',
    'Non richiesto': 'Non demandé',
    '🏠 Richiede Alloggio': '🏠 Hébergement requis',
    '🏠 Indipendente': '🏠 Indépendant',
    'N/D': 'N/D',
    'Lingue': 'Langues',
    'Esperienze': 'Expériences',
    'Nessuna certificazione': 'Aucune certification',
    '⚠️ Profilo non trovato.': '⚠️ Profil introuvable.',
    'Completa il tuo profilo →': 'Complétez votre profil →',
    'Profilo non trovato.': 'Profil introuvable.',
    '⭐ Vedi Recensioni Azienda': '⭐ Voir les Avis Entreprise',
    '📊 Vedi Scheda Azienda': '📊 Voir la Fiche Entreprise',
    // Notifiche lavoratore
    'Contatto': 'Contact',
    'Non specificato': 'Non spécifié',
    '⭐ Vedi Recensioni Azienda': '⭐ Voir les Avis',
    '📊 Vedi Scheda Azienda': '📊 Voir la Fiche',
    // Recensioni
    'Paga': 'Salaire',
    'Ambiente': 'Ambiance',
    '✅ Verificata': '✅ Vérifié',
    '⏳ In attesa': '⏳ En attente',
    // Cerca azienda
    'recensione': 'avis',
    'recensioni': 'avis',
    'Paga:': 'Salaire:',
    'Rispetto:': 'Respect:',
    // Offerte
    'Posizione Aperta': 'Poste Ouvert',
    'Zona:': 'Zone:',
    'Periodo:': 'Période:',
    'Contatto:': 'Contact:',
    '📲 Condividi su WhatsApp': '📲 Partager sur WhatsApp',
    // Dashboard azienda — panoramica
    'In attesa di approvazione': 'En attente d\'approbation',
    'Approvata': 'Approuvée',
    'Piano Base': 'Plan de Base',
    'Premium': 'Premium',
    'Lavoratori compatibili': 'Travailleurs compatibles',
    'nessuno': 'aucun',
    // Onboarding lavoratore
    'Benvenuto su StaffAlpine!': 'Bienvenue sur StaffAlpine!',
    'Inizia →': 'Commencer →',
    'Capito →': 'Compris →',
    'Vai al Profilo ✓': 'Aller au Profil ✓',
    'Salta': 'Ignorer',
    // Stato azienda
    '✅ Attiva': '✅ Active',
    '⏳ In revisione': '⏳ En révision',
    // Bottoni comuni
    'Cerca →': 'Chercher →',
    'Inserisci il nome dell\'azienda...': 'Entrez le nom de l\'entreprise...',
  };

  window._lang = localStorage.getItem('staffalpine_lang') || 'it';

  // Funzione traduzione per testi JS dinamici
  window.t = function(itText) {
    if(window._lang === 'fr' && DICT[itText]) return DICT[itText];
    return itText;
  };

  function applicaLingua(lang){
    window._lang = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-it]').forEach(el => {
      el.innerHTML = el.getAttribute('data-' + lang) || el.getAttribute('data-it');
    });
    document.querySelectorAll('[data-it-placeholder]').forEach(el => {
      el.placeholder = el.getAttribute('data-' + lang + '-placeholder') || el.getAttribute('data-it-placeholder');
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    const titleEl = document.querySelector('title[data-it]');
    if(titleEl) document.title = titleEl.getAttribute('data-' + lang) || titleEl.getAttribute('data-it');
  }

  window.setLingua = function(lang){
    localStorage.setItem('staffalpine_lang', lang);
    applicaLingua(lang);
    // Ricarica i contenuti dinamici se le funzioni esistono
    if(typeof caricaProfilo === 'function'){
      supabaseClient.auth.getUser().then(({data:{user}}) => { if(user) caricaProfilo(user.id); });
    }
    if(typeof caricaNotifiche === 'function') caricaNotifiche();
    if(typeof caricaMieRecensioni === 'function') caricaMieRecensioni();
    if(typeof caricaOfferte === 'function') caricaOfferte();
    if(typeof caricaAziendeCerca === 'function') caricaAziendeCerca();
    if(typeof caricaPanoramica === 'function') caricaPanoramica();
    if(typeof caricaNotificheLavoratori === 'function') caricaNotificheLavoratori();
  };

  document.addEventListener('DOMContentLoaded', function(){
    const saved = localStorage.getItem('staffalpine_lang') || 'it';
    applicaLingua(saved);
  });
})();

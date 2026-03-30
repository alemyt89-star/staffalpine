// StaffAlpine — Gestione lingua IT/FR
(function(){
  function applicaLingua(lang){
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-it]').forEach(el => {
      el.innerHTML = el.getAttribute('data-' + lang) || el.getAttribute('data-it');
    });
    document.querySelectorAll('[data-it-placeholder]').forEach(el => {
      el.placeholder = el.getAttribute('data-' + lang + '-placeholder') || el.getAttribute('data-it-placeholder');
    });
    // Aggiorna bottoni toggle
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    // Aggiorna title pagina
    const titleEl = document.querySelector('title[data-it]');
    if(titleEl) document.title = titleEl.getAttribute('data-' + lang) || titleEl.getAttribute('data-it');
  }

  window.setLingua = function(lang){
    localStorage.setItem('staffalpine_lang', lang);
    applicaLingua(lang);
  };

  // Applica lingua salvata al caricamento
  document.addEventListener('DOMContentLoaded', function(){
    const saved = localStorage.getItem('staffalpine_lang') || 'it';
    applicaLingua(saved);
  });
})();

'use strict';
/*codice toggle per aprire/chiudere il form di risposta ad una domanda camminatore*/
(function () {
  function inizializzaToggleRisposte() {
    var pulsantiToggle = document.querySelectorAll('.js-reply-toggle');
    if (pulsantiToggle.length === 0) return;

    for (var i = 0; i < pulsantiToggle.length; i += 1) {
      pulsantiToggle[i].addEventListener('click', function () {
        var idFormRisposta = this.getAttribute('data-reply-target');
        if (!idFormRisposta) return;

        var formRisposta = document.getElementById(idFormRisposta);
        if (!formRisposta) return;

        var formNascosto = formRisposta.classList.contains('reply-form-collapsed');
        formRisposta.classList.toggle('reply-form-collapsed');
        this.textContent = formNascosto ? 'Annulla' : 'Rispondi';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inizializzaToggleRisposte);
  } else {
    inizializzaToggleRisposte();
  }
})();

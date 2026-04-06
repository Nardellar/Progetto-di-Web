'use strict';

(function () {
  function inizializzaToggleRisposte() {
    var pulsantiToggle = document.querySelectorAll('.js-risposta-toggle');
    if (pulsantiToggle.length === 0) return;

    for (var i = 0; i < pulsantiToggle.length; i += 1) {
      pulsantiToggle[i].addEventListener('click', function () {
        var idFormRisposta = this.getAttribute('data-risposta-target');
        if (!idFormRisposta) return;

        var formRisposta = document.getElementById(idFormRisposta);
        if (!formRisposta) return;

        var formNascosto = formRisposta.classList.contains('risposta-form-collapsed');
        formRisposta.classList.toggle('risposta-form-collapsed');
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

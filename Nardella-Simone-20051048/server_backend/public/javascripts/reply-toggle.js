'use strict';

(function () {
  function initReplyToggle() {
    var buttons = document.querySelectorAll('.js-reply-toggle');
    if (!buttons.length) return;

    for (var i = 0; i < buttons.length; i += 1) {
      buttons[i].addEventListener('click', function () {
        var targetId = this.getAttribute('data-reply-target');
        if (!targetId) return;

        var form = document.getElementById(targetId);
        if (!form) return;

        var isHidden = form.classList.contains('reply-form-collapsed');
        form.classList.toggle('reply-form-collapsed');
        this.textContent = isHidden ? 'Annulla' : 'Rispondi';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReplyToggle);
  } else {
    initReplyToggle();
  }
})();

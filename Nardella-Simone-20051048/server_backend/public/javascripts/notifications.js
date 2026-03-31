'use strict';

(function () {
  function closeNotice(notice) {
    if (!notice) return;
    notice.style.opacity = '0';
    notice.style.transform = 'translateY(-4px)';
    setTimeout(function () {
      if (notice.parentElement) {
        notice.parentElement.removeChild(notice);
      }
    }, 180);
  }

  function cleanupUrlParams() {
    var url = new URL(window.location.href);
    var params = url.searchParams;
    var keys = ['successo', 'errore', 'success', 'error'];
    var changed = false;
    for (var i = 0; i < keys.length; i += 1) {
      if (params.has(keys[i])) {
        params.delete(keys[i]);
        changed = true;
      }
    }
    if (changed) {
      var query = params.toString();
      var cleanUrl = url.pathname + (query ? '?' + query : '') + url.hash;
      window.history.replaceState({}, '', cleanUrl);
    }
  }

  function initNotifications() {
    var root = document.getElementById('app-notifications');
    if (!root) return;

    var notices = root.querySelectorAll('.app-notice');
    for (var i = 0; i < notices.length; i += 1) {
      (function (notice) {
        var closeBtn = notice.querySelector('.app-notice-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', function () {
            closeNotice(notice);
          });
        }

        setTimeout(function () {
          closeNotice(notice);
        }, 5200);
      })(notices[i]);
    }

    cleanupUrlParams();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
  } else {
    initNotifications();
  }
})();

'use strict';

(function () {

  /**
   * Gestisce le notifiche (successo/errore) 
   */
  class NotificationManager {
    constructor(rootId, autoCloseMs) {
      this.root = document.getElementById(rootId);
      this.autoCloseMs = autoCloseMs;
    }

    init() {
      if (!this.root) return;

      var notices = this.root.querySelectorAll('.app-notice');
      for (var i = 0; i < notices.length; i += 1) {
        this._bindNotice(notices[i]);
      }

      NotificationManager.cleanupUrlParams();
    }

    _bindNotice(notice) {
      var self = this;
      var closeBtn = notice.querySelector('.app-notice-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          self._close(notice);
        });
      }

      setTimeout(function () {
        self._close(notice);
      }, this.autoCloseMs);
    }

    _close(notice) {
      if (!notice) return;
      notice.style.opacity = '0';
      notice.style.transform = 'translateY(-4px)';
      setTimeout(function () {
        if (notice.parentElement) {
          notice.parentElement.removeChild(notice);
        }
      }, 180);
    }

    static cleanupUrlParams() {
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
  }

  function start() {
    var manager = new NotificationManager('app-notifications', 5200);
    manager.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

'use strict';

(function () {
  function activatePreview(col, url) {
    var slot = col.querySelector('.gestione-preview-slot');
    if (!slot || !url) {
      return;
    }
    var main = slot.querySelector('.gestione-preview-main');
    var emptyEl = slot.querySelector('.gestione-preview-empty');
    if (main) {
      main.setAttribute('src', url);
      main.classList.remove('hidden');
    } else {
      main = document.createElement('img');
      main.setAttribute('alt', col.getAttribute('data-structure-name') || '');
      main.className = 'img-responsive gestione-facility-image gestione-preview-main';
      main.setAttribute('src', url);
      if (emptyEl) {
        emptyEl.remove();
      }
      slot.insertBefore(main, slot.firstChild);
    }
    if (emptyEl) {
      emptyEl.classList.add('hidden');
    }
    var list = col.querySelector('.gestione-gallery-list');
    if (list) {
      list.querySelectorAll('.gestione-gallery-thumb-selectable').forEach(function (t) {
        t.classList.toggle('is-selected', t.getAttribute('data-preview-src') === url);
      });
    }
  }

  function onThumbActivate(thumb, col) {
    var url = thumb.getAttribute('data-preview-src');
    if (!url) {
      return;
    }
    activatePreview(col, url);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.gestione-media-col').forEach(function (col) {
      col.querySelectorAll('.gestione-gallery-thumb-selectable').forEach(function (thumb) {
        thumb.addEventListener('click', function (ev) {
          ev.preventDefault();
          onThumbActivate(thumb, col);
        });
        thumb.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            onThumbActivate(thumb, col);
          }
        });
      });
    });
  });
}());

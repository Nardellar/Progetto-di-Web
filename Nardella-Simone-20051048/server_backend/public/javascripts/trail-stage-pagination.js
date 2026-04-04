'use strict';

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var accordion = document.getElementById('trailAccordion');
    if (!accordion) {
      return;
    }

    var panels = Array.prototype.slice.call(accordion.querySelectorAll('.vddm-stage-panel'));
    if (!panels.length) {
      return;
    }

    var pageSize = Number.parseInt(accordion.getAttribute('data-stage-page-size'), 10) || 6;
    if (panels.length <= pageSize) {
      return;
    }

    var pager = document.querySelector('[data-stage-pager]');
    if (!pager) {
      return;
    }

    var prevBtn = pager.querySelector('[data-stage-prev]');
    var nextBtn = pager.querySelector('[data-stage-next]');
    var label = pager.querySelector('[data-stage-page-label]');
    var maxPage = Math.ceil(panels.length / pageSize) - 1;
    var currentPage = 0;

    function closePanel(panel) {
      var toggle = panel.querySelector('.panel-title a');
      var collapse = panel.querySelector('.panel-collapse');
      if (!toggle || !collapse) {
        return;
      }
      toggle.classList.add('collapsed');
      toggle.setAttribute('aria-expanded', 'false');
      collapse.classList.remove('in');
      collapse.setAttribute('aria-expanded', 'false');
    }

    function openPanel(panel) {
      var toggle = panel.querySelector('.panel-title a');
      var collapse = panel.querySelector('.panel-collapse');
      if (!toggle || !collapse) {
        return;
      }
      toggle.classList.remove('collapsed');
      toggle.setAttribute('aria-expanded', 'true');
      collapse.classList.add('in');
      collapse.setAttribute('aria-expanded', 'true');
    }

    function ensureOneOpen(visiblePanels) {
      var open = visiblePanels.find(function (panel) {
        var collapse = panel.querySelector('.panel-collapse');
        return collapse && collapse.classList.contains('in');
      });
      if (!open && visiblePanels.length) {
        openPanel(visiblePanels[0]);
      }
    }

    function renderPage() {
      var start = currentPage * pageSize;
      var end = start + pageSize;
      var visiblePanels = [];

      panels.forEach(function (panel, index) {
        var visible = index >= start && index < end;
        panel.style.display = visible ? '' : 'none';
        if (visible) {
          visiblePanels.push(panel);
        } else {
          closePanel(panel);
        }
      });

      ensureOneOpen(visiblePanels);

      if (label) {
        label.textContent = 'Tappe ' + (start + 1) + '-' + Math.min(end, panels.length) + ' di ' + panels.length;
      }
      if (prevBtn) {
        prevBtn.disabled = currentPage === 0;
      }
      if (nextBtn) {
        nextBtn.disabled = currentPage === maxPage;
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (currentPage > 0) {
          currentPage -= 1;
          renderPage();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (currentPage < maxPage) {
          currentPage += 1;
          renderPage();
        }
      });
    }

    renderPage();
  });
}());

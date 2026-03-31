'use strict';

(function () {
  function outerHeight(el) {
    var style = window.getComputedStyle(el);
    var marginTop = parseFloat(style.marginTop) || 0;
    var marginBottom = parseFloat(style.marginBottom) || 0;
    return el.offsetHeight + marginTop + marginBottom;
  }

  function fitOpenStage() {
    var accordion = document.getElementById('vddmAccordion');
    if (!accordion) return;

    var panels = accordion.querySelectorAll('.panel');
    if (!panels.length) return;

    var openPanel = accordion.querySelector('.panel-collapse.in');
    if (!openPanel) return;

    var openBody = openPanel.querySelector('.panel-body');
    if (!openBody) return;

    var bodies = accordion.querySelectorAll('.panel-body');
    for (var i = 0; i < bodies.length; i += 1) {
      bodies[i].style.minHeight = '';
    }

    var used = 0;
    for (var p = 0; p < panels.length; p += 1) {
      var panel = panels[p];
      var heading = panel.querySelector('.panel-heading');
      if (heading) {
        used += outerHeight(heading);
      }
      if (panel !== openPanel.parentElement) {
        used += 2;
      }
    }

    var naturalHeight = openBody.scrollHeight;
    var target = Math.max(naturalHeight, accordion.clientHeight - used - 8);
    if (target > naturalHeight) {
      openBody.style.minHeight = target + 'px';
    }
  }

  function bindAccordion() {
    var accordion = document.getElementById('vddmAccordion');
    if (!accordion || typeof window.jQuery === 'undefined') return;

    window.jQuery('#vddmAccordion').on('show.bs.collapse', function () {
      window.requestAnimationFrame(fitOpenStage);
    });

    window.jQuery('#vddmAccordion').on('shown.bs.collapse hidden.bs.collapse', function () {
      fitOpenStage();
    });

    window.addEventListener('resize', fitOpenStage);
    fitOpenStage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAccordion);
  } else {
    bindAccordion();
  }
})();

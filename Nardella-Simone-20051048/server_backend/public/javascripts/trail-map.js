'use strict';

(function () {
  var mapEl = document.querySelector('[data-gpx-map]');
  if (!mapEl || typeof L === 'undefined') {
    return;
  }

  var gpxUrl = mapEl.getAttribute('data-gpx') || '';
  var noteEl = document.querySelector('[data-gpx-note]');

  function showNote(message) {
    if (noteEl) {
      if (message) {
        noteEl.textContent = message;
      }
      noteEl.hidden = false;
    }
  }

  if (!gpxUrl) {
    showNote('Traccia GPX non disponibile per questo cammino.');
    return;
  }

  fetch(gpxUrl)
    .then(function (res) {
      if (!res.ok) {
        throw new Error('Errore caricamento GPX');
      }
      return res.text();
    })
    .then(function (xmlText) {
      var parser = new DOMParser();
      var xml = parser.parseFromString(xmlText, 'application/xml');
      var trkpts = xml.getElementsByTagName('trkpt');
      var rtepts = xml.getElementsByTagName('rtept');
      var points = [];

      for (var i = 0; i < trkpts.length; i += 1) {
        var lat = parseFloat(trkpts[i].getAttribute('lat'));
        var lon = parseFloat(trkpts[i].getAttribute('lon'));
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          points.push([lat, lon]);
        }
      }

      if (!points.length && rtepts.length) {
        for (var j = 0; j < rtepts.length; j += 1) {
          var rLat = parseFloat(rtepts[j].getAttribute('lat'));
          var rLon = parseFloat(rtepts[j].getAttribute('lon'));
          if (!Number.isNaN(rLat) && !Number.isNaN(rLon)) {
            points.push([rLat, rLon]);
          }
        }
      }

      if (!points.length) {
        showNote('Traccia GPX non valida o vuota.');
        return;
      }

      var map = L.map(mapEl);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      var polyline = L.polyline(points, {
        color: '#f04c26',
        weight: 5,
        opacity: 0.85
      }).addTo(map);

      L.marker(points[0]).addTo(map).bindPopup('Partenza');
      L.marker(points[points.length - 1]).addTo(map).bindPopup('Arrivo');

      map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
    })
    .catch(function () {
      showNote('Non riesco a caricare la traccia GPX in questo momento.');
    });
})();


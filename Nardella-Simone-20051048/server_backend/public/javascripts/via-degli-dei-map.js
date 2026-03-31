'use strict';

(function () {
  var mapEl = document.getElementById('via-degli-dei-map');
  if (!mapEl || typeof L === 'undefined') {
    return;
  }

  var map = L.map('via-degli-dei-map');

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Placeholder route approximating Via degli Dei path.
  var routeCoords = [
    [44.4949, 11.3426], // Bologna
    [44.4329, 11.2783], // Casalecchio di Reno
    [44.3967, 11.2824], // Sasso Marconi
    [44.3330, 11.2729], // Badolo area
    [44.2780, 11.2440], // Brento area
    [44.2751, 11.2651], // Monzuno
    [44.2060, 11.2730], // Madonna dei Fornelli
    [44.1173, 11.3208], // Passo della Futa
    [43.9842, 11.3231], // San Piero a Sieve
    [43.7766, 11.2558]  // Firenze
  ];

  var polyline = L.polyline(routeCoords, {
    color: '#f04c26',
    weight: 5,
    opacity: 0.85
  }).addTo(map);

  L.marker(routeCoords[0]).addTo(map).bindPopup('Partenza: Bologna');
  L.marker(routeCoords[routeCoords.length - 1]).addTo(map).bindPopup('Arrivo: Firenze');

  map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
})();

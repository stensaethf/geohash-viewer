const map = L.map("map", {
    zoomControl: false,         // hide zoom buttons
    scrollWheelZoom: false,     // disable scroll zoom
    doubleClickZoom: false,     // disable double click zoom
    boxZoom: false,             // disable box zoom
    touchZoom: false,           // disable pinch zoom
    dragging: false             // disable dragging
  }).setView([0, 0], 2);         // start with full world view
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

let rectangles = [];
let selectedRectangle = null;

const geohashDisplay = document.getElementById("geohash");

function drawGeohashGrid() {
  // Clear old rectangles and labels
  rectangles.forEach((obj) => {
    map.removeLayer(obj.rect);
    map.removeLayer(obj.label);
  });
  rectangles = [];

  const bounds = map.getBounds();
  const zoom = map.getZoom();
  const precision = getPrecisionForZoom(zoom);

  const minLat = bounds.getSouth();
  const maxLat = bounds.getNorth();
  const minLng = bounds.getWest();
  const maxLng = bounds.getEast();

  const seen = new Set();
  const MAX_CELLS = 800;

  let count = 0;

  const stepSize = (maxLat - minLat) / 30; // roughly 30 rows

  for (let lat = minLat; lat <= maxLat; lat += stepSize) {
    for (let lng = minLng; lng <= maxLng; lng += stepSize) {
      const hash = encodeGeoHash(lat, lng).substring(0, precision);
      if (seen.has(hash)) continue;
      seen.add(hash);
      if (++count > MAX_CELLS) return;

      const decoded = decodeGeoHash(hash);
      const cell = {
        sw: { lat: decoded.latitude[0], lon: decoded.longitude[0] },
        ne: { lat: decoded.latitude[1], lon: decoded.longitude[1] },
      };

      const sw = [cell.sw.lat, cell.sw.lon];
      const ne = [cell.ne.lat, cell.ne.lon];
      const center = [
        (cell.sw.lat + cell.ne.lat) / 2,
        (cell.sw.lon + cell.ne.lon) / 2,
      ];

      const rect = L.rectangle([sw, ne], {
        color: "#888",
        weight: 1,
        fillOpacity: 0,
        interactive: true,
      }).addTo(map);
      
      rect.on("click", () => {
        map.fitBounds([sw, ne]); // zoom into the cell bounds
        document.getElementById("geohash").textContent = hash;
      });

      const label = L.marker(center, {
        icon: L.divIcon({
          className: "geohash-label",
          html: hash,
          iconSize: null,
        }),
        interactive: false,
      }).addTo(map);

      rectangles.push({ rect, label, bounds: [[cell.sw.lat, cell.sw.lon], [cell.ne.lat, cell.ne.lon]], hash });
    }
  }
}

map.on("moveend", drawGeohashGrid);
// map.on("click", function (e) {
//   const hash = encodeGeoHash(e.latlng.lat, e.latlng.lng);
//   document.getElementById("geohash").textContent = hash;
// });

function getPrecisionForZoom(zoom) {
    if (zoom <= 2) return 1;      // <-- start at top-level 32 regions
    if (zoom <= 4) return 2;
    if (zoom <= 6) return 3;
    if (zoom <= 8) return 4;
    return 5;                     // feel free to increase if needed
  }

document.getElementById("resetViewBtn").addEventListener("click", () => {
    map.setView([0, 0], 2); // Reset to initial view
    drawGeohashGrid();      // Redraw coarse grid
    document.getElementById("geohash").textContent = "Click a grid cell";
  });

drawGeohashGrid(); // Draw grid on load

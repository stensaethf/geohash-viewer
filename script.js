const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let rectangles = [];
let selectedRectangle = null;

const geohashDisplay = document.getElementById("geohash");
const precisionSlider = document.getElementById("precision");
const precisionValue = document.getElementById("precision-value");

precisionSlider.addEventListener("input", () => {
  precisionValue.textContent = precisionSlider.value;
  drawGeohashGrid(); // Redraw grid at new precision
});

// Draw grid whenever map is moved or zoomed
map.on("moveend", drawGeohashGrid);

// Handle map click for selection
map.on("click", function (e) {
  const { lat, lng } = e.latlng;
  const precision = parseInt(precisionSlider.value, 10);
  const hash = Geohash.encode(lat, lng, precision);
  const bounds = Geohash.bounds(hash);

  if (selectedRectangle) {
    map.removeLayer(selectedRectangle);
  }

  const sw = [bounds.sw.lat, bounds.sw.lon];
  const ne = [bounds.ne.lat, bounds.ne.lon];

  selectedRectangle = L.rectangle([sw, ne], { color: "#ff0000", weight: 2 }).addTo(map);
  geohashDisplay.textContent = hash;
});

function drawGeohashGrid() {
  // Clear existing rectangles
  rectangles.forEach(r => map.removeLayer(r));
  rectangles = [];

  const bounds = map.getBounds();
  const precision = parseInt(precisionSlider.value, 10);

  // Get bounding box corners
  const minLat = bounds.getSouth();
  const maxLat = bounds.getNorth();
  const minLng = bounds.getWest();
  const maxLng = bounds.getEast();

  const step = 0.05; // Small step to loop through lat/lon values

  const seen = new Set();

  for (let lat = minLat; lat <= maxLat; lat += step) {
    for (let lng = minLng; lng <= maxLng; lng += step) {
      const hash = Geohash.encode(lat, lng, precision);
      if (seen.has(hash)) continue; // Avoid duplicates
      seen.add(hash);

      const cell = Geohash.bounds(hash);
      const cellSW = [cell.sw.lat, cell.sw.lon];
      const cellNE = [cell.ne.lat, cell.ne.lon];
      const rect = L.rectangle([cellSW, cellNE], {
        color: "#888",
        weight: 1,
        fillOpacity: 0,
      });
      rect.addTo(map);
      rectangles.push(rect);
    }
  }
}

// Initial grid
drawGeohashGrid();
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let rectangle = null;

const precisionSlider = document.getElementById("precision");
const precisionValue = document.getElementById("precision-value");
const geohashOutput = document.getElementById("geohash-output");

precisionSlider.addEventListener("input", () => {
  precisionValue.textContent = precisionSlider.value;
});

map.on("click", function (e) {
  const { lat, lng } = e.latlng;
  const precision = parseInt(precisionSlider.value, 10);
  const hash = Geohash.encode(lat, lng, precision);
  const bounds = Geohash.bounds(hash);

  const sw = [bounds.sw.lat, bounds.sw.lon];
  const ne = [bounds.ne.lat, bounds.ne.lon];

  if (rectangle) {
    map.removeLayer(rectangle);
  }

  rectangle = L.rectangle([sw, ne], { color: "#ff6600", weight: 2 }).addTo(map);
  map.fitBounds(rectangle.getBounds(), { maxZoom: 16 });

  geohashOutput.textContent = `Geohash (${precision} chars): ${hash}`;
});
const map = L.map("map", {
  zoomControl: false, // hide zoom buttons
  scrollWheelZoom: false, // disable scroll zoom
  doubleClickZoom: false, // disable double click zoom
  boxZoom: false, // disable box zoom
  touchZoom: false, // disable pinch zoom
  dragging: false, // disable dragging
}).setView([0, 0], 2); // start with full world view
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

let rectangles = [];
let currentGeohash = "";

const geohashDisplay = document.getElementById("geohash");
const backButton = document.getElementById("backButton");
const resetButton = document.getElementById("resetButton");
const geohashInput = document.getElementById("geohashInput");

function drawGeohashGrid() {
  rectangles.forEach((obj) => {
    map.removeLayer(obj.rect);
    map.removeLayer(obj.label);
  });
  rectangles = [];

  if (currentGeohash.length >= 8) {
    drawSingleGeohashCell(currentGeohash); // Draw the selected geohash cell at precision 8
    return;
  }

  const zoom = map.getZoom();
  const precision = getPrecisionForZoom(zoom);

  const baseHashes =
    precision === 1
      ? BASE32.split("")
      : BASE32.split("").map((c) => currentGeohash + c);

  for (const hash of baseHashes) {
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

    const labelChar = precision === 1 ? hash : hash[hash.length - 1];

    const rect = L.rectangle([sw, ne], {
      color: "#888",
      weight: 1,
      fillOpacity: 0,
      interactive: true,
    }).addTo(map);

    const label = L.marker(center, {
      icon: L.divIcon({
        className: "geohash-label",
        html: labelChar, // the geohash character for the current level
        iconSize: [30, 30], // Adjust size of the label to be more consistent
        iconAnchor: [15, 15], // Anchor the text to the center of the icon
      }),
      interactive: false,
    }).addTo(map);

    rectangles.push({ rect, label });

    rect.on("click", () => {
      if (hash.length > 8) return;
      updateView(hash, sw, ne);
    });
  }
}

function drawSingleGeohashCell(hash) {
  rectangles.forEach((obj) => {
    map.removeLayer(obj.rect);
    map.removeLayer(obj.label);
  });
  rectangles = [];

  const bounds = decodeGeoHash(hash);
  const sw = [bounds.latitude[0], bounds.longitude[0]];
  const ne = [bounds.latitude[1], bounds.longitude[1]];
  const center = [(sw[0] + ne[0]) / 2, (sw[1] + ne[1]) / 2];

  // Draw the rectangle (grid square)
  const rect = L.rectangle([sw, ne], {
    color: "#000",
    weight: 2,
    fillOpacity: 0.1,
    interactive: false,
  }).addTo(map);

  // Create a marker for the label, positioning it above the square
  const label = L.marker([center[0], center[1] - (ne[0] - sw[0]) * 0.025], {
    // Adjust vertical positioning
    icon: L.divIcon({
      className: "geohash-label",
      html: hash,
      iconSize: [50, 20], // Control the label size
      iconAnchor: [25, 10], // Center horizontally at the top
    }),
    interactive: false,
  }).addTo(map);

  rectangles.push({ rect, label });
}

function getPrecisionForZoom(zoom) {
  if (zoom <= 2) return 1; // <-- start at top-level 32 regions
  if (zoom <= 4) return 2;
  if (zoom <= 6) return 3;
  if (zoom <= 8) return 4;
  return 5; // feel free to increase if needed
}

resetButton.addEventListener("click", () => {
  resetMap();
  
  // clear input
  geohashInput.value = "";
});

function resetMap() {
  updateView("");
}

function updateView(hash) {
  currentGeohash = hash;

  if (currentGeohash == "") {
    // Reset map
    map.setView([0, 0], 2);
    geohashDisplay.textContent = "Click a grid cell";
  } else {
    const decoded = decodeGeoHash(currentGeohash);
    const sw = [decoded.latitude[0], decoded.longitude[0]];
    const ne = [decoded.latitude[1], decoded.longitude[1]];

    map.fitBounds([sw, ne]);
    geohashDisplay.textContent = currentGeohash;
  }

  backButton.disabled = currentGeohash.length == 0;
  resetButton.disabled = currentGeohash.length == 0;

  drawGeohashGrid();
}

backButton.addEventListener("click", () => {
  if (currentGeohash.length == 1) {
    resetMap();
  } else if (currentGeohash.length > 1) {
    // Decrease the precision by trimming one character
    currentGeohash = currentGeohash.slice(0, -1);

    updateView(currentGeohash);
  }
});

document.getElementById("geohashInputButton").addEventListener("click", () => {
  const input = document
    .getElementById("geohashInput")
    .value.trim()
    .toLowerCase();

  if (!/^[0123456789bcdefghjkmnpqrstuvwxyz]{1,8}$/.test(input)) {
    alert("Invalid geohash (1–8 letters and numbers only).");
    return;
  }

  updateView(input);
});

map.on("moveend", drawGeohashGrid);

drawGeohashGrid(); // Draw grid on load

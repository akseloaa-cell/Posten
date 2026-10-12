(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const number = value => Math.round(value).toLocaleString("nb-NO");
  const money = value => number(value) + " kr";
  const monthNames = ["Januar","Februar","Mars","April","Mai","Juni","Juli","August","September","Oktober","November","Desember"];
  let toastTimer, activeView = "overview", mobilePanelOpen = false, zoom = 1, mapCenterX = 180, mapCenterY = 90, dragging = false, dragMoved = false, dragStartX = 0, dragStartY = 0, dragStartCenterX = 180, dragStartCenterY = 90;
  function showToast(message) {
    const toast = $("toast"); toast.textContent = message; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }
  function selectedCity() { return window.GAME_DATA.cities.find(city => city.id === window.GameState.current.selectedCityId) || window.GAME_DATA.cities[0]; }
  function ownsOffice(cityId) { return window.Logistics.hasBuilding(cityId, "office"); }
  function ownsHub(cityId) { return window.Logistics.hasBuilding(cityId, "hub"); }
  function cityById(id) { return window.GAME_DATA.cities.find(city => city.id === id); }
  function renderSelects() {
    const cities = window.GAME_DATA.cities;
    ["route-from","network-route-from"].forEach(id => { const el = $(id), old = el.value; el.innerHTML = cities.map(c => '<option value="' + c.id + '">' + c.name + (ownsOffice(c.id) ? "" : " · mangler kontor") + '</option>').join(""); if (cities.some(c => c.id === old)) el.value = old; });
    ["route-to","network-route-to"].forEach(id => { const el = $(id), old = el.value; el.innerHTML = cities.map(c => '<option value="' + c.id + '">' + c.name + (ownsOffice(c.id) ? "" : " · mangler kontor") + '</option>').join(""); if (cities.some(c => c.id === old)) el.value = old; });
    [["route-from","route-to"],["network-route-from","network-route-to"]].forEach(pair => { const from = $(pair[0]), to = $(pair[1]); if (from.value === to.value && cities.length > 1) to.value = cities.find(c => c.id !== from.value).id; });
  }
  function renderStats() {
    const s = window.GameState.current;
    $("date-label").textContent = monthNames[s.month - 1].toUpperCase() + " · ÅR " + s.year;
    $("era-name").textContent = s.year < 1870 ? "Den tidlige posten" : s.year < 1900 ? "Jernbanens tidsalder" : "Det moderne postvesenet";
    $("money-value").textContent = money(s.money);
    $("reputation-value").textContent = s.reputation + " / 100";
    $("delivered-value").textContent = number(s.deliveredTotal);
    $("delivery-rate").textContent = s.deliveredLastMonth ? number(s.deliveredLastMonth) + " forrige måned" : "Ingen leveranser ennå";
    $("routes-value").textContent = s.routes.length;
    $("offices-value").textContent = s.buildings.filter(b => b.type === "office").length;
    $("building-count").textContent = s.buildings.length;
    $("income-value").textContent = money(s.incomeLastMonth);
    $("cost-value").textContent = money(s.costsLastMonth);
    const profit = $("profit-value");
    profit.textContent = s.profitLastMonth === null ? "—" : (s.profitLastMonth > 0 ? "+" : "") + money(s.profitLastMonth);
    profit.className = s.profitLastMonth === null ? "" : (s.profitLastMonth >= 0 ? "positive" : "negative");
    $("event-message").textContent = s.lastMessage;
  }
  function applyMapView() {
    const svg = $("map-container").querySelector("svg");
    if (!svg) return;
    const width = 360 / zoom, height = 180 / zoom;
    mapCenterX = Math.max(width / 2, Math.min(360 - width / 2, mapCenterX));
    mapCenterY = Math.max(height / 2, Math.min(180 - height / 2, mapCenterY));
    svg.setAttribute("viewBox", (mapCenterX - width / 2) + " " + (mapCenterY - height / 2) + " " + width + " " + height);
  }
  function renderMap() {
    const cities = window.GAME_DATA.cities, s = window.GameState.current;
    const points = Object.fromEntries(cities.map(c => [c.id, { x: c.lon + 180, y: 90 - c.lat }]));
    const routeSvg = s.routes.map(route => {
      const a = points[route.from], b = points[route.to]; if (!a || !b) return "";
      return '<line class="map-route" data-route="' + route.id + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" vector-effect="non-scaling-stroke"><title>' + cityById(route.from).name + ' – ' + cityById(route.to).name + '</title></line>';
    }).join("");
    const citySvg = cities.map(city => {
      const p = points[city.id], office = ownsOffice(city.id), hub = ownsHub(city.id), selected = s.selectedCityId === city.id;
      const labelDx = city.id === "bergen" || city.id === "stavanger" ? 1.4 : 1.2;
      const labelDy = city.id === "kristiansand" ? 2.2 : city.id === "stavanger" ? -1.3 : -1.2;
      return '<g class="map-city ' + (office ? "has-office " : "") + (hub ? "has-hub " : "") + (selected ? "selected" : "") + '" data-city="' + city.id + '" tabindex="0" role="button" aria-label="Åpne ' + city.name + '"><circle class="city-halo" cx="' + p.x + '" cy="' + p.y + '" r="' + (selected ? .8 : .38) + '" vector-effect="non-scaling-stroke"></circle><circle class="city-dot" cx="' + p.x + '" cy="' + p.y + '" r="' + (office ? .24 : .18) + '" vector-effect="non-scaling-stroke"></circle>' + (hub ? '<rect class="hub-mark" x="' + (p.x + .6) + '" y="' + (p.y - 1.4) + '" width=".9" height=".9" rx=".12"></rect>' : '') + (selected ? '<text class="city-label" x="' + (p.x + labelDx) + '" y="' + (p.y + labelDy) + '">' + city.name + '</text>' : '') + '</g>';
    }).join("");
    const land = '<path class="world-countries" d="' + window.WORLD_MAP_PATH + '" fill-rule="evenodd"/>' +
      '<text class="water-label" x="45" y="78">STILLEHAVET</text><text class="water-label" x="172" y="76">ATLANTERHAVET</text><text class="water-label" x="260" y="123">INDIAHAVET</text><text class="water-label" x="170" y="14">ISHAVET</text>';
    $("map-container").innerHTML = '<svg viewBox="0 0 360 180" preserveAspectRatio="none" aria-label="Verdenskart med postruter">' + land + routeSvg + citySvg + '</svg>';
    applyMapView();
    $("map-container").querySelectorAll("[data-city]").forEach(el => {
      const choose = () => { s.selectedCityId = el.dataset.city; window.GameState.save(); activeView = "overview"; mobilePanelOpen = true; render(); };
      el.addEventListener("click", choose);
      el.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(); } });
    });
    $("map-container").querySelectorAll("[data-route]").forEach(el => el.addEventListener("click", event => {
      event.stopPropagation(); const route = s.routes.find(r => r.id === el.dataset.route); if (!route) return;
      showToast("Postrute: " + cityById(route.from).name + " ↔ " + cityById(route.to).name + " · kapasitet " + number(route.capacity) + " sendinger/mnd.");
    }));
    const container = $("map-container");
    container.onpointerdown = event => {
      if (event.target.closest("[data-city], [data-route]")) return;
      dragging = true; dragMoved = false; dragStartX = event.clientX; dragStartY = event.clientY;
      dragStartCenterX = mapCenterX; dragStartCenterY = mapCenterY; container.classList.add("dragging");
      if (container.setPointerCapture) container.setPointerCapture(event.pointerId);
    };
    container.onpointermove = event => {
      if (!dragging) return;
      const dx = event.clientX - dragStartX, dy = event.clientY - dragStartY;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;
      const rect = container.getBoundingClientRect();
      mapCenterX = dragStartCenterX - dx * (360 / zoom) / rect.width;
      mapCenterY = dragStartCenterY - dy * (180 / zoom) / rect.height;
      applyMapView();
    };
    const endDrag = () => { dragging = false; container.classList.remove("dragging"); };
    container.onpointerup = endDrag; container.onpointercancel = endDrag;
    container.onwheel = event => {
      event.preventDefault();
      const oldZoom = zoom, nextZoom = Math.max(1, Math.min(8, zoom * (event.deltaY < 0 ? 1.2 : 1 / 1.2)));
      if (nextZoom === oldZoom) return;
      const rect = container.getBoundingClientRect(), px = (event.clientX - rect.left) / rect.width, py = (event.clientY - rect.top) / rect.height;
      const oldW = 360 / oldZoom, oldH = 180 / oldZoom;
      const worldX = mapCenterX - oldW / 2 + px * oldW, worldY = mapCenterY - oldH / 2 + py * oldH;
      zoom = nextZoom;
      const newW = 360 / zoom, newH = 180 / zoom;
      mapCenterX = worldX - (px - .5) * newW; mapCenterY = worldY - (py - .5) * newH;
      applyMapView();
    };
  }
    function renderCityPanel() {
    const city = selectedCity(), office = ownsOffice(city.id), hub = ownsHub(city.id);
    $("panel-eyebrow").textContent = "BYADMINISTRASJON";
    $("panel-title").textContent = city.name;
    $("panel-badge").textContent = hub ? "Knute­punkt" : office ? "Etablert" : "Ikke etablert";
    $("city-population").textContent = number(city.population);
    $("city-demand").textContent = number(city.demand) + " / mnd.";
    $("city-description").textContent = office ? (hub ? "Byen har både postkontor og sorteringssenter. Den er et viktig knutepunkt i nettverket ditt." : "Postkontoret er etablert. Koble byen til flere steder, eller bygg et sorteringssenter.") : "Du har ennå ikke etablert deg her. Bygg et postkontor for å begynne å samle inn og levere post.";
    $("city-illustration").innerHTML = '<span>' + (hub ? "▤" : office ? "⌂" : "⌖") + '</span><small>' + (hub ? "SORTERINGSSENTER" : office ? "POSTKONTOR" : "NY ETABLERING") + '</small>';
    const count = window.GameState.current.buildings.filter(b => b.cityId === city.id).length;
    $("city-building-count").textContent = count;
    $("build-office-button").disabled = office || window.GameState.current.money < window.GAME_DATA.officeCost;
    $("build-office-button").textContent = office ? "Bygget" : "Bygg";
    $("build-hub-button").disabled = hub || !office || window.GameState.current.money < window.GAME_DATA.hubCost;
    $("build-hub-button").textContent = hub ? "Bygget" : "Bygg";
    const cityRoutes = window.GameState.current.routes.filter(r => r.from === city.id || r.to === city.id);
    $("city-route-count").textContent = cityRoutes.length;
    $("city-routes").innerHTML = cityRoutes.length ? cityRoutes.map(r => {
      const other = cityById(r.from === city.id ? r.to : r.from);
      return '<div class="city-route-item"><span>⌁ &nbsp;' + other.name + '</span><small>' + number(r.capacity) + ' / mnd.</small></div>';
    }).join("") : '<div class="empty-state">Ingen ruter koblet til denne byen ennå.</div>';
  }
  function renderCities() {
    $("city-count").textContent = window.GAME_DATA.cities.length;
    $("cities-list").innerHTML = window.GAME_DATA.cities.map(city => {
      const office = ownsOffice(city.id), hub = ownsHub(city.id);
      const status = hub ? "Knute­punkt" : office ? "Postkontor" : "Ikke etablert";
      return '<div class="city-row" data-open-city="' + city.id + '" tabindex="0" role="button"><span class="city-marker">' + (office ? "⌂" : "○") + '</span><div class="city-row-main"><strong>' + city.name + '</strong><small>' + number(city.population) + ' innbyggere · ' + status + '</small></div><span class="city-status ' + (office ? "owned" : "") + '">›</span></div>';
    }).join("");
    $("cities-list").querySelectorAll("[data-open-city]").forEach(el => {
      const open = () => { window.GameState.current.selectedCityId = el.dataset.openCity; window.GameState.save(); activeView = "overview"; mobilePanelOpen = true; render(); };
      el.addEventListener("click", open); el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") open(); });
    });
  }
  function renderRoutes() {
    const cities = window.GAME_DATA.cities, list = window.GameState.current.routes;
    $("routes-list").innerHTML = list.length ? list.map(route => {
      const from = cities.find(c => c.id === route.from), to = cities.find(c => c.id === route.to);
      return '<div class="route-row" data-open-route="' + route.id + '" tabindex="0" role="button"><span class="city-marker">⌁</span><div class="route-row-main"><strong>' + from.name + ' ↔ ' + to.name + '</strong><small>' + number(route.capacity) + ' sendinger/mnd. · ' + money(window.GAME_DATA.routeMonthlyCost) + '/mnd.</small></div><span class="route-chip">AKTIV</span></div>';
    }).join("") : '<div class="empty-state">Ingen aktive ruter ennå. Bygg postkontor i to byer for å koble dem sammen.</div>';
    $("routes-list").querySelectorAll("[data-open-route]").forEach(el => el.addEventListener("click", () => {
      const route = list.find(r => r.id === el.dataset.openRoute); if (!route) return;
      window.GameState.current.selectedCityId = route.from; activeView = "overview"; mobilePanelOpen = true; render();
      showToast("Valgt rute: " + cityById(route.from).name + " ↔ " + cityById(route.to).name);
    }));
  }
  function renderView() {
    $("object-panel-content").hidden = activeView !== "overview";
    $("network-view").hidden = activeView !== "network";
    $("cities-view").hidden = activeView !== "cities";
    document.querySelectorAll("[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === activeView));
    if (activeView === "network") { $("panel-eyebrow").textContent = "INFRASTRUKTUR"; $("panel-title").textContent = "Postrutenett"; $("panel-badge").textContent = window.GameState.current.routes.length + " ruter"; }
    else if (activeView === "cities") { $("panel-eyebrow").textContent = "UTVIDELSE"; $("panel-title").textContent = "Byer og bygg"; $("panel-badge").textContent = window.GAME_DATA.cities.length + " byer"; }
  }
  function render() {
    renderStats(); renderMap(); renderSelects(); renderCityPanel(); renderCities(); renderRoutes(); renderView();
  }
  function perform(action) {
    if (!action.ok) { showToast(action.message); return; }
    window.GameState.current.lastMessage = action.message; window.GameState.save(); render(); showToast(action.message);
  }
  $("build-office-button").addEventListener("click", () => perform(window.Logistics.build(selectedCity().id, "office")));
  $("build-hub-button").addEventListener("click", () => perform(window.Logistics.build(selectedCity().id, "hub")));
  $("route-form").addEventListener("submit", event => { event.preventDefault(); perform(window.Logistics.createRoute($("route-from").value, $("route-to").value)); });
  $("network-route-form").addEventListener("submit", event => { event.preventDefault(); perform(window.Logistics.createRoute($("network-route-from").value, $("network-route-to").value)); });
  $("next-month-button").addEventListener("click", () => {
    const result = window.Game.nextMonth(); render();
    showToast("Ny måned startet. Resultat: " + (result.profit >= 0 ? "+" : "") + money(result.profit));
  });
  $("reset-button").addEventListener("click", () => {
    if (!window.confirm("Starte et helt nytt spill? Lagret fremgang blir slettet.")) return;
    window.GameState.reset(); activeView = "overview"; mobilePanelOpen = false; render(); showToast("Nytt spill startet.");
  });
  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => { activeView = button.dataset.view; mobilePanelOpen = activeView !== "overview"; renderView(); }));
  $("zoom-in").addEventListener("click", () => { zoom = Math.min(8, zoom * 1.25); applyMapView(); });
  $("zoom-out").addEventListener("click", () => { zoom = Math.max(1, zoom / 1.25); applyMapView(); });
  render();
})();
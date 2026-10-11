(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const number = value => Math.round(value).toLocaleString("nb-NO");
  const money = value => number(value) + " kr";
  const monthNames = ["Januar","Februar","Mars","April","Mai","Juni","Juli","August","September","Oktober","November","Desember"];
  let toastTimer, activeView = "overview", zoom = 1;
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
  function renderMap() {
    const cities = window.GAME_DATA.cities, s = window.GameState.current;
    // Project geographic coordinates into a tall, map-like view of mainland Norway.
    const points = Object.fromEntries(cities.map(c => [c.id, {
      x: 20 + ((c.lon - 3.5) / 29) * 60,
      y: ((71.5 - c.lat) / 14) * 100
    }]));
    const routeSvg = s.routes.map(route => {
      const a = points[route.from], b = points[route.to]; if (!a || !b) return "";
      return '<line class="map-route" data-route="' + route.id + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" vector-effect="non-scaling-stroke"><title>' + cityById(route.from).name + ' – ' + cityById(route.to).name + '</title></line>';
    }).join("");
    const citySvg = cities.map(city => {
      const p = points[city.id], office = ownsOffice(city.id), hub = ownsHub(city.id), selected = s.selectedCityId === city.id;
      const labelAnchor = city.id === "bergen" || city.id === "stavanger" ? "start" : "start";
      const labelDx = city.id === "bergen" ? 2.3 : city.id === "stavanger" ? 2.3 : 2.4;
      const labelDy = city.id === "kristiansand" ? -2.3 : city.id === "stavanger" ? 2.8 : -1.7;
      return '<g class="map-city ' + (office ? "has-office " : "") + (hub ? "has-hub " : "") + (selected ? "selected" : "") + '" data-city="' + city.id + '" tabindex="0" role="button" aria-label="Åpne ' + city.name + '"><circle class="city-halo" cx="' + p.x + '" cy="' + p.y + '" r="' + (selected ? 3.7 : 2.7) + '"></circle><circle class="city-dot" cx="' + p.x + '" cy="' + p.y + '" r="' + (office ? 1.55 : 1.15) + '"></circle>' + (hub ? '<rect class="hub-mark" x="' + (p.x + 1.1) + '" y="' + (p.y - 3.2) + '" width="2" height="2" rx=".3"></rect>' : '') + '<text text-anchor="' + labelAnchor + '" x="' + (p.x + labelDx) + '" y="' + (p.y + labelDy) + '">' + city.name + '</text></g>';
    }).join("");
    // Mainland outline generated from Natural Earth ne_110m_admin_0_countries.geojson (Norway).
    // Natural Earth is a cartographic dataset; this 1:110m layer is generalized, not survey-grade coastline data.
    const land = '<path class="land-shape" d="M77.11 13.87 L73.59 16.74 L71.91 17.39 L72.79 12.38 L70.14 9.54 L66.92 11.96 L65.91 17.20 L63.94 20.36 L61.71 18.63 L59.01 18.99 L56.71 15.21 L55.47 17.10 L54.19 17.39 L53.89 22.09 L49.99 20.95 L49.44 24.92 L47.45 24.90 L46.09 29.98 L44.02 37.90 L40.80 47.95 L41.56 50.39 L40.84 53.22 L38.79 53.10 L37.44 59.80 L37.57 69.28 L38.89 72.90 L38.21 81.30 L36.49 86.20 L35.57 90.31 L34.19 85.93 L30.10 94.19 L27.34 95.87 L24.48 92.23 L23.74 84.55 L23.09 68.06 L24.99 63.47 L30.46 57.47 L34.54 50.10 L38.33 40.14 L43.30 26.35 L46.76 20.98 L52.45 12.02 L56.99 8.89 L60.39 9.27 L63.54 3.35 L67.32 3.67 L71.03 2.25 L77.50 7.47 L74.84 9.38 L77.11 13.87 Z"/>' +
      '<text class="water-label" x="4" y="60">NORDSJØEN</text><text class="water-label" x="68" y="48">SVERIGE</text><text class="water-label" x="55" y="4">BARENTSHAVET</text>';
    $("map-container").innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="transform:scale(' + zoom + ');transform-origin:center center" aria-label="Kart over Norge">' + land + routeSvg + citySvg + '</svg>';
    $("map-container").querySelectorAll("[data-city]").forEach(el => {
      const choose = () => { s.selectedCityId = el.dataset.city; window.GameState.save(); activeView = "overview"; render(); };
      el.addEventListener("click", choose);
      el.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(); } });
    });
    $("map-container").querySelectorAll("[data-route]").forEach(el => el.addEventListener("click", event => {
      event.stopPropagation(); const route = s.routes.find(r => r.id === el.dataset.route); if (!route) return;
      showToast("Postrute: " + cityById(route.from).name + " ↔ " + cityById(route.to).name + " · kapasitet " + number(route.capacity) + " sendinger/mnd.");
    }));
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
      const open = () => { window.GameState.current.selectedCityId = el.dataset.openCity; window.GameState.save(); activeView = "overview"; render(); };
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
      window.GameState.current.selectedCityId = route.from; activeView = "overview"; render();
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
    window.GameState.reset(); activeView = "overview"; render(); showToast("Nytt spill startet.");
  });
  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => { activeView = button.dataset.view; renderView(); }));
  $("zoom-in").addEventListener("click", () => { zoom = Math.min(1.35, zoom + .1); renderMap(); });
  $("zoom-out").addEventListener("click", () => { zoom = Math.max(.85, zoom - .1); renderMap(); });
  render();
})();
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
    const points = Object.fromEntries(cities.map(c => [c.id, { x: 13 + c.x * .73, y: 8 + c.y * .83 }]));
    const routeSvg = s.routes.map(route => {
      const a = points[route.from], b = points[route.to]; if (!a || !b) return "";
      return '<line class="map-route" data-route="' + route.id + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" vector-effect="non-scaling-stroke"><title>' + cityById(route.from).name + ' – ' + cityById(route.to).name + '</title></line>';
    }).join("");
    const citySvg = cities.map(city => {
      const p = points[city.id], office = ownsOffice(city.id), hub = ownsHub(city.id), selected = s.selectedCityId === city.id;
      return '<g class="map-city ' + (office ? "has-office " : "") + (hub ? "has-hub " : "") + (selected ? "selected" : "") + '" data-city="' + city.id + '" tabindex="0" role="button" aria-label="Åpne ' + city.name + '"><circle class="city-halo" cx="' + p.x + '" cy="' + p.y + '" r="' + (selected ? 3.7 : 2.7) + '"></circle><circle class="city-dot" cx="' + p.x + '" cy="' + p.y + '" r="' + (office ? 1.65 : 1.25) + '"></circle>' + (hub ? '<rect class="hub-mark" x="' + (p.x + 1.1) + '" y="' + (p.y - 3.2) + '" width="2" height="2" rx=".3"></rect>' : '') + '<text x="' + (p.x + 2.4) + '" y="' + (p.y - 1.4) + '">' + city.name + '</text></g>';
    }).join("");
    const land = '<path class="land-shape" d="M39 3 L44 6 42 11 46 15 43 20 47 23 45 28 49 32 47 36 53 40 52 44 57 49 54 53 58 57 54 62 57 66 52 72 49 77 44 80 42 87 37 91 34 87 37 81 35 76 39 70 37 65 33 61 34 56 30 53 32 47 29 43 33 38 31 33 35 28 33 23 37 18 35 13 39 9 Z"/><path class="land-detail" d="M39 8 L37 17 41 23 38 29 42 36 39 42 45 48 43 54 48 60 45 67 48 72 M34 39 L39 37 43 41 M38 56 L43 59 48 56 M38 75 L43 77"/><text class="water-label" x="13" y="39">NORDSJØEN</text><text class="water-label" x="68" y="55">SVERIGE</text><text class="water-label" x="68" y="59"> </text>';
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
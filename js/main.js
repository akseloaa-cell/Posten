(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const number = value => Math.round(value).toLocaleString("nb-NO");
  const money = value => number(value) + " kr";
  const monthNames = ["Januar","Februar","Mars","April","Mai","Juni","Juli","August","September","Oktober","November","Desember"];
  let toastTimer;
  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }
  function selectedCity() {
    return window.GAME_DATA.cities.find(city => city.id === window.GameState.current.selectedCityId) || window.GAME_DATA.cities[0];
  }
  function ownsOffice(cityId) { return window.Logistics.hasBuilding(cityId, "office"); }
  function ownsHub(cityId) { return window.Logistics.hasBuilding(cityId, "hub"); }
  function renderSelects() {
    const cities = window.GAME_DATA.cities;
    const from = $("route-from"), to = $("route-to");
    const oldFrom = from.value, oldTo = to.value;
    from.innerHTML = cities.map(c => '<option value="' + c.id + '">' + c.name + (ownsOffice(c.id) ? "" : " · mangler postkontor") + '</option>').join("");
    to.innerHTML = cities.map(c => '<option value="' + c.id + '">' + c.name + (ownsOffice(c.id) ? "" : " · mangler postkontor") + '</option>').join("");
    if (cities.some(c => c.id === oldFrom)) from.value = oldFrom;
    if (cities.some(c => c.id === oldTo)) to.value = oldTo;
    if (from.value === to.value && cities.length > 1) to.value = cities.find(c => c.id !== from.value).id;
  }
  function renderStats() {
    const s = window.GameState.current;
    $("date-label").textContent = monthNames[s.month - 1].toUpperCase() + " · ÅR " + s.year;
    $("era-year").textContent = "År " + s.year;
    $("money-value").textContent = money(s.money);
    $("reputation-value").textContent = s.reputation + " / 100";
    $("delivered-value").textContent = number(s.deliveredTotal);
    $("delivery-rate").textContent = s.deliveredLastMonth ? number(s.deliveredLastMonth) + " sendt forrige måned" : "Ingen leveranser ennå";
    $("routes-value").textContent = s.routes.length;
    $("offices-value").textContent = window.Logistics ? s.buildings.filter(b => b.type === "office").length + " postkontor" : "1 postkontor";
    $("building-count").textContent = s.buildings.length + (s.buildings.length === 1 ? " bygg" : " bygg");
    $("city-count").textContent = window.GAME_DATA.cities.length + " byer";
    $("income-value").textContent = money(s.incomeLastMonth);
    $("cost-value").textContent = money(s.costsLastMonth);
    const profit = $("profit-value");
    profit.textContent = s.profitLastMonth === null ? "—" : (s.profitLastMonth > 0 ? "+" : "") + money(s.profitLastMonth);
    profit.className = s.profitLastMonth === null ? "" : (s.profitLastMonth >= 0 ? "positive" : "negative");
    $("event-message").textContent = s.lastMessage;
  }
  function renderMap() {
    const cities = window.GAME_DATA.cities;
    const routes = window.GameState.current.routes;
    const buildings = window.GameState.current.buildings;
    const points = Object.fromEntries(cities.map(c => [c.id, { x: 18 + c.x * .64, y: 8 + c.y * .82 }]));
    const routeSvg = routes.map(route => {
      const a = points[route.from], b = points[route.to];
      if (!a || !b) return "";
      return '<line class="map-route" x1="' + a.x + '%" y1="' + a.y + '%" x2="' + b.x + '%" y2="' + b.y + '%"></line>';
    }).join("");
    const citySvg = cities.map(city => {
      const p = points[city.id], office = buildings.some(b => b.cityId === city.id && b.type === "office");
      const selected = window.GameState.current.selectedCityId === city.id;
      return '<g class="map-city ' + (office ? "has-office" : "") + '" data-city="' + city.id + '" tabindex="0" role="button" aria-label="Velg ' + city.name + '" style="cursor:pointer"><circle cx="' + p.x + '%" cy="' + p.y + '%" r="' + (selected ? 6.5 : 5) + '"></circle><text x="' + (p.x + 1.6) + '%" y="' + (p.y - 1.4) + '%">' + city.name + '</text></g>';
    }).join("");
    $("map-container").innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + routeSvg + citySvg + '</svg>';
    $("map-container").querySelectorAll("[data-city]").forEach(el => {
      const choose = () => { window.GameState.current.selectedCityId = el.dataset.city; render(); };
      el.addEventListener("click", choose);
      el.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(); } });
    });
  }
  function renderCities() {
    $("cities-list").innerHTML = window.GAME_DATA.cities.map(city => {
      const office = ownsOffice(city.id), hub = ownsHub(city.id);
      const status = office ? (hub ? "Postkontor + senter" : "Postkontor") : "Ikke etablert";
      return '<div class="city-row"><span class="city-marker">' + (office ? "⌂" : "○") + '</span><div class="city-row-main"><strong>' + city.name + '</strong><small>' + number(city.population) + ' innbyggere · etterspørsel ' + number(city.demand) + '</small></div><span class="city-status ' + (office ? "owned" : "") + '">' + status + '</span></div>';
    }).join("");
  }
  function renderRoutes() {
    const cities = window.GAME_DATA.cities;
    const list = window.GameState.current.routes;
    if (!list.length) {
      $("routes-list").innerHTML = '<div class="empty-state">Ingen aktive ruter ennå.<br>Bygg postkontor i to byer for å koble dem sammen.</div>';
      return;
    }
    $("routes-list").innerHTML = list.map(route => {
      const from = cities.find(c => c.id === route.from), to = cities.find(c => c.id === route.to);
      return '<div class="route-row"><span class="city-marker">⌁</span><div class="route-row-main"><strong>' + from.name + ' <span style="color:#9aa69c">→</span> ' + to.name + '</strong><small>Kapasitet ' + number(route.capacity) + ' sendinger/mnd · drift ' + money(window.GAME_DATA.routeMonthlyCost) + '/mnd</small></div><span class="route-chip">AKTIV</span></div>';
    }).join("");
  }
  function render() {
    renderStats();
    renderMap();
    renderCities();
    renderSelects();
    renderRoutes();
    const city = selectedCity();
    $("build-office-button").disabled = ownsOffice(city.id) || window.GameState.current.money < window.GAME_DATA.officeCost;
    $("build-office-button").textContent = ownsOffice(city.id) ? "Bygget" : "Bygg";
    $("build-hub-button").disabled = ownsHub(city.id) || !ownsOffice(city.id) || window.GameState.current.money < window.GAME_DATA.hubCost;
    $("build-hub-button").textContent = ownsHub(city.id) ? "Bygget" : "Bygg";
  }
  function perform(action) {
    if (!action.ok) { showToast(action.message); return; }
    window.GameState.current.lastMessage = action.message;
    window.GameState.save();
    render();
    showToast(action.message);
  }
  $("map-container").addEventListener("click", event => {
    const node = event.target.closest("[data-city]");
    if (node) return;
  });
  $("build-office-button").addEventListener("click", () => perform(window.Logistics.build(selectedCity().id, "office")));
  $("build-hub-button").addEventListener("click", () => perform(window.Logistics.build(selectedCity().id, "hub")));
  $("route-form").addEventListener("submit", event => {
    event.preventDefault();
    perform(window.Logistics.createRoute($("route-from").value, $("route-to").value));
  });
  $("next-month-button").addEventListener("click", () => {
    const result = window.Game.nextMonth();
    render();
    showToast("Ny måned startet. Resultat: " + (result.profit >= 0 ? "+" : "") + money(result.profit));
  });
  $("reset-button").addEventListener("click", () => {
    if (!window.confirm("Starte et helt nytt spill? Lagret fremgang blir slettet.")) return;
    window.GameState.reset();
    render();
    showToast("Nytt spill startet.");
  });
  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("[data-view]").forEach(item => item.classList.toggle("active", item === button));
    const view = button.dataset.view;
    const labels = { overview: "Postoversikt", network: "Rutenettverk", cities: "Byer og bygg" };
    $("page-title").textContent = labels[view] || "Postoversikt";
    if (view === "network") $("route-form").scrollIntoView({ behavior: "smooth", block: "center" });
    if (view === "cities") $("cities-list").scrollIntoView({ behavior: "smooth", block: "center" });
    if (view === "overview") window.scrollTo({ top: 0, behavior: "smooth" });
  }));
  render();
})();
(function () {
  "use strict";
  const state = () => window.GameState.current;
  const data = () => window.GAME_DATA;
  function hasBuilding(cityId, type) {
    return state().buildings.some(building => building.cityId === cityId && (!type || building.type === type));
  }
  function build(cityId, type) {
    const config = { office: { cost: data().officeCost, label: "Postkontor" }, hub: { cost: data().hubCost, label: "Sorteringssenter" } }[type];
    if (!config) return { ok: false, message: "Ukjent bygningstype." };
    if (!data().cities.some(city => city.id === cityId)) return { ok: false, message: "Velg en gyldig by." };
    if (hasBuilding(cityId, type)) return { ok: false, message: "Denne byen har allerede dette bygget." };
    if (type === "hub" && !hasBuilding(cityId, "office")) return { ok: false, message: "Du må bygge et postkontor her først." };
    if (state().money < config.cost) return { ok: false, message: "Du har ikke nok penger til denne investeringen." };
    state().money -= config.cost;
    state().buildings.push({ id: "building-" + state().nextId++, cityId, type });
    state().selectedCityId = cityId;
    return { ok: true, message: config.label + " bygget for " + config.cost.toLocaleString("nb-NO") + " kr." };
  }
  function createRoute(from, to) {
    if (!from || !to || from === to) return { ok: false, message: "Velg to forskjellige byer." };
    if (!hasBuilding(from, "office") || !hasBuilding(to, "office")) return { ok: false, message: "Begge byene må ha et postkontor før du kan koble dem sammen." };
    if (state().routes.some(route => (route.from === from && route.to === to) || (route.from === to && route.to === from))) return { ok: false, message: "Disse byene er allerede koblet sammen." };
    if (state().money < data().routeSetupCost) return { ok: false, message: "Du har ikke nok penger til å opprette ruten." };
    state().money -= data().routeSetupCost;
    state().routes.push({ id: "route-" + state().nextId++, from, to, capacity: 350 });
    return { ok: true, message: "Postrute opprettet! Den kan begynne å levere post neste måned." };
  }
  window.Logistics = { build, createRoute, hasBuilding };
})();
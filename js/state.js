(function () {
  "use strict";
  const SAVE_KEY = "postalEmpireSave_v1";
  function createInitialState() {
    return {
      year: window.GAME_DATA.startingYear,
      month: 1,
      money: window.GAME_DATA.startingMoney,
      reputation: window.GAME_DATA.startingReputation,
      deliveredTotal: 0,
      deliveredLastMonth: 0,
      deliveryRate: 0,
      incomeLastMonth: 0,
      costsLastMonth: 0,
      profitLastMonth: null,
      lastMessage: "Velkommen! Bygg et postkontor i en ny by for å begynne å utvide.",
      selectedCityId: "oslo",
      buildings: [{ id: "office-oslo-start", cityId: "oslo", type: "office" }],
      routes: [],
      nextId: 1
    };
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return createInitialState();
      const saved = JSON.parse(raw);
      if (!saved || !Array.isArray(saved.buildings) || !Array.isArray(saved.routes) || typeof saved.money !== "number") {
        return createInitialState();
      }
      const validCityIds = new Set(window.GAME_DATA.cities.map(city => city.id));
      saved.buildings = saved.buildings.filter(building => validCityIds.has(building.cityId) && ["office", "hub"].includes(building.type));
      saved.routes = saved.routes.filter(route => validCityIds.has(route.from) && validCityIds.has(route.to) && route.from !== route.to);
      return Object.assign(createInitialState(), saved);
    } catch (error) {
      console.warn("Kunne ikke laste lagret spill:", error);
      return createInitialState();
    }
  }
  window.GameState = {
    current: loadState(),
    save() {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.current)); }
      catch (error) { console.warn("Kunne ikke lagre spillet:", error); }
    },
    reset() {
      this.current = createInitialState();
      this.save();
    }
  };
})();
(function () {
  "use strict";
  function countBuildings(state, type) {
    return state.buildings.filter(building => !type || building.type === type).length;
  }
  function calculateMonth(state) {
    const data = window.GAME_DATA;
    const activeCityIds = new Set(state.buildings.filter(b => b.type === "office").map(b => b.cityId));
    const hubCityIds = new Set(state.buildings.filter(b => b.type === "hub").map(b => b.cityId));
    let delivered = 0;
    let revenue = 0;
    let routeCosts = 0;
    state.routes.forEach(route => {
      const from = data.cities.find(city => city.id === route.from);
      const to = data.cities.find(city => city.id === route.to);
      if (!from || !to || !activeCityIds.has(route.from) || !activeCityIds.has(route.to)) return;
      const hubBonus = (hubCityIds.has(route.from) ? 1.25 : 1) * (hubCityIds.has(route.to) ? 1.25 : 1);
      const capacity = Math.round(route.capacity * hubBonus);
      const demand = Math.min(from.demand, to.demand) + Math.round(Math.max(from.demand, to.demand) * 0.35);
      const volume = Math.min(capacity, demand);
      delivered += volume;
      revenue += volume * data.deliveryRevenue;
      routeCosts += data.routeMonthlyCost;
    });
    const buildingCosts = countBuildings(state, "office") * data.officeMonthlyCost + countBuildings(state, "hub") * data.hubMonthlyCost;
    const costs = routeCosts + buildingCosts;
    const profit = Math.round(revenue - costs);
    return { delivered, revenue: Math.round(revenue), costs, profit, deliveryRate: delivered ? Math.min(100, Math.round((delivered / Math.max(1, state.routes.length * 350)) * 100)) : 0 };
  }
  window.Economy = { calculateMonth };
})();
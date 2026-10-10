(function () {
  "use strict";
  window.GAME_DATA = {
    startingYear: 1850,
    startingMoney: 20000,
    startingReputation: 65,
    officeCost: 2500,
    hubCost: 6000,
    routeSetupCost: 700,
    routeMonthlyCost: 180,
    officeMonthlyCost: 90,
    hubMonthlyCost: 220,
    deliveryRevenue: 2.4,
    cities: [
      { id: "oslo", name: "Christiania", modernName: "Oslo", population: 32000, demand: 620, x: 67, y: 45 },
      { id: "bergen", name: "Bergen", modernName: "Bergen", population: 18000, demand: 380, x: 20, y: 49 },
      { id: "trondheim", name: "Trondheim", modernName: "Trondheim", population: 9000, demand: 220, x: 51, y: 15 },
      { id: "stavanger", name: "Stavanger", modernName: "Stavanger", population: 5000, demand: 140, x: 28, y: 68 },
      { id: "kristiansand", name: "Kristiansand", modernName: "Kristiansand", population: 4500, demand: 120, x: 48, y: 83 },
      { id: "hamar", name: "Hamar", modernName: "Hamar", population: 2500, demand: 80, x: 73, y: 35 }
    ],
    technologies: [
      { id: "better-sorting", name: "Bedre sortering", cost: 5000, description: "Øker leveringskapasiteten til sorteringssentre." },
      { id: "railway-mail", name: "Jernbanepost", cost: 12000, description: "En senere oppgradering for raskere posttransport." }
    ]
  };
})();
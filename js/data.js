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
      { id: "oslo", name: "Christiania", modernName: "Oslo", population: 32000, demand: 620, lat: 59.9139, lon: 10.7522 },
      { id: "bergen", name: "Bergen", modernName: "Bergen", population: 18000, demand: 380, lat: 60.3913, lon: 5.3221 },
      { id: "trondheim", name: "Trondheim", modernName: "Trondheim", population: 9000, demand: 220, lat: 63.4305, lon: 10.3951 },
      { id: "stavanger", name: "Stavanger", modernName: "Stavanger", population: 5000, demand: 140, lat: 58.9690, lon: 5.7331 },
      { id: "kristiansand", name: "Kristiansand", modernName: "Kristiansand", population: 4500, demand: 120, lat: 58.1467, lon: 7.9956 },
      { id: "hamar", name: "Hamar", modernName: "Hamar", population: 2500, demand: 80, lat: 60.7945, lon: 11.0679 }
    ],
    technologies: [
      { id: "better-sorting", name: "Bedre sortering", cost: 5000, description: "Øker leveringskapasiteten til sorteringssentre." },
      { id: "railway-mail", name: "Jernbanepost", cost: 12000, description: "En senere oppgradering for raskere posttransport." }
    ]
  };
})();
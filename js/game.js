(function () {
  "use strict";
  function nextMonth() {
    const state = window.GameState.current;
    const result = window.Economy.calculateMonth(state);
    state.money += result.profit;
    state.deliveredLastMonth = result.delivered;
    state.deliveredTotal += result.delivered;
    state.deliveryRate = result.deliveryRate;
    state.incomeLastMonth = result.revenue;
    state.costsLastMonth = result.costs;
    state.profitLastMonth = result.profit;
    state.reputation = Math.max(0, Math.min(100, state.reputation + (result.delivered > 0 ? (result.deliveryRate >= 70 ? 1 : 0) : -1)));
    state.month += 1;
    if (state.month > 12) { state.month = 1; state.year += 1; }
    if (result.delivered > 0) {
      state.lastMessage = "Du leverte " + result.delivered.toLocaleString("nb-NO") + " postsendinger. Månedsresultat: " + (result.profit >= 0 ? "+" : "") + result.profit.toLocaleString("nb-NO") + " kr.";
    } else {
      state.lastMessage = "Ingen post ble levert denne måneden. Bygg postkontorer i flere byer og opprett ruter for å starte leveransene.";
    }
    window.GameState.save();
    return result;
  }
  window.Game = { nextMonth };
})();
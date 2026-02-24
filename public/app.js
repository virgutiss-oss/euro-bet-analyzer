const MIN_EDGE = 0.04; // griežtesnis filtras
const MAX_PICKS = 5;

function showFootball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_france_ligue_one')">Ligue 1</button>
  `;
}

function showBasketball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
  `;
}

function showHockey() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
  `;
}

async function loadOdds(sportKey) {
  const container = document.getElementById("odds");
  container.innerHTML = "<p>Kraunama...</p>";

  try {
    const res = await fetch(`/api/odds?sport=${sportKey}`);
    const games = await res.json();

    if (!Array.isArray(games) || games.length === 0) {
      container.innerHTML = "<p>Rungtynių nėra</p>";
      return;
    }

    buildValuePicks(games);

  } catch (err) {
    container.innerHTML = "<p>Klaida kraunant</p>";
  }
}

function impliedProbability(odds) {
  return 1 / odds;
}

function kelly(edge, odds) {
  return edge / (odds - 1);
}

function buildValuePicks(games) {
  const bankroll = parseFloat(document.getElementById("bankrollInput").value) || 100;
  const container = document.getElementById("odds");
  container.innerHTML = "";

  let picks = [];

  games.forEach(game => {
    if (!game.bookmakers) return;

    game.bookmakers.forEach(book => {
      book.markets.forEach(market => {
        if (market.key !== "h2h" && market.key !== "totals") return;

        market.outcomes.forEach(outcome => {
          if (!outcome.price) return;

          const implied = impliedProbability(outcome.price);
          const modelProb = implied * 1.06; // stipresnis model boost
          const edge = modelProb - implied;

          if (edge < MIN_EDGE) return;

          const roi = (modelProb * outcome.price - 1) * 100;

          picks.push({
            match: `${game.home_team} vs ${game.away_team}`,
            type: market.key === "h2h" ? "WIN" : "OVER/UNDER",
            pick: market.key === "totals"
              ? `${outcome.name} ${outcome.point || ""}`
              : outcome.name,
            odds: outcome.price,
            edge,
            roi,
            stake: bankroll * Math.max(0, kelly(edge, outcome.price)) * 0.5
          });
        });
      });
    });
  });

  picks = picks.sort((a,b)=>b.edge-a.edge).slice(0,MAX_PICKS);

  if (picks.length === 0) {
    container.innerHTML = "<p>Nėra stiprių value pasirinkimų</p>";
    return;
  }

  container.innerHTML = `<h2>💎 TOP ${MAX_PICKS} VALUE PICKS</h2>`;

  picks.forEach(p => {
    const div = document.createElement("div");
    div.className = "pick-card";

    div.innerHTML = `
      <h3>${p.match}</h3>
      <p><b>${p.type}</b></p>
      <p>Pick: ${p.pick}</p>
      <p>Odds: ${p.odds}</p>
      <p>Edge: ${(p.edge*100).toFixed(2)}%</p>
      <p>ROI: ${p.roi.toFixed(2)}%</p>
      <p>Stake: ${p.stake.toFixed(2)}€</p>
    `;

    container.appendChild(div);
  });
}

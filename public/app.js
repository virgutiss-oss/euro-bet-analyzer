const MAX_PICKS = 5;
const MIN_EDGE = 0.02;

function showFootball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('soccer_uefa_champs_league')">Champions League</button>
    <button onclick="loadOdds('soccer_uefa_europa_league')">Europa League</button>
    <button onclick="loadOdds('soccer_uefa_conference_league')">Conference League</button>
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_france_ligue_one')">Ligue 1</button>
    <button onclick="loadOdds('soccer_netherlands_eredivisie')">Eredivisie</button>
    <button onclick="loadOdds('soccer_portugal_primeira_liga')">Portugal Liga</button>
    <button onclick="loadOdds('soccer_belgium_first_div')">Belgium League</button>
    <button onclick="loadOdds('soccer_turkey_super_league')">Turkey Super Lig</button>
  `;
}

function showBasketball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
    <button onclick="loadOdds('basketball_fiba')">FIBA</button>
    <button onclick="loadOdds('basketball_spain_acb')">Spain ACB</button>
    <button onclick="loadOdds('basketball_italy_serie_a')">Italy Serie A</button>
    <button onclick="loadOdds('basketball_germany_bbl')">Germany BBL</button>
    <button onclick="loadOdds('basketball_france_lnb')">France LNB</button>
  `;
}

function showHockey() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
    <button onclick="loadOdds('icehockey_sweden_shl')">Sweden SHL</button>
    <button onclick="loadOdds('icehockey_finland_liiga')">Finland Liiga</button>
    <button onclick="loadOdds('icehockey_czech_extraliga')">Czech Extraliga</button>
    <button onclick="loadOdds('icehockey_switzerland_nl')">Switzerland NL</button>
  `;
}

async function loadOdds(sportKey) {
  const container = document.getElementById("odds");
  container.innerHTML = "<p>Kraunama...</p>";

  try {
    const res = await fetch(`/api/odds?sport=${sportKey}`);
    const games = await res.json();

    if (!Array.isArray(games)) {
      container.innerHTML = "<p>Klaida gaunant duomenis</p>";
      return;
    }

    buildTop5(games);

  } catch {
    container.innerHTML = "<p>Server klaida</p>";
  }
}

function impliedProbability(odds) { return 1 / odds; }
function kelly(edge, odds) { return edge / (odds - 1); }

function buildTop5(games) {
  const bankroll = parseFloat(document.getElementById("bankrollInput").value) || 100;
  const container = document.getElementById("odds");
  container.innerHTML = "";

  let allPicks = [];

  games.forEach(game => {
    if (!game.bookmakers) return;

    let bestWin = null;
    let bestTotal = null;

    game.bookmakers.forEach(book => {
      book.markets.forEach(market => {
        if (market.key !== "h2h" && market.key !== "totals") return;

        market.outcomes.forEach(outcome => {
          if (!outcome.price) return;

          const implied = impliedProbability(outcome.price);
          const modelProb = implied * 1.05;
          const edge = modelProb - implied;

          if (edge < MIN_EDGE) return;

          const roi = (modelProb * outcome.price - 1) * 100;
          const stake = bankroll * Math.max(0, kelly(edge, outcome.price)) * 0.5;

          const pick = {
            match: `${game.home_team} vs ${game.away_team}`,
            type: market.key === "h2h" ? "WIN" : "OVER/UNDER",
            pick: market.key === "totals"
              ? `${outcome.name} ${outcome.point || ""}`
              : outcome.name,
            odds: outcome.price,
            edge,
            roi,
            stake
          };

          if (market.key === "h2h") {
            if (!bestWin || edge > bestWin.edge) bestWin = pick;
          } else {
            if (!bestTotal || edge > bestTotal.edge) bestTotal = pick;
          }
        });
      });
    });

    if (bestWin) allPicks.push(bestWin);
    if (bestTotal) allPicks.push(bestTotal);
  });

  const top5 = allPicks
    .sort((a,b)=>b.edge-a.edge)
    .slice(0,MAX_PICKS);

  if (top5.length === 0) {
    container.innerHTML = "<p>Šiuo metu nėra value picks</p>";
    return;
  }

  container.innerHTML = `<h2>🔥 EURO ELITE TOP 5</h2>`;

  top5.forEach(p => {
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

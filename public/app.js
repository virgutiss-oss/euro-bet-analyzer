const MAX_PICKS = 5;

function showFootball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('soccer_uefa_champs_league')">Champions League</button>
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
  `;
}

function showBasketball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
  `;
}

function showHockey() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
    <button onclick="loadOdds('icehockey_sweden_shl')">Sweden SHL</button>
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

    buildFullBoard(games);

  } catch {
    container.innerHTML = "<p>Server klaida</p>";
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

function buildFullBoard(games) {

  const container = document.getElementById("odds");
  container.innerHTML = "";

  let allPicks = [];

  games.forEach(game => {

    if (!game.bookmakers) return;

    let gameDiv = document.createElement("div");
    gameDiv.className = "pick-card";

    gameDiv.innerHTML = `
      <h3>${game.home_team} vs ${game.away_team}</h3>
      <p>📅 ${formatDate(game.commence_time)}</p>
    `;

    let bestWin = calculateBestMarket(game, "h2h");
    let bestTotal = calculateBestMarket(game, "totals");

    if (bestWin) {
      gameDiv.innerHTML += `
        <p><b>WIN:</b> ${bestWin.pick} @ ${bestWin.odds}</p>
      `;
      allPicks.push(bestWin);
    }

    if (bestTotal) {
      gameDiv.innerHTML += `
        <p><b>OVER/UNDER:</b> ${bestTotal.pick} @ ${bestTotal.odds}</p>
      `;
      allPicks.push(bestTotal);
    }

    container.appendChild(gameDiv);
  });

  // TOP 5 pagal realų edge
  const top5 = allPicks
    .filter(p => p.edge > 0)
    .sort((a,b)=>b.edge-a.edge)
    .slice(0,MAX_PICKS);

  if (top5.length > 0) {
    const topDiv = document.createElement("div");
    topDiv.innerHTML = `<h2>🔥 REAL MARKET TOP 5</h2>`;
    container.prepend(topDiv);

    top5.forEach(p => {
      const div = document.createElement("div");
      div.className = "pick-card";
      div.innerHTML = `
        <h3>${p.match}</h3>
        <p>${p.type}</p>
        <p>Pick: ${p.pick}</p>
        <p>Odds: ${p.odds}</p>
        <p>Edge vs Market: ${(p.edge*100).toFixed(2)}%</p>
      `;
      container.prepend(div);
    });
  }
}

function calculateBestMarket(game, marketKey) {

  let bestOutcome = null;
  let marketPrices = {};

  game.bookmakers.forEach(book => {
    book.markets.forEach(market => {

      if (market.key !== marketKey) return;

      market.outcomes.forEach(outcome => {

        if (!outcome.price) return;

        if (!marketPrices[outcome.name]) {
          marketPrices[outcome.name] = [];
        }

        marketPrices[outcome.name].push(outcome.price);
      });
    });
  });

  Object.keys(marketPrices).forEach(name => {

    const prices = marketPrices[name];
    const bestOdds = Math.max(...prices);
    const avgOdds = prices.reduce((a,b)=>a+b,0) / prices.length;

    const edge = (bestOdds - avgOdds) / avgOdds;

    if (!bestOutcome || edge > bestOutcome.edge) {
      bestOutcome = {
        match: `${game.home_team} vs ${game.away_team}`,
        type: marketKey === "h2h" ? "WIN" : "OVER/UNDER",
        pick: name,
        odds: bestOdds,
        edge
      };
    }
  });

  return bestOutcome;
}

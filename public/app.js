const MAX_PICKS = 3;

function showFootball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('soccer_uefa_champs_league')">Champions League</button>
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
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

    buildBoard(games);

  } catch {
    container.innerHTML = "<p>Klaida</p>";
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString();
}

function buildBoard(games) {

  const container = document.getElementById("odds");
  container.innerHTML = "";

  let allPicks = [];

  games.forEach(game => {

    if (!game.bookmakers) return;

    const winPick = calculateSharpEdge(game, "h2h");
    const totalPick = calculateSharpEdge(game, "totals");

    const gameDiv = document.createElement("div");
    gameDiv.className = "pick-card";
    gameDiv.innerHTML = `
      <h3>${game.home_team} vs ${game.away_team}</h3>
      <p>📅 ${formatDate(game.commence_time)}</p>
    `;

    if (winPick) {
      gameDiv.innerHTML += `<p><b>WIN:</b> ${winPick.pick} @ ${winPick.odds}</p>`;
      allPicks.push(winPick);
    }

    if (totalPick) {
      gameDiv.innerHTML += `<p><b>OVER/UNDER:</b> ${totalPick.pick} @ ${totalPick.odds}</p>`;
      allPicks.push(totalPick);
    }

    container.appendChild(gameDiv);
  });

  const top3 = allPicks
    .filter(p => p.edge > 0.02)
    .sort((a,b)=>b.edge-a.edge)
    .slice(0,MAX_PICKS);

  if (top3.length > 0) {

    const title = document.createElement("h2");
    title.innerText = "🔥 REAL SHARP TOP 3";
    container.prepend(title);

    top3.forEach(p => {

      const div = document.createElement("div");
      div.className = "top-card";
      div.innerHTML = `
        <h3>${p.match}</h3>
        <p>${p.type}</p>
        <p>Pick: ${p.pick}</p>
        <p>Odds: ${p.odds}</p>
        <p>Edge: ${(p.edge*100).toFixed(2)}%</p>
      `;
      container.prepend(div);
    });
  }
}

function calculateSharpEdge(game, marketKey) {

  let outcomesMap = {};

  game.bookmakers.forEach(book => {
    book.markets.forEach(market => {

      if (market.key !== marketKey) return;

      market.outcomes.forEach(outcome => {

        if (!outcome.price) return;

        if (!outcomesMap[outcome.name]) {
          outcomesMap[outcome.name] = [];
        }

        outcomesMap[outcome.name].push(outcome.price);
      });
    });
  });

  let bestPick = null;

  Object.keys(outcomesMap).forEach(name => {

    const prices = outcomesMap[name];

    if (prices.length < 2) return;

    const bestOdds = Math.max(...prices);

    // no longshots
    if (bestOdds > 4.0) return;

    // implied probabilities
    const probs = prices.map(p => 1/p);

    const totalProb = probs.reduce((a,b)=>a+b,0);

    // remove overround
    const fairProbs = probs.map(p => p/totalProb);

    const avgFairProb = fairProbs.reduce((a,b)=>a+b,0)/fairProbs.length;

    const bestProb = 1/bestOdds;

    const edge = avgFairProb - bestProb;

    if (!bestPick || edge > bestPick.edge) {
      bestPick = {
        match: `${game.home_team} vs ${game.away_team}`,
        type: marketKey === "h2h" ? "WIN" : "OVER/UNDER",
        pick: name,
        odds: bestOdds,
        edge
      };
    }
  });

  return bestPick;
}

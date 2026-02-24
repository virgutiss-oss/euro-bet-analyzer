const MAX_PICKS = 3;
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
    <button onclick="loadOdds('soccer_portugal_primeira_liga')">Portugal</button>
    <button onclick="loadOdds('soccer_belgium_first_div')">Belgium</button>
    <button onclick="loadOdds('soccer_turkey_super_league')">Turkey</button>
  `;
}

function showBasketball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
    <button onclick="loadOdds('basketball_spain_acb')">Spain ACB</button>
    <button onclick="loadOdds('basketball_italy_serie_a')">Italy</button>
    <button onclick="loadOdds('basketball_germany_bbl')">Germany</button>
    <button onclick="loadOdds('basketball_france_lnb')">France</button>
  `;
}

function showHockey() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
    <button onclick="loadOdds('icehockey_sweden_shl')">Sweden SHL</button>
    <button onclick="loadOdds('icehockey_finland_liiga')">Finland Liiga</button>
    <button onclick="loadOdds('icehockey_czech_extraliga')">Czech</button>
    <button onclick="loadOdds('icehockey_switzerland_nl')">Switzerland</button>
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

    const winPick = calculateBest(game, "h2h");
    const totalPick = calculateBest(game, "totals");

    const gameDiv = document.createElement("div");
    gameDiv.className = "pick-card";

    gameDiv.innerHTML = `
      <h3>${game.home_team} vs ${game.away_team}</h3>
      <p>📅 ${formatDate(game.commence_time)}</p>
    `;

    if (winPick) {
      gameDiv.innerHTML += `
        <p><b>WIN:</b> ${winPick.pick} @ ${winPick.odds}</p>
      `;
      allPicks.push(winPick);
    }

    if (totalPick) {
      gameDiv.innerHTML += `
        <p><b>OVER/UNDER:</b> ${totalPick.pick} ${totalPick.point} @ ${totalPick.odds}</p>
      `;
      allPicks.push(totalPick);
    }

    container.appendChild(gameDiv);
  });

  // TOP 3
  const top3 = allPicks
    .filter(p => p.edge > MIN_EDGE)
    .sort((a,b)=>b.edge-a.edge)
    .slice(0,MAX_PICKS);

  if (top3.length > 0) {

    const title = document.createElement("h2");
    title.innerText = "🔥 TOP 3 VALUE PICKS";
    container.prepend(title);

    top3.forEach(p => {
      const div = document.createElement("div");
      div.className = "top-card";
      div.innerHTML = `
        <h3>${p.match}</h3>
        <p>${p.type}</p>
        <p>Pick: ${p.pick} ${p.point || ""}</p>
        <p>Odds: ${p.odds}</p>
        <p>Edge: ${(p.edge*100).toFixed(2)}%</p>
      `;
      container.prepend(div);
    });
  }
}

function calculateBest(game, marketKey) {

  let bestPick = null;

  game.bookmakers.forEach(book => {
    book.markets.forEach(market => {

      if (market.key !== marketKey) return;

      market.outcomes.forEach(outcome => {

        if (!outcome.price) return;

        // atmetam labai didelius kofus
        if (outcome.price > 4.0) return;

        const implied = 1 / outcome.price;
        const edge = (outcome.price - 1.90) / 1.90; // stabilizuotas edge

        if (!bestPick || edge > bestPick.edge) {
          bestPick = {
            match: `${game.home_team} vs ${game.away_team}`,
            type: marketKey === "h2h" ? "WIN" : "OVER/UNDER",
            pick: outcome.name,
            point: outcome.point || "",
            odds: outcome.price,
            edge
          };
        }
      });
    });
  });

  return bestPick;
}

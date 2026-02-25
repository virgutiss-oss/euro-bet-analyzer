const MAX_TOP = 3;

// ===== SPORTS =====

function showFootball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('soccer_uefa_champs_league')">Champions League</button>
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
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
  `;
}

// ===== LOAD ODDS =====

async function loadOdds(sportKey) {

  const container = document.getElementById("odds");
  const topContainer = document.getElementById("top3");

  container.innerHTML = "Kraunama...";
  topContainer.innerHTML = "";

  const res = await fetch(`/api/odds?sport=${sportKey}`);
  const games = await res.json();

  container.innerHTML = "";

  let todayPicks = [];

  games.forEach(game => {

    const div = document.createElement("div");
    div.className = "match-card";

    div.innerHTML = `
      <h3>${game.home_team} vs ${game.away_team}</h3>
      <p>📅 ${new Date(game.commence_time).toLocaleString()}</p>
    `;

    const bestWin = getBestMarket(game, "h2h");
    const bestTotal = getBestMarket(game, "totals");

    if (bestWin) {
      div.innerHTML += `
        <div class="pick">
          <b>WIN:</b> ${bestWin.name} @ ${bestWin.price}
        </div>
      `;
      if (isToday(game.commence_time)) todayPicks.push(buildTopPick(game, bestWin, "WIN"));
    }

    if (bestTotal) {
      div.innerHTML += `
        <div class="pick">
          <b>O/U:</b> ${bestTotal.name} ${bestTotal.point || ""} @ ${bestTotal.price}
        </div>
      `;
      if (isToday(game.commence_time)) todayPicks.push(buildTopPick(game, bestTotal, "OVER/UNDER"));
    }

    container.appendChild(div);
  });

  showTop3(todayPicks);
}

// ===== BEST MARKET (be sharp filtro) =====

function getBestMarket(game, marketKey) {

  if (!game.bookmakers) return null;

  let best = null;

  game.bookmakers.forEach(book => {
    book.markets.forEach(market => {

      if (market.key !== marketKey) return;

      market.outcomes.forEach(outcome => {

        if (!outcome.price) return;

        if (!best || outcome.price > best.price) {
          best = outcome;
        }

      });

    });
  });

  return best;
}

// ===== TOP 3 =====

function buildTopPick(game, outcome, type) {

  const implied = 1 / outcome.price;
  const ev = (implied * outcome.price) - 1;

  return {
    match: `${game.home_team} vs ${game.away_team}`,
    date: game.commence_time,
    type,
    pick: outcome.name,
    point: outcome.point,
    odds: outcome.price,
    ev
  };
}

function showTop3(picks) {

  if (picks.length === 0) return;

  const container = document.getElementById("top3");

  const top = picks
    .sort((a,b)=>b.odds-a.odds)
    .slice(0, MAX_TOP);

  container.innerHTML = `<h2>🔥 TODAY TOP 3</h2>`;

  top.forEach(p => {
    container.innerHTML += `
      <div class="top-card">
        <h3>${p.match}</h3>
        <p>📅 ${new Date(p.date).toLocaleString()}</p>
        <p><b>${p.type}</b> – ${p.pick} ${p.point || ""}</p>
        <p>Odds: ${p.odds}</p>
      </div>
    `;
  });
}

function isToday(dateStr) {
  const d = new Date(dateStr);
  const t = new Date();
  return d.toDateString() === t.toDateString();
}

document.addEventListener("DOMContentLoaded", function() {
  showFootball();
});

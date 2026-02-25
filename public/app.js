const MAX_TOP = 3;
const MIN_BOOKS = 3;
const MIN_EDGE = 0.03;

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

// ===== LOAD =====

async function loadOdds(sportKey) {

  const container = document.getElementById("odds");
  const topContainer = document.getElementById("top3");

  container.innerHTML = "Kraunama...";
  topContainer.innerHTML = "";

  const res = await fetch(`/api/odds?sport=${sportKey}`);
  const games = await res.json();

  container.innerHTML = "";

  let todayValuePicks = [];

  games.forEach(game => {

    const div = document.createElement("div");
    div.className = "match-card";

    div.innerHTML = `
      <h3>${game.home_team} vs ${game.away_team}</h3>
      <p style="font-size:12px;">${new Date(game.commence_time).toLocaleString()}</p>
    `;

    const markets = ["h2h", "totals"];

    markets.forEach(marketKey => {

      const valuePick = calculateTrueEV(game, marketKey);

      if (valuePick) {

        div.innerHTML += `
          <div class="pick">
            <b>${valuePick.type}</b> – ${valuePick.pick}
            @ ${valuePick.odds}
            | EV ${(valuePick.ev*100).toFixed(2)}%
          </div>
        `;

        if (isToday(game.commence_time)) {
          todayValuePicks.push(valuePick);
        }
      }

    });

    container.appendChild(div);
  });

  showTop3(todayValuePicks);
}

// ===== TRUE EV MODEL =====

function calculateTrueEV(game, marketKey) {

  if (!game.bookmakers || game.bookmakers.length < MIN_BOOKS) return null;

  let outcomesData = {};

  game.bookmakers.forEach(book => {
    book.markets.forEach(market => {

      if (market.key !== marketKey) return;

      market.outcomes.forEach(outcome => {

        if (!outcome.price) return;

        const key = outcome.name + "_" + (outcome.point || "");

        if (!outcomesData[key]) {
          outcomesData[key] = {
            prices: [],
            name: outcome.name,
            point: outcome.point
          };
        }

        outcomesData[key].prices.push(outcome.price);
      });

    });
  });

  let bestValue = null;

  Object.values(outcomesData).forEach(o => {

    if (o.prices.length < MIN_BOOKS) return;

    const avgOdds = o.prices.reduce((a,b)=>a+b,0) / o.prices.length;
    const bestOdds = Math.max(...o.prices);

    const modelProb = 1 / avgOdds;
    const ev = (modelProb * bestOdds) - 1;

    if (ev > MIN_EDGE) {

      if (!bestValue || ev > bestValue.ev) {
        bestValue = {
          match: `${game.home_team} vs ${game.away_team}`,
          date: game.commence_time,
          type: marketKey === "h2h" ? "WIN" : "OVER/UNDER",
          pick: o.name + (o.point ? " " + o.point : ""),
          odds: bestOdds.toFixed(2),
          ev
        };
      }

    }

  });

  return bestValue;
}

// ===== TOP 3 BY VALUE =====

function showTop3(picks) {

  if (picks.length === 0) return;

  const container = document.getElementById("top3");

  const top = picks
    .sort((a,b)=>b.ev-a.ev)
    .slice(0, MAX_TOP);

  container.innerHTML = `<h2>🔥 TODAY BEST VALUE TOP 3</h2>`;

  top.forEach(p => {
    container.innerHTML += `
      <div class="top-card">
        <h3>${p.match}</h3>
        <p>${p.type} – ${p.pick}</p>
        <p>Odds: ${p.odds}</p>
        <p>EV: ${(p.ev*100).toFixed(2)}%</p>
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

const MAX_TOP = 3;
const MIN_EDGE = 0.04;
const SHARP_THRESHOLD = 0.6;

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

  const minBooks = parseInt(document.getElementById("minBooks").value);

  const res = await fetch(`/api/odds?sport=${sportKey}`);
  const games = await res.json();

  container.innerHTML = "";

  let todaySharp = [];

  games.forEach(game => {

    const div = document.createElement("div");
    div.className = "match-card";

    div.innerHTML = `
      <h3>${game.home_team} vs ${game.away_team}</h3>
      <p>📅 ${new Date(game.commence_time).toLocaleString()}</p>
    `;

    // Sharp pick logika TOP 3
    const sharpPick = findSharpPick(game, minBooks);

    if (sharpPick) {
      div.innerHTML += `
        <div class="pick">
          <b>${sharpPick.type}</b> – ${sharpPick.pick}
          (${sharpPick.odds}) | EV ${(sharpPick.ev*100).toFixed(2)}%
        </div>
      `;
      if (isToday(game.commence_time)) todaySharp.push(sharpPick);
    }

    container.appendChild(div);
  });

  showTop3(todaySharp);
}

// ===== SHARP PICK LOGIC =====

function findSharpPick(game, minBooks) {

  if (!game.bookmakers || game.bookmakers.length < minBooks) return null;

  let outcomesMap = {};

  game.bookmakers.forEach(book => {
    book.markets.forEach(market => {

      if (!["h2h","totals"].includes(market.key)) return;

      market.outcomes.forEach(outcome => {

        if (!outcome.price || outcome.price > 4.5) return;

        const key = market.key + "_" + outcome.name;

        if (!outcomesMap[key]) {
          outcomesMap[key] = {
            count: 0,
            totalOdds: 0,
            type: market.key === "h2h" ? "WIN" : "OVER/UNDER",
            pick: outcome.name
          };
        }

        outcomesMap[key].count++;
        outcomesMap[key].totalOdds += outcome.price;
      });

    });
  });

  let best = null;

  Object.values(outcomesMap).forEach(o => {

    const ratio = o.count / game.bookmakers.length;
    if (ratio < SHARP_THRESHOLD) return;

    const avgOdds = o.totalOdds / o.count;
    const implied = 1 / avgOdds;
    const ev = (implied * avgOdds) - 1;

    if (ev > MIN_EDGE) {
      if (!best || ev > best.ev) {
        best = {
          match: `${game.home_team} vs ${game.away_team}`,
          date: game.commence_time,
          type: o.type,
          pick: o.pick,
          odds: avgOdds.toFixed(2),
          ev
        };
      }
    }

  });

  return best;
}

// ===== TOP 3 =====

function showTop3(picks) {

  if (picks.length === 0) return;

  const container = document.getElementById("top3");

  const top = picks.sort((a,b)=>b.ev-a.ev).slice(0, MAX_TOP);

  container.innerHTML = `<h2>🔥 TODAY SHARP TOP 3</h2>`;

  top.forEach(p => {
    container.innerHTML += `
      <div class="top-card">
        <h3>${p.match}</h3>
        <p>📅 ${new Date(p.date).toLocaleString()}</p>
        <p><b>${p.type}</b> – ${p.pick}</p>
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

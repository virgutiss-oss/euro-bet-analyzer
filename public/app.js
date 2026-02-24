const MAX_TOP = 3;
const MIN_EDGE = 0.03;

// ===== SPORTS =====

function showFootball() {
  document.getElementById("leagues").innerHTML = `
    <h2>Football</h2>
    <button onclick="loadOdds('soccer_uefa_champs_league')">Champions League</button>
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
  `;
}

function showBasketball() {
  document.getElementById("leagues").innerHTML = `
    <h2>Basketball</h2>
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
  `;
}

function showHockey() {
  document.getElementById("leagues").innerHTML = `
    <h2>Hockey</h2>
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
  `;
}

// ===== LOAD ODDS =====

async function loadOdds(sportKey) {

  const container = document.getElementById("odds");
  container.innerHTML = "Kraunama...";

  try {
    const res = await fetch(`/api/odds?sport=${sportKey}`);
    const games = await res.json();

    container.innerHTML = "";

    if (!games || games.length === 0) {
      container.innerHTML = "Nėra rungtynių.";
      return;
    }

    let todayPicks = [];

    games.forEach(game => {

      const winPick = calculateEV(game, "h2h");
      const totalPick = calculateEV(game, "totals");

      const div = document.createElement("div");
      div.className = "match-card";

      div.innerHTML = `
        <h3>${game.home_team} vs ${game.away_team}</h3>
        <p>📅 ${new Date(game.commence_time).toLocaleString()}</p>
      `;

      if (winPick) {
        div.innerHTML += `<p><b>WIN:</b> ${winPick.pick} @ ${winPick.odds}</p>`;
        if (isToday(game.commence_time)) todayPicks.push(winPick);
      }

      if (totalPick) {
        div.innerHTML += `<p><b>O/U:</b> ${totalPick.pick} ${totalPick.point || ""} @ ${totalPick.odds}</p>`;
        if (isToday(game.commence_time)) todayPicks.push(totalPick);
      }

      container.appendChild(div);
    });

    showTop3(todayPicks);

  } catch (err) {
    container.innerHTML = "Klaida.";
    console.error(err);
  }
}

// ===== TOP 3 =====

function showTop3(picks) {

  const container = document.getElementById("odds");

  const top = picks
    .filter(p => p.ev > MIN_EDGE)
    .sort((a,b)=>b.ev-a.ev)
    .slice(0, MAX_TOP);

  if (top.length === 0) return;

  const title = document.createElement("h2");
  title.innerText = "🔥 TODAY TOP 3";
  container.prepend(title);

  top.forEach(p => {

    const div = document.createElement("div");
    div.className = "top-card";

    div.innerHTML = `
      <h3>${p.match}</h3>
      <p>📅 ${new Date(p.date).toLocaleString()}</p>
      <p>${p.type}</p>
      <p>${p.pick} ${p.point || ""}</p>
      <p>Odds: ${p.odds}</p>
      <p>EV: ${(p.ev*100).toFixed(2)}%</p>
    `;

    container.prepend(div);
  });
}

// ===== EV CALCULATION =====

function calculateEV(game, marketKey) {

  if (!game.bookmakers) return null;

  let bestPick = null;

  game.bookmakers.forEach(book => {
    book.markets.forEach(market => {

      if (market.key !== marketKey) return;

      market.outcomes.forEach(outcome => {

        if (!outcome.price || outcome.price > 4.5) return;

        const implied = 1 / outcome.price;
        const fairProb = implied; 
        const ev = (fairProb * outcome.price) - 1;

        if (!bestPick || ev > bestPick.ev) {
          bestPick = {
            match: `${game.home_team} vs ${game.away_team}`,
            date: game.commence_time,
            type: marketKey === "h2h" ? "WIN" : "OVER/UNDER",
            pick: outcome.name,
            point: outcome.point,
            odds: outcome.price,
            ev
          };
        }

      });

    });
  });

  return bestPick;
}

function isToday(dateStr) {
  const d = new Date(dateStr);
  const t = new Date();
  return d.toDateString() === t.toDateString();
}

document.addEventListener("DOMContentLoaded", function() {
  showFootball();
});

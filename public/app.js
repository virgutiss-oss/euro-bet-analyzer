const API_KEY = "6b0664072d64c0e45639f1c39f2c994f";

const sportKeys = {
  soccer: "soccer_epl,soccer_spain_la_liga,soccer_germany_bundesliga,soccer_italy_serie_a,soccer_france_ligue_one,soccer_uefa_champs_league",
  basketball: "basketball_nba,basketball_euroleague",
  icehockey: "icehockey_nhl,icehockey_sweden_shl"
};

async function loadSport(sport) {
  document.getElementById("results").innerHTML = "";
  document.getElementById("loading").classList.remove("hidden");

  const today = new Date().toISOString().split("T")[0];

  const url = `https://api.the-odds-api.com/v4/sports/${sportKeys[sport]}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&dateFormat=iso&apiKey=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const todaysGames = data.filter(game => 
      game.commence_time.startsWith(today)
    );

    analyzeGames(todaysGames);

  } catch (err) {
    document.getElementById("results").innerHTML = "API klaida.";
  }

  document.getElementById("loading").classList.add("hidden");
}

function analyzeGames(games) {
  let bestWin = null;
  let bestTotal = null;

  games.forEach(game => {
    if (!game.bookmakers.length) return;

    const markets = game.bookmakers[0].markets;

    const h2h = markets.find(m => m.key === "h2h");
    const totals = markets.find(m => m.key === "totals");

    if (h2h) {
      const outcomes = h2h.outcomes;

      const probs = outcomes.map(o => 1 / o.price);
      const sum = probs.reduce((a,b)=>a+b,0);

      outcomes.forEach((o,i)=>{
        const realProb = probs[i]/sum;
        const ev = (realProb * o.price - 1) * 100;

        if (!bestWin || ev > bestWin.ev) {
          bestWin = {
            league: game.sport_title,
            teams: game.home_team + " vs " + game.away_team,
            pick: o.name,
            odds: o.price,
            ev: ev.toFixed(2),
            time: new Date(game.commence_time).toLocaleTimeString()
          };
        }
      });
    }

    if (totals) {
      totals.outcomes.forEach(o=>{
        const ev = (0.5 * o.price - 1) * 100; // paprastas modelis

        if (!bestTotal || ev > bestTotal.ev) {
          bestTotal = {
            league: game.sport_title,
            teams: game.home_team + " vs " + game.away_team,
            pick: o.name + " " + o.point,
            odds: o.price,
            ev: ev.toFixed(2),
            time: new Date(game.commence_time).toLocaleTimeString()
          };
        }
      });
    }

  });

  renderResults(bestWin, bestTotal);
}

function renderResults(win, total) {
  const results = document.getElementById("results");

  if (win) {
    results.innerHTML += `
      <div class="card">
        <h3>Geriausias Win/Lose</h3>
        <p>${win.league}</p>
        <p>${win.teams}</p>
        <p>Pick: ${win.pick}</p>
        <p>Kof: ${win.odds}</p>
        <p class="ev-positive">EV: ${win.ev}%</p>
        <p>Laikas: ${win.time}</p>
      </div>
    `;
  }

  if (total) {
    results.innerHTML += `
      <div class="card">
        <h3>Geriausias Over/Under</h3>
        <p>${total.league}</p>
        <p>${total.teams}</p>
        <p>Pick: ${total.pick}</p>
        <p>Kof: ${total.odds}</p>
        <p class="ev-positive">EV: ${total.ev}%</p>
        <p>Laikas: ${total.time}</p>
      </div>
    `;
  }
}

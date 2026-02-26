const API_KEY = "6b0664072d64c0e45639f1c39f2c994f";

// KELIOS LYGOS KIEKVIENAM SPORTUI
const SPORT_MAP = {
  soccer: [
    "soccer_epl",
    "soccer_spain_la_liga",
    "soccer_germany_bundesliga",
    "soccer_italy_serie_a",
    "soccer_france_ligue_one"
  ],
  basketball: [
    "basketball_nba",
    "basketball_euroleague"
  ],
  icehockey: [
    "icehockey_nhl"
  ]
};

async function loadSport(sport) {

  const resultsDiv = document.getElementById("results");
  const loadingDiv = document.getElementById("loading");

  const mode = document.getElementById("mode").value;
  const minEV = parseFloat(document.getElementById("minEV").value);

  resultsDiv.innerHTML = "";
  loadingDiv.innerHTML = "Kraunama...";

  const leagues = SPORT_MAP[sport];
  let allGames = [];

  try {

    // KRAUNAM VISAS LYGAS
    for (let league of leagues) {

      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`
      );

      const data = await response.json();

      if (Array.isArray(data)) {
        allGames = allGames.concat(data);
      }
    }

    loadingDiv.innerHTML = "";

    const picks = [];

    allGames.forEach(game => {

      if (!game.bookmakers?.length) return;

      const home = game.home_team;
      const away = game.away_team;

      const markets = game.bookmakers[0].markets;

      markets.forEach(market => {

        market.outcomes.forEach(outcome => {

          const odds = outcome.price;

          // MODE filtrai
          if (mode === "safe" && (odds < 1.4 || odds > 1.9)) return;
          if (mode === "aggressive" && odds < 2.0) return;

          const implied = 1 / odds;

          // Patobulintas modelis
          let modelProb = implied;

          if (odds < 1.6) modelProb *= 1.05;
          else if (odds < 2.2) modelProb *= 1.07;
          else modelProb *= 1.10;

          const ev = (modelProb * odds - 1) * 100;

          if (ev >= minEV) {

            picks.push({
              match: `${home} vs ${away}`,
              market: market.key === "h2h" 
                ? "Win/Lose"
                : `Over/Under (${outcome.point || ""})`,
              selection: outcome.name,
              odds,
              ev: ev.toFixed(2)
            });

          }

        });

      });

    });

    // Surūšiuojam geriausius
    picks
      .sort((a, b) => b.ev - a.ev)
      .slice(0, 10)
      .forEach(p => {

        resultsDiv.innerHTML += `
          <div class="card">
            <div><b>${p.match}</b></div>
            <div>${p.market} - ${p.selection}</div>
            <div>Kof: ${p.odds}</div>
            <div class="ev">EV: +${p.ev}%</div>
          </div>
        `;
      });

    if (picks.length === 0) {
      resultsDiv.innerHTML = "Nerasta value statymų su šiais filtrais.";
    }

  } catch (err) {
    loadingDiv.innerHTML = "";
    resultsDiv.innerHTML = "API klaida arba limitas.";
  }
}

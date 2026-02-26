const API_KEY = "6b0664072d64c0e45639f1c39f2c994f";

const SPORT_MAP = {
  soccer: "soccer_epl",
  basketball: "basketball_nba",
  icehockey: "icehockey_nhl"
};

async function loadSport(sport) {

  const resultsDiv = document.getElementById("results");
  const loadingDiv = document.getElementById("loading");

  const mode = document.getElementById("mode").value;
  const minEV = parseFloat(document.getElementById("minEV").value);

  resultsDiv.innerHTML = "";
  loadingDiv.innerHTML = "Kraunama...";

  const league = SPORT_MAP[sport];

  try {

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`
    );

    const data = await response.json();
    loadingDiv.innerHTML = "";

    const picks = [];

    data.forEach(game => {

      const home = game.home_team;
      const away = game.away_team;

      if (!game.bookmakers.length) return;

      const markets = game.bookmakers[0].markets;

      markets.forEach(market => {

        market.outcomes.forEach(outcome => {

          const odds = outcome.price;

          if (mode === "safe" && (odds < 1.4 || odds > 1.9)) return;
          if (mode === "aggressive" && odds < 2.0) return;

          const implied = 1 / odds;

          // Dinaminis modelis
          let modelProb = implied;

          if (odds < 1.6) modelProb *= 1.06;
          else if (odds < 2.0) modelProb *= 1.05;
          else modelProb *= 1.08;

          const ev = (modelProb * odds - 1) * 100;

          if (ev >= minEV) {

            picks.push({
              match: `${home} vs ${away}`,
              market: market.key === "h2h" ? "Win/Lose" : `Totals (${outcome.point || ""})`,
              selection: outcome.name,
              odds,
              ev: ev.toFixed(2)
            });

          }

        });

      });

    });

    picks
      .sort((a, b) => b.ev - a.ev)
      .slice(0, 5)
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

  } catch (err) {
    loadingDiv.innerHTML = "";
    resultsDiv.innerHTML = "API klaida arba limitas.";
  }
}

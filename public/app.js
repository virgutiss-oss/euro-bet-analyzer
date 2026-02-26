const API_KEY = "6b0664072d64c0e45639f1c39f2c994f";

const SPORT_MAP = {
  soccer: "soccer_epl",
  basketball: "basketball_nba",
  icehockey: "icehockey_nhl"
};

async function loadSport(sport) {

  const resultsDiv = document.getElementById("results");
  const loadingDiv = document.getElementById("loading");

  resultsDiv.innerHTML = "";
  loadingDiv.innerHTML = "Kraunama...";

  const league = SPORT_MAP[sport];

  try {

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`
    );

    const data = await response.json();

    loadingDiv.innerHTML = "";

    if (!Array.isArray(data)) {
      resultsDiv.innerHTML = "API klaida arba limitas.";
      return;
    }

    const games = [];

    data.forEach(game => {

      const home = game.home_team;
      const away = game.away_team;

      if (!game.bookmakers.length) return;

      const markets = game.bookmakers[0].markets;

      markets.forEach(market => {

        market.outcomes.forEach(outcome => {

          const odds = outcome.price;
          const implied = 1 / odds;
          const modelProb = implied * 1.05; // paprastas +5% modelis
          const ev = (modelProb * odds - 1) * 100;

          if (ev > 2) {
            games.push({
              match: `${home} vs ${away}`,
              market: market.key,
              selection: outcome.name,
              odds,
              ev: ev.toFixed(2)
            });
          }

        });

      });

    });

    games
      .sort((a, b) => b.ev - a.ev)
      .slice(0, 3)
      .forEach(g => {
        resultsDiv.innerHTML += `
          <div class="card">
            <div><b>${g.match}</b></div>
            <div>${g.market} - ${g.selection}</div>
            <div>Kof: ${g.odds}</div>
            <div class="ev">EV: +${g.ev}%</div>
          </div>
        `;
      });

  } catch (error) {
    loadingDiv.innerHTML = "";
    resultsDiv.innerHTML = "Nepavyko prisijungti prie API.";
  }

}

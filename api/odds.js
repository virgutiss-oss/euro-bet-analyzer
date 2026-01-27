export default async function handler(req, res) {
  const { sport } = req.query;

  const API_KEY = process.env.ODDS_API_KEY;

  // Teisingi TheOddsAPI sport keys
  const SPORT_KEYS = {
    soccer: "soccer_epl",
    basketball: "basketball_nba",
    hockey: "icehockey_nhl",
    tennis: "tennis_atp"
  };

  if (!SPORT_KEYS[sport]) {
    return res.status(400).json({ error: "Nežinomas sportas" });
  }

  const url = `https://api.the-odds-api.com/v4/sports/${SPORT_KEYS[sport]}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const games = await response.json();

    if (!Array.isArray(games) || games.length === 0) {
      return res.json([]);
    }

    const results = [];

    games.forEach(game => {
      if (!game.bookmakers || game.bookmakers.length === 0) return;

      const bookmaker = game.bookmakers[0];

      bookmaker.markets.forEach(market => {
        if (market.key === "totals") {
          const over = market.outcomes.find(o => o.name === "Over");
          const under = market.outcomes.find(o => o.name === "Under");

          if (!over || !under) return;

          // Paprasta „geriausio“ logika (kol kas)
          const pick = over.price > under.price ? "Over" : "Under";

          results.push({
            home: game.home_team,
            away: game.away_team,
            market: `Total ${over.point}`,
            pick: `${pick} ${over.point}`,
            probability: Math.floor(55 + Math.random() * 20)
          });
        }

        if (market.key === "h2h") {
          const fav = market.outcomes.sort((a, b) => a.price - b.price)[0];

          results.push({
            home: game.home_team,
            away: game.away_team,
            market: "Win/Lose",
            pick: fav.name,
            probability: Math.floor(55 + Math.random() * 15)
          });
        }
      });
    });

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "API klaida" });
  }
}

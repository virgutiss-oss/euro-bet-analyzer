export default async function handler(req, res) {
  const { sport } = req.query;

  if (!sport) {
    return res.status(400).json({ error: "Missing sport parameter" });
  }

  const API_KEY = process.env.ODDS_API_KEY;

  const SPORT_MAP = {
    soccer: "soccer_uefa_champs_league",
    basketball: "basketball_nba"
  };

  const sportKey = SPORT_MAP[sport];
  if (!sportKey) {
    return res.status(400).json({ error: "Unsupported sport" });
  }

  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(500).json({ error: "Bad API response", raw: data });
    }

    const games = [];

    data.forEach(match => {
      const home = match.home_team;
      const away = match.away_team;

      match.bookmakers?.forEach(bm => {
        bm.markets?.forEach(market => {
          if (market.key === "h2h") {
            const best = market.outcomes.reduce((a, b) =>
              a.price < b.price ? a : b
            );

            games.push({
              home,
              away,
              market: "Win/Lose",
              pick: best.name,
              odds: best.price,
              probability: Math.round((1 / best.price) * 100)
            });
          }

          if (market.key === "totals") {
            const over = market.outcomes.find(o => o.name === "Over");
            const under = market.outcomes.find(o => o.name === "Under");

            if (over && under) {
              const best = over.price < under.price ? over : under;

              games.push({
                home,
                away,
                market: "Over/Under",
                pick: best.name,
                line: best.point,
                odds: best.price,
                probability: Math.round((1 / best.price) * 100)
              });
            }
          }
        });
      });
    });

    res.status(200).json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

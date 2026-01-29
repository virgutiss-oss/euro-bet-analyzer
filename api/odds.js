export default async function handler(req, res) {
  const { sport } = req.query;

  const SPORT_MAP = {
    soccer: "soccer_uefa_champs_league",
    basketball: "basketball_nba"
  };

  if (!SPORT_MAP[sport]) {
    return res.status(400).json({ error: "Blogas sportas" });
  }

  const url = `https://api.the-odds-api.com/v4/sports/${SPORT_MAP[sport]}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`;

  try {
    const r = await fetch(url);
    const data = await r.json();

    if (!Array.isArray(data)) {
      return res.status(500).json({ error: "Blogi API duomenys", raw: data });
    }

    const result = [];

    data.forEach(game => {
      const home = game.home_team;
      const away = game.away_team;

      game.bookmakers?.forEach(bm => {
        bm.markets?.forEach(market => {
          if (market.key === "h2h") {
            const best = market.outcomes.reduce((a, b) => (a.price < b.price ? a : b));
            result.push({
              home,
              away,
              type: "Win/Lose",
              pick: best.name,
              odds: best.price
            });
          }

          if (market.key === "totals") {
            const best = market.outcomes.reduce((a, b) => (a.price < b.price ? a : b));
            result.push({
              home,
              away,
              type: "Over/Under",
              pick: `${best.name} ${best.point}`,
              odds: best.price,
              line: best.point
            });
          }
        });
      });
    });

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: "Serverio klaida", details: e.message });
  }
}

export default async function handler(req, res) {
  const { sport } = req.query;

  if (!sport) {
    return res.status(400).json([]);
  }

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`
    );

    const raw = await response.json();

    if (!Array.isArray(raw)) {
      return res.status(200).json([]);
    }

    const results = [];

    raw.forEach(game => {
      game.bookmakers?.forEach(bm => {
        bm.markets?.forEach(m => {
          m.outcomes?.forEach(o => {
            results.push({
              home: game.home_team,
              away: game.away_team,
              pick: o.name,
              odds: o.price
            });
          });
        });
      });
    });

    res.status(200).json(results);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
}

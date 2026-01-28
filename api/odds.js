export default async function handler(req, res) {
  const { sport } = req.query;

  if (!sport) return res.status(200).json([]);

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`
    );

    const raw = await response.json();
    if (!Array.isArray(raw)) return res.status(200).json([]);

    const results = [];

    raw.forEach(game => {
      const bestOdds = {};

      game.bookmakers?.forEach(bm => {
        bm.markets?.forEach(m => {
          m.outcomes?.forEach(o => {
            if (!bestOdds[o.name] || o.price > bestOdds[o.name]) {
              bestOdds[o.name] = o.price;
            }
          });
        });
      });

      let bestPick = null;
      let bestPrice = 0;

      Object.entries(bestOdds).forEach(([name, price]) => {
        if (price > bestPrice) {
          bestPrice = price;
          bestPick = name;
        }
      });

      if (bestPick) {
        results.push({
          home: game.home_team,
          away: game.away_team,
          pick: bestPick,
          odds: bestPrice
        });
      }
    });

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
}

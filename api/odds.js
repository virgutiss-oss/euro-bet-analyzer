export default async function handler(req, res) {
  const API_KEY = process.env.ODDS_API_KEY;

  const url =
    "https://api.the-odds-api.com/v4/sports/soccer/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=" +
    API_KEY;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json([]);
    }

    const results = [];

    data.forEach(match => {
      const bookmakers = match.bookmakers || [];
      if (bookmakers.length === 0) return;

      // surenkam GERIAUSIĄ koeficientą iš visų bookmakerių
      const prices = {};

      bookmakers.forEach(bm => {
        const market = bm.markets?.find(m => m.key === "h2h");
        if (!market) return;

        market.outcomes.forEach(o => {
          if (!prices[o.name] || o.price > prices[o.name]) {
            prices[o.name] = o.price;
          }
        });
      });

      const bestPick = Object.entries(prices).reduce((a, b) =>
        a[1] > b[1] ? a : b
      );

      results.push({
        home: match.home_team,
        away: match.away_team,
        market: "Win / Lose",
        pick: bestPick[0],
        probability: Math.round((1 / bestPick[1]) * 100)
      });
    });

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: "API klaida" });
  }
}

export default async function handler(req, res) {
  const API_KEY = process.env.ODDS_API_KEY;

  try {
    const url = `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json([]);
    }

    const results = [];

    data.forEach(match => {
      const bookmaker = match.bookmakers?.[0];
      const market = bookmaker?.markets?.[0];
      if (!market) return;

      const best = market.outcomes.reduce((a, b) =>
        a.price > b.price ? a : b
      );

      results.push({
        home: match.home_team,
        away: match.away_team,
        market: "Win / Lose (EPL)",
        pick: best.name,
        probability: Math.round((1 / best.price) * 100)
      });
    });

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: "API klaida" });
  }
}

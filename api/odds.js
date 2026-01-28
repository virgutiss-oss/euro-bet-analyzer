export default async function handler(req, res) {
  const { sport } = req.query;

  if (sport !== "basketball") {
    return res.status(200).json([]);
  }

  const API_KEY = process.env.ODDS_API_KEY;

  const leagues = [
    "basketball_nba",
    "basketball_euroleague",
    "basketball_eurocup",
    "basketball_fiba_champions_league"
  ];

  try {
    let results = [];

    for (const league of leagues) {
      const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!Array.isArray(data)) continue;

      data.forEach(match => {
        if (!match.bookmakers?.length) return;

        const market = match.bookmakers[0].markets[0];
        if (!market) return;

        const outcomes = market.outcomes;
        if (outcomes.length !== 2) return;

        const best = outcomes.reduce((a, b) => (a.price > b.price ? a : b));

        results.push({
          home: match.home_team,
          away: match.away_team,
          market: "Win / Lose",
          pick: best.name,
          probability: Math.round((1 / best.price) * 100)
        });
      });
    }

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: "API klaida" });
  }
}

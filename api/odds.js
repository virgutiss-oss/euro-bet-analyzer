export default async function handler(req, res) {
  try {
    const sport = req.query.sport || "basketball_nba";

    if (!process.env.ODDS_API_KEY) {
      return res.status(500).json({ error: "NO_API_KEY" });
    }

    const url =
      `https://api.the-odds-api.com/v4/sports/${sport}/odds` +
      `?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: "ODDS_API_ERROR",
        status: response.status,
        raw: text
      });
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(200).json([]);
    }

    const games = [];

    data.forEach(match => {
      if (!match.bookmakers?.length) return;

      const market = match.bookmakers[0].markets?.find(m => m.key === "h2h");
      if (!market) return;

      market.outcomes.forEach(outcome => {
        games.push({
          home: match.home_team,
          away: match.away_team,
          pick: outcome.name,
          odds: outcome.price
        });
      });
    });

    res.status(200).json(games);

  } catch (err) {
    res.status(500).json({
      error: "SERVER_CRASH",
      message: err.message
    });
  }
}

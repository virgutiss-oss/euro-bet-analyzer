export default async function handler(req, res) {
  const { sport } = req.query;

  if (!sport) {
    return res.status(400).json({ error: "Missing sport" });
  }

  const API_KEY = process.env.ODDS_API_KEY;

  let sportKey = "";

  if (sport === "football") {
    sportKey = "soccer_uefa_champs_league";
  }

  if (sport === "basketball") {
    sportKey = "basketball_nba";
  }

  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(200).json([]);
    }

    const games = [];

    data.forEach(match => {
      const bookmaker = match.bookmakers?.[0];
      const market = bookmaker?.markets?.[0];
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
    res.status(500).json({ error: "API error" });
  }
}

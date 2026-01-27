export default async function handler(req, res) {
  const { sport } = req.query;

  if (!sport) {
    return res.status(400).json({ error: "No sport provided" });
  }

  const API_KEY = process.env.ODDS_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "Missing ODDS_API_KEY" });
  }

  const SPORT_MAP = {
    football: "soccer_epl",
    basketball: "basketball_euroleague",
    hockey: "icehockey_nhl",
    tennis: "tennis_atp"
  };

  const oddsSport = SPORT_MAP[sport];

  if (!oddsSport) {
    return res.json([]);
  }

  const url = `https://api.the-odds-api.com/v4/sports/${oddsSport}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,totals&oddsFormat=decimal`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.json([]);
    }

    const games = data.map(game => ({
      home: game.home_team,
      away: game.away_team,
      commence_time: game.commence_time,
      bookmakers: game.bookmakers || []
    }));

    res.status(200).json(games);
  } catch (err) {
    res.status(500).json({ error: "API fetch failed" });
  }
}

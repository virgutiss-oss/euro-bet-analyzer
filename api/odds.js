export default async function handler(req, res) {

  const { sport } = req.query;

  const SPORT_MAP = {
    soccer: [
      "soccer_epl",
      "soccer_spain_la_liga",
      "soccer_germany_bundesliga",
      "soccer_italy_serie_a"
    ],
    basketball: [
      "basketball_nba",
      "basketball_euroleague"
    ],
    icehockey: [
      "icehockey_nhl"
    ]
  };

  if (!SPORT_MAP[sport]) {
    return res.status(400).json({ error: "Wrong sport key" });
  }

  try {

    const API_KEY = process.env.ODDS_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "Missing API KEY" });
    }

    let allGames = [];

    for (let league of SPORT_MAP[sport]) {

      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`
      );

      const data = await response.json();

      if (Array.isArray(data)) {
        allGames = [...allGames, ...data];
      }
    }

    res.status(200).json(allGames);

  } catch (error) {
    res.status(500).json({ error: "API fetch failed" });
  }
}

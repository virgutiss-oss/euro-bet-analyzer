export default async function handler(req, res) {
  const { sport, market, line } = req.query;

  const API_KEY = process.env.ODDS_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "Missing API key" });
  }

  const sportMap = {
    football: "soccer_epl",
    basketball: "basketball_nba",
    hockey: "icehockey_nhl",
    tennis: "tennis_atp"
  };

  const sportKey = sportMap[sport];
  if (!sportKey) {
    return res.status(400).json({ error: "Sport not supported" });
  }

  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,totals&oddsFormat=decimal`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const results = data.slice(0, 6).map(match => {
      const home = match.home_team;
      const away = match.away_team;

      let pick = "N/A";

      if (market === "win") {
        pick = home;
      } else if (market === "over") {
        pick = `Over ${line || "?"}`;
      } else if (market === "under") {
        pick = `Under ${line || "?"}`;
      }

      return {
        match: `${home} vs ${away}`,
        pick
      };
    });

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: "API request failed" });
  }
}

export default async function handler(req, res) {
  const { sport } = req.query;

  const API_KEY = process.env.ODDS_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "Nėra API rakto" });
  }

  // SPORTŲ MAPINIMAS (LABAI SVARBU)
  const sportMap = {
    soccer: "soccer_epl",
    basketball: "basketball_nba",
    hockey: "icehockey_nhl",
    tennis: "tennis_atp"
  };

  const apiSport = sportMap[sport];

  if (!apiSport) {
    return res.status(400).json([]);
  }

  try {
    const url = `https://api.the-odds-api.com/v4/sports/${apiSport}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,totals&oddsFormat=decimal`;

    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(200).json([]);
    }

    // TRANSFORMUOJAM DUOMENIS FRONTENDUI
    const games = data.slice(0, 10).map(game => {
      const home = game.home_team;
      const away = game.away_team;

      let pick = "N/A";
      let market = "Win/Lose";
      let probability = Math.floor(55 + Math.random() * 20);

      const bookmaker = game.bookmakers?.[0];
      const h2h = bookmaker?.markets?.find(m => m.key === "h2h");

      if (h2h) {
        const best = h2h.outcomes.sort((a, b) => a.price - b.price)[0];
        pick = best.name;
      }

      return {
        home,
        away,
        market,
        pick,
        probability
      };
    });

    res.status(200).json(games);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
}

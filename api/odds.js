export default async function handler(req, res) {
  try {
    const { sport } = req.query;
    const API_KEY = process.env.ODDS_API_KEY;

    if (!sport) {
      return res.status(400).json({ error: "Blogas sportas" });
    }

    const SPORT_MAP = {
      basketball: "basketball_nba",
      soccer: "soccer_uefa_champs_league"
    };

    const sportKey = SPORT_MAP[sport];

    if (!sportKey) {
      return res.status(400).json({ error: "Blogas sportas" });
    }

    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`;

    const r = await fetch(url);
    const data = await r.json();

    let games = [];

    data.forEach(match => {
      const home = match.home_team;
      const away = match.away_team;

      const bookmaker = match.bookmakers?.[0];
      if (!bookmaker) return;

      const h2h = bookmaker.markets.find(m => m.key === "h2h");
      const totals = bookmaker.markets.find(m => m.key === "totals");

      if (!h2h || !totals) return;

      const bestWin = h2h.outcomes.reduce((a, b) => a.price > b.price ? a : b);
      const total = totals.outcomes[0];

      games.push({
        home,
        away,
        win: {
          pick: bestWin.name,
          odds: bestWin.price,
          probability: Math.round((1 / bestWin.price) * 100)
        },
        total: {
          pick: `${total.name} ${total.point}`,
          odds: total.price,
          probability: Math.round((1 / total.price) * 100),
          line: total.point
        }
      });
    });

    res.status(200).json(games);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Serverio klaida" });
  }
}

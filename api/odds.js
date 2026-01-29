export default async function handler(req, res) {
  const { sport, market } = req.query;
  const API_KEY = process.env.ODDS_API_KEY;

  let sportKeys = [];

  if (sport === "soccer") {
    sportKeys = ["soccer_uefa_champs_league", "soccer_epl"];
  }

  if (sport === "basketball") {
    sportKeys = ["basketball_nba", "basketball_euroleague"];
  }

  let results = [];

  for (const key of sportKeys) {
    const url = `https://api.the-odds-api.com/v4/sports/${key}/odds/?apiKey=${API_KEY}&regions=eu&markets=${market}&oddsFormat=decimal`;

    const r = await fetch(url);
    const data = await r.json();
    if (!Array.isArray(data)) continue;

    data.forEach(match => {
      const bm = match.bookmakers?.[0];
      const mk = bm?.markets?.[0];
      if (!mk) return;

      // 🔥 PASIRENKAM GERIAUSIĄ (mažiausias odds)
      const best = mk.outcomes.reduce((a, b) =>
        a.price < b.price ? a : b
      );

      results.push({
        home: match.home_team,
        away: match.away_team,
        market: mk.key,
        pick: best.name,
        odds: best.price
      });
    });
  }

  res.status(200).json(results);
}

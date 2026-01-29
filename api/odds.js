import fetch from "node-fetch";

export default async function handler(req, res) {
  const sport = req.query.sport;
  const API_KEY = process.env.ODDS_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "NO_API_KEY" });
  }

  if (!sport) {
    return res.status(400).json({ error: "NO_SPORT" });
  }

  const SPORTS = {
    soccer: [
      "soccer_uefa_champs_league",
      "soccer_england_premier_league"
    ],
    basketball: [
      "basketball_nba",
      "basketball_euroleague"
    ]
  };

  let results = [];

  try {
    for (const key of SPORTS[sport] || []) {
      const url = `https://api.the-odds-api.com/v4/sports/${key}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`;
      const r = await fetch(url);
      const data = await r.json();

      if (!Array.isArray(data)) continue;

      data.forEach(g => {
        const b = g.bookmakers?.[0];
        if (!b) return;

        const h2h = b.markets.find(m => m.key === "h2h");
        const totals = b.markets.find(m => m.key === "totals");

        let win = null;
        if (h2h) {
          const best = h2h.outcomes.reduce((a, b) =>
            a.price < b.price ? a : b
          );
          win = {
            pick: best.name,
            odds: best.price,
            probability: Math.round((1 / best.price) * 100)
          };
        }

        let total = null;
        if (sport === "basketball" && totals) {
          const o = totals.outcomes.find(x => x.name === "Over");
          const u = totals.outcomes.find(x => x.name === "Under");
          if (o && u) {
            const best = o.price < u.price ? o : u;
            total = {
              pick: best.name,
              line: best.point,
              odds: best.price,
              probability: Math.round((1 / best.price) * 100)
            };
          }
        }

        results.push({
          league: g.sport_title,
          home: g.home_team,
          away: g.away_team,
          win,
          total
        });
      });
    }

    res.status(200).json(results);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "CRASH", message: e.message });
  }
}

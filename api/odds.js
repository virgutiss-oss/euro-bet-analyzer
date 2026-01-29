export default async function handler(req, res) {
  const sport = req.query.sport;
  const API_KEY = process.env.ODDS_API_KEY;

  if (!sport) {
    return res.status(400).json({ error: "No sport provided" });
  }

  const SPORTS = {
    soccer: ["soccer_uefa_champs_league", "soccer_england_premier_league"],
    basketball: [
      "basketball_nba",
      "basketball_euroleague",
      "basketball_spain_acb"
    ]
  };

  const sportKeys = SPORTS[sport] || [];
  let output = [];

  try {
    for (const key of sportKeys) {
      const url = `https://api.the-odds-api.com/v4/sports/${key}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`;
      const r = await fetch(url);
      const games = await r.json();

      if (!Array.isArray(games)) continue;

      for (const g of games) {
        const bookmaker = g.bookmakers?.[0];
        if (!bookmaker) continue;

        const h2h = bookmaker.markets.find(m => m.key === "h2h");
        const totals = bookmaker.markets.find(m => m.key === "totals");

        // ===== WIN / LOSE / DRAW =====
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

        // ===== OVER / UNDER (tik krepšinyje) =====
        let total = null;
        if (sport === "basketball" && totals) {
          const over = totals.outcomes.find(o => o.name === "Over");
          const under = totals.outcomes.find(o => o.name === "Under");

          if (over && under) {
            const best = over.price < under.price ? over : under;

            total = {
              pick: best.name,
              line: best.point,
              odds: best.price,
              probability: Math.round((1 / best.price) * 100)
            };
          }
        }

        output.push({
          league: g.sport_title,
          home: g.home_team,
          away: g.away_team,
          win,
          total
        });
      }
    }

    res.status(200).json(output);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}

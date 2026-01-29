export default async function handler(req, res) {
  const sport = req.query.sport;
  const API_KEY = process.env.ODDS_API_KEY;

  if (!sport) {
    return res.status(400).json({ error: "Nenurodytas sportas" });
  }

  // SPORTŲ ŽEMĖLAPIS
  const sportsMap = {
    soccer: "soccer_uefa_champs_league",
    basketball: [
      "basketball_nba",
      "basketball_euroleague",
      "basketball_spain_acb",
      "basketball_germany_bbl",
      "basketball_france_lnb"
    ]
  };

  const sportKeys = Array.isArray(sportsMap[sport])
    ? sportsMap[sport]
    : [sportsMap[sport]];

  let results = [];

  try {
    for (const key of sportKeys) {
      const url = `https://api.the-odds-api.com/v4/sports/${key}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`;
      const response = await fetch(url);
      const games = await response.json();

      if (!Array.isArray(games)) continue;

      for (const game of games) {
        const bookmaker = game.bookmakers?.[0];
        if (!bookmaker) continue;

        const h2h = bookmaker.markets.find(m => m.key === "h2h");
        const totals = bookmaker.markets.find(m => m.key === "totals");

        // WIN / LOSE
        let winPick = null;
        if (h2h) {
          const best = h2h.outcomes.reduce((a, b) =>
            a.price < b.price ? a : b
          );

          winPick = {
            type: "Win/Lose",
            pick: best.name,
            odds: best.price,
            probability: Math.round((1 / best.price) * 100)
          };
        }

        // OVER / UNDER (protingesnė logika)
        let totalPick = null;
        if (totals) {
          const over = totals.outcomes.find(o => o.name.toLowerCase().includes("over"));
          const under = totals.outcomes.find(o => o.name.toLowerCase().includes("under"));

          if (over && under) {
            let best;
            if (under.price < 1.75 && over.price >= 1.95) {
              best = over;
            } else {
              best = over.price < under.price ? over : under;
            }

            totalPick = {
              type: "Over/Under",
              pick: best.name,
              odds: best.price,
              probability: Math.round((1 / best.price) * 100)
            };
          }
        }

        results.push({
          league: game.sport_title,
          home: game.home_team,
          away: game.away_team,
          winPick,
          totalPick
        });
      }
    }

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverio klaida" });
  }
}

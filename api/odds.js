export default async function handler(req, res) {
  const { league } = req.query;

  if (!league) {
    return res.status(400).json([]);
  }

  const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`;

  try {
    const r = await fetch(url);
    const data = await r.json();

    if (!Array.isArray(data)) {
      return res.status(200).json([]);
    }

    const games = [];

    data.forEach(game => {
      let bestWin = null;
      let bestTotal = null;

      game.bookmakers?.forEach(bm => {
        bm.markets?.forEach(m => {

          // 🏷 WIN / LOSE
          if (m.key === "h2h") {
            m.outcomes.forEach(o => {
              if (!bestWin || o.price < bestWin.odds) {
                bestWin = {
                  pick: o.name,
                  odds: o.price,
                  probability: Math.round(100 / o.price)
                };
              }
            });
          }

          // 📊 OVER / UNDER
          if (m.key === "totals") {
            m.outcomes.forEach(o => {
              if (!bestTotal || o.price < bestTotal.odds) {
                bestTotal = {
                  pick: o.name,
                  odds: o.price,
                  line: o.point,
                  probability: Math.round(100 / o.price)
                };
              }
            });
          }

        });
      });

      // ✅ viena rungtynė = vienas objektas
      if (bestWin && bestTotal) {
        games.push({
          home: game.home_team,
          away: game.away_team,
          win: bestWin,
          total: bestTotal
        });
      }
    });

    res.status(200).json(games);

  } catch (e) {
    console.error("API ERROR:", e);
    res.status(500).json([]);
  }
}

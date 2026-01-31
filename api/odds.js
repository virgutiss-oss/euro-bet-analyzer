export default async function handler(req, res) {
  const { league } = req.query;
  if (!league) return res.status(400).json([]);

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

          // ✅ WIN / LOSE
          if (m.key === "h2h") {
            m.outcomes.forEach(o => {
              const prob = Math.round(100 / o.price);
              if (!bestWin || prob > bestWin.probability) {
                bestWin = {
                  pick: o.name,
                  odds: o.price,
                  probability: prob
                };
              }
            });
          }

          // ✅ OVER / UNDER (FILTRUOJAM)
          if (m.key === "totals") {
            m.outcomes.forEach(o => {
              const prob = Math.round(100 / o.price);

              if (o.price >= 1.5 && prob >= 58) {
                if (!bestTotal || prob > bestTotal.probability) {
                  bestTotal = {
                    pick: o.name,
                    odds: o.price,
                    line: o.point,
                    probability: prob
                  };
                }
              }
            });
          }

        });
      });

      if (bestWin) {
        games.push({
          home: game.home_team,
          away: game.away_team,
          commence_time: game.commence_time,
          win: bestWin,
          total: bestTotal || null
        });
      }
    });

    // 🔥 rikiuojam pagal geriausią %
    games.sort((a, b) => b.win.probability - a.win.probability);

    res.status(200).json(games);

  } catch (e) {
    res.status(500).json([]);
  }
}

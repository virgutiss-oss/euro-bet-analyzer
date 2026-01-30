export default async function handler(req, res) {
  const { league } = req.query;
  if (!league) return res.status(400).json([]);

  const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!Array.isArray(data)) return res.json([]);

    const games = [];

    data.forEach(game => {
      let bestWin = null;
      let bestTotal = null;

      let totalLines = [];

      game.bookmakers?.forEach(bm => {
        bm.markets?.forEach(m => {

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

          if (m.key === "totals") {
            m.outcomes.forEach(o => {
              if (typeof o.point === "number") {
                totalLines.push(o.point);
              }

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

      if (bestWin && bestTotal && totalLines.length > 0) {
        const avgTotal =
          totalLines.reduce((a, b) => a + b, 0) / totalLines.length;

        const projected = Number(avgTotal.toFixed(1));

        games.push({
          home: game.home_team,
          away: game.away_team,
          commence_time: game.commence_time,

          win: bestWin,
          total: bestTotal,

          projectedTotal: projected,
          rangeLow: Math.round(projected - 14),
          rangeHigh: Math.round(projected + 14)
        });
      }
    });

    res.status(200).json(games);
  } catch (e) {
    res.status(500).json([]);
  }
}

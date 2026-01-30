export default async function handler(req, res) {
  const { league } = req.query;

  if (!league) {
    return res.status(400).json({ error: "Nenurodyta lyga" });
  }

  const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`;

  try {
    const r = await fetch(url);
    const data = await r.json();

    // 🔴 API limitas pasibaigė
    if (data?.error_code === "OUT_OF_USAGE_CREDITS") {
      return res.status(200).json({
        error: "API limitas pasibaigė",
        message: "The Odds API usage quota has been reached"
      });
    }

    // 🔴 Netinkamas atsakymas
    if (!Array.isArray(data)) {
      return res.status(200).json({
        error: "Blogas API atsakymas",
        raw: data
      });
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
              if (!bestWin || o.price < bestWin.odds) {
                bestWin = {
                  pick: o.name,
                  odds: o.price,
                  probability: Math.round(100 / o.price)
                };
              }
            });
          }

          // ✅ OVER / UNDER
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

      // ✅ GRĄŽINAM NET JEI NĖRA TOTALS
      if (bestWin) {
        games.push({
          home: game.home_team,
          away: game.away_team,
          win: bestWin,
          total: bestTotal || null
        });
      }
    });

    return res.status(200).json(games);

  } catch (e) {
    return res.status(500).json({
      error: "Serverio klaida",
      message: e.message
    });
  }
}

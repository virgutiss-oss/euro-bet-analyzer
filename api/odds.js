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
        bm.markets?.forEach(market => {

          /* ===== WIN / LOSE (h2h) ===== */
          if (market.key === "h2h") {
            market.outcomes?.forEach(o => {
              if (!bestWin || o.price < bestWin.odds) {
                bestWin = {
                  pick: o.name,
                  odds: o.price,
                  probability: Math.round(100 / o.price)
                };
              }
            });
          }

          /* ===== OVER / UNDER (PRO, BET SAUGU) ===== */
          if (market.key === "totals") {
            market.outcomes?.forEach(o => {
              if (!o.point || !o.price) return;

              const line = Number(o.point);
              const odds = Number(o.price);

              /* 🛡 SAUGOS FILTRAI */
              if (odds < 1.4 || odds > 2.2) return; // per ekstremalūs
              if (league.includes("basketball")) {
                if (line < 130 || line > 210) return;
              }
              if (league.includes("soccer")) {
                if (line < 1 || line > 5.5) return;
              }

              /* 📊 „PRO“ tikimybė */
              let probability = 100 / odds;

              // švelni korekcija pagal liniją
              if (league.includes("basketball")) {
                if (line > 175) probability -= 3;
                if (line < 155) probability -= 3;
              }

              if (league.includes("soccer")) {
                if (line >= 3.5) probability -= 4;
                if (line <= 1.5) probability -= 2;
              }

              probability = Math.round(probability);

              if (
                !bestTotal ||
                probability > bestTotal.probability
              ) {
                bestTotal = {
                  pick: o.name,
                  odds,
                  line,
                  probability
                };
              }
            });
          }

        });
      });

      if (bestWin && bestTotal) {
        games.push({
          id: game.id,
          commence_time: game.commence_time,
          home: game.home_team,
          away: game.away_team,
          win: bestWin,
          total: bestTotal
        });
      }
    });

    res.status(200).json(games);

  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
}

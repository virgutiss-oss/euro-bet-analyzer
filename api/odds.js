export default async function handler(req, res) {
  const { league } = req.query;
  if (!league) return res.status(400).json([]);

  const isTennis = league.startsWith("tennis");

  // 🎾 tenisas – tik h2h, US region
  // visi kiti – h2h + totals, EU region
  const markets = isTennis ? "h2h" : "h2h,totals";
  const region = isTennis ? "us" : "eu";

  const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=${region}&markets=${markets}&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`;

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

          // ✅ WIN / LOSE (VISIEMS, ĮSKAITANT TENISĄ)
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

          // ✅ OVER / UNDER (TIK NE TENISUI)
          if (!isTennis && m.key === "totals") {
            m.outcomes.forEach(o => {
              if (
                o.price >= 1.5 &&
                (!bestTotal || o.price < bestTotal.odds)
              ) {
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

      // 🎾 TENISAS – užtenka WIN
      if (isTennis && bestWin) {
        games.push({
          home: game.home_team,
          away: game.away_team,
          win: bestWin
        });
      }

      // 🏀⚽🏒 – WIN visada, TOTAL jei yra
      if (!isTennis && bestWin) {
        games.push({
          home: game.home_team,
          away: game.away_team,
          win: bestWin,
          total: bestTotal || null
        });
      }
    });

    res.status(200).json(games);
  } catch (e) {
    res.status(500).json([]);
  }
}

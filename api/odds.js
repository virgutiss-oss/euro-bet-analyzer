const LEAGUE_AVG = {
  // 🏀 KREPŠINIS
  basketball_nba: 228,
  basketball_euroleague: 164,
  basketball_eurocup: 166,
  basketball_lithuania_lkl: 158,
  basketball_spain_acb: 162,
  basketball_germany_bbl: 170,
  basketball_france_proa: 168,
  basketball_italy_lega_a: 165,

  // ⚽ FUTBOLAS
  soccer_epl: 2.9,
  soccer_germany_bundesliga: 3.1,
  soccer_italy_serie_a: 2.6,
  soccer_france_ligue_one: 2.4,
  soccer_spain_la_liga: 2.5,
  soccer_uefa_champs_league: 2.8,
  soccer_uefa_europa_league: 2.7
};

export default async function handler(req, res) {
  const { league } = req.query;
  if (!league) return res.status(400).json([]);

  const avg = LEAGUE_AVG[league] || null;

  const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!Array.isArray(data)) return res.json([]);

    const games = [];

    data.forEach(game => {
      let bestWin = null;
      let bestTotal = null;

      game.bookmakers?.forEach(bm => {
        bm.markets?.forEach(m => {

          // ✅ WIN / LOSE
          if (m.key === "h2h") {
            m.outcomes.forEach(o => {
              const p = Math.round(100 / o.price);
              if (!bestWin || p > bestWin.probability) {
                bestWin = {
                  pick: o.name,
                  odds: o.price,
                  probability: p
                };
              }
            });
          }

          // ✅ OVER / UNDER (PRO)
          if (m.key === "totals" && avg) {
            m.outcomes.forEach(o => {
              if (!o.point) return;

              const base = 100 / o.price;
              const diff = avg - o.point;
              const weight = league.startsWith("basketball") ? 0.35 : 6;
              const adjusted = Math.round(base + diff * weight);

              if (
                adjusted >= 50 &&
                (!bestTotal || adjusted > bestTotal.probability)
              ) {
                bestTotal = {
                  pick: o.name,
                  odds: o.price,
                  line: o.point,
                  probability: adjusted
                };
              }
            });
          }
        });
      });

      if (bestWin || bestTotal) {
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
    res.status(500).json([]);
  }
}

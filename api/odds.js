const LEAGUE_AVG = {
  // 🏀 KREPŠINIS
  basketball_nba: { avg: 228, weight: 0.35, dead: 4 },
  basketball_euroleague: { avg: 164, weight: 0.22, dead: 3 },
  basketball_eurocup: { avg: 166, weight: 0.22, dead: 3 },
  basketball_lithuania_lkl: { avg: 158, weight: 0.2, dead: 3 },
  basketball_spain_acb: { avg: 162, weight: 0.22, dead: 3 },
  basketball_germany_bbl: { avg: 170, weight: 0.25, dead: 3 },
  basketball_france_proa: { avg: 168, weight: 0.25, dead: 3 },
  basketball_italy_lega_a: { avg: 165, weight: 0.22, dead: 3 },

  // ⚽ FUTBOLAS
  soccer_epl: { avg: 2.9, weight: 7, dead: 0.15 },
  soccer_germany_bundesliga: { avg: 3.1, weight: 7.5, dead: 0.15 },
  soccer_italy_serie_a: { avg: 2.6, weight: 6, dead: 0.15 },
  soccer_france_ligue_one: { avg: 2.4, weight: 5.5, dead: 0.15 },
  soccer_spain_la_liga: { avg: 2.5, weight: 6, dead: 0.15 },
  soccer_uefa_champs_league: { avg: 2.8, weight: 6.5, dead: 0.15 },
  soccer_uefa_europa_league: { avg: 2.7, weight: 6.3, dead: 0.15 }
};

export default async function handler(req, res) {
  const { league } = req.query;
  if (!league) return res.status(400).json([]);

  const cfg = LEAGUE_AVG[league];
  if (!cfg) return res.json([]);

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
          if (m.key === "totals") {
            m.outcomes.forEach(o => {
              if (!o.point) return;

              const base = 100 / o.price;
              const diff = cfg.avg - o.point;

              if (Math.abs(diff) < cfg.dead) return;

              const isOver = o.name.toLowerCase().includes("over");
              const bias = isOver ? 1.05 : 0.95;

              let adjusted = base + diff * cfg.weight * bias;
              adjusted = Math.max(50, Math.min(75, Math.round(adjusted)));

              if (!bestTotal || adjusted > bestTotal.probability) {
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
          date: game.commence_time, // 📅 SVARBU
          win: bestWin,
          total: bestTotal
        });
      }
    });

    // 📊 RIKIAVIMAS PAGAL DATĄ (ARTIMIAUSIOS VIRŠUJE)
    games.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json(games);
  } catch (e) {
    res.status(500).json([]);
  }
}

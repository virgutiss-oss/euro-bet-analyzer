const LEAGUE_CFG = {
  basketball_nba: { avg: 228, weight: 0.35, dead: 4 },
  basketball_euroleague: { avg: 164, weight: 0.22, dead: 3 },
  basketball_eurocup: { avg: 166, weight: 0.22, dead: 3 },
  basketball_lithuania_lkl: { avg: 158, weight: 0.2, dead: 3 },
  basketball_spain_acb: { avg: 162, weight: 0.22, dead: 3 },
  basketball_germany_bbl: { avg: 170, weight: 0.25, dead: 3 },
  basketball_france_proa: { avg: 168, weight: 0.25, dead: 3 },
  basketball_italy_lega_a: { avg: 165, weight: 0.22, dead: 3 },

  soccer_epl: { avg: 2.9, weight: 6.5, dead: 0.15 },
  soccer_germany_bundesliga: { avg: 3.1, weight: 7, dead: 0.15 },
  soccer_italy_serie_a: { avg: 2.6, weight: 6, dead: 0.15 },
  soccer_france_ligue_one: { avg: 2.4, weight: 5.5, dead: 0.15 },
  soccer_spain_la_liga: { avg: 2.5, weight: 6, dead: 0.15 },
  soccer_uefa_champs_league: { avg: 2.8, weight: 6.5, dead: 0.15 },
  soccer_uefa_europa_league: { avg: 2.7, weight: 6.3, dead: 0.15 }
};

export default async function handler(req, res) {
  const { league } = req.query;
  if (!league) return res.json([]);

  const cfg = LEAGUE_CFG[league];
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
      let favoriteOdds = null;

      game.bookmakers?.forEach(bm => {
        bm.markets?.forEach(m => {

          // =====================
          // 🏷 H2H (Win / Lose)
          // =====================
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

              if (!favoriteOdds || o.price < favoriteOdds) {
                favoriteOdds = o.price;
              }
            });
          }

          // =====================
          // 🏷 OVER / UNDER (FILTRUOTAS)
          // =====================
          if (m.key === "totals") {
            const over = m.outcomes.find(o => o.name.toLowerCase().includes("over"));
            const under = m.outcomes.find(o => o.name.toLowerCase().includes("under"));
            if (!over || !under) return;

            // ❌ rinka neapsisprendusi
            if (Math.abs(over.price - under.price) < 0.15) return;

            [over, under].forEach(o => {
              const isOver = o.name.toLowerCase().includes("over");

              // ❌ minimalus koficientas
              if (o.price < 1.55) return;

              const base = 100 / o.price;
              const diff = cfg.avg - o.point;

              // ❌ per arti lygos vidurkio
              if (Math.abs(diff) < cfg.dead) return;

              let prob = base + diff * cfg.weight;

              // ⭐ favorito under bias
              if (!isOver && favoriteOdds && favoriteOdds < 1.4) {
                prob += 5;
              }

              // ❌ labai didelis favoritas – no over
              if (isOver && favoriteOdds && favoriteOdds < 1.25) return;

              // ❌ griežtesni slenksčiai
              if (isOver && prob < 62) return;
              if (!isOver && prob < 58) return;

              // ✅ cap’ai
              if (isOver) prob = Math.min(prob, 70);
              if (!isOver) prob = Math.min(prob, 72);

              prob = Math.round(prob);

              if (!bestTotal || prob > bestTotal.probability) {
                bestTotal = {
                  pick: o.name,
                  odds: o.price,
                  line: o.point,
                  probability: prob
                };
              }
            });
          }
        });
      });

      // 👉 paliekam jei yra bent vienas rimtas pickas
      if (bestWin || bestTotal) {
        games.push({
          home: game.home_team,
          away: game.away_team,
          date: game.commence_time,
          win: bestWin,
          total: bestTotal
        });
      }
    });

    // rūšiuojam pagal datą
    games.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json(games);

  } catch (e) {
    res.status(500).json([]);
  }
}

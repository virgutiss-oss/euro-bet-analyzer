export default async function handler(req, res) {
  const { league } = req.query;
  if (!league) return res.status(400).json([]);

  const isTennis = league.startsWith("tennis");
  const isSoccer = league.startsWith("soccer");

  const markets = isTennis ? "h2h" : "h2h,totals";
  const region = isTennis ? "us" : "eu";

  const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=${region}&markets=${markets}&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`;

  // ⚽ FUTBOLO LYGA → GOAL TEMPO KOREKCIJA
  const leagueGoalBias = {
    soccer_epl: 1.05,
    soccer_bundesliga: 1.1,
    soccer_spain_la_liga: 0.95,
    soccer_italy_serie_a: 0.9,
    soccer_france_ligue_one: 0.95,
    soccer_uefa_champs_league: 0.9,
    soccer_uefa_europa_league: 0.95
  };

  // ⚽ O/U LINIJŲ SVORIS
  function lineWeight(pick, line) {
    if (!isSoccer) return 1;

    if (pick === "Over") {
      if (line <= 1.5) return 1.1;
      if (line >= 3.5) return 0.9;
    }

    if (pick === "Under") {
      if (line >= 3.5) return 1.1;
      if (line <= 1.5) return 0.9;
    }

    return 1;
  }

  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!Array.isArray(data)) return res.json([]);

    const games = [];
    const valueCandidates = [];

    data.forEach(game => {
      let bestWin = null;
      let bestTotal = null;

      game.bookmakers?.forEach(bm => {
        bm.markets?.forEach(m => {

          // ✅ WIN / LOSE
          if (m.key === "h2h") {
            m.outcomes.forEach(o => {
              const implied = 100 / o.price;
              const prob = Math.round(implied);
              const value = prob - implied;

              if (!bestWin || o.price < bestWin.odds) {
                bestWin = {
                  pick: o.name,
                  odds: o.price,
                  probability: prob,
                  value: Math.round(value)
                };
              }
            });
          }

          // ⚽ FUTBOLO OVER / UNDER PRO
          if (!isTennis && m.key === "totals") {
            m.outcomes.forEach(o => {
              if (o.price < 1.5) return;

              const implied = 100 / o.price;
              let modelProb = implied;

              if (isSoccer) {
                const bias = leagueGoalBias[league] || 1;
                const weight = lineWeight(o.name, o.point);
                modelProb = implied * bias * weight;
              }

              const finalProb = Math.round(modelProb);
              const value = Math.round(finalProb - implied);

              if (!bestTotal || value > bestTotal.value) {
                bestTotal = {
                  pick: o.name,
                  odds: o.price,
                  line: o.point,
                  probability: finalProb,
                  value
                };
              }
            });
          }

        });
      });

      if (bestWin) {
        const gameObj = {
          home: game.home_team,
          away: game.away_team,
          win: bestWin,
          total: bestTotal || null
        };

        games.push(gameObj);

        // 📊 kandidatai TOP 3 (imam geriausią iš win / total)
        const candidate = bestTotal && bestTotal.value > bestWin.value
          ? { ...bestTotal, match: `${game.home_team} vs ${game.away_team}` }
          : { ...bestWin, match: `${game.home_team} vs ${game.away_team}` };

        valueCandidates.push(candidate);
      }
    });

    // 🏆 TOP 3 PAGAL VALUE
    const top3 = valueCandidates
      .filter(v => v.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    res.status(200).json({
      games,
      top3
    });

  } catch (e) {
    res.status(500).json([]);
  }
}

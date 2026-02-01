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

    data.forEach(game => {
      let bestWin = null;
      let bestTotal = null;

      game.bookmakers?.forEach(bm => {
        bm.markets?.forEach(m => {

          // ✅ WIN / LOSE (VISIEMS)
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

          // ⚽ FUTBOLO OVER / UNDER PRO
          if (!isTennis && m.key === "totals") {
            m.outcomes.forEach(o => {
              if (o.price < 1.5) return;

              let baseProb = 100 / o.price;
              let weightedProb = baseProb;

              if (isSoccer) {
                const bias = leagueGoalBias[league] || 1;
                const weight = lineWeight(o.name, o.point);
                weightedProb = baseProb * bias * weight;
              }

              const finalProb = Math.round(weightedProb);

              if (!bestTotal || finalProb > bestTotal.probability) {
                bestTotal = {
                  pick: o.name,
                  odds: o.price,
                  line: o.point,
                  probability: finalProb
                };
              }
            });
          }

        });
      });

      if (isTennis && bestWin) {
        games.push({
          home: game.home_team,
          away: game.away_team,
          win: bestWin
        });
      }

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

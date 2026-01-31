async function fetchOdds(league, region) {
  const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=${region}&markets=h2h,totals&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`;
  const r = await fetch(url);
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

export default async function handler(req, res) {
  const { league } = req.query;
  if (!league) return res.status(400).json([]);

  try {
    // 🏀 fallback logika krepšiniui
    let data = await fetchOdds(league, "eu");

    if (league.startsWith("basketball_") && data.length === 0) {
      data = await fetchOdds(league, "us");
    }

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json({ games: [], top3: [] });
    }

    const games = [];

    data.forEach(game => {
      let bestWin = null;
      let bestTotal = null;

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

      if (bestWin) {
        games.push({
          home: game.home_team,
          away: game.away_team,
          win: bestWin,
          total: bestTotal || null,
          bestPercent: Math.max(
            bestWin.probability,
            bestTotal ? bestTotal.probability : 0
          )
        });
      }
    });

    const top3 = [...games]
      .sort((a, b) => b.bestPercent - a.bestPercent)
      .slice(0, 3);

    res.status(200).json({ games, top3 });

  } catch (e) {
    res.status(500).json({ games: [], top3: [] });
  }
}

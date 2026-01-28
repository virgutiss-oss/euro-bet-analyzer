export default async function handler(req, res) {
  const API_KEY = process.env.ODDS_API_KEY;
  const sport = req.query.sport;

  let url = "";

  // ⚽ FUTBOLAS – VISOS LYGOS
  if (sport === "soccer") {
    url =
      "https://api.the-odds-api.com/v4/sports/soccer/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=" +
      API_KEY;
  }

  // 🏀 KREPŠINIS
  if (sport === "basketball") {
    url =
      "https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=" +
      API_KEY;
  }

  if (!url) {
    return res.status(200).json([]);
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json([]);
    }

    const results = [];

    data.forEach(match => {
      const bookmakers = match.bookmakers || [];
      if (!bookmakers.length) return;

      const winPrices = {};
      let bestTotal = null;

      bookmakers.forEach(bm => {
        bm.markets?.forEach(market => {
          // WIN / DRAW / LOSE
          if (market.key === "h2h") {
            market.outcomes.forEach(o => {
              if (!winPrices[o.name] || o.price > winPrices[o.name]) {
                winPrices[o.name] = o.price;
              }
            });
          }

          // TOTALS
          if (market.key === "totals") {
            market.outcomes.forEach(o => {
              const p = 1 / o.price;
              if (!bestTotal || p > bestTotal.prob) {
                bestTotal = {
                  pick: `${o.name} ${o.point}`,
                  odds: o.price,
                  prob: p
                };
              }
            });
          }
        });
      });

      const bestWin =
        Object.keys(winPrices).length > 0
          ? Object.entries(winPrices).reduce((a, b) =>
              a[1] > b[1] ? a : b
            )
          : null;

      results.push({
        league: match.sport_title,
        home: match.home_team,
        away: match.away_team,

        winPick: bestWin ? bestWin[0] : null,
        winOdds: bestWin ? bestWin[1] : null,
        winProb: bestWin
          ? Math.round((1 / bestWin[1]) * 100)
          : null,

        total: bestTotal
          ? {
              pick: bestTotal.pick,
              odds: bestTotal.odds,
              prob: Math.round(bestTotal.prob * 100)
            }
          : null
      });
    });

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: "API klaida" });
  }
}

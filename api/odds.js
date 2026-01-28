export default async function handler(req, res) {
  const API_KEY = process.env.ODDS_API_KEY;

  const url =
    "https://api.the-odds-api.com/v4/sports/soccer/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=" +
    API_KEY;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json([]);
    }

    const results = [];

    data.forEach(match => {
      const bookmakers = match.bookmakers || [];
      if (bookmakers.length === 0) return;

      /* ===== WIN / LOSE ===== */
      const winPrices = {};

      /* ===== OVER / UNDER ===== */
      let bestTotal = null;

      bookmakers.forEach(bm => {
        bm.markets?.forEach(market => {

          // H2H
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
              const prob = 1 / o.price;
              if (!bestTotal || prob > bestTotal.prob) {
                bestTotal = {
                  line: o.point,
                  pick: o.name,
                  prob: prob
                };
              }
            });
          }
        });
      });

      // Best Win/Lose
      const bestWin = Object.entries(winPrices).reduce((a, b) =>
        a[1] > b[1] ? a : b
      );

      results.push({
        sport: "football",
        league: match.sport_title,
        home: match.home_team,
        away: match.away_team,

        winPick: bestWin[0],
        winProb: Math.round((1 / bestWin[1]) * 100),

        totalPick: bestTotal
          ? `${bestTotal.pick} ${bestTotal.line}`
          : null,
        totalProb: bestTotal
          ? Math.round(bestTotal.prob * 100)
          : null
      });
    });

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: "API klaida" });
  }
}

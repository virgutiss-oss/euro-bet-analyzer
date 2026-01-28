export default async function handler(req, res) {
  const API_KEY = process.env.ODDS_API_KEY;
  const sport = req.query.sport || "football";

  let url = "";

  if (sport === "football") {
    url =
      "https://api.the-odds-api.com/v4/sports/soccer/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=" +
      API_KEY;
  }

  if (sport === "basketball") {
    url =
      "https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=" +
      API_KEY;
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
      if (bookmakers.length === 0) return;

      /* ===== WIN / LOSE ===== */
      const winPrices = {};

      /* ===== TOTALS ===== */
      let bestTotal = null;

      bookmakers.forEach(bm => {
        bm.markets?.forEach(market => {
          if (market.key === "h2h") {
            market.outcomes.forEach(o => {
              if (!winPrices[o.name] || o.price > winPrices[o.name]) {
                winPrices[o.name] = o.price;
              }
            });
          }

          if (market.key === "totals") {
            market.outcomes.forEach(o => {
              const prob = 1 / o.price;
              if (!bestTotal || prob > bestTotal.prob) {
                bestTotal = {
                  pick: o.name,
                  line: o.point,
                  price: o.price,
                  prob
                };
              }
            });
          }
        });
      });

      const bestWin = Object.entries(winPrices).reduce((a, b) =>
        a[1] > b[1] ? a : b
      );

      results.push({
        sport,
        league: match.sport_title,
        home: match.home_team,
        away: match.away_team,

        winPick: bestWin[0],
        winOdds: bestWin[1],
        winProb: Math.round((1 / bestWin[1]) * 100),

        totalPick: bestTotal
          ? `${bestTotal.pick} ${bestTotal.line}`
          : null,
        totalOdds: bestTotal ? bestTotal.price : null,
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

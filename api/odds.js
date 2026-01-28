export default async function handler(req, res) {
  const API_KEY = process.env.ODDS_API_KEY;
  const sport = req.query.sport || "football";

  let urls = [];

  if (sport === "football") {
    urls = [
      "https://api.the-odds-api.com/v4/sports/soccer/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=" + API_KEY
    ];
  }

  if (sport === "basketball") {
    urls = [
      "https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=" + API_KEY,
      "https://api.the-odds-api.com/v4/sports/basketball_euroleague/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=" + API_KEY,
      "https://api.the-odds-api.com/v4/sports/basketball_eurocup/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=" + API_KEY,
      "https://api.the-odds-api.com/v4/sports/basketball_fiba_champions_league/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=" + API_KEY
    ];
  }

  try {
    const responses = await Promise.all(
      urls.map(url => fetch(url).then(r => r.json()))
    );

    const allMatches = responses.flat();
    const results = [];

    allMatches.forEach(match => {
      const bookmakers = match.bookmakers || [];
      if (bookmakers.length === 0) return;

      const winPrices = {};
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

      if (Object.keys(winPrices).length === 0) return;

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

        totalPick: bestTotal ? `${bestTotal.pick} ${bestTotal.line}` : null,
        totalOdds: bestTotal ? bestTotal.price : null,
        totalProb: bestTotal ? Math.round(bestTotal.prob * 100) : null
      });
    });

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: "API klaida" });
  }
}

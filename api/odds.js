export default async function handler(req, res) {
  const API_KEY = process.env.ODDS_API_KEY;
  const sport = req.query.sport || "basketball";
  const mode = req.query.mode || "all"; // all | totals

  let urls = [];

  if (sport === "basketball") {
    urls = [
      "https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?regions=eu&markets=h2h,totals,totals_1st_half&oddsFormat=decimal&apiKey=" + API_KEY,
      "https://api.the-odds-api.com/v4/sports/basketball_euroleague/odds/?regions=eu&markets=h2h,totals,totals_1st_half&oddsFormat=decimal&apiKey=" + API_KEY,
      "https://api.the-odds-api.com/v4/sports/basketball_eurocup/odds/?regions=eu&markets=h2h,totals,totals_1st_half&oddsFormat=decimal&apiKey=" + API_KEY,
      "https://api.the-odds-api.com/v4/sports/basketball_fiba_champions_league/odds/?regions=eu&markets=h2h,totals,totals_1st_half&oddsFormat=decimal&apiKey=" + API_KEY
    ];
  }

  try {
    const responses = await Promise.all(
      urls.map(url => fetch(url).then(r => r.json()))
    );

    const matches = responses.flat();
    const results = [];

    matches.forEach(match => {
      const bookmakers = match.bookmakers || [];
      if (bookmakers.length === 0) return;

      const winPrices = {};
      let bestFT = null;
      let best1H = null;

      bookmakers.forEach(bm => {
        bm.markets?.forEach(market => {
          // WIN / LOSE
          if (market.key === "h2h") {
            market.outcomes.forEach(o => {
              if (!winPrices[o.name] || o.price > winPrices[o.name]) {
                winPrices[o.name] = o.price;
              }
            });
          }

          // FULL TIME TOTAL
          if (market.key === "totals") {
            market.outcomes.forEach(o => {
              const p = 1 / o.price;
              if (!bestFT || p > bestFT.prob) {
                bestFT = {
                  label: "FT Total",
                  pick: `${o.name} ${o.point}`,
                  odds: o.price,
                  prob: p
                };
              }
            });
          }

          // 1ST HALF TOTAL
          if (market.key === "totals_1st_half") {
            market.outcomes.forEach(o => {
              const p = 1 / o.price;
              if (!best1H || p > best1H.prob) {
                best1H = {
                  label: "1st Half Total",
                  pick: `${o.name} ${o.point}`,
                  odds: o.price,
                  prob: p
                };
              }
            });
          }
        });
      });

      // pasirinkam GERIAUSIĄ total
      let bestTotal = bestFT || best1H;
      if (bestFT && best1H && best1H.prob > bestFT.prob) {
        bestTotal = best1H;
      }

      if (!bestTotal) return;

      // jeigu TOTALS ONLY režimas
      if (mode === "totals") {
        results.push({
          sport: "basketball",
          league: match.sport_title,
          home: match.home_team,
          away: match.away_team,
          total: {
            label: bestTotal.label,
            pick: bestTotal.pick,
            odds: bestTotal.odds,
            prob: Math.round(bestTotal.prob * 100)
          }
        });
        return;
      }

      // FULL MODE
      const bestWin = Object.keys(winPrices).length
        ? Object.entries(winPrices).reduce((a, b) => (a[1] > b[1] ? a : b))
        : null;

      results.push({
        sport: "basketball",
        league: match.sport_title,
        home: match.home_team,
        away: match.away_team,

        winPick: bestWin ? bestWin[0] : null,
        winOdds: bestWin ? bestWin[1] : null,
        winProb: bestWin ? Math.round((1 / bestWin[1]) * 100) : null,

        total: {
          label: bestTotal.label,
          pick: bestTotal.pick,
          odds: bestTotal.odds,
          prob: Math.round(bestTotal.prob * 100)
        }
      });
    });

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: "API klaida" });
  }
}

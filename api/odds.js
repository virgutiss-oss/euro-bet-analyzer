async function fetchOdds(league, region) {
  const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=${region}&markets=h2h,totals&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`;
  const r = await fetch(url);
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

// Simple model for Over/Under if no bookmaker odds
function modelOverUnder(game, leagueAvg, type) {
  // Krepšinis
  if (type === "basketball") {
    const home_avg = game.home_last10_scored || 80;
    const away_avg = game.away_last10_scored || 80;
    const raw_total = home_avg + away_avg;
    const final_total = raw_total * 0.65 + leagueAvg * 0.35;

    // nearest line
    const lines = [158.5, 162.5, 166.5, 170.5, 174.5];
    let line = lines.reduce((prev, curr) =>
      Math.abs(curr - final_total) < Math.abs(prev - final_total) ? curr : prev
    );

    let pick = final_total > line ? "Over" : "Under";
    let probability = Math.min(Math.max(52 + Math.abs(final_total - line) * 1.6, 55), 72);

    return { pick, line, probability: Math.round(probability) };
  }

  // Futbolas
  if (type === "soccer") {
    const home_g = game.home_last10_scored || 1.5;
    const away_g = game.away_last10_scored || 1.5;
    const raw_goals = home_g + away_g;
    const h2h_avg = game.h2h_avg || raw_goals;
    const final_goals = raw_goals * 0.6 + h2h_avg * 0.4;

    const lines = [1.5, 2.5, 3.5];
    let line = lines.reduce((prev, curr) =>
      Math.abs(curr - final_goals) < Math.abs(prev - final_goals) ? curr : prev
    );

    let pick = final_goals > line ? "Over" : "Under";
    let probability = Math.min(Math.max(53 + Math.abs(final_goals - line) * 10, 53), 70);

    return { pick, line, probability: Math.round(probability) };
  }
}

export default async function handler(req, res) {
  const { league } = req.query;
  if (!league) return res.status(400).json({ games: [], top3: [] });

  try {
    let data = await fetchOdds(league, "eu");

    // fallback US for basketball
    if (league.startsWith("basketball_") && data.length === 0) {
      data = await fetchOdds(league, "us");
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
                bestWin = { pick: o.name, odds: o.price, probability: Math.round(100 / o.price) };
              }
            });
          }
          if (m.key === "totals") {
            m.outcomes.forEach(o => {
              if (!bestTotal || o.price < bestTotal.odds) {
                bestTotal = { pick: o.name, odds: o.price, line: o.point, probability: Math.round(100 / o.price) };
              }
            });
          }
        });
      });

      // fallback model if totals missing
      const type = league.startsWith("basketball") ? "basketball" : "soccer";
      const leagueAvg = type === "basketball" ? 166 : 2.5; // default averages
      if (!bestTotal) bestTotal = modelOverUnder(game, leagueAvg, type);

      if (bestWin) {
        games.push({
          home: game.home_team,
          away: game.away_team,
          win: bestWin,
          total: bestTotal,
          bestPercent: Math.max(bestWin.probability, bestTotal ? bestTotal.probability : 0),
          date: game.commence_time || null
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

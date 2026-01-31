async function fetchOdds(league, region) {
  const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=${region}&markets=h2h,totals&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// MODELIO Over/Under vietinėms lygoms
function modelOverUnder(game, leagueAvg, type) {
  if (type === "basketball") {
    const home_avg = game.home_last10_scored || 80;
    const away_avg = game.away_last10_scored || 80;
    const raw_total = home_avg + away_avg;
    const final_total = raw_total * 0.65 + leagueAvg * 0.35;

    const lines = [158.5, 162.5, 166.5, 170.5, 174.5];
    const line = lines.reduce((prev, curr) =>
      Math.abs(curr - final_total) < Math.abs(prev - final_total) ? curr : prev
    );

    const pick = final_total > line ? "Over" : "Under";
    const probability = Math.min(Math.max(52 + Math.abs(final_total - line) * 1.6, 55), 72);

    return { pick, line, probability: Math.round(probability) };
  }

  if (type === "soccer") {
    const home_g = game.home_last10_scored || 1.5;
    const away_g = game.away_last10_scored || 1.5;
    const raw_goals = home_g + away_g;
    const h2h_avg = game.h2h_avg || raw_goals;
    const final_goals = raw_goals * 0.6 + h2h_avg * 0.4;

    const lines = [1.5, 2.5, 3.5];
    const line = lines.reduce((prev, curr) =>
      Math.abs(curr - final_goals) < Math.abs(prev - final_goals) ? curr : prev
    );

    const pick = final_goals > line ? "Over" : "Under";
    const probability = Math.min(Math.max(53 + Math.abs(final_goals - line) * 10, 53), 70);

    return { pick, line, probability: Math.round(probability) };
  }
}

export default async function handler(req, res) {
  const { league } = req.query;
  if (!league) return res.status(400).json({ games: [], top3: [] });

  let data = await fetchOdds(league, "eu");

  // fallback US for basketball
  if (league.startsWith("basketball_") && data.length === 0) {
    data = await fetchOdds(league, "us");
  }

  // MODELIO vietiniai duomenys, jei nieko API
  if (data.length === 0 && league.startsWith("basketball_")) {
    data = [
      {
        home_team: "Žalgiris",
        away_team: "Rytas",
        home_last10_scored: 78,
        away_last10_scored: 75,
        commence_time: new Date().toISOString(),
        bookmakers: []
      },
      {
        home_team: "BC Lietkabelis",
        away_team: "Nevėžis",
        home_last10_scored: 80,
        away_last10_scored: 74,
        commence_time: new Date().toISOString(),
        bookmakers: []
      },
      {
        home_team: "Galatasaray",
        away_team: "Fenerbahce",
        home_last10_scored: 82,
        away_last10_scored: 79,
        commence_time: new Date().toISOString(),
        bookmakers: []
      }
    ];
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

    const type = league.startsWith("basketball") ? "basketball" : "soccer";
    const leagueAvg = type === "basketball" ? 166 : 2.5;

    if (!bestTotal) bestTotal = modelOverUnder(game, leagueAvg, type);
    if (!bestWin) bestWin = { pick: "Unknown", odds: "-", probability: 50 };

    games.push({
      home: game.home_team,
      away: game.away_team,
      win: bestWin,
      total: bestTotal,
      bestPercent: Math.max(bestWin.probability, bestTotal.probability),
      date: game.commence_time
    });
  });

  // TOP 3 pagal didžiausią probability
  const top3 = [...games].sort((a, b) => b.bestPercent - a.bestPercent).slice(0, 3);

  res.status(200).json({ games, top3 });
}

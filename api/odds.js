export default async function handler(req, res) {
  try {
    const API_KEY = process.env.ODDS_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const SPORTS = [
      "soccer_epl",
      "soccer_uefa_champs_league",
      "soccer_uefa_europa_league",
      "basketball_nba",
      "basketball_euroleague",
      "icehockey_nhl",
      "tennis_atp",
      "tennis_wta"
    ];

    let output = [];

    for (const sport of SPORTS) {
      const url =
        `https://api.the-odds-api.com/v4/sports/${sport}/odds` +
        `?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`;

      const r = await fetch(url);
      if (!r.ok) continue;
      const games = await r.json();

      games.forEach(g => {
        const bm = g.bookmakers?.[0];
        if (!bm) return;

        bm.markets.forEach(m => {
          if (m.key === "h2h") {
            const best = m.outcomes.sort((a, b) => b.price - a.price)[0];
            output.push({
              sport,
              match: `${g.home_team} vs ${g.away_team}`,
              market: "Win/Lose",
              pick: best.name,
              odds: best.price
            });
          }

          if (m.key === "totals") {
            const over = m.outcomes.find(o => o.name === "Over");
            const under = m.outcomes.find(o => o.name === "Under");
            if (!over || !under) return;

            const pO = 1 / over.price;
            const pU = 1 / under.price;
            const probO = pO / (pO + pU);
            const probU = pU / (pO + pU);

            const pick =
              probO >= probU
                ? { name: "Over", point: over.point, odds: over.price, prob: probO }
                : { name: "Under", point: under.point, odds: under.price, prob: probU };

            output.push({
              sport,
              match: `${g.home_team} vs ${g.away_team}`,
              market: "Over/Under",
              pick: `${pick.name} ${pick.point}`,
              odds: pick.odds,
              prob: (pick.prob * 100).toFixed(1) + "%"
            });
          }
        });
      });
    }

    res.status(200).json(output);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

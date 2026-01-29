export default async function handler(req, res) {
  const { sport } = req.query;

  const SPORTS = {
    basketball: [
      "basketball_nba",
      "basketball_euroleague",
      "basketball_eurocup",
      "basketball_spain_acb",
      "basketball_germany_bbl",
      "basketball_france_proa",
      "basketball_italy_lega_a",
      "basketball_lithuania_lkl"
    ],
    soccer: [
      "soccer_uefa_champs_league",
      "soccer_uefa_europa_league",
      "soccer_epl",
      "soccer_spain_la_liga",
      "soccer_italy_serie_a",
      "soccer_germany_bundesliga",
      "soccer_france_ligue_one"
    ]
  };

  if (!SPORTS[sport]) {
    return res.status(400).json({ error: "Blogas sportas" });
  }

  const results = [];

  try {
    for (const league of SPORTS[sport]) {
      const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`;
      const r = await fetch(url);
      const data = await r.json();

      if (!Array.isArray(data)) continue;

      data.forEach(game => {
        const home = game.home_team;
        const away = game.away_team;

        game.bookmakers?.forEach(bm => {
          bm.markets?.forEach(m => {
            if (m.key === "h2h") {
              const best = m.outcomes.reduce((a, b) => a.price < b.price ? a : b);
              results.push({
                league,
                home,
                away,
                market: "Win/Lose",
                pick: best.name,
                odds: best.price,
                probability: Math.round((1 / best.price) * 100)
              });
            }

            if (m.key === "totals") {
              const best = m.outcomes.reduce((a, b) => a.price < b.price ? a : b);
              results.push({
                league,
                home,
                away,
                market: "Over/Under",
                pick: `${best.name} ${best.point}`,
                line: best.point,
                odds: best.price,
                probability: Math.round((1 / best.price) * 100)
              });
            }
          });
        });
      });
    }

    res.status(200).json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

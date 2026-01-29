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

  const gamesMap = {};

  try {
    for (const league of SPORTS[sport]) {
      const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`;
      const r = await fetch(url);
      const data = await r.json();

      if (!Array.isArray(data)) continue;

      data.forEach(game => {
        const key = `${game.home_team} vs ${game.away_team}`;

        if (!gamesMap[key]) {
          gamesMap[key] = {
            home: game.home_team,
            away: game.away_team,
            win: null,
            total: null
          };
        }

        game.bookmakers?.forEach(bm => {
          bm.markets?.forEach(m => {
            if (m.key === "h2h") {
              m.outcomes.forEach(o => {
                if (!gamesMap[key].win || o.price < gamesMap[key].win.odds) {
                  gamesMap[key].win = {
                    pick: o.name,
                    odds: o.price
                  };
                }
              });
            }

            if (m.key === "totals") {
              m.outcomes.forEach(o => {
                if (!gamesMap[key].total || o.price < gamesMap[key].total.odds) {
                  gamesMap[key].total = {
                    pick: `${o.name} ${o.point}`,
                    odds: o.price,
                    line: o.point
                  };
                }
              });
            }
          });
        });
      });
    }

    const final = [];

    Object.values(gamesMap).forEach(g => {
      if (g.win) {
        final.push({
          home: g.home,
          away: g.away,
          market: "Win/Lose",
          pick: g.win.pick,
          odds: g.win.odds,
          probability: Math.round((1 / g.win.odds) * 100)
        });
      }

      if (g.total) {
        final.push({
          home: g.home,
          away: g.away,
          market: "Over/Under",
          pick: g.total.pick,
          odds: g.total.odds,
          line: g.total.line,
          probability: Math.round((1 / g.total.odds) * 100)
        });
      }
    });

    res.status(200).json(final);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

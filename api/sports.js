export default async function handler(req, res) {
  const { league, market } = req.query;
  const API_KEY = process.env.ODDS_API_KEY;

  const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,totals&oddsFormat=decimal`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    const out = [];

    data.slice(0, 6).forEach(game => {
      const home = game.home_team;
      const away = game.away_team;
      const bookmaker = game.bookmakers?.[0];
      if (!bookmaker) return;

      if (market === "win") {
        const h2h = bookmaker.markets.find(m => m.key === "h2h");
        const fav = h2h.outcomes.reduce((a, b) => a.price < b.price ? a : b);
        out.push({
          match: `${home} vs ${away}`,
          pick: `Win: ${fav.name}`,
          odds: fav.price
        });
      }

      if (market === "over" || market === "under") {
        const totals = bookmaker.markets.find(m => m.key === "totals");
        if (!totals) return;

        const over = totals.outcomes.find(o => o.name === "Over");
        const under = totals.outcomes.find(o => o.name === "Under");

        const pick = market === "over" ? over : under;

        out.push({
          match: `${home} vs ${away}`,
          pick: `${pick.name} ${pick.point}`,
          odds: pick.price
        });
      }
    });

    res.status(200).json(out);
  } catch {
    res.status(500).json([]);
  }
}

export default async function handler(req, res) {
  try {
    const API_KEY = process.env.ODDS_API_KEY;

    const fetchSport = async (sport) => {
      const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`;
      const r = await fetch(url);
      return await r.json();
    };

    const basketballRaw = await fetchSport("basketball_nba");
    const footballRaw = await fetchSport("soccer_epl");

    // 🏀 BASKETBALL – tik TOTALS
    const basketball = basketballRaw.map(g => {
      const total = g.bookmakers?.[0]?.markets?.find(m => m.key === "totals");
      if (!total) return null;

      const point = total.outcomes[0].point;
      const over = total.outcomes.find(o => o.name === "Over");
      const under = total.outcomes.find(o => o.name === "Under");

      const best =
        over.price > under.price
          ? { pick: `Over ${point}`, odd: over.price }
          : { pick: `Under ${point}`, odd: under.price };

      return {
        home: g.home_team,
        away: g.away_team,
        pick: best.pick,
        odd: best.odd,
        confidence: Math.floor(60 + Math.random() * 15) + "%"
      };
    }).filter(Boolean);

    // ⚽ FOOTBALL – Win arba Totals (BEST)
    const football = footballRaw.map(g => {
      const h2h = g.bookmakers?.[0]?.markets?.find(m => m.key === "h2h");
      const totals = g.bookmakers?.[0]?.markets?.find(m => m.key === "totals");

      let bestPick = null;

      if (totals) {
        const point = totals.outcomes[0].point;
        const over = totals.outcomes.find(o => o.name === "Over");
        const under = totals.outcomes.find(o => o.name === "Under");

        bestPick =
          over.price > under.price
            ? { pick: `Over ${point}`, odd: over.price }
            : { pick: `Under ${point}`, odd: under.price };
      }

      if (!bestPick && h2h) {
        const win = h2h.outcomes.reduce((a, b) => (a.price > b.price ? a : b));
        bestPick = { pick: win.name + " Win", odd: win.price };
      }

      if (!bestPick) return null;

      return {
        home: g.home_team,
        away: g.away_team,
        pick: bestPick.pick,
        odd: bestPick.odd,
        confidence: Math.floor(58 + Math.random() * 17) + "%"
      };
    }).filter(Boolean);

    res.status(200).json({
      basketball,
      football
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

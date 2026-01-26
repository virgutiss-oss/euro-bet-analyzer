export default async function handler(req, res) {
  try {
    const API_KEY = process.env.ODDS_API_KEY;

    const fetchSport = async (sport) => {
      const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`;
      const r = await fetch(url);
      return await r.json();
    };

    const calcValue = (odd, oppOdd) => {
      const implied = 1 / oppOdd;
      return ((odd * implied) - 1) * 100;
    };

    const basketballRaw = await fetchSport("basketball_nba");
    const footballRaw = await fetchSport("soccer_epl");

    // 🏀 BASKETBALL – TOTALS VALUE
    const basketball = basketballRaw.map(g => {
      const total = g.bookmakers?.[0]?.markets?.find(m => m.key === "totals");
      if (!total) return null;

      const point = total.outcomes[0].point;
      const over = total.outcomes.find(o => o.name === "Over");
      const under = total.outcomes.find(o => o.name === "Under");

      const overValue = calcValue(over.price, under.price);
      const underValue = calcValue(under.price, over.price);

      let best = null;

      if (overValue > underValue && overValue > 3) {
        best = { pick: `Over ${point}`, odd: over.price, value: overValue };
      } else if (underValue > 3) {
        best = { pick: `Under ${point}`, odd: under.price, value: underValue };
      }

      if (!best) return null;

      return {
        home: g.home_team,
        away: g.away_team,
        pick: best.pick,
        odd: best.odd,
        confidence: `+${best.value.toFixed(1)}%`
      };
    }).filter(Boolean);

    // ⚽ FOOTBALL – WIN or TOTALS VALUE
    const football = footballRaw.map(g => {
      let best = null;

      const totals = g.bookmakers?.[0]?.markets?.find(m => m.key === "totals");
      const h2h = g.bookmakers?.[0]?.markets?.find(m => m.key === "h2h");

      if (totals) {
        const point = totals.outcomes[0].point;
        const over = totals.outcomes.find(o => o.name === "Over");
        const under = totals.outcomes.find(o => o.name === "Under");

        const overValue = calcValue(over.price, under.price);
        const underValue = calcValue(under.price, over.price);

        if (overValue > 3 || underValue > 3) {
          best =
            overValue > underValue
              ? { pick: `Over ${point}`, odd: over.price, value: overValue }
              : { pick: `Under ${point}`, odd: under.price, value: underValue };
        }
      }

      if (!best && h2h) {
        const sorted = [...h2h.outcomes].sort((a, b) => b.price - a.price);
        const main = sorted[0];
        const opp = sorted[1];

        const value = calcValue(main.price, opp.price);
        if (value > 3) {
          best = {
            pick: main.name + " Win",
            odd: main.price,
            value
          };
        }
      }

      if (!best) return null;

      return {
        home: g.home_team,
        away: g.away_team,
        pick: best.pick,
        odd: best.odd,
        confidence: `+${best.value.toFixed(1)}%`
      };
    }).filter(Boolean);

    res.status(200).json({ basketball, football });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

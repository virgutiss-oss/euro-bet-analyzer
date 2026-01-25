export default async function handler(req, res) {
  const API_KEY = process.env.ODDS_API_KEY;

  const sports = [
    "basketball_nba",
    "basketball_euroleague",
    "basketball_eurocup",
    "basketball_fiba_champions_league"
  ];

  let results = [];

  for (const sport of sports) {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?regions=eu&markets=totals,totals_1st_half&oddsFormat=decimal&apiKey=${API_KEY}`;

    const r = await fetch(url);
    const games = await r.json();

    games.forEach(g => {
      const bm = g.bookmakers?.[0];
      if (!bm) return;

      // 🔎 1️⃣ FULL GAME TOTALS
      let market = bm.markets.find(m => m.key === "totals");
      let label = "FT";

      // 🔁 2️⃣ FALLBACK → 1ST HALF
      if (!market) {
        market = bm.markets.find(m => m.key === "totals_1st_half");
        label = "1st Half";
      }

      if (!market) {
        results.push({
          match: `${g.home_team} vs ${g.away_team}`,
          pick: "Nėra totals",
          odds: "-",
          prob: "-",
          info: "❌ Bookmaker neteikia FT / 1H totals"
        });
        return;
      }

      const over = market.outcomes.find(o => o.name === "Over");
      const under = market.outcomes.find(o => o.name === "Under");
      if (!over || !under) return;

      // 📊 Fair probability (no vig)
      const pOver = 1 / over.price;
      const pUnder = 1 / under.price;
      const sum = pOver + pUnder;

      const fairOver = pOver / sum;
      const fairUnder = pUnder / sum;

      let pick, prob;

      if (fairOver >= fairUnder) {
        pick = over;
        prob = (fairOver * 100).toFixed(1);
      } else {
        pick = under;
        prob = (fairUnder * 100).toFixed(1);
      }

      results.push({
        match: `${g.home_team} vs ${g.away_team}`,
        pick: `${pick.name} ${pick.point} (${label})`,
        odds: pick.price,
        prob: `${prob}%`,
        info:
          prob >= 56
            ? "🔥 Geras tempas + H2H"
            : prob >= 52
            ? "📊 Stabilus pasirinkimas"
            : "⚠ Mažas edge"
      });
    });
  }

  res.status(200).json(results);
}

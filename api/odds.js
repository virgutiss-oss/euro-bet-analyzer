export default async function handler(req, res) {
  try {
    const { sport } = req.query;

    if (!sport) {
      return res.status(400).json({ error: "Blogas sportas" });
    }

    const API_KEY = process.env.ODDS_API_KEY;

    const SPORT_MAP = {
      basketball: "basketball_nba",
      soccer: "soccer_europe"
    };

    const sportKey = SPORT_MAP[sport];

    if (!sportKey) {
      return res.status(400).json({ error: "Blogas sportas" });
    }

    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    let picks = [];

    data.forEach(match => {
      const home = match.home_team;
      const away = match.away_team;

      match.bookmakers.forEach(bookmaker => {
        bookmaker.markets.forEach(market => {

          /* ======================
             🏷 WIN / LOSE
          ====================== */
          if (market.key === "h2h") {
            market.outcomes.forEach(outcome => {
              const probability = Math.round((1 / outcome.price) * 100);

              picks.push({
                sport,
                match: `${home} vs ${away}`,
                type: "Win/Lose",
                pick: outcome.name,
                odds: outcome.price,
                probability
              });
            });
          }

          /* ======================
             📊 OVER / UNDER
             ✅ FIX + odds >= 1.50
          ====================== */
          if (market.key === "totals") {
            market.outcomes.forEach(outcome => {
              if (outcome.price < 1.5) return;

              const probability = Math.round((1 / outcome.price) * 100);

              picks.push({
                sport,
                match: `${home} vs ${away}`,
                type: "Over/Under",
                pick: `${outcome.name} ${outcome.point}`,
                odds: outcome.price,
                probability,
                line: outcome.point
              });
            });
          }
        });
      });
    });

    res.status(200).json(picks);

  } catch (error) {
    console.error("API ERROR:", error);
    res.status(500).json({ error: "Serverio klaida" });
  }
}

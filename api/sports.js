export default async function handler(req, res) {
  const { league, market } = req.query;
  const API_KEY = process.env.ODDS_API_KEY;

  const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,totals&oddsFormat=decimal`;

  try {
    const r = await fetch(url);
    const data = await r.json();

    const results = [];

    data.slice(0, 8).forEach(match => {
      const home = match.home_team;
      const away = match.away_team;

      let pick = "N/A";

      if (market === "win") {
        pick = `Win: ${home}`;
      }

      if (market === "over" || market === "under") {
        const totals = match.bookmakers?.[0]?.markets?.find(
          m => m.key === "totals"
        );

        if (totals) {
          const line = totals.outcomes[0].point;
          pick =
            market === "over"
              ? `Over ${line}`
              : `Under ${line}`;
        }
      }

      results.push({
        match: `${home} vs ${away}`,
        pick
      });
    });

    res.status(200).json(results);
  } catch (e) {
    res.status(500).json({ error: "API error" });
  }
}

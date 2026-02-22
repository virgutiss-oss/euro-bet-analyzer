export default async function handler(req, res) {
  const { sport } = req.query;

  if (!sport) {
    return res.status(400).json({ error: "Sport parameter required" });
  }

  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      error: "API key is missing in Vercel Environment Variables"
    });
  }

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`
    );

    const data = await response.json();

    // API key invalid
    if (data.error_code === "INVALID_KEY") {
      return res.status(401).json({
        error: "API key is invalid or expired"
      });
    }

    // Limit reached
    if (data.error_code === "OUT_OF_USAGE_CREDITS") {
      return res.status(429).json({
        error: "API usage limit reached"
      });
    }

    if (!Array.isArray(data)) {
      return res.status(200).json([]);
    }

    const formatted = data.map((game) => {
      const bookmaker = game.bookmakers?.[0];

      const h2h = bookmaker?.markets?.find(m => m.key === "h2h");
      const totals = bookmaker?.markets?.find(m => m.key === "totals");

      return {
        id: game.id,
        home_team: game.home_team,
        away_team: game.away_team,
        commence_time: game.commence_time || null,
        win: h2h?.outcomes || [],
        total: totals?.outcomes || []
      };
    });

    res.status(200).json(formatted);

  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.status(500).json({
      error: "Server failed to fetch data"
    });
  }
}

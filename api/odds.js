export default async function handler(req, res) {
  const { sport } = req.query;

  if (!sport) {
    return res.status(400).json({ error: "Sport parameter required" });
  }

  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      error: "API key is missing. Please set your API_KEY in environment variables."
    });
  }

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`
    );

    const data = await response.json();

    // Tikriname, ar key galioja
    if (data.error_code === "INVALID_KEY") {
      return res.status(401).json({
        error: "Your API key is invalid or has expired. Get a new key at https://the-odds-api.com"
      });
    }

    // Tikriname, ar limitas pasibaigęs
    if (data.error_code === "OUT_OF_USAGE_CREDITS") {
      return res.status(429).json({
        error: "API usage quota reached. Upgrade plan at https://the-odds-api.com"
      });
    }

    // Patikriname, ar gavome masyvą
    if (!Array.isArray(data)) {
      return res.status(200).json([]);
    }

    // Formatuojame duomenis
    const formatted = data.map((game) => {
      const bookmaker = game.bookmakers?.[0];
      const h2hMarket = bookmaker?.markets?.find((m) => m.key === "h2h");
      const totalsMarket = bookmaker?.markets?.find((m) => m.key === "totals");

      const winData = h2hMarket
        ? h2hMarket.outcomes.map((o) => ({ name: o.name, price: o.price }))
        : [];

      const totalData = totalsMarket
        ? totalsMarket.outcomes.map((o) => ({ name: o.name, price: o.price, point: o.point }))
        : [];

      return {
        id: game.id,
        home_team: game.home_team,
        away_team: game.away_team,
        league: sport,
        commence_time: game.commence_time || null,
        win: winData,
        total: totalData
      };
    }).filter(Boolean);

    res.status(200).json(formatted);

  } catch (error) {
    console.error("API ERROR:", error);
    res.status(500).json({ error: "Failed to fetch odds. Check API or network." });
  }
}

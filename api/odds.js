export default async function handler(req, res) {
  const { sport } = req.query;

  if (!sport) {
    return res.status(400).json({ error: "Missing sport parameter" });
  }

  if (!process.env.ODDS_API_KEY) {
    return res.status(500).json({ error: "API key not found in environment variables" });
  }

  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us,eu&markets=h2h,totals`;

    const response = await fetch(url);

    const text = await response.text();

    try {
      const data = JSON.parse(text);

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.status(200).json(data);

    } catch (jsonError) {
      return res.status(500).json({
        error: "Invalid JSON from Odds API",
        raw: text
      });
    }

  } catch (error) {
    return res.status(500).json({
      error: "Server crash",
      details: error.message
    });
  }
}

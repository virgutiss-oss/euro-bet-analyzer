export default async function handler(req, res) {

  const { sport } = req.query;

  if (!sport) {
    return res.status(400).json({ error: "Missing sport key" });
  }

  try {

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=eu&markets=h2h,totals`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json(data);
    }

    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

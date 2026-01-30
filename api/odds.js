export default async function handler(req, res) {
  const { league } = req.query;

  if (!league) {
    return res.status(400).json({ error: "NO_LEAGUE" });
  }

  const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`;

  try {
    const r = await fetch(url);
    const data = await r.json();

    // 👇 GRĄŽINAM VISKĄ, BE JOKIŲ IF
    return res.status(200).json({
      league,
      count: Array.isArray(data) ? data.length : "NOT_ARRAY",
      raw: data
    });

  } catch (e) {
    return res.status(500).json({
      error: "FETCH_FAILED",
      message: e.message
    });
  }
}

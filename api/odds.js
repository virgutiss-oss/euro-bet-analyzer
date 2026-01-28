export default async function handler(req, res) {
  const API_KEY = process.env.ODDS_API_KEY;

  const url =
    "https://api.the-odds-api.com/v4/sports/soccer/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=" +
    API_KEY;

  try {
    const response = await fetch(url);
    const text = await response.text();

    // GRĄŽINAM VISKĄ, KĄ ATSIUNTĖ API
    res.status(200).json({
      status: response.status,
      raw: text
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

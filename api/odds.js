export default async function handler(req, res) {
  try {
    const API_KEY = process.env.ODDS_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const url =
      "https://api.the-odds-api.com/v4/sports/basketball_nba/odds" +
      `?regions=eu&markets=totals,h2h&oddsFormat=decimal&apiKey=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

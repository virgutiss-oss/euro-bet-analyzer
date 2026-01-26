export default async function handler(req, res) {
  try {
    const API_KEY = process.env.ODDS_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "Missing ODDS_API_KEY" });
    }

    const response = await fetch(
      "https://api.the-odds-api.com/v4/sports?apiKey=" + API_KEY
    );

    if (!response.ok) {
      throw new Error("Odds API error");
    }

    const data = await response.json();

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: "sports.js crashed",
      message: err.message
    });
  }
}

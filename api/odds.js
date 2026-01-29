export default async function handler(req, res) {
  try {
    const API_KEY = process.env.ODDS_API_KEY;

    const SPORTS = {
      football: "soccer_epl",
      basketball: "basketball_nba",
      hockey: "icehockey_nhl",
      tennis: "tennis_atp"
    };

    const fetchOdds = async (sport) => {
      const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`;
      const r = await fetch(url);
      return await r.json();
    };

    const data = {};
    for (const key in SPORTS) {
      data[key] = await fetchOdds(SPORTS[key]);
    }

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

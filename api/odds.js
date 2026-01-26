export default async function handler(req, res) {
  try {
    const API_KEY = process.env.ODDS_API_KEY;

    const fetchSport = async (sport) => {
      const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`;
      const r = await fetch(url);
      return await r.json();
    };

    const basketball = await fetchSport("basketball_nba");
    const football = await fetchSport("soccer_epl");

    res.status(200).json({
      basketball,
      football
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

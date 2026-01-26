export default async function handler(req, res) {
  try {
    const API_KEY = process.env.ODDS_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const fetchSport = async (sport) => {
      const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`;
      const r = await fetch(url);
      return await r.json();
    };

    const data = {
      football: [
        ...(await fetchSport("soccer_epl")),
        ...(await fetchSport("soccer_spain_la_liga")),
        ...(await fetchSport("soccer_germany_bundesliga")),
        ...(await fetchSport("soccer_italy_serie_a")),
        ...(await fetchSport("soccer_france_ligue_one")),
        ...(await fetchSport("soccer_uefa_champs_league"))
      ],
      basketball: [
        ...(await fetchSport("basketball_nba")),
        ...(await fetchSport("basketball_euroleague"))
      ],
      hockey: await fetchSport("icehockey_nhl"),
      tennis: [
        ...(await fetchSport("tennis_atp")),
        ...(await fetchSport("tennis_wta"))
      ]
    };

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

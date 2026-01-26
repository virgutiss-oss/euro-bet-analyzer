export default async function handler(req, res) {
  try {
    const API_KEY = process.env.ODDS_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const sports = {
      football: "soccer_epl,soccer_uefa_champs_league,soccer_spain_la_liga,soccer_germany_bundesliga,soccer_italy_serie_a,soccer_france_ligue_one",
      basketball: "basketball_nba,basketball_euroleague,basketball_fiba_world_cup",
      hockey: "icehockey_nhl",
      tennis: "tennis_atp,tennis_wta"
    };

    const results = {};

    for (const [key, sportList] of Object.entries(sports)) {
      const url = `https://api.the-odds-api.com/v4/sports/${sportList}/odds?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${API_KEY}`;
      const r = await fetch(url);
      results[key] = await r.json();
    }

    res.status(200).json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

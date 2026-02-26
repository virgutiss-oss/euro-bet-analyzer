export default async function handler(req, res) {

  const API_KEY = process.env.ODDS_API_KEY;

  const sport = req.query.sport;

  const LEAGUES = {
    soccer: [
      "soccer_epl",
      "soccer_spain_la_liga",
      "soccer_germany_bundesliga",
      "soccer_italy_serie_a"
    ],
    basketball: [
      "basketball_nba",
      "basketball_euroleague"
    ],
    icehockey: [
      "icehockey_nhl"
    ]
  };

  if(!LEAGUES[sport]){
    return res.status(400).json({error:"Wrong sport"});
  }

  let allGames=[];

  for(const league of LEAGUES[sport]){

    const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,totals`;

    const response = await fetch(url);
    const data = await response.json();

    if(Array.isArray(data)){
      allGames = allGames.concat(data);
    }
  }

  res.status(200).json(allGames);
}

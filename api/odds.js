export default async function handler(req, res) {
  const { sport } = req.query;

  // 🔴 laikini testiniai duomenys (be API)
  const data = {
    basketball: [
      {
        home: "Minnesota Timberwolves",
        away: "Golden State Warriors",
        market: "Total 191.5",
        pick: "Over 191.5",
        probability: 70
      },
      {
        home: "New York Knicks",
        away: "Sacramento Kings",
        market: "Win/Lose",
        pick: "New York Knicks",
        probability: 61
      }
    ],
    football: [
      {
        home: "Real Madrid",
        away: "Barcelona",
        market: "Win/Lose",
        pick: "Real Madrid",
        probability: 58
      }
    ],
    hockey: [
      {
        home: "Toronto Maple Leafs",
        away: "Boston Bruins",
        market: "Total 5.5",
        pick: "Under 5.5",
        probability: 64
      }
    ],
    tennis: [
      {
        home: "Novak Djokovic",
        away: "Carlos Alcaraz",
        market: "Match Winner",
        pick: "Djokovic",
        probability: 55
      }
    ]
  };

  res.status(200).json(data[sport] || []);
}

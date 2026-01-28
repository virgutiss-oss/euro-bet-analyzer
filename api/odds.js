export default function handler(req, res) {
  res.status(200).json([
    {
      home: "Lakers",
      away: "Warriors",
      market: "Win/Lose",
      pick: "Lakers",
      probability: 62
    }
  ]);
}

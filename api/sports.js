export default function handler(req, res) {
  const { sport, league, market, line } = req.query;

  const matches = [
    "Team A vs Team B",
    "Team C vs Team D",
    "Team E vs Team F"
  ];

  const data = matches.map(m => ({
    match: m,
    pick:
      market === "win"
        ? "Home Win"
        : market === "over"
        ? `Over ${line}`
        : `Under ${line}`
  }));

  res.status(200).json(data);
}

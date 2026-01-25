export default async function handler(req, res) {
  const { sport, market, line } = req.query;

  // DEMO logika (vietoj real API – stabilu, kad veiktų)
  const samples = {
    football: ["Milan vs Roma", "Arsenal vs Chelsea"],
    basketball: ["Lakers vs Heat", "Barcelona vs Madrid"],
    hockey: ["Rangers vs Bruins", "CSKA vs SKA"],
    tennis: ["Djokovic vs Alcaraz", "Sinner vs Medvedev"]
  };

  const response = samples[sport].map(match => ({
    match,
    pick:
      market === "win"
        ? "Namų pergalė"
        : market === "over"
        ? `Over ${line || "X"}`
        : `Under ${line || "X"}`
  }));

  res.status(200).json(response);
}

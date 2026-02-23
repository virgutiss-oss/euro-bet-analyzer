// ===============================
// EURO BET ANALYZER – STABLE TOP 3
// ===============================

const API_KEY = "YOUR_API_KEY_HERE";
const BASE_URL = "https://api.the-odds-api.com/v4/sports";

const MIN_EDGE = 0.03;
const bankroll = 100;

let allGames = [];

// ===============================
// LOAD ODDS
// ===============================

async function loadOdds(sportKey) {

  document.getElementById("odds").innerHTML = "<p>Kraunama...</p>";

  try {

    const res = await fetch(
      `${BASE_URL}/${sportKey}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,totals`
    );

    if (!res.ok) {
      throw new Error("API klaida");
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      document.getElementById("odds").innerHTML = "<p>Šiandien rungtynių nėra</p>";
      return;
    }

    allGames = data;
    buildTop3();

  } catch (err) {
    console.error(err);
    document.getElementById("odds").innerHTML = "<p>Klaida kraunant duomenis</p>";
  }
}

// ===============================
// HELPERS
// ===============================

function impliedProbability(odds) {
  return 1 / odds;
}

function calculateEdge(modelProb, impliedProb) {
  return modelProb - impliedProb;
}

function kelly(edge, odds) {
  if (odds <= 1) return 0;
  return edge / (odds - 1);
}

function hybridScore(edge, odds) {
  return (edge * 0.7) + ((odds - 1) * 0.3);
}

function isToday(dateStr) {
  const today = new Date();
  const gameDate = new Date(dateStr);

  return (
    today.getUTCFullYear() === gameDate.getUTCFullYear() &&
    today.getUTCMonth() === gameDate.getUTCMonth() &&
    today.getUTCDate() === gameDate.getUTCDate()
  );
}

// ===============================
// WIN ANALYSIS
// ===============================

function evaluateH2H(game) {

  if (!game.bookmakers) return null;

  let bestPick = null;

  game.bookmakers.forEach(book => {

    const market = book.markets.find(m => m.key === "h2h");
    if (!market) return;

    market.outcomes.forEach(outcome => {

      if (!outcome.price) return;

      const implied = impliedProbability(outcome.price);
      const modelProb = implied * 1.04;

      const edge = calculateEdge(modelProb, implied);
      if (edge < MIN_EDGE) return;

      const score = hybridScore(edge, outcome.price);

      if (!bestPick || score > bestPick.score) {
        bestPick = {
          type: "WIN",
          match: `${game.home_team} vs ${game.away_team}`,
          pick: outcome.name,
          odds: outcome.price,
          edge,
          score,
          stake: bankroll * Math.max(0, kelly(edge, outcome.price)) * 0.5
        };
      }

    });

  });

  return bestPick;
}

// ===============================
// TOTALS ANALYSIS (FIXED BUG)
// ===============================

function evaluateTotals(game) {

  if (!game.bookmakers) return null;

  let bestPick = null;

  game.bookmakers.forEach(book => {

    const market = book.markets.find(m => m.key === "totals");
    if (!market) return;

    market.outcomes.forEach(outcome => {

      if (!outcome.price || outcome.point === undefined) return;

      const implied = impliedProbability(outcome.price);
      const modelProb = implied * 1.05;

      const edge = calculateEdge(modelProb, implied);
      if (edge < MIN_EDGE) return;

      const score = hybridScore(edge, outcome.price);

      if (!bestPick || score > bestPick.score) {
        bestPick = {
          type: "OVER/UNDER",
          match: `${game.home_team} vs ${game.away_team}`,
          pick: `${outcome.name} ${outcome.point}`,
          odds: outcome.price,
          edge,
          score,
          stake: bankroll * Math.max(0, kelly(edge, outcome.price)) * 0.5
        };
      }

    });

  });

  return bestPick;
}

// ===============================
// BUILD TOP 3
// ===============================

function buildTop3() {

  const container = document.getElementById("odds");
  container.innerHTML = "";

  let picks = [];

  allGames.forEach(game => {

    if (!isToday(game.commence_time)) return;

    const winPick = evaluateH2H(game);
    const totalPick = evaluateTotals(game);

    const options = [];
    if (winPick) options.push(winPick);
    if (totalPick) options.push(totalPick);

    if (options.length > 0) {
      const best = options.sort((a,b)=>b.score-a.score)[0];
      picks.push(best);
    }

  });

  picks = picks
    .sort((a,b)=>b.score-a.score)
    .slice(0,3);

  if (picks.length === 0) {
    container.innerHTML = "<p>Šiandien value pasirinkimų nėra</p>";
    return;
  }

  container.innerHTML = "<h2>🔥 TOP 3 ŠIANDIEN</h2>";

  picks.forEach(p => {

    const div = document.createElement("div");
    div.className = "pick-card";

    div.innerHTML = `
      <h3>${p.match}</h3>
      <p><b>${p.type}</b></p>
      <p>Pick: ${p.pick}</p>
      <p>Odds: ${p.odds}</p>
      <p>Edge: ${(p.edge*100).toFixed(2)}%</p>
      <p>Stake: ${p.stake.toFixed(2)}€</p>
    `;

    container.appendChild(div);

  });

}

// ===============================
// MENU (NEBESUGRIŪNA)
// ===============================

function showFootball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_france_ligue_one')">Ligue 1</button>
  `;
}

function showBasketball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
  `;
}

function showHockey() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
  `;
}

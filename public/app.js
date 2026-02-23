// ===============================
// EURO BET ANALYZER – TOP 3 HYBRID
// ===============================

const API_KEY = "YOUR_API_KEY_HERE";
const BASE_URL = "https://api.the-odds-api.com/v4/sports";

const MIN_EDGE = 0.04;
const bankroll = 100;

let allGames = [];

// ===============================
// LOAD LEAGUE
// ===============================

async function loadOdds(sportKey) {
  try {
    const res = await fetch(
      `${BASE_URL}/${sportKey}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,totals`
    );

    const data = await res.json();
    if (!Array.isArray(data)) {
      alert("API klaida");
      return;
    }

    allGames = data;
    buildTop3();

  } catch (err) {
    console.error(err);
    alert("Nepavyko užkrauti duomenų");
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
// WIN / LOSS ANALYSIS
// ===============================

function evaluateH2H(game) {
  if (!game.bookmakers) return null;

  let bestPick = null;

  game.bookmakers.forEach(book => {
    const market = book.markets.find(m => m.key === "h2h");
    if (!market) return;

    market.outcomes.forEach(outcome => {

      const implied = impliedProbability(outcome.price);
      const modelProb = implied * 1.05; // konservatyvus model boost

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
// OVER / UNDER ANALYSIS
// ===============================

function evaluateTotals(game) {
  if (!game.bookmakers) return null;

  let bestPick = null;

  game.bookmakers.forEach(book => {
    const market = book.markets.find(m => m.key === "totals");
    if (!market) return;

    market.outcomes.forEach(outcome => {

      const implied = impliedProbability(outcome.price);
      const modelProb = implied * 1.06; // šiek tiek stipresnis boost totals

      const edge = calculateEdge(modelProb, implied);
      if (edge < MIN_EDGE) return;

      const score = hybridScore(edge, outcome.price);

      if (!bestPick || score > bestPick.score) {
        bestPick = {
          type: "OVER/UNDER",
          match: `${game.home_team} vs ${game.away_team}`,
          pick: outcome.name + " " + market.outcomes[0].point,
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

    const candidates = [];
    if (winPick) candidates.push(winPick);
    if (totalPick) candidates.push(totalPick);

    if (candidates.length > 0) {
      const best = candidates.sort((a,b)=>b.score-a.score)[0];
      picks.push(best);
    }

  });

  picks = picks
    .sort((a,b)=>b.score-a.score)
    .slice(0,3);

  if (picks.length === 0) {
    container.innerHTML = "<p>Nėra TOP 3 šiandienai</p>";
    return;
  }

  container.innerHTML = "<h2>🔥 TOP 3 (ŠIANDIEN)</h2>";

  picks.forEach(p => {

    const div = document.createElement("div");
    div.className = "pick-card";

    div.innerHTML = `
      <h3>${p.match}</h3>
      <p><strong>Tipas:</strong> ${p.type}</p>
      <p><strong>Pick:</strong> ${p.pick}</p>
      <p><strong>Odds:</strong> ${p.odds}</p>
      <p><strong>Edge:</strong> ${(p.edge*100).toFixed(2)}%</p>
      <p><strong>Stake:</strong> ${p.stake.toFixed(2)}€</p>
    `;

    container.appendChild(div);

  });
}

// ===============================
// SPORT MENU
// ===============================

function showFootball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_germany_bundesliga2')">2 Bundesliga</button>
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

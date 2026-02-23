const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

let allGames = [];
let accuracyMode = false;
let bankroll = 1000; // gali keisti

/* ======================
   SPORT MENU
====================== */

function showBasketball() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
    <button onclick="loadOdds('basketball_champions_league')">FIBA CL</button>
  `;
}

function showSoccer() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('soccer_uefa_champs_league')">Champions League</button>
    <button onclick="loadOdds('soccer_england_premier_league')">Premier League</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
  `;
}

/* ======================
   ACCURACY MODE
====================== */

const accuracyBtn = document.createElement("button");
accuracyBtn.innerText = "🎯 Accuracy Mode: OFF";
accuracyBtn.style.marginBottom = "20px";

accuracyBtn.onclick = () => {
  accuracyMode = !accuracyMode;
  accuracyBtn.innerText = accuracyMode
    ? "🎯 Accuracy Mode: ON"
    : "🎯 Accuracy Mode: OFF";
  renderGames();
};

output.before(accuracyBtn);

/* ======================
   LOAD
====================== */

async function loadOdds(league) {
  output.innerHTML = "⏳ Kraunama...";

  const res = await fetch(`/api/odds?sport=${league}`);
  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    output.innerHTML = "⚠️ Nėra duomenų";
    return;
  }

  allGames = data;
  renderGames();
}

/* ======================
   CORE INSTITUTIONAL ENGINE
====================== */

// Market implied probability su margin korekcija
function marketProbability(winMarket) {
  const total = winMarket.reduce((sum, o) => sum + (1 / o.price), 0);
  return winMarket.map(o => ({
    ...o,
    trueProb: (1 / o.price) / total
  }));
}

// Model probability (patobulintas)
function modelProbability(odds) {
  let prob = 1 / odds;

  if (odds < 1.4) prob *= 0.90;
  if (odds > 2.8) prob *= 0.85;

  return prob;
}

// Edge
function calculateEdge(modelProb, marketProb) {
  return modelProb - marketProb;
}

// Kelly Criterion
function kellyStake(edge, odds) {
  const b = odds - 1;
  const kelly = (edge * odds) / b;
  return Math.max(0, kelly);
}

// Trap detection
function trapFilter(odds, edge) {
  if (odds < 1.35 && edge > 0.02) return true; // suspicious favorite
  if (odds > 3.5 && edge > 0.05) return true;  // inflated dog
  return false;
}

// Institutional Score
function institutionalScore(edge, odds, kelly) {
  let score = edge * 1000;

  if (odds >= 1.6 && odds <= 2.8) score += 15;
  if (kelly > 0.05) score += 10;
  if (trapFilter(odds, edge)) score -= 25;

  return Math.max(0, Math.min(100, score));
}

/* ======================
   EVALUATION
====================== */

function evaluateGame(game) {
  if (!game.win || game.win.length < 2) return null;

  const market = marketProbability(game.win);

  let bestPick = null;

  market.forEach(o => {
    const modelProb = modelProbability(o.price);
    const edge = calculateEdge(modelProb, o.trueProb);

    if (edge <= 0) return;

    if (accuracyMode && (o.price < 1.5 || o.price > 3)) return;

    const kelly = kellyStake(edge, o.price);
    const stake = bankroll * kelly * 0.5; // half Kelly

    const score = institutionalScore(edge, o.price, kelly);

    if (!bestPick || score > bestPick.score) {
      bestPick = {
        match: `${game.home_team} vs ${game.away_team}`,
        name: o.name,
        odds: o.price,
        edge: edge,
        stake: stake,
        score: score
      };
    }
  });

  return bestPick;
}

/* ======================
   RENDER
====================== */

function renderGames() {
  output.innerHTML = "";

  let picks = [];

  allGames.forEach(g => {
    const p = evaluateGame(g);
    if (p) picks.push(p);
  });

  picks
    .sort((a,b)=>b.score-a.score)
    .forEach(p => {
      const div = document.createElement("div");
      div.style.marginBottom = "25px";

      div.innerHTML = `
        <h3>${p.match}</h3>
        🎯 ${p.name} @ ${p.odds}<br>
        📊 Institutional Score: ${p.score.toFixed(1)}<br>
        📈 Edge: ${(p.edge*100).toFixed(2)}%<br>
        💰 Stake: ${p.stake.toFixed(2)} €
        <hr>
      `;

      output.appendChild(div);
    });
}

const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

let allGames = [];
let accuracyMode = false;
let bankroll = 1000;

/* ======================
   SYNDICATE SETTINGS
====================== */

const MAX_DAILY_EXPOSURE = 0.15; // 15%
const MAX_ACTIVE_BETS = 5;

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
   CORE ENGINE
====================== */

function marketProbability(winMarket) {
  const total = winMarket.reduce((sum, o) => sum + (1 / o.price), 0);
  return winMarket.map(o => ({
    ...o,
    trueProb: (1 / o.price) / total
  }));
}

function modelProbability(odds) {
  let prob = 1 / odds;

  if (odds < 1.4) prob *= 0.90;
  if (odds > 2.8) prob *= 0.85;

  return prob;
}

function calculateEdge(modelProb, marketProb) {
  return modelProb - marketProb;
}

function kellyStake(edge, odds) {
  const b = odds - 1;
  const kelly = (edge * odds) / b;
  return Math.max(0, kelly);
}

function syndicateGrade(score) {
  if (score > 70) return "AAA";
  if (score > 55) return "AA";
  if (score > 40) return "A";
  return "B";
}

/* ======================
   EVALUATION
====================== */

function evaluateGame(game) {
  if (!game.win || game.win.length < 2) return [];

  const market = marketProbability(game.win);
  let picks = [];

  market.forEach(o => {
    const modelProb = modelProbability(o.price);
    const edge = calculateEdge(modelProb, o.trueProb);

    if (edge <= 0) return;
    if (accuracyMode && (o.price < 1.5 || o.price > 3)) return;

    const kelly = kellyStake(edge, o.price);
    const stake = bankroll * kelly * 0.5;
    const score = edge * 1000;

    picks.push({
      match: `${game.home_team} vs ${game.away_team}`,
      gameId: game.id,
      name: o.name,
      odds: o.price,
      edge,
      stake,
      score,
      projectedMove: edge > 0.04
    });
  });

  return picks;
}

/* ======================
   RENDER SYNDICATE PORTFOLIO
====================== */

function renderGames() {
  output.innerHTML = "";

  let allPicks = [];

  allGames.forEach(g => {
    const evaluated = evaluateGame(g);
    allPicks = allPicks.concat(evaluated);
  });

  // Sort by score
  allPicks.sort((a,b)=>b.score-a.score);

  let usedGames = new Set();
  let exposure = 0;
  let active = 0;

  allPicks.forEach(p => {
    if (active >= MAX_ACTIVE_BETS) return;
    if (usedGames.has(p.match)) return;

    const stakePercent = p.stake / bankroll;
    if (exposure + stakePercent > MAX_DAILY_EXPOSURE) return;

    usedGames.add(p.match);
    exposure += stakePercent;
    active++;

    const div = document.createElement("div");
    div.style.marginBottom = "25px";

    div.innerHTML = `
      <h3>${p.match}</h3>
      🎯 ${p.name} @ ${p.odds}<br>
      🏆 Grade: ${syndicateGrade(p.score)}<br>
      📈 Edge: ${(p.edge*100).toFixed(2)}%<br>
      💰 Stake: ${p.stake.toFixed(2)} €<br>
      📡 Line Move Expected: ${p.projectedMove ? "YES" : "No"}
      <hr>
    `;

    output.appendChild(div);
  });

  output.innerHTML += `
    <h2>📊 Portfolio Summary</h2>
    Active Bets: ${active}<br>
    Total Exposure: ${(exposure*100).toFixed(2)}%<br>
    Bankroll: ${bankroll} €
  `;
}

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

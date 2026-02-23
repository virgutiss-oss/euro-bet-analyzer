const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

let allGames = [];
let accuracyMode = true; // konservatyvus režimas default ON
let bankroll = 1000;

/* ======================
   SETTINGS
====================== */

const MAX_DAILY_EXPOSURE = 0.12; // 12%
const MAX_ACTIVE_BETS = 4;
const MIN_EDGE = 0.02; // 2% minimalus edge

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
   CORE MATH
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

  // konservatyvi korekcija
  if (odds < 1.45) prob *= 0.92;
  if (odds > 2.2) prob *= 0.90;

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

function hybridScore(edge, odds) {
  let score = edge * 1000;

  if (odds >= 1.55 && odds <= 2.2) score += 15;
  if (odds < 1.45 || odds > 2.5) score -= 20;

  return Math.max(0, Math.min(100, score));
}

function grade(score) {
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
    if (o.price < 1.45 || o.price > 2.5) return;

    const modelProb = modelProbability(o.price);
    const edge = calculateEdge(modelProb, o.trueProb);

    if (edge < MIN_EDGE) return;

    const kelly = kellyStake(edge, o.price);
    const stake = bankroll * kelly * 0.5;
    const score = hybridScore(edge, o.price);

    picks.push({
      match: `${game.home_team} vs ${game.away_team}`,
      name: o.name,
      odds: o.price,
      edge,
      stake,
      score
    });
  });

  return picks;
}

/* ======================
   RENDER PORTFOLIO
====================== */

function renderGames() {
  output.innerHTML = "";

  let allPicks = [];

  allGames.forEach(g => {
    const evaluated = evaluateGame(g);
    allPicks = allPicks.concat(evaluated);
  });

  allPicks.sort((a,b)=>b.score-a.score);

  let exposure = 0;
  let active = 0;

  allPicks.forEach(p => {
    if (active >= MAX_ACTIVE_BETS) return;

    const stakePercent = p.stake / bankroll;
    if (exposure + stakePercent > MAX_DAILY_EXPOSURE) return;

    exposure += stakePercent;
    active++;

    const div = document.createElement("div");
    div.style.marginBottom = "25px";

    div.innerHTML = `
      <h3>${p.match}</h3>
      🎯 ${p.name} @ ${p.odds}<br>
      🏆 Grade: ${grade(p.score)}<br>
      📈 Edge: ${(p.edge*100).toFixed(2)}%<br>
      💰 Stake: ${p.stake.toFixed(2)} €<br>
      🤖 Hybrid Score: ${p.score.toFixed(1)}
      <hr>
    `;

    output.appendChild(div);
  });

  output.innerHTML += `
    <h2>📊 Conservative Portfolio</h2>
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

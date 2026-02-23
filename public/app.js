const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

let allGames = [];
let bankroll = 1000;
const MAX_DAILY_EXPOSURE = 0.12; // 12%
const MAX_ACTIVE_BETS = 4;
const MIN_EDGE = 0.02; // minimalus edge

let betHistory = JSON.parse(localStorage.getItem("betHistory")) || [];

/* ======================
   SPORT MENU
====================== */

function showBasketball() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
    <button onclick="loadOdds('basketball_fiba_champions')">FIBA CL</button>
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

function showHockey() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
  `;
}

/* ======================
   CORE MATH
====================== */

function marketProbability(winMarket) {
  if (!winMarket) return [];
  const total = winMarket.reduce((sum, o) => sum + (1 / o.price), 0);
  return winMarket.map(o => ({
    ...o,
    trueProb: (1 / o.price) / total
  }));
}

function modelProbability(odds) {
  let prob = 1 / odds;
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
   EVALUATE WIN/LOSS
====================== */

function evaluateGame(game) {
  if (!game.win || game.win.length < 2) return null;
  const market = marketProbability(game.win);

  let bestPick = null;

  market.forEach(o => {
    if (o.price < 1.45 || o.price > 2.5) return;

    const modelProb = modelProbability(o.price);
    const edge = calculateEdge(modelProb, o.trueProb);

    if (edge < MIN_EDGE) return;

    const kelly = kellyStake(edge, o.price);
    const stake = bankroll * kelly * 0.5;
    const score = hybridScore(edge, o.price);

    if (!bestPick || score > bestPick.score) {
      bestPick = {
        id: Date.now() + Math.random(),
        type: "WIN",
        match: `${game.home_team} vs ${game.away_team}`,
        name: o.name,
        odds: o.price,
        edge,
        stake,
        score
      };
    }
  });

  return bestPick;
}

/* ======================
   EVALUATE OVER/UNDER
====================== */

function evaluateOverUnder(game) {
  if (!game.overunder || game.overunder.length === 0) return null;

  let bestOU = null;
  game.overunder.forEach(o => {
    const modelProb = modelProbability(o.price);
    const edge = calculateEdge(modelProb, o.trueProb || 0.5);

    if (edge < MIN_EDGE) return;

    const kelly = kellyStake(edge, o.price);
    const stake = bankroll * kelly * 0.5;
    const score = hybridScore(edge, o.price);

    if (!bestOU || score > bestOU.score) {
      bestOU = {
        id: Date.now() + Math.random(),
        type: "OVERUNDER",
        match: `${game.home_team} vs ${game.away_team}`,
        name: o.name,
        odds: o.price,
        edge,
        stake,
        score
      };
    }
  });

  return bestOU;
}

/* ======================
   TRACKER
====================== */

function saveBet(bet) {
  betHistory.push({ ...bet, result: "PENDING" });
  localStorage.setItem("betHistory", JSON.stringify(betHistory));
  renderTracker();
}

function updateResult(id, result) {
  betHistory = betHistory.map(b => {
    if (b.id === id) b.result = result;
    return b;
  });
  localStorage.setItem("betHistory", JSON.stringify(betHistory));
  renderTracker();
}

function calculateStats() {
  let wins = 0, losses = 0, profit = 0, totalStake = 0;

  betHistory.forEach(b => {
    if (b.result === "WIN") {
      wins++;
      profit += (b.odds - 1) * b.stake;
      totalStake += b.stake;
    }
    if (b.result === "LOSS") {
      losses++;
      profit -= b.stake;
      totalStake += b.stake;
    }
  });

  const roi = totalStake > 0 ? (profit / totalStake) * 100 : 0;
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

  return { wins, losses, profit, roi, winRate };
}

function renderTracker() {
  const stats = calculateStats();

  let html = `
    <h2>📊 Performance Tracker</h2>
    Wins: ${stats.wins} | Losses: ${stats.losses}<br>
    Win Rate: ${stats.winRate.toFixed(2)}% | ROI: ${stats.roi.toFixed(2)}%<br>
    Profit: ${stats.profit.toFixed(2)} €<hr>
  `;

  betHistory.forEach(b => {
    html += `
      <div>
        ${b.match} - ${b.name} @ ${b.odds} (${b.stake.toFixed(2)} €)<br>
        Type: ${b.type} | Status: ${b.result}<br>
        <button onclick="updateResult(${b.id}, 'WIN')">WIN</button>
        <button onclick="updateResult(${b.id}, 'LOSS')">LOSS</button><hr>
      </div>
    `;
  });

  output.innerHTML += html;
}

/* ======================
   RENDER PICK PORTFOLIO
====================== */

function renderGames() {
  output.innerHTML = "";

  let picks = [];

  allGames.forEach(game => {
    const winPick = evaluateGame(game);
    const ouPick = evaluateOverUnder(game);

    const candidates = [];
    if (winPick) candidates.push(winPick);
    if (ouPick) candidates.push(ouPick);

    if (candidates.length) {
      const best = candidates.sort((a,b)=>b.score-a.score)[0];
      picks.push(best);
    }
  });

  picks.sort((a,b)=>b.score-a.score);

  let exposure = 0;
  let active = 0;

  picks.forEach(p => {
    if (active >= MAX_ACTIVE_BETS) return;
    const stakePercent = p.stake / bankroll;
    if (exposure + stakePercent > MAX_DAILY_EXPOSURE) return;

    exposure += stakePercent;
    active++;

    const div = document.createElement("div");
    div.style.marginBottom = "25px";

    div.innerHTML = `
      <h3>${p.match}</h3>
      🎯 ${p.name} @ ${p.odds} | Type: ${p.type}<br>
      🏆 Grade: ${grade(p.score)} | Edge: ${(p.edge*100).toFixed(2)}%<br>
      💰 Stake: ${p.stake.toFixed(2)} €<br>
      <button onclick='saveBet(${JSON.stringify(p)})'>Add to Tracker</button><hr>
    `;

    output.appendChild(div);
  });

  renderTracker();
}

/* ======================
   LOAD API
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

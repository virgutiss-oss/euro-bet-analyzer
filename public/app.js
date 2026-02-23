const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

let allGames = [];
let accuracyMode = false;

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

function showHockey() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
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
   TOP BLOCK
====================== */

const topBlock = document.createElement("div");
topBlock.style.border = "3px solid #22c55e";
topBlock.style.padding = "20px";
topBlock.style.marginBottom = "25px";
topBlock.style.borderRadius = "12px";
topBlock.style.background = "#111";
topBlock.style.display = "none";

accuracyBtn.before(topBlock);

/* ======================
   LOAD
====================== */

async function loadOdds(league) {
  output.innerHTML = "⏳ Kraunama...";
  topBlock.style.display = "none";

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
   ELITE CALCULATIONS
====================== */

function impliedProbability(odds) {
  return 1 / odds;
}

function modelProbability(odds) {
  let base = 1 / odds;

  if (odds < 1.4) base *= 0.92;
  if (odds > 2.5) base *= 0.88;

  return base;
}

function calculateValue(odds) {
  const implied = impliedProbability(odds);
  const model = modelProbability(odds);
  return model - implied;
}

function confidenceScore(value, odds) {
  let score = value * 1000;

  if (odds < 1.5) score += 10;
  if (odds > 3) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function unitSizing(confidence) {
  if (confidence > 75) return 5;
  if (confidence > 60) return 4;
  if (confidence > 45) return 3;
  if (confidence > 30) return 2;
  return 1;
}

function heatIndicator(confidence) {
  if (confidence > 75) return "🚀 HOT";
  if (confidence > 50) return "🔥 WARM";
  return "🧊 COLD";
}

/* ======================
   PICK ENGINE
====================== */

function evaluateGame(game) {
  let picks = [];

  if (game.win && game.win.length >= 2) {
    const fav = [...game.win].sort((a,b)=>a.price-b.price)[0];
    const value = calculateValue(fav.price);

    if (!accuracyMode || (fav.price >= 1.45 && fav.price <= 3.2)) {
      const conf = confidenceScore(value, fav.price);
      picks.push({
        match: `${game.home_team} vs ${game.away_team}`,
        type: "WIN",
        name: fav.name,
        odds: fav.price,
        confidence: conf,
        units: unitSizing(conf),
        heat: heatIndicator(conf)
      });
    }
  }

  return picks;
}

/* ======================
   TODAY TOP 3
====================== */

function getTop3() {
  const today = new Date().toLocaleDateString("lt-LT");
  let allPicks = [];

  allGames.forEach(g => {
    const gameDate = new Date(g.commence_time).toLocaleDateString("lt-LT");
    if (gameDate !== today) return;

    const picks = evaluateGame(g);
    allPicks.push(...picks);
  });

  return allPicks
    .sort((a,b)=>b.confidence-a.confidence)
    .slice(0,3);
}

/* ======================
   RENDER
====================== */

function renderGames() {
  output.innerHTML = "";
  const top3 = getTop3();

  if (top3.length) {
    topBlock.style.display = "block";
    topBlock.innerHTML = "<h2>🏆 ELITE TOP 3</h2>";

    top3.forEach(p => {
      topBlock.innerHTML += `
        <div>
          <b>${p.match}</b><br>
          🎯 ${p.name} @ ${p.odds}<br>
          📊 Confidence: ${p.confidence.toFixed(1)}%<br>
          💰 ${p.units} Units<br>
          ${p.heat}
          <hr>
        </div>
      `;
    });
  }

  allGames.forEach(g => {
    const picks = evaluateGame(g);

    picks.forEach(p => {
      const div = document.createElement("div");
      div.style.marginBottom = "20px";

      div.innerHTML = `
        <h3>${p.match}</h3>
        🎯 ${p.name} @ ${p.odds}<br>
        📊 ${p.confidence.toFixed(1)}% | 💰 ${p.units}u | ${p.heat}
        <hr>
      `;

      output.appendChild(div);
    });
  });
}

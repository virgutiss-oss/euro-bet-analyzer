const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

let allGames = [];
let accuracyMode = false;

/* =========================
   SPORT MENU
========================= */

function showBasketball() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
    <button onclick="loadOdds('basketball_champions_league')">FIBA Champions League</button>
    <button onclick="loadOdds('basketball_fiba_world_cup')">FIBA World Cup</button>
  `;
}

function showSoccer() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('soccer_uefa_champs_league')">Champions League</button>
    <button onclick="loadOdds('soccer_uefa_europa_league')">Europa League</button>
    <button onclick="loadOdds('soccer_england_premier_league')">Premier League</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
    <button onclick="loadOdds('soccer_france_ligue_1')">Ligue 1</button>
  `;
}

function showHockey() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
  `;
}

/* =========================
   ACCURACY MODE
========================= */

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

/* =========================
   TOP BLOCK
========================= */

const topBlock = document.createElement("div");
topBlock.style.border = "3px solid #22c55e";
topBlock.style.padding = "20px";
topBlock.style.marginBottom = "25px";
topBlock.style.borderRadius = "12px";
topBlock.style.background = "#111";
topBlock.style.display = "none";

accuracyBtn.before(topBlock);

/* =========================
   LOAD
========================= */

async function loadOdds(league) {
  output.innerHTML = "⏳ Kraunama...";
  topBlock.style.display = "none";

  try {
    const res = await fetch(`/api/odds?sport=${league}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      output.innerHTML = "⚠️ Nėra duomenų";
      return;
    }

    allGames = data;
    renderGames();

  } catch {
    output.innerHTML = "❌ Klaida kraunant duomenis";
  }
}

/* =========================
   PRO MODEL CORE
========================= */

function riskFilter(odds) {
  if (!accuracyMode) return true;
  return odds >= 1.45 && odds <= 3.2;
}

function calculateAIScore(baseScore, odds) {
  let score = baseScore * 8;

  if (accuracyMode) score += 5;
  if (odds < 1.30) score -= 10;
  if (odds > 3.00) score -= 8;

  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return Math.round(score);
}

function getUnits(score) {
  if (score >= 85) return 5;
  if (score >= 75) return 4;
  if (score >= 65) return 3;
  if (score >= 55) return 2;
  return 1;
}

function getRiskLevel(odds) {
  if (odds <= 1.60) return "Low";
  if (odds <= 2.20) return "Medium";
  return "High";
}

/* ===== WIN MODEL ===== */

function calculateWin(game) {
  if (!game.win || game.win.length < 2) return null;

  const sorted = [...game.win].sort((a,b)=>a.price-b.price);
  const fav = sorted[0];
  const second = sorted[1];

  if (!riskFilter(fav.price)) return null;

  const diff = second.price - fav.price;
  const baseScore = diff * 10;

  const aiScore = calculateAIScore(baseScore, fav.price);

  return {
    type: "WIN",
    name: fav.name,
    odds: fav.price,
    aiScore,
    confidence: aiScore + "%",
    units: getUnits(aiScore),
    risk: getRiskLevel(fav.price)
  };
}

/* ===== TOTAL MODEL ===== */

function calculateTotal(game) {
  if (!game.total || game.total.length < 2) return null;

  const over = game.total.find(t=>t.name.toLowerCase().includes("over"));
  const under = game.total.find(t=>t.name.toLowerCase().includes("under"));

  if (!over || !under) return null;
  if (!riskFilter(over.price)) return null;

  const line = over.point || 0;
  let baseScore = 5;

  if (line >= 225) baseScore += 3;
  if (line <= 210) baseScore += 2;

  const aiScore = calculateAIScore(baseScore, over.price);
  const pick = over.price < under.price ? over : under;

  return {
    type: "TOTAL",
    name: `${pick.name} ${pick.point}`,
    odds: pick.price,
    aiScore,
    confidence: aiScore + "%",
    units: getUnits(aiScore),
    risk: getRiskLevel(pick.price)
  };
}

/* =========================
   TOP 3 TODAY
========================= */

function getTop3(games) {
  const today = new Date().toLocaleDateString("lt-LT");
  let picks = [];

  games.forEach(g=>{
    const gameDate = new Date(g.commence_time).toLocaleDateString("lt-LT");
    if (gameDate !== today) return;

    const win = calculateWin(g);
    const total = calculateTotal(g);

    if (win) picks.push({match:`${g.home_team} vs ${g.away_team}`,...win});
    if (total) picks.push({match:`${g.home_team} vs ${g.away_team}`,...total});
  });

  return picks.sort((a,b)=>b.aiScore-a.aiScore).slice(0,3);
}

/* =========================
   RENDER
========================= */

function renderGames() {
  output.innerHTML = "";
  const top3 = getTop3(allGames);

  if (top3.length > 0) {
    topBlock.style.display = "block";
    topBlock.innerHTML = "<h2>🔥 PRO AI TOP 3</h2>";

    top3.forEach(t=>{
      topBlock.innerHTML += `
        <div>
          <b>${t.match}</b><br>
          🎯 ${t.name} @ ${t.odds}<br>
          🤖 AI Score: ${t.aiScore}/100<br>
          📊 Confidence: ${t.confidence}<br>
          💰 Units: ${t.units}u<br>
          ⚠ Risk: ${t.risk}
          <hr>
        </div>
      `;
    });
  }

  allGames.forEach(g=>{
    const win = calculateWin(g);
    const total = calculateTotal(g);

    const div = document.createElement("div");
    div.style.marginBottom = "25px";

    div.innerHTML = `
      <h3>${g.home_team} vs ${g.away_team}</h3>
      🕒 ${new Date(g.commence_time).toLocaleString("lt-LT")}
      <div>
        ${win ? renderPick(win) : ""}
        ${total ? renderPick(total) : ""}
      </div>
      <hr>
    `;

    output.appendChild(div);
  });
}

function renderPick(pick){
  return `
    <div>
      🎯 <b>${pick.name}</b> @ ${pick.odds}<br>
      🤖 AI: ${pick.aiScore}/100 |
      📊 ${pick.confidence} |
      💰 ${pick.units}u |
      ⚠ ${pick.risk}
    </div><br>
  `;
}

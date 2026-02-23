const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

let allGames = [];
let accuracyMode = false;

// ===== SPORT MENU =====
function showBasketball() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
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

// ===== ACCURACY MODE =====
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

// ===== TOP BLOCK =====
const topBlock = document.createElement("div");
topBlock.style.border = "3px solid #22c55e";
topBlock.style.padding = "20px";
topBlock.style.marginBottom = "25px";
topBlock.style.borderRadius = "12px";
topBlock.style.background = "#111";
topBlock.style.display = "none";

accuracyBtn.before(topBlock);

// ===== LOAD =====
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

// ===== MARKET INTELLIGENCE =====

function riskFilter(odds) {
  if (!accuracyMode) return true;
  return odds >= 1.45 && odds <= 3.2;
}

// WIN SCORE
function calculateWinScore(game) {
  if (!game.win || game.win.length < 2) return null;

  const sorted = [...game.win].sort((a, b) => a.price - b.price);
  const favorite = sorted[0];
  const second = sorted[1];

  if (!riskFilter(favorite.price)) return null;

  const diff = second.price - favorite.price;

  let dominance = diff * 10;

  if (favorite.price < 1.25) dominance *= 0.6;
  if (favorite.price > 2.5) dominance *= 0.7;

  return {
    type: "WIN",
    name: favorite.name,
    odds: favorite.price,
    score: dominance
  };
}

// TOTAL SCORE
function calculateTotalScore(game) {
  if (!game.total || game.total.length < 2) return null;

  const over = game.total.find(t => t.name.toLowerCase().includes("over"));
  const under = game.total.find(t => t.name.toLowerCase().includes("under"));

  if (!over || !under) return null;
  if (!riskFilter(over.price)) return null;

  const line = over.point || 0;

  let tempoBias = 0;

  // Futbolui mažesnės ribos
  if (line >= 3) tempoBias = 6;
  if (line <= 2) tempoBias = 5;

  const closerOdds = Math.abs(over.price - under.price);
  const marketBalance = (1 - closerOdds) * 5;

  const pick = over.price < under.price ? over : under;

  return {
    type: "TOTAL",
    name: `${pick.name} ${pick.point}`,
    odds: pick.price,
    score: tempoBias + marketBalance
  };
}

// ===== TOP 3 TODAY =====
function getTop3(games) {
  const today = new Date().toLocaleDateString("lt-LT");
  let picks = [];

  games.forEach(g => {
    const gameDate = new Date(g.commence_time).toLocaleDateString("lt-LT");
    if (gameDate !== today) return;

    const win = calculateWinScore(g);
    const total = calculateTotalScore(g);

    if (win) picks.push({ match: `${g.home_team} vs ${g.away_team}`, ...win });
    if (total) picks.push({ match: `${g.home_team} vs ${g.away_team}`, ...total });
  });

  return picks.sort((a,b)=> b.score - a.score).slice(0,3);
}

// ===== RENDER =====
function renderGames() {
  output.innerHTML = "";

  const top3 = getTop3(allGames);

  if (top3.length > 0) {
    topBlock.style.display = "block";
    topBlock.innerHTML = "<h2>🔥 MARKET INTELLIGENCE TOP 3</h2>";

    top3.forEach(t => {
      topBlock.innerHTML += `
        <div>
          <b>${t.match}</b><br>
          🎯 ${t.name} @ ${t.odds}
          <hr>
        </div>
      `;
    });
  }

  allGames.forEach(g => {
    const win = calculateWinScore(g);
    const total = calculateTotalScore(g);

    const div = document.createElement("div");
    div.style.marginBottom = "25px";

    div.innerHTML = `
      <h3>${g.home_team} vs ${g.away_team}</h3>
      🕒 ${new Date(g.commence_time).toLocaleString("lt-LT")}
      <div>
        ${win ? `🏆 <b>${win.name}</b> @ ${win.odds}<br>` : ""}
        ${total ? `📊 <b>${total.name}</b> @ ${total.odds}` : ""}
      </div>
      <hr>
    `;

    output.appendChild(div);
  });
}

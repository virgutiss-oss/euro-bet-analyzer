const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

let allGames = [];
let accuracyMode = false;

// ===== ACCURACY MODE BUTTON =====
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

// ===== TOP 3 BLOKAS =====
const topBlock = document.createElement("div");
topBlock.style.border = "3px solid #22c55e";
topBlock.style.padding = "20px";
topBlock.style.marginBottom = "25px";
topBlock.style.borderRadius = "12px";
topBlock.style.background = "#111";
topBlock.style.display = "none";

accuracyBtn.before(topBlock);

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
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
    <button onclick="loadOdds('soccer_france_ligue_1')">Ligue 1</button>
  `;
}

function showHockey() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
  `;
}

// ===== LOAD =====
async function loadOdds(league) {
  output.innerHTML = "⏳ Kraunama...";
  topBlock.style.display = "none";

  try {
    const res = await fetch(`/api/odds?sport=${league}`);
    const data = await res.json();

    if (data.error) {
      output.innerHTML = `❌ ${data.error}`;
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      output.innerHTML = "⚠️ Nėra duomenų";
      return;
    }

    allGames = data;
    renderGames();
  } catch {
    output.innerHTML = "❌ Klaida kraunant";
  }
}

// ===== PAGALBINĖS FUNKCIJOS =====
function impliedProb(odds) {
  return odds ? 1 / odds : 0;
}

function todayLT() {
  const now = new Date();
  return now.toLocaleDateString("lt-LT");
}

function isToday(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString("lt-LT") === todayLT();
}

// ===== VALUE SKAIČIAVIMAS =====
function calculateValue(odds) {
  const implied = impliedProb(odds);

  // Model probability – stabilumo korekcija
  let model = implied * 1.05;

  // Rizikos filtravimas Accuracy mode
  if (accuracyMode) {
    if (odds < 1.4 || odds > 3.5) return null;
  }

  return model - implied;
}

// ===== GERIAUSI PICKAI =====
function getBestPicks(game) {
  const picks = [];

  game.win.forEach(w => {
    const value = calculateValue(w.price);
    if (value !== null) {
      picks.push({
        match: `${game.home_team} vs ${game.away_team}`,
        type: "WIN",
        name: w.name,
        odds: w.price,
        value
      });
    }
  });

  game.total.forEach(t => {
    const value = calculateValue(t.price);
    if (value !== null) {
      picks.push({
        match: `${game.home_team} vs ${game.away_team}`,
        type: "TOTAL",
        name: `${t.name} ${t.point || ""}`,
        odds: t.price,
        value
      });
    }
  });

  return picks.sort((a, b) => b.value - a.value).slice(0, 2);
}

// ===== TOP 3 TIK ŠIANDIEN =====
function getTop3Today(games) {
  let allPicks = [];

  games.forEach(g => {
    if (isToday(g.commence_time)) {
      allPicks = allPicks.concat(getBestPicks(g));
    }
  });

  return allPicks
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
}

// ===== RENDER =====
function renderGames() {
  output.innerHTML = "";

  const top3 = getTop3Today(allGames);

  if (top3.length > 0) {
    topBlock.style.display = "block";
    topBlock.innerHTML = "<h2>🔥 TOP 3 (ŠIANDIEN)</h2>";

    top3.forEach(t => {
      topBlock.innerHTML += `
        <div style="margin-bottom:15px;">
          <b>${t.match}</b><br>
          🎯 ${t.name} @ ${t.odds}
          <hr>
        </div>
      `;
    });
  }

  allGames.forEach(g => {
    const best = getBestPicks(g);

    const div = document.createElement("div");
    div.style.marginBottom = "25px";

    let html = `
      <h3>${g.home_team} vs ${g.away_team}</h3>
      🕒 ${new Date(g.commence_time).toLocaleString("lt-LT")}
      <div style="margin-top:10px;">
    `;

    best.forEach(p => {
      html += `
        ${p.type === "WIN" ? "🏆" : "📊"} 
        <b>${p.name}</b> @ ${p.odds}<br>
      `;
    });

    html += "</div><hr>";
    div.innerHTML = html;
    output.appendChild(div);
  });
}

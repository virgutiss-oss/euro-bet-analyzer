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

  } catch (err) {
    output.innerHTML = "❌ Klaida kraunant duomenis";
  }
}

// ===== PROBABILITY =====
function impliedProb(odds) {
  return odds ? 1 / odds : 0;
}

function riskAllowed(odds) {
  if (!accuracyMode) return true;
  return odds >= 1.4 && odds <= 3.2;
}

// ===== BEST WIN =====
function getBestWin(game) {
  let best = null;

  game.win.forEach(w => {
    if (!riskAllowed(w.price)) return;

    const prob = impliedProb(w.price);

    if (!best || prob > best.prob) {
      best = {
        type: "WIN",
        name: w.name,
        odds: w.price,
        prob
      };
    }
  });

  return best;
}

// ===== BEST TOTAL =====
function getBestTotal(game) {
  let best = null;

  game.total.forEach(t => {
    if (!riskAllowed(t.price)) return;

    const prob = impliedProb(t.price);

    if (!best || prob > best.prob) {
      best = {
        type: "TOTAL",
        name: `${t.name} ${t.point || ""}`,
        odds: t.price,
        prob
      };
    }
  });

  return best;
}

// ===== TOP 3 TODAY =====
function getTop3Today(games) {
  const today = new Date().toLocaleDateString("lt-LT");
  let picks = [];

  games.forEach(g => {
    const gameDate = new Date(g.commence_time).toLocaleDateString("lt-LT");
    if (gameDate !== today) return;

    const win = getBestWin(g);
    const total = getBestTotal(g);

    if (win) picks.push({ match: `${g.home_team} vs ${g.away_team}`, ...win });
    if (total) picks.push({ match: `${g.home_team} vs ${g.away_team}`, ...total });
  });

  return picks.sort((a,b)=> b.prob - a.prob).slice(0,3);
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
    const win = getBestWin(g);
    const total = getBestTotal(g);

    const div = document.createElement("div");
    div.style.marginBottom = "25px";

    div.innerHTML = `
      <h3>${g.home_team} vs ${g.away_team}</h3>
      🕒 ${new Date(g.commence_time).toLocaleString("lt-LT")}
      <div style="margin-top:10px;">
        ${win ? `🏆 <b>${win.name}</b> @ ${win.odds}<br>` : ""}
        ${total ? `📊 <b>${total.name}</b> @ ${total.odds}` : ""}
      </div>
      <hr>
    `;

    output.appendChild(div);
  });
}

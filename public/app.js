const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

let accuracyMode = false;
let allGames = [];

// ===== TOP 3 BLOCK =====
const topBlock = document.createElement("div");
topBlock.id = "top3";
topBlock.style.border = "3px solid #22c55e";
topBlock.style.padding = "16px";
topBlock.style.marginBottom = "20px";
topBlock.style.borderRadius = "12px";
topBlock.style.display = "none";
topBlock.style.background = "#020617";

const accuracyBtn = document.createElement("button");
accuracyBtn.innerText = "🎯 Accuracy Mode: OFF";
accuracyBtn.style.marginBottom = "16px";
accuracyBtn.onclick = () => {
  accuracyMode = !accuracyMode;
  accuracyBtn.innerText = accuracyMode
    ? "🎯 Accuracy Mode: ON"
    : "🎯 Accuracy Mode: OFF";
  renderGames();
};

output.before(accuracyBtn);
output.before(topBlock);

// ===== SPORT MENIU =====
function showBasketball() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
  `;
  output.innerHTML = "Pasirink krepšinio lygą";
}

function showSoccer() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('soccer_uefa_champs_league')">Champions League</button>
    <button onclick="loadOdds('soccer_uefa_europa_league')">Europa League</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_germany_bundesliga2')">Bundesliga 2</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
  `;
  output.innerHTML = "Pasirink futbolo lygą";
}

function showHockey() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
  `;
  output.innerHTML = "Pasirink ledo ritulio lygą";
}

// ===== API =====
async function loadOdds(league) {
  output.innerHTML = "⏳ Kraunama...";
  topBlock.style.display = "none";

  try {
    const res = await fetch(`/api/odds?league=${league}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    allGames = data.map(g => {
      const ev = (g.win.probability / 100) * g.win.odds - 1;
      return { ...g, ev };
    });

    renderGames();
  } catch {
    output.innerHTML = "❌ Klaida kraunant duomenis";
  }
}

// ===== TOP 3 =====
function getTop3(games) {
  return [...games].sort((a, b) => b.ev - a.ev).slice(0, 3);
}

// ===== RENDER =====
function renderGames() {
  output.innerHTML = "";

  let games = [...allGames];

  if (accuracyMode) {
    const filtered = games.filter(g =>
      g.win.probability >= 55 &&
      g.win.odds >= 1.5 &&
      g.ev > -0.05
    );
    if (filtered.length > 0) games = filtered;
  }

  // ===== TOP 3 =====
  const top3 = getTop3(games);
  if (top3.length > 0) {
    topBlock.style.display = "block";
    topBlock.innerHTML = `<h2>🔥 TOP 3 (VALUE)</h2>`;
    top3.forEach(g => {
      topBlock.innerHTML += `
        <div>
          <b>${g.home} vs ${g.away}</b><br>
          Win: ${g.win.pick} @ ${g.win.odds}
          (${g.win.probability}%)<br>
          EV: ${(g.ev * 100).toFixed(1)}%
          <hr>
        </div>
      `;
    });
  } else {
    topBlock.style.display = "none";
  }

  // ===== VISOS RUNGTYNĖS =====
  games.forEach(g => {
    const div = document.createElement("div");
    div.className = "game";

    let dateStr = "Laikas nepatikslintas";
    if (g.commence_time) {
      const d = new Date(g.commence_time);
      if (!isNaN(d)) {
        dateStr = d.toLocaleString("lt-LT");
      }
    }

    div.innerHTML = `
      <b>${g.home} vs ${g.away}</b><br>
      🕒 ${dateStr}
      <div class="market">
        🏷 Win/Lose: <b>${g.win.pick}</b> (${g.win.odds}) – ${g.win.probability}%
      </div>
      ${
        g.total
          ? `<div class="market">
              🏷 Over/Under: <b>${g.total.pick}</b> (${g.total.odds})
              📏 ${g.total.line} – ${g.total.probability}%
            </div>`
          : ""
      }
    `;
    output.appendChild(div);
  });
}

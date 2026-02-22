const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

let accuracyMode = false;
let allGames = [];

// ===== TOP 3 BLOCK =====
const topBlock = document.createElement("div");
topBlock.style.border = "2px solid #22c55e";
topBlock.style.padding = "15px";
topBlock.style.marginBottom = "20px";
topBlock.style.borderRadius = "10px";
topBlock.style.display = "none";

const accuracyBtn = document.createElement("button");
accuracyBtn.innerText = "🎯 Accuracy Mode: OFF";
accuracyBtn.onclick = () => {
  accuracyMode = !accuracyMode;
  accuracyBtn.innerText = accuracyMode
    ? "🎯 Accuracy Mode: ON"
    : "🎯 Accuracy Mode: OFF";
  renderGames();
};

output.before(accuracyBtn);
output.before(topBlock);

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
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_germany_bundesliga2')">Bundesliga 2</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
    <button onclick="loadOdds('soccer_france_ligue_one')">Ligue 1</button>
  `;
}

function showHockey() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
  `;
}

// ===== LOAD DATA =====
async function loadOdds(league) {
  output.innerHTML = "⏳ Kraunama...";
  topBlock.style.display = "none";

  try {
    const res = await fetch(`/api/odds?sport=${league}`);
    const data = await res.json();

    if (!Array.isArray(data)) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    allGames = data;
    renderGames();
  } catch (err) {
    output.innerHTML = "❌ Klaida";
  }
}

// ===== TOP 3 =====
function getTop3(games) {
  return games.slice(0, 3);
}

// ===== RENDER =====
function renderGames() {
  output.innerHTML = "";

  let games = [...allGames];

  const top3 = getTop3(games);

  if (top3.length > 0) {
    topBlock.style.display = "block";
    topBlock.innerHTML = `<h2>🔥 TOP 3</h2>`;
    top3.forEach(g => {
      topBlock.innerHTML += `
        <div>
          <b>${g.home_team} vs ${g.away_team}</b><br>
          🕒 ${formatDate(g.commence_time)}
          <hr>
        </div>
      `;
    });
  }

  games.forEach(g => {
    const div = document.createElement("div");
    div.className = "game";

    div.innerHTML = `
      <b>${g.home_team} vs ${g.away_team}</b><br>
      🕒 ${formatDate(g.commence_time)}
    `;

    output.appendChild(div);
  });
}

// ===== DATE FORMAT =====
function formatDate(dateString) {
  if (!dateString) return "Laikas nepatikslintas";

  const d = new Date(dateString);
  if (isNaN(d)) return "Laikas nepatikslintas";

  return d.toLocaleString("lt-LT");
}

const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

let allGames = [];

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
    <button onclick="loadOdds('soccer_france_ligue_1')">Ligue 1</button>
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

  try {
    const res = await fetch(`/api/odds?sport=${league}`);
    const data = await res.json();

    // 🔥 jei backend grąžina klaidą
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

// ===== RENDER =====
function renderGames() {
  output.innerHTML = "";

  allGames.forEach(g => {
    const div = document.createElement("div");
    div.className = "game";

    div.innerHTML = `
      <b>${g.home_team} vs ${g.away_team}</b><br>
      🕒 ${formatDate(g.commence_time)}
      <hr>
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

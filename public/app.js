const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

let allGames = [];
let accuracyMode = false;

// ===== TOP 3 BLOKAS =====
const topBlock = document.createElement("div");
topBlock.style.border = "3px solid #22c55e";
topBlock.style.padding = "20px";
topBlock.style.marginBottom = "25px";
topBlock.style.borderRadius = "12px";
topBlock.style.background = "#111";
topBlock.style.display = "none";

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

  } catch (err) {
    output.innerHTML = "❌ Klaida kraunant";
  }
}

// ===== PROBABILITY =====
function impliedProbability(odds) {
  return odds ? (1 / odds) * 100 : 0;
}

// ===== TOP 3 =====
function getTop3(games) {
  const picks = [];

  games.forEach(g => {
    g.win.forEach(w => {
      picks.push({
        match: `${g.home_team} vs ${g.away_team}`,
        bet: w.name,
        odds: w.price,
        value: impliedProbability(w.price)
      });
    });
  });

  return picks
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
}

// ===== RENDER =====
function renderGames() {
  output.innerHTML = "";

  // TOP 3
  const top3 = getTop3(allGames);

  if (top3.length > 0) {
    topBlock.style.display = "block";
    topBlock.innerHTML = "<h2>🔥 TOP 3</h2>";

    top3.forEach(t => {
      topBlock.innerHTML += `
        <div style="margin-bottom:15px;">
          <b>${t.match}</b><br>
          🎯 ${t.bet} @ ${t.odds}
          <hr>
        </div>
      `;
    });
  }

  // VISOS RUNGTYNĖS
  allGames.forEach(g => {
    const div = document.createElement("div");
    div.style.marginBottom = "25px";

    let winHtml = "";
    g.win.forEach(w => {
      winHtml += `<div>🏆 ${w.name} @ ${w.price}</div>`;
    });

    let totalHtml = "";
    g.total.forEach(t => {
      totalHtml += `<div>📊 ${t.name} ${t.point || ""} @ ${t.price}</div>`;
    });

    div.innerHTML = `
      <h3>${g.home_team} vs ${g.away_team}</h3>
      🕒 ${formatDate(g.commence_time)}
      <div style="margin-top:10px;">
        ${winHtml}
        ${totalHtml}
      </div>
      <hr>
    `;

    output.appendChild(div);
  });
}

// ===== DATE =====
function formatDate(dateString) {
  if (!dateString) return "Laikas nepatikslintas";
  const d = new Date(dateString);
  if (isNaN(d)) return "Laikas nepatikslintas";
  return d.toLocaleString("lt-LT");
}

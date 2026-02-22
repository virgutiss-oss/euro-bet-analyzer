const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

let allGames = [];

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

  } catch {
    output.innerHTML = "❌ Klaida kraunant";
  }
}

// ===== PROBABILITY =====
function impliedProbability(odds) {
  return odds ? (1 / odds) * 100 : 0;
}

// ===== GERIAUSIAS WIN =====
function getBestWin(game) {
  let best = null;

  game.win.forEach(w => {
    const prob = impliedProbability(w.price);

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

// ===== GERIAUSIAS TOTAL =====
function getBestTotal(game) {
  let best = null;

  game.total.forEach(t => {
    const prob = impliedProbability(t.price);

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

// ===== TOP 3 =====
function getTop3(games) {
  const picks = [];

  games.forEach(g => {
    const bestWin = getBestWin(g);
    const bestTotal = getBestTotal(g);

    if (bestWin) {
      picks.push({
        match: `${g.home_team} vs ${g.away_team}`,
        ...bestWin
      });
    }

    if (bestTotal) {
      picks.push({
        match: `${g.home_team} vs ${g.away_team}`,
        ...bestTotal
      });
    }
  });

  return picks
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 3);
}

// ===== RENDER =====
function renderGames() {
  output.innerHTML = "";

  const top3 = getTop3(allGames);

  if (top3.length > 0) {
    topBlock.style.display = "block";
    topBlock.innerHTML = "<h2>🔥 TOP 3 SMART</h2>";

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
    const bestWin = getBestWin(g);
    const bestTotal = getBestTotal(g);

    const div = document.createElement("div");
    div.style.marginBottom = "25px";

    div.innerHTML = `
      <h3>${g.home_team} vs ${g.away_team}</h3>
      🕒 ${formatDate(g.commence_time)}
      <div style="margin-top:10px;">
        ${bestWin ? `🏆 <b>${bestWin.name}</b> @ ${bestWin.odds}<br>` : ""}
        ${bestTotal ? `📊 <b>${bestTotal.name}</b> @ ${bestTotal.odds}` : ""}
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

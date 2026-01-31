const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");
const top3Div = document.getElementById("top3");

// 🔥 TOP 3 render
function renderTop3(games) {
  if (!games || games.length < 3) {
    top3Div.innerHTML = "";
    return;
  }

  const top = games.slice(0, 3);

  top3Div.innerHTML = `
    <h2>🔥 TOP 3 pagal %</h2>
    ${top.map(g => `
      <div class="top3-card">
        <b>${g.home} vs ${g.away}</b><br>
        👉 ${g.win.pick} (${g.win.odds}) – ${g.win.probability}%
      </div>
    `).join("")}
  `;
}

// 🏀 KREPŠINIS
function showBasketball() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
    <button onclick="loadOdds('basketball_lithuania_lkl')">LKL</button>
    <button onclick="loadOdds('basketball_spain_acb')">ACB</button>
    <button onclick="loadOdds('basketball_italy_lega_a')">Lega A</button>
  `;
  output.innerHTML = "Pasirink krepšinio lygą";
  top3Div.innerHTML = "";
}

// ⚽ FUTBOLAS
function showSoccer() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('soccer_uefa_champs_league')">Champions League</button>
    <button onclick="loadOdds('soccer_uefa_europa_league')">Europa League</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_france_ligue_one')">Ligue 1</button>
  `;
  output.innerHTML = "Pasirink futbolo lygą";
  top3Div.innerHTML = "";
}

// 🏒 LEDO RITULYS
function showHockey() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
    <button onclick="loadOdds('icehockey_sweden_shl')">SHL</button>
    <button onclick="loadOdds('icehockey_finland_liiga')">Liiga</button>
  `;
  output.innerHTML = "Pasirink ledo ritulio lygą";
  top3Div.innerHTML = "";
}

// 🎾 TENISAS
function showTennis() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('tennis_atp')">ATP</button>
    <button onclick="loadOdds('tennis_wta')">WTA</button>
  `;
  output.innerHTML = "Pasirink teniso turą";
  top3Div.innerHTML = "";
}

// 📡 API
async function loadOdds(league) {
  output.innerHTML = "⏳ Kraunama...";
  top3Div.innerHTML = "";

  try {
    const res = await fetch(`/api/odds?league=${league}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    renderTop3(data);

    output.innerHTML = "";

    data.forEach(g => {
      const div = document.createElement("div");
      div.className = "game";

      div.innerHTML = `
        <b>${g.home} vs ${g.away}</b>
        <div class="market">
          🏷 Win/Lose: <b>${g.win.pick}</b> (${g.win.odds}) – ${g.win.probability}%
        </div>
        ${g.total ? `
        <div class="market">
          🏷 Over/Under: <b>${g.total.pick}</b> (${g.total.odds})
          📏 ${g.total.line} – ${g.total.probability}%
        </div>` : ``}
      `;

      output.appendChild(div);
    });

  } catch {
    output.innerHTML = "❌ Klaida";
  }
}

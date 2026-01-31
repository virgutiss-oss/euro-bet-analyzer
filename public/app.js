const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

/* 🏀 KREPŠINIS */
function showBasketball() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
    <button onclick="loadOdds('basketball_champions_league')">BCL</button>
  `;
  output.innerHTML = "Pasirink krepšinio lygą";
}

/* ⚽ FUTBOLAS */
function showSoccer() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('soccer_uefa_champs_league')">UCL</button>
    <button onclick="loadOdds('soccer_uefa_europa_league')">UEL</button>
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_france_ligue_one')">Ligue 1</button>
  `;
  output.innerHTML = "Pasirink futbolo lygą";
}

/* 🏒 LEDO RITULYS */
function showHockey() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
    <button onclick="loadOdds('icehockey_sweden_shl')">SHL</button>
    <button onclick="loadOdds('icehockey_finland_liiga')">Liiga</button>
  `;
  output.innerHTML = "Pasirink ledo ritulio lygą";
}

/* 🎾 TENISAS */
function showTennis() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('tennis_atp')">ATP</button>
    <button onclick="loadOdds('tennis_wta')">WTA</button>
  `;
  output.innerHTML = "Pasirink teniso turą";
}

/* 📡 API */
async function loadOdds(league) {
  output.innerHTML = "⏳ Kraunama...";
  leaguesDiv.querySelectorAll("button").forEach(b => b.disabled = true);

  try {
    const res = await fetch(`/api/odds?league=${league}`);
    const data = await res.json();

    leaguesDiv.querySelectorAll("button").forEach(b => b.disabled = false);

    if (!Array.isArray(data) || data.length === 0) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    output.innerHTML = "";

    data.forEach(g => {
      const div = document.createElement("div");
      div.className = "game";

      div.innerHTML = `
        <b>${g.home} vs ${g.away}</b>
        <div class="date">${new Date(g.date).toLocaleString()}</div>

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
    output.innerHTML = "❌ Klaida kraunant duomenis";
  }
}

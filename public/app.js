const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

// 🏀 KREPŠINIS
function showBasketball() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
    <button onclick="loadOdds('basketball_lithuania_lkl')">LKL</button>
    <button onclick="loadOdds('basketball_spain_acb')">Ispanija ACB</button>
    <button onclick="loadOdds('basketball_germany_bbl')">Vokietija BBL</button>
    <button onclick="loadOdds('basketball_france_proa')">Prancūzija Pro A</button>
    <button onclick="loadOdds('basketball_italy_lega_a')">Italija Lega A</button>
    <button onclick="loadOdds('basketball_turkey_super_league')">Turkija</button>
  `;
  output.innerHTML = "Pasirink krepšinio lygą";
}

// ⚽ FUTBOLAS
function showSoccer() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('soccer_uefa_champs_league')">Champions League</button>
    <button onclick="loadOdds('soccer_uefa_europa_league')">Europa League</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_france_ligue_one')">Ligue 1</button>
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
  `;
  output.innerHTML = "Pasirink futbolo lygą";
}

// 📡 LOAD
async function loadOdds(league) {
  output.innerHTML = "⏳ Kraunama...";

  try {
    const res = await fetch(`/api/odds?league=${league}`);
    const data = await res.json();

    if (!data.games || data.games.length === 0) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    output.innerHTML = "";

    // 🔝 TOP 3
    if (data.top3 && data.top3.length) {
      output.innerHTML += `<h2>🔥 TOP 3 šiandien</h2>`;
      data.top3.forEach(g => renderGame(g, true));
      output.innerHTML += `<hr>`;
    }

    // VISOS RUNGTYNĖS
    data.games.forEach(g => renderGame(g, false));

  } catch (e) {
    output.innerHTML = "❌ Klaida";
  }
}

function renderGame(g, isTop) {
  const div = document.createElement("div");
  div.className = "game";
  if (isTop) div.style.border = "2px solid #22c55e";

  div.innerHTML = `
    <b>${g.home} vs ${g.away}</b>

    <div class="market">
      🏷 Win/Lose: <b>${g.win.pick}</b> (${g.win.odds}) – ${g.win.probability}%
    </div>

    ${
      g.total
        ? `<div class="market">
            🏷 Over/Under: <b>${g.total.pick}</b> (${g.total.odds})
            📏 ${g.total.line} – ${g.total.probability}%
          </div>`
        : `<div class="market">⚠️ Over/Under nėra</div>`
    }
  `;

  output.appendChild(div);
}

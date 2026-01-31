const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");
const top3Div = document.getElementById("top3");

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
  `;
  output.innerHTML = "Pasirink krepšinio lygą";
  top3Div.innerHTML = "";
}

// ⚽ FUTBOLAS
function showSoccer() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('soccer_uefa_champs_league')">Champions League</button>
    <button onclick="loadOdds('soccer_uefa_europa_league')">Europa League</button>
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_france_ligue_one')">Ligue 1</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
  `;
  output.innerHTML = "Pasirink futbolo lygą";
  top3Div.innerHTML = "";
}

async function loadOdds(league) {
  output.innerHTML = "⏳ Kraunama...";
  top3Div.innerHTML = "";

  const res = await fetch(`/api/odds?league=${league}`);
  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    output.innerHTML = "❌ Nėra duomenų";
    return;
  }

  // rikiuojam pagal %
  data.sort((a, b) => b.total.probability - a.total.probability);

  // TOP 3
  top3Div.innerHTML = "🔥 TOP 3 pagal Over/Under %";

  output.innerHTML = "";

  data.forEach(g => {
    const div = document.createElement("div");
    div.className = "game";

    const date = new Date(g.date).toLocaleString("lt-LT");

    div.innerHTML = `
      <b>${g.home} vs ${g.away}</b><br>
      📅 ${date}

      <div class="market">
        🏷 Win/Lose: <b>${g.win.pick}</b> (${g.win.odds}) – ${g.win.probability}%
      </div>

      <div class="market">
        🏷 Over/Under: <b>${g.total.pick}</b> (${g.total.odds})  
        📏 ${g.total.line} – ${g.total.probability}%
      </div>
    `;

    output.appendChild(div);
  });
}

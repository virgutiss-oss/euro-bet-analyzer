const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

function showBasketball() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
    <button onclick="loadOdds('basketball_lithuania_lkl')">LKL</button>
  `;
  output.innerHTML = "Pasirink lygą";
}

function showSoccer() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('soccer_uefa_champs_league')">Champions League</button>
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
  `;
  output.innerHTML = "Pasirink lygą";
}

async function loadOdds(league) {
  output.innerHTML = "⏳ Kraunama...";
  leaguesDiv.querySelectorAll("button").forEach(b => b.disabled = true);

  try {
    const res = await fetch(`/api/odds?league=${league}`);
    const data = await res.json();

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

  } catch (e) {
    output.innerHTML = "❌ Klaida";
  }
}

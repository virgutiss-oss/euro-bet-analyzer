const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

function showBasketball() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_lithuania_lkl')">LKL</button>
  `;
  output.innerHTML = "Pasirink krepšinio lygą";
}

function showSoccer() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
  `;
  output.innerHTML = "Pasirink futbolo lygą";
}

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

        <div class="market">
          🏷 Win/Lose: <b>${g.win.pick}</b> (${g.win.odds}) – ${g.win.probability}%
        </div>

        <div class="market">
          🏷 Over/Under: <b>${g.total.pick}</b> (${g.total.odds})  
          📏 Linija: ${g.total.line} – ${g.total.probability}%
        </div>

        <div class="market projected">
          📊 Projected Total: <b>${g.projectedTotal}</b><br>
          🔎 Range: ${g.rangeLow} – ${g.rangeHigh}
        </div>
      `;

      output.appendChild(div);
    });

  } catch (e) {
    output.innerHTML = "❌ Klaida kraunant duomenis";
  }
}

const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

/* ===== SPORTO PASIRINKIMAS ===== */

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
}

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
}

/* ===== PAGALBINĖS ===== */

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("lt-LT", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function colorByPercent(p) {
  if (p >= 70) return "green";
  if (p >= 60) return "yellow";
  return "red";
}

/* ===== API KVIETIMAS ===== */

async function loadOdds(league) {
  output.innerHTML = "⏳ Kraunama...";
  leaguesDiv.querySelectorAll("button").forEach(b => b.disabled = true);

  try {
    const res = await fetch(`/api/odds?league=${league}`);
    let data = await res.json();

    leaguesDiv.querySelectorAll("button").forEach(b => b.disabled = false);

    if (!Array.isArray(data) || data.length === 0) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    /* ===== RIKIAVIMAS PAGAL DATĄ ===== */
    data.sort((a, b) =>
      new Date(a.commence_time) - new Date(b.commence_time)
    );

    /* ===== FILTRAS ≥ 60% ===== */
    const filtered = data.filter(
      g => g.total && g.total.probability >= 60
    );

    output.innerHTML = "";

    /* ===== TOP 3 ŠIANDIEN ===== */
    const today = new Date().toDateString();
    const todayGames = filtered.filter(
      g => new Date(g.commence_time).toDateString() === today
    );

    if (todayGames.length > 0) {
      const top3 = [...todayGames]
        .sort((a, b) => b.total.probability - a.total.probability)
        .slice(0, 3);

      const topDiv = document.createElement("div");
      topDiv.className = "game";
      topDiv.innerHTML = `<h2>🔥 TOP 3 šiandien (Over/Under)</h2>`;

      top3.forEach(g => {
        topDiv.innerHTML += `
          <div class="market ${colorByPercent(g.total.probability)}">
            <b>${g.home} vs ${g.away}</b><br>
            ${g.total.pick} ${g.total.line} – ${g.total.odds}
            (<b>${g.total.probability}%</b>)
          </div>
        `;
      });

      output.appendChild(topDiv);
    }

    /* ===== VISOS RUNG TYNĖS ===== */
    filtered.forEach(g => {
      const div = document.createElement("div");
      div.className = "game";

      div.innerHTML = `
        <b>${g.home} vs ${g.away}</b><br>
        📅 ${formatDate(g.commence_time)}

        <div class="market">
          🏷 Win/Lose: <b>${g.win.pick}</b> (${g.win.odds}) – ${g.win.probability}%
        </div>

        <div class="market ${colorByPercent(g.total.probability)}">
          🏷 Over/Under: <b>${g.total.pick}</b> (${g.total.odds})  
          📏 ${g.total.line} – <b>${g.total.probability}%</b>
        </div>
      `;

      output.appendChild(div);
    });

  } catch (e) {
    output.innerHTML = "❌ Klaida kraunant duomenis";
  }
}

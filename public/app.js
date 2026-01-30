const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

const MIN_PROBABILITY = 60;

// 🎨 SPALVOS PAGAL %
function getColorClass(p) {
  if (p >= 70) return "prob-strong";
  if (p >= 60) return "prob-good";
  if (p >= 55) return "prob-mid";
  return "prob-bad";
}

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

// 📡 API
async function loadOdds(league) {
  output.innerHTML = "⏳ Kraunama...";
  leaguesDiv.querySelectorAll("button").forEach(b => b.disabled = true);

  try {
    const res = await fetch(`/api/odds?league=${league}`);
    let data = await res.json();

    leaguesDiv.querySelectorAll("button").forEach(b => b.disabled = false);

    if (!Array.isArray(data)) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    // 🔥 FILTRAS ≥ 60%
    data = data.filter(g => {
      const maxP = Math.max(
        g.win?.probability || 0,
        g.total?.probability || 0
      );
      return maxP >= MIN_PROBABILITY;
    });

    if (data.length === 0) {
      output.innerHTML = "❌ Nėra pasirinkimų ≥ 60%";
      return;
    }

    // 🔝 RŪŠIAVIMAS PAGAL DIDŽIAUSIĄ %
    data.sort((a, b) => {
      const aMax = Math.max(
        a.win?.probability || 0,
        a.total?.probability || 0
      );
      const bMax = Math.max(
        b.win?.probability || 0,
        b.total?.probability || 0
      );
      return bMax - aMax;
    });

    output.innerHTML = "";

    data.forEach(g => {
      const div = document.createElement("div");
      div.className = "game";

      const winClass = getColorClass(g.win.probability);
      const totalClass = g.total ? getColorClass(g.total.probability) : "";

      const bestIsWin =
        g.win.probability >= (g.total?.probability || 0);

      div.innerHTML = `
        <b>${g.home} vs ${g.away}</b>

        <div class="market ${winClass}">
          🏷 Win/Lose ${bestIsWin ? "🔥" : ""}
          <b>${g.win.pick}</b> (${g.win.odds}) – ${g.win.probability}%
        </div>

        ${
          g.total
            ? `
          <div class="market ${totalClass}">
            🏷 Over/Under ${!bestIsWin ? "🔥" : ""}
            <b>${g.total.pick}</b> (${g.total.odds})
            📏 ${g.total.line} – ${g.total.probability}%
          </div>
        `
            : ""
        }
      `;

      output.appendChild(div);
    });

  } catch (e) {
    output.innerHTML = "❌ Klaida kraunant duomenis";
  }
}

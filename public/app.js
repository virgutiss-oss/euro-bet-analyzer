const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

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

    const today = new Date().toISOString().slice(0, 10);

    // 🔥 TOP 3 ŠIANDIEN
    const topToday = data
      .filter(g => g.date?.startsWith(today))
      .map(g => {
        const best =
          g.total && (!g.win || g.total.probability > g.win.probability)
            ? { type: "O/U", ...g.total }
            : g.win
            ? { type: "Win/Lose", ...g.win }
            : null;

        return best
          ? {
              ...g,
              bestType: best.type,
              bestPick: best.pick,
              bestOdds: best.odds,
              bestProb: best.probability
            }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.bestProb - a.bestProb)
      .slice(0, 3);

    output.innerHTML = "";

    if (topToday.length > 0) {
      const topDiv = document.createElement("div");
      topDiv.innerHTML = `<h2>🔥 TOP 3 ŠIANDIEN</h2>`;
      output.appendChild(topDiv);

      topToday.forEach(g => {
        const date = new Date(g.date).toLocaleTimeString("lt-LT", {
          hour: "2-digit",
          minute: "2-digit"
        });

        const div = document.createElement("div");
        div.className = "game";
        div.style.border = "2px solid #22c55e";

        div.innerHTML = `
          <div style="opacity:0.8;font-size:14px">📅 Šiandien ${date}</div>
          <b>${g.home} vs ${g.away}</b>

          <div class="market">
            ⭐ ${g.bestType}: <b>${g.bestPick}</b>
            (${g.bestOdds}) – <b>${g.bestProb}%</b>
          </div>
        `;
        output.appendChild(div);
      });

      output.innerHTML += `<hr style="margin:30px 0">`;
    }

    // 📋 VISOS RUNGTYNĖS (KAIP BUVO)
    data.forEach(g => {
      const date = new Date(g.date);
      const dateStr = date.toLocaleString("lt-LT", {
        dateStyle: "medium",
        timeStyle: "short"
      });

      const div = document.createElement("div");
      div.className = "game";

      div.innerHTML = `
        <div style="opacity:0.8;font-size:14px;margin-bottom:6px">
          📅 ${dateStr}
        </div>

        <b>${g.home} vs ${g.away}</b>

        ${g.win ? `
        <div class="market">
          🏷 Win/Lose: <b>${g.win.pick}</b> (${g.win.odds}) – ${g.win.probability}%
        </div>` : ""}

        ${g.total ? `
        <div class="market">
          🏷 Over/Under: <b>${g.total.pick}</b> (${g.total.odds})  
          📏 ${g.total.line} – ${g.total.probability}%
        </div>` : ""}
      `;

      output.appendChild(div);
    });

  } catch (e) {
    output.innerHTML = "❌ Klaida kraunant duomenis";
  }
}

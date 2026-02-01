const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

/* =======================
   DATA FORMATAVIMAS
======================= */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("lt-LT", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* =======================
   SPORTO MYGTUKAI
======================= */
function showBasketball() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
    <button onclick="loadOdds('basketball_lithuania_lkl')">LKL</button>
    <button onclick="loadOdds('basketball_spain_acb')">ACB</button>
    <button onclick="loadOdds('basketball_germany_bbl')">BBL</button>
    <button onclick="loadOdds('basketball_france_proa')">Pro A</button>
    <button onclick="loadOdds('basketball_italy_lega_a')">Lega A</button>
  `;
  output.innerHTML = "Pasirink krepšinio lygą";
}

function showSoccer() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('soccer_epl')">EPL</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_germany_bundesliga_2')">2 Bundesliga</button>
    <button onclick="loadOdds('soccer_france_ligue_one')">Ligue 1</button>
    <button onclick="loadOdds('soccer_uefa_champs_league')">UCL</button>
    <button onclick="loadOdds('soccer_uefa_europa_league')">UEL</button>
  `;
  output.innerHTML = "Pasirink futbolo lygą";
}

function showHockey() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
  `;
  output.innerHTML = "Pasirink ledo ritulį";
}

/* =======================
   SMART TOP 3 LOGIKA
======================= */
function buildSmartTop3(games) {
  const picks = [];
  const usedMatches = new Set();

  games.forEach(g => {
    const match = `${g.home} vs ${g.away}`;

    // Win/Lose
    if (g.win) {
      const p = g.win.probability;
      const o = g.win.odds;
      if (p >= 55 && o >= 1.4 && o <= 2.3) {
        const value = ((p / 100) * o - 1) * 10;
        picks.push({
          match,
          type: "Win/Lose",
          pick: g.win.pick,
          odds: o,
          probability: p,
          score: p + value,
          date: g.commence_time
        });
      }
    }

    // Over / Under
    if (g.total) {
      const p = g.total.probability;
      const o = g.total.odds;
      if (p >= 56 && o >= 1.5) {
        let bonus = 0;
        if (g.total.pick === "Over" && g.total.line <= 2.5) bonus += 6;
        if (g.total.pick === "Under" && g.total.line >= 3.5) bonus += 6;

        const value = ((p / 100) * o - 1) * 10;

        picks.push({
          match,
          type: "Over/Under",
          pick: `${g.total.pick} ${g.total.line}`,
          odds: o,
          probability: p,
          score: p + bonus + value,
          date: g.commence_time
        });
      }
    }
  });

  picks.sort((a, b) => b.score - a.score);

  const top3 = [];
  for (const p of picks) {
    if (top3.length === 3) break;
    if (usedMatches.has(p.match)) continue;
    usedMatches.add(p.match);
    top3.push(p);
  }

  return top3;
}

/* =======================
   API KVIETIMAS
======================= */
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

    /* ========= TOP 3 BLOKAS ========= */
    const top3 = buildSmartTop3(data);

    if (top3.length) {
      const topDiv = document.createElement("div");
      topDiv.className = "game";
      topDiv.style.border = "3px solid #22c55e";
      topDiv.style.background = "#020617";
      topDiv.style.marginBottom = "28px";

      topDiv.innerHTML = `
        <h2 style="color:#22c55e;margin-bottom:12px;">
          🔥 TOP 3 GERIAUSI PASIRINKIMAI
        </h2>
      `;

      top3.forEach((p, i) => {
        const row = document.createElement("div");
        row.className = "market";
        row.innerHTML = `
          <b>#${i + 1} ${p.match}</b>
          ${p.date ? `<div style="opacity:.7">📅 ${formatDate(p.date)}</div>` : ""}
          👉 <b>${p.type}: ${p.pick}</b>
          (${p.odds}) – <b>${p.probability}%</b>
        `;
        topDiv.appendChild(row);
      });

      output.appendChild(topDiv);
    }

    /* ========= VISOS RUNGTYNĖS ========= */
    data.forEach(g => {
      const div = document.createElement("div");
      div.className = "game";
      div.innerHTML = `
        <b>${g.home} vs ${g.away}</b>
        ${g.commence_time ? `<div style="opacity:.6">📅 ${formatDate(g.commence_time)}</div>` : ""}

        <div class="market">
          🏷 Win/Lose:
          <b>${g.win.pick}</b> (${g.win.odds}) – ${g.win.probability}%
        </div>

        ${
          g.total
            ? `<div class="market">
                🏷 Over/Under:
                <b>${g.total.pick}</b> ${g.total.line}
                (${g.total.odds}) – ${g.total.probability}%
              </div>`
            : ""
        }
      `;
      output.appendChild(div);
    });

  } catch {
    output.innerHTML = "❌ Klaida kraunant duomenis";
  }
}

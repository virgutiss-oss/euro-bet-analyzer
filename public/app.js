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
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_france_ligue_one')">Ligue 1</button>
    <button onclick="loadOdds('soccer_uefa_champs_league')">Champions League</button>
    <button onclick="loadOdds('soccer_uefa_europa_league')">Europa League</button>
  `;
  output.innerHTML = "Pasirink futbolo lygą";
}

// 🏒 LEDO RITULYS (GRĄŽINTA)
function showHockey() {
  leaguesDiv.innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
  `;
  output.innerHTML = "Pasirink ledo ritulio lygą";
}

// 🧠 SMART TOP 3 (BE PAKEITIMŲ)
function buildSmartTop3(games) {
  const picks = [];
  const usedMatches = new Set();

  games.forEach(g => {
    const matchId = `${g.home} vs ${g.away}`;

    if (g.win) {
      const o = g.win.odds;
      const p = g.win.probability;
      if (o >= 1.4 && o <= 2.3 && p >= 55) {
        picks.push({
          match: matchId,
          label: `Win/Lose: ${g.win.pick}`,
          odds: o,
          probability: p,
          score: p + (o >= 1.7 && o <= 2.1 ? 5 : 0)
        });
      }
    }

    if (g.total) {
      const o = g.total.odds;
      const p = g.total.probability;
      const line = g.total.line;
      const pick = g.total.pick;

      if (o >= 1.5 && p >= 56) {
        let bonus = 0;
        if (pick === "Over" && line <= 1.5) bonus = 8;
        else if (pick === "Under" && line >= 3.5) bonus = 7;
        else if (pick === "Over" && line <= 2.5) bonus = 4;
        else if (pick === "Over" && line >= 3.5) bonus = -5;

        picks.push({
          match: matchId,
          label: `O/U: ${pick} ${line}`,
          odds: o,
          probability: p,
          score: p + bonus
        });
      }
    }
  });

  picks.sort((a, b) => b.score - a.score);

  const top3 = [];
  for (const p of picks) {
    if (top3.length >= 3) break;
    if (usedMatches.has(p.match)) continue;
    usedMatches.add(p.match);
    top3.push(p);
  }

  return top3;
}

// 📡 API
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

    // 🏆 TOP 3 – AIŠKIAI APIBRĖŽTAS BLOKAS
    const top3 = buildSmartTop3(data);
    if (top3.length) {
      const topDiv = document.createElement("div");
      topDiv.className = "game";
      topDiv.style.border = "2px solid #22c55e";
      topDiv.style.background = "#020617";

      topDiv.innerHTML = `<h2 style="color:#22c55e;">🔥 TOP 3 REKOMENDACIJOS</h2>`;

      top3.forEach(p => {
        const row = document.createElement("div");
        row.className = "market";
        row.innerHTML = `
          <b>${p.match}</b><br>
          👉 <b>${p.label}</b> (${p.odds}) – ${p.probability}%
        `;
        topDiv.appendChild(row);
      });

      output.appendChild(topDiv);
    }

    // VISOS RUNGTYNĖS
    data.forEach(g => {
      const div = document.createElement("div");
      div.className = "game";
      div.innerHTML = `
        <b>${g.home} vs ${g.away}</b>
        <div class="market">🏷 Win/Lose: <b>${g.win.pick}</b> (${g.win.odds}) – ${g.win.probability}%</div>
        ${g.total ? `<div class="market">🏷 O/U: <b>${g.total.pick}</b> ${g.total.line} (${g.total.odds}) – ${g.total.probability}%</div>` : ""}
      `;
      output.appendChild(div);
    });

  } catch {
    output.innerHTML = "❌ Klaida kraunant duomenis";
  }
}

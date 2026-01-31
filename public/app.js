const output = document.getElementById("output");
const leaguesDiv = document.getElementById("leagues");

async function loadOdds(league) {
  output.innerHTML = "⏳ Kraunama...";
  leaguesDiv.querySelectorAll("button").forEach(b => b.disabled = true);

  try {
    const res = await fetch(`/api/odds?league=${league}`);
    const data = await res.json();

    leaguesDiv.querySelectorAll("button").forEach(b => b.disabled = false);

    if (!Array.isArray(data) || data.length === 0) {
      output.innerHTML = "❌ Šiuo metu nėra rungtynių";
      return;
    }

    output.innerHTML = "";

    data.forEach(g => {
      const div = document.createElement("div");
      div.className = "game";

      let totalHtml = "";
      if (g.total) {
        totalHtml = `
          <div class="market">
            🏷 Over/Under: 
            <b>${g.total.pick}</b> (${g.total.odds})  
            📏 ${g.total.line} – ${g.total.probability}%
          </div>
        `;
      } else {
        totalHtml = `
          <div class="market muted">
            ℹ️ Over/Under šiai lygai šiuo metu nėra
          </div>
        `;
      }

      div.innerHTML = `
        <b>${g.home} vs ${g.away}</b>

        <div class="market">
          🏷 Win/Lose: 
          <b>${g.win.pick}</b> (${g.win.odds}) – ${g.win.probability}%
        </div>

        ${totalHtml}
      `;

      output.appendChild(div);
    });

  } catch (e) {
    output.innerHTML = "❌ Klaida kraunant duomenis";
  }
}

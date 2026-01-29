const output = document.getElementById("output");

document.getElementById("btn-soccer").onclick = () => loadOdds("soccer");
document.getElementById("btn-basketball").onclick = () => loadOdds("basketball");

async function loadOdds(sport) {
  output.innerHTML = "⏳ Kraunama...";

  try {
    const res = await fetch(`/api/odds?sport=${sport}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    renderGames(data);
  } catch (e) {
    console.error(e);
    output.innerHTML = "❌ Klaida gaunant duomenis";
  }
}

function renderGames(games) {
  output.innerHTML = "";

  games.forEach(g => {
    const div = document.createElement("div");
    div.className = "game";

    div.innerHTML = `
      <h3>${g.home} vs ${g.away}</h3>
      <small>${g.league}</small>

      ${g.winPick ? `
        <p>🏆 WIN/LOSE: <b>${g.winPick.pick}</b>
        (${g.winPick.odds}) – ${g.winPick.probability}%</p>` : ""}

      ${g.totalPick ? `
        <p>📊 TOTAL: <b>${g.totalPick.pick}</b>
        (${g.totalPick.odds}) – ${g.totalPick.probability}%</p>` : ""}

      <hr/>
    `;

    output.appendChild(div);
  });
}

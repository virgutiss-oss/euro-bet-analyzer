const output = document.getElementById("output");

async function loadSport(sport) {
  output.innerHTML = "⏳ Kraunama...";

  try {
    const res = await fetch(`/api/odds?sport=${sport}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    output.innerHTML = "";

    data.forEach(game => {
      const div = document.createElement("div");
      div.className = "game";

      div.innerHTML = `
        <b>${game.home} vs ${game.away}</b><br>
        🏷 Win/Lose: <b>${game.win.pick}</b> (${game.win.odds}) – ${game.win.probability}%<br>
        🏷 Over/Under: <b>${game.total.pick}</b> (${game.total.odds}) – ${game.total.probability}%<br>
        📏 Linija: ${game.total.line}
      `;

      output.appendChild(div);
    });

  } catch (e) {
    console.error(e);
    output.innerHTML = "❌ Klaida";
  }
}

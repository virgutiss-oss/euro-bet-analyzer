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
    output.innerHTML = "❌ Klaida kraunant duomenis";
  }
}

function renderGames(games) {
  output.innerHTML = "";

  games.forEach(g => {
    const div = document.createElement("div");
    div.className = "game";

    div.innerHTML = `
      <h3>${g.home} vs ${g.away}</h3>
      <p>📊 Rinka: ${g.market}</p>
      <p>👉 Pasirinkimas: <b>${g.pick}</b></p>
      ${g.line ? `<p>📏 Linija: ${g.line}</p>` : ""}
      <p>💰 Koeficientas: ${g.odds}</p>
      <p>📈 Tikimybė: ${g.probability}%</p>
    `;

    output.appendChild(div);
  });
}

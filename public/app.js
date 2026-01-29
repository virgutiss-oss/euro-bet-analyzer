const output = document.getElementById("output");

document.getElementById("btn-basketball")
  .addEventListener("click", () => loadOdds("basketball"));

document.getElementById("btn-soccer")
  .addEventListener("click", () => loadOdds("soccer"));

async function loadOdds(sport) {
  output.innerHTML = "⏳ Kraunama...";

  try {
    const res = await fetch(`/api/odds?sport=${sport}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    output.innerHTML = "";

    data.forEach(g => {
      const div = document.createElement("div");
      div.className = "game";

      div.innerHTML = `
        <b>${g.home} vs ${g.away}</b><br>
        🏷 ${g.market}<br>
        👉 <b>${g.pick}</b><br>
        💰 Odds: ${g.odds}<br>
        📈 Tikimybė: ${g.probability}%<br>
        ${g.line ? "📏 Linija: " + g.line + "<br>" : ""}
        <hr>
      `;

      output.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    output.innerHTML = "❌ Klaida kraunant duomenis";
  }
}

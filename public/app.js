const output = document.getElementById("output");

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
        👉 ${g.pick}<br>
        💰 ${g.odds}<br>
        📈 ${g.probability}%<br>
        ${g.line ? "📏 Linija: " + g.line : ""}
        <hr>
      `;
      output.appendChild(div);
    });

  } catch {
    output.innerHTML = "❌ Klaida";
  }
}

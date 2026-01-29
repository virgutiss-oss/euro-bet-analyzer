const output = document.getElementById("output");

document.getElementById("football").onclick = () => loadOdds("football");
document.getElementById("basketball").onclick = () => loadOdds("basketball");

async function loadOdds(sport) {
  output.innerHTML = "⏳ Kraunama...";

  try {
    const res = await fetch(`/api/odds?sport=${sport}`);
    const data = await res.json();

    if (!data || data.length === 0) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    output.innerHTML = "";

    data.forEach(game => {
      const div = document.createElement("div");
      div.className = "game";
      div.innerHTML = `
        <b>${game.home}</b> vs <b>${game.away}</b><br/>
        👉 ${game.pick} @ ${game.odds}
      `;
      output.appendChild(div);
    });

  } catch (e) {
    output.innerHTML = "❌ Klaida";
  }
}

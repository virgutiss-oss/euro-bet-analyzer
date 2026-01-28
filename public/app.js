console.log("APP JS UŽSIKROVĖ");

const output = document.getElementById("output");

document.getElementById("soccer").onclick = () => loadOdds("soccer");
document.getElementById("basketball").onclick = () => loadOdds("basketball");
document.getElementById("hockey").onclick = () => loadOdds("hockey");
document.getElementById("tennis").onclick = () => loadOdds("tennis");

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

    data.forEach(g => {
      output.innerHTML += `
        <div class="game">
          <h3>${g.home} vs ${g.away}</h3>
          <p>${g.market}</p>
          <p><b>${g.pick}</b></p>
          <p>${g.probability}%</p>
        </div>
      `;
    });
  } catch {
    output.innerHTML = "❌ Klaida";
  }
}

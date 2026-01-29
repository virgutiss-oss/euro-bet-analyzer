const output = document.getElementById("output");

let currentSport = null;
let currentMarket = "h2h";

document.getElementById("soccer").onclick = () => {
  currentSport = "soccer";
  loadOdds();
};

document.getElementById("basketball").onclick = () => {
  currentSport = "basketball";
  loadOdds();
};

document.getElementById("winlose").onclick = () => {
  currentMarket = "h2h";
  loadOdds();
};

document.getElementById("totals").onclick = () => {
  currentMarket = "totals";
  loadOdds();
};

async function loadOdds() {
  if (!currentSport) {
    output.innerHTML = "❌ Nepasirinktas sportas";
    return;
  }

  output.innerHTML = "⏳ Kraunama...";

  try {
    const res = await fetch(`/api/odds?sport=${currentSport}&market=${currentMarket}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    render(data);
  } catch (e) {
    output.innerHTML = "❌ API klaida";
  }
}

function render(games) {
  output.innerHTML = "";

  games.forEach(g => {
    const div = document.createElement("div");
    div.className = "game";

    div.innerHTML = `
      <h3>${g.home} vs ${g.away}</h3>
      <p>📊 Rinka: ${g.market}</p>
      <p>👉 Pasirinkimas: <b>${g.pick}</b></p>
      <p>💰 Koeficientas: <b>${g.odds}</b></p>
      <hr>
    `;

    output.appendChild(div);
  });
}

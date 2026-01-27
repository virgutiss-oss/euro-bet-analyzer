console.log("APP JS UŽSIKROVĖ");

const output = document.getElementById("output");
const buttons = document.querySelectorAll("button[data-sport]");

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    const sport = btn.dataset.sport;
    loadOdds(sport);
  });
});

async function loadOdds(sport) {
  output.innerHTML = "⏳ Kraunama...";

  try {
    const res = await fetch(`/api/odds?sport=${sport}`);
    if (!res.ok) throw new Error("API klaida");

    const data = await res.json();

    if (!data || data.length === 0) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    renderGames(data);
  } catch (err) {
    console.error(err);
    output.innerHTML = "❌ Nepavyko gauti duomenų";
  }
}

function renderGames(games) {
  output.innerHTML = "";

  games.forEach(game => {
    const div = document.createElement("div");
    div.className = "game";

    div.innerHTML = `
      <h3>${game.home} vs ${game.away}</h3>
      <p>📊 Rinka: ${game.market}</p>
      <p>👉 Pasirinkimas: <b>${game.pick}</b></p>
      <p>📈 Tikimybė: <b>${game.probability}%</b></p>
    `;

    output.appendChild(div);
  });
}

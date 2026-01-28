const output = document.getElementById("output");
document.getElementById("football").onclick = loadFootball;

async function loadFootball() {
  output.innerHTML = "⏳ Kraunama...";

  try {
    const res = await fetch("/api/odds");
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    output.innerHTML = "";

    data.forEach(game => {
      output.innerHTML += `
        <div class="game">
          <h3>${game.home} vs ${game.away}</h3>
          <div class="league">${game.league}</div>

          <p>🏆 Win/Lose: <b>${game.winPick}</b> (${game.winProb}%)</p>

          ${
            game.totalPick
              ? `<p>📊 Over/Under: <b>${game.totalPick}</b> (${game.totalProb}%)</p>`
              : ""
          }
        </div>
      `;
    });
  } catch {
    output.innerHTML = "❌ Klaida";
  }
}

const output = document.getElementById("output");

document.getElementById("football").onclick = () => loadSport("football");
document.getElementById("basketball").onclick = () => loadSport("basketball");
document.getElementById("basketballTotals")?.addEventListener("click", () =>
  loadSport("basketball", "totals")
);

async function loadSport(sport, mode = "all") {
  output.innerHTML = "⏳ Kraunama...";

  try {
    const res = await fetch(`/api/odds?sport=${sport}&mode=${mode}`);
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

          ${
            game.winPick
              ? `<p>🏆 Win/Lose:
                  <b>${game.winPick}</b>
                  @ ${game.winOdds}
                  (${game.winProb}%)
                </p>`
              : ""
          }

          <p>
            📊 ${game.total.label}:
            <b>${game.total.pick}</b>
            @ ${game.total.odds}
            (${game.total.prob}%)
          </p>
        </div>
      `;
    });
  } catch {
    output.innerHTML = "❌ Klaida";
  }
}

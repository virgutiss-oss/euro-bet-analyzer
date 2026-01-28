const output = document.getElementById("output");

/**
 * Užkrauna duomenis pagal sportą
 * sport: "soccer" | "basketball" | "hockey" | "tennis"
 */
async function loadOdds(sport) {
  output.innerHTML = "⏳ Kraunama...";

  try {
    const res = await fetch(`/api/odds?sport=${sport}`);

    if (!res.ok) {
      throw new Error("API klaida");
    }

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

/**
 * Atvaizduoja rungtynes
 */
function renderGames(games) {
  output.innerHTML = "";

  games.forEach(game => {
    const div = document.createElement("div");
    div.className = "game";

    div.innerHTML = `
      <h3>${game.home} vs ${game.away}</h3>
      <p>🏆 Lyga: ${game.league || "-"}</p>

      ${
        game.winPick
          ? `<p>🏅 Win/Lose: <b>${game.winPick}</b> @ ${game.winOdds} (${game.winProb}%)</p>`
          : ""
      }

      ${
        game.total
          ? `<p>📊 Total: <b>${game.total.pick}</b> @ ${game.total.odds} (${game.total.prob}%)</p>`
          : ""
      }

      <hr/>
    `;

    output.appendChild(div);
  });
}

/**
 * Mygtukų prijungimas (saugiai)
 */
document.getElementById("btn-soccer")?.addEventListener("click", () => {
  loadOdds("soccer");
});

document.getElementById("btn-basketball")?.addEventListener("click", () => {
  loadOdds("basketball");
});

document.getElementById("btn-hockey")?.addEventListener("click", () => {
  loadOdds("hockey");
});

document.getElementById("btn-tennis")?.addEventListener("click", () => {
  loadOdds("tennis");
});

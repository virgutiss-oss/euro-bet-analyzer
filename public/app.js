const output = document.getElementById("output");

document.getElementById("basketball").onclick = () => {
  loadOdds("basketball_nba");
};

document.getElementById("soccer").onclick = () => {
  loadOdds("soccer_uefa_champs_league");
};

async function loadOdds(sport) {
  output.innerHTML = "⏳ Kraunama...";

  try {
    const res = await fetch(`/api/odds?sport=${sport}`);
    const data = await res.json();

    console.log("API DATA:", data);

    if (!Array.isArray(data) || data.length === 0) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    renderGames(data);
  } catch (err) {
    console.error(err);
    output.innerHTML = "❌ Klaida gaunant duomenis";
  }
}

function renderGames(games) {
  output.innerHTML = "";

  games.forEach(g => {
    const div = document.createElement("div");
    div.className = "game";
    div.innerHTML = `
      <h3>${g.home} vs ${g.away}</h3>
      <p>👉 Pick: <b>${g.pick}</b></p>
      <p>💰 Odds: <b>${g.odds}</b></p>
      <hr>
    `;
    output.appendChild(div);
  });
}

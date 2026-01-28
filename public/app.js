function renderGames(games) {
  output.innerHTML = "";

  games.forEach(game => {
    const div = document.createElement("div");
    div.className = "game";

    div.innerHTML = `
      <h3>${game.home} vs ${game.away}</h3>
      <p>👉 Pasirinkimas: <b>${game.pick}</b></p>
      <p>💰 Koeficientas: <b>${game.odds}</b></p>
      <hr/>
    `;

    output.appendChild(div);
  });
}

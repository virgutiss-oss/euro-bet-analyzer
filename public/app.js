async function loadSport(sport) {
  const box = document.getElementById("content");
  box.innerHTML = "Kraunama…";

  const res = await fetch("/api/odds");
  const data = await res.json();
  const games = data[sport];

  if (!games || games.length === 0) {
    box.innerHTML = "Nėra duomenų";
    return;
  }

  box.innerHTML = "";

  games.forEach(game => {
    const home = game.home_team;
    const away = game.away_team;

    let bestPick = null;

    if (game.bookmakers?.length) {
      game.bookmakers.forEach(bm => {
        bm.markets.forEach(m => {
          if (m.key === "totals") {
            const over = m.outcomes.find(o => o.name === "Over");
            const under = m.outcomes.find(o => o.name === "Under");

            if (over && (!bestPick || over.price > bestPick.price)) {
              bestPick = { type: "Over", line: over.point, price: over.price };
            }
            if (under && (!bestPick || under.price > bestPick.price)) {
              bestPick = { type: "Under", line: under.point, price: under.price };
            }
          }
        });
      });
    }

    if (!bestPick) return;

    const confidence = Math.min(80, Math.round((bestPick.price - 1) * 100));

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div><b>${home}</b> vs <b>${away}</b></div>
      <div class="pick">BEST: ${bestPick.type} ${bestPick.line} @ ${bestPick.price}</div>
      <div class="meta">Pasitikėjimas: ${confidence}%</div>
    `;

    box.appendChild(card);
  });
}

// ===== TOP 3 by VALUE =====
function getTop3(games) {
  const today = new Date().toDateString();

  // pabandome šiandienos rungtynes
  let todayGames = games.filter(g => {
    if (!g.commence_time) return false;
    return new Date(g.commence_time).toDateString() === today;
  });

  let top3 = [];

  if (todayGames.length > 0) {
    top3 = todayGames.sort((a,b) => b.ev - a.ev).slice(0,3);
  } else {
    // jei šiandienos nėra – imame max EV iš visų
    top3 = games.sort((a,b) => b.ev - a.ev).slice(0,3);
  }

  return top3;
}

// ===== RENDER TOP 3 =====
const top3 = getTop3(games);

if (top3.length > 0) {
  topBlock.style.display = "block";
  topBlock.innerHTML = `<h2>🔥 TOP 3 (VALUE)</h2>`;
  top3.forEach(g => {
    topBlock.innerHTML += `
      <div>
        <b>${g.home} vs ${g.away}</b><br>
        Win: ${g.win.pick} @ ${g.win.odds}
        (${g.win.probability}%)<br>
        EV: ${(g.ev*100).toFixed(1)}%
        <hr>
      </div>
    `;
  });
} else {
  topBlock.style.display = "none";
}

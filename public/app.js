async function loadSport(sport) {
  const results = document.getElementById("results");
  results.innerHTML = "Kraunama…";

  try {
    const res = await fetch(`/api/odds?sport=${sport}`);
    const data = await res.json();

    if (!data.length) {
      results.innerHTML = "<p>Nėra duomenų</p>";
      return;
    }

    results.innerHTML = "";

    data.forEach(game => {
      results.innerHTML += `
        <div class="card">
          <h3>${game.home} vs ${game.away}</h3>
          <p>${game.market}</p>
          <strong>${game.pick} (${game.probability}%)</strong>
        </div>
      `;
    });
  } catch (e) {
    results.innerHTML = "<p>Klaida kraunant duomenis</p>";
  }
}

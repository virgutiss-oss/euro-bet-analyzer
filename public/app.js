async function loadSport(sport) {
  const output = document.getElementById("output");
  output.innerHTML = "Kraunama...";

  try {
    const res = await fetch(`/api/odds?sport=${sport}`);
    const data = await res.json();

    if (!data.length) {
      output.innerHTML = "Nėra duomenų";
      return;
    }

    output.innerHTML = data.map(match => `
      <div class="card">
        <b>${match.home}</b> vs <b>${match.away}</b><br>
        Rinka: ${match.market}<br>
        Pasirinkimas: <b>${match.pick}</b><br>
        Tikimybė: ${match.probability}%
      </div>
    `).join("");

  } catch (e) {
    output.innerHTML = "Klaida kraunant duomenis";
  }
}

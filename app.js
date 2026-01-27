async function loadSport(sport) {
  const output = document.getElementById("output");
  output.innerHTML = "⏳ Kraunama...";

  try {
    const res = await fetch(`/api/odds?sport=${sport}`);
    const data = await res.json();

    if (!data.length) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    output.innerHTML = "";

    data.forEach(m => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <b>${m.home}</b> vs <b>${m.away}</b><br>
        Rinka: ${m.market}<br>
        Pasirinkimas: <b>${m.pick}</b><br>
        Tikimybė: ${m.probability}%
      `;
      output.appendChild(div);
    });

  } catch (e) {
    output.innerHTML = "❌ Klaida kraunant duomenis";
  }
}

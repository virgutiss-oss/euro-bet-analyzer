const output = document.getElementById("output");

async function loadOdds(sport) {
  output.innerHTML = "⏳ Kraunama...";

  try {
    const res = await fetch(`/api/odds?sport=${sport}`);
    const data = await res.json();

    if (!data.length) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    output.innerHTML = "";

    data.forEach(g => {
      const div = document.createElement("div");
      div.className = "game";

      let html = `
        <h3>${g.home} vs ${g.away}</h3>
        <p><b>${g.league}</b></p>
      `;

      if (g.win) {
        html += `
          <p>🏆 Win: <b>${g.win.pick}</b>
          (${g.win.odds}) – ${g.win.probability}%</p>
        `;
      }

      if (g.total) {
        html += `
          <p>📊 ${g.total.pick} ${g.total.line}
          (${g.total.odds}) – ${g.total.probability}%</p>
        `;
      }

      div.innerHTML = html + "<hr/>";
      output.appendChild(div);
    });

  } catch (e) {
    console.error(e);
    output.innerHTML = "❌ Klaida";
  }
}

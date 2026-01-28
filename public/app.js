console.log("APP JS UŽSIKROVĖ");

const output = document.getElementById("output");

document.getElementById("basketball").onclick = () => loadOdds();

async function loadOdds() {
  output.innerHTML = "⏳ Kraunama...";

  try {
    const res = await fetch("/api/odds?sport=basketball");
    const data = await res.json();

    if (!data || data.length === 0) {
      output.innerHTML = "❌ Nėra duomenų";
      return;
    }

    output.innerHTML = "";

    data.forEach(game => {
      output.innerHTML += `
        <div class="game">
          <h3>${game.home} vs ${game.away}</h3>
          <p>📊 ${game.market}</p>
          <p>👉 <b>${game.pick}</b></p>
          <p>📈 Tikimybė: <b>${game.probability}%</b></p>
        </div>
      `;
    });
  } catch (e) {
    output.innerHTML = "❌ Klaida gaunant duomenis";
  }
}

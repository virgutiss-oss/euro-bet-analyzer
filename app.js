const leagues = {
  football: [
    { name: "Premier League", key: "soccer_epl" },
    { name: "La Liga", key: "soccer_spain_la_liga" },
    { name: "Serie A", key: "soccer_italy_serie_a" },
    { name: "Bundesliga", key: "soccer_germany_bundesliga" }
  ],
  basketball: [
    { name: "NBA", key: "basketball_nba" }
  ],
  hockey: [
    { name: "NHL", key: "icehockey_nhl" }
  ],
  tennis: [
    { name: "ATP", key: "tennis_atp" },
    { name: "WTA", key: "tennis_wta" }
  ]
};

const sportSelect = document.getElementById("sport");
const leagueSelect = document.getElementById("league");

function loadLeagues() {
  leagueSelect.innerHTML = leagues[sportSelect.value]
    .map(l => `<option value="${l.key}">${l.name}</option>`)
    .join("");
}
sportSelect.addEventListener("change", loadLeagues);
loadLeagues();

async function analyze() {
  const league = leagueSelect.value;
  const market = document.getElementById("market").value;
  const box = document.getElementById("results");

  box.innerHTML = "⏳ Analizuojama...";

  const res = await fetch(`/api/sports?league=${league}&market=${market}`);
  const data = await res.json();

  if (!data.length) {
    box.innerHTML = "❌ Nėra duomenų";
    return;
  }

  box.innerHTML = data.map(m => `
    <div class="card">
      <b>${m.match}</b><br>
      ${m.pick}<br>
      <small>📈 Odds: ${m.odds}</small>
    </div>
  `).join("");
}

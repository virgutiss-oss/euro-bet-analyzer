const leagues = {
  football: [
    { name: "Premier League", key: "soccer_epl" },
    { name: "La Liga", key: "soccer_spain_la_liga" },
    { name: "Serie A", key: "soccer_italy_serie_a" },
    { name: "Bundesliga", key: "soccer_germany_bundesliga" },
    { name: "Ligue 1", key: "soccer_france_ligue_one" },
    { name: "Champions League", key: "soccer_uefa_champs_league" },
    { name: "Europa League", key: "soccer_uefa_europa_league" }
  ],
  basketball: [
    { name: "NBA", key: "basketball_nba" },
    { name: "EuroLeague", key: "basketball_euroleague" }
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
const marketSelect = document.getElementById("market");
const lineSelect = document.getElementById("line");

function updateLeagues() {
  const sport = sportSelect.value;
  leagueSelect.innerHTML = leagues[sport]
    .map(l => `<option value="${l.key}">${l.name}</option>`)
    .join("");
}

sportSelect.addEventListener("change", updateLeagues);
updateLeagues();

async function analyze() {
  const sport = sportSelect.value;
  const league = leagueSelect.value;
  const market = marketSelect.value;
  const box = document.getElementById("results");

  box.innerHTML = "⏳ Kraunama...";

  const res = await fetch(
    `/api/sports?sport=${sport}&league=${league}&market=${market}`
  );

  const data = await res.json();

  if (!data.length) {
    box.innerHTML = "❌ Nėra duomenų";
    return;
  }

  box.innerHTML = data.map(m => `
    <div class="card">
      <b>${m.match}</b><br>
      ${m.pick}
    </div>
  `).join("");
}

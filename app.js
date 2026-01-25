const leagues = {
  football: [
    "Premier League",
    "La Liga",
    "Serie A",
    "Bundesliga",
    "Ligue 1",
    "Champions League",
    "Europa League"
  ],
  basketball: [
    "NBA",
    "EuroLeague",
    "ACB",
    "LKL"
  ],
  hockey: [
    "NHL",
    "KHL",
    "SHL",
    "Liiga"
  ],
  tennis: [
    "ATP",
    "WTA"
  ]
};

const overUnderLines = {
  football: [0.5, 1.5, 2.5, 3.5],
  basketball: [160.5, 170.5, 180.5, 190.5],
  hockey: [3.5, 4.5, 5.5, 6.5],
  tennis: [18.5, 20.5, 22.5]
};

function updateOptions() {
  const sport = document.getElementById("sport").value;
  const leagueSelect = document.getElementById("league");
  const lineSelect = document.getElementById("line");

  leagueSelect.innerHTML = leagues[sport]
    .map(l => `<option value="${l}">${l}</option>`)
    .join("");

  lineSelect.innerHTML = overUnderLines[sport]
    .map(l => `<option value="${l}">${l}</option>`)
    .join("");
}

async function analyze() {
  const sport = sportSelect.value;
  const league = leagueSelect.value;
  const market = marketSelect.value;
  const line = lineSelect.value;
  const box = document.getElementById("results");

  box.innerHTML = "⏳ Analizuojama...";

  const res = await fetch(
    `/api/sports?sport=${sport}&league=${league}&market=${market}&line=${line}`
  );

  const data = await res.json();

  box.innerHTML = data.map(m => `
    <div class="card">
      <strong>${m.match}</strong><br>
      Lyga: ${league}<br>
      Pasirinkimas: <b>${m.pick}</b>
    </div>
  `).join("");
}

const sportSelect = document.getElementById("sport");
const leagueSelect = document.getElementById("league");
const marketSelect = document.getElementById("market");
const lineSelect = document.getElementById("line");

sportSelect.addEventListener("change", updateOptions);
updateOptions();

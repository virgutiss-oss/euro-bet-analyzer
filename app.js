const sports = {
  football: [
    ["Premier League","soccer_epl"],
    ["La Liga","soccer_spain_la_liga"],
    ["Serie A","soccer_italy_serie_a"],
    ["Bundesliga","soccer_germany_bundesliga"],
    ["Ligue 1","soccer_france_ligue_one"]
  ],
  basketball: [
    ["NBA","basketball_nba"],
    ["EuroLeague","basketball_euroleague"],
    ["ACB","basketball_spain_acb"],
    ["LKL","basketball_lithuania_lkl"]
  ],
  hockey: [
    ["NHL","icehockey_nhl"]
  ],
  tennis: [
    ["ATP","tennis_atp"],
    ["WTA","tennis_wta"]
  ]
};

const sportSel = document.getElementById("sport");
const leagueSel = document.getElementById("league");

Object.keys(sports).forEach(s=>{
  sportSel.innerHTML += `<option value="${s}">${s.toUpperCase()}</option>`;
});

function loadLeagues(){
  leagueSel.innerHTML = "";
  sports[sportSel.value].forEach(l=>{
    leagueSel.innerHTML += `<option value="${l[1]}">${l[0]}</option>`;
  });
}
sportSel.onchange = loadLeagues;
loadLeagues();

async function analyze(){
  const res = await fetch(`/api/sports?league=${leagueSel.value}&market=${market.value}`);
  const data = await res.json();
  results.innerHTML = data.map(g=>`
    <div class="card">
      <b>${g.match}</b><br>
      ${g.pick} @ ${g.odds}<br>
      <span class="${g.value>0?'value':'bad'}">
        Value: ${g.value}%
      </span><br>
      <small>H2H/Forma: ${g.form}</small>
    </div>
  `).join("");
}

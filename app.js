// EUROPOS LYGU SARASAS (veikia su FREE plan)
const EURO_LEAGUES = [
  { id: 39, name: "Premier League (ENG)" },
  { id: 140, name: "La Liga (ESP)" },
  { id: 135, name: "Serie A (ITA)" },
  { id: 78, name: "Bundesliga (GER)" },
  { id: 61, name: "Ligue 1 (FRA)" },

  { id: 94, name: "Primeira Liga (POR)" },
  { id: 88, name: "Eredivisie (NED)" },
  { id: 203, name: "Super Lig (TUR)" },
  { id: 179, name: "Premiership (SCO)" },
  { id: 218, name: "Czech Liga" },
  { id: 119, name: "Denmark Superliga" },
  { id: 106, name: "Ekstraklasa (POL)" },
  { id: 197, name: "Greek Super League" },
  { id: 207, name: "Swiss Super League" }
];

// UZKRAUNAM LYGU FILTRA
function loadLeagues(){
  const sel = document.getElementById("league");
  sel.innerHTML = "";

  EURO_LEAGUES.forEach(l=>{
    sel.innerHTML += `<option value="${l.id}">${l.name}</option>`;
  });
}

window.onload = loadLeagues;

// KRAUNAM RUNGTYNES
async function loadMatches(){
  document.getElementById("matches").innerHTML = "Kraunama...";
  const league = document.getElementById("league").value;
  const market = document.getElementById("market").value;
  const today = new Date().toISOString().split("T")[0];

  const res = await fetch(
    `https://${API_HOST}/fixtures?league=${league}&date=${today}&season=2024`,
    { headers:{ "x-apisports-key": API_KEY } }
  );

  const data = await res.json();
  let html = "";

  if(!data.response || data.response.length === 0){
    document.getElementById("matches").innerHTML = "Šiandien rungtynių nėra.";
    return;
  }

  for(let m of data.response.slice(0,15)){
    const hs = await stats(m.teams.home.id, league);
    const as = await stats(m.teams.away.id, league);

    let p = 0, label = "";
    if(market === "btts"){ p = analyzeBTTS(hs, as); label = "BTTS YES"; }
    else if(market === "ou"){ p = analyzeOver(hs, as); label = "Over 2.5"; }
    else { p = analyzeDC(hs, as); label = "Double Chance 1X"; }

    const [st, c] = status(p);

    html += `
      <div class="match">
        <b>${m.teams.home.name} – ${m.teams.away.name}</b><br>
        ${label}: <span class="${c}">${p}% ${st}</span>
      </div>
    `;
  }

  document.getElementById("matches").innerHTML = html;
}

// KOMANDOS STATISTIKA
async function stats(team, league){
  const r = await fetch(
    `https://${API_HOST}/teams/statistics?team=${team}&league=${league}&season=2024`,
    { headers:{ "x-apisports-key": API_KEY } }
  );
  return (await r.json()).response;
}

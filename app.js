async function api(path){
  const r = await fetch(`/api/${path}`);
  return await r.json();
}

async function loadLeagues(){
  const data = await api("leagues");
  const sel = document.getElementById("league");
  sel.innerHTML = "";

  data.response.forEach(l=>{
    if(l.type === "League"){
      sel.innerHTML += `<option value="${l.league.id}">${l.league.name}</option>`;
    }
  });
}

window.onload = loadLeagues;

async function loadMatches(){
  document.getElementById("matches").innerHTML = "Kraunama...";
  const league = document.getElementById("league").value;
  const market = document.getElementById("market").value;
  const today = new Date().toISOString().split("T")[0];

  const data = await api(`fixtures?league=${league}&date=${today}`);
  let html = "";

  for(let m of data.response.slice(0,15)){
    const h = await api(`stats?team=${m.teams.home.id}&league=${league}`);
    const a = await api(`stats?team=${m.teams.away.id}&league=${league}`);

    let p=0,label="";
    if(market==="btts"){p=analyzeBTTS(h,a);label="BTTS YES";}
    else if(market==="ou"){p=analyzeOver(h,a);label="Over 2.5";}
    else{p=analyzeDC(h,a);label="Double Chance 1X";}

    const [st,c]=status(p);

    html+=`
    <div class="match">
      <b>${m.teams.home.name} – ${m.teams.away.name}</b><br>
      ${label}: <span class="${c}">${p}% ${st}</span>
    </div>`;
  }
  document.getElementById("matches").innerHTML = html;
}

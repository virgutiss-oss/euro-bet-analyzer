async function loadMatches(){
  document.getElementById("matches").innerHTML="Kraunama...";

  const today=new Date().toISOString().split("T")[0];
  const res=await fetch(`https://${API_HOST}/fixtures?date=${today}&continent=Europe`,{
    headers:{"x-apisports-key":API_KEY}
  });

  const data=await res.json();
  let html="";

  for(let m of data.response.slice(0,15)){
    let hs=await stats(m.teams.home.id,m.league.id);
    let as=await stats(m.teams.away.id,m.league.id);
    let market=document.getElementById("market").value;
    let p=0,label="";

    if(market=="btts"){p=analyzeBTTS(hs,as);label="BTTS YES";}
    else if(market=="ou"){p=analyzeOver(hs,as);label="Over 2.5";}
    else{p=analyzeDC(hs,as);label="Double Chance 1X";}

    let [st,c]=status(p);

    html+=`
    <div class="match">
    <b>${m.teams.home.name} – ${m.teams.away.name}</b><br>
    ${label}: <span class="${c}">${p}% ${st}</span>
    </div>`;
  }
  document.getElementById("matches").innerHTML=html;
}

async function stats(team,league){
  const r=await fetch(`https://${API_HOST}/teams/statistics?team=${team}&league=${league}&season=2024`,{
    headers:{"x-apisports-key":API_KEY}
  });
  return (await r.json()).response;
}

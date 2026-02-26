const SPORTS = {
  soccer: [
    "soccer_epl",
    "soccer_spain_la_liga",
    "soccer_germany_bundesliga",
    "soccer_italy_serie_a",
    "soccer_uefa_champs_league"
  ],
  basketball: [
    "basketball_nba",
    "basketball_euroleague",
    "basketball_fiba_world_cup"
  ],
  icehockey: [
    "icehockey_nhl",
    "icehockey_sweden_hockey_league",
    "icehockey_finland_liiga"
  ]
};

let currentFilter = {
  minOdds: 1.40,
  maxOdds: 2.50,
  minEV: 3,
  minConfidence: 55,
  date: "today"
};

async function loadSport(sport){

  document.getElementById("sportTitle").innerText="Kraunama...";
  document.getElementById("games").innerHTML="";
  document.getElementById("top3").innerHTML="";

  const res = await fetch(`/api/odds?sport=${sport}`);
  const games = await res.json();

  if(!games || games.length===0){
    document.getElementById("sportTitle").innerText="Nėra rungtynių";
    return;
  }

  analyzeGames(games);
}

function analyzeGames(games){

  let picks=[];

  games.forEach(game=>{

    const gameDate = new Date(game.commence_time);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate()+1);

    if(currentFilter.date==="today" &&
       gameDate.toDateString()!==today.toDateString()) return;

    if(currentFilter.date==="tomorrow" &&
       gameDate.toDateString()!==tomorrow.toDateString()) return;

    if(!game.bookmakers) return;

    game.bookmakers.forEach(book=>{

      book.markets.forEach(market=>{

        if(!["h2h","totals"].includes(market.key)) return;

        const outcomes = market.outcomes;

        if(market.key==="h2h" && outcomes.length>=2){

          const p1 = 1/outcomes[0].price;
          const p2 = 1/outcomes[1].price;

          const margin = p1+p2;

          const fair1 = p1/margin;
          const fair2 = p2/margin;

          addPick(game,market,outcomes[0],fair1,picks);
          addPick(game,market,outcomes[1],fair2,picks);
        }

        if(market.key==="totals"){
          outcomes.forEach(out=>{
            const prob = 1/out.price;
            addPick(game,market,out,prob,picks);
          });
        }

      });

    });

  });

  picks.sort((a,b)=>b.ev-a.ev);

  displayTop(picks.slice(0,3));
  displayAll(picks);
}

function addPick(game,market,outcome,fairProb,picks){

  const odds = outcome.price;
  if(odds<currentFilter.minOdds || odds>currentFilter.maxOdds) return;

  const ev = (fairProb*odds-1)*100;
  const confidence = fairProb*100;

  if(ev<currentFilter.minEV) return;
  if(confidence<currentFilter.minConfidence) return;

  picks.push({
    match:`${game.home_team} vs ${game.away_team}`,
    market:market.key,
    pick:outcome.name,
    line:outcome.point||"",
    odds:odds.toFixed(2),
    ev:ev.toFixed(2),
    confidence:confidence.toFixed(1),
    date:new Date(game.commence_time).toLocaleString()
  });
}

function displayTop(picks){
  document.getElementById("top3").innerHTML="<h3>🔥 Top Value</h3>";
  picks.forEach(p=>{
    document.getElementById("top3").innerHTML+=card(p,true);
  });
}

function displayAll(picks){
  document.getElementById("games").innerHTML="<h3>Visi atrinkti</h3>";
  picks.forEach(p=>{
    document.getElementById("games").innerHTML+=card(p,false);
  });
}

function card(p,top){
  return `
  <div class="game ${top?'top-card':''}">
    <div class="match">${p.match}</div>
    <div>${p.market.toUpperCase()} – ${p.pick} ${p.line}</div>
    <div>Odds ${p.odds}</div>
    <div>EV ${p.ev}% | Confidence ${p.confidence}%</div>
    <div style="font-size:12px;color:#aaa">${p.date}</div>
  </div>
  `;
}

const SPORTS = {
  soccer: [
    "soccer_epl",
    "soccer_spain_la_liga",
    "soccer_germany_bundesliga",
    "soccer_italy_serie_a"
  ],
  basketball: [
    "basketball_nba",
    "basketball_euroleague"
  ],
  icehockey: [
    "icehockey_nhl"
  ]
};

async function loadSport(sport){

  document.getElementById("sportTitle").innerText="Kraunama...";
  document.getElementById("games").innerHTML="";
  document.getElementById("top3").innerHTML="";

  try{

    const res = await fetch(`/api/odds?sport=${sport}`);
    const data = await res.json();

    if(!data || data.length===0){
      document.getElementById("sportTitle").innerText="Nėra rungtynių";
      return;
    }

    analyzeGames(data);

  }catch(err){
    document.getElementById("sportTitle").innerText="Klaida";
    document.getElementById("games").innerHTML =
      `<div class="game">${err.message}</div>`;
  }
}

function analyzeGames(games){

  document.getElementById("sportTitle").innerText="Geriausi šiandien";

  let bestPicks=[];

  games.forEach(game=>{

    if(!game.bookmakers) return;

    game.bookmakers.forEach(book=>{
      book.markets.forEach(market=>{
        market.outcomes.forEach(outcome=>{

          if(outcome.price<1.40 || outcome.price>2.50) return;

          bestPicks.push({
            match:`${game.home_team} vs ${game.away_team}`,
            type:market.key,
            pick:outcome.name,
            line:outcome.point||"",
            odds:outcome.price
          });

        });
      });
    });

  });

  bestPicks.slice(0,5).forEach(p=>{
    document.getElementById("games").innerHTML+=`
      <div class="game">
        <div class="match">${p.match}</div>
        <div class="pick">
          ${p.type} – ${p.pick} ${p.line}<br>
          Odds ${p.odds}
        </div>
      </div>
    `;
  });

}

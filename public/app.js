const API_KEY = "b2e1590b865bd748e670388b64aad940";
const BASE = "https://api.the-odds-api.com/v4/sports/";

const SPORTS = {
  soccer: [
    "soccer_epl",
    "soccer_spain_la_liga",
    "soccer_germany_bundesliga",
    "soccer_italy_serie_a",
    "soccer_france_ligue_one",
    "soccer_uefa_champs_league"
  ],
  basketball: [
    "basketball_nba",
    "basketball_euroleague",
    "basketball_spain_acb",
    "basketball_germany_bbl"
  ],
  icehockey: [
    "icehockey_nhl",
    "icehockey_sweden_allsvenskan",
    "icehockey_finland_liiga"
  ]
};

async function loadSport(sport){

  document.getElementById("sportTitle").innerText="Kraunama...";

  let allGames=[];

  for(const league of SPORTS[sport]){
    const url=`${BASE}${league}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,totals`;
    const res=await fetch(url);
    const data=await res.json();
    allGames=allGames.concat(data);
  }

  analyzeGames(allGames,sport);
}

function analyzeGames(games,sport){

  document.getElementById("games").innerHTML="";
  document.getElementById("top3").innerHTML="";
  document.getElementById("sportTitle").innerText="Geriausi šiandien";

  let today=[];

  games.forEach(game=>{

    if(!game.bookmakers || game.bookmakers.length<3) return;

    let best=null;

    game.bookmakers.forEach(book=>{
      book.markets.forEach(market=>{
        market.outcomes.forEach(outcome=>{

          if(!outcome.price || outcome.price<1.40 || outcome.price>3.00) return;

          const prices=collectPrices(game,market.key,outcome.name,outcome.point);
          if(prices.length<3) return;

          const fairProb=removeMargin(prices);
          const ev=(fairProb*outcome.price)-1;
          const variance=getVariance(prices);

          if(ev>0.03 && variance<0.15){
            if(!best || ev>best.ev){
              best={
                match:`${game.home_team} vs ${game.away_team}`,
                type:market.key==="h2h"?"WIN/LOSE":"OVER/UNDER",
                pick:outcome.name,
                line:outcome.point||"",
                odds:outcome.price.toFixed(2),
                ev
              };
            }
          }

        });
      });
    });

    if(best){
      document.getElementById("games").innerHTML+=`
      <div class="game">
        <div class="match">${best.match}</div>
        <div class="pick">
          ${best.type} – ${best.pick} ${best.line}
          <br>
          Odds ${best.odds} | Value ${(best.ev*100).toFixed(2)}%
        </div>
      </div>
      `;
      today.push(best);
    }

  });

  today.sort((a,b)=>b.ev-a.ev).slice(0,3).forEach(p=>{
    document.getElementById("top3").innerHTML+=`
    <div class="top-card">
      <b>${p.match}</b><br>
      ${p.type} – ${p.pick} ${p.line}<br>
      Odds ${p.odds} | Value ${(p.ev*100).toFixed(2)}%
    </div>
    `;
  });

}

function collectPrices(game,key,name,point){
  let arr=[];
  game.bookmakers.forEach(b=>{
    b.markets.forEach(m=>{
      if(m.key!==key) return;
      m.outcomes.forEach(o=>{
        if(o.name===name && o.point===point) arr.push(o.price);
      });
    });
  });
  return arr;
}

function removeMargin(prices){
  const implied=prices.map(p=>1/p);
  const sum=implied.reduce((a,b)=>a+b,0);
  return implied[0]/sum;
}

function getVariance(arr){
  const avg=arr.reduce((a,b)=>a+b,0)/arr.length;
  return Math.sqrt(arr.map(x=>(x-avg)**2).reduce((a,b)=>a+b)/arr.length);
}

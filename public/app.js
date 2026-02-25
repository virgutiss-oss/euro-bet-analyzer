const API_KEY = "b2e1590b865bd748e670388b64aad940";
const BASE="https://api.the-odds-api.com/v4/sports/";

let MODE="safe";
let minOdds=1.40;
let maxOdds=1.90;

function setMode(mode){
  MODE=mode;

  if(mode==="safe"){
    minOdds=1.40;
    maxOdds=1.90;
    document.getElementById("minConf").value=65;
    document.getElementById("safeBtn").classList.add("active");
    document.getElementById("aggBtn").classList.remove("active");
  }else{
    minOdds=1.60;
    maxOdds=3.50;
    document.getElementById("minConf").value=55;
    document.getElementById("aggBtn").classList.add("active");
    document.getElementById("safeBtn").classList.remove("active");
  }
}

async function loadOdds(){

  const sport=document.getElementById("sport").value;
  const minEv=parseFloat(document.getElementById("minEv").value)/100;
  const minBooks=parseInt(document.getElementById("minBooks").value);
  const minConf=parseFloat(document.getElementById("minConf").value)/100;

  const url=`${BASE}${sport}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,totals`;
  const res=await fetch(url);
  const data=await res.json();

  document.getElementById("games").innerHTML="";
  document.getElementById("top3").innerHTML="";

  let today=[];

  data.forEach(game=>{

    if(!game.bookmakers || game.bookmakers.length<minBooks) return;

    let best=null;

    game.bookmakers.forEach(book=>{
      book.markets.forEach(market=>{
        market.outcomes.forEach(outcome=>{

          if(!outcome.price) return;
          if(outcome.price<minOdds || outcome.price>maxOdds) return;

          const prices=collectPrices(game,market.key,outcome.name,outcome.point);
          if(prices.length<minBooks) return;

          const fairProb=removeMargin(prices);
          const ev=(fairProb*outcome.price)-1;
          const variance=getVariance(prices);
          const conf=(1-variance)*fairProb;

          if(ev>minEv && conf>minConf){
            if(!best || ev>best.ev){
              best={
                match:`${game.home_team} vs ${game.away_team}`,
                type:market.key==="h2h"?"WIN":"TOTAL",
                pick:outcome.name,
                line:outcome.point||"",
                odds:outcome.price.toFixed(2),
                ev,
                conf
              };
            }
          }

        });
      });
    });

    if(best){
      document.getElementById("games").innerHTML+=`
      <div class="game">
        <b>${best.match}</b>
        <div class="pick">
          ${best.type} – ${best.pick} ${best.line}
          <br>
          Odds ${best.odds}
          | EV ${(best.ev*100).toFixed(2)}%
          | Conf ${(best.conf*100).toFixed(0)}%
        </div>
      </div>
      `;

      if(isToday(game.commence_time)) today.push(best);
    }

  });

  today.sort((a,b)=>b.ev-a.ev).slice(0,3).forEach(p=>{
    document.getElementById("top3").innerHTML+=`
    <div class="top-card">
      <b>${p.match}</b><br>
      ${p.type} – ${p.pick} ${p.line}<br>
      Odds ${p.odds} | EV ${(p.ev*100).toFixed(2)}% | Conf ${(p.conf*100).toFixed(0)}%
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

function isToday(dateStr){
  const d=new Date(dateStr);
  const t=new Date();
  return d.toDateString()===t.toDateString();
}

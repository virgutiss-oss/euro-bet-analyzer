export default async function handler(req,res){
  const { league, market } = req.query;
  const KEY = process.env.ODDS_API_KEY;

  const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?apiKey=${KEY}&regions=eu&markets=h2h,totals&oddsFormat=decimal`;
  const r = await fetch(url);
  const data = await r.json();

  const out = [];

  data.slice(0,6).forEach(g=>{
    const bm = g.bookmakers?.[0];
    if(!bm) return;

    if(market==="win"){
      const h = bm.markets.find(m=>m.key==="h2h");
      const fav = h.outcomes.reduce((a,b)=>a.price<b.price?a:b);
      const value = ((1/fav.price)-0.5)*100;

      out.push({
        match:`${g.home_team} vs ${g.away_team}`,
        pick:`Win ${fav.name}`,
        odds:fav.price,
        value:value.toFixed(1),
        form:fav.price<1.7?"🔥 Favoritas":"⚠ Rizika"
      });
    }

    if(market!=="win"){
      const t = bm.markets.find(m=>m.key==="totals");
      if(!t) return;

      const over = t.outcomes.find(o => o.name === "Over");
const under = t.outcomes.find(o => o.name === "Under");

const pOver = 1 / over.price;
const pUnder = 1 / under.price;
const margin = pOver + pUnder;

const fairOver = pOver / margin;
const fairUnder = pUnder / margin;

// pasirenkam TIK GERESNĮ
let pick, value;

if (fairOver > fairUnder) {
  pick = over;
  value = ((fairOver * over.price) - 1) * 100;
} else {
  pick = under;
  value = ((fairUnder * under.price) - 1) * 100;
}

// RODOM TIK JEI YRA REALUS VALUE
if (value > 1) {
  out.push({
    match: `${g.home_team} vs ${g.away_team}`,
    pick: `${pick.name} ${pick.point}`,
    odds: pick.price,
    value: value.toFixed(1),
    form: fairOver > 0.55 || fairUnder > 0.55 ? "🔥 Stiprus edge" : "⚠ Silpnas edge"
  });
}

      out.push({
        match:`${g.home_team} vs ${g.away_team}`,
        pick:`${pick.name} ${pick.point}`,
        odds:pick.price,
        value:value.toFixed(1),
        form:pick.point>210?"🏀 Aukštas tempas":"⚽ Lėtas tempas"
      });
    }
  });

  res.json(out);
}

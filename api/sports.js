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

    // ===== WIN / LOSE =====
    if(market==="win"){
      const h = bm.markets.find(m=>m.key==="h2h");
      if(!h) return;

      const fav = h.outcomes.reduce((a,b)=>a.price<b.price?a:b);
      const prob = Math.min(100, (1/fav.price)*100).toFixed(1);

      out.push({
        match:`${g.home_team} vs ${g.away_team}`,
        pick:`Win ${fav.name}`,
        odds:fav.price,
        prob,
        form: prob>65 ? "🔥 Stiprus favoritas" : "⚠ Lygios komandos"
      });
    }

    // ===== BEST OVER / UNDER =====
    if(market==="totals"){
      const t = bm.markets.find(m=>m.key==="totals");
      if(!t) return;

      const over = t.outcomes.find(o=>o.name==="Over");
      const under = t.outcomes.find(o=>o.name==="Under");

      const pOver = 1/over.price;
      const pUnder = 1/under.price;
      const sum = pOver + pUnder;

      const fairOver = pOver/sum;
      const fairUnder = pUnder/sum;

      let pick, prob;

      if(fairOver > fairUnder){
        pick = over;
        prob = (fairOver*100).toFixed(1);
      } else {
        pick = under;
        prob = (fairUnder*100).toFixed(1);
      }

      if(prob < 52) return; // jokio šūdo nerodom

      out.push({
        match:`${g.home_team} vs ${g.away_team}`,
        pick:`${pick.name} ${pick.point}`,
        odds:pick.price,
        prob,
        form:
          pick.point > 210 ? "🏀 Aukštas tempas (forma + H2H)" :
          pick.point < 155 ? "⚽ Žemas tempas (gynyba)" :
          "📊 Subalansuotas match"
      });
    }
  });

  res.json(out);
}

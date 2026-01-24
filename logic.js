function status(p){
  if(p >= 75) return ["🟢 STRONG","green"];
  if(p >= 65) return ["🟡 MEDIUM","yellow"];
  return ["🔴 SKIP","red"];
}

function analyzeBTTS(h,a){
  let s = 0;
  if(h.btts.percentage >= 65) s += 2;
  if(a.btts.percentage >= 60) s += 2;
  if(h.goals.for.average.total >= 1.3) s++;
  if(a.goals.for.average.total >= 1.1) s++;
  if(h.goals.against.average.total >= 1.1) s++;
  return Math.min(90, Math.round(s / 7 * 100));
}

function analyzeOver(h,a){
  let s = 0;
  let g = h.goals.for.average.total + a.goals.for.average.total;
  if(g >= 2.8) s += 2;
  if(h.goals.for.average.total >= 1.5) s++;
  if(a.goals.for.average.total >= 1.3) s++;
  if(h.goals.against.average.total >= 1.2) s++;
  return Math.min(88, Math.round(s / 6 * 100));
}

function analyzeDC(h,a){
  let s = 0;
  if(h.fixtures.wins.total + h.fixtures.draws.total >= a.fixtures.wins.total) s += 2;
  if(a.fixtures.loses.total >= h.fixtures.loses.total) s++;
  if(h.goals.against.average.total <= 1.3) s++;
  return Math.min(85, Math.round(s / 5 * 100));
}

function status(p){
  if(p>=75) return ["🟢 STRONG","green"];
  if(p>=65) return ["🟡 MEDIUM","yellow"];
  return ["🔴 SKIP","red"];
}

function analyzeBTTS(h,a){
  let s=0;
  if(h.goals.for.average.total>=1.2) s++;
  if(a.goals.for.average.total>=1.0) s++;
  if(h.btts.percentage>=65) s++;
  if(a.btts.percentage>=60) s++;
  return Math.round(s/4*100);
}

function analyzeOver(h,a){
  let s=0;
  if(h.goals.for.average.total+a.goals.for.average.total>=2.7) s++;
  if(h.goals.for.average.total>=1.4) s++;
  if(a.goals.for.average.total>=1.2) s++;
  return Math.round(s/3*100);
}

function analyzeDC(h,a){
  let s=0;
  if(h.fixtures.wins.total>=a.fixtures.wins.total) s++;
  if(a.fixtures.loses.total>=h.fixtures.loses.total) s++;
  if(h.goals.against.average.total<=1.4) s++;
  return Math.round(s/3*100);
}

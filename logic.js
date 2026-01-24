function analyzeDC(home, away) {
  return Math.min(90, Math.round((home.form + away.form) / 2));
}

function analyzeOver(home, away) {
  return Math.min(90, Math.round((home.goals.for.average.total +
    away.goals.for.average.total) * 20));
}

function analyzeBTTS(home, away) {
  return Math.min(90, Math.round((home.goals.for.average.total +
    away.goals.for.average.total) * 18));
}

function status(p) {
  if (p >= 70) return ["STRONG", "green"];
  if (p >= 55) return ["OK", "orange"];
  return ["RISKY", "red"];
}

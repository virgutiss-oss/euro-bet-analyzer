const out = document.getElementById("out");
const btn = document.getElementById("load");

btn.onclick = async () => {
  out.innerHTML = "⏳ Kraunama...";
  const r = await fetch("/api/odds");
  const data = await r.json();

  out.innerHTML = "";
  data.forEach(d => {
    out.innerHTML += `
      <div class="card">
        <b>${d.match}</b><br>
        ${d.market}<br>
        <b>${d.pick}</b><br>
        Odds: ${d.odds}<br>
        ${d.prob || ""}
      </div>
    `;
  });
};

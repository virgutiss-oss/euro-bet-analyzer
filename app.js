async function analyze() {
  const sport = document.getElementById("sport").value;
  const market = document.getElementById("market").value;
  const line = document.getElementById("line").value;
  const box = document.getElementById("results");

  box.innerHTML = "⏳ Kraunama...";

  try {
    const res = await fetch(
      `/api/sports?sport=${sport}&market=${market}&line=${line}`
    );
    const data = await res.json();

    if (!data || data.length === 0) {
      box.innerHTML = "❌ Nėra duomenų";
      return;
    }

    box.innerHTML = data.map(m => `
      <div class="card">
        <strong>${m.match}</strong><br>
        Prognozė: ${m.pick}
      </div>
    `).join("");

  } catch (e) {
    box.innerHTML = "❌ Serverio klaida";
  }
}

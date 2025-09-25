// public/app.js

export function mountCountdown(iso) {
  const target = new Date(iso).getTime();
  const d = document.getElementById("d");
  const h = document.getElementById("h");
  const m = document.getElementById("m");
  const s = document.getElementById("s");
  if (!d || !h || !m || !s || Number.isNaN(target)) return;

  let lastSec = -1;
  function tick() {
    const now = Date.now();
    const diff = Math.max(0, target - now);
    const totalSecs = Math.floor(diff / 1000);
    if (totalSecs === lastSec) return;
    lastSec = totalSecs;
    let rem = totalSecs;
    const days = Math.floor(rem / 86400); rem -= days * 86400;
    const hours = Math.floor(rem / 3600); rem -= hours * 3600;
    const mins  = Math.floor(rem / 60);   rem -= mins * 60;
    const secs  = rem;
    d.textContent = String(days);
    h.textContent = String(hours).padStart(2, "0");
    m.textContent = String(mins).padStart(2, "0");
    s.textContent = String(secs).padStart(2, "0");
  }
  tick();
  setInterval(tick, 250);
}

export function mountRSVP() {
  const form = document.getElementById("rsvp");
  if (!form) return;

  const statusEl = document.getElementById("status");
  const sendBtn  = document.getElementById("sendBtn");

  const val = (name) => form.elements[name]?.value.trim() || "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    statusEl.textContent = "⏳ Envoi en cours…";
    statusEl.className = "is-wait";
    sendBtn.disabled = true;

    const payload = {
      nom_prenom: val("nom_prenom"),
      fiancaille: val("fiancaille"),
      nb_fiancaille: val("nb_fiancaille"),
      reception: val("reception"),
      nb_reception: val("nb_reception"),
      message_maries: val("message_maries"),
    };

    if (!payload.nom_prenom) {
      statusEl.textContent = "⚠️ Merci d’indiquer votre nom et prénom";
      statusEl.className = "is-err";
      sendBtn.disabled = false;
      return;
    }

    if (payload.fiancaille === "Non") payload.nb_fiancaille = 0;
    if (payload.reception === "Non") payload.nb_reception = 0;

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        statusEl.textContent = "✅ Merci ! Votre réponse a été enregistrée 🎉";
        statusEl.className = "is-ok";
        form.querySelectorAll("input, select, textarea, button").forEach(el => el.disabled = true);
        sendBtn.style.display = "none";
      } else {
        const why = data?.detail || data?.error || `HTTP ${res.status}`;
        statusEl.textContent = `⚠️ Erreur : ${why}`;
        statusEl.className = "is-err";
        sendBtn.disabled = false;
      }
    } catch (err) {
      statusEl.textContent = `❌ Erreur réseau : ${err.message}`;
      statusEl.className = "is-err";
      sendBtn.disabled = false;
    }
  });
}



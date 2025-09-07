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
    if (totalSecs === lastSec) return; // évite le travail inutile si même seconde
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
  setInterval(tick, 250); // réactif sans être coûteux
}

export function mountRSVP() {
  const form = document.getElementById("rsvp");
  if (!form) return;

  const statusEl = document.getElementById("status");
  const sendBtn  = document.getElementById("sendBtn");
  const nameEl   = form.querySelector("#name");
  const recEl    = form.querySelector("#reception");
  const nbEl     = form.querySelector("#nbHouppa");
  const msgEl    = form.querySelector("#message");

  const setStatus = (msg, cls) => {
    statusEl.textContent = msg;
    statusEl.classList.remove("is-ok","is-err","is-wait");
    if (cls) statusEl.classList.add(cls);
  };

  // Force 0 quand "Non"
  recEl?.addEventListener("change", () => {
    if (recEl.value === "Non") nbEl.value = "0";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!nameEl.value.trim()) {
      nameEl.focus();
      return setStatus("Veuillez renseigner votre nom.", "is-err");
    }

    sendBtn.disabled = true;
    form.setAttribute("aria-busy", "true");
    setStatus("⏳ Envoi en cours…", "is-wait");

    const payload = {
      name: nameEl.value.trim(),
      reception: recEl?.value || "",
      nbHouppa: Number(nbEl?.value || 0),
      message: msgEl?.value || "",
    };

    if (payload.reception === "Non") payload.nbHouppa = 0;

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        setStatus("🎉 Merci ! Votre réponse a bien été enregistrée.", "is-ok");
        form.reset();
      } else {
        const why = data?.detail?.message || data?.detail || data?.error || `HTTP ${res.status}`;
        setStatus(`⚠️ Oups, votre réponse n’a pas pu être enregistrée. (${why})`, "is-err");
        console.error("RSVP error:", data || res.status);
      }
    } catch (err) {
      setStatus(`❌ Erreur réseau : ${err.message}`, "is-err");
      console.error(err);
    } finally {
      sendBtn.disabled = false;
      form.removeAttribute("aria-busy");
    }
  });
}

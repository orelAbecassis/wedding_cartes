// ===== Compte à rebours =====
export function mountCountdown(targetISO){
  const target = new Date(targetISO).getTime();
  const dEl = document.getElementById('d');
  const hEl = document.getElementById('h');
  const mEl = document.getElementById('m');
  const sEl = document.getElementById('s');
  if(!dEl||!hEl||!mEl||!sEl) return;
  const tick = () => {
    const now = Date.now();
    let diff = Math.max(0, target - now);
    const days = Math.floor(diff / 86400000); diff -= days*86400000;
    const hours = Math.floor(diff / 3600000); diff -= hours*3600000;
    const minutes = Math.floor(diff / 60000); diff -= minutes*60000;
    const seconds = Math.floor(diff / 1000);
    dEl.textContent = days;
    hEl.textContent = String(hours).padStart(2,'0');
    mEl.textContent = String(minutes).padStart(2,'0');
    sEl.textContent = String(seconds).padStart(2,'0');
  };
  tick(); setInterval(tick, 1000);
}

// ===== Form RSVP -> /api/rsvp =====
export function mountRSVP(){
  const form = document.getElementById('rsvp');
  if(!form) return;
  const statusEl = document.getElementById('status');
  const sendBtn = document.getElementById('sendBtn');

  const setStatus = (msg, cls) => {
    statusEl.textContent = msg;
    statusEl.classList.remove('is-ok','is-err','is-wait');
    if (cls) statusEl.classList.add(cls);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    sendBtn.disabled = true;
    setStatus("⏳ Envoi en cours…", "is-wait");

    let mairie = form.mairie.value;
    let nbMairie = Number(form.nbMairie.value || 0);
    if (mairie === "Non") nbMairie = 0;

    let reception = form.reception.value;
    let nbHouppa = Number(form.nbHouppa.value || 0);
    if (reception === "Non") nbHouppa = 0;

    const payload = {
      name: form.name.value.trim(),
      mairie, nbMairie,
      reception, nbHouppa,
      message: form.message.value
    };

    try{
      const res = await fetch("/api/rsvp", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(()=> ({}));
      if(res.ok && data.ok){
        setStatus("🎉 Merci ! Votre réponse a bien été enregistrée.", "is-ok");
        form.reset();
      }else{
        const why = data?.detail?.message || data?.detail || data?.error || (`HTTP ${res.status}`);
        setStatus(`⚠️ Oups, votre réponse n’a pas pu être enregistrée. (${why})`, "is-err");
        console.error("RSVP error:", data || res.status);
      }
    }catch(err){
      setStatus(`❌ Erreur réseau: ${err.message}`, "is-err");
      console.error(err);
    }finally{
      sendBtn.disabled = false;
    }
  });
}

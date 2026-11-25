// Temps réel (Supabase Realtime). La base signale seulement « ça a changé » : la page relit alors ses données, avec ses droits (supabase/avis.sql).
// Chaque signal devient un évènement « direct » { sujet, quoi }. quoi = 'tout' après une coupure : des signaux ont pu être manqués.
const sujets = new Map(); // sujet → { prive, pret, deja }
let prise = null, numero = 0, battement, retard = 1000, jetonDit;
const emettre = (topic, event, payload = {}) => { if (prise?.readyState === 1) prise.send(JSON.stringify({ topic, event, payload, ref: String(++numero) })); };
const annoncer = (sujet, quoi) => document.dispatchEvent(new CustomEvent('direct', { detail: { sujet, quoi } }));
const enDirect = sujet => prise?.readyState === 1 && !!sujets.get(sujet)?.pret;

async function rejoindre(sujet) {
  const s = sujets.get(sujet);
  if (!s || prise?.readyState !== 1) return;
  if (s.prive) { await valide().catch(() => { }); if (!session) return; jetonDit = session.access_token; }
  emettre('realtime:' + sujet, 'phx_join', { config: { broadcast: { ack: false, self: false }, presence: { enabled: false }, postgres_changes: [], private: s.prive }, ...(s.prive && { access_token: session.access_token }) });
}
function ouvrirDirect() {
  if (prise && prise.readyState < 2 || !sujets.size) return;
  const p = prise = new WebSocket(BASE.replace('https', 'wss') + '/realtime/v1/websocket?vsn=1.0.0&apikey=' + CLE);
  p.onopen = () => {
    retard = 1000;
    for (const s of sujets.keys()) rejoindre(s);
    clearInterval(battement);
    battement = setInterval(async () => {
      emettre('phoenix', 'heartbeat');
      await valide().catch(() => { });
      if (session && session.access_token !== jetonDit) { jetonDit = session.access_token; for (const [s, x] of sujets) if (x.prive) emettre('realtime:' + s, 'access_token', { access_token: jetonDit }); }
    }, 25000);
  };
  p.onmessage = e => {
    const m = JSON.parse(e.data), sujet = m.topic.replace('realtime:', ''), s = sujets.get(sujet);
    if (!s) return;
    if (m.event === 'broadcast') annoncer(sujet, m.payload.event);
    else if (m.event === 'phx_reply' && m.payload.status === 'ok') { if (!s.pret) { s.pret = true; if (s.deja) annoncer(sujet, 'tout'); s.deja = true; } }
    else if (m.event === 'phx_error' || m.event === 'phx_close' || m.event === 'phx_reply') { s.pret = false; setTimeout(() => { if (!sujets.get(sujet)?.pret) rejoindre(sujet); }, 5000); }
  };
  p.onclose = () => {
    if (p !== prise) return;
    clearInterval(battement);
    for (const s of sujets.values()) s.pret = false;
    setTimeout(ouvrirDirect, retard); retard = Math.min(retard * 2, 30000);
  };
}
function suivre(sujet, prive) {
  if (sujets.has(sujet)) return;
  sujets.set(sujet, { prive, pret: false, deja: false });
  prise?.readyState === 1 ? rejoindre(sujet) : ouvrirDirect();
}
function cesser(sujet) { emettre('realtime:' + sujet, 'phx_leave'); sujets.delete(sujet); }
document.addEventListener('visibilitychange', () => { if (!document.hidden) ouvrirDirect(); });

// Le compte connecté : ses tickets, son profil, ses favoris ; et le créateur.
const sujetsPrives = () => session ? ['compte:' + session.id, ...(session.dev ? ['dev'] : [])] : [];
function suivreCompte() {
  const voulus = sujetsPrives();
  for (const [s, x] of [...sujets]) if (x.prive && !voulus.includes(s)) cesser(s);
  voulus.forEach(s => suivre(s, true));
}
document.addEventListener('compte', suivreCompte);
compte.then(suivreCompte);
// Plusieurs signaux d'un coup (un vote, un ticket…) : une seule relecture.
function regrouper(faire, attente = 300) { let t; return () => { clearTimeout(t); t = setTimeout(faire, attente); }; }
const relireProfil = regrouper(() => chargerProfil()), relireFavoris = regrouper(() => lireFavoris());
document.addEventListener('direct', ({ detail: { sujet, quoi } }) => {
  if (!sujetsPrives().includes(sujet)) return;
  if (['tickets', 'profil', 'tout'].includes(quoi)) relireProfil();
  if (['favoris', 'tout'].includes(quoi) && sujet !== 'dev') relireFavoris();
});

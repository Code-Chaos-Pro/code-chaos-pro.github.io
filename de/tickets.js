// Tickets en discussion : « Mes tickets » et mode dev. Droits : supabase/avis.sql.
const ETATS = { attente: "Wartend", en_cours: "In Bearbeitung", cloture: "Geschlossen" };
const nomSujet = t => (SUJETS[t.type] || []).find(([code]) => code === t.sujet)?.[1] || t.sujet;
const nomLogiciel = id => LOGICIELS.find(l => l.id === id)?.nom || "Sonstiges";
const nomType = t => t.type === 'demande' ? "Ein Wunsch" : "Ein Problem";
// Images : privées, demandées avec la connexion de la personne. Affichées au clic seulement.
async function montrerImages(zone, chemins) {
  zone.replaceChildren();
  for (const c of chemins) try {
    const i = new Image(); i.src = URL.createObjectURL(await (await appel('/storage/v1/object/authenticated/messages/' + c)).blob()); i.alt = '';
    zone.append(i);
  } catch { zone.append(bloc('span', 'doux', "Bild nicht verfügbar")); }
}
const boutonImages = t => { const z = bloc('div', 'apercus'); z.append(bouton(`${"Bilder anzeigen"} (${t.images.length})`, () => montrerImages(z, t.images), 'fermer')); return z; };

// La discussion d'un ticket : messages et réponse. maj(t) : nouvel état reçu ; les messages déjà affichés ne bougent pas.
function discussion(t) {
  const messages = bloc('div', 'messages'), pied = bloc('div', 'pied-discussion'), zone = bloc('div', 'discussion', messages, pied);
  let dernier = 0, clos = null;
  async function lire() {
    const liste = await rpc('ouvrir_ticket', { le_ticket: t.id }), neufs = liste.filter(m => m.id > dernier);
    t.non_lu = false; t.reponses = liste.length;
    if (!neufs.length) return;
    dernier = liste.at(-1).id;
    messages.append(...neufs.map(m => bloc('div', m.le_mien ? 'bulle-message mien' : 'bulle-message',
      bloc('div', 'qui', avatar(m.avatar), bloc('strong', '', m.pseudo || ''), ...(m.dev ? [badgeCreateur()] : []), bloc('span', 'doux', dateFr(m.cree))), bloc('p', 'message', m.texte))));
    messages.scrollTop = messages.scrollHeight;
  }
  function montrerPied() {
    if (clos === (t.etat === 'cloture')) return; // ne pas effacer une réponse en cours d'écriture
    clos = t.etat === 'cloture';
    if (clos) return pied.replaceChildren(bloc('p', 'doux', "Dieses Ticket ist geschlossen."));
    const champ = Object.assign(document.createElement('textarea'), { maxLength: 4000, required: true, placeholder: "Deine Antwort" }), dit = bloc('p', 'erreur'), ok = bloc('button', 'bouton petit', "Senden"), f = bloc('form', 'reponse', champ, dit, bloc('div', '', ok));
    champ.setAttribute('aria-label', "Deine Antwort"); dit.setAttribute('role', 'status');
    champ.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.requestSubmit(); };
    f.onsubmit = async e => {
      e.preventDefault(); ok.disabled = true; dit.textContent = '';
      try { await ecrireTable('ticket_messages', { ticket: t.id, texte: champ.value.trim() }); champ.value = ''; await lire(); champ.focus(); }
      catch (x) { dit.textContent = x.message.includes('cloture') ? "Dieses Ticket ist geschlossen." : x.message.includes('limite') ? "Du hast viel geschrieben. Versuche es in einer Stunde erneut." : "Die Nachricht wurde nicht gesendet. Versuche es erneut."; }
      finally { ok.disabled = false; }
    };
    pied.replaceChildren(f);
  }
  montrerPied();
  zone.maj = async n => { Object.assign(t, n); montrerPied(); try { await lire(); } catch { if (!dernier) messages.replaceChildren(bloc('p', 'doux', "Die Unterhaltung kann nicht gelesen werden.")); } };
  return zone;
}
// Carte de « Mes tickets ».
function carteTicket(t) {
  const etat = bloc('span'), zone = bloc('div'), voir = bouton('', () => { zone.hidden = !zone.hidden; montrer(); if (!zone.hidden) ouvrir(); }, 'fermer');
  const carte = bloc('article', 'encart ticket', bloc('div', 'qui', bloc('h2', '', nomSujet(t)), etat), bloc('p', 'doux', `${nomType(t)} · ${nomLogiciel(t.logiciel)} · ${dateFr(t.cree)}`), bloc('p', 'message', t.texte), ...(t.images.length ? [boutonImages(t)] : []), bloc('div', 'actions', voir), zone);
  let d = null;
  const montrer = () => {
    etat.className = 'etat ' + t.etat; etat.textContent = ETATS[t.etat];
    voir.textContent = zone.hidden ? `${"Unterhaltung öffnen"} (${t.reponses})` : "Unterhaltung schließen";
    voir.classList.toggle('non-lu', t.non_lu && zone.hidden);
  };
  async function ouvrir() { if (!d) zone.append(d = discussion(t)); await d.maj({}); chargerProfil(); }
  zone.hidden = true;
  montrer();
  carte.maj = n => { Object.assign(t, n); montrer(); if (!zone.hidden) d.maj({}); };
  return carte;
}

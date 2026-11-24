// Tickets en discussion : « Mes tickets » et mode dev. Droits : supabase/avis.sql.
const ETATS = { attente: "In attesa", en_cours: "In corso", cloture: "Chiuso" };
// Images : privées, demandées avec la connexion de la personne. Affichées au clic seulement.
async function montrerImages(zone, chemins) {
  zone.replaceChildren();
  for (const c of chemins) try {
    const i = new Image(); i.src = URL.createObjectURL(await (await appel('/storage/v1/object/authenticated/messages/' + c)).blob()); i.alt = '';
    zone.append(i);
  } catch { zone.append(bloc('span', 'doux', "Immagine non disponibile")); }
}
// t : ligne de lire_tickets. dev : page du créateur (avec l'adresse de la personne). outilsDev(t) : boutons en plus.
function carteTicket(t, dev, outilsDev) {
  const sujet = (SUJETS[t.type] || []).find(([code]) => code === t.sujet)?.[1] || t.sujet;
  const etat = bloc('span', 'etat ' + t.etat, ETATS[t.etat]), zone = bloc('div', 'discussion'), carte = bloc('article', 'encart ticket', bloc('div', 'qui', bloc('h2', '', sujet), etat));
  if (dev) carte.append(bloc('div', 'qui', avatar(t.avatar), bloc('strong', '', t.pseudo || "Account senza nome utente"), ...(t.createur ? [badgeCreateur()] : []), bloc('span', 'doux', t.email || "account senza e-mail")));
  carte.append(bloc('p', 'doux', `${t.type === 'demande' ? "Una richiesta" : "Un problema"} · ${LOGICIELS.find(l => l.id === t.logiciel)?.nom || "Altro"} · ${dateFr(t.cree)}`), bloc('p', 'message', t.texte));
  if (t.images.length) { const z = bloc('div', 'apercus'); z.append(bouton(`${"Mostra le immagini"} (${t.images.length})`, () => montrerImages(z, t.images), 'fermer')); carte.append(z); }
  let minuteur = null, lus = -1;
  const voir = bouton('', () => zone.hidden ? ouvrir() : fermer(), 'fermer');
  const libelle = () => { voir.textContent = zone.hidden ? `${"Apri la conversazione"} (${t.reponses})` : "Chiudi la conversazione"; voir.classList.toggle('non-lu', t.non_lu && zone.hidden); };
  const messages = bloc('div', 'messages');
  async function lire() {
    const liste = await rpc('ouvrir_ticket', { le_ticket: t.id });
    t.non_lu = false; t.reponses = liste.length;
    if (dev && t.etat === 'attente') { t.etat = 'en_cours'; etat.className = 'etat en_cours'; etat.textContent = ETATS.en_cours; } // l'ouvrir le fait passer « en cours »
    if (liste.length === lus) return;
    lus = liste.length;
    messages.replaceChildren(...liste.map(m => bloc('div', m.le_mien ? 'bulle-message mien' : 'bulle-message',
      bloc('div', 'qui', avatar(m.avatar), bloc('strong', '', m.pseudo || ''), ...(m.dev ? [badgeCreateur()] : []), bloc('span', 'doux', dateFr(m.cree))), bloc('p', 'message', m.texte))));
  }
  function fermer() { clearInterval(minuteur); zone.hidden = true; libelle(); }
  async function ouvrir() {
    zone.hidden = false; libelle();
    clearInterval(minuteur);
    minuteur = setInterval(() => { if (!document.hidden) carte.isConnected ? lire().catch(() => { }) : clearInterval(minuteur); }, 15000);
    const f = t.etat === 'cloture' ? bloc('p', 'doux', "Questo ticket è chiuso.") : bloc('form', 'reponse');
    if (t.etat !== 'cloture') {
      const champ = Object.assign(document.createElement('textarea'), { maxLength: 4000, required: true }), dit = bloc('p', 'erreur'), ok = bloc('button', 'bouton petit', "Invia");
      champ.setAttribute('aria-label', "La tua risposta"); dit.setAttribute('role', 'status');
      f.append(champ, dit, bloc('div', '', ok));
      f.onsubmit = async e => {
        e.preventDefault(); ok.disabled = true; dit.textContent = '';
        try { await ecrireTable('ticket_messages', { ticket: t.id, texte: champ.value.trim() }); champ.value = ''; await lire(); }
        catch (x) { dit.textContent = x.message.includes('cloture') ? "Questo ticket è chiuso." : x.message.includes('limite') ? "Hai scritto molto. Riprova tra un’ora." : "Il messaggio non è stato inviato. Riprova."; }
        finally { ok.disabled = false; }
      };
    }
    lus = -1;
    zone.replaceChildren(messages, f);
    try { await lire(); chargerProfil(); } catch { messages.replaceChildren(bloc('p', 'doux', "Impossibile leggere la conversazione.")); }
  }
  zone.hidden = true;
  libelle();
  carte.append(bloc('div', 'actions', voir, ...(outilsDev ? outilsDev(t) : [])), zone);
  carte.ouvrir = ouvrir;
  return carte;
}
// Remplit « zone » avec les tickets, 20 par 20. Rend le nombre de tickets affichés au premier appel.
async function listerTickets(zone, filtre, dev, outilsDev, debut = 0) {
  const lus = await rpc('lire_tickets', { tous: dev, ...filtre, debut }), cartes = lus.slice(0, PAGE).map(t => carteTicket(t, dev, outilsDev));
  if (lus.length > PAGE) { const suite = bouton("Mostra altro", () => { suite.remove(); listerTickets(zone, filtre, dev, outilsDev, debut + PAGE); }, 'fermer'); cartes.push(suite); }
  debut ? zone.append(...cartes) : zone.replaceChildren(...cartes);
  return cartes;
}

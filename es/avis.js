// Avis : note de 0 à 5 par demi-étoile (0 à 10 dans la base), réponses, pouces, signalement. Droits : supabase/avis.sql.
const surCinq = note => `${(note / 2).toLocaleString(racine.lang)} / 5`;
const PAGE = 20; // lire_avis rend une ligne de plus s'il y a une suite
const POUCE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11v9H3.5v-9zM7 11l4.2-7.6c1.6 0 2.6 1.1 2.4 2.7L13 9.5h5.6c1.3 0 2.2 1.2 1.9 2.4l-1.6 6.4c-.2 1-1.1 1.7-2.1 1.7H7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';

function etoiles(note) {
  const s = bloc('span', 'etoiles');
  s.innerHTML = `<span>${ETOILE.repeat(5)}</span><span style="width:${note * 10}%">${ETOILE.repeat(5)}</span>`;
  s.setAttribute('role', 'img'); s.setAttribute('aria-label', surCinq(note));
  return s;
}
// Note à choisir : clic ou glissé sur les étoiles (à gauche de la première : 0), ou flèches du clavier.
function choisirNote(note) {
  const e = etoiles(note ?? 0), dit = bloc('output', 'doux'), piste = bloc('div', 'piste', e), zone = bloc('div', 'noter', piste, dit);
  piste.tabIndex = 0;
  for (const [k, v] of Object.entries({ role: 'slider', 'aria-label': "Puntuación", 'aria-valuemin': 0, 'aria-valuemax': 5 })) piste.setAttribute(k, v);
  const montrer = () => {
    e.lastChild.style.width = (note ?? 0) * 10 + '%';
    dit.textContent = note == null ? "Desliza sobre las estrellas. Todo a la izquierda: 0." : surCinq(note);
    piste.setAttribute('aria-valuenow', (note ?? 0) / 2); piste.setAttribute('aria-valuetext', dit.textContent);
  };
  const poser = n => { note = Math.max(0, Math.min(10, n)); montrer(); };
  const souris = x => { const r = e.getBoundingClientRect(); poser(Math.ceil((x - r.left) / r.width * 10)); };
  piste.onpointerdown = ev => { piste.setPointerCapture(ev.pointerId); souris(ev.clientX); };
  piste.onpointermove = ev => { if (piste.hasPointerCapture(ev.pointerId)) souris(ev.clientX); };
  piste.onkeydown = ev => {
    const n = { ArrowRight: (note ?? -1) + 1, ArrowUp: (note ?? -1) + 1, ArrowLeft: (note ?? 1) - 1, ArrowDown: (note ?? 1) - 1, Home: 0, End: 10 }[ev.key];
    if (n !== undefined) { ev.preventDefault(); poser(n); }
  };
  montrer();
  return { zone, lire: () => note };
}
function erreurTexte(x) {
  if (x.code === 409) return "Ya has escrito una opinión.";
  if (x.message.includes('bloque') || x.code === 403) return "Tu cuenta ya no puede escribir opiniones.";
  if (x.message.includes('texte refuse')) return "Tu texto contiene una palabra no permitida.";
  if (x.message.includes('limite')) return "Has escrito mucho. Inténtalo de nuevo en una hora.";
  return "No se ha guardado tu texto. Inténtalo de nuevo.";
}
const champTexte = (valeur, required) => Object.assign(document.createElement('textarea'), { maxLength: 2000, required, value: valeur });
const changerAvis = (id, champs) => appel('/rest/v1/avis?id=eq.' + id, champs, { Prefer: 'return=minimal' }, 'PATCH');

let brouillon = ''; // texte gardé si la fenêtre est fermée par erreur
function ouvrirAvis(logiciel, a, fini) { // a : avis à modifier
  if (!session) return ouvrirConnexion("Inicia sesión para escribir una opinión.");
  const { d, zone, pied } = fenetre("Tu opinión", "Cancelar"), n = choisirNote(a?.note), champ = champTexte(a?.texte ?? brouillon, false), etat = bloc('p', 'erreur'), ok = bloc('button', 'bouton', "Publicar");
  const f = bloc('form', '', n.zone, bloc('label', 'champ', "Comentario (opcional)", champ), etat);
  etat.setAttribute('role', 'status'); f.id = 'f-avis'; ok.setAttribute('form', f.id);
  d.classList.add('large'); zone.append(f); pied.append(ok);
  if (!a) champ.oninput = () => { brouillon = champ.value; };
  f.onsubmit = async e => {
    e.preventDefault();
    if (n.lire() == null) { etat.textContent = "Elige una puntuación."; return; }
    ok.disabled = true;
    try {
      const champs = { note: n.lire(), texte: champ.value.trim() };
      await (a ? changerAvis(a.id, champs) : ecrireTable('avis', { logiciel, ...champs }));
      if (!a) brouillon = '';
      d.close(); fini();
    } catch (x) { etat.textContent = erreurTexte(x); }
    finally { ok.disabled = false; }
  };
}
function demander(titre, texte, libelle, action) { // confirmation
  const { d, zone, pied } = fenetre(titre, "Cancelar"), p = bloc('p', '', texte);
  zone.append(p);
  const b = bouton(libelle, async () => { b.disabled = true; try { await action(); d.close(); } catch { b.disabled = false; p.textContent = "No ha funcionado. Inténtalo de nuevo."; } }, 'bouton danger');
  pied.append(b);
}
const MOTIFS = [['insulte', "Insulto u odio"], ['publicite', "Publicidad o estafa"], ['hors-sujet', "Fuera de tema"], ['autre', "Otro"]];
function signaler(a) {
  if (!session) return ouvrirConnexion("Inicia sesión para denunciar una opinión.");
  const { zone, pied } = fenetre("Denunciar"), choix = document.createElement('select'), etat = bloc('p', 'doux');
  etat.setAttribute('role', 'status');
  for (const [v, t] of MOTIFS) choix.add(new Option(t, v));
  zone.append(bloc('label', 'champ', "Motivo", choix), etat);
  const b = bouton("Enviar", async () => {
    b.disabled = true;
    try { await ecrireTable('signalements', { avis: a.id, motif: choix.value }); etat.textContent = "Denuncia enviada. ¡Gracias!"; }
    catch (x) { b.disabled = false; etat.textContent = x.code === 409 ? "Ya has denunciado este texto." : "No se ha enviado la denuncia. Inténtalo de nuevo."; }
  });
  pied.append(b);
}
function pouces(a) {
  const faire = (positif, nom) => {
    const compte = bloc('span'), b = bloc('button', 'pouce ' + (positif ? 'vert' : 'rouge'));
    b.type = 'button'; b.innerHTML = POUCE; b.append(compte); b.title = nom; b.setAttribute('aria-label', nom);
    b.montrer = () => { compte.textContent = nombre(positif ? a.pour : a.contre); b.setAttribute('aria-pressed', a.mon_vote === positif); };
    b.onclick = async () => {
      if (!session) return ouvrirConnexion("Inicia sesión para votar.");
      const avant = { pour: a.pour, contre: a.contre, mon_vote: a.mon_vote };
      if (a.mon_vote === true) a.pour--;
      if (a.mon_vote === false) a.contre--;
      a.mon_vote = a.mon_vote === positif ? null : positif;
      if (a.mon_vote === true) a.pour++;
      if (a.mon_vote === false) a.contre++;
      tous.forEach(x => x.montrer());
      b.classList.remove('anime'); void b.offsetWidth; if (a.mon_vote === positif) b.classList.add('anime'); // offsetWidth : relance l'animation
      tous.forEach(x => { x.disabled = true; });
      try {
        if (a.mon_vote === null) await appel(`/rest/v1/pouces?avis=eq.${a.id}&compte=eq.${session.id}`, undefined, {}, 'DELETE');
        else await ecrireTable('pouces?on_conflict=avis,compte', { avis: a.id, positif: a.mon_vote }, ',resolution=merge-duplicates');
      } catch { Object.assign(a, avant); tous.forEach(x => x.montrer()); }
      tous.forEach(x => { x.disabled = false; });
    };
    b.montrer();
    return b;
  };
  const tous = [];
  tous.push(faire(true, "Pulgar arriba"), faire(false, "Pulgar abajo"));
  return tous;
}
const lien = (texte, action) => bouton(texte, action, 'lien');

let actionsDev = null; // boutons de modération, ajoutés par dev.html
// Un avis ou une réponse. fini : à rappeler après une modification ou une suppression. avecLogiciel : page « Mon compte ».
function carteAvis(a, fini, avecLogiciel) {
  const qui = bloc('div', 'qui', avatar(a.avatar), bloc('strong', '', a.pseudo), ...(a.createur ? [badgeCreateur()] : [])), texte = bloc('p', 'message', a.texte), actions = bloc('div', 'actions', ...pouces(a));
  const carte = bloc('article', 'avis', qui, texte, actions), reponse = a.note == null;
  if (avecLogiciel) {
    const l = LOGICIELS.find(x => x.id === a.logiciel), t = bloc('a', 'de', l?.nom || a.logiciel);
    if (l) t.href = l.page + '#avis';
    qui.prepend(t);
  }
  if (!reponse) qui.append(etoiles(a.note));
  qui.append(bloc('span', 'doux', dateFr(a.cree)));
  if (a.modifie) { const m = bloc('span', 'doux', "editado"); m.title = dateFr(a.modifie); qui.append(m); }
  if (a.masque) qui.append(bloc('span', 'etat cloture', "oculto por moderación"));
  texte.hidden = !a.texte;
  if (!reponse) reponses(a, carte, actions);
  if (a.le_mien) {
    actions.append(lien("Editar", () => reponse ? modifierReponse(a, carte, texte, fini) : ouvrirAvis(a.logiciel, a, fini)),
      lien("Eliminar", () => demander(reponse ? "¿Eliminar esta respuesta?" : "¿Eliminar esta opinión?", reponse ? "Se eliminará para todos." : "Se eliminará para todos, junto con sus respuestas.", "Eliminar",
        async () => { await appel('/rest/v1/avis?id=eq.' + a.id, undefined, {}, 'DELETE'); fini(-1); })));
  } else if (!actionsDev) actions.append(lien("Denunciar", () => signaler(a)));
  actionsDev?.(a, actions, fini);
  return carte;
}
function formulaireReponse(valeur, envoyer, fermer) {
  const champ = champTexte(valeur, true), etat = bloc('p', 'erreur'), ok = bloc('button', 'bouton petit', "Publicar"), f = bloc('form', 'reponse', champ, etat, bloc('div', 'actions', ok, lien("Cancelar", fermer)));
  champ.setAttribute('aria-label', "Tu respuesta"); etat.setAttribute('role', 'status');
  f.onsubmit = async e => {
    e.preventDefault(); ok.disabled = true;
    try { await envoyer(champ.value.trim()); } catch (x) { etat.textContent = erreurTexte(x); ok.disabled = false; }
  };
  return f;
}
function modifierReponse(a, carte, texte, fini) {
  if (carte.querySelector('form')) return;
  const f = formulaireReponse(a.texte, async t => { await changerAvis(a.id, { texte: t }); fini(); }, () => { f.remove(); texte.hidden = false; });
  texte.hidden = true; texte.after(f); f.querySelector('textarea').focus();
}
// « Afficher les réponses » et « Répondre », toujours visibles sous l'avis.
function reponses(a, carte, actions) {
  const zone = bloc('div', 'reponses'), voir = lien('', () => { zone.hidden = !zone.hidden; montrer(); if (!zone.hidden) charger(); });
  zone.hidden = true;
  const montrer = () => { voir.hidden = !a.reponses; voir.textContent = `${zone.hidden ? "Mostrar respuestas" : "Ocultar respuestas"} (${nombre(a.reponses)})`; voir.setAttribute('aria-expanded', !zone.hidden); };
  async function charger(debut = 0) {
    try {
      const lues = await rpc('lire_avis', { reponses_a: a.id, debut });
      const cartes = lues.slice(0, PAGE).map(r => carteAvis(r, (ecart = 0) => { a.reponses += ecart; montrer(); charger(); }));
      if (lues.length > PAGE) { const suite = lien("Mostrar más", () => { suite.remove(); charger(debut + PAGE); }); cartes.push(suite); }
      debut ? zone.append(...cartes) : zone.replaceChildren(...cartes);
    } catch { zone.replaceChildren(bloc('p', 'doux', "No se pueden leer las respuestas.")); }
  }
  actions.append(lien("Responder", () => {
    if (!session) return ouvrirConnexion("Inicia sesión para responder.");
    if (carte.querySelector(':scope > form')) return;
    const f = formulaireReponse('', async t => { await ecrireTable('avis', { parent: a.id, texte: t }); f.remove(); zone.hidden = false; a.reponses++; montrer(); charger(); }, () => f.remove());
    zone.before(f); f.querySelector('textarea').focus();
  }), voir);
  carte.append(zone);
  montrer();
}

// Section « Avis » en bas de la page d'un logiciel.
function sectionAvis(logiciel) {
  const g = id => document.getElementById(id);
  let filtre = null, mien = null;
  async function resume() {
    const r = await rpc('resume_avis', { du_logiciel: logiciel }), total = r.reduce((t, x) => t + x.nombre, 0);
    g('moyenne').replaceChildren(...(total ? [bloc('strong', '', (r.reduce((t, x) => t + x.somme, 0) / total / 2).toLocaleString(racine.lang, { maximumFractionDigits: 1 })), etoiles(r.reduce((t, x) => t + x.somme, 0) / total), bloc('span', 'doux', `(${nombre(total)})`)] : []));
    const ligne = (n, texte, compte) => {
      const b = bloc('button', '', bloc('span', '', texte));
      if (n != null) { const barre = bloc('i'); barre.style.setProperty('--part', total ? compte / total : 0); b.append(barre); }
      b.append(bloc('span', 'doux', nombre(compte)));
      b.type = 'button'; b.setAttribute('aria-pressed', filtre === n);
      b.onclick = () => { filtre = n; charger(); };
      return b;
    };
    g('filtres').replaceChildren(ligne(null, "Todas las opiniones", total), ...[5, 4, 3, 2, 1, 0].map(n => ligne(n, `${n} ★`, r.find(x => x.etoiles === n)?.nombre || 0)));
  }
  async function lire(debut = 0) {
    const lus = await rpc('lire_avis', { du_logiciel: logiciel, avec_etoiles: filtre, debut });
    const cartes = lus.slice(0, PAGE).map(a => carteAvis(a, charger));
    if (lus.length > PAGE) { const suite = bouton("Mostrar más", () => { suite.remove(); lire(debut + PAGE).catch(panne); }, 'fermer'); cartes.push(suite); }
    if (!lus.length && !debut) cartes.push(bloc('p', 'doux', filtre == null ? "Todavía no hay opiniones." : "No hay opiniones con esta puntuación."));
    debut ? g('liste-avis').append(...cartes) : g('liste-avis').replaceChildren(...cartes);
  }
  const panne = () => g('liste-avis').replaceChildren(bloc('p', 'doux', "No se pueden leer las opiniones."));
  async function charger() {
    try {
      mien = session ? (await rpc('lire_avis', { du_logiciel: logiciel, les_miens: true }))[0] : null;
      g('ecrire').textContent = mien ? "Editar mi opinión" : "Escribir una opinión";
      g('ecrire').hidden = false;
      await Promise.all([resume(), lire()]);
    } catch { panne(); }
  }
  g('ecrire').onclick = () => ouvrirAvis(logiciel, mien, charger);
  document.addEventListener('compte', charger);
  compte.then(charger);
  return l => { logiciel = l; filtre = null; charger(); }; // mode dev : autre logiciel
}

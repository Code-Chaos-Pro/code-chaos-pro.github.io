// Console du créateur (dev.html). Données et droits : fonctions dev_* de supabase/avis.sql.
const $ = id => document.getElementById(id), args = new URLSearchParams(location.search);
const rpcVide = (nom, corps) => appel('/rest/v1/rpc/' + nom, corps);
const agir = (id, action) => rpcVide('dev_avis', { l_avis: id, action });
const vide = texte => bloc('p', 'vide', texte);
const panne = zone => zone.replaceChildren(vide("Impossible de lire ces données. Rechargez la page."));
const jourCourt = j => new Date(j + 'T12:00:00').toLocaleDateString('fr', { day: 'numeric', month: 'short' });
const virgule = n => n.toLocaleString('fr', { maximumFractionDigits: 1 });
function ilYa(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  return s < 60 ? "à l’instant" : s < 3600 ? `${Math.floor(s / 60)} min` : s < 86400 ? `${Math.floor(s / 3600)} h` : s < 604800 ? `${Math.floor(s / 86400)} j` : new Date(d).toLocaleDateString('fr', { day: 'numeric', month: 'short' });
}
const personne = p => bloc('span', 'qui', avatar(p.avatar), bloc('strong', '', p.pseudo || "Sans pseudonyme"), ...(p.createur ? [badgeCreateur()] : []));
const plat = (texte, action, classe = '') => bouton(texte, action, 'plat ' + classe);
function segments(choix, actuel, changer) {
  const s = bloc('div', 'segments');
  for (const [v, t] of choix) { const b = bouton(t, () => changer(v), ''); b.setAttribute('aria-pressed', v === actuel); s.append(b); }
  return s;
}
function table(id, titres, lignes, gauche = 1) {
  const rang = (balise, cellules) => bloc('tr', '', ...cellules.map((c, i) => bloc(balise, i < gauche ? 'gauche' : '', c instanceof Node ? c : String(c ?? '–'))));
  $(id).replaceChildren(bloc('thead', '', rang('th', titres)), bloc('tbody', '', ...lignes.map(l => rang('td', l))));
}
function flotter(texte, action) {
  const b = bouton(texte, () => { b.remove(); action(); }, 'avis-flottant');
  $('flottants').append(b);
  setTimeout(() => b.remove(), 8000);
}

// --- Vue d'ensemble
const MESURES = { vues: "Vues", telechargements: "Téléchargements", comptes: "Comptes créés", avis: "Avis", tickets: "Tickets" };
let periode = 30, mesure = 'vues', chiffresLus = null;
function etincelle(valeurs) {
  const max = Math.max(1, ...valeurs), n = Math.max(1, valeurs.length - 1), pts = valeurs.map((v, i) => `${(i / n * 100).toFixed(1)},${(28 - v / max * 25).toFixed(1)}`).join(' ');
  const d = document.createElement('div');
  d.innerHTML = `<svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
  return d.firstChild;
}
// Courbe d'une seule mesure, avec la période d'avant en pointillés. Survol, doigt ou flèches : la valeur du jour.
function courbe(zone, jours, avant, cle) {
  const L = zone.clientWidth || 700, H = 260, g = 34, b = 24, h = 10, max = Math.max(4, ...jours.map(j => j[cle]), ...avant.map(j => j[cle])), pas = 10 ** Math.floor(Math.log10(max / 4)), saut = [1, 2, 5, 10].map(x => x * Math.max(1, pas)).find(x => max / x <= 5) || max, haut = Math.ceil(max / saut) * saut;
  const X = i => g + i / Math.max(1, jours.length - 1) * (L - g - 6), Y = v => h + (1 - v / haut) * (H - h - b), points = t => t.map((j, i) => `${X(i).toFixed(1)},${Y(j[cle]).toFixed(1)}`).join(' ');
  let s = '';
  for (let v = 0; v <= haut; v += saut) s += `<line class="grille" x1="${g}" x2="${L - 6}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${g - 8}" y="${Y(v) + 4}" text-anchor="end">${nombre(v)}</text>`;
  const etiquettes = Math.min(jours.length, Math.max(2, Math.floor(L / 120)));
  for (let k = 0; k < etiquettes; k++) { const i = Math.round(k / (etiquettes - 1) * (jours.length - 1)); s += `<text x="${X(i)}" y="${H - 5}" text-anchor="${k === 0 ? 'start' : k === etiquettes - 1 ? 'end' : 'middle'}">${jourCourt(jours[i].jour)}</text>`; }
  s += `<polygon class="aire" points="${X(0)},${Y(0)} ${points(jours)} ${X(jours.length - 1)},${Y(0)}"/><polyline class="avant" points="${points(avant)}"/><polyline class="trace" points="${points(jours)}"/><g class="vise" hidden><line class="repere" y1="${h}" y2="${H - b}"/><circle class="point" r="5"/></g>`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), bulleInfo = bloc('div', 'infobulle');
  svg.setAttribute('viewBox', `0 0 ${L} ${H}`); svg.setAttribute('role', 'img'); svg.setAttribute('tabindex', '0');
  svg.setAttribute('aria-label', `${MESURES[cle]} : ${jours.reduce((t, j) => t + j[cle], 0)} sur ${jours.length} jours, ${avant.reduce((t, j) => t + j[cle], 0)} sur la période d’avant. Détail dans « Chiffres jour par jour ».`);
  svg.innerHTML = s; bulleInfo.hidden = true;
  let vise = jours.length - 1;
  const viser = i => {
    vise = i = Math.max(0, Math.min(jours.length - 1, i));
    const v = svg.querySelector('.vise'), x = X(i);
    v.removeAttribute('hidden'); v.firstChild.setAttribute('x1', x); v.firstChild.setAttribute('x2', x); v.lastChild.setAttribute('cx', x); v.lastChild.setAttribute('cy', Y(jours[i][cle]));
    bulleInfo.hidden = false; bulleInfo.replaceChildren(bloc('strong', '', jourCourt(jours[i].jour)), bloc('span', '', `${MESURES[cle]} : ${jours[i][cle]}`), bloc('span', 'doux', `Avant : ${avant[i]?.[cle] ?? 0}`));
    bulleInfo.style.left = Math.min(x + 12, L - bulleInfo.offsetWidth - 4) + 'px';
  };
  const cacher = () => { svg.querySelector('.vise').setAttribute('hidden', ''); bulleInfo.hidden = true; };
  svg.onpointermove = e => { const r = svg.getBoundingClientRect(); viser(Math.round(((e.clientX - r.left) - g) / (L - g - 6) * (jours.length - 1))); };
  svg.onpointerleave = svg.onblur = cacher;
  svg.onkeydown = e => { const p = { ArrowLeft: -1, ArrowRight: 1 }[e.key]; if (p) { e.preventDefault(); viser(vise + p); } };
  zone.replaceChildren(svg, bulleInfo);
}
function ecart(n, avant) {
  if (!avant) return bloc('span', 'ecart', n ? "nouveau" : "–");
  const p = Math.round((n - avant) / avant * 100);
  return bloc('span', 'ecart ' + (p > 0 ? 'hausse' : p < 0 ? 'baisse' : ''), `${p > 0 ? '▲' : p < 0 ? '▼' : ''} ${Math.abs(p)} %`);
}
function dessinerApercu() {
  const s = chiffresLus; if (!s) return;
  const jours = s.jours.slice(-periode), avant = s.jours.slice(0, -periode), somme = (t, k) => t.reduce((x, j) => x + j[k], 0), total = k => s.logiciels.reduce((t, l) => t + l[k], 0);
  const depuis = { vues: total('vues'), telechargements: total('telechargements'), comptes: s.comptes, avis: total('avis'), tickets: s.attente + s.en_cours + s.clotures };
  $('kpis').replaceChildren(...Object.entries(MESURES).map(([cle, nom]) => {
    const n = somme(jours, cle), b = bloc('button', 'kpi', bloc('span', 'ligne', bloc('span', 'doux', nom), ecart(n, somme(avant, cle))), bloc('span', 'valeur', nombre(n)), bloc('span', 'doux', `${nombre(depuis[cle])} depuis le début`), etincelle(jours.map(j => j[cle])));
    b.type = 'button'; b.setAttribute('aria-pressed', cle === mesure); b.onclick = () => { mesure = cle; dessinerApercu(); };
    return b;
  }));
  $('c-titre').textContent = MESURES[mesure];
  courbe($('courbe'), jours, avant, mesure);
  const tache = (nom, n, aller) => { const b = bloc('button', '', bloc('span', '', nom), bloc('b', '', String(n))); b.type = 'button'; b.onclick = aller; return b; };
  $('taches').replaceChildren(tache("Tickets en attente", s.attente, () => { filtreTickets = 'attente'; aller('tickets'); }), tache("Tickets en cours", s.en_cours, () => { filtreTickets = 'en_cours'; aller('tickets'); }), tache("Textes signalés", s.signalements, () => aller('moderation')));
  const niveau = (zone, lignes) => { const t = lignes.reduce((x, l) => x + l[1], 0); $(zone).replaceChildren(...lignes.map(([nom, n]) => { const i = bloc('i'); i.style.setProperty('--part', t ? n / t : 0); return bloc('div', '', bloc('span', '', nom), i, bloc('span', 'doux', String(n))); })); };
  const nAvis = total('avis'), moyenne = nAvis ? s.logiciels.reduce((t, l) => t + l.avis * (l.note || 0), 0) / nAvis / 2 : null;
  $('moyenne-notes').textContent = moyenne == null ? '' : `★ ${virgule(moyenne)} sur ${nAvis}`;
  niveau('notes', [5, 4, 3, 2, 1, 0].map(n => [`${n} ★`, s.notes[n] || 0]));
  $('delai').textContent = s.delai == null ? '' : `Première réponse : ${s.delai < 60 ? `${s.delai} min` : s.delai < 1440 ? `${virgule(s.delai / 60)} h` : `${virgule(s.delai / 1440)} j`}`;
  niveau('n-tickets', [["En attente", s.attente], ["En cours", s.en_cours], ["Clôturés", s.clotures]]);
  table('t-logiciels', ["Logiciel", "Version", "Vues", "Téléchargements", "Conversion", "Favoris", "Avis", "Note"], s.logiciels.map(l => [nomLogiciel(l.logiciel), LOGICIELS.find(x => x.id === l.logiciel)?.version, l.vues, l.telechargements, l.vues ? `${Math.round(l.telechargements / l.vues * 100)} %` : null, l.favoris, l.avis, l.note == null ? null : '★ ' + virgule(l.note / 2)]));
  table('t-jours', ["Jour", ...Object.values(MESURES)], jours.slice().reverse().map(j => [jourCourt(j.jour), ...Object.keys(MESURES).map(k => j[k])]));
}
const PHRASES = { compte: "a créé un compte", avis: "a donné un avis", reponse: "a répondu à un avis", ticket: "a ouvert un ticket", message: "a écrit dans un ticket", signalement: "a signalé un texte" };
async function apercu() {
  try {
    const [s, a] = await Promise.all([rpc('dev_stats', { nb_jours: periode * 2 }), rpc('dev_activite', {})]);
    chiffresLus = s; pastilles(s); dessinerApercu();
    $('flux').replaceChildren(...(a.length ? a.map(x => {
      const detail = x.quoi === 'ticket' ? Object.values(SUJETS).flat().find(([c]) => c === x.detail)?.[1] || x.detail : x.quoi === 'signalement' ? MOTIF[x.detail] : x.quoi === 'avis' ? `★ ${virgule(x.numero / 2)} ${x.detail}` : x.detail;
      const vers = { avis: 'applis', reponse: 'applis', signalement: 'moderation', compte: 'comptes' }[x.quoi];
      const l = bloc('button', '', avatar(x.avatar), bloc('span', '', bloc('strong', '', x.qui || "Quelqu’un"), ' ' + PHRASES[x.quoi], bloc('span', 'extrait', detail)), bloc('small', '', ilYa(x.quand)));
      l.type = 'button'; l.onclick = () => vers ? aller(vers) : ouvrirTicket(x.numero);
      return l;
    }) : [vide("Rien pour l’instant.")]));
  } catch { panne($('flux')); }
}
new ResizeObserver(regrouper(() => { if (!$('o-apercu').hidden) dessinerApercu(); }, 150)).observe($('courbe'));
function exporter() {
  const lignes = [['jour', ...Object.keys(MESURES)], ...chiffresLus.jours.map(j => [j.jour, ...Object.keys(MESURES).map(k => j[k])])];
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + lignes.map(l => l.join(';')).join('\r\n')], { type: 'text/csv' })); a.download = 'code-chaos-chiffres.csv'; a.click();
}

// --- Tickets : liste à gauche, discussion au milieu, détails à droite
let filtreTickets = 'attente', chercheTicket = '', ticketsLus = [], ticketOuvert = null, fil = null;
let nEtats = {};
const segmentsTickets = () => { const s = segments(Object.entries({ attente: "En attente", en_cours: "En cours", cloture: "Clôturés" }).map(([e, nom]) => [e, nEtats[e] === undefined ? nom : `${nom} (${nEtats[e]})`]), filtreTickets, f => { filtreTickets = f; fermerTicket(); ticketsPage(); }); s.id = 'seg-tickets'; return s; };
async function ticketsPage() {
  try {
    const lus = [];
    for (let debut = 0; debut < 200; debut += PAGE) { // shortcut: 200 tickets par état ; au-delà, paginer la liste
      const p = await rpc('lire_tickets', { tous: true, dans_etat: filtreTickets, debut });
      lus.push(...p.slice(0, PAGE)); if (p.length <= PAGE) break;
    }
    ticketsLus = lus;
    if (ticketOuvert) { // l'état du ticket ouvert a pu changer, même s'il n'est plus dans cette liste
      const [t] = await rpc('lire_tickets', { tous: true, le_ticket: ticketOuvert.id });
      t ? (Object.assign(ticketOuvert, t), fil.maj(t), montrerDetails()) : fermerTicket();
    }
    montrerListe();
    rpc('dev_stats', { nb_jours: 1 }).then(pastilles, () => { });
  } catch { panne($('liste-tickets')); }
}
function montrerListe() {
  const q = chercheTicket.toLowerCase(), vus = ticketsLus.filter(t => !q || `${t.id} ${t.pseudo} ${t.email} ${t.texte} ${nomSujet(t)}`.toLowerCase().includes(q));
  $('liste-tickets').replaceChildren(...(vus.length ? vus.map(t => {
    const b = bloc('button', 'ligne-ticket' + (t.non_lu ? ' neuf' : ''), bloc('span', 'haut-ligne', bloc('strong', '', nomSujet(t)), bloc('small', '', ilYa(t.maj))), bloc('span', 'extrait', t.texte), bloc('span', 'haut-ligne', bloc('small', '', t.pseudo || "Sans pseudonyme"), bloc('small', '', `n° ${t.id}${t.reponses ? ` · ${t.reponses} message${t.reponses > 1 ? 's' : ''}` : ''}`)));
    b.type = 'button'; b.setAttribute('aria-current', ticketOuvert?.id === t.id); b.onclick = () => choisirTicket(t);
    return b;
  }) : [vide(q ? "Aucun résultat." : { attente: "Aucun ticket en attente.", en_cours: "Aucun ticket en cours.", cloture: "Aucun ticket clôturé." }[filtreTickets])]));
}
async function choisirTicket(t) {
  ticketOuvert = t; fil = discussion(t);
  if (t.etat === 'attente') filtreTickets = 'en_cours'; // l'ouvrir le fait passer « en cours » : la liste le suit
  $('o-tickets').classList.add('lecture');
  const premier = bloc('div', 'bulle-message premier', bloc('div', 'qui', avatar(t.avatar), bloc('strong', '', t.pseudo || "Sans pseudonyme"), bloc('span', 'doux', dateFr(t.cree))), bloc('p', 'message', t.texte));
  if (t.images.length) premier.append(boutonImages(t));
  fil.firstChild.append(premier);
  $('fil').replaceChildren(bloc('header', '', bloc('h2', '', `${nomSujet(t)} · n° ${t.id}`), bouton("Retour", fermerTicket, 'plat retour')), fil);
  montrerDetails(); montrerListe();
  await fil.maj({});
  ticketsPage();
}
function fermerTicket() {
  ticketOuvert = fil = null;
  $('o-tickets').classList.remove('lecture');
  $('fil').replaceChildren(vide("Choisissez un ticket à gauche.")); $('details').replaceChildren();
  montrerListe();
}
function montrerDetails() {
  const t = ticketOuvert, infos = [["État", bloc('span', 'etat ' + t.etat, ETATS[t.etat])], ["Compte", personne(t)], ["E-mail", t.email || "Aucun"], ["Type", nomType(t)], ["Logiciel", nomLogiciel(t.logiciel)], ["Reçu", dateFr(t.cree)], ["Dernier changement", dateFr(t.maj)]];
  const changer = action => rpcVide('dev_ticket', { le_ticket: t.id, action }).then(ticketsPage, () => flotter("L’action n’a pas marché. Réessayez.", () => { }));
  $('details').replaceChildren(bloc('dl', '', ...infos.map(([n, v]) => bloc('div', '', bloc('dt', '', n), bloc('dd', '', v)))),
    t.etat === 'cloture' ? plat("Rouvrir", () => changer('rouvrir')) : plat("Clôturer", () => changer('cloturer'), 'plein'),
    plat("Supprimer", () => demander("Supprimer ce ticket ?", "Le ticket, ses images et la discussion seront effacés pour tout le monde.", "Supprimer", async () => {
      if (t.images.length) await appel('/storage/v1/object/messages', { prefixes: t.images }, {}, 'DELETE');
      await rpcVide('dev_ticket', { le_ticket: t.id, action: 'supprimer' });
      fermerTicket(); ticketsPage();
    }), 'rouge'));
}
async function ouvrirTicket(id) {
  const [t] = await rpc('lire_tickets', { tous: true, le_ticket: Number(id) }).catch(() => []);
  if (!t) return flotter("Ce ticket n’existe plus.", () => { });
  filtreTickets = t.etat;
  ticketOuvert = null; aller('tickets'); choisirTicket(t);
}

// --- Applis et avis
actionsDev = (a, actions, fini) => {
  const suite = () => { fini(); moderation(); };
  if (a.signales) actions.append(bloc('span', 'etat attente', `signalé (${a.signales})`));
  actions.append(lien(a.masque ? "Rétablir" : "Masquer", () => a.masque ? agir(a.id, 'retablir').then(suite) : demander("Masquer ce texte ?", "Les visiteurs ne le verront plus. Son auteur verra qu’il est masqué.", "Masquer", async () => { await agir(a.id, 'masquer'); suite(); })));
  if (!a.le_mien) actions.append(lien("Supprimer", () => demander("Supprimer ce texte ?", "Il sera effacé pour tout le monde, avec ses réponses.", "Supprimer", async () => { await agir(a.id, 'supprimer'); fini(-1); moderation(); })));
  if (!a.le_mien && !a.createur) actions.append(a.bloque ? lien("Débloquer le compte", () => agir(a.id, 'debloquer').then(suite)) : lien("Bloquer le compte", () => bloquer(a.pseudo, async () => { await agir(a.id, 'bloquer'); suite(); })));
};
const bloquer = (pseudo, faire) => demander("Bloquer ce compte ?", `${pseudo || "Cette personne"} ne pourra plus écrire d’avis ni voter. Les tickets restent possibles.`, "Bloquer", faire);
let changerAppli = null, appli = LOGICIELS[0].id;
async function applis() {
  const c = await compteurs();
  $('applis').replaceChildren(...LOGICIELS.map(l => {
    const n = c?.[l.id], i = new Image(44, 44), b = bloc('button', 'appli', i, bloc('strong', '', l.nom), bloc('span', '', n ? `${nombre(n.vues)} vues · ${nombre(n.telechargements)} téléch.${n.avis ? ` · ★ ${virgule(n.note / 2)} (${n.avis})` : ''}` : "Pas encore de chiffres"));
    i.src = l.icone; i.alt = ''; b.type = 'button'; b.setAttribute('aria-pressed', l.id === appli);
    b.onclick = () => { appli = l.id; suivre('logiciel:' + appli, false); applis(); changerAppli(appli); };
    return b;
  }));
  suivre('logiciel:' + appli, false);
  if (!changerAppli) changerAppli = sectionAvis(appli);
}

// --- Modération
const MOTIF = Object.fromEntries(MOTIFS);
async function moderation() {
  try {
    const m = await rpc('dev_moderation', {}), faire = (id, action) => () => agir(id, action).then(moderation);
    const carte = (a, ...boutons) => bloc('article', 'avis', bloc('div', 'qui', personne(a), ...(a.note == null ? [] : [etoiles(a.note)]), ...(a.bloque ? [bloc('span', 'etat cloture', "bloqué")] : [])), bloc('span', 'doux', `${nomLogiciel(a.logiciel)}${a.note == null ? " · réponse" : ''} · ${dateFr(a.cree)}`), bloc('p', 'message', a.texte || "(note seule)"),
      ...(a.motifs ? [bloc('p', 'erreur', `${a.nombre} signalement${a.nombre > 1 ? 's' : ''} : ${[...new Set(a.motifs)].map(x => MOTIF[x]).join(", ")}`)] : []),
      bloc('div', 'actions', ...boutons, plat("Supprimer", () => demander("Supprimer ce texte ?", "Il sera effacé pour tout le monde, avec ses réponses.", "Supprimer", async () => { await agir(a.id, 'supprimer'); moderation(); }), 'rouge'), ...(a.bloque ? [] : [lien("Bloquer le compte", () => bloquer(a.pseudo, async () => { await agir(a.id, 'bloquer'); moderation(); }))])));
    const ou = (zone, liste, texte) => $(zone).replaceChildren(...(liste.length ? liste : [vide(texte)]));
    ou('signales', m.signales.map(a => carte(a, plat("Masquer", faire(a.id, 'masquer'), 'plein'), plat("Garder", faire(a.id, 'ignorer')))), "Aucun texte signalé.");
    ou('masques', m.masques.map(a => carte(a, plat("Rétablir", faire(a.id, 'retablir'), 'plein'))), "Aucun texte masqué.");
    ou('bloques', m.bloques.map(p => bloc('div', 'actions', personne(p), plat("Débloquer", () => rpcVide('dev_debloquer', { le_pseudo: p.pseudo }).then(moderation)))), "Aucun compte bloqué.");
    $('p-moderation').textContent = m.signales.length || '';
  } catch { panne($('signales')); }
}

// --- Comptes
let chercheCompte = '', comptesPages = 1;
async function comptesPage() {
  try {
    const lus = []; let reste = false;
    for (let p = 0; p < comptesPages; p++) { const l = await rpc('dev_comptes', { recherche: chercheCompte, debut: p * PAGE }); lus.push(...l.slice(0, PAGE)); reste = l.length > PAGE; if (!reste) break; }
    table('t-comptes', ["Compte", "E-mail", "Connexion", "Créé", "Dernière connexion", "Avis", "Tickets", ""], lus.map(c => [personne(c), c.email || "Aucun", c.services, new Date(c.cree).toLocaleDateString('fr'), c.derniere ? ilYa(c.derniere) : null, c.avis, c.tickets,
      c.createur || !c.pseudo ? '' : c.bloque ? plat("Débloquer", () => rpcVide('dev_compte', { le_compte: c.id, action: 'debloquer' }).then(comptesPage)) : plat("Bloquer", () => bloquer(c.pseudo, async () => { await rpcVide('dev_compte', { le_compte: c.id, action: 'bloquer' }); comptesPage(); }), 'rouge')]), 3);
    $('suite-comptes').replaceChildren(...(reste ? [plat("Afficher plus", () => { comptesPages++; comptesPage(); })] : lus.length ? [] : [vide("Aucun compte trouvé.")]));
  } catch { panne($('suite-comptes')); }
}

// --- Navigation
const recherche = (texte, valeur, changer) => { const c = Object.assign(document.createElement('input'), { type: 'search', className: 'champ-recherche', placeholder: texte, value: valeur }), fin = regrouper(() => changer(c.value.trim()), 250); c.setAttribute('aria-label', texte); c.oninput = fin; return c; };
const PAGES = {
  apercu: { titre: "Vue d’ensemble", sous: "L’essentiel de Code & Chaos", lire: apercu, outils: () => [segments([[7, "7 jours"], [30, "30 jours"], [90, "90 jours"]], periode, p => { periode = p; montrerOutils(); apercu(); }), plat("Exporter (CSV)", () => chiffresLus && exporter())] },
  tickets: { titre: "Tickets", sous: "Demandes et signalements, en direct", lire: ticketsPage, outils: () => [recherche("Chercher un ticket", chercheTicket, q => { chercheTicket = q; montrerListe(); }), segmentsTickets()] },
  applis: { titre: "Applis et avis", sous: "Vos réponses portent le badge Créateur", lire: applis, outils: () => [] },
  moderation: { titre: "Modération", sous: "Textes signalés, masqués et comptes bloqués", lire: moderation, outils: () => [] },
  comptes: { titre: "Comptes", sous: "Les personnes inscrites", lire: comptesPage, outils: () => [recherche("Pseudo ou e-mail", chercheCompte, q => { chercheCompte = q; comptesPages = 1; comptesPage(); })] },
};
let pageDev = null;
const montrerOutils = () => $('tete-outils').replaceChildren(...PAGES[pageDev].outils());
function aller(p) {
  pageDev = p;
  for (const b of $('nav').children) b.dataset.page === p ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current');
  for (const k of Object.keys(PAGES)) $('o-' + k).hidden = k !== p;
  $('titre').textContent = PAGES[p].titre; $('sous-titre').textContent = PAGES[p].sous;
  montrerOutils();
  PAGES[p].lire();
}
function pastilles(s) {
  $('p-moderation').textContent = s.signalements || '';
  nEtats = { attente: s.attente, en_cours: s.en_cours, cloture: s.clotures };
  $('seg-tickets')?.replaceWith(segmentsTickets());
}
for (const b of $('nav').children) b.onclick = () => aller(b.dataset.page);

// --- En direct : la page affichée se relit toute seule
const relire = regrouper(() => { if (pageDev) PAGES[pageDev].lire(); }, 400);
let nonLus = null;
document.addEventListener('tickets', () => {
  const n = etatTickets.dev_non_lus || 0;
  $('p-tickets').textContent = n || ''; document.title = n ? `(${n}) Console` : "Console";
  if (nonLus !== null && n > nonLus && pageDev !== 'tickets') flotter("Nouveau message dans les tickets", () => { filtreTickets = 'attente'; aller('tickets'); });
  nonLus = n;
});
document.addEventListener('direct', ({ detail: { sujet, quoi } }) => {
  if (sujet !== 'dev') return;
  const pour = { tickets: ['tickets', 'apercu'], avis: ['apercu', 'applis', 'moderation'], moderation: ['moderation', 'apercu'], chiffres: ['apercu', 'applis'], comptes: ['comptes', 'apercu'] };
  if (quoi === 'tout' || pour[quoi]?.includes(pageDev)) { if (!(pageDev === 'applis' && quoi === 'avis')) relire(); else applis(); }
});
setInterval(() => {
  if (!ouvert) return;
  const ok = enDirect('dev');
  $('vif').classList.toggle('oui', ok); $('vif').textContent = ok ? "En direct" : "Reconnexion…";
}, 1000);
setInterval(() => { if (ouvert && !document.hidden && !enDirect('dev')) { chargerProfil(); relire(); } }, 15000); // secours si le temps réel est coupé

let ouvert = false;
// Pour tous les autres, connectés ou non : la page 404 de l'hébergeur, comme si cette adresse n'existait pas.
async function introuvable() {
  const html = await fetch('/introuvable').then(r => r.text()).catch(() => '404');
  document.open(); document.write(html); document.close();
}
function montrer() {
  if (!session?.dev) { ouvert = false; return introuvable(); }
  if (ouvert) return;
  ouvert = true; $('console').hidden = false;
  fermerTicket(); args.has('ticket') ? ouvrirTicket(args.get('ticket')) : aller('apercu');
}
document.addEventListener('compte', montrer);
compte.then(montrer);

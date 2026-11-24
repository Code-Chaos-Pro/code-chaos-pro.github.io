// Compte (Supabase), commun à toutes les pages. Clé publique par nature : les droits sont dans supabase/*.sql.
const BASE = 'https://zyjujjubtbdncbjrehfo.supabase.co', CLE = 'sb_publishable_j9auNOI-cBzZ9s35XfAo9Q_eGBq-ZSx';
const SERVICES = { google: 'Google', discord: 'Discord', azure: 'Microsoft' };
// Logos officiels, inclus dans le site (rien n'est chargé chez Google ni Discord avant de cliquer).
const LOGOS = {
  google: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
  discord: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>',
};
// Avatars tout prêts : pas d'image envoyée par les visiteurs, donc rien à vérifier.
const AVATARS = [['🦊', '#f59e0b'], ['🐼', '#64748b'], ['🐸', '#22c55e'], ['🐙', '#ec4899'], ['🦉', '#a16207'], ['🐧', '#0ea5e9'], ['🐱', '#f97316'], ['🐶', '#84cc16'], ['🦄', '#a855f7'], ['🐝', '#eab308'], ['🤖', '#4f8cff'], ['👾', '#8b5cf6']];
const bloc = (balise, classe, ...enfants) => { const e = document.createElement(balise); if (classe) e.className = classe; e.append(...enfants); return e; };
const badgeCreateur = () => bloc('span', 'createur', "Criador");
const avatar = n => { const s = document.createElement('span'); [s.textContent, s.style.background] = AVATARS[n] || AVATARS[0]; s.className = 'avatar'; s.setAttribute('aria-hidden', 'true'); return s; };
const b64 = o => btoa(String.fromCharCode(...new Uint8Array(o))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// La connexion reste dans ce navigateur jusqu'à « Se déconnecter » ; le jeton d'une heure est renouvelé tout seul.
const lireSession = () => { try { return JSON.parse(localStorage.getItem('session')); } catch { return null; } };
let session = lireSession();
function poser(s) { session = s; try { s ? localStorage.setItem('session', JSON.stringify(s)) : localStorage.removeItem('session'); } catch { } }
function changer(s) { poser(s); document.dispatchEvent(new Event('compte')); }
addEventListener('storage', e => { if (e.key === 'session') { session = lireSession(); document.dispatchEvent(new Event('compte')); } }); // autre onglet
const deJeton = j => ({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at, id: j.user.id, email: j.user.email, cree: j.user.created_at });
const perime = () => session && session.expires_at * 1000 < Date.now() + 60000;
async function valide() {
  if (!perime()) return;
  await (navigator.locks ? f => navigator.locks.request('session', f) : f => f())(async () => {
    session = lireSession(); // un autre onglet l'a peut-être déjà renouvelé
    if (!perime()) return;
    const rep = await fetch(BASE + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: CLE, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: session.refresh_token }) });
    if (rep.ok) poser({ ...session, ...deJeton(await rep.json()) });
    else if (rep.status < 500) changer(null); // connexion retirée
  });
}
async function appel(chemin, corps, entetes = {}, methode) {
  if (!chemin.startsWith('/auth/v1/token') && !chemin.startsWith('/auth/v1/settings')) await valide();
  const rep = await fetch(BASE + chemin, {
    method: methode || (corps === undefined ? 'GET' : 'POST'), body: corps instanceof Blob || corps === undefined ? corps : JSON.stringify(corps),
    headers: { apikey: CLE, 'Content-Type': corps instanceof Blob ? corps.type : 'application/json', ...(session && { Authorization: 'Bearer ' + session.access_token }), ...entetes },
  });
  if (!rep.ok) throw Object.assign(new Error(await rep.text()), { code: rep.status });
  return rep;
}
const rpc = async (nom, corps) => (await appel('/rest/v1/rpc/' + nom, corps)).json();
const lireTable = async chemin => (await appel('/rest/v1/' + chemin)).json();
const ecrireTable = (chemin, corps, plus = '') => appel('/rest/v1/' + chemin, corps, { Prefer: 'return=minimal' + plus });

// Vues et téléchargements : un par compte, ou un par adresse IP sans compte (supabase/avis.sql).
const compter = (logiciel, type) => appel('/rest/v1/rpc/compter', { logiciel, type }).catch(() => { });
async function compteurs() {
  try {
    const rep = await fetch(BASE + '/rest/v1/rpc/compteurs', { method: 'POST', headers: { apikey: CLE, 'Content-Type': 'application/json' }, body: '{}' });
    return rep.ok ? Object.fromEntries((await rep.json()).map(c => [c.logiciel, c])) : null;
  } catch { return null; }
}

function ecrire(ou, texte, secours) { // secours : l'adresse e-mail, pour toujours pouvoir écrire
  ou.textContent = texte;
  if (secours) { const a = document.createElement('a'); a.href = 'mailto:contact.codechaos@gmail.com'; a.textContent = 'contact.codechaos@gmail.com'; ou.append(` ${"Escreva para"} `, a); }
}
function bouton(texte, action, classe = 'bouton') { const b = document.createElement('button'); b.type = 'button'; b.className = classe; b.textContent = texte; b.onclick = action; return b; }
async function connecter(service) {
  const secret = b64(crypto.getRandomValues(new Uint8Array(32)));
  try { sessionStorage.setItem('secret', secret); } catch { }
  const defi = b64(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)));
  location.href = BASE + '/auth/v1/authorize?' + new URLSearchParams({ provider: service, redirect_to: location.href, code_challenge: defi, code_challenge_method: 's256', ...(service === 'azure' && { scopes: 'email' }) });
}
function deconnecter() { appel('/auth/v1/logout', {}).catch(() => { }).finally(() => changer(null)); }
// État du compte dans « etat » et boutons dans « zone » : tickets et fenêtre « Se connecter ».
async function montrerCompte(etat, zone, invite) {
  zone.replaceChildren();
  if (session) return etat.replaceChildren(`${"Conta"} : `, session.pseudo ? bulle() : '', ` (${session.email || "conta sem e-mail"})`);
  ecrire(etat, "A carregar…");
  try {
    const { external } = await (await appel('/auth/v1/settings')).json();
    const ouverts = Object.keys(SERVICES).filter(s => external[s]);
    if (!ouverts.length) return ecrire(etat, "O início de sessão ainda não está aberto.", true);
    ecrire(etat, invite);
    zone.replaceChildren(...ouverts.map(s => {
      const b = bouton(`${"Continuar com"} ${SERVICES[s]}`, () => connecter(s), 'service ' + s);
      b.insertAdjacentHTML('afterbegin', LOGOS[s] || '');
      return b;
    }));
  } catch { ecrire(etat, "O início de sessão não responde.", true); }
}

// Fenêtre par-dessus la page, fermée par son bouton, un clic en dehors ou Échap.
function fenetre(titre, fermer = "Fechar") {
  const d = document.createElement('dialog'), h = document.createElement('h2'), zone = document.createElement('div'), pied = document.createElement('div');
  h.textContent = titre; zone.className = 'contenu'; pied.className = 'pied';
  pied.append(bouton(fermer, () => d.close(), 'fermer'));
  d.append(h, zone, pied);
  // Appui ET relâchement dehors : sélectionner du texte ou glisser sur les étoiles ne ferme pas.
  const dehors = e => { const r = d.getBoundingClientRect(); return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom; };
  let appui = false;
  d.onpointerdown = e => { appui = dehors(e); };
  d.onclick = e => { if (appui && dehors(e)) d.close(); };
  d.onclose = () => d.remove();
  document.body.append(d);
  d.showModal();
  return { d, zone, pied };
}
function ouvrirConnexion(invite = "Escolha uma conta. A sua é criada no primeiro início de sessão.") {
  const { zone } = fenetre("Iniciar sessão"), p = document.createElement('p'), c = document.createElement('div');
  p.setAttribute('role', 'status'); c.className = 'connexion';
  zone.append(p, c);
  montrerCompte(p, c, invite);
}

// Pseudo : 3 à 20 lettres, chiffres, points, tirets ; unique, sans mot grossier (vérifié par la base).
const PSEUDO = { minLength: 3, maxLength: 20, required: true, autocomplete: 'nickname' };
function erreurPseudo(x) {
  if (x.code === 409) return "Este nome de utilizador já está a ser usado.";
  if (x.message.includes('pseudo refuse')) return "Este nome de utilizador não é permitido.";
  if (x.message.includes('profils_pseudo_check')) return "De 3 a 20 letras ou algarismos, sem espaços. Ponto, hífen e traço inferior são permitidos.";
  return "O nome de utilizador não foi guardado. Tenta novamente.";
}
// Première connexion : pseudonyme au hasard (mots lisibles dans toutes les langues), rien n'est pris de Google ou de Discord.
async function creerProfil() {
  const mots = ['Panda', 'Koala', 'Lynx', 'Puma', 'Gecko', 'Kiwi', 'Dodo', 'Cobra'], hasard = n => Math.floor(Math.random() * n);
  for (let essai = 0; ; essai++) try {
    const pseudo = mots[hasard(mots.length)] + (10000 + hasard(90000));
    await ecrireTable('profils', { pseudo });
    return changer({ ...session, pseudo, avatar: 0 });
  } catch (x) { if (x.code !== 409 || essai === 4) throw x; } // déjà pris : un autre
}
function proposerPseudo() {
  const { d, zone, pied } = fenetre("Alterar o nome de utilizador", "Ignorar");
  const p = document.createElement('p'), f = document.createElement('form'), champ = Object.assign(document.createElement('input'), PSEUDO, { value: session.pseudo }), etat = document.createElement('p'), ok = document.createElement('button');
  p.textContent = "Será mostrado junto às tuas avaliações. Podes alterá-lo a qualquer momento na tua conta.";
  champ.setAttribute('aria-label', "Nome de utilizador"); etat.setAttribute('role', 'status'); etat.className = 'erreur';
  f.id = 'f-premier'; ok.setAttribute('form', f.id); ok.className = 'bouton'; ok.textContent = "Confirmar";
  f.append(champ, etat); zone.append(p, f); pied.append(ok);
  f.onsubmit = async e => {
    e.preventDefault(); ok.disabled = true;
    try { await modifierProfil({ pseudo: champ.value.trim() }); d.close(); }
    catch (x) { etat.textContent = erreurPseudo(x); }
    finally { ok.disabled = false; }
  };
  champ.select();
}
async function modifierProfil(champs) {
  await appel('/rest/v1/profils?id=eq.' + session.id, champs, { Prefer: 'return=minimal' }, 'PATCH');
  changer({ ...session, ...champs });
}
let etatTickets = { tickets: 0, non_lus: 0, dev_non_lus: 0 }; // pour « Mes tickets » et « Mode dev »
async function chargerProfil() {
  if (!session) return;
  try {
    const [p] = await rpc('mon_profil', {});
    if (p) {
      etatTickets = p; document.dispatchEvent(new Event('tickets'));
      if (p.pseudo !== session.pseudo || p.avatar !== session.avatar || p.dev !== !!session.dev) changer({ ...session, pseudo: p.pseudo, avatar: p.avatar, dev: p.dev }); // changé sur un autre appareil
    } else { await creerProfil(); document.body ? proposerPseudo() : document.addEventListener('DOMContentLoaded', proposerPseudo); chargerProfil(); }
  } catch { } // base en pause : le reste du site marche
}
// Retour du service de connexion : ?code=… à échanger, ou ?error=…
const compte = (async () => {
  const args = new URLSearchParams(location.search), code = args.get('code');
  let secret = null;
  try { secret = sessionStorage.getItem('secret'); sessionStorage.removeItem('secret'); } catch { }
  const refus = args.get('error') || new URLSearchParams(location.hash.slice(1)).get('error');
  ['code', 'error', 'error_code', 'error_description'].forEach(k => args.delete(k));
  if (code || refus) history.replaceState(null, '', location.pathname + (args.size ? '?' + args : ''));
  if (code && secret) try {
    changer(deJeton(await (await appel('/auth/v1/token?grant_type=pkce', { auth_code: code, code_verifier: secret })).json()));
  } catch { }
  await chargerProfil();
  return !(code || refus) || !!session;
})();

// « Mes tickets » n'apparaît dans le menu qu'à partir du premier ticket envoyé ; un point signale une réponse non lue.
function voirTickets() {
  const lien = document.getElementById('mes-tickets');
  if (!lien) return;
  lien.hidden = page !== 'tickets' && !(session && etatTickets.tickets);
  lien.classList.toggle('non-lu', !!session && etatTickets.non_lus > 0);
}
document.addEventListener('compte', voirTickets);
document.addEventListener('tickets', voirTickets);
document.addEventListener('DOMContentLoaded', voirTickets);

// Favoris
let favoris = new Set();
async function lireFavoris() {
  try { favoris = new Set(session ? (await lireTable('favoris?select=logiciel')).map(f => f.logiciel) : []); } catch { favoris = new Set(); }
  document.dispatchEvent(new Event('favoris'));
}
document.addEventListener('compte', lireFavoris);
if (session) lireFavoris();
const ETOILE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.5 1.2 6.4-5.7-3.1-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
function etoile(logiciel) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'etoile'; b.innerHTML = ETOILE; b.title = "Favorito"; b.setAttribute('aria-label', "Favorito");
  b.dataset.logiciel = logiciel; b.setAttribute('aria-pressed', favoris.has(logiciel));
  b.onclick = async () => {
    if (!session) return ouvrirConnexion("Inicia sessão para adicionar um favorito.");
    const mis = favoris.has(logiciel);
    mis ? favoris.delete(logiciel) : favoris.add(logiciel);
    document.dispatchEvent(new Event('favoris'));
    try { mis ? await appel('/rest/v1/favoris?logiciel=eq.' + logiciel, undefined, {}, 'DELETE') : await ecrireTable('favoris', { logiciel }, ',resolution=ignore-duplicates'); } catch { lireFavoris(); }
  };
  return b;
}
document.addEventListener('favoris', () => document.querySelectorAll('[data-logiciel]').forEach(b => b.setAttribute('aria-pressed', favoris.has(b.dataset.logiciel))));
function listeLogiciels(ids) { // liens avec icône : favoris et historique
  const ul = document.createElement('ul'); ul.className = 'mini';
  for (const [id, detail] of ids) {
    const l = LOGICIELS.find(x => x.id === id); if (!l) continue;
    const li = document.createElement('li'), a = document.createElement('a'), i = new Image(32, 32), s = document.createElement('span');
    i.src = l.icone; i.alt = ''; s.textContent = detail || ''; s.className = 'doux'; a.href = l.page; a.append(i, l.nom); li.append(a, s); ul.append(li);
  }
  return ul;
}
function boutonFavoris() {
  const a = document.createElement('a');
  a.className = 'etoile ronde'; a.href = 'favoris'; a.innerHTML = ETOILE; a.title = "Os teus favoritos"; a.setAttribute('aria-label', "Os teus favoritos");
  a.onclick = e => { if (!session) { e.preventDefault(); ouvrirConnexion("Inicia sessão para ver os teus favoritos."); } };
  return a;
}
function boutonDev() { // compte du créateur seulement (décidé par la base)
  const a = bloc('a', 'mode-dev');
  a.href = '/dev';
  const montrer = () => { a.hidden = !session?.dev; a.textContent = "Modo dev" + (etatTickets.dev_non_lus ? ` (${etatTickets.dev_non_lus})` : ''); };
  document.addEventListener('compte', montrer);
  document.addEventListener('tickets', montrer);
  montrer();
  return a;
}
function bulle() { // avatar et pseudo, vers « Mon compte »
  const a = document.createElement('a'); a.className = 'compte'; a.href = 'compte'; a.title = "A minha conta"; a.append(avatar(session.avatar), session.pseudo); return a;
}
function boutonCompte() {
  const zone = document.createElement('span');
  const montrer = () => {
    zone.replaceChildren(session?.pseudo ? bulle() : bouton("Iniciar sessão", () => session ? chargerProfil() : ouvrirConnexion(), 'compte'));
  };
  document.addEventListener('compte', montrer);
  compte.then(ok => { if (!ok && page !== 'contact') ouvrirConnexion("O início de sessão falhou. Tente de novo."); });
  montrer();
  return zone;
}

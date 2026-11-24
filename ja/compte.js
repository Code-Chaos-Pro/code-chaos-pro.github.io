// Compte (Supabase), commun à toutes les pages. Clé publique par nature : les droits sont dans supabase/messages.sql.
const BASE = 'https://zyjujjubtbdncbjrehfo.supabase.co', CLE = 'sb_publishable_j9auNOI-cBzZ9s35XfAo9Q_eGBq-ZSx';
const SERVICES = { google: 'Google', discord: 'Discord', azure: 'Microsoft' };
const lire = k => { try { return sessionStorage.getItem(k); } catch { return null; } };
const garder = (k, v) => { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch { } };
const b64 = o => btoa(String.fromCharCode(...new Uint8Array(o))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
let session = JSON.parse(lire('session')); // oubliée à la fermeture de l'onglet, ou après une heure
if (session && session.expires_at * 1000 < Date.now() + 60000) session = null;

const appel = (chemin, corps, entetes = {}) => fetch(BASE + chemin, {
  method: corps === undefined ? 'GET' : 'POST', body: corps instanceof Blob || corps === undefined ? corps : JSON.stringify(corps),
  headers: { apikey: CLE, 'Content-Type': corps instanceof Blob ? corps.type : 'application/json', ...(session && { Authorization: 'Bearer ' + session.access_token }), ...entetes },
}).then(async rep => { if (!rep.ok) throw Object.assign(new Error(await rep.text()), { code: rep.status }); return rep; });

function ecrire(ou, texte, secours) { // secours : l'adresse e-mail, pour toujours pouvoir écrire
  ou.textContent = texte;
  if (secours) { const a = document.createElement('a'); a.href = 'mailto:contact.codechaos@gmail.com'; a.textContent = 'contact.codechaos@gmail.com'; ou.append(` ${"宛先："} `, a); }
}
async function connecter(service) {
  const secret = b64(crypto.getRandomValues(new Uint8Array(32)));
  garder('secret', secret);
  const defi = b64(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)));
  location.href = BASE + '/auth/v1/authorize?' + new URLSearchParams({ provider: service, redirect_to: location.href, code_challenge: defi, code_challenge_method: 's256', ...(service === 'azure' && { scopes: 'email' }) });
}
function changer(s) { session = s; garder('session', s && JSON.stringify(s)); document.dispatchEvent(new Event('compte')); }
function deconnecter() { appel('/auth/v1/logout', {}).catch(() => { }); changer(null); }
function bouton(texte, action) { const b = document.createElement('button'); b.type = 'button'; b.className = 'bouton'; b.textContent = texte; b.onclick = action; return b; }
// État du compte dans « etat » et boutons dans « zone » : page de contact et fenêtre « Se connecter ».
async function montrerCompte(etat, zone, invite) {
  if (session) {
    ecrire(etat, `${"アカウント"} : ${session.email || "メールのないアカウントです。返信用のアドレスを記入してください"}`);
    return zone.replaceChildren(bouton("サインアウト", deconnecter));
  }
  zone.replaceChildren();
  ecrire(etat, "読み込み中…");
  try {
    const { external } = await (await appel('/auth/v1/settings')).json();
    const ouverts = Object.keys(SERVICES).filter(s => external[s]);
    if (!ouverts.length) return ecrire(etat, "サインインはまだ利用できません。", true);
    ecrire(etat, invite);
    zone.replaceChildren(...ouverts.map(s => bouton(`${"続ける："} ${SERVICES[s]}`, () => connecter(s))));
  } catch { ecrire(etat, "サインインが応答しません。", true); }
}
// Retour du service de connexion : ?code=… à échanger, ou ?error=…
const compte = (async () => {
  const args = new URLSearchParams(location.search), code = args.get('code'), secret = lire('secret');
  const refus = args.get('error') || new URLSearchParams(location.hash.slice(1)).get('error');
  ['code', 'error', 'error_code', 'error_description'].forEach(k => args.delete(k));
  if (!code && !refus) return true;
  history.replaceState(null, '', location.pathname + (args.size ? '?' + args : ''));
  garder('secret');
  if (code && secret) try {
    const j = await (await appel('/auth/v1/token?grant_type=pkce', { auth_code: code, code_verifier: secret })).json();
    changer({ access_token: j.access_token, expires_at: j.expires_at, id: j.user.id, email: j.user.email });
  } catch { }
  return !!session;
})();

// « Mes tickets » n'apparaît dans le menu qu'à partir du premier ticket envoyé.
async function voirTickets() {
  const lien = document.getElementById('mes-tickets');
  try { lien.hidden = !session || !(await (await appel('/rest/v1/messages?select=id&limit=1')).json()).length; } catch { lien.hidden = true; }
}
document.addEventListener('compte', voirTickets);
document.addEventListener('DOMContentLoaded', () => { if (session) voirTickets(); });

function boutonCompte() {
  const b = document.createElement('button'), d = document.createElement('dialog');
  b.className = 'compte'; b.type = 'button';
  d.innerHTML = '<h2></h2><p role="status"></p><div class="connexion"></div><form method="dialog"><button class="fermer"></button></form>';
  d.querySelector('.fermer').textContent = "閉じる";
  const montrer = () => montrerCompte(d.querySelector('p'), d.querySelector('.connexion'), "アカウントを選んでください。初回のサインイン時に作成されます。");
  const nommer = () => { b.textContent = d.querySelector('h2').textContent = session ? "マイアカウント" : "サインイン"; if (d.open) montrer(); };
  b.onclick = () => { if (!d.isConnected) document.body.append(d); d.showModal(); montrer(); };
  document.addEventListener('compte', nommer);
  nommer();
  compte.then(ok => { if (!ok && !location.pathname.endsWith('contact.html')) b.click(); }); // connexion ratée : proposée à nouveau
  return b;
}

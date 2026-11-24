// Compte (Supabase), commun à toutes les pages. Clé publique par nature : les droits sont dans supabase/messages.sql.
const BASE = 'https://zyjujjubtbdncbjrehfo.supabase.co', CLE = 'sb_publishable_j9auNOI-cBzZ9s35XfAo9Q_eGBq-ZSx';
const SERVICES = { google: 'Google', discord: 'Discord', azure: 'Microsoft' };
// Logos officiels, inclus dans le site (rien n'est chargé chez Google ni Discord avant de cliquer).
const LOGOS = {
  google: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
  discord: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>',
};
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
  if (secours) { const a = document.createElement('a'); a.href = 'mailto:contact.codechaos@gmail.com'; a.textContent = 'contact.codechaos@gmail.com'; ou.append(` ${"Schreibe an"} `, a); }
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
    ecrire(etat, `${"Konto"} : ${session.email || "Konto ohne E-Mail, gib eine an, um eine Antwort zu bekommen"}`);
    return zone.replaceChildren(bouton("Abmelden", deconnecter));
  }
  zone.replaceChildren();
  ecrire(etat, "Wird geladen…");
  try {
    const { external } = await (await appel('/auth/v1/settings')).json();
    const ouverts = Object.keys(SERVICES).filter(s => external[s]);
    if (!ouverts.length) return ecrire(etat, "Die Anmeldung ist noch nicht verfügbar.", true);
    ecrire(etat, invite);
    zone.replaceChildren(...ouverts.map(s => {
      const b = bouton(`${"Weiter mit"} ${SERVICES[s]}`, () => connecter(s));
      b.className = 'service ' + s;
      b.insertAdjacentHTML('afterbegin', LOGOS[s] || '');
      return b;
    }));
  } catch { ecrire(etat, "Die Anmeldung antwortet nicht.", true); }
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
  d.querySelector('.fermer').textContent = "Schließen";
  const montrer = () => montrerCompte(d.querySelector('p'), d.querySelector('.connexion'), "Wähle ein Konto. Deines wird bei der ersten Anmeldung erstellt.");
  const nommer = () => { b.textContent = d.querySelector('h2').textContent = session ? "Mein Konto" : "Anmelden"; if (d.open) montrer(); };
  b.onclick = () => { if (!d.isConnected) document.body.append(d); d.showModal(); montrer(); };
  document.addEventListener('compte', nommer);
  nommer();
  compte.then(ok => { if (!ok && !location.pathname.endsWith('contact.html')) b.click(); }); // connexion ratée : proposée à nouveau
  return b;
}

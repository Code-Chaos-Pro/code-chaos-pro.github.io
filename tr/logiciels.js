// Un bloc par logiciel. À mettre à jour à chaque publication (dates : « 2026-12-01 » ; vide = « Bientôt »).
const LOGICIELS = [
  { id: 'taskbarnest', nom: 'TaskbarNest', page: 'taskbarnest.html', icone: '/images/taskbarnest.png',
    version: '1.0.0', sortie: '', maj: '', telechargement: '' },
];
const dateFr = d => d ? new Date(d + 'T12:00').toLocaleDateString(document.documentElement.lang, { day: 'numeric', month: 'long', year: 'numeric' }) : "Yakında";

// Thème : celui de Windows, sauf si le visiteur a choisi avec l'interrupteur (gardé dans son navigateur).
const racine = document.documentElement, sombreWindows = matchMedia('(prefers-color-scheme: dark)');
const sombre = () => racine.dataset.theme ? racine.dataset.theme === 'dark' : sombreWindows.matches;
try { const t = localStorage.getItem('theme'); if (t === 'light' || t === 'dark') racine.dataset.theme = t; } catch { }
function boutonTheme() {
  const b = document.createElement('button');
  b.className = 'theme'; b.type = 'button';
  b.setAttribute('role', 'switch'); b.setAttribute('aria-label', "Koyu tema");
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 14.5A9.5 9.5 0 0 1 9.5 3 9.5 9.5 0 1 0 21 14.5z"/></svg>';
  const montrer = () => b.setAttribute('aria-checked', sombre());
  b.onclick = () => { racine.dataset.theme = sombre() ? 'light' : 'dark'; try { localStorage.setItem('theme', racine.dataset.theme); } catch { } montrer(); };
  sombreWindows.addEventListener('change', montrer);
  montrer();
  return b;
}

// Langues du site : le français à la racine, les autres dans /en/, /es/… (fabriquées par traduire-site.py).
const LANGUES = { fr: 'Français', en: 'English', es: 'Español', de: 'Deutsch', it: 'Italiano', pt: 'Português', nl: 'Nederlands', pl: 'Polski', ru: 'Русский', tr: 'Türkçe', ja: '日本語', zh: '中文（简体）', ko: '한국어' };
const page = location.pathname.split('/').pop().replace('index.html', '');
const traduite = ['', 'taskbarnest.html', 'contact.html', 'apropos.html'].includes(page); // les autres n'existent qu'en français
const adresse = (code, p) => (code === 'fr' ? '/' : `/${code}/`) + p;
// À la racine : langue déjà choisie, sinon celle du navigateur, sinon l'anglais. Pas pour les robots (Google doit lire le français)
// ni depuis TaskbarNest (?logiciel=), qui ouvre déjà sa langue.
if (racine.lang === 'fr' && traduite && !location.search.includes('logiciel=') && !/bot|crawl|spider/i.test(navigator.userAgent)) {
  let voulue = null;
  try { voulue = localStorage.getItem('langue'); } catch { }
  voulue = LANGUES[voulue] ? voulue : navigator.languages.map(l => l.slice(0, 2)).find(l => LANGUES[l]) || 'en';
  if (voulue !== 'fr') location.replace(adresse(voulue, page) + location.search + location.hash);
}
function choixLangue() {
  const s = document.createElement('select');
  s.className = 'langue'; s.setAttribute('aria-label', "Dil");
  for (const [code, nom] of Object.entries(LANGUES)) s.add(new Option(nom, code, false, code === racine.lang));
  s.onchange = () => {
    try { localStorage.setItem('langue', s.value); } catch { }
    location.href = adresse(s.value, traduite ? page + location.search : '');
  };
  return s;
}
function outils() {
  const d = document.createElement('div');
  d.className = 'outils';
  d.append(choixLangue(), boutonCompte(), boutonTheme());
  document.currentScript.replaceWith(d);
}

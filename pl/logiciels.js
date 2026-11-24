// Un bloc par logiciel. À mettre à jour à chaque publication (dates et heures UTC de GitHub ; vide = « Bientôt »).
const LOGICIELS = [
  { id: 'taskbarnest', nom: 'TaskbarNest', page: 'taskbarnest', icone: '/images/taskbarnest.png',
    description: "Uporządkuj aplikacje w folderach, bezpośrednio na pasku zadań Windows 11.",
    version: '1.0.1', sortie: '2026-11-24T01:59:37Z', maj: '2026-11-24T19:09:18Z',
    telechargement: 'https://github.com/Code-Chaos-Pro/TaskbarNest/releases/download/v1.0.1/TaskbarNest-Setup-v1.0.1.exe' },
];
// Sujets d'un ticket : la valeur (code) est enregistrée, le libellé est affiché dans la langue de la page.
const SUJETS = {
  demande: [['fonction', "Nowa funkcja"], ['amelioration', "Ulepszenie funkcji"], ['langue', "Nowy język"], ['autre', "Inne"]],
  signalement: [['dossier', "Folder się nie wyświetla"], ['ouverture', "Aplikacja się nie otwiera"], ['glisser', "Przeciąganie"], ['barre', "Pasek zadań działa wolno lub się zawiesza"], ['affichage', "Wygląd lub tekst"], ['traduction', "Tłumaczenie"], ['installation', "Instalacja lub aktualizacja"], ['desinstallation', "Odinstalowanie"], ['autre', "Inne"]],
};
const dateFr = d => d ? new Date(d).toLocaleString(document.documentElement.lang, { dateStyle: 'long', timeStyle: 'medium' }) : "Wkrótce";
const nombre = n => new Intl.NumberFormat(document.documentElement.lang, { notation: 'compact', maximumFractionDigits: 1 }).format(n); // 1,2 k ; 3 M
const badge = (dessin, n, texte) => `<span class="compteur"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${dessin}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><b>${nombre(n)}</b> ${texte}</span>`;
const badgeVues = n => badge('M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12zm7 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0', n, "Wyświetlenia");
const badgeTelechargements = n => badge('M12 3v12m-5-5 5 5 5-5M4 20h16', n, "Pobrania");

// Thème : celui de Windows, sauf si le visiteur a choisi avec l'interrupteur (gardé dans son navigateur).
const racine = document.documentElement, sombreWindows = matchMedia('(prefers-color-scheme: dark)');
const sombre = () => racine.dataset.theme ? racine.dataset.theme === 'dark' : sombreWindows.matches;
try { const t = localStorage.getItem('theme'); if (t === 'light' || t === 'dark') racine.dataset.theme = t; } catch { }
function boutonTheme() {
  const b = document.createElement('button');
  b.className = 'theme'; b.type = 'button';
  b.setAttribute('role', 'switch'); b.setAttribute('aria-label', "Ciemny motyw");
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 14.5A9.5 9.5 0 0 1 9.5 3 9.5 9.5 0 1 0 21 14.5z"/></svg>';
  const montrer = () => b.setAttribute('aria-checked', sombre());
  b.onclick = () => { racine.dataset.theme = sombre() ? 'light' : 'dark'; try { localStorage.setItem('theme', racine.dataset.theme); } catch { } montrer(); };
  sombreWindows.addEventListener('change', montrer);
  montrer();
  return b;
}

// Langues du site : le français à la racine, les autres dans /en/, /es/… (fabriquées par traduire-site.py).
const LANGUES = { fr: 'Français', en: 'English', es: 'Español', de: 'Deutsch', it: 'Italiano', pt: 'Português', nl: 'Nederlands', pl: 'Polski', ru: 'Русский', tr: 'Türkçe', ja: '日本語', zh: '中文（简体）', ko: '한국어' };
// Adresses sans « .html » : GitHub sert /contact à partir de contact.html ; les anciens liens sont nettoyés.
if (location.pathname.endsWith('.html')) history.replaceState(null, '', location.pathname.replace(/(index)?\.html$/, '') + location.search + location.hash);
const page = location.pathname.split('/').pop();
const traduite = ['', 'taskbarnest', 'contact', 'tickets', 'apropos', 'compte'].includes(page); // les autres n'existent qu'en français
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
  s.className = 'langue'; s.setAttribute('aria-label', "Język");
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
  d.append(choixLangue(), boutonCompte(), boutonTheme(), boutonFavoris());
  document.currentScript.replaceWith(d);
}

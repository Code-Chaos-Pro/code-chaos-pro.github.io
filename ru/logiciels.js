// Un bloc par logiciel. À mettre à jour à chaque publication (dates et heures UTC de GitHub ; vide = « Bientôt »).
const LOGICIELS = [
  { id: 'taskbarnest', nom: 'TaskbarNest', page: 'taskbarnest', icone: '/images/taskbarnest.png',
    description: "Раскладывайте приложения по папкам прямо на панели задач Windows 11.",
    version: '1.0.1', sortie: '2026-11-24T01:59:37Z', maj: '2026-11-24T19:09:18Z',
    telechargement: 'https://github.com/Code-Chaos-Pro/TaskbarNest/releases/download/v1.0.1/TaskbarNest-Setup-v1.0.1.exe' },
];
// Sujets d'un ticket : la valeur (code) est enregistrée, le libellé est affiché dans la langue de la page.
const SUJETS = {
  demande: [['fonction', "Новая функция"], ['amelioration', "Улучшить функцию"], ['langue', "Новый язык"], ['autre', "Другое"]],
  signalement: [['dossier', "Папка не отображается"], ['ouverture', "Приложение не открывается"], ['glisser', "Перетаскивание"], ['barre', "Панель задач тормозит или зависает"], ['affichage', "Отображение или текст"], ['traduction', "Перевод"], ['installation', "Установка или обновление"], ['desinstallation', "Удаление"], ['autre', "Другое"]],
};
const dateFr = d => d ? new Date(d).toLocaleString(document.documentElement.lang, { dateStyle: 'long', timeStyle: 'medium' }) : "Скоро";
const nombre = n => new Intl.NumberFormat(document.documentElement.lang, { notation: 'compact', maximumFractionDigits: 1 }).format(n); // 1,2 k ; 3 M
// Vues et téléchargements (compteurs de la base), en bas de la fiche. Rien si la base ne répond pas.
const fiche = (l, n, plus = '') => `<dt>Обновлено</dt><dd>${dateFr(l.maj)}</dd><dt>Выпущено</dt><dd>${dateFr(l.sortie)}</dd>${plus}${n?.avis ? `<dt>Отзывы</dt><dd>★ ${(n.note / 2).toLocaleString(racine.lang, { maximumFractionDigits: 1 })} (${nombre(n.avis)})</dd>` : ''}${n ? `<dt>Просмотры</dt><dd>${nombre(n.vues)}</dd><dt>Загрузки</dt><dd>${nombre(n.telechargements)}</dd>` : ''}`;

// Thème : celui de Windows, sauf si le visiteur a choisi avec l'interrupteur (gardé dans son navigateur).
const racine = document.documentElement, sombreWindows = matchMedia('(prefers-color-scheme: dark)');
const sombre = () => racine.dataset.theme ? racine.dataset.theme === 'dark' : sombreWindows.matches;
try { const t = localStorage.getItem('theme'); if (t === 'light' || t === 'dark') racine.dataset.theme = t; } catch { }
function boutonTheme() {
  const b = document.createElement('button');
  b.className = 'theme'; b.type = 'button';
  b.setAttribute('role', 'switch'); b.setAttribute('aria-label', "Тёмная тема");
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
const traduite = ['', 'taskbarnest', 'contact', 'tickets', 'apropos', 'compte', 'favoris'].includes(page); // les autres n'existent qu'en français
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
  s.className = 'langue'; s.setAttribute('aria-label', "Язык");
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
  d.append(choixLangue(), boutonDev(), boutonCompte(), boutonTheme(), boutonFavoris());
  document.currentScript.replaceWith(d);
}
// Liste des logiciels avec tri et affichage : accueil et favoris. Rend la fonction qui la redessine.
function catalogue(garder = () => true) {
  const g = id => document.getElementById(id);
  const lu = (k, choix) => { try { const v = localStorage.getItem(k); return choix.includes(v) ? v : choix[0]; } catch { return choix[0]; } };
  const note = (k, v) => { try { localStorage.setItem(k, v); } catch { } };
  const TRIS = {
    aleatoire: ["Случайно", (a, b) => a.hasard - b.hasard],
    alphabetique: ["По алфавиту", (a, b) => a.nom.localeCompare(b.nom, racine.lang)],
    telechargements: ["Самые скачиваемые", (a, b) => b.telechargements - a.telechargements],
    avis: ["Больше отзывов", (a, b) => b.avis - a.avis],
    vues: ["Самые просматриваемые", (a, b) => b.vues - a.vues],
    recents: ["Недавно обновлённые", (a, b) => b.maj.localeCompare(a.maj)],
  };
  let comptes = null; // null = la base ne répond pas
  const tous = LOGICIELS.map(l => ({ ...l, hasard: Math.random(), vues: 0, telechargements: 0, avis: 0 }));
  function afficher() {
    const vue = lu('vue', ['grille', 'liste']);
    const liste = tous.filter(garder).sort(TRIS[g('tri').value][1]);
    g('logiciels').classList.toggle('en-liste', vue === 'liste');
    for (const b of g('vues').children) b.setAttribute('aria-pressed', b.dataset.vue === vue);
    g('logiciels').innerHTML = liste.map(l => `<article class="logiciel">
    <img src="${l.icone}" alt="" width="88" height="88"><div class="nom"><a href="${l.page}">${l.nom}</a><span class="doux">Версия ${l.version}</span><p class="description">${l.description}</p></div>
    <dl class="fiche">${fiche(l, comptes && l)}</dl></article>`).join('');
    liste.forEach((l, i) => g('logiciels').children[i].append(etoile(l.id)));
  }
  // Tri et affichage : gardés dans le navigateur, et avec le compte si la personne est connectée.
  function noter(cle, valeur) {
    note(cle, valeur); afficher();
    if (session) ecrireTable('preferences?on_conflict=id', { tri: g('tri').value, vue: lu('vue', ['grille', 'liste']) }, ',resolution=merge-duplicates').catch(() => { });
  }
  async function preferences() {
    if (session) try {
      const [p] = await lireTable('preferences?select=tri,vue');
      if (p) { note('tri', p.tri); note('vue', p.vue); g('tri').value = lu('tri', Object.keys(TRIS)); afficher(); }
    } catch { }
  }
  for (const [cle, [nom]] of Object.entries(TRIS)) g('tri').add(new Option(nom, cle));
  g('tri').value = lu('tri', Object.keys(TRIS));
  g('tri').onchange = () => noter('tri', g('tri').value);
  for (const b of g('vues').children) b.onclick = () => noter('vue', b.dataset.vue);
  afficher();
  preferences();
  document.addEventListener('compte', preferences);
  compteurs().then(c => { comptes = c; if (c) tous.forEach(l => Object.assign(l, c[l.id])); afficher(); });
  return afficher;
}

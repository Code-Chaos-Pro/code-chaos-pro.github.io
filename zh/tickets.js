// Tickets en discussion : « Mes tickets » et mode dev. Droits : supabase/avis.sql.
const ETATS = { attente: "等待中", en_cours: "处理中", cloture: "已关闭" };
const nomSujet = t => (SUJETS[t.type] || []).find(([code]) => code === t.sujet)?.[1] || t.sujet;
const nomLogiciel = id => LOGICIELS.find(l => l.id === id)?.nom || "其他";
const nomType = t => t.type === 'demande' ? "建议" : "问题";
// Images : privées, demandées avec la connexion de la personne. Affichées au clic seulement.
async function montrerImages(zone, chemins) {
  zone.replaceChildren();
  for (const c of chemins) try {
    const i = new Image(); i.src = URL.createObjectURL(await (await appel('/storage/v1/object/authenticated/messages/' + c)).blob()); i.alt = '';
    zone.append(i);
  } catch { zone.append(bloc('span', 'doux', "图片不可用")); }
}
const boutonImages = t => { const z = bloc('div', 'apercus'); z.append(bouton(`${"查看图片"} (${t.images.length})`, () => montrerImages(z, t.images), 'fermer')); return z; };

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
    if (clos) return pied.replaceChildren(bloc('p', 'doux', "此工单已关闭。"));
    const champ = Object.assign(document.createElement('textarea'), { maxLength: 4000, required: true, placeholder: "您的回复" }), dit = bloc('p', 'erreur'), ok = bloc('button', 'bouton petit', "发送（CTRL + Enter）"), f = bloc('form', 'reponse', champ, dit, bloc('div', '', ok));
    champ.setAttribute('aria-label', "您的回复"); dit.setAttribute('role', 'status');
    champ.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.requestSubmit(); };
    f.onsubmit = async e => {
      e.preventDefault(); ok.disabled = true; dit.textContent = '';
      try { await ecrireTable('ticket_messages', { ticket: t.id, texte: champ.value.trim() }); champ.value = ''; await lire(); champ.focus(); }
      catch (x) { dit.textContent = x.message.includes('cloture') ? "此工单已关闭。" : x.message.includes('limite') ? "您写得太多了，请一小时后重试。" : "消息未发送，请重试。"; }
      finally { ok.disabled = false; }
    };
    pied.replaceChildren(f);
  }
  montrerPied();
  zone.maj = async n => { Object.assign(t, n); montrerPied(); try { await lire(); } catch { if (!dernier) messages.replaceChildren(bloc('p', 'doux', "无法读取对话。")); } };
  return zone;
}
// Carte de « Mes tickets ».
function carteTicket(t) {
  const etat = bloc('span'), zone = bloc('div'), voir = bouton('', () => { zone.hidden = !zone.hidden; montrer(); if (!zone.hidden) ouvrir(); }, 'fermer');
  const carte = bloc('article', 'encart ticket', bloc('div', 'qui', bloc('h2', '', nomSujet(t)), etat), bloc('p', 'doux', `${nomType(t)} · ${nomLogiciel(t.logiciel)} · ${dateFr(t.cree)}`), bloc('p', 'message', t.texte), ...(t.images.length ? [boutonImages(t)] : []), bloc('div', 'actions', voir), zone);
  let d = null;
  const montrer = () => {
    etat.className = 'etat ' + t.etat; etat.textContent = ETATS[t.etat];
    voir.textContent = zone.hidden ? `${"打开对话"} (${t.reponses})` : "关闭对话";
    voir.classList.toggle('non-lu', t.non_lu && zone.hidden);
  };
  async function ouvrir() { if (!d) zone.append(d = discussion(t)); await d.maj({}); chargerProfil(); }
  zone.hidden = true;
  montrer();
  carte.maj = n => { Object.assign(t, n); montrer(); if (!zone.hidden) d.maj({}); };
  return carte;
}

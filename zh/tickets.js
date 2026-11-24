// Tickets en discussion : « Mes tickets » et mode dev. Droits : supabase/avis.sql.
const ETATS = { attente: "等待中", en_cours: "处理中", cloture: "已关闭" };
// Images : privées, demandées avec la connexion de la personne. Affichées au clic seulement.
async function montrerImages(zone, chemins) {
  zone.replaceChildren();
  for (const c of chemins) try {
    const i = new Image(); i.src = URL.createObjectURL(await (await appel('/storage/v1/object/authenticated/messages/' + c)).blob()); i.alt = '';
    zone.append(i);
  } catch { zone.append(bloc('span', 'doux', "图片不可用")); }
}
// t : ligne de lire_tickets. dev : page du créateur (avec l'adresse de la personne). outilsDev(t) : boutons en plus.
function carteTicket(t, dev, outilsDev) {
  const sujet = (SUJETS[t.type] || []).find(([code]) => code === t.sujet)?.[1] || t.sujet;
  const etat = bloc('span', 'etat ' + t.etat, ETATS[t.etat]), zone = bloc('div', 'discussion'), carte = bloc('article', 'encart ticket', bloc('div', 'qui', bloc('h2', '', sujet), etat));
  if (dev) carte.append(bloc('div', 'qui', avatar(t.avatar), bloc('strong', '', t.pseudo || "无用户名的账户"), ...(t.createur ? [badgeCreateur()] : []), bloc('span', 'doux', t.email || "无邮箱的账户")));
  carte.append(bloc('p', 'doux', `${t.type === 'demande' ? "建议" : "问题"} · ${LOGICIELS.find(l => l.id === t.logiciel)?.nom || "其他"} · ${dateFr(t.cree)}`), bloc('p', 'message', t.texte));
  if (t.images.length) { const z = bloc('div', 'apercus'); z.append(bouton(`${"查看图片"} (${t.images.length})`, () => montrerImages(z, t.images), 'fermer')); carte.append(z); }
  let minuteur = null, lus = -1;
  const voir = bouton('', () => zone.hidden ? ouvrir() : fermer(), 'fermer');
  const libelle = () => { voir.textContent = zone.hidden ? `${"打开对话"} (${t.reponses})` : "关闭对话"; voir.classList.toggle('non-lu', t.non_lu && zone.hidden); };
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
    const f = t.etat === 'cloture' ? bloc('p', 'doux', "此工单已关闭。") : bloc('form', 'reponse');
    if (t.etat !== 'cloture') {
      const champ = Object.assign(document.createElement('textarea'), { maxLength: 4000, required: true }), dit = bloc('p', 'erreur'), ok = bloc('button', 'bouton petit', "发送");
      champ.setAttribute('aria-label', "您的回复"); dit.setAttribute('role', 'status');
      f.append(champ, dit, bloc('div', '', ok));
      f.onsubmit = async e => {
        e.preventDefault(); ok.disabled = true; dit.textContent = '';
        try { await ecrireTable('ticket_messages', { ticket: t.id, texte: champ.value.trim() }); champ.value = ''; await lire(); }
        catch (x) { dit.textContent = x.message.includes('cloture') ? "此工单已关闭。" : x.message.includes('limite') ? "您写得太多了，请一小时后重试。" : "消息未发送，请重试。"; }
        finally { ok.disabled = false; }
      };
    }
    lus = -1;
    zone.replaceChildren(messages, f);
    try { await lire(); chargerProfil(); } catch { messages.replaceChildren(bloc('p', 'doux', "无法读取对话。")); }
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
  if (lus.length > PAGE) { const suite = bouton("显示更多", () => { suite.remove(); listerTickets(zone, filtre, dev, outilsDev, debut + PAGE); }, 'fermer'); cartes.push(suite); }
  debut ? zone.append(...cartes) : zone.replaceChildren(...cartes);
  return cartes;
}

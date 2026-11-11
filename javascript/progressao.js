/* =====================================================================
   PROGRESSAO.JS · Evolução do personagem (classes, raças, subclasses)
   - card "Evolução" na aba Personagem
   - painel com linha do tempo por classe, raça e resumo
   - subir de nível (multiclasse, subclasse, PV, melhoria de atributo)
   - subclasse personalizada (só o nome, ou montada nível a nível)
   Os dados ficam em personagem.progressao; os poderes ganhos vão pra aba 🔥.
   Depende de classes-dados.js (CLASSES_IGNEA, RACAS_IGNEA, TALENTOS_IGNEA).
   ===================================================================== */
(function () {
  if (window._progPronto) return;
  window._progPronto = true;

  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const temDados = () => typeof CLASSES_IGNEA !== "undefined";
  /* classes: as do SRD + as criadas pelo jogador (salvas no aparelho e na própria ficha) */
  const BIBC = "ignea_classes";
  const bibClasses = () => { try { return JSON.parse(localStorage.getItem(BIBC) || "[]"); } catch (e) { return []; } };
  const salvarBibClasses = (l) => { try { localStorage.setItem(BIBC, JSON.stringify(marcar(l, bibClasses()).slice(-60))); } catch (e) {} nuvemAgendar(); };
  /* ---------- criações na nuvem: mestres/{uid}/criacoes/{id} (um documento por classe/subclasse) ---------- */
  const SYNC = "ignea_criacoes_sync"; // ids que já estiveram na nuvem: some daqui = foi apagado em outro aparelho
  const nomeN = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const novoId = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const assinatura = (x) => { const y = { ...x }; delete y._t; return JSON.stringify(y); };
  function marcar(l, anteriores) {
    // cada item ganha id e a hora da última mudança (pra decidir quem ganha entre dois aparelhos)
    const ant = {};
    (anteriores || []).forEach((x) => { if (x && x.id) ant[x.id] = x; });
    return l.map((x) => {
      if (!x.id) x.id = novoId(x.classe ? "sb_" : "cc_");
      const velho = ant[x.id];
      if (!x._t || (velho && assinatura(velho) !== assinatura(x))) x._t = Date.now();
      return x;
    });
  }
  let nuvemTimer = null, nuvemUid = null, nuvemOcupado = false;
  const nuvemPronta = () => !!(window.usuarioAtual && window.db && window.doc && window.setDoc && window.getDocs && window.collection && window.deleteDoc);
  function nuvemAgendar() {
    clearTimeout(nuvemTimer);
    nuvemTimer = setTimeout(nuvemEnviar, 1500);
  }
  const lerSync = () => { try { return JSON.parse(localStorage.getItem(SYNC) || "{}"); } catch (e) { return {}; } };
  const gravarSync = (o) => { try { localStorage.setItem(SYNC, JSON.stringify(o)); } catch (e) {} };
  function locais() {
    const out = {};
    bibClasses().forEach((x) => { if (x.id) out[x.id] = { tipo: "classe", dados: x }; });
    biblioteca().forEach((x) => { if (x.id) out[x.id] = { tipo: "sub", dados: x }; });
    return out;
  }
  async function nuvemEnviar() {
    if (!nuvemPronta() || nuvemOcupado || nuvemUid !== window.usuarioAtual.uid) return;
    nuvemOcupado = true;
    try {
      const uid = window.usuarioAtual.uid, sync = lerSync(), loc = locais();
      for (const [id, it] of Object.entries(loc)) {
        const ass = assinatura(it.dados);
        if (sync[id] === ass) continue;
        const limpo = JSON.parse(JSON.stringify(it.dados));
        await window.setDoc(window.doc(window.db, "mestres", uid, "criacoes", id), { tipo: it.tipo, dados: limpo, t: it.dados._t || Date.now() });
        sync[id] = ass;
      }
      for (const id of Object.keys(sync)) {
        if (loc[id]) continue;
        await window.deleteDoc(window.doc(window.db, "mestres", uid, "criacoes", id));
        delete sync[id];
      }
      gravarSync(sync);
    } catch (e) { console.warn("Criações: não deu pra salvar na nuvem agora", e); }
    nuvemOcupado = false;
  }
  async function nuvemCarregar() {
    if (!nuvemPronta()) return;
    const uid = window.usuarioAtual.uid;
    nuvemOcupado = true;
    try {
      const snap = await window.getDocs(window.collection(window.db, "mestres", uid, "criacoes"));
      const nuvem = {};
      snap.forEach((d) => { const v = d.data(); if (v && v.dados) nuvem[d.id] = v; });
      // conta nova neste aparelho: o que já estava aqui é de quem? só junta se ainda não sincronizou com outra conta
      const dono = localStorage.getItem("ignea_criacoes_dono");
      let sync = dono && dono !== uid ? {} : lerSync();
      let cls = dono && dono !== uid ? [] : marcar(bibClasses());
      let subs = dono && dono !== uid ? [] : marcar(biblioteca());
      // apagadas em outro aparelho
      cls = cls.filter((x) => !(sync[x.id] && !nuvem[x.id]));
      subs = subs.filter((x) => !(sync[x.id] && !nuvem[x.id]));
      // novas ou mais recentes na nuvem
      Object.entries(nuvem).forEach(([id, v]) => {
        const lista = v.tipo === "classe" ? cls : subs;
        const i = lista.findIndex((x) => x.id === id);
        const dados = { ...v.dados, id, _t: v.t || v.dados._t || 0 };
        if (i < 0) lista.push(dados);
        else if ((dados._t || 0) > (lista[i]._t || 0)) lista[i] = dados;
        sync[id] = assinatura(dados);
      });
      try { localStorage.setItem(BIBC, JSON.stringify(cls.slice(-60))); localStorage.setItem(BIB, JSON.stringify(subs.slice(-200))); } catch (e) {}
      // o que é só daqui ainda não está na nuvem: marca como "mudou" pra subir
      Object.keys(sync).forEach((id) => { if (!nuvem[id] && !cls.some((x) => x.id === id) && !subs.some((x) => x.id === id)) delete sync[id]; });
      gravarSync(sync);
      localStorage.setItem("ignea_criacoes_dono", uid);
      nuvemUid = uid;
      if ($("evPainel") && $("evPainel").classList.contains("aberto")) renderPainel();
    } catch (e) { console.warn("Criações: não deu pra carregar da nuvem agora", e); nuvemUid = uid; }
    nuvemOcupado = false;
    nuvemEnviar();
  }
  // entra e sai de conta: carrega as criações dessa conta
  setInterval(() => {
    const uid = window.usuarioAtual && window.usuarioAtual.uid;
    if (uid && uid !== nuvemUid && !nuvemOcupado && nuvemPronta()) nuvemCarregar();
    if (!uid) nuvemUid = null;
  }, 2500);
  function montarClasse(x) {
    // transforma o que o editor salva no mesmo formato das classes do SRD
    if (!x || x._pronta) return x;
    const asis = (x.asi || []).map(Number);
    const f = (x.f || []).map((h) => ({ ...h, n: Number(h.n) }));
    asis.forEach((n) => f.push({ n, nome: "Melhoria de Atributo", d: "+2 em um atributo ou +1 em dois (máximo 20), ou um talento à sua escolha.", asi: 1, x: 1 }));
    if (x.dadiva) f.push({ n: 19, nome: "Dádiva Épica", d: "Você ganha um talento de Dádiva Épica (ou outro talento). Dádivas épicas podem levar um atributo até 30.", asi: 2, x: 1 });
    f.sort((a, b) => a.n - b.n);
    const perN = Number(x.perN) || 2;
    const per = { n: perN, de: x.perDe && x.perDe.length > perN ? x.perDe : null }; // lista curta demais = leitura incompleta, libera todas
    return {
      id: x.id, custom: true, _pronta: true, nome: x.nome || "Classe sem nome", ic: x.ic || "⚜️", resumo: x.resumo || "Classe criada pelo jogador.",
      dv: Number(x.dv) || 8, prim: x.prim && x.prim.length ? x.prim : x.conj && x.atrConj ? [x.atrConj] : ["for"], magRegra: x.magRegra || null, primOu: false, saves: x.saves && x.saves.length ? x.saves : ["for", "con"],
      pericias: per.de ? `Escolha ${per.n}: ${per.de.join(", ")}` : `Escolha ${per.n} perícias quaisquer`, per,
      armas: x.armas || "—", armaduras: x.armaduras || "—", multi: "Dado de vida.",
      conj: x.conj || null, atrConj: x.atrConj || "car", subNome: x.subNome || "Subclasse", subNiveis: niveisSub(x),
      tabela: x.tab && Array.isArray(x.tab.cols) ? { cols: x.tab.cols, linhas: x.tab.linhas } : { cols: [], linhas: Array.from({ length: 20 }, () => []) }, f, sub: { id: "", nome: "", d: "", f: [] }, bruto: x,
    };
  }
  // classe sem os níveis de subclasse marcados, mas com subclasses salvas: usa os níveis das habilidades delas
  // (senão a escolha de subclasse nunca aparece na evolução)
  function niveisSub(x) {
    const nv = (x.subNiveis || []).map(Number).filter((n) => n >= 1 && n <= 20);
    if (nv.length) return [...new Set(nv)].sort((a, b) => a - b);
    let subs = [];
    try { subs = JSON.parse(localStorage.getItem("ignea_subclasses") || "[]").filter((y) => y && y.classe === x.id); } catch (e) {}
    if (!subs.length) return [];
    const daSub = [...new Set(subs.flatMap((y) => (y.f || []).map((f) => Number(f.n)).filter((n) => n >= 1 && n <= 20)))].sort((a, b) => a - b);
    return daSub.length ? daSub : [3];
  }
  function classeCustom(id) {
    const p = personagens && personagemAtual !== null ? personagens[personagemAtual] : null;
    const naFicha = p && p.progressao && p.progressao.classesCustom ? p.progressao.classesCustom[id] : null;
    // a versão da biblioteca é a editada por último; a cópia na ficha só vale se a classe não estiver mais aqui
    const x = bibClasses().find((c) => c.id === id) || naFicha;
    return x ? montarClasse(x) : null;
  }
  function todasClasses() {
    const vistos = new Set(), out = [];
    const p = personagens && personagemAtual !== null ? personagens[personagemAtual] : null;
    const daFicha = p && p.progressao && p.progressao.classesCustom ? Object.values(p.progressao.classesCustom) : [];
    bibClasses().concat(daFicha).forEach((x) => { if (x && !vistos.has(x.id)) { vistos.add(x.id); out.push(montarClasse(x)); } });
    return CLASSES_IGNEA.concat(out);
  }
  const CL = (id) => (temDados() ? CLASSES_IGNEA.find((c) => c.id === id) || (String(id).startsWith("cc_") ? classeCustom(id) : null) : null);
  const RC = (id) => (typeof RACAS_IGNEA !== "undefined" ? RACAS_IGNEA.find((r) => r.id === id) : null);
  const ATR = { for: "forca", des: "destreza", con: "constituicao", int: "inteligencia", sab: "sabedoria", car: "carisma" };
  const ATR_NOME = { for: "Força", des: "Destreza", con: "Constituição", int: "Inteligência", sab: "Sabedoria", car: "Carisma" };
  const icDe = (c) => (c && (c.ic || CL_IC[c.id])) || "⚜️";
  const CL_IC = { barbaro: "🪓", bardo: "🎻", clerigo: "☀️", druida: "🌿", guerreiro: "⚔️", monge: "👊", paladino: "🛡️", patrulheiro: "🏹", ladino: "🗡️", feiticeiro: "✴️", bruxo: "🕯️", mago: "📖" };
  const ATR_ICO = { for: "💪", des: "🤸", con: "🫀", int: "🧠", sab: "🦉", car: "🎭" };
  const ROM = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
  const ACAO_ROT = { acao: "Ação", bonus: "Ação bônus", reacao: "Reação", livre: "Livre", passiva: "Passiva" };
  const REC_ROT = { curto: "descanso curto", longo: "descanso longo", vontade: "à vontade", dia: "por dia" };

  /* ---------- acesso à ficha aberta ---------- */
  const fichaAtual = () => (typeof personagemAtual !== "undefined" && personagemAtual !== null && typeof personagens !== "undefined" ? personagens[personagemAtual] : null);
  function st() {
    const p = fichaAtual();
    if (!p) return null;
    if (!p.progressao || typeof p.progressao !== "object") p.progressao = {};
    const s = p.progressao;
    s.niveis = Array.isArray(s.niveis) ? s.niveis : [];
    s.subs = s.subs && typeof s.subs === "object" ? s.subs : {};
    s.adicionados = Array.isArray(s.adicionados) ? s.adicionados : [];
    s.ocultos = Array.isArray(s.ocultos) ? s.ocultos : [];
    if (s.addPoderes === undefined) s.addPoderes = true;
    return s;
  }
  const ativo = () => { const s = st(); return !!(s && s.niveis.length); };

  /* ---------- regras da mesa: o mestre escreve na campanha (regras-mesa.js entende) ---------- */
  function mesa() { try { return typeof window.regrasDaFicha === "function" ? window.regrasDaFicha() : null; } catch (e) { return null; } }
  const regraV = (k) => { const m = mesa(); return m ? m.r[k] : undefined; };
  const regra = (k) => !!regraV(k);
  function regrasLigadasTxt() { const m = mesa(); return m ? m.itens.flatMap((x) => x.entendi) : []; }
  function regrasMesaHTML() {
    const m = mesa();
    if (!m) return `<p class="ev-p quieto">Sua ficha não está num grupo com regras da mesa. Quando o mestre escrever as regras na campanha, elas aparecem aqui.</p>`;
    const auto = m.itens.filter((x) => x.entendi.length), lemb = m.lembretes;
    return `<p class="ev-p quieto">Escritas pelo mestre${m.campanha ? ` na campanha <b>${esc(m.campanha)}</b>` : ""}${m.grupo ? ` (grupo ${esc(m.grupo)})` : ""}.</p>
      ${auto.length ? `<h5 class="ev-h">O app já aplica</h5><div class="ev-regras">${auto.map((x) => `<div class="ev-regra on"><i class="ti ti-check"></i><span><b>${x.entendi.map(esc).join(" · ")}</b><small>“${esc(x.linha)}”</small></span></div>`).join("")}</div>` : ""}
      ${lemb.length ? `<h5 class="ev-h">Lembretes do mestre</h5><div class="ev-regras">${lemb.map((l) => `<div class="ev-regra"><i class="ti ti-note"></i><span><small class="ev-lemb">${esc(l)}</small></span></div>`).join("")}</div>` : ""}`;
  }
  window.evRegrasMesa = function () {
    if (tela !== "regrasMesa") regrasVolta = tela;
    tela = "regrasMesa";
    renderPainel();
    $("evCorpo").scrollTop = 0;
  };
  let regrasVolta = "visao";
  function linkRegrasHTML() {
    const m = mesa();
    if (!m) return "";
    const lig = regrasLigadasTxt();
    return `<button type="button" class="ev-regras-link" onclick="evRegrasMesa()"><i class="ti ti-scroll"></i><span>Regras da mesa<small>${lig.length ? esc(lig.slice(0, 3).join(" · ")) + (lig.length > 3 ? ` +${lig.length - 3}` : "") : `${m.lembretes.length} lembrete${m.lembretes.length === 1 ? "" : "s"} do mestre`}</small></span><i class="ti ti-chevron-right"></i></button>`;
  }
  function porClasse() {
    const s = st(), out = {};
    if (!s) return out;
    s.niveis.forEach((n) => { out[n.c] = (out[n.c] || 0) + 1; });
    return out;
  }
  const total = () => (st() ? st().niveis.length : 0);
  // dados de vida da ficha (um por nível, do tamanho do dado da classe daquele nível)
  window.poolDadosVida = function () {
    const s = st();
    if (!s || !s.niveis.length) return null;
    const pool = {};
    s.niveis.forEach((n) => { const c = CL(n.c); const dv = (c && c.dv) || 8; pool[dv] = (pool[dv] || 0) + 1; });
    return pool;
  };
  const pb = (n) => (typeof PROG_PB !== "undefined" ? PROG_PB[Math.max(1, Math.min(20, n || total() || 1))] : 2);
  const atrVal = (k) => (typeof getAtributoFinal === "function" ? getAtributoFinal(ATR[k]) : 10);
  const modDe = (k) => Math.floor((atrVal(k) - 10) / 2);
  const sinal = (n) => (n >= 0 ? "+" + n : String(n));
  function racaAtual() {
    const v = ($("racaSelect") || {}).value || "";
    if (v.startsWith("srd_")) return RC(v.slice(4));
    // raça colada (fica nas raças personalizadas, com os traços)
    if (v.startsWith("custom_") && typeof racasCustomSalvas !== "undefined") {
      const r = racasCustomSalvas[parseInt(v.slice(7), 10)];
      if (r && Array.isArray(r.t) && r.t.length) return { id: "rc_" + slug(r.nome), nome: r.nome, tam: r.tam || "Médio", desl: r.desl || "9 m", d: r.d || "", t: r.t, custom: true };
    }
    return null;
  }

  /* ---------- subclasse ---------- */
  function subDe(cid) {
    const s = st(), c = CL(cid);
    if (!s || !c) return null;
    const x = s.subs[cid];
    if (!x) return null;
    if (x.tipo === "srd") return { ...c.sub, tipo: "srd" };
    return { tipo: x.tipo, mesaId: x.mesaId, nome: x.nome || "Subclasse", d: x.d || "", f: Array.isArray(x.f) ? x.f : [], magias: x.magias || {} };
  }
  const precisaSub = (cid, nivel) => { const c = CL(cid); return c && nivel >= c.subNiveis[0] && !(st().subs || {})[cid]; };

  /* ---------- o que cada nível dá ---------- */
  function ganhosNoNivel(cid, n) {
    const c = CL(cid);
    if (!c) return [];
    const out = c.f.filter((f) => f.n === n).map((f) => ({ ...f, origem: "classe" }));
    if (c.subNiveis.includes(n)) {
      const sub = subDe(cid);
      if (n === c.subNiveis[0] && !sub) out.unshift({ n, nome: /^subclasse$/i.test(c.subNome) ? "Escolha de subclasse" : `Escolha de ${c.subNome.toLowerCase()} (subclasse)`, d: c.custom ? "Você cria a subclasse: só o nome ou montada nível a nível." : "Você escolhe a subclasse: a oficial, uma criada por você ou só o nome.", x: 1, slotSub: 1 });
      else if (sub) {
        const fs = sub.f.filter((f) => Number(f.n) === n);
        if (fs.length) fs.forEach((f) => out.push({ ...f, origem: "subclasse" }));
        else out.push({ n, nome: `Habilidade de ${sub.nome}`, d: sub.tipo === "nome" ? "Adicione o poder dessa subclasse na aba 🔥 (origem Subclasse)." : "Ainda sem habilidade neste nível. Toque em Editar subclasse pra criar.", x: 1, vazio: 1, origem: "subclasse" });
      } else out.push({ n, nome: "Habilidade da subclasse", d: "Ganha uma habilidade da subclasse escolhida.", x: 1, vazio: 1, origem: "subclasse" });
    }
    return out;
  }
  function usosDe(f, cid, nivel) {
    const u = f.u;
    if (u === undefined || u === null || u === "") return 0;
    if (typeof u === "number") return u;
    if (u === "pb") return pb();
    if (/^c\d$/.test(u)) {
      const c = CL(cid);
      const v = c && c.tabela.linhas[Math.max(0, nivel - 1)] ? c.tabela.linhas[nivel - 1][Number(u[1])] : 0;
      return typeof v === "number" ? v : parseInt(v) || 0;
    }
    if (ATR[u]) return Math.max(1, modDe(u));
    return parseInt(u) || 0;
  }

  /* ---------- ícone de cada habilidade (a aba 🔥 mostra no selo) ---------- */
  const ICONES = [
    [/fúria|frenesi|furios|implacável|brutal/i, "💢"], [/dragão|dracônic|sopro/i, "🐉"], [/infern|obscuro|inferno|demon/i, "😈"],
    [/cura|vida|fôlego|restaura|integridade|curandeiro|vitalid|robustez/i, "💗"], [/forma selvagem|fera|companheiro|montaria|animais/i, "🐾"],
    [/inspira|palavras|contraencanto|cortantes/i, "🎵"], [/artes marciais|foco|golpe atordoante|palma|mão aberta|golpes fortalecidos/i, "👊"],
    [/canalizar|divin|sagrad|radiante|halo|devoção|abençoad|abjurar/i, "☀️"], [/aura/i, "🔆"],
    [/furtiv|astut|escond|ladrão|segundo andar|mãos rápidas|véu/i, "🌑"], [/sorte|destino|sortudo/i, "🍀"],
    [/esquiva|evasão|reflexo|elusiv|escorregadi|desviar/i, "💨"], [/teleport|salto das nuvens|passo|movimento|deslocamento|andarilho|recuo|ligeiro/i, "🥾"],
    [/sentido|visão|percepção|conhecimento do caçador|instinto/i, "👁️"], [/marca|caçador|presa|matador|mira|preciso|crítico/i, "🎯"],
    [/defesa|proteç|resiliên|resistên|indomáv|sobreviv|constituição poderosa|corajoso|ancestralidade feérica/i, "🛡️"],
    [/metamagia|feitiçaria|fonte de magia|apoteose/i, "✴️"], [/invocaç|pacto|arcano místico|patrono|astúcia mágica/i, "📜"],
    [/magia|conjura|arcan|ritual|evoca|truque|esculpir|sobrecarga|memorizar|grimório/i, "✨"],
    [/elemental|fogo|gelo|raio|trovão|tempestade/i, "🔥"], [/ataque|golpe|arma|maestria|estilo de luta|investida/i, "⚔️"],
    [/medo|intimid|presença|aterror/i, "😱"], [/queda/i, "🪶"], [/adrenalina|surto|ação/i, "⚡"], [/transe|descanso|recuperação|natural/i, "🌙"],
  ];
  function iconeDe(nome, origem) {
    const n = String(nome || "");
    for (const [re, ic] of ICONES) if (re.test(n)) return ic;
    return origem === "raca" ? "🧬" : origem === "talento" ? "⭐" : origem === "subclasse" ? "🔱" : "⚜️";
  }
  window.progIconeDe = iconeDe;

  /* ---------- magia ---------- */
  function nivelConjurador() {
    const pc = porClasse();
    let n = 0;
    Object.entries(pc).forEach(([cid, lv]) => {
      const c = CL(cid);
      if (!c) return;
      if (c.conj === "total") n += lv;
      else if (c.conj === "meio") n += Math.ceil(lv / 2);
    });
    return Math.min(20, n);
  }
  function espacos() {
    const n = nivelConjurador();
    return n && typeof PROG_ESPACOS !== "undefined" ? PROG_ESPACOS[n] : [];
  }
  function pacto() {
    let lv = 0;
    Object.entries(porClasse()).forEach(([cid, n]) => { const c = CL(cid); if (c && c.conj === "pacto") lv += n; });
    lv = Math.min(20, lv);
    if (!lv) return null;
    const l = CL("bruxo").tabela.linhas[lv - 1];
    return { espacos: l[3], circulo: l[4] };
  }
  // pro catálogo de magias: nível em cada classe conjuradora
  window.progNiveisClasse = function () {
    if (!ativo()) return null;
    const out = {};
    Object.entries(porClasse()).forEach(([cid, lv]) => { const c = CL(cid); if (c) out[c.nome] = lv; });
    return out;
  };

  /* ---------- sincronizar a ficha ---------- */
  function textoClasses() {
    const s = st();
    return Object.entries(porClasse()).map(([cid, lv]) => {
      const c = CL(cid), sub = subDe(cid);
      return `${c ? c.nome : cid} ${lv}${sub && sub.nome ? ` (${sub.nome})` : ""}`;
    }).join(" / ");
  }
  function esperados() {
    const lista = [];
    const pc = porClasse();
    Object.entries(pc).forEach(([cid, lv]) => {
      const c = CL(cid);
      if (!c) return;
      for (let n = 1; n <= lv; n++) {
        ganhosNoNivel(cid, n).forEach((f) => {
          if (f.x || f.asi) return;
          const chave = (f.origem === "subclasse" ? "s:" : "c:") + cid + ":" + slug(f.nome);
          if (lista.some((e) => e.chave === chave)) return;
          lista.push({ chave, f, cid, origem: f.origem, usos: usosDe(f, cid, lv) });
        });
      }
    });
    const r = racaAtual();
    if (r) r.t.forEach((t) => {
      if (t.x || (t.nivel && total() < t.nivel)) return;
      lista.push({ chave: "r:" + r.id + ":" + slug(t.nome), f: t, origem: "raca", usos: usosDe(t, null, 0) });
    });
    magiasEsperadas().forEach((m) => { if (!lista.some((e) => e.chave === m.chave)) lista.push(m); });
    const pa = pacto();
    if (pa) lista.push({ chave: "p:pacto", f: { nome: "Espaços de Magia de Pacto", d: `${pa.espacos} espaço(s) de ${pa.circulo}º círculo. Voltam no descanso curto ou longo.`, a: "passiva", r: "curto" }, origem: "classe", usos: pa.espacos });
    return lista;
  }
  const catMagia = (nome) => (typeof CATALOGO_MAGIAS !== "undefined" ? CATALOGO_MAGIAS.find((m) => m.nome.toLowerCase() === String(nome).trim().toLowerCase()) : null);
  function tabelaMagiasSub(cid, sub) {
    if (!sub) return null;
    if (sub.tipo === "srd") return sub.id === "terra" ? (TERRAS_IGNEA[(st().terra || {})[cid]] || {}).magias : (typeof MAGIAS_SUB !== "undefined" ? MAGIAS_SUB[sub.id] : null);
    return sub.magias;
  }
  function magiasEsperadas() {
    const out = [];
    const add = (nome, origem, fonte) => {
      const chave = "m:" + slug(nome);
      if (!nome || out.some((e) => e.chave === chave)) return;
      out.push({ chave, magia: catMagia(nome) || null, nome, origem, fonte, usos: 0, f: { nome } });
    };
    Object.entries(porClasse()).forEach(([cid, lv]) => {
      const c = CL(cid);
      if (typeof MAGIAS_CLASSE !== "undefined") Object.entries(MAGIAS_CLASSE).forEach(([k, l]) => { const [kc, kn] = k.split(":"); if (kc === cid && lv >= Number(kn)) l.forEach((n) => add(n, "classe", c.nome)); });
      const sub = subDe(cid), tab = tabelaMagiasSub(cid, sub);
      if (tab) Object.entries(tab).forEach(([n, l]) => { if (lv >= Number(n)) (l || []).forEach((nm) => add(nm, "subclasse", sub.nome)); });
    });
    return out;
  }
  function poderDeMagia(e) {
    const x = e.magia, id = "pw_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    if (!x) return { id, nome: e.nome, circulo: "", acao: "", recarga: "", origem: e.origem, tipo: "", dano: "", alcance: "", duracao: "", tempo: "", desc: `Magia sempre preparada (${e.fonte}).`, temCargas: false, maxCargas: 0, cargasGastas: [], componentes: {}, _prog: e.chave };
    return {
      id, nome: x.nome, circulo: String(x.c), acao: x.acao || "", recarga: "", origem: e.origem, tipo: x.tipo || "", dano: x.dano || "", alcance: x.alcance || "", duracao: x.duracao || "", tempo: x.tempo || "",
      desc: `Sempre preparada (${e.fonte}).\n\n${x.desc}`, temCargas: false, maxCargas: 0, cargasGastas: [], componentes: { v: !!x.v, s: !!x.s, m: !!x.m },
      concentracao: !!x.conc, ritual: !!x.ritual, preparada: true, _prog: e.chave,
    };
  }
  function sincronizarPoderes() {
    const s = st();
    if (!s || typeof poderes === "undefined") return;
    // apagados na mão continuam apagados
    s.adicionados.forEach((k) => { if (!poderes.some((p) => p._prog === k) && !s.ocultos.includes(k)) s.ocultos.push(k); });
    const lista = s.addPoderes ? esperados() : [];
    const validas = new Set(lista.map((e) => e.chave));
    for (let i = poderes.length - 1; i >= 0; i--) {
      const p = poderes[i];
      if (p._prog && !validas.has(p._prog)) poderes.splice(i, 1);
    }
    s.adicionados = s.adicionados.filter((k) => validas.has(k));
    s.ocultos = s.ocultos.filter((k) => validas.has(k));
    lista.forEach((e) => {
      if (s.ocultos.includes(e.chave)) return;
      let p = poderes.find((x) => x._prog === e.chave);
      const usos = Math.min(30, e.usos || 0);
      if (!p && e.chave.startsWith("m:")) {
        // a magia já está na ficha (escrita à mão)? não duplica
        if (poderes.some((x) => !x._prog && String(x.nome).trim().toLowerCase() === e.nome.trim().toLowerCase())) return;
        poderes.push(poderDeMagia(e));
        s.adicionados.push(e.chave);
        return;
      }
      if (!p) {
        p = {
          id: "pw_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          nome: e.f.nome, circulo: "", acao: e.f.a || "", recarga: e.f.r || "", origem: e.origem, tipo: "", dano: "", alcance: "", duracao: "", tempo: "",
          desc: e.f.d || "", temCargas: usos > 0, maxCargas: usos, cargasGastas: Array(usos).fill(false), componentes: {}, _prog: e.chave, icone: iconeDe(e.f.nome, e.origem),
        };
        poderes.push(p);
        s.adicionados.push(e.chave);
      } else if (p && !p.icone && !p.tipo) p.icone = iconeDe(p.nome, p.origem);
      if (p && usos > 0 && p.maxCargas !== usos) {
        const gastas = Array.isArray(p.cargasGastas) ? p.cargasGastas : [];
        p.temCargas = true;
        p.maxCargas = usos;
        p.cargasGastas = Array.from({ length: usos }, (_, k) => !!gastas[k]);
      }
    });
  }
  function sincronizarEspacos() {
    if (typeof gastosCirculos === "undefined") return;
    const esp = espacos();
    if (!nivelConjurador()) return;
    for (let c = 1; c <= 9; c++) {
      const n = esp[c - 1] || 0;
      const atual = Array.isArray(gastosCirculos[c]) ? gastosCirculos[c] : [];
      gastosCirculos[c] = Array.from({ length: n }, (_, k) => !!atual[k]);
    }
  }
  function conjuradorPrincipal() {
    let melhor = null, nv = 0;
    Object.entries(porClasse()).forEach(([cid, lv]) => {
      const c = CL(cid);
      if (c && c.conj && lv > nv) { melhor = c; nv = lv; }
    });
    return melhor;
  }
  function sincronizar(opts = {}) {
    const s = st();
    if (!s || !ativo()) { renderCard(); return; }
    const cls = $("classe"), niv = $("nivel"), bp = $("bonusProf");
    if (cls) cls.value = textoClasses();
    if (niv) niv.value = total();
    if (bp) bp.value = pb();
    const dtProf = $("dtProf");
    if (dtProf) dtProf.value = pb();
    const cp = conjuradorPrincipal();
    const dtAtr = $("dtAtributo");
    if (cp && dtAtr) dtAtr.value = modDe(cp.atrConj);
    sincronizarEspacos();
    sincronizarPoderes();
    sincronizarExtensao();
    acertarPontosDominio();
    visDominio();
    try { atualizarTudo(); } catch (e) {}
    try { atualizarBadgesSaves(); } catch (e) {}
    try { atualizarDT(); } catch (e) {}
    try { atualizarHP(); } catch (e) {}
    try { renderPoderes(); } catch (e) {}
    if (!opts.semSalvar) try { salvarTudo(); } catch (e) {}
    renderCard();
    if ($("evPainel") && $("evPainel").classList.contains("aberto")) renderPainel();
  }
  window.progSincronizar = sincronizar;

  /* ======================= CARD NA ABA PERSONAGEM ======================= */
  function garantirCard() {
    if ($("evCard")) return $("evCard");
    const topo = document.querySelector("#personagem .personagem-topo");
    if (!topo) return null;
    const card = document.createElement("div");
    card.id = "evCard";
    card.className = "ev-card";
    topo.after(card);
    return card;
  }
  function travarCampos() {
    const on = ativo();
    ["classe", "nivel"].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.readOnly = on;
      el.classList.toggle("ev-travado", on);
      if (!el._evLigado) {
        el._evLigado = true;
        el.addEventListener("click", () => { if (ativo()) abrirEvolucao(); });
      }
    });
  }
  function proximoTexto() {
    const pc = porClasse();
    const ent = Object.entries(pc);
    if (!ent.length || total() >= 20) return "";
    const [cid, lv] = ent[ent.length - 1];
    const c = CL(cid);
    const g = ganhosNoNivel(cid, lv + 1).map((f) => f.nome);
    return c ? `${c.nome} ${lv + 1}: ${g.length ? g.join(", ") : "mais espaços e usos"}` : "";
  }
  function barra() {
    const pc = porClasse(), t = total() || 1;
    return `<div class="ev-barra">${Object.entries(pc).map(([cid, lv], i) => `<i class="cor${i % 4}" style="flex:${lv}" title="${esc(CL(cid)?.nome)} ${lv}"></i>`).join("")}${total() < 20 ? `<i class="vazio" style="flex:${20 - t}"></i>` : ""}</div>`;
  }
  function renderCard() {
    const card = garantirCard();
    if (!card) return;
    travarCampos();
    if (!temDados()) { card.hidden = true; return; }
    card.hidden = false;
    if (!ativo()) {
      const temTexto = (($("classe") || {}).value || "").trim();
      card.innerHTML = `
        <div class="ev-card-topo"><span class="ev-rot">Evolução</span><button type="button" class="ev-card-engr" onclick="evMinhasAbrir('classes')" aria-label="Suas classes e subclasses"><i class="ti ti-settings"></i></button></div>
        <p class="ev-card-txt">${temTexto ? "Ligue sua classe ao sistema de nível: o app mostra o que você ganha a cada nível e preenche os poderes sozinho." : "Escolha a classe e acompanhe o que você ganha a cada nível."}</p>
        <button type="button" class="ev-btn-prim" onclick="abrirEvolucao()"><i class="ti ti-sparkles"></i> ${temTexto ? "Configurar evolução" : "Escolher classe"}</button>`;
      return;
    }
    const prox = proximoTexto();
    card.innerHTML = `
      <div class="ev-card-topo"><span class="ev-rot">Evolução</span><span class="ev-card-nv">Nível <b>${total()}</b> · Proficiência <b>+${pb()}</b></span><button type="button" class="ev-card-engr" onclick="evMinhasAbrir('subs')" aria-label="Suas classes e subclasses"><i class="ti ti-settings"></i></button></div>
      ${barra()}
      <div class="ev-chips">${Object.entries(porClasse()).map(([cid, lv], i) => { const sub = subDe(cid); return `<span class="cor${i % 4}"><b>${esc(CL(cid)?.nome)} ${lv}</b>${sub ? `<small>${esc(sub.nome)}</small>` : ""}</span>`; }).join("")}</div>
      ${prox ? `<p class="ev-prox"><i class="ti ti-arrow-up-right"></i><span><b>Próximo nível</b> · ${esc(prox)}</span></p>` : `<p class="ev-prox"><i class="ti ti-crown"></i><span>Nível máximo alcançado.</span></p>`}
      <div class="ev-card-acoes">
        <button type="button" class="ev-btn-sec" onclick="abrirEvolucao()"><i class="ti ti-timeline"></i> Ver evolução</button>
        ${total() < 20 ? `<button type="button" class="ev-btn-prim" onclick="abrirEvolucao('subir')"><i class="ti ti-arrow-big-up-lines"></i> Subir de nível</button>` : ""}
      </div>`;
  }

  /* ======================= PAINEL ======================= */
  let tela = "visao"; // visao | subir | sub | editorSub | importar
  let fluxo = null; // estado do subir de nível
  let abertos = new Set();

  function garantirPainel() {
    if ($("evPainel")) return;
    const f = document.createElement("div");
    f.id = "evFundo";
    f.className = "ev-fundo";
    f.onclick = fecharEvolucao;
    const p = document.createElement("div");
    p.id = "evPainel";
    p.className = "ev-painel";
    p.setAttribute("role", "dialog");
    p.innerHTML = `<div class="ev-cab"><button type="button" class="ev-voltar" id="evVoltar" onclick="evVoltar()" aria-label="Voltar"><i class="ti ti-chevron-left"></i></button><h3 id="evTitulo">Evolução</h3><button type="button" class="ev-x" onclick="fecharEvolucao()" aria-label="Fechar">✕</button></div><div class="ev-corpo" id="evCorpo"></div><div class="ev-rodape" id="evRodape"></div>`;
    document.body.append(f, p);
  }
  async function carregarMesa() {
    const p = fichaAtual();
    const gid = p && p.grupoAtivo;
    if (!gid || !window.getDoc || !window.doc || !window.db) {
      window._subsMesa = [];
      // ficha sem grupo ativo: procura o grupo em que ela foi vinculada
      if (typeof window.atualizarRegrasDaFicha === "function") window.atualizarRegrasDaFicha().then((mudou) => { if (mudou && $("evPainel") && $("evPainel").classList.contains("aberto")) renderPainel(); });
      return;
    }
    try {
      const snap = await window.getDoc(window.doc(window.db, "grupos", gid));
      if (typeof window.guardarRegrasDaFicha === "function" && window.guardarRegrasDaFicha(p, snap.exists() ? snap.data() : null) && $("evPainel") && $("evPainel").classList.contains("aberto")) renderPainel();
      const lista = snap.exists() ? snap.data().subclassesMesa || [] : [];
      window._subsMesa = Array.isArray(lista) ? lista : [];
      // subclasse da mesa que o mestre editou: atualiza na ficha
      const s = st();
      let mudou = false;
      if (s) Object.entries(s.subs).forEach(([cid, x]) => {
        if (!x || !x.mesaId) return;
        const m = window._subsMesa.find((z) => z.id === x.mesaId);
        if (!m) return;
        const novo = { tipo: "custom", mesaId: m.id, nome: m.nome, d: m.d || "", f: m.f || [], magias: m.magias || {} };
        if (JSON.stringify(novo) !== JSON.stringify({ tipo: "custom", mesaId: x.mesaId, nome: x.nome, d: x.d || "", f: x.f || [], magias: x.magias || {} })) { s.subs[cid] = novo; mudou = true; }
      });
      if (mudou) { sincronizar(); toast("O mestre atualizou uma subclasse da mesa."); }
      else if ($("evPainel") && $("evPainel").classList.contains("aberto") && (tela === "subir" || tela === "trocarSub")) renderPainel();
    } catch (e) { window._subsMesa = window._subsMesa || []; }
  }
  window.abrirEvolucao = function (modo) {
    if (!temDados() || !st()) return;
    carregarMesa();
    garantirPainel();
    tela = "visao";
    if (!ativo()) tela = ((($("classe") || {}).value || "").trim() && (($("nivel") || {}).value || "") > 1) ? "importar" : "subir";
    if (modo === "subir") tela = "subir";
    if (tela === "subir") iniciarFluxo();
    if (tela === "importar") fluxo = { imp: [{ c: "", lv: Math.max(1, Math.min(20, parseInt($("nivel").value) || 1)) }] };
    renderPainel();
    $("evFundo").classList.add("aberto");
    $("evPainel").classList.add("aberto");
    document.body.classList.add("ev-travado-scroll");
    $("evCorpo").scrollTop = 0;
  };
  window.fecharEvolucao = function () {
    if (tela === "antecedente" && fa && fa.doCampo) { fa = null; tela = "visao"; }
    try { campoAnt(); } catch (e) {}
    $("evFundo")?.classList.remove("aberto");
    $("evPainel")?.classList.remove("aberto");
    document.body.classList.remove("ev-travado-scroll");
  };
  window.evVoltar = function () {
    if (tela === "editorSub") { tela = fluxo && fluxo.voltarPara ? fluxo.voltarPara : "visao"; }
    else if (tela === "minhas") { tela = minhasVolta || "visao"; if (tela === "visao" && !ativo()) tela = "subir"; }
    else if (tela === "regrasMesa") { tela = regrasVolta || "visao"; if (tela === "visao" && !ativo()) tela = "subir"; }
    else if (tela === "colar") { tela = colar.volta; ed = colar.edAntes; colar = null; }
    else if (tela === "editorClasse") { tela = ed && (ed.voltarPara === "subir" || ed.voltarPara === "minhas") ? ed.voltarPara : "visao"; ed = null; if (!ativo() && tela === "visao") tela = "subir"; }
    else if (tela === "subir" && fluxo && fluxo.passo > 0) { fluxo.passo = Math.max(0, fluxo.passo - 1); while (fluxo.passo > 0 && !passos()[fluxo.passo]) fluxo.passo--; }
    else if (tela === "dominio" || tela === "dominioUlt") tela = "visao";
    else if (tela === "antColar") { if (antCol.lido) antCol.lido = null; else tela = "antecedente"; }
    else if (tela === "antecedente" && fa && fa.doCampo) return fecharEvolucao();
    else if (!ativo()) return fecharEvolucao();
    else tela = "visao";
    renderPainel();
  };
  function rodape(html) { $("evRodape").innerHTML = html || ""; $("evRodape").hidden = !html; }

  function renderPainel() {
    const corpo = $("evCorpo");
    if (!corpo) return;
    $("evVoltar").style.visibility = tela === "visao" || (!ativo() && tela === "subir" && (!fluxo || !fluxo.passo)) ? "hidden" : "visible";
    if (tela === "subir") return renderSubir();
    if (tela === "saltoFim") return renderSaltoFim();
    if (tela === "editorSub") return renderEditorSub();
    if (tela === "importar") return renderImportar();
    if (tela === "antecedente") return renderAntecedente();
    if (tela === "antColar") return renderAntColar();
    if (tela === "dominio") return renderDominioEscolha();
    if (tela === "dominioUlt") return renderDominioUlt();
    if (tela === "editorClasse") return renderEditorClasse();
    if (tela === "colar") return renderColar();
    if (tela === "minhas") return renderMinhas();
    if (tela === "regrasMesa") { $("evTitulo").textContent = "Regras da mesa"; $("evVoltar").style.visibility = "visible"; $("evCorpo").innerHTML = regrasMesaHTML(); return rodape(""); }
    if (tela === "trocarSub") {
      const c = CL(fluxo.c);
      $("evTitulo").textContent = c.subNome;
      $("evCorpo").innerHTML = escolhaSubHTML(c);
      const ok = fluxo.sub && !(fluxo.sub.tipo === "nome" && !String(fluxo.sub.nome || "").trim());
      return rodape(`<button type="button" class="ev-btn-prim cheio" onclick="evSalvarTroca()" ${ok ? "" : "disabled"}><i class="ti ti-check"></i> Salvar</button>`);
    }
    $("evTitulo").textContent = "Evolução";
    renderVisao();
  }

  /* ---------- visão geral ---------- */
  function linhaDoTempo(cid, lv) {
    const c = CL(cid);
    let html = "";
    for (let n = 1; n <= 20; n++) {
      const g = ganhosNoNivel(cid, n);
      const estado = n <= lv ? "tem" : n === lv + 1 ? "prox" : "futuro";
      const chave = cid + ":" + n;
      const aberto = abertos.has(chave);
      const nomes = g.length ? g.map((f) => `<span class="${f.origem === "subclasse" ? "sub" : ""}${f.vazio ? " vazio" : ""}">${esc(f.nome)}</span>`).join("") : `<span class="nada">Espaços e usos maiores</span>`;
      html += `
        <div class="ev-nv ${estado}${aberto ? " aberto" : ""}" onclick="evAlternar('${chave}')">
          <div class="ev-nv-num">${n}</div>
          <div class="ev-nv-info">
            <div class="ev-nv-nomes">${estado === "prox" ? `<em>Próximo</em>` : ""}${nomes}</div>
            ${aberto ? `<div class="ev-nv-det">${g.map((f) => `<p><b>${esc(f.nome)}</b>${f.a && f.a !== "passiva" ? ` <small>${ACAO_ROT[f.a] || ""}${f.r ? " · " + (REC_ROT[f.r] || "") : ""}</small>` : ""}<br>${esc(f.d)}</p>`).join("") || "<p>Sem habilidade nova: os números da tabela aumentam.</p>"}${tabelaLinha(c, n)}</div>` : ""}
          </div>
        </div>`;
    }
    return html;
  }
  function tabelaLinha(c, n) {
    const l = c.tabela.linhas[n - 1];
    if (!l) return "";
    const extra = c.conj && c.conj !== "pacto" ? (() => {
      const nc = c.conj === "total" ? n : Math.ceil(n / 2);
      const e = PROG_ESPACOS[nc] || [];
      return e.length ? `<span><small>Espaços</small><b>${e.map((v, i) => ROM[i + 1] + ":" + v).join(" ")}</b></span>` : "";
    })() : "";
    return `<div class="ev-tab"><span><small>Proficiência</small><b>+${PROG_PB[n]}</b></span>${c.tabela.cols.map((col, i) => `<span><small>${esc(col)}</small><b>${esc(l[i])}</b></span>`).join("")}${extra}</div>`;
  }
  window.evAlternar = function (k) { abertos.has(k) ? abertos.delete(k) : abertos.add(k); renderPainel(); };

  function renderVisao() {
    const s = st(), pc = porClasse();
    const dvs = {};
    s.niveis.forEach((n) => { const c = CL(n.c); if (c) dvs[c.dv] = (dvs[c.dv] || 0) + 1; });
    const esp = espacos(), pa = pacto(), r = racaAtual();
    let html = `
      <div class="ev-resumo">
        <div><small>Nível</small><b>${total()}</b></div>
        <div><small>Proficiência</small><b>+${pb()}</b></div>
        <div><small>Dados de vida</small><b>${Object.entries(dvs).sort((a, b) => b[0] - a[0]).map(([d, q]) => `${q}d${d}`).join(" + ")}</b></div>
      </div>
      ${barra()}
      ${esp.length || pa ? `<div class="ev-esp"><span class="ev-rot2">Espaços de magia</span>${esp.map((v, i) => `<span><small>${ROM[i + 1]}</small><b>${v}</b></span>`).join("")}${pa ? `<span class="pacto"><small>Pacto ${ROM[pa.circulo]}</small><b>${pa.espacos}</b></span>` : ""}</div>` : ""}`;

    if (dominioPendente()) html += dominioCardHTML();
    if (!s.antecedente) html += antecedenteCardHTML();
    Object.entries(pc).forEach(([cid, lv], i) => {
      const c = CL(cid), sub = subDe(cid);
      html += `
        <section class="ev-classe cor${i % 4}">
          <div class="ev-classe-topo">
            <div><h4>${esc(c.nome)} <span>${lv}</span></h4><p>${esc(c.resumo)}</p></div>
          </div>
          <div class="ev-sub-linha">
            ${sub ? `<span class="ev-sub-nome"><i class="ti ti-git-branch"></i>${esc(sub.nome)}${sub.tipo === "srd" ? "" : ` <small>${sub.tipo === "nome" ? "só o nome" : sub.mesaId ? "da mesa" : "personalizada"}</small>`}</span>
               <button type="button" onclick="evEditarSub('${cid}')">${sub.tipo === "srd" || sub.mesaId ? "Trocar" : "Editar"}</button>`
            : lv >= c.subNiveis[0] ? `<span class="ev-sub-nome falta"><i class="ti ti-alert-circle"></i>Sem ${esc(c.subNome.toLowerCase())}</span><button type="button" onclick="evEditarSub('${cid}')">Escolher</button>`
            : c.subNiveis.length ? `<span class="ev-sub-nome quieto"><i class="ti ti-git-branch"></i>${esc(c.subNome)} no nível ${c.subNiveis[0]}</span>` : `<span class="ev-sub-nome quieto">Sem subclasse</span>`}
            ${c.custom ? `<button type="button" onclick="evClasseEditar('${c.id}')">Editar classe</button>` : ""}
          </div>
          ${sub && sub.tipo === "srd" && sub.id === "terra" ? `<label class="ev-terra"><span>Terra do círculo (troca no descanso longo)</span><select onchange="evTerra('${cid}', this.value)"><option value="">Escolher</option>${Object.entries(TERRAS_IGNEA).map(([k, t]) => `<option value="${k}" ${(st().terra || {})[cid] === k ? "selected" : ""}>${t.nome}</option>`).join("")}</select></label>` : ""}
          <details class="ev-traits"><summary>Proficiências e multiclasse</summary>
            <p><b>Dado de vida</b> d${c.dv} · <b>Resistências</b> ${c.saves.map((k) => ATR_NOME[k]).join(" e ")}</p>
            <p><b>Perícias</b> ${esc(c.pericias)}</p>
            <p><b>Armas</b> ${esc(c.armas)} · <b>Armaduras</b> ${esc(c.armaduras)}${c.ferramentas ? ` · <b>Ferramentas</b> ${esc(c.ferramentas)}` : ""}</p>
            <p><b>Ao entrar como multiclasse</b> ${esc(c.multi)}</p>
          </details>
          <div class="ev-tempo">${linhaDoTempo(cid, lv)}</div>
        </section>`;
    });

    if (s.antecedente) html += antecedenteCardHTML();
    if (!dominioPendente()) html += dominioCardHTML();
    html += `
      <section class="ev-raca">
        <div class="ev-classe-topo"><div><h4>${r ? esc(r.nome) : "Raça"}</h4><p>${r ? esc(r.d) + ` · ${esc(r.tam)} · ${esc(r.desl)}` : "Escolha uma raça do SRD no campo Raça da ficha para ver os traços aqui. Raças personalizadas continuam funcionando como antes."}</p></div></div>
        ${r ? `<div class="ev-traços">${r.t.map((t) => `<p><b>${esc(t.nome)}</b>${t.nivel ? ` <small>a partir do nível ${t.nivel}</small>` : ""}<br>${esc(t.d)}</p>`).join("")}</div>${escolhasRacaHTML(r)}` : ""}
      </section>
      <label class="ev-opcao"><input type="checkbox" ${s.addPoderes ? "checked" : ""} onchange="evAddPoderes(this.checked)"><span>Colocar as habilidades na aba 🔥 automaticamente</span></label>
      ${DOMS().length ? `<label class="ev-opcao"><input type="checkbox" ${dominiosLigados() ? "checked" : ""} ${s.dominio || regra("dominios") ? "disabled" : ""} onchange="evUsaDominio(this.checked)"><span>Usar o sistema de Domínios (Corpo, Mente e Alma)${regra("dominios") ? " · <b>regra da mesa</b>" : ""}<small class="ev-dom-autor">Regra opcional criada por ${esc(window.DOMINIOS_AUTORES || "")}</small></span></label>` : ""}
      <button type="button" class="ev-mais" onclick="evMinhasAbrir('classes')"><i class="ti ti-settings"></i> Suas classes e subclasses criadas</button>
      <p class="ev-credito">Classes e raças com material do SRD 5.2.1 (CC-BY-4.0). Licença completa em Sobre › Créditos.</p>`;
    $("evCorpo").innerHTML = html;
    rodape(`
      <button type="button" class="ev-btn-sec" onclick="evDesfazer()" ${s.niveis.length ? "" : "disabled"}><i class="ti ti-arrow-back-up"></i> Desfazer nível</button>
      ${total() < 20 ? `<button type="button" class="ev-btn-prim" onclick="abrirEvolucao('subir')"><i class="ti ti-arrow-big-up-lines"></i> Subir pro nível ${total() + 1}</button>` : ""}`);
  }
  /* ---------- escolhas da raça (perícia do elfo/humano, talento do humano) ---------- */
  function racaEsc(r) {
    const s = st();
    if (!s.racaEsc || s.racaEsc.raca !== r.id) { desfazerRacaEsc(); s.racaEsc = { raca: r.id, per: [], pod: [], talento: "" }; }
    return s.racaEsc;
  }
  function desfazerRacaEsc() {
    const s = st(), x = s && s.racaEsc;
    if (!x) return;
    (x.per || []).forEach((p) => { delete profs[p]; });
    (x.pod || []).forEach((id) => { const i = poderes.findIndex((p) => p.id === id); if (i >= 0) poderes.splice(i, 1); });
    s.racaEsc = null;
  }
  function escolhasRacaHTML(r) {
    const e = typeof ESCOLHAS_RACA !== "undefined" ? ESCOLHAS_RACA[r.id] : null;
    const o = typeof OPCOES_RACA !== "undefined" ? OPCOES_RACA[r.id] : null;
    if (!e && !o) return "";
    const x = racaEsc(r);
    let h = `<div class="ev-raca-esc">`;
    if (e) {
      const lista = e.de || PERICIAS_IGNEA;
      h += `<span class="ev-rot2">Perícia da raça</span><div class="ev-chips2">${lista.map((p) => { const on = x.per.includes(p); const b = !on && (profs[p] || 0) >= 1; return `<button type="button" class="${on ? "on" : ""}" ${b ? "disabled" : ""} onclick="evRacaPer('${esc(p)}')">${esc(p)}</button>`; }).join("")}</div>`;
    }
    if (o) {
      h += `<span class="ev-rot2">${esc(o.rot)}</span>${o.ops().map((t) => `<button type="button" class="ev-op ${x.talento === t.nome ? "on" : ""}" onclick="evRacaOp('${esc(t.nome)}')"><span class="ev-op-topo"><b>${esc(t.nome)}</b></span><span class="ev-op-txt">${esc(t.d)}</span></button>`).join("")}`;
    }
    return h + `</div>`;
  }
  window.evRacaPer = function (p) {
    const r = racaAtual(); if (!r) return;
    const x = racaEsc(r);
    if (x.per.includes(p)) { x.per = x.per.filter((z) => z !== p); delete profs[p]; }
    else { x.per.forEach((z) => delete profs[z]); x.per = [p]; profs[p] = 1; }
    sincronizar();
  };
  window.evRacaOp = function (nome) {
    const r = racaAtual(); if (!r) return;
    const x = racaEsc(r);
    x.pod.forEach((id) => { const i = poderes.findIndex((p) => p.id === id); if (i >= 0) poderes.splice(i, 1); });
    x.pod = [];
    if (x.talento === nome) { x.talento = ""; return sincronizar(); }
    const t = OPCOES_RACA[r.id].ops().find((z) => z.nome === nome);
    const id = "pw_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    poderes.push({ id, nome: t.nome, circulo: "", acao: "passiva", recarga: "", origem: "talento", tipo: "", dano: "", alcance: "", duracao: "", tempo: "", desc: t.d, temCargas: false, maxCargas: 0, cargasGastas: [], componentes: {}, icone: "⭐" });
    x.pod = [id]; x.talento = nome;
    sincronizar();
  };
  window.evTerra = function (cid, v) { const s = st(); s.terra = s.terra || {}; s.terra[cid] = v; sincronizar(); };
  window.evAddPoderes = function (v) { st().addPoderes = !!v; sincronizar(); };

  /* ======================= SUBIR DE NÍVEL ======================= */
  function iniciarFluxo() { fluxo = { passo: 0, c: ativo() ? Object.keys(porClasse()).slice(-1)[0] : "", pv: null, pvModo: "media", asi: { modo: "2", a: "", b: "" }, talento: "", sub: null, verTodas: !ativo() }; }
  const nivelNovo = () => (porClasse()[fluxo.c] || 0) + 1;
  function passos() {
    // 0 classe · 1 subclasse · 2 pv · 3 atributo · 4 escolhas · 5 confirmar
    const c = CL(fluxo.c);
    const lv = c ? nivelNovo() : 0;
    const asi = c ? c.f.find((f) => f.n === lv && f.asi) : null;
    return [true, c && lv === c.subNiveis[0] && !st().subs[fluxo.c], true, !!asi, !!c && escolhasDoNivel().some((e) => e.n > 0), true];
  }
  function irPara(passo) {
    if (passo === 1 && fluxo.passo === 0) iniciarSalto();
    fluxo.passo = passo;
    const p = passos();
    while (fluxo.passo < 5 && (!p[fluxo.passo] || (fluxo.salto && fluxo.passo === 2))) fluxo.passo++;
    if (fluxo.salto && fluxo.passo === 5) return saltoAplicar();
    renderPainel();
    $("evCorpo").scrollTop = 0;
  }

  /* ---------- subir vários níveis de uma vez: para só onde tem escolha ---------- */
  const tetoNivel = () => { const nm = regraV("nivelMax"); return nm && nm > total() ? Math.min(20, nm) : 20; };
  window.evAlvo = function (v) { fluxo.alvo = Math.max(total() + 1, Math.min(20, parseInt(v, 10) || total() + 1)); if (fluxo.salto) fluxo.salto.alvo = Math.max(fluxo.alvo, total() + 1); renderPainel(); };
  window.evSaltoPv = function (m) { fluxo.saltoPv = m; renderPainel(); };
  function alvoPadrao() {
    const teto = tetoNivel(), de = total() + 1;
    if (!fluxo.c || teto <= de) return 0;
    if (!fluxo.alvo) { const ni = !ativo() ? regraV("nivelInicial") : 0; fluxo.alvo = ni > 1 ? Math.min(teto, ni) : de; }
    return teto;
  }
  function alvoSelect() {
    const teto = alvoPadrao(), de = total() + 1;
    if (!teto) return "";
    const op = []; for (let n = de; n <= teto; n++) op.push(`<option value="${n}" ${n === fluxo.alvo ? "selected" : ""}>${n === de ? `Só o ${n}` : `Até o ${n}`}</option>`);
    return `<label class="ev-alvo" title="Até qual nível subir"><small>Subir</small><select onchange="evAlvo(this.value)">${op.join("")}</select></label>`;
  }
  function alvoHTML() {
    if (!alvoPadrao() || !(fluxo.alvo > total() + 1)) return "";
    const pvR = regraV("pv");
    return `<div class="ev-salto">
      <b><i class="ti ti-stairs-up"></i> Subindo do ${total()} ao ${fluxo.alvo}</b>
      <p>${fluxo.alvo - total()} níveis de ${esc(CL(fluxo.c).nome)} seguidos. Só para quando tiver algo pra escolher (subclasse, atributos, perícias, magias) e no fim mostra tudo o que você ganhou.</p>
      ${pvR || !ativo() && fluxo.alvo === 1 ? "" : `<div class="ev-seg3"><button type="button" class="${fluxo.saltoPv !== "rolar" ? "on" : ""}" onclick="evSaltoPv('media')">Vida pela média</button><button type="button" class="${fluxo.saltoPv === "rolar" ? "on" : ""}" onclick="evSaltoPv('rolar')">Rolar a vida</button></div>`}
    </div>`;
  }
  function iniciarSalto() {
    if (fluxo.salto || !(fluxo.alvo > total() + 1)) { if (!fluxo.salto) fluxo.salto = null; return; }
    fluxo.salto = { alvo: fluxo.alvo, pv: fluxo.saltoPv || "media", log: [], de: total(), vmAntes: ativo() ? get("vidaMax") : 0, pbAntes: pb() };
  }
  function pvAuto() {
    const c = CL(fluxo.c), lv = nivelNovo(), con = modDe("con"), primeiro = !ativo();
    const media = Math.floor(c.dv / 2) + 1;
    const extra = (racaAtual()?.t.some((t) => t.pvNivel) ? 1 : 0) + pvSubExtra(fluxo.c, lv, fluxo.sub);
    const pvR = primeiro ? "" : regraV("pv") || "";
    let base = media;
    if (primeiro || pvR === "max") base = c.dv;
    else if (pvR === "rolar" || pvR === "rolarMin" || (!pvR && fluxo.salto && fluxo.salto.pv === "rolar")) { const r = 1 + Math.floor(Math.random() * c.dv); base = pvR === "rolarMin" ? Math.max(r, media) : r; }
    return Math.max(1, base + con) + extra;
  }
  function saltoAplicar() {
    if (fluxo.pv == null) fluxo.pv = pvAuto();
    const r = resumoNivel();
    fluxo.salto.log.push({ nivel: total() + 1, classe: r.c.nome, lv: r.lv, pv: fluxo.pv, asi: r.asiTxt, sub: r.subTxt, habs: r.habs.map((f) => ({ nome: f.nome, d: f.d, a: f.a, r: f.r, origem: f.origem })), escolhas: r.escolhas.map((x) => ({ rot: x.e.rot, sel: x.sel })) });
    aplicarNivel();
    sincronizar({ semSalvar: true });
    const salto = fluxo.salto, cid = fluxo.c;
    if (total() < salto.alvo) {
      iniciarFluxo();
      fluxo.c = cid; fluxo.salto = salto; fluxo.passo = 0;
      irPara(1);
      return;
    }
    try { salvarTudo(); } catch (e) {}
    const c = CL(cid);
    fluxo = { salto, c: cid };
    tela = "saltoFim";
    abertos = new Set(salto.log.map((x) => `${cid}:${x.lv}`));
    renderPainel();
    $("evCorpo").scrollTop = 0;
    celebrar(c, porClasse()[cid], total());
  }
  function renderSaltoFim() {
    const sl = fluxo.salto, c = CL(fluxo.c);
    $("evTitulo").textContent = "Evolução";
    $("evVoltar").style.visibility = "hidden";
    const pvTot = sl.log.reduce((t, x) => t + x.pv, 0), vm = get("vidaMax"), pbD = pb();
    const asis = sl.log.filter((x) => x.asi);
    const subs = sl.log.filter((x) => x.sub);
    const habsN = sl.log.reduce((t, x) => t + x.habs.length, 0);
    $("evCorpo").innerHTML = `
      <div class="ev-medalha">
        <div class="ev-medalha-anel"><span>${icDe(c)}</span><b>${total()}</b></div>
        <h4>${esc(c.nome)} ${porClasse()[c.id]}</h4>
        <p>${sl.de ? `Nível ${sl.de} → ${total()}` : `Do zero ao nível ${total()}`} · ${sl.log.length} níveis de uma vez</p>
      </div>
      <div class="ev-stats">
        <div><small>Pontos de vida</small><b>${vm}</b><span class="sobe">+${sl.de ? vm - sl.vmAntes : pvTot}</span></div>
        <div><small>Proficiência</small><b>+${pbD}</b>${pbD > sl.pbAntes && sl.de ? `<span class="sobe">▲</span>` : `<span>—</span>`}</div>
        <div><small>Habilidades</small><b>${habsN}</b><span>novas</span></div>
      </div>
      ${subs.map((x) => `<div class="ev-destaque"><span>✦</span><b>${esc(c.subNome || "Subclasse")}: ${esc(x.sub)}</b></div>`).join("")}
      ${asis.map((x) => `<div class="ev-destaque"><span>⬆️</span><b>Nível ${x.nivel}: ${esc(x.asi)}</b></div>`).join("")}
      ${sl.log.map((x) => `
        <h5 class="ev-h">Nível ${x.nivel} <small class="ev-conta">${esc(x.classe)} ${x.lv} · +${x.pv} PV</small></h5>
        ${x.habs.length ? `<div class="ev-habs">${x.habs.map((f) => `
          <div class="ev-hab ${f.origem === "subclasse" ? "sub" : ""}">
            <span class="ev-hab-ic">${iconeDe(f.nome, f.origem)}</span>
            <div>
              <b>${esc(f.nome)}</b>
              <div class="ev-tags">${f.origem === "subclasse" ? `<i class="sub">${esc(c.subNome)}</i>` : ""}${f.a && f.a !== "passiva" ? `<i>${ACAO_ROT[f.a]}</i>` : f.a === "passiva" ? `<i>Passiva</i>` : ""}${f.r ? `<i>${REC_ROT[f.r]}</i>` : ""}</div>
              <p>${esc(f.d)}</p>
            </div>
          </div>`).join("")}</div>` : `<p class="ev-p quieto">Sem habilidade nova: os números da classe aumentam.</p>`}
        ${x.escolhas.length ? `<div class="ev-escolhidas">${x.escolhas.map((e) => `<div><small>${esc(e.rot)}</small><div class="ev-chips2 fixo">${e.sel.map((v) => `<span>${esc(v)}</span>`).join("")}</div></div>`).join("")}</div>` : ""}`).join("")}
      ${dominioPendente() ? (st().dominio ? `<button type="button" class="ev-destaque ev-dom-chama" onclick="evDomUlt()"><span>🜂</span><b>Agora escolha a habilidade de Domínio do nível 12</b></button>` : `<button type="button" class="ev-destaque ev-dom-chama" onclick="evDomAbrir()"><span>🜂</span><b>Agora escolha o seu Domínio (Corpo, Mente ou Alma)</b></button>`) : ""}
      <p class="ev-p quieto">Tudo já está na ficha: vida, atributos, perícias e os poderes na aba 🔥. Se algo ficou errado, "Desfazer" na visão geral volta um nível por vez.</p>`;
    rodape(`<button type="button" class="ev-btn-prim cheio" onclick="evSaltoOk()"><i class="ti ti-check"></i> Pronto</button>`);
  }
  window.evSaltoOk = function () { tela = "visao"; fluxo = null; renderPainel(); $("evCorpo").scrollTop = 0; };

  /* ---------- escolhas do nível: perícias, especialização, idiomas e opções ---------- */
  function subIdFluxo() {
    const sub = (fluxo && fluxo.sub) || st().subs[fluxo.c];
    return sub && sub.tipo === "srd" ? CL(fluxo.c).sub.id : null;
  }
  function escolhasDoNivel() {
    const c = CL(fluxo.c), lv = nivelNovo(), out = [];
    if (!c || typeof ESCOLHAS_IGNEA === "undefined") return out;
    const res = (de) => (de === "classe" ? c.per.de : de || null);
    const rot = (e) => (e.t === "pericia" ? `Escolha ${e.n} perícia${e.n > 1 ? "s" : ""}` : e.t === "espec" ? `Especialização: escolha ${e.n} perícia${e.n > 1 ? "s" : ""} pra dobrar a proficiência` : `Escolha ${e.n} idioma${e.n > 1 ? "s" : ""}`);
    if (!ativo()) out.push({ t: "pericia", n: c.per.n, de: c.per.de, rot: `Perícias de ${c.nome}` });
    const talentoExtra = (n, rot) => {
      if (typeof TALENTOS_IGNEA === "undefined") return;
      const ordem = { Origem: 0, Geral: 1, "Estilo de Luta": 2 };
      out.push({ t: "opcao", n, outro: true, origem: "talento", rot, ops: TALENTOS_IGNEA.filter((t) => t.tipo !== "Dádiva Épica").sort((a, b) => (ordem[a.tipo] ?? 9) - (ordem[b.tipo] ?? 9)).map((t) => ({ nome: t.nome, d: t.d, a: "passiva", r: "", tipo: t.tipo })) });
    };
    if (!ativo() && regraV("talento1") > 0) {
      const nt = regraV("talento1");
      talentoExtra(nt, nt > 1 ? `${nt} talentos extras (regra da mesa)` : "Talento extra (regra da mesa)");
    }
    // "talento a cada 4 níveis" / "talento extra nos níveis 2, 5 e 8": conta o nível do personagem
    const nivelPers = total() + 1;
    const cada = regraV("talentoCada"), lista = regraV("talentoNiveis") || [];
    if ((cada > 0 && nivelPers > 1 && nivelPers % cada === 0) || lista.includes(nivelPers)) talentoExtra(1, `Talento extra do nível ${nivelPers} (regra da mesa)`);
    else if (!porClasse()[c.id] && MULTI_PERICIA[c.id]) { const m = MULTI_PERICIA[c.id]; out.push({ t: "pericia", n: m.n, de: res(m.de), rot: `Perícia de multiclasse (${c.nome})` }); }
    const sid = subIdFluxo();
    [`${c.id}:${lv}`, sid ? `sub:${sid}:${lv}` : ""].forEach((k) => {
      if (!k) return;
      (ESCOLHAS_IGNEA[k] || []).forEach((e) => out.push({ ...e, de: res(e.de), rot: rot(e) }));
      const o = OPCOES_IGNEA[k];
      if (o) out.push({ t: "opcao", n: o.n || 1, ops: o.ops(), rot: o.rot, origem: k.startsWith("sub:") ? "subclasse" : "classe" });
    });
    // opções que vieram do texto colado (estilos de luta, manobras, invocações…)
    const sb = (fluxo && fluxo.sub) || st().subs[c.id];
    const subF = sb && sb.tipo === "custom" ? sb.f || [] : [];
    escolhasDeHabilidades(c, lv, c.f || [], "classe").concat(escolhasDeHabilidades(c, lv, subF, "subclasse")).forEach((e) => out.push(e));
    escolhasMagia(c, lv).forEach((e) => out.push(e));
    return out;
  }
  function escolhasDeHabilidades(c, lv, fs, origem) {
    const out = [];
    fs.forEach((f) => {
      const e = f.esc;
      if (!e || !e.ops || !e.ops.length) return;
      let n = 0;
      if (e.col) { const k = ((c.tabela && c.tabela.cols) || []).indexOf(e.col); if (k >= 0) n = valTab(c, lv, k) - valTab(c, lv - 1, k); }
      else if (Number(f.n) === lv) n = e.n || 1;
      else if (e.mais && e.mais[lv]) n = e.mais[lv];
      if (n > 0) out.push({ t: "opcao", n, ops: e.ops.map((o) => ({ nome: o.nome, d: o.d, a: o.a || "passiva", r: o.r || "" })), rot: `${e.titulo || f.nome}: escolha ${n}`, origem });
    });
    return out;
  }
  /* ---------- magias e "conhecidas" que a tabela da classe manda escolher ---------- */
  function colsMagia(c) {
    const cols = (c.tabela && c.tabela.cols) || [];
    return {
      t: cols.findIndex((x) => /^truques/i.test(x)),
      m: cols.findIndex((x) => /preparad|^magias|conhecidas$/i.test(x) && !/truque|invoca/i.test(x)),
      circ: cols.findIndex((x) => /^c[ií]rculo/i.test(x)),
      extras: cols.map((x, i) => ({ x, i })).filter((o) => /invoca|manobra|conhecid/i.test(o.x) && !/truque|^magias|preparad/i.test(o.x)),
    };
  }
  const valTab = (c, lv, i) => (i >= 0 && lv >= 1 ? Number((c.tabela.linhas[lv - 1] || [])[i]) || 0 : 0);
  function circuloMaxDe(c, lv) {
    if (c.conj === "total") return Math.min(9, Math.ceil(lv / 2));
    if (c.conj === "meio") return Math.min(5, Math.ceil(lv / 4));
    if (c.conj === "pacto") {
      const k = colsMagia(c).circ;
      if (k >= 0) return valTab(c, lv, k) || 1;
      const b = CL("bruxo");
      return b ? Number((b.tabela.linhas[lv - 1] || [])[4]) || 1 : Math.min(5, Math.ceil(lv / 2));
    }
    return 0;
  }
  function listaMagiaDe(c) {
    if (typeof CATALOGO_MAGIAS === "undefined") return null;
    const nomes = new Set(CATALOGO_MAGIAS.flatMap((m) => m.cls || []));
    if (nomes.has(c.nome)) return c.nome;
    const igual = [...nomes].find((n) => n.toLowerCase() === String(c.nome).toLowerCase().replace(/^(o|a)\s+/, ""));
    return igual || null;
  }
  function escolhasMagia(c, lv) {
    const out = [], k = colsMagia(c), lista = listaMagiaDe(c);
    const nt = valTab(c, lv, k.t) - valTab(c, lv - 1, k.t);
    if (nt > 0) out.push({ t: "magia", truque: true, n: nt, max: 0, lista, rot: `Truque${nt > 1 ? "s" : ""} novo${nt > 1 ? "s" : ""}` });
    if (c.conj) {
      const max = circuloMaxDe(c, lv);
      const nm = valTab(c, lv, k.m) - valTab(c, lv - 1, k.m);
      if (k.m >= 0 && nm > 0) out.push({ t: "magia", n: nm, max, lista, rot: `Magia${nm > 1 ? "s" : ""} nova${nm > 1 ? "s" : ""} (até ${max}º círculo)` });
      else if (k.m < 0) {
        // sem coluna na tabela: usa o que o texto da classe diz ("grimório com seis magias", "duas por nível")
        const rg = c.magRegra || {};
        const nota = [rg.nota, rg.preparo ? `Você prepara por dia ${ATR_NOME[rg.preparo.atr]} + ${rg.preparo.meio ? "metade do " : ""}nível de ${c.nome}: ${Math.max(1, Math.floor((atrVal(rg.preparo.atr) - 10) / 2) + (rg.preparo.meio ? Math.floor(lv / 2) : lv))} magias.` : ""].filter(Boolean).join(" ");
        if (lv === 1 && rg.inicial) out.push({ t: "magia", n: rg.inicial, max, lista, nota, rot: `Magias iniciais (até ${max}º círculo)` });
        else if (lv > 1 && rg.porNivel) out.push({ t: "magia", n: rg.porNivel, max, lista, nota, rot: `Magia${rg.porNivel > 1 ? "s" : ""} nova${rg.porNivel > 1 ? "s" : ""} (até ${max}º círculo)` });
        else if (lv === 1 || max > circuloMaxDe(c, lv - 1)) out.push({ t: "magia", n: 12, opcional: true, max, lista, nota, rot: `Magias que você conhece ou prepara (até ${max}º círculo)` });
      }
    }
    k.extras.filter((o) => !(c.f || []).some((f) => f.esc && f.esc.col === o.x)).forEach((o) => {
      const n = valTab(c, lv, o.i) - valTab(c, lv - 1, o.i);
      if (n > 0) out.push({ t: "livre", n, nome: o.x, rot: `${o.x}: ${n} nova${n > 1 ? "s" : ""}` });
    });
    return out;
  }
  function magiasPara(e) {
    if (typeof CATALOGO_MAGIAS === "undefined") return [];
    return CATALOGO_MAGIAS.filter((m) => (e.truque ? m.c === 0 : m.c >= 1 && m.c <= e.max) && (!e.lista || (m.cls || []).includes(e.lista)))
      .sort((a, b) => a.c - b.c || a.nome.localeCompare(b.nome));
  }
  const jaTemPoder = (nome) => typeof poderes !== "undefined" && poderes.some((p) => String(p.nome).toLowerCase() === String(nome).toLowerCase());
  const js = (v) => esc(v).replace(/'/g, "\\'");
  const curtoTempo = (t) => String(t || "").replace(/^1 ação bônus$/i, "Ação bônus").replace(/^1 ação$/i, "Ação").replace(/^1 reação.*$/i, "Reação");
  function cartaoMagia(m, i, on, ja, truque) {
    const meta = [curtoTempo(m.tempo), m.alcance, m.conc ? "Concentração" : "", m.ritual ? "Ritual" : ""].filter(Boolean).join(" · ");
    const resumo = String(m.desc || "").replace(/\s+/g, " ").trim();
    return `<button type="button" class="ev-mag-card ${on ? "on" : ""}" ${ja ? "disabled" : ""} data-b="${esc((m.nome + " " + (m.esc || "")).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase())}" onclick="evEsc(${i}, '${js(m.nome)}')">
      <span class="ev-mag-topo"><i class="ev-mag-check">${on ? "✓" : ""}</i><b>${esc(m.nome)}</b><small>${truque ? "Truque" : `${m.c}º`}${m.esc ? " · " + esc(m.esc) : ""}</small></span>
      ${meta ? `<span class="ev-mag-meta">${esc(meta)}</span>` : ""}
      <span class="ev-mag-txt">${esc(resumo.length > 150 ? resumo.slice(0, 150).replace(/\s\S*$/, "") + "…" : resumo)}</span>
      ${ja ? `<span class="ev-mag-ja">já tem</span>` : ""}
    </button>`;
  }
  function opcoesMagia(e, i, sel) {
    const novas = fluxo.escNovas || {};
    const lista = magiasPara(e);
    const fora = sel.filter((n) => !lista.some((m) => m.nome === n));
    const aberto = (fluxo.novaAberta || {})[i];
    return `
      ${e.nota ? `<p class="ev-regra"><i class="ti ti-book-2"></i><span>${esc(e.nota)}</span></p>` : ""}
      ${fora.length ? `<div class="ev-chips2">${fora.map((n) => `<button type="button" class="on" onclick="evEsc(${i}, '${js(n)}')">${novas[n] !== undefined ? "✍️ " : ""}${esc(n)} ✕</button>`).join("")}</div>` : ""}
      ${fora.filter((n) => novas[n] !== undefined).map((n) => `<p class="ev-aviso-mag"><i class="ti ti-info-circle"></i><span><b>${esc(n)}</b> ainda não está no app. Ela entra na aba Magias ${e.truque ? "como truque" : `no ${novas[n]}º círculo`}, em branco, pra você preencher os detalhes, igual criar um poder.</span></p>`).join("")}
      ${lista.length > 6 ? `<input class="ev-mag-busca" placeholder="Buscar ${e.truque ? "truque" : "magia"} pelo nome ou escola…" oninput="evMagBusca(${i}, this.value)">` : ""}
      <div class="ev-mag-cards" id="evMagL${i}">${lista.map((m) => { const on = sel.includes(m.nome), ja = !on && jaTemPoder(m.nome); return cartaoMagia(m, i, on, ja, e.truque); }).join("")}</div>
      <p class="ev-p quieto">${e.lista ? `Lista de magias de ${esc(e.lista)}${e.truque ? "" : `, até o ${e.max}º círculo`}.` : `Essa classe não tem lista no app, então aparecem todas ${e.truque ? "os truques" : `as magias até o ${e.max}º círculo`}.`}</p>
      ${aberto ? `<div class="ev-mag-nova-box">
          <b>✍️ Magia que não está no app</b>
          <p>Escreva o nome. Ela entra na aba Magias em branco pra você preencher o que ela faz, igual criar um poder.</p>
          <div class="ev-mag-nova">
            <input id="evMagN${i}" placeholder="Nome da magia" onkeydown="if(event.key==='Enter'){event.preventDefault();evMagNova(${i})}">
            ${e.truque ? "" : `<select id="evMagC${i}">${Array.from({ length: Math.max(1, e.max) }, (_, k) => `<option value="${k + 1}" ${k + 1 === Math.max(1, e.max) ? "selected" : ""}>${k + 1}º</option>`).join("")}</select>`}
            <button type="button" onclick="evMagNova(${i})">Adicionar</button>
          </div>
        </div>` : `<button type="button" class="ev-mais ev-mag-abrir" onclick="evMagAbrirNova(${i})"><i class="ti ti-pencil-plus"></i> Não achou? Adicionar ${e.truque ? "truque" : "magia"} que não está no app</button>`}`;
  }
  window.evMagAbrirNova = function (i) {
    fluxo.novaAberta = fluxo.novaAberta || {};
    fluxo.novaAberta[i] = true;
    const y = $("evCorpo").scrollTop;
    renderPainel();
    $("evCorpo").scrollTop = y;
    const inp = $("evMagN" + i);
    if (inp) inp.focus();
  };
  function opcoesLivre(e, i, sel) {
    return `
      ${sel.length ? `<div class="ev-chips2">${sel.map((n) => `<button type="button" class="on" onclick="evEsc(${i}, '${js(n)}')">${esc(n)} ✕</button>`).join("")}</div>` : ""}
      <p class="ev-aviso-mag"><i class="ti ti-info-circle"></i><span>${esc(e.nome)} ainda não estão no app. Escreva o nome das que escolheu: cada uma entra na aba 🔥 como poder em branco pra você preencher.</span></p>
      <div class="ev-mag-nova">
        <input id="evMagN${i}" placeholder="Nome" onkeydown="if(event.key==='Enter'){event.preventDefault();evMagNova(${i})}">
        <button type="button" onclick="evMagNova(${i})">Adicionar</button>
      </div>`;
  }
  window.evMagBusca = function (i, v) {
    const t = String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    document.querySelectorAll(`#evMagL${i} button`).forEach((b) => { b.hidden = !!t && !b.dataset.b.includes(t); });
  };
  window.evMagNova = function (i) {
    const e = escolhasDoNivel()[i], inp = $("evMagN" + i);
    let nome = String((inp && inp.value) || "").trim();
    if (!e || !nome) return;
    fluxo.esc = fluxo.esc || {};
    const sel = fluxo.esc[i] = fluxo.esc[i] || [];
    if (sel.length >= e.n) { toast(`Já escolheu ${e.n}. Tire uma pra trocar.`); return; }
    if (e.t === "magia") {
      const cat = catMagia(nome);
      if (cat) nome = cat.nome;
      else { fluxo.escNovas = fluxo.escNovas || {}; fluxo.escNovas[nome] = e.truque ? 0 : Number(($("evMagC" + i) || {}).value) || 1; }
    }
    if (!sel.includes(nome)) sel.push(nome);
    const y = $("evCorpo").scrollTop;
    renderPainel();
    $("evCorpo").scrollTop = y;
  };
  const idiomasTexto = () => (($("idiomas") || {}).value || "");
  const temIdioma = (x) => idiomasTexto().toLowerCase().includes(x.toLowerCase());
  function opcoesEscolha(e, i, todas) {
    const sel = (fluxo.esc || {})[i] || [];
    const outros = (t) => todas.flatMap((x, j) => (j !== i && x.t === t ? (fluxo.esc || {})[j] || [] : []));
    if (e.t === "magia") return opcoesMagia(e, i, sel);
    if (e.t === "livre") return opcoesLivre(e, i, sel);
    if (e.t === "opcao") {
      const itens = e.ops.map((o) => {
        const ja = typeof poderes !== "undefined" && poderes.some((p) => p.nome === o.nome);
        const on = sel.includes(o.nome);
        const pr = String(o.d || "").match(/Pré-requisito:\s*(\d+)\s*[°º]?\s*nível/i);
        const falta = pr && Number(pr[1]) > nivelNovo();
        return `<button type="button" class="ev-op ${on ? "on" : ""} ${falta ? "ev-op-pre" : ""}" ${ja && !on ? "disabled" : ""} data-b=""${esc((o.nome + " " + o.d).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())}" onclick="evEsc(${i}, '${esc(o.nome).replace(/'/g, "\\'")}')"><span class="ev-op-topo"><b>${esc(o.nome)}</b>${ja ? "<small>já tem</small>" : on ? "<small>✓</small>" : falta ? `<small class="pre">⚠ nível ${pr[1]}</small>` : ""}</span><span class="ev-op-txt">${esc(o.d)}</span></button>`;
      }).join("");
      const outro = e.outro ? (() => { const v = sel.find((n) => !e.ops.some((o) => o.nome === n)) || ""; return `<label class="ev-campo-livre"><span>Outro talento (escreva)</span><input value="${esc(v)}" placeholder="Nome do talento" onchange="evEscOutro(${i}, this.value)"></label>`; })() : "";
      return (e.ops.length > 8 ? `<input class="ev-mag-busca" placeholder="Buscar entre ${e.ops.length} opções…" oninput="evMagBusca(${i}, this.value)"><div class="ev-ops-lista" id="evMagL${i}">${itens}</div>` : itens) + outro;
    }
    let lista, bloqueio;
    if (e.t === "pericia") {
      lista = e.de || PERICIAS_IGNEA;
      bloqueio = (x) => (profs[x] || 0) >= 1 || outros("pericia").includes(x);
    } else if (e.t === "espec") {
      const novas = outros("pericia");
      lista = (e.de || PERICIAS_IGNEA).filter((x) => (profs[x] || 0) >= 1 || novas.includes(x));
      bloqueio = (x) => profs[x] === 2 || outros("espec").includes(x);
    } else {
      lista = IDIOMAS_IGNEA.comuns.concat(IDIOMAS_IGNEA.raros);
      bloqueio = (x) => temIdioma(x) || (e.fixo || []).includes(x) || outros("idioma").includes(x);
    }
    if (!lista.length) return `<p class="ev-p quieto">Você ainda não tem perícias treinadas pra especializar. Marque-as na aba de atributos.</p>`;
    return `<div class="ev-chips2">${lista.map((x) => { const on = sel.includes(x), b = !on && bloqueio(x); return `<button type="button" class="${on ? "on" : ""}" ${b ? "disabled" : ""} onclick="evEsc(${i}, '${esc(x)}')">${esc(x)}</button>`; }).join("")}</div>`;
  }
  window.evEsc = function (i, v) {
    const todas = escolhasDoNivel(), e = todas[i];
    fluxo.esc = fluxo.esc || {};
    const sel = fluxo.esc[i] = fluxo.esc[i] || [];
    const k = sel.indexOf(v);
    if (k >= 0) sel.splice(k, 1);
    else if (sel.length < e.n) sel.push(v);
    else if (e.n === 1) sel.splice(0, 1, v);
    const y = $("evCorpo").scrollTop;
    renderPainel();
    $("evCorpo").scrollTop = y;
  };
  window.evEscOutro = function (i, v) {
    fluxo.esc = fluxo.esc || {};
    v = String(v || "").trim();
    fluxo.esc[i] = v ? [v] : [];
    const y = $("evCorpo").scrollTop;
    renderPainel();
    $("evCorpo").scrollTop = y;
  };
  function aplicarEscolhas(todas) {
    const reg = { per: [], espec: [], idi: [], pod: [] };
    todas.forEach((e, i) => {
      const sel = (fluxo.esc || {})[i] || [];
      if (e.t === "pericia") sel.forEach((x) => { if (!((profs[x] || 0) >= 1)) { profs[x] = 1; reg.per.push(x); } });
      else if (e.t === "espec") sel.forEach((x) => { reg.espec.push({ n: x, antes: profs[x] || 0 }); profs[x] = 2; });
      else if (e.t === "idioma") (e.fixo || []).concat(sel).forEach((x) => { if (addIdioma(x)) reg.idi.push(x); });
      else if (e.t === "magia" || e.t === "livre") sel.forEach((nome) => {
        if (typeof poderes === "undefined") return;
        const id = "pw_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const x = e.t === "magia" ? catMagia(nome) : null;
        if (x) poderes.push({ id, nome: x.nome, circulo: String(x.c), acao: x.acao || "", recarga: "", origem: "classe", tipo: x.tipo || "", dano: x.dano || "", alcance: x.alcance || "", duracao: x.duracao || "", tempo: x.tempo || "", desc: x.desc, temCargas: false, maxCargas: 0, cargasGastas: [], componentes: { v: !!x.v, s: !!x.s, m: !!x.m }, concentracao: !!x.conc, ritual: !!x.ritual });
        else if (e.t === "magia") poderes.push({ id, nome, circulo: String((fluxo.escNovas || {})[nome] ?? (e.truque ? 0 : 1)), acao: "", recarga: "", origem: "classe", tipo: "", dano: "", alcance: "", duracao: "", tempo: "", desc: "", temCargas: false, maxCargas: 0, cargasGastas: [], componentes: {} });
        else poderes.push({ id, nome, circulo: "", acao: "passiva", recarga: "", origem: "classe", tipo: "", dano: "", alcance: "", duracao: "", tempo: "", desc: "", temCargas: false, maxCargas: 0, cargasGastas: [], componentes: {}, icone: iconeDe(nome, "classe") });
        reg.pod.push(id);
      });
      else if (e.t === "opcao") sel.forEach((nome) => {
        const o = e.ops.find((z) => z.nome === nome) || (e.outro ? { nome, d: "Talento escolhido pela regra da mesa.", a: "passiva", r: "" } : null);
        if (!o || typeof poderes === "undefined") return;
        const id = "pw_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        poderes.push({ id, nome: o.nome, circulo: "", acao: o.a || "passiva", recarga: o.r || "", origem: e.origem, tipo: "", dano: "", alcance: "", duracao: "", tempo: "", desc: o.d, temCargas: false, maxCargas: 0, cargasGastas: [], componentes: {}, icone: iconeDe(o.nome, e.origem) });
        reg.pod.push(id);
      });
    });
    return reg.per.length || reg.espec.length || reg.idi.length || reg.pod.length ? reg : null;
  }
  function addIdioma(x) {
    const el = $("idiomas");
    if (!el || temIdioma(x)) return false;
    const v = el.value.trim();
    el.value = v ? v + ", " + x : x;
    return true;
  }
  function tirarIdioma(x) {
    const el = $("idiomas");
    if (!el) return;
    el.value = el.value.split(/\s*,\s*/).filter((t) => t.trim().toLowerCase() !== x.toLowerCase()).join(", ");
  }
  function desfazerEscolhas(reg) {
    if (!reg) return;
    (reg.per || []).forEach((x) => { delete profs[x]; });
    (reg.espec || []).forEach((x) => { if (x.antes) profs[x.n] = x.antes; else delete profs[x.n]; });
    (reg.idi || []).forEach(tirarIdioma);
    (reg.pod || []).forEach((id) => { const i = poderes.findIndex((p) => p.id === id); if (i >= 0) poderes.splice(i, 1); });
  }
  window.evProximo = function () { irPara(fluxo.passo + 1); };

  function cartaoClasse(c, atualLv, i) {
    const lv = atualLv + 1;
    const g = ganhosNoNivel(c.id, lv);
    const aviso = avisoMulticlasse(c);
    return `
      <button type="button" class="ev-op ${fluxo.c === c.id ? "on" : ""} ${atualLv ? "cor" + (i % 4) : ""}" onclick="evEscolherClasse('${c.id}')">
        <span class="ev-op-topo"><b><i class="ev-cl-ic">${icDe(c)}</i>${esc(c.nome)}</b><small>${atualLv ? `${atualLv} → ${lv}` : `d${c.dv} · ${c.prim.map((k) => ATR_NOME[k]).join(c.primOu ? " ou " : " e ")}`}</small></span>
        <span class="ev-op-txt">${atualLv ? g.map((f) => esc(f.nome)).join(" · ") || "Os números da tabela aumentam" : esc(c.resumo)}</span>
        ${aviso ? `<span class="ev-aviso"><i class="ti ti-alert-triangle"></i>${esc(aviso)}</span>` : ""}
      </button>`;
  }
  function avisoMulticlasse(c) {
    const fora = (regraV("classesFora") || []).includes(c.id) || (c.custom && regra("semCustom"));
    if (fora) return "O mestre deixou essa classe fora da mesa. Dá pra escolher mesmo assim se ele liberar.";
    if (ativo() && !porClasse()[c.id] && regraV("multiclasse") === false) return "A mesa não usa multiclasse. Dá pra pegar mesmo assim se o mestre liberar.";
    if (!ativo() || porClasse()[c.id]) return "";
    const falta = [];
    const checa = (cl) => {
      const ok = cl.primOu ? cl.prim.some((k) => atrVal(k) >= 13) : cl.prim.every((k) => atrVal(k) >= 13);
      if (!ok) falta.push(`${cl.prim.map((k) => ATR_NOME[k]).join(cl.primOu ? " ou " : " e ")} 13 (${cl.nome})`);
    };
    checa(c);
    Object.keys(porClasse()).forEach((cid) => checa(CL(cid)));
    return falta.length ? `A regra de multiclasse pede ${falta.join(" e ")}. Dá pra pegar mesmo assim se o mestre liberar.` : "";
  }
  window.evEscolherClasse = function (id) {
    if (fluxo.c !== id) { fluxo.sub = null; fluxo.pv = null; }
    fluxo.c = id;
    renderPainel();
  };
  window.evVerTodas = function () { fluxo.verTodas = !fluxo.verTodas; renderPainel(); };

  function renderSubir() {
    const p = fluxo.passo, ini = !ativo();
    const titulo = ini ? "Nível 1" : `Nível ${total() + 1}`;
    $("evTitulo").textContent = titulo;
    const pas = passos();
    const etapas = ["Classe", "Subclasse", "Vida", "Atributos", "Escolhas", "Confirmar"].map((n, i) => (pas[i] ? `<span class="${i === p ? "on" : i < p ? "feito" : ""}">${n}</span>` : "")).join("");
    let html = `<div class="ev-etapas">${etapas}</div>`;
    if (p > 0 && CL(fluxo.c)) {
      const c0 = CL(fluxo.c), lv0 = nivelNovo();
      html += `<div class="ev-heroi"><span class="ev-heroi-ic">${icDe(c0)}</span><div><b>${esc(c0.nome)} ${lv0}</b><small>Nível ${total()} → <em>${total() + 1}</em>${fluxo.salto ? ` · indo até o ${fluxo.salto.alvo}` : ""}</small></div></div>`;
      if (fluxo.salto && fluxo.salto.log.length) html += `<p class="ev-salto-feito"><i class="ti ti-check"></i> Já subiu: ${fluxo.salto.log.map((x) => x.nivel).join(", ")}</p>`;
    }

    if (p === 0) {
      const pc = porClasse();
      if (!ini) {
        html += linkRegrasHTML();
        const nm = regraV("nivelMax");
        if (nm && total() >= nm) html += `<p class="ev-mesa-aviso"><i class="ti ti-alert-triangle"></i>A mesa vai até o <b>nível ${nm}</b>. Só suba se o mestre liberar.</p>`;
        html += `<h5 class="ev-h">Continuar numa classe</h5>`;
        html += Object.entries(pc).map(([cid, lv], i) => cartaoClasse(CL(cid), lv, i)).join("");
        html += `<button type="button" class="ev-mais" onclick="evVerTodas()"><i class="ti ti-${fluxo.verTodas ? "minus" : "plus"}"></i> ${fluxo.verTodas ? "Esconder outras classes" : "Pegar uma nova classe (multiclasse)"}</button>`;
      } else {
        html += linkRegrasHTML();
        const ni = regraV("nivelInicial");
        if (ni > 1) html += `<p class="ev-mesa-aviso"><i class="ti ti-flag"></i>A mesa começa no <b>nível ${ni}</b>: depois de confirmar o 1º nível, continue subindo até o ${ni}.</p>`;
        html += `<h5 class="ev-h">Escolha sua classe</h5>`;
      }
      if (fluxo.verTodas) {
        const minhas = todasClasses().filter((c) => c.custom && !pc[c.id]);
        const doJogo = CLASSES_IGNEA.filter((c) => !pc[c.id]);
        if (!fluxo.abaCl) fluxo.abaCl = fluxo.c && CL(fluxo.c) && CL(fluxo.c).custom ? "minhas" : "jogo";
        const aba = fluxo.abaCl;
        html += `<div class="ev-abas-cl">
          <button type="button" class="${aba === "jogo" ? "on" : ""}" onclick="evAbaCl('jogo')">Classes do jogo<em>${doJogo.length}</em></button>
          <button type="button" class="suas ${aba === "minhas" ? "on" : ""} ${minhas.length && aba !== "minhas" ? "chama" : ""}" onclick="evAbaCl('minhas')">✍️ Suas classes<em>${minhas.length || "+"}</em></button>
        </div>`;
        if (aba === "jogo") {
          html += `<div class="ev-grade">${doJogo.map((c) => cartaoClasse(c, 0, 0)).join("")}</div>`;
          html += `<button type="button" class="ev-mais ev-ir-suas" onclick="evAbaCl('minhas')"><i class="ti ti-pencil-plus"></i> ${minhas.length ? `Ver suas ${minhas.length} classe${minhas.length > 1 ? "s" : ""} criada${minhas.length > 1 ? "s" : ""}` : "Criar ou colar uma classe sua"}</button>`;
        } else html += `<section class="ev-criacoes">
          <div class="ev-criacoes-topo"><h5>✍️ Suas classes</h5><button type="button" class="ev-engr" onclick="evMinhasAbrir('classes')"><i class="ti ti-settings"></i> Gerenciar</button></div>
          ${minhas.length ? minhas.map((c) => cartaoClasse(c, 0, 0)).join("") : `<p class="ev-p quieto">Nenhuma ainda. Crie do zero, cole um texto ou importe por código.</p>`}
          <div class="ev-tres">
            <button type="button" onclick="evClasseNova()"><i class="ti ti-pencil-plus"></i><span>Criar do zero</span></button>
            ${typeof window.lerTextoColado === "function" ? `<button type="button" onclick="evColarAbrir('classe','')"><i class="ti ti-clipboard-text"></i><span>Colar texto</span></button>` : ""}
            <button type="button" onclick="evClasseImportar()"><i class="ti ti-download"></i><span>Por código</span></button>
          </div>
        </section>`;
      }
      const ah = alvoHTML();
      if (ah) html = html.replace(/<div class="ev-etapas">[\s\S]*?<\/div>/, (m) => m + ah);
      $("evCorpo").innerHTML = html;
      const sel = alvoSelect();
      rodape(`${sel}<button type="button" class="ev-btn-prim${sel ? "" : " cheio"}" onclick="evProximo()" ${fluxo.c ? "" : "disabled"}>Continuar <i class="ti ti-arrow-right"></i></button>`);
      return;
    }
    const c = CL(fluxo.c), lv = nivelNovo();
    if (p === 1) {
      html += escolhaSubHTML(c);
      $("evCorpo").innerHTML = html;
      rodape(`<button type="button" class="ev-btn-prim cheio" onclick="evProximo()" ${subOk() ? "" : "disabled"}>Continuar <i class="ti ti-arrow-right"></i></button>`);
      return;
    }
    if (p === 2) {
      const con = modDe("con");
      const primeiro = !ativo();
      const media = Math.floor(c.dv / 2) + 1;
      const extraRaca = racaAtual()?.t.some((t) => t.pvNivel) ? 1 : 0;
      const extraSub = pvSubExtra(fluxo.c, lv, fluxo.sub);
      const pvR = primeiro ? "" : regraV("pv") || "";
      const pvMax = pvR === "max";
      if ((pvR === "rolar" || pvR === "rolarMin") && fluxo.pvModo !== "rolar") { fluxo.pvModo = "rolar"; fluxo.pvRolado = 1 + Math.floor(Math.random() * c.dv); }
      if (pvR === "media") fluxo.pvModo = "media";
      const rolado = fluxo.pvModo === "rolar" && fluxo.pvRolado ? (pvR === "rolarMin" ? Math.max(fluxo.pvRolado, media) : fluxo.pvRolado) : media;
      const base = primeiro || pvMax ? c.dv : rolado;
      fluxo.pv = Math.max(1, base + con) + extraRaca + extraSub;
      html += `<h5 class="ev-h">Pontos de vida</h5>`;
      if (primeiro) html += `<p class="ev-p">No primeiro nível você ganha o máximo do dado: <b>${c.dv}</b> + Constituição (${sinal(con)}).</p>`;
      else if (pvMax) html += `<p class="ev-p">Regra da mesa: todo nível dá o máximo do dado, <b>${c.dv}</b> + Constituição (${sinal(con)}).</p>`;
      else if (pvR === "media") html += `<p class="ev-p">Regra da mesa: PV pela média, <b>${media}</b> + Constituição (${sinal(con)}).</p>`;
      else if (pvR === "rolar" || pvR === "rolarMin") html += `<p class="ev-p">Regra da mesa: PV rolado${pvR === "rolarMin" ? `, nunca abaixo da média (${media})` : ""}. Tirou <b>${fluxo.pvRolado}</b> no d${c.dv}${pvR === "rolarMin" && fluxo.pvRolado < media ? `, fica ${media}` : ""} + Constituição (${sinal(con)}).</p>`;
      else html += `
        <div class="ev-duas">
          <button type="button" class="ev-op ${fluxo.pvModo === "media" ? "on" : ""}" onclick="evPv('media')"><span class="ev-op-topo"><b>Média</b><small>d${c.dv}</small></span><span class="ev-op-txt">${media} + Constituição (${sinal(con)})</span></button>
          <button type="button" class="ev-op ${fluxo.pvModo === "rolar" ? "on" : ""}" onclick="evPv('rolar')"><span class="ev-op-topo"><b>Rolar</b><small>d${c.dv}</small></span><span class="ev-op-txt">${fluxo.pvRolado ? `Tirou <b>${fluxo.pvRolado}</b> no dado` : "Toque pra rolar"}</span></button>
        </div>`;
      html += `<div class="ev-ganho"><small>Você ganha</small><b>+${fluxo.pv} PV</b>${extraRaca || extraSub ? `<span>${[extraRaca ? "+1 da Robustez Anã" : "", extraSub ? `+${extraSub} da Resiliência Dracônica` : ""].filter(Boolean).join(" · ")}</span>` : ""}<span>PV máximo: ${get("vidaMax")} → ${(primeiro ? 0 : get("vidaMax")) + fluxo.pv}</span></div>`;
      if (primeiro) html += `<p class="ev-p quieto">O PV máximo da ficha vai ser substituído por esse valor.</p>`;
      $("evCorpo").innerHTML = html;
      rodape(`<button type="button" class="ev-btn-prim cheio" onclick="evProximo()">Continuar <i class="ti ti-arrow-right"></i></button>`);
      return;
    }
    if (p === 3) {
      const f = c.f.find((x) => x.n === lv && x.asi);
      const epico = f.asi === 2;
      const a = fluxo.asi;
      const opts = (sel, excl) => `<option value="">Escolher</option>` + Object.keys(ATR).map((k) => `<option value="${k}" ${sel === k ? "selected" : ""} ${excl === k ? "disabled" : ""}>${ATR_NOME[k]} (${atrVal(k)})</option>`).join("");
      html += `<h5 class="ev-h">${epico ? "Dádiva Épica" : "Melhoria de Atributo"}</h5>
        <div class="ev-seg3">
          ${epico ? "" : `<button type="button" class="${a.modo === "2" ? "on" : ""}" onclick="evAsi('modo','2')">+2 em um</button><button type="button" class="${a.modo === "11" ? "on" : ""}" onclick="evAsi('modo','11')">+1 em dois</button>`}
          <button type="button" class="${a.modo === "t" || epico ? "on" : ""}" onclick="evAsi('modo','t')">Talento</button>
        </div>`;
      if (!epico && a.modo !== "t") {
        html += gradeAtributos(a.modo === "2" ? 2 : 1, a.modo === "2" ? 1 : 2, 20);
        html += `<p class="ev-p quieto">${a.modo === "2" ? "Toque no atributo que vai ganhar +2." : "Toque em dois atributos diferentes: cada um ganha +1."} O máximo é 20, e o valor muda direto na aba de atributos.</p>`;
      } else {
        if (regra("semTalentos") && !epico) html += `<p class="ev-mesa-aviso"><i class="ti ti-alert-triangle"></i>A mesa não usa talentos. Escolha um só se o mestre liberar.</p>`;
        const lista = TALENTOS_IGNEA.filter((t) => (epico ? t.tipo === "Dádiva Épica" : t.tipo !== "Dádiva Épica"));
        html += `<div class="ev-talentos">${lista.map((t) => `<button type="button" class="ev-op ${fluxo.talento === t.nome ? "on" : ""}" onclick="evTalento('${esc(t.nome)}')"><span class="ev-op-topo"><b>${esc(t.nome)}</b><small>${esc(t.tipo)}</small></span><span class="ev-op-txt">${esc(t.d)}</span></button>`).join("")}</div>
          <label class="ev-campo-livre"><span>Outro talento (escreva)</span><input value="${esc(TALENTOS_IGNEA.some((t) => t.nome === fluxo.talento) ? "" : fluxo.talento)}" placeholder="Nome do talento" oninput="evTalento(this.value, true)"></label>
          ${epico ? `<h5 class="ev-h">+1 num atributo (até 30)</h5>${gradeAtributos(1, 1, 30)}` : ""}`;
      }
      $("evCorpo").innerHTML = html;
      const ok = a.modo === "t" || epico ? !!fluxo.talento.trim() : a.modo === "2" ? !!a.a : a.a && a.b;
      rodape(`<button type="button" class="ev-btn-sec" onclick="evProximo()">Pular</button><button type="button" class="ev-btn-prim" onclick="evProximo()" ${ok ? "" : "disabled"}>Continuar <i class="ti ti-arrow-right"></i></button>`);
      return;
    }
    if (p === 4) {
      const todas = escolhasDoNivel();
      html += todas.map((e, i) => `
        <h5 class="ev-h">${esc(e.rot)}${e.n > 1 && !e.opcional ? ` <small class="ev-conta">${((fluxo.esc || {})[i] || []).length}/${e.n}</small>` : ""}</h5>
        ${e.fixo && e.fixo.length ? `<p class="ev-p quieto">Você também ganha: <b>${e.fixo.map(esc).join(", ")}</b>.</p>` : ""}
        ${e.n > 0 ? opcoesEscolha(e, i, todas) : ""}`).join("");
      html += `<p class="ev-p quieto">As perícias são marcadas na aba de atributos, os idiomas vão pro campo Idiomas, as magias vão pra aba Magias e as opções viram poderes na aba 🔥. Magia dá pra escolher depois também, pelo catálogo.</p>`;
      $("evCorpo").innerHTML = html;
      const falta = todas.some((e, i) => e.n > 0 && e.t !== "magia" && e.t !== "livre" && ((fluxo.esc || {})[i] || []).length < e.n);
      rodape(`${falta ? `<button type="button" class="ev-btn-sec" onclick="evProximo()">Escolher depois</button>` : ""}<button type="button" class="ev-btn-prim${falta ? "" : " cheio"}" onclick="evProximo()" ${falta ? "disabled" : ""}>Continuar <i class="ti ti-arrow-right"></i></button>`);
      return;
    }
    // confirmar
    const { subTxt, asiTxt, habs, escolhas } = resumoNivel();
    const pbAntes = pb(), pbDepois = pb(total() + 1);
    const vmAntes = ativo() ? get("vidaMax") : 0, vmDepois = ativo() ? vmAntes + fluxo.pv : fluxo.pv;
    const espAntes = espacos().reduce((t, v) => t + v, 0);
    html = `<div class="ev-etapas">${etapas}</div>
      <div class="ev-medalha">
        <div class="ev-medalha-anel"><span>${icDe(c)}</span><b>${total() + 1}</b></div>
        <h4>${esc(c.nome)} ${lv}</h4>
        <p>${subTxt ? esc(subTxt) : ativo() ? `Nível ${total()} → ${total() + 1}` : "Começo da jornada"}</p>
      </div>
      <div class="ev-stats">
        <div><small>Pontos de vida</small><b>${vmDepois}</b><span class="sobe">+${fluxo.pv}</span></div>
        <div><small>Proficiência</small><b>+${pbDepois}</b>${pbDepois > pbAntes && ativo() ? `<span class="sobe">▲</span>` : `<span>—</span>`}</div>
        <div><small>Dado de vida</small><b>d${c.dv}</b><span>+1</span></div>
      </div>
      ${asiTxt ? `<div class="ev-destaque"><span>⬆️</span><b>${esc(asiTxt)}</b></div>` : ""}
      ${habs.length ? `<h5 class="ev-h">Novas habilidades</h5><div class="ev-habs">${habs.map((f) => `
        <div class="ev-hab ${f.origem === "subclasse" ? "sub" : ""}">
          <span class="ev-hab-ic">${iconeDe(f.nome, f.origem)}</span>
          <div>
            <b>${esc(f.nome)}</b>
            <div class="ev-tags">${f.origem === "subclasse" ? `<i class="sub">${esc(c.subNome)}</i>` : ""}${f.a && f.a !== "passiva" ? `<i>${ACAO_ROT[f.a]}</i>` : f.a === "passiva" ? `<i>Passiva</i>` : ""}${f.r ? `<i>${REC_ROT[f.r]}</i>` : ""}</div>
            <p>${esc(f.d)}</p>
          </div>
        </div>`).join("")}</div>` : `<p class="ev-p quieto">Nenhuma habilidade nova neste nível: os números da classe aumentam.</p>`}
      ${escolhas.length ? `<h5 class="ev-h">Suas escolhas</h5><div class="ev-escolhidas">${escolhas.map((x) => `<div><small>${esc(x.e.rot)}</small><div class="ev-chips2 fixo">${x.sel.map((v) => `<span>${esc(v)}</span>`).join("")}</div></div>`).join("")}</div>` : ""}
      ${!ativo() ? `<p class="ev-p quieto">Resistências de ${c.saves.map((k) => ATR_NOME[k]).join(" e ")} vão ser marcadas como proficientes.</p>` : ""}`;
    $("evCorpo").innerHTML = html;
    rodape(`<button type="button" class="ev-btn-prim cheio" onclick="evConfirmar()"><i class="ti ti-check"></i> Confirmar nível ${total() + 1}</button>`);
  }
  function gradeAtributos(bonus, quantos, teto) {
    const a = fluxo.asi;
    const escolhidos = [a.a, a.b].filter(Boolean);
    return `<div class="ev-atrs">${Object.keys(ATR).map((k) => {
      const v = atrVal(k), on = escolhidos.includes(k);
      const novo = Math.min(teto, v + (on ? bonus : 0));
      const m = Math.floor((v - 10) / 2), m2 = Math.floor((novo - 10) / 2);
      const cheio = v >= teto;
      return `<button type="button" class="ev-atr ${on ? "on" : ""}" ${cheio && !on ? "disabled" : ""} onclick="evAtr('${k}', ${quantos})">
        <span class="ev-atr-ic">${ATR_ICO[k]}</span>
        <small>${ATR_NOME[k]}</small>
        <span class="ev-atr-val">${on ? `${v}<i>→</i><b>${novo}</b>` : `<b>${v}</b>`}</span>
        <span class="ev-atr-mod ${on && m2 > m ? "sobe" : ""}">${sinal(on ? m2 : m)}${on && m2 > m ? " ▲" : ""}</span>
        ${on ? `<em>+${novo - v}</em>` : cheio ? `<em class="max">máx.</em>` : ""}
      </button>`;
    }).join("")}</div>`;
  }
  window.evAtr = function (k, quantos) {
    const a = fluxo.asi;
    if (quantos === 1) { a.a = a.a === k ? "" : k; a.b = ""; }
    else if (a.a === k) { a.a = a.b; a.b = ""; }
    else if (a.b === k) a.b = "";
    else if (!a.a) a.a = k;
    else if (!a.b) a.b = k;
    else { a.a = a.b; a.b = k; }
    renderPainel();
  };
  function asiResumo(c, lv) {
    const f = c.f.find((x) => x.n === lv && x.asi);
    if (!f) return "";
    const a = fluxo.asi;
    if (f.asi === 2) return fluxo.talento ? `Dádiva: ${fluxo.talento}${a.a ? ` (+1 ${ATR_NOME[a.a]})` : ""}` : "";
    if (a.modo === "t") return fluxo.talento ? `Talento: ${fluxo.talento}` : "";
    if (a.modo === "2" && a.a) return `+2 ${ATR_NOME[a.a]}`;
    if (a.modo === "11" && a.a && a.b) return `+1 ${ATR_NOME[a.a]} e +1 ${ATR_NOME[a.b]}`;
    return "";
  }
  function pvSubExtra(cid, lv, subEscolhida) {
    // Resiliência Dracônica: +3 ao entrar no nível 3 e +1 por nível depois
    const sub = subEscolhida || st().subs[cid];
    if (cid !== "feiticeiro" || !sub || sub.tipo !== "srd") return 0;
    return lv === 3 ? 3 : lv > 3 ? 1 : 0;
  }
  window.evPv = function (modo) {
    fluxo.pvModo = modo;
    if (modo === "rolar") fluxo.pvRolado = 1 + Math.floor(Math.random() * CL(fluxo.c).dv);
    renderPainel();
  };
  window.evAsi = function (k, v) {
    fluxo.asi[k] = v;
    if (k === "modo") { fluxo.asi.a = ""; fluxo.asi.b = ""; if (v !== "t") fluxo.talento = ""; }
    renderPainel();
  };
  window.evTalento = function (nome, livre) {
    fluxo.talento = nome;
    if (!livre) renderPainel();
    else { const b = $("evRodape").querySelector(".ev-btn-prim"); if (b) b.disabled = !nome.trim(); }
  };

  function resumoNivel() {
    const c = CL(fluxo.c), lv = nivelNovo();
    const g = ganhosNoNivel(fluxo.c, lv).filter((f) => !f.slotSub);
    const subTxt = fluxo.sub ? (fluxo.sub.tipo === "srd" ? c.sub.nome : fluxo.sub.nome) : "";
    const subFeats = fluxo.sub ? (fluxo.sub.tipo === "srd" ? c.sub.f : fluxo.sub.f || []).filter((f) => Number(f.n) === lv) : [];
    const habs = g.concat(subFeats.map((f) => ({ ...f, origem: "subclasse" }))).filter((f) => !f.asi && !(f.vazio && subFeats.length));
    const escolhas = escolhasDoNivel().map((e, i) => ({ e, sel: ((fluxo.esc || {})[i] || []).concat(e.t === "idioma" ? e.fixo || [] : []) })).filter((x) => x.sel.length);
    return { c, lv, subTxt, asiTxt: asiResumo(c, lv), habs, escolhas };
  }
  window.evConfirmar = function () {
    const c = CL(fluxo.c), lv = nivelNovo();
    aplicarNivel();
    tela = "visao";
    fluxo = null;
    abertos = new Set([`${c.id}:${lv}`]);
    sincronizar();
    celebrar(c, lv, total());
    if (dominioPendente()) setTimeout(() => toast(st().dominio ? "Nível 12: escolha a habilidade de Domínio aqui na Evolução" : "Nível 3: escolha o seu Domínio aqui na Evolução"), 2300);
  };
  function aplicarNivel() {
    const s = st(), c = CL(fluxo.c), lv = nivelNovo(), primeiro = !ativo();
    const entrada = { c: fluxo.c, pv: fluxo.pv || 0 };
    const reg = aplicarEscolhas(escolhasDoNivel());
    if (reg) entrada.esc = reg;
    if (racaAtual()?.id === "anao") { entrada.pvRaca = 1; s.pvRaca = (s.pvRaca || 0) + 1; }
    const f = c.f.find((x) => x.n === lv && x.asi);
    if (f) {
      const a = fluxo.asi, asi = {};
      if (f.asi === 2) { if (a.a) asi[a.a] = 1; }
      else if (a.modo === "2" && a.a) asi[a.a] = 2;
      else if (a.modo === "11" && a.a && a.b) { asi[a.a] = 1; asi[a.b] = 1; }
      const teto = f.asi === 2 ? 30 : 20;
      Object.entries(asi).forEach(([k, v]) => {
        const el = $(ATR[k]);
        if (!el) return;
        const atual = parseInt(el.value) || 10;
        const novo = Math.min(teto, atual + v);
        asi[k] = novo - atual;
        el.value = novo;
      });
      if (Object.values(asi).some(Boolean)) entrada.asi = asi;
      if (fluxo.talento.trim()) {
        entrada.talento = fluxo.talento.trim();
        adicionarTalento(entrada.talento, lv);
      }
    }
    if (fluxo.sub) s.subs[fluxo.c] = fluxo.sub;
    if (c.custom) { s.classesCustom = s.classesCustom || {}; s.classesCustom[c.id] = c.bruto; }
    // PV
    const vm = $("vidaMax");
    if (vm) {
      if (primeiro) { entrada.pvAntes = get("vidaMax"); vm.value = entrada.pv; vidaAtual = entrada.pv; }
      else { vm.value = get("vidaMax") + entrada.pv; vidaAtual = Math.min(get("vidaMax"), vidaAtual + entrada.pv); }
    }
    // resistências da classe inicial
    if (primeiro && typeof saves !== "undefined") c.saves.forEach((k) => { saves[ATR[k]] = true; });
    s.niveis.push(entrada);
  }
  function celebrar(c, lv, nivel) {
    document.querySelector(".ev-festa")?.remove();
    const f = document.createElement("div");
    f.className = "ev-festa";
    f.innerHTML = `<div class="ev-festa-raios"></div><div class="ev-festa-centro"><span class="ev-festa-ic">${icDe(c)}</span><small>Subiu de nível!</small><b>${nivel}</b><em>${esc(c.nome)} ${lv}</em></div>${Array.from({ length: 14 }, (_, i) => `<i style="--a:${i * 26}deg;--d:${(i % 5) * 60}ms"></i>`).join("")}`;
    f.onclick = () => f.remove();
    document.body.appendChild(f);
    setTimeout(() => f.classList.add("sai"), 1700);
    setTimeout(() => f.remove(), 2200);
  }
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "ev-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("on"));
    setTimeout(() => { t.classList.remove("on"); setTimeout(() => t.remove(), 300); }, 2400);
  }
  function adicionarTalento(nome, lv) {
    if (typeof poderes === "undefined") return;
    const t = TALENTOS_IGNEA.find((x) => x.nome === nome);
    poderes.push({ id: "pw_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), nome, circulo: "", acao: "passiva", recarga: "", origem: "talento", tipo: "", dano: "", alcance: "", duracao: "", tempo: "", desc: t ? t.d : "Talento escolhido na Melhoria de Atributo.", temCargas: false, maxCargas: 0, cargasGastas: [], componentes: {}, _progTalento: total() + 1, icone: "⭐" });
  }

  window.evDesfazer = async function () {
    const s = st();
    if (!s || !s.niveis.length) return;
    const ult = s.niveis[s.niveis.length - 1];
    const c = CL(ult.c);
    const lv = porClasse()[ult.c];
    const ok = typeof confirmBonito === "function" ? await confirmBonito(`Desfazer ${c ? c.nome : ""} ${lv}? O PV, os atributos e as habilidades desse nível voltam ao que eram.`) : true;
    if (!ok) return;
    s.niveis.pop();
    if (ult.pvRaca) s.pvRaca = Math.max(0, (s.pvRaca || 0) - 1);
    else if (racaAtual()?.id === "anao" && (s.pvRaca || 0) > s.niveis.length) {
      // nível importado: a Robustez Anã foi somada pela troca de raça
      s.pvRaca -= 1;
      ult.pv = (ult.pv || 0) + 1;
    }
    const vm = $("vidaMax");
    if (vm) {
      if (!s.niveis.length && ult.pvAntes !== undefined) vm.value = ult.pvAntes;
      else vm.value = Math.max(1, get("vidaMax") - (ult.pv || 0));
      vidaAtual = Math.min(vidaAtual, get("vidaMax"));
    }
    desfazerEscolhas(ult.esc);
    if (ult.asi) Object.entries(ult.asi).forEach(([k, v]) => { const el = $(ATR[k]); if (el) el.value = (parseInt(el.value) || 10) - v; });
    if (ult.talento && typeof poderes !== "undefined") {
      const i = poderes.findIndex((p) => p._progTalento === s.niveis.length + 1 && p.nome === ult.talento);
      if (i >= 0) poderes.splice(i, 1);
    }
    if (c && !porClasse()[ult.c]) delete s.subs[ult.c];
    else if (c && porClasse()[ult.c] < c.subNiveis[0]) delete s.subs[ult.c];
    if (!s.niveis.length) {
      // volta pro modo manual: tira o que o sistema adicionou
      s.adicionados.forEach((k) => { const i = poderes.findIndex((p) => p._prog === k); if (i >= 0) poderes.splice(i, 1); });
      s.adicionados = []; s.ocultos = [];
      try { atualizarTudo(); atualizarHP(); renderPoderes(); salvarTudo(); } catch (e) {}
      renderCard();
      fecharEvolucao();
      return;
    }
    sincronizar();
  };

  /* ======================= SUBCLASSE ======================= */
  const BIB = "ignea_subclasses";
  const biblioteca = () => { try { return JSON.parse(localStorage.getItem(BIB) || "[]"); } catch (e) { return []; } };
  const salvarBib = (l) => { try { localStorage.setItem(BIB, JSON.stringify(marcar(l, biblioteca()).slice(-200))); } catch (e) {} nuvemAgendar(); };

  function escolhaSubHTML(c) {
    const sel = fluxo.sub;
    const minhas = biblioteca().filter((x) => x.classe === c.id);
    const mesa = (window._subsMesa || []).filter((x) => x.classe === c.id);
    const padrao = (window.SUBCLASSES_PADRAO || []).filter((x) => x.classe === c.id);
    // nível de cada habilidade em bolinha: "3 Pontos de Estilo · 7 Devil Trigger"
    const marcos = (f) => { const l = (f || []).filter((x) => x && x.nome); return `<span class="ev-sc-marcos">${l.slice(0, 6).map((x) => `<span><em>${esc(x.n || "")}</em>${esc(x.nome)}</span>`).join("")}${l.length > 6 ? `<span class="mais">+${l.length - 6}</span>` : ""}</span>`; };
    const card = (tipo, rot, on, onclick, nome, d, f, extra) => `
      <div class="ev-sc ${tipo}${on ? " on" : ""}">
        <button type="button" class="ev-sc-corpo" onclick="${onclick}">
          <span class="ev-sc-selo">${rot}</span>
          <b>${esc(nome)}</b>
          ${d ? `<span class="ev-sc-d">${esc(resumoCurto(d, 120))}</span>` : ""}
          ${marcos(f)}
          ${on ? `<span class="ev-sc-ok"><i class="ti ti-check"></i></span>` : ""}
        </button>${extra || ""}
      </div>`;
    const prontas = [];
    if (c.sub.f.length) prontas.push(card("oficial", "Oficial", sel && sel.tipo === "srd", "evSubSrd()", c.sub.nome, c.sub.d, c.sub.f));
    padrao.forEach((m) => prontas.push(card("app", `Feita por ${esc(m.autores)}`, sel && sel.padrao === m.id, `evSubPadrao('${esc(m.id)}')`, m.nome, m.d, m.f)));
    mesa.forEach((m) => prontas.push(card("mesa", "Da mesa", sel && sel.mesaId === m.id, `evSubMesa('${esc(m.id)}')`, m.nome, m.d, m.f)));
    const suas = minhas.map((m, i) => card("sua", "Sua", sel && sel.tipo === "custom" && !sel.mesaId && !sel.padrao && sel.nome === m.nome, `evSubBib(${i}, '${c.id}')`, m.nome, m.d, m.f,
      `<div class="ev-sc-acoes"><button type="button" onclick="evSubEditarBib(${i}, '${c.id}')"><i class="ti ti-pencil"></i> Editar</button><button type="button" class="perigo" onclick="evSubExcluir(${i}, '${c.id}')"><i class="ti ti-trash"></i></button></div>`));
    const nomeOn = sel && sel.tipo === "nome";
    return `
      <h5 class="ev-h">${esc(c.subNome)} (subclasse)</h5>
      <p class="ev-p">No nível ${c.subNiveis[0]} o ${esc(c.nome)} escolhe uma especialização. Ela dá habilidades nos níveis ${c.subNiveis.join(", ")}.</p>
      ${prontas.length ? `<div class="ev-sc-sec"><span>Prontas pra usar</span></div>${prontas.join("")}` : ""}
      ${suas.length ? `<div class="ev-sc-sec"><span>Criadas por você</span></div>${suas.join("")}` : ""}
      <div class="ev-sc-sec"><span>Ou faça a sua</span></div>
      <div class="ev-sc-ferr">
        <button type="button" class="${nomeOn ? "on" : ""}" onclick="evSubNome()"><i class="ti ti-signature"></i><b>Só o nome</b><small>poderes na mão</small></button>
        <button type="button" onclick="evCriarSub('${c.id}')"><i class="ti ti-pencil-plus"></i><b>Criar</b><small>nível a nível</small></button>
        ${typeof window.lerTextoColado === "function" ? `<button type="button" onclick="evColarAbrir('sub','${c.id}')"><i class="ti ti-clipboard-text"></i><b>Colar texto</b><small>do grupo, site…</small></button>` : ""}
        <button type="button" onclick="evImportarCodigo('${c.id}')"><i class="ti ti-download"></i><b>Por código</b><small>de um amigo</small></button>
      </div>
      ${nomeOn ? `<label class="ev-campo-livre"><span>Nome da subclasse</span><input value="${esc(sel.nome)}" placeholder="Ex: Trilha do Lobo Cinzento" oninput="evSubNomeTxt(this.value)"></label>` : ""}`;
  }
  window.evSubMesa = function (id) {
    const m = (window._subsMesa || []).find((x) => x.id === id);
    if (m) fluxo.sub = { tipo: "custom", mesaId: m.id, nome: m.nome, d: m.d || "", f: JSON.parse(JSON.stringify(m.f || [])), magias: JSON.parse(JSON.stringify(m.magias || {})) };
    renderPainel();
  };
  // subclasses que já vêm no app, feitas por jogadores (não são do SRD)
  window.evSubPadrao = function (id) {
    const m = (window.SUBCLASSES_PADRAO || []).find((x) => x.id === id);
    if (!m) return;
    fluxo.sub = { tipo: "custom", padrao: m.id, nome: m.nome, autores: m.autores, d: m.d || "", f: JSON.parse(JSON.stringify(m.f || [])), magias: m.magias || {} };
    renderPainel();
  };
  window.evSubSrd = function () { fluxo.sub = { tipo: "srd" }; renderPainel(); };
  window.evSubNome = function () { fluxo.sub = { tipo: "nome", nome: "" }; renderPainel(); const i = $("evCorpo").querySelector(".ev-campo-livre input"); i && i.focus(); };
  window.evSubNomeTxt = function (v) { fluxo.sub.nome = v; const b = $("evRodape").querySelector(".ev-btn-prim"); if (b) b.disabled = !v.trim(); };
  // botão Continuar da escolha de subclasse: "só o nome" precisa de nome
  function subOk() { return fluxo && fluxo.sub && !(fluxo.sub.tipo === "nome" && !String(fluxo.sub.nome || "").trim()); }
  function resumoCurto(t, max) { t = String(t || "").replace(/\s+/g, " ").trim(); return t.length > max ? t.slice(0, max).replace(/\s\S*$/, "") + "…" : t; }
  function listaCurta(l) { l = l.filter(Boolean); return esc(l.slice(0, 4).join(" · ")) + (l.length > 4 ? ` <i>+${l.length - 4}</i>` : ""); }
  window.evSubEditarBib = function (i, cid) {
    const m = biblioteca().filter((x) => x.classe === cid)[i];
    if (!m) return;
    evCriarSub(cid, { cid, nome: m.nome, d: m.d || "", f: JSON.parse(JSON.stringify(m.f || [])), magias: JSON.parse(JSON.stringify(m.magias || {})) });
  };
  window.evSubExcluir = async function (i, cid) {
    const m = biblioteca().filter((x) => x.classe === cid)[i];
    if (!m) return;
    if (typeof confirmBonito === "function" && !(await confirmBonito(`Excluir a subclasse ${m.nome}? Fichas que já usam ela continuam com ela; ela só sai da lista.`))) return;
    salvarBib(biblioteca().filter((x) => x !== m && !(x.classe === m.classe && x.nome === m.nome)));
    if (fluxo && fluxo.sub && fluxo.sub.tipo === "custom" && !fluxo.sub.mesaId && fluxo.sub.nome === m.nome) fluxo.sub = null;
    renderPainel();
    toast(`Subclasse ${m.nome} excluída.`);
  };
  window.evSubBib = function (i, cid) {
    const m = biblioteca().filter((x) => x.classe === cid)[i];
    if (m) fluxo.sub = { tipo: "custom", nome: m.nome, d: m.d || "", f: JSON.parse(JSON.stringify(m.f || [])), magias: JSON.parse(JSON.stringify(m.magias || {})) };
    renderPainel();
  };

  // editor
  let ed = null; // { cid, nome, d, f:[{n,nome,d,a,r,u}] }
  window.evCriarSub = function (cid, base) {
    const c = CL(cid);
    ed = base ? JSON.parse(JSON.stringify(base)) : { cid, nome: "", d: "", f: [] };
    ed.cid = cid;
    if (!fluxo) fluxo = {};
    fluxo.voltarPara = tela;
    tela = "editorSub";
    renderPainel();
    $("evCorpo").scrollTop = 0;
  };
  window.evEditarSub = function (cid) {
    const s = st(), x = s.subs[cid], c = CL(cid);
    fluxo = { voltarPara: "visao", editarDireto: true };
    if (!x || x.tipo === "srd") {
      // escolher de novo
      fluxo.c = cid; fluxo.sub = x ? { ...x } : null;
      tela = "trocarSub";
      renderPainel();
      return;
    }
    if (x.tipo === "nome") {
      ed = { cid, nome: x.nome, d: "", f: [] };
    } else ed = { cid, nome: x.nome, d: x.d || "", f: JSON.parse(JSON.stringify(x.f || [])), magias: JSON.parse(JSON.stringify(x.magias || {})) };
    if (x.mesaId) { tela = "trocarSub"; fluxo.c = cid; fluxo.sub = { ...x }; renderPainel(); return; }
    tela = "editorSub";
    renderPainel();
  };
  window.evSalvarTroca = function () {
    if (!fluxo.sub || (fluxo.sub.tipo === "nome" && !fluxo.sub.nome.trim())) return;
    st().subs[fluxo.c] = fluxo.sub;
    tela = "visao"; fluxo = null;
    sincronizar();
  };
  function edRender() { if (ed && ed.alvo === "classe") renderEditorClasse(); else if (ed && ed.alvo === "mestre") renderSubMestre(); else renderEditorSub(); }
  function datalistMagias() {
    if ($("evDlMagias") || typeof CATALOGO_MAGIAS === "undefined") return "";
    const dl = document.createElement("datalist");
    dl.id = "evDlMagias";
    dl.innerHTML = CATALOGO_MAGIAS.map((m) => `<option value="${esc(m.nome)}">${m.c ? m.c + "º círculo" : "truque"}</option>`).join("");
    document.body.appendChild(dl);
    return "";
  }
  function blocosEditor(c) {
    datalistMagias();
    ed.magias = ed.magias || {};
    return c.subNiveis.map((n) => {
      const fs = ed.f.map((f, i) => ({ f, i })).filter((x) => Number(x.f.n) === n);
      return `
        <div class="ev-ed-nivel">
          <div class="ev-ed-nv"><b>Nível ${n}</b><small>${n === c.subNiveis[0] ? "ao escolher a subclasse" : "habilidade da subclasse"}</small></div>
          ${fs.map(({ f, i }) => habEdHTML(f, i, c.subNiveis)).join("")}
          <button type="button" class="ev-ed-add" onclick="evEdAdd(${n})"><i class="ti ti-plus"></i> Habilidade no nível ${n}</button>
          ${edMagiasHTML(n)}
        </div>`;
    }).join("");
  }
  function edMagiasHTML(n) {
    const l = ed.magias[n] || [];
    return `<div class="ev-ed-mags">
      <span class="ev-ed-mags-rot">Magias sempre preparadas</span>
      ${l.length ? `<div class="ev-chips2">${l.map((m, i) => `<button type="button" class="on" onclick="evEdMagTirar(${n},${i})">${esc(m)} ✕</button>`).join("")}</div>` : ""}
      <div class="ev-ed-mag-add"><input id="evEdMag${n}" list="evDlMagias" placeholder="Buscar magia do catálogo" onkeydown="if(event.key==='Enter'){event.preventDefault();evEdMagAdd(${n})}"><button type="button" onclick="evEdMagAdd(${n})">Adicionar</button></div>
    </div>`;
  }
  window.evEdMagAdd = function (n) {
    const el = $("evEdMag" + n), v = (el && el.value || "").trim();
    if (!v) return;
    const cat = catMagia(v);
    ed.magias[n] = (ed.magias[n] || []).filter((x) => x.toLowerCase() !== (cat ? cat.nome : v).toLowerCase()).concat([cat ? cat.nome : v]);
    edRender();
    const novo = $("evEdMag" + n); novo && novo.focus();
  };
  window.evEdMagTirar = function (n, i) { (ed.magias[n] || []).splice(i, 1); edRender(); };
  function renderEditorSub() {
    const c = CL(ed.cid);
    $("evTitulo").textContent = "Subclasse";
    const blocos = blocosEditor(c);
    $("evCorpo").innerHTML = `
      ${bannerImport()}
      <p class="ev-p">Subclasse de <b>${esc(c.nome)}</b>. As habilidades entram na aba 🔥 quando você chega no nível delas.</p>
      <label class="ev-campo-livre"><span>Nome</span><input value="${esc(ed.nome)}" placeholder="Ex: Trilha do Lobo Cinzento" oninput="evEdTopo('nome',this.value)"></label>
      <label class="ev-campo-livre"><span>Descrição (opcional)</span><textarea placeholder="Quem segue essa subclasse?" oninput="evEdTopo('d',this.value)">${esc(ed.d)}</textarea></label>
      <div class="ev-ed-ferr">
        ${c.sub.f.length ? `<button type="button" onclick="evEdBase()"><i class="ti ti-copy"></i> Começar da oficial (${esc(c.sub.nome)})</button>` : ""}
        <button type="button" onclick="evColarAbrir('sub','${c.id}')"><i class="ti ti-clipboard-text"></i> Colar texto</button>
        <button type="button" onclick="evEdCodigo()"><i class="ti ti-share"></i> Copiar código</button>
        ${fluxo && (fluxo.voltarPara === "subir" || fluxo.voltarPara === "minhas") ? "" : `<button type="button" onclick="evEdTrocar()"><i class="ti ti-switch-horizontal"></i> Escolher outra subclasse</button>`}
      </div>
      ${blocos}`;
    rodape(`<button type="button" class="ev-btn-prim cheio" onclick="evEdSalvar()"><i class="ti ti-check"></i> Salvar subclasse</button>`);
  }
  window.evEd = function (i, k, v) {
    if (k === "duvida") { ed.f[i].duvida = false; ed.f[i].soTabela = false; return edRender(); }
    if (k === "n") { ed.f[i].n = Number(v); ed.f[i].duvida = false; if (ed.alvo === "classe") ed.aberto = Number(v); return edRender(); }
    ed.f[i][k] = k === "u" && /^\d$/.test(v) ? Number(v) : v;
    if (k === "u") edRender();
  };
  window.evEdJuntar = function (i) {
    const f = ed.f[i];
    let j = -1;
    ed.f.forEach((g, k) => { if (k < i && Number(g.n) === Number(f.n)) j = k; });
    if (j < 0) return;
    const g = ed.f[j];
    g.d = [g.d, [f.nome, f.d].filter(Boolean).join(". ")].filter((x) => String(x || "").trim()).join("\n");
    if (!g.u && f.u) { g.u = f.u; g.r = f.r; }
    if (g.a === "passiva" && f.a !== "passiva") g.a = f.a;
    g.duvida = !!(g.duvida && f.duvida);
    ed.f.splice(i, 1);
    edRender();
  };
  const limparImp = (l) => (l || []).map((f) => { const x = { ...f }; delete x.imp; delete x.duvida; delete x.soTabela; return x; });
  window.evEdTopo = function (k, v) { ed[k] = v; };
  window.evEdTrocar = function () {
    const cid = ed.cid, x = st().subs[cid];
    fluxo = { voltarPara: "visao", c: cid, sub: x ? { ...x } : null };
    tela = "trocarSub";
    renderPainel();
  };
  window.evEdAdd = function (n) { ed.f.push({ n, nome: "", d: "", a: "passiva", r: "", u: "" }); edRender(); const ins = document.querySelectorAll(ed.alvo === "mestre" ? "#smEditor .ev-ed-nome" : "#evCorpo .ev-ed-nome"); ins[ins.length - 1] && ins[ins.length - 1].focus(); };
  window.evEdRemover = function (i) { ed.f.splice(i, 1); edRender(); };
  window.evEdBase = async function () {
    const c = CL(ed.cid);
    if (ed.f.length && typeof confirmBonito === "function" && !(await confirmBonito("Substituir as habilidades atuais pelas da subclasse oficial?"))) return;
    ed.f = JSON.parse(JSON.stringify(c.sub.f)).map((f) => ({ n: f.n, nome: f.nome, d: f.d, a: f.a || "passiva", r: f.r || "", u: f.u || "" }));
    ed.magias = JSON.parse(JSON.stringify((typeof MAGIAS_SUB !== "undefined" && MAGIAS_SUB[c.sub.id]) || {}));
    if (!ed.nome) ed.nome = c.sub.nome + (ed.alvo === "mestre" ? " (versão da mesa)" : " (minha versão)");
    if (!ed.d) ed.d = c.sub.d;
    edRender();
  };
  const codigo = (obj) => "IGNEA-SUB:" + btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  window.evEdCodigo = async function () {
    const txt = codigo({ classe: ed.cid, classeNome: CL(ed.cid)?.nome || "", nome: ed.nome, d: ed.d, f: limparImp(ed.f.filter((f) => f.nome.trim())), magias: ed.magias || {} });
    try { await navigator.clipboard.writeText(txt); toast("Código copiado! Mande pra quem quiser usar."); }
    catch (e) { if (typeof promptBonito === "function") promptBonito("Copie o código da subclasse:", txt); }
  };
  window.evImportarCodigo = async function (cid) {
    const txt = typeof promptBonito === "function" ? await promptBonito("Cole o código da subclasse:", "") : null;
    if (!txt) return;
    try {
      const obj = JSON.parse(decodeURIComponent(escape(atob(txt.trim().replace(/^IGNEA-SUB:/, "")))));
      // a classe de quem mandou pode ter outro id aqui (classe importada por código): só barra se for outra classe que existe
      const outra = obj.classe && obj.classe !== cid ? CL(obj.classe) : null;
      if (outra && !(obj.classeNome && nomeN(obj.classeNome) === nomeN(CL(cid)?.nome || ""))) { alertBonito ? alertBonito(`Esse código é de uma subclasse de ${outra.nome}.`) : alert("Código de outra classe."); return; }
      const lib = biblioteca();
      lib.push({ classe: cid, classeNome: CL(cid)?.nome || "", nome: obj.nome || "Subclasse importada", d: obj.d || "", f: Array.isArray(obj.f) ? obj.f : [], magias: obj.magias || {} });
      salvarBib(lib);
      if (fluxo) fluxo.sub = { tipo: "custom", nome: obj.nome || "Subclasse importada", d: obj.d || "", f: Array.isArray(obj.f) ? obj.f : [], magias: obj.magias || {} };
      renderPainel();
      toast("Subclasse importada!");
    } catch (e) { alertBonito ? alertBonito("Esse código não parece ser de uma subclasse da Ficha Ígnea.") : alert("Código inválido."); }
  };
  window.evEdSalvar = function () {
    if (!ed.nome.trim()) { const i = $("evCorpo").querySelector(".ev-campo-livre input"); i && i.focus(); return; }
    const sub = { tipo: "custom", nome: ed.nome.trim(), d: ed.d || "", f: limparImp(ed.f.filter((f) => f.nome.trim())).map((f) => ({ ...f, n: Number(f.n) })), magias: ed.magias || {} };
    const lib = biblioteca().filter((x) => !(x.classe === ed.cid && x.nome === sub.nome));
    lib.push({ classe: ed.cid, classeNome: CL(ed.cid)?.nome || "", nome: sub.nome, d: sub.d, f: sub.f, magias: sub.magias });
    salvarBib(lib);
    const volta = fluxo && fluxo.voltarPara;
    if (volta === "minhas") { tela = "minhas"; ed = null; renderPainel(); toast("Subclasse salva!"); return; }
    if (volta === "subir") {
      fluxo.sub = sub;
      tela = "subir";
      renderPainel();
      return;
    }
    st().subs[ed.cid] = sub;
    tela = "visao"; fluxo = null; ed = null;
    sincronizar();
    toast("Subclasse salva!");
  };


  /* ======================= CRIAR CLASSE DO ZERO ======================= */
  const ICONES_CLASSE = ["⚜️", "🪓", "⚔️", "🗡️", "🏹", "🛡️", "👊", "🔥", "❄️", "⚡", "🌿", "🌙", "☀️", "💀", "🩸", "🐉", "🦉", "🐺", "🎻", "📖", "🕯️", "🔮", "⚙️", "🌀"];
  function novaClasseVazia() {
    return { alvo: "classe", id: "cc_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), nome: "", ic: "⚜️", resumo: "", dv: 8, prim: [], saves: [], perN: 2, perDe: [],
      armas: "Simples", armaduras: "Leves", conj: "", atrConj: "car", subNome: "Subclasse", subNiveis: [3, 6, 10, 14], asi: [4, 8, 12, 16], dadiva: true, f: [], aberto: 1 };
  }
  window.evClasseNova = function () {
    const volta = tela;
    ed = novaClasseVazia();
    ed.voltarPara = volta;
    tela = "editorClasse";
    renderPainel();
    $("evCorpo").scrollTop = 0;
  };
  window.evClasseEditar = function (id, volta) {
    const c = CL(id);
    if (!c || !c.custom) return;
    ed = { ...JSON.parse(JSON.stringify(c.bruto)), alvo: "classe", aberto: 1, voltarPara: volta || "visao", editando: true };
    tela = "editorClasse";
    renderPainel();
    $("evCorpo").scrollTop = 0;
  };
  window.evC = function (k, v) {
    if (k === "aberto") { ed.aberto = ed.aberto === Number(v) ? 0 : Number(v); return renderEditorClasse(); }
    if (["prim", "saves", "perDe", "subNiveis", "asi"].includes(k)) {
      const l = ed[k] = ed[k] || [];
      const val = ["subNiveis", "asi"].includes(k) ? Number(v) : v;
      const i = l.indexOf(val);
      if (i >= 0) l.splice(i, 1);
      else if (k === "saves" && l.length >= 2) l.splice(0, 1, val);
      else if (k === "prim" && l.length >= 2) l.splice(0, 1, val);
      else l.push(val);
    } else ed[k] = ["dv", "perN"].includes(k) ? Number(v) : v;
    if (!["nome", "resumo", "armas", "armaduras", "subNome"].includes(k)) renderEditorClasse();
  };
  function habEdHTML(f, i, niveis) {
    niveis = niveis || Array.from({ length: 20 }, (_, k) => k + 1);
    const temAnterior = ed.f.some((g, j) => j < i && Number(g.n) === Number(f.n));
    return `
      <div class="ev-ed-hab ${f.duvida ? "duvida" : ""}">
        ${f.duvida ? `<div class="ev-ed-confere"><span>${f.soTabela ? "Veio só da tabela: falta o texto." : "Confere o nível e o texto."}</span><button type="button" onclick="evEd(${i},'duvida','')">✓ Está certo</button></div>` : ""}
        ${f.imp || f.duvida ? `<div class="ev-ed-mover"><select onchange="evEd(${i},'n',this.value)">${niveis.map((n) => `<option value="${n}" ${Number(f.n) === n ? "selected" : ""}>Nível ${n}</option>`).join("")}</select>${temAnterior ? `<button type="button" onclick="evEdJuntar(${i})"><i class="ti ti-arrow-merge"></i> Juntar com a de cima</button>` : ""}</div>` : ""}
        <input class="ev-ed-nome" value="${esc(f.nome)}" placeholder="Nome da habilidade" oninput="evEd(${i},'nome',this.value)">
        <textarea placeholder="O que ela faz?" style="min-height:${(f.d || "").length > 400 ? 200 : (f.d || "").length > 150 ? 120 : 70}px" oninput="evEd(${i},'d',this.value)">${esc(f.d)}</textarea>
        <div class="ev-ed-linha">
          <select onchange="evEd(${i},'a',this.value)">${Object.entries(ACAO_ROT).map(([k, v]) => `<option value="${k}" ${f.a === k ? "selected" : ""}>${v}</option>`).join("")}</select>
          <select onchange="evEd(${i},'u',this.value)">
            <option value="" ${!f.u ? "selected" : ""}>Sem usos</option>
            ${[1, 2, 3, 4, 5].map((v) => `<option value="${v}" ${String(f.u) === String(v) ? "selected" : ""}>${v} uso${v > 1 ? "s" : ""}</option>`).join("")}
            <option value="pb" ${f.u === "pb" ? "selected" : ""}>Usos = proficiência</option>
            ${Object.keys(ATR).map((k) => `<option value="${k}" ${f.u === k ? "selected" : ""}>Usos = mod. ${ATR_NOME[k]}</option>`).join("")}
          </select>
          <select onchange="evEd(${i},'r',this.value)" ${f.u ? "" : "disabled"}>
            <option value="longo" ${f.r === "longo" || !f.r ? "selected" : ""}>por descanso longo</option>
            <option value="curto" ${f.r === "curto" ? "selected" : ""}>por descanso curto</option>
          </select>
          <button type="button" class="ev-ed-x" onclick="evEdRemover(${i})"><i class="ti ti-trash"></i> Remover</button>
        </div>
      </div>`;
  }
  function renderEditorClasse() {
    $("evTitulo").textContent = ed.editando ? "Editar classe" : "Criar classe";
    $("evVoltar").style.visibility = "visible";
    const chipsAtr = (k, maxTxt) => `<div class="ev-chips2">${Object.keys(ATR).map((a) => `<button type="button" class="${(ed[k] || []).includes(a) ? "on" : ""}" onclick="evC('${k}','${a}')">${ATR_ICO[a]} ${ATR_NOME[a]}</button>`).join("")}</div>${maxTxt ? `<p class="ev-p quieto">${maxTxt}</p>` : ""}`;
    const niveis = Array.from({ length: 20 }, (_, i) => i + 1);
    const nvHTML = niveis.map((n) => {
      const fs = ed.f.map((f, i) => ({ f, i })).filter((x) => Number(x.f.n) === n);
      const tags = [ed.asi.includes(n) ? "Melhoria de Atributo" : "", n === 19 && ed.dadiva ? "Dádiva Épica" : "", ed.subNiveis[0] === n ? `Escolhe: ${ed.subNome}` : ed.subNiveis.includes(n) ? "Habilidade de subclasse" : ""].filter(Boolean);
      const aberto = ed.aberto === n;
      return `
        <div class="ev-cc-nv ${aberto ? "aberto" : ""} ${fs.some((x) => x.f.duvida) ? "tem-duvida" : ""}">
          <button type="button" class="ev-cc-nv-topo" onclick="evC('aberto', ${n})">
            <span class="ev-nv-num">${n}</span>
            <span class="ev-cc-nv-nomes">${fs.map((x) => `<b>${esc(x.f.nome || "Sem nome")}</b>`).join(" · ") || (tags.length ? "" : `<i>Sem habilidade nova</i>`)}${tags.map((t) => `<em>${esc(t)}</em>`).join("")}${fs.some((x) => x.f.duvida) ? `<em class="duv">conferir</em>` : ""}</span>
            <span class="ev-seta">${aberto ? "▲" : "▼"}</span>
          </button>
          ${aberto ? `<div class="ev-cc-nv-corpo">${fs.map((x) => habEdHTML(x.f, x.i)).join("")}<button type="button" class="ev-ed-add" onclick="evEdAdd(${n})"><i class="ti ti-plus"></i> Habilidade no nível ${n}</button></div>` : ""}
        </div>`;
    }).join("");
    $("evCorpo").innerHTML = `
      ${bannerImport() || `<p class="ev-p">Monte sua classe do jeito que quiser. Ela fica salva no aparelho e na ficha, e dá pra compartilhar por código.</p>`}
      <h5 class="ev-h">Identidade</h5>
      <label class="ev-campo-livre"><span>Nome da classe</span><input value="${esc(ed.nome)}" placeholder="Ex: Caçador de Sombras" oninput="evC('nome',this.value)"></label>
      <div class="ev-ic-grade">${ICONES_CLASSE.map((ic) => `<button type="button" class="${ed.ic === ic ? "on" : ""}" onclick="evC('ic','${ic}')">${ic}</button>`).join("")}</div>
      <label class="ev-campo-livre"><span>Resumo (opcional)</span><input value="${esc(ed.resumo)}" placeholder="Uma frase sobre a classe" oninput="evC('resumo',this.value)"></label>

      <h5 class="ev-h">Vida e atributos</h5>
      <span class="ev-mini">Dado de vida</span>
      <div class="ev-seg3">${[6, 8, 10, 12].map((d) => `<button type="button" class="${ed.dv === d ? "on" : ""}" onclick="evC('dv',${d})">d${d}</button>`).join("")}</div>
      <span class="ev-mini">Atributo principal (até 2)</span>${chipsAtr("prim")}
      <span class="ev-mini">Testes de resistência proficientes (2)</span>${chipsAtr("saves")}

      <h5 class="ev-h">Perícias</h5>
      <span class="ev-mini">Quantas o personagem escolhe no 1º nível</span>
      <div class="ev-seg3">${[1, 2, 3, 4].map((n) => `<button type="button" class="${ed.perN === n ? "on" : ""}" onclick="evC('perN',${n})">${n}</button>`).join("")}</div>
      <span class="ev-mini">De quais perícias (nenhuma marcada = qualquer uma)</span>
      <div class="ev-chips2">${PERICIAS_IGNEA.map((x) => `<button type="button" class="${ed.perDe.includes(x) ? "on" : ""}" onclick="evC('perDe','${esc(x)}')">${esc(x)}</button>`).join("")}</div>

      <h5 class="ev-h">Treinamento</h5>
      <label class="ev-campo-livre"><span>Armas</span><input value="${esc(ed.armas)}" placeholder="Ex: Simples e marciais" oninput="evC('armas',this.value)"></label>
      <label class="ev-campo-livre"><span>Armaduras</span><input value="${esc(ed.armaduras)}" placeholder="Ex: Leves, médias e escudos" oninput="evC('armaduras',this.value)"></label>

      <h5 class="ev-h">Magia</h5>
      <div class="ev-seg3"><button type="button" class="${!ed.conj ? "on" : ""}" onclick="evC('conj','')">Nenhuma</button><button type="button" class="${ed.conj === "total" ? "on" : ""}" onclick="evC('conj','total')">Completa</button><button type="button" class="${ed.conj === "meio" ? "on" : ""}" onclick="evC('conj','meio')">Metade</button><button type="button" class="${ed.conj === "pacto" ? "on" : ""}" onclick="evC('conj','pacto')">Pacto</button></div>
      ${ed.conj ? `<p class="ev-p quieto">${ed.conj === "total" ? "Espaços de magia até o 9º círculo, como Mago ou Clérigo." : ed.conj === "meio" ? "Espaços até o 5º círculo, como Paladino ou Patrulheiro." : "Poucos espaços que voltam no descanso curto, como o Bruxo."} O app calcula os espaços sozinho, inclusive na multiclasse.</p><span class="ev-mini">Atributo de conjuração</span><div class="ev-chips2">${["int", "sab", "car"].map((a) => `<button type="button" class="${ed.atrConj === a ? "on" : ""}" onclick="evC('atrConj','${a}')">${ATR_ICO[a]} ${ATR_NOME[a]}</button>`).join("")}</div>` : ""}

      <h5 class="ev-h">Subclasse</h5>
      <label class="ev-campo-livre"><span>Como a subclasse se chama</span><input value="${esc(ed.subNome)}" placeholder="Ex: Caminho, Juramento, Escola" oninput="evC('subNome',this.value)"></label>
      <span class="ev-mini">Níveis com habilidade de subclasse (o primeiro é quando escolhe)</span>
      <div class="ev-chips2 nums">${niveis.map((n) => `<button type="button" class="${ed.subNiveis.includes(n) ? "on" : ""}" onclick="evC('subNiveis',${n})">${n}</button>`).join("")}</div>
      <p class="ev-p quieto">As subclasses dessa classe você cria na hora de escolher, igual às outras: só o nome ou montada nível a nível. Sem nenhum nível marcado, a classe não tem subclasse.</p>

      <h5 class="ev-h">Melhoria de atributo</h5>
      <div class="ev-chips2 nums">${niveis.map((n) => `<button type="button" class="${ed.asi.includes(n) ? "on" : ""}" onclick="evC('asi',${n})">${n}</button>`).join("")}</div>
      <label class="ev-opcao"><input type="checkbox" ${ed.dadiva ? "checked" : ""} onchange="evC('dadiva', this.checked)"><span>Dádiva Épica no nível 19</span></label>

      <h5 class="ev-h">Habilidades por nível</h5>
      <p class="ev-p quieto">Toque num nível pra adicionar o que a classe ganha nele. As habilidades entram na aba 🔥 quando o personagem chega no nível.</p>
      <div class="ev-cc-niveis">${nvHTML}</div>
      <div class="ev-ed-ferr"><button type="button" onclick="evColarAbrir('classe','')"><i class="ti ti-clipboard-text"></i> Colar texto</button><button type="button" onclick="evClasseCodigo()"><i class="ti ti-share"></i> Copiar código</button></div>`;
    const ok = ed.nome.trim();
    rodape(`<button type="button" class="ev-btn-prim cheio" onclick="evClasseSalvar()" ${ok ? "" : ""}><i class="ti ti-check"></i> Salvar classe</button>`);
  }
  function brutoClasse() {
    const x = { ...ed };
    ["alvo", "aberto", "voltarPara", "editando", "imp", "subsPend"].forEach((k) => delete x[k]);
    x.f = limparImp((x.f || []).filter((f) => String(f.nome || "").trim())).map((f) => ({ ...f, n: Number(f.n) }));
    if (!x.prim.length) x.prim = ["for"];
    if (!x.saves.length) x.saves = x.prim.slice(0, 1).concat(["con"]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 2);
    return x;
  }
  window.evClasseSalvar = function () {
    if (!ed.nome.trim()) { const i = $("evCorpo").querySelector(".ev-campo-livre input"); i && i.focus(); $("evCorpo").scrollTop = 0; return; }
    const x = brutoClasse();
    const pend = ed.subsPend || [];
    const lib = bibClasses().filter((c) => c.id !== x.id);
    lib.push(x);
    salvarBibClasses(lib);
    const s = st();
    s.classesCustom = s.classesCustom || {};
    const usa = s.niveis.some((n) => n.c === x.id);
    if (usa || ed.voltarPara === "subir") s.classesCustom[x.id] = x;
    if (pend.length) salvarSubsLidas(x.id, pend, x.subNiveis);
    religarSubs(x, "");
    const msg = pend.length ? `Classe salva com ${pend.length} subclasse${pend.length > 1 ? "s" : ""}!` : null;
    const volta = ed.voltarPara;
    ed = null;
    if (volta === "subir" && fluxo) { fluxo.c = x.id; fluxo.verTodas = true; fluxo.abaCl = "minhas"; tela = "subir"; renderPainel(); toast(msg || "Classe criada!"); return; }
    if (volta === "minhas") { tela = "minhas"; sincronizar(); renderPainel(); toast(msg || "Classe salva!"); return; }
    tela = "visao";
    sincronizar();
    toast(msg || "Classe salva!");
  };
  window.evAbaCl = function (a) { fluxo.abaCl = a; renderPainel(); $("evCorpo").scrollTop = 0; };
  window.evClasseExcluir = async function (id) {
    const c = CL(id);
    if (!c) return;
    const usam = (typeof personagens !== "undefined" ? personagens : []).filter((p) => p && p.progressao && (p.progressao.niveis || []).some((n) => n.c === id)).length;
    const nSubs = biblioteca().filter((x) => x.classe === id).length;
    const msg = `Excluir a classe ${c.nome}${nSubs ? ` e as ${nSubs} subclasse${nSubs > 1 ? "s" : ""} dela` : ""}?` + (usam ? ` ${usam === 1 ? "1 ficha usa" : usam + " fichas usam"} essa classe e ${usam === 1 ? "continua" : "continuam"} com ela; ela só sai da lista.` : " Ela sai da lista deste aparelho.");
    if (typeof confirmBonito === "function" && !(await confirmBonito(msg))) return;
    salvarBibClasses(bibClasses().filter((x) => x.id !== id));
    if (nSubs) salvarBib(biblioteca().filter((x) => x.classe !== id));
    const s = st();
    if (s && s.classesCustom && s.classesCustom[id] && !(s.niveis || []).some((n) => n.c === id)) delete s.classesCustom[id];
    if (fluxo && fluxo.c === id) fluxo.c = "";
    renderPainel();
    toast(`Classe ${c.nome} excluída.`);
  };
  window.evClasseCodigo = async function () {
    const x = brutoClasse();
    const txt = "IGNEA-CLASSE:" + btoa(unescape(encodeURIComponent(JSON.stringify({ ...x, _subs: subsParaCodigo(x.id) }))));
    try { await navigator.clipboard.writeText(txt); toast("Código copiado!"); }
    catch (e) { if (typeof promptBonito === "function") promptBonito("Copie o código da classe:", txt); }
  };
  function subsParaCodigo(cid) {
    return biblioteca().filter((y) => y.classe === cid).map((y) => ({ nome: y.nome, d: y.d || "", f: y.f || [], magias: y.magias || {} }));
  }
  // subclasse "solta" (a classe dela não existe aqui): liga na classe nova se for do mesmo id ou do mesmo nome
  function religarSubs(x, idOriginal) {
    const ids = new Set(todasClasses().map((c) => c.id));
    let mudou = false;
    const bib = biblioteca().map((y) => {
      if (ids.has(y.classe) && y.classe !== idOriginal) return y;
      if (y.classe === x.id) return y;
      const mesmoId = idOriginal && y.classe === idOriginal && !ids.has(idOriginal);
      const mesmoNome = !ids.has(y.classe) && y.classeNome && nomeN(y.classeNome) === nomeN(x.nome);
      if (mesmoId || mesmoNome) { mudou = true; return { ...y, classe: x.id }; }
      return y;
    });
    if (mudou) salvarBib(bib);
  }
  window.evSubMover = function (de, para) {
    if (!para) return;
    salvarBib(biblioteca().map((y) => (y.classe === de ? { ...y, classe: para } : y)));
    renderPainel();
    toast(`Subclasses ligadas a ${CL(para)?.nome || "classe"}!`);
  };
  window.evClasseImportar = async function () {
    const txt = typeof promptBonito === "function" ? await promptBonito("Cole o código da classe:", "") : null;
    if (!txt) return;
    try {
      const x = JSON.parse(decodeURIComponent(escape(atob(txt.trim().replace(/^IGNEA-CLASSE:/, "")))));
      if (!x.nome) throw new Error("vazio");
      const subsCod = Array.isArray(x._subs) ? x._subs : [];
      delete x._subs; delete x._t;
      const lib = bibClasses();
      // mesmo id de quem mandou: subclasses importadas antes (com o código dele) já ficam ligadas a ela
      const original = /^cc_/.test(String(x.id || "")) ? x.id : "";
      const jaTem = original && (lib.some((c) => c.id === original) || CLASSES_IGNEA.some((c) => c.id === original));
      x.id = original && !jaTem ? original : "cc_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      lib.push(x); salvarBibClasses(lib);
      religarSubs(x, original);
      if (subsCod.length) {
        let bib = biblioteca();
        subsCod.forEach((y) => { if (!y || !y.nome) return; bib = bib.filter((z) => !(z.classe === x.id && z.nome === y.nome)); bib.push({ classe: x.id, nome: y.nome, d: y.d || "", f: Array.isArray(y.f) ? y.f : [], magias: y.magias || {} }); });
        salvarBib(bib);
      }
      if (fluxo) { fluxo.c = x.id; fluxo.verTodas = true; fluxo.abaCl = "minhas"; }
      renderPainel();
      const nSub = biblioteca().filter((y) => y.classe === x.id).length;
      toast(`Classe ${x.nome} importada${nSub ? ` com ${nSub} subclasse${nSub > 1 ? "s" : ""}` : ""}!`);
    } catch (e) { if (typeof alertBonito === "function") alertBonito("Esse código não parece ser de uma classe da Ficha Ígnea."); }
  };

  /* ======================= SUAS CRIAÇÕES (engrenagem) ======================= */
  let minhasAba = "classes", minhasVolta = "visao";
  window.evMinhasAbrir = function (aba) {
    if (tela !== "minhas") minhasVolta = tela;
    minhasAba = aba || minhasAba;
    if (!$("evPainel") || !$("evPainel").classList.contains("aberto")) { abrirEvolucao(); minhasVolta = tela; }
    tela = "minhas";
    renderPainel();
    $("evCorpo").scrollTop = 0;
  };
  window.evMinhasAba = function (a) { minhasAba = a; renderPainel(); };
  window.evSubCodigoBib = async function (i, cid) {
    const m = biblioteca().filter((x) => x.classe === cid)[i];
    if (!m) return;
    const txt = "IGNEA-SUB:" + btoa(unescape(encodeURIComponent(JSON.stringify({ classe: cid, classeNome: CL(cid)?.nome || "", nome: m.nome, d: m.d, f: m.f, magias: m.magias || {} }))));
    try { await navigator.clipboard.writeText(txt); toast("Código copiado!"); } catch (e) { if (typeof promptBonito === "function") promptBonito("Copie o código da subclasse:", txt); }
  };
  window.evClasseCodigoId = async function (id) {
    const c = CL(id);
    if (!c || !c.bruto) return;
    const txt = "IGNEA-CLASSE:" + btoa(unescape(encodeURIComponent(JSON.stringify({ ...c.bruto, _subs: subsParaCodigo(id) }))));
    try { await navigator.clipboard.writeText(txt); toast("Código copiado!"); } catch (e) { if (typeof promptBonito === "function") promptBonito("Copie o código da classe:", txt); }
  };
  function renderMinhas() {
    $("evTitulo").textContent = "Suas criações";
    $("evVoltar").style.visibility = "visible";
    const classes = todasClasses().filter((c) => c.custom);
    const subs = biblioteca();
    const porCl = {};
    subs.forEach((x) => { (porCl[x.classe] = porCl[x.classe] || []).push(x); });
    const acao = (ic, txt, fn, cls) => `<button type="button" class="${cls || ""}" onclick="${fn}"><i class="ti ti-${ic}"></i> ${txt}</button>`;
    let h = `<div class="ev-seg3 ev-minhas-abas">
      <button type="button" class="${minhasAba === "classes" ? "on" : ""}" onclick="evMinhasAba('classes')">Classes (${classes.length})</button>
      <button type="button" class="${minhasAba === "subs" ? "on" : ""}" onclick="evMinhasAba('subs')">Subclasses (${subs.length})</button>
    </div>`;
    if (minhasAba === "classes") {
      h += classes.length ? classes.map((c) => {
        const nSub = (porCl[c.id] || []).length;
        return `<div class="ev-minha">
          <div class="ev-op ev-minha-info"><span class="ev-op-topo"><b><i class="ev-cl-ic">${icDe(c)}</i>${esc(c.nome)}</b><small>d${c.dv} · ${c.prim.map((k) => ATR_NOME[k]).join(" e ")}</small></span>
            <span class="ev-op-txt">${c.f.filter((f) => !f.asi).length} habilidades · ${nSub} subclasse${nSub === 1 ? "" : "s"}${c.conj ? " · conjura" : ""}</span></div>
          <div class="ev-minha-acoes">${acao("pencil", "Editar", `evClasseEditar('${c.id}','minhas')`)}${acao("share", "Código", `evClasseCodigoId('${c.id}')`)}${acao("trash", "Excluir", `evClasseExcluir('${c.id}')`, "perigo")}</div>
        </div>`;
      }).join("") : `<p class="ev-p quieto">Você ainda não criou nenhuma classe.</p>`;
      h += `<div class="ev-tres">
        <button type="button" onclick="evClasseNova()"><i class="ti ti-pencil-plus"></i><span>Criar do zero</span></button>
        ${typeof window.lerTextoColado === "function" ? `<button type="button" onclick="evColarAbrir('classe','')"><i class="ti ti-clipboard-text"></i><span>Colar texto</span></button>` : ""}
        <button type="button" onclick="evClasseImportar()"><i class="ti ti-download"></i><span>Por código</span></button>
      </div>`;
    } else {
      const daFicha = ativo() ? Object.keys(porClasse()) : [];
      const ids = [...new Set(daFicha.concat(Object.keys(porCl)))];
      h += `<p class="ev-p quieto">Não achou a subclasse que queria? Crie ou cole o texto na classe certa e ela aparece pra escolher quando chegar no nível.</p>`;
      h += ids.length ? ids.map((cid) => {
        const c = CL(cid);
        const lista = porCl[cid] || [];
        const orfa = !c ? `<div class="ev-orfa"><p class="ev-p quieto">${lista[0] && lista[0].classeNome ? `Eram da classe <b>${esc(lista[0].classeNome)}</b>, que não está mais aqui. ` : "A classe dessas subclasses não está mais aqui (foi apagada ou importada de novo). "}Ligue a uma classe pra elas aparecerem na hora de escolher:</p><select onchange="evSubMover('${esc(cid)}', this.value)"><option value="">Ligar à classe…</option>${todasClasses().map((k) => `<option value="${esc(k.id)}">${esc(k.nome)}${k.custom ? " (sua)" : ""}</option>`).join("")}</select></div>` : "";
        return `<div class="ev-sub-grupo"><h5 class="ev-h">${c ? `${icDe(c)} ${esc(c.nome)}` : "Subclasses sem classe"}${daFicha.includes(cid) ? ` <small class="ev-sua">sua ficha</small>` : ""}</h5>${orfa}
          ${c ? `<div class="ev-sub-novas"><button type="button" onclick="evCriarSub('${cid}')"><i class="ti ti-pencil-plus"></i> Criar subclasse</button>${typeof window.lerTextoColado === "function" ? `<button type="button" onclick="evColarAbrir('sub','${cid}')"><i class="ti ti-clipboard-text"></i> Colar texto</button>` : ""}</div>` : ""}</div>` + (lista.length ? "" : `<p class="ev-p quieto">Nenhuma subclasse criada pra ${c ? esc(c.nome) : "essa classe"} ainda.</p>`) + lista.map((m, i) => `<div class="ev-minha">
          <div class="ev-op ev-minha-info"><span class="ev-op-topo"><b>${esc(m.nome)}</b><small>${(m.f || []).length} habilidade${(m.f || []).length === 1 ? "" : "s"}</small></span>
            <span class="ev-op-txt">${listaCurta((m.f || []).map((f) => f.nome))}</span></div>
          <div class="ev-minha-acoes">${c ? acao("pencil", "Editar", `evSubEditarBib(${i}, '${cid}')`) : ""}${acao("share", "Código", `evSubCodigoBib(${i}, '${cid}')`)}${acao("trash", "Excluir", `evSubExcluir(${i}, '${cid}')`, "perigo")}</div>
        </div>`).join("");
      }).join("") : `<p class="ev-p quieto">Escolha uma classe na Evolução primeiro: aí dá pra criar ou colar subclasses pra ela aqui.</p>`;
    }
    $("evCorpo").innerHTML = h;
    rodape("");
  }

  /* ======================= COLAR TEXTO ======================= */
  let colar = null;
  function colarCardHTML(alvo, cid) {
    if (typeof window.lerTextoColado !== "function") return "";
    const sub = alvo === "sub";
    return `<button type="button" class="ev-op ev-colar" onclick="evColarAbrir('${alvo}','${cid}')">
      <span class="ev-op-topo"><b>📋 Colar texto</b><small>texto</small></span>
      <span class="ev-op-txt">Cole o texto ${sub ? "da subclasse" : "da classe"}: anotação sua, mensagem do grupo, site… O app separa as habilidades por nível e você confere antes de salvar.</span>
    </button>`;
  }
  window.evColarAbrir = function (alvo, cid) {
    colar = { alvo, cid, txt: "", volta: tela, edAntes: ed, fluxoVolta: fluxo && fluxo.voltarPara };
    tela = "colar";
    renderPainel();
    $("evCorpo").scrollTop = 0;
  };
  function renderColar() {
    const sub = colar.alvo === "sub", c = sub ? CL(colar.cid) : null;
    $("evTitulo").textContent = "Colar texto";
    $("evVoltar").style.visibility = "visible";
    $("evCorpo").innerHTML = `
      <p class="ev-p">${sub ? `Subclasse de <b>${esc(c.nome)}</b>. ` : ""}Cole o texto ${sub ? "da subclasse" : "da classe (com a tabela, se tiver)"} de uma vez: anotação, mensagem do grupo, site, documento…</p>
      <textarea id="evColarTxt" class="ev-colar-txt" placeholder="${sub ? "Trilha do Lobo Cinzento\nNível 3 - Uivo: criaturas hostis a 9 m…\nNível 7 - Matilha: …" : "Dado de Vida: d10\nTestes de Resistência: Força e Constituição\nNível 1: …"}" oninput="evColarTxt(this.value)">${esc(colar.txt)}</textarea>
      <div class="ev-colar-dicas">
        ${typeof window.ajudaColarHTML === "function" ? `<div class="ev-colar-ex"><span>Ver exemplos que funcionam</span>${window.ajudaColarHTML("classe", "evColarTxt")}</div>` : ""}
        <p><b>Dá certo com</b> "Nível 3: Nome", "Nível 3 - Nome: o que faz", "Nome (nível 3)", uma lista embaixo de "Nível 3" ou texto que começa com "A partir do 3º nível". Em inglês também.</p>
        <p><b>Pode vir bagunçado:</b> horário e nome de quem mandou a mensagem, *negrito*, emoji, número de página e linha quebrada no meio da frase o app limpa sozinho.</p>
        <p><b>O que não tiver certeza</b> fica marcado em dourado pra você conferir.</p>
      </div>`;
    rodape(`<button type="button" class="ev-btn-prim cheio" id="evColarBtn" onclick="evColarLer()" ${colar.txt.trim().length > 20 ? "" : "disabled"}><i class="ti ti-wand"></i> Ler texto</button>`);
  }
  window.evColarTxt = function (v) {
    colar.txt = v;
    const b = $("evColarBtn");
    if (b) b.disabled = v.trim().length <= 20;
  };
  window.evColarLer = function () {
    const sub = colar.alvo === "sub";
    const r = window.lerTextoColado(colar.txt, sub ? "sub" : "classe");
    const temCampos = Object.keys(r.campos).length;
    if (!r.f.length && !temCampos && !Object.keys(r.magias || {}).length && !(r.subs && r.subs.length)) {
      if (typeof alertBonito === "function") alertBonito("Não consegui achar as habilidades nesse texto. Confira se colou os títulos junto (tipo \"Nível 3: Nome\") ou monte na mão pelo editor.");
      return;
    }
    const imp = { total: r.f.length, achados: r.achados, outraSub: r.outraSub };
    if (sub && r.subs && r.subs.length > 1) {
      // o texto tinha várias subclasses: a pessoa escolhe qual
      colar.opcoes = r.subs;
      $("evCorpo").innerHTML = `
        <p class="ev-p">Achei <b>${r.subs.length} subclasses</b> nesse texto. Qual você quer?</p>
        ${r.subs.map((x, i) => `<button type="button" class="ev-op" onclick="evColarEscolher(${i})"><span class="ev-op-topo"><b>${esc(x.nome || "Sem nome")}</b><small>${x.f.length} habilidade${x.f.length === 1 ? "" : "s"}</small></span><span class="ev-op-txt">${esc(resumoCurto(x.d, 120))}${x.d ? " " : ""}${listaCurta(x.f.map((f) => f.nome))}</span></button>`).join("")}
        <p class="ev-p quieto">Toque numa pra revisar antes, ou salve todas de uma vez: elas aparecem na lista pra escolher.</p>`;
      rodape(`<button type="button" class="ev-btn-prim cheio" onclick="evColarTodas()"><i class="ti ti-checks"></i> Salvar as ${r.subs.length}</button>`);
      $("evCorpo").scrollTop = 0;
      return;
    }
    if (sub) abrirSubLida(r, imp);
    else if (r.naoClasse) abrirSoSubclasses(r);
    else abrirClasseLida(r, imp);
  };
  // texto de suplemento (Tasha, Xanathar…): só subclasses, sem a classe inteira
  function abrirSoSubclasses(r) {
    const n0 = String(r.nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const cl = todasClasses().concat(CLASSES_IGNEA.filter((c) => !todasClasses().some((x) => x.id === c.id)));
    const palpite = cl.find((c) => c.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === n0);
    colar.soSubs = { subs: r.subs, sel: r.subs.map(() => true), cid: palpite ? palpite.id : "" };
    renderSoSubs();
  }
  function renderSoSubs() {
    const x = colar.soSubs;
    const lista = CLASSES_IGNEA.concat(todasClasses().filter((c) => c.custom));
    $("evTitulo").textContent = "O que achei";
    $("evCorpo").innerHTML = `
      <div class="ev-lido"><b>📋 Subclasses no texto</b><p>Esse texto não traz uma classe inteira, só <b>${x.subs.length} subclasse${x.subs.length > 1 ? "s" : ""}</b>. Elas entram na classe que você escolher e aparecem pra escolher quando o personagem chegar no nível.</p></div>
      <h5 class="ev-h">De qual classe?</h5>
      <div class="ev-chips2">${lista.map((c) => `<button type="button" class="${x.cid === c.id ? "on" : ""}" onclick="evSoSubsClasse('${c.id}')">${icDe(c)} ${esc(c.nome)}</button>`).join("")}</div>
      <h5 class="ev-h">Subclasses</h5>
      ${x.subs.map((s0, i) => `<button type="button" class="ev-op ev-lido-sub ${x.sel[i] ? "on" : ""}" onclick="evSoSubsToggle(${i})">
        <span class="ev-op-topo"><b><i class="ev-check">${x.sel[i] ? "✓" : ""}</i>${esc(s0.nome || "Sem nome")}</b><small>${s0.f.length} habilidade${s0.f.length === 1 ? "" : "s"}</small></span>
        <span class="ev-op-txt">${listaCurta(s0.f.map((f) => f.nome))}</span>
      </button>`).join("")}`;
    const n = x.sel.filter(Boolean).length;
    rodape(`<button type="button" class="ev-btn-prim cheio" onclick="evSoSubsSalvar()" ${x.cid && n ? "" : "disabled"}><i class="ti ti-check"></i> ${x.cid ? `Salvar ${n} em ${esc(CL(x.cid).nome)}` : "Escolha a classe"}</button>`);
  }
  window.evSoSubsClasse = function (cid) { colar.soSubs.cid = cid; const y = $("evCorpo").scrollTop; renderSoSubs(); $("evCorpo").scrollTop = y; };
  window.evSoSubsToggle = function (i) { colar.soSubs.sel[i] = !colar.soSubs.sel[i]; const y = $("evCorpo").scrollTop; renderSoSubs(); $("evCorpo").scrollTop = y; };
  window.evSoSubsSalvar = function () {
    const x = colar.soSubs, c = CL(x.cid);
    if (!c) return;
    const subs = x.subs.filter((s0, i) => x.sel[i]);
    salvarSubsLidas(c.id, subs, c.subNiveis);
    tela = colar.volta === "colar" ? "visao" : colar.volta;
    if (tela === "subir" && fluxo) fluxo.abaCl = fluxo.abaCl || "jogo";
    ed = colar.volta === "editorClasse" ? colar.edAntes : null;
    colar = null;
    renderPainel();
    toast(`${subs.length} subclasse${subs.length > 1 ? "s" : ""} salva${subs.length > 1 ? "s" : ""} em ${c.nome}!`);
  };
  window.evColarTodas = function () {
    const c = CL(colar.cid);
    salvarSubsLidas(colar.cid, colar.opcoes, c.subNiveis);
    const n = colar.opcoes.length;
    tela = colar.volta === "editorSub" ? "trocarSub" : colar.volta;
    if (tela === "trocarSub" && fluxo) fluxo.c = colar.cid;
    ed = colar.volta === "editorSub" ? null : colar.edAntes;
    colar = null;
    renderPainel();
    toast(`${n} subclasses salvas!`);
  };
  window.evColarEscolher = function (i) {
    const x = colar.opcoes[i];
    if (!x) return;
    abrirSubLida({ ...x, achados: [] }, { total: x.f.length, achados: Object.keys(x.magias || {}).length ? [`${Object.values(x.magias).flat().length} magias`] : [], outraSub: false });
  };
  function abrirSubLida(r, imp) {
    {
      const c = CL(colar.cid), nv = c.subNiveis.length ? c.subNiveis : [3];
      r.f.forEach((f) => {
        if (nv.includes(f.n)) return;
        const abaixo = nv.filter((n) => n <= f.n);
        f.n = abaixo.length ? abaixo[abaixo.length - 1] : nv[0];
        f.duvida = true;
      });
      const magias = {};
      Object.entries(r.magias || {}).forEach(([n, l]) => { magias[n] = l.map((m) => { const x = catMagia(m); return x ? x.nome : m; }); });
      const antes = colar.edAntes && colar.volta === "editorSub" ? colar.edAntes : null;
      ed = { cid: colar.cid, nome: r.nome || (antes && antes.nome) || "", d: r.d || (antes && antes.d) || "", f: r.f, magias, imp };
      if (!fluxo) fluxo = {};
      fluxo.voltarPara = colar.volta === "editorSub" ? colar.fluxoVolta : colar.volta;
      tela = "editorSub";
    }
    colar = null;
    renderPainel();
    $("evCorpo").scrollTop = 0;
  }
  function baseClasseLida(r, imp) {
    const antes = colar.volta === "editorClasse" ? colar.edAntes : null;
    const base = antes ? { ...antes } : { ...novaClasseVazia(), voltarPara: colar.volta };
    Object.entries(r.campos).forEach(([k, v]) => { if (v !== undefined && v !== null && !(Array.isArray(v) && !v.length)) base[k] = v; });
    if (r.nome) base.nome = r.nome;
    if (!antes) {
      // resumo com o que a classe faz (o texto de abertura costuma ser história, não resumo)
      const cj = { total: "Conjurador", meio: "Meio conjurador", pacto: "Magia de pacto" }[base.conj];
      base.resumo = [cj ? `${cj} (${ATR_NOME[base.atrConj] || ""})` : "", r.f.slice(0, 3).map((f) => f.nome).join(", ")].filter(Boolean).join(" · ").slice(0, 140);
    }
    base.f = r.f;
    base.imp = imp;
    base.aberto = 0;
    return base;
  }
  // classe lida: mostra tudo que achou (classe + subclasses) antes de salvar
  function abrirClasseLida(r, imp) {
    colar.lida = { r, imp, sel: (r.subs || []).map(() => true) };
    renderResumoLido();
  }
  function renderResumoLido() {
    const { r, imp, sel } = colar.lida;
    const subs = r.subs || [];
    const duv = r.f.filter((f) => f.duvida).length;
    $("evTitulo").textContent = "O que achei";
    $("evCorpo").innerHTML = `
      <div class="ev-lido">
        <b>⚜️ ${esc(r.nome || "Classe sem nome")}</b>
        <p>${r.f.length} habilidade${r.f.length === 1 ? "" : "s"}${imp.achados.length ? ", " + esc(imp.achados.join(", ")) : ""}.${duv ? ` <span class="ev-lido-duv">${duv} pra conferir.</span>` : ""}</p>
        <div class="ev-lido-nv">${r.f.map((f) => `<span><i>${f.n}</i>${esc(f.nome)}</span>`).join("")}</div>
      </div>
      <h5 class="ev-h">Subclasses no texto</h5>
      ${subs.length ? `<p class="ev-p quieto">Desmarque as que não quiser. As marcadas ficam prontas pra escolher quando o personagem chegar no nível.</p>
        ${subs.map((x, i) => `<button type="button" class="ev-op ev-lido-sub ${sel[i] ? "on" : ""}" onclick="evLidoSub(${i})">
          <span class="ev-op-topo"><b><i class="ev-check">${sel[i] ? "✓" : ""}</i>${esc(x.nome || "Sem nome")}</b><small>${x.f.length} habilidade${x.f.length === 1 ? "" : "s"}</small></span>
          <span class="ev-op-txt">${listaCurta(x.f.map((f) => f.nome))}</span>
        </button>`).join("")}`
        : `<p class="ev-p quieto">Não veio nenhuma subclasse no texto. Dá pra colar depois, na hora de escolher.</p>`}`;
    const n = sel.filter(Boolean).length;
    rodape(`
      <button type="button" class="ev-btn-sec" onclick="evLidoRevisar()"><i class="ti ti-pencil"></i> Revisar</button>
      <button type="button" class="ev-btn-prim" onclick="evLidoSalvar()"><i class="ti ti-check"></i> Salvar ${n ? `classe + ${n}` : "classe"}</button>`);
    $("evCorpo").scrollTop = 0;
  }
  window.evLidoSub = function (i) { colar.lida.sel[i] = !colar.lida.sel[i]; renderResumoLido(); };
  function prepararLido() {
    const { r, imp, sel } = colar.lida;
    const base = baseClasseLida(r, imp);
    base.subsPend = (r.subs || []).filter((x, i) => sel[i]);
    colar = null;
    ed = base;
  }
  window.evLidoRevisar = function () {
    prepararLido();
    tela = "editorClasse";
    renderPainel();
    $("evCorpo").scrollTop = 0;
  };
  window.evLidoSalvar = function () {
    prepararLido();
    if (!String(ed.nome || "").trim()) { tela = "editorClasse"; renderPainel(); return; }
    evClasseSalvar();
  };
  // guarda as subclasses lidas na biblioteca, já encaixadas nos níveis de subclasse da classe
  function salvarSubsLidas(cid, subs, niveis) {
    const nv = (niveis || []).map(Number).sort((a, b) => a - b);
    const lista = nv.length ? nv : [3];
    let lib = biblioteca();
    subs.forEach((x) => {
      const f = limparImp(x.f).map((h) => {
        let n = Number(h.n) || lista[0];
        if (!lista.includes(n)) { const ab = lista.filter((k) => k <= n); n = ab.length ? ab[ab.length - 1] : lista[0]; }
        return { ...h, n };
      });
      const magias = {};
      Object.entries(x.magias || {}).forEach(([n, l]) => { magias[n] = l.map((m) => { const c = catMagia(m); return c ? c.nome : m; }); });
      const nome = (x.nome || "Subclasse").trim();
      lib = lib.filter((y) => !(y.classe === cid && y.nome === nome));
      lib.push({ classe: cid, classeNome: CL(cid)?.nome || "", nome, d: x.d || "", f, magias });
    });
    salvarBib(lib);
  }
  function bannerImport() {
    if (!ed || !ed.imp) return "";
    const duv = ed.f.filter((f) => f.duvida).length;
    const extra = ed.imp.achados && ed.imp.achados.length ? `, ${ed.imp.achados.join(", ")}` : "";
    return `<div class="ev-lido">
      <b>📋 Texto lido</b>
      <p>Achei <b>${ed.imp.total} habilidade${ed.imp.total === 1 ? "" : "s"}</b>${esc(extra)}. ${duv ? `<span class="ev-lido-duv">${duv} marcada${duv > 1 ? "s" : ""} em dourado pra conferir.</span>` : "Tudo encaixado, só dar uma olhada."}</p>
      ${ed.subsPend && ed.subsPend.length ? `<p class="quieto">Junto com a classe vão ser salvas as subclasses: <b>${esc(ed.subsPend.map((x) => x.nome).join(", "))}</b>.</p>` : ""}
      <p class="quieto">Dá pra trocar o nível, juntar duas que vieram separadas ou remover o que veio errado.</p>
    </div>`;
  }

  /* ======================= DOMÍNIOS (Vinicius Edney e Giovany Queiroz) ======================= */
  const DOMS = () => window.DOMINIOS_IGNEA || [];
  const DOM = (id) => DOMS().find((d) => d.id === id) || null;
  // regra opcional: só vale pra quem liga (ou se o mestre escreveu nas regras da mesa)
  const dominiosLigados = () => { const s = st(); return !!(s && DOMS().length && (s.usaDominio || s.dominio || regra("dominios"))); };
  const dominioPendente = () => !!(dominiosLigados() && ativo() && total() >= 3 && (!st().dominio || ultPendente()));
  // os Pontos de Domínio da aba ⚔️ ficam sempre à vista (do jeito de antes); a regra só mexe na Evolução
  function visDominio() {
    const b = document.querySelector('#combate .cb2-est[onclick*="dominio"]');
    if (b) b.hidden = false;
    const box = b && b.parentElement;
    if (box) box.classList.remove("sem-dominio");
  }
  window.evUsaDominio = function (v) {
    const s = st();
    if (!v && s.dominio) { toast("Troque ou tire o domínio antes de desligar"); renderPainel(); return; }
    s.usaDominio = !!v;
    visDominio();
    salvarFicha();
    renderPainel();
  };
  let fd = null; // escolha em andamento
  const custoTxt = "gasta 1 Ponto de Domínio";
  function dominioCardHTML() {
    if (!DOMS().length || !ativo() || !dominiosLigados()) return "";
    const x = st().dominio, d = x && DOM(x.id);
    const autores = `<small class="ev-dom-autor">Sistema criado por ${esc(window.DOMINIOS_AUTORES || "")}</small>`;
    if (!d) {
      const libera = total() >= 3;
      return `
      <section class="ev-raca ev-dom ${libera ? "pendente" : "quieto"}">
        <div class="ev-classe-topo"><div><h4>🜂 Domínio</h4><p>${libera ? "Você chegou no nível 3: escolha o seu Domínio (Corpo, Mente ou Alma). Ele dá +1 num atributo, três habilidades e os Pontos de Domínio." : "Corpo, Mente ou Alma: você escolhe no nível 3."}</p>${autores}</div></div>
        ${libera ? `<button type="button" class="ev-btn-prim ev-ant-btn" onclick="evDomAbrir()">Escolher domínio</button>` : ""}
      </section>`;
    }
    return `
      <section class="ev-raca ev-dom d-${d.id}">
        <div class="ev-classe-topo"><div><h4>${d.ic} ${esc(d.nome)}</h4><p>${esc(d.d)}</p>${autores}</div></div>
        <div class="ev-traços">
          ${x.atr ? `<p><b>Atributo</b> +1 ${ATR_NOME[x.atr]}</p>` : ""}
          ${d.p.map((h) => `<p><b>${esc(h.nome)}</b> <small>${esc(h.tipo)}</small><br>${esc(h.d)}</p>`).join("")}
          ${d.ext ? `<p class="ev-dom-ext-t ${total() >= d.ext.nivel ? "" : "trancada"}">${total() >= d.ext.nivel ? "Extensão" : `🔒 Extensão no nível ${d.ext.nivel}`}</p>
          ${d.ext.p.map((h) => `<p class="${total() >= d.ext.nivel ? "" : "trancada"}"><b>${esc(h.nome)}</b> <small>${esc(h.tipo)}</small><br>${esc(h.d)}</p>`).join("")}` : ""}
          ${d.ult ? (r => r.ult
            ? `<p class="ev-dom-ext-t">Nível ${d.ult.nivel} · escolhida</p><p><b>${esc(r.ult.nome)}</b><br>${esc((d.ult.p.find((h) => h.nome === r.ult.nome) || {}).d || "")}</p><button type="button" class="ev-mais" onclick="evDomUlt()">Trocar a do nível ${d.ult.nivel}</button>`
            : total() >= d.ult.nivel ? `<button type="button" class="ev-btn-prim ev-ant-btn" onclick="evDomUlt()">Nível ${d.ult.nivel}: escolher 1 habilidade</button>`
            : `<p class="ev-dom-ext-t trancada">🔒 Nível ${d.ult.nivel}: escolha 1 entre ${d.ult.p.map((h) => esc(h.nome)).join(", ")}</p>`)(x) : ""}
          <p class="quieto">Pontos de Domínio: ${pb()} (o seu bônus de proficiência), na aba ⚔️. Voltam no descanso longo. Usar três antes de descansar dá 1 de exaustão.</p>
        </div>
        <button type="button" class="ev-btn-sec ev-ant-btn" onclick="evDomTrocar()">Trocar domínio</button>
      </section>`;
  }
  window.evDomAbrir = function () { fd = { id: "", atr: "" }; tela = "dominio"; renderPainel(); $("evCorpo").scrollTop = 0; };
  window.evDomTrocar = async function () {
    if (typeof confirmBonito === "function" && !(await confirmBonito("Trocar o domínio? O +1 no atributo e as três habilidades saem da ficha."))) return;
    desfazerDominio();
    sincronizar();
    evDomAbrir();
  };
  window.evDom = function (k, v) {
    if (k === "id") { fd = { id: v, atr: "" }; const d = DOM(v); if (d && d.atrs.length === 1) fd.atr = d.atrs[0]; }
    else fd[k] = fd[k] === v ? "" : v;
    renderPainel();
    if (k === "id") setTimeout(() => { const g = $("evCorpo").querySelector(".ev-atrs"); if (g) g.scrollIntoView({ block: "center", behavior: "smooth" }); }, 60);
  };
  function renderDominioEscolha() {
    $("evTitulo").textContent = "Domínio";
    $("evVoltar").style.visibility = "visible";
    const tipoIc = (t) => (/prolong/i.test(t) ? "⏳" : "⚡");
    let h = `<p class="ev-p">${esc(window.DOMINIOS_REGRAS || "")}</p>
      <p class="ev-dom-credito">Sistema criado por <b>${esc(window.DOMINIOS_AUTORES || "")}</b></p>`;
    h += DOMS().map((d) => `
      <button type="button" class="ev-dom-op d-${d.id} ${fd.id === d.id ? "on" : ""}" onclick="evDom('id','${d.id}')">
        <span class="ev-dom-cab"><span class="ev-dom-ic">${d.ic}</span><span><b>${esc(d.nome)}</b><small>${esc(d.d)}</small></span></span>
        <span class="ev-dom-atr">+1 em ${d.atrs.length === 6 ? "qualquer atributo" : d.atrs.map((k) => ATR_NOME[k]).join(", ")}</span>
        ${d.p.map((x) => `<span class="ev-dom-hab"><em>${tipoIc(x.tipo)} ${esc(x.tipo)}</em><b>${esc(x.nome)}</b><small>${esc(resumoCurto(x.d, 110))}</small></span>`).join("")}
        ${d.ext ? `<span class="ev-dom-ext"><em>No nível ${d.ext.nivel}</em>${d.ext.p.map((x) => `${tipoIc(x.tipo)} ${esc(x.nome)}`).join(" · ")}</span>` : ""}
        ${d.ult ? `<span class="ev-dom-ext"><em>No nível ${d.ult.nivel}, escolha 1</em>${d.ult.p.map((x) => `${tipoIc(x.tipo)} ${esc(x.nome)}`).join(" · ")}</span>` : ""}
      </button>`).join("");
    const d = DOM(fd.id);
    if (d) {
      h += `<h5 class="ev-h">+1 em qual atributo?</h5>
        <div class="ev-atrs">${d.atrs.map((k) => {
          const v = atrVal(k), on = fd.atr === k, novo = Math.min(20, v + (on ? 1 : 0)), cheio = v >= 20;
          return `<button type="button" class="ev-atr ${on ? "on" : ""}" ${cheio && !on ? "disabled" : ""} onclick="evDom('atr','${k}')"><span class="ev-atr-ic">${ATR_ICO[k]}</span><small>${ATR_NOME[k]}</small><span class="ev-atr-val">${on ? `${v}<i>→</i><b>${novo}</b>` : `<b>${v}</b>`}</span><span class="ev-atr-mod">${sinal(Math.floor((novo - 10) / 2))}</span>${on ? "<em>+1</em>" : cheio ? `<em class="max">máx.</em>` : ""}</button>`;
        }).join("")}</div>
        <p class="ev-p quieto">As três habilidades vão pra aba 🔥 e os Pontos de Domínio (${pb()}) ficam na aba ⚔️, em Domínio.</p>`;
    }
    $("evCorpo").innerHTML = h;
    const falta = !d ? "Escolha um domínio" : !fd.atr ? "Falta escolher o atributo" : "";
    rodape(falta ? `<button type="button" class="ev-btn-prim cheio ev-falta" onclick="evDomFalta()">${falta}</button>` : `<button type="button" class="ev-btn-prim cheio" onclick="evDomAplicar()"><i class="ti ti-check"></i> Ficar com o ${esc(d.nome)}</button>`);
  }
  window.evDomFalta = function () { const a = $("evCorpo").querySelector(fd.id ? ".ev-atrs" : ".ev-dom-op"); if (a) { a.scrollIntoView({ block: "center", behavior: "smooth" }); a.classList.remove("ev-pisca"); void a.offsetWidth; a.classList.add("ev-pisca"); } };
  window.evDomAplicar = function () {
    const d = DOM(fd.id);
    if (!d || !fd.atr) return;
    const s = st(), reg = { id: d.id, atr: fd.atr, delta: 0, pod: [] };
    const el = $(ATR[fd.atr]);
    if (el) { const v = parseInt(el.value) || 10, novo = Math.min(20, v + 1); reg.delta = novo - v; el.value = novo; }
    d.p.forEach((h) => reg.pod.push(poderDominio(d, h, "")));
    s.dominio = reg;
    acertarPontosDominio();
    fd = null;
    tela = "visao";
    sincronizar();
    toast(`${d.nome} escolhido!`);
  };
  function poderDominio(d, h, extra) {
    const id = "pw_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const prol = /prolong/i.test(h.tipo);
    const custo = h.custo > 1 ? `gasta ${h.custo} Pontos de Domínio` : custoTxt;
    const longo = h.recarga === "longo";
    poderes.push({ id, nome: h.nome, circulo: "", acao: h.a, recarga: longo ? "longo" : "", origem: "", tipo: "", dano: h.dano || "", alcance: "", duracao: prol ? "1 minuto" : "Instantânea", tempo: "",
      desc: `${d.nome}${extra} · ${h.tipo}${prol ? " (1 minuto, só uma Prolongada por vez)" : ""} · ${custo}\n\n${h.d}`, temCargas: longo, maxCargas: longo ? 1 : 0, cargasGastas: longo ? [false] : [], componentes: {}, icone: d.ic, _dom: d.id });
    return id;
  }
  // nível 12: escolhe 1 das 3 da sua linha
  const ultPendente = () => { const s = st(), r = s && s.dominio, d = r && DOM(r.id); return !!(d && d.ult && total() >= d.ult.nivel && !r.ult); };
  let fu = null;
  window.evDomUlt = function () { fu = { nome: "" }; tela = "dominioUlt"; renderPainel(); $("evCorpo").scrollTop = 0; };
  window.evDomUltEsc = function (nome) { fu.nome = nome; renderPainel(); };
  function renderDominioUlt() {
    const r = st().dominio, d = DOM(r && r.id);
    $("evTitulo").textContent = d ? d.nome : "Domínio";
    $("evVoltar").style.visibility = "visible";
    if (!d || !d.ult) { tela = "visao"; return renderPainel(); }
    const tipoIc = (t) => (/prolong/i.test(t) ? "⏳" : "⚡");
    $("evCorpo").innerHTML = `
      <p class="ev-p">Nível ${d.ult.nivel}: o auge do ${esc(d.nome)}. Escolha <b>uma</b> destas habilidades.</p>
      <p class="ev-dom-credito">Sistema criado por <b>${esc(window.DOMINIOS_AUTORES || "")}</b></p>
      ${d.ult.p.map((h) => `
        <button type="button" class="ev-dom-op d-${d.id} ${fu.nome === h.nome ? "on" : ""}" onclick="evDomUltEsc('${esc(h.nome).replace(/'/g, "\\'")}')">
          <span class="ev-dom-hab"><em>${tipoIc(h.tipo)} ${esc(h.tipo)} · ${h.custo || 1} ponto${(h.custo || 1) > 1 ? "s" : ""}${h.recarga === "longo" ? " · 1 por descanso longo" : ""}</em><b>${esc(h.nome)}</b><small>${esc(h.d)}</small></span>
        </button>`).join("")}`;
    rodape(fu.nome ? `<button type="button" class="ev-btn-prim cheio" onclick="evDomUltAplicar()"><i class="ti ti-check"></i> Ficar com ${esc(fu.nome)}</button>` : `<button type="button" class="ev-btn-prim cheio" disabled>Escolha uma habilidade</button>`);
  }
  window.evDomUltAplicar = function () {
    const r = st().dominio, d = DOM(r && r.id), h = d && d.ult && d.ult.p.find((x) => x.nome === fu.nome);
    if (!h) return;
    if (r.ult) for (let i = poderes.length - 1; i >= 0; i--) if (poderes[i] && poderes[i].id === r.ult.id) poderes.splice(i, 1);
    r.ult = { nome: h.nome, id: poderDominio(d, h, ` (nível ${d.ult.nivel})`) };
    fu = null;
    tela = "visao";
    sincronizar();
    toast(`${h.nome} na aba 🔥`);
  };
  // extensão do nível 6: entra sozinha quando o personagem chega lá (e sai se desfizer o nível)
  function sincronizarExtensao() {
    const s = st(), r = s && s.dominio, d = r && DOM(r.id);
    if (!d || !d.ext || typeof poderes === "undefined") return false;
    const tem = Array.isArray(r.ext) && r.ext.length;
    if (total() >= d.ext.nivel && !tem) {
      r.ext = d.ext.p.map((h) => poderDominio(d, h, ` (nível ${d.ext.nivel})`));
      setTimeout(() => toast(`Nível ${d.ext.nivel}: extensão do ${d.nome} na aba 🔥`), 400);
      return true;
    }
    if (total() < d.ext.nivel && tem) {
      for (let i = poderes.length - 1; i >= 0; i--) if (poderes[i] && r.ext.includes(poderes[i].id)) poderes.splice(i, 1);
      r.ext = [];
      return true;
    }
    if (r.ult && d.ult && total() < d.ult.nivel) {
      for (let i = poderes.length - 1; i >= 0; i--) if (poderes[i] && poderes[i].id === r.ult.id) poderes.splice(i, 1);
      r.ult = null;
      return true;
    }
    return false;
  }
  function desfazerDominio() {
    const s = st(), r = s && s.dominio;
    if (!r) return;
    if (r.delta && r.atr) { const el = $(ATR[r.atr]); if (el) el.value = (parseInt(el.value) || 10) - r.delta; }
    const ids = (r.pod || []).concat(r.ext || []).concat(r.ult ? [r.ult.id] : []);
    for (let i = poderes.length - 1; i >= 0; i--) if (poderes[i] && ids.includes(poderes[i].id)) poderes.splice(i, 1);
    s.dominio = null;
  }
  // Pontos de Domínio = bônus de proficiência (os gastos continuam gastos)
  function acertarPontosDominio() {
    const s = st();
    if (!s || !s.dominio || typeof dominio === "undefined") return;
    const n = pb();
    if (Array.isArray(dominio) && dominio.length === n) return;
    const novo = Array.from({ length: n }, (_, i) => !!(Array.isArray(dominio) && dominio[i]));
    try { dominio = novo; } catch (e) {}
    try { renderDominio(); } catch (e) {}
    try { if (typeof cb2AtualizarEstado === "function") cb2AtualizarEstado(); } catch (e) {}
  }
  function ligarDominios() {
    // também dá pra ligar pela engrenagem (Configurações › Regras), pra quem não usa a Evolução
    window.CFG_REGRAS = window.CFG_REGRAS || [];
    if (!window.CFG_REGRAS.some((r) => r.id === "dominios")) window.CFG_REGRAS.push({
      id: "dominios",
      html: () => {
        if (!DOMS().length || !st()) return "";
        const trava = st().dominio ? "Já tem um Domínio escolhido: troque ou tire na Evolução pra desligar." : regra("dominios") ? "Ligado pelas regras da mesa." : "";
        return `<div class="toggle-cargas cfg-aba">
          <span class="toggle-cargas-texto"><span class="cfg-aba-ic">🜂</span><span class="cfg-aba-nome">Domínios (Corpo, Mente e Alma)<small>A escolha de Corpo, Mente ou Alma no nível 3, na Evolução. Criado por ${esc(window.DOMINIOS_AUTORES || "")}.${trava ? ` <b>${trava}</b>` : ""}</small></span></span>
          <label class="switch-cargas"><input type="checkbox" id="cfgDominio" ${dominiosLigados() ? "checked" : ""} ${trava ? "disabled" : ""}><span class="slider-cargas"></span></label>
        </div>`;
      },
      salvar: () => { const el = $("cfgDominio"), s = st(); if (el && s && !el.disabled) s.usaDominio = el.checked; visDominio(); },
    });
    // usar a 3ª habilidade antes do descanso longo dá 1 de exaustão
    const tg = window.toggleDominio;
    if (typeof tg === "function" && !tg._dom) {
      const n1 = function () {
        const r = tg.apply(this, arguments);
        const s = st();
        if (s && s.dominio && Array.isArray(dominio)) {
          const usados = dominio.filter(Boolean).length;
          if (usados >= 3 && !s.domExaust) {
            s.domExaust = true;
            if (typeof setExaustao === "function") setExaustao(Math.min(6, (Number(exaustao) || 0) + 1));
            toast("Três habilidades de Domínio sem descanso: +1 de exaustão");
          } else if (usados < 3 && s.domExaust && usados === 0) s.domExaust = false;
          salvarFicha();
        }
        return r;
      };
      n1._dom = true;
      window.toggleDominio = n1;
    }
    // descanso longo devolve os pontos
    const dl = window.descansoLongo;
    if (typeof dl === "function" && !dl._dom) {
      const n2 = async function () {
        const r = await dl.apply(this, arguments);
        const s = st();
        if (s && s.dominio && Array.isArray(dominio) && dominio.some(Boolean)) {
          try { dominio = dominio.map(() => false); } catch (e) {}
          s.domExaust = false;
          try { renderDominio(); } catch (e) {}
          try { if (typeof cb2AtualizarEstado === "function") cb2AtualizarEstado(); } catch (e) {}
          salvarFicha();
        }
        return r;
      };
      n2._dom = true;
      window.descansoLongo = n2;
    }
  }

  /* ======================= ANTECEDENTE ======================= */
  // antecedentes colados ficam numa biblioteca deste aparelho e uma cópia vai junto na ficha
  const BIBA = "ignea_antecedentes";
  const antBib = () => { try { return JSON.parse(localStorage.getItem(BIBA) || "[]"); } catch (e) { return []; } };
  const salvarAntBib = (l) => { try { localStorage.setItem(BIBA, JSON.stringify(l.slice(-60))); } catch (e) {} };
  const AN = (id) => {
    if (!id) return null;
    const a = typeof ANTECEDENTES_IGNEA !== "undefined" ? ANTECEDENTES_IGNEA.find((x) => x.id === id) : null;
    if (a) return a;
    const b = antBib().find((x) => x.id === id);
    if (b) return b;
    const s = st();
    return s && s.antecedente && s.antecedente.obj && s.antecedente.obj.id === id ? s.antecedente.obj : null;
  };
  const antTodos = () => (typeof ANTECEDENTES_IGNEA !== "undefined" ? ANTECEDENTES_IGNEA : []).concat(antBib());
  let fa = null; // escolha do antecedente em andamento
  function antecedenteCardHTML() {
    if (typeof ANTECEDENTES_IGNEA === "undefined") return "";
    const x = st().antecedente, a = x && AN(x.id);
    if (!a) return `
      <section class="ev-raca ev-ant">
        <div class="ev-classe-topo"><div><h4>Antecedente</h4><p>O passado do personagem: dá perícias, uma ferramenta, um talento, aumento de atributos, idiomas e o equipamento inicial.</p></div></div>
        <button type="button" class="ev-btn-sec ev-ant-btn" onclick="evAntAbrir()">📜 Escolher antecedente</button>
      </section>`;
    return `
      <section class="ev-raca ev-ant">
        <div class="ev-classe-topo"><div><h4>📜 ${esc(a.nome)}</h4><p>${esc(a.d)}</p></div></div>
        <div class="ev-traços">
          ${(a.pericias || []).length || x.ferr || a.ferramenta ? `<p>${(a.pericias || []).length ? `<b>Perícias</b> ${a.pericias.map(esc).join(" e ")}` : ""}${x.ferr || a.ferramenta ? `${(a.pericias || []).length ? " · " : ""}<b>Ferramenta</b> ${esc(x.ferr || a.ferramenta)}` : ""}</p>` : ""}
          ${a.talento ? `<p><b>${a.custom ? "Característica" : "Talento"}</b> ${esc(a.talento.nome)}</p>` : ""}
          ${x.atrTxt ? `<p><b>Atributos</b> ${esc(x.atrTxt)}</p>` : ""}
          <p><b>Equipamento</b> ${x.equip === "B" ? `${regraV("ouroValor") || a.poB} PO` : "pacote do antecedente"}</p>
        </div>
        <button type="button" class="ev-btn-sec ev-ant-btn" onclick="evAntTrocar()">Trocar antecedente</button>
      </section>`;
  }
  window.evAntAbrir = function () {
    fa = { id: "", modo: "21", a2: "", a1: "", jogo: "", equip: regra("ouro") ? "B" : "A", idi: [] };
    tela = "antecedente";
    renderPainel();
    $("evCorpo").scrollTop = 0;
  };
  window.evAntTrocar = async function () {
    if (typeof confirmBonito === "function" && !(await confirmBonito("Trocar o antecedente? Perícias, talento, atributos, idiomas e itens que ele deu saem da ficha."))) return;
    desfazerAntecedente();
    sincronizar();
    evAntAbrir();
  };
  window.evAnt = function (k, v) {
    if (k === "id") { fa = { id: v, modo: "21", a2: "", a1: "", jogo: "", equip: regra("ouro") ? "B" : "A", idi: fa.idi || [], doCampo: fa.doCampo }; }
    else if (k === "atr") {
      if (fa.modo === "111") return;
      if (fa.a2 === v) fa.a2 = "";
      else if (fa.a1 === v) fa.a1 = "";
      else if (!fa.a2) fa.a2 = v;
      else if (!fa.a1) fa.a1 = v;
      else fa.a1 = v;
    } else if (k === "idi") {
      const i = fa.idi.indexOf(v);
      if (i >= 0) fa.idi.splice(i, 1); else if (fa.idi.length < 2) fa.idi.push(v);
    } else fa[k] = v;
    if (k === "modo") { fa.a2 = ""; fa.a1 = ""; }
    renderPainel();
  };
  function antAtributos() {
    const a = AN(fa.id), out = {};
    if (!a) return out;
    if (fa.modo === "111") a.atrs.forEach((k) => (out[k] = 1));
    else { if (fa.a2) out[fa.a2] = 2; if (fa.a1) out[fa.a1] = 1; }
    return out;
  }
  function renderAntecedente() {
    $("evTitulo").textContent = "Antecedente";
    let h = `<p class="ev-p">Escolha o passado do seu personagem.</p>`;
    const cartaoAnt = (a, seu) => `
      <div class="ev-ant-op">
      <button type="button" class="ev-op ${seu ? "seu " : ""}${fa.id === a.id ? "on" : ""}" onclick="evAnt('id','${a.id}')">
        <span class="ev-op-topo"><b>📜 ${esc(a.nome)}</b><small>${seu ? "seu" : (a.atrs || []).map((k) => ATR_NOME[k].slice(0, 3).toUpperCase()).join(" · ")}</small></span>
        ${a.d ? `<span class="ev-op-txt">${esc(a.d)}</span>` : ""}
        <span class="ev-op-txt">${[(a.pericias || []).length ? `<b>${esc(a.pericias.join(", "))}</b>` : "", a.talento ? esc(a.talento.nome) : ""].filter(Boolean).join(" · ")}</span>
      </button>${seu ? `<button type="button" class="ev-ant-tirar" onclick="evAntExcluir('${a.id}')" aria-label="Excluir"><i class="ti ti-trash"></i></button>` : ""}</div>`;
    h += ANTECEDENTES_IGNEA.map((a) => cartaoAnt(a, false)).join("");
    const meus = antBib();
    if (meus.length) h += `<div class="ev-sc-sec"><span>Seus antecedentes</span></div>` + meus.map((a) => cartaoAnt(a, true)).join("");
    if (typeof window.lerAntecedenteColado === "function") h += `<div class="ev-sc-sec"><span>Outro antecedente</span></div><div class="ev-sc-ferr"><button type="button" onclick="evAntColar()"><i class="ti ti-clipboard-text"></i><b>Colar texto</b><small>do grupo, site, anotação</small></button><button type="button" onclick="evAntEscrever()"><i class="ti ti-signature"></i><b>Só o nome</b><small>escreve na ficha</small></button></div>`;
    const a = AN(fa.id);
    if (a) {
      const bon = antAtributos();
      if ((a.atrs || []).length) h += `<h5 class="ev-h">Atributos</h5>
        <div class="ev-seg3"><button type="button" class="${fa.modo === "21" ? "on" : ""}" onclick="evAnt('modo','21')">+2 e +1</button><button type="button" class="${fa.modo === "111" ? "on" : ""}" onclick="evAnt('modo','111')">+1 nos três</button></div>
        <div class="ev-atrs">${a.atrs.map((k) => {
          const v = atrVal(k), b = bon[k] || 0, novo = Math.min(20, v + b);
          return `<button type="button" class="ev-atr ${b ? "on" : ""}" onclick="evAnt('atr','${k}')"><span class="ev-atr-ic">${ATR_ICO[k]}</span><small>${ATR_NOME[k]}</small><span class="ev-atr-val">${b ? `${v}<i>→</i><b>${novo}</b>` : `<b>${v}</b>`}</span><span class="ev-atr-mod">${sinal(Math.floor((novo - 10) / 2))}</span>${b ? `<em>+${b}</em>` : ""}</button>`;
        }).join("")}</div>
        ${fa.modo === "21" ? `<p class="ev-p quieto">Toque primeiro no que ganha +2, depois no que ganha +1.</p>` : ""}`;
      if (a.jogos) h += `<h5 class="ev-h">Ferramenta: jogo</h5><div class="ev-chips2">${a.jogos.map((j) => `<button type="button" class="${fa.jogo === j ? "on" : ""}" onclick="evAnt('jogo','${esc(j)}')">${esc(j)}</button>`).join("")}</div>`;
      const nomesA = a.equipA.map((e) => (e.i === "jogo" ? fa.jogo || "jogo à escolha" : e.nome || e.i || e.a) + (e.qtd > 1 && !/\(\d+\)/.test(e.i || "") ? ` ×${e.qtd}` : ""));
      h += `<h5 class="ev-h">Equipamento</h5>
        <div class="ev-duas">
          <button type="button" class="ev-op ${fa.equip === "A" ? "on" : ""}" onclick="evAnt('equip','A')"><span class="ev-op-topo"><b>Pacote</b><small>+ ${a.poA} PO</small></span><span class="ev-op-txt">${nomesA.map(esc).join(", ")}</span></button>
          <button type="button" class="ev-op ${fa.equip === "B" ? "on" : ""}" onclick="evAnt('equip','B')"><span class="ev-op-topo"><b>Só ouro</b></span><span class="ev-op-txt">${regraV("ouroValor") || a.poB} PO pra comprar o que quiser.${regra("ouro") ? " <b>Regra da mesa.</b>" : ""}</span></button>
        </div>`;
      const temComum = temIdioma("Comum");
      h += `<h5 class="ev-h">Idiomas ${temComum ? "" : "· Comum + 2"} <small class="ev-conta">${fa.idi.length}/2</small></h5>
        <div class="ev-chips2">${IDIOMAS_IGNEA.comuns.filter((x) => x !== "Comum").map((x) => { const on = fa.idi.includes(x), b = !on && temIdioma(x); return `<button type="button" class="${on ? "on" : ""}" ${b ? "disabled" : ""} onclick="evAnt('idi','${esc(x)}')">${esc(x)}</button>`; }).join("")}</div>
        <p class="ev-p quieto">Todo personagem fala Comum e mais dois idiomas comuns. Os raros (Abissal, Infernal, Silvestre...) vêm de classe, raça ou da mesa.</p>
        <h5 class="ev-h">Você também ganha</h5>
        <ul class="ev-lista">
          ${(a.pericias || []).length ? `<li>✅<span>Perícias <b>${esc(a.pericias.join(" e "))}</b></span></li>` : ""}
          ${a.jogos || a.ferramenta ? `<li>🧰<span>Ferramenta <b>${esc(a.jogos ? fa.jogo || "um jogo à escolha" : a.ferramenta)}</b></span></li>` : ""}
          ${a.talento ? `<li>⭐<span>${a.custom ? "Característica" : "Talento"} <b>${esc(a.talento.nome)}</b> ${esc(a.talento.d)}</span></li>` : ""}
        </ul>`;
    }
    $("evCorpo").innerHTML = h;
    // o que falta escolher aparece no próprio botão (e o toque leva até lá)
    const semAtr = !a || !(a.atrs || []).length;
    const falta = !a ? "Escolha um antecedente" : !semAtr && fa.modo !== "111" && !fa.a2 ? "Falta escolher o +2 nos atributos" : !semAtr && fa.modo !== "111" && !fa.a1 ? "Falta escolher o +1 nos atributos" : a.jogos && !fa.jogo ? "Falta escolher o jogo" : "";
    rodape(falta
      ? `<button type="button" class="ev-btn-prim cheio ev-falta" onclick="evAntFalta()"><i class="ti ti-arrow-up"></i> ${falta}</button>`
      : `<button type="button" class="ev-btn-prim cheio" onclick="evAntAplicar()"><i class="ti ti-check"></i> Aplicar ${esc(a.nome)}</button>`);
  }
  let antCol = { txt: "", lido: null, erro: "" };
  window.evAntColar = function () { antCol = { txt: "", lido: null, erro: "" }; tela = "antColar"; renderPainel(); $("evCorpo").scrollTop = 0; setTimeout(() => $("antColarTxt") && $("antColarTxt").focus(), 60); };
  window.evAntEscrever = function () {
    fecharEvolucao();
    const sel = $("antSel");
    if (sel) { sel.value = "outro"; window.aoMudarAntecedente(); }
  };
  window.evAntExcluir = async function (id) {
    const a = antBib().find((x) => x.id === id);
    if (!a || (typeof confirmBonito === "function" && !(await confirmBonito(`Excluir o antecedente ${a.nome} da sua lista? Fichas que já usam ele continuam com ele.`)))) return;
    salvarAntBib(antBib().filter((x) => x.id !== id));
    if (fa && fa.id === id) fa.id = "";
    campoAnt();
    renderPainel();
  };
  window.evAntColarLer = function () {
    antCol.txt = ($("antColarTxt") || {}).value || "";
    antCol.erro = "";
    if (!antCol.txt.trim()) return;
    let a = null;
    try { a = window.lerAntecedenteColado(antCol.txt); } catch (e) { console.warn(e); }
    if (!a || (!a.pericias.length && !a.talento && !a.atrs.length && !a.equipA.length)) { antCol.erro = "Não achei perícias, talento nem equipamento nesse texto. Deixe o nome na primeira linha e os campos assim: Perícias: …, Talento: …, Equipamento: …"; antCol.lido = null; return renderPainel(); }
    antCol.lido = a;
    renderPainel();
  };
  window.evAntColarSalvar = function () {
    const a = antCol.lido;
    if (!a) return;
    const obj = { ...a, id: "ant_" + slug(a.nome) + "_" + Date.now().toString(36).slice(-4), custom: true };
    salvarAntBib(antBib().filter((x) => nomeN(x.nome) !== nomeN(obj.nome)).concat([obj]));
    fa = { id: obj.id, modo: "21", a2: "", a1: "", jogo: "", equip: regra("ouro") ? "B" : "A", idi: (fa && fa.idi) || [], doCampo: fa && fa.doCampo };
    tela = "antecedente";
    campoAnt();
    renderPainel();
    toast(`${obj.nome} salvo nos seus antecedentes`);
    setTimeout(() => { const on = $("evCorpo").querySelector(".ev-op.on"); if (on) $("evCorpo").scrollTop = on.offsetTop - 12; }, 60);
  };
  function renderAntColar() {
    $("evTitulo").textContent = "Colar antecedente";
    $("evVoltar").style.visibility = "visible";
    const a = antCol.lido;
    const ajuda = typeof window.ajudaColarHTML === "function" ? window.ajudaColarHTML("antecedente", "antColarTxt") : "";
    if (!a) {
      $("evCorpo").innerHTML = `
        <p class="ev-p">Cole o antecedente de uma vez: conversa do grupo, anotação, site… Nome na primeira linha e o que ele dá embaixo.</p>
        <textarea id="antColarTxt" class="ev-colar-txt" placeholder="Caçador de Recompensas&#10;Perícias: Investigação e Sobrevivência&#10;Talento: Alerta&#10;Equipamento: besta leve, algemas, 12 PO">${esc(antCol.txt)}</textarea>
        ${antCol.erro ? `<p class="ev-aviso"><i class="ti ti-alert-triangle"></i>${esc(antCol.erro)}</p>` : ""}
        <div class="ev-colar-dicas">
          ${ajuda ? `<div class="ev-colar-ex"><span>Ver exemplos que funcionam</span>${ajuda}</div>` : ""}
          <p><b>O app procura</b> atributos, perícias, ferramenta, talento (ou característica), idiomas e equipamento. Com "(A) … ou (B) 50 PO" ele separa o pacote do ouro.</p>
        </div>`;
      return rodape(`<button type="button" class="ev-btn-prim cheio" onclick="evAntColarLer()"><i class="ti ti-wand"></i> Ler texto</button>`);
    }
    const linha = (ic, rot, v) => (v ? `<li>${ic}<span>${rot} <b>${esc(v)}</b></span></li>` : "");
    const eq = (a.equipA || []).map((e) => (e.a || e.i) + (e.qtd > 1 ? ` ×${e.qtd}` : "")).join(", ");
    $("evCorpo").innerHTML = `
      <div class="ev-lido-ant">
        <h4>📜 ${esc(a.nome)}</h4>
        ${a.d ? `<p>${esc(a.d)}</p>` : ""}
        <ul class="ev-lista">
          ${linha("📊", "Atributos", (a.atrs || []).map((k) => ATR_NOME[k]).join(", "))}
          ${linha("✅", "Perícias", (a.pericias || []).join(" e "))}
          ${linha("🧰", "Ferramenta", a.ferramenta)}
          ${a.talento ? `<li>⭐<span>${a.custom ? "Característica" : "Talento"} <b>${esc(a.talento.nome)}</b> ${esc(resumoCurto(a.talento.d, 160))}</span></li>` : ""}
          ${linha("🎒", "Equipamento", eq ? `${eq}${a.poA ? ` + ${a.poA} PO` : ""}` : a.poA ? `${a.poA} PO` : "")}
          ${linha("🗣️", "Idiomas", a.idiomas)}
        </ul>
        ${!(a.atrs || []).length ? `<p class="ev-p quieto">Sem aumento de atributos no texto: nenhum atributo muda.</p>` : ""}
      </div>
      <button type="button" class="ev-mais" onclick="evAntColarRefazer()"><i class="ti ti-arrow-back-up"></i> Colar de novo</button>`;
    rodape(`<button type="button" class="ev-btn-prim cheio" onclick="evAntColarSalvar()"><i class="ti ti-check"></i> Salvar e escolher</button>`);
  }
  window.evAntColarRefazer = function () { antCol.lido = null; renderPainel(); };
  window.evAntFalta = function () {
    const alvo = !fa.id ? $("evCorpo").querySelector(".ev-op") : $("evCorpo").querySelector(fa.a2 || fa.modo === "111" ? ".ev-chips2" : ".ev-atrs");
    if (alvo) { alvo.scrollIntoView({ block: "center", behavior: "smooth" }); alvo.classList.remove("ev-pisca"); void alvo.offsetWidth; alvo.classList.add("ev-pisca"); }
  };
  function itemCatalogo(nome) {
    if (typeof CATALOGO_IGNEA === "undefined") return null;
    return CATALOGO_IGNEA.itens.find((x) => x.nome === nome) || null;
  }
  function armaCatalogo(nome) {
    if (typeof CATALOGO_IGNEA === "undefined") return null;
    return CATALOGO_IGNEA.armas.find((x) => x.nome === nome) || null;
  }
  window.evAntAplicar = function () {
    const a = AN(fa.id);
    if (!a) return;
    const s = st();
    const reg = { id: a.id, atr: {}, per: [], pod: [], inv: [], armas: [], po: 0, idi: [], ferr: "", equip: fa.equip, antes: ($("antecedentes") || {}).value || "" };
    // atributos
    Object.entries(antAtributos()).forEach(([k, v]) => {
      const el = $(ATR[k]); if (!el) return;
      const atual = parseInt(el.value) || 10, novo = Math.min(20, atual + v);
      el.value = novo; reg.atr[k] = novo - atual;
    });
    reg.atrTxt = Object.entries(reg.atr).filter(([, v]) => v).map(([k, v]) => `+${v} ${ATR_NOME[k]}`).join(", ");
    // perícias
    a.pericias.forEach((x) => { if (!((profs[x] || 0) >= 1)) { profs[x] = 1; reg.per.push(x); } });
    // ferramenta
    reg.ferr = a.jogos ? fa.jogo : a.ferramenta || "";
    const pe = $("proficienciasExtras");
    if (pe && reg.ferr && !pe.value.toLowerCase().includes(reg.ferr.toLowerCase())) { pe.value = (pe.value.trim() ? pe.value.trim() + "\n" : "") + reg.ferr; reg.ferrAdd = true; }
    // talento (ou a característica do antecedente colado)
    if (a.talento) {
      const id = "pw_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      poderes.push({ id, nome: a.talento.nome, circulo: "", acao: "passiva", recarga: "", origem: "talento", tipo: "", dano: "", alcance: "", duracao: "", tempo: "", desc: `${a.talento.d}\n\n${a.custom ? "Característica" : "Talento de origem"} (${a.nome}).`, temCargas: false, maxCargas: 0, cargasGastas: [], componentes: {}, icone: "⭐" });
      reg.pod.push(id);
    }
    if (a.custom) reg.obj = a;
    // idiomas
    ["Comum"].concat(fa.idi).forEach((x) => { if (addIdioma(x)) reg.idi.push(x); });
    // equipamento
    if (fa.equip === "A") {
      a.equipA.forEach((e) => {
        if (e.a) {
          const w = armaCatalogo(e.a);
          for (let q = 0; q < (e.qtd || 1); q++) {
            const arma = {
              modificacoes: [], nome: e.a, dano: w ? `${w.dano} ${w.tipoDano}` : "", desc: w ? `${w.desc}\n\nPropriedades: ${w.props}` : "",
              temCargas: false, maxCargas: 0, cargasGastas: [], requerSintonia: false, sintonizado: false, imagemUrl: "", imagemDeleteUrl: "",
              atributoAtaque: w && (w.uso === "À distância" || /acuidade/i.test(w.props)) ? "destreza" : "forca", somarProf: true, somarAtribDano: true, bonusAtaque: 0, bonusDano: 0, _progAnt: true,
            };
            armas.push(arma);
          }
          return;
        }
        const nomeCat = e.i === "jogo" ? fa.jogo : e.i;
        const it = itemCatalogo(nomeCat);
        const novo = { id: typeof gerarIdItem === "function" ? gerarIdItem() : "it_" + Date.now() + Math.random(), nome: e.nome || nomeCat, desc: it ? it.desc : "", qtd: e.qtd || 1, requerSintonia: false, sintonizado: false, imagemUrl: "", imagemDeleteUrl: "", recipiente: false, dentroDe: "", modificacoes: [] };
        inventario.push(novo);
        reg.inv.push(novo.id);
      });
    }
    reg.po = fa.equip === "A" ? a.poA || 0 : regraV("ouroValor") || a.poB || 0;
    if (typeof garantirBolsaPadrao === "function") {
      const i = garantirBolsaPadrao();
      inventario[i].moedas = normalizarMoedas(inventario[i].moedas);
      inventario[i].moedas.po += reg.po;
      reg.bolsa = inventario[i].id;
    }
    const ant = $("antecedentes");
    if (ant) ant.value = a.nome;
    s.antecedente = reg;
    const doCampo = fa.doCampo;
    fa = null;
    tela = "visao";
    try { renderInv(); renderArmas(); } catch (e) {}
    sincronizar();
    campoAnt();
    toast(`Antecedente ${a.nome} aplicado!`);
    if (doCampo) fecharEvolucao();
  };
  function desfazerAntecedente() {
    const s = st(), r = s && s.antecedente;
    if (!r) return;
    Object.entries(r.atr || {}).forEach(([k, v]) => { const el = $(ATR[k]); if (el) el.value = (parseInt(el.value) || 10) - v; });
    (r.per || []).forEach((x) => { delete profs[x]; });
    if (r.ferrAdd) { const pe = $("proficienciasExtras"); if (pe) pe.value = pe.value.split("\n").filter((l) => l.trim() !== r.ferr).join("\n"); }
    (r.pod || []).forEach((id) => { const i = poderes.findIndex((p) => p.id === id); if (i >= 0) poderes.splice(i, 1); });
    (r.idi || []).forEach(tirarIdioma);
    (r.inv || []).forEach((id) => { const i = inventario.findIndex((x) => x.id === id); if (i >= 0) inventario.splice(i, 1); });
    for (let i = armas.length - 1; i >= 0; i--) if (armas[i] && armas[i]._progAnt) armas.splice(i, 1);
    if (r.po && r.bolsa) { const b = inventario.find((x) => x.id === r.bolsa); if (b && b.moedas) b.moedas.po = Math.max(0, (b.moedas.po || 0) - r.po); }
    const ant = $("antecedentes");
    if (ant) ant.value = r.antes || "";
    s.antecedente = null;
    try { renderInv(); renderArmas(); } catch (e) {}
    campoAnt();
  }

  /* ---------- antecedente como lista no campo da ficha ---------- */
  function montarCampoAnt() {
    const inp = $("antecedentes");
    if (!inp || $("antSel") || typeof ANTECEDENTES_IGNEA === "undefined") return;
    const box = document.createElement("div");
    box.className = "ant-campo";
    box.id = "antCampo";
    box.innerHTML = `
      <div class="select-wrapper"><select id="antSel" onchange="aoMudarAntecedente()">
        <option value="">Antecedente</option>
        <optgroup label="Antecedentes (SRD)">${ANTECEDENTES_IGNEA.map((a) => `<option value="${a.id}">${esc(a.nome)}</option>`).join("")}</optgroup>
        <optgroup label="Seus antecedentes" class="ant-seus"></optgroup>
        ${typeof window.lerAntecedenteColado === "function" ? `<option value="colar">📋 Colar texto</option>` : ""}
        <option value="outro">✍️ Outro (escrever)</option>
      </select></div>
      <button type="button" class="ant-lista" onclick="antVoltarLista()" aria-label="Escolher da lista">▼</button>`;
    inp.before(box);
    box.insertBefore(inp, box.querySelector(".ant-lista"));
    inp.setAttribute("autocomplete", "off");
    inp.placeholder = "Escreva o antecedente";
  }
  function campoAnt() {
    montarCampoAnt();
    const sel = $("antSel"), inp = $("antecedentes"), box = $("antCampo");
    if (!sel || !inp) return;
    const grp = sel.querySelector(".ant-seus");
    if (grp) {
      const s0 = st(), copia = s0 && s0.antecedente && s0.antecedente.obj;
      const l = antBib().concat(copia && !antBib().some((x) => x.id === copia.id) ? [copia] : []);
      grp.innerHTML = l.map((a) => `<option value="${esc(a.id)}">${esc(a.nome)}</option>`).join("");
      grp.hidden = !l.length;
    }
    const p = fichaAtual();
    const ap = p && p.progressao && p.progressao.antecedente;
    const a = ap && AN(ap.id);
    let escrever = false;
    if (a) sel.value = a.id;
    else if (inp.value.trim()) { sel.value = "outro"; escrever = true; }
    else sel.value = box.classList.contains("escrever") ? "outro" : "";
    if (box.classList.contains("escrever") && !a) escrever = true;
    box.classList.toggle("escrever", escrever);
    sel.classList.toggle("vazio", !sel.value);
  }
  function salvarFicha() { try { if (typeof salvarTudo === "function") salvarTudo(); } catch (e) {} }
  window.aoMudarAntecedente = async function () {
    const sel = $("antSel"), v = sel.value, box = $("antCampo"), inp = $("antecedentes");
    const s = st();
    const atual = s && s.antecedente && AN(s.antecedente.id);
    if (atual && v === atual.id) return;
    if (atual) {
      const ok = typeof confirmBonito === "function" ? await confirmBonito(`Tirar ${atual.nome} da ficha? As perícias, talento, atributos, idiomas e itens que ele deu saem junto.`) : true;
      if (!ok) { sel.value = atual.id; return; }
      desfazerAntecedente();
      sincronizar();
      salvarFicha();
    }
    if (v === "colar") {
      sel.value = "";
      if (!temDados() || !s) return;
      garantirPainel();
      fa = { id: "", modo: "21", a2: "", a1: "", jogo: "", equip: regra("ouro") ? "B" : "A", idi: [], doCampo: true };
      antCol = { txt: "", lido: null, erro: "" };
      tela = "antColar";
      renderPainel();
      $("evFundo").classList.add("aberto");
      $("evPainel").classList.add("aberto");
      document.body.classList.add("ev-travado-scroll");
      return;
    }
    if (v === "outro") {
      inp.value = "";
      sel.value = "outro";
      box.classList.add("escrever");
      sel.classList.remove("vazio");
      setTimeout(() => inp.focus(), 30);
      return;
    }
    box.classList.remove("escrever");
    if (!v) { inp.value = ""; campoAnt(); salvarFicha(); return; }
    // abre a escolha do antecedente já com ele marcado
    if (!temDados() || !s) return;
    garantirPainel();
    fa = { id: v, modo: "21", a2: "", a1: "", jogo: "", equip: regra("ouro") ? "B" : "A", idi: [], doCampo: true };
    tela = "antecedente";
    renderPainel();
    $("evFundo").classList.add("aberto");
    $("evPainel").classList.add("aberto");
    document.body.classList.add("ev-travado-scroll");
    $("evCorpo").scrollTop = 0;
    setTimeout(() => { const on = $("evCorpo").querySelector(".ev-op.on"); if (on) $("evCorpo").scrollTop = on.offsetTop - 12; }, 60);
  };
  window.antVoltarLista = function () {
    const inp = $("antecedentes");
    inp.value = "";
    $("antCampo").classList.remove("escrever");
    campoAnt();
    salvarFicha();
  };

  /* ======================= IMPORTAR PERSONAGEM EXISTENTE ======================= */
  function renderImportar() {
    $("evTitulo").textContent = "Configurar evolução";
    const opts = (sel) => `<option value="">Classe</option>` + todasClasses().map((c) => `<option value="${c.id}" ${sel === c.id ? "selected" : ""}>${esc(c.nome)}</option>`).join("");
    const soma = fluxo.imp.reduce((t, x) => t + (parseInt(x.lv) || 0), 0);
    $("evCorpo").innerHTML = `
      <p class="ev-p">Sua ficha diz <b>${esc(($("classe") || {}).value || "")}</b>, nível <b>${esc(($("nivel") || {}).value || "")}</b>. Diga as classes e níveis que você já tem: o app marca tudo como conquistado <b>sem mexer no PV nem nos atributos</b>.</p>
      ${fluxo.imp.map((x, i) => `
        <div class="ev-lido">
          <select onchange="evImp(${i},'c',this.value)">${opts(x.c)}</select>
          <input type="number" min="1" max="20" value="${x.lv}" oninput="evImp(${i},'lv',this.value)">
          ${i ? `<button type="button" onclick="evImpRemover(${i})" aria-label="Remover"><i class="ti ti-x"></i></button>` : ""}
        </div>
        ${x.c && CL(x.c) && (parseInt(x.lv) || 0) >= CL(x.c).subNiveis[0] ? `<p class="ev-p quieto">A subclasse de ${esc(CL(x.c).nome)} você escolhe logo depois, na tela da evolução.</p>` : ""}`).join("")}
      ${fluxo.imp.length < 4 ? `<button type="button" class="ev-mais" onclick="evImpAdd()"><i class="ti ti-plus"></i> Tenho mais de uma classe</button>` : ""}
      <label class="ev-opcao"><input type="checkbox" ${st().addPoderes ? "checked" : ""} onchange="st_add(this.checked)"><span>Colocar as habilidades na aba 🔥 (pode duplicar as que você já escreveu à mão)</span></label>
      ${soma > 20 ? `<p class="ev-aviso"><i class="ti ti-alert-triangle"></i>O total passa de 20.</p>` : ""}
      <button type="button" class="ev-mais" onclick="evComecarDoZero()"><i class="ti ti-refresh"></i> Prefiro começar do nível 1</button>`;
    const ok = fluxo.imp.every((x) => x.c && parseInt(x.lv) >= 1) && soma <= 20 && new Set(fluxo.imp.map((x) => x.c)).size === fluxo.imp.length;
    rodape(`<button type="button" class="ev-btn-prim cheio" onclick="evImpConfirmar()" ${ok ? "" : "disabled"}><i class="ti ti-check"></i> Ligar evolução (nível ${soma})</button>`);
  }
  window.st_add = function (v) { st().addPoderes = !!v; };
  window.evImp = function (i, k, v) { fluxo.imp[i][k] = k === "lv" ? Math.max(1, Math.min(20, parseInt(v) || 1)) : v; renderImportar(); };
  window.evImpAdd = function () { fluxo.imp.push({ c: "", lv: 1 }); renderImportar(); };
  window.evImpRemover = function (i) { fluxo.imp.splice(i, 1); renderImportar(); };
  window.evComecarDoZero = function () { tela = "subir"; iniciarFluxo(); renderPainel(); };
  window.evImpConfirmar = function () {
    const s = st();
    s.niveis = [];
    fluxo.imp.forEach((x) => { for (let k = 0; k < x.lv; k++) s.niveis.push({ c: x.c, pv: 0, imp: 1 }); });
    s.importado = true;
    tela = "visao"; fluxo = null;
    sincronizar();
  };

  /* ======================= RAÇAS NO CAMPO DA FICHA ======================= */
  function opcoesRaca() {
    const sel = $("racaSelect");
    if (!sel || sel.querySelector("optgroup.ev-srd") || typeof RACAS_IGNEA === "undefined") return;
    const g = document.createElement("optgroup");
    g.label = "Raças (SRD)";
    g.className = "ev-srd";
    RACAS_IGNEA.forEach((r) => { const o = document.createElement("option"); o.value = "srd_" + r.id; o.textContent = r.nome; g.appendChild(o); });
    sel.appendChild(g);
    const p = fichaAtual();
    if (p && String(p.racaSelect || "").startsWith("srd_")) sel.value = p.racaSelect;
  }
  function ligarRaca() {
    const orig = window.aoMudarRaca;
    if (typeof orig === "function" && !orig._ev) {
      const novo = function () {
        const s0 = st();
        if (s0 && s0.racaEsc && (!racaAtual() || racaAtual().id !== s0.racaEsc.raca)) desfazerRacaEsc();
        const r = orig.apply(this, arguments);
        if (ativo()) {
          // Robustez Anã: +1 PV por nível
          const s = st(), anao = racaAtual()?.id === "anao";
          const antes = s.pvRaca || 0, agora = anao ? total() : 0;
          if (antes !== agora) { const vm = $("vidaMax"); if (vm) vm.value = Math.max(1, get("vidaMax") + agora - antes); s.pvRaca = agora; }
          sincronizar();
        }
        return r;
      };
      novo._ev = true;
      window.aoMudarRaca = novo;
      try { aoMudarRaca = novo; } catch (e) {}
    }
    const nomeOrig = window.getNomeRacaAtual;
    if (typeof nomeOrig === "function" && !nomeOrig._ev) {
      const n2 = function () { const r = racaAtual(); return r ? r.nome : nomeOrig.apply(this, arguments); };
      n2._ev = true;
      window.getNomeRacaAtual = n2;
      try { getNomeRacaAtual = n2; } catch (e) {}
    }
  }

  /* ---------- raça por "Colar texto" (popup das raças personalizadas) ---------- */
  let rcol = { txt: "", lido: null, erro: "" };
  const ATR_LONGO_NOME = { forca: "For", destreza: "Des", constituicao: "Con", inteligencia: "Int", sabedoria: "Sab", carisma: "Car" };
  function popupRacaColar() {
    const r = rcol.lido;
    const ajuda = typeof window.ajudaColarHTML === "function" ? window.ajudaColarHTML("raca", "rcColarTxt") : "";
    const corpo = !r ? `
      <div class="popup-form rc-colar">
        <p class="pm-dica">Cole a raça de uma vez: da conversa do grupo, de uma anotação, de um site… Nome na primeira linha, depois atributos, tamanho, deslocamento e os traços (um por linha, "Nome: o que faz").</p>
        <div class="rc-ajuda">${ajuda}</div>
        <textarea id="rcColarTxt" class="rc-txt" placeholder="Homem-Lagarto do Pântano&#10;Aumento de atributo: +2 Constituição, +1 Sabedoria&#10;Deslocamento: 9 m&#10;- Mordida: arma natural, 1d6 + Força perfurante">${esc(rcol.txt)}</textarea>
        ${rcol.erro ? `<p class="rc-erro">${esc(rcol.erro)}</p>` : ""}
        <button type="button" class="popup-salvar-btn" onclick="rcColarLer()">Ler texto</button>
      </div>` : `
      <div class="popup-form rc-colar">
        <div class="rc-lido">
          <b>${esc(r.nome)}</b>
          <span>${esc(r.tam)} · ${esc(r.desl)}${Object.keys(r.bonus).length ? " · " + Object.entries(r.bonus).map(([k, v]) => `${ATR_LONGO_NOME[k]} +${v}`).join(", ") : ""}</span>
          ${r.d ? `<p>${esc(r.d)}</p>` : ""}
          <ul>${r.t.map((t) => `<li><b>${esc(t.nome)}</b>${t.a && t.a !== "passiva" ? ` <em>${ACAO_ROT[t.a] || ""}</em>` : ""}${t.r ? ` <em>${REC_ROT[t.r] || ""}</em>` : ""}<small>${esc(resumoCurto(t.d, 110))}</small></li>`).join("") || "<li><small>Nenhum traço encontrado: dá pra adicionar os poderes na aba 🔥.</small></li>"}</ul>
        </div>
        <p class="pm-dica">${Object.keys(r.bonus).length ? "Os bônus de atributo entram no valor final da ficha. " : "Sem bônus de atributo no texto. "}Os traços viram poderes na aba 🔥 (origem Raça) quando a evolução está ligada.</p>
        <button type="button" class="popup-salvar-btn" onclick="rcColarSalvar()">Salvar e usar ${esc(r.nome)}</button>
        <button type="button" class="rc-refazer" onclick="rcColarRefazer()">Colar de novo</button>
      </div>`;
    abrirPopup("Colar raça", corpo, true, null);
  }
  window.rcColarAbrir = function () { rcol = { txt: "", lido: null, erro: "" }; popupRacaColar(); setTimeout(() => $("rcColarTxt") && $("rcColarTxt").focus(), 80); };
  window.rcColarRefazer = function () { rcol.lido = null; popupRacaColar(); };
  window.rcColarLer = function () {
    rcol.txt = ($("rcColarTxt") || {}).value || "";
    rcol.erro = "";
    if (!rcol.txt.trim() || typeof window.lerRacaColada !== "function") return;
    let r = null;
    try { r = window.lerRacaColada(rcol.txt); } catch (e) { console.warn(e); }
    if (!r || (!r.t.length && !Object.keys(r.bonus).length)) { rcol.erro = "Não achei traços nem bônus de atributo nesse texto. Deixe o nome na primeira linha e cada traço como \"Nome: o que faz\"."; return popupRacaColar(); }
    rcol.lido = r;
    popupRacaColar();
  };
  window.rcColarSalvar = function () {
    const r = rcol.lido;
    if (!r || typeof racasCustomSalvas === "undefined") return;
    const bonus = { forca: 0, destreza: 0, constituicao: 0, inteligencia: 0, sabedoria: 0, carisma: 0, ...r.bonus };
    const nova = { nome: r.nome, bonus, t: r.t, tam: r.tam, desl: r.desl, d: r.d };
    const i0 = racasCustomSalvas.findIndex((x) => nomeN(x.nome) === nomeN(r.nome));
    const idx = i0 >= 0 ? i0 : racasCustomSalvas.length;
    racasCustomSalvas[idx] = nova;
    try { salvarRacasCustomStorage(); } catch (e) {}
    try { atualizarDropdownRacas(); } catch (e) {}
    const sel = $("racaSelect");
    if (sel) sel.value = "custom_" + idx;
    if (typeof fecharPopup === "function") fecharPopup();
    try { window.aoMudarRaca(); } catch (e) {}
    toast(`${r.nome} salva nas suas raças`);
  };
  /* ---------- editor completo da raça personalizada ---------- */
  let rcEd = null;
  const BONUS_K = [["forca", "For"], ["destreza", "Des"], ["constituicao", "Con"], ["inteligencia", "Int"], ["sabedoria", "Sab"], ["carisma", "Car"]];
  const ACOES_RC = [["passiva", "Passiva"], ["acao", "Ação"], ["bonus", "Ação bônus"], ["reacao", "Reação"], ["livre", "Livre"]];
  const RECS_RC = [["", "Sem recarga"], ["curto", "Descanso curto"], ["longo", "Descanso longo"], ["dia", "Por dia"], ["vontade", "À vontade"]];
  function rcEditor(i) {
    const r = i >= 0 && typeof racasCustomSalvas !== "undefined" ? racasCustomSalvas[i] : null;
    rcEd = { i, nome: r ? r.nome || "" : "", d: r ? r.d || "" : "", tam: r ? r.tam || "Médio" : "Médio", desl: r ? r.desl || "9 m" : "9 m", bonus: { ...((r && r.bonus) || {}) }, t: JSON.parse(JSON.stringify((r && r.t) || [])) };
    renderRcEditor();
  }
  function renderRcEditor() {
    const e = rcEd;
    const opt = (l, v) => l.map(([k, n]) => `<option value="${k}" ${String(v || "") === k ? "selected" : ""}>${n}</option>`).join("");
    const html = `
      <div class="popup-form rc-ed">
        <label class="rc-campo"><span>Nome</span><input id="rcNome" value="${esc(e.nome)}" placeholder="Nome da raça" oninput="rcEdV('nome', this.value)"></label>
        <label class="rc-campo"><span>Descrição</span><textarea rows="2" placeholder="Opcional" oninput="rcEdV('d', this.value)">${esc(e.d)}</textarea></label>
        <div class="rc-duas">
          <label class="rc-campo"><span>Tamanho</span><select onchange="rcEdV('tam', this.value)">${["Miúdo", "Pequeno", "Médio", "Grande"].map((x) => `<option ${e.tam === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
          <label class="rc-campo"><span>Deslocamento</span><input value="${esc(e.desl)}" placeholder="9 m" oninput="rcEdV('desl', this.value)"></label>
        </div>
        <span class="rc-sec">Bônus de atributo</span>
        <div class="rc-bonus">${BONUS_K.map(([k, n]) => `<label class="${(e.bonus[k] || 0) ? "on" : ""}"><small>${n}</small><input type="number" min="-5" max="5" value="${e.bonus[k] || 0}" oninput="rcEdBonus('${k}', this.value, this)"></label>`).join("")}</div>
        <span class="rc-sec">Traços <em>${e.t.length}</em></span>
        <p class="rc-dica">Com a evolução ligada, cada traço vira um poder na aba 🔥 com origem Raça.</p>
        ${e.t.map((t, k) => `
          <div class="rc-traco">
            <div class="rc-traco-topo"><input value="${esc(t.nome)}" placeholder="Nome do traço" oninput="rcEdT(${k}, 'nome', this.value)"><button type="button" class="rc-tirar" onclick="rcEdTirar(${k})" aria-label="Remover traço">✕</button></div>
            <div class="rc-tres">
              <select onchange="rcEdT(${k}, 'a', this.value)">${opt(ACOES_RC, t.a || "passiva")}</select>
              <select onchange="rcEdT(${k}, 'r', this.value)">${opt(RECS_RC, t.r)}</select>
              <input value="${esc(t.u === "pb" ? "PB" : t.u || "")}" placeholder="Usos" title="Usos: um número ou PB (bônus de proficiência)" oninput="rcEdT(${k}, 'u', this.value)">
            </div>
            <textarea rows="3" placeholder="O que o traço faz" oninput="rcEdT(${k}, 'd', this.value)">${esc(t.d)}</textarea>
          </div>`).join("")}
        <button type="button" class="rc-add" onclick="rcEdAdd()">+ Adicionar traço</button>
        <button type="button" class="popup-salvar-btn" onclick="rcEdSalvar()">Salvar raça</button>
      </div>`;
    const y = document.querySelector("#popup .popup-content")?.scrollTop || 0;
    abrirPopup(e.i >= 0 ? "Editar raça" : "Nova raça", html, true, null);
    const c = document.querySelector("#popup .popup-content");
    if (c && y) c.scrollTop = y;
  }
  window.rcEdV = function (k, v) { rcEd[k] = v; };
  window.rcEdBonus = function (k, v, el) { rcEd.bonus[k] = parseInt(v, 10) || 0; if (el) el.parentElement.classList.toggle("on", !!rcEd.bonus[k]); };
  window.rcEdT = function (k, campo, v) {
    const t = rcEd.t[k];
    if (!t) return;
    if (campo === "u") { const x = String(v).trim(); t.u = /^pb$/i.test(x) ? "pb" : parseInt(x, 10) || ""; }
    else t[campo] = v;
  };
  window.rcEdAdd = function () { rcEd.t.push({ nome: "", d: "", a: "passiva", r: "" }); renderRcEditor(); setTimeout(() => { const l = document.querySelectorAll("#popup .rc-traco-topo input"); l[l.length - 1]?.focus(); }, 60); };
  window.rcEdTirar = function (k) { rcEd.t.splice(k, 1); renderRcEditor(); };
  window.rcEdSalvar = function () {
    const e = rcEd;
    if (!e || typeof racasCustomSalvas === "undefined") return;
    const nome = String(e.nome || "").trim() || "Raça custom";
    const bonus = {};
    BONUS_K.forEach(([k]) => { bonus[k] = parseInt(e.bonus[k], 10) || 0; });
    const t = e.t.filter((x) => String(x.nome || "").trim()).map((x) => { const o = { nome: x.nome.trim(), d: String(x.d || "").trim(), a: x.a || "passiva", r: x.r || "" }; if (x.u) o.u = x.u; return o; });
    const nova = { ...(e.i >= 0 ? racasCustomSalvas[e.i] : {}), nome, bonus, t, tam: e.tam, desl: e.desl, d: e.d };
    if (e.i >= 0) racasCustomSalvas[e.i] = nova; else racasCustomSalvas.push(nova);
    const idx = e.i >= 0 ? e.i : racasCustomSalvas.length - 1;
    try { editandoRacaCustom = -1; } catch (er) {}
    try { salvarRacasCustomStorage(); } catch (er) {}
    try { atualizarDropdownRacas(); } catch (er) {}
    const sel = $("racaSelect");
    const usando = sel && sel.value === "custom_" + idx;
    if (sel && usando) sel.value = "custom_" + idx;
    try { atualizarTudo(); } catch (er) {}
    if (usando && ativo()) sincronizar(); else salvarFicha();
    rcEd = null;
    if (typeof fecharPopup === "function") fecharPopup();
    toast(`${nome} salva`);
  };

  function ligarRacaColar() {
    const orig = window.abrirPopupGerenciarRacasCustom;
    if (typeof orig === "function" && !orig._rc) {
      const novo = function () {
        try { editandoRacaCustom = -1; } catch (e) {}
        const r = orig.apply(this, arguments);
        const form = document.querySelector("#popup .popup-form");
        if (form && typeof window.lerRacaColada === "function" && !form.querySelector(".rc-colar-btn")) {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "rc-colar-btn";
          b.innerHTML = `<i class="ti ti-clipboard-text"></i><span><b>Colar texto</b><small>raça do grupo, de um site, de uma anotação</small></span>`;
          b.onclick = window.rcColarAbrir;
          const nova = [...form.querySelectorAll(".popup-salvar-btn")].pop();
          if (nova) nova.before(b); else form.appendChild(b);
          // quantos traços cada raça colada tem
          form.querySelectorAll(".raca-custom-card").forEach((card, i) => {
            const rr = racasCustomSalvas[i];
            if (rr && Array.isArray(rr.t) && rr.t.length && !card.querySelector(".rc-tracos")) card.querySelector("strong")?.insertAdjacentHTML("afterend", `<small class="rc-tracos">${rr.t.length} traço${rr.t.length > 1 ? "s" : ""}</small>`);
          });
        }
        return r;
      };
      novo._rc = true;
      window.abrirPopupGerenciarRacasCustom = novo;
    }
    // "Editar" e "+ Nova raça" abrem o editor completo (nome, tamanho, bônus e traços)
    if (!window.editarRacaCustom || !window.editarRacaCustom._rc) {
      const ed2 = (i) => rcEditor(i);
      ed2._rc = true;
      window.editarRacaCustom = ed2;
      const nv = () => rcEditor(-1);
      nv._rc = true;
      window.abrirPopupBonusCustom = nv;
    }
    // editar o nome/bônus de uma raça colada não pode apagar os traços dela
    const sv = window.salvarBonusRacaCustom;
    if (typeof sv === "function" && !sv._rc) {
      const n2 = function () {
        const i = typeof editandoRacaCustom !== "undefined" ? editandoRacaCustom : -1;
        const antes = i >= 0 && racasCustomSalvas[i] ? { ...racasCustomSalvas[i] } : null;
        const r = sv.apply(this, arguments);
        if (antes && racasCustomSalvas[i] && antes.t) { ["t", "tam", "desl", "d"].forEach((k) => { if (antes[k] !== undefined) racasCustomSalvas[i][k] = antes[k]; }); try { salvarRacasCustomStorage(); } catch (e) {} }
        try { editandoRacaCustom = -1; } catch (e) {}
        return r;
      };
      n2._rc = true;
      window.salvarBonusRacaCustom = n2;
    }
  }

  /* ======================= GRIMÓRIO: SUBCLASSES DA MESA ======================= */
  const campanha = () => { try { return campanhasMaster[campanhaAtualMaster] || null; } catch (e) { return null; } };
  let smClasse = "";
  let smStatus = "";
  function montarCriarMestre() {
    const grid = document.querySelector(".criar-tipo-grid");
    if (!grid || grid.querySelector("[data-sm]")) return;
    const b = document.createElement("button");
    b.className = "criar-tipo-btn";
    b.dataset.sm = "1";
    b.innerHTML = "<span>Subclasse</span>";
    b.onclick = function () { trocarTipoCriar("subclasse", this); renderSubMestre(); };
    grid.appendChild(b);
    const painel = document.createElement("div");
    painel.id = "criarForm-subclasse";
    painel.className = "criar-form-panel";
    painel.style.display = "none";
    painel.innerHTML = `<div class="criar-form-titulo">Criar Subclasse</div><div id="smEditor" class="sm-wrap"></div>`;
    const paineis = document.querySelectorAll(".criar-form-panel");
    paineis[paineis.length - 1].after(painel);
  }
  function renderSubMestre() {
    const box = $("smEditor");
    if (!box || !temDados()) return;
    const camp = campanha();
    const lista = (camp && camp.subclassesMesa) || [];
    if (!ed || ed.alvo !== "mestre") {
      box.innerHTML = `
        <p class="sm-p">Crie subclasses pra sua mesa. Elas aparecem pros jogadores do grupo na hora de escolher a subclasse, junto com a oficial.</p>
        ${camp && camp.grupoVinculado ? "" : `<p class="sm-aviso">Essa campanha ainda não tem grupo vinculado. Dá pra criar agora; elas chegam aos jogadores quando você vincular um grupo e salvar de novo.</p>`}
        ${smStatus ? `<p class="sm-ok">${esc(smStatus)}</p>` : ""}
        ${lista.length ? `<div class="sm-lista">${lista.map((x) => `
          <div class="sm-card">
            <div><b>${esc(x.nome)}</b><small>${esc(CL(x.classe)?.nome || x.classe)} · ${(x.f || []).length} habilidade${(x.f || []).length === 1 ? "" : "s"}${Object.values(x.magias || {}).flat().length ? ` · ${Object.values(x.magias || {}).flat().length} magia${Object.values(x.magias || {}).flat().length === 1 ? "" : "s"}` : ""}</small></div>
            <button type="button" onclick="smEditar('${esc(x.id)}')">Editar</button>
          </div>`).join("")}</div>` : ""}
        <div class="sm-nova">
          <select id="smClasseSel" onchange="smClasseNova(this.value)"><option value="">Classe da nova subclasse</option>${CLASSES_IGNEA.map((c) => `<option value="${c.id}" ${smClasse === c.id ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select>
          <button type="button" class="btn-master-principal" onclick="smNova()" ${smClasse ? "" : "disabled"}>+ Nova subclasse</button>
        </div>`;
      return;
    }
    const c = CL(ed.cid);
    box.innerHTML = `
      <p class="sm-p">Subclasse de <b>${esc(c.nome)}</b> · níveis ${c.subNiveis.join(", ")}.</p>
      <input value="${esc(ed.nome)}" placeholder="Nome da subclasse" oninput="evEdTopo('nome',this.value)">
      <textarea placeholder="Descrição (quem segue essa subclasse?)" oninput="evEdTopo('d',this.value)">${esc(ed.d)}</textarea>
      <div class="ev-ed-ferr"><button type="button" onclick="evEdBase()">Começar da oficial (${esc(c.sub.nome)})</button></div>
      ${blocosEditor(c)}
      <button type="button" class="btn-master-principal sm-salvar" onclick="smSalvar()">⚡ Salvar e enviar pra mesa</button>
      <div class="sm-acoes">
        <button type="button" onclick="smCancelar()">Cancelar</button>
        ${ed.smId ? `<button type="button" class="sm-excluir" onclick="smExcluir()">Excluir</button>` : ""}
      </div>`;
  }
  window.smClasseNova = function (v) { smClasse = v; renderSubMestre(); };
  window.smNova = function () { if (!smClasse) return; ed = { alvo: "mestre", cid: smClasse, nome: "", d: "", f: [], magias: {} }; smStatus = ""; renderSubMestre(); };
  window.smEditar = function (id) {
    const x = ((campanha() || {}).subclassesMesa || []).find((z) => z.id === id);
    if (!x) return;
    ed = { alvo: "mestre", smId: x.id, cid: x.classe, nome: x.nome, d: x.d || "", f: JSON.parse(JSON.stringify(x.f || [])), magias: JSON.parse(JSON.stringify(x.magias || {})) };
    smStatus = "";
    renderSubMestre();
    $("smEditor").scrollIntoView({ block: "start", behavior: "smooth" });
  };
  window.smCancelar = function () { ed = null; renderSubMestre(); };
  async function enviarGrupo(camp) {
    if (!camp || !camp.grupoVinculado) return "sem grupo";
    if (!window.updateDoc || !window.doc || !window.db) return "offline";
    try { await window.updateDoc(window.doc(window.db, "grupos", camp.grupoVinculado), { subclassesMesa: camp.subclassesMesa || [] }); return "ok"; }
    catch (e) { console.error(e); return "erro"; }
  }
  window.smSalvar = async function () {
    if (!ed.nome.trim()) { const i = $("smEditor").querySelector("input"); i && i.focus(); return; }
    const camp = campanha();
    if (!camp) return;
    camp.subclassesMesa = Array.isArray(camp.subclassesMesa) ? camp.subclassesMesa : [];
    const obj = { id: ed.smId || "sm_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), classe: ed.cid, nome: ed.nome.trim(), d: ed.d || "", f: ed.f.filter((f) => f.nome.trim()).map((f) => ({ ...f, n: Number(f.n) })), magias: ed.magias || {} };
    const i = camp.subclassesMesa.findIndex((z) => z.id === obj.id);
    if (i >= 0) camp.subclassesMesa[i] = obj; else camp.subclassesMesa.push(obj);
    try { salvarCampanhasMaster(); } catch (e) {}
    ed = null;
    const r = await enviarGrupo(camp);
    smStatus = r === "ok" ? `“${obj.nome}” salva e enviada pros jogadores do grupo.` : r === "sem grupo" ? `“${obj.nome}” salva. Vincule um grupo à campanha pra enviar.` : `“${obj.nome}” salva, mas não deu pra enviar ao grupo agora. Tente salvar de novo.`;
    renderSubMestre();
  };
  window.smExcluir = async function () {
    const camp = campanha();
    if (!camp || !ed || !ed.smId) return;
    if (typeof confirmBonito === "function" && !(await confirmBonito(`Excluir a subclasse “${ed.nome}”? Quem já escolheu continua com ela na ficha.`))) return;
    camp.subclassesMesa = (camp.subclassesMesa || []).filter((z) => z.id !== ed.smId);
    try { salvarCampanhasMaster(); } catch (e) {}
    ed = null;
    await enviarGrupo(camp);
    smStatus = "Subclasse excluída.";
    renderSubMestre();
  };

  /* ======================= LIGAÇÕES ======================= */
  function ligarCarregar() {
    const orig = window.carregarPersonagem;
    if (typeof orig !== "function" || orig._ev) return;
    const novo = function () {
      opcoesRaca();
      const r = orig.apply(this, arguments);
      opcoesRaca();
      // ícones antigos feitos de emoji composto (aparecem como dois emojis em alguns aparelhos)
      try { if (typeof poderes !== "undefined") poderes.forEach((p) => { if (p && typeof p.icone === "string" && p.icone.includes("\u200d")) p.icone = p.icone.includes("🩹") ? "💗" : [...p.icone][0]; }); if (typeof renderPoderes === "function") renderPoderes(); } catch (e) {}
      try { const b = $("antCampo"); if (b) b.classList.remove("escrever"); campoAnt(); } catch (e) {}
      renderCard();
      visDominio();
      return r;
    };
    novo._ev = true;
    window.carregarPersonagem = novo;
    try { carregarPersonagem = novo; } catch (e) {}
  }
  function iniciar() {
    if (!temDados()) return;
    opcoesRaca();
    ligarRaca();
    ligarRacaColar();
    ligarDominios();
    visDominio();
    ligarCarregar();
    campoAnt();
    montarCriarMestre();
    ligarEdicaoCampanha();
    renderCard();
  }
  // ao vincular um grupo à campanha, as subclasses da mesa já vão junto
  function ligarEdicaoCampanha() {
    const orig = window.salvarEdicaoCampanha;
    if (typeof orig !== "function" || orig._ev) return;
    const novo = function () {
      const r = orig.apply(this, arguments);
      try { campanhasMaster.forEach((c) => { if (c && c.grupoVinculado && (c.subclassesMesa || []).length) enviarGrupo(c); }); } catch (e) {}
      return r;
    };
    novo._ev = true;
    window.salvarEdicaoCampanha = novo;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
  window.addEventListener("load", iniciar);
})();

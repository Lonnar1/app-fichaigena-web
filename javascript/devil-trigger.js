/* =====================================================================
   DEVIL-TRIGGER.JS · Ficha Ígnea
   Subclasse do Guerreiro "Combatente do Essstilo", criada por
   Vinicius Edney e Giovany Queiroz (não é do SRD).
   - deixa a subclasse pronta pra escolher na Evolução;
   - quem tem ela ganha a aba 💀 Estilo: pontos, rank, Devil Trigger,
     Holofotes Aqui, Estilo Selvagem e Do Céu ao Inferno.
   Os usos vêm dos poderes da aba 🔥 (as cargas voltam nos descansos).
   ===================================================================== */
(function () {
  "use strict";
  if (window._dtPronto) return;
  window._dtPronto = true;

  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  /* ---------- a subclasse ---------- */
  const AUTORES = "Vinicius Edney e Giovany Queiroz";
  const RANKS = [
    { r: "D", min: 1, nome: "Impulso Inicial", d: "Ao acertar seu primeiro golpe, sua CA aumenta em 2, desde que esteja vestindo armadura." },
    { r: "C", min: 2, nome: "Golpe Preciso", d: "Você soma seu bônus de proficiência no dano." },
    { r: "B", min: 3, nome: "Armas Aprimoradas", d: "Suas armas favoritas viram +1 (se já não forem mágicas) e contam como dano mágico para superar resistências." },
    { r: "A", min: 4, nome: "Investida Brutal", d: "Seu deslocamento aumenta em 3 m. Se você andar todo o seu deslocamento antes de atacar, pode abrir mão de um ataque para derrubar o alvo com um teste de Força (CD 8 + proficiência + Força)." },
    { r: "S", min: 5, nome: "Esquiva Reativa", d: "Quando for alvo de um ataque, pode gastar a reação para usar a ação Esquivar. Se evitar algum ataque assim, pode se mover até 3 m sem provocar ataques de oportunidade." },
    { r: "SS", min: 7, nome: "Crítico Aprimorado", d: "Sua margem de crítico cai em 1 (crítico com 19 ou 20). No crítico, adiciona mais um dado do dano da arma e de qualquer efeito que aumente o dano." },
    { r: "SSS", min: 10, nome: "Estilo Supremo", d: "O Essstilo máximo. Sua margem de crítico cai em 2 (crítico com 18 a 20), os dados extras do crítico causam o máximo e, se matar um inimigo, você pode fazer um ataque adicional." },
  ];
  const MAX = 10;
  const tabelaTxt = RANKS.map((x) => `• ${x.r} (${x.min} ponto${x.min > 1 ? "s" : ""}) · ${x.nome}: ${x.d}`).join("\n");

  const SUB = {
    id: "essstilo", classe: "guerreiro", nome: "Combatente do Essstilo", autores: AUTORES,
    d: "Você se especializa em destruir os inimigos da forma mais eficiente e estilosa possível. Cada golpe certeiro rende pontos de estilo, e o estilo rende bônus.",
    f: [
      { n: 3, nome: "Pontos de Estilo", a: "passiva", r: "", u: "", d: "Você ganha bônus de acordo com seus pontos de estilo (acompanhe na aba 💀 Estilo). Só ganha pontos empunhando armas nas duas mãos: uma arma grande, uma em cada mão, arco e flecha e semelhantes.\n\nGanha 1 ponto a cada acerto com suas armas favoritas. Se errar um ataque, for atingido por um ataque, magia ou efeito de área, ou falhar numa salvaguarda, perde pontos: 1 do D ao B, 2 do A ao SS e 3 no SSS.\n\n" + tabelaTxt },
      { n: 3, nome: "Armas Favoritas", a: "passiva", r: "", u: "", d: "Você escolhe um número de armas favoritas igual ao seu bônus de proficiência e pode trocá-las quando sobe de nível nesta classe. Também pode trocá-las no meio do combate, sem gastar ação: você domina o uso de várias armas." },
      { n: 7, nome: "Devil Trigger", a: "bonus", r: "curto", u: "pb", d: "Com uma ação bônus, você ativa seu modificador de estilo. Usos iguais ao seu bônus de proficiência, que voltam num descanso curto ou longo.\n\nAo ativar, seu estilo sobe +2 na hora e, por 1 minuto, seus ataques causam 1d8 de dano necrótico, radiante ou psíquico a mais. Se estiver no rank B ou acima, no primeiro turno com o Devil Trigger você ganha 1 ataque adicional e um dos ataques causa 3d8 a mais.\n\nA cada nova característica de arquétipo nesta classe (níveis 10, 15 e 18), os dois danos aumentam em 1d8." },
      { n: 10, nome: "Holofotes Aqui", a: "passiva", r: "longo", u: "con", d: "Quando for atingido por um ataque, magia ou efeito de área e perder estilo, se continuar no rank A ou acima, você pode usar o Retomar o Fôlego logo em seguida. Usos iguais ao seu modificador de Constituição, que voltam num descanso longo." },
      { n: 15, nome: "Estilo Selvagem", a: "passiva", r: "", u: "", d: "Você pode gastar um uso do Devil Trigger para subir seu estilo direto para o rank S. Cada uso desta habilidade dá 1 nível de exaustão." },
      { n: 18, nome: "Do Céu ao Inferno", a: "passiva", r: "curto", u: "pb", d: "Seu combate fica tão estiloso e implacável que nada te para: você não perde mais estilo, a não ser que fique inconsciente ou morra. No rank SSS, um acerto crítico triplica o dano em vez de dobrar, e pode causar o dano máximo do ataque. Usos iguais ao seu bônus de proficiência, que voltam num descanso curto ou longo." },
    ],
    magias: {},
  };
  // a Evolução lista as subclasses que já vêm no app (fora do SRD) por classe
  window.SUBCLASSES_PADRAO = (window.SUBCLASSES_PADRAO || []).filter((x) => x.id !== SUB.id).concat([SUB]);

  /* ---------- ficha ---------- */
  const ficha = () => (typeof personagens !== "undefined" && typeof personagemAtual !== "undefined" && personagemAtual !== null ? personagens[personagemAtual] : null);
  function temSub(p) {
    const s = p && p.progressao && p.progressao.subs && p.progressao.subs.guerreiro;
    return !!(s && (s.padrao === SUB.id || norm(s.nome).replace(/[^a-z]/g, "").includes("essstilo")));
  }
  const nivelGuerreiro = (p) => ((p && p.progressao && p.progressao.niveis) || []).filter((n) => n.c === "guerreiro").length;
  const pb = () => (typeof get === "function" ? get("bonusProf") : 2) || 2;
  function estado(p) {
    p.estilo = p.estilo && typeof p.estilo === "object" ? p.estilo : {};
    const e = p.estilo;
    e.pontos = Math.max(0, Math.min(MAX, Number(e.pontos) || 0));
    e.gastos = e.gastos && typeof e.gastos === "object" ? e.gastos : {};
    return e;
  }
  const rankDe = (n) => { let r = null; RANKS.forEach((x) => { if (n >= x.min) r = x; }); return r; };
  const idxRank = (n) => { const r = rankDe(n); return r ? RANKS.indexOf(r) : -1; };
  // dado extra do Devil Trigger: +1d8 a cada característica de arquétipo depois do 7 (10, 15, 18)
  function dadosDT(lv) { const extra = [10, 15, 18].filter((n) => lv >= n).length; return { sempre: 1 + extra, golpe: 3 + extra }; }

  /* usos: a carga do poder na aba 🔥; sem o poder, um contador da própria aba */
  const USOS = {
    dt: { nome: "devil trigger", max: () => pb() },
    holo: { nome: "holofotes aqui", max: () => Math.max(1, typeof modAtributo === "function" ? modAtributo("constituicao") : 1) },
    ceu: { nome: "do ceu ao inferno", max: () => pb() },
  };
  const poderDe = (k) => (typeof poderes !== "undefined" ? poderes.find((x) => norm(x.nome) === USOS[k].nome && x.temCargas && x.maxCargas > 0) : null);
  function usos(k) {
    const pw = poderDe(k);
    if (pw) { const g = (pw.cargasGastas || []).filter(Boolean).length; return { livres: pw.maxCargas - g, max: pw.maxCargas }; }
    const p = ficha(), e = estado(p), max = USOS[k].max();
    return { livres: Math.max(0, max - (e.gastos[k] || 0)), max };
  }
  function gastar(k) {
    const pw = poderDe(k);
    if (pw) {
      const i = (pw.cargasGastas || []).findIndex((x) => !x);
      if (i < 0) return false;
      pw.cargasGastas[i] = true;
      try { renderPoderes(); } catch (er) {}
      return true;
    }
    const e = estado(ficha());
    if (usos(k).livres <= 0) return false;
    e.gastos[k] = (e.gastos[k] || 0) + 1;
    return true;
  }

  /* ---------- aba ---------- */
  function garantirAba() {
    const p = ficha();
    const pode = temSub(p);
    let btn = document.querySelector('#ficha .tabs .tab-btn[data-dt]');
    let aba = $("estilo");
    if (!pode) {
      if (aba && aba.classList.contains("active") && typeof trocarAba === "function") trocarAba("personagem");
      if (btn) btn.remove();
      const fl = $("dtFlutua"); if (fl) fl.classList.remove("on");
      return false;
    }
    const tabs = document.querySelector("#ficha .tabs");
    if (!btn && tabs) {
      btn = document.createElement("button");
      btn.className = "tab-btn";
      btn.dataset.dt = "1";
      btn.setAttribute("onclick", "trocarAba('estilo', this)");
      btn.setAttribute("aria-label", "Estilo");
      btn.textContent = "💀";
      const pod = [...tabs.querySelectorAll(".tab-btn")].find((b) => /trocarAba\('poderes'/.test(b.getAttribute("onclick") || ""));
      if (pod) pod.after(btn); else tabs.appendChild(btn);
    }
    if (!aba) {
      const ref = $("poderes");
      aba = document.createElement("div");
      aba.className = "aba";
      aba.id = "estilo";
      aba.style.display = "none";
      if (ref) ref.after(aba); else return false;
    }
    if (typeof ORDEM_ABAS_FICHA !== "undefined" && !ORDEM_ABAS_FICHA.includes("estilo")) ORDEM_ABAS_FICHA.splice(ORDEM_ABAS_FICHA.indexOf("poderes") + 1, 0, "estilo");
    if (btn && typeof abasOcultas !== "undefined") btn.style.display = abasOcultas.includes("estilo") ? "none" : "";
    return true;
  }

  /* ---------- golpe: o dano da arma escolhida com tudo que o estilo soma ---------- */
  const listaArmas = () => (typeof armas !== "undefined" && Array.isArray(armas) ? armas : []);
  function golpe(e, n, lv) {
    const l = listaArmas();
    let i = Number.isInteger(e.arma) && l[e.arma] ? e.arma : l.findIndex((a) => typeof extrairDados === "function" && extrairDados(a.dano));
    if (i < 0) i = l.length ? 0 : -1;
    const a = l[i];
    if (!a) return null;
    const ir = idxRank(n), dd = dadosDT(lv);
    const base = typeof extrairDados === "function" ? extrairDados(a.dano) || "" : "";
    const dados = [], partes = [];
    let fixo = 0;
    (base.match(/[+-]?[^+-]+/g) || []).forEach((t) => { if (/d/i.test(t)) dados.push(t.replace(/^\+/, "").trim()); else fixo += parseInt(t, 10) || 0; });
    if (dados.length) partes.push({ rot: "Arma", v: dados.join("+") });
    if (fixo) partes.push({ rot: "Arma", v: (fixo > 0 ? "+" : "") + fixo, n: fixo });
    const atr = a.atributoAtaque;
    const sigla = typeof SIGLAS_ATRIBUTO !== "undefined" && atr ? SIGLAS_ATRIBUTO[atr] : "";
    let total = fixo;
    if (atr && a.somarAtribDano !== false && typeof modAtributo === "function") { const m = modAtributo(atr); total += m; partes.push({ rot: sigla || "Atributo", v: (m >= 0 ? "+" : "") + m, n: m }); }
    const bd = parseInt(a.bonusDano, 10) || 0;
    if (bd) { total += bd; partes.push({ rot: "Bônus da arma", v: (bd > 0 ? "+" : "") + bd, n: bd }); }
    if (ir >= 1) { total += pb(); partes.push({ rot: "Prof (C)", v: "+" + pb(), n: pb(), estilo: true }); }
    const jaMagica = bd > 0 || (parseInt(a.bonusAtaque, 10) || 0) > 0;
    const maisUm = ir >= 2 && !jaMagica;
    if (maisUm) { total += 1; partes.push({ rot: "Arma +1 (B)", v: "+1", n: 1, estilo: true }); }
    const dt = e.dtAtivo && lv >= 7 ? `${dd.sempre}d8` : "";
    if (dt) partes.push({ rot: "Devil Trigger", v: "+" + dt, estilo: true, dt: true });
    const todos = dados.concat(dt ? [dt] : []);
    // junta dados iguais: 1d8 + 1d8 = 2d8
    const porFace = {};
    todos.forEach((d) => { const m = d.match(/^(\d*)d(\d+)$/i); if (m) porFace[m[2]] = (porFace[m[2]] || 0) + Number(m[1] || 1); });
    const juntos = Object.keys(porFace).length === todos.length || todos.every((d) => /^\d*d\d+$/i.test(d)) ? Object.keys(porFace).sort((x, y) => y - x).map((f) => `${porFace[f]}d${f}`) : todos;
    const expr = juntos.join("+") + (total ? (total > 0 ? "+" : "") + total : "") || "0";
    const media = Math.floor(todos.reduce((t, d) => { const m = d.match(/(\d*)d(\d+)/i); return m ? t + (Number(m[1] || 1) * (Number(m[2]) + 1)) / 2 : t; }, 0) + total);
    const atk = (typeof calcAtaqueArma === "function" ? calcAtaqueArma(a).total : 0) + (maisUm ? 1 : 0);
    const tipoBase = typeof separarDanoArma === "function" ? separarDanoArma(a).tipo : "";
    return { i, a, expr, media, atk, partes, tipo: ir >= 2 ? `${tipoBase || "dano"} mágico` : tipoBase || "", magico: ir >= 2, crit: ir >= 6 ? "18–20" : ir >= 5 ? "19–20" : "20", primeiro: e.dtAtivo && e.dtRankB ? `${dd.golpe}d8` : "" };
  }
  window.dtArma = function (i) { const e = estado(ficha()); e.arma = i; render(); salvar(); };
  window.dtAtacar = function () {
    const p = ficha(), e = estado(p), g = golpe(e, e.pontos, nivelGuerreiro(p));
    if (g && typeof rolarD20 === "function") rolarD20(`Ataque · ${g.a.nome || "arma"}${g.crit !== "20" ? ` (crítico ${g.crit})` : ""}`, g.atk);
  };
  window.dtDano = function (crit) {
    const p = ficha(), e = estado(p), g = golpe(e, e.pontos, nivelGuerreiro(p));
    if (g && typeof rolarDano === "function") rolarDano(`Dano · ${g.a.nome || "arma"}${g.magico ? " (mágico)" : ""}`, g.expr, !!crit);
  };

  function render() {
    if (!garantirAba()) return;
    const aba = $("estilo"), p = ficha(), e = estado(p), lv = nivelGuerreiro(p);
    const n = e.pontos, rk = rankDe(n), ir = idxRank(n);
    const dt = lv >= 7 ? usos("dt") : null, holo = lv >= 10 ? usos("holo") : null, ceu = lv >= 18 ? usos("ceu") : null;
    const dd = dadosDT(lv);
    const marcas = RANKS.map((x) => `<i class="${n >= x.min ? "on" : ""}" style="left:${(x.min / MAX) * 100}%"><b>${x.r}</b></i>`).join("");
    const bolinhas = (u) => `<span class="dt-usos">${Array.from({ length: u.max }, (_, i) => `<i class="${i < u.livres ? "on" : ""}"></i>`).join("")}</span>`;
    const ativos = [];
    if (ir >= 0) ativos.push(e.armadura === false ? "CA +2 (só com armadura)" : "CA +2 após o 1º acerto");
    if (ir >= 1) ativos.push(`+${pb()} no dano`);
    if (ir >= 2) ativos.push("Armas +1, dano mágico");
    if (ir >= 3) ativos.push("+3 m de deslocamento");
    if (ir >= 4) ativos.push("Esquivar na reação");
    if (ir >= 6) ativos.push("Crítico 18–20");
    else if (ir >= 5) ativos.push("Crítico 19–20");
    if (e.dtAtivo && lv >= 7) ativos.push(`+${dd.sempre}d8 necrótico, radiante ou psíquico`);

    const g = golpe(e, n, lv);
    const armasL = listaArmas();
    aba.innerHTML = `
      <h2 class="titulo-secao">Estilo</h2>
      <div class="dt-fixo ${e.dtAtivo ? "trigger" : ""}">
        <div class="dt-hud">
          <div class="dt-rank ${rk ? "r-" + rk.r : "vazio"}"><span>${rk ? rk.r : "–"}</span><small>${rk ? esc(rk.nome) : "Sem estilo"}</small></div>
          <div class="dt-barra-box">
            <div class="dt-pts"><b>${n}</b><small>/ ${MAX} pontos de estilo</small></div>
            <div class="dt-barra"><span style="width:${(n / MAX) * 100}%"></span>${marcas}</div>
          </div>
        </div>
        ${g ? `<div class="dt-dano">
          <div class="dt-dano-num"><small>Dano</small><b>${esc(g.expr)}</b><em>média ${g.media}${g.tipo ? ` · <span class="${g.magico ? "mag" : ""}">${esc(g.tipo)}</span>` : ""}</em></div>
          <div class="dt-dano-bt">
            <button type="button" onclick="dtAtacar()"><small>Ataque</small><b>${g.atk >= 0 ? "+" : ""}${g.atk}</b></button>
            <button type="button" class="forte" onclick="dtDano()"><small>Rolar</small><b>Dano</b></button>
          </div>
        </div>` : `<p class="dt-sem-arma">Adicione suas armas favoritas na aba ⚔️ pra ver o dano com o estilo.</p>`}
      </div>
      ${g ? `<div class="dt-golpe">
        ${armasL.length > 1 ? `<div class="dt-armas">${armasL.map((a, k) => `<button type="button" class="${k === g.i ? "on" : ""}" onclick="dtArma(${k})">${esc(a.nome || "Arma")}</button>`).join("")}</div>` : ""}
        <div class="dt-conta">${g.partes.map((x) => `<span class="${x.estilo ? "est" : ""}${x.dt ? " dt" : ""}"><small>${esc(x.rot)}</small>${esc(x.v)}</span>`).join("")}</div>
        <div class="dt-golpe-pe">
          <span>Crítico com <b>${g.crit}</b></span>
          ${g.primeiro ? `<span class="dt">1º turno: +1 ataque e <b>+${g.primeiro}</b> num golpe</span>` : ""}
          <button type="button" onclick="dtDano(true)">Rolar crítico</button>
        </div>
      </div>` : ""}
      ${ativos.length ? `<div class="dt-ativos">${ativos.map((a) => `<span>${esc(a)}</span>`).join("")}</div>` : `<p class="dt-dica">Acerte golpes seguidos com suas armas favoritas pra ganhar estilo. Precisa estar com armas nas duas mãos.</p>`}

      <div class="dt-botoes">
        <button type="button" class="dt-b bom" onclick="dtAcerto(1)" ${n >= MAX ? "disabled" : ""}><i class="ti ti-target-arrow"></i><span>Acertei</span><small>${n >= MAX ? "estilo no máximo" : "+1 de estilo"}</small></button>
        ${lv >= 18
          ? `<button type="button" class="dt-b ruim lado" onclick="dtZerar(true)"><i class="ti ti-skull"></i><span>Caí inconsciente</span><small>Do Céu ao Inferno: só isso zera</small></button>`
          : `<button type="button" class="dt-b ruim lado" onclick="dtErro()"><i class="ti ti-shield-x"></i><span>Errei ou fui atingido</span><small>${n >= 10 ? "−3 no SSS" : n >= 4 ? "−2 do A ao SS" : "−1 do D ao B"}</small></button>`}
      </div>

      ${lv >= 7 ? `
      <div class="dt-card dt-trigger ${e.dtAtivo ? "on" : ""}">
        <div class="dt-card-topo"><b><i class="ti ti-flame"></i> Devil Trigger</b>${bolinhas(dt)}</div>
        ${e.dtAtivo
          ? `<p>Ativo por 1 minuto: <b>+${dd.sempre}d8</b> necrótico, radiante ou psíquico em todos os ataques.${e.dtRankB ? ` No primeiro turno: <b>1 ataque adicional</b> e um ataque causa <b>+${dd.golpe}d8</b>.` : ""}</p>
             <button type="button" class="dt-acao" onclick="dtDesligar()">Acabou o minuto</button>`
          : `<p>Ação bônus: estilo +2 e, por 1 minuto, <b>+${dd.sempre}d8</b> nos ataques. No rank B ou acima: 1 ataque extra e <b>+${dd.golpe}d8</b> num golpe no primeiro turno.</p>
             <button type="button" class="dt-acao forte" onclick="dtAtivar()" ${dt.livres ? "" : "disabled"}>${dt.livres ? "Ativar Devil Trigger" : "Sem usos: descanse"}</button>`}
        ${lv >= 15 ? `<button type="button" class="dt-acao" onclick="dtSelvagem()" ${dt.livres ? "" : "disabled"}><i class="ti ti-bolt"></i> Estilo Selvagem: direto pro S <small>gasta 1 uso, +1 exaustão</small></button>` : ""}
      </div>` : `<div class="dt-card trancado"><b><i class="ti ti-lock"></i> Devil Trigger</b><p>Libera no 7º nível de Guerreiro.</p></div>`}

      ${lv >= 18 ? `
      <div class="dt-card">
        <div class="dt-card-topo"><b><i class="ti ti-meteor"></i> Do Céu ao Inferno</b>${bolinhas(ceu)}</div>
        <p>Você não perde mais estilo. No SSS, o crítico <b>triplica</b> o dano e pode causar o máximo do ataque.</p>
        <button type="button" class="dt-acao" onclick="dtCeu()" ${ceu.livres && ir >= 6 ? "" : "disabled"}>${ir >= 6 ? "Usar no crítico" : "Precisa estar no SSS"}</button>
      </div>` : ""}

      <h5 class="dt-h">Ranks</h5>
      <div class="dt-ranks">${RANKS.map((x, i) => `
        <div class="dt-r ${i <= ir ? "on" : ""}">
          <span class="dt-r-letra r-${x.r}">${x.r}</span>
          <div><b>${esc(x.nome)}</b><small>${x.min} ponto${x.min > 1 ? "s" : ""}</small><p>${esc(x.d)}</p></div>
        </div>`).join("")}</div>
      <div class="dt-rodape">
        <button type="button" onclick="dtZerar()">Zerar estilo</button>
        <span>${esc(SUB.nome)} · criada por ${esc(AUTORES)}</span>
      </div>`;
    renderFlutua(rk, n, g, e.dtAtivo);
  }

  /* ---------- barrinha que fica presa no topo quando o card some da tela ---------- */
  function flutua() {
    let f = $("dtFlutua");
    if (!f) {
      f = document.createElement("div");
      f.id = "dtFlutua";
      f.className = "dt-flutua";
      document.body.appendChild(f);
    }
    return f;
  }
  function atualizarFlutua() {
    const aba = $("estilo"), card = aba && aba.querySelector(".dt-fixo");
    const f = flutua();
    const ver = !!(card && aba.classList.contains("active") && aba.style.display !== "none" && card.getBoundingClientRect().bottom < 4 && !document.body.classList.contains("cb2-travado"));
    f.classList.toggle("on", ver);
  }
  function renderFlutua(rk, n, g, trigger) {
    const f = flutua();
    f.classList.toggle("trigger", !!trigger);
    f.innerHTML = `
      <span class="dt-fl-rank ${rk ? "r-" + rk.r : ""}">${rk ? rk.r : "–"}</span>
      <div class="dt-fl-meio">
        <div class="dt-fl-linha"><b>${g ? esc(g.expr) : "—"}</b>${g && g.magico ? `<em>mágico</em>` : ""}<small>${n}/${MAX}</small></div>
        <div class="dt-fl-barra"><span style="width:${(n / MAX) * 100}%"></span></div>
      </div>
      ${g ? `<button type="button" onclick="dtAtacar()">${g.atk >= 0 ? "+" : ""}${g.atk}</button><button type="button" class="forte" onclick="dtDano()">Dano</button>` : ""}
      <button type="button" class="ok" onclick="dtAcerto(1)" aria-label="Acertei">+1</button>`;
    atualizarFlutua();
  }
  window.addEventListener("scroll", atualizarFlutua, { passive: true, capture: true });
  window.addEventListener("resize", atualizarFlutua);

  /* ---------- ações ---------- */
  const salvar = () => { try { salvarTudo(); } catch (er) {} };
  const aviso = (m) => { if (typeof mostrarToastMundo === "function") mostrarToastMundo(m); };
  function setPontos(v, motivo) {
    const e = estado(ficha());
    const antes = rankDe(e.pontos);
    e.pontos = Math.max(0, Math.min(MAX, v));
    const depois = rankDe(e.pontos);
    render();
    salvar();
    if (depois && (!antes || RANKS.indexOf(depois) > RANKS.indexOf(antes))) {
      const el = document.querySelector("#estilo .dt-rank");
      if (el) { el.classList.remove("sobe"); void el.offsetWidth; el.classList.add("sobe"); }
      aviso(`Rank ${depois.r}: ${depois.nome}${motivo ? ` (${motivo})` : ""}`);
    } else if (motivo) aviso(motivo);
  }
  window.dtAcerto = function (n) { const e = estado(ficha()); setPontos(e.pontos + n); };
  // regra da mesa: perde 1 do D ao B, 2 do A ao SS (9 → 7 → 5 → 3) e 3 no SSS
  window.dtErro = function () {
    const e = estado(ficha());
    if (!e.pontos) return;
    const perde = e.pontos >= 10 ? 3 : e.pontos >= 4 ? 2 : 1;
    const novo = e.pontos - perde, lv = nivelGuerreiro(ficha());
    // Holofotes Aqui: continuou no A ou acima → pode Retomar o Fôlego
    const holo = lv >= 10 && idxRank(novo) >= 3 && usos("holo").livres > 0;
    setPontos(novo, holo ? `−${perde} de estilo · Holofotes Aqui: dá pra usar o Retomar o Fôlego agora` : `−${perde} de estilo`);
  };
  window.dtHolofotes = function () {
    const e = estado(ficha());
    if (!gastar("holo")) return aviso("Sem usos de Holofotes Aqui");
    const novo = Math.max(0, e.pontos - 3);
    setPontos(novo, rankDe(novo) && idxRank(novo) >= 3 ? "Holofotes Aqui: −3. Pode usar o Retomar o Fôlego agora" : "Holofotes Aqui: −3");
  };
  window.dtZerar = function (inconsciente) { setPontos(0, inconsciente ? "Estilo zerado" : ""); };
  window.dtAtivar = function () {
    const e = estado(ficha());
    if (!gastar("dt")) return aviso("Sem usos de Devil Trigger: descanse");
    e.dtAtivo = true;
    e.dtRankB = idxRank(e.pontos) >= 2; // o rank conta na hora de ativar
    setPontos(e.pontos + 2, "Devil Trigger! Estilo +2");
  };
  window.dtDesligar = function () { const e = estado(ficha()); e.dtAtivo = false; e.dtRankB = false; render(); salvar(); };
  window.dtSelvagem = function () {
    const e = estado(ficha());
    if (!gastar("dt")) return aviso("Sem usos de Devil Trigger");
    if (typeof setExaustao === "function" && typeof exaustao !== "undefined") setExaustao(Math.min(6, (Number(exaustao) || 0) + 1));
    setPontos(Math.max(e.pontos, 5), "Estilo Selvagem: rank S, +1 de exaustão");
  };
  window.dtCeu = function () {
    if (!gastar("ceu")) return aviso("Sem usos de Do Céu ao Inferno");
    render(); salvar();
    aviso("Do Céu ao Inferno: crítico triplicado");
  };

  /* ---------- ligar no resto do app ---------- */
  function embrulhar(nome, depois) {
    const orig = window[nome];
    if (typeof orig !== "function" || orig._dt) return;
    const novo = function () {
      const r = orig.apply(this, arguments);
      if (r && typeof r.then === "function") r.then(() => { try { depois(); } catch (er) {} });
      else try { depois(); } catch (er) {}
      return r;
    };
    novo._dt = true;
    window[nome] = novo;
    try { (0, eval)(`${nome} = window.${nome}`); } catch (er) {}
  }
  function aoDescansar(longo) {
    const p = ficha();
    if (!temSub(p)) return;
    const e = estado(p);
    // contadores próprios (quando o poder não está na aba 🔥)
    ["dt", "ceu"].forEach((k) => { if (!poderDe(k)) e.gastos[k] = 0; });
    if (longo && !poderDe("holo")) e.gastos.holo = 0;
    e.dtAtivo = false; e.dtRankB = false; e.pontos = 0;
    render();
    salvar();
  }
  function iniciar() {
    embrulhar("carregarPersonagem", render);
    embrulhar("renderPoderes", () => { if (garantirAba() && $("estilo") && $("estilo").classList.contains("active")) render(); else garantirAba(); });
    embrulhar("aplicarAbasVisiveis", garantirAba);
    embrulhar("descansoCurto", () => aoDescansar(false));
    embrulhar("descansoLongo", () => aoDescansar(true));
    embrulhar("trocarAba", () => { const a = $("estilo"); if (a && a.classList.contains("active")) render(); else atualizarFlutua(); });
    embrulhar("renderArmas", () => { const a = $("estilo"); if (a && a.classList.contains("active")) render(); });
    render();
  }
  window.dtRender = render;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
  window.addEventListener("load", () => { try { render(); } catch (er) {} });
})();

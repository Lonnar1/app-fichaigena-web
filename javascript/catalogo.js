/* =====================================================================
   CATALOGO.JS · "Em branco / Do catálogo" nos painéis de nova arma,
   nova armadura e novo item. O catálogo abre por cima do painel, com
   busca e filtros; ao escolher, o formulário já vem preenchido e o
   jogador ainda pode mudar tudo antes de adicionar.
   Dados em catalogo-dados.js (CATALOGO_IGNEA).
   ===================================================================== */
(function () {
  if (window._ctgPronto) return;
  window._ctgPronto = true;

  const $ = (id) => document.getElementById(id);
  const e = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const TIPOS = {
    arma: { lista: "armas", titulo: "Catálogo de armas", usar: "Usar esta arma", sheet: "cb2Sheet-arma" },
    armadura: { lista: "armaduras", titulo: "Catálogo de armaduras", usar: "Usar esta armadura", sheet: "cb2Sheet-armadura" },
    item: { lista: "itens", titulo: "Catálogo de itens", usar: "Usar este item", sheet: "boxItensForm" },
    magia: { lista: "magias", titulo: "Catálogo de magias", usar: "Usar esta magia", sheet: "popup" },
    mestreItem: { lista: "itens", titulo: "Catálogo de itens", usar: "Usar este item", sheet: "criarForm-item", mestre: true },
    mestreMonstro: { lista: "monstros", titulo: "Bestiário", usar: "Usar esta criatura", sheet: "criarForm-monstro", mestre: true },
    mestreBoss: { lista: "monstros", titulo: "Bestiário", usar: "Usar como chefe", sheet: "criarForm-boss", mestre: true },
  };
  // versão site: sem os painéis que sobem de baixo, os formulários são as caixas antigas
  const SHEET_ALT = { arma: "boxArmasForm", armadura: "boxArmadurasForm" };
  function acertarSheets() {
    Object.entries(SHEET_ALT).forEach(([t, alt]) => { if (TIPOS[t] && !document.getElementById(TIPOS[t].sheet) && document.getElementById(alt)) TIPOS[t].sheet = alt; });
  }
  const corpoDe = (sh) => (sh ? sh.querySelector(".cb2-sh-corpo") || (sh.classList.contains("conteudo-toggle") ? sh : null) : null);
  /* ---------- criaturas (Grimório) ---------- */
  const ehMonstro = (t) => t === "mestreMonstro" || t === "mestreBoss";
  const monstros = () => (typeof CATALOGO_MONSTROS !== "undefined" ? CATALOGO_MONSTROS : []);
  const ndNum = (n) => (String(n).includes("/") ? 1 / parseInt(String(n).split("/")[1]) : parseInt(n) || 0);
  const tipoBase = (x) => x.tipo.replace(/\s*\(.*\)$/, "");
  const FAIXAS_ND = [[0.99, "ND 0 a 1/2"], [4, "ND 1 a 4"], [10, "ND 5 a 10"], [16, "ND 11 a 16"], [99, "ND 17 ou mais"]];
  const faixaND = (x) => FAIXAS_ND.find(([m]) => ndNum(x.nd) <= m)[1];
  const XP_FMT = (x) => (x.xp ? `${x.xp} XP` : "");
  const ATR_ROT = ["FOR", "DES", "CON", "INT", "SAB", "CAR"];
  const modTxt = (v) => { const m = Math.floor((v - 10) / 2); return m >= 0 ? `+${m}` : `${m}`; };
  // itens: "Comuns" ou "Mágicos"
  let subItem = "comuns";
  const ehItem = (t) => t === "item" || t === "mestreItem";
  const magicos = () => (typeof CATALOGO_MAGICOS !== "undefined" ? CATALOGO_MAGICOS : []);
  const ORDEM_MAGICOS = ["Arma", "Armadura", "Escudo", "Anel", "Poção", "Varinha", "Cajado", "Bastão", "Pergaminho", "Item maravilhoso"];
  const ORDEM_RAR = ["Comum", "Incomum", "Raro", "Muito raro", "Lendário", "Artefato", "Varia"];
  const TITULO_MAGICOS = { Arma: "Armas mágicas", Armadura: "Armaduras mágicas", Escudo: "Escudos mágicos", Anel: "Anéis", "Poção": "Poções e óleos", Varinha: "Varinhas", Cajado: "Cajados", "Bastão": "Bastões", Pergaminho: "Pergaminhos", "Item maravilhoso": "Itens maravilhosos" };
  // armas e armaduras também têm "Comuns / Mágicas"; itens mágicos do jogador ficam só com o que não é arma nem armadura
  const temSub = (t) => ehItem(t) || t === "arma" || t === "armadura";
  const mag = (tipo) => temSub(tipo) && subItem === "magicos";
  const ARMA_TIPOS = ["Arma"], ARMADURA_TIPOS = ["Armadura", "Escudo"];
  function magicosDe(tipo) {
    const l = magicos();
    if (tipo === "arma") return l.filter((x) => ARMA_TIPOS.includes(x.tipo));
    if (tipo === "armadura") return l.filter((x) => ARMADURA_TIPOS.includes(x.tipo));
    if (tipo === "item") return l.filter((x) => !ARMA_TIPOS.includes(x.tipo) && !ARMADURA_TIPOS.includes(x.tipo));
    return l;
  }
  // arma base e bônus das armas mágicas (vazio = vale pra qualquer arma)
  const BASE_ARMA_MAG = {
    "adaga-venenosa": ["Adaga", 1], "arco-de-energia": ["Arco longo", 1], "arco-do-juramento": ["Arco longo", 3], "azagaia-do-relampago": ["Azagaia", 0],
    "bordao-do-acrobata": ["Bordão", 2], "cimitarra-da-velocidade": ["Cimitarra", 2], "clava-grande-trovejante": ["Clava grande", 0], "defensora": ["", 3],
    "espada-vorpal": ["", 3], "ladra-das-nove-vidas": ["", 2], "lamina-solar": ["Espada longa", 2], "machado-do-berserker": ["Machado de batalha", 1],
    "martelo-arremessador-anao": ["Martelo de guerra", 3], "martelo-dos-trovoes": ["Malho", 1], "matadora-de-dragoes": ["", 1], "matadora-de-gigantes": ["", 1],
    "maca-da-ruptura": ["Maça", 0], "maca-do-esmagamento": ["Maça", 1], "maca-do-terror": ["Maça", 0], "tridente-do-comando-aquatico": ["Tridente", 0], "vingadora-sagrada": ["", 3],
  };
  const CA_ARMADURA_MAG = {
    "armadura-demoniaca": "19", "armadura-da-invulnerabilidade": "18", "armadura-da-vulnerabilidade": "18", "armadura-de-placas-eterea": "18",
    "brunea-de-escamas-de-dragao": "15 + Des (máx. 2)", "cota-elfica": "14 + Des (máx. 2)", "couro-batido-encantado": "13 + Des", "placas-anas": "20",
    "escudo-1-2-ou-3": "+2", "escudo-animado": "+2", "escudo-antimagia": "+2", "escudo-atrai-projeteis": "+2", "escudo-pega-flechas": "+2", "escudo-sentinela": "+2", "escudo-do-cavaleiro": "+4",
  };
  const comunsDe = (tipo) => ((typeof CATALOGO_IGNEA !== "undefined" ? CATALOGO_IGNEA[TIPOS[tipo].lista] : null) || []);
  const idCurto = (x) => String(x.id || "").replace(/^magico\./, "");
  const CIRC = (c) => (c === 0 ? "Truque" : `${c}º círculo`);
  const CIRC_CURTO = (c) => (c === 0 ? "Truque" : `${c}º`);
  const ACAO_ROT = { acao: "Ação", bonus: "Ação bônus", reacao: "Reação", "": "Mais demorada" };

  const ORDEM_ITENS = ["Aventura", "Luz e fogo", "Recipientes", "Consumíveis", "Munição", "Kits de aventura", "Focos de magia", "Roupas",
    "Ferramentas de artesão", "Outras ferramentas", "Jogos", "Instrumentos musicais", "Montarias e animais", "Arreios e veículos", "Embarcações"];
  const ORDEM_ARMADURAS = ["Leve", "Média", "Pesada", "Escudo"];
  const PROPS = ["Acuidade", "Leve", "Arremesso", "Duas mãos", "Versátil", "Pesada", "Alcance", "Munição", "Recarga"];

  /* ---------- o que cada tipo mostra ---------- */
  function lista_(t) { return lista(t); }
  function lista(tipo) {
    if (ehMonstro(tipo)) return monstros();
    if (tipo === "magia") return typeof CATALOGO_MAGIAS !== "undefined" ? CATALOGO_MAGIAS : [];
    if (mag(tipo)) return magicosDe(tipo);
    if (tipo === "mestreItem") tipo = "item";
    const c = typeof CATALOGO_IGNEA !== "undefined" ? CATALOGO_IGNEA : {};
    return c[TIPOS[tipo].lista] || [];
  }

  function grupoDe(tipo, x) {
    if (ehMonstro(tipo)) return { titulo: `Nível de desafio ${x.nd}`, ordem: ndNum(x.nd) };
    if (tipo === "magia") return { titulo: x.c === 0 ? "Truques" : CIRC(x.c), ordem: x.c };
    if (mag(tipo)) return { titulo: TITULO_MAGICOS[x.tipo] || x.tipo, ordem: ORDEM_MAGICOS.indexOf(x.tipo) };
    if (tipo === "mestreItem") tipo = "item";
    if (tipo === "arma") {
      const ordem = (x.tipo === "Simples" ? 0 : 2) + (x.uso === "Corpo a corpo" ? 0 : 1);
      return { titulo: `${x.tipo === "Simples" ? "Simples" : "Marciais"} · ${x.uso === "Corpo a corpo" ? "corpo a corpo" : "à distância"}`, ordem };
    }
    if (tipo === "armadura") {
      const i = ORDEM_ARMADURAS.indexOf(x.tipo);
      return { titulo: x.tipo === "Escudo" ? "Escudos" : `Armaduras ${x.tipo === "Média" ? "médias" : x.tipo === "Leve" ? "leves" : "pesadas"}`, ordem: i };
    }
    const i = ORDEM_ITENS.indexOf(x.grupo);
    return { titulo: x.grupo, ordem: i < 0 ? 99 : i };
  }

  // gavetas do filtro: [rótulo, valores do item]
  function facetas(tipo, x) {
    if (ehMonstro(tipo)) {
      const esp = [];
      if (x.l && x.l.length) esp.push("Ações lendárias");
      if (/voo/.test(x.vel)) esp.push("Voa");
      if (/natação/.test(x.vel)) esp.push("Nada");
      if (x.h.some((h) => /^Conjuração/.test(h[0]))) esp.push("Conjura magias");
      if (x.r && x.r.length) esp.push("Tem reação");
      return [["Nível de desafio", [faixaND(x)]], ["Tipo", [tipoBase(x)]], ["Tamanho", x.tam.split(" ou ")], ["Especial", esp]];
    }
    if (mag(tipo)) return [["Raridade", [x.rar]], ["Tipo", [x.tipo]], ["Sintonia", [x.sint ? "Precisa de sintonia" : "Sem sintonia"]]];
    if (tipo === "mestreItem") tipo = "item";
    if (tipo === "magia") {
      const det = [];
      if (x.conc) det.push("Concentração");
      if (x.ritual) det.push("Ritual");
      if (!x.conc) det.push("Sem concentração");
      const efeito = x.tipo === "cura" ? "Cura" : x.dano ? "Causa dano" : "Utilidade";
      return [["Círculo", [CIRC(x.c)]], ["Lista de classe", x.cls], ["Escola", [x.esc]], ["Conjuração", [ACAO_ROT[x.acao] || "Mais demorada"]], ["Efeito", [efeito]], ["Detalhes", det]];
    }
    if (tipo === "arma") {
      const props = PROPS.filter((p) => norm(x.props).includes(norm(p)));
      const td = x.tipoDano && x.tipoDano !== "variável" ? x.tipoDano[0].toUpperCase() + x.tipoDano.slice(1) : "";
      return [["Tipo", [x.tipo]], ["Uso", [x.uso]], ["Tipo de dano", [td]], ["Propriedades", props]];
    }
    if (tipo === "armadura") return [["Tipo", [x.tipo]], ["Furtividade", [x.furt ? "Com desvantagem" : "Sem desvantagem"]], ["Força mínima", [x.forca ? "Exige força" : "Sem exigência"]]];
    return [["Categoria", [x.grupo]]];
  }

  function etiquetas(tipo, x) {
    if (ehMonstro(tipo)) return [tipoBase(x), `ND ${x.nd}`];
    if (mag(tipo)) return x.sint ? ["Sintonia", x.rar] : [x.rar];
    if (tipo === "mestreItem") tipo = "item";
    if (tipo === "magia") return [x.esc, CIRC_CURTO(x.c)];
    if (tipo === "arma") return [x.tipo, x.dano];
    if (tipo === "armadura") return [`CA ${x.ca}`];
    return x.preco && x.preco !== "—" ? [x.preco] : [];
  }

  function stats(tipo, x) {
    const par = (r, v) => (v && v !== "—" ? `<div><small>${r}</small><b>${e(v)}</b></div>` : "");
    if (ehMonstro(tipo)) return par("CA", String(x.ca)) + par("PV", `${x.pv} (${x.pvd})`) + par("Deslocamento", x.vel) + par("Tamanho", x.tam) +
      par("Tipo", x.tipo) + par("Tendência", x.tend) + par("Desafio", `ND ${x.nd}${x.xp ? ` · ${XP_FMT(x)}` : ""}`) + par("Sentidos", x.sen) + par("Idiomas", x.idi);
    if (mag(tipo)) return par("Tipo", x.tipo) + par("Raridade", x.rar) + par("Sintonia", x.sint || "Não precisa");
    if (tipo === "mestreItem") tipo = "item";
    if (tipo === "magia") {
      const comp = [x.v && "V", x.s && "S", x.m && "M"].filter(Boolean).join(", ");
      return par("Círculo", CIRC(x.c)) + par("Escola", x.esc) + par("Conjuração", x.tempo + (x.ritual ? " ou ritual" : "")) + par("Alcance", x.alcance) +
        par("Duração", x.duracao) + par("Componentes", comp) + (x.dano ? par(x.tipo === "cura" ? "Cura" : "Dano", x.dano) : "") + par("Listas", x.cls.join(", "));
    }
    if (tipo === "arma") {
      const rq = reqArma(x);
      return par("Dano", `${x.dano} ${x.tipoDano}`) + par("Propriedades", x.props) + par("Peso", x.peso) + par("Preço", x.preco) +
        (rq.pesada ? par("Requisito", `${rq.pesada === "forca" ? "Força" : "Destreza"} 13`) : "");
    }
    if (tipo === "armadura") return par("CA", x.ca) + par("Tipo", x.tipo) + par("Força mínima", x.forca) + par("Furtividade", x.furt) + par("Vestir", x.vestir) + par("Peso", x.peso) + par("Preço", x.preco);
    return par("Peso", x.peso) + par("Preço", x.preco) + (x.qtd > 1 ? par("Vem com", String(x.qtd)) : "") + (x.recipiente ? par("Guarda itens", "Sim") : "");
  }

  function explicaProps(x) {
    const linhas = PROPS.filter((p) => norm(x.props).includes(norm(p))).map((p) => `<li><b>${e(p)}.</b> ${e((typeof CTG_PROPRIEDADES !== "undefined" ? CTG_PROPRIEDADES : {})[p] || "")}</li>`);
    return linhas.length ? `<ul class="ctg-props">${linhas.join("")}</ul>` : "";
  }

  /* ---------- requisitos (só avisam, nunca bloqueiam) ---------- */
  function reqArma(x) {
    return /pesada/i.test(x.props || "") ? { pesada: x.uso === "À distância" ? "destreza" : "forca" } : {};
  }
  function reqArmadura(x) {
    return { forca: parseInt(x.forca) || 0, furtividade: !!x.furt };
  }
  function atributo(id) {
    const v = parseInt(($(id) || {}).value);
    return isNaN(v) ? null : v;
  }

  const CLASSES = {
    Bardo: ["bardo", "barda"], "Clérigo": ["clerigo", "cleriga", "sacerdote"], Druida: ["druida"], Paladino: ["paladino", "paladina"],
    Patrulheiro: ["patrulheiro", "patrulheira", "guardiao", "ranger"], Feiticeiro: ["feiticeiro", "feiticeira"], Bruxo: ["bruxo", "bruxa"], Mago: ["mago", "maga"],
  };
  const MEIO = ["Paladino", "Patrulheiro"];
  function circuloMax(cls, nivel) {
    if (MEIO.includes(cls)) return Math.min(5, Math.ceil(nivel / 4));
    return Math.min(9, Math.ceil(nivel / 2));
  }
  // classe e nível da ficha aberta
  function perfilMagia() {
    const pn = typeof window.progNiveisClasse === "function" ? window.progNiveisClasse() : null;
    if (pn && Object.keys(pn).length) {
      const total = Object.values(pn).reduce((t, v) => t + v, 0);
      const cls = Object.keys(pn).filter((c) => CLASSES[c]);
      const max = cls.length ? Math.max(...cls.map((c) => circuloMax(c, pn[c]))) : Math.min(9, Math.ceil(total / 2));
      return { cls, nivel: cls.length === 1 ? pn[cls[0]] : total, max, temClasse: true };
    }
    const txt = norm(($("classe") || {}).value || "");
    const nivel = Math.max(1, Math.min(20, parseInt(($("nivel") || {}).value) || 1));
    const cls = Object.keys(CLASSES).filter((c) => CLASSES[c].some((a) => new RegExp("\\b" + a + "\\b").test(txt)));
    const max = cls.length ? Math.max(...cls.map((c) => circuloMax(c, nivel))) : Math.min(9, Math.ceil(nivel / 2));
    return { cls, nivel, max, temClasse: !!txt.trim() };
  }
  function avisoMagia(x) {
    const pf = perfilMagia();
    const av = [];
    if (pf.cls.length && !x.cls.some((c) => pf.cls.includes(c))) av.push(`Não está na lista de ${pf.cls.join(" / ")}.`);
    if (x.c > pf.max) av.push(`É de ${CIRC(x.c)}; no nível ${pf.nivel} você vai até o ${pf.max}º.`);
    return av.length ? `<p class="ctg-aviso"><i class="ti ti-alert-triangle"></i><span>${av.map(e).join(" ")} Dá pra adicionar mesmo assim se o mestre liberar.</span></p>` : "";
  }
  let soMinhas = false;
  let tipoAnterior = "";

  /* ---------- painel ---------- */
  let tipoAtual = "arma";
  let sel = {}; // { "Tipo": Set(["Simples"]) }

  function garantirPainel() {
    if ($("ctgPainel")) return;
    const fundo = document.createElement("div");
    fundo.id = "ctgFundo";
    fundo.className = "ctg-fundo";
    fundo.addEventListener("click", fechar);
    const p = document.createElement("div");
    p.id = "ctgPainel";
    p.className = "ctg-painel";
    p.setAttribute("inert", "");
    p.innerHTML = `
      <div class="cb2-puxa"></div>
      <div class="ctg-cab"><span id="ctgTitulo">Catálogo</span><button type="button" class="cb2-x" onclick="ctgFechar()" aria-label="Fechar">✕</button></div>
      <div class="ctg-sub" id="ctgSub" hidden>
        <button type="button" data-sub="comuns" onclick="ctgTrocarSub('comuns')">Comuns</button>
        <button type="button" data-sub="magicos" onclick="ctgTrocarSub('magicos')">Mágicos</button>
      </div>
      <div class="ctg-barra">
        <label class="ctg-busca"><i class="ti ti-search"></i><input type="search" id="ctgBusca" placeholder="Buscar pelo nome ou efeito" autocomplete="off" oninput="ctgFiltrar()"></label>
        <button type="button" class="ctg-fl-btn" id="ctgFlBtn" onclick="ctgAbrirFiltros()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18l-7 8v6l-4-2v-4z"/></svg><span>Filtros</span><b id="ctgFlNum" hidden>0</b></button>
      </div>
      <div class="ctg-minhas" id="ctgMinhas" hidden>
        <label class="ctg-minhas-sw"><span class="switch-cargas"><input type="checkbox" id="ctgMinhasChk" onchange="ctgSoMinhas(this.checked)"><span class="slider-cargas"></span></span><b>Só o que posso pegar</b></label>
        <small id="ctgMinhasInfo"></small>
      </div>
      <div class="ctg-ativos" id="ctgAtivos" hidden></div>
      <small class="ctg-dica"><span id="ctgConta"></span> · toque num cartão pra ver tudo e usar</small>
      <div class="ctg-lista" id="ctgLista"></div>
      <div class="ctg-fl" id="ctgFl" hidden>
        <div class="ctg-fl-cab"><span>Filtros</span><button type="button" class="cb2-x" onclick="ctgFecharFiltros()" aria-label="Fechar">✕</button></div>
        <div class="ctg-fl-corpo" id="ctgFlCorpo"></div>
        <div class="ctg-fl-rodape"><button type="button" class="cb2-cancelar" onclick="ctgLimpar()">Limpar</button><button type="button" class="cb2-ok" id="ctgFlVer" onclick="ctgFecharFiltros()">Ver resultados</button></div>
      </div>`;
    document.body.appendChild(fundo);
    document.body.appendChild(p);
    // arrastar o puxador pra baixo fecha
    let y0 = null;
    const cab = p.querySelector(".cb2-puxa");
    [cab, p.querySelector(".ctg-cab")].forEach((el) => {
      el.addEventListener("touchstart", (ev) => { y0 = ev.touches[0].clientY; }, { passive: true });
      el.addEventListener("touchmove", (ev) => {
        if (y0 === null) return;
        const d = Math.max(0, ev.touches[0].clientY - y0);
        p.style.transition = "none";
        p.style.transform = `translateY(${d}px)`;
      }, { passive: true });
      el.addEventListener("touchend", (ev) => {
        if (y0 === null) return;
        const d = ev.changedTouches[0].clientY - y0;
        y0 = null;
        p.style.transition = "";
        p.style.transform = "";
        if (d > 90) fechar();
      });
    });
  }

  function cartao(tipo, x) {
    const tags = etiquetas(tipo, x).map((t, i) => `<em${i === etiquetas(tipo, x).length - 1 ? ' class="forte"' : ""}>${e(t)}</em>`).join("");
    const f = facetas(tipo, x);
    const desc = x.desc ?? x.lore ?? "";
    const busca = norm([x.nome, desc, x.props, x.tipoDano, x.grupo, x.tipo, x.esc, (x.cls || []).join(" "), ehMonstro(tipo) ? [...x.a, ...x.h].map((k) => k[0]).join(" ") : ""].join(" "));
    return `
      <div class="ctg-card" data-id="${e(x.id)}" data-busca="${e(busca)}" data-f="${e(JSON.stringify(f))}" onclick="ctgToque(event, this)">
        <div class="ctg-topo"><strong>${e(x.nome)}</strong><span class="ctg-tags">${tags}</span></div>
        <p class="ctg-resumo">${e(desc)}</p>
        <div class="ctg-extra">
          <div class="ctg-stats">${stats(tipo, x)}</div>
          ${tipo === "arma" && !mag(tipo) ? explicaProps(x) : ""}
          ${tipo === "magia" ? avisoMagia(x) : ""}
          ${ehMonstro(tipo) ? fichaMonstro(x) : ""}
          <button type="button" class="cb2-ok ctg-usar" onclick="event.stopPropagation(); ctgUsar('${e(x.id)}')">${e(TIPOS[tipo].usar)}</button>
        </div>
      </div>`;
  }

  function fichaMonstro(x) {
    const atr = `<div class="ctg-atrs">${x.at.map((v, i) => `<span><small>${ATR_ROT[i]}</small><b>${v}</b><i>${modTxt(v)}</i></span>`).join("")}</div>`;
    const lin = (rot, arr, f) => (arr && arr.length ? `<p class="ctg-mlin"><b>${rot}</b> ${arr.map(f).join(" · ")}</p>` : "");
    const def = [x.res.length ? `resiste a ${x.res.join(", ")}` : "", x.imu.length ? `imune a ${x.imu.join(", ")}` : "", x.vul.length ? `vulnerável a ${x.vul.join(", ")}` : ""].filter(Boolean).join("; ");
    return atr +
      lin("Ataques", x.a, (a) => `${e(a[0])}${a[1] != null ? ` <span>+${a[1]}</span>` : ""}${a[2] ? ` <span>${e(a[2])}</span>` : ""}`) +
      lin("Habilidades", x.h, (h) => e(h[0])) +
      lin("Reações", x.r, (r) => e(r[0])) +
      lin(`Lendárias (${x.lm || 3}/rodada)`, x.l, (l) => e(l[0])) +
      (def ? `<p class="ctg-mlin"><b>Defesas</b> ${e(def)}</p>` : "") +
      (x.per ? `<p class="ctg-mlin"><b>Perícias</b> ${e(x.per)}</p>` : "");
  }

  function montarLista(tipo) {
    const grupos = {};
    lista(tipo).forEach((x, i) => {
      const g = grupoDe(tipo, x);
      (grupos[g.titulo] = grupos[g.titulo] || { ordem: g.ordem, itens: [] }).itens.push(x);
    });
    const html = Object.entries(grupos)
      .sort((a, b) => a[1].ordem - b[1].ordem)
      .map(([t, g]) => `<h5 class="ctg-grupo">${e(t)}</h5>${g.itens.map((x) => cartao(tipo, x)).join("")}`)
      .join("");
    $("ctgLista").innerHTML = html +
      `<p class="ctg-vazio" hidden>Nada encontrado. Tente outra palavra ou limpe os filtros.</p>
       <p class="ctg-credito">${tipo === "magia" ? "Lista de magias" : mag(tipo) ? "Lista de itens mágicos" : ehMonstro(tipo) ? "Bestiário" : "Números"} com material do SRD 5.2.1 (CC-BY-4.0). Nomes e descrições da Ficha Ígnea. Licença completa em Sobre › Créditos.</p>`;
  }

  function montarFiltros(tipo) {
    const gav = new Map();
    lista(tipo).forEach((x) => facetas(tipo, x).forEach(([rot, vals]) => {
      if (!gav.has(rot)) gav.set(rot, new Map());
      vals.forEach((v) => v && gav.get(rot).set(v, (gav.get(rot).get(v) || 0) + 1));
    }));
    const ordemArm = (rot, a, b) => {
      if (rot === "Categoria") return ORDEM_ITENS.indexOf(a) - ORDEM_ITENS.indexOf(b);
      if (rot === "Raridade") return ORDEM_RAR.indexOf(a) - ORDEM_RAR.indexOf(b);
      if (rot === "Tipo" && mag(tipo)) return ORDEM_MAGICOS.indexOf(a) - ORDEM_MAGICOS.indexOf(b);
      if (rot === "Tipo" && tipo === "armadura") return ORDEM_ARMADURAS.indexOf(a) - ORDEM_ARMADURAS.indexOf(b);
      if (rot === "Propriedades") return PROPS.indexOf(a) - PROPS.indexOf(b);
      if (rot === "Círculo") return (a === "Truque" ? 0 : parseInt(a)) - (b === "Truque" ? 0 : parseInt(b));
      if (rot === "Conjuração") return Object.values(ACAO_ROT).indexOf(a) - Object.values(ACAO_ROT).indexOf(b);
      if (rot === "Lista de classe" || rot === "Escola" || (rot === "Tipo" && ehMonstro(tipo))) return a.localeCompare(b);
      if (rot === "Nível de desafio") return FAIXAS_ND.findIndex((f) => f[1] === a) - FAIXAS_ND.findIndex((f) => f[1] === b);
      if (rot === "Tamanho") return ["Miúdo", "Pequeno", "Médio", "Grande", "Enorme", "Colossal"].indexOf(a) - ["Miúdo", "Pequeno", "Médio", "Grande", "Enorme", "Colossal"].indexOf(b);
      return 0;
    };
    $("ctgFlCorpo").innerHTML = [...gav.entries()].filter(([, m]) => m.size > 1).map(([rot, m]) => `
      <div class="ctg-fl-secao"><h6>${e(rot)}</h6><div class="ctg-fl-grade">
        ${[...m.entries()].sort((a, b) => ordemArm(rot, a[0], b[0])).map(([v, n]) => `<button type="button" class="ctg-op" data-rot="${e(rot)}" data-val="${e(v)}" onclick="ctgAlternar(this)"><span>${e(v)}</span><small>${n}</small></button>`).join("")}
      </div></div>`).join("");
  }

  window.ctgAbrir = function (tipo) {
    if (!TIPOS[tipo]) return;
    garantirPainel();
    tipoAtual = tipo;
    sel = {};
    $("ctgTitulo").textContent = TIPOS[tipo].titulo;
    $("ctgBusca").value = "";
    $("ctgFl").hidden = true;
    $("ctgMinhas").hidden = tipo !== "magia";
    if (tipo !== tipoAnterior && tipo !== "mestreItem") subItem = "comuns";
    tipoAnterior = tipo;
    $("ctgSub").hidden = !temSub(tipo);
    $("ctgPainel").classList.toggle("ctg-mestre", !!TIPOS[tipo].mestre);
    $("ctgFundo").classList.toggle("ctg-mestre", !!TIPOS[tipo].mestre);
    marcarSub();
    if (tipo === "magia") {
      const pf = perfilMagia();
      $("ctgMinhasChk").checked = soMinhas;
      $("ctgMinhasInfo").textContent = pf.cls.length
        ? `${pf.cls.join(" / ")} nível ${pf.nivel} · até o ${pf.max === 0 ? "truque" : pf.max + "º círculo"}`
        : pf.temClasse ? `Classe da ficha sem lista aqui · nível ${pf.nivel}, até o ${pf.max}º círculo` : "Preencha classe e nível na ficha";
    }
    montarLista(tipo);
    montarFiltros(tipo);
    ctgFiltrar();
    const p = $("ctgPainel");
    p.removeAttribute("inert");
    $("ctgFundo").classList.add("on");
    requestAnimationFrame(() => p.classList.add("on"));
    const lst = $("ctgLista");
    lst.scrollTop = 0;
    // nova magia aberta num círculo: o catálogo já começa nesse círculo
    if (tipo === "magia") {
      const c = ($("pfCirculo") || {}).value;
      if (/^[0-9]$/.test(c || "")) {
        const alvo = c === "0" ? "Truques" : CIRC(+c);
        const h = [...lst.querySelectorAll(".ctg-grupo")].find((x) => x.textContent === alvo);
        if (h) lst.scrollTop = h.offsetTop - 4;
      }
    }
  };

  function fechar() {
    const p = $("ctgPainel");
    if (!p) return;
    if (p.contains(document.activeElement)) document.activeElement.blur();
    p.classList.remove("on");
    p.setAttribute("inert", "");
    $("ctgFundo").classList.remove("on");
    // se fechou sem escolher, o seletor volta pra "Em branco" (a não ser que já tenha algo do catálogo)
    const sh = $(TIPOS[tipoAtual].sheet);
    if (sh && !sh.dataset.ctgId) marcarSeg(sh, "branco");
  }
  window.ctgFechar = fechar;

  function marcarSub() {
    const fem = tipoAtual === "arma" || tipoAtual === "armadura";
    document.querySelectorAll("#ctgSub button").forEach((b) => {
      b.classList.toggle("on", b.dataset.sub === subItem);
      b.textContent = b.dataset.sub === "magicos" ? (fem ? "Mágicas" : "Mágicos") : "Comuns";
    });
    const tit = { arma: "Armas mágicas", armadura: "Armaduras e escudos mágicos" }[tipoAtual] || "Itens mágicos";
    $("ctgTitulo").textContent = mag(tipoAtual) ? tit : TIPOS[tipoAtual].titulo;
  }
  window.ctgTrocarSub = function (s) {
    if (subItem === s) return;
    subItem = s;
    sel = {};
    $("ctgBusca").value = "";
    marcarSub();
    montarLista(tipoAtual);
    montarFiltros(tipoAtual);
    ctgFiltrar();
    $("ctgLista").scrollTop = 0;
  };
  window.ctgAbrirFiltros = () => { $("ctgFl").hidden = false; };
  window.ctgFecharFiltros = () => { $("ctgFl").hidden = true; };
  window.ctgLimpar = () => { sel = {}; ctgFiltrar(); };
  window.ctgAlternar = function (btn) {
    const r = btn.dataset.rot, v = btn.dataset.val;
    sel[r] = sel[r] || new Set();
    if (sel[r].has(v)) sel[r].delete(v); else sel[r].add(v);
    if (!sel[r].size) delete sel[r];
    ctgFiltrar();
  };
  window.ctgTirar = function (r, v) { if (sel[r]) { sel[r].delete(v); if (!sel[r].size) delete sel[r]; } ctgFiltrar(); };

  window.ctgSoMinhas = function (v) { soMinhas = !!v; ctgFiltrar(); };

  window.ctgFiltrar = function () {
    const lista = $("ctgLista");
    if (!lista) return;
    const pf = tipoAtual === "magia" && soMinhas ? perfilMagia() : null;
    const magias = pf ? Object.fromEntries(lista_(tipoAtual).map((m) => [m.id, m])) : null;
    const t = norm($("ctgBusca").value).trim();
    const palavras = t.split(/\s+/).filter(Boolean);
    let n = 0;
    lista.querySelectorAll(".ctg-card").forEach((c) => {
      let f = [];
      try { f = JSON.parse(c.dataset.f); } catch (er) {}
      const mapa = Object.fromEntries(f);
      const okBusca = palavras.every((p) => c.dataset.busca.includes(p));
      const okFl = Object.entries(sel).every(([r, set]) => (mapa[r] || []).some((v) => set.has(v)));
      let okMinha = true;
      if (pf) {
        const m = magias[c.dataset.id];
        okMinha = !!m && m.c <= pf.max && (!pf.cls.length || m.cls.some((k) => pf.cls.includes(k)));
      }
      c.hidden = !(okBusca && okFl && okMinha);
      if (!c.hidden) n++;
    });
    lista.querySelectorAll(".ctg-grupo").forEach((h) => {
      let el = h.nextElementSibling, algum = false;
      while (el && el.classList.contains("ctg-card")) { if (!el.hidden) algum = true; el = el.nextElementSibling; }
      h.hidden = !algum;
    });
    lista.querySelector(".ctg-vazio").hidden = n > 0;
    const txt = `${n} ${n === 1 ? "resultado" : "resultados"}`;
    $("ctgConta").textContent = txt;
    $("ctgFlVer").textContent = `Ver ${txt}`;
    const total = Object.values(sel).reduce((s, x) => s + x.size, 0);
    $("ctgFlNum").hidden = !total;
    $("ctgFlNum").textContent = total;
    $("ctgFlBtn").classList.toggle("on", total > 0);
    document.querySelectorAll("#ctgFlCorpo .ctg-op").forEach((b) => b.classList.toggle("on", !!sel[b.dataset.rot]?.has(b.dataset.val)));
    const at = $("ctgAtivos");
    const chips = Object.entries(sel).flatMap(([r, set]) => [...set].map((v) => `<button type="button" onclick="ctgTirar('${e(r)}','${e(v)}')">${e(v)} <i>✕</i></button>`));
    at.hidden = !chips.length;
    at.innerHTML = chips.join("") + (chips.length > 1 ? `<button type="button" class="limpar" onclick="ctgLimpar()">Limpar tudo</button>` : "");
  };

  window.ctgToque = function (ev, card) {
    if (ev.target.closest("button")) return;
    const abrir = !card.classList.contains("aberto");
    $("ctgLista").querySelectorAll(".ctg-card.aberto").forEach((c) => c.classList.remove("aberto"));
    card.classList.toggle("aberto", abrir);
    if (abrir) setTimeout(() => card.scrollIntoView({ block: "nearest", behavior: "smooth" }), 30);
  };

  /* ---------- preencher o formulário ---------- */
  function setar(id, v) {
    const el = $(id);
    if (!el) return;
    el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function chave(id, v) {
    const el = $(id);
    if (!el || el.checked === v) return;
    el.checked = v;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function abrirDesc(sh) {
    const ex = sh.querySelector('.cb2-ex[data-det="desc"]');
    if (ex) ex.classList.add("on");
  }
  const rodape = (pares) => pares.filter(([, v]) => v && v !== "—").map(([r, v]) => `${r}: ${v}`).join(" · ");

  window.ctgUsar = function (id) {
    const tipo = tipoAtual;
    const x = lista(tipo).find((i) => i.id === id);
    const sh = $(TIPOS[tipo].sheet);
    if (!x || !sh) return;
    const rodMag = () => rodape([["Item mágico", x.tipo], ["Raridade", x.rar], ["Sintonia", x.sint]]);
    if (mag(tipo) && tipo === "arma") {
      const [baseNome, bonus] = BASE_ARMA_MAG[idCurto(x)] || ["", 0];
      const base = baseNome ? comunsDe("arma").find((a) => a.nome === baseNome) : null;
      setar("armaNome", x.nome);
      setar("armaDano", base ? (base.tipoDano && base.tipoDano !== "variável" ? `${base.dano} ${base.tipoDano}` : base.dano) : "");
      const atr = $("armaAtrib");
      if (atr) { atr.value = base && (base.uso === "À distância" || /acuidade/i.test(base.props)) ? "destreza" : "forca"; atr.dispatchEvent(new Event("change", { bubbles: true })); }
      chave("armaSomaProf", true);
      chave("armaSomaDano", true);
      setar("armaBonusAtk", bonus ? String(bonus) : "");
      setar("armaBonusDano", bonus ? String(bonus) : "");
      chave("armaRequerSintonia", !!x.sint);
      const baseTxt = base ? `Arma base: ${base.nome} (${base.props || "sem propriedades"})` : "Arma base: escolha qual arma é e coloque o dano dela.";
      setar("armaDesc", `${x.desc}\n\n${baseTxt}\n${rodMag()}`);
      if (typeof atualizarPreviewAtaqueArma === "function") try { atualizarPreviewAtaqueArma("arma"); } catch (er) {}
    } else if (mag(tipo) && tipo === "armadura") {
      setar("armaduraNome", x.nome);
      setar("armaduraCA", CA_ARMADURA_MAG[idCurto(x)] || "");
      chave("armaduraRequerSintonia", !!x.sint);
      setar("armaduraDesc", `${x.desc}\n\n${rodMag()}`);
    } else if (tipo === "arma") {
      setar("armaNome", x.nome);
      setar("armaDano", x.tipoDano && x.tipoDano !== "variável" ? `${x.dano} ${x.tipoDano}` : x.dano);
      const atr = $("armaAtrib");
      if (atr) {
        atr.value = x.uso === "À distância" || /acuidade/i.test(x.props) ? "destreza" : "forca";
        atr.dispatchEvent(new Event("change", { bubbles: true }));
      }
      chave("armaSomaProf", true);
      chave("armaSomaDano", true);
      const extra = rodape([["Propriedades", x.props], ["Peso", x.peso], ["Preço", x.preco]]);
      setar("armaDesc", x.desc + (extra ? "\n\n" + extra : ""));
      if (typeof atualizarPreviewAtaqueArma === "function") try { atualizarPreviewAtaqueArma("arma"); } catch (er) {}
    } else if (tipo === "armadura") {
      setar("armaduraNome", x.nome);
      setar("armaduraCA", x.ca);
      const extra = rodape([["Tipo", x.tipo], ["Força mínima", x.forca], ["Furtividade", x.furt], ["Vestir", x.vestir], ["Peso", x.peso], ["Preço", x.preco]]);
      setar("armaduraDesc", x.desc + (extra ? "\n\n" + extra : ""));
    } else if (tipo === "magia") {
      setar("pfNome", x.nome);
      const circ = $("pfCirculo");
      if (circ) { circ.value = String(x.c); circ.dispatchEvent(new Event("change", { bubbles: true })); }
      if (typeof atualizarCamposMagiaForm === "function") try { atualizarCamposMagiaForm(); } catch (er) {}
      const acao = $("pfAcao");
      if (acao) acao.value = x.acao || "";
      const tp = $("pfTipo");
      if (tp) tp.value = [...tp.options].some((o) => o.value === x.tipo) ? x.tipo : "";
      setar("pfDano", x.dano || "");
      setar("pfAlcance", x.alcance || "");
      setar("pfDuracao", x.duracao || "");
      setar("pfTempo", x.tempo || "");
      ["V", "S", "M"].forEach((k) => { const el = $("pfComp" + k); if (el) el.checked = !!x[k.toLowerCase()]; });
      const cc = $("pfConcentracao"); if (cc) cc.checked = !!x.conc;
      const rt = $("pfRitual"); if (rt) rt.checked = !!x.ritual;
      const extra = rodape([["Escola", x.esc], ["Listas", x.cls.join(", ")]]);
      setar("pfDesc", x.desc + (extra ? "\n\n" + extra : ""));
    } else if (tipo === "mestreItem") {
      usarNoMestre(x);
      return;
    } else if (ehMonstro(tipo)) {
      usarMonstro(x, tipo === "mestreBoss" ? "boss" : "monstro");
      return;
    } else if (mag(tipo)) {
      setar("itemNome", x.nome);
      setar("itemQtd", 1);
      setar("itemDesc", x.desc + "\n\n" + rodape([["Item mágico", x.tipo], ["Raridade", x.rar], ["Sintonia", x.sint]]));
      chave("itemBolsa", false);
      chave("itemRecipiente", /bolsa guarda-tudo|mochila prática|buraco portátil|aljava eficiente/i.test(x.nome));
      chave("itemRequerSintonia", !!x.sint);
    } else {
      setar("itemNome", x.nome);
      setar("itemQtd", x.qtd > 1 ? x.qtd : 1);
      const extra = rodape([["Peso", x.peso], ["Preço", x.preco]]);
      setar("itemDesc", x.desc + (extra ? "\n\n" + extra : ""));
      chave("itemBolsa", false);
      chave("itemRecipiente", !!x.recipiente);
    }
    abrirDesc(sh);
    sh.dataset.ctgId = id;
    if (mag(tipo) && tipo !== "item") delete sh.dataset.ctgReq;
    else if (tipo === "arma") sh.dataset.ctgReq = JSON.stringify(reqArma(x));
    else if (tipo === "armadura") sh.dataset.ctgReq = JSON.stringify(reqArmadura(x));
    else delete sh.dataset.ctgReq;
    marcarSeg(sh, "cat", x.nome);
    fechar();
    const corpo = corpoDe(sh) || sh.querySelector(".popup-content");
    if (corpo) corpo.scrollTop = 0;
  };

  function limparForm(tipo) {
    const sh = $(TIPOS[tipo].sheet);
    if (!sh || !sh.dataset.ctgId) return;
    delete sh.dataset.ctgId;
    delete sh.dataset.ctgReq;
    if (tipo === "arma") { setar("armaNome", ""); setar("armaDano", ""); setar("armaDesc", ""); setar("armaBonusAtk", ""); setar("armaBonusDano", ""); chave("armaRequerSintonia", false); if (typeof atualizarPreviewAtaqueArma === "function") try { atualizarPreviewAtaqueArma("arma"); } catch (er) {} }
    else if (tipo === "armadura") { setar("armaduraNome", ""); setar("armaduraCA", ""); setar("armaduraDesc", ""); chave("armaduraRequerSintonia", false); }
    else if (tipo === "magia") {
      ["pfNome", "pfDano", "pfAlcance", "pfDuracao", "pfTempo", "pfDesc"].forEach((id) => setar(id, ""));
      ["pfCompV", "pfCompS", "pfCompM", "pfConcentracao", "pfRitual"].forEach((id) => { const el = $(id); if (el) el.checked = false; });
      const tp = $("pfTipo"); if (tp) tp.value = "";
      const ac = $("pfAcao"); if (ac) ac.value = "";
    }
    else if (tipo === "mestreItem") limparMestre("item");
    else if (ehMonstro(tipo)) limparMestre(tipo === "mestreBoss" ? "boss" : "monstro");
    else { setar("itemNome", ""); setar("itemQtd", ""); setar("itemDesc", ""); chave("itemRecipiente", false); chave("itemRequerSintonia", false); }
    sh.querySelector('.cb2-ex[data-det="desc"]')?.classList.remove("on");
  }

  /* ---------- Grimório (mestre): o editor de criação é refeito a cada mudança ---------- */
  const RAR_MESTRE = { "Comum": "comum", "Incomum": "incomum", "Raro": "raro", "Muito raro": "muitoraro", "Lendário": "lendario", "Artefato": "lendario", "Varia": "raro" };
  function editorMestre(tipo) {
    const r = (window._crRascunhos || {})[tipo];
    if (!r) return null;
    window._crEd = r;
    return r;
  }
  function usarNoMestre(x) {
    const ed = editorMestre("item");
    if (!ed || typeof crNormalizarItem !== "function") return;
    let obj;
    if (subItem === "magicos") {
      const cat = x.tipo === "Arma" ? "armas" : x.tipo === "Armadura" || x.tipo === "Escudo" ? "armaduras" : "inventario";
      obj = { nome: x.nome, tipo: x.tipo, categoria: cat, raridade: RAR_MESTRE[x.rar] || "raro", sintonia: x.sint ? "sim" : "nao",
        classificacao: x.rar === "Artefato" ? "artefato" : "normal", efeito: x.desc + (x.sint && x.sint !== "Sim" ? `\n\nSintonia: ${x.sint.replace(/^Sim \((.*)\)$/, "$1")}` : "") };
    } else {
      const arma = comunsDe("arma").find((a) => a.id === x.id);
      const armd = comunsDe("armadura").find((a) => a.id === x.id);
      obj = { nome: x.nome, tipo: x.grupo || x.tipo || "", categoria: "inventario", raridade: "comum", sintonia: "nao", efeito: x.desc };
      if (arma) Object.assign(obj, { categoria: "armas", dano: `${arma.dano} ${arma.tipoDano}`, tipo: `Arma ${arma.tipo.toLowerCase()}` });
      if (armd) Object.assign(obj, { categoria: "armaduras", ca: armd.ca, tipo: armd.tipo === "Escudo" ? "Escudo" : `Armadura ${armd.tipo.toLowerCase()}` });
    }
    ed.c = crNormalizarItem(obj);
    try { crRenderEditor(); } catch (er) {}
    const sh = $("criarForm-item");
    sh.dataset.ctgId = x.id;
    marcarSeg(sh, "cat", x.nome);
    fechar();
  }
  function habilidade(h) {
    let nome = h[0], uso = "", usosMax = 0, recarga = 0;
    const rc = nome.match(/\s*\(Recarga (\d)(?:–6)?\)$/);
    const us = nome.match(/\s*\((\d)\/Dia\)$/);
    if (rc) { uso = "recarga"; recarga = parseInt(rc[1]); nome = nome.slice(0, rc.index); }
    else if (us) { uso = "usos"; usosMax = parseInt(us[1]); nome = nome.slice(0, us.index); }
    return { nome, desc: h[1], uso, usosMax, recarga };
  }
  function usarMonstro(x, tipo) {
    const ed = editorMestre(tipo);
    if (!ed || typeof crNormalizar !== "function") return;
    ed.c = crNormalizar(objMonstro(x, tipo === "boss"));
    ed.c.fases = [];
    ed.abertos = { ...(ed.abertos || {}), acoes: true };
    try { crRenderEditor(); } catch (er) {}
    if (x._colado) return;
    const sh = $(TIPOS[tipo === "boss" ? "mestreBoss" : "mestreMonstro"].sheet);
    sh.dataset.ctgId = x.id;
    marcarSeg(sh, "cat", x.nome);
    fechar();
  }
  function objMonstro(x, chefe) {
    const st = {};
    ["for", "des", "con", "int", "sab", "car"].forEach((k, i) => (st[k] = x.at[i]));
    const habs = x.h.map(habilidade);
    const lend = x.l.map((l) => ({ nome: l[0], desc: l[1], custo: l[2] || 1 }));
    if (!chefe && lend.length) habs.push({ nome: `Ações lendárias (${x.lm || 3} por rodada)`, desc: x.l.map((l) => `${l[0]}: ${l[1]}`).join("\n"), uso: "", usosMax: 0, recarga: 0 });
    const ficha = [x.tam || x.tend ? `${[x.tam, (x.tend || "").toLowerCase()].filter(Boolean).join(", ")}.` : "", x.nd ? `Nível de desafio ${x.nd}${x.xp ? ` (${XP_FMT(x)})` : ""}.` : "", `PV ${x.pv}${x.pvd ? ` (${x.pvd})` : ""}.`, x.per ? `Perícias: ${x.per}.` : ""].filter(Boolean).join(" ");
    return {
      nome: x.nome, tipo: x.nd ? `${x.tipo || "Criatura"} · ND ${x.nd}` : x.tipo || "", hpMax: x.pv, ca: x.ca, velocidade: x.vel, status: st,
      saves: x.sv, sentidos: x.sen, idiomas: x.idi, pericias: x.per,
      resistTags: [...x.res], imunTags: [...x.imu], vulnTags: [...x.vul],
      lore: [x.lore, ficha].filter(Boolean).join("\n\n"),
      blocos: {
        ataques: x.a.map((a) => ({ nome: a[0], acerto: a[1], dano: a[2] || "", desc: a[3] || "" })),
        habilidades: habs,
        reacoes: x.r.map((r) => ({ nome: r[0], desc: r[1] })),
        lendarias: { max: x.lm || 3, acoes: chefe ? lend : [] },
      },
      ...(chefe ? { _tipo: "boss" } : {}),
    };
  }

  /* ---------- "?" do Colar texto: exemplos que funcionam, com "testar este" ---------- */
  const EXEMPLOS_COLAR = {
    poder: [
      ["Uma magia", "Escudo Arcano\n1º nível de abjuração\nTempo de Conjuração: 1 reação\nAlcance: Pessoal\nComponentes: V, S\nDuração: 1 rodada\nUma barreira invisível de força mágica aparece e te protege: até o início do seu próximo turno, você recebe +5 na CA."],
      ["Vários poderes do jeito do grupo", "- Golpe Flamejante (ação bônus, 2/descanso curto): sua próxima arma causa +2d6 de dano de fogo\n- Pele de Pedra: você tem resistência a dano cortante\n- Grito de Guerra (reação): quando um aliado cair, você ganha 1d8 PV temporários"],
      ["Um sistema da mesa", "PODERES DO SANGUE\nHabilidades Rápidas (efeito instantâneo) ou Longas (ficam ativas por 1 minuto), que usam Pontos de Sangue.\n\nSANGUE DO LOBO\n* Sua Força aumenta em 1.\n* Faro (Longa): com uma Ação, você tem vantagem em Percepção pelo olfato.\n* Mordida Feroz (Rápida): com uma Reação, ao ser atacado, morde o atacante: 1d6 perfurante."],
      ["Um talento", "VIGIA DA MURALHA\nPré-requisito: Sabedoria 13\nVocê não pode ser surpreendido enquanto estiver consciente e recebe +2 em Percepção passiva."],
    ],
    criatura: [
      ["Bloco completo", "Lobo de Cinzas\nFera média, caótico e mau\nCA 14\nPV 32 (5d8 + 10)\nDeslocamento 12 m\nFOR 15 DES 16 CON 14 INT 4 SAB 12 CAR 6\nSentidos visão no escuro 18 m\nND 2 (450 XP)\nFaro Aguçado. Vantagem em Percepção que usa o olfato.\nAções\nMordida. Ataque Corpo a Corpo: +5, alcance 1,5 m. Acerto: 10 (2d6 + 3) de dano perfurante mais 3 (1d6) de dano de fogo."],
      ["Do jeito do grupo", "Rato Gigante de Esgoto\nCA: 12 / PV: 9\nDesloc 9 m\nFOR 7 | DES 15 | CON 11 | INT 2 | SAB 10 | CAR 4\nND 1/4\n- Mordida: +4 para acertar, 1d4+2 perfurante"],
    ],
    item: [
      ["Bloco completo", "Manto das Brasas\nItem maravilhoso, raro (requer sintonização)\nEnquanto veste este manto, você tem resistência a dano de fogo. Como uma ação, chamas te cercam: criaturas a 1,5 m sofrem 2d6 de dano de fogo."],
      ["Lista do jeito do grupo", "- Anel da Brasa (raro, sintonia): +1 na CA e resistência a fogo\n- Poção do Eco: por 1 hora você ouve tudo num raio de 18 m\n- Lâmina Fria +1 (incomum): espada longa, causa +1d6 de frio"],
      ["Com campos", "Nome: Coroa do Rei Caído\nTipo: Item maravilhoso\nRaridade: Lendária\nSintonização: sim\nEfeito: Você pode conjurar Comando à vontade."],
    ],
    antecedente: [
      ["Com campos", "Caçador de Recompensas\nVocê vivia de capturar foragidos pelas estradas do reino.\nValores de Atributo: Força, Destreza, Sabedoria\nTalento: Alerta\nPerícias: Investigação e Sobrevivência\nFerramenta: Ferramentas de ladrão\nEquipamento: (A) Besta leve, 20 virotes, Algemas, Roupas de viajante, 12 PO; ou (B) 50 PO"],
      ["Do jeito do grupo", "Marinheiro de Água Doce\nCresceu nos barcos do rio, entre redes e contrabando\n- Perícias: atletismo, percepção\n- Ferramenta: veículos aquáticos\n- Equipamento: um gancho, 15 metros de corda, roupas comuns, 10 po\nCaracterística: Passagem no Rio. Você consegue passagem gratuita em barcos do rio, desde que ajude no trabalho."],
    ],
    raca: [
      ["Do jeito do grupo", "Homem-Lagarto do Pântano\nPovo frio e calculista que vive nos brejos.\nAumento de atributo: +2 Constituição, +1 Sabedoria\nTamanho: Médio\nDeslocamento: 9 metros\n- Mordida: arma natural que causa 1d6 + Força de dano perfurante.\n- Pele Escamosa: sem armadura, sua CA é 13 + Destreza.\n- Fome Voraz (ação bônus, 1/descanso curto): ao causar dano com a mordida, ganha PV temporários iguais à sua Constituição."],
      ["Texto corrido", "Povo-Coruja\nAumento no Valor de Habilidade. Sua Sabedoria aumenta em 2 e sua Destreza em 1.\nTamanho. Você é Pequeno.\nDeslocamento. Seu deslocamento é de 7,5 m.\nVoo Silencioso. Você tem deslocamento de voo igual ao de caminhada, se não estiver de armadura média ou pesada.\nVisão no Escuro. Você enxerga na penumbra a até 18 m."],
    ],
    classe: [
      ["Classe por níveis", "Caçador de Brumas\nDado de vida: d10\nSalvaguardas: Destreza e Sabedoria\nPerícias: escolha 3 entre Acrobacia, Furtividade, Percepção e Sobrevivência\nNível 1\n- Olhos na Névoa: você enxerga através de neblina até 9 m.\n- Marca da Bruma: como ação bônus, marca uma criatura; seus ataques contra ela causam +1d6.\nNível 3\n- Trilha do Caçador: escolha sua trilha (subclasse)\nNível 4\n- Incremento no Valor de Habilidade\n\nTRILHAS\nTrilha do Lobo Cinzento\nNível 3 - Uivo: ação, criaturas a 9 m fazem teste de Sabedoria ou ficam amedrontadas.\nNível 7 - Matilha: vantagem contra criaturas perto de um aliado."],
      ["Texto corrido", "Guardião do Farol\nLuz Guia (3º nível). Com uma ação bônus você acende uma luz forte em 6 m por 1 minuto.\nA partir do 7º nível, quando um aliado na sua luz for atacado, você pode usar sua reação para impor desvantagem."],
    ],
  };
  window.ajudaColarHTML = function (tipo, alvo) {
    const ex = EXEMPLOS_COLAR[tipo] || [];
    return `<button type="button" class="ctg-ajuda-btn" aria-label="Ver exemplos" onclick="this.nextElementSibling.hidden = !this.nextElementSibling.hidden; this.classList.toggle('on')">?</button>
      <div class="ctg-ajuda" hidden>
        <b>Formatos que funcionam</b>
        ${ex.map(([t, txt], i) => `<div class="ctg-ajuda-ex"><span>${escapeHtml(t)}</span><pre>${escapeHtml(txt)}</pre><button type="button" onclick="ajudaColarUsar('${tipo}', ${i}, '${alvo}')">Testar com este</button></div>`).join("")}
      </div>`;
  };
  window.ajudaColarUsar = function (tipo, i, alvo) {
    const t = $(alvo), ex = (EXEMPLOS_COLAR[tipo] || [])[i];
    if (!t || !ex) return;
    t.value = ex[1];
    t.dispatchEvent(new Event("input", { bubbles: true }));
    t.focus();
    t.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  /* ---------- Colar texto (aba Poderes do jogador) ---------- */
  const pcol = { txt: "", lidos: [], marcados: new Set(), origem: "", erro: "" };
  const ORIGENS = [["", "Sem origem"], ["classe", "Classe"], ["subclasse", "Subclasse"], ["raca", "Raça"], ["talento", "Talento"], ["item", "Item"]];
  const ACAO_TXT = { acao: "Ação", bonus: "Ação bônus", reacao: "Reação", livre: "Livre", passiva: "Passiva", "": "" };
  const REC_TXT = { vontade: "à vontade", unico: "uso único", curto: "descanso curto", longo: "descanso longo", dia: "por dia", "": "" };
  function painelPoder() {
    const pop = $("popup");
    const form = pop && pop.querySelector(".pf-form");
    if (!form) return null;
    let p = form.querySelector(".ctg-colar");
    if (!p) {
      p = document.createElement("div");
      p.className = "ctg-colar jog";
      const ref = form.querySelector(".ctg-escolhido") || form.querySelector(".ctg-seg");
      if (ref) ref.after(p); else form.prepend(p);
    }
    return p;
  }
  function resumoPoder(x) {
    const partes = [x.circulo === "" ? "" : x.circulo === "0" ? "Truque" : `${x.circulo}º círculo`, ACAO_TXT[x.acao] || "", x.temCargas ? `${x.maxCargas} uso${x.maxCargas > 1 ? "s" : ""}` : "", REC_TXT[x.recarga] || "", x.dano ? `${x.dano}${x.tipo && x.tipo !== "cura" ? "" : x.tipo === "cura" ? " de cura" : ""}` : ""];
    return partes.filter(Boolean).join(" · ");
  }
  function renderPoderColar() {
    const p = painelPoder();
    if (!p) return;
    if (!pcol.lidos.length) {
      p.innerHTML = `
        <div class="ctg-colar-cab"><p class="ctg-colar-dica">Cole um ou vários poderes, magias, talentos ou traços: de uma anotação, do grupo, de um site… Pode ser do jeito que vocês escrevem (<i>Golpe Flamejante (ação bônus, 2/descanso curto): +2d6 de fogo</i>). Se colar vários, eu separo.</p>${ajudaColarHTML("poder", "ctgPoderTxt")}</div>
        <textarea id="ctgPoderTxt" class="ctg-colar-txt" placeholder="Bola de Fogo&#10;3º nível de evocação&#10;Tempo de Conjuração: 1 ação&#10;Alcance: 45 metros&#10;…">${escapeHtml(pcol.txt)}</textarea>
        ${pcol.erro ? `<div class="ctg-colar-erro"><i class="ti ti-alert-circle"></i>${pcol.erro}</div>` : ""}
        <button type="button" class="ctg-colar-ler" onclick="ctgPoderLer()"><i class="ti ti-wand"></i>Ler texto</button>`;
      return;
    }
    if (pcol.lidos.length === 1) {
      const x = pcol.lidos[0];
      p.innerHTML = `<div class="ctg-colar-topo"><b>Preenchi o formulário com ${escapeHtml(x.nome)}</b><button type="button" onclick="ctgPoderVoltar()">Colar outro</button></div>${x._jaTinha ? `<p class="ctg-colar-ja"><i class="ti ti-book-2"></i>Essa magia já tem no app: usei a versão do catálogo, com escola e listas de classe.</p>` : ""}<p class="ctg-colar-dica">${escapeHtml(resumoPoder(x) || "Confira os campos")}. Confira abaixo e toque em Adicionar.</p>`;
      return;
    }
    const todosMagia = pcol.lidos.every((x) => x.circulo !== "");
    p.innerHTML = `
      <div class="ctg-colar-topo"><b>Achei ${pcol.lidos.length} ${todosMagia ? "magias" : "poderes"}</b><button type="button" onclick="ctgPoderVoltar()">Colar outro</button></div>
      ${todosMagia ? "" : `<label class="ctg-colar-origem"><span>Origem de todos</span><select onchange="ctgPoderOrigem(this.value)">${ORIGENS.map(([v, r]) => `<option value="${v}" ${pcol.origem === v ? "selected" : ""}>${r}</option>`).join("")}</select></label>`}
      <div class="ctg-colar-lista">${pcol.lidos.map((x, i) => `
        <label class="ctg-colar-item">
          <input type="checkbox" ${pcol.marcados.has(i) ? "checked" : ""} onchange="ctgPoderMarcar(${i}, this.checked)">
          <span class="ctg-colar-info"><b>${escapeHtml(x.nome)}</b>${x._jaTinha ? `<em class="ctg-colar-ja-tag">já tinha no app · usei a do catálogo</em>` : ""}<small>${escapeHtml(resumoPoder(x) || "passiva")}</small><small class="ctg-colar-desc">${escapeHtml(String(x.desc || "").replace(/\s+/g, " ").slice(0, 120))}${String(x.desc || "").length > 120 ? "…" : ""}</small></span>
          <button type="button" class="ctg-colar-abrir" onclick="event.preventDefault(); ctgPoderUm(${i})">Editar</button>
        </label>`).join("")}
      </div>
      <button type="button" class="ctg-colar-ler" onclick="ctgPoderAdicionarTodos()" ${pcol.marcados.size ? "" : "disabled"}><i class="ti ti-plus"></i>Adicionar ${pcol.marcados.size} ${todosMagia ? "magia" : "poder"}${pcol.marcados.size === 1 ? "" : "es".slice(todosMagia ? 1 : 0)}</button>`;
  }
  function preencherPoder(x) {
    setar("pfNome", x.nome);
    const circ = $("pfCirculo");
    if (circ) { circ.value = x.circulo; circ.dispatchEvent(new Event("change", { bubbles: true })); }
    if (typeof atualizarCamposMagiaForm === "function") try { atualizarCamposMagiaForm(); } catch (er) {}
    const sel = (id, v) => { const el = $(id); if (el && [...el.options].some((o) => o.value === v)) el.value = v; };
    sel("pfAcao", x.acao || ""); sel("pfRecarga", x.recarga || ""); sel("pfOrigem", x.origem || pcol.origem || ""); sel("pfTipo", x.tipo || "");
    setar("pfDano", x.dano || ""); setar("pfAlcance", x.alcance || ""); setar("pfDuracao", x.duracao || ""); setar("pfTempo", x.tempo || "");
    ["V", "S", "M"].forEach((k) => { const el = $("pfComp" + k); if (el) el.checked = !!(x.componentes || {})[k.toLowerCase()]; });
    const cc = $("pfConcentracao"); if (cc) cc.checked = !!x.concentracao;
    const rt = $("pfRitual"); if (rt) rt.checked = !!x.ritual;
    chave("pfTemCargas", !!x.temCargas);
    const mx = $("pfMaxCargas"); if (mx) { mx.value = x.temCargas ? x.maxCargas : ""; mx.style.display = x.temCargas ? "block" : "none"; }
    setar("pfDesc", x.desc || "");
  }
  // magia que o app já tem: usa a versão do catálogo (com escola e listas) e avisa
  function doCatalogo(x) {
    const nb = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const alvo = nb(x.nome);
    if (!alvo) return x;
    const m = lista_("magia").find((k) => nb(k.nome) === alvo);
    if (!m || (x.circulo !== "" && String(m.c) !== String(x.circulo))) return x;
    const extra = rodape([["Escola", m.esc], ["Listas", (m.cls || []).join(", ")]]);
    return {
      nome: m.nome, circulo: String(m.c), acao: m.acao || "", recarga: "", origem: x.origem || "", tipo: m.tipo || "", dano: m.dano || "",
      alcance: m.alcance || "", duracao: m.duracao || "", tempo: m.tempo || "", desc: m.desc + (extra ? "\n\n" + extra : ""),
      temCargas: false, maxCargas: 0, componentes: { v: !!m.v, s: !!m.s, m: !!m.m }, concentracao: !!m.conc, ritual: !!m.ritual, _jaTinha: true,
    };
  }
  window.ctgPoderColar = function () {
    const pop = $("popup");
    marcarSeg(pop, "colar");
    renderPoderColar();
    setTimeout(() => { const t = $("ctgPoderTxt"); if (t) t.focus(); }, 60);
  };
  window.ctgPoderLer = function () {
    const t = $("ctgPoderTxt");
    pcol.txt = t ? t.value : "";
    pcol.erro = "";
    if (!pcol.txt.trim()) return;
    if (typeof window.lerPoderesColados !== "function") { pcol.erro = "O leitor de poderes não carregou. Confira se o leitor-poder.js está na pasta javascript e no index.html."; return renderPoderColar(); }
    let r = { poderes: [] };
    try { r = window.lerPoderesColados(pcol.txt); } catch (er) { console.warn(er); }
    if (!r.poderes.length) { pcol.erro = "Não consegui separar nenhum poder nesse texto. Tente deixar o nome sozinho na primeira linha e o que ele faz embaixo."; return renderPoderColar(); }
    pcol.lidos = r.poderes.map(doCatalogo);
    pcol.marcados = new Set(r.poderes.map((_, i) => i));
    const origens = r.poderes.map((x) => x.origem).filter(Boolean);
    pcol.origem = origens.length && origens.every((o) => o === origens[0]) ? origens[0] : "";
    if (pcol.lidos.length === 1) preencherPoder(pcol.lidos[0]);
    renderPoderColar();
  };
  window.ctgPoderVoltar = function () { pcol.lidos = []; renderPoderColar(); };
  window.ctgPoderOrigem = function (v) { pcol.origem = v; };
  window.ctgPoderMarcar = function (i, on) { on ? pcol.marcados.add(i) : pcol.marcados.delete(i); renderPoderColar(); };
  window.ctgPoderUm = function (i) {
    const x = pcol.lidos[i];
    if (!x) return;
    pcol.lidos = [x];
    pcol.marcados = new Set([0]);
    preencherPoder(x);
    renderPoderColar();
  };
  window.ctgPoderAdicionarTodos = function () {
    if (typeof poderes === "undefined") return;
    const lista = [...pcol.marcados].sort((a, b) => a - b).map((i) => pcol.lidos[i]).filter(Boolean);
    lista.forEach((x) => {
      const magia = /^[0-9]$/.test(x.circulo);
      const p = {
        id: "pw_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        nome: x.nome, circulo: x.circulo, acao: x.acao || "", recarga: x.recarga || "", origem: magia ? x.origem || "" : pcol.origem || x.origem || "",
        tipo: x.tipo || "", dano: x.dano || "", alcance: x.alcance || "", duracao: x.duracao || "", tempo: x.tempo || "", desc: x.desc || "",
        temCargas: !!x.temCargas, maxCargas: x.temCargas ? x.maxCargas : 0, cargasGastas: x.temCargas ? Array(x.maxCargas).fill(false) : [],
        concentracao: magia && !!x.concentracao, ritual: magia && !!x.ritual, preparada: true, componentes: magia ? x.componentes || {} : {},
      };
      if (typeof normalizarPoder === "function") try { normalizarPoder(p); } catch (er) {}
      poderes.push(p);
    });
    const soMagias = lista.every((x) => /^[0-9]$/.test(x.circulo));
    pcol.lidos = []; pcol.txt = ""; pcol.marcados = new Set();
    if (typeof fecharPopup === "function") fecharPopup();
    if (typeof salvarTudo === "function") salvarTudo();
    if (typeof trocarVisaoPM === "function") trocarVisaoPM(soMagias ? "magias" : "poderes");
    const msg = `${lista.length} ${soMagias ? "magia" : "poder"}${lista.length === 1 ? "" : soMagias ? "s" : "es"} adicionad${soMagias ? "a" : "o"}${lista.length === 1 ? "" : "s"}`;
    if (typeof mostrarToastMundo === "function") mostrarToastMundo(msg);
  };

  const RAR_NOME = { comum: "Comum", incomum: "Incomum", raro: "Raro", muitoraro: "Muito raro", lendario: "Lendário" };
  function objItem(x) {
    const obj = { nome: x.nome, tipo: x.tipo || "", categoria: x.categoria, raridade: x.raridade, sintonia: x.sintonia, classificacao: x.classificacao, efeito: x.efeito };
    const nb = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (x.categoria === "armas") {
      const alvo = nb(x.base || x.nome);
      const arma = comunsDe("arma").filter((a) => alvo.includes(nb(a.nome))).sort((a, b) => b.nome.length - a.nome.length)[0];
      if (x.dano) obj.dano = x.dano;
      else if (arma) obj.dano = `${arma.dano}${x.bonus ? `+${x.bonus}` : ""} ${arma.tipoDano}`;
      if (!obj.tipo && arma) obj.tipo = `Arma (${arma.nome.toLowerCase()})`;
    } else if (x.categoria === "armaduras") {
      const alvo = nb(x.base || x.nome);
      const armd = comunsDe("armadura").filter((a) => alvo.includes(nb(a.nome)) || (/escudo|shield/.test(alvo) && /escudo/.test(nb(a.nome)))).sort((a, b) => b.nome.length - a.nome.length)[0];
      const ca = x.ca || (armd ? (parseInt(String(armd.ca)) || 0) + (x.bonus || 0) : null);
      if (ca) obj.ca = ca;
    }
    return obj;
  }

  /* ---------- Colar texto (criaturas do Grimório) ---------- */
  const colado = {}; // tipo -> { lidos: [], marcados: Set }
  const AVISO_TXT = { atributos: "não achei os atributos", "dado de vida": "sem dado de vida", "ações": "não achei ações" };
  function painelColar(tipo) {
    const sh = $(TIPOS[tipo].sheet);
    const box = sh && sh.querySelector(".ctg-mestre-box");
    if (!box) return null;
    let p = box.querySelector(".ctg-colar");
    if (!p) { p = document.createElement("div"); p.className = "ctg-colar"; box.appendChild(p); }
    return p;
  }
  function renderColar(tipo) {
    const p = painelColar(tipo);
    if (!p) return;
    const st = colado[tipo] || (colado[tipo] = { lidos: [], marcados: new Set(), txt: "" });
    const chefe = tipo === "mestreBoss";
    if (!st.lidos.length) {
      p.innerHTML = `
        ${tipo === "mestreItem" ? `<div class="ctg-colar-cab"><p class="ctg-colar-dica">Cole um ou vários itens: de uma anotação, do grupo da mesa, de um site… Pode ser no formato <i>Nome / Item maravilhoso, raro (requer sintonização)</i> ou do jeito de vocês (<i>Anel da Brasa (raro, sintonia): +1 na CA</i>).</p>${ajudaColarHTML("item", "ctgColarTxt-" + tipo)}</div>
        <textarea id="ctgColarTxt-${tipo}" class="ctg-colar-txt" placeholder="Manto das Brasas&#10;Item maravilhoso, raro (requer sintonização)&#10;Enquanto veste este manto…">${escapeHtml(st.txt || "")}</textarea>
        ${st.erro ? `<div class="ctg-colar-erro"><i class="ti ti-alert-circle"></i>${st.erro}</div>` : ""}
        <button type="button" class="ctg-colar-ler" onclick="ctgColarLer('${tipo}')"><i class="ti ti-wand"></i>Ler texto</button>` : `
        <div class="ctg-colar-cab"><p class="ctg-colar-dica">Cole o bloco da criatura: de um material seu, do grupo da mesa, de um site… Pode ser um bloco de estatísticas completo ou do jeito que vocês anotam (<i>CA: 14, PV: 32, Mordida: +5, 2d6+3</i>). Se colar várias, eu separo.</p>${ajudaColarHTML("criatura", "ctgColarTxt-" + tipo)}</div>
        <textarea id="ctgColarTxt-${tipo}" class="ctg-colar-txt" placeholder="Lobo de Cinzas&#10;Fera média, caótico e mau&#10;CA 14&#10;PV 32 (5d8+10)&#10;…">${escapeHtml(st.txt || "")}</textarea>
        ${st.erro ? `<div class="ctg-colar-erro"><i class="ti ti-alert-circle"></i>${st.erro}</div>` : ""}
        <button type="button" class="ctg-colar-ler" onclick="ctgColarLer('${tipo}')"><i class="ti ti-wand"></i>Ler texto</button>`}`;
      return;
    }
    const um = st.lidos.length === 1;
    if (tipo === "mestreItem") {
      p.innerHTML = `
      <div class="ctg-colar-topo"><b>${um ? "Achei 1 item" : `Achei ${st.lidos.length} itens`}</b><button type="button" onclick="ctgColarVoltar('${tipo}')">Colar outro</button></div>
      <div class="ctg-colar-lista">${st.lidos.map((x, i) => `
        <label class="ctg-colar-item${um ? " so" : ""}">
          ${um ? "" : `<input type="checkbox" ${st.marcados.has(i) ? "checked" : ""} onchange="ctgColarMarcar('${tipo}', ${i}, this.checked)">`}
          <span class="ctg-colar-info"><b>${escapeHtml(x.nome)}</b><small>${escapeHtml([x.tipo || (x.categoria === "armas" ? "Arma" : x.categoria === "armaduras" ? "Armadura" : "Item"), x.classificacao === "artefato" ? "Artefato" : RAR_NOME[x.raridade] || "", x.sintonia === "sim" ? "requer sintonização" : ""].filter(Boolean).join(" · "))}</small></span>
          <button type="button" class="ctg-colar-abrir" onclick="event.preventDefault(); ctgColarAbrir('${tipo}', ${i})">${um ? "Abrir no editor" : "Editar"}</button>
        </label>`).join("")}
      </div>
      ${um ? "" : `<button type="button" class="ctg-colar-ler" onclick="ctgColarSalvarTodas('${tipo}')" ${st.marcados.size ? "" : "disabled"}><i class="ti ti-books"></i>Salvar ${st.marcados.size} no compêndio</button>`}`;
      return;
    }
    p.innerHTML = `
      <div class="ctg-colar-topo"><b>${um ? "Achei 1 criatura" : `Achei ${st.lidos.length} criaturas`}</b><button type="button" onclick="ctgColarVoltar('${tipo}')">Colar outro</button></div>
      <div class="ctg-colar-lista">${st.lidos.map((x, i) => `
        <label class="ctg-colar-item${um ? " so" : ""}">
          ${um ? "" : `<input type="checkbox" ${st.marcados.has(i) ? "checked" : ""} onchange="ctgColarMarcar('${tipo}', ${i}, this.checked)">`}
          <span class="ctg-colar-info">
            <b>${escapeHtml(x.nome)}</b>
            <small>${escapeHtml([x.tam, x.tipo].filter(Boolean).join(" "))}${x.nd ? ` · ND ${escapeHtml(x.nd)}` : ""} · CA ${x.ca} · PV ${x.pv} · ${x.a.length} ataque${x.a.length === 1 ? "" : "s"}${x.h.length ? ` · ${x.h.length} habilidade${x.h.length === 1 ? "" : "s"}` : ""}${x.l.length ? ` · ${x.l.length} lendária${x.l.length === 1 ? "" : "s"}` : ""}</small>
            ${x.avisos.length ? `<em><i class="ti ti-alert-triangle"></i>${x.avisos.map((a) => AVISO_TXT[a] || a).join(" · ")} — confira no editor</em>` : ""}
          </span>
          <button type="button" class="ctg-colar-abrir" onclick="event.preventDefault(); ctgColarAbrir('${tipo}', ${i})">${um ? "Abrir no editor" : "Editar"}</button>
        </label>`).join("")}
      </div>
      ${um ? "" : `<button type="button" class="ctg-colar-ler" onclick="ctgColarSalvarTodas('${tipo}')" ${st.marcados.size ? "" : "disabled"}><i class="ti ti-books"></i>Salvar ${st.marcados.size} no compêndio${chefe ? " como chefes" : ""}</button>`}`;
  }
  window.ctgColarAbrirPainel = function (tipo) {
    const sh = $(TIPOS[tipo].sheet);
    marcarSeg(sh, "colar");
    renderColar(tipo);
    setTimeout(() => { const t = $(`ctgColarTxt-${tipo}`); if (t && !colado[tipo]?.lidos.length) t.focus(); }, 60);
  };
  window.ctgColarLer = function (tipo) {
    const st = colado[tipo];
    const t = $(`ctgColarTxt-${tipo}`);
    st.txt = t ? t.value : "";
    st.erro = "";
    if (tipo === "mestreItem") {
      if (!st.txt.trim()) return;
      if (typeof window.lerItensColados !== "function") { st.erro = "O leitor de itens não carregou. Confira se o leitor-item.js está na pasta javascript e no index.html."; return renderColar(tipo); }
      let ri = { itens: [] };
      try { ri = window.lerItensColados(st.txt); } catch (er) { console.warn(er); }
      if (!ri.itens.length) { st.erro = "Não achei nenhum item nesse texto. Deixe o nome sozinho na primeira linha e o que ele faz embaixo."; return renderColar(tipo); }
      st.lidos = ri.itens;
      st.marcados = new Set(st.lidos.map((_, i) => i));
      renderColar(tipo);
      if (st.lidos.length === 1) ctgColarAbrir(tipo, 0);
      return;
    }
    if (!st.txt.trim() || typeof window.lerCriaturasColadas !== "function") return;
    let r = { monstros: [] };
    try { r = window.lerCriaturasColadas(st.txt); } catch (er) { console.warn(er); }
    if (!r.monstros.length) {
      st.erro = "Não achei nenhuma criatura nesse texto. O que eu procuro para saber onde ela começa é a linha da CA (ex: <i>CA 14</i> ou <i>Classe de Armadura 14</i>), com o nome logo acima.";
      return renderColar(tipo);
    }
    st.lidos = r.monstros.map((x) => ({ ...x, _colado: true }));
    st.marcados = new Set(st.lidos.map((_, i) => i));
    renderColar(tipo);
    if (st.lidos.length === 1) ctgColarAbrir(tipo, 0);
  };
  window.ctgColarVoltar = function (tipo) { colado[tipo].lidos = []; renderColar(tipo); };
  window.ctgColarMarcar = function (tipo, i, on) { const st = colado[tipo]; on ? st.marcados.add(i) : st.marcados.delete(i); renderColar(tipo); };
  window.ctgColarAbrir = function (tipo, i) {
    const x = colado[tipo]?.lidos[i];
    if (!x) return;
    if (tipo === "mestreItem") {
      const ed = editorMestre("item");
      if (ed && typeof crNormalizarItem === "function") { ed.c = crNormalizarItem(objItem(x)); try { crRenderEditor(); } catch (er) {} }
    } else usarMonstro(x, tipo === "mestreBoss" ? "boss" : "monstro");
    const host = $(tipo === "mestreItem" ? "crCriarHost-item" : tipo === "mestreBoss" ? "crCriarHost-boss" : "crCriarHost-monstro");
    if (host) setTimeout(() => host.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    if (typeof mostrarToastMundo === "function") mostrarToastMundo(`${x.nome} no editor — confira e salve`);
  };
  window.ctgColarSalvarTodas = function (tipo) {
    const st = colado[tipo];
    if (!st || typeof crNormalizar !== "function" || typeof crGerarTextos !== "function") return;
    const chefe = tipo === "mestreBoss";
    const lista = [...st.marcados].sort((a, b) => a - b).map((i) => st.lidos[i]).filter(Boolean);
    const base = Date.now();
    if (tipo === "mestreItem") {
      lista.forEach((x, k) => {
        const c = crNormalizarItem(objItem(x));
        c._tipo = "item"; c._origem = "usuario"; c.id = base + k;
        monstrosMestre.push(c);
      });
      if (typeof salvarMonstrosMestreStorage === "function") salvarMonstrosMestreStorage();
      if (typeof renderMonstrosMestre === "function") renderMonstrosMestre();
      st.lidos = []; st.txt = ""; st.marcados = new Set();
      renderColar(tipo);
      if (typeof mostrarToastMundo === "function") mostrarToastMundo(`${lista.length} ite${lista.length === 1 ? "m" : "ns"} no compêndio`);
      return;
    }
    lista.forEach((x, k) => {
      const c = crNormalizar(objMonstro(x, chefe));
      c.fases = [];
      crGerarTextos(c);
      c.hpAtual = c.hpMax;
      c.id = base + k;
      c.origem = "usuario";
      monstrosMestre.push(c);
    });
    if (typeof salvarMonstrosMestreStorage === "function") salvarMonstrosMestreStorage();
    if (typeof renderMonstrosMestre === "function") renderMonstrosMestre();
    st.lidos = []; st.txt = ""; st.marcados = new Set();
    renderColar(tipo);
    if (typeof mostrarToastMundo === "function") mostrarToastMundo(`${lista.length} criatura${lista.length === 1 ? "" : "s"} no compêndio`);
  };

  /* ---------- Colar texto (arma, armadura e item do jogador) ---------- */
  const JOG = ["arma", "armadura", "item"];
  const jcol = { txt: "", lidos: [], marcados: new Set(), erro: "", trocando: false };
  const CAT_JOG = { armas: "arma", armaduras: "armadura", inventario: "item" };
  const NOME_JOG = { arma: "arma", armadura: "armadura", item: "item" };
  function painelJog(tipo) {
    const sh = $(TIPOS[tipo].sheet);
    const corpo = corpoDe(sh);
    if (!corpo) return null;
    let p = corpo.querySelector(".ctg-colar");
    if (!p) {
      p = document.createElement("div");
      p.className = "ctg-colar jog";
      const ref = corpo.querySelector(".ctg-escolhido") || corpo.querySelector(".ctg-seg");
      if (ref) ref.after(p); else corpo.prepend(p);
    }
    return p;
  }
  const subJog = (x) => [x.tipo || (x.categoria === "armas" ? "Arma" : x.categoria === "armaduras" ? "Armadura" : "Item"), x.classificacao === "artefato" ? "Artefato" : x.raridade && x.raridade !== "comum" ? RAR_NOME[x.raridade] : "", x.sintonia === "sim" ? "sintonia" : ""].filter(Boolean).join(" · ");
  function renderJog(tipo) {
    const p = painelJog(tipo);
    if (!p) return;
    if (!jcol.lidos.length) {
      p.innerHTML = `
        <div class="ctg-colar-cab"><p class="ctg-colar-dica">Cole uma ou várias coisas: do grupo da mesa, de uma anotação, de um site… Arma, armadura ou item, eu separo e coloco cada um no lugar certo.</p>${ajudaColarHTML("item", "ctgJogTxt")}</div>
        <textarea id="ctgJogTxt" class="ctg-colar-txt" placeholder="Lâmina Fria +1&#10;Arma (espada longa), incomum&#10;Causa +1d6 de dano de frio…">${escapeHtml(jcol.txt || "")}</textarea>
        ${jcol.erro ? `<div class="ctg-colar-erro"><i class="ti ti-alert-circle"></i>${jcol.erro}</div>` : ""}
        <button type="button" class="ctg-colar-ler" onclick="ctgJogLer('${tipo}')"><i class="ti ti-wand"></i>Ler texto</button>`;
      return;
    }
    const um = jcol.lidos.length === 1;
    p.innerHTML = `
      <div class="ctg-colar-topo"><b>${um ? `Achei: ${escapeHtml(jcol.lidos[0].nome)}` : `Achei ${jcol.lidos.length} coisas`}</b><button type="button" onclick="ctgJogVoltar('${tipo}')">Colar outro</button></div>
      ${um ? `<p class="ctg-colar-dica">Já preenchi o formulário abaixo. Confira e toque em adicionar.</p>` : `
      <div class="ctg-colar-lista">${jcol.lidos.map((x, i) => `
        <label class="ctg-colar-item">
          <input type="checkbox" ${jcol.marcados.has(i) ? "checked" : ""} onchange="ctgJogMarcar('${tipo}', ${i}, this.checked)">
          <span class="ctg-colar-info"><b>${escapeHtml(x.nome)}</b><small>${escapeHtml(subJog(x))}</small></span>
          <button type="button" class="ctg-colar-abrir" onclick="event.preventDefault(); ctgJogUm('${tipo}', ${i})">Editar</button>
        </label>`).join("")}
      </div>
      <button type="button" class="ctg-colar-ler" onclick="ctgJogTodos('${tipo}')" ${jcol.marcados.size ? "" : "disabled"}><i class="ti ti-backpack"></i>Adicionar ${jcol.marcados.size} na ficha</button>`}`;
  }
  // o que vai no formulário/objeto da ficha
  function dadosJog(x) {
    const o = objItem(x);
    const nb = (t) => norm(t);
    const arma = x.categoria === "armas" ? comunsDe("arma").filter((a) => nb(x.base || x.nome).includes(nb(a.nome))).sort((a, b) => b.nome.length - a.nome.length)[0] : null;
    const rod = rodape([["Tipo", x.tipo], ["Raridade", x.classificacao === "artefato" ? "Artefato" : x.raridade !== "comum" ? RAR_NOME[x.raridade] : ""], ["Sintonia", x.sintoniaPor || ""]]);
    return {
      nome: x.nome,
      dano: o.dano ? (x.bonus && !x.dano ? String(o.dano).replace(/\+\d+(?=\s)/, "") : String(o.dano)) : "", // o bônus vai no campo de bônus
      bonus: x.bonus || 0,
      atrib: arma && (arma.uso === "À distância" || /acuidade/i.test(arma.props || "")) ? "destreza" : "forca",
      ca: o.ca ? String(o.ca) : "",
      sint: x.sintonia === "sim",
      desc: [x.efeito, rod].filter(Boolean).join("\n\n"),
    };
  }
  function preencherJog(tipo, x) {
    const d = dadosJog(x);
    if (tipo === "arma") {
      setar("armaNome", d.nome); setar("armaDano", d.dano);
      const atr = $("armaAtrib"); if (atr) { atr.value = d.atrib; atr.dispatchEvent(new Event("change", { bubbles: true })); }
      chave("armaSomaProf", true); chave("armaSomaDano", true);
      setar("armaBonusAtk", d.bonus ? String(d.bonus) : ""); setar("armaBonusDano", d.bonus ? String(d.bonus) : "");
      chave("armaRequerSintonia", d.sint); setar("armaDesc", d.desc);
      if (typeof atualizarPreviewAtaqueArma === "function") try { atualizarPreviewAtaqueArma("arma"); } catch (er) {}
    } else if (tipo === "armadura") {
      setar("armaduraNome", d.nome); setar("armaduraCA", d.ca); chave("armaduraRequerSintonia", d.sint); setar("armaduraDesc", d.desc);
    } else {
      setar("itemNome", d.nome); setar("itemQtd", 1); chave("itemBolsa", false); chave("itemRecipiente", false); chave("itemRequerSintonia", d.sint); setar("itemDesc", d.desc);
    }
    const sh = $(TIPOS[tipo].sheet);
    if (sh) abrirDesc(sh);
  }
  // abre no painel certo (uma espada colada em "Novo item" vai pra "Nova arma")
  function abrirJog(tipoAtual_, x) {
    const alvo = CAT_JOG[x.categoria] || "item";
    if (alvo !== tipoAtual_ && typeof cb2AbrirSheet === "function") {
      jcol.trocando = true;
      try { cb2AbrirSheet(alvo); } finally { jcol.trocando = false; }
      if (typeof mostrarToastMundo === "function") mostrarToastMundo(`${x.nome} é ${alvo === "item" ? "um item" : "uma " + NOME_JOG[alvo]}: abri no painel certo`);
    }
    preencherJog(alvo, x);
    const sh = $(TIPOS[alvo].sheet);
    if (sh) { marcarSeg(sh, "colar"); renderJog(alvo); }
    return alvo;
  }
  window.ctgJogColar = function (tipo) {
    const sh = $(TIPOS[tipo].sheet);
    marcarSeg(sh, "colar");
    renderJog(tipo);
    setTimeout(() => { const t = $("ctgJogTxt"); if (t && !jcol.lidos.length) t.focus(); }, 60);
  };
  window.ctgJogLer = function (tipo) {
    const t = $("ctgJogTxt");
    jcol.txt = t ? t.value : "";
    jcol.erro = "";
    if (!jcol.txt.trim()) return;
    if (typeof window.lerItensColados !== "function") { jcol.erro = "O leitor de itens não carregou. Confira se o leitor-item.js está na pasta javascript e no index.html."; return renderJog(tipo); }
    let r = { itens: [] };
    try { r = window.lerItensColados(jcol.txt); } catch (er) { console.warn(er); }
    if (!r.itens.length) { jcol.erro = "Não achei nada nesse texto. Deixe o nome sozinho na primeira linha e o que ele faz embaixo."; return renderJog(tipo); }
    jcol.lidos = r.itens;
    jcol.marcados = new Set(r.itens.map((_, i) => i));
    if (jcol.lidos.length === 1) abrirJog(tipo, jcol.lidos[0]);
    else renderJog(tipo);
  };
  window.ctgJogVoltar = function (tipo) { jcol.lidos = []; renderJog(tipo); };
  window.ctgJogMarcar = function (tipo, i, on) { on ? jcol.marcados.add(i) : jcol.marcados.delete(i); renderJog(tipo); };
  window.ctgJogUm = function (tipo, i) {
    const x = jcol.lidos[i];
    if (!x) return;
    jcol.lidos = [x]; jcol.marcados = new Set([0]);
    abrirJog(tipo, x);
  };
  window.ctgJogTodos = function (tipo) {
    const lista = [...jcol.marcados].sort((a, b) => a - b).map((i) => jcol.lidos[i]).filter(Boolean);
    if (!lista.length) return;
    const cont = { arma: 0, armadura: 0, item: 0 };
    lista.forEach((x) => {
      const alvo = CAT_JOG[x.categoria] || "item";
      const d = dadosJog(x);
      const base = { modificacoes: [], nome: d.nome, desc: d.desc, requerSintonia: d.sint, sintonizado: false, imagemUrl: "", imagemDeleteUrl: "" };
      if (alvo === "arma" && typeof armas !== "undefined") {
        armas.push({ ...base, dano: d.dano, temCargas: false, maxCargas: 0, cargasGastas: [], atributoAtaque: d.atrib, somarProf: true, somarAtribDano: true, bonusAtaque: d.bonus, bonusDano: d.bonus });
      } else if (alvo === "armadura" && typeof armaduras !== "undefined") {
        armaduras.push({ ...base, ca: d.ca, temCargas: false, maxCargas: 0, cargasGastas: [] });
      } else if (typeof inventario !== "undefined") {
        inventario.push({ ...base, bolsa: false, id: typeof gerarIdItem === "function" ? gerarIdItem() : "i" + Date.now() + Math.random().toString(36).slice(2, 6), qtd: 1, recipiente: false, dentroDe: "" });
      } else return;
      cont[alvo]++;
    });
    jcol.lidos = []; jcol.txt = ""; jcol.marcados = new Set();
    try { if (cont.arma && typeof renderArmas === "function") renderArmas(); } catch (er) {}
    try { if (cont.armadura && typeof renderArmaduras === "function") renderArmaduras(); } catch (er) {}
    try { if (cont.item && typeof renderInv === "function") renderInv(); } catch (er) {}
    if (typeof salvarTudo === "function") salvarTudo();
    if (typeof cb2FecharSheet === "function") cb2FecharSheet();
    const partes = [cont.arma && `${cont.arma} arma${cont.arma > 1 ? "s" : ""}`, cont.armadura && `${cont.armadura} armadura${cont.armadura > 1 ? "s" : ""}`, cont.item && `${cont.item} ite${cont.item > 1 ? "ns" : "m"}`].filter(Boolean);
    if (typeof mostrarToastMundo === "function") mostrarToastMundo(`Adicionado: ${partes.join(", ")}`);
  };
  function limparMestre(tipo) {
    const ed = editorMestre(tipo);
    if (!ed) return;
    const norm = tipo === "item" ? crNormalizarItem : crNormalizar;
    ed.c = norm(tipo === "boss" ? { nome: "", hpMax: 100, ca: 15, _tipo: "boss" } : tipo === "item" ? {} : { nome: "", hpMax: 10, ca: 10 });
    if (tipo === "boss" || tipo === "monstro") ed.c.fases = [];
    try { crRenderEditor(); } catch (er) {}
  }
  // o catálogo de itens do mestre: comuns + mágicos (começa nos mágicos)
  function montarSegMestre(tipo, hostId) {
    const host = $(hostId);
    if (!host || host.previousElementSibling?.classList?.contains("ctg-mestre-box")) return;
    const box = document.createElement("div");
    box.className = "ctg-mestre-box";
    host.before(box);
    montarSeg(tipo, $(TIPOS[tipo].sheet), box);
  }

  /* ---------- seletor Em branco / Do catálogo ---------- */
  function marcarSeg(sh, qual, nome) {
    const seg = sh.querySelector(".ctg-seg");
    if (!seg) return;
    seg.querySelector('[data-q="branco"]').classList.toggle("on", qual === "branco");
    seg.querySelector('[data-q="cat"]').classList.toggle("on", qual === "cat");
    const bc = seg.querySelector('[data-q="colar"]');
    if (bc) bc.classList.toggle("on", qual === "colar");
    const pc = sh.querySelector(".ctg-colar");
    if (pc) pc.hidden = qual !== "colar";
    const info = sh.querySelector(".ctg-escolhido");
    if (info) {
      info.hidden = !(qual === "cat" && nome);
      if (nome) info.querySelector("b").textContent = nome;
    }
  }

  function montarSegs() {
    Object.entries(TIPOS).forEach(([tipo, cfg]) => {
      if (tipo === "magia") return;
      const sh = $(cfg.sheet);
      const corpo = corpoDe(sh);
      montarSeg(tipo, sh, corpo);
    });
  }

  function montarSeg(tipo, sh, corpo) {
      if (!corpo || corpo.querySelector(".ctg-seg")) return;
      const box = document.createElement("div");
      box.innerHTML = `
        <div class="ctg-seg" role="tablist">
          <button type="button" class="on" data-q="branco">Em branco</button>
          <button type="button" data-q="cat">Do catálogo</button>
          <button type="button" data-q="colar">Colar texto</button>
        </div>
        <div class="ctg-escolhido" hidden><i class="ti ti-book-2"></i><span>Do catálogo: <b></b></span><button type="button">Trocar</button></div>`;
      box.querySelector('[data-q="branco"]').addEventListener("click", () => { limparForm(tipo); marcarSeg(sh, "branco"); });
      box.querySelector('[data-q="cat"]').addEventListener("click", () => {
        marcarSeg(sh, "cat", sh.dataset.ctgId ? sh.querySelector(".ctg-escolhido b").textContent : "");
        if (tipo === "mestreItem" && !sh.dataset.ctgId) subItem = "magicos";
        ctgAbrir(tipo);
      });
      box.querySelector(".ctg-escolhido button").addEventListener("click", () => ctgAbrir(tipo));
      const bCol = box.querySelector('[data-q="colar"]');
      if (bCol) bCol.addEventListener("click", () => (tipo === "magia" ? ctgPoderColar() : JOG.includes(tipo) ? ctgJogColar(tipo) : ctgColarAbrirPainel(tipo)));
      corpo.prepend(...box.children);
  }

  // magias: o formulário de poder é montado na hora dentro do popup
  function ligarPoder() {
    const orig = window.abrirFormPoder;
    if (typeof orig !== "function" || orig._ctg) return;
    const novo = function (index) {
      const r = orig.apply(this, arguments);
      const pop = $("popup");
      if (pop) delete pop.dataset.ctgId;
      pcol.lidos = []; pcol.txt = ""; pcol.erro = ""; pcol.marcados = new Set();
      if (!(index >= 0) && pop) montarSeg("magia", pop, pop.querySelector(".pf-form"));
      return r;
    };
    novo._ctg = true;
    window.abrirFormPoder = novo;
    try { abrirFormPoder = novo; } catch (er) {}
  }

  // ao abrir um painel novo, ele começa "Em branco"
  function ligarAbertura() {
    const orig = window.cb2AbrirSheet;
    if (typeof orig !== "function" || orig._ctg) return;
    const novo = function (tipo) {
      const cfg = TIPOS[tipo];
      if (cfg) {
        const sh = $(cfg.sheet);
        if (sh) { delete sh.dataset.ctgId; marcarSeg(sh, "branco"); if (JOG.includes(tipo) && !jcol.trocando) { jcol.lidos = []; jcol.erro = ""; } }
      }
      return orig.apply(this, arguments);
    };
    novo._ctg = true;
    window.cb2AbrirSheet = novo;
    try { cb2AbrirSheet = novo; } catch (er) {}
  }

  // depois de adicionar, limpa a marca do catálogo
  function ligarAdicionar() {
    const orig = window.cb2Adicionar;
    if (typeof orig !== "function" || orig._ctg) return;
    const novo = async function (tipo) {
      const cfg = TIPOS[tipo];
      const sh0 = cfg && $(cfg.sheet);
      const arr = tipo === "arma" ? (typeof armas !== "undefined" ? armas : null) : tipo === "armadura" ? (typeof armaduras !== "undefined" ? armaduras : null) : null;
      const antes = arr ? arr.length : 0;
      const req = sh0 && sh0.dataset.ctgId && sh0.dataset.ctgReq;
      const r = await orig.apply(this, arguments);
      if (arr && req && arr.length > antes) {
        try {
          const rq = JSON.parse(req);
          if (Object.values(rq).some(Boolean)) { arr[arr.length - 1].req = rq; if (typeof salvarTudo === "function") salvarTudo(); }
        } catch (er) {}
        decorar();
      }
      const sh = cfg && $(cfg.sheet);
      if (sh && !sh.classList.contains("on")) { delete sh.dataset.ctgId; marcarSeg(sh, "branco"); }
      return r;
    };
    novo._ctg = true;
    window.cb2Adicionar = novo;
    try { cb2Adicionar = novo; } catch (er) {}
  }

  /* avisos nos cards de arma e armadura da ficha */
  function reqDoItem(tipo, it) {
    if (it.req) return it.req;
    // itens antigos: se o nome bate com o catálogo, usa o requisito de lá
    const n = norm(it.nome).trim();
    const x = comunsDe(tipo).find((c) => norm(c.nome) === n);
    return x ? (tipo === "arma" ? reqArma(x) : reqArmadura(x)) : {};
  }
  function avisoItem(tipo, it) {
    const rq = reqDoItem(tipo, it);
    if (tipo === "arma" && rq.pesada) {
      const v = atributo(rq.pesada);
      if (v !== null && v < 13) return `${rq.pesada === "forca" ? "Força" : "Destreza"} abaixo de 13: ataque com desvantagem`;
    }
    if (tipo === "armadura" && rq.forca) {
      const v = atributo("forca");
      if (v !== null && v < rq.forca) return `Força abaixo de ${rq.forca}: −3 m de deslocamento`;
    }
    return "";
  }
  function decorar() {
    [["arma", "listaArmas", typeof armas !== "undefined" ? armas : []], ["armadura", "listaArmaduras", typeof armaduras !== "undefined" ? armaduras : []]].forEach(([tipo, ul, arr]) => {
      const el = $(ul);
      if (!el) return;
      el.querySelectorAll(":scope > li[data-index]").forEach((li) => {
        const it = arr[+li.dataset.index];
        const t = li.querySelector(".cb2-t");
        if (!it || !t) return;
        const txt = avisoItem(tipo, it);
        let av = t.querySelector(".ctg-aviso-card");
        if (!txt) { if (av) av.remove(); return; }
        if (!av) { av = document.createElement("em"); av.className = "ctg-aviso-card"; t.querySelector("small")?.after(av); }
        av.innerHTML = `<i class="ti ti-alert-triangle"></i>${e(txt)}`;
      });
    });
  }
  window.ctgDecorar = decorar;
  function ligarAvisos() {
    ["listaArmas", "listaArmaduras"].forEach((id) => {
      const el = $(id);
      if (!el || el._ctgObs) return;
      el._ctgObs = true;
      new MutationObserver(() => decorar()).observe(el, { childList: true });
    });
    ["forca", "destreza"].forEach((id) => { const el = $(id); if (el && !el._ctgAv) { el._ctgAv = true; el.addEventListener("input", decorar); } });
    decorar();
  }

  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    const p = $("ctgPainel");
    if (!p || !p.classList.contains("on")) return;
    ev.stopPropagation();
    if (!$("ctgFl").hidden) ctgFecharFiltros(); else fechar();
  }, true);

  // depois de salvar no Grimório, o seletor volta pra "Em branco"
  function ligarSalvarMestre() {
    const orig = window.crSalvarEditor;
    if (typeof orig !== "function" || orig._ctg) return;
    const novo = function () {
      const r = orig.apply(this, arguments);
      Object.values(TIPOS).filter((t) => t.mestre).forEach((t) => { const sh = $(t.sheet); if (sh) { delete sh.dataset.ctgId; marcarSeg(sh, "branco"); } });
      Object.keys(colado).forEach((k) => { if (colado[k].lidos.length === 1) { colado[k].lidos = []; colado[k].txt = ""; } });
      return r;
    };
    novo._ctg = true;
    window.crSalvarEditor = novo;
    try { crSalvarEditor = novo; } catch (er) {}
  }
  function iniciar() { acertarSheets(); montarSegs(); ligarAbertura(); ligarAdicionar(); ligarPoder(); ligarAvisos(); montarSegMestre("mestreItem", "crCriarHost-item"); montarSegMestre("mestreMonstro", "crCriarHost-monstro"); montarSegMestre("mestreBoss", "crCriarHost-boss"); ligarSalvarMestre(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
  window.addEventListener("load", iniciar);
})();

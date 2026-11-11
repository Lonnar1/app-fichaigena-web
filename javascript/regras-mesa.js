/* =====================================================================
   REGRAS-MESA.JS · Ficha Ígnea
   O mestre escreve as regras da mesa do jeito dele (aba Lore → Regras
   da campanha, no Grimório). Este arquivo:
     1) entende o texto (lerRegrasMesa) e diz o que virou automático;
     2) publica o texto no grupo vinculado à campanha;
     3) do lado do jogador, busca as regras do grupo em que a ficha está
        (regrasDaFicha) pra a Evolução e os atributos aplicarem.
   O que não for entendido continua valendo: vira lembrete pro jogador.
   ===================================================================== */
(function () {
  "use strict";

  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const NUM = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10 };
  const numDe = (w) => (/^\d+$/.test(w) ? Number(w) : NUM[w] || 0);
  const NUMR = "(\\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)";
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- entender o texto ---------- */
  const NEG = /(^|[\s,(])(sem|nao|nunca|nenhum|nenhuma|nada de|proibid\w*|vetad\w*|banid\w*|fora)(?=[\s,.:;)]|$)/;
  function nomesDe(lista) { return (lista || []).map((x) => ({ id: x.id, nome: x.nome, n: norm(x.nome) })); }

  function lerRegras(texto) {
    const r = {};
    const itens = [];
    const classes = nomesDe(typeof CLASSES_IGNEA !== "undefined" ? CLASSES_IGNEA : []);
    const racas = nomesDe(typeof RACAS_IGNEA !== "undefined" ? RACAS_IGNEA : []);
    const linhas = String(texto || "").replace(/\r/g, "").split(/\n|;|(?:^|\s)[•·▪]\s/).map((l) => l.replace(/^\s*[-–—*>\d.)]+\s+/, "").trim()).filter((l) => l.length > 1);

    linhas.forEach((linha) => {
      const t = norm(linha);
      const neg = NEG.test(t);
      const ent = [];
      let m;

      // talento a cada N níveis / em níveis certos
      if (/talento|feat/.test(t) && !neg && ((m = t.match(new RegExp("(?:a cada|cada|todo|toda|every)\\s+" + NUMR + "\\s+n(?:i|í)veis"))) || /(todo|cada) n(i|í)vel par|niveis pares/.test(t))) {
        r.talentoCada = m ? numDe(m[1]) : 2;
        ent.push(`Talento extra a cada ${r.talentoCada} níveis`);
      } else if (/talento|feat/.test(t) && !neg && (m = t.match(/n(?:i|í)veis\s+((?:\d{1,2}\s*[oº°]?\s*(?:,|e|and)?\s*){2,})/))) {
        r.talentoNiveis = [...new Set((m[1].match(/\d{1,2}/g) || []).map(Number).filter((n) => n >= 1 && n <= 20))].sort((a, b) => a - b);
        ent.push(`Talento extra nos níveis ${r.talentoNiveis.join(", ")}`);
      }
      // talento no 1º nível
      else if (/talento|feat/.test(t) && /(n(i|í)vel\s*1\b|1\s*[oº°]?\s*n(i|í)vel|primeiro n(i|í)vel|lvl\s*1|level\s*1|comeca|comecam|come[cç]a|inicio|inicia|cria(cao|r)|inicial)/.test(t) && !/(4|quatro)\s*[oº°]?\s*n(i|í)vel/.test(t)) {
        if (neg) { r.talento1 = 0; ent.push("Sem talento extra no 1º nível"); }
        else {
          const n = (t.match(new RegExp(NUMR + "\\s+talentos?")) || [])[1];
          r.talento1 = Math.max(1, numDe(n || "1"));
          ent.push(r.talento1 > 1 ? `${r.talento1} talentos extras no 1º nível` : "Talento extra no 1º nível");
        }
      } else if (/talentos?|feats?/.test(t) && neg && !/talento extra/.test(t)) {
        r.semTalentos = true; ent.push("A mesa não usa talentos");
      }

      // ouro no lugar do equipamento
      if ((/(ouro|\bpo\b|\bpecas de ouro\b|moedas|dinheiro|\bgp\b)/.test(t) && /(em vez|no lugar|ao inves|inves de|troca|compra|so ouro|so po|em ouro|em po\b|em moedas)/.test(t)) || (/equipamento|pacote|kit/.test(t) && /inicial|da classe|do antecedente|de classe/.test(t) && neg)) {
        r.ouro = true;
        const v = t.match(/(\d+)\s*(po|pecas de ouro|ouro|gp|moedas)/);
        if (v) r.ouroValor = Number(v[1]);
        ent.push(`Ouro no lugar do equipamento${v ? ` (${v[1]} PO)` : ""}`);
      }

      // descansos: dados de vida e vida recuperada
      if (/descanso/.test(t) && /dados? de vida|\bdv\b|hit dice/.test(t)) {
        if (/(todos|tudo|inteiros?|todas)/.test(t) && !neg) { r.dvDescanso = "todos"; ent.push("Descanso longo devolve todos os dados de vida"); }
        else if (/(nenhum|nao recupera|nao devolve|nao volta|sem recuperar)/.test(t)) { r.dvDescanso = "nenhum"; ent.push("Descanso longo não devolve dados de vida"); }
        else if (/metade/.test(t)) { r.dvDescanso = "metade"; ent.push("Descanso longo devolve metade dos dados de vida"); }
        else if ((m = t.match(new RegExp(NUMR + "\\s+dados? de vida")))) { r.dvDescanso = numDe(m[1]); ent.push(`Descanso longo devolve ${numDe(m[1])} dado${numDe(m[1]) > 1 ? "s" : ""} de vida`); }
      } else if (/descanso longo|long rest/.test(t) && /(\bpv\b|pontos de vida|\bvida\b|\bhp\b|cura)/.test(t)) {
        if (/(nao recupera|nao cura|nao volta|sem recuperar|nenhum)/.test(t)) { r.pvDescanso = 0; ent.push("Descanso longo não recupera vida"); }
        else if (/metade/.test(t)) { r.pvDescanso = 0.5; ent.push("Descanso longo recupera metade da vida"); }
        else if (/(um quarto|1\/4|25\s*%)/.test(t)) { r.pvDescanso = 0.25; ent.push("Descanso longo recupera um quarto da vida"); }
        else if ((m = t.match(/(\d{1,3})\s*%/))) { r.pvDescanso = Math.min(1, Number(m[1]) / 100); ent.push(`Descanso longo recupera ${m[1]}% da vida`); }
        else if (/(toda|tudo|cheia|maximo|inteira)/.test(t)) { r.pvDescanso = 1; ent.push("Descanso longo recupera toda a vida"); }
      }
      // pontos de vida ao subir de nível
      else if (/(\bpv\b|pontos de vida|\bvida\b|\bhp\b|dado de vida)/.test(t) && !/(1|primeiro)\s*[oº°]?\s*n(i|í)vel/.test(t) && !/descanso/.test(t)) {
        if (/(rola|rolar|rolad|rolagem)/.test(t) && /(media|minimo)/.test(t) && /(menor|menos|abaixo|pior|minimo)/.test(t)) { r.pv = "rolarMin"; ent.push("PV: rola, mas nunca abaixo da média"); }
        else if (/(maximo|cheio|cheia|full|max\b|inteir[oa])/.test(t)) { r.pv = "max"; ent.push("PV máximo ao subir de nível"); }
        else if (/(rola|rolar|rolad|rolagem)/.test(t) && !neg) { r.pv = "rolar"; ent.push("PV rolado ao subir de nível"); }
        else if (/(media|fixo)/.test(t) || (/(rola|rolar)/.test(t) && neg)) { r.pv = "media"; ent.push("PV pela média ao subir de nível"); }
      }

      // nível inicial e máximo
      if ((m = t.match(/(?:comeca\w*|comecam|inicia\w*|inicio|criad\w*|start\w*)[^.]{0,30}?n(?:i|í)vel\s*(\d{1,2})|n(?:i|í)vel\s*(\d{1,2})\s*(?:inicial|de inicio)|n(?:i|í)vel\s*(?:inicial|de inicio)\s*(?:e\s*|:)?\s*(\d{1,2})|(?:comeca\w*|comecam)[^.]{0,20}?(?:no|do)\s*(\d{1,2})\s*[oº°]?\s*n(?:i|í)vel/))) {
        const n = Number(m[1] || m[2] || m[3] || m[4]);
        if (n >= 2 && n <= 20 && !/talento|feat/.test(t)) { r.nivelInicial = n; ent.push(`Personagens começam no nível ${n}`); }
      }
      if ((m = t.match(/n(?:i|í)vel\s*(?:maximo|limite|teto)\s*(?:e\s*|de\s*|:)?\s*(\d{1,2})|(?:ate|limite (?:de|no))\s*(?:o\s*)?n(?:i|í)vel\s*(\d{1,2})|(?:nao passa|nao passam)\w*[^.]{0,20}n(?:i|í)vel\s*(\d{1,2})/))) {
        const n = Number(m[1] || m[2] || m[3]);
        if (n >= 1 && n <= 20 && n !== r.nivelInicial) { r.nivelMax = n; ent.push(`Nível máximo ${n}`); }
      }

      // atributos
      if (/atributo|status|ficha|stats|valores/.test(t) || /4d6|3d6|compra de (\d+ )?pontos|point buy|array/.test(t)) {
        if (/4d6/.test(t)) { r.atributos = "rolar"; ent.push("Atributos: rolar 4d6 e tirar o menor"); }
        else if (/3d6/.test(t)) { r.atributos = "rolar"; r.atributos3d6 = true; ent.push("Atributos rolados (3d6 — confira os dados que a mesa usa)"); }
        else if (/(compra de (\d+ )?pontos|point buy|(\d+)\s*pontos)/.test(t)) {
          r.atributos = "compra";
          const p = t.match(/(\d+)\s*pontos/);
          if (p && Number(p[1]) !== 27) r.pontos = Number(p[1]);
          ent.push(`Atributos por compra de pontos${p && Number(p[1]) !== 27 ? ` (${p[1]} pontos)` : ""}`);
        } else if (/(array|conjunto padrao|valores prontos|padrao|15\D+14\D+13\D+12\D+10\D+8)/.test(t)) { r.atributos = "prontos"; ent.push("Atributos com os valores prontos (15, 14, 13, 12, 10, 8)"); }
        else if (/(rola|rolar|rolad|dados)/.test(t) && !neg) { r.atributos = "rolar"; ent.push("Atributos rolados"); }
      }

      // sistema de Domínios (Corpo, Mente e Alma)
      if (/\bdominios?\b/.test(t)) {
        if (neg) { r.dominios = false; ent.push("Sem Domínios"); }
        else { r.dominios = true; ent.push("Usa o sistema de Domínios (Corpo, Mente e Alma)"); }
      }

      // multiclasse
      if (/multi\s?-?classe|multiclass/.test(t)) {
        if (neg) { r.multiclasse = false; ent.push("Sem multiclasse"); }
        else if (/(liberad|permitid|pode|vale|aceita)/.test(t)) { r.multiclasse = true; ent.push("Multiclasse liberada"); }
      }

      // classes e raças fora da mesa
      if (neg) {
        // "Sem bruxo", "Proibido paladino e monge", "Classes proibidas: …" valem pra linha toda;
        // senão só "Bárbaro está fora" / "Bruxo não pode" no fim da frase ("Druida não pode usar metal" é outra regra)
        const linhaToda = /^(sem|proibid\w*|banid\w*|vetad\w*|nada de|nao (tem|usa\w*|vale|pode))\b/.test(t) || /^(classes?|racas?|especies?|povos?)\s+(proibid|banid|vetad|fora|que nao)/.test(t);
        const temNome = (n) => new RegExp("(^|[^a-z])" + n + "s?([^a-z]|$)").test(t);
        const noFim = (n) => new RegExp(n + "s?\\s+(?:(?:esta|estao|e|sao|fica|ficam)\\s+)?(?:fora|proibid\\w*|banid\\w*|vetad\\w*|nao (?:pode|podem|vale|valem|entra|entram|e permitid\\w*))\\s*(?:da mesa|na mesa|nessa campanha|na campanha|da campanha|dessa campanha|desta campanha)?\\s*[.!]?$").test(t);
        const todas = linhaToda || classes.concat(racas).some((c) => temNome(c.n) && noFim(c.n));
        const cl = classes.filter((c) => temNome(c.n) && todas);
        const rc = racas.filter((c) => temNome(c.n) && todas);
        if (cl.length && !/multi/.test(t)) { r.classesFora = [...new Set((r.classesFora || []).concat(cl.map((c) => c.id)))]; ent.push(`Fora da mesa: ${cl.map((c) => c.nome).join(", ")}`); }
        if (rc.length) { r.racasFora = [...new Set((r.racasFora || []).concat(rc.map((c) => c.id)))]; ent.push(`Raças fora da mesa: ${rc.map((c) => c.nome).join(", ")}`); }
        if (/(caseir|homebrew|criad|personalizad|custom)/.test(t) && /classe/.test(t)) { r.semCustom = true; ent.push("Sem classes criadas por jogador"); }
      }

      itens.push({ linha, entendi: ent });
    });
    return { r, itens, lembretes: itens.filter((i) => !i.entendi.length).map((i) => i.linha) };
  }
  window.lerRegrasMesa = lerRegras;

  /* ---------- lado do jogador: regras do grupo em que a ficha está ---------- */
  const fichaAtual = () => (typeof personagens !== "undefined" && typeof personagemAtual !== "undefined" ? personagens[personagemAtual] : null);
  const chave = (f) => "ignea_regras_ficha_" + String(f && f.id);
  function cache(f) { try { return JSON.parse(localStorage.getItem(chave(f)) || "null"); } catch (e) { return null; } }
  window.regrasDaFicha = function () {
    const f = fichaAtual();
    const c = f ? cache(f) : null;
    if (!c || !String(c.texto || "").trim()) return null;
    const lido = lerRegras(c.texto);
    return { ...lido, campanha: c.campanha || "", grupo: c.grupoNome || "", t: c.t || 0 };
  };
  // a Evolução já lê o grupo ativo da ficha: aproveita a leitura
  window.guardarRegrasDaFicha = function (f, g) {
    if (!f) return false;
    const antes = JSON.stringify(cache(f));
    const rm = g && g.regrasMesa && String(g.regrasMesa.texto || "").trim() ? { ...g.regrasMesa, grupoNome: g.nome || "" } : null;
    try { if (rm) localStorage.setItem(chave(f), JSON.stringify(rm)); else localStorage.removeItem(chave(f)); } catch (e) {}
    return antes !== JSON.stringify(cache(f));
  };
  let buscando = null;
  window.atualizarRegrasDaFicha = async function () {
    const f = fichaAtual();
    const u = window.usuarioAtual;
    if (!f || !u || !window.getDocs || !window.query || !window.collection || !window.where || !window.db) return false;
    if (buscando) return buscando;
    buscando = (async () => {
      try {
        const snap = await window.getDocs(window.query(window.collection(window.db, "grupos"), window.where("membrosUids", "array-contains", u.uid)));
        let achou = null;
        snap.forEach((d) => {
          const g = d.data() || {};
          const eu = (g.membros || []).find((m) => m.uid === u.uid && String(m.fichaId) === String(f.id));
          if (eu && g.regrasMesa && (!achou || (g.regrasMesa.t || 0) > (achou.t || 0))) achou = { ...g.regrasMesa, grupoNome: g.nome || "" };
        });
        const antes = JSON.stringify(cache(f));
        if (achou) localStorage.setItem(chave(f), JSON.stringify(achou));
        else localStorage.removeItem(chave(f));
        return antes !== JSON.stringify(cache(f));
      } catch (e) { console.warn("regras da mesa:", e); return false; }
      finally { setTimeout(() => { buscando = null; }, 0); }
    })();
    return buscando;
  };

  /* ---------- descansos: dados de vida e vida (script.js chama esses ganchos) ---------- */
  const regrasR = () => { const m = window.regrasDaFicha && window.regrasDaFicha(); return m ? m.r : {}; };
  const sinalN = (n) => (n >= 0 ? `+${n}` : `${n}`);
  function dadosLivres() {
    const f = fichaAtual();
    const pool = typeof window.poolDadosVida === "function" ? window.poolDadosVida() : null;
    if (!f || !pool) return null;
    const gastos = f.dvGastos || {};
    const livres = {};
    Object.keys(pool).forEach((d) => { livres[d] = Math.max(0, pool[d] - (gastos[d] || 0)); });
    return { f, pool, gastos, livres, total: Object.values(livres).reduce((a, b) => a + b, 0) };
  }
  const listaDados = (o) => Object.keys(o).filter((d) => o[d] > 0).sort((a, b) => b - a).map((d) => `${o[d]}d${d}`).join(" + ");
  window._descansoCurtoExtra = async function () {
    const dv = dadosLivres();
    if (!dv || !dv.total || typeof vidaAtual === "undefined") return;
    const max = typeof get === "function" ? get("vidaMax") : 0;
    if (!max || vidaAtual >= max) return;
    const con = typeof modAtributo === "function" ? modAtributo("constituicao") : 0;
    const r = typeof promptBonito === "function" ? await promptBonito(`Gastar dados de vida? Você tem ${listaDados(dv.livres)} (cada um cura o dado ${sinalN(con)}). Quantos?`, "1") : null;
    let n = parseInt(r, 10);
    if (!n || n < 1) return;
    n = Math.min(n, dv.total);
    let cura = 0;
    const rolagens = [];
    const tamanhos = Object.keys(dv.livres).map(Number).sort((a, b) => b - a);
    dv.f.dvGastos = { ...dv.gastos };
    for (let i = 0; i < n; i++) {
      const d = tamanhos.find((t) => dv.livres[t] > 0);
      if (!d) break;
      dv.livres[d]--;
      dv.f.dvGastos[d] = (dv.f.dvGastos[d] || 0) + 1;
      const rol = 1 + Math.floor(Math.random() * d);
      rolagens.push(`d${d}: ${rol}`);
      cura += Math.max(0, rol + con);
    }
    vidaAtual = Math.min(max, vidaAtual + cura);
    if (typeof atualizarHP === "function") atualizarHP();
    if (typeof salvarTudo === "function") salvarTudo();
    if (typeof mostrarToastMundo === "function") mostrarToastMundo(`+${cura} PV (${rolagens.join(", ")}${con ? `, ${sinalN(con)} cada` : ""})`);
  };
  window._textoDescansoLongo = function () {
    const p = regrasR().pvDescanso;
    if (p === undefined || p === 1) return "a vida até o máximo";
    if (p === 0) return "nenhuma vida (regra da mesa)";
    return `${p === 0.5 ? "metade" : p === 0.25 ? "um quarto" : Math.round(p * 100) + "%"} da vida máxima (regra da mesa)`;
  };
  window._descansoLongoVida = function (atual, max) {
    const p = regrasR().pvDescanso;
    if (p === undefined || p === 1) return max;
    return Math.min(max, atual + Math.floor(max * p));
  };
  window._descansoLongoDados = function () {
    const dv = dadosLivres();
    if (!dv) return "";
    const gastoTot = Object.values(dv.gastos).reduce((a, b) => a + b, 0);
    if (!gastoTot) return "";
    const totalPool = Object.values(dv.pool).reduce((a, b) => a + b, 0);
    const regra = regrasR().dvDescanso;
    let volta = regra === "todos" ? gastoTot : regra === "nenhum" ? 0 : typeof regra === "number" ? regra : Math.max(1, Math.floor(totalPool / 2));
    volta = Math.min(volta, gastoTot);
    if (!volta) return "dados de vida não voltam (regra da mesa)";
    const g = { ...dv.gastos };
    let falta = volta;
    // devolve primeiro os dados maiores
    Object.keys(g).map(Number).sort((a, b) => b - a).forEach((d) => { const k = Math.min(g[d], falta); g[d] -= k; falta -= k; });
    dv.f.dvGastos = g;
    return `${volta} dado${volta > 1 ? "s" : ""} de vida de volta`;
  };

  /* ---------- lado do mestre: aba Lore → Regras ---------- */
  const campanhaAtual = () => (typeof campanhasMaster !== "undefined" && typeof campanhaAtualMaster !== "undefined" ? campanhasMaster[campanhaAtualMaster] : null);
  const EXEMPLO = "Todo mundo começa com um talento no nível 1\nOuro no lugar do equipamento inicial\nPV máximo ao subir de nível\nAtributos: compra de pontos\nSem multiclasse\nCrítico: dano máximo do dado + rolagem";

  function montarAbaMestre() {
    const lore = document.getElementById("abaMaster-lore");
    const tabs = lore && lore.querySelector(".mundo-tabs");
    if (!tabs || document.getElementById("loreSecaoRegras")) return;
    const b = document.createElement("button");
    b.className = "mundo-tab-btn";
    b.textContent = "Regras";
    b.onclick = function () { abrirAbaRegras(this); };
    tabs.appendChild(b);
    const sec = document.createElement("div");
    sec.id = "loreSecaoRegras";
    sec.className = "mundo-secao";
    sec.style.display = "none";
    sec.innerHTML = `
      <p class="rm-dica">Escreva as regras da sua mesa do seu jeito, uma por linha. O que o app entender vira automático na ficha dos jogadores do grupo; o resto aparece pra eles como lembrete.</p>
      <textarea id="regrasMesaTxt" class="textarea-lore-grande rm-txt" placeholder="${esc(EXEMPLO)}" oninput="rmDigitou()"></textarea>
      <div id="regrasMesaStatus" class="rm-status"></div>
      <div id="regrasMesaLido" class="rm-lido"></div>`;
    const ev = lore.querySelector("#loreSecaoEventos");
    if (ev) ev.after(sec); else lore.appendChild(sec);
  }
  function abrirAbaRegras(btn) {
    const lore = document.getElementById("abaMaster-lore");
    lore.querySelectorAll(".mundo-secao").forEach((s) => { s.style.display = "none"; });
    lore.querySelectorAll(".mundo-tab-btn").forEach((x) => x.classList.remove("active"));
    btn.classList.add("active");
    const sec = document.getElementById("loreSecaoRegras");
    sec.style.display = "block";
    const c = campanhaAtual();
    document.getElementById("regrasMesaTxt").value = c ? c.regrasMesa || "" : "";
    renderLido();
    renderStatus(c && c.regrasMesa ? (c.regrasPublicadas === c.regrasMesa ? "ok" : "pendente") : "");
  }
  function renderLido() {
    const box = document.getElementById("regrasMesaLido");
    if (!box) return;
    const txt = document.getElementById("regrasMesaTxt").value;
    if (!txt.trim()) { box.innerHTML = ""; return; }
    const { itens } = lerRegras(txt);
    box.innerHTML = `<h4 class="rm-h">Como o app entendeu</h4>` + itens.map((i) => i.entendi.length
      ? `<div class="rm-item auto"><span class="rm-ic">✓</span><div><b>${i.entendi.map(esc).join(" · ")}</b><small>${esc(i.linha)}</small></div></div>`
      : `<div class="rm-item"><span class="rm-ic">✎</span><div><b>${esc(i.linha)}</b><small>Lembrete: aparece pros jogadores, o app não aplica sozinho</small></div></div>`).join("");
  }
  function renderStatus(estado, extra) {
    const el = document.getElementById("regrasMesaStatus");
    if (!el) return;
    const c = campanhaAtual();
    if (!c) { el.innerHTML = ""; return; }
    if (!c.grupoVinculado) { el.innerHTML = `<span class="rm-aviso">Essa campanha não tem grupo vinculado. As regras ficam salvas aqui, mas só chegam aos jogadores quando você vincular um grupo (editar campanha).</span>`; return; }
    el.innerHTML = estado === "ok" ? `<span class="rm-ok">✓ Os jogadores do grupo já recebem essas regras</span>`
      : estado === "enviando" ? `<span>Enviando pro grupo…</span>`
      : estado === "erro" ? `<span class="rm-aviso">Não consegui enviar pro grupo agora${extra ? ` (${esc(extra)})` : ""}. Tento de novo na próxima mudança.</span>`
      : estado === "pendente" ? `<span>Salvo. Enviando pro grupo…</span>` : "";
  }
  let tEnvio = null;
  window.rmDigitou = function () {
    const c = campanhaAtual();
    if (!c) return;
    c.regrasMesa = document.getElementById("regrasMesaTxt").value;
    renderLido();
    clearTimeout(tEnvio);
    renderStatus("pendente");
    tEnvio = setTimeout(publicar, 1200);
  };
  async function publicar() {
    const c = campanhaAtual();
    if (!c) return;
    if (typeof salvarCampanhasMaster === "function") salvarCampanhasMaster();
    if (!c.grupoVinculado) return renderStatus("");
    if (!window.updateDoc || !window.doc || !window.db) return renderStatus("erro", "sem conexão");
    renderStatus("enviando");
    try {
      await window.updateDoc(window.doc(window.db, "grupos", c.grupoVinculado), { regrasMesa: { texto: c.regrasMesa || "", campanha: c.nome || "", t: Date.now() } });
      c.regrasPublicadas = c.regrasMesa || "";
      if (typeof salvarCampanhasMaster === "function") salvarCampanhasMaster();
      renderStatus("ok");
    } catch (e) {
      console.warn("regras da mesa:", e);
      renderStatus("erro", e.code || e.message);
    }
  }
  // quando o mestre troca o grupo da campanha, as regras vão junto
  function ligarEdicaoCampanha() {
    const orig = window.salvarEdicaoCampanha;
    if (typeof orig !== "function" || orig._rm) return;
    const novo = function () {
      const i = window._campanhaEmEdicaoIndex;
      const antes = i !== null && campanhasMaster[i] ? campanhasMaster[i].grupoVinculado : "";
      const r = orig.apply(this, arguments);
      const c = i !== null ? campanhasMaster[i] : null;
      if (c && c.regrasMesa && c.grupoVinculado && c.grupoVinculado !== antes && i === campanhaAtualMaster) publicar();
      return r;
    };
    novo._rm = true;
    window.salvarEdicaoCampanha = novo;
  }

  function iniciar() { montarAbaMestre(); ligarEdicaoCampanha(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();

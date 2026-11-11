/* =====================================================================
   ATRIBUTOS.JS · Ficha Ígnea
   Distribuir atributos: compra de pontos, valores prontos ou rolar dados.
   Os bônus que já entraram na ficha (antecedente, melhorias de nível)
   são somados por cima, sem perder nada.
   ===================================================================== */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const ATR = { for: "forca", des: "destreza", con: "constituicao", int: "inteligencia", sab: "sabedoria", car: "carisma" };
  const NOME = { for: "Força", des: "Destreza", con: "Constituição", int: "Inteligência", sab: "Sabedoria", car: "Carisma" };
  const ICO = { for: "barbell", des: "feather", con: "shield", int: "book-2", sab: "eye", car: "flame" };
  const DICA = {
    for: "Ataques corpo a corpo, carregar peso, Atletismo",
    des: "CA, iniciativa, armas de acuidade e à distância, Furtividade",
    con: "Pontos de vida e manter concentração",
    int: "Magia do Mago, Arcanismo, Investigação",
    sab: "Magia de Clérigo e Druida, Percepção, Intuição",
    car: "Magia de Bardo, Bruxo e Feiticeiro, Persuasão",
  };
  const CUSTO = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  const PRONTOS = [15, 14, 13, 12, 10, 8];
  const K = Object.keys(ATR);
  const mod = (v) => Math.floor((v - 10) / 2);
  const sinal = (n) => (n >= 0 ? "+" + n : String(n));

  let st = null; // { metodo, base:{k:v}, pool:[...], dados:[...] }

  const ficha = () => (typeof personagens !== "undefined" && typeof personagemAtual !== "undefined" && personagemAtual !== null ? personagens[personagemAtual] : null);
  // bônus que já estão somados no campo (antecedente e melhorias de nível)
  function bonus() {
    const out = {}, origem = {};
    K.forEach((k) => { out[k] = 0; origem[k] = []; });
    const p = ficha(), s = p && p.progressao;
    if (s && s.antecedente && s.antecedente.atr) Object.entries(s.antecedente.atr).forEach(([k, v]) => { if (v) { out[k] += v; origem[k].push(`+${v} antecedente`); } });
    if (s && Array.isArray(s.niveis)) s.niveis.forEach((n, i) => { if (n.asi) Object.entries(n.asi).forEach(([k, v]) => { if (v) { out[k] += v; origem[k].push(`+${v} nível ${i + 1}`); } }); });
    return { out, origem };
  }
  const valorCampo = (k) => parseInt(($(ATR[k]) || {}).value) || 10;

  // classe principal (pra sugerir a ordem)
  function prioridade() {
    const p = ficha(), s = p && p.progressao;
    let c = null;
    try {
      if (s && s.niveis && s.niveis.length && typeof CLASSES_IGNEA !== "undefined") {
        const cid = s.niveis[0].c;
        c = CLASSES_IGNEA.find((x) => x.id === cid) || null;
        if (!c && s.classesCustom && s.classesCustom[cid]) c = s.classesCustom[cid];
      }
    } catch (e) {}
    if (!c) return null;
    const prim = c.primOu ? (c.prim || []).slice(0, 1) : (c.prim || []).slice(0, 2);
    const ordem = [...prim];
    if (!ordem.includes("con")) ordem.push("con");
    if (c.atrConj && !ordem.includes(c.atrConj)) ordem.push(c.atrConj);
    (c.saves || []).forEach((k) => { if (!ordem.includes(k)) ordem.push(k); });
    ["des", "sab", "con", "for", "car", "int"].forEach((k) => { if (!ordem.includes(k)) ordem.push(k); });
    return { nome: c.nome, ordem: ordem.slice(0, 6), duas: prim.length > 1 };
  }

  // regra da mesa escrita pelo mestre (regras-mesa.js)
  const mesaR = () => { try { const m = typeof window.regrasDaFicha === "function" ? window.regrasDaFicha() : null; return m ? m.r : {}; } catch (e) { return {}; } };
  const PONTOS = () => mesaR().pontos || 27;
  function garantirPainel() {
    if ($("daPainel")) return;
    const f = document.createElement("div");
    f.id = "daFundo";
    f.className = "ev-fundo";
    f.onclick = fechar;
    const p = document.createElement("div");
    p.id = "daPainel";
    p.className = "ev-painel da-painel";
    p.setAttribute("role", "dialog");
    p.innerHTML = `<div class="ev-cab"><span style="width:34px"></span><h3>Distribuir atributos</h3><button type="button" onclick="daFechar()" aria-label="Fechar">✕</button></div><div class="ev-corpo" id="daCorpo"></div><div class="ev-rodape" id="daRodape"></div>`;
    document.body.append(f, p);
  }
  function abrir() {
    garantirPainel();
    const b = bonus().out;
    // o que está no campo hoje, sem os bônus
    const base = {};
    K.forEach((k) => { base[k] = Math.max(3, Math.min(20, valorCampo(k) - b[k])); });
    const cabeCompra = K.every((k) => base[k] >= 8 && base[k] <= 15) && K.reduce((t, k) => t + CUSTO[base[k]], 0) <= PONTOS();
    st = { metodo: cabeCompra ? "compra" : "prontos", base: cabeCompra ? base : {}, pool: PRONTOS.slice(), dados: null, antes: base };
    const rm = mesaR().atributos;
    if (rm && !(rm === "compra" && cabeCompra)) { st.metodo = rm; st.base = rm === "compra" ? base : {}; if (rm === "compra" && !cabeCompra) K.forEach((k) => { st.base[k] = 8; }); if (rm === "rolar") { st.pool = []; st.dados = null; } }
    if (st.metodo === "compra" && K.every((k) => base[k] === 10)) K.forEach((k) => { st.base[k] = 8; });
    render();
    $("daFundo").classList.add("aberto");
    $("daPainel").classList.add("aberto");
    document.body.classList.add("ev-travado-scroll");
    $("daCorpo").scrollTop = 0;
  }
  function fechar() {
    $("daFundo")?.classList.remove("aberto");
    $("daPainel")?.classList.remove("aberto");
    if (!$("evPainel") || !$("evPainel").classList.contains("aberto")) document.body.classList.remove("ev-travado-scroll");
  }
  window.daAbrir = abrir;
  window.daFechar = fechar;

  window.daMetodo = function (m) {
    st.metodo = m;
    if (m === "compra") { st.base = {}; K.forEach((k) => { st.base[k] = 8; }); }
    else if (m === "prontos") { st.base = {}; st.pool = PRONTOS.slice(); }
    else if (m === "rolar") { st.base = {}; st.pool = []; st.dados = null; }
    render();
  };
  const gastos = () => K.reduce((t, k) => t + (CUSTO[st.base[k]] ?? 0), 0);
  window.daMais = function (k, d) {
    const v = (st.base[k] || 8) + d;
    if (v < 8 || v > 15) return;
    const antes = st.base[k];
    st.base[k] = v;
    if (gastos() > PONTOS()) { st.base[k] = antes; toast("Acabaram os pontos."); return; }
    render(true);
  };
  // valores prontos / rolados: toca no número pra colocar no atributo (troca se já estiver em outro)
  window.daPor = function (k, idx) {
    const val = st.pool[idx];
    if (val === undefined) return;
    const usadoEm = K.find((x) => st.base[x] !== undefined && st.usoIdx && st.usoIdx[x] === idx);
    st.usoIdx = st.usoIdx || {};
    if (usadoEm === k) { delete st.base[k]; delete st.usoIdx[k]; render(true); return; }
    if (usadoEm) {
      if (st.usoIdx[k] !== undefined) { st.usoIdx[usadoEm] = st.usoIdx[k]; st.base[usadoEm] = st.pool[st.usoIdx[k]]; }
      else { delete st.usoIdx[usadoEm]; delete st.base[usadoEm]; }
    }
    st.usoIdx[k] = idx;
    st.base[k] = val;
    render(true);
  };
  window.daRolar = function () {
    st.dados = Array.from({ length: 6 }, () => {
      const d = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6));
      const menor = Math.min(...d);
      const i = d.indexOf(menor);
      return { d, fora: i, total: d.reduce((t, v) => t + v, 0) - menor };
    });
    st.pool = st.dados.map((x) => x.total);
    st.base = {};
    st.usoIdx = {};
    render();
  };
  window.daSugerir = function () {
    const pr = prioridade();
    if (!pr) return;
    if (st.metodo === "compra") {
      // dois atributos principais: 15 nos dois; um só: a distribuição clássica 15/14/13/12/10/8
      const plano = pr.duas ? [15, 15, 13, 10, 8, 8] : [15, 14, 13, 12, 10, 8];
      st.base = {};
      pr.ordem.forEach((k, i) => { st.base[k] = plano[i]; });
      // gasta o que sobrou no 4º
      while (gastos() < PONTOS()) { const k = pr.ordem[3]; if (st.base[k] >= 15) break; st.base[k]++; if (gastos() > PONTOS()) { st.base[k]--; break; } }
    } else {
      const idx = st.pool.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
      st.base = {};
      st.usoIdx = {};
      pr.ordem.forEach((k, j) => { st.base[k] = idx[j].v; st.usoIdx[k] = idx[j].i; });
    }
    render(true);
  };

  function render(manterScroll) {
    const corpo = $("daCorpo");
    const y = corpo.scrollTop;
    const { out: b, origem } = bonus();
    const pr = prioridade();
    const m = st.metodo;
    let h = `<div class="ev-seg3 da-metodos">
      <button type="button" class="${m === "compra" ? "on" : ""}" onclick="daMetodo('compra')">Compra de pontos</button>
      <button type="button" class="${m === "prontos" ? "on" : ""}" onclick="daMetodo('prontos')">Valores prontos</button>
      <button type="button" class="${m === "rolar" ? "on" : ""}" onclick="daMetodo('rolar')">Rolar dados</button>
    </div>`;
    const rmA = mesaR().atributos;
    if (rmA) h += `<p class="ev-mesa-aviso"><i class="ti ti-scroll"></i>Regra da mesa: ${rmA === "compra" ? `compra de pontos${PONTOS() !== 27 ? ` (${PONTOS()} pontos)` : ""}` : rmA === "prontos" ? "valores prontos" : mesaR().atributos3d6 ? "rolar dados (a mesa usa 3d6)" : "rolar 4d6 e tirar o menor"}.${rmA !== m ? " Os outros jeitos ficam aí se o mestre liberar." : ""}</p>`;
    if (m === "compra") {
      const resta = PONTOS() - gastos();
      h += `<div class="da-pontos ${resta === 0 ? "zerou" : ""}"><b>${resta}</b><span>de ${PONTOS()} pontos sobrando</span></div>
        <p class="ev-p quieto">Todo atributo começa em 8 e vai até 15. Do 13 pro 14 e do 14 pro 15 custa 2 pontos.</p>`;
    } else if (m === "prontos") {
      h += `<p class="ev-p quieto">Use cada número uma vez: <b>15, 14, 13, 12, 10 e 8</b>. Toque no número dentro do atributo.</p>`;
    } else {
      h += st.dados
        ? `<div class="da-rolagens">${st.dados.map((x) => `<div><b>${x.total}</b><small>${x.d.map((v, i) => (i === x.fora ? `<s>${v}</s>` : v)).join(" ")}</small></div>`).join("")}</div>
           <p class="ev-p quieto">4d6 tirando o menor, seis vezes. Toque no número dentro do atributo. <button type="button" class="da-link" onclick="daRolar()">Rolar de novo</button></p>`
        : `<p class="ev-p">Rola 4d6, tira o menor dado e soma os outros três. Seis vezes, um resultado pra cada atributo.</p>
           <button type="button" class="ev-btn-prim cheio da-rolar" onclick="daRolar()">🎲 Rolar os seis</button>`;
    }
    if (pr && (m !== "rolar" || st.dados)) h += `<button type="button" class="ev-mais da-sugerir" onclick="daSugerir()"><i class="ti ti-wand"></i> Distribuir pensando em ${esc(pr.nome)}</button>`;

    if (m !== "rolar" || st.dados) {
      h += `<div class="da-lista">${K.map((k) => {
        const base = st.base[k];
        const fin = base !== undefined ? Math.min(20, base + b[k]) : null;
        const destaque = pr && pr.ordem.slice(0, 2).includes(k);
        let ctl = "";
        if (m === "compra") {
          ctl = `<div class="da-ctl"><button type="button" onclick="daMais('${k}',-1)" ${base <= 8 ? "disabled" : ""}>−</button><b>${base}</b><button type="button" onclick="daMais('${k}',1)" ${base >= 15 ? "disabled" : ""}>+</button></div>`;
        } else {
          ctl = `<div class="da-chips">${st.pool.map((v, i) => {
            const meu = st.usoIdx && st.usoIdx[k] === i;
            const usado = !meu && st.usoIdx && Object.values(st.usoIdx).includes(i);
            return `<button type="button" class="${meu ? "on" : usado ? "usado" : ""}" onclick="daPor('${k}',${i})">${v}</button>`;
          }).join("")}</div>`;
        }
        return `<div class="da-attr ${destaque ? "destaque" : ""}">
          <div class="da-attr-topo">
            <i class="ti ti-${ICO[k]} da-ic"></i>
            <div class="da-nome"><b>${NOME[k]}</b><small>${DICA[k]}</small></div>
            <div class="da-final">${fin !== null ? `<b>${fin}</b><span>${sinal(mod(fin))}</span>` : `<b>—</b>`}</div>
          </div>
          ${ctl}
          ${origem[k].length ? `<div class="da-bonus">${origem[k].map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
        </div>`;
      }).join("")}</div>`;
      h += `<p class="ev-p quieto">${Object.values(b).some(Boolean) ? "Os bônus do antecedente e das melhorias de nível continuam e já estão somados no valor final." : "O bônus de +2 e +1 vem do antecedente: escolha ele na Evolução depois de distribuir."}</p>`;
    }
    corpo.innerHTML = h;
    const pronto = K.every((k) => st.base[k] !== undefined);
    $("daRodape").innerHTML = `<button type="button" class="ev-btn-prim cheio" onclick="daAplicar()" ${pronto ? "" : "disabled"}><i class="ti ti-check"></i> ${pronto ? "Aplicar na ficha" : `Falta${K.filter((k) => st.base[k] === undefined).length > 1 ? "m" : ""} ${K.filter((k) => st.base[k] === undefined).length}`}</button>`;
    if (manterScroll) corpo.scrollTop = y;
  }

  window.daAplicar = function () {
    const b = bonus().out;
    K.forEach((k) => {
      const el = $(ATR[k]);
      if (!el || st.base[k] === undefined) return;
      el.value = Math.min(20, st.base[k] + b[k]);
    });
    try { if (typeof atualizarTudo === "function") atualizarTudo(); } catch (e) {}
    try { if (typeof salvarTudo === "function") salvarTudo(); } catch (e) {}
    fechar();
    toast("Atributos aplicados!");
  };
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "ev-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("on"));
    setTimeout(() => { t.classList.remove("on"); setTimeout(() => t.remove(), 300); }, 2200);
  }

  // botão em cima da lista de atributos
  function montarBotao() {
    const tit = document.querySelector("#atributos .titulo-atributos");
    if (!tit || $("daBtn")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.id = "daBtn";
    b.className = "da-btn";
    b.innerHTML = `<i class="ti ti-dice-5"></i><span>Distribuir atributos</span><small>pontos, valores prontos ou dados</small>`;
    b.onclick = abrir;
    tit.after(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montarBotao);
  else montarBotao();
})();

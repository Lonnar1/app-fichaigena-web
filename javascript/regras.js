/* =====================================================================
   REGRAS.JS · Grimório › Compêndio ganha "Minhas criaturas | Regras".
   A aba Regras é uma consulta rápida (condições, combate, ambiente,
   venenos, doenças, armadilhas) com busca e calculadora de encontro.
   Dados em regras-dados.js (REGRAS_IGNEA).
   ===================================================================== */
(function () {
  if (window._rgPronto) return;
  window._rgPronto = true;

  const $ = (id) => document.getElementById(id);
  const norm = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const dados = () => (typeof REGRAS_IGNEA !== "undefined" ? REGRAS_IGNEA : []);
  const CATS = ["Condições", "Combate", "Exploração", "Perigos", "Ambiente", "Venenos", "Doenças e maldições", "Armadilhas", "Mestre"];
  const XP = [[50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500], [500, 750, 1100], [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100],
    [1300, 2000, 2600], [1600, 2300, 3100], [1900, 2900, 4100], [2200, 3700, 4700], [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800],
    [3800, 6100, 9800], [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000]];
  const fmt = (n) => n.toLocaleString("pt-BR");
  let cat = "";
  let lembrar = { nivel: 3, qtd: 4 };
  try { lembrar = { ...lembrar, ...JSON.parse(localStorage.getItem("rgCalc") || "{}") }; } catch (er) {}

  function calcHTML() {
    return `
      <div class="rg-calc">
        <label><span>Nível do grupo</span><select id="rgNivel" onchange="rgCalc()">${XP.map((_, i) => `<option value="${i + 1}" ${lembrar.nivel === i + 1 ? "selected" : ""}>${i + 1}</option>`).join("")}</select></label>
        <label><span>Personagens</span><input id="rgQtd" type="number" min="1" max="12" value="${lembrar.qtd}" oninput="rgCalc()"></label>
      </div>
      <div class="rg-orc" id="rgOrc"></div>`;
  }
  window.rgCalc = function () {
    const n = Math.min(20, Math.max(1, parseInt(($("rgNivel") || {}).value) || 1));
    const q = Math.min(12, Math.max(1, parseInt(($("rgQtd") || {}).value) || 1));
    lembrar = { nivel: n, qtd: q };
    try { localStorage.setItem("rgCalc", JSON.stringify(lembrar)); } catch (er) {}
    const o = $("rgOrc");
    if (o) o.innerHTML = ["Baixa", "Moderada", "Alta"].map((r, i) => `<div><small>${r}</small><b>${fmt(XP[n - 1][i] * q)} XP</b></div>`).join("");
  };

  function cartao(r, i) {
    const corpo = r.txt.map((p) => `<p>${p}</p>`).join("");
    const busca = norm([r.cat, r.nome, r.sub, r.txt.join(" ").replace(/<[^>]+>/g, "")].join(" "));
    return `
      <div class="rg-card${r.calc ? " aberto" : ""}" data-cat="${esc(r.cat)}" data-busca="${esc(busca)}" onclick="rgToque(event, this)">
        <div class="rg-topo"><strong>${esc(r.nome)}</strong>${r.sub ? `<em>${esc(r.sub)}</em>` : ""}<i class="rg-seta">▾</i></div>
        <div class="rg-corpo">${corpo}${r.calc ? calcHTML() : ""}</div>
      </div>`;
  }

  function montar(host) {
    const lista = dados();
    const cont = (c) => lista.filter((r) => r.cat === c).length;
    host.innerHTML = `
      <div class="rg-barra">
        <label class="rg-busca"><span>🔎</span><input type="search" id="rgBusca" placeholder="Buscar regra (ex: agarrado, queda, veneno)" autocomplete="off" oninput="rgFiltrar()"></label>
      </div>
      <div class="rg-cats" id="rgCats">
        <button type="button" data-c="" class="on" onclick="rgCat('')">Tudo</button>
        ${CATS.filter(cont).map((c) => `<button type="button" data-c="${esc(c)}" onclick="rgCat('${esc(c)}')">${esc(c)}</button>`).join("")}
      </div>
      <div class="rg-lista" id="rgLista">
        ${CATS.map((c) => {
          const itens = lista.filter((r) => r.cat === c);
          return itens.length ? `<h5 class="rg-grupo" data-cat="${esc(c)}">${esc(c)}</h5>${itens.map(cartao).join("")}` : "";
        }).join("")}
        <p class="rg-vazio" hidden>Nada encontrado com essa palavra.</p>
        <p class="rg-credito">Regras com material do SRD 5.2.1 (CC-BY-4.0), resumidas pela Ficha Ígnea. Licença completa em Sobre › Créditos.</p>
      </div>`;
    rgCalc();
  }

  window.rgCat = function (c) {
    cat = c;
    document.querySelectorAll("#rgCats button").forEach((b) => b.classList.toggle("on", b.dataset.c === c));
    rgFiltrar();
  };
  window.rgFiltrar = function () {
    const lista = $("rgLista");
    if (!lista) return;
    const palavras = norm(($("rgBusca") || {}).value).trim().split(/\s+/).filter(Boolean);
    let n = 0;
    lista.querySelectorAll(".rg-card").forEach((el) => {
      const ok = (!cat || el.dataset.cat === cat) && palavras.every((p) => el.dataset.busca.includes(p));
      el.hidden = !ok;
      if (ok) n++;
      // buscando, abre os cartões achados pra ler direto
      if (palavras.length && ok && n <= 3) el.classList.add("aberto");
    });
    lista.querySelectorAll(".rg-grupo").forEach((h) => {
      h.hidden = !!cat || ![...lista.querySelectorAll(`.rg-card[data-cat="${CSS.escape(h.dataset.cat)}"]`)].some((x) => !x.hidden);
    });
    lista.querySelector(".rg-vazio").hidden = n > 0;
  };
  window.rgToque = function (ev, card) {
    if (ev.target.closest("input, select, button, label")) return;
    card.classList.toggle("aberto");
  };

  /* ---------- seletor no topo do Compêndio ---------- */
  function trocar(qual) {
    const aba = $("abaMaster-compendio");
    if (!aba) return;
    const regras = qual === "regras";
    aba.classList.toggle("rg-modo-regras", regras);
    aba.querySelectorAll(".rg-seg button").forEach((b) => b.classList.toggle("on", b.dataset.q === qual));
    const host = $("rgHost");
    host.hidden = !regras;
    if (regras && !host.dataset.ok) { montar(host); host.dataset.ok = "1"; }
    const desc = aba.querySelector(".master-desc");
    if (desc) desc.textContent = regras ? "Consulta rápida pra usar no meio da sessão." : "Todos os monstros criados aparecem aqui.";
  }
  window.rgTrocar = trocar;

  function iniciar() {
    const aba = $("abaMaster-compendio");
    if (!aba || aba.querySelector(".rg-seg")) return;
    const desc = aba.querySelector(".master-desc") || aba.querySelector("h2");
    const seg = document.createElement("div");
    seg.className = "rg-seg ctg-seg";
    seg.innerHTML = `<button type="button" class="on" data-q="criaturas">Minhas criaturas</button><button type="button" data-q="regras">Regras</button>`;
    seg.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => trocar(b.dataset.q)));
    const host = document.createElement("div");
    host.id = "rgHost";
    host.className = "rg-host";
    host.hidden = true;
    desc.after(seg);
    aba.appendChild(host);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
  window.addEventListener("load", iniciar);
})();

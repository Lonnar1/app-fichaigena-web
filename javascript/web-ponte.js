/* Ponte do site: os módulos novos (catálogo, colar texto) foram feitos pros painéis
   que sobem de baixo no app. No site, os formulários são as caixas de sempre:
   no PC abrem na gaveta lateral, no celular rolam até a caixa na aba certa. */
(function () {
  const CAIXA = { arma: ["boxArmasForm", "combate"], armadura: ["boxArmadurasForm", "combate"], item: ["boxItensForm", "inventario"] };
  const ehPC = () => window.matchMedia && window.matchMedia("(min-width: 1100px)").matches;

  function abrir(tipo) {
    const c = CAIXA[tipo];
    if (!c) return;
    const box = document.getElementById(c[0]);
    if (!box) return;
    if (ehPC() && typeof window.wjAbrirGaveta === "function") { window.wjAbrirGaveta(c[0]); return; }
    const aba = box.closest(".aba");
    if (aba && !aba.classList.contains("active") && typeof trocarAba === "function") trocarAba(c[1]);
    if (!box.classList.contains("aberto")) {
      box.classList.add("aberto"); box.classList.remove("fechado");
      const h = box.previousElementSibling;
      if (h) h.classList.remove("fechado");
    }
    setTimeout(() => box.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  }
  function fechar() { if (typeof window.wjFecharGaveta === "function") window.wjFecharGaveta(); }

  if (typeof window.cb2AbrirSheet !== "function") window.cb2AbrirSheet = abrir;
  if (typeof window.cb2FecharSheet !== "function") window.cb2FecharSheet = fechar;
})();

/* Aba Combate: no PC, armas e armaduras ficam à esquerda e um painel de "Condição"
   (domínio, exaustão, teste de morte e resistências) à direita.
   No celular os dois blocos usam display: contents e nada muda. */
(function () {
  function montar() {
    const cb = document.getElementById("combate");
    if (!cb || cb.querySelector(".wj-cb-lado")) return;
    const secDe = (id) => { const b = document.getElementById(id); return b && b.closest(".secao-toggle"); };
    const lado = ["boxDominio", "boxExaustao", "boxMorte", "boxResistencias"].map(secDe).filter((s) => s && s.parentElement === cb);
    if (!lado.length) return;
    const main = document.createElement("div");
    main.className = "wj-cb-main";
    const painel = document.createElement("aside");
    painel.className = "wj-cb-lado";
    painel.innerHTML = '<div class="wj-cb-lado-cab">Condição</div>';
    [...cb.children].forEach((c) => {
      if (c.classList.contains("hp-box")) return;
      if (lado.includes(c)) painel.appendChild(c);
      else main.appendChild(c);
    });
    cb.appendChild(main);
    cb.appendChild(painel);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar);
  else montar();
})();
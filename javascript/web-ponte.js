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

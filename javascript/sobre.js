/* =====================================================================
   SOBRE.JS · "Sobre a Ficha Ígnea" no painel social (amigos)
   Apresentação do criador, com o que o app foi feito e créditos/licenças.
   Para mudar os textos, edite o objeto SOBRE abaixo.
   ===================================================================== */
(function () {
  if (window._sobrePronto) return;
  window._sobrePronto = true;

  const SOBRE = {
    nome: "Leonardo José dos Santos",
    email: "fichaignea@gmail.com", // pra onde vão os relatos de bug
    // chave do Web3Forms (web3forms.com): com ela o relato chega direto, sem abrir o email da pessoa.
    // Deixe "" pra usar só o email. A chave é pública por natureza, pode ficar aqui.
    chaveRelatos: "7aea3d1f-e082-4d46-b050-066fc944fcac",
    papel: "Criador da Ficha Ígnea",
    foto: "img/equipe/Leonardo.jpg",
    texto: [
      "Oi! Eu sou o Leonardo, e a Ficha Ígnea é o meu projeto.",
      "Criei o app pra deixar a ficha do jogador e a campanha do mestre mais fáceis de levar pra mesa: tudo num lugar só, sem papelada e sem precisar abrir livro no meio da sessão.",
      "Tem ideia, sugestão ou achou algum bug? Me chama, a Ficha Ígnea cresce junto com quem joga.",
    ],
    // quem testou, apoiou e trouxe ideias
    equipe: {
      texto: "Testaram, deram ideia e me apoiaram desde o começo. Sem eles a Ficha Ígnea não seria a mesma.",
      // "papel" aparece no cartão; "obrigado" aparece quando toca no cartão
      pessoas: [
        {
          nome: "Vinicius Edney", foto: "img/equipe/Vini.jpg", insta: "underbed_arts",
          papel: "Criador de Classe",
          obrigado: "A gente se conhece desde criança e sempre falou que um dia ia fazer algo grande junto. Ainda não é tão grande assim, mas vai ser. Ele e o Gi criaram o Essstilo e os Domínios, e ele sempre acreditou nisso aqui. Valeu, Vini.",
        },
        {
          nome: "Giovany Queiroz", foto: "img/equipe/Giovany.jpg", insta: "zoriieuq",
          papel: "Caçador de Bug",
          obrigado: "Se tem bug, o Gi acha. Já achou um monte e eu tenho certeza que ainda vai achar mais kkkk. Junto com o Vini, criou o Essstilo e os Domínios. Valeu, Gi!",
        },
        {
          nome: "Bruna Yukari", foto: "img/equipe/Yukari.jpg", insta: "yukarii_123",
          papel: "Tester Definitiva",
          obrigado: "Me apoiou desde quando isso aqui era só um começo de ideia, e ficou mais feliz que eu com cada coisinha que deu certo. Obrigado, Bruna, de verdade.",
        },
      ],
    },
    feitoCom: [
      ["ti-brand-html5", "HTML"],
      ["ti-brand-css3", "CSS"],
      ["ti-brand-javascript", "JavaScript"],
      ["ti-brand-firebase", "Firebase"],
      ["ti-icons", "Tabler Icons"],
      ["ti-typography", "Cinzel e EB Garamond"],
    ],
  };

  // Declaração exigida pelo SRD 5.2.1 — copiada sem alteração (não traduzir nem editar).
  const SRD_DECLARACAO =
    'This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at ' +
    '<a href="https://www.dndbeyond.com/srd" target="_blank" rel="noopener">https://www.dndbeyond.com/srd</a>. ' +
    "The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at " +
    '<a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noopener">https://creativecommons.org/licenses/by/4.0/legalcode</a>.';

  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const versao = () => (typeof VERSAO_FICHA !== "undefined" ? VERSAO_FICHA : "");
  const iniciais = (n) => n.split(/\s+/).filter(Boolean).map((p) => p[0]).filter((c) => c === c.toUpperCase()).slice(0, 2).join("");

  // foto redonda; se a imagem não carregar, volta pras iniciais
  const avatar = (foto, nome, cls) =>
    foto
      ? `<span class="${cls}"><img src="${esc(foto)}" alt="${esc(nome)}" draggable="false" onerror="this.replaceWith(document.createTextNode('${esc(iniciais(nome))}'))"></span>`
      : `<span class="${cls}">${esc(iniciais(nome))}</span>`;

  function montar() {
    if (document.getElementById("sobreApp")) return;
    const ov = document.createElement("div");
    ov.id = "sobreAppOverlay";
    ov.onclick = fecharSobreApp;
    const el = document.createElement("div");
    el.id = "sobreApp";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Sobre a Ficha Ígnea");
    el.innerHTML = `
      <button type="button" class="sb-fechar" onclick="fecharSobreApp()" aria-label="Fechar">✕</button>

      <div class="sb-topo">
        <img src="logo-ficha-ignea.png" alt="" draggable="false">
        <h3>Ficha Ígnea</h3>
        <p>Fichas e campanhas de RPG de fantasia<br>Compatível com a quinta edição</p>
        ${versao() ? `<span class="sb-versao">versão ${esc(versao())}</span>` : ""}
      </div>

      <div class="sb-sec">
        <div class="sb-rot"><i></i><span>Quem fez</span><i></i></div>
        <div class="sb-autor">
          ${avatar(SOBRE.foto, SOBRE.nome, "sb-av")}
          <div><b>${esc(SOBRE.nome)}</b><small>${esc(SOBRE.papel)}</small></div>
        </div>
        ${SOBRE.texto.map((p) => `<p class="sb-texto">${esc(p)}</p>`).join("")}
      </div>

      <div class="sb-sec">
        <div class="sb-rot"><i></i><span>Quem acendeu junto</span><i></i></div>
        <p class="sb-texto sb-eq-txt">${esc(SOBRE.equipe.texto)}</p>
        <div class="sb-equipe">${SOBRE.equipe.pessoas.map((x, i) => `
          <button type="button" class="sb-pessoa" onclick="abrirPessoaSobre(${i})">
            ${avatar(x.foto, x.nome, "sb-eq-foto")}
            <b>${esc(x.nome)}</b>
            <small>${esc(x.papel)}</small>
          </button>`).join("")}
        </div>
      </div>

      <div class="sb-sec">
        <div class="sb-rot"><i></i><span>Feito com</span><i></i></div>
        <div class="sb-chips">${SOBRE.feitoCom.map(([ic, n]) => `<span><i class="ti ${ic}"></i>${esc(n)}</span>`).join("")}</div>
      </div>

      <div class="sb-sec">
        <div class="sb-rot"><i></i><span>Créditos e licenças</span><i></i></div>
        <div class="sb-cred">
          <h4>Regras, magias, itens e criaturas</h4>
          <p>Nomes em português e descrições escritos pela Ficha Ígnea a partir do SRD 5.2.1. Declaração da licença:</p>
          <blockquote lang="en">${SRD_DECLARACAO}</blockquote>
        </div>
        <div class="sb-cred">
          <h4>Ícones</h4>
          <p>Tabler Icons, licença MIT.</p>
        </div>
        <div class="sb-cred">
          <h4>Fontes</h4>
          <p>Cinzel e EB Garamond, via Google Fonts, licença SIL Open Font License.</p>
        </div>
        <div class="sb-cred">
          <h4>Login e nuvem</h4>
          <p>Firebase, do Google.</p>
        </div>
      </div>

      <button type="button" class="sb-bug" onclick="abrirRelatarBug()"><i class="ti ti-bug"></i><span>Achou um bug? Me conta</span><i class="ti ti-chevron-right"></i></button>

      <p class="sb-legal"><a href="termos.html" target="_blank" rel="noopener">Termos de Uso</a> · <a href="privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a></p>
      <p class="sb-rodape">Ficha Ígnea © ${new Date().getFullYear()} ${esc(SOBRE.nome)}.<br>App independente, feito no Brasil.</p>`;
    document.body.append(ov, el);
  }

  /* cartão de agradecimento (ao tocar numa pessoa) */
  window.abrirPessoaSobre = function (i) {
    const x = SOBRE.equipe.pessoas[i];
    if (!x) return;
    let el = document.getElementById("sobrePessoa");
    if (!el) {
      el = document.createElement("div");
      el.id = "sobrePessoa";
      el.onclick = (e) => { if (e.target === el) fecharPessoaSobre(); };
      document.body.appendChild(el);
    }
    const handle = String(x.insta || "").replace(/^@/, "");
    el.innerHTML = `
      <div class="sp-card" role="dialog" aria-label="${esc(x.nome)}">
        <button type="button" class="sb-fechar" onclick="fecharPessoaSobre()" aria-label="Fechar">✕</button>
        ${avatar(x.foto, x.nome, "sp-foto")}
        <h4>${esc(x.nome)}</h4>
        <span class="sp-papel">${esc(x.papel)}</span>
        <p>${esc(x.obrigado)}</p>
        ${handle ? `<a class="sp-insta" href="https://instagram.com/${encodeURIComponent(handle)}" target="_blank" rel="noopener"><i class="ti ti-brand-instagram"></i>@${esc(handle)}</a>` : ""}
      </div>`;
    el.style.display = "flex";
    requestAnimationFrame(() => el.classList.add("aberto"));
  };
  window.fecharPessoaSobre = function () {
    const el = document.getElementById("sobrePessoa");
    if (!el) return;
    el.classList.remove("aberto");
    setTimeout(() => { el.style.display = "none"; }, 220);
  };

  window.abrirSobreApp = function () {
    montar();
    const ov = document.getElementById("sobreAppOverlay"), el = document.getElementById("sobreApp");
    ov.style.display = "block";
    el.style.display = "block";
    el.scrollTop = 0;
    requestAnimationFrame(() => { ov.classList.add("aberto"); el.classList.add("aberto"); });
  };
  window.fecharSobreApp = function () {
    const ov = document.getElementById("sobreAppOverlay"), el = document.getElementById("sobreApp");
    if (!el) return;
    ov.classList.remove("aberto");
    el.classList.remove("aberto");
    setTimeout(() => { ov.style.display = "none"; el.style.display = "none"; }, 260);
  };
  document.addEventListener("keydown", (e) => {
    const el = document.getElementById("sobreApp");
    if (e.key !== "Escape") return;
    const rb = document.getElementById("relatarBug");
    if (rb && rb.style.display === "flex") return fecharRelatarBug();
    const sp = document.getElementById("sobrePessoa");
    if (sp && sp.style.display === "flex") return fecharPessoaSobre();
    if (el && el.style.display === "block") fecharSobreApp();
  });

  /* ===================== RELATAR BUG (vai por email) ===================== */
  const LUGARES = ["Ficha", "Combate", "Poderes e magias", "Inventário", "Evolução", "Grimório", "Catálogo", "Amigos e grupos", "Outro"];
  let bug = { onde: "", txt: "", prints: [] };
  const MAX_PRINTS = 3;
  const noGrimorio = () => { const m = document.getElementById("masterIgnea"); return !!(m && m.style.display !== "none" && m.offsetParent !== null); };
  const abaFicha = () => window._wjAba || document.querySelector("#ficha .aba.active")?.id || "";

  // onde a pessoa estava quando abriu (pra já vir marcado)
  function lugarAtual() {
    if (noGrimorio()) return "Grimório";
    if (document.getElementById("evPainel")?.offsetParent) return "Evolução";
    return { personagem: "Ficha", atributos: "Ficha", combate: "Combate", poderes: "Poderes e magias", inventario: "Inventário" }[abaFicha()] || "";
  }
  function telaAtual() {
    if (noGrimorio()) return "Grimório";
    const aba = abaFicha();
    return aba ? `Ficha, aba ${aba}` : "Tela inicial";
  }
  function navegador() {
    const nav = navigator.userAgent;
    const qual = /Edg\//.test(nav) ? "Edge" : /OPR\//.test(nav) ? "Opera" : /SamsungBrowser/.test(nav) ? "Samsung Internet" : /Chrome\//.test(nav) ? "Chrome" : /Firefox\//.test(nav) ? "Firefox" : /Safari\//.test(nav) ? "Safari" : "outro";
    const so = /Android/.test(nav) ? "Android" : /iPhone|iPad/.test(nav) ? "iOS" : /Windows/.test(nav) ? "Windows" : /Mac OS/.test(nav) ? "Mac" : /Linux/.test(nav) ? "Linux" : "outro";
    const inst = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches ? " (app instalado)" : "";
    return `${qual} no ${so}${inst}`;
  }
  function textoBug() {
    const larg = window.innerWidth, alt = window.innerHeight;
    return [
      "O que aconteceu:",
      bug.txt.trim() || "(não escreveu)",
      "",
      `Onde: ${bug.onde || "não marcou"}`,
      "",
      ...(bug.prints.some((x) => x.url) ? ["Prints:", ...bug.prints.filter((x) => x.url).map((x, i) => `${i + 1}. ${x.url}`), ""] : []),
      "--- preenchido sozinho ---",
      `Versão: ${versao() || "?"}`,
      `Aparelho: ${larg < 1100 ? "celular/tablet" : "computador"} (${larg}x${alt})`,
      `Navegador: ${navegador()}`,
      `Tela aberta: ${telaAtual()}`,
      `Quando: ${new Date().toLocaleString("pt-BR")}`,
    ].join("\n");
  }

  window.abrirRelatarBug = function () {
    bug = { onde: lugarAtual(), txt: bug.txt || "", prints: bug.prints || [] };
    let el = document.getElementById("relatarBug");
    if (!el) {
      el = document.createElement("div");
      el.id = "relatarBug";
      el.onclick = (e) => { if (e.target === el) fecharRelatarBug(); };
      document.body.appendChild(el);
    }
    renderBug(false);
    el.style.display = "flex";
    requestAnimationFrame(() => el.classList.add("aberto"));
  };
  window.fecharRelatarBug = function () {
    const el = document.getElementById("relatarBug");
    if (!el) return;
    el.classList.remove("aberto");
    setTimeout(() => { el.style.display = "none"; }, 220);
  };
  // estado: "form" | "ok" (chegou direto) | "falhou" (não deu pra enviar daqui) | "email" (abriu o email)
  function renderBug(estado) {
    const el = document.getElementById("relatarBug");
    if (!el) return;
    if (estado && estado !== "form") {
      const printFalhou = bug.prints.some((x) => x.estado === "erro");
      const ok = estado === "ok";
      el.innerHTML = `
        <div class="rb-card" role="dialog" aria-label="Relatar bug">
          <button type="button" class="sb-fechar" onclick="fecharRelatarBug()" aria-label="Fechar">✕</button>
          <div class="rb-ic ${ok ? "ok" : ""}"><i class="ti ${ok ? "ti-check" : estado === "email" ? "ti-mail-forward" : "ti-wifi-off"}"></i></div>
          <h4>${ok ? "Recebido, valeu!" : estado === "email" ? "Valeu!" : "Não consegui enviar daqui"}</h4>
          <p class="rb-sub">${ok ? "Seu relato chegou. Vou dar uma olhada assim que puder." : estado === "email" ? "Abriu o seu email com tudo preenchido? É só enviar." : "Pode ser a internet. Dá pra tentar de novo ou mandar pelo seu email."}</p>
          ${printFalhou ? '<p class="rb-sub rb-aviso">Algum print não conseguiu subir. Se der, manda ele por email.</p>' : ""}
          ${estado === "falhou" ? `
            <button type="button" class="rb-ok" onclick="enviarRelatoBug()"><i class="ti ti-refresh"></i>Tentar de novo</button>
            <button type="button" class="rb-sec rb-larga" onclick="abrirEmailBug()"><i class="ti ti-mail"></i>Mandar pelo meu email</button>` : ""}
          ${estado !== "ok" ? `
          <div class="rb-plano-b">
            <small>Nada funcionou? Copia o texto e manda pra <b>${esc(SOBRE.email)}</b></small>
            <button type="button" class="rb-sec" onclick="copiarRelatoBug(this)"><i class="ti ti-copy"></i>Copiar texto</button>
          </div>` : ""}
          ${estado !== "falhou" ? '<button type="button" class="rb-ok" onclick="fecharRelatarBug()">Fechar</button>' : ""}
        </div>`;
      if (estado !== "falhou") { bug.txt = ""; bug.prints = []; }
      return;
    }
    el.innerHTML = `
      <div class="rb-card" role="dialog" aria-label="Relatar bug">
        <button type="button" class="sb-fechar" onclick="fecharRelatarBug()" aria-label="Fechar">✕</button>
        <div class="rb-ic"><i class="ti ti-bug"></i></div>
        <h4>Achou um bug?</h4>
        <p class="rb-sub">Me conta o que rolou. A versão do app e o aparelho vão junto sozinhos.</p>
        <label class="rb-rot" for="rbTxt">O que aconteceu</label>
        <textarea id="rbTxt" placeholder="Ex: cliquei em descanso longo e a vida não voltou pro máximo…" oninput="bugTxt(this.value)">${esc(bug.txt)}</textarea>
        <span class="rb-rot">Onde foi</span>
        <div class="rb-lugares">${LUGARES.map((l) => `<button type="button" class="${bug.onde === l ? "on" : ""}" onclick="bugOnde('${l}')">${esc(l)}</button>`).join("")}</div>
        <span class="rb-rot">Prints <small>(opcional, até ${MAX_PRINTS})</small></span>
        <div class="rb-prints" id="rbPrints">${printsHTML()}</div>
        <input type="file" id="rbArquivo" accept="image/*" multiple hidden onchange="bugAddPrints(this)">
        <label class="rb-robo" aria-hidden="true">Não marque<input type="checkbox" id="rbRobo" tabindex="-1" autocomplete="off"></label>
        <button type="button" class="rb-ok" id="rbEnviar" onclick="enviarRelatoBug()">${txtBotaoEnviar()}</button>
        <small class="rb-pe">${chaveEnvio() ? "Chega direto pra mim, você não precisa sair do app." : `Vai pra ${esc(SOBRE.email)}`}</small>
      </div>`;
  }
  window.bugTxt = (v) => { bug.txt = v; };

  /* prints: sobem na hora em que são escolhidos, e o link vai no email */
  function printsHTML() {
    const itens = bug.prints.map((x, i) => `
      <div class="rb-print ${x.estado}">
        <img src="${x.prev}" alt="">
        ${x.estado === "subindo" ? '<span class="rb-print-st">subindo…</span>' : x.estado === "erro" ? '<span class="rb-print-st">não subiu</span>' : ""}
        <button type="button" class="rb-print-x" onclick="bugTirarPrint(${i})" aria-label="Tirar">✕</button>
      </div>`).join("");
    const add = bug.prints.length < MAX_PRINTS
      ? `<button type="button" class="rb-print-add" onclick="document.getElementById('rbArquivo').click()"><i class="ti ti-photo-plus"></i><span>Adicionar</span></button>`
      : "";
    return itens + add;
  }
  function atualizarPrints() {
    const box = document.getElementById("rbPrints");
    if (box) box.innerHTML = printsHTML();
    const b = document.getElementById("rbEnviar");
    if (b) {
      const subindo = bug.prints.some((x) => x.estado === "subindo");
      b.disabled = subindo;
      b.innerHTML = subindo ? '<i class="ti ti-loader-2"></i>Subindo os prints…' : txtBotaoEnviar();
    }
  }
  window.bugAddPrints = async function (input) {
    const arquivos = [...(input.files || [])].slice(0, MAX_PRINTS - bug.prints.length);
    input.value = "";
    if (!arquivos.length) return;
    if (typeof comprimirImagem !== "function" || typeof uploadImagemFirebase !== "function") return;
    for (const f of arquivos) {
      const item = { prev: "", url: "", estado: "subindo" };
      bug.prints.push(item);
      try {
        const b64 = await comprimirImagem(f, 1400, 0.8);
        item.prev = b64;
        atualizarPrints();
        const r = await uploadImagemFirebase(b64, `bugs/${Date.now()}.jpg`);
        if (r && r.url) { item.url = r.url; item.estado = "ok"; }
        else item.estado = "erro";
      } catch (e) {
        item.estado = "erro";
      }
      atualizarPrints();
    }
  };
  window.bugTirarPrint = (i) => { bug.prints.splice(i, 1); atualizarPrints(); };
  window.bugOnde = (l) => {
    bug.onde = bug.onde === l ? "" : l;
    document.querySelectorAll("#relatarBug .rb-lugares button").forEach((b) => b.classList.toggle("on", b.textContent === bug.onde));
  };
  /* envio direto (Web3Forms): o relato chega no email sem a pessoa sair do app.
     Sem chave, ou se der erro, cai no plano B de abrir o email dela. */
  const chaveEnvio = () => String(SOBRE.chaveRelatos || "").trim();
  const txtBotaoEnviar = () => (chaveEnvio() ? '<i class="ti ti-send"></i>Enviar' : '<i class="ti ti-send"></i>Enviar por email');
  let ultimoTexto = "", ultimoAssunto = "";
  function prepararRelato() {
    ultimoTexto = textoBug();
    const resumo = bug.txt.trim().replace(/\s+/g, " ");
    ultimoAssunto = `Bug${bug.onde ? ` (${bug.onde})` : ""}: ${resumo.length > 50 ? resumo.slice(0, 50) + "…" : resumo}`;
  }
  window.abrirEmailBug = function () {
    window._ultimoMailtoBug = `mailto:${SOBRE.email}?subject=${encodeURIComponent(ultimoAssunto)}&body=${encodeURIComponent(ultimoTexto)}`;
    window.location.href = window._ultimoMailtoBug;
    renderBug("email");
  };
  let enviando = false;
  window.enviarRelatoBug = async function () {
    if (enviando || bug.prints.some((x) => x.estado === "subindo")) return;
    const robo = document.getElementById("rbRobo");
    if (robo && robo.checked) { renderBug("ok"); return; } // robô de spam: finge que foi
    if (!bug.txt.trim() && !ultimoTexto) {
      const t = document.getElementById("rbTxt");
      if (t) { t.classList.add("rb-falta"); t.focus(); setTimeout(() => t.classList.remove("rb-falta"), 900); }
      return;
    }
    if (bug.txt.trim()) prepararRelato();
    if (!chaveEnvio()) return abrirEmailBug();
    enviando = true;
    const b = document.getElementById("rbEnviar") || document.querySelector("#relatarBug .rb-ok");
    if (b) { b.disabled = true; b.innerHTML = '<i class="ti ti-loader-2"></i>Enviando…'; }
    let deu = false;
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 15000);
      const r = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: chaveEnvio(), subject: ultimoAssunto, from_name: "Ficha Ígnea · Relatar bug", message: ultimoTexto }),
        signal: ctl.signal,
      });
      clearTimeout(t);
      const d = await r.json().catch(() => ({}));
      deu = !!(r.ok && d.success !== false);
    } catch (e) {
      deu = false;
    }
    enviando = false;
    renderBug(deu ? "ok" : "falhou");
    if (deu) ultimoTexto = "";
  };
  window.copiarRelatoBug = function (btn) {
    const t = `Para: ${SOBRE.email}\n\n${ultimoTexto}`;
    const ok = () => { btn.innerHTML = '<i class="ti ti-check"></i>Copiado'; };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, () => copiarVelho(t, ok));
    else copiarVelho(t, ok);
  };
  function copiarVelho(t, ok) {
    const a = document.createElement("textarea");
    a.value = t; a.style.position = "fixed"; a.style.opacity = "0";
    document.body.appendChild(a); a.select();
    try { document.execCommand("copy"); ok(); } catch (e) {}
    a.remove();
  }

  /* botões no rodapé do painel social */
  function ligarBotao() {
    const painel = document.getElementById("painelAmigos");
    if (!painel || painel.querySelector(".am-sobre")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "am-sobre";
    b.innerHTML = `<i class="ti ti-info-circle"></i><span>Sobre a Ficha Ígnea</span><i class="ti ti-chevron-right"></i>`;
    b.onclick = abrirSobreApp;
    const bb = document.createElement("button");
    bb.type = "button";
    bb.className = "am-sobre am-bug";
    bb.innerHTML = `<i class="ti ti-bug"></i><span>Relatar bug</span><i class="ti ti-chevron-right"></i>`;
    bb.onclick = abrirRelatarBug;
    painel.append(b, bb);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ligarBotao);
  else ligarBotao();
  window.addEventListener("load", ligarBotao);
})();

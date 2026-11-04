function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

function habilitarArrastarReordenar(ulEl, arrayRef, aoSoltarCallback) {
  if (!ulEl) return;

  Array.from(ulEl.children).forEach((li) => {
    const handle = li.querySelector(".drag-handle");
    if (!handle || li.dataset.index === undefined) return;

    handle.onpointerdown = (ev) => {
      ev.preventDefault();

      const liArrastado = li;
      const rectOriginal = liArrastado.getBoundingClientRect();
      const startY = ev.clientY;
      const pointerId = ev.pointerId;

      // cria um clone flutuante que segue o cursor/dedo de verdade
      // o clone vai dentro de uma "lista" igual à original pra manter o mesmo visual
      const clone = liArrastado.cloneNode(true);
      clone.classList.add("card-fantasma");
      clone.style.margin = "0";
      const listaClone = document.createElement(ulEl.tagName);
      listaClone.className = ulEl.className;
      if (ulEl.id) listaClone.id = ulEl.id; // mesmo id = mesmo CSS (o original vem antes no documento)
      listaClone.style.cssText = "list-style:none;margin:0;padding:0;display:block;";
      listaClone.appendChild(clone);

      const fantasma = document.createElement("div");
      fantasma.className = "fantasma-arraste" + (ulEl.closest("#poderes") ? " fantasma-poderes" : "");
      fantasma.style.position = "fixed";
      fantasma.style.left = rectOriginal.left + "px";
      fantasma.style.top = rectOriginal.top + "px";
      fantasma.style.width = rectOriginal.width + "px";
      fantasma.style.pointerEvents = "none";
      fantasma.style.zIndex = "9999";
      fantasma.appendChild(listaClone);
      document.body.appendChild(fantasma);

      liArrastado.classList.add("arrastando");

      function aoMover(e) {
        if (e.pointerId !== pointerId) return;

        const deltaY = e.clientY - startY;
        fantasma.style.top = rectOriginal.top + deltaY + "px";

        const fantasmaRect = fantasma.getBoundingClientRect();
        const centroFantasma = fantasmaRect.top + fantasmaRect.height / 2;

        const irmaos = Array.from(ulEl.children).filter(
          (el) => el !== liArrastado,
        );

        let alvo = null;
        for (const sib of irmaos) {
          const box = sib.getBoundingClientRect();
          if (centroFantasma < box.top + box.height / 2) {
            alvo = sib;
            break;
          }
        }

        if (alvo) {
          ulEl.insertBefore(liArrastado, alvo);
        } else {
          ulEl.appendChild(liArrastado);
        }
      }

      function finalizar(e) {
        if (e && e.pointerId !== undefined && e.pointerId !== pointerId) return;

        document.removeEventListener("pointermove", aoMover);
        document.removeEventListener("pointerup", finalizar);
        document.removeEventListener("pointercancel", finalizar);

        fantasma.remove();
        liArrastado.classList.remove("arrastando");

        const ordemVisual = Array.from(ulEl.children).map((el) =>
          Number(el.dataset.index),
        );

        const objetosNaNovaOrdem = ordemVisual.map((i) => arrayRef[i]);
        const slots = [...ordemVisual].sort((a, b) => a - b);

        slots.forEach((slot, k) => {
          arrayRef[slot] = objetosNaNovaOrdem[k];
        });

        salvarTudo();
        if (aoSoltarCallback) aoSoltarCallback();
      }

      document.addEventListener("pointermove", aoMover);
      document.addEventListener("pointerup", finalizar);
      document.addEventListener("pointercancel", finalizar);
    };
  });
}

function limparTags(str) {
  if (!str) return str;
  return String(str).replace(/<[^>]*>/g, "");
}

function sanitizarPersonagem(p) {
  if (!p) return p;
  const textos = ["nome","classe","raca","idade","altura","antecedentes","idiomas","resistencias","diario","proficienciasExtras","nomeRacaCustom"];
  textos.forEach(c => { if (p[c]) p[c] = limparTags(p[c]) || ""; });
  if (Array.isArray(p.inventario)) p.inventario.forEach(i => { i.nome = limparTags(i.nome) || ""; i.desc = limparTags(i.desc) || ""; });
  if (Array.isArray(p.armaduras))  p.armaduras.forEach(a  => { a.nome = limparTags(a.nome) || "";  a.desc = limparTags(a.desc) || ""; a.ca = limparTags(a.ca) || ""; });
  if (Array.isArray(p.armas))      p.armas.forEach(a      => { a.nome = limparTags(a.nome) || "";  a.desc = limparTags(a.desc) || ""; a.dano = limparTags(a.dano) || ""; });
  if (Array.isArray(p.poderes))    p.poderes.forEach(p2   => { p2.nome = limparTags(p2.nome) || ""; p2.desc = limparTags(p2.desc) || ""; p2.dano = limparTags(p2.dano) || ""; });
  if (Array.isArray(p.mapas))      p.mapas.forEach(m      => { m.nome = limparTags(m.nome) || "";  m.desc = limparTags(m.desc) || ""; });
  if (p.aliados && Array.isArray(p.aliados)) p.aliados.forEach(a => { a.nome = limparTags(a.nome) || ""; a.desc = limparTags(a.desc) || ""; a.local = limparTags(a.local) || ""; });
  return p;
}

function sanitizarCampanha(c) {
  if (!c) return c;
  ["nome","sistema","descricao"].forEach(k => { if (c[k]) c[k] = limparTags(c[k]); });
  if (Array.isArray(c.sessoes))   c.sessoes.forEach(s   => { s.nome = limparTags(s.nome); s.descricao = limparTags(s.descricao); });
  if (Array.isArray(c.eventos))   c.eventos.forEach(e   => { e.nome = limparTags(e.nome); e.descricao = limparTags(e.descricao); });
  if (Array.isArray(c.npcsMundo)) c.npcsMundo.forEach(n => { n.nome = limparTags(n.nome); n.classe = limparTags(n.classe); n.regiao = limparTags(n.regiao); });
  if (Array.isArray(c.encontrosPlanejados)) c.encontrosPlanejados.forEach(e => { e.nome = limparTags(e.nome); e.regiao = limparTags(e.regiao); e.objetivo = limparTags(e.objetivo); });
  return c;
}

// ===== SISTEMA DE PLANOS =====
const EMAILS_VIP = [
  "fichaignea@gmail.com",
  "lonnar321@gmail.com",
  "niviciusedney@gmail.com",
  "nic.tresca@gmail.com",
  "giovannyqueiroz@gmail.com", 
  "luucasrenato@outlook.com", 
  "dinizpqp123@gmail.com", 
  "sparda.nb@gmail.com",
  "araibruna@gmail.com",
  "pedropian001@gmail.com",
  "vitorlunardi92@gmail.com",
  "xiuuososubliminals@gmail.com",
  "nicolastresca@gmail.com",
  "aelmoviee3@gmail.com"
];

function getPlanoUsuario() {
  const email = window.usuarioAtual?.email?.toLowerCase();
  if (!email) return "free";
  if (EMAILS_VIP.includes(email)) return "completo";
  return "free"; // futuramente lerá do Firestore
}

function podeCriarFicha() {
  const plano = getPlanoUsuario();
  if (plano === "completo" || plano === "player") return true;
  return personagens.length < 1;
}

function podeCriarCampanha() {
  const plano = getPlanoUsuario();
  if (plano === "completo" || plano === "master") return true;
  return campanhasMaster.length < 1;
}

function abrirPopupBloqueio(tipo) {
  const titulo = tipo === "ficha" ? "Ficha Bloqueada" : "Campanha Bloqueada";
  const planoNecessario = tipo === "ficha"
    ? "<strong>Player</strong> ou <strong>Completo</strong>"
    : "<strong>Master</strong> ou <strong>Completo</strong>";
  const isMaster = tipo === "campanha";

  abrirPopup(titulo, "", false, null);

  setTimeout(() => {
    const tituloEl = document.getElementById("popup-titulo");
    if (tituloEl) {
      tituloEl.style.textAlign = "center";
      tituloEl.style.width = "100%";
    }

    const el = document.getElementById("popup-texto");
    if (el) el.innerHTML = `
      <div style="text-align:center;padding:4px 0;">
        <div style="
          background:${isMaster ? 'linear-gradient(180deg,rgba(123,30,40,0.18),rgba(80,15,20,0.25))' : 'linear-gradient(180deg,rgba(60,40,20,0.35),rgba(40,25,10,0.45))'};
          border:1px solid ${isMaster ? 'rgba(180,55,42,0.3)' : 'rgba(196,169,91,0.2)'};
          border-radius:12px;
          padding:16px 14px;
          margin-bottom:16px;
        ">
          <p style="font-size:15px;margin-bottom:10px;color:#f0dfcb;">
            ${tipo === "ficha" ? "Esta ficha está bloqueada" : "Esta campanha está bloqueada"} no plano gratuito.
          </p>
          <p style="font-size:13px;color:${isMaster ? '#c9736e' : '#c8b99a'};line-height:1.5;">
            Assine o plano ${planoNecessario} para ter acesso ilimitado.
          </p>
        </div>
        <button class="popup-salvar-btn" style="${isMaster ? 'background:linear-gradient(180deg,#9e2f24,#4a0d0b);' : ''}" onclick="fecharPopup(); abrirTelaPlanos();">Ver planos</button>
      </div>
    `;
  }, 10);
}

let morte = {
  sucessos: [false, false, false],
  falhas: [false, false, false],
};

let iniciativaOrdem = [];
let iniciativaTurnoAtual = 0;
let _etapasForm = [];
let _filtroCompendio = "todos";
let racasCustomSalvas =
  JSON.parse(localStorage.getItem("racasCustomSalvas")) || [];
let editandoRacaCustom = -1;
let bonusRacaCustom = {
  forca: 0,
  destreza: 0,
  constituicao: 0,
  inteligencia: 0,
  sabedoria: 0,
  carisma: 0,
};

let campanhaImagemBase64 = "";
let campanhasMaster =
  JSON.parse(localStorage.getItem("campanhasMaster")) || [];

let campanhaAtualMaster =
  JSON.parse(localStorage.getItem("campanhaAtualMaster")) ?? null;
  
function salvarCampanhasMaster() {
  localStorage.setItem("campanhaAtualMaster", JSON.stringify(campanhaAtualMaster));

  // Remove base64 antes de salvar (agora as imagens sao links do ImgBB)
  const campanhasSemBase64 = campanhasMaster.map(c => ({
    ...c,
    imagem: c.imagem?.startsWith("data:") ? "" : (c.imagem || ""),
    bosses: (c.bosses || []).map(b => ({ ...b, imagem: b.imagem?.startsWith("data:") ? "" : (b.imagem || "") })),
    itensMaster: (c.itensMaster || []).map(i => ({ ...i, imagem: i.imagem?.startsWith("data:") ? "" : (i.imagem || "") })),
    npcs: (c.npcs || []).map(n => ({ ...n, imagem: n.imagem?.startsWith("data:") ? "" : (n.imagem || "") })),
    monstrosMestre: (c.monstrosMestre || []).map(m => ({ ...m, imagem: m.imagem?.startsWith("data:") ? "" : (m.imagem || "") })),
  }));

  // Salva no Firestore com os links do ImgBB
  if (window.usuarioAtual && window.db && window.setDoc) {
    const uid = window.usuarioAtual.uid;
    window.setDoc(
      window.doc(window.db, "mestres", uid),
      { campanhas: campanhasSemBase64, campanhaAtual: campanhaAtualMaster },
      { merge: true }
    ).catch(e => console.error("Erro ao salvar campanhas:", e));
  }

  // localStorage
  try {
    localStorage.setItem("campanhasMaster", JSON.stringify(campanhasSemBase64));
  } catch(e) {
    console.warn("localStorage cheio:", e);
  }
}

async function carregarCampanhasMasterFirebase() {
  if (!window.usuarioAtual || !window.db) return;
  try {
    const uid = window.usuarioAtual.uid;
    const snap = await window.getDoc(window.doc(window.db, "mestres", uid));
    if (snap.exists()) {
      const data = snap.data();
      if (data.campanhas) {
        campanhasMaster = data.campanhas;
        campanhaAtualMaster = data.campanhaAtual ?? null;
        renderCampanhasMaster();
      }
    }
  } catch(e) {
    console.error("Erro ao carregar campanhas:", e);
  }
}

let gastosCirculos = {
  0: [],
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
  8: [],
  9: [],
};

for (let i = 0; i <= 9; i++) {
  renderSlotsCirculo(i);
}
let nomeRacaCustom = "";
let dominio = [false, false, false, false, false, false];
let editandoItem = -1;
let editandoArma = -1;
let editandoPoder = -1;
let editandoAliado = -1;
let vidaAtual = 50;
let vidaTemp = 0;
let inventario = [];
let armas = [];
let poderes = [];
let profs = {};
let saves = {};
let imagemBase64 = "";
let imagemOriginalBase64 = "";
let imagemDeleteUrl = "";
let mapas = [];
let mapaAtual = null;
let mapaZoom = 1;
let mapaOffsetX = 0;
let mapaOffsetY = 0;
let mapaFerramentaAtiva = "pincel";
let mapaCorAtiva = "#ef4444";
let mapaPintando = false;
let mapaUltimoX = 0;
let mapaUltimoY = 0;
let mapaAnotacoes = [];
let mapaHistorico = [];
let mapaImagemObj = null;
let mapaTextoX = 0;
let mapaTextoY = 0;
let mapaPanUltimoX = 0;
let mapaPanUltimoY = 0;
let mapaBase64Temp = "";
let itemImagemBase64Temp = "";
let editItemImagemBase64Temp = "";
let armaImagemBase64Temp = "";
let editArmaImagemBase64Temp = "";
let armaduraImagemBase64Temp = "";
let editArmaduraImagemBase64Temp = "";
let aliadoImagemBase64Temp = "";
let exaustao = 0;
let armaduras = [];
let editandoArmadura = -1;
let personagens = JSON.parse(localStorage.getItem("personagens")) || [];
window.personagens = personagens;
let personagemAtual = null;
let modoExportacao = false;
let imagemPosX = 50;
let imagemPosY = 50;
let imagensPersonagem = [];
let indiceCarrossel = 0;
let _ultimoSwipeCarrossel = 0;

/* ================= DADOS FIXOS ================= */

const pericias = [
  { nome: "Acrobacia", attr: "destreza" },
  { nome: "Arcanismo", attr: "inteligencia" },
  { nome: "Atletismo", attr: "forca" },
  { nome: "Atuação", attr: "carisma" },
  { nome: "Enganação", attr: "carisma" },
  { nome: "Furtividade", attr: "destreza" },
  { nome: "História", attr: "inteligencia" },
  { nome: "Intimidação", attr: "carisma" },
  { nome: "Intuição", attr: "sabedoria" },
  { nome: "Investigação", attr: "inteligencia" },
  { nome: "Lidar com Animais", attr: "sabedoria" },
  { nome: "Medicina", attr: "sabedoria" },
  { nome: "Natureza", attr: "inteligencia" },
  { nome: "Percepção", attr: "sabedoria" },
  { nome: "Persuasão", attr: "carisma" },
  { nome: "Prestidigitação", attr: "destreza" },
  { nome: "Religião", attr: "inteligencia" },
  { nome: "Sobrevivência", attr: "sabedoria" },
];


const efeitosExaustao = [
  "Sem exaustão",
  "Desvantagem em testes de atributo",
  "Deslocamento reduzido pela metade ",
  "Desvantagem em jogadas de ataque e salvaguardas",
  "Pontos de vida maximos reduzidos pela metade",
  "Deslocamento reduzido a 0",
  "Morte",
];

/* ================= FUNÇÕES BASE ================= */

function ativarModoExportacao() {
  if (!personagens || personagens.length === 0) {
    alertBonito("Você ainda não tem fichas para exportar.");
    return;
  }

  modoExportacao = true;
  mostrarAvisoExportacao();
}

function mostrarAvisoExportacao() {
  const aviso = document.createElement("div");
  aviso.innerText = "Clique na ficha para baixá-la";

  aviso.style.position = "fixed";
  aviso.style.bottom = "90px";
  aviso.style.left = "50%";
  aviso.style.transform = "translateX(-50%)";
  aviso.style.background = "#2c221d";
  aviso.style.color = "#f8f1df";
  aviso.style.padding = "10px 16px";
  aviso.style.borderRadius = "10px";
  aviso.style.zIndex = "9999";
  aviso.style.fontSize = "14px";
  aviso.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";

  document.body.appendChild(aviso);

  setTimeout(() => {
    aviso.remove();
  }, 2000);
}

function previewImagemCampanha() {
  const input = document.getElementById("campanhaImagemInput");
  const preview = document.getElementById("previewCampanha");

  if (!input?.files?.[0]) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    campanhaImagemBase64 = e.target.result;

    preview.src = campanhaImagemBase64;
    preview.style.display = "block";
  };

  reader.readAsDataURL(input.files[0]);
}

function abrirTelaCampanhasMaster() {
  document.getElementById("tela-modo").style.display = "none";
  document.getElementById("masterIgnea").style.display = "none";

  const tela = document.getElementById("telaCampanhasMaster");
  if (tela) tela.style.display = "block";

  renderCampanhasMaster();
}

function renderCampanhasMaster() {
  const lista = document.getElementById("listaCampanhasMaster");
  if (!lista) return;

  lista.innerHTML = "";

  campanhasMaster.forEach((campanha, index) => {
    const card = document.createElement("div");
    card.className = "campanha-card";

    card.innerHTML = `
  <div
    class="campanha-card-bg"
    onclick="entrarCampanhaMaster(${index})"
    style="${
      campanha.imagem
        ? `background-image: linear-gradient(rgba(8,5,5,0.45), rgba(8,5,5,0.88)), url('${campanha.imagem.replace(/'/g,"").replace(/"/g,"")}')`
        : ""
    }"
  >
    <div class="campanha-card-conteudo">
      <h3>${esc(campanha.nome)}</h3>

      <span>${esc(campanha.sistema) || "Sistema não definido"}</span>

      <p>${esc(campanha.descricao) || "Sem descrição ainda."}</p>
    </div>
  </div>

  <button
    class="monstro-delete campanha-delete"
    style="right:44px !important;"
    onclick="event.stopPropagation(); window.abrirEditarCampanha(${index})"
  >
    ✎
  </button>

  <button
    class="monstro-delete campanha-delete"
    onclick="event.stopPropagation(); deletarCampanhaMaster(${index})"
  >
    ×
  </button>
`;

    lista.appendChild(card);
  });

  if (typeof window.carregarGruposParaCampanha === "function") {
    window.carregarGruposParaCampanha();
  }
}

function criarCampanhaMaster() {
  if (!podeCriarCampanha()) {
    abrirPopupBloqueio("campanha");
    return;
  }
  const nome = document.getElementById("novaCampanhaNome").value.trim();
  const sistema = document.getElementById("novaCampanhaSistema").value.trim();
  const descricao = document.getElementById("novaCampanhaDescricao").value.trim();

  if (!nome) {
    alertBonito("Digite o nome da campanha.");
    return;
  }

  const grupoVinculado = document.getElementById("novaCampanhaGrupo")?.value || "";

  const novaCampanha = {
  id: Date.now(),
  nome,
  sistema,
  descricao,
  imagem: campanhaImagemBase64 || "",
  lore: "",
  jogadores: [],
  sessoes: [],
  quests: [],
  npcs: [],
  combates: [],
  grupoVinculado
};

  campanhasMaster.push(novaCampanha);
  salvarCampanhasMaster();

  document.getElementById("novaCampanhaNome").value = "";
  document.getElementById("novaCampanhaSistema").value = "";
  document.getElementById("novaCampanhaDescricao").value = "";

  campanhaImagemBase64 = "";
  const inputImagemCampanha = document.getElementById("campanhaImagemInput");
  const previewCampanha = document.getElementById("previewCampanha");
  if (inputImagemCampanha) inputImagemCampanha.value = "";
  if (previewCampanha) {
    previewCampanha.src = "";
    previewCampanha.style.display = "none";
  }

  renderCampanhasMaster();
}

function entrarCampanhaMaster(index) {
  const plano = getPlanoUsuario();
  const limiteAtingido = (plano === "free") && (index >= 1);
  if (limiteAtingido) {
    abrirTelaPlanos();
    return;
  }
  campanhaAtualMaster = index;
  sanitizarCampanha(campanhasMaster[index]);
  salvarCampanhasMaster();

  document.getElementById("telaCampanhasMaster").style.display = "none";
  document.getElementById("masterIgnea").style.display = "block";
  document.querySelector(".header-rpg")?.style.setProperty("display", "none", "important"); // ← ADD
  document.querySelector(".folhas-bg")?.style.setProperty("display", "none", "important");  // ← ADD

  carregarDadosCampanhaAtual();
}

async function deletarCampanhaMaster(index) {
  if (!(await confirmBonito("Deseja deletar esta campanha?"))) return;

  campanhasMaster.splice(index, 1);

  if (campanhaAtualMaster === index) {
    campanhaAtualMaster = null;
  }

  salvarCampanhasMaster();
  renderCampanhasMaster();
}

function voltarCampanhasMaster() {
  document.getElementById("masterIgnea").style.display = "none";
  document.getElementById("telaCampanhasMaster").style.display = "block";
  renderCampanhasMaster();
}

function carregarDadosCampanhaAtual() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  const titulo = document.getElementById("tituloCampanhaAtual");
  if (titulo) titulo.textContent = campanha.nome;

  combatesMestre = campanha.combates || [];
  window.combatesMestre = combatesMestre;
  localStorage.setItem("combatesMestre", JSON.stringify(combatesMestre));

  if (typeof renderCombatesMestre === "function") renderCombatesMestre();

  setTimeout(() => {
    inicializarAbaMundo();
    renderMundoCampanha();
    renderLoreCampanha();
  }, 80);
}


const racas = {};

function getAtributoFinal(attr) {
  const base = get(attr);
  const racaSelect = document.getElementById("racaSelect")?.value || "";

  let bonusRaca = 0;

  if (racaSelect.startsWith("custom_")) {
    const index = parseInt(racaSelect.replace("custom_", ""));
    bonusRaca = racasCustomSalvas[index]?.bonus?.[attr] || 0;
  } else if (racaSelect !== "") {
    bonusRaca = racas[racaSelect]?.[attr] || 0;
  }

  return base + bonusRaca;
}

function atualizarAtributosFinaisVisuais() {
  [
    "forca",
    "destreza",
    "constituicao",
    "inteligencia",
    "sabedoria",
    "carisma",
  ].forEach((attr) => {
    const el = document.getElementById(`final_${attr}`);
    if (!el) return;

    const final = getAtributoFinal(attr);
    el.textContent = "= " + final;
    el.style.display = final !== get(attr) ? "" : "none";
  });
}

function aoMudarRaca() {
  const select = document.getElementById("racaSelect");
  const raca = select?.value || "";

  if (raca === "custom") {
    abrirPopupGerenciarRacasCustom();
    select.value = "";
    return;
  }

  atualizarTudo();
  salvarTudo();
}

async function carregarRacasCustomFirebase() {
  if (!window.usuarioAtual || !window.db || !window.getDoc || !window.doc) {
    return;
  }

  try {
    const uid = window.usuarioAtual.uid;

    const snap = await window.getDoc(
      window.doc(window.db, "mestres", uid)
    );

    if (snap.exists()) {
      const data = snap.data();

      if (Array.isArray(data.racasCustom)) {
        racasCustomSalvas = data.racasCustom;

        localStorage.setItem(
          "racasCustomSalvas",
          JSON.stringify(racasCustomSalvas)
        );

        atualizarDropdownRacas();
        atualizarTudo();
      }
    }
  } catch (e) {
    console.error("Erro ao carregar raças da nuvem:", e);
  }
}

function salvarRacasCustomStorage() {
  try {
    localStorage.setItem(
      "racasCustomSalvas",
      JSON.stringify(racasCustomSalvas)
    );
  } catch (e) {
    console.warn("Não foi possível salvar raças no localStorage:", e);
  }

  if (window.usuarioAtual && window.db && window.setDoc && window.doc) {
    const uid = window.usuarioAtual.uid;

    window.setDoc(
      window.doc(window.db, "mestres", uid),
      {
        racasCustom: racasCustomSalvas
      },
      { merge: true }
    ).catch((e) => {
      console.error("Erro ao salvar raças na nuvem:", e);
    });
  }
}

async function carregarRacasCustomFirebase() {
  if (!window.usuarioAtual || !window.db || !window.getDoc || !window.doc) {
    return;
  }

  try {
    const uid = window.usuarioAtual.uid;

    const snap = await window.getDoc(
      window.doc(window.db, "mestres", uid)
    );

    if (snap.exists()) {
      const data = snap.data();

      if (Array.isArray(data.racasCustom)) {
        racasCustomSalvas = data.racasCustom;

        localStorage.setItem(
          "racasCustomSalvas",
          JSON.stringify(racasCustomSalvas)
        );

        atualizarDropdownRacas();
        atualizarTudo();
      }
    }
  } catch (e) {
    console.error("Erro ao carregar raças da nuvem:", e);
  }
}

function abrirPopupGerenciarRacasCustom() {
  let lista = "";

  racasCustomSalvas.forEach((raca, index) => {
    lista += `
      <div class="raca-custom-card">
        <strong>${raca.nome}</strong>

        <div class="raca-custom-acoes">
          <button class="raca-btn raca-btn-editar" onclick="editarRacaCustom(${index})">
  ✏️ Editar
</button>

<button class="raca-btn raca-btn-deletar" onclick="deletarRacaCustom(${index})">
  🗑️
</button>
        </div>
      </div>
    `;
  });

  if (!lista) {
    lista = `<p style="text-align:center; color:#cdb791;">Nenhuma raça custom criada.</p>`;
  }

  abrirPopup(
    "Raças custom",
    `
    <div class="popup-form">
      ${lista}

      <button class="popup-salvar-btn" onclick="abrirPopupBonusCustom()">
        + Nova raça custom
      </button>
    </div>
  `,
    true,
    null,
  );
}

function salvarBonusRacaCustom() {
  const nome =
    document.getElementById("nomeRacaCustom")?.value.trim() || "Raça custom";

  const raca = {
    nome,
    bonus: {
      forca: parseInt(document.getElementById("bonusCustomForca")?.value) || 0,
      destreza:
        parseInt(document.getElementById("bonusCustomDestreza")?.value) || 0,
      constituicao:
        parseInt(document.getElementById("bonusCustomConstituicao")?.value) ||
        0,
      inteligencia:
        parseInt(document.getElementById("bonusCustomInteligencia")?.value) ||
        0,
      sabedoria:
        parseInt(document.getElementById("bonusCustomSabedoria")?.value) || 0,
      carisma:
        parseInt(document.getElementById("bonusCustomCarisma")?.value) || 0,
    },
  };

  if (editandoRacaCustom >= 0) {
    racasCustomSalvas[editandoRacaCustom] = raca;
  } else {
    racasCustomSalvas.push(raca);
  }

  salvarRacasCustomStorage();
  atualizarDropdownRacas();
  atualizarTudo();
  salvarTudo();
  fecharPopup();
}

function editarRacaCustom(index) {
  abrirPopupBonusCustom(index);
}

async function deletarRacaCustom(index) {
  if (!(await confirmBonito("Deseja deletar essa raça custom?"))) return;

  const select = document.getElementById("racaSelect");
  const valorAtual = select?.value;

  racasCustomSalvas.splice(index, 1);

  salvarRacasCustomStorage();
  atualizarDropdownRacas();

  if (valorAtual === `custom_${index}` && select) {
    select.value = "";
  }

  atualizarTudo();
  salvarTudo();
  abrirPopupGerenciarRacasCustom();
}

function abrirPopupBonusCustom() {
  const html = `
    <div class="popup-form">

      <label class="popup-label">Nome da raça</label>
      <input id="nomeRacaCustom" value="${nomeRacaCustom || ""}">

      <label class="popup-label">Força</label>
      <input id="bonusCustomForca" type="number" value="${bonusRacaCustom.forca || 0}">

      <label class="popup-label">Destreza</label>
      <input id="bonusCustomDestreza" type="number" value="${bonusRacaCustom.destreza || 0}">

      <label class="popup-label">Constituição</label>
      <input id="bonusCustomConstituicao" type="number" value="${bonusRacaCustom.constituicao || 0}">

      <label class="popup-label">Inteligência</label>
      <input id="bonusCustomInteligencia" type="number" value="${bonusRacaCustom.inteligencia || 0}">

      <label class="popup-label">Sabedoria</label>
      <input id="bonusCustomSabedoria" type="number" value="${bonusRacaCustom.sabedoria || 0}">

      <label class="popup-label">Carisma</label>
      <input id="bonusCustomCarisma" type="number" value="${bonusRacaCustom.carisma || 0}">

      <button class="popup-salvar-btn" onclick="salvarBonusRacaCustom()">
        Salvar
      </button>
    </div>
  `;

  abrirPopup("Raça Custom", html, true, null);
}

function atualizarModsMaster(tipo) {

  const atributos = ["For", "Des", "Con", "Int", "Sab", "Car"];

  atributos.forEach(attr => {

    const input = document.getElementById(tipo + attr);

    if (!input) return;

    const valor = parseInt(input.value) || 10;

    const mod = Math.floor((valor - 10) / 2);

    const span = document.getElementById(tipo + "Mod" + attr);

    if (span) {
      span.textContent =
        mod >= 0 ? `+${mod}` : mod;
    }

  });

}

function getNomeRacaAtual() {
  const raca = document.getElementById("racaSelect")?.value;

  if (raca === "custom") {
    return nomeRacaCustom || "Custom";
  }

  return raca || "Sem raça";
}

function mod(v) {
  return Math.floor((v - 10) / 2);
}

function get(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  return parseInt(el.value) || 0;
}

function exportarFichaAtual() {
  if (personagemAtual === null || personagemAtual === undefined) {
    alertBonito("Selecione uma ficha primeiro.");
    return;
  }

  exportarFicha(personagemAtual);
}

async function salvarPersonagens() {
  try {
    localStorage.setItem("personagens", JSON.stringify(personagens));
  } catch (erro) {
    console.warn("localStorage cheio. Salvando apenas na nuvem.", erro);
  }

  if (typeof window.salvarFichasNaNuvem === "function") {
    try {
      await window.salvarFichasNaNuvem();
    } catch (erro) {
      console.error("Falha ao salvar na nuvem:", erro);
      if (typeof mostrarToastSalvarFlutuante === "function") {
        mostrarToastSalvarFlutuante("Falha ao salvar na nuvem!");
      }
    }
  }
}

function normalizarTipo(tipo) {
  return (tipo || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getIconeTipo(tipo) {
  const t = normalizarTipo(tipo);

  if (t.includes("fogo")) return "🔥";
  if (t.includes("gelo")) return "❄️";
  if (t.includes("agua")) return "💧";
  if (t.includes("raio")) return "⚡";
  if (t.includes("cura")) return "🩹";
  if (t.includes("trovej")) return "🌩️";
  if (t.includes("necrot")) return "💀";
  if (t.includes("radiante")) return "✨";
  if (t.includes("veneno")) return "☠️";
  if (t.includes("psiqu")) return "🧠";
  if (t.includes("corte")) return "🔪";
  if (t.includes("perfur")) return "📌";
  if (t.includes("concuss")) return "💥";
  if (t.includes("fisico")) return "🗡️";
  if (t.includes("magico")) return "☄️";
  if (t.includes("trevas")) return "🌑";
  if (t.includes("luz")) return "🌕";
  if (t.includes("espirit")) return "🌓";
  if (t.includes("vento")) return "🍃";
  if (t.includes("madeira")) return "🌳";
  if (t.includes("terra")) return "🌍";
  if (t.includes("metal")) return "⚙️";

  return "🔮";
}

function getClasseTipo(tipo) {
  const t = normalizarTipo(tipo);

  if (t.includes("fogo")) return "tipo-fogo";
  if (t.includes("gelo")) return "tipo-gelo";
  if (t.includes("raio")) return "tipo-raio";
  if (t.includes("trovej")) return "tipo-trovejante";
  if (t.includes("necrot")) return "tipo-necrotico";
  if (t.includes("radiante")) return "tipo-radiante";
  if (t.includes("veneno")) return "tipo-veneno";
  if (t.includes("psiqu")) return "tipo-psiquico";
  if (t.includes("corte")) return "tipo-corte";
  if (t.includes("perfur")) return "tipo-perfurante";
  if (t.includes("concuss")) return "tipo-concussao";
  if (t.includes("agua")) return "tipo-agua";
  if (t.includes("magico")) return "tipo-magico";
  if (t.includes("fisico")) return "tipo-fisico";
  if (t.includes("trevas")) return "tipo-trevas";
  if (t.includes("luz")) return "tipo-luz";
  if (t.includes("espirit")) return "tipo-espirito";
  if (t.includes("vento")) return "tipo-vento";
  if (t.includes("madeira")) return "tipo-madeira";
  if (t.includes("terra")) return "tipo-terra";
  if (t.includes("metal")) return "tipo-metal";

  return "tipo-padrao";
}

function atualizarDropdownRacas() {
  const select = document.getElementById("racaSelect");
  if (!select) return;

  // remove antigas custom (sem mexer nas fixas)
  const antigas = document.querySelectorAll(".raca-custom");
  antigas.forEach((el) => el.remove());

  // adiciona custom salvas
  racasCustomSalvas.forEach((raca, index) => {
    const option = document.createElement("option");
    option.value = "custom_" + index;
    option.textContent = raca.nome;
    option.classList.add("raca-custom");

    select.insertBefore(option, select.children[2]);
    // 🔥 coloca logo abaixo de "Custom"
  });
}


function atualizarGastoCirculo(circulo, valor) {
  let total = parseInt(valor) || 0;
  if (total < 0) total = 0;

  const atual = Array.isArray(gastosCirculos[circulo])
    ? gastosCirculos[circulo]
    : [];
  const novoArray = [];

  for (let i = 0; i < total; i++) {
    novoArray.push(atual[i] || false);
  }

  gastosCirculos[circulo] = novoArray;
  renderSlotsCirculo(circulo);
  salvarTudo();
}


function salvarGastosCirculos() {
  for (let i = 0; i <= 9; i++) {
    const input = document.getElementById(`gastoCirculo${i}`);
    gastosCirculos[i] = input ? parseInt(input.value) || 0 : 0;
  }

  salvarTudo();
}

/* ================= POPUP ================= */

function abrirPopup(titulo, conteudo, usarHTML = false, onEditar = null) {
  const noGrimorio = document.getElementById("masterIgnea")?.style.display !== "none";
  const popup = document.getElementById("popup");
  const tituloEl = document.getElementById("popup-titulo");
  const textoEl = document.getElementById("popup-texto");
  const btnEditar = document.getElementById("popup-editar");

  if (!popup || !tituloEl || !textoEl) return;

  tituloEl.textContent = titulo || "";

  if (usarHTML) {
    textoEl.innerHTML = conteudo || "";
  } else {
    textoEl.textContent = conteudo || "";
  }

  if (btnEditar) {
    if (onEditar) {
      btnEditar.style.display = "inline-flex";
      btnEditar.onclick = onEditar;
    } else {
      btnEditar.style.display = "none";
      btnEditar.onclick = null;
    }
  }

  popup.style.display = "flex";
}



function editarItem(index) {
  const item = inventario[index];
  if (!item) return;

  editItemImagemBase64Temp = "";

  const html = `
    <div class="popup-form">
      <label class="popup-label">Nome</label>
      <input id="editItemNome" value="${item.nome || ""}">

      <label class="popup-label">Descrição</label>
      <textarea id="editItemDesc">${item.desc || ""}</textarea>

      <label class="popup-label">Modificações</label>
      <div id="editItemMods"></div>

      <label class="popup-label">Quantidade</label>
      <input id="editItemQtd" type="number" min="1" value="${item.qtd || 1}">

      <label class="popup-label">Imagem (opcional)</label>
      <input type="file" id="editItemImagem" accept="image/*" onchange="previewEditItemImagem()" />
      <label for="editItemImagem" class="botao-upload"><i class="ti ti-photo-plus"></i><span>${item.imagemUrl ? "Trocar imagem" : "Adicionar imagem"}</span></label>
      <img
        id="editItemImagemPreview"
        src="${item.imagemUrl || ""}"
        style="display:${item.imagemUrl ? "block" : "none"}; max-width:100%; border-radius:10px; margin-top:8px;"
      />
      <span class="link-remover-imagem" onclick="removerEditImagemItem()"><i class="ti ti-trash"></i> Remover imagem</span>

      <div class="toggle-cargas" style="margin-top:10px;">
        <span class="toggle-cargas-texto">Requer sintonia</span>
        <label class="switch-cargas">
          <input
            type="checkbox"
            id="editItemRequerSintonia"
            ${item.requerSintonia ? "checked" : ""}
            onchange="toggleEditSintoniaItem()"
          >
          <span class="slider-cargas"></span>
        </label>
      </div>

      <div id="boxEditItemSintonizado" style="display:${item.requerSintonia ? "block" : "none"};">
        <div class="toggle-cargas" style="margin-top:10px;">
          <span class="toggle-cargas-texto">Está sintonizado</span>
          <label class="switch-cargas">
            <input
              type="checkbox"
              id="editItemSintonizado"
              ${item.sintonizado ? "checked" : ""}
            >
            <span class="slider-cargas"></span>
          </label>
        </div>
      </div>

      <div class="toggle-cargas" style="margin-top:10px;">
        <span class="toggle-cargas-texto">É uma bolsa de dinheiro</span>
        <label class="switch-cargas">
          <input type="checkbox" id="editItemBolsa" ${item.bolsa ? "checked" : ""} onchange="alternarBolsaForm('editItem')">
          <span class="slider-cargas"></span>
        </label>
      </div>

      <div class="toggle-cargas" style="margin-top:10px;">
        <span class="toggle-cargas-texto">É um recipiente (mochila...)</span>
        <label class="switch-cargas">
          <input
            type="checkbox"
            id="editItemRecipiente"
            ${item.recipiente ? "checked" : ""}
            onchange="if (this.checked) { const b = document.getElementById('editItemBolsa'); if (b) b.checked = false; } document.getElementById('boxEditItemGuardarEm').style.display = this.checked ? 'none' : 'block'"
          >
          <span class="slider-cargas"></span>
        </label>
      </div>

      <div id="boxEditItemGuardarEm" style="display:${item.recipiente || !recipientesInventario(item.id).length ? "none" : "block"};">
        <label class="popup-label">Onde está</label>
        <select id="editItemDentroDe">${opcoesGuardarEmHTML(item.dentroDe, item.id)}</select>
      </div>

      <button class="popup-salvar-btn" onclick="salvarEdicaoItem(${index})">
        Salvar
      </button>
    </div>
  `;

  abrirPopup("Editar item", html, true, null);
  montarEditorMods("editItemMods", "editItem", item.modificacoes);
}

async function salvarEdicaoItem(index) {
  const nome = document.getElementById("editItemNome").value.trim();
  const desc = document.getElementById("editItemDesc").value.trim();
  const qtd = parseInt(document.getElementById("editItemQtd")?.value) || 1;
  const requerSintonia = !!document.getElementById("editItemRequerSintonia")
    ?.checked;
  const sintonizado =
    requerSintonia && !!document.getElementById("editItemSintonizado")?.checked;

  if (!nome) return;

  let imagemUrl = inventario[index]?.imagemUrl || "";
  let imagemDeleteUrl = inventario[index]?.imagemDeleteUrl || "";

  if (editItemImagemBase64Temp === "REMOVIDA") {
    imagemUrl = "";
    imagemDeleteUrl = "";
  } else if (editItemImagemBase64Temp) {
    const resultado = await uploadImagemFirebase(editItemImagemBase64Temp, "item");
    if (resultado.erro || !resultado.url) {
      alertBonito(_mensagemErroUpload("A imagem anterior foi mantida."))
    } else {
      imagemUrl = resultado.url;
      imagemDeleteUrl = resultado.deleteUrl;
    }
  }

  const anterior = inventario[index] || {};
  const bolsa = !!document.getElementById("editItemBolsa")?.checked;
  const recipiente = !bolsa && !!document.getElementById("editItemRecipiente")?.checked;
  const dentroDe = recipiente ? "" : (document.getElementById("editItemDentroDe")?.value || "");

  // deixou de ser mochila: o que estava dentro fica solto
  if (anterior.recipiente && !recipiente) {
    filhosDoRecipiente(anterior.id).forEach((f) => (f.dentroDe = ""));
  }

  inventario[index] = {
    ...anterior,
    id: anterior.id || gerarIdItem(),
    nome,
    desc,
    qtd,
    requerSintonia,
    sintonizado,
    imagemUrl,
    imagemDeleteUrl,
    recipiente,
    dentroDe,
    bolsa,
    ...(bolsa ? { moedas: normalizarMoedas(anterior.moedas) } : {}),
    modificacoes: [...(window._modsTemp.editItem || [])],
  };

  editItemImagemBase64Temp = "";

  renderInv();
  salvarTudo();
  fecharPopup();
}

function moverItem(index, direcao) {
  const lista = document.querySelectorAll(".item-card");

  if (!lista[index]) return;

  lista[index].classList.add("animando");

  const novoIndex = index + direcao;

  if (novoIndex < 0 || novoIndex >= inventario.length) {
    lista[index].classList.remove("animando");
    return;
  }

  setTimeout(() => {
    [inventario[index], inventario[novoIndex]] = [
      inventario[novoIndex],
      inventario[index],
    ];
    renderInv();
    salvarTudo();
  }, 150);
}

function editarArma(index) {
  const arma = armas[index];
  if (!arma) return;

  editArmaImagemBase64Temp = "";

  const html = `
    <div class="popup-form">
      <label class="popup-label">Nome</label>
      <input id="editArmaNome" value="${arma.nome || ""}">

      ${camposAtaqueArmaHTML("editArma", arma)}

      <label class="popup-label">Descrição</label>
      <textarea id="editArmaDesc">${arma.desc || ""}</textarea>

      <label class="popup-label">Modificações</label>
      <div id="editArmaMods"></div>

      <label class="popup-label">Imagem (opcional)</label>
      <input type="file" id="editArmaImagem" accept="image/*" onchange="previewEditArmaImagem()" />
      <label for="editArmaImagem" class="botao-upload"><i class="ti ti-photo-plus"></i><span>${arma.imagemUrl ? "Trocar imagem" : "Adicionar imagem"}</span></label>
      <img
        id="editArmaImagemPreview"
        src="${arma.imagemUrl || ""}"
        style="display:${arma.imagemUrl ? "block" : "none"}; max-width:100%; border-radius:10px; margin-top:8px;"
      />
      <span class="link-remover-imagem" onclick="removerEditImagemArma()"><i class="ti ti-trash"></i> Remover imagem</span>

      <div class="toggle-cargas" style="margin-top:10px;">
        <span class="toggle-cargas-texto">Usa cargas</span>

        <label class="switch-cargas">
          <input
            type="checkbox"
            id="editArmaTemCargas"
            ${arma.temCargas ? "checked" : ""}
            onchange="toggleEditCampoCargas()"
          >
          <span class="slider-cargas"></span>
        </label>
      </div>

      <div class="toggle-cargas">
  <span class="toggle-cargas-texto">Requer sintonização</span>

  <label class="switch-cargas">
    <input
      type="checkbox"
      id="editArmaRequerSintonia"
      ${arma.requerSintonia ? "checked" : ""}
      onchange="toggleEditSintoniaArma()"
    >
    <span class="slider-cargas"></span>
  </label>
</div>

<div
  id="boxEditArmaSintonizado"
  style="display:${arma.requerSintonia ? "block" : "none"};"
>
  <div class="toggle-cargas">
    <span class="toggle-cargas-texto">Está sintonizado</span>

    <label class="switch-cargas">
      <input
        type="checkbox"
        id="editArmaSintonizado"
        ${arma.sintonizado ? "checked" : ""}
      >
      <span class="slider-cargas"></span>
    </label>
  </div>
</div>

      <input
        id="editArmaMaxCargas"
        type="number"
        min="1"
        max="20"
        placeholder="Qtd. de cargas"
        value="${arma.maxCargas || ""}"
        style="display:${arma.temCargas ? "block" : "none"};"
      >

      <button class="popup-salvar-btn" onclick="salvarEdicaoArma(${index})">
        Salvar
      </button>
    </div>
  `;

  abrirPopup("Editar arma", html, true, null);
  montarEditorMods("editArmaMods", "editArma", arma.modificacoes);
}

function toggleEditCampoCargas() {
  const check = document.getElementById("editArmaTemCargas");
  const input = document.getElementById("editArmaMaxCargas");

  if (!check || !input) return;

  if (check.checked) {
    input.style.display = "block";
  } else {
    input.style.display = "none";
    input.value = "";
  }
}

function toggleEditCampoCargasPoder() {
  const check = document.getElementById("editPoderTemCargas");
  const input = document.getElementById("editPoderMaxCargas");

  if (!check || !input) return;

  if (check.checked) {
    input.style.display = "block";
  } else {
    input.style.display = "none";
    input.value = "";
  }
}



function atualizarTextoBotaoEdicao() {
  const btnItem = document.querySelector("#inventario .inv-add-btn");
  const btnArma = document.querySelector("#combate .arma-add .inv-add-btn");

  rotuloBotaoAdd(btnItem, editandoItem >= 0 ? "Salvar edição" : null);
  rotuloBotaoAdd(btnArma, editandoArma >= 0 ? "Salvar edição" : null);
}

// troca o texto de um botão "Adicionar ..." sem perder o rótulo original (null = volta ao original)
function rotuloBotaoAdd(btn, texto) {
  if (!btn) return;
  if (!btn.dataset.orig) btn.dataset.orig = btn.innerHTML;
  btn.innerHTML = texto == null ? btn.dataset.orig : `<span>${texto}</span>`;
}

function fecharPopup() {
  const popup = document.getElementById("popup");
  if (popup) popup.style.display = "none";
}

async function salvarEdicaoArma(index) {
  const nome = document.getElementById("editArmaNome").value.trim();
  const dano = document.getElementById("editArmaDano").value.trim();
  const desc = document.getElementById("editArmaDesc").value.trim();

  const requerSintonia =
    !!document.getElementById("editArmaRequerSintonia")?.checked;

  const sintonizado =
    requerSintonia &&
    !!document.getElementById("editArmaSintonizado")?.checked;

  // o restante da sua função continua aqui...

  const temCargas = !!document.getElementById("editArmaTemCargas")?.checked;
  const maxCargas = temCargas
    ? parseInt(document.getElementById("editArmaMaxCargas")?.value) || 0
    : 0;

  if (!nome) return;
  if (temCargas && maxCargas <= 0) return;

  const armaAnterior = armas[index];

  let cargasGastas = [];
  if (temCargas) {
    if (
      armaAnterior?.temCargas &&
      armaAnterior.maxCargas === maxCargas &&
      Array.isArray(armaAnterior.cargasGastas)
    ) {
      cargasGastas = armaAnterior.cargasGastas;
    } else {
      cargasGastas = Array(maxCargas).fill(false);
    }
  }

  let imagemUrl = armaAnterior?.imagemUrl || "";
  let imagemDeleteUrl = armaAnterior?.imagemDeleteUrl || "";

  if (editArmaImagemBase64Temp === "REMOVIDA") {
    imagemUrl = "";
    imagemDeleteUrl = "";
  } else if (editArmaImagemBase64Temp) {
    const resultado = await uploadImagemFirebase(editArmaImagemBase64Temp, "arma");
    if (resultado.erro || !resultado.url) {
      alertBonito(_mensagemErroUpload("A imagem anterior foi mantida."))
    } else {
      imagemUrl = resultado.url;
      imagemDeleteUrl = resultado.deleteUrl;
    }
  }

  armas[index] = {
  ...armaAnterior,
  modificacoes: [...(window._modsTemp.editArma || [])],
  nome,
  dano,
  desc,
  temCargas,
  maxCargas,
  cargasGastas,
  requerSintonia,
  sintonizado,
  imagemUrl,
  imagemDeleteUrl,
  ...lerCamposAtaqueArma("editArma"),
};

  editArmaImagemBase64Temp = "";
  renderArmas();
  salvarTudo();
  fecharPopup();
}

/* ================= ABAS ================= */

function controlarHeader(mostrar) {
  document.body.classList.remove("modo-mestre", "sem-header", "ocultar-logo", "hide-header");

  if (!mostrar) {
    document.body.classList.add("hide-header");
  }
}

const ORDEM_ABAS_FICHA = ["personagem", "atributos", "combate", "inventario", "poderes", "veiculos", "companheiros"];
window._abaFichaAtualId = window._abaFichaAtualId || "personagem";

function trocarAba(id, btn = null) {
  document.body.classList.remove("ocultar-logo");
  const abas = document.querySelectorAll(".aba");
  const novaAba = document.getElementById(id);
  const abaAtual = document.querySelector(".aba.active");
  const saindoDoCombate =
    abaAtual && abaAtual.id === "combate" && id !== "combate";

  if (saindoDoCombate) {
    document.body.classList.remove("low-hp");
  }

  if (!novaAba) return;

  if (abaAtual === novaAba) {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));

    if (btn) {
      btn.classList.add("active");
    } else {
      const botao = document.querySelector(`.tab-btn[onclick*="${id}"]`);
      if (botao) botao.classList.add("active");
    }

    setTimeout(() => {
    }, 100);

    atualizarEstadoLowHP();
    return;
  }

  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));

  if (btn) {
    btn.classList.add("active");
  } else {
    const botao = document.querySelector(`.tab-btn[onclick*="${id}"]`);
    if (botao) botao.classList.add("active");
  }

  if (abaAtual) {
    abaAtual.classList.remove("show");
    abaAtual.classList.add("hiding");

    setTimeout(() => {
      abaAtual.classList.remove("active", "hiding");
      abaAtual.style.display = "none";
    }, 250);
  }

  abas.forEach((aba) => {
    if (aba !== novaAba) {
      aba.classList.remove("show", "hiding");
    }
  });

  novaAba.style.display = "block";
  novaAba.classList.add("active");

  atualizarEstadoLowHP();
  if (id === "veiculos" && typeof abrirAbaVeiculos === "function") abrirAbaVeiculos();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      novaAba.classList.add("show");
    });
  });

  setTimeout(() => {
    if (id === "personagem") {
    }
  }, 100);
}

function entrarFicha() {
  controlarHeader(true);

  const telaInicial = document.getElementById("tela-inicial");
  const ficha = document.getElementById("ficha");

  if (telaInicial) telaInicial.style.display = "none";
  if (ficha) ficha.style.display = "block";

  trocarAba("personagem");
}

function entrarModoJogadorAnimado() {
  const tela = document.getElementById("tela-modo");
  if (!tela) return;

  tela.classList.add("saindo");

  setTimeout(() => {
    tela.classList.remove("saindo");
    entrarModoJogador();

    tela.style.opacity = "1";
    tela.style.transform = "scale(1)";
  }, 450);
}

function entrarModoMestre() {
  controlarHeader(false);
  document.querySelector(".header-rpg")?.style.setProperty("display", "none", "important");
  document.querySelector(".folhas-bg")?.style.setProperty("display", "none", "important");

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("tela-modo").style.display = "none";
  document.getElementById("tela-inicial").style.display = "none";
  document.getElementById("ficha").style.display = "none";
  document.getElementById("masterIgnea").style.display = "none";

  const telaCampanhas = document.getElementById("telaCampanhasMaster");
  if (telaCampanhas) {
    telaCampanhas.style.display = "block";
  }

  renderCampanhasMaster();
}

function voltarInicio() {
  const telaInicial = document.getElementById("tela-inicial");
  const ficha = document.getElementById("ficha");

  if (telaInicial) telaInicial.style.display = "block";
  if (ficha) ficha.style.display = "none";
  document.body.classList.remove("ocultar-logo");
}

/* ================= PERSONAGENS ================= */

function renderPersonagens() {
  const div = document.getElementById("listaPersonagens");
  if (!div) return;

  div.innerHTML = "";

  personagens.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.backgroundImage = `url('${p.imagem || ""}')`;

    const posX = p.imagemPosX ?? 50;
    const posY = p.imagemPosY ?? 50;
    card.style.backgroundPosition = `${posX}% ${posY}%`;
    card.style.backgroundSize = "cover";

    card.innerHTML = `
      <div class="card-info">
        <span class="card-nome">${esc(p.nome) || "Sem nome"}</span>
        <span class="card-classe">${esc(p.classe) || "Sem classe"}</span>
      </div>

      <div class="card-acoes">
        <button
          type="button"
          class="btn-duplicar"
          onclick="duplicarPersonagem(${i}); event.stopPropagation();"
        >⧉</button>

        <button
          type="button"
          class="btn-deletar"
          onclick="deletarPersonagem(${i}); event.stopPropagation();"
        >X</button>
      </div>
    `;

    card.onclick = () => {
      if (modoExportacao) {
        modoExportacao = false;
        exportarFicha(i);
        return;
      }

      const plano = getPlanoUsuario();
      const limiteAtingido = (plano === "free") && (i >= 1);
      if (limiteAtingido) {
        abrirPopupBloqueio("ficha");
        return;
      }
      personagemAtual = i;
      carregarPersonagem(i);
    };
    div.appendChild(card);
  });

  const add = document.createElement("div");
  add.className = "card add";
  add.innerText = "+";
  add.onclick = criarPersonagem;
  div.appendChild(add);
}

function duplicarPersonagem(index) {
  const original = personagens[index];
  if (!original) return;

  const copia = JSON.parse(JSON.stringify(original));
  copia.nome = (original.nome || "Sem nome") + " (Cópia)";

  personagens.push(copia);
  salvarPersonagens();
  renderPersonagens();
}

function toggleSecao(id, titulo) {
  const box = document.getElementById(id);
  if (!box) return;

  const estaAberto = box.classList.contains("aberto");

  if (estaAberto) {
    box.classList.remove("aberto");
    box.classList.add("fechado");
  } else {
    box.classList.add("aberto");
    box.classList.remove("fechado");
  }

  if (titulo) {
    titulo.classList.toggle("fechado", estaAberto);
  }

  localStorage.setItem("secao_" + id, estaAberto ? "fechada" : "aberta");
}

function restaurarSecoes() {
  const secoes = document.querySelectorAll(".conteudo-toggle");

  secoes.forEach((box) => {
    const id = box.id;
    if (!id) return;

    const estado = localStorage.getItem("secao_" + id);
    const titulo = document.querySelector(`[onclick*="${id}"]`);

    if (estado === "fechada") {
      box.classList.remove("aberto");
      box.classList.add("fechado");
      if (titulo) titulo.classList.add("fechado");
    } else {
      box.classList.add("aberto");
      box.classList.remove("fechado");
      if (titulo) titulo.classList.remove("fechado");
    }
  });
}

function renderAliados() {
  const ul = document.getElementById("listaAliados");
  if (!ul || personagemAtual === null) return;

  ul.innerHTML = "";

  const p = personagens[personagemAtual];

  if (!Array.isArray(p.aliados)) {
    p.aliados = [];
  }

  p.aliados.forEach((aliado, index) => {

    // Aliados antigos não possuem tipo.
    // Vamos tratá-los como companheiros.
    const tipo = aliado.tipo || "companheiro";

    aliado.tipo = tipo;

    const li = document.createElement("li");
    li.className = "item-card";
    li.dataset.index = index;

    let etiqueta = "⚔ Companheiro";

    if (tipo === "inimigo") {
      etiqueta = "☠ Inimigo";
    } else if (tipo === "neutro") {
      etiqueta = "◈ Neutro";
    }

    li.innerHTML = `
      <button
        type="button"
        class="drag-handle"
        aria-label="Arrastar para reordenar"
      ></button>

      <div
        class="item-info"
        onclick="abrirDetalhesAliado(${index})"
        style="cursor:pointer;"
      >

        <strong class="item-nome">
          ${esc(aliado.nome) || "Sem nome"}
        </strong>

        <div class="aliado-tipo">
          ${etiqueta}
        </div>

        ${
          aliado.local
            ? `<div class="aliado-local">📍 ${esc(aliado.local)}</div>`
            : ""
        }

        <p class="item-preview">
          ${
            aliado.desc
              ? esc(aliado.desc).substring(0, 80) +
                (aliado.desc.length > 80 ? "..." : "")
              : "Sem descrição"
          }
        </p>

      </div>

    `;

    ul.appendChild(li);
  });

  

 habilitarArrastarReordenar(
  ul,
  p.aliados,
  renderAliados
);
}

function filtrarAliados(tipo, botao) {
  const botoes = document.querySelectorAll(".aliado-filtro");

  botoes.forEach((btn) => {
    btn.classList.remove("ativo");
  });

  if (botao) {
    botao.classList.add("ativo");
  }

  const ul = document.getElementById("listaAliados");

  if (!ul || personagemAtual === null) return;

  const p = personagens[personagemAtual];

  if (!p || !Array.isArray(p.aliados)) return;

  ul.innerHTML = "";

  p.aliados.forEach((aliado, index) => {

    const tipoAliado = aliado.tipo || "companheiro";

    if (tipo !== "todos" && tipoAliado !== tipo) {
      return;
    }

    const li = document.createElement("li");

    li.className = "item-card";
    li.dataset.index = index;

    let etiqueta = "⚔ Companheiro";

    if (tipoAliado === "inimigo") {
      etiqueta = "☠ Inimigo";
    }

    if (tipoAliado === "neutro") {
      etiqueta = "◈ Neutro";
    }

    li.innerHTML = `
      <button
        type="button"
        class="drag-handle"
        aria-label="Arrastar para reordenar"
      ></button>

      <div
        class="item-info"
        onclick="abrirDetalhesAliado(${index})"
        style="cursor:pointer;"
      >

        <strong class="item-nome">
          ${esc(aliado.nome) || "Sem nome"}
        </strong>

        <div class="aliado-tipo">
          ${etiqueta}
        </div>

        ${
          aliado.local
            ? `<div class="aliado-local">
                 📍 ${esc(aliado.local)}
               </div>`
            : ""
        }

        <p class="item-preview">
          ${
            aliado.desc
              ? esc(aliado.desc).substring(0, 80) +
                (aliado.desc.length > 80 ? "..." : "")
              : "Sem descrição"
          }
        </p>

      </div>

    `;

    ul.appendChild(li);
  });

    habilitarArrastarReordenar(
    ul,
    p.aliados,
    () => filtrarAliados(tipo, botao)
  );
}

function removerAliado(index) {
  const p = personagens[personagemAtual];
  if (!p || !Array.isArray(p.aliados)) return;

  p.aliados.splice(index, 1);

  if (editandoAliado === index) {
    editandoAliado = -1;
    document.getElementById("aliadoNome").value = "";
    document.getElementById("aliadoDesc").value = "";
  } else if (editandoAliado > index) {
    editandoAliado--;
  }

  salvarTudo();
  renderAliados();
}

function toggleDominio(index) {
  dominio[index] = !dominio[index];
  renderDominio();
  salvarTudo();
}

async function editarQuantidadePontosDominio() {
  const atual = dominio.length;
  const resposta = await promptBonito("Quantos Pontos de Domínio?", atual);

  if (resposta === null) return;

  let novoTotal = parseInt(resposta);
  if (isNaN(novoTotal) || novoTotal < 0) novoTotal = 0;

  const novoArray = [];
  for (let i = 0; i < novoTotal; i++) {
    novoArray.push(dominio[i] || false);
  }

  dominio = novoArray;

  renderDominio();
  salvarTudo();
}

function renderDominio() {
  const container = document.getElementById("dominioChecks");
  if (!container) return;

  container.innerHTML = "";

  dominio.forEach((ativo, i) => {
    const check = document.createElement("div");
    check.className = "dominio-check" + (ativo ? " ativo" : "");
    check.onclick = () => toggleDominio(i);
    container.appendChild(check);
  });
}

function toggleCampoCargas() {
  const check = document.getElementById("armaTemCargas");
  const input = document.getElementById("armaMaxCargas");

  if (!check || !input) return;

  if (check.checked) {
    input.style.display = "block";
  } else {
    input.style.display = "none";
    input.value = "";
  }
}
function editarAliado(index) {
  const p = personagens[personagemAtual];

  if (!p || !Array.isArray(p.aliados)) return;

  const aliado = p.aliados[index];

  if (!aliado) return;

  const tipo = aliado.tipo || "companheiro";

  const html = `
    <div class="popup-form">

      <label class="popup-label">Nome</label>

      <input
        id="editAliadoNome"
        value="${esc(aliado.nome || "")}"
      >

      <label class="popup-label">Tipo</label>

      <select id="editAliadoTipo">

        <option
          value="companheiro"
          ${tipo === "companheiro" ? "selected" : ""}
        >
          ⚔ Companheiro
        </option>

        <option
          value="inimigo"
          ${tipo === "inimigo" ? "selected" : ""}
        >
          ☠ Inimigo
        </option>

        <option
          value="neutro"
          ${tipo === "neutro" ? "selected" : ""}
        >
          ◈ Neutro
        </option>

      </select>

      <label class="popup-label">Região / Local</label>

      <input
        id="editAliadoLocal"
        value="${esc(aliado.local || "")}"
      >

      <label class="popup-label">Descrição</label>

      <textarea id="editAliadoDesc">${esc(aliado.desc || "")}</textarea>

      <label class="popup-label">Imagem do personagem</label>

      <div class="upload-imagem aliado-upload-edicao">

        <label
          for="editAliadoImagem"
          class="botao-upload"
        >
          <i class="ti ti-photo-plus"></i><span>${aliado.imagem ? "Trocar imagem" : "Adicionar imagem"}</span>
        </label>

        <input
          type="file"
          id="editAliadoImagem"
          accept="image/*"
        />

        ${
          aliado.imagem
            ? `
              <img
                id="editAliadoImagemPreview"
                src="${aliado.imagem}"
                class="aliado-imagem-edicao-preview"
              >

              <span
                class="link-remover-imagem"
                onclick="removerImagemEdicaoAliado()"
              >
                <i class="ti ti-trash"></i> Remover imagem
              </span>
            `
            : `
              <img
                id="editAliadoImagemPreview"
                class="aliado-imagem-edicao-preview"
                style="display:none;"
              >

              <span
                id="editAliadoRemover"
                class="link-remover-imagem"
                style="display:none;"
                onclick="removerImagemEdicaoAliado()"
              >
                <i class="ti ti-trash"></i> Remover imagem
              </span>
            `
        }

        <input
          type="hidden"
          id="editAliadoImagemRemovida"
          value="0"
        />

      </div>

      <button
        class="popup-salvar-btn"
        onclick="salvarEdicaoAliado(${index})"
      >
        Salvar
      </button>

    </div>
  `;

  abrirPopup("Editar personagem", html, true, null);

  const imagemInput =
    document.getElementById("editAliadoImagem");

  if (imagemInput) {
    imagemInput.onchange = () => {

      const arquivo = imagemInput.files?.[0];

      if (!arquivo) return;

      const preview =
        document.getElementById("editAliadoImagemPreview");

      if (preview) {
        preview.src = URL.createObjectURL(arquivo);
        preview.style.display = "block";
      }

      const remover =
        document.getElementById("editAliadoRemover");

      if (remover) {
        remover.style.display = "inline";
      }

      const removida =
        document.getElementById("editAliadoImagemRemovida");

      if (removida) {
        removida.value = "0";
      }
    };
  }
}

function removerImagemEdicaoAliado() {
  const input =
    document.getElementById("editAliadoImagem");

  const preview =
    document.getElementById("editAliadoImagemPreview");

  const removida =
    document.getElementById("editAliadoImagemRemovida");

  if (input) {
    input.value = "";
  }

  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }

  if (removida) {
    removida.value = "1";
  }

  const botao =
    document.querySelector(
      ".aliado-upload-edicao .botao-upload"
    );

  if (botao) {
    botao.innerHTML = `<i class="ti ti-photo-plus"></i><span>Adicionar imagem</span>`;
  }
}

async function salvarEdicaoAliado(index) {
  const p = personagens[personagemAtual];

  if (!p || !Array.isArray(p.aliados)) return;

  const aliado = p.aliados[index];

  if (!aliado) return;

  const nome =
    document.getElementById("editAliadoNome").value.trim();

  const local =
    document.getElementById("editAliadoLocal").value.trim();

  const desc =
    document.getElementById("editAliadoDesc").value.trim();

  const tipo =
    document.getElementById("editAliadoTipo")?.value ||
    "companheiro";

  if (!nome) return;

  const imagemInput =
    document.getElementById("editAliadoImagem");

  const imagemRemovida =
    document.getElementById("editAliadoImagemRemovida")?.value === "1";

  // Mantém os dados atuais
  aliado.nome = nome;
  aliado.local = local;
  aliado.desc = desc;
  aliado.tipo = tipo;

  // Se clicou em remover
  if (imagemRemovida) {
    aliado.imagem = "";
  }

   // Se escolheu uma imagem nova
  if (imagemInput?.files?.[0]) {
    const base64 = await comprimirImagem(imagemInput.files[0], 900, 0.72);
    const resultado = await uploadImagemFirebase(base64, "aliado");
    if (resultado.erro || !resultado.url) {
      alertBonito(_mensagemErroUpload("A imagem anterior foi mantida."))
    } else {
      aliado.imagem = resultado.url;
    }
  }

  salvarTudo();

  fecharPopup();

  renderAliados();
}

async function adicionarAliado() {
  const nome = document.getElementById("aliadoNome").value.trim();
  const local = document.getElementById("aliadoLocal").value.trim();
  const desc = document.getElementById("aliadoDesc").value.trim();

  const tipo =
    document.getElementById("aliadoTipo")?.value || "companheiro";

  if (!nome) return;

  const p = personagens[personagemAtual];

  if (!Array.isArray(p.aliados)) {
    p.aliados = [];
  }

  // Envia a imagem pro ImgBB (se tiver) e guarda só o link,
  // nunca o base64 direto (isso estoura o limite do Firestore)
  let imagem = "";
  if (aliadoImagemBase64Temp && aliadoImagemBase64Temp !== "REMOVIDA") {
    const resultado = await uploadImagemFirebase(aliadoImagemBase64Temp, "aliado");
    if (resultado.erro || !resultado.url) {
      alertBonito("Não consegui enviar a imagem (internet?). O aliado foi salvo sem foto.");
    } else {
      imagem = resultado.url;
    }
  }

  // Salva o aliado
  p.aliados.push({
    nome,
    local,
    desc,
    tipo,
    imagem
  });

  // Limpa os campos
  document.getElementById("aliadoNome").value = "";
  document.getElementById("aliadoLocal").value = "";
  document.getElementById("aliadoDesc").value = "";

  // Limpa a imagem
  const imagemInput = document.getElementById("aliadoImagem");
  if (imagemInput) {
    imagemInput.value = "";
  }

  const imagemPreview =
    document.getElementById("aliadoImagemPreview");

  if (imagemPreview) {
    imagemPreview.src = "";
    imagemPreview.style.display = "none";
  }

  // Volta o tipo para Companheiro
  const tipoInput =
    document.getElementById("aliadoTipo");

  if (tipoInput) {
    tipoInput.value = "companheiro";
  }

  salvarTudo();
  aliadoImagemBase64Temp = "";
  renderAliados();
}

function abrirDetalhesAliado(index) {
  const p = personagens[personagemAtual];

  if (!p || !Array.isArray(p.aliados)) return;

  const aliado = p.aliados[index];

  if (!aliado) return;

  const tipo = aliado.tipo || "companheiro";

  let tipoTexto = "⚔ Companheiro";

  if (tipo === "inimigo") {
    tipoTexto = "☠ Inimigo";
  } else if (tipo === "neutro") {
    tipoTexto = "◈ Neutro";
  }

  const html = `
    <div class="aliado-detalhes">

    ${
  aliado.imagem
    ? `
      <div class="aliado-detalhes-imagem">
        <img src="${aliado.imagem}" alt="">
      </div>
    `
    : ""
}

      <div class="aliado-detalhes-cabecalho">

        <div>
          <div class="aliado-detalhes-tipo">
            ${tipoTexto}
          </div>

          <h2 class="aliado-detalhes-nome">
            ${esc(aliado.nome) || "Sem nome"}
          </h2>

          ${
            aliado.local
              ? `<div class="aliado-detalhes-local">
                   📍 ${esc(aliado.local)}
                 </div>`
              : ""
          }
        </div>

      </div>

      <div class="aliado-detalhes-corpo">

        <h3>Descrição</h3>

        <p>${
  aliado.desc
    ? esc(aliado.desc)
    : "Nenhuma descrição foi adicionada."
}</p>

      </div>

    </div>
  `;

  const acoes = `
    <div class="pv-acoes">
      <button type="button" class="pv-editar" onclick="fecharPopup(); editarAliado(${index})"><i class="ti ti-pencil"></i><span>Editar</span></button>
      <button type="button" class="perigo" onclick="removerAliadoConfirmando(${index})"><i class="ti ti-trash"></i><span>Remover</span></button>
    </div>`;

  abrirPopup(aliado.nome || "Detalhes", html + acoes, true, null);
}

async function removerAliadoConfirmando(index) {
  const aliado = personagens[personagemAtual]?.aliados?.[index];
  if (!aliado) return;
  if (!(await confirmBonito(`Remover "${aliado.nome || "este personagem"}"?`))) return;
  fecharPopup();
  removerAliado(index);
}

function criarPersonagem() {
  if (!podeCriarFicha()) {
    abrirTelaPlanos();
    return;
  }
  const novo = {
    id: Date.now() + Math.floor(Math.random() * 99999),
    nome: "",
    classe: "",
    raca: "",
    idade: "",
    altura: "",
    nivel: "",
    imagem: "",
    imagens: [],
    imagemPosX: 50,
    imagemPosY: 50,
    antecedentes: "",
    idiomas: "",
    diario: "",
    proficienciasExtras: "",
    gastosCirculos: {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
    },

    vidaMax: 50,
    vidaAtual: 50,
    vidaTemp: 0,
    ca: "",
    deslocamento: 9,

    forca: 10,
    destreza: 10,
    constituicao: 10,
    inteligencia: 10,
    sabedoria: 10,
    carisma: 10,
    bonusProf: 2,

    armaduras: [],
    aliados: [],
    inventario: [],
    armas: [],
    poderes: [],
    profs: {},
    saves: {},
    exaustao: 0,
    inspiracao: 0,
    dtBase: 8,
    dtAtributo: 0,
    dtProf: 2,
    dominio: [false, false, false, false, false, false],
    morte: {
      sucessos: [false, false, false],
      falhas: [false, false, false],
    },
  };

  personagens.push(novo);
  salvarPersonagens();
  renderPersonagens();
}

async function deletarPersonagem(index) {
  const personagem = personagens[index];

  if (!personagem) return;

  if (
    !(await confirmBonito(
      `Tem certeza que quer excluir "${personagem.nome || "Sem nome"}"?`
    ))
  ) {
    return;
  }

  // 🔥 remove imagem do ImgBB
  if (personagem.imagemDeleteUrl?.startsWith("https://")) {
    try {
      await fetch(personagem.imagemDeleteUrl);
    } catch (erro) {
      console.warn("Erro ao deletar imagem do ImgBB:", erro);
    }
  }

  // 🔥 remove do Firebase
  if (
    personagem.id &&
    window.usuarioAtual
  ) {
    try {
      await deleteDoc(
        doc(
          db,
          "usuarios",
          window.usuarioAtual.uid,
          "fichas",
          String(personagem.id)
        )
      );
    } catch (erro) {
      console.error(
        "Erro ao deletar ficha da nuvem:",
        erro
      );
    }
  }

  // 🔥 remove local
  personagens.splice(index, 1);

  salvarPersonagens();

  renderPersonagens();

  if (personagemAtual === index) {
    personagemAtual = null;
    voltarInicio();
  }
}

function toggleDiario() {
  const box = document.getElementById("diario-box");
  if (!box) return;

  if (box.style.display === "none" || box.style.display === "") {
    box.style.display = "block";
  } else {
    box.style.display = "none";
  }
}

async function addArmadura() {
  const nome = document.getElementById("armaduraNome").value.trim();
  const ca = document.getElementById("armaduraCA").value.trim();
  const desc = document.getElementById("armaduraDesc").value.trim();

  const temCargasEl = document.getElementById("armaduraTemCargas");
  const maxCargasEl = document.getElementById("armaduraMaxCargas");

  const temCargas = !!temCargasEl?.checked;
  const maxCargas = temCargas ? parseInt(maxCargasEl?.value) || 0 : 0;

  if (!nome) return;
  if (temCargas && maxCargas <= 0) return;

  let imagemUrl = editandoArmadura >= 0 ? armaduras[editandoArmadura]?.imagemUrl || "" : "";
  let imagemDeleteUrl = editandoArmadura >= 0 ? armaduras[editandoArmadura]?.imagemDeleteUrl || "" : "";

  if (armaduraImagemBase64Temp === "REMOVIDA") {
    imagemUrl = "";
    imagemDeleteUrl = "";
  } else if (armaduraImagemBase64Temp) {
    const resultado = await uploadImagemFirebase(armaduraImagemBase64Temp, "armadura");
    if (resultado.erro || !resultado.url) {
      alertBonito(_mensagemErroUpload("A armadura foi salva sem imagem."))
    } else {
      imagemUrl = resultado.url;
      imagemDeleteUrl = resultado.deleteUrl;
    }
  }

    const requerSintonia = !!document.getElementById("armaduraRequerSintonia")?.checked;
  const sintonizado = requerSintonia && !!document.getElementById("armaduraSintonizado")?.checked;

  const novaArmadura = {
    modificacoes: consumirModsTemp("armadura"),
    nome,
    ca,
    desc,
    temCargas,
    maxCargas,
    cargasGastas: temCargas ? Array(maxCargas).fill(false) : [],
    requerSintonia,
    sintonizado,
    imagemUrl,
    imagemDeleteUrl,
  };

  if (editandoArmadura >= 0) {
    const armaduraAnterior = armaduras[editandoArmadura];

    if (
      armaduraAnterior?.temCargas &&
      temCargas &&
      armaduraAnterior.maxCargas === maxCargas &&
      Array.isArray(armaduraAnterior.cargasGastas)
    ) {
      novaArmadura.cargasGastas = armaduraAnterior.cargasGastas;
    }

    armaduras[editandoArmadura] = novaArmadura;
    editandoArmadura = -1;
  } else {
    armaduras.push(novaArmadura);
  }

  renderArmaduras();
  salvarTudo();

  document.getElementById("armaduraNome").value = "";
  document.getElementById("armaduraCA").value = "";
  document.getElementById("armaduraDesc").value = "";

    const requerSintoniaEl = document.getElementById("armaduraRequerSintonia");
  const sintonizadoEl = document.getElementById("armaduraSintonizado");
  const boxSintonizadoEl = document.getElementById("boxArmaduraSintonizado");
  if (requerSintoniaEl) requerSintoniaEl.checked = false;
  if (sintonizadoEl) sintonizadoEl.checked = false;
  if (boxSintonizadoEl) boxSintonizadoEl.style.display = "none";

  if (temCargasEl) temCargasEl.checked = false;
  if (maxCargasEl) {
    maxCargasEl.value = "";
    maxCargasEl.style.display = "none";
  }

  armaduraImagemBase64Temp = "";
  document.getElementById("armaduraImagem").value = "";
  document.getElementById("armaduraImagemPreview").style.display = "none";
}

function toggleSintoniaArma() {
  const requer = document.getElementById("armaRequerSintonia");
  const box = document.getElementById("boxArmaSintonizado");
  const sintonizado = document.getElementById("armaSintonizado");
  if (!requer || !box) return;
  if (requer.checked) {
    box.style.display = "block";
  } else {
    box.style.display = "none";
    if (sintonizado) sintonizado.checked = false;
  }
}

function toggleSintoniaArmadura() {
  const requer = document.getElementById("armaduraRequerSintonia");
  const box = document.getElementById("boxArmaduraSintonizado");
  const sintonizado = document.getElementById("armaduraSintonizado");
  if (!requer || !box) return;
  if (requer.checked) {
    box.style.display = "block";
  } else {
    box.style.display = "none";
    if (sintonizado) sintonizado.checked = false;
  }
}

function toggleCargaArmadura(indexArmadura, indexCarga) {
  const armadura = armaduras[indexArmadura];
  if (!armadura || !armadura.temCargas || !Array.isArray(armadura.cargasGastas))
    return;

  armadura.cargasGastas[indexCarga] = !armadura.cargasGastas[indexCarga];
  renderArmaduras();
  salvarTudo();
}

function renderArmaduras() {
  const ul = document.getElementById("listaArmaduras");
  if (!ul) return;

  ul.innerHTML = "";

  armaduras.forEach((armadura, index) => {
    const li = document.createElement("li");
    li.className = "armadura-card";
    li.dataset.index = index;

    const cargasHTML =
      armadura.temCargas && armadura.maxCargas > 0
        ? `
        <div class="arma-cargas-box">
          <span class="arma-cargas-label">Cargas</span>
          <div class="arma-cargas-checks">
            ${Array.from(
              { length: armadura.maxCargas },
              (_, i) => `
              <div
                class="arma-carga-check ${armadura.cargasGastas?.[i] ? "ativo" : ""}"
                onclick="event.stopPropagation(); toggleCargaArmadura(${index}, ${i})"
              ></div>
            `,
            ).join("")}
          </div>
        </div>
      `
        : "";

    
    li.innerHTML = `
      <button type="button" class="drag-handle" aria-label="Arrastar para reordenar">⠿</button>

      <div class="armadura-info" onclick="verArmadura(${index})">
        <strong class="armadura-nome">
  ${esc(armadura.nome) || "Sem nome"}
  ${
    armadura.requerSintonia
      ? `<span class="item-tag-sintonia ${armadura.sintonizado ? "ativo" : ""}">${armadura.sintonizado ? "Sintonizado" : "Requer sintonia"}</span>`
      : ""
  }
</strong>
        <p class="armadura-ca-preview">CA: ${esc(armadura.ca) || "Sem CA"}</p>
        ${modsChipsHTML(armadura.modificacoes)}

<p class="armadura-desc-preview">
  ${armadura.desc ? esc(armadura.desc).substring(0, 60) + (armadura.desc.length > 60 ? "..." : "") : "Sem descrição"}
</p>

${cargasHTML}
      </div>

      <div class="card-acoes-ico">
        <button type="button" class="card-ico" title="Dar para outro jogador" onclick="event.stopPropagation(); window.abrirDarItem('armaduras', ${index})"><i class="ti ti-gift"></i></button>
      </div>
    `;

    ul.appendChild(li);
  });

  habilitarArrastarReordenar(ul, armaduras, renderArmaduras);
}

function toggleCampoCargasArmadura() {
  const check = document.getElementById("armaduraTemCargas");
  const input = document.getElementById("armaduraMaxCargas");

  if (!check || !input) return;

  if (check.checked) {
    input.style.display = "block";
  } else {
    input.style.display = "none";
    input.value = "";
  }
}

function verArmadura(index) {
  const armadura = armaduras[index];
  if (!armadura) return;

  const html = popupVerHTML({
    imagem: armadura.imagemUrl,
    infos: [
      ["CA", esc(armadura.ca) || "—", true],
      ["Cargas", pvCargas(armadura)],
      ["Sintonia", pvSintonia(armadura)],
    ],
    mods: armadura.modificacoes,
    desc: armadura.desc,
    acoes: `
      <button type="button" onclick="fecharPopup(); window.abrirDarItem('armaduras', ${index})"><i class="ti ti-gift"></i><span>Dar</span></button>
      <button type="button" class="pv-editar" onclick="editarArmadura(${index})"><i class="ti ti-pencil"></i><span>Editar</span></button>
      <button type="button" class="perigo" onclick="fecharPopup(); removerArmadura(${index})"><i class="ti ti-trash"></i><span>Remover</span></button>`,
  });

  abrirPopup(armadura.nome || "Sem nome", html, true, null);
}

function abrirTelaPlanos() {
  const tela = document.getElementById("tela-planos");
  if (tela) tela.style.display = "block";
}

function fecharTelaPlanos() {
  const tela = document.getElementById("tela-planos");
  if (tela) tela.style.display = "none";
}

function assinarPlano(plano) {
  alertBonito("Em breve! O sistema de pagamento estará disponível no lançamento.");
}

function editarArmadura(index) {
  const armadura = armaduras[index];
  if (!armadura) return;

  editArmaduraImagemBase64Temp = "";

  const html = `
    <div class="popup-form">
      <label class="popup-label">Nome</label>
      <input id="editArmaduraNome" value="${armadura.nome || ""}">

      <label class="popup-label">CA</label>
      <input id="editArmaduraCA" value="${armadura.ca || ""}">

      <label class="popup-label">Descrição</label>
      <textarea id="editArmaduraDesc">${armadura.desc || ""}</textarea>

      <label class="popup-label">Modificações</label>
      <div id="editArmaduraMods"></div>

      <label class="popup-label">Imagem (opcional)</label>
      <input type="file" id="editArmaduraImagem" accept="image/*" onchange="previewEditArmaduraImagem()" />
      <label for="editArmaduraImagem" class="botao-upload"><i class="ti ti-photo-plus"></i><span>${armadura.imagemUrl ? "Trocar imagem" : "Adicionar imagem"}</span></label>
      <img
        id="editArmaduraImagemPreview"
        src="${armadura.imagemUrl || ""}"
        style="display:${armadura.imagemUrl ? "block" : "none"}; max-width:100%; border-radius:10px; margin-top:8px;"
      />
      <span class="link-remover-imagem" onclick="removerEditImagemArmadura()"><i class="ti ti-trash"></i> Remover imagem</span>

      <div class="toggle-cargas" style="margin-top:10px;">
        <span class="toggle-cargas-texto">Usa cargas</span>

        <label class="switch-cargas">
          <input
            type="checkbox"
            id="editArmaduraTemCargas"
            ${armadura.temCargas ? "checked" : ""}
            onchange="toggleEditCampoCargasArmadura()"
          >
          <span class="slider-cargas"></span>
        </label>
      </div>

      <div class="toggle-cargas">
  <span class="toggle-cargas-texto">Requer sintonização</span>

  <label class="switch-cargas">
    <input
      type="checkbox"
      id="editArmaduraRequerSintonia"
      ${armadura.requerSintonia ? "checked" : ""}
      onchange="toggleEditSintoniaArmadura()"
    >
    <span class="slider-cargas"></span>
  </label>
</div>

<div
  id="boxEditArmaduraSintonizado"
  style="display:${armadura.requerSintonia ? "block" : "none"};"
>
  <div class="toggle-cargas">
    <span class="toggle-cargas-texto">Está sintonizado</span>

    <label class="switch-cargas">
      <input
        type="checkbox"
        id="editArmaduraSintonizado"
        ${armadura.sintonizado ? "checked" : ""}
      >
      <span class="slider-cargas"></span>
    </label>
  </div>
</div>

      <input
        id="editArmaduraMaxCargas"
        type="number"
        min="1"
        max="20"
        placeholder="Qtd. de cargas"
        value="${armadura.maxCargas || ""}"
        style="display:${armadura.temCargas ? "block" : "none"};"
      >

      <button class="popup-salvar-btn" onclick="salvarEdicaoArmadura(${index})">
        Salvar
      </button>
    </div>
  `;

  abrirPopup("Editar armadura", html, true, null);
  montarEditorMods("editArmaduraMods", "editArmadura", armadura.modificacoes);
}

function toggleEditCampoCargasArmadura() {
  const check = document.getElementById("editArmaduraTemCargas");
  const input = document.getElementById("editArmaduraMaxCargas");

  if (!check || !input) return;

  if (check.checked) {
    input.style.display = "block";
  } else {
    input.style.display = "none";
    input.value = "";
  }
}

function toggleEditSintoniaArma() {
  const requer = document.getElementById("editArmaRequerSintonia");
  const box = document.getElementById("boxEditArmaSintonizado");
  const sintonizado = document.getElementById("editArmaSintonizado");

  if (!requer || !box) return;

  if (requer.checked) {
    box.style.display = "block";
  } else {
    box.style.display = "none";

    if (sintonizado) {
      sintonizado.checked = false;
    }
  }
}

function toggleEditSintoniaArmadura() {
  const requer = document.getElementById("editArmaduraRequerSintonia");
  const box = document.getElementById("boxEditArmaduraSintonizado");
  const sintonizado = document.getElementById("editArmaduraSintonizado");

  if (!requer || !box) return;

  if (requer.checked) {
    box.style.display = "block";
  } else {
    box.style.display = "none";

    if (sintonizado) {
      sintonizado.checked = false;
    }
  }
}

async function salvarEdicaoArmadura(index) {
  const nome = document.getElementById("editArmaduraNome").value.trim();
  const ca = document.getElementById("editArmaduraCA").value.trim();
  const desc = document.getElementById("editArmaduraDesc").value.trim();

  const requerSintonia =
  !!document.getElementById("editArmaduraRequerSintonia")?.checked;

const sintonizado =
  requerSintonia &&
  !!document.getElementById("editArmaduraSintonizado")?.checked;

  const temCargas = !!document.getElementById("editArmaduraTemCargas")?.checked;
  const maxCargas = temCargas
    ? parseInt(document.getElementById("editArmaduraMaxCargas")?.value) || 0
    : 0;

  if (!nome) return;
  if (temCargas && maxCargas <= 0) return;

  const armaduraAnterior = armaduras[index];

  let cargasGastas = [];
  if (temCargas) {
    if (
      armaduraAnterior?.temCargas &&
      armaduraAnterior.maxCargas === maxCargas &&
      Array.isArray(armaduraAnterior.cargasGastas)
    ) {
      cargasGastas = armaduraAnterior.cargasGastas;
    } else {
      cargasGastas = Array(maxCargas).fill(false);
    }
  }

  let imagemUrl = armaduraAnterior?.imagemUrl || "";
  let imagemDeleteUrl = armaduraAnterior?.imagemDeleteUrl || "";

  if (editArmaduraImagemBase64Temp === "REMOVIDA") {
    imagemUrl = "";
    imagemDeleteUrl = "";
  } else if (editArmaduraImagemBase64Temp) {
    const resultado = await uploadImagemFirebase(editArmaduraImagemBase64Temp, "armadura");
    if (resultado.erro || !resultado.url) {
      alertBonito(_mensagemErroUpload("A imagem anterior foi mantida."))
    } else {
      imagemUrl = resultado.url;
      imagemDeleteUrl = resultado.deleteUrl;
    }
  }

  armaduras[index] = {
  ...armaduraAnterior,
  modificacoes: [...(window._modsTemp.editArmadura || [])],
  nome,
  ca,
  desc,
  temCargas,
  maxCargas,
  cargasGastas,
  requerSintonia,
  sintonizado,
  imagemUrl,
  imagemDeleteUrl,
};

  editArmaduraImagemBase64Temp = "";
  renderArmaduras();
  salvarTudo();
  fecharPopup();
}

async function removerArmadura(index) {
  const armadura = armaduras[index];
  if (!armadura) return;

  const confirmar = await confirmBonito(`Remover "${armadura.nome}"?`);
  if (!confirmar) return;

  armaduras.splice(index, 1);
  renderArmaduras();
  salvarTudo();
}

function carregarPersonagem(index) {
  personagemAtual = index;
  const p = personagens[index];
  if (!p) return;

  sanitizarPersonagem(p);
  document.getElementById("classe").value = p.classe || "";
  document.getElementById("nome").value = p.nome || "";
  const racaSelect = document.getElementById("racaSelect");
  if (racaSelect) {
    racaSelect.value = p.racaSelect || p.raca || "";
  }
  bonusRacaCustom = p.bonusRacaCustom || {
    forca: 0,
    destreza: 0,
    constituicao: 0,
    inteligencia: 0,
    sabedoria: 0,
    carisma: 0,
  };
  document.getElementById("idade").value = p.idade || "";
  document.getElementById("altura").value = p.altura || "";
  document.getElementById("lorePersonagem").value = p.lore || "";
  document.getElementById("nivel").value = p.nivel || "";
  document.getElementById("antecedentes").value = p.antecedentes || "";
  document.getElementById("vidaMax").value = p.vidaMax ?? 50;
  document.getElementById("ca").value = p.ca ?? "";
  document.getElementById("deslocamento").value = p.deslocamento ?? 9;
  const antecedenteSelect = document.getElementById("antecedenteSelect");
  if (antecedenteSelect)
    antecedenteSelect.value = p.antecedenteSelect || p.antecedentes || "custom";
  document.getElementById("idiomas").value = p.idiomas || "";

  const resistenciasEl = document.getElementById("resistencias");
  const diarioEl = document.getElementById("diario");

  if (resistenciasEl) resistenciasEl.value = p.resistencias || "";
  diarioGeral = p.diario || "";
  diarioSessoes = Array.isArray(p.diarioSessoes) ? p.diarioSessoes : [];
  window._diarioAba = "geral";
  renderDiario();

  document.getElementById("forca").value = p.forca ?? 10;
  document.getElementById("destreza").value = p.destreza ?? 10;
  document.getElementById("constituicao").value = p.constituicao ?? 10;
  document.getElementById("inteligencia").value = p.inteligencia ?? 10;
  document.getElementById("sabedoria").value = p.sabedoria ?? 10;
  document.getElementById("carisma").value = p.carisma ?? 10;
  document.getElementById("bonusProf").value = p.bonusProf ?? 2;

  const inspiracao = document.getElementById("inspiracao");
  if (inspiracao) inspiracao.value = p.inspiracao ?? 0;

  const profExtras = document.getElementById("proficienciasExtras");
  if (profExtras) profExtras.value = p.proficienciasExtras || "";

  const dtBase = document.getElementById("dtBase");
  const dtAtributo = document.getElementById("dtAtributo");
  const dtProf = document.getElementById("dtProf");

  if (dtBase) dtBase.value = p.dtBase ?? 8;
  if (dtAtributo) dtAtributo.value = p.dtAtributo ?? 0;
  if (dtProf) dtProf.value = p.dtProf ?? 2;

    imagensPersonagem = Array.isArray(p.imagens) && p.imagens.length
    ? p.imagens
    : (p.imagem ? [{ url: p.imagem, deleteUrl: p.imagemDeleteUrl || "" }] : []);
  indiceCarrossel = 0;
  atualizarPreviewCarrossel();
  imagemOriginalBase64 = p.imagemOriginal || p.imagem || "";

  imagemPosX = p.imagemPosX ?? 50;
  imagemPosY = p.imagemPosY ?? 50;

  const preview = document.getElementById("preview");
  if (preview) {
    preview.style.objectPosition = `${imagemPosX}% ${imagemPosY}%`;
  }

  dominio = p.dominio || [false, false, false, false, false, false];
  vidaAtual = p.vidaAtual ?? 50;
  vidaTemp = p.vidaTemp ?? 0;
  inventario = p.inventario || [];
  armas = p.armas || [];
  poderes = p.poderes || [];
  profs = p.profs || {};
  armaduras = p.armaduras || [];
  mapas = p.mapas || [];
  renderMapas();
  nomeRacaCustom = p.nomeRacaCustom || "";
  atualizarNomeOpcaoCustom();
  gastosCirculos = p.gastosCirculos || {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
  };

  for (let i = 0; i <= 9; i++) {
    if (!Array.isArray(gastosCirculos[i])) {
      gastosCirculos[i] = [];
    }
    renderSlotsCirculo(i);
  }
  saves = p.saves || {};
  exaustao = p.exaustao ?? 0;
  concentracaoAtiva = p.concentracao || "";
  abasOcultas = Array.isArray(p.abasOcultas) ? p.abasOcultas : [];
  if (typeof aplicarAbasVisiveis === "function") setTimeout(aplicarAbasVisiveis, 0);
  moedas = normalizarMoedas(p.moedas);
  migrarMoedasParaBolsa();
  if (typeof pararEscutasVeiculos === "function") pararEscutasVeiculos();
  if (typeof escutarRolagensGrupo === "function") escutarRolagensGrupo(p.grupoAtivo || null);
  morte = p.morte || {
    sucessos: [false, false, false],
    falhas: [false, false, false],
  };

  renderInv();
  renderArmas();
  renderPoderes();
  atualizarTudo();
  atualizarSaves();
  atualizarBadgesSaves();
  atualizarHP();
  atualizarTemp();
  setExaustao(exaustao);
  atualizarMorte();
  atualizarDT();
  entrarFicha();
  renderAliados();
  renderDominio();
  restaurarSecoes();
  renderArmaduras();
  if (typeof renderCompanheiros === "function") {
    window._comp = window._comp || {};
    window._comp.aberto = null;
    renderCompanheiros();
  }

  setTimeout(() => {
  }, 100);
}

/* ================= SALVAR ================= */

function salvarTudo() {
  if (personagemAtual === null) return;

  const p = personagens[personagemAtual];
  if (!p) return;

  p.nome = document.getElementById("nome").value;
  p.classe = document.getElementById("classe").value;
  p.racaSelect = document.getElementById("racaSelect")?.value || "custom";
  p.raca = p.racaSelect;
  p.bonusRacaCustom = bonusRacaCustom;
  p.idade = document.getElementById("idade").value;
  p.nomeRacaCustom = nomeRacaCustom;
  p.altura = document.getElementById("altura").value;
p.nivel = document.getElementById("nivel")?.value || "";
  p.antecedentes = document.getElementById("antecedentes")?.value || "";
  p.idiomas = document.getElementById("idiomas").value;
  p.armaduras = armaduras;
  p.mapas = mapas;
  p.proficienciasExtras =
    document.getElementById("proficienciasExtras")?.value || "";
    p.imagens = imagensPersonagem;
  p.imagem = imagensPersonagem[0]?.url || imagemBase64;
  p.imagemOriginal = imagemOriginalBase64;
  p.imagemDeleteUrl = imagensPersonagem[0]?.deleteUrl || imagemDeleteUrl;
  p.imagemPosX = imagemPosX;
  p.imagemPosY = imagemPosY;
  const resistenciasEl = document.getElementById("resistencias");
  const diarioEl = document.getElementById("diario");

  p.resistencias = resistenciasEl ? resistenciasEl.value : "";
  p.diario = diarioGeral;
  p.diarioSessoes = diarioSessoes;

  p.vidaMax = get("vidaMax");
  p.vidaAtual = vidaAtual;
  p.vidaTemp = vidaTemp;
  p.ca = document.getElementById("ca").value;
  p.deslocamento = document.getElementById("deslocamento").value;

  p.forca = get("forca");
  p.destreza = get("destreza");
  p.constituicao = get("constituicao");
  p.inteligencia = get("inteligencia");
  p.sabedoria = get("sabedoria");
  p.carisma = get("carisma");
  p.bonusProf = get("bonusProf");

  p.inventario = inventario;
  p.armas = armas;
  p.poderes = poderes;
  p.gastosCirculos = gastosCirculos;
  p.profs = profs;
  p.saves = saves;
  p.exaustao = exaustao;
  p.morte = morte;
  p.concentracao = concentracaoAtiva || "";
  p.abasOcultas = abasOcultas;
  p.moedas = normalizarMoedas(moedas);
  p.dominio = dominio;

  const inspiracao = document.getElementById("inspiracao");
  const dtBase = document.getElementById("dtBase");
  const dtAtributo = document.getElementById("dtAtributo");
  const dtProf = document.getElementById("dtProf");

  p.inspiracao = inspiracao ? inspiracao.value : 0;
  p.dtBase = dtBase ? dtBase.value : 8;
  p.dtAtributo = dtAtributo ? dtAtributo.value : 0;
  p.dtProf = dtProf ? dtProf.value : 2;

  renderPersonagens();
  clearTimeout(window._debounceSalvar);
  window._debounceSalvar = setTimeout(() => {
    salvarPersonagens();
  }, 800);
}

/* ================= IMAGEM ================= */

function atualizarNomeOpcaoCustom() {
  const optionCustom = document.querySelector(
    '#racaSelect option[value="custom"]',
  );
  if (!optionCustom) return;

  optionCustom.textContent = nomeRacaCustom?.trim()
    ? nomeRacaCustom.trim()
    : "Raças Personalizadas";
}

window._perfilUidAberto = null;
window._perfilEhMeu = false;

window.abrirPerfil = async function (uid) {
  const meuUid = window.usuarioAtual.uid;
  const ehMeu = uid === meuUid;
  window._perfilUidAberto = uid;
  window._perfilEhMeu = ehMeu;

  document.getElementById("modalPerfilOverlay").style.display = "block";
  document.getElementById("modalPerfil").style.display = "block";
  document.getElementById("btnSalvarBio").style.display = "none";
  document.getElementById("perfilBioEdit").style.display = "none";
  document.getElementById("perfilBioView").style.display = "block";

  try {
    const snap = await getDoc(doc(db, "usuarios", uid));
    const d = snap.exists() ? snap.data() : {};
    window._perfilDados = d;

    document.getElementById("perfilNomeTag").innerHTML = d.nickname
      ? `${escapeHtml(d.nickname)}<span style="opacity:.5;">#${escapeHtml(d.tag)}</span>`
      : "";

    document.getElementById("perfilFundo").style.backgroundImage = d.fotoFundo ? `url('${d.fotoFundo}')` : "none";
    document.getElementById("perfilAvatar").style.backgroundImage = d.fotoPerfil ? `url('${d.fotoPerfil}')` : "none";

    const corBase = d.corBase || "#0e0907";
    const corNome = d.corNome || "#E8CC80";
    const corLinha = d.corLinha || "rgba(196,169,91,0.3)";
    const corTexto = corContraste(corBase);
    document.getElementById("modalPerfil").style.backgroundColor = corBase;
    document.getElementById("modalPerfil").style.setProperty("--perfil-linha", corLinha);
    document.getElementById("modalPerfil").style.setProperty("--perfil-texto", corTexto);
    document.getElementById("perfilNomeTag").style.color = corNome;
    document.getElementById("corBaseInput").value = corBase;
    document.getElementById("corNomeInput").value = corNome;
    document.getElementById("corLinhaInput").value = corLinha.startsWith("#") ? corLinha : "#c4a95b";
    document.getElementById("corBaseSwatch").style.background = corBase;
    document.getElementById("corNomeSwatch").style.background = corNome;
    document.getElementById("corLinhaSwatch").style.background = corLinha.startsWith("#") ? corLinha : "#c4a95b";
    document.getElementById("perfilCoresBtn").style.display = ehMeu ? "flex" : "none";
    document.getElementById("perfilCoresBox").style.display = "none";

    const bioView = document.getElementById("perfilBioView");
    bioView.textContent = d.bio || (ehMeu ? "Adicione uma bio..." : "Sem bio ainda.");
    document.getElementById("perfilBioEdit").value = d.bio || "";

    document.getElementById("btnMudarFundo").style.display = ehMeu ? "block" : "none";
    document.getElementById("btnMudarAvatar").style.display = ehMeu ? "block" : "none";
    document.getElementById("btnEscolherDestaque").style.display = ehMeu ? "block" : "none";
    bioView.onclick = ehMeu ? mostrarEditarBio : null;
    bioView.style.cursor = ehMeu ? "pointer" : "default";

    const showcase = document.getElementById("perfilShowcase");
    const destaque = d.personagensDestaque || [];
    window._perfilDestaqueAtual = destaque;
    if (destaque.length === 0) {
      showcase.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#9A8A70;font-size:12px;font-style:italic;padding:10px 0;">Nenhum personagem em destaque.</p>`;
    } else {
      showcase.innerHTML = destaque.map((f, i) => `
        <div onclick="abrirPreviewFicha(${i})" style="cursor:pointer;background:rgba(255,255,255,0.05);border:1px solid var(--perfil-linha, rgba(196,169,91,0.3));border-radius:10px;overflow:hidden;">
          <div style="height:80px;background-image:url('${f.imagem || ""}');background-size:cover;background-position:center;background-color:#1b120c;"></div>
          <div style="padding:8px;">
            <div style="font-size:12px;font-weight:bold;color:var(--perfil-texto, #F8F4E3);">${escapeHtml(f.nome || "Sem nome")}</div>
            <div style="font-size:11px;color:var(--perfil-texto, #9A8A70);opacity:.75;">${escapeHtml(f.classe || "")}${f.nivel ? " · Nv " + escapeHtml(String(f.nivel)) : ""}</div>
            ${!ehMeu && f.publica ? `<button onclick="event.stopPropagation(); pegarFichaPublica('${uid}','${f.fichaId}')" style="margin-top:6px;width:100%;padding:5px;border-radius:6px;border:none;background:#C4A95B;color:#1a0e05;font-size:11px;font-weight:bold;cursor:pointer;">Pegar</button>` : ""}
          </div>
        </div>
      `).join("");
    }
    if (typeof renderPerfilExtras === "function") renderPerfilExtras(uid, ehMeu, d);
  } catch (e) {
    console.error(e);
    alertBonito("Erro ao carregar perfil: " + (e.code || e.message));
  }
};

window.fecharPerfil = function () {
  document.getElementById("modalPerfilOverlay").style.display = "none";
  document.getElementById("modalPerfil").style.display = "none";
};

window.mostrarEditarBio = function () {
  document.getElementById("perfilBioView").style.display = "none";
  document.getElementById("perfilBioEdit").style.display = "block";
  document.getElementById("btnSalvarBio").style.display = "block";
};

window.salvarBioPerfil = async function () {
  const bio = document.getElementById("perfilBioEdit").value.trim();
  try {
    await setDoc(doc(db, "usuarios", window.usuarioAtual.uid), { bio }, { merge: true });
    window.abrirPerfil(window.usuarioAtual.uid);
  } catch (e) {
    console.error(e);
    alertBonito("Erro ao salvar bio: " + (e.code || e.message));
  }
};

window.uploadImagemPerfil = async function (input, tipo) {
  if (!input.files || !input.files[0]) return;
  try {
    const base64 = await comprimirImagem(input.files[0]);
    const resultado = await uploadImagemFirebase(base64, tipo);
    if (resultado.erro || !resultado.url) {
      	alertBonito(_mensagemErroUpload())
      return;
    }
    const campo = tipo === "fundo" ? "fotoFundo" : "fotoPerfil";
    await setDoc(doc(db, "usuarios", window.usuarioAtual.uid), { [campo]: resultado.url }, { merge: true });
    window.abrirPerfil(window.usuarioAtual.uid);
  } catch (e) {
    console.error(e);
    alertBonito("Erro ao enviar imagem: " + (e.code || e.message));
  } finally {
    input.value = "";
  }
};

window.abrirEscolherDestaque = async function () {
  document.getElementById("modalEscolherDestaqueOverlay").style.display = "block";
  document.getElementById("modalEscolherDestaque").style.display = "block";

  const lista = document.getElementById("listaEscolherDestaque");
  const fichas = window.personagens || [];
  if (fichas.length === 0) {
    lista.innerHTML = `<p style="color:#9A8A70;font-size:12px;text-align:center;">Você ainda não tem fichas.</p>`;
    return;
  }

  let idsDestaque = [];
  try {
    const snap = await getDoc(doc(db, "usuarios", window.usuarioAtual.uid));
    const destaqueAtual = (snap.exists() && snap.data().personagensDestaque) || [];
    idsDestaque = destaqueAtual.map(d => String(d.fichaId));
  } catch (e) {
    console.error(e);
  }

  lista.innerHTML = fichas.map((f, i) => {
    const jaExibida = idsDestaque.includes(String(f.id));
    return `
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(196,169,91,0.15);border-radius:10px;padding:10px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="flex:1;font-size:13px;">${escapeHtml(f.nome || "Sem nome")} <span style="color:#9A8A70;font-size:11px;">${escapeHtml(f.classe || "")}</span></span>
        <button type="button" onclick="var el=document.getElementById('opcoesFicha${i}');el.style.display = el.style.display === 'none' ? 'flex' : 'none';" style="background:none;border:none;color:#C4A95B;font-size:15px;cursor:pointer;padding:2px;">⚙</button>
      </div>
      <div id="opcoesFicha${i}" style="display:none;flex-direction:column;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(196,169,91,0.12);">
        <label style="display:flex;align-items:center;justify-content:space-between;font-size:12px;cursor:pointer;gap:8px;">
          <span>Exibir ficha</span>
          <input type="checkbox" class="checkDestaqueFicha" data-index="${i}" ${jaExibida ? "checked" : ""} style="width:auto;margin:0;">
        </label>
        <label style="display:flex;align-items:center;justify-content:space-between;font-size:12px;cursor:pointer;gap:8px;">
          <span>Permitir que a ficha seja copiada</span>
          <input type="checkbox" class="checkPublicaFicha" data-index="${i}" ${f.publica ? "checked" : ""} style="width:auto;margin:0;">
        </label>
      </div>
    </div>`;
  }).join("");
};

window.fecharEscolherDestaque = function () {
  document.getElementById("modalEscolherDestaqueOverlay").style.display = "none";
  document.getElementById("modalEscolherDestaque").style.display = "none";
};

window.salvarDestaquePerfil = async function () {
  const checksExibir = document.querySelectorAll(".checkDestaqueFicha:checked");
  if (checksExibir.length > 4) {
    alertBonito("Escolha no máximo 4 pra exibir.");
    return;
  }

  const fichas = window.personagens || [];

  document.querySelectorAll(".checkPublicaFicha").forEach(chk => {
    const i = parseInt(chk.dataset.index);
    if (fichas[i]) fichas[i].publica = chk.checked;
  });

  const destaque = Array.from(checksExibir).map(chk => {
    const f = fichas[parseInt(chk.dataset.index)];
    const arma = (f.armas || [])[0];
    const armadura = (f.armaduras || [])[0];
    const poderes = (f.poderes || []).slice(0, 3);
    return {
      fichaId: String(f.id),
      nome: f.nome || "",
      classe: f.classe || "",
      nivel: f.nivel || "",
      imagem: f.imagem || "",
      publica: !!f.publica,
      previewLore: (f.lore || "").trim().slice(0, 220),
      previewEquip: arma
        ? { tipo: "arma", nome: arma.nome || "", extra: arma.dano || "" }
        : (armadura ? { tipo: "armadura", nome: armadura.nome || "", extra: armadura.ca ? "CA " + armadura.ca : "" } : null),
      previewPoderes: poderes.map(p => p.nome || "").filter(Boolean)
    };
  });

  try {
    window.personagens = fichas;
    if (typeof salvarPersonagens === "function") await salvarPersonagens();
    await setDoc(doc(db, "usuarios", window.usuarioAtual.uid), { personagensDestaque: destaque }, { merge: true });
    window.fecharEscolherDestaque();
    window.abrirPerfil(window.usuarioAtual.uid);
  } catch (e) {
    console.error(e);
    alertBonito("Erro ao salvar: " + (e.code || e.message));
  }
};


function corContraste(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0,2), 16);
  const g = parseInt(c.substring(2,4), 16);
  const b = parseInt(c.substring(4,6), 16);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.55 ? "#1a0e05" : "#F8F4E3";
}



// ===== Color Picker custom (quadrado saturação/valor + barra de matiz) =====
let cpTargetInput = null, cpTargetSwatch = null, cpHue = 0, cpSat = 0, cpVal = 0;

function hsvToRgb(h, s, v) {
  s /= 100; v /= 100;
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  let r=0,g=0,b=0;
  if (h < 60) [r,g,b] = [c,x,0];
  else if (h < 120) [r,g,b] = [x,c,0];
  else if (h < 180) [r,g,b] = [0,c,x];
  else if (h < 240) [r,g,b] = [0,x,c];
  else if (h < 300) [r,g,b] = [x,0,c];
  else [r,g,b] = [c,0,x];
  return [Math.round((r+m)*255), Math.round((g+m)*255), Math.round((b+m)*255)];
}

function rgbToHsv(r, g, b) {
  r/=255; g/=255; b/=255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max-min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g-b)/d) % 6);
    else if (max === g) h = 60 * ((b-r)/d + 2);
    else h = 60 * ((r-g)/d + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d/max;
  return [h, s*100, max*100];
}

function rgbToHex(r,g,b){
  return "#" + [r,g,b].map(v => v.toString(16).padStart(2,"0")).join("");
}
function hexToRgb(hex){
  hex = (hex || "#000000").replace("#","");
  if (hex.length === 3) hex = hex.split("").map(c=>c+c).join("");
  const num = parseInt(hex,16) || 0;
  return [(num>>16)&255, (num>>8)&255, num&255];
}

function desenharQuadradoCP(){
  const canvas = document.getElementById("cpSquare");
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width; canvas.height = rect.height;
  const ctx = canvas.getContext("2d");
  const [r,g,b] = hsvToRgb(cpHue, 100, 100);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  const gradWhite = ctx.createLinearGradient(0,0,canvas.width,0);
  gradWhite.addColorStop(0,"rgba(255,255,255,1)");
  gradWhite.addColorStop(1,"rgba(255,255,255,0)");
  ctx.fillStyle = gradWhite;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  const gradBlack = ctx.createLinearGradient(0,0,0,canvas.height);
  gradBlack.addColorStop(0,"rgba(0,0,0,0)");
  gradBlack.addColorStop(1,"rgba(0,0,0,1)");
  ctx.fillStyle = gradBlack;
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

function desenharHueCP(){
  const canvas = document.getElementById("cpHue");
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width; canvas.height = rect.height;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0,0,canvas.width,0);
  for (let i=0;i<=360;i+=30) grad.addColorStop(i/360, `hsl(${i},100%,50%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

function atualizarHandlesCP(){
  const sqWrap = document.getElementById("cpSquareWrap");
  document.getElementById("cpSquareHandle").style.left = (cpSat/100*sqWrap.clientWidth) + "px";
  document.getElementById("cpSquareHandle").style.top = ((1-cpVal/100)*sqWrap.clientHeight) + "px";
  const hueWrap = document.getElementById("cpHueWrap");
  document.getElementById("cpHueHandle").style.left = (cpHue/360*hueWrap.clientWidth) + "px";
}

function atualizarPreviewCP(){
  const [r,g,b] = hsvToRgb(cpHue, cpSat, cpVal);
  document.getElementById("cpPreview").style.background = rgbToHex(r,g,b);
  document.getElementById("cpR").value = r;
  document.getElementById("cpG").value = g;
  document.getElementById("cpB").value = b;
  desenharQuadradoCP();
}

window.abrirColorPicker = function(targetInputId, targetSwatchId){
  cpTargetInput = targetInputId;
  cpTargetSwatch = targetSwatchId;
  const [r,g,b] = hexToRgb(document.getElementById(targetInputId).value);
  const [h,s,v] = rgbToHsv(r,g,b);
  cpHue = h; cpSat = s; cpVal = v;
  document.getElementById("colorPickerOverlay").style.display = "block";
  document.getElementById("colorPickerModal").style.display = "block";
  requestAnimationFrame(() => {
    desenharHueCP();
    desenharQuadradoCP();
    atualizarHandlesCP();
    atualizarPreviewCP();
  });
};

window.fecharColorPicker = function(){
  document.getElementById("colorPickerOverlay").style.display = "none";
  document.getElementById("colorPickerModal").style.display = "none";
};

window.confirmarColorPicker = function(){
  const [r,g,b] = hsvToRgb(cpHue, cpSat, cpVal);
  const hex = rgbToHex(r,g,b);
  if (cpTargetInput) document.getElementById(cpTargetInput).value = hex;
  if (cpTargetSwatch) document.getElementById(cpTargetSwatch).style.background = hex;
  fecharColorPicker();
};

document.addEventListener("DOMContentLoaded", function(){
  const sqWrap = document.getElementById("cpSquareWrap");
  const hueWrap = document.getElementById("cpHueWrap");
  if (!sqWrap || !hueWrap) return;

  function moverQuadrado(clientX, clientY){
    const rect = sqWrap.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    cpSat = (x/rect.width)*100;
    cpVal = (1-(y/rect.height))*100;
    atualizarHandlesCP();
    atualizarPreviewCP();
  }
  function moverHue(clientX){
    const rect = hueWrap.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    cpHue = (x/rect.width)*360;
    atualizarHandlesCP();
    atualizarPreviewCP();
  }

  let arrastandoQuad = false, arrastandoHue = false;
  sqWrap.addEventListener("pointerdown", e => { arrastandoQuad = true; moverQuadrado(e.clientX, e.clientY); sqWrap.setPointerCapture(e.pointerId); });
  sqWrap.addEventListener("pointermove", e => { if (arrastandoQuad) moverQuadrado(e.clientX, e.clientY); });
  sqWrap.addEventListener("pointerup", () => arrastandoQuad = false);
  sqWrap.addEventListener("pointercancel", () => arrastandoQuad = false);

  hueWrap.addEventListener("pointerdown", e => { arrastandoHue = true; moverHue(e.clientX); hueWrap.setPointerCapture(e.pointerId); });
  hueWrap.addEventListener("pointermove", e => { if (arrastandoHue) moverHue(e.clientX); });
  hueWrap.addEventListener("pointerup", () => arrastandoHue = false);
  hueWrap.addEventListener("pointercancel", () => arrastandoHue = false);

  ["cpR","cpG","cpB"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => {
      const r = parseInt(document.getElementById("cpR").value)||0;
      const g = parseInt(document.getElementById("cpG").value)||0;
      const b = parseInt(document.getElementById("cpB").value)||0;
      const [h,s,v] = rgbToHsv(r,g,b);
      cpHue=h; cpSat=s; cpVal=v;
      atualizarHandlesCP();
      atualizarPreviewCP();
    });
  });
});

window.salvarCoresPerfil = async function () {
  const corBase = document.getElementById("corBaseInput").value;
  const corNome = document.getElementById("corNomeInput").value;
  const corLinha = document.getElementById("corLinhaInput").value;
  try {
    await setDoc(doc(db, "usuarios", window.usuarioAtual.uid), { corBase, corNome, corLinha }, { merge: true });
    window.abrirPerfil(window.usuarioAtual.uid);
  } catch (e) {
    console.error(e);
    alertBonito("Erro ao salvar cores: " + (e.code || e.message));
  }
  
};

window.abrirPreviewFicha = function (i) {
  const f = (window._perfilDestaqueAtual || [])[i];
  if (!f) return;

  document.getElementById("previewFichaNome").textContent = f.nome || "Sem nome";

  let html = "";
  if (f.previewLore) {
    html += `<div style="border-left:2px solid rgba(196,169,91,0.35);padding-left:12px;font-style:italic;color:#cdb791;line-height:1.6;font-size:12.5px;">"${escapeHtml(f.previewLore)}${f.previewLore.length >= 220 ? "..." : ""}"</div>`;
  }
  if (f.previewEquip) {
    const icone = f.previewEquip.tipo === "arma" ? "⚔️" : "🛡️";
    const rotulo = f.previewEquip.tipo === "arma" ? "Arma" : "Armadura";
    html += `
      <div style="display:flex;align-items:flex-start;gap:10px;padding-top:14px;border-top:1px solid rgba(196,169,91,0.12);">
        <div style="width:30px;height:30px;flex-shrink:0;border-radius:50%;background:rgba(196,169,91,0.1);border:1px solid rgba(196,169,91,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">${icone}</div>
        <div>
          <div style="font-family:'Cinzel',serif;color:#E8CC80;font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">${rotulo}</div>
          <div style="color:#F8F4E3;">${escapeHtml(f.previewEquip.nome)}${f.previewEquip.extra ? ` <span style="color:#9A8A70;">— ${escapeHtml(f.previewEquip.extra)}</span>` : ""}</div>
        </div>
      </div>`;
  }
  if (f.previewPoderes && f.previewPoderes.length > 0) {
    html += `
      <div style="display:flex;align-items:flex-start;gap:10px;padding-top:14px;border-top:1px solid rgba(196,169,91,0.12);">
        <div style="width:30px;height:30px;flex-shrink:0;border-radius:50%;background:rgba(196,169,91,0.1);border:1px solid rgba(196,169,91,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">🔥</div>
        <div>
          <div style="font-family:'Cinzel',serif;color:#E8CC80;font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">Poderes</div>
          <div style="color:#F8F4E3;">${f.previewPoderes.map(p => escapeHtml(p)).join(" · ")}</div>
        </div>
      </div>`;
  }
  if (!html) {
    html = `<p style="text-align:center;color:#9A8A70;font-style:italic;">Sem itens pra mostrar ainda.</p>`;
  }

  document.getElementById("previewFichaConteudo").innerHTML = html;
  document.getElementById("modalPreviewFichaOverlay").style.display = "block";
  document.getElementById("modalPreviewFicha").style.display = "block";
};

window.fecharPreviewFicha = function () {
  document.getElementById("modalPreviewFichaOverlay").style.display = "none";
  document.getElementById("modalPreviewFicha").style.display = "none";
};

window.pegarFichaPublica = async function (donoUid, fichaId) {
  if (!(await confirmBonito("Copiar essa ficha pra sua conta?"))) return;
  try {
    const snap = await getDoc(doc(db, "usuarios", donoUid, "fichas", fichaId));
    if (!snap.exists()) {
      alertBonito("Essa ficha não está mais disponível.");
      return;
    }
    const original = snap.data();
    const copia = JSON.parse(JSON.stringify(original));
    copia.id = Date.now() + Math.floor(Math.random() * 99999);
    copia.nome = (original.nome || "Sem nome") + " (cópia)";
    copia.publica = false;

    window.personagens.push(copia);
    if (typeof salvarPersonagens === "function") salvarPersonagens();
    if (typeof renderPersonagens === "function") renderPersonagens();

    alertBonito("Ficha copiada! Ela já está na sua lista de personagens.");
  } catch (e) {
    console.error(e);
    alertBonito("Erro ao copiar ficha: " + (e.code || e.message));
  }
};

function salvarLorePersonagem() {
  const p = personagens[personagemAtual];
  if (!p) return;
  p.lore = document.getElementById("lorePersonagem").value;
  salvarTudo();
}

window.abrirAcoesMembro = function (uid, nickname, tag) {
  document.getElementById("acoesMembroNome").textContent = `${nickname}#${tag}`;

  document.getElementById("acoesMembroBtnPerfil").onclick = function () {
    fecharAcoesMembro();
    window.abrirPerfil(uid);
  };

  document.getElementById("acoesMembroBtnAmizade").onclick = function () {
    fecharAcoesMembro();
    window.enviarSolicitacaoAmizadePorUid(uid, nickname, tag);
  };

  document.getElementById("modalAcoesMembroOverlay").style.display = "block";
  document.getElementById("modalAcoesMembro").style.display = "block";
};

window.fecharAcoesMembro = function () {
  document.getElementById("modalAcoesMembroOverlay").style.display = "none";
  document.getElementById("modalAcoesMembro").style.display = "none";
};

window.enviarSolicitacaoAmizadePorUid = async function (alvoUid, alvoNickname, alvoTag) {
  const meuUid = window.usuarioAtual.uid;

  if (alvoUid === meuUid) return;

  try {
    const jaAmigo = await getDoc(doc(db, "usuarios", meuUid, "amigos", alvoUid));
    if (jaAmigo.exists()) {
      alertBonito("Vocês já são amigos.");
      return;
    }

    const meuSnap = await getDoc(doc(db, "usuarios", meuUid));
    const meuDados = meuSnap.exists() ? meuSnap.data() : {};

    await setDoc(doc(db, "usuarios", alvoUid, "solicitacoesRecebidas", meuUid), {
      deUid: meuUid,
      deNickname: meuDados.nickname || "",
      deTag: meuDados.tag || "",
      criadoEm: new Date().toISOString()
    });

    alertBonito(`Solicitação enviada pra ${alvoNickname}!`);
  } catch (e) {
    console.error(e);
    alertBonito("Erro ao enviar solicitação: " + (e.code || e.message));
  }
};

function previewImagem() {
  const input = document.getElementById("imagem");
  const preview = document.getElementById("preview");
  const nomeArquivo = document.getElementById("nome-arquivo");

  if (!input || !preview || !input.files || !input.files[0]) return;

  if (imagensPersonagem.length >= 5) {
    alertBonito("Limite de 5 fotos por personagem. Remova uma foto antes de adicionar outra.");
    input.value = "";
    return;
  }

  const file = input.files[0];
  if (nomeArquivo) nomeArquivo.innerText = "Enviando imagem...";

  const reader = new FileReader();
  reader.onload = async function (e) {
    const base64Local = e.target.result;

    const resultado = await uploadImagemFirebase(base64Local, `personagens/${Date.now()}.jpg`);
    if (resultado.erro || !resultado.url) {
      if (nomeArquivo) nomeArquivo.innerText = "Falha ao enviar imagem";
      alertBonito(_mensagemErroUpload("A foto não foi adicionada."))
      input.value = "";
      return;
    }

    imagensPersonagem.push({ url: resultado.url, deleteUrl: resultado.deleteUrl || "" });
    indiceCarrossel = imagensPersonagem.length - 1;
    imagemOriginalBase64 = resultado.url;
    imagemPosX = 50;
    imagemPosY = 50;
    atualizarPreviewCarrossel();
    _atualizarConteudoPopupFoto();

    salvarTudo();
    renderPersonagens();
    input.value = "";
  };

  reader.readAsDataURL(file);
}

let editorZoom = 1;
let editorOffsetX = 0;
let editorOffsetY = 0;
let editorDragging = false;
let editorLastX = 0;
let editorLastY = 0;
let editorImg = new Image();

function abrirEditorImagem() {
  if (!imagemBase64) {
    alertBonito("Escolha uma imagem primeiro.");
    return;
  }

  const editorWrap = document.getElementById("editorImagemInline");
  if (!editorWrap) return;

  editorZoom = 1;
  editorOffsetX = 0;
  editorOffsetY = 0;
  document.getElementById("editorZoom").value = 1;

  editorImg = new Image();
  editorImg.crossOrigin = "anonymous";
  editorImg.onload = function () {
    desenharEditorCanvas();
    ativarDragEditorCanvas();
  };
  editorImg.onerror = function () {
    alertBonito("Não foi possível carregar a imagem para edição. Tente escolher a imagem novamente.");
  };
  editorImg.src = imagemOriginalBase64 || imagemBase64;

  editorWrap.classList.remove("fechado");
}

function desenharEditorCanvas() {
  const canvas = document.getElementById("editorCanvas");
  if (!canvas || !editorImg.width) return;

  const size = canvas.offsetWidth;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  const scale = editorZoom;
  const imgW = editorImg.width * scale;
  const imgH = editorImg.height * scale;

  const baseScale = Math.max(size / editorImg.width, size / editorImg.height);
  const finalW = editorImg.width * baseScale * editorZoom;
  const finalH = editorImg.height * baseScale * editorZoom;

  const x = size / 2 - finalW / 2 + editorOffsetX;
  const y = size / 2 - finalH / 2 + editorOffsetY;

  ctx.drawImage(editorImg, x, y, finalW, finalH);
}

function atualizarZoomEditor() {
  editorZoom = parseFloat(document.getElementById("editorZoom").value);
  desenharEditorCanvas();
}

function ativarDragEditorCanvas() {
  const canvas = document.getElementById("editorCanvas");
  if (!canvas) return;

  canvas.onmousedown = (e) => { editorDragging = true; editorLastX = e.clientX; editorLastY = e.clientY; };
  document.onmousemove = (e) => {
    if (!editorDragging) return;
    editorOffsetX += e.clientX - editorLastX;
    editorOffsetY += e.clientY - editorLastY;
    editorLastX = e.clientX;
    editorLastY = e.clientY;
    desenharEditorCanvas();
  };
  document.onmouseup = () => { editorDragging = false; };

  let editorPinchDist = null;

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      editorDragging = true;
      editorLastX = e.touches[0].clientX;
      editorLastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      editorPinchDist = Math.hypot(dx, dy);
    }
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && editorDragging) {
      editorOffsetX += e.touches[0].clientX - editorLastX;
      editorOffsetY += e.touches[0].clientY - editorLastY;
      editorLastX = e.touches[0].clientX;
      editorLastY = e.touches[0].clientY;
      desenharEditorCanvas();
    } else if (e.touches.length === 2 && editorPinchDist !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const novaDist = Math.hypot(dx, dy);
      const delta = novaDist / editorPinchDist;
      editorPinchDist = novaDist;
      editorZoom = Math.min(3, Math.max(0.5, editorZoom * delta));
      document.getElementById("editorZoom").value = editorZoom;
      desenharEditorCanvas();
    }
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (e.touches.length === 0) {
      editorDragging = false;
      editorPinchDist = null;
    }
  }, { passive: false });
}

function fecharEditorImagem() {
  const editorWrap = document.getElementById("editorImagemInline");
  if (editorWrap) {
    editorWrap.classList.add("fechado");
  }
}

async function salvarEditorImagem() {
  const canvas = document.getElementById("editorCanvas");
  if (!canvas) return;

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = 400;
  outputCanvas.height = 400;
  const ctx = outputCanvas.getContext("2d");

  const size = canvas.width;

  ctx.drawImage(canvas, 0, 0, size, size, 0, 0, 400, 400);

  const base64Local = outputCanvas.toDataURL("image/jpeg", 0.9);

  const preview = document.getElementById("preview");
  if (preview) {
    preview.src = base64Local;
    preview.style.objectPosition = "50% 50%";
  }

  const resultado = await uploadImagemFirebase(base64Local, `personagens/${Date.now()}.jpg`);
  if (resultado.erro || !resultado.url) {
    alertBonito(_mensagemErroUpload("A imagem anterior foi mantida."))
    return;
  }
    imagemBase64 = resultado.url;
  imagemDeleteUrl = resultado.deleteUrl || "";
  // não sobrescreve imagemOriginalBase64 — mantém original para reedição

  if (imagensPersonagem[indiceCarrossel]) {
    imagensPersonagem[indiceCarrossel] = { url: resultado.url, deleteUrl: resultado.deleteUrl || "" };
  }

  salvarTudo();
  renderPersonagens();
  fecharEditorImagem();
}


function atualizarPreviewCarrossel() {
  const preview = document.getElementById("preview");
  const contador = document.getElementById("carrosselContador");
  const dots = document.getElementById("carrosselDots");
  const btnAnterior = document.getElementById("carrosselAnterior");
  const btnProximo = document.getElementById("carrosselProximo");

  const total = imagensPersonagem.length;
  const atual = imagensPersonagem[indiceCarrossel] || null;

  imagemBase64 = atual?.url || "";
  imagemDeleteUrl = atual?.deleteUrl || "";

  if (preview) {
    preview.src = imagemBase64;
    preview.style.objectPosition = `${imagemPosX}% ${imagemPosY}%`;
  }
  if (contador) contador.textContent = total ? `${indiceCarrossel + 1}/${total}` : "";

  if (btnAnterior) btnAnterior.style.display = total > 1 ? "flex" : "none";
  if (btnProximo) btnProximo.style.display = total > 1 ? "flex" : "none";

  if (dots) {
    dots.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const dot = document.createElement("span");
      dot.style.cssText = `width:8px;height:8px;border-radius:50%;cursor:pointer;background:${i === indiceCarrossel ? "#C4A95B" : "rgba(196,169,91,0.3)"};`;
      dot.onclick = () => { indiceCarrossel = i; atualizarPreviewCarrossel(); };
      dots.appendChild(dot);
    }
  }
}

function trocarFotoCarrossel(delta) {
  const total = imagensPersonagem.length;
  if (total <= 1) return;
  indiceCarrossel = (indiceCarrossel + delta + total) % total;
  atualizarPreviewCarrossel();
}

(function ativarSwipeCarrosselPersonagem() {
  function iniciar() {
    const wrapper = document.getElementById("carrosselWrapper");
    if (!wrapper) return;
    let inicioX = 0;

    wrapper.addEventListener("touchstart", (e) => {
      inicioX = e.touches[0].clientX;
    }, { passive: true });

    wrapper.addEventListener("touchend", (e) => {
      const fimX = e.changedTouches[0].clientX;
      const diff = fimX - inicioX;
      if (Math.abs(diff) > 40) {
        trocarFotoCarrossel(diff < 0 ? 1 : -1);
        _ultimoSwipeCarrossel = Date.now();
      }
    }, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();


function aoClicarFotoPersonagem() {
  if (Date.now() - _ultimoSwipeCarrossel < 300) return; // evita abrir popup logo após um swipe
  abrirPopupFotoPersonagem();
}

function abrirPopupFotoPersonagem() {
  abrirPopup("Fotos do personagem", _htmlPopupFotoPersonagem(), true, null);
}

function _htmlPopupFotoPersonagem() {
  const total = imagensPersonagem.length;
  const atual = imagensPersonagem[indiceCarrossel];

  const dotsHtml = Array.from({ length: total }).map((_, i) => `
    <span onclick="irParaFotoPopup(${i})" style="width:9px;height:9px;border-radius:50%;cursor:pointer;display:inline-block;background:${i === indiceCarrossel ? "#C4A95B" : "rgba(196,169,91,0.3)"};"></span>
  `).join("");

  return `
    <div style="text-align:center;">
      ${atual ? `
      <div style="position:relative;display:inline-block;max-width:100%;">
        <img src="${atual.url}" style="max-width:100%;max-height:55vh;border-radius:10px;object-fit:contain;" />

        ${total > 1 ? `
        <button type="button" onclick="trocarFotoCarrosselPopup(-1)" style="position:absolute;left:6px;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;border:none;background:rgba(0,0,0,0.6);color:#fff;font-size:18px;cursor:pointer;">‹</button>
        <button type="button" onclick="trocarFotoCarrosselPopup(1)" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;border:none;background:rgba(0,0,0,0.6);color:#fff;font-size:18px;cursor:pointer;">›</button>
        ` : ""}
      </div>
      <div style="display:flex;gap:6px;justify-content:center;margin-top:10px;">${dotsHtml}</div>
      ` : `<p style="color:#9A8A70;padding:20px 0;">Nenhuma foto ainda.</p>`}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px;">
        <button class="popup-salvar-btn" style="margin:0;" onclick="fecharPopup(); abrirEditorImagem();" ${total === 0 ? "disabled" : ""}>Ajustar imagem</button>
        <button class="popup-salvar-btn" style="margin:0;" onclick="document.getElementById('imagem').click()">+ Adicionar foto</button>
        <button class="popup-salvar-btn" style="grid-column:1 / -1;margin:0;background:rgba(139,26,26,0.75);" onclick="removerFotoCarrosselPopup()" ${total === 0 ? "disabled" : ""}>🗑 Remover esta foto</button>
      </div>
    </div>
  `;
}

function _atualizarConteudoPopupFoto() {
  const textoEl = document.getElementById("popup-texto");
  if (textoEl) textoEl.innerHTML = _htmlPopupFotoPersonagem();
}

function trocarFotoCarrosselPopup(delta) {
  trocarFotoCarrossel(delta);
  _atualizarConteudoPopupFoto();
}

function irParaFotoPopup(i) {
  indiceCarrossel = i;
  atualizarPreviewCarrossel();
  _atualizarConteudoPopupFoto();
}

async function removerFotoCarrosselPopup() {
  const total = imagensPersonagem.length;
  if (total === 0) return;

  const confirmar = await confirmBonito("Remover esta foto?");
  if (!confirmar) return;

    const foto = imagensPersonagem[indiceCarrossel];
  if (foto?.deleteUrl?.startsWith("https://")) {
    try {
      await fetch("https://ficha-ignea-upload.fichaignea.workers.dev/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteUrl: foto.deleteUrl }),
      });
    } catch (e) { console.warn("Erro ao deletar imagem do ImgBB:", e); }
  }

  imagensPersonagem.splice(indiceCarrossel, 1);
  if (indiceCarrossel >= imagensPersonagem.length) {
    indiceCarrossel = Math.max(0, imagensPersonagem.length - 1);
  }

  atualizarPreviewCarrossel();
  salvarTudo();
  renderPersonagens();
  _atualizarConteudoPopupFoto();
}


/* ================= DIÁRIO (Geral + Sessões) ================= */

let diarioGeral = "";
let diarioSessoes = [];
window._diarioAba = "geral";

function renderDiario() {
  const abas = document.getElementById("diarioAbas");
  const dica = document.getElementById("diarioDica");
  const area = document.getElementById("diario");
  if (!abas || !area) return;

  let atual = diarioSessoes.find((s) => s.id === window._diarioAba);
  if (!atual) window._diarioAba = "geral";

  abas.innerHTML =
    `<button type="button" class="diario-aba ${window._diarioAba === "geral" ? "ativa" : ""}" onclick="trocarAbaDiario('geral')">Geral</button>` +
    diarioSessoes
      .map(
        (s, i) =>
          `<button type="button" class="diario-aba ${s.id === window._diarioAba ? "ativa" : ""}" onclick="trocarAbaDiario('${s.id}')">${esc(s.titulo || "Sessão " + (i + 1))}</button>`,
      )
      .join("") +
    `<button type="button" class="diario-aba diario-aba-nova" onclick="novaSessaoDiario()">+ Sessão</button>`;

  if (window._diarioAba === "geral") {
    dica.innerHTML = `<span>Anotações gerais: coisas rápidas que valem para a campanha toda.</span>`;
    area.value = diarioGeral;
    area.placeholder = "Escreva aqui seu diário, anotações, pistas, missões, nomes, eventos...";
  } else {
    const i = diarioSessoes.indexOf(atual);
    dica.innerHTML = `
      <span>${esc(atual.titulo || "Sessão " + (i + 1))}${atual.data ? " · " + esc(atual.data) : ""}</span>
      <span class="diario-dica-acoes">
        <button type="button" onclick="renomearSessaoDiario()" title="Renomear"><i class="ti ti-pencil"></i></button>
        <button type="button" onclick="apagarSessaoDiario()" title="Apagar sessão"><i class="ti ti-trash"></i></button>
      </span>`;
    area.value = atual.texto || "";
    area.placeholder = "O que aconteceu nessa sessão?";
  }
}

function trocarAbaDiario(id) {
  window._diarioAba = id;
  renderDiario();
}

function aoDigitarDiario() {
  const texto = document.getElementById("diario")?.value || "";
  if (window._diarioAba === "geral") {
    diarioGeral = texto;
  } else {
    const s = diarioSessoes.find((x) => x.id === window._diarioAba);
    if (s) s.texto = texto;
  }
  salvarTudo();
}

function novaSessaoDiario() {
  const nova = {
    id: "ses_" + Date.now().toString(36),
    titulo: "Sessão " + (diarioSessoes.length + 1),
    data: new Date().toLocaleDateString("pt-BR"),
    texto: "",
  };
  diarioSessoes.push(nova);
  window._diarioAba = nova.id;
  renderDiario();
  salvarTudo();
  document.getElementById("diario")?.focus();
}

async function renomearSessaoDiario() {
  const s = diarioSessoes.find((x) => x.id === window._diarioAba);
  if (!s) return;
  const nome = await promptBonito("Nome da sessão:", s.titulo || "");
  if (nome === null) return;
  s.titulo = nome.trim() || s.titulo;
  renderDiario();
  salvarTudo();
}

async function apagarSessaoDiario() {
  const s = diarioSessoes.find((x) => x.id === window._diarioAba);
  if (!s) return;
  if (!(await confirmBonito(`Apagar "${s.titulo || "essa sessão"}" e tudo que foi escrito nela?`))) return;
  diarioSessoes = diarioSessoes.filter((x) => x !== s);
  window._diarioAba = "geral";
  renderDiario();
  salvarTudo();
}

/* ================= INVENTÁRIO ================= */

async function addItem() {
  const nome = document.getElementById("itemNome")?.value.trim();
  const desc = document.getElementById("itemDesc")?.value.trim();
  const qtd = parseInt(document.getElementById("itemQtd")?.value) || 1;
  const requerSintonia =
    !!document.getElementById("itemRequerSintonia")?.checked;
  const sintonizado =
    requerSintonia && !!document.getElementById("itemSintonizado")?.checked;

  if (!nome) return;

  let imagemUrl = editandoItem >= 0 ? inventario[editandoItem]?.imagemUrl || "" : "";
  let imagemDeleteUrl = editandoItem >= 0 ? inventario[editandoItem]?.imagemDeleteUrl || "" : "";

  if (itemImagemBase64Temp === "REMOVIDA") {
    imagemUrl = "";
    imagemDeleteUrl = "";
  } else if (itemImagemBase64Temp) {
    const resultado = await uploadImagemFirebase(itemImagemBase64Temp, "item");
    if (resultado.erro || !resultado.url) {
      alertBonito(_mensagemErroUpload("O item foi salvo sem imagem."))
    } else {
      imagemUrl = resultado.url;
      imagemDeleteUrl = resultado.deleteUrl;
    }
  }

  const bolsa = !!document.getElementById("itemBolsa")?.checked;
  const recipiente = !bolsa && !!document.getElementById("itemRecipiente")?.checked;
  const dentroDe = recipiente ? "" : (document.getElementById("itemDentroDe")?.value || "");

  const novoItem = {
    bolsa,
    ...(bolsa ? { moedas: normalizarMoedas(editandoItem >= 0 ? inventario[editandoItem]?.moedas : {}) } : {}),
    modificacoes: consumirModsTemp("item"),
    id: editandoItem >= 0 ? (inventario[editandoItem]?.id || gerarIdItem()) : gerarIdItem(),
    nome,
    desc,
    qtd,
    requerSintonia,
    sintonizado,
    imagemUrl,
    imagemDeleteUrl,
    recipiente,
    dentroDe,
  };

  if (editandoItem >= 0) {
    inventario[editandoItem] = novoItem;
    editandoItem = -1;
  } else {
    inventario.push(novoItem);
  }

  if (dentroDe) window._mochilasFechadas.delete(dentroDe);

  document.getElementById("itemNome").value = "";
  document.getElementById("itemDesc").value = "";
  document.getElementById("itemQtd").value = "";
  document.getElementById("itemRequerSintonia").checked = false;
  document.getElementById("itemSintonizado").checked = false;
  document.getElementById("boxItemSintonizado").style.display = "none";
  const recipienteEl = document.getElementById("itemRecipiente");
  if (recipienteEl) recipienteEl.checked = false;
  const bolsaEl = document.getElementById("itemBolsa");
  if (bolsaEl) bolsaEl.checked = false;

  renderInv();
  salvarTudo();

  document.getElementById("itemImagem").value = "";
  document.getElementById("itemImagemPreview").style.display = "none";
  itemImagemBase64Temp = "";
}

function previewItemImagem() {
  _previewImagemGenerica("itemImagem", "itemImagemPreview", v => itemImagemBase64Temp = v);
}

function removerImagemItem() {
  itemImagemBase64Temp = "REMOVIDA";
  const preview = document.getElementById("itemImagemPreview");
  const input = document.getElementById("itemImagem");
  if (preview) { preview.style.display = "none"; preview.src = ""; }
  if (input) input.value = "";
}

function previewEditItemImagem() {
  _previewImagemGenerica("editItemImagem", "editItemImagemPreview", v => editItemImagemBase64Temp = v);
}

function removerEditImagemItem() {
  editItemImagemBase64Temp = "REMOVIDA";
  const preview = document.getElementById("editItemImagemPreview");
  const input = document.getElementById("editItemImagem");
  if (preview) { preview.style.display = "none"; preview.src = ""; }
  if (input) input.value = "";
}

function previewArmaImagem() {
  _previewImagemGenerica("armaImagem", "armaImagemPreview", v => armaImagemBase64Temp = v);
}

function removerImagemArma() {
  armaImagemBase64Temp = "REMOVIDA";
  const preview = document.getElementById("armaImagemPreview");
  const input = document.getElementById("armaImagem");
  if (preview) { preview.style.display = "none"; preview.src = ""; }
  if (input) input.value = "";
}

function previewEditArmaImagem() {
  _previewImagemGenerica("editArmaImagem", "editArmaImagemPreview", v => editArmaImagemBase64Temp = v);
}

function removerEditImagemArma() {
  editArmaImagemBase64Temp = "REMOVIDA";
  const preview = document.getElementById("editArmaImagemPreview");
  const input = document.getElementById("editArmaImagem");
  if (preview) { preview.style.display = "none"; preview.src = ""; }
  if (input) input.value = "";
}

function previewArmaduraImagem() {
  _previewImagemGenerica("armaduraImagem", "armaduraImagemPreview", v => armaduraImagemBase64Temp = v);
}

function previewAliadoImagem() {
  _previewImagemGenerica(
    "aliadoImagem",
    "aliadoImagemPreview",
    v => {
      aliadoImagemBase64Temp = v;
    }
  );
}

function removerImagemAliado() {
  aliadoImagemBase64Temp = "REMOVIDA";

  const preview =
    document.getElementById("aliadoImagemPreview");

  const input =
    document.getElementById("aliadoImagem");

  if (preview) {
    preview.style.display = "none";
    preview.src = "";
  }

  if (input) {
    input.value = "";
  }
}

function removerImagemArmadura() {
  armaduraImagemBase64Temp = "REMOVIDA";
  const preview = document.getElementById("armaduraImagemPreview");
  const input = document.getElementById("armaduraImagem");
  if (preview) { preview.style.display = "none"; preview.src = ""; }
  if (input) input.value = "";
}

function previewEditArmaduraImagem() {
  _previewImagemGenerica("editArmaduraImagem", "editArmaduraImagemPreview", v => editArmaduraImagemBase64Temp = v);
}

function removerEditImagemArmadura() {
  editArmaduraImagemBase64Temp = "REMOVIDA";
  const preview = document.getElementById("editArmaduraImagemPreview");
  const input = document.getElementById("editArmaduraImagem");
  if (preview) { preview.style.display = "none"; preview.src = ""; }
  if (input) input.value = "";
}

function toggleSintoniaItem() {
  const requer = document.getElementById("itemRequerSintonia");
  const box = document.getElementById("boxItemSintonizado");
  const sintonizado = document.getElementById("itemSintonizado");

  if (!requer || !box || !sintonizado) return;

  if (requer.checked) {
    box.style.display = "block";
  } else {
    box.style.display = "none";
    sintonizado.checked = false;
  }
}

/* ================= MOCHILAS / RECIPIENTES ================= */

// mochilas fechadas na tela (só visual, não salva)
window._mochilasFechadas = window._mochilasFechadas || new Set();

function gerarIdItem() {
  return "it_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// itens antigos não têm id; dá um pra cada (é salvo junto na próxima vez que a ficha salvar)
function garantirIdsInventario() {
  inventario.forEach((item) => {
    if (item && !item.id) item.id = gerarIdItem();
  });
}

function recipientesInventario(excluirId) {
  return inventario.filter((i) => i && i.recipiente && i.id !== excluirId);
}

function filhosDoRecipiente(id) {
  return inventario.filter((i) => i && i.dentroDe === id);
}

// item está guardado numa mochila que ainda existe?
function estaGuardado(item) {
  return !!item.dentroDe && inventario.some((i) => i.id === item.dentroDe && i.recipiente);
}

function opcoesGuardarEmHTML(selecionado, excluirId) {
  const mochilas = recipientesInventario(excluirId);
  return (
    `<option value="">Solto no inventário</option>` +
    mochilas
      .map(
        (m) =>
          `<option value="${esc(m.id)}" ${m.id === selecionado ? "selected" : ""}>Guardar em: ${esc(m.nome || "Sem nome")}</option>`,
      )
      .join("")
  );
}

// formulário de adicionar: só mostra "guardar em" se existir alguma mochila e o item não for uma
function atualizarCampoGuardarEm() {
  const box = document.getElementById("boxItemGuardarEm");
  const select = document.getElementById("itemDentroDe");
  const ehRecipiente = !!document.getElementById("itemRecipiente")?.checked;
  if (!box || !select) return;

  const valorAtual = select.value;
  select.innerHTML = opcoesGuardarEmHTML(valorAtual);
  const temMochila = recipientesInventario().length > 0;
  box.style.display = temMochila && !ehRecipiente ? "block" : "none";
  if (ehRecipiente) select.value = "";
}

function cardItemInvHTML(item, index, guardado) {
  if (item.bolsa) return cardBolsaHTML(item, index);
  const filhos = item.recipiente ? filhosDoRecipiente(item.id) : [];
  const fechada = window._mochilasFechadas.has(item.id);
  const temMochila = recipientesInventario().length > 0;

  const badge = item.recipiente
    ? `<span class="item-qtd-badge mochila-contador">${filhos.length} ${filhos.length === 1 ? "item" : "itens"}</span>`
    : `<span class="item-qtd-badge">x${item.qtd || 1}</span>`;

  const botaoMover = item.recipiente
    ? ""
    : guardado
      ? `<button type="button" class="card-ico" title="Tirar da mochila" onclick="event.stopPropagation(); moverItemParaRecipiente(${index}, '')"><i class="ti ti-arrow-bar-up"></i></button>`
      : temMochila
        ? `<button type="button" class="card-ico" title="Guardar em uma mochila" onclick="event.stopPropagation(); abrirGuardarItem(${index})"><i class="ti ti-backpack"></i></button>`
        : "";

  return `
      <button type="button" class="drag-handle" aria-label="Arrastar para reordenar">⠿</button>

      <div class="item-info" onclick="verItem(${index})">
        <div class="item-topo-linha">
          <strong class="item-nome">
            ${item.recipiente ? `<i class="ti ti-backpack mochila-icone"></i>` : ""}
            ${item.nome ? esc(item.nome) : "Sem nome"}
            ${item.requerSintonia ? `<span class="item-tag-sintonia ${item.sintonizado ? "ativo" : ""}">${item.sintonizado ? "Sintonizado" : "Requer sintonia"}</span>` : ""}
          </strong>

          ${badge}
        </div>

        ${modsChipsHTML(item.modificacoes)}

        ${
          item.recipiente && !item.desc
            ? ""
            : `<p class="item-preview">
          ${item.desc ? esc(item.desc).substring(0, 60) + (item.desc.length > 60 ? "..." : "") : "Sem descrição"}
        </p>`
        }
      </div>

      <div class="card-acoes-ico">
        ${botaoMover}
        <button type="button" class="card-ico" title="Dar para outro jogador" onclick="event.stopPropagation(); window.abrirDarItem('inventario', ${index})"><i class="ti ti-gift"></i></button>
      </div>

      ${
        item.recipiente
          ? `<button type="button" class="mochila-toggle" onclick="event.stopPropagation(); toggleMochila('${esc(item.id)}')">
              <span>${fechada ? "Ver o que tem dentro" : "Esconder conteúdo"}</span>
              <i class="ti ${fechada ? "ti-chevron-down" : "ti-chevron-up"}"></i>
            </button>`
          : ""
      }
    `;
}

function cardRecipienteHTML(item, index) {
  const filhos = [];
  inventario.forEach((f, i) => { if (f && f.dentroDe === item.id) filhos.push({ f, i }); });
  const unidades = filhos.reduce((soma, { f }) => soma + (parseInt(f.qtd) || 1), 0);

  const MAX_CHIPS = 4;
  const extras = filhos.length - MAX_CHIPS;
  const chips = filhos.length
    ? filhos
        .slice(0, MAX_CHIPS)
        .map(
          ({ f, i }) =>
            `<button type="button" class="recipiente-chip" onclick="event.stopPropagation(); verItem(${i})">${esc(f.nome || "Sem nome")}${(parseInt(f.qtd) || 1) > 1 ? ` <small>x${f.qtd}</small>` : ""}</button>`,
        )
        .join("") +
      (extras > 0
        ? `<button type="button" class="recipiente-chip recipiente-chip-mais" title="Ver tudo" onclick="event.stopPropagation(); abrirMochila(${index})">+${extras}</button>`
        : "")
    : `<span class="recipiente-vazio">Vazia</span>`;

  return `
    <div class="recipiente-topo">
      <i class="ti ti-backpack recipiente-icone"></i>
      <strong class="recipiente-nome">${esc(item.nome || "Sem nome")}</strong>
      <button type="button" class="recipiente-remover" title="Remover" onclick="event.stopPropagation(); removerItem(${index})"><i class="ti ti-x"></i></button>
    </div>

    <div class="recipiente-stats">
      <span><i class="ti ti-stack-2"></i> ${filhos.length} ${filhos.length === 1 ? "item" : "itens"}</span>
      <span><i class="ti ti-packages"></i> ${unidades} ${unidades === 1 ? "unidade" : "unidades"}</span>
    </div>

    <div class="recipiente-chips">${chips}</div>
  `;
}

function renderInv() {
  const ul = document.getElementById("lista");
  if (!ul) return;

  garantirIdsInventario();
  ul.innerHTML = "";

  // itens soltos (o que está numa mochila aparece só como etiqueta dentro dela)
  inventario.forEach((item, index) => {
    if (!item || item.recipiente || estaGuardado(item)) return;

    const li = document.createElement("li");
    li.className = "item-card" + (item.bolsa ? " bolsa-card" : "");
    li.dataset.index = index;
    li.innerHTML = cardItemInvHTML(item, index, false);
    ul.appendChild(li);
  });

  habilitarArrastarReordenar(ul, inventario, renderInv);

  // recipientes
  const ulRec = document.getElementById("listaRecipientes");
  const secaoRec = document.getElementById("secaoRecipientes");
  if (ulRec) {
    ulRec.innerHTML = "";
    inventario.forEach((item, index) => {
      if (!item || !item.recipiente) return;
      const li = document.createElement("li");
      li.className = "recipiente-card";
      li.onclick = () => abrirMochila(index);
      li.innerHTML = cardRecipienteHTML(item, index);
      ulRec.appendChild(li);
    });
    if (secaoRec) secaoRec.style.display = ulRec.children.length ? "block" : "none";
  }

  atualizarCampoGuardarEm();
  if (typeof renderBolsaMoedas === "function") renderBolsaMoedas();
}

/* ---------- painel da mochila (igual ao da ficha de Ordem) ---------- */

window._mochilaSelecao = null; // null = modo normal; Set de índices = modo "tirar vários"

function abrirMochila(index, manterSelecao) {
  const mochila = inventario[index];
  if (!mochila || !mochila.recipiente) return;
  if (!manterSelecao) window._mochilaSelecao = null;
  const selecao = window._mochilaSelecao;

  const filhos = [];
  inventario.forEach((f, i) => { if (f && f.dentroDe === mochila.id) filhos.push({ f, i }); });
  const unidades = filhos.reduce((soma, { f }) => soma + (parseInt(f.qtd) || 1), 0);

  const linhas = filhos.length
    ? filhos
        .map(({ f, i }) => {
          const marcado = selecao && selecao.has(i);
          const meta = [`<i class="ti ti-packages"></i> ${parseInt(f.qtd) || 1}`]
            .concat(f.requerSintonia ? [f.sintonizado ? "Sintonizado" : "Requer sintonia"] : [])
            .join(" · ");
          return `
          <div class="mochila-linha ${marcado ? "selecionada" : ""}" onclick="${selecao ? `alternarSelecaoMochila(${index}, ${i})` : `verItem(${i})`}">
            ${selecao ? `<span class="sel-check ${marcado ? "ativo" : ""}"><i class="ti ti-check"></i></span>` : ""}
            <div class="mochila-linha-info">
              <strong>${esc(f.nome || "Sem nome")}</strong>
              <small>${meta}</small>
            </div>
            ${selecao ? "" : `<button type="button" class="mochila-btn-tirar" onclick="event.stopPropagation(); tirarDaMochila(${index}, [${i}])">Tirar</button>`}
          </div>`;
        })
        .join("")
    : `<p class="mochila-vazia">Nada aqui dentro ainda. Use "Colocar item".</p>`;

  const barra = selecao
    ? `<div class="mochila-acoes">
         <button type="button" onclick="cancelarSelecaoMochila(${index})">Cancelar</button>
         <button type="button" class="destaque" onclick="tirarSelecionadosMochila(${index})" ${selecao.size ? "" : "disabled"}>Tirar ${selecao.size || ""}</button>
       </div>`
    : `<div class="mochila-acoes">
         <button type="button" onclick="abrirColocarItens(${index})"><i class="ti ti-plus"></i> Colocar item</button>
         <button type="button" onclick="iniciarSelecaoMochila(${index})" ${filhos.length ? "" : "disabled"}>Tirar vários</button>
         <button type="button" onclick="editarItem(${index})"><i class="ti ti-pencil"></i> Editar</button>
       </div>`;

  const html = `
    <div class="mochila-painel">
      <div class="mochila-resumo">
        <i class="ti ti-backpack"></i>
        ${filhos.length} ${filhos.length === 1 ? "item" : "itens"} dentro · ${unidades} ${unidades === 1 ? "unidade" : "unidades"}
      </div>
      ${mochila.desc ? `<p class="mochila-desc">${esc(mochila.desc)}</p>` : ""}
      ${barra}
      <div class="mochila-lista">${linhas}</div>
    </div>`;

  abrirPopup(mochila.nome || "Mochila", html, true, null);
}

function iniciarSelecaoMochila(index) {
  window._mochilaSelecao = new Set();
  abrirMochila(index, true);
}

function cancelarSelecaoMochila(index) {
  window._mochilaSelecao = null;
  abrirMochila(index);
}

function alternarSelecaoMochila(index, iItem) {
  const sel = window._mochilaSelecao;
  if (!sel) return;
  if (sel.has(iItem)) sel.delete(iItem); else sel.add(iItem);
  abrirMochila(index, true);
}

function tirarSelecionadosMochila(index) {
  const sel = window._mochilaSelecao;
  if (!sel || !sel.size) return;
  tirarDaMochila(index, [...sel]);
}

function tirarDaMochila(index, indices) {
  indices.forEach((i) => { if (inventario[i]) inventario[i].dentroDe = ""; });
  window._mochilaSelecao = null;
  renderInv();
  salvarTudo();
  abrirMochila(index);
}

// escolher vários itens soltos pra colocar na mochila
window._colocarSelecao = new Set();

function abrirColocarItens(index) {
  const mochila = inventario[index];
  if (!mochila) return;
  const sel = window._colocarSelecao;

  const soltos = [];
  inventario.forEach((f, i) => { if (f && !f.recipiente && !estaGuardado(f)) soltos.push({ f, i }); });

  const linhas = soltos.length
    ? soltos
        .map(({ f, i }) => `
          <div class="mochila-linha ${sel.has(i) ? "selecionada" : ""}" onclick="alternarColocarItem(${index}, ${i})">
            <span class="sel-check ${sel.has(i) ? "ativo" : ""}"><i class="ti ti-check"></i></span>
            <div class="mochila-linha-info">
              <strong>${esc(f.nome || "Sem nome")}</strong>
              <small><i class="ti ti-packages"></i> ${parseInt(f.qtd) || 1}</small>
            </div>
          </div>`)
        .join("")
    : `<p class="mochila-vazia">Não há itens soltos no inventário.</p>`;

  const todosMarcados = soltos.length && soltos.every(({ i }) => sel.has(i));

  const html = `
    <div class="mochila-painel">
      <div class="mochila-acoes">
        <button type="button" onclick="voltarDoColocar(${index})"><i class="ti ti-arrow-left"></i> Voltar</button>
        ${soltos.length ? `<button type="button" onclick="marcarTodosColocar(${index}, ${todosMarcados ? "false" : "true"})">${todosMarcados ? "Desmarcar todos" : "Marcar todos"}</button>` : ""}
        <button type="button" class="destaque" onclick="confirmarColocarItens(${index})" ${sel.size ? "" : "disabled"}>Colocar ${sel.size || ""}</button>
      </div>
      <div class="mochila-lista">${linhas}</div>
    </div>`;

  abrirPopup(`Colocar em ${mochila.nome || "mochila"}`, html, true, null);
}

function alternarColocarItem(index, iItem) {
  const sel = window._colocarSelecao;
  if (sel.has(iItem)) sel.delete(iItem); else sel.add(iItem);
  abrirColocarItens(index);
}

function marcarTodosColocar(index, marcar) {
  const sel = window._colocarSelecao;
  sel.clear();
  if (marcar) {
    inventario.forEach((f, i) => { if (f && !f.recipiente && !estaGuardado(f)) sel.add(i); });
  }
  abrirColocarItens(index);
}

function voltarDoColocar(index) {
  window._colocarSelecao.clear();
  abrirMochila(index);
}

function confirmarColocarItens(index) {
  const mochila = inventario[index];
  if (!mochila) return;
  window._colocarSelecao.forEach((i) => {
    if (inventario[i] && !inventario[i].recipiente) inventario[i].dentroDe = mochila.id;
  });
  window._colocarSelecao.clear();
  renderInv();
  salvarTudo();
  abrirMochila(index);
}

function moverItemParaRecipiente(index, idRecipiente) {
  const item = inventario[index];
  if (!item || item.recipiente) return;
  item.dentroDe = idRecipiente || "";
  if (idRecipiente) window._mochilasFechadas.delete(idRecipiente);
  fecharPopup();
  renderInv();
  salvarTudo();
}

function abrirGuardarItem(index) {
  const item = inventario[index];
  if (!item) return;
  const mochilas = recipientesInventario();

  const html = `
    <div class="popup-form">
      ${mochilas
        .map((m) => {
          const qtd = filhosDoRecipiente(m.id).length;
          return `<button type="button" class="guardar-opcao" onclick="moverItemParaRecipiente(${index}, '${esc(m.id)}')">
            <i class="ti ti-backpack"></i>
            <span>${esc(m.nome || "Sem nome")}</span>
            <small>${qtd} ${qtd === 1 ? "item" : "itens"}</small>
          </button>`;
        })
        .join("")}
    </div>
  `;

  abrirPopup(`Guardar "${item.nome || "item"}" em...`, html, true, null);
}

function toggleEditSintoniaItem() {
  const requer = document.getElementById("editItemRequerSintonia");
  const box = document.getElementById("boxEditItemSintonizado");
  const sintonizado = document.getElementById("editItemSintonizado");

  if (!requer || !box) return;

  if (requer.checked) {
    box.style.display = "block";
  } else {
    box.style.display = "none";
    if (sintonizado) sintonizado.checked = false;
  }
}

// botões do popup do item (o que antes ficava no card dos itens guardados)
function acoesVerItemHTML(item, index) {
  const guardado = estaGuardado(item);
  const mochila = guardado ? inventario.find((i) => i.id === item.dentroDe) : null;
  const botoes = [];

  if (guardado) {
    const iMochila = inventario.indexOf(mochila);
    botoes.push(`<button type="button" onclick="abrirMochila(${iMochila})"><i class="ti ti-arrow-left"></i><span>Voltar</span></button>`);
    botoes.push(`<button type="button" onclick="moverItemParaRecipiente(${index}, '')"><i class="ti ti-arrow-bar-up"></i><span>Tirar</span></button>`);
  } else if (!item.recipiente && recipientesInventario().length) {
    botoes.push(`<button type="button" onclick="abrirGuardarItem(${index})"><i class="ti ti-backpack"></i><span>Guardar</span></button>`);
  }

  botoes.push(`<button type="button" onclick="fecharPopup(); window.abrirDarItem('inventario', ${index})"><i class="ti ti-gift"></i><span>Dar</span></button>`);
  if (typeof podeIrProComp === "function" && podeIrProComp(item) && listaComp().length) {
    botoes.push(`<button type="button" onclick="abrirEscolherCompParaItem(${index})"><span class="comp-emoji">🐾</span><span>Pro bicho</span></button>`);
  }
  botoes.push(`<button type="button" class="pv-editar" onclick="editarItem(${index})"><i class="ti ti-pencil"></i><span>Editar</span></button>`);
  botoes.push(`<button type="button" class="perigo" onclick="fecharPopup(); removerItem(${index})"><i class="ti ti-trash"></i><span>Remover</span></button>`);

  return botoes.join("");
}

// monta o corpo padrão dos popups de "ver" (item, arma, armadura, poder)
function popupVerHTML({ imagem, infos, tags, mods, desc, extra, acoes }) {
  const tiles = (infos || [])
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([rotulo, valor, destaque]) => `<div class="pv-info ${destaque ? "destaque" : ""}"><span>${rotulo}</span><b>${valor}</b></div>`)
    .join("");

  return `
    <div class="pv">
      ${imagem ? `<img src="${esc(imagem)}" class="pv-imagem" alt="">` : ""}
      ${tiles ? `<div class="pv-grade">${tiles}</div>` : ""}
      ${tags && tags.length ? `<div class="pw-tags">${tags.join("")}</div>` : ""}
      ${extra || ""}
      ${mods && mods.length ? `
        <div class="pv-secao">
          <span class="pv-rotulo"><i class="ti ti-sparkles"></i> Modificações</span>
          <div class="pv-mods">${mods
            .map((m) => `<div class="pv-mod"><strong>${esc(m.nome)}</strong>${m.efeito ? `<span>${esc(m.efeito)}</span>` : ""}</div>`)
            .join("")}</div>
        </div>` : ""}
      <div class="pv-secao">
        <span class="pv-rotulo"><i class="ti ti-file-text"></i> Descrição</span>
        <div class="pv-desc ${desc ? "" : "vazia"}">${desc ? formatarDescricao(desc) : "Sem descrição"}</div>
      </div>
      ${acoes ? `<div class="pv-acoes">${acoes}</div>` : ""}
    </div>`;
}

function pvCargas(obj) {
  if (!obj || !obj.temCargas || !(obj.maxCargas > 0)) return "";
  const gastas = (obj.cargasGastas || []).filter(Boolean).length;
  return `${obj.maxCargas - gastas}/${obj.maxCargas}`;
}

function pvSintonia(obj) {
  if (!obj?.requerSintonia) return "";
  return obj.sintonizado ? "Sintonizado" : "Não sintonizado";
}

function verItem(index) {
  const item = inventario[index];
  if (!item) return;
  if (item.recipiente) { abrirMochila(index); return; }
  if (item.bolsa) { abrirBolsa(index); return; }

  const mochila = estaGuardado(item) ? inventario.find((i) => i.id === item.dentroDe) : null;

  const html = popupVerHTML({
    imagem: item.imagemUrl,
    infos: [
      ["Quantidade", `x${item.qtd || 1}`, true],
      ["Sintonia", pvSintonia(item)],
      ["Guardado em", mochila ? esc(mochila.nome || "Mochila") : ""],
    ],
    mods: item.modificacoes,
    desc: item.desc,
    acoes: acoesVerItemHTML(item, index),
  });

  abrirPopup(item.nome || "Sem nome", html, true, null);
}

async function removerItem(index) {
  const item = inventario[index];
  if (!item) return;

  const filhos = item.recipiente ? filhosDoRecipiente(item.id) : [];
  const aviso = filhos.length
    ? ` Os ${filhos.length} ${filhos.length === 1 ? "item que está dentro vai" : "itens que estão dentro vão"} ficar soltos no inventário.`
    : "";

  const confirmar = await confirmBonito(`Remover "${item.nome}"?${aviso}`);
  if (!confirmar) return;

  filhos.forEach((f) => (f.dentroDe = ""));
  inventario.splice(index, 1);
  renderInv();
  salvarTudo();
}

/* ================= ARMAS ================= */

async function addArma() {
  const nome = document.getElementById("armaNome").value.trim();
  const dano = document.getElementById("armaDano").value.trim();
  const descEl = document.getElementById("armaDesc");
  const desc = descEl ? descEl.value.trim() : "";

  const temCargasEl = document.getElementById("armaTemCargas");
  const maxCargasEl = document.getElementById("armaMaxCargas");

  const temCargas = !!temCargasEl?.checked;
  const maxCargas = temCargas ? parseInt(maxCargasEl?.value) || 0 : 0;

  if (!nome) return;
  if (temCargas && maxCargas <= 0) return;

  let imagemUrl = editandoArma >= 0 ? armas[editandoArma]?.imagemUrl || "" : "";
  let imagemDeleteUrl = editandoArma >= 0 ? armas[editandoArma]?.imagemDeleteUrl || "" : "";

  if (armaImagemBase64Temp === "REMOVIDA") {
    imagemUrl = "";
    imagemDeleteUrl = "";
  } else if (armaImagemBase64Temp) {
    const resultado = await uploadImagemFirebase(armaImagemBase64Temp, "arma");
    if (resultado.erro || !resultado.url) {
      alertBonito(_mensagemErroUpload("A arma foi salva sem imagem."))
    } else {
      imagemUrl = resultado.url;
      imagemDeleteUrl = resultado.deleteUrl;
    }
  }

    const requerSintonia = !!document.getElementById("armaRequerSintonia")?.checked;
  const sintonizado = requerSintonia && !!document.getElementById("armaSintonizado")?.checked;

  const novaArma = {
    modificacoes: consumirModsTemp("arma"),
    nome,
    dano,
    desc,
    temCargas,
    maxCargas,
    cargasGastas: temCargas ? Array(maxCargas).fill(false) : [],
    requerSintonia,
    sintonizado,
    imagemUrl,
    imagemDeleteUrl,
    ...lerCamposAtaqueArma("arma"),
  };

  if (editandoArma >= 0) {
    const armaAnterior = armas[editandoArma];

    if (
      armaAnterior?.temCargas &&
      temCargas &&
      armaAnterior.maxCargas === maxCargas &&
      Array.isArray(armaAnterior.cargasGastas)
    ) {
      novaArma.cargasGastas = armaAnterior.cargasGastas;
    }

    armas[editandoArma] = novaArma;
    editandoArma = -1;
  } else {
    armas.push(novaArma);
  }

  renderArmas();
  salvarTudo();

  document.getElementById("armaNome").value = "";
  document.getElementById("armaDano").value = "";
  if (descEl) descEl.value = "";

    const requerSintoniaEl = document.getElementById("armaRequerSintonia");
  const sintonizadoEl = document.getElementById("armaSintonizado");
  const boxSintonizadoEl = document.getElementById("boxArmaSintonizado");
  if (requerSintoniaEl) requerSintoniaEl.checked = false;
  if (sintonizadoEl) sintonizadoEl.checked = false;
  if (boxSintonizadoEl) boxSintonizadoEl.style.display = "none";

  if (temCargasEl) temCargasEl.checked = false;
  if (maxCargasEl) {
    maxCargasEl.value = "";
    maxCargasEl.style.display = "none";
  }

  armaImagemBase64Temp = "";
  limparCamposAtaqueArma("arma");
  document.getElementById("armaImagem").value = "";
  document.getElementById("armaImagemPreview").style.display = "none";
}

function renderArmas() {
  const ul = document.getElementById("listaArmas");
  if (!ul) return;

  ul.innerHTML = "";

  armas.forEach((arma, index) => {
    const li = document.createElement("li");
    li.className = "arma-card";
    li.dataset.index = index;

    const cargasHTML =
      arma.temCargas && arma.maxCargas > 0
        ? `
        <div class="arma-cargas-box">
          <span class="arma-cargas-label">Cargas</span>
          <div class="arma-cargas-checks">
            ${Array.from(
              { length: arma.maxCargas },
              (_, i) => `
              <div
                class="arma-carga-check ${arma.cargasGastas?.[i] ? "ativo" : ""}"
                onclick="event.stopPropagation(); toggleCargaArma(${index}, ${i})"
              ></div>
            `,
            ).join("")}
          </div>
        </div>
      `
        : "";


    li.classList.add("arma-card2");
    li.innerHTML = `
      <button type="button" class="drag-handle" aria-label="Arrastar para reordenar">⠿</button>

      <div class="arma-info" onclick="verArma(${index})">
        <div class="arma2-topo">
          ${arma.imagemUrl ? `<img class="arma2-img" src="${esc(arma.imagemUrl)}" alt="">` : ""}
          <div class="arma2-titulo">
            <strong class="arma-nome">${esc(arma.nome) || "Sem nome"}</strong>
            ${arma.requerSintonia ? `<span class="item-tag-sintonia ${arma.sintonizado ? "ativo" : ""}">${arma.sintonizado ? "Sintonizado" : "Requer sintonia"}</span>` : ""}
          </div>
        </div>
        <div class="arma-calc" data-arma-calc="${index}">${armaCalcChipsHTML(arma)}</div>
        ${modsChipsHTML(arma.modificacoes)}
        ${arma.desc ? `<p class="arma2-desc">${esc(arma.desc)}</p>` : ""}
        ${cargasHTML}
      </div>

      <div class="card-acoes-ico">
        <button type="button" class="card-ico" title="Dar para outro jogador" onclick="event.stopPropagation(); window.abrirDarItem('armas', ${index})"><i class="ti ti-gift"></i></button>
      </div>
    `;

    ul.appendChild(li);
  });

  habilitarArrastarReordenar(ul, armas, renderArmas);
}

function toggleCargaArma(indexArma, indexCarga) {
  const arma = armas[indexArma];
  if (!arma || !arma.temCargas || !Array.isArray(arma.cargasGastas)) return;

  arma.cargasGastas[indexCarga] = !arma.cargasGastas[indexCarga];
  renderArmas();
  salvarTudo();
}

function verArma(index) {
  const arma = armas[index];
  if (!arma) return;

  const html = popupVerHTML({
    imagem: arma.imagemUrl,
    infos: [
      ...(armaUsaCalculo(arma)
        ? [
            ["Ataque", `${fmtBonus(calcAtaqueArma(arma).total)} <small class="arma-conta">${esc(calcAtaqueArma(arma).conta) || "sem bônus"}</small>`, true],
            ["Dano", esc(danoArmaTexto(arma)) || "—", true],
          ]
        : [["Dano", esc(arma.dano) || "—", true]]),
      ["Cargas", pvCargas(arma)],
      ["Sintonia", pvSintonia(arma)],
    ],
    mods: arma.modificacoes,
    desc: arma.desc,
    acoes: `
      <button type="button" class="pv-principal pv-meia" onclick="rolarAtaqueArma(${index})">🎲 <span>Atacar</span></button>
      ${extrairDados(arma.dano) ? `<button type="button" class="pv-principal pv-meia" onclick="rolarDanoArma(${index})">🎲 <span>Dano</span></button>` : ""}
      <button type="button" onclick="fecharPopup(); window.abrirDarItem('armas', ${index})"><i class="ti ti-gift"></i><span>Dar</span></button>
      <button type="button" class="pv-editar" onclick="editarArma(${index})"><i class="ti ti-pencil"></i><span>Editar</span></button>
      <button type="button" class="perigo" onclick="fecharPopup(); removerArma(${index})"><i class="ti ti-trash"></i><span>Remover</span></button>`,
  });

  abrirPopup(arma.nome || "Sem nome", html, true, null);
}

async function removerArma(index) {
  const arma = armas[index];
  if (!arma) return;

  const confirmar = await confirmBonito(`Remover "${arma.nome}"?`);
  if (!confirmar) return;

  armas.splice(index, 1);
  renderArmas();
  salvarTudo();
}

/* ================= PODERES ================= */


function atualizarEstadoLowHP() {
  const vidaTotal = vidaAtual + vidaTemp;
  const abaCombate = document.querySelector(".aba.active");

  const combateAtivo = abaCombate && abaCombate.id === "combate";

  if (vidaTotal < 15 && combateAtivo) {
    document.body.classList.add("low-hp");
  } else {
    document.body.classList.remove("low-hp");
  }
}


function abrirImportacao() {
  const input = document.getElementById("importarFicha");

  if (!input) {
    alertBonito("Input de importação não encontrado no HTML.");
    console.error("Elemento #importarFicha não existe.");
    return;
  }

  input.value = "";
  input.click();
}

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popup");
  if (popup && popup.parentElement !== document.body) {
    document.body.appendChild(popup);
  }

  const inputImportar = document.getElementById("importarFicha");

  if (!inputImportar) {
    console.warn("Input #importarFicha não encontrado ao carregar a página.");
    return;
  }

  inputImportar.addEventListener("change", importarFichaArquivo);
});

function importarFichaArquivo(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.name.endsWith(".json")) {
    alertBonito("Apenas arquivos .json são aceitos.");
    e.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    alertBonito("Arquivo muito grande. Máximo permitido: 2MB.");
    e.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = async function (event) {
    try {
      const dadosImportados = JSON.parse(event.target.result);

      const validar = (p) => p && (p.nome || p.classe || p.raca);

      if (Array.isArray(dadosImportados)) {
        const validos = dadosImportados.filter(validar);
        if (!validos.length) throw new Error("Nenhuma ficha válida encontrada.");
        validos.forEach((p) => {
          p.imagem = "";
          if (!p.id) p.id = Date.now() + Math.floor(Math.random() * 99999);
          sanitizarPersonagem(p);
          personagens.push(p);
        });
      } else {
        if (!validar(dadosImportados)) throw new Error("Arquivo não parece ser uma ficha válida.");
        dadosImportados.imagem = "";
        if (!dadosImportados.id) dadosImportados.id = Date.now() + Math.floor(Math.random() * 99999);
        sanitizarPersonagem(dadosImportados);
        personagens.push(dadosImportados);
      }

      window.personagens = personagens;
      localStorage.setItem("personagens", JSON.stringify(personagens));

      if (typeof window.salvarFichasNaNuvem === "function") {
        await window.salvarFichasNaNuvem();
      }

      if (typeof renderPersonagens === "function") {
        renderPersonagens();
      }

      alertBonito("Ficha importada com sucesso! A imagem precisa ser adicionada separadamente.");
    } catch (erro) {
      console.error("Erro ao importar ficha:", erro);
      alertBonito("Arquivo inválido ou corrompido.");
    }

    e.target.value = "";
  };

  reader.readAsText(file);
}

function exportarFicha(index) {
  const personagens = JSON.parse(localStorage.getItem("personagens")) || [];
  const ficha = personagens[index];

  if (!ficha) {
    alertBonito("Ficha não encontrada.");
    return;
  }

  const nomeArquivo =
    ficha.nome && ficha.nome.trim()
      ? ficha.nome.trim().replace(/[\\/:*?"<>|]/g, "_")
      : `ficha-${index + 1}`;

  const conteudo = JSON.stringify(ficha, null, 2);
  const arquivo = `${nomeArquivo}.json`;

  // Android WebView
  if (window.Android && Android.exportarFicha) {
    Android.exportarFicha(conteudo, arquivo);
    return;
  }

  // Navegador normal
  const blob = new Blob([conteudo], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = arquivo;
  a.click();
  URL.revokeObjectURL(url);
}

async function colarFicha() {
  const codigo = await promptBonito("Cole o código:");
  if (!codigo) return;
  const dados = atob(codigo);
  localStorage.setItem("personagens", dados);
  location.reload();
}
function aoMover(ev) {
  atualizarDestino(ev.clientY);
}

function aoSoltar() {
  const card = document.querySelector(".poder-card.dragging");
  const lista = document.getElementById("listaPoderes");

  if (card) {
    card.classList.remove("dragging");
  }

  if (lista) {
    lista.querySelectorAll(".poder-card").forEach((c) => {
      c.classList.remove("drag-over");
    });
  }

  window.removeEventListener("pointermove", aoMover);
  window.removeEventListener("pointerup", aoSoltar);

  if (
    typeof destino !== "undefined" &&
    typeof origem !== "undefined" &&
    destino !== origem
  ) {
    moverPoderPorDrag(origem, destino);
  }
}

function moverPoderPorDrag(origem, destino) {
  if (origem === destino || origem < 0 || destino < 0) return;
  if (origem >= poderes.length || destino >= poderes.length) return;

  const [itemMovido] = poderes.splice(origem, 1);
  poderes.splice(destino, 0, itemMovido);

  renderPoderes();
  salvarTudo();
}


async function removerPoder(index) {
  const poder = poderes[index];
  if (!poder) return;

  const confirmar = await confirmBonito(`Remover "${poder.nome}"?`);
  if (!confirmar) return;

  poderes.splice(index, 1);
  renderPoderes();
  salvarTudo();
}

function ativarDragVida() {
  const barra = document.getElementById("hpBar");
  if (!barra) return;

  let arrastando = false;

  function atualizarPorPosicao(clientX) {
    const rect = barra.getBoundingClientRect();
    const max = get("vidaMax");

    let pos = clientX - rect.left;
    pos = Math.max(0, Math.min(pos, rect.width));

    const porcentagem = pos / rect.width;
    vidaAtual = Math.round(porcentagem * max);

    atualizarHP();
    salvarTudo();
  }

  // CLICK normal (desktop e toque rápido)
  barra.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") return;
    atualizarPorPosicao(e.clientX);
  });

  // TOUCH (celular)
  barra.addEventListener(
    "touchstart",
    (e) => {
      if (e.target.tagName === "BUTTON") return;

      arrastando = true;
      atualizarPorPosicao(e.touches[0].clientX);
    },
    { passive: true },
  );

  barra.addEventListener(
    "touchmove",
    (e) => {
      if (!arrastando) return;

      atualizarPorPosicao(e.touches[0].clientX);
    },
    { passive: true },
  );

  barra.addEventListener("touchend", () => {
    arrastando = false;
  });

  // MOUSE DRAG (PC também fica bom)
  barra.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON") return;

    arrastando = true;
    atualizarPorPosicao(e.clientX);
  });

  document.addEventListener("mousemove", (e) => {
    if (!arrastando) return;

    atualizarPorPosicao(e.clientX);
  });

  document.addEventListener("mouseup", () => {
    arrastando = false;
  });
}
/* ================= DT ================= */

function atualizarDT() {
  const base = parseInt(document.getElementById("dtBase")?.value) || 0;
  const atributo = parseInt(document.getElementById("dtAtributo")?.value) || 0;
  const prof = parseInt(document.getElementById("dtProf")?.value) || 0;

  const total = base + atributo + prof;
  const dtTotal = document.getElementById("dtTotal");

  if (dtTotal) dtTotal.textContent = total;
  if (typeof atualizarCabecalhoConjurador === "function") atualizarCabecalhoConjurador();
}

/* ================= VIDA ================= */

function atualizarHP() {
  const max = get("vidaMax");
  const porcentagem = max > 0 ? (vidaAtual / max) * 100 : 0;

  const fill = document.getElementById("hp-fill");
  const texto = document.getElementById("vida-texto");

  if (fill) fill.style.width = `${porcentagem}%`;
  if (texto) texto.innerText = `${vidaAtual}/${max}`;

  atualizarTotal();
  atualizarEstadoLowHP();
}

function animarAttr(id) {
  const el = document.getElementById(id)?.closest(".attr-card");
  if (!el) return;
  el.classList.add("up");

  setTimeout(() => {
    el.classList.remove("up");
  }, 400);
}

function atualizarTemp() {
  const max = get("vidaMax");
  const porcentagem = max > 0 ? (vidaTemp / max) * 100 : 0;

  const fill = document.getElementById("temp-fill");
  const texto = document.getElementById("temp-texto");

  if (fill) fill.style.width = `${porcentagem}%`;
  if (texto) texto.innerText = vidaTemp;

  atualizarEstadoLowHP();
  atualizarTotal();
}

function atualizarTotal() {
  const max = get("vidaMax");
  const total = vidaAtual + vidaTemp;
  const totalBox = document.querySelector(".hp-total");
  const totalEl = document.getElementById("vida-total");

  if (!totalBox || !totalEl) return;

  if (vidaTemp > 0) {
    totalBox.style.display = "block";
    totalEl.innerText = `${total}/${max}`;
  } else {
    totalBox.style.display = "none";
  }
}

function alterarVida(v) {
  const max = get("vidaMax");
  vidaAtual += v;

  if (vidaAtual > max) vidaAtual = max;
  if (vidaAtual < 0) vidaAtual = 0;

  atualizarHP();
  salvarTudo();
}

function alterarTemp(v) {
  vidaTemp += v;
  if (vidaTemp < 0) vidaTemp = 0;

  atualizarTemp();
  salvarTudo();
}

/* ================= EXAUSTÃO ================= */

function setExaustao(nivel) {
  exaustao = nivel;

  const checks = document.querySelectorAll(".exaustao-check");
  checks.forEach((el, i) => {
    el.classList.toggle("ativo", i === nivel);
  });

  const desc = document.getElementById("exaustao-desc");
  if (desc) desc.innerText = efeitosExaustao[nivel] || "Sem exaustão";

  salvarTudo();
}

/* ================= MORTE ================= */

function toggleMorte(tipo, index) {
  morte[tipo][index] = !morte[tipo][index];
  atualizarMorte();
  salvarTudo();
}

function atualizarMorte() {
  const checksSucesso = document.querySelectorAll(
    ".morte-linha:nth-of-type(1) .morte-check",
  );
  const checksFalha = document.querySelectorAll(
    ".morte-linha:nth-of-type(2) .morte-check",
  );

  checksSucesso.forEach((check, i) => {
    check.classList.toggle("ativo", !!morte.sucessos[i]);
  });

  checksFalha.forEach((check, i) => {
    check.classList.toggle("ativo", !!morte.falhas[i]);
  });
}

/* ================= SAVES ================= */

function toggleSave(attr) {
  saves[attr] = !saves[attr];
  atualizarSaves();
  atualizarBadgesSaves();
  salvarTudo();
}

function atualizarSaves() {
  [
    "forca",
    "destreza",
    "constituicao",
    "inteligencia",
    "sabedoria",
    "carisma",
  ].forEach((attr) => {
    const check = document.querySelector(
      `.save-check[onclick="toggleSave('${attr}')"]`,
    );
    if (check) check.classList.toggle("ativo", !!saves[attr]);
  });
}

function atualizarBadgesSaves() {
  const bonus = get("bonusProf");
  const attrs = [
    "forca",
    "destreza",
    "constituicao",
    "inteligencia",
    "sabedoria",
    "carisma",
  ];

  attrs.forEach((attr) => {
    const badge = document.getElementById(`save_${attr}`);
    if (!badge) return;

    const valor = mod(getAtributoFinal(attr)) + (saves[attr] ? bonus : 0);

    badge.style.display = "flex";
    badge.textContent = valor >= 0 ? `+${valor}` : `${valor}`;
  });
}

/* ================= PERÍCIAS ================= */

function toggleCampoCargasPoder() {
  const check = document.getElementById("poderTemCargas");
  const input = document.getElementById("poderMaxCargas");

  if (!check || !input) return;

  if (check.checked) {
    input.style.display = "block";
  } else {
    input.style.display = "none";
    input.value = "";
  }
}

function toggleCargaPoder(index, i) {
  const poder = poderes[index];
  if (!poder) return;

  if (!Array.isArray(poder.cargasGastas)) {
    poder.cargasGastas = Array(poder.maxCargas || 0).fill(false);
  }

  poder.cargasGastas[i] = !poder.cargasGastas[i];

  renderPoderes();
  salvarTudo();
}

function atualizarTudo() {
  atualizarAtributosFinaisVisuais();
  const bonus = get("bonusProf");

  const mods = {
    forca: mod(getAtributoFinal("forca")),
    destreza: mod(getAtributoFinal("destreza")),
    constituicao: mod(getAtributoFinal("constituicao")),
    inteligencia: mod(getAtributoFinal("inteligencia")),
    sabedoria: mod(getAtributoFinal("sabedoria")),
    carisma: mod(getAtributoFinal("carisma")),
  };

  document.getElementById("mod_forca").innerText =
    mods.forca >= 0 ? `+${mods.forca}` : mods.forca;
  document.getElementById("mod_destreza").innerText =
    mods.destreza >= 0 ? `+${mods.destreza}` : mods.destreza;
  document.getElementById("mod_constituicao").innerText =
    mods.constituicao >= 0 ? `+${mods.constituicao}` : mods.constituicao;
  document.getElementById("mod_inteligencia").innerText =
    mods.inteligencia >= 0 ? `+${mods.inteligencia}` : mods.inteligencia;
  document.getElementById("mod_sabedoria").innerText =
    mods.sabedoria >= 0 ? `+${mods.sabedoria}` : mods.sabedoria;
  document.getElementById("mod_carisma").innerText =
    mods.carisma >= 0 ? `+${mods.carisma}` : mods.carisma;

  const lista = document.getElementById("pericias");
  if (lista) {
    lista.innerHTML = "";

    // marcadas (treinada/especialista) primeiro, depois o resto; cada grupo em ordem alfabética
    const filtro = window._filtroPericias || "todas";
    const siglas = { forca: "FOR", destreza: "DES", constituicao: "CON", inteligencia: "INT", sabedoria: "SAB", carisma: "CAR" };
    const ordenadas = [...pericias]
      .filter((p) => {
        const nivel = profs[p.nome] || 0;
        if (filtro === "treinadas") return nivel >= 1;
        if (filtro === "especialista") return nivel === 2;
        return true;
      })
      .sort((a, b) => {
        const ma = profs[a.nome] ? 0 : 1;
        const mb = profs[b.nome] ? 0 : 1;
        return ma - mb || a.nome.localeCompare(b.nome, "pt-BR");
      });

    if (!ordenadas.length) {
      lista.innerHTML = `<p class="pericias-vazio">${filtro === "especialista" ? "Nenhuma perícia com especialização." : "Nenhuma perícia treinada ainda."}</p>`;
    }

    ordenadas.forEach((pericia, i) => {
      // linha separando as marcadas das outras
      if (filtro === "todas" && i > 0 && profs[ordenadas[i - 1].nome] && !profs[pericia.nome]) {
        const sep = document.createElement("div");
        sep.className = "pericias-separador";
        lista.appendChild(sep);
      }

      let bonusFinal = 0;

      if (profs[pericia.nome] === 1) {
        bonusFinal = bonus;
      } else if (profs[pericia.nome] === 2) {
        bonusFinal = bonus * 2;
      }

      const valor = mods[pericia.attr] + bonusFinal;

      const div = document.createElement("div");
      div.className = "pericia";
      div.innerHTML = `
        <label>
          <div class="check 
  ${profs[pericia.nome] === 1 ? "ativo" : ""} 
  ${profs[pericia.nome] === 2 ? "expertise" : ""}" onclick="toggleProf('${pericia.nome}', event)"></div>
          ${pericia.nome}
          <small class="pericia-attr">${siglas[pericia.attr] || ""}</small>
        </label>
        <span class="pericia-valor" title="Rolar ${pericia.nome}" onclick="rolarPericia('${pericia.nome}')">${valor >= 0 ? `+${valor}` : valor}</span>
      `;
      lista.appendChild(div);
    });

    function atualizarAtributos() {
      [
        "forca",
        "destreza",
        "constituicao",
        "inteligencia",
        "sabedoria",
        "carisma",
      ].forEach((attr) => {
        const el = document.getElementById(`mod_${attr}`);
        if (el) {
          el.innerText = mod(getAtributoFinal(attr));
        }
      });
    }

    function atualizarAtributosVisuais() {
      const attrs = [
        "forca",
        "destreza",
        "constituicao",
        "inteligencia",
        "sabedoria",
        "carisma",
      ];

      attrs.forEach((attr) => {
        const baseInput = document.getElementById(attr);
        const display = baseInput?.parentElement?.querySelector(".valor-attr"); // ou equivalente

        if (!baseInput || !display) return;

        const final = getAtributoFinal(attr);
        display.innerText = final;
      });
    }
  }

  atualizarBadgesSaves();
}

function toggleProf(nome, event) {
  if (event) event.stopPropagation();

  // 0 = nada | 1 = prof | 2 = expertise
  if (!profs[nome]) {
    profs[nome] = 1;
  } else if (profs[nome] === 1) {
    profs[nome] = 2;
  } else {
    profs[nome] = 0;
  }

  atualizarTudo();
  salvarTudo();
}

function limparFocoBotoesVida() {
  const botoes = document.querySelectorAll(".hp-overlay button");

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      botao.blur();
    });

    botao.addEventListener(
      "touchend",
      () => {
        botao.blur();
      },
      { passive: true },
    );

    botao.addEventListener("mouseup", () => {
      botao.blur();
    });
  });
}

function ativarDragTemp() {
  const barra = document.getElementById("tempBar");
  if (!barra) return;

  let arrastando = false;

  function atualizarPorPosicao(clientX) {
    const rect = barra.getBoundingClientRect();
    const max = get("vidaMax");

    if (max <= 0) return;

    let pos = clientX - rect.left;
    pos = Math.max(0, Math.min(pos, rect.width));

    const porcentagem = pos / rect.width;
    vidaTemp = Math.round(porcentagem * max);

    atualizarTemp();
    salvarTudo();
  }

  barra.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") return;
    atualizarPorPosicao(e.clientX);
  });

  barra.addEventListener(
    "touchstart",
    (e) => {
      if (e.target.tagName === "BUTTON") return;

      arrastando = true;
      atualizarPorPosicao(e.touches[0].clientX);
    },
    { passive: true },
  );

  barra.addEventListener(
    "touchmove",
    (e) => {
      if (!arrastando) return;
      atualizarPorPosicao(e.touches[0].clientX);
    },
    { passive: true },
  );

  barra.addEventListener("touchend", () => {
    arrastando = false;
  });

  barra.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON") return;

    arrastando = true;
    atualizarPorPosicao(e.clientX);
  });

  document.addEventListener("mousemove", (e) => {
    if (!arrastando) return;
    atualizarPorPosicao(e.clientX);
  });

  document.addEventListener("mouseup", () => {
    arrastando = false;
  });
}


function limitarAtributo(input) {
  let valor = parseInt(input.value);

  if (isNaN(valor)) return;
  if (valor > 30) input.value = 30;
  if (valor < 1) input.value = 1;
}

/* ================= GRIMÓRIO ÍGNEO / MASTER ================= */


const npcsPadrao = [
  {
    id: "npc-padrao-leonardo",
    _tipo: "npc",
    origem: "padrao",
    nome: "Leonardo, o Taverneiro Sombrio",
    tipo: "Humano",
    relacao: "neutro",
    personalidade: "Carismático, brincalhão e sempre disposto a ouvir uma boa história. Leonardo demonstra um carinho incomum por tudo que existe ao seu redor, desde os maiores heróis até as criaturas mais insignificantes. Enfrenta qualquer situação com serenidade e bom humor, como se soubesse exatamente como cada história termina.",
    lore: "Ninguém sabe de onde Leonardo veio. Ele simplesmente apareceu certa noite, comprou a taverna com moedas de origem desconhecida e nunca mais saiu de trás do balcão. Dizem que já serviu reis, assassinos e deuses — e tratou todos com a mesma indiferença.",
    observacoes: "'Caso algum jogador perguntar do 'CRIADOR' Leonardo responde: O Criador ? Leonardo ri e toma um gole da caneca. Dizem que era um homem teimoso demais para desistir daquilo que começou. Ele sorri. Se existe alguém assim, espero que esteja se divertindo tanto quanto eu.",
    hpMax: 1000, hpAtual: 1000, ca: 100,
    ataques: "Punho cortante:  +15 para acertar, alcance 3m, 6d6+20 de dano. | Linhas do destino: Abre um livro e começa a escrever como se fosse afetar a linha temporal, 8d8 de dano Psiquico.",
    habilidades: "Deletar: pode simplesmente te deletar do mundo sem mais nem menos, | Entre as Linhas: qualquer ataque direcionado a Leonardo desacelera antes de atingi-lo. Ataques corpo a corpo falham automaticamente, a menos que o atacante passe em CD 30 Sab. ",
    fraquezas: "Nenhuma.",
    status: { for: 30, des: 30, con: 30, int: 30, sab: 30, car: 30 },
    imagem: "img/Npc/Leonardo.jpeg"
  }
];

const encontrosPadrao = [
  {
    id: "encontro-padrao-1", origem: "padrao",
    nome: "Emboscada na Estrada",
    regiao: "Estrada Real",
    localizacao: "Entre duas cidades",
    dificuldade: "Médio",
    objetivo: "Sobreviver e descobrir quem ordenou a emboscada",
    envolvidos: "Grupo de bandidos com um líder misterioso encapuzado",
    gatilho: "Os jogadores viajam entre cidades sem escolta",
    ambiente: "Floresta às margens da estrada, visibilidade reduzida, terreno irregular",
    consequencias: "O líder foge se reduzido a 30% HP, deixando uma carta cifrada",
    loot: "Bolsas com 50po, a carta cifrada, adaga com emblema desconhecido",
    notas: "O emblema na adaga pode ser gancho para próxima aventura",
    imagem: "img/Encontros/Emboscada-na-Estrada.jpg"
  },
  {
    id: "encontro-padrao-2", origem: "padrao",
    nome: "O Mercado Sombrio",
    regiao: "Cidade",
    localizacao: "Beco nos fundos do mercado principal",
    dificuldade: "Fácil",
    objetivo: "Investigar rumores de itens roubados sendo vendidos",
    envolvidos: "Comerciantes ilegais, guarda corrupto, possível informante",
    gatilho: "Jogadores ouvem rumores ou perdem um item valioso",
    ambiente: "Beco escuro, tendas improvisadas, movimento constante de pessoas suspeitas",
    consequencias: "Confronto com a guarda se prenderem alguém. Informante pode virar aliado.",
    loot: "Itens roubados variados, lista de compradores VIP",
    notas: "Oportunidade de roleplay e investigação antes de qualquer combate",
    imagem: "img/Encontros/O-Mercado-Sombrio.jpg"
  },
  {
    id: "encontro-padrao-3", origem: "padrao",
    nome: "A Cripta Desperta",
    regiao: "Cemitério Antigo",
    localizacao: "Cripta da família nobre abandonada",
    dificuldade: "Difícil",
    objetivo: "Descobrir o que perturbou os mortos e pará-lo",
    envolvidos: "Esqueletos, zumbis, e um espectro no nível mais profundo",
    gatilho: "Mortos começam a aparecer na cidade à noite",
    ambiente: "Escuridão total sem tochas, paredes cobertas de musgo, armadilhas antigas",
    consequencias: "Se o espectro escapar vai possuir um NPC importante da cidade",
    loot: "Joia da família nobre, pergaminhos antigos, 200po em moedas velhas",
    notas: "O espectro era um membro da família — pode ser apaziguado com informação certa",
    imagem: "img/Encontros/A-Cripta Desperta.jpg"
  },
  {
    id: "encontro-padrao-5", origem: "padrao",
    nome: "Tempestade no Mar",
    regiao: "Alto Mar",
    localizacao: "Navio mercante a dois dias do porto",
    dificuldade: "Lendário",
    objetivo: "Sobreviver à tempestade e ao monstro marinho que ela acordou",
    envolvidos: "Tripulação em pânico, capitão ferido, criatura das profundezas",
    gatilho: "Jogadores viajam de navio ou são contratados como escolta",
    ambiente: "Navio balançando, visibilidade zero, chuva torrencial, ondas gigantes",
    consequencias: "Se o navio afundar os jogadores precisam chegar à costa nadando",
    loot: "Carga valiosa do navio, gratidão do capitão, mapa de rotas secretas",
    notas: "A criatura não é maliciosa — foi perturbada por algo no fundo do mar",
    imagem: "img/Encontros/Tempestade-no-Mar.jpg"
  }
];


const itensPadrao = [
  {
    id: "item-padrao-1", _tipo: "item", origem: "padrao",
    nome: "Lâmina do Crepúsculo",
    tipo: "arma",
    raridade: "raro",
    sintonizacao: "Sim",
    efeito: "Espada longa +2. Ao anoitecer e amanhecer causa 2d6 de dano extra de radiante. Uma vez por dia pode lançar Palavra Divina.",
    imagem: "img/Itens/Lâmina-do-Crepúsculo.jpg"
  },
  {
    id: "item-padrao-2", _tipo: "item", origem: "padrao",
    nome: "Manto dos Sussurros",
    tipo: "armadura",
    raridade: "incomum",
    sintonizacao: "Sim",
    efeito: "Capa encantada que concede vantagem em testes de Furtividade. O usuário pode lançar Silêncio uma vez por dia sem gastar espaço de magia.",
    imagem: "img/Itens/Manto-dos-Sussurros.jpg"
  },
  {
    id: "item-padrao-3", _tipo: "item", origem: "padrao",
    nome: "Amuleto do Viajante",
    tipo: "acessório",
    raridade: "normal",
    sintonizacao: "Não",
    efeito: "Concede resistência a cansaço de viagem. O portador nunca se perde em locais que já visitou e pode rolar Sobrevivência com vantagem.",
    imagem: "img/Itens/Amuleto-do-Viajante.jpg"
  },
  {
    id: "item-padrao-4", _tipo: "item", origem: "padrao",
    nome: "Frasco de Memórias",
    tipo: "poção",
    raridade: "raro",
    sintonizacao: "Não",
    efeito: "Ao quebrar, libera as memórias de quem o criou. Pode conter informações valiosas ou revelar segredos de um NPC. Conteúdo definido pelo Mestre.",
    imagem: "img/Itens/Frasco-de-Memórias.jpg"
  },
  {
    id: "item-padrao-5", _tipo: "item", origem: "padrao",
    nome: "Grimório das Chamas",
    tipo: "livro",
    raridade: "reliquia",
    sintonizacao: "Sim",
    efeito: "Contém 3 magias de fogo esquecidas. Ao sintonizar, o usuário aprende Bola de Fogo aprimorada (8d6). O livro queima qualquer um que tente lê-lo sem sintonização.",
    imagem: "img/Itens/Grimório-das-Chamas.jpg"
  }
];

const bossesPadrao = [
  {
    id: "boss-padrao-1", _tipo: "boss", origem: "padrao",
    nome: "Senhor das Sombras",
    tipo: "Morto-vivo",
    regiao: "Catacumbas Profundas",
    hpMax: 180, hpAtual: 180, ca: 17,
    status: { for: 20, des: 14, con: 18, int: 16, sab: 12, car: 18 },
    lore: "Um antigo senhor da guerra que fez um pacto com forças das trevas para escapar da morte. Governa um exército de mortos-vivos nas catacumbas sob a cidade esquecida.",
    habilidades: "Drenar Vida: ao acertar um golpe, recupera 10 HP. Aura de Terror: criaturas a até 10m fazem teste de sabedoria ou ficam amedrontadas.",
    fraquezas: "Luz sagrada causa dano dobrado. Fica enfraquecido ao amanhecer.",
    imagem: "img/Boss/Senhor-das-sombras.jpg",
    ataques: "Espada das Sombras: +8 para acertar, alcance 1,5m, 2d8+5 cortante. | Drenar Vida (ação bônus): +6 para acertar, 2d6 necrótico — recupera o mesmo em HP.",
    reacoes: "Escudo das Trevas: quando acertado, reduz 1d8 de dano.",
    resistencias: "Resistente a necrótico e veneno. Imune a medo e charme."
  },
  {
    id: "boss-padrao-2", _tipo: "boss", origem: "padrao",
    nome: "A Tecelã",
    tipo: "Aberração",
    regiao: "Floresta Corrompida",
    hpMax: 150, hpAtual: 150, ca: 15,
    status: { for: 16, des: 18, con: 14, int: 20, sab: 16, car: 8 },
    lore: "Uma entidade antiga que tece o destino dos mortais como fios. Habita o coração de uma floresta corrompida, manipulando os habitantes locais há séculos.",
    habilidades: "Fios do Destino: pode reescrever o resultado de um dado uma vez por rodada. Marionetes: controla até 3 humanoides simultaneamente.",
    fraquezas: "Seus fios podem ser cortados com lâminas abençoadas. Perde poderes longe da floresta.",
    imagem: "img/Boss/A-Tecela.jpg",
    ataques: "Fios Cortantes: +7 para acertar, alcance 3m, 2d6+4 cortante. | Lançar Marionete: CD 15 Sab ou força alvo a atacar um aliado.",
    reacoes: "Reescrever o Fado: cancela um acerto crítico sofrido uma vez por rodada.",
    resistencias: "Resistente a dano psíquico. Imune a encantamento."
  },
  {
    id: "boss-padrao-3", _tipo: "boss", origem: "padrao",
    nome: "Kargoth, o Devastador",
    tipo: "Gigante",
    regiao: "Montanhas do Norte",
    hpMax: 220, hpAtual: 220, ca: 16,
    status: { for: 24, des: 8, con: 22, int: 6, sab: 8, car: 10 },
    lore: "Um gigante de pedra exilado de seu clã por ser considerado cruel demais até para os seus. Constrói uma fortaleza nas montanhas usando trabalho forçado de aldeões capturados.",
    habilidades: "Golpe Devastador: causa 4d10 de dano e joga o alvo 6m para trás. Arremesso de Rocha: ataque à distância de 30m causando 3d8.",
    fraquezas: "Lento e previsível. Ataques em seus joelhos reduzem sua velocidade pela metade.",
    imagem: "img/Boss/Kargoth-o-Devastador.jpg",
    ataques: "Golpe Devastador: +10 para acertar, 4d10+7 contundente — empurra 6m. | Arremesso de Rocha: +8 para acertar, alcance 30m, 3d8+7 contundente.",
    reacoes: "Bloquear com o Corpo: reduz 2d10 de um ataque físico.",
    resistencias: "Resistente a dano físico não mágico. Vulnerável a raio."
  },
  {
    id: "boss-padrao-4", _tipo: "boss", origem: "padrao",
    nome: "Vespera",
    tipo: "Feiticeira",
    regiao: "Torre de Âmbar",
    hpMax: 120, hpAtual: 120, ca: 13,
    status: { for: 8, des: 14, con: 12, int: 22, sab: 16, car: 20 },
    lore: "Uma ex-conselheira real que foi banida por praticar magia proibida. Passou décadas aperfeiçoando feitiços de controle mental e busca vingança contra a coroa.",
    habilidades: "Dominação: controla um inimigo por 1 minuto. Contramagia: pode cancelar qualquer feitiço uma vez por rodada.",
    fraquezas: "Fisicamente fraca. Tem dificuldade em combate próximo e depende de seus lacaios.",
    imagem: "img/Boss/Vespera.jpg",
    ataques: "Cajado Arcano: +6 para acertar, 1d6+2 contundente. | Bola de Fogo: área 6m, CD 16 Des ou 8d6 fogo. | Raio Controlador: +8 para acertar, 4d6 raio — alvo atordoado.",
    reacoes: "Contramagia: cancela feitiço de 5º círculo ou menos.",
    resistencias: "Resistente a raio e força. Imune a medo."
  },
  {
    id: "boss-padrao-5", _tipo: "boss", origem: "padrao",
    nome: "O Guardião Sem Nome",
    tipo: "Construto",
    regiao: "Ruínas Antigas",
    hpMax: 200, hpAtual: 200, ca: 19,
    status: { for: 22, des: 10, con: 20, int: 4, sab: 10, car: 1 },
    lore: "Um golem colossal criado por uma civilização desaparecida para proteger seus segredos eternamente. Não tem vontade própria — apenas cumpre sua programação sem parar.",
    habilidades: "Imune a charme e medo. Regenera 15 HP por rodada a menos que tome dano de raio.",
    fraquezas: "Raio danifica seus mecanismos internos. Tem um símbolo de controle gravado nas costas.",
    imagem: "img/Boss/O-Guardião-Sem-Nome.jpg",
    ataques: "Punho de Pedra: +9 para acertar, 3d8+6 contundente. | Soco em Área: todos a 3m, CD 17 Des ou 2d10+6 contundente.",
    reacoes: "Estrutura Implacável: quando reduzido a 0 HP, teste CD 15 Con — se passar fica com 1 HP.",
    resistencias: "Imune a veneno, doença, charme e medo. Resistente a dano não mágico."
  }
];

const compendioPadrao = [
 {
  id: "padrao-goblin",
  origem: "padrao",
  nome: "Goblin",
  tipo: "Humanoide",
  regiao: "Cavernas, florestas e ruínas",
  hpMax: 7,
  hpAtual: 7,
  ca: 15,
  status: { for: 8, des: 14, con: 10, int: 10, sab: 8, car: 8 },
  lore: "Pequeno, traiçoeiro e covarde. Costuma atacar em grupo e fugir quando está em desvantagem.",
  habilidades: "Fuga ágil: pode escapar ou se esconder rapidamente.",
  dialogos: ["Peguem tudo que brilha!", "Corre! Corre!", "Você caiu na nossa armadilha!"],
  encontros: "Cavernas, acampamentos saqueadores e estradas abandonadas.",
  imagem: "img/monstros/Goblin.jpg"
},
  {
    id: "padrao-kobold",
    origem: "padrao",
    nome: "Kobold",
    tipo: "Humanoide dracônico",
    regiao: "Minas, túneis e covis de dragão",
    hpMax: 5,
    hpAtual: 5,
    ca: 12,
    status: { for: 7, des: 15, con: 9, int: 8, sab: 7, car: 8 },
    lore: "Criatura pequena e astuta, geralmente serve dragões ou vive em comunidades subterrâneas cheias de armadilhas.",
    habilidades: "Táticas de grupo: perigoso quando luta ao lado de aliados.",
    dialogos: ["O mestre dragão vai saber disso!", "Armadilha! Armadilha!", "Pequeno, mas mortal!"],
    encontros: "Minas abandonadas, túneis estreitos e covis subterrâneos.",
    imagem: "img/monstros/Kobold.jpg",
    ataques: "Cimitarra: +4 para acertar, 1d6+2 cortante. | Arco Curto: +4 para acertar, alcance 18/72m, 1d6+2 perfurante.",
    reacoes: "Fuga Ágil: usa Esconder ou Correr como ação bônus.",
    resistencias: "Sem resistências especiais."
  },
  {
    id: "padrao-bandit",
    origem: "padrao",
    nome: "Bandido",
    tipo: "Humanoide",
    regiao: "Estradas, vilas e acampamentos",
    hpMax: 11,
    hpAtual: 11,
    ca: 12,
    status: { for: 11, des: 12, con: 12, int: 10, sab: 10, car: 10 },
    lore: "Criminoso comum que vive de roubos, emboscadas e intimidação.",
    habilidades: "Ataque coordenado quando está em grupo.",
    dialogos: ["Passe a bolsa e ninguém se machuca.", "Isso aqui é nosso território.", "Peguem eles!"],
    encontros: "Estradas perigosas, tavernas suspeitas e acampamentos de saqueadores.",
    imagem: "img/monstros/Bandido.jpg",
    ataques: "Espada Curta: +3 para acertar, 1d6+1 perfurante. | Besta Leve: +3 para acertar, alcance 24/96m, 1d8+1 perfurante.",
    reacoes: "Sem reações especiais.",
    resistencias: "Sem resistências especiais."
  },
  {
    id: "padrao-skeleton",
    origem: "padrao",
    nome: "Esqueleto",
    tipo: "Morto-vivo",
    regiao: "Criptas, ruínas e cemitérios",
    hpMax: 13,
    hpAtual: 13,
    ca: 13,
    status: { for: 10, des: 14, con: 15, int: 6, sab: 8, car: 5 },
    lore: "Restos animados por magia necromântica, obedecem ordens simples sem questionar.",
    habilidades: "Não sente medo, dor ou cansaço.",
    dialogos: ["...", "Clac... clac...", "A morte... permanece..."],
    encontros: "Tumbas antigas, catacumbas e templos abandonados.",
    imagem: "img/monstros/Esqueleto.jpg",
    ataques: "Espada Curta: +4 para acertar, 1d6+2 perfurante. | Arco Curto: +4 para acertar, alcance 24/96m, 1d6+2 perfurante.",
    reacoes: "Sem reações especiais.",
    resistencias: "Vulnerável a dano contundente. Imune a veneno e doença."
  },
  {
    id: "padrao-zombie",
    origem: "padrao",
    nome: "Zumbi",
    tipo: "Morto-vivo",
    regiao: "Cemitérios, pântanos e cidades destruídas",
    hpMax: 22,
    hpAtual: 22,
    ca: 8,
    status: { for: 13, des: 6, con: 16, int: 3, sab: 6, car: 5 },
    lore: "Cadáver reanimado que avança lentamente, mas é difícil de derrubar.",
    habilidades: "Resistência morta-viva: pode continuar de pé mesmo após golpes fatais.",
    dialogos: ["Uuurgh...", "Carne...", "Aaah..."],
    encontros: "Cemitérios profanados, vilas amaldiçoadas e campos de batalha antigos.",
    imagem: "img/monstros/Zumbi.jpg",
    ataques: "Soco: +3 para acertar, 1d6+1 contundente.",
    reacoes: "Resistência Morta-viva: quando reduzido a 0 HP, teste CD 5 + dano recebido Con — se passar fica com 1 HP.",
    resistencias: "Imune a veneno e doença. Resistente a dano necrótico."
  },
  {
    id: "padrao-wolf",
    origem: "padrao",
    nome: "Lobo",
    tipo: "Besta",
    regiao: "Florestas e montanhas",
    hpMax: 11,
    hpAtual: 11,
    ca: 13,
    status: { for: 12, des: 15, con: 12, int: 3, sab: 12, car: 6 },
    lore: "Predador de matilha, rápido e perigoso quando cerca sua presa.",
    habilidades: "Tática de matilha: luta melhor ao lado de outros lobos.",
    dialogos: ["Grrrr...", "Auuuu!", "Rosna mostrando os dentes."],
    encontros: "Florestas escuras, trilhas nevadas e montanhas isoladas.",
    imagem: "img/monstros/Lobo.jpg",
    ataques: "Mordida: +4 para acertar, 2d4+2 perfurante — alvo CD 11 For ou fica derrubado.",
    reacoes: "Sem reações especiais.",
    resistencias: "Sem resistências especiais."
  },
  {
    id: "padrao-giant-rat",
    origem: "padrao",
    nome: "Rato Gigante",
    tipo: "Besta",
    regiao: "Esgotos, porões e ruínas",
    hpMax: 7,
    hpAtual: 7,
    ca: 12,
    status: { for: 7, des: 15, con: 11, int: 2, sab: 10, car: 4 },
    lore: "Rato enorme e agressivo, normalmente encontrado em bandos.",
    habilidades: "Mordida infecciosa e movimentação rápida em locais apertados.",
    dialogos: ["Squeak!", "Chiado agressivo.", "Fareja comida ou sangue."],
    encontros: "Esgotos, depósitos abandonados e masmorras úmidas.",
    imagem: "img/monstros/Rato-Gigante.jpg",
    ataques: "Mordida: +4 para acertar, 1d4+2 perfurante — CD 10 Con ou fica envenenado por 1 hora.",
    reacoes: "Sem reações especiais.",
    resistencias: "Sem resistências especiais."
  },
  {
    id: "padrao-orc",
    origem: "padrao",
    nome: "Orc",
    tipo: "Humanoide",
    regiao: "Montanhas, fortalezas e campos de guerra",
    hpMax: 15,
    hpAtual: 15,
    ca: 13,
    status: { for: 16, des: 12, con: 16, int: 7, sab: 11, car: 10 },
    lore: "Guerreiro brutal e impulsivo, valoriza força, conquista e intimidação.",
    habilidades: "Avanço agressivo: aproxima-se rapidamente do inimigo.",
    dialogos: ["Vou quebrar seus ossos!", "Fraco!", "Pelo clã!"],
    encontros: "Fortalezas tribais, campos de batalha e acampamentos de guerra.",
    imagem: "img/monstros/Orc.jpg",
    ataques: "Machadão: +5 para acertar, 1d12+3 cortante. | Lança: +5 para acertar, 1d6+3 perfurante.",
    reacoes: "Sem reações especiais.",
    resistencias: "Sem resistências especiais."
  },
  {
    id: "padrao-gnoll",
    origem: "padrao",
    nome: "Gnoll",
    tipo: "Humanoide monstruoso",
    regiao: "Savanas, desertos e campos devastados",
    hpMax: 22,
    hpAtual: 22,
    ca: 15,
    status: { for: 14, des: 12, con: 11, int: 6, sab: 10, car: 7 },
    lore: "Criatura feroz semelhante a uma hiena, movida por fome e violência.",
    habilidades: "Frenesi: fica mais perigoso quando derruba uma presa.",
    dialogos: ["Hahaha! Carne fresca!", "Rasgar! Morder!", "A caça começou!"],
    encontros: "Campos de batalha, vilas saqueadas e regiões selvagens.",
    imagem: "img/monstros/Gnoll.jpg",
    ataques: "Lança: +4 para acertar, 1d6+2 perfurante. | Mordida: +4 para acertar, 1d4+2 perfurante.",
    reacoes: "Frenesi Sanguinário: ao derrubar um inimigo, faz um ataque extra como ação bônus.",
    resistencias: "Sem resistências especiais."
  },
  {
    id: "padrao-bugbear",
    origem: "padrao",
    nome: "Bugbear",
    tipo: "Humanoide goblinoide",
    regiao: "Florestas, cavernas e fortalezas goblinoides",
    hpMax: 27,
    hpAtual: 27,
    ca: 16,
    status: { for: 15, des: 14, con: 13, int: 8, sab: 11, car: 9 },
    lore: "Grande, silencioso e cruel. Usa emboscadas para destruir inimigos desprevenidos.",
    habilidades: "Ataque surpresa: causa grande dano quando pega o alvo desprevenido.",
    dialogos: ["Silêncio... agora morra.", "Você não me viu chegando.", "Pequenos ossos quebram fácil."],
    encontros: "Cavernas escuras, ruínas tomadas por goblins e fortalezas escondidas.",
    imagem: "img/monstros/Bugbear.jpg",
    ataques: "Maça: +4 para acertar, 2d8+2 contundente. | Ataque Surpresa: +2d6 de dano extra no primeiro ataque.",
    reacoes: "Sem reações especiais.",
    resistencias: "Sem resistências especiais."
  },
  {
    id: "padrao-hobgoblin",
    origem: "padrao",
    nome: "Hobgoblin",
    tipo: "Humanoide goblinoide",
    regiao: "Fortes militares e territórios conquistados",
    hpMax: 11,
    hpAtual: 11,
    ca: 18,
    status: { for: 13, des: 12, con: 12, int: 10, sab: 10, car: 9 },
    lore: "Soldado disciplinado e estratégico, luta melhor em formação.",
    habilidades: "Vantagem marcial: aproveita aliados próximos para atacar melhor.",
    dialogos: ["Formação!", "Sem recuar!", "Pelo comandante!"],
    encontros: "Postos militares, fortalezas e patrulhas organizadas.",
    imagem: "img/monstros/Hobgoblin.jpg",
    ataques: "Espada Longa: +3 para acertar, 1d8+1 cortante. | Arco Longo: +3 para acertar, alcance 45/180m, 1d8+1 perfurante.",
    reacoes: "Sem reações especiais.",
    resistencias: "Sem resistências especiais."
  },
  {
    id: "padrao-giant-spider",
    origem: "padrao",
    nome: "Aranha Gigante",
    tipo: "Besta",
    regiao: "Florestas densas, cavernas e ruínas",
    hpMax: 26,
    hpAtual: 26,
    ca: 14,
    status: { for: 14, des: 16, con: 12, int: 2, sab: 11, car: 4 },
    lore: "Predadora silenciosa que prende vítimas em teias antes de atacar.",
    habilidades: "Teia e veneno: pode imobilizar e envenenar suas presas.",
    dialogos: ["Som de patas nas paredes.", "A criatura observa em silêncio.", "Teias se movem ao redor."],
    encontros: "Cavernas, ruínas tomadas por teias e florestas antigas.",
    imagem: "img/monstros/Aranha-Gigante.jpg",
    ataques: "Mordida: +5 para acertar, 1d8+3 perfurante — CD 11 Con ou 2d8 veneno. | Teia (recarga 5-6): alcance 9/18m, CD 12 Des ou fica imobilizado.",
    reacoes: "Sem reações especiais.",
    resistencias: "Imune a veneno."
  },

  {
    id: "padrao-bananao",
    origem: "padrao",
    nome: "Bananao",
    tipo: "Fruta",
    regiao: "Florestas densas Bananeiras.",
    hpMax: 250,
    hpAtual: 250,
    ca: 14,
    status: { for: 20, des: 20, con: 20, int: 20, sab: 20, car: 20 },
    lore: "Um ser que cansou de ser comido e virou sua maior ameaça.",
    habilidades: "Onda de vitamina, Suquinho natural de banana",
    dialogos: ["Som de liquidificador", "A criatura observa em silêncio.", "Cascas de banana se movem ao redor."],
    encontros: "florestas antigas.",
    imagem: "img/monstros/Bananao.png",
    ataques: "Rasteira de Casca: +8 para acertar, alcance 3m, 3d8+5 — alvo cai derrubado. | Esguicho de Vitamina C: cone 6m, CD 16 Des ou 4d6 ácido.",
    reacoes: "Casca Escorregadia: atacante corpo a corpo CD 12 Des ou cai.",
    resistencias: "Imune a dano ácido. Resistente a dano contundente."
  },

  {
    id: "padrao-ogre",
    origem: "padrao",
    nome: "Ogro",
    tipo: "Gigante",
    regiao: "Colinas, cavernas e pântanos",
    hpMax: 59,
    hpAtual: 59,
    ca: 11,
    status: { for: 19, des: 8, con: 16, int: 5, sab: 7, car: 7 },
    lore: "Criatura enorme, burra e brutal, resolve quase tudo esmagando.",
    habilidades: "Golpes pesados capazes de derrubar aventureiros despreparados.",
    dialogos: ["Eu esmagar!", "Pequeno demais!", "Comida?"],
    encontros: "Cavernas grandes, pontes abandonadas e fortalezas destruídas.",
    imagem: "img/monstros/Ogro.jpg",
    ataques: "Clava: +6 para acertar, 2d8+4 contundente. | Arremesso: +6 para acertar, alcance 9/18m, 2d8+4 contundente.",
    reacoes: "Sem reações especiais.",
    resistencias: "Sem resistências especiais."
  },
  {
    id: "padrao-troll",
    origem: "padrao",
    nome: "Troll",
    tipo: "Gigante",
    regiao: "Pântanos, cavernas e florestas sombrias",
    hpMax: 84,
    hpAtual: 84,
    ca: 15,
    status: { for: 18, des: 13, con: 20, int: 7, sab: 9, car: 7 },
    lore: "Monstro regenerativo e faminto, conhecido por voltar a lutar mesmo após ferimentos horríveis.",
    habilidades: "Regeneração: recupera vida rapidamente, exceto contra fogo ou ácido.",
    dialogos: ["Arrancar braços!", "Fome! Fome!", "Você queima... eu odeio fogo!"],
    encontros: "Pontes antigas, pântanos, cavernas úmidas e florestas amaldiçoadas.",
    imagem: "img/monstros/Troll.jpg",
    ataques: "Mordida: +7 para acertar, 1d6+4 perfurante. | Garra (2 ataques): +7 para acertar, 2d6+4 cortante cada.",
    reacoes: "Sem reações especiais.",
    resistencias: "Regenera 10 HP por rodada — exceto contra fogo ou ácido. Vulnerável a fogo e ácido."
  }
];

window.monstrosMestre = JSON.parse(localStorage.getItem("monstrosMestre")) || [];
let monstrosMestre = window.monstrosMestre;

window.combatesMestre = JSON.parse(localStorage.getItem("combatesMestre")) || [];
let combatesMestre = window.combatesMestre;

let editandoMonstroMestre = -1;
let editandoItemMestre = -1;
let imagemMonstroBase64 = "";
let sheetMonstroIndexAtual = null;
let listaSheetCompendio = [];
let sheetDragInicioX = 0;
let sheetDragInicioY = 0;
let sheetArrastando = false;

function abrirTelaModo() {
  document.querySelector(".header-rpg")?.style.removeProperty("display");
  document.querySelector(".folhas-bg")?.style.removeProperty("display");

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("tela-inicial").style.display = "none";
  document.getElementById("masterIgnea").style.display = "none";

  const campanhas = document.getElementById("telaCampanhasMaster");
  if (campanhas) campanhas.style.display = "none";

  const tela = document.getElementById("tela-modo");
  tela.style.display = "flex";

  // reset estado da tela (o visual de selecionado fica no data-sel; sem limpar ele, o botão aparecia mas não funcionava)
  delete tela.dataset.sel;
  window._tmEntrando = false;
  const btnE = document.getElementById('tmBtnEntrar');
  if (btnE) btnE.classList.remove('apertado');
  if (typeof tmSelected !== 'undefined') {
    window.tmSelected = null;
    const cj = document.getElementById('tmCardJornada');
    const cg = document.getElementById('tmCardGrimorio');
    if (cj) { cj.style.borderColor = ''; cj.style.transform = ''; cj.style.opacity = ''; }
    if (cg) { cg.style.borderColor = ''; cg.style.transform = ''; cg.style.opacity = ''; }
    const ckj = document.getElementById('tmCheckJornada');
    const ckg = document.getElementById('tmCheckGrimorio');
    if (ckj) { ckj.style.opacity = '0'; ckj.style.transform = 'scale(0.5)'; }
    if (ckg) { ckg.style.opacity = '0'; ckg.style.transform = 'scale(0.5)'; }
    const btn = document.getElementById('tmBtnEntrar');
    if (btn) { btn.disabled = true; btn.style.cssText = 'width:90%;max-width:380px;padding:18px 32px;border-radius:9999px;border:1px solid rgba(78, 78, 78, 0.4);background:transparent;color:rgba(100, 100, 100, 0.5);font-family:Cinzel,serif;font-size:18px;font-weight:700;letter-spacing:0.18em;cursor:not-allowed;transition:all 0.4s ease;margin:0 auto 28px auto;display:block;text-align:center;overflow:hidden;'; }
    const desc = document.getElementById('tmDesc');
    if (desc) desc.innerHTML = '<p class="tm-dica">✦ Toque em um caminho para escolher ✦</p>';
    ['tmDivJornada','tmDivGrimorio'].forEach(function (id) { const d = document.getElementById(id); if (d) { d.style.width = ''; d.style.background = ''; } });
    document.getElementById('tmBgJornada').style.opacity = '0';
    document.getElementById('tmBgGrimorio').style.opacity = '0';
  }

  tela.style.opacity = "0";
  tela.style.transform = "scale(1.06)";

  requestAnimationFrame(() => {
    tela.style.transition = "transform 0.45s ease, opacity 0.45s ease";
    tela.style.opacity = "1";
    tela.style.transform = "scale(1)";
  });
}



function entrarModoMestreAnimado() {
  const tela = document.getElementById("tela-modo");
  if (!tela) return;

  tela.classList.add("zoom-grimorio");

  setTimeout(() => {
    tela.classList.remove("zoom-grimorio");
    entrarModoMestre();
    tela.style.opacity = "1";
    tela.style.transform = "scale(1)";
  }, 550);
}

function esconderTelasPrincipais() {
  const ids = [
    "loginBox",
    "tela-modo",
    "tela-inicial",
    "ficha",
    "masterIgnea"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

function entrarModoJogador() {
  controlarHeader(true);

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("tela-modo").style.display = "none";
  document.getElementById("masterIgnea").style.display = "none";
  document.getElementById("ficha").style.display = "none";
  document.getElementById("tela-inicial").style.display = "block";

  if (typeof renderPersonagens === "function") {
    renderPersonagens();
  }
}

function voltarTelaModo() {
  abrirTelaModo();
}

function trocarAbaMaster(nomeAba, btn) {
  fecharSheetMonstro();

  document.querySelector('.header-rpg').style.display = 'none';
  document.querySelectorAll(".master-aba").forEach(aba => {
    aba.style.display = "none";
    aba.classList.remove("active");
  });

  document.querySelectorAll(".master-tab-btn").forEach(botao => {
    botao.classList.remove("active");
  });

  const alvo = document.getElementById(`abaMaster-${nomeAba}`);
  if (alvo) {
    alvo.style.display = "block";
    alvo.classList.add("active");
  }

 if (nomeAba === "mundo") {
  inicializarAbaMundo();
  renderMundoCampanha();
}

if (nomeAba === "lore") {
  setTimeout(() => renderLoreCampanha(), 50);
}

  const titulosAba = {
  lore: "Lore",
  mundo: "Mundo",
  compendio: "Compêndio",
  criar: "Criar",
  combateMaster: "Combate",
  grupoMaster: "Grupo"
};

const botaoAtivo = document.querySelector(
  `.master-tab-btn[title="${titulosAba[nomeAba]}"]`
);

if (botaoAtivo) {
  botaoAtivo.classList.add("active");
}

  if (nomeAba === "compendio") {
  injetarFiltrosCompendio();
  renderMonstrosMestre();
}
  if (nomeAba === "combateMaster") renderCombatesMestre();
  if (nomeAba === "grupoMaster" && typeof window.renderGrupoMaster === "function") window.renderGrupoMaster();
}

function injetarFiltrosCompendio() {
  const controles = document.querySelector(".compendio-controles");
  if (!controles || document.getElementById("filtroTipoMonstro")) return;

  const select = document.createElement("select");
  select.id = "filtroTipoMonstro";
  select.innerHTML = `
    <option value="todos">📚 Todos</option>
    <option value="monstros">👹 Criaturas</option>
    <option value="bosses">💀 Bosses</option>
    <option value="npcs">🧙 NPCs</option>
    <option value="itens">⚔️ Itens</option>
    <option value="mapas">🗺️ Mapas</option>
  `;  
  select.onchange = () => {
    _filtroCompendio = select.value;
    renderMonstrosMestre();
  };

  const ordenar = document.getElementById("ordenarMonstros");
  ordenar.after(select);
}

function _estiloBtnFiltro(ativo) {
  return `
    padding:6px 14px;
    border-radius:999px;
    border:1px solid ${ativo ? "rgba(200,80,80,0.55)" : "rgba(216,200,170,0.18)"};
    background:${ativo ? "linear-gradient(180deg,#5f1717,#2a0b0b)" : "rgba(14,11,9,0.6)"};
    color:${ativo ? "#f1dfbd" : "#a08060"};
    font-size:13px;
    font-weight:bold;
    cursor:pointer;
    transition:0.18s;
    white-space:nowrap;
  `;
}



function ativarFiltroCompendio(key) {
  _filtroCompendio = key;
  document.querySelectorAll(".compendio-filtro-btn").forEach(btn => {
    btn.style.cssText = _estiloBtnFiltro(btn.dataset.filtro === key);
  });
  renderMonstrosMestre();
}

function salvarMonstrosMestreStorage() {
  localStorage.setItem("monstrosMestre", JSON.stringify(monstrosMestre));
  window.monstrosMestre = monstrosMestre;

  if (typeof window.salvarMonstrosNaNuvem === "function") {
    window.salvarMonstrosNaNuvem();
  }
}

function salvarCombatesMestreStorage() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (campanha) {
    campanha.combates = combatesMestre;
    salvarCampanhasMaster();
  }

  localStorage.setItem("combatesMestre", JSON.stringify(combatesMestre));
  window.combatesMestre = combatesMestre;

  if (typeof window.salvarMonstrosNaNuvem === "function") {
    window.salvarMonstrosNaNuvem();
  }
}

function previewImagemMonstro() {
  const input = document.getElementById("monstroImagemInput");
  const preview = document.getElementById("previewMonstro");

  if (!input || !input.files || !input.files[0]) return;

  const file = input.files[0];

  const reader = new FileReader();

  reader.onload = function (e) {
    const img = new Image();

    img.onload = function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // 🔥 tamanho máximo
      const maxWidth = 500;
      const scale = maxWidth / img.width;

      canvas.width = maxWidth;
      canvas.height = img.height * scale;

      // desenha comprimida
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 🔥 qualidade 0.65
      imagemMonstroBase64 = canvas.toDataURL("image/jpeg", 0.65);

      if (preview) {
        preview.src = imagemMonstroBase64;
        preview.style.display = "block";
      }
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(file);
}

// Comprime a imagem antes de virar base64 (evita ficha estourar o limite do Firestore)
function comprimirImagem(file, maxLado = 900, qualidade = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo de imagem inválido"));
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxLado) { h = Math.round((h * maxLado) / w); w = maxLado; }
        else if (h >= w && h > maxLado) { w = Math.round((w * maxLado) / h); h = maxLado; }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", qualidade));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function _previewImagemGenerica(inputId, previewId, setter) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input?.files?.[0]) return;
  try {
    const base64 = await comprimirImagem(input.files[0]);
    setter(base64);
    if (preview) { preview.src = base64; preview.style.display = "block"; }
  } catch (e) {
    console.error("Erro ao processar imagem:", e);
    alertBonito("Não consegui processar essa imagem. Tente outra.");
    input.value = "";
  }
}

async function uploadImagemFirebase(base64, caminho) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch("https://ficha-ignea-upload.fichaignea.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagemBase64: base64.split(",")[1] }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    if (!data.erro) return { url: data.url, deleteUrl: data.deleteUrl };
    throw new Error(data.motivo || `Upload falhou (status ${response.status})`);
  } catch (e) {
    console.error("Erro upload imagem ImgBB:", e.message || e);
    // NUNCA devolver o base64 aqui — era isso que estourava o documento no Firestore
    return { url: "", deleteUrl: "", erro: true, motivo: e.message || "" };
  }
}

function _mensagemErroUpload(complemento) {
  if (!navigator.onLine) {
    return `Você está sem internet no momento. Conecte-se e tente enviar a imagem de novo. ${complemento || ""}`.trim();
  }
  return `O serviço de imagens está fora do ar no momento. Tente enviar a foto de novo daqui a pouco. ${complemento || ""}`.trim();
}

async function salvarMonstroMestre() {
  const nome = document.getElementById("monstroNome")?.value.trim();
  const tipo = document.getElementById("monstroTipo")?.value.trim();
  const regiao = document.getElementById("monstroRegiao")?.value.trim();

  if (!nome) {
    alertBonito("Coloque o nome do monstro.");
    return;
  }

  const hpMax = parseInt(document.getElementById("monstroHpMax")?.value) || 0;
  let hpAtual = parseInt(document.getElementById("monstroHpAtual")?.value);

  if (isNaN(hpAtual)) hpAtual = hpMax;

  const monstroAntigo = editandoMonstroMestre >= 0
    ? monstrosMestre[editandoMonstroMestre]
    : null;

  const monstro = {
    id: monstroAntigo ? monstroAntigo.id : Date.now(),

    nome,
    tipo,
    regiao,
    hpMax,
    hpAtual,
    ca: parseInt(document.getElementById("monstroCa")?.value) || 0,

    status: {
      for: parseInt(document.getElementById("monstroFor")?.value) || 10,
      des: parseInt(document.getElementById("monstroDes")?.value) || 10,
      con: parseInt(document.getElementById("monstroCon")?.value) || 10,
      int: parseInt(document.getElementById("monstroInt")?.value) || 10,
      sab: parseInt(document.getElementById("monstroSab")?.value) || 10,
      car: parseInt(document.getElementById("monstroCar")?.value) || 10
    },

    lore: document.getElementById("monstroLore")?.value.trim() || "",
    habilidades: document.getElementById("monstroHabilidades")?.value.trim() || "",
    ataques:     document.getElementById("monstroAtaques")?.value.trim()     || "",
    velocidade: document.getElementById("monstroVelocidade")?.value.trim() || "",
    saves:      document.getElementById("monstroSaves")?.value.trim() || "",
    sentidos:   document.getElementById("monstroSentidos")?.value.trim() || "",
    idiomas:    document.getElementById("monstroIdiomas")?.value.trim() || "",
    reacoes:     document.getElementById("monstroReacoes")?.value.trim()     || "",
    resistencias: document.getElementById("monstroResistencias")?.value.trim() || "",
    imunidades: document.getElementById("monstroImunidades")?.value.trim() || "",
    vulnerabilidades: document.getElementById("monstroVulnerabilidades")?.value.trim() || "",
    pontoEncontro: document.getElementById("bossPontoEncontro")?.value.trim() || "",

    dialogos: (document.getElementById("monstroDialogos")?.value || "")
      .split("\n")
      .map(fala => fala.trim())
      .filter(fala => fala.length > 0),

    encontros: document.getElementById("monstroEncontros")?.value.trim() || "",
    ...(imagemMonstroBase64
    ? await uploadImagemFirebase(imagemMonstroBase64, `monstros/${Date.now()}.jpg`).then(r => ({ imagem: r.url, imagemDeleteUrl: r.deleteUrl }))
    : { imagem: monstroAntigo?.imagem || "", imagemDeleteUrl: monstroAntigo?.imagemDeleteUrl || "" })
  };

  if (editandoMonstroMestre >= 0) {
    monstrosMestre[editandoMonstroMestre] = monstro;
  } else {
    monstrosMestre.push(monstro);
  }

  salvarMonstrosMestreStorage();
  renderMonstrosMestre();
  limparFormMonstro();
  atualizarModsMonstro();
  const btnCompendio = document.querySelector(".master-tab-btn");
  trocarAbaMaster("compendio", btnCompendio);
}



// ===== BOSS =====
let _bossAtaquesForm = [];
let _bossHabilidadesForm = [];

function adicionarAtaqueBoss() {
  const nome = document.getElementById("bossAtaqueNome")?.value.trim();
  const desc = document.getElementById("bossAtaqueDesc")?.value.trim();
  if (!nome) return;
  _bossAtaquesForm.push({ nome, desc });
  document.getElementById("bossAtaqueNome").value = "";
  document.getElementById("bossAtaqueDesc").value = "";
  _renderItemForm("bossAtaquesList", _bossAtaquesForm, "removerAtaqueBoss", "bossAtaques");
}
function removerAtaqueBoss(i) {
  _bossAtaquesForm.splice(i, 1);
  _renderItemForm("bossAtaquesList", _bossAtaquesForm, "removerAtaqueBoss", "bossAtaques");
}
function adicionarHabilidadeBoss() {
  const nome = document.getElementById("bossHabilidadeNome")?.value.trim();
  const desc = document.getElementById("bossHabilidadeDesc")?.value.trim();
  if (!nome) return;
  _bossHabilidadesForm.push({ nome, desc });
  document.getElementById("bossHabilidadeNome").value = "";
  document.getElementById("bossHabilidadeDesc").value = "";
  _renderItemForm("bossHabilidadesList", _bossHabilidadesForm, "removerHabilidadeBoss", "bossHabilidades");
}
function removerHabilidadeBoss(i) {
  _bossHabilidadesForm.splice(i, 1);
  _renderItemForm("bossHabilidadesList", _bossHabilidadesForm, "removerHabilidadeBoss", "bossHabilidades");
}

// ===== NPC =====
let _npcAcoesForm = [];
let _npcHabilidadesForm = [];

function adicionarAcaoNpc() {
  const nome = document.getElementById("npcAcaoNome")?.value.trim();
  const desc = document.getElementById("npcAcaoDesc")?.value.trim();
  if (!nome) return;
  _npcAcoesForm.push({ nome, desc });
  document.getElementById("npcAcaoNome").value = "";
  document.getElementById("npcAcaoDesc").value = "";
  _renderItemForm("npcAcoesList", _npcAcoesForm, "removerAcaoNpc", "npcAcoes");
}
function removerAcaoNpc(i) {
  _npcAcoesForm.splice(i, 1);
  _renderItemForm("npcAcoesList", _npcAcoesForm, "removerAcaoNpc", "npcAcoes");
}
function adicionarHabilidadeNpc() {
  const nome = document.getElementById("npcHabilidadeNome")?.value.trim();
  const desc = document.getElementById("npcHabilidadeDesc")?.value.trim();
  if (!nome) return;
  _npcHabilidadesForm.push({ nome, desc });
  document.getElementById("npcHabilidadeNome").value = "";
  document.getElementById("npcHabilidadeDesc").value = "";
  _renderItemForm("npcHabilidadesList", _npcHabilidadesForm, "removerHabilidadeNpc", "npcHabilidades");
}
function removerHabilidadeNpc(i) {
  _npcHabilidadesForm.splice(i, 1);
  _renderItemForm("npcHabilidadesList", _npcHabilidadesForm, "removerHabilidadeNpc", "npcHabilidades");
}

// ===== HELPER GENÉRICO =====
function _renderItemForm(listaId, arr, fnRemover, hiddenId) {
  const lista = document.getElementById(listaId);
  if (!lista) return;
  lista.innerHTML = arr.map((a, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#F0EBD8;border-radius:8px;margin-bottom:4px;border:1px solid rgba(196,169,91,0.2);">
      <span style="font-size:13px;flex:1;color:#2A1A10;"><strong>${escapeHtml(a.nome)}</strong>${a.desc ? ` — <span style="color:#7A6A50;">${escapeHtml(a.desc)}</span>` : ""}</span>
      <span onclick="${fnRemover}(${i})" style="cursor:pointer;color:#8f2222;font-size:16px;font-weight:bold;">✕</span>
    </div>`).join("");
  const hidden = document.getElementById(hiddenId);
  if (hidden) hidden.value = arr.map(a => a.desc ? `${a.nome}: ${a.desc}` : a.nome).join(" | ");
}

// ===== SISTEMA DE ATAQUES E HABILIDADES DO FORM =====

let _monstroAtaquesForm = [];
let _monstroHabilidadesForm = [];

function adicionarAtaqueMonstro() {
  const nome = document.getElementById("monstroAtaqueNome")?.value.trim();
  const desc = document.getElementById("monstroAtaqueDesc")?.value.trim();
  if (!nome) return;
  _monstroAtaquesForm.push({ nome, desc });
  document.getElementById("monstroAtaqueNome").value = "";
  document.getElementById("monstroAtaqueDesc").value = "";
  renderAtaquesForm();
}

function removerAtaqueMonstro(i) {
  _monstroAtaquesForm.splice(i, 1);
  renderAtaquesForm();
}

function renderAtaquesForm() {
  _renderItemForm("monstroAtaquesList", _monstroAtaquesForm, "removerAtaqueMonstro", "monstroAtaques");
}

function adicionarHabilidadeMonstro() {
  const nome = document.getElementById("monstroHabilidadeNome")?.value.trim();
  const desc = document.getElementById("monstroHabilidadeDesc")?.value.trim();
  if (!nome) return;
  _monstroHabilidadesForm.push({ nome, desc });
  document.getElementById("monstroHabilidadeNome").value = "";
  document.getElementById("monstroHabilidadeDesc").value = "";
  renderHabilidadesForm();
}

function removerHabilidadeMonstro(i) {
  _monstroHabilidadesForm.splice(i, 1);
  renderHabilidadesForm();
}

function renderHabilidadesForm() {
  _renderItemForm("monstroHabilidadesList", _monstroHabilidadesForm, "removerHabilidadeMonstro", "monstroHabilidades");
}

function limparFormMonstro() {
  editandoMonstroMestre = -1;
  imagemMonstroBase64 = "";
  _monstroAtaquesForm = [];
  _monstroHabilidadesForm = [];
  renderAtaquesForm();
  renderHabilidadesForm();

  const campos = [
    "monstroNome",
    "monstroTipo",
    "monstroRegiao",
    "monstroHpMax",
    "monstroHpAtual",
    "monstroCa",
    "monstroLore",
    "monstroHabilidades","monstroAtaques","monstroReacoes","monstroResistencias",
    "monstroVelocidade","monstroSaves","monstroSentidos","monstroIdiomas",
    "monstroImunidades","monstroVulnerabilidades",
    "monstroDialogos",
    "monstroEncontros"
  ];

  campos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  const statusPadrao = {
    monstroFor: 10,
    monstroDes: 10,
    monstroCon: 10,
    monstroInt: 10,
    monstroSab: 10,
    monstroCar: 10
  };

  Object.keys(statusPadrao).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = statusPadrao[id];
  });

  const inputImagem = document.getElementById("monstroImagemInput");
  if (inputImagem) inputImagem.value = "";

  const preview = document.getElementById("previewMonstro");
  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }

  const titulo = document.getElementById("tituloFormMonstro");
  if (titulo) titulo.textContent = "Criar Monstro";
}

function renderMonstrosMestre() {
  const lista = document.getElementById("listaMonstrosMestre");
  if (!lista) return;

  lista.innerHTML = "";

  const campanha = campanhasMaster?.[campanhaAtualMaster] || {};

    const monstrosBase = [...(compendioPadrao || []), ...(monstrosMestre || []).filter(m => !m._tipo)];
  const bossesBase   = [...(bossesPadrao || []), ...(monstrosMestre || []).filter(m => m._tipo === "boss")];
  const itensBase    = [...(itensPadrao || []), ...(monstrosMestre || []).filter(m => m._tipo === "item")];
  const npcsBase = [...(npcsPadrao || []), ...(monstrosMestre || []).filter(m => m._tipo === "npc")];
  const mapasBase = (monstrosMestre || []).filter(m => m._tipo === "mapa");

  let listaCompleta;
  switch (_filtroCompendio) {
    case "monstros": listaCompleta = monstrosBase; break;
    case "bosses":   listaCompleta = bossesBase;   break;
    case "itens":    listaCompleta = itensBase;    break;
    case "npcs":     listaCompleta = npcsBase;     break;
    case "mapas":    listaCompleta = mapasBase;    break;
    default:         listaCompleta = [...monstrosBase, ...bossesBase, ...itensBase, ...npcsBase, ...mapasBase];
  }

  const pesquisa = document.getElementById("pesquisaMonstro")?.value?.toLowerCase().trim() || "";
  let listaFiltrada = pesquisa
    ? listaCompleta.filter(e =>
        (e.nome   || "").toLowerCase().includes(pesquisa) ||
        (e.tipo   || "").toLowerCase().includes(pesquisa) ||
        (e.regiao || "").toLowerCase().includes(pesquisa) ||
        (e.classe || "").toLowerCase().includes(pesquisa)
      )
    : [...listaCompleta];

  const ordenacao = document.getElementById("ordenarMonstros")?.value || "az";
  listaFiltrada.sort((a, b) => {
    if (ordenacao === "az")      return (a.nome || "").localeCompare(b.nome || "");
    if (ordenacao === "za")      return (b.nome || "").localeCompare(a.nome || "");
    if (ordenacao === "hpMaior") return (b.hpMax || 0) - (a.hpMax || 0);
    if (ordenacao === "hpMenor") return (a.hpMax || 0) - (b.hpMax || 0);
    if (ordenacao === "caMaior") return (b.ca || 0) - (a.ca || 0);
    if (ordenacao === "caMenor") return (a.ca || 0) - (b.ca || 0);
    if (ordenacao === "criaturas") {
      const ordemTipo = { boss: 0 };
      const ta = ordemTipo[a._tipo] ?? 1;
      const tb = ordemTipo[b._tipo] ?? 1;
      return ta !== tb ? ta - tb : (a.nome || "").localeCompare(b.nome || "");
    }
    if (ordenacao === "npcs") {
      const ordemRel = { inimigo: 0, neutro: 1, aliado: 2 };
      const ra = ordemRel[a.relacao] ?? 1;
      const rb = ordemRel[b.relacao] ?? 1;
      return ra !== rb ? ra - rb : (a.nome || "").localeCompare(b.nome || "");
    }
    if (ordenacao === "itens") {
      const ordemRar = { lendario: 0, muitoraro: 1, raro: 2, incomum: 3, comum: 4 };
      const ra = ordemRar[a.raridade] ?? 4;
      const rb = ordemRar[b.raridade] ?? 4;
      return ra !== rb ? ra - rb : (a.nome || "").localeCompare(b.nome || "");
    }
    return 0;
  });

  listaSheetCompendio = listaFiltrada;

  if (!listaFiltrada.length) {
    const msgs = {
      todos:    "Nenhum resultado encontrado.",
      monstros: "Nenhum monstro ainda.",
      bosses:   "Nenhum boss criado.\nCrie um na aba ✍️ Criar.",
      itens:    "Nenhum item criado.\nCrie um na aba ✍️ Criar.",
      npcs:     "Nenhum NPC criado.\nCrie um na aba ✍️ Criar.",
      mapas:    "Nenhum mapa criado.\nCrie um na aba ✍️ Criar.",
    };
    lista.innerHTML = `<p style="text-align:center;color:#cdb791;grid-column:1/-1;padding:24px 0;white-space:pre-line;">${msgs[_filtroCompendio] || msgs.todos}</p>`;
    return;
  }

  listaFiltrada.forEach((entry, index) => {
    const card = document.createElement("div");
    card.className = "compendio-card";
    card.style.backgroundImage = `url("${entry.imagem || "icon-512.png"}")`;

    card.onclick = () => {
      const tipo = entry._tipo;
      if (!tipo) {
      const idxNaLista = listaFiltrada.findIndex(e => e.id === entry.id);
      abrirSheetMonstroPorObjeto(entry, idxNaLista, listaFiltrada);
      }
      else if (tipo === "boss") { sheetMonstroIndexAtual = index; listaSheetCompendio = listaFiltrada; _abrirPopupBossCompendio(entry); }
      else if (tipo === "item") { sheetMonstroIndexAtual = index; listaSheetCompendio = listaFiltrada; _abrirPopupItemCompendio(entry); }
      else if (tipo === "npc")  { sheetMonstroIndexAtual = index; listaSheetCompendio = listaFiltrada; _abrirPopupNPCCompendio(entry); }
      else if (tipo === "mapa") { sheetMonstroIndexAtual = index; listaSheetCompendio = listaFiltrada; _abrirPopupMapaCompendio(entry); }
    };

    const badge = { boss:"💀 Boss", item:"⚔️ Item", npc:"🧙 NPC", mapa:"🗺️ Mapa" }[entry._tipo] || "👹 Criatura";
    const subtitulo = entry._tipo === "item"
      ? [entry.tipo, ({comum:"Comum",incomum:"Incomum",raro:"Raro",muitoraro:"Muito Raro",lendario:"Lendário"})[entry.raridade], entry.classificacao === "artefato" ? "Artefato" : ""].filter(Boolean).join(" · ")
      : entry._tipo === "npc"
        ? [entry.raca, entry.classe].filter(Boolean).join(" · ")
        : (entry.tipo || "Tipo não definido");
    const stats = entry._tipo === "item"
      ? (entry.sintonia === "sim" ? "✦ Sintonização" : "")
      : entry._tipo === "npc"
        ? (entry.regiao || "")
        : `HP ${entry.hpAtual ?? entry.hpMax ?? 0}/${entry.hpMax ?? 0} • CA ${entry.ca || 0}`;

    const ehCriado = entry._tipo === "boss" || entry._tipo === "item" || entry._tipo === "npc" || (!entry._tipo && monstrosMestre.includes(entry));

    card.innerHTML = `
      <div class="compendio-info">
        <small style="opacity:0.7">${badge}</small>
        <strong>${escapeHtml(entry.nome || "Sem nome")}</strong>
        <small>${escapeHtml(subtitulo)}</small>
        <span>${escapeHtml(stats)}</span>

      </div>
    `;

    lista.appendChild(card);
  });
}

function selecionarDificuldade(valor, btn) {
  document.querySelectorAll('.criar-dif-btn').forEach(b => b.classList.remove('ativo'));
  btn.classList.add('ativo');
  document.getElementById('encontroDificuldade').value = valor;
}

/* ================= MAPAS ================= */

function previewMapaImagem() {
  const input = document.getElementById("mapaImagem");
  const preview = document.getElementById("mapaPreview");
  const box = document.getElementById("mapaPreviewBox");
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    mapaBase64Temp = e.target.result;
    preview.src = mapaBase64Temp;
    box.style.display = "block";
  };
  reader.readAsDataURL(input.files[0]);
}

async function addMapa() {
  const nome = document.getElementById("mapaNome").value.trim();
  const desc = document.getElementById("mapaDesc").value.trim();

  if (!nome) { alertBonito("Coloque o nome do mapa."); return; }
  if (!mapaBase64Temp) { alertBonito("Escolha uma imagem para o mapa."); return; }

  if (mapas.length >= 15) { alertBonito("Limite de 15 mapas por personagem."); return; }

  const btn = document.querySelector("#boxMapasForm .inv-add-btn");
  if (btn) { btn.disabled = true; rotuloBotaoAdd(btn, "Enviando..."); }

  let imagemUrl = "";
  let imagemDeleteUrl = "";

  const resultado = await uploadImagemFirebase(mapaBase64Temp, "mapa");
  if (resultado.erro || !resultado.url) {
    alertBonito(_mensagemErroUpload("O mapa foi salvo sem imagem."))
    if (btn) { btn.disabled = false; rotuloBotaoAdd(btn, null); }
    return;
  }
  imagemUrl = resultado.url;
  imagemDeleteUrl = resultado.deleteUrl;

  mapas.push({ nome, desc, imagemUrl, imagemDeleteUrl, anotacoes: [] });

  document.getElementById("mapaNome").value = "";
  document.getElementById("mapaDesc").value = "";
  document.getElementById("mapaImagem").value = "";
  document.getElementById("mapaPreviewBox").style.display = "none";
  mapaBase64Temp = "";

  if (btn) { btn.disabled = false; rotuloBotaoAdd(btn, null); }

  salvarTudo();
  renderMapas();
}

function renderMapas() {
  const ul = document.getElementById("listaMapas");
  if (!ul) return;
  ul.innerHTML = "";

  mapas.forEach((mapa, index) => {
    const li = document.createElement("li");
    li.className = "mapa-card";

    const thumbHTML = mapa.imagemUrl
      ? `<img class="mapa-card-thumb" src="${mapa.imagemUrl}" />`
      : `<div class="mapa-card-thumb-placeholder">🗺</div>`;

    li.innerHTML = `
      ${thumbHTML}
      <div class="mapa-card-info" onclick="verMapa(${index})">
        <div class="mapa-card-nome">${esc(mapa.nome)}</div>
        <div class="mapa-card-desc">${esc(mapa.desc) || "Sem descrição"}</div>
        <div class="mapa-card-desc" style="color:#b89654;margin-top:4px">${(mapa.anotacoes||[]).length}/30 anotações</div>
      </div>
      <div class="mapa-card-acoes">
        <button class="btn-abrir-mapa" onclick="event.stopPropagation(); verMapa(${index})">Ver</button>
        <button class="btn-remover-mapa" onclick="event.stopPropagation(); removerMapa(${index})">X</button>
      </div>
    `;

    ul.appendChild(li);
  });
}

function verMapa(index) {
  const mapa = mapas[index];
  if (!mapa) return;

  const html = popupVerHTML({
    imagem: mapa.imagemUrl,
    infos: [["Anotações", `${(mapa.anotacoes || []).length}/30`, true]],
    desc: mapa.desc,
    acoes: `
      <button type="button" class="pv-principal" onclick="fecharPopup(); abrirMapaViewer(${index})"><i class="ti ti-map-2"></i><span>Abrir mapa</span></button>
      <button type="button" class="pv-editar" onclick="editarMapa(${index})"><i class="ti ti-pencil"></i><span>Editar</span></button>
      <button type="button" class="perigo" onclick="fecharPopup(); removerMapa(${index})"><i class="ti ti-trash"></i><span>Remover</span></button>`,
  });

  abrirPopup(mapa.nome || "Mapa", html, true, null);
}

function editarMapa(index) {
  const mapa = mapas[index];
  if (!mapa) return;

  const html = `
    <div class="popup-bloco">
      <input id="editMapaNome" value="${mapa.nome}" placeholder="Nome do mapa" style="margin-bottom:8px" />
      <textarea id="editMapaDesc" placeholder="Descrição">${mapa.desc || ""}</textarea>
      <button
        onclick="salvarEdicaoMapa(${index})"
        style="margin-top:10px;width:100%;padding:11px;border-radius:12px;background:#b89654;color:#1b1411;font-weight:bold;border:none;cursor:pointer"
      >
        Salvar
      </button>
    </div>
  `;

  abrirPopup("Editar Mapa", html, true, null);
}

function salvarEdicaoMapa(index) {
  const nome = document.getElementById("editMapaNome")?.value.trim();
  const desc = document.getElementById("editMapaDesc")?.value.trim();
  if (!nome) { alertBonito("Nome obrigatório."); return; }
  mapas[index].nome = nome;
  mapas[index].desc = desc;
  salvarTudo();
  renderMapas();
  fecharPopup();
}

async function removerMapa(index) {
  if (!(await confirmBonito("Remover este mapa?"))) return;
  mapas.splice(index, 1);
  salvarTudo();
  renderMapas();
}

function abrirMapaViewer(index) {
  mapaAtual = index;
  const mapa = mapas[index];
  if (!mapa) return;

  document.getElementById("mapaViewerNome").textContent = mapa.nome;
  document.getElementById("mapaViewer").classList.remove("fechado");
  document.body.style.overflow = "hidden";

  mapaZoom = 1;
  mapaOffsetX = 0;
  mapaOffsetY = 0;
  mapaAnotacoes = JSON.parse(JSON.stringify(mapa.anotacoes || []));
  mapaHistorico = [];

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    mapaImagemObj = img;
    redimensionarMapaCanvas();
    desenharMapa();
    ativarEventosMapaCanvas();
  };
  img.src = mapa.imagemUrl;
}

function fecharMapaViewer() {
  document.getElementById("mapaViewer").classList.add("fechado");
  document.body.style.overflow = "";
  document.getElementById("mapaInputTexto").classList.add("fechado");
  mapaImagemObj = null;
  mapaAtual = null;
}

function redimensionarMapaCanvas() {
  const canvas = document.getElementById("mapaCanvas");
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function mapaGetTransform() {
  const canvas = document.getElementById("mapaCanvas");
  const W = canvas.width;
  const H = canvas.height;
  const escala = Math.min(W / mapaImagemObj.width, H / mapaImagemObj.height) * mapaZoom;
  const imgW = mapaImagemObj.width * escala;
  const imgH = mapaImagemObj.height * escala;
  const originX = W / 2 - imgW / 2 + mapaOffsetX;
  const originY = H / 2 - imgH / 2 + mapaOffsetY;
  return { originX, originY, imgW, imgH, escala };
}

function mapaRelParaCanvas(rx, ry) {
  const t = mapaGetTransform();
  return [t.originX + rx * t.imgW, t.originY + ry * t.imgH];
}

function mapaCanvasParaRel(cx, cy) {
  const t = mapaGetTransform();
  return [(cx - t.originX) / t.imgW, (cy - t.originY) / t.imgH];
}

function desenharMapa() {
  const canvas = document.getElementById("mapaCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  if (!mapaImagemObj) return;

  const t = mapaGetTransform();
  ctx.drawImage(mapaImagemObj, t.originX, t.originY, t.imgW, t.imgH);

  mapaAnotacoes.forEach(a => {
    ctx.save();
    ctx.strokeStyle = a.cor;
    ctx.fillStyle = a.cor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (a.tipo === "pincel" && a.pontos && a.pontos.length > 1) {
      const [x0, y0] = mapaRelParaCanvas(a.pontos[0][0], a.pontos[0][1]);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      for (let i = 1; i < a.pontos.length; i++) {
        const [xi, yi] = mapaRelParaCanvas(a.pontos[i][0], a.pontos[i][1]);
        ctx.lineTo(xi, yi);
      }
      ctx.stroke();
    } else {
      const [cx, cy] = mapaRelParaCanvas(a.x, a.y);
      if (a.tipo === "texto") {
        ctx.font = "bold 16px Arial";
        ctx.fillText(a.texto, cx, cy);
      } else if (a.tipo === "seta") {
        desenharSetaMapa(ctx, cx, cy, a.cor);
      } else if (a.tipo === "x") {
        ctx.font = "bold 28px Arial";
        ctx.fillText("✗", cx - 10, cy + 10);
      } else if (a.tipo === "caveira") {
        ctx.font = "26px Arial";
        ctx.fillText("☠", cx - 10, cy + 10);
      } else if (a.tipo === "pergaminho") {
        ctx.font = "24px Arial";
        ctx.fillText("📜", cx - 10, cy + 10);
      } else if (a.tipo === "interrogacao") {
        ctx.font = "bold 26px Arial";
        ctx.fillText("?", cx - 6, cy + 10);
      }
    }

    ctx.restore();
  });
}

function desenharSetaMapa(ctx, x, y, cor) {
  ctx.strokeStyle = cor;
  ctx.fillStyle = cor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 15, y + 15);
  ctx.lineTo(x + 10, y - 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 10);
  ctx.lineTo(x - 2, y - 10);
  ctx.lineTo(x + 10, y + 2);
  ctx.closePath();
  ctx.fill();
}

function ativarEventosMapaCanvas() {
  const canvas = document.getElementById("mapaCanvas");
  let tracoAtual = null;

  function posCanvas(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return [touch.clientX - rect.left, touch.clientY - rect.top];
  }

  function iniciar(e) {
    const [x, y] = posCanvas(e);
    if (mapaFerramentaAtiva === "pan") {
      mapaPintando = true;
      mapaPanUltimoX = x;
      mapaPanUltimoY = y;
      return;
    }
    if (mapaFerramentaAtiva === "texto") {
      mapaTextoX = x;
      mapaTextoY = y;
      document.getElementById("mapaInputTexto").classList.remove("fechado");
      document.getElementById("mapaTextoValor").focus();
      return;
    }
    if (mapaFerramentaAtiva === "borracha") {
      const clicado = mapaAnotacoes.findIndex(a => {
        if (a.tipo === "pincel") {
          return a.pontos.some(([px, py]) => {
            const [cx, cy] = mapaRelParaCanvas(px, py);
            return Math.hypot(cx - x, cy - y) < 18;
          });
        } else {
          const [cx, cy] = mapaRelParaCanvas(a.x, a.y);
          return Math.hypot(cx - x, cy - y) < 40;
        }
      });
      if (clicado !== -1) {
        mapaHistorico.push(JSON.parse(JSON.stringify(mapaAnotacoes)));
        mapaAnotacoes.splice(clicado, 1);
        desenharMapa();
      }
      return;
    }

    if (["seta","x","caveira","pergaminho","interrogacao"].includes(mapaFerramentaAtiva)) {
      if (mapaAnotacoes.length >= 30) { alertBonito("Limite de 30 anotações atingido."); return; }
      mapaHistorico.push(JSON.parse(JSON.stringify(mapaAnotacoes)));
      const [rx, ry] = mapaCanvasParaRel(x, y);
      mapaAnotacoes.push({ tipo: mapaFerramentaAtiva, x: rx, y: ry, cor: mapaCorAtiva });
      desenharMapa();
      return;
    }
    if (mapaFerramentaAtiva === "pincel") {
      if (mapaAnotacoes.length >= 30) { alertBonito("Limite de 30 anotações atingido."); return; }
      mapaPintando = true;
      tracoAtual = { tipo: "pincel", pontos: [[x, y]], cor: mapaCorAtiva };
      mapaHistorico.push(JSON.parse(JSON.stringify(mapaAnotacoes)));
    }
  }

  function mover(e) {
    if (!mapaPintando) return;
    e.preventDefault();
    const [x, y] = posCanvas(e);
    if (mapaFerramentaAtiva === "pan") {
      mapaOffsetX += x - mapaPanUltimoX;
      mapaOffsetY += y - mapaPanUltimoY;
      mapaPanUltimoX = x;
      mapaPanUltimoY = y;
      desenharMapa();
      return;
    }
    if (tracoAtual) {
      tracoAtual.pontos.push([x, y]);
      desenharMapa();
      // desenha traço atual em tempo real
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = tracoAtual.cor;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const pts = tracoAtual.pontos;
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
  }

  function finalizar() {
    if (!mapaPintando) return;
    mapaPintando = false;
    if (tracoAtual) {
      // simplifica pontos para economizar espaço
      tracoAtual.pontos = simplificarPontos(tracoAtual.pontos, 4).map(([px, py]) => mapaCanvasParaRel(px, py));
      mapaAnotacoes.push(tracoAtual);
      tracoAtual = null;
      desenharMapa();
    }
  }

  canvas.onmousedown = iniciar;
  canvas.onmousemove = mover;
  canvas.onmouseup = finalizar;
  canvas.ontouchstart = (e) => { e.preventDefault(); iniciar(e); };
  canvas.ontouchmove = (e) => { e.preventDefault(); mover(e); };
  canvas.ontouchend = finalizar;

  // pinch zoom
  let pinchDist = null;
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      pinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: false });
  canvas.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2 && pinchDist !== null) {
      e.preventDefault();
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      mapaZoom = Math.max(0.5, Math.min(5, mapaZoom * (d / pinchDist)));
      pinchDist = d;
      desenharMapa();
    }
  }, { passive: false });
  canvas.addEventListener("touchend", () => { pinchDist = null; });
}

function simplificarPontos(pontos, tolerancia) {
  if (pontos.length <= 2) return pontos;
  const resultado = [pontos[0]];
  for (let i = 1; i < pontos.length; i++) {
    const prev = resultado[resultado.length - 1];
    const dist = Math.hypot(pontos[i][0] - prev[0], pontos[i][1] - prev[1]);
    if (dist >= tolerancia) resultado.push(pontos[i]);
  }
  resultado.push(pontos[pontos.length - 1]);
  return resultado;
}

function zoomMapa(delta) {
  mapaZoom = Math.max(0.5, Math.min(5, mapaZoom + delta));
  desenharMapa();
}

function selecionarCorMapa(el) {
  document.querySelectorAll(".mapa-cor").forEach(c => c.classList.remove("ativa"));
  el.classList.add("ativa");
  mapaCorAtiva = el.dataset.cor;
}

function selecionarFerramentaMapa(el) {
  document.querySelectorAll(".mapa-tool").forEach(t => t.classList.remove("ativa"));
  el.classList.add("ativa");
  mapaFerramentaAtiva = el.dataset.tool;
}

function confirmarTextoMapa() {
  const texto = document.getElementById("mapaTextoValor").value.trim();
  if (!texto) { cancelarTextoMapa(); return; }
  if (mapaAnotacoes.length >= 30) { alertBonito("Limite de 30 anotações atingido."); cancelarTextoMapa(); return; }
  mapaHistorico.push(JSON.parse(JSON.stringify(mapaAnotacoes)));
  const [rx, ry] = mapaCanvasParaRel(mapaTextoX, mapaTextoY);
  mapaAnotacoes.push({ tipo: "texto", texto, x: rx, y: ry, cor: mapaCorAtiva });
  document.getElementById("mapaTextoValor").value = "";
  document.getElementById("mapaInputTexto").classList.add("fechado");
  desenharMapa();
}

function cancelarTextoMapa() {
  document.getElementById("mapaTextoValor").value = "";
  document.getElementById("mapaInputTexto").classList.add("fechado");
}

function desfazerMapaAnotacao() {
  if (mapaHistorico.length === 0) return;
  mapaAnotacoes = mapaHistorico.pop();
  desenharMapa();
}

function salvarAnotacoesMapa() {
  if (mapaAtual === null) return;
  mapas[mapaAtual].anotacoes = JSON.parse(JSON.stringify(mapaAnotacoes));
  salvarTudo();
  renderMapas();
  alertBonito("Anotações salvas!");
}

function selecionarRaridade(valor, btn) {
  document.querySelectorAll('.btn-raridade').forEach(b => b.classList.remove('ativo'));
  btn.classList.add('ativo');
  document.getElementById('itemMasterRaridade').value = valor;
}

async function excluirEntradaCompendio(tipo, id) {
  const campanha = campanhasMaster?.[campanhaAtualMaster];

  if (!(await confirmBonito("Deseja excluir este item?"))) return;

  const sameId = (a, b) => String(a) === String(b);

  async function deletarImagem(deleteUrl) {
    if (deleteUrl?.startsWith("https://")) {
      try {
        await fetch(deleteUrl, { method: "GET" });
      } catch (e) {
        console.warn("Erro ao deletar imagem:", e);
      }
    }
  }

  let removido = false;

  // ==========================================
  // 1. PROCURA NOS MONSTROS/ITENS/BOSSES GLOBAIS
  // ==========================================

  const idxGlobal = monstrosMestre.findIndex(
    m => sameId(m.id, id)
  );

  if (idxGlobal !== -1) {
    const entrada = monstrosMestre[idxGlobal];

    // Não permite apagar conteúdo padrão
    if (entrada.origem === "padrao" && !entrada._origem) {
      alertBonito("Essa entrada é padrão e não pode ser excluída.");
      return;
    }

    await deletarImagem(entrada.imagemDeleteUrl);

    monstrosMestre.splice(idxGlobal, 1);
    removido = true;

    salvarMonstrosMestreStorage();

    // Exclui também do Firestore
    if (
      window.usuarioAtual &&
      window.db &&
      window.deleteDoc &&
      window.doc
    ) {
      try {
        await window.deleteDoc(
          window.doc(
            window.db,
            "usuarios",
            window.usuarioAtual.uid,
            "monstros",
            String(entrada.id)
          )
        );
      } catch (e) {
        console.warn("Erro ao excluir entrada da nuvem:", e);
      }
    }
  }

  // ==========================================
  // 2. PROCURA NAS ESTRUTURAS ANTIGAS DA CAMPANHA
  // ==========================================

  if (campanha) {
    const colecoes = {
      boss: ["bosses", "bossesMaster"],
      item: ["itensMaster", "itens"],
      npc: ["npcs"],
      mapa: ["mapasMaster", "mapas"]
    };

    const possiveisColecoes = colecoes[tipo] || [];

    for (const chave of possiveisColecoes) {
      if (!Array.isArray(campanha[chave])) continue;

      const encontrados = campanha[chave].filter(
        e => sameId(e.id, id)
      );

      for (const entrada of encontrados) {
        await deletarImagem(entrada.imagemDeleteUrl);
      }

      if (encontrados.length > 0) {
        campanha[chave] = campanha[chave].filter(
          e => !sameId(e.id, id)
        );

        removido = true;
      }
    }
  }

  // ==========================================
  // 3. SALVA TUDO
  // ==========================================

  if (!removido) {
    renderMonstrosMestre();
    fecharSheetMonstro();
    return;
  }

  salvarMonstrosMestreStorage();

  if (campanha) {
    salvarCampanhasMaster();
  }

  // Garante sincronização com a nuvem
  if (typeof window.salvarMonstrosNaNuvem === "function") {
    try {
      await window.salvarMonstrosNaNuvem();
    } catch (e) {
      console.warn("Erro ao sincronizar exclusão com a nuvem:", e);
    }
  }

  renderMonstrosMestre();
  fecharSheetMonstro();

  mostrarToastMundo("Entrada excluída.");
}

function _abrirPopupEncontroCompendio(encontro) {
  window._entradaSessaoAtual = encontro;
  const bloco = (titulo, valor) => valor ? `
    <div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
      <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
        <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">${titulo}</span>
      </div>
      <div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${escapeHtml(valor)}</div>
    </div>` : "";

  const conteudo = `
    <h2 class="sheet-titulo" style="text-align:center;margin-bottom:4px;">${escapeHtml(encontro.nome)}</h2>
    <div class="sheet-meta" style="text-align:center;margin-bottom:12px;">${[encontro.regiao, encontro.localizacao].filter(Boolean).map(v => escapeHtml(v)).join(" · ")}</div>
    ${bloco("Envolvidos", encontro.envolvidos)}
    ${bloco("Objetivo", encontro.objetivo)}
    ${bloco("Gatilho", encontro.gatilho)}
    ${bloco("Ambiente", encontro.ambiente)}
    ${bloco("Consequências", encontro.consequencias)}
    ${bloco("Loot / Recompensa", encontro.loot)}
    ${bloco("Notas do Mestre", encontro.notas)}
  `;
  _abrirSheetCustom(conteudo);
}

function _abrirPopupBossCompendio(boss) {
  const mod = v => { const m = Math.floor(((v||10)-10)/2); return m >= 0 ? `+${m}` : `${m}`; };
  window._entradaSessaoAtual = boss;

  const bloco = (titulo, texto) => `
    <div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
      <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
        <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">${titulo}</span>
      </div>
      <div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${texto}</div>
    </div>`;

  const conteudo = `
${boss.imagem ? `<div class="sheet-img-wrap">
  <img class="sheet-img" src="${boss.imagem}" style="width:100%;max-height:340px;object-fit:cover;object-position:top center;border-radius:10px;">
  <button class="sheet-img-expand" onclick="event.stopPropagation(); abrirImagemExpandida(this)" data-img="${escapeHtml(boss.imagem)}" title="Ver imagem completa">⤢</button>
</div>` : ""}    <h2 class="sheet-titulo" style="text-align:center;margin-bottom:4px;">${escapeHtml(boss.nome)}</h2>
    <div class="sheet-meta" style="text-align:center;margin-bottom:8px;">${[boss.titulo, boss.tipo, boss.regiao].filter(Boolean).map(v => escapeHtml(v)).join(" • ")}</div>
    ${boss.hpMax ? `<div class="sheet-hp-ca" style="text-align:center;margin-bottom:12px;">HP ${boss.hpMax} • CA ${boss.ca || 0}</div>` : ""}
    ${(boss.status && Object.keys(boss.status).length) ? `
    <div class="sheet-status-grid" style="margin-bottom:12px;">
      ${["for","des","con","int","sab","car"].map(a => `
        <div>${a.toUpperCase()}<br>${boss.status[a]||10}<small>${mod(boss.status[a]||10)}</small></div>`).join("")}
    </div>` : ""}
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
      <button style="background:#7B1E28!important;border:none!important;border-radius:8px;color:#fff!important;padding:10px;font-size:13px;cursor:pointer;" onclick='enviarMonstroPadraoParaCombate(${JSON.stringify(boss)})'>⚔️ Enviar para combate</button>
      ${boss.origem !== "padrao" ? `<button style="background:rgba(196,169,91,0.2)!important;border:1px solid rgba(196,169,91,0.4)!important;border-radius:8px;color:#C4A95B!important;padding:10px;font-size:13px;cursor:pointer;" onclick="editarBossMestre(${monstrosMestre.findIndex(m => String(m.id) === String(boss.id))})">✏️ Editar Boss</button>` : `<button style="background:rgba(196,169,91,0.2)!important;border:1px solid rgba(196,169,91,0.4)!important;border-radius:8px;color:#C4A95B!important;padding:10px;font-size:13px;cursor:pointer;" onclick='criarCopiaEditavelMonstroPadrao(${JSON.stringify(boss)})'>✏️ Criar cópia editável</button>`}
    </div>
    ${boss.fases     ? bloco("Fases", escapeHtml(boss.fases)) : ""}
    ${boss.mecanicas ? bloco("Mecânicas", escapeHtml(boss.mecanicas)) : ""}
    ${boss.lore      ? bloco("Lore", escapeHtml(boss.lore)) : ""}
    ${renderHabilidades(boss.habilidades)}
    ${renderAtaques(boss.ataques)}
    ${boss.reacoes     ? bloco("Reações", escapeHtml(boss.reacoes)) : ""}
    ${boss.resistencias ? bloco("Resistências / Imunidades", escapeHtml(boss.resistencias)) : ""}
    ${boss.fraquezas ? bloco("Fraquezas", escapeHtml(boss.fraquezas)) : ""}
    ${boss.dialogos?.length ? bloco("Diálogos", boss.dialogos.map(f => `"${escapeHtml(f)}"`).join("<br>")) : ""}
    ${boss.encontros ? bloco("Pontos de Encontro", escapeHtml(boss.encontros)) : ""}
    <button style="width:100%;margin-top:4px;background:rgba(143,34,34,0.8)!important;border:none!important;border-radius:8px;color:#fff!important;padding:10px;font-size:13px;cursor:pointer;" onclick="excluirEntradaCompendio('${boss.origem === 'padrao' ? 'boss' : 'monstro'}',${boss.id})">🗑 Excluir Boss</button>
  `;
  _abrirSheetCustom(conteudo);
}

function _abrirPopupItemCompendio(item) {
  window._entradaSessaoAtual = item;
  const r = {comum:"Comum", incomum:"Incomum", raro:"Raro", muitoraro:"Muito Raro", lendario:"Lendário"};

  const bloco = (titulo, texto) => `
    <div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
      <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
        <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">${titulo}</span>
      </div>
      <div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${texto}</div>
    </div>`;

  const conteudo = `
${item.imagem ? `<div class="sheet-img-wrap">
  <img class="sheet-img" src="${item.imagem}" style="width:100%;max-height:340px;object-fit:cover;object-position:top center;border-radius:10px;">
  <button class="sheet-img-expand" onclick="event.stopPropagation(); abrirImagemExpandida(this)" data-img="${escapeHtml(item.imagem)}" title="Ver imagem completa">⤢</button>
</div>` : ""}    <h2 class="sheet-titulo" style="text-align:center;margin-bottom:4px;">${escapeHtml(item.nome)}</h2>
    <div class="sheet-meta" style="text-align:center;margin-bottom:8px;">${[item.tipo, r[item.raridade], item.classificacao === "artefato" ? "✦ Artefato" : ""].filter(Boolean).join(" • ")}</div>
    ${item.sintonia === "sim" ? `<div class="sheet-meta" style="text-align:center;margin-bottom:12px;">✦ Requer sintonização</div>` : ""}
    ${item.efeito    ? bloco("Efeito", escapeHtml(item.efeito)) : ""}
    ${item.descricao ? bloco("Descrição", escapeHtml(item.descricao)) : ""}
    ${item.historia  ? bloco("História", escapeHtml(item.historia)) : ""}
    ${item.origem    ? bloco("Origem", escapeHtml(item.origem)) : ""}
        ${item._origem === "usuario" ? `<button style="width:100%;margin-top:4px;background:rgba(196,169,91,0.2)!important;border:1px solid rgba(196,169,91,0.4)!important;border-radius:8px;color:#C4A95B!important;padding:10px;font-size:13px;cursor:pointer;" onclick="editarItemMestre(${item.id})">✏️ Editar</button>` : ""}
    <button style="width:100%;margin-top:4px;margin-bottom:8px;background:#C4A95B!important;border:none!important;border-radius:8px;color:#1a0e05!important;font-weight:bold;padding:10px;font-size:13px;cursor:pointer;" onclick="window.abrirDarItemMestre('${item.id}')">🎁 Dar pra jogador</button>
    <button style="width:100%;margin-top:4px;background:rgba(143,34,34,0.8)!important;border:none!important;border-radius:8px;color:#fff!important;padding:10px;font-size:13px;cursor:pointer;" onclick="excluirEntradaCompendio('item',${item.id})">🗑 Excluir Item</button>
  `;
  _abrirSheetCustom(conteudo);
}

function _abrirPopupMapaCompendio(mapa) {
  window._entradaSessaoAtual = mapa;

  const conteudo = `
    ${mapa.imagem ? `<img src="${mapa.imagem}" style="width:100%;max-height:340px;object-fit:cover;object-position:top center;border-radius:10px;margin-bottom:12px;">` : ""}
    <h2 class="sheet-titulo" style="text-align:center;margin-bottom:4px;">${escapeHtml(mapa.nome)}</h2>
    ${mapa.desc ? `
    <div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
      <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
        <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Descrição</span>
      </div>
      <div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${escapeHtml(mapa.desc)}</div>
    </div>` : ""}
    <button style="width:100%;margin-top:4px;margin-bottom:8px;background:#C4A95B!important;border:none!important;border-radius:8px;color:#1a0e05!important;font-weight:bold;padding:10px;font-size:13px;cursor:pointer;" onclick="window.abrirDarItemMestre('${mapa.id}')">🎁 Dar pra jogador</button>
    <button style="width:100%;margin-top:4px;background:rgba(143,34,34,0.8)!important;border:none!important;border-radius:8px;color:#fff!important;padding:10px;font-size:13px;cursor:pointer;" onclick="excluirEntradaCompendio('mapa',${mapa.id})">🗑 Excluir Mapa</button>
  `;
  _abrirSheetCustom(conteudo);
}

window._darItemMestreContexto = null;

window.abrirDarItemMestre = async function (itemId) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  if (!campanha.grupoVinculado) {
    alertBonito("Essa campanha não tem grupo vinculado. Edite a campanha e escolha um grupo primeiro.");
    return;
  }

  let item = (campanha.itensMaster || []).find(i => String(i.id) === String(itemId));
  if (!item) item = (itensPadrao || []).find(i => String(i.id) === String(itemId));
  if (!item) item = (campanha.mapasMaster || []).find(i => String(i.id) === String(itemId));
  // itens e mapas criados pelo mestre ficam no compêndio (monstrosMestre)
  if (!item) item = (typeof monstrosMestre !== "undefined" ? monstrosMestre : []).find(i => String(i.id) === String(itemId));
  // último recurso: o item que está aberto agora na ficha do compêndio
  if (!item && window._entradaSessaoAtual && String(window._entradaSessaoAtual.id) === String(itemId)) item = window._entradaSessaoAtual;
  if (!item) {
    alertBonito("Não encontrei esse item. Feche e abra ele de novo no compêndio.");
    return;
  }

  window._darItemMestreContexto = item;

  document.getElementById("modalDarItemMestreOverlay").style.display = "block";
  document.getElementById("modalDarItemMestre").style.display = "block";

  const lista = document.getElementById("listaDarItemMestre");
  lista.innerHTML = `<p style="color:#9A8A70;font-size:12px;text-align:center;">Carregando...</p>`;

  try {
    const grupoSnap = await getDoc(doc(db, "grupos", campanha.grupoVinculado));
    if (!grupoSnap.exists()) {
      lista.innerHTML = `<p style="color:#e07a7a;font-size:12px;text-align:center;">Esse grupo não existe mais.</p>`;
      return;
    }
    const g = grupoSnap.data();
    const meuUid = window.usuarioAtual.uid;
    const jogadores = g.membros.filter(m => m.uid !== meuUid && m.fichaId);

    if (jogadores.length === 0) {
      lista.innerHTML = `<p style="color:#9A8A70;font-size:12px;text-align:center;">Nenhum jogador do grupo tem ficha vinculada ainda.</p>`;
      return;
    }

    lista.innerHTML = jogadores.map(m => `
      <button onclick="window.confirmarDarItemMestre('${m.uid}', '${m.fichaId}', '${escapeHtml(m.nickname)}')" style="width:100%;text-align:left;padding:10px 12px;border-radius:8px;border:1px solid rgba(196,169,91,0.2);background:rgba(255,255,255,0.03);color:#F8F4E3;font-size:13px;cursor:pointer;">
        ${escapeHtml(m.nickname)}<span style="opacity:.5;">#${escapeHtml(m.tag)}</span>
      </button>
    `).join("");
  } catch (e) {
    console.error(e);
    lista.innerHTML = `<p style="color:#e07a7a;font-size:12px;text-align:center;">Erro: ${e.code || e.message}</p>`;
  }
};

window.fecharDarItemMestre = function () {
  document.getElementById("modalDarItemMestreOverlay").style.display = "none";
  document.getElementById("modalDarItemMestre").style.display = "none";
  window._darItemMestreContexto = null;
};

// descobre pra qual lista da ficha o item vai (itens padrão não têm "categoria", então usa o "tipo")
function categoriaItemMestre(item) {
  if (item._tipo === "mapa") return "mapas";
  if (item.categoria) return item.categoria;
  const t = normalizarTipo(item.tipo);
  if (t.includes("armadura") || t.includes("escudo")) return "armaduras";
  if (t.includes("arma")) return "armas";
  return "inventario";
}

// junta tudo que o mestre preencheu num texto só, pra caber na descrição da ficha do jogador
function montarDescItemMestre(item) {
  const raridades = { comum: "Comum", normal: "Comum", incomum: "Incomum", raro: "Raro", muitoraro: "Muito Raro", lendario: "Lendário", reliquia: "Relíquia" };
  const cabecalho = [
    item.tipo,
    raridades[item.raridade] || item.raridade,
    item.classificacao === "artefato" ? "Artefato" : ""
  ].filter(Boolean).join(" · ");

  const secoes = [
    ["Efeito", item.efeito],
    ["Descrição", item.descricao],
    ["História", item.historia],
    ["Origem", item.origem]
  ].filter(([, v]) => v && String(v).trim())
   .map(([titulo, v]) => `${titulo}:\n${String(v).trim()}`);

  return [cabecalho, ...secoes].filter(Boolean).join("\n\n");
}

window.confirmarDarItemMestre = async function (uidDestino, fichaIdDestino, nomeDestino) {
  const itemOriginal = window._darItemMestreContexto;
  if (!itemOriginal) return;

  if (!(await confirmBonito(`Dar "${itemOriginal.nome}" pra ${nomeDestino}?`))) return;

  try {
    const meuUid = window.usuarioAtual.uid;
    const meuSnap = await getDoc(doc(db, "usuarios", meuUid));
    const meuDados = meuSnap.exists() ? meuSnap.data() : {};

    const categoria = categoriaItemMestre(itemOriginal);

    // campos que existem em todo item da ficha do jogador
    const requerSintonia = itemOriginal.sintonia === "sim" ||
      String(itemOriginal.sintonizacao || "").toLowerCase() === "sim";
    const base = {
      nome: itemOriginal.nome,
      desc: montarDescItemMestre(itemOriginal),
      imagemUrl: itemOriginal.imagem || "",
      imagemDeleteUrl: "",
      requerSintonia,
      sintonizado: false
    };

    // monta o item no formato que a ficha do jogador espera, dependendo da categoria
    let itemParaJogador;
    if (categoria === "mapas") {
      itemParaJogador = {
        nome: itemOriginal.nome,
        desc: itemOriginal.desc || "",
        imagemUrl: itemOriginal.imagem || "",
        imagemDeleteUrl: "",
        anotacoes: []
      };
    } else if (categoria === "armas") {
      itemParaJogador = { ...base, dano: itemOriginal.dano || "", temCargas: false, maxCargas: 0, cargasGastas: [] };
    } else if (categoria === "armaduras") {
      itemParaJogador = { ...base, ca: itemOriginal.ca || "", temCargas: false, maxCargas: 0, cargasGastas: [] };
    } else {
      itemParaJogador = { ...base, qtd: 1 };
    }

    await setDoc(doc(collection(db, "usuarios", uidDestino, "itensRecebidos")), {
      tipo: categoria,
      item: itemParaJogador,
      deUid: meuUid,
      deNickname: meuDados.nickname || "",
      deTag: meuDados.tag || "",
      fichaDestinoId: fichaIdDestino,
      automatico: false,
      criadoEm: new Date().toISOString()
    });

    window.fecharDarItemMestre();
    alertBonito("Item enviado!");
  } catch (e) {
    console.error(e);
    alertBonito("Erro ao dar item: " + (e.code || e.message));
  }
};

function _abrirPopupNPCCompendio(npc) {
  const mod = v => { const m = Math.floor(((v||10)-10)/2); return m >= 0 ? `+${m}` : `${m}`; };
  window._entradaSessaoAtual = npc;

  const bloco = (titulo, texto) => `
    <div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
      <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
        <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">${titulo}</span>
      </div>
      <div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${texto}</div>
    </div>`;

  const conteudo = `
${npc.imagem ? `<div class="sheet-img-wrap">
  <img class="sheet-img" src="${npc.imagem}" style="width:100%;max-height:340px;object-fit:cover;object-position:top center;border-radius:10px;">
  <button class="sheet-img-expand" onclick="event.stopPropagation(); abrirImagemExpandida(this)" data-img="${escapeHtml(npc.imagem)}" title="Ver imagem completa">⤢</button>
</div>` : ""}    <h2 class="sheet-titulo" style="text-align:center;margin-bottom:4px;">${escapeHtml(npc.nome)}</h2>
    <div class="sheet-meta" style="text-align:center;margin-bottom:8px;">${[npc.raca, npc.classe, npc.regiao].filter(Boolean).map(v => escapeHtml(v)).join(" • ")}</div>
    ${(npc.status && Object.keys(npc.status).length) ? `
    <div class="sheet-status-grid" style="margin-bottom:12px;">
      ${["for","des","con","int","sab","car"].map(a => `
        <div>${a.toUpperCase()}<br>${npc.status[a]||10}<small>${mod(npc.status[a]||10)}</small></div>`).join("")}
    </div>` : ""}
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
      <button style="background:#7B1E28!important;border:none!important;border-radius:8px;color:#fff!important;padding:10px;font-size:13px;cursor:pointer;" onclick="adicionarNPCAoMundo()">🌍 Adicionar ao Mundo</button>
    </div>
    ${npc.personalidade ? bloco("Personalidade", escapeHtml(npc.personalidade)) : ""}
    ${npc.relacoes      ? bloco("Relações", escapeHtml(npc.relacoes)) : ""}
    ${npc.pericias      ? bloco("Perícias", escapeHtml(npc.pericias)) : ""}
    ${npc.religiao      ? bloco("Religião", escapeHtml(npc.religiao)) : ""}
    ${renderAtaques(npc.ataques)}
    ${renderHabilidades(npc.habilidades)}
    ${npc.observacoes   ? bloco("Observações", escapeHtml(npc.observacoes)) : ""}
    ${npc.reacoes     ? bloco("Reações", escapeHtml(npc.reacoes)) : ""}
    ${npc.resistencias ? bloco("Resistências / Imunidades", escapeHtml(npc.resistencias)) : ""}
    ${npc.fraquezas   ? bloco("Fraquezas", escapeHtml(npc.fraquezas)) : ""}
    <button style="width:100%;margin-top:4px;background:rgba(143,34,34,0.8)!important;border:none!important;border-radius:8px;color:#fff!important;padding:10px;font-size:13px;cursor:pointer;" onclick="excluirEntradaCompendio('npc',${npc.id})">🗑 Excluir NPC</button>
  `;
  _abrirSheetCustom(conteudo);
}

function _abrirSheetCustom(conteudo) {
  const sheetOverlay = document.getElementById("sheetMonstroOverlay");
  const sheet        = document.getElementById("sheetMonstro");
  const conteudoDiv  = document.getElementById("conteudoSheetMonstro");
  if (!sheet || !conteudoDiv) return;

  conteudoDiv.innerHTML = conteudo;
  sheetOverlay.style.display = "block";
  sheet.style.display        = "block";
  sheet.classList.remove("full", "aberto");
  requestAnimationFrame(() => sheet.classList.add("aberto"));
  document.body.classList.add("master-sheet-aberto");
  ativarGestosSheetMonstro();
  atualizarPeeksSheetMonstro();
}


function criarCopiaEditavelMonstroPadrao(monstro) {
  const copia = JSON.parse(JSON.stringify(monstro));

  // A cópia NÃO é salva ainda.
  // Primeiro abre o formulário para o usuário editar.
  copia.id = Date.now();
  copia.origem = "usuario";
  copia._origem = "usuario";
  copia._tipo = "boss";
  copia.nome = `${monstro.nome} personalizado`;

  // Guarda a imagem original para ser usada quando salvar
  window._imagemBossCopiaOriginal = copia.imagem || "";
  window._imagemBossBase64 = "";

  // Preenche o formulário de Boss
  const campos = {
    bossNome: copia.nome || "",
    bossTipo: copia.tipo || "",
    bossRegiao: copia.regiao || "",
    bossHpMax: copia.hpMax || 0,
    bossHpAtual: copia.hpAtual || 0,
    bossCa: copia.ca || 0,

    bossFor: copia.status?.for || 10,
    bossDes: copia.status?.des || 10,
    bossCon: copia.status?.con || 10,
    bossInt: copia.status?.int || 10,
    bossSab: copia.status?.sab || 10,
    bossCar: copia.status?.car || 10,

    bossVelocidade: copia.velocidade || "",
    bossSaves: copia.saves || "",
    bossSentidos: copia.sentidos || "",
    bossIdiomas: copia.idiomas || "",
    bossLore: copia.lore || "",
    bossHabilidades: copia.habilidades || "",
    bossFraquezas: copia.fraquezas || "",
    bossAtaques: copia.ataques || "",
    bossReacoes: copia.reacoes || "",
    bossResistencias: copia.resistencias || "",
    bossImunidades: copia.imunidades || "",
    bossVulnerabilidades: copia.vulnerabilidades || "",
    bossPontoEncontro: copia.pontoEncontro || ""
  };

  Object.entries(campos).forEach(([id, valor]) => {
    const el = document.getElementById(id);
    if (el) el.value = valor;
  });

  // Imagem
  const preview = document.getElementById("previewBoss");

  if (preview && copia.imagem) {
    preview.src = copia.imagem;
    preview.style.display = "block";
  } else if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }

  // Limpa listas temporárias do formulário
  _bossAtaquesForm = [];
  _bossHabilidadesForm = [];

  _renderItemForm(
    "bossAtaquesList",
    [],
    "removerAtaqueBoss",
    "bossAtaques"
  );

  _renderItemForm(
    "bossHabilidadesList",
    [],
    "removerHabilidadeBoss",
    "bossHabilidades"
  );

  // Seleciona Boss
  const botoesTipo = document.querySelectorAll(".criar-tipo-btn");
  const btnBoss = botoesTipo[1];

  trocarTipoCriar("boss", btnBoss);

  // Abre a aba CRIAR
  const botoesAbas = document.querySelectorAll(".master-tab-btn");
  const btnCriar = botoesAbas[3];

  trocarAbaMaster("criar", btnCriar);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  mostrarToastMundo("Cópia aberta para edição. Salve o Boss quando terminar.");
}

function abrirSheetMonstroPadrao(monstro) {
  const overlay  = document.getElementById("sheetMonstroOverlay");
  const sheet    = document.getElementById("sheetMonstro");
  const conteudo = document.getElementById("conteudoSheetMonstro");
  const estavaAberto = sheet.classList.contains("aberto");
  const estavaFull   = sheet.classList.contains("full");
  if (!overlay || !sheet || !conteudo) return;
  conteudo.innerHTML = "";

  // Limpa antes de renderizar para evitar flash do conteúdo antigo
  conteudo.innerHTML = "";

  const imagem = monstro.imagem || "";
  const bloco  = (titulo, texto) => `
    <div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
      <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
        <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">${titulo}</span>
      </div>
      <div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${texto}</div>
    </div>`;

  conteudo.innerHTML = `
${imagem ? `<div class="sheet-img-wrap">
  <img class="sheet-img" src="${imagem}" alt="${escapeHtml(monstro.nome)}" style="width:100%;max-height:340px;object-fit:cover;object-position:top center;border-radius:10px;transition:opacity 0.3s ease;" onload="this.style.opacity='1'" style="opacity:0">
  <button class="sheet-img-expand" onclick="event.stopPropagation(); abrirImagemExpandida(this)" data-img="${escapeHtml(imagem)}" title="Ver imagem completa">⤢</button>
</div>` : ""}    <div class="sheet-meta" style="text-align:center;margin-bottom:8px;">${escapeHtml(monstro.tipo || "Tipo não definido")} · ${escapeHtml(monstro.regiao || "Região não definida")}</div>
    <div class="sheet-hp-ca" style="text-align:center;margin-bottom:12px;">HP ${monstro.hpAtual}/${monstro.hpMax} · CA ${monstro.ca || 0}</div>

    <div class="sheet-status-grid" style="margin-bottom:12px;">
      <div>FOR<br>${monstro.status?.for||10}<small>${formatarModMonstro(calcularModMonstro(monstro.status?.for||10))}</small></div>
      <div>DES<br>${monstro.status?.des||10}<small>${formatarModMonstro(calcularModMonstro(monstro.status?.des||10))}</small></div>
      <div>CON<br>${monstro.status?.con||10}<small>${formatarModMonstro(calcularModMonstro(monstro.status?.con||10))}</small></div>
      <div>INT<br>${monstro.status?.int||10}<small>${formatarModMonstro(calcularModMonstro(monstro.status?.int||10))}</small></div>
      <div>SAB<br>${monstro.status?.sab||10}<small>${formatarModMonstro(calcularModMonstro(monstro.status?.sab||10))}</small></div>
      <div>CAR<br>${monstro.status?.car||10}<small>${formatarModMonstro(calcularModMonstro(monstro.status?.car||10))}</small></div>
    </div>

    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
      <button style="background:#7B1E28!important;border:none!important;border-radius:8px;color:#fff!important;padding:10px;font-size:13px;cursor:pointer;" onclick='enviarMonstroPadraoParaCombate(${JSON.stringify(monstro)})'>⚔️ Enviar para combate</button>
      <button style="background:rgba(196,169,91,0.2)!important;border:1px solid rgba(196,169,91,0.4)!important;border-radius:8px;color:#C4A95B!important;padding:10px;font-size:13px;cursor:pointer;" onclick='criarCopiaEditavelMonstroPadrao(${JSON.stringify(monstro)})'>✏️ Criar cópia editável</button>
    </div>

    ${bloco("Lore", formatarTexto(monstro.lore || "Sem lore cadastrada."))}
    ${renderHabilidades(monstro.habilidades)}
    ${renderAtaques(monstro.ataques)}
    ${monstro.reacoes ? `<div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
      <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
        <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Reações</span>
      </div>
      <div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${formatarTexto(monstro.reacoes)}</div>
    </div>` : ""}
    ${monstro.resistencias ? `<div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
      <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
        <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Resistências</span>
      </div>
      <div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${formatarTexto(monstro.resistencias)}</div>
    </div>` : ""}
    ${monstro.imunidades ? `<div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
      <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
        <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Imunidades</span>
      </div>
      <div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${formatarTexto(monstro.imunidades)}</div>
    </div>` : ""}
    ${monstro.vulnerabilidades ? `<div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
      <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
        <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Vulnerabilidades</span>
      </div>
      <div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${formatarTexto(monstro.vulnerabilidades)}</div>
    </div>` : ""}
    ${(monstro.sentidos || monstro.idiomas) ? `<div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
      <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
        <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Sentidos e Idiomas</span>
      </div>
      <div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${monstro.sentidos ? "Sentidos: " + escapeHtml(monstro.sentidos) : ""}${monstro.sentidos && monstro.idiomas ? "<br>" : ""}${monstro.idiomas ? "Idiomas: " + escapeHtml(monstro.idiomas) : ""}</div>
    </div>` : ""}
    ${monstro.fraquezas ? `<div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);"><div style="background:#D4C9A8;padding:7px 12px;text-align:center;"><span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Fraquezas</span></div><div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${formatarTexto(monstro.fraquezas)}</div></div>` : ""}
    ${bloco("Diálogos", monstro.dialogos?.length ? monstro.dialogos.map(f => `"${escapeHtml(f)}"`).join("<br>") : "Sem falas cadastradas.")}
    ${bloco("Pontos de Encontro", formatarTexto(monstro.encontros || "Sem pontos de encontro cadastrados."))}
${monstro.origem !== "padrao" ? `<button style="width:100%;margin-top:4px;background:rgba(143,34,34,0.8)!important;border:none!important;border-radius:8px;color:#fff!important;padding:10px;font-size:13px;cursor:pointer;" onclick="excluirMonstroMestre(${monstro.id})">🗑️ Excluir Monstro</button>` : ""}  `;

  sheet.style.transition = "";
  sheet.style.transform  = "";
  sheet.style.opacity    = "";
  sheet.style.height     = "";

  overlay.style.display = "block";
  sheet.style.display   = "block";

  sheet.classList.remove("full", "aberto");
  if (estavaFull) sheet.classList.add("full");

  requestAnimationFrame(() => setTimeout(() => sheet.classList.add("aberto"), 10));
  document.body.classList.add("master-sheet-aberto");
  ativarGestosSheetMonstro();
  atualizarPeeksSheetMonstro();
}

function abrirSheetMonstroPorObjeto(monstro, index, lista = null) {
  if (lista) listaSheetCompendio = lista;
  sheetMonstroIndexAtual = index;
  abrirSheetMonstroPadrao(monstro);
}

function abrirSheetMonstro(index) {
  const monstro = monstrosMestre[index];
  if (!monstro) return;

  sheetMonstroIndexAtual = index;

  const overlay  = document.getElementById("sheetMonstroOverlay");
  const sheet    = document.getElementById("sheetMonstro");
  const conteudo = document.getElementById("conteudoSheetMonstro");
  if (!overlay || !sheet || !conteudo) return;

  const imagem = monstro.imagem || "";
  const bloco  = (titulo, texto) => `
    <div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
      <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
        <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">${titulo}</span>
      </div>
      <div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${texto}</div>
    </div>`;

  conteudo.innerHTML = `
${imagem ? `<div class="sheet-img-wrap">
  <img class="sheet-img" src="${imagem}" alt="${escapeHtml(monstro.nome)}" style="width:100%;max-height:340px;object-fit:cover;object-position:top center;border-radius:10px;">
  <button class="sheet-img-expand" onclick="event.stopPropagation(); abrirImagemExpandida(this)" data-img="${escapeHtml(imagem)}" title="Ver imagem completa">⤢</button>
</div>` : ""}    <div class="sheet-meta" style="text-align:center;margin-bottom:8px;">${escapeHtml(monstro.tipo || "Tipo não definido")} · ${escapeHtml(monstro.regiao || "Região não definida")}</div>
    <div class="sheet-hp-ca" style="text-align:center;margin-bottom:12px;">HP ${monstro.hpAtual}/${monstro.hpMax} · CA ${monstro.ca || 0}${monstro.velocidade ? " · Vel " + escapeHtml(monstro.velocidade) : ""}</div>
    ${monstro.saves ? `<div class="sheet-meta" style="text-align:center;margin-bottom:8px;">Testes: ${escapeHtml(monstro.saves)}</div>` : ""}

    <div class="sheet-status-grid" style="margin-bottom:12px;">
      <div>FOR<br>${monstro.status?.for||10}<small>${formatarModMonstro(calcularModMonstro(monstro.status?.for||10))}</small></div>
      <div>DES<br>${monstro.status?.des||10}<small>${formatarModMonstro(calcularModMonstro(monstro.status?.des||10))}</small></div>
      <div>CON<br>${monstro.status?.con||10}<small>${formatarModMonstro(calcularModMonstro(monstro.status?.con||10))}</small></div>
      <div>INT<br>${monstro.status?.int||10}<small>${formatarModMonstro(calcularModMonstro(monstro.status?.int||10))}</small></div>
      <div>SAB<br>${monstro.status?.sab||10}<small>${formatarModMonstro(calcularModMonstro(monstro.status?.sab||10))}</small></div>
      <div>CAR<br>${monstro.status?.car||10}<small>${formatarModMonstro(calcularModMonstro(monstro.status?.car||10))}</small></div>
    </div>

    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
      <button style="background:#7B1E28!important;border:none!important;border-radius:8px;color:#fff!important;padding:10px;font-size:13px;cursor:pointer;" onclick="enviarMonstroParaCombate(${index})">⚔️ Enviar para combate</button>
      <button style="background:rgba(196,169,91,0.2)!important;border:1px solid rgba(196,169,91,0.4)!important;border-radius:8px;color:#C4A95B!important;padding:10px;font-size:13px;cursor:pointer;" onclick="editarMonstroMestre(${index})">✏️ Editar</button>
    </div>

    ${bloco("Lore", formatarTexto(monstro.lore || "Sem lore cadastrada."))}
    ${renderHabilidades(monstro.habilidades)}
    ${renderAtaques(monstro.ataques)}
    ${monstro.reacoes ? `<div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
      <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
        <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Reações</span>
      </div>
      <div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${formatarTexto(monstro.reacoes)}</div>
    </div>` : ""}
    ${monstro.resistencias ? `<div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
      <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
        <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Resistências / Imunidades</span>
      </div>
      <div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${formatarTexto(monstro.resistencias)}</div>
    </div>` : ""}
${monstro.fraquezas ? `<div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);"><div style="background:#D4C9A8;padding:7px 12px;text-align:center;"><span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Fraquezas</span></div><div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${formatarTexto(monstro.fraquezas)}</div></div>` : ""}
${bloco("Diálogos", monstro.dialogos?.length ? monstro.dialogos.map(f => `"${escapeHtml(f)}"`).join("<br>") : "Sem falas cadastradas.")}
${bloco("Pontos de Encontro", formatarTexto(monstro.encontros || "Sem pontos de encontro cadastrados."))}
    <button style="width:100%;margin-top:4px;background:rgba(143,34,34,0.8)!important;border:none!important;border-radius:8px;color:#fff!important;padding:10px;font-size:13px;cursor:pointer;" onclick="excluirMonstroMestre(${index})">🗑️ Excluir Monstro</button>
  `;

  overlay.style.display = "block";
  sheet.style.display = "block";
  sheet.classList.remove("full", "aberto");
  requestAnimationFrame(() => sheet.classList.add("aberto"));
  document.body.classList.add("master-sheet-aberto");
  ativarGestosSheetMonstro();
  atualizarPeeksSheetMonstro();
}

function ativarGestosSheetMonstro() {
  const sheet = document.getElementById("sheetMonstro");
  if (!sheet) return;

  sheet.removeEventListener("touchstart", iniciarDragSheet);
  sheet.removeEventListener("touchmove", moverDragSheet);
  sheet.removeEventListener("touchend", finalizarDragSheet);
  sheet.removeEventListener("mousedown", iniciarDragSheet);
  window.removeEventListener("mousemove", moverDragSheet);
  window.removeEventListener("mouseup", finalizarDragSheet);

  if (window.innerWidth >= 1040) return; // desktop: sem arrastar — só as setas/prévias

  sheet.addEventListener("touchstart", iniciarDragSheet, { passive: true });
  sheet.addEventListener("touchmove", moverDragSheet, { passive: false });
  sheet.addEventListener("touchend", finalizarDragSheet);

  sheet.addEventListener("mousedown", iniciarDragSheet);
  window.addEventListener("mousemove", moverDragSheet);
  window.addEventListener("mouseup", finalizarDragSheet);
}

function pegarPontoEvento(e) {
  if (e.touches && e.touches.length > 0) {
    return e.touches[0];
  }

  return e;
}

function iniciarDragSheet(e) {
  const sheet = document.getElementById("sheetMonstro");
  if (!sheet) return;

  const ponto = pegarPontoEvento(e);

  sheetDragInicioX = ponto.clientX;
  sheetDragInicioY = ponto.clientY;

  if (sheet.classList.contains("full")) {
    const rect = sheet.getBoundingClientRect();
    const toqueRelativo = ponto.clientY - rect.top;
    sheetArrastando = toqueRelativo <= 60 ? "full-topo" : "full-conteudo";
  } else {
    sheetArrastando = true;
  }

  sheet.style.transition = "none";
}


function editarBossMestre(index) {
  const boss = monstrosMestre[index];
  if (!boss) return;

  fecharSheetMonstro();

  document.getElementById("bossNome").value = boss.nome || "";
  document.getElementById("bossTipo").value = boss.tipo || "";
  document.getElementById("bossRegiao").value = boss.regiao || "";
  document.getElementById("bossHpMax").value = boss.hpMax || 0;
  document.getElementById("bossHpAtual").value = boss.hpAtual || 0;
  document.getElementById("bossCa").value = boss.ca || 0;

  document.getElementById("bossFor").value = boss.status?.for || 10;
  document.getElementById("bossDes").value = boss.status?.des || 10;
  document.getElementById("bossCon").value = boss.status?.con || 10;
  document.getElementById("bossInt").value = boss.status?.int || 10;
  document.getElementById("bossSab").value = boss.status?.sab || 10;
  document.getElementById("bossCar").value = boss.status?.car || 10;

  document.getElementById("bossVelocidade").value = boss.velocidade || "";
  document.getElementById("bossSaves").value = boss.saves || "";
  document.getElementById("bossSentidos").value = boss.sentidos || "";
  document.getElementById("bossIdiomas").value = boss.idiomas || "";
  document.getElementById("bossLore").value = boss.lore || "";
  document.getElementById("bossHabilidades").value = boss.habilidades || "";
  document.getElementById("bossFraquezas").value = boss.fraquezas || "";
  document.getElementById("bossAtaques").value = boss.ataques || "";
  document.getElementById("bossReacoes").value = boss.reacoes || "";
  document.getElementById("bossResistencias").value = boss.resistencias || "";
  document.getElementById("bossImunidades").value = boss.imunidades || "";
  document.getElementById("bossVulnerabilidades").value = boss.vulnerabilidades || "";

  const preview = document.getElementById("previewBoss");
  if (preview && boss.imagem) {
    preview.src = boss.imagem;
    preview.style.display = "block";
  }

  const btnBoss = document.querySelectorAll(".criar-tipo-btn")[1];
  trocarTipoCriar("boss", btnBoss);

  fecharSheetMonstro();

const btnCriar = document.querySelector('.master-tab-btn[title="Criar"]');
trocarAbaMaster("criar", btnCriar);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function salvarBossMestre() {
  const nome = document.getElementById("bossNome")?.value.trim();
  if (!nome) { alertBonito("Coloque o nome do boss."); return; }

  if (campanhaAtualMaster === null || campanhaAtualMaster === undefined) {
    alertBonito("Nenhuma campanha selecionada."); return;
  }

  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) { alertBonito("Campanha não encontrada."); return; }

    monstrosMestre.push({
    id: Date.now(), _tipo: "boss", origem: "usuario", nome,
    tipo:       document.getElementById("bossTipo")?.value.trim() || "",
    regiao:     document.getElementById("bossRegiao")?.value.trim() || "",
    hpMax:      parseInt(document.getElementById("bossHpMax")?.value) || 0,
    hpAtual:    parseInt(document.getElementById("bossHpAtual")?.value) || 0,
    ca:         parseInt(document.getElementById("bossCa")?.value) || 0,
    status: {
      for: parseInt(document.getElementById("bossFor")?.value) || 10,
      des: parseInt(document.getElementById("bossDes")?.value) || 10,
      con: parseInt(document.getElementById("bossCon")?.value) || 10,
      int: parseInt(document.getElementById("bossInt")?.value) || 10,
      sab: parseInt(document.getElementById("bossSab")?.value) || 10,
      car: parseInt(document.getElementById("bossCar")?.value) || 10,
    },
    lore:        document.getElementById("bossLore")?.value.trim()        || "",
    habilidades: document.getElementById("bossHabilidades")?.value.trim()  || "",
    fraquezas:   document.getElementById("bossFraquezas")?.value.trim()    || "",
    ataques:     document.getElementById("bossAtaques")?.value.trim()      || "",
    reacoes:     document.getElementById("bossReacoes")?.value.trim()      || "",
    resistencias:document.getElementById("bossResistencias")?.value.trim() || "",
    ...(window._imagemBossBase64
  ? await uploadImagemFirebase(
      window._imagemBossBase64,
      `bosses/${Date.now()}.jpg`
    ).then(r => ({
      imagem: r.url,
      imagemDeleteUrl: r.deleteUrl
    }))
  : {
      imagem: window._imagemBossCopiaOriginal || "",
      imagemDeleteUrl: ""
    }),
  });

  salvarMonstrosMestreStorage();
  renderMonstrosMestre();

  _bossAtaquesForm = []; _bossHabilidadesForm = [];
  _renderItemForm("bossAtaquesList",[],"removerAtaqueBoss","bossAtaques");
  _renderItemForm("bossHabilidadesList",[],"removerHabilidadeBoss","bossHabilidades");
  ["bossNome","bossTipo","bossRegiao","bossHpMax","bossHpAtual","bossCa",
   "bossLore","bossHabilidades","bossFraquezas","bossAtaques","bossReacoes","bossResistencias", "bossPontoEncontro"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  const preview = document.getElementById("previewBoss");
  if (preview) { preview.src = ""; preview.style.display = "none"; }

  mostrarToastMundo("Boss salvo!");
}

async function migrarCompendioParaGlobal() {
  if (localStorage.getItem("compendioMigrado") === "sim") return;

  let migrouAlgo = false;

  for (const campanha of campanhasMaster) {
    const tipos = [
      { chave: "bosses", tipo: "boss" },
      { chave: "itensMaster", tipo: "item" },
      { chave: "npcs", tipo: "npc" },
      { chave: "mapasMaster", tipo: "mapa" },
    ];

    for (const { chave, tipo } of tipos) {
      const lista = campanha[chave] || [];
      lista.forEach((entrada) => {
        entrada._tipo = tipo;
        entrada.origem = entrada.origem || "usuario";
        monstrosMestre.push(entrada);
        migrouAlgo = true;
      });
      campanha[chave] = [];
    }
  }

  if (migrouAlgo) {
    salvarMonstrosMestreStorage();
    salvarCampanhasMaster();
  }

  localStorage.setItem("compendioMigrado", "sim");
}

async function salvarMapaMestre() {
  const nome = document.getElementById("mapaMasterNome")?.value.trim();
  if (!nome) { alertBonito("Coloque o nome do mapa."); return; }

  if (campanhaAtualMaster === null || campanhaAtualMaster === undefined) {
    alertBonito("Nenhuma campanha selecionada."); return;
  }

  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) { alertBonito("Campanha não encontrada."); return; }

    monstrosMestre.push({
    id: Date.now(), _tipo: "mapa", _origem: "usuario", nome,
    desc: document.getElementById("mapaMasterDesc")?.value.trim() || "",
    ...(window._imagemMapaMestreBase64
    ? await uploadImagemFirebase(window._imagemMapaMestreBase64, `mapas/${Date.now()}.jpg`).then(r => ({ imagem: r.url, imagemDeleteUrl: r.deleteUrl }))
    : { imagem: "", imagemDeleteUrl: "" }),
  });

    salvarMonstrosMestreStorage();
  renderMonstrosMestre();

  document.getElementById("mapaMasterNome").value = "";
  document.getElementById("mapaMasterDesc").value = "";
  document.getElementById("mapaMasterImagemInput").value = "";
  window._imagemMapaMestreBase64 = "";
  const preview = document.getElementById("previewMapaMaster");
  if (preview) { preview.src = ""; preview.style.display = "none"; }
}

async function salvarItemMestre() {
  const nome = document.getElementById("itemMasterNome")?.value.trim();
  if (!nome) { alertBonito("Coloque o nome do item."); return; }

  if (campanhaAtualMaster === null || campanhaAtualMaster === undefined) {
    alertBonito("Nenhuma campanha selecionada."); return;
  }

  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) { alertBonito("Campanha não encontrada."); return; }

   const itemAnterior = editandoItemMestre >= 0 ? monstrosMestre[editandoItemMestre] : null;

  const novoItem = {
    id: itemAnterior ? itemAnterior.id : Date.now(),
    _tipo: "item", _origem: "usuario", nome,
    categoria: document.getElementById("itemMasterCategoria")?.value || "inventario",
    classificacao: document.getElementById("itemMasterClassificacao")?.value || "normal",
    dano:      document.getElementById("itemMasterDano")?.value.trim() || "",
    ca:        document.getElementById("itemMasterCA")?.value.trim() || "",
    tipo:      document.getElementById("itemMasterTipo")?.value.trim() || "",
    raridade:  document.getElementById("itemMasterRaridade")?.value || "normal",
    sintonia:  document.getElementById("itemMasterSintonia")?.value || "nao",
    efeito:    document.getElementById("itemMasterEfeito")?.value.trim() || "",
    descricao: document.getElementById("itemMasterDescricao")?.value.trim() || "",
    historia:  document.getElementById("itemMasterHistoria")?.value.trim() || "",
    origem:    document.getElementById("itemMasterOrigem")?.value.trim() || "",
    imagem: itemAnterior?.imagem || "",
    imagemDeleteUrl: itemAnterior?.imagemDeleteUrl || "",
  };

  if (window._imagemItemBase64) {
    const resultado = await uploadImagemFirebase(window._imagemItemBase64, `itens/${Date.now()}.jpg`);
    novoItem.imagem = resultado.url;
    novoItem.imagemDeleteUrl = resultado.deleteUrl;
  }

  const estavaEditando = editandoItemMestre >= 0;
  if (estavaEditando) {
    monstrosMestre[editandoItemMestre] = novoItem;
    editandoItemMestre = -1;
  } else {
    monstrosMestre.push(novoItem);
  }

  salvarMonstrosMestreStorage();
  renderMonstrosMestre();

  ["itemMasterNome","itemMasterTipo","itemMasterEfeito","itemMasterDescricao",
   "itemMasterHistoria","itemMasterOrigem","itemMasterDano","itemMasterCA"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  const catEl = document.getElementById("itemMasterCategoria");
  if (catEl) catEl.value = "inventario";
  const classEl = document.getElementById("itemMasterClassificacao");
  if (classEl) classEl.value = "normal";
  window.atualizarCamposCategoriaItem();
  const preview = document.getElementById("previewItemMaster");
  if (preview) { preview.src = ""; preview.style.display = "none"; }
  window._imagemItemBase64 = "";

  mostrarToastMundo(estavaEditando ? "Item atualizado!" : "Item salvo!");
}

function editarItemMestre(id) {
  const index = monstrosMestre.findIndex(m => m.id === id && m._tipo === "item");
  const item = monstrosMestre[index];
  if (!item) return;

  fecharSheetMonstro();

  editandoItemMestre = index;
  window._imagemItemBase64 = "";

  document.getElementById("itemMasterNome").value = item.nome || "";
  document.getElementById("itemMasterTipo").value = item.tipo || "";
  document.getElementById("itemMasterRaridade").value = item.raridade || "normal";
  document.getElementById("itemMasterSintonia").value = item.sintonia || "nao";
  document.getElementById("itemMasterEfeito").value = item.efeito || "";
  document.getElementById("itemMasterDescricao").value = item.descricao || "";
  document.getElementById("itemMasterHistoria").value = item.historia || "";
  document.getElementById("itemMasterOrigem").value = item.origem || "";
  document.getElementById("itemMasterCategoria").value = item.categoria || "inventario";
  document.getElementById("itemMasterClassificacao").value = item.classificacao || "normal";
  document.getElementById("itemMasterDano").value = item.dano || "";
  document.getElementById("itemMasterCA").value = item.ca || "";
  window.atualizarCamposCategoriaItem();

  const preview = document.getElementById("previewItemMaster");
  if (preview && item.imagem) {
    preview.src = item.imagem;
    preview.style.display = "block";
  }

  const btnTipoItem = document.querySelectorAll(".criar-tipo-btn")[3];
  trocarTipoCriar("item", btnTipoItem);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function moverDragSheet(e) {
  if (!sheetArrastando) return;

  const sheet = document.getElementById("sheetMonstro");
  if (!sheet) return;

  const ponto = pegarPontoEvento(e);

  const diffX = ponto.clientX - sheetDragInicioX;
  const diffY = ponto.clientY - sheetDragInicioY;

  const movimentoHorizontal = Math.abs(diffX) > Math.abs(diffY);

  if (sheetArrastando === "full-conteudo") {
    if (movimentoHorizontal) {
      if (e.cancelable) e.preventDefault();
      sheet.style.transform = `translateX(${diffX}px)`;
      sheet.style.opacity = String(1 - Math.min(Math.abs(diffX) / 500, 0.45));
    }
    return;
  }

  if (movimentoHorizontal) {
    if (e.cancelable) e.preventDefault();
    sheet.style.transform = `translateX(${diffX}px)`;
    sheet.style.opacity = String(1 - Math.min(Math.abs(diffX) / 500, 0.45));
    return;
  }

  if (e.cancelable) e.preventDefault();

  if (diffY < 0 && !sheet.classList.contains("full")) {
    const aumento = Math.min(Math.abs(diffY), window.innerHeight * 0.28);
    sheet.style.height = `calc(72vh + ${aumento}px)`;
  }

  if (diffY > 0) {
    sheet.style.transform = `translateY(${Math.min(diffY, 220)}px)`;
    sheet.style.opacity = String(1 - Math.min(diffY / 450, 0.45));
  }
}

window.confirmBonito = function (mensagem) {
  return new Promise(resolve => {
    document.getElementById("confirmBonitoTexto").textContent = mensagem;
    document.getElementById("modalConfirmBonitoOverlay").style.display = "block";
    document.getElementById("modalConfirmBonito").style.display = "block";
    window._confirmBonitoResolve = (valor) => {
      document.getElementById("modalConfirmBonitoOverlay").style.display = "none";
      document.getElementById("modalConfirmBonito").style.display = "none";
      window._confirmBonitoResolve = null;
      resolve(valor);
    };
  });
};

window.alertBonito = function (mensagem) {
  return new Promise(resolve => {
    document.getElementById("alertBonitoTexto").textContent = mensagem;
    document.getElementById("modalAlertBonitoOverlay").style.display = "block";
    document.getElementById("modalAlertBonito").style.display = "block";
    window._alertBonitoResolve = () => {
      document.getElementById("modalAlertBonitoOverlay").style.display = "none";
      document.getElementById("modalAlertBonito").style.display = "none";
      window._alertBonitoResolve = null;
      resolve();
    };
  });
};

window.promptBonito = function (mensagem, valorPadrao) {
  return new Promise(resolve => {
    document.getElementById("promptBonitoTexto").textContent = mensagem;
    const input = document.getElementById("promptBonitoInput");
    input.value = valorPadrao != null ? valorPadrao : "";
    document.getElementById("modalPromptBonitoOverlay").style.display = "block";
    document.getElementById("modalPromptBonito").style.display = "block";
    setTimeout(() => input.focus(), 50);
    window._promptBonitoResolve = (valor) => {
      document.getElementById("modalPromptBonitoOverlay").style.display = "none";
      document.getElementById("modalPromptBonito").style.display = "none";
      window._promptBonitoResolve = null;
      resolve(valor);
    };
  });
};

function finalizarDragSheet(e) {
  if (!sheetArrastando) return;

  const sheet = document.getElementById("sheetMonstro");
  if (!sheet) return;

  const ponto = pegarPontoEvento(e.changedTouches ? e.changedTouches[0] : e);

  const diffX = ponto.clientX - sheetDragInicioX;
  const diffY = ponto.clientY - sheetDragInicioY;

  const wasFullConteudo = sheetArrastando === "full-conteudo";
  sheetArrastando = false;

  sheet.style.transition =
    "transform 0.28s ease, opacity 0.22s ease, height 0.25s ease";

  if (Math.abs(diffX) > 90 && Math.abs(diffX) > Math.abs(diffY)) {
    diffX < 0 ? trocarMonstroSheet(1) : trocarMonstroSheet(-1);
    return;
  }

  if (wasFullConteudo) {
    sheet.style.transform = "";
    sheet.style.opacity = "";
    return;
  }

  if (diffY < -80) {
    sheet.classList.add("full");
  }

  if (diffY > 120 && sheet.classList.contains("full")) {
    sheet.classList.remove("full");
  } else if (diffY > 170 && !sheet.classList.contains("full")) {
    fecharSheetMonstro();
    return;
  }

  sheet.style.transform = "";
  sheet.style.opacity = "";
  sheet.style.height = "";
}

function trocarMonstroSheet(direcao) {
  if (!listaSheetCompendio.length) return;

  const indexNaLista = listaSheetCompendio.findIndex((_, i) => i === sheetMonstroIndexAtual);
  let base = indexNaLista >= 0 ? indexNaLista : 0;
  let novoIndex = base + direcao;
  if (novoIndex < 0) novoIndex = listaSheetCompendio.length - 1;
  if (novoIndex >= listaSheetCompendio.length) novoIndex = 0;

  const sheet = document.getElementById("sheetMonstro");
  if (!sheet) return;

  const desktop = window.innerWidth >= 1040;
  const base3d = desktop ? "translate(-50%, -50%)" : "";

  const fantasma = sheet.cloneNode(true);
  fantasma.removeAttribute("id");
  fantasma.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
  fantasma.style.transition = "none";
  fantasma.style.zIndex = "10502";
  fantasma.style.transformOrigin = direcao > 0 ? "right center" : "left center";
  fantasma.style.transform = desktop ? `${base3d} scale(1)` : "";
  fantasma.style.opacity = "1";
  document.body.appendChild(fantasma);

  sheetMonstroIndexAtual = novoIndex;
  const proximaEntry = listaSheetCompendio[novoIndex];
  const proximoTipo = proximaEntry._tipo;
  if (proximoTipo === "boss") _abrirPopupBossCompendio(proximaEntry);
  else if (proximoTipo === "item") _abrirPopupItemCompendio(proximaEntry);
  else if (proximoTipo === "npc") _abrirPopupNPCCompendio(proximaEntry);
  else if (proximoTipo === "mapa") _abrirPopupMapaCompendio(proximaEntry);
  else abrirSheetMonstroPadrao(proximaEntry);

  sheet.style.transition = "none";
  sheet.style.transformOrigin = direcao > 0 ? "left center" : "right center";
  sheet.style.transform = desktop
    ? `${base3d} translateX(${direcao > 0 ? "100%" : "-100%"}) scale(.55)`
    : (direcao > 0 ? "translateX(100%)" : "translateX(-100%)");
  sheet.style.opacity = desktop ? "0" : "1";

  void sheet.offsetWidth;
  void fantasma.offsetWidth;

  requestAnimationFrame(() => {
    sheet.style.transition = "transform 0.32s ease, opacity 0.28s ease";
    fantasma.style.transition = "transform 0.32s ease, opacity 0.28s ease";

    sheet.style.transform = desktop ? `${base3d} scale(1)` : "";
    sheet.style.opacity = "1";

    fantasma.style.transform = desktop
      ? `${base3d} translateX(${direcao > 0 ? "-100%" : "100%"}) scale(.55)`
      : (direcao > 0 ? "translateX(-100%)" : "translateX(100%)");
    fantasma.style.opacity = desktop ? "0" : "1";
  });

  setTimeout(() => {
    fantasma.remove();
    sheet.style.transition = "";
    sheet.style.transformOrigin = "";
    sheet.style.transform = "";
    sheet.style.opacity = "";
  }, 340);
}

function enviarMonstroPadraoParaCombate(monstro) {
  const copia = JSON.parse(JSON.stringify(monstro));

  copia.instanciaId = Date.now() + Math.floor(Math.random() * 9999);
  copia.monstroBaseId = monstro.id;
  copia.origem = "combate";
  copia.nome = gerarNomeInstanciaCombate(monstro.nome);

  combatesMestre.push(copia);

  salvarCombatesMestreStorage();
  renderCombatesMestre();

  alertBonito(`${monstro.nome} foi enviado para o combate.`);
}

function fecharSheetMonstro() {
  const overlay = document.getElementById("sheetMonstroOverlay");
  const sheet = document.getElementById("sheetMonstro");

  if (sheet) {
    sheet.classList.remove("aberto");
    sheet.classList.remove("full");

    sheet.style.display = "none";
    sheet.style.transition = "";
    sheet.style.transform = "";
    sheet.style.opacity = "";
    sheet.style.height = "";
  }

  if (overlay) {
    overlay.style.display = "none";
  }

  document.body.classList.remove("master-sheet-aberto");

  sheetMonstroIndexAtual = null;
}

function alternarSheetFull() {
  const sheet = document.getElementById("sheetMonstro");
  if (sheet) sheet.classList.toggle("full");
}

function editarMonstroMestre(index) {
  const monstro = monstrosMestre[index];
  if (!monstro) return;

  fecharSheetMonstro();

  editandoMonstroMestre = index;
  imagemMonstroBase64 = monstro.imagem || "";

  document.getElementById("monstroNome").value = monstro.nome || "";
  document.getElementById("monstroTipo").value = monstro.tipo || "";
  document.getElementById("monstroRegiao").value = monstro.regiao || "";
  document.getElementById("monstroHpMax").value = monstro.hpMax || 0;
  document.getElementById("monstroHpAtual").value = monstro.hpAtual || 0;
  document.getElementById("monstroCa").value = monstro.ca || 0;

  document.getElementById("monstroFor").value = monstro.status?.for || 10;
  document.getElementById("monstroDes").value = monstro.status?.des || 10;
  document.getElementById("monstroCon").value = monstro.status?.con || 10;
  document.getElementById("monstroInt").value = monstro.status?.int || 10;
  document.getElementById("monstroSab").value = monstro.status?.sab || 10;
  document.getElementById("monstroCar").value = monstro.status?.car || 10;

  document.getElementById("monstroLore").value = monstro.lore || "";

  // Popular listas de ataques e habilidades
  _monstroAtaquesForm = (monstro.ataques || "").split("|").map(a => a.trim()).filter(Boolean).map(a => {
    const partes = a.split(":"); return { nome: partes[0]?.trim() || a, desc: partes.slice(1).join(":").trim() };
  });
  _monstroHabilidadesForm = (monstro.habilidades || "").split("|").map(h => h.trim()).filter(Boolean).map(h => {
    const partes = h.split(":"); return { nome: partes[0]?.trim() || h, desc: partes.slice(1).join(":").trim() };
  });
  renderAtaquesForm();
  renderHabilidadesForm();

  const elHab = document.getElementById("monstroHabilidades");
if (elHab) elHab.value = monstro.habilidades || "";
const elDia = document.getElementById("monstroDialogos");
if (elDia) elDia.value = Array.isArray(monstro.dialogos) ? monstro.dialogos.join("\n") : "";
const elEnc = document.getElementById("monstroEncontros");
if (elEnc) elEnc.value = monstro.encontros || "";

  const preview = document.getElementById("previewMonstro");
  if (preview && monstro.imagem) {
    preview.src = monstro.imagem;
    preview.style.display = "block";
  }

  const titulo = document.getElementById("tituloFormMonstro");
  if (titulo) titulo.textContent = "Editar Monstro";

  const btnCriar = document.querySelectorAll(".master-tab-btn")[1];
  trocarAbaMaster("criar", btnCriar);
  atualizarModsMonstro();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirMonstroMestre(id) {
  const index = monstrosMestre.findIndex(m => m.id === id);
  const monstro = monstrosMestre[index];
  if (!monstro) return;

  const confirmar = await confirmBonito(`Deseja excluir "${monstro.nome}"?`);
  if (!confirmar) return;

  // deleta imagem do Storage
  if (window.storage && window.usuarioAtual && monstro.imagem?.startsWith("https://")) {
    try {
      const imgRef = window.storageRef(window.storage, monstro.imagem);
      await window.deleteObject(imgRef);
    } catch(e) { console.warn("Imagem não encontrada no Storage:", e); }
  }

  // apaga do Firebase
  if (window.usuarioAtual && monstro.id) {
    const uid = window.usuarioAtual.uid;
    deleteDoc(doc(db, "usuarios", uid, "monstros", String(monstro.id)));
  }

  monstrosMestre.splice(index, 1);
  salvarMonstrosMestreStorage();
  renderMonstrosMestre();
  fecharSheetMonstro();
}

function enviarMonstroParaCombate(index) {
  const monstro = monstrosMestre[index];
  if (!monstro) return;

  const copia = JSON.parse(JSON.stringify(monstro));

  copia.instanciaId = Date.now() + Math.floor(Math.random() * 9999);
  copia.monstroBaseId = monstro.id;
  copia.nome = gerarNomeInstanciaCombate(monstro.nome);

  combatesMestre.push(copia);

  salvarCombatesMestreStorage();
  renderCombatesMestre();

  alertBonito(`${monstro.nome} foi enviado para o combate.`);
}

function gerarNomeInstanciaCombate(nomeBase) {
  const quantidade = combatesMestre.filter(m =>
    (m.nome || "").startsWith(nomeBase)
  ).length + 1;

  return `${nomeBase} ${quantidade}`;
}

function toggleMinimizarCombate(index) {
  const monstro = combatesMestre[index];
  if (!monstro) return;

  monstro.minimizado = !monstro.minimizado;

  const card = document.querySelector(`.combate-card[data-idx="${index}"]`);
  if (!card) return;

  if (monstro.minimizado) {
    card.classList.add("minimizado");
  } else {
    card.classList.remove("minimizado");
  }

  salvarCombatesMestreStorage();
}


async function salvarTudoForcado() {
  const btn = document.getElementById("btnSalvarFlutuante");
  if (btn) { btn.textContent = "⏳"; btn.disabled = true; }

  try {
    if (personagemAtual !== null && typeof salvarTudo === "function") {
      salvarTudo();
    }
    if (typeof window.salvarFichasNaNuvem === "function") {
      await window.salvarFichasNaNuvem();
    }
    if (typeof salvarMonstrosMestreStorage === "function") {
      salvarMonstrosMestreStorage();
    }
    if (typeof salvarCombatesMestreStorage === "function") {
      salvarCombatesMestreStorage();
    }
    if (typeof salvarCampanhasMaster === "function") {
      salvarCampanhasMaster();
    }
    if (typeof window.salvarMonstrosNaNuvem === "function") {
      await window.salvarMonstrosNaNuvem();
    }

    if (btn) { btn.textContent = "✅"; }
    mostrarToastSalvarFlutuante("Tudo salvo!");
  } catch (erro) {
    console.error("Erro ao salvar tudo:", erro);
    if (btn) { btn.textContent = "❌"; }
    mostrarToastSalvarFlutuante("Erro ao salvar. Tente de novo.");
  }

  setTimeout(() => {
    if (btn) { btn.textContent = "💾"; btn.disabled = false; }
  }, 1500);
}

function mostrarToastSalvarFlutuante(msg) {
  const btn = document.getElementById("btnSalvarFlutuante");
  const t = document.createElement("div");
  t.textContent = msg;

  let top = "20%";
  let left = "calc(100% - 120px)";

  if (btn) {
    const rect = btn.getBoundingClientRect();
    top = (rect.bottom + 8) + "px";
    left = Math.max(8, rect.left - 30) + "px";
  }

  t.style.cssText = `
    position:fixed;top:${top};left:${left};z-index:99999;
    background:#1E1208;color:#F8F4E3;border:1px solid rgba(196,169,91,0.4);
    border-radius:10px;padding:8px 14px;font-size:13px;
    box-shadow:0 4px 12px rgba(0,0,0,0.5);
    opacity:0;transition:opacity 0.25s;
    white-space:nowrap;
  `;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.style.opacity = "1");
  setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 2000);
}

function renderAtaques(texto) {
  if (!texto) return "";
  const itens = texto.split("|").map(a => a.trim()).filter(Boolean);
  const linhas = itens.map(ataque => {
    const partes = ataque.split(":");
    const nome = partes[0]?.trim() || ataque;
    const desc = partes.slice(1).join(":").trim();
    return `<div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid rgba(196,169,91,0.12);">
      <span style="font-size:14px;flex-shrink:0;margin-top:1px;">⚔️</span>
      <div>
        <div style="font-size:13px;font-weight:bold;color:#2A1A10;">${escapeHtml(nome)}</div>
        ${desc ? `<div style="font-size:12px;color:#7A6A50;margin-top:2px;">${escapeHtml(desc)}</div>` : ""}
      </div>
    </div>`;
  }).join("");
  return `<div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
    <div style="background:#D4C9A8;padding:7px 12px;display:flex;align-items:center;gap:6px;justify-content:center;">
      <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Ataques</span>
    </div>
    <div style="padding:4px 12px 4px;">${linhas}</div>
  </div>`;
}

(function ativarDisqueteArrastavel() {
  function iniciar() {
    const btn = document.getElementById("btnSalvarFlutuante");
    if (!btn) return;

    let arrastando = false;
    let moveu = false;
    let offsetX = 0, offsetY = 0;

    const posSalva = JSON.parse(localStorage.getItem("posDisqueteFlutuante") || "null");
    if (posSalva) {
      btn.style.top = posSalva.top;
      btn.style.left = posSalva.left;
      btn.style.right = "auto";
    }

    function pegarPonto(e) {
      return e.touches ? e.touches[0] : e;
    }

    function aoIniciar(e) {
      const p = pegarPonto(e);
      const rect = btn.getBoundingClientRect();
      offsetX = p.clientX - rect.left;
      offsetY = p.clientY - rect.top;
      arrastando = true;
      moveu = false;
      btn.style.cursor = "grabbing";
    }

    function aoMover(e) {
      if (!arrastando) return;
      moveu = true;
      const p = pegarPonto(e);
      let novoX = p.clientX - offsetX;
      let novoY = p.clientY - offsetY;

      novoX = Math.max(4, Math.min(window.innerWidth - 52, novoX));
      novoY = Math.max(4, Math.min(window.innerHeight - 52, novoY));

      btn.style.left = novoX + "px";
      btn.style.top = novoY + "px";
      btn.style.right = "auto";
    }

    function aoSoltar() {
      if (!arrastando) return;
      arrastando = false;
      btn.style.cursor = "grab";

      if (moveu) {
        localStorage.setItem("posDisqueteFlutuante", JSON.stringify({
          top: btn.style.top,
          left: btn.style.left
        }));
      } else {
        salvarTudoForcado();
      }
    }

      btn.addEventListener("mousedown", aoIniciar);
    document.addEventListener("mousemove", aoMover);
    document.addEventListener("mouseup", aoSoltar);

    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      aoIniciar(e);
    }, { passive: false });

    // o toque continua chegando no próprio botão mesmo saindo de cima dele,
    // então não precisa escutar a página inteira (isso travava a rolagem no celular)
    btn.addEventListener("touchmove", (e) => {
      if (arrastando) e.preventDefault();
      aoMover(e);
    }, { passive: false });

    btn.addEventListener("touchend", (e) => {
      aoSoltar(e);
    });
    btn.addEventListener("touchcancel", (e) => {
      aoSoltar(e);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();

function renderHabilidades(texto) {
  if (!texto) return "";
  const itens = texto.split("|").map(a => a.trim()).filter(Boolean);
  const linhas = itens.map(hab => {
    const partes = hab.split(":");
    const nome = partes[0]?.trim() || hab;
    const desc = partes.slice(1).join(":").trim();
    return `<div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid rgba(196,169,91,0.12);">
      <span style="font-size:14px;flex-shrink:0;margin-top:1px;">✨</span>
      <div>
        <div style="font-size:13px;font-weight:bold;color:#2A1A10;">${escapeHtml(nome)}</div>
        ${desc ? `<div style="font-size:12px;color:#7A6A50;margin-top:2px;">${escapeHtml(desc)}</div>` : ""}
      </div>
    </div>`;
  }).join("");
  return `<div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
    <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
      <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Habilidades Especiais</span>
    </div>
    <div style="padding:4px 12px 4px;">${linhas}</div>
  </div>`;
}

function renderCombatesMestre() {
  const container = document.getElementById("listaCombateMestre");
  container.innerHTML = "";

  const largura = window.innerWidth;
  let numColunas = 1;
  if (largura >= 1040) numColunas = 3;
  else if (largura >= 660) numColunas = 2;

  const colunas = [];
  for (let i = 0; i < numColunas; i++) {
    const col = document.createElement("div");
    col.className = "combate-coluna";
    container.appendChild(col);
    colunas.push(col);
  }

  if (!combatesMestre.length) {
    lista.innerHTML = `
      <p style="text-align:center; color:#cdb791;">
        Nenhum monstro no combate ainda.
      </p>
    `;
    return;
  }

  combatesMestre.forEach((monstro, index) => {

    const card = document.createElement("div");

    const minimizado = monstro.minimizado ? "minimizado" : "";
    card.className = `combate-card ${minimizado}`;
    card.dataset.idx = index;

    const imagem = monstro.imagem || "icon-512.png";

    card.innerHTML = `

      <!-- TOPO -->
      <div class="combate-topo" onclick="toggleMinimizarCombate(${index})">

        <img
          class="combate-img"
          src="${imagem}"
          alt="${escapeHtml(monstro.nome)}"
        >

        <div class="combate-info">

          <strong>${escapeHtml(monstro.nome)}</strong>

          <small>
            ${escapeHtml(monstro.tipo || "Tipo não definido")}
            • CA ${monstro.ca || 0}
          </small>

          <div class="combate-hp">
  <span id="combateHpTexto${index}">❤️ HP ${monstro.hpAtual}/${monstro.hpMax}</span>
  <div class="combate-hp-barra">
    <div id="combateHpFill${index}" class="combate-hp-fill" style="width:${Math.max(0,Math.min(100,Math.round((monstro.hpAtual/monstro.hpMax)*100)))}%;background:${monstro.hpAtual/monstro.hpMax > 0.5 ? '#2a7a40' : monstro.hpAtual/monstro.hpMax > 0.25 ? '#7a6020' : '#8f2222'};"></div>
  </div>
</div>

        </div>

        <button
          class="btn-minimizar-combate"
          style="pointer-events:none;"
        >
          ${monstro.minimizado ? "▲" : "▼"}
        </button>

      </div>

      <!-- DETALHES -->
      <div class="combate-detalhes">
        <div class="combate-detalhes-inner">

        <!-- STATUS -->
        <div class="sheet-status-grid" style="margin-top:12px;">

          <div>
            FOR<br>
            ${monstro.status?.for || 10}
            <small>
              ${formatarModMonstro(
                calcularModMonstro(monstro.status?.for || 10)
              )}
            </small>
          </div>

          <div>
            DES<br>
            ${monstro.status?.des || 10}
            <small>
              ${formatarModMonstro(
                calcularModMonstro(monstro.status?.des || 10)
              )}
            </small>
          </div>

          <div>
            CON<br>
            ${monstro.status?.con || 10}
            <small>
              ${formatarModMonstro(
                calcularModMonstro(monstro.status?.con || 10)
              )}
            </small>
          </div>

          <div>
            INT<br>
            ${monstro.status?.int || 10}
            <small>
              ${formatarModMonstro(
                calcularModMonstro(monstro.status?.int || 10)
              )}
            </small>
          </div>

          <div>
            SAB<br>
            ${monstro.status?.sab || 10}
            <small>
              ${formatarModMonstro(
                calcularModMonstro(monstro.status?.sab || 10)
              )}
            </small>
          </div>

          <div>
            CAR<br>
            ${monstro.status?.car || 10}
            <small>
              ${formatarModMonstro(
                calcularModMonstro(monstro.status?.car || 10)
              )}
            </small>
          </div>

        </div>

        <!-- BOTÕES RÁPIDOS -->
        <div class="combate-botoes">
  <div class="combate-botoes-linha">
    <button class="btn-hp-dano" onclick="alterarHpCombate(${index}, -1)">Dano -1</button>
    <button class="btn-hp-dano" onclick="alterarHpCombate(${index}, -5)">Dano -5</button>
    <button class="btn-hp-dano" onclick="alterarHpCombate(${index}, -10)">Dano -10</button>
  </div>
  <div class="combate-botoes-linha">
    <button class="btn-hp-cura" onclick="alterarHpCombate(${index}, 1)">Cura +1</button>
    <button class="btn-hp-cura" onclick="alterarHpCombate(${index}, 5)">Cura +5</button>
    <button class="btn-hp-cura" onclick="alterarHpCombate(${index}, 10)">Cura +10</button>
  </div>
</div>

        <!-- MANUAL -->
        <div class="combate-manual">

          <input
            id="danoCombate${index}"
            type="number"
            placeholder="Dano recebido"
          >

          <input
            id="curaCombate${index}"
            type="number"
            placeholder="Cura recebida"
          >

        </div>

        <!-- AÇÕES -->
        <div class="combate-acoes">

          <button
            class="btn-master-perigo"
            onclick="aplicarDanoCombate(${index})"
          >
            Aplicar dano
          </button>

          <button
            class="btn-master-principal"
            onclick="aplicarCuraCombate(${index})"
          >
            Aplicar cura
          </button>

        </div>

        <!-- LORE -->
        ${monstro.lore ? `
          <div class="sheet-bloco">
            <strong>Lore</strong>
            <p>${formatarTexto(monstro.lore)}</p>
          </div>
        ` : ""}

        ${renderHabilidades(monstro.habilidades)}

        <!-- ENCONTROS -->
        ${monstro.encontros ? `
          <div class="sheet-bloco">
            <strong>Pontos de encontro</strong>
            <p>${formatarTexto(monstro.encontros)}</p>
          </div>
        ` : ""}

        <!-- ATAQUES -->
        ${renderAtaques(monstro.ataques)}

        <!-- REAÇÕES -->
        ${monstro.reacoes ? `
          <div class="sheet-bloco">
            <strong>Reações</strong>
            <p style="white-space:pre-line;">${formatarTexto(monstro.reacoes)}</p>
          </div>
        ` : ""}

        <!-- RESISTÊNCIAS -->
        ${monstro.resistencias ? `
          <div class="sheet-bloco">
            <strong>Resistências / Imunidades</strong>
            <p>${formatarTexto(monstro.resistencias)}</p>
          </div>
        ` : ""}

        <!-- FRAQUEZAS (boss) -->
        ${monstro.fraquezas ? `<div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);"><div style="background:#D4C9A8;padding:7px 12px;text-align:center;"><span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Fraquezas</span></div><div style="padding:10px 14px;font-size:13px;color:#2A1A10;line-height:1.6;">${formatarTexto(monstro.fraquezas)}</div></div>` : ""}

          <!-- LOG -->
  <div class="combate-log">
    <div class="combate-log-titulo">Log de combate</div>
    <div class="combate-log-lista" id="combateLogLista${index}">
      ${(monstro.log && monstro.log.length > 0) ? monstro.log.map(e => `
        <div class="combate-log-item combate-log-${e.tipo}">
          <span class="combate-log-hora">${e.hora}</span>
          <span>${e.texto}</span>
        </div>
      `).join("") : `<div class="combate-log-vazio">Nenhum evento registrado ainda.</div>`}
    </div>
  </div>

        <!-- REMOVER -->
        <button
          class="btn-master-secundario"
          style="width:100%; margin-top:10px;"
          onclick="removerDoCombate(${index})"
        >
          Remover do combate
        </button>

        </div>
      </div>
    `;

     colunas[index % numColunas].appendChild(card);
  });
}

function alterarHpCombate(index, valor) {
  const monstro = combatesMestre[index];
  if (!monstro) return;

  const hpAntes = monstro.hpAtual;
  monstro.hpAtual += valor;
  if (monstro.hpAtual < 0) monstro.hpAtual = 0;
  if (monstro.hpAtual > monstro.hpMax) monstro.hpAtual = monstro.hpMax;

  const diff = monstro.hpAtual - hpAntes;
  let novoItemLogHtml = "";

  if (diff !== 0) {
    if (!monstro.log) monstro.log = [];
    const hora = new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", "");
    const entrada = diff < 0
      ? { tipo: "dano", texto: `${monstro.nome} tomou ${Math.abs(diff)} de dano — HP: ${monstro.hpAtual}/${monstro.hpMax}`, hora }
      : { tipo: "cura", texto: `${monstro.nome} recebeu ${diff} de cura — HP: ${monstro.hpAtual}/${monstro.hpMax}`, hora };

    monstro.log.unshift(entrada);
    if (monstro.log.length > 20) monstro.log.pop();

    novoItemLogHtml = `
      <div class="combate-log-item combate-log-${entrada.tipo}">
        <span class="combate-log-hora">${entrada.hora}</span>
        <span>${entrada.texto}</span>
      </div>`;
  }

  salvarCombatesMestreStorage();

  // Atualiza só este card — sem recriar a lista inteira, sem pular a rolagem
  const textoHp = document.getElementById(`combateHpTexto${index}`);
  const fillHp = document.getElementById(`combateHpFill${index}`);
  const logLista = document.getElementById(`combateLogLista${index}`);

  if (textoHp) textoHp.textContent = `❤️ HP ${monstro.hpAtual}/${monstro.hpMax}`;

  if (fillHp) {
    const pct = Math.max(0, Math.min(100, Math.round((monstro.hpAtual / monstro.hpMax) * 100)));
    const cor = monstro.hpAtual / monstro.hpMax > 0.5 ? '#2a7a40' : monstro.hpAtual / monstro.hpMax > 0.25 ? '#7a6020' : '#8f2222';
    fillHp.style.width = pct + "%";
    fillHp.style.background = cor;
  }

  if (logLista && novoItemLogHtml) {
    const vazio = logLista.querySelector(".combate-log-vazio");
    if (vazio) vazio.remove();
    logLista.insertAdjacentHTML("afterbegin", novoItemLogHtml);
    while (logLista.children.length > 20) {
      logLista.removeChild(logLista.lastElementChild);
    }
  }
}

function aplicarDanoCombate(index) {
  const input = document.getElementById(`danoCombate${index}`);
  const dano = parseInt(input?.value) || 0;
  if (dano <= 0) return;
  alterarHpCombate(index, -dano);
  if (input) input.value = "";
}

function aplicarCuraCombate(index) {
  const input = document.getElementById(`curaCombate${index}`);
  const cura = parseInt(input?.value) || 0;
  if (cura <= 0) return;
  alterarHpCombate(index, cura);
  if (input) input.value = "";
}

function aplicarDanoCombate(index) {
  const input = document.getElementById(`danoCombate${index}`);
  const dano = parseInt(input?.value) || 0;

  if (dano <= 0) return;

  alterarHpCombate(index, -dano);
}

function aplicarCuraCombate(index) {
  const input = document.getElementById(`curaCombate${index}`);
  const cura = parseInt(input?.value) || 0;

  if (cura <= 0) return;

  alterarHpCombate(index, cura);
}

async function removerDoCombate(index) {
  const monstro = combatesMestre[index];
  if (!monstro) return;

  const confirmar = await confirmBonito(`Remover "${monstro.nome}" do combate?`);
  if (!confirmar) return;

  combatesMestre.splice(index, 1);
  salvarCombatesMestreStorage();
  renderCombatesMestre();
}

function sortearFalaMonstro(index) {
  const monstro = monstrosMestre[index];
  const alvo = document.getElementById("falaAleatoriaTexto");

  if (!monstro || !alvo) return;

  if (!monstro.dialogos || monstro.dialogos.length === 0) {
    alvo.textContent = "Esse monstro ainda não tem falas cadastradas.";
    return;
  }

  const fala = monstro.dialogos[Math.floor(Math.random() * monstro.dialogos.length)];
  alvo.textContent = `“${fala}”`;
}

function calcularModMonstro(valor) {
  if (valor <= 1) return -5;
  if (valor <= 3) return -4;
  if (valor <= 5) return -3;
  if (valor <= 7) return -2;
  if (valor <= 9) return -1;
  if (valor <= 11) return 0;
  if (valor <= 13) return 1;
  if (valor <= 15) return 2;
  if (valor <= 17) return 3;
  if (valor <= 19) return 4;
  if (valor <= 21) return 5;
  if (valor <= 23) return 6;
  if (valor <= 25) return 7;
  if (valor <= 27) return 8;
  if (valor <= 29) return 9;
  return 10;
}

function formatarModMonstro(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function atualizarModsMonstro() {

  const atributos = [
    ["For", "monstroFor"],
    ["Des", "monstroDes"],
    ["Con", "monstroCon"],
    ["Int", "monstroInt"],
    ["Sab", "monstroSab"],
    ["Car", "monstroCar"]
  ];

  atributos.forEach(([sigla, id]) => {

    const valor =
      parseInt(document.getElementById(id)?.value) || 10;

    const mod = calcularModMonstro(valor);

    const el = document.getElementById(`modMonstro${sigla}`);

    if (el) {
      el.textContent = formatarModMonstro(mod);
    }
  });
}

function escapeHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarTexto(texto) {
  return escapeHtml(texto).replace(/\n/g, "<br>");
}

/* ================= INIT ================= */

let editandoEventoLore = -1;

function salvarSessaoLore() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;
  const nome = document.getElementById("sessaoNome")?.value.trim();
  if (!nome) { alertBonito("Digite o nome da sessão."); return; }

  campanha.sessoes ||= [];
  campanha.sessoes.push({
    id:        Date.now(),
    nome,
    status:    document.getElementById("sessaoStatus")?.value || "planejada",
    descricao: document.getElementById("sessaoDescricao")?.value.trim() || "",
    data:      new Date().toLocaleDateString("pt-BR"),
  });

  salvarCampanhasMaster();
  document.getElementById("sessaoNome").value = "";
  document.getElementById("sessaoDescricao").value = "";
  renderSessoesLore();
}

function renderHabilidades(texto) {
  if (!texto) return "";
  const itens = texto.split("|").map(a => a.trim()).filter(Boolean);
  const linhas = itens.map(hab => {
    const partes = hab.split(":");
    const nome = partes[0]?.trim() || hab;
    const desc = partes.slice(1).join(":").trim();
    return `<div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid rgba(196,169,91,0.12);">
      <span style="font-size:14px;flex-shrink:0;margin-top:1px;">✨</span>
      <div>
        <div style="font-size:13px;font-weight:bold;color:#2A1A10;">${escapeHtml(nome)}</div>
        ${desc ? `<div style="font-size:12px;color:#7A6A50;margin-top:2px;">${escapeHtml(desc)}</div>` : ""}
      </div>
    </div>`;
  }).join("");
  return `<div style="background:#E8E0CC;border-radius:10px;margin-bottom:10px;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
    <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
      <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Habilidades Especiais</span>
    </div>
    <div style="padding:4px 12px 4px;">${linhas}</div>
  </div>`;
}

function salvarEventoLore() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;
  const nome = document.getElementById("eventoNome")?.value.trim();
  if (!nome) { alertBonito("Digite o nome do evento."); return; }

  campanha.eventos ||= [];
  campanha.eventos.push({
    id:        Date.now(),
    nome,
    tipo:      document.getElementById("eventoTipo")?.value || "outro",
    descricao: document.getElementById("eventoDescricao")?.value.trim() || "",
    data:      new Date().toLocaleDateString("pt-BR"),
  });

  salvarCampanhasMaster();
  document.getElementById("eventoNome").value = "";
  document.getElementById("eventoDescricao")?.value && (document.getElementById("eventoDescricao").value = "");
  renderEventosLore();
}
 
function init() {
  atualizarTudo();
  renderPersonagens();
  atualizarHP();
  atualizarTemp();
  atualizarMorte();
  atualizarDT();
  atualizarSaves();
  atualizarBadgesSaves();
  ativarDragVida();
  ativarDragTemp();
  limparFocoBotoesVida();

  const nome = document.getElementById("nome");
  const raca = document.getElementById("racaSelect");
  const classe = document.getElementById("classe");
  const ca = document.getElementById("ca");
  const deslocamento = document.getElementById("deslocamento");
  const idade = document.getElementById("idade");
  const altura = document.getElementById("altura");
  const nivel = document.getElementById("nivel");
  const vidaMax = document.getElementById("vidaMax");

  [nome, raca, classe, ca, deslocamento, idade, altura, nivel].forEach((el) => {
    if (el) el.addEventListener("input", salvarTudo);
  });

  if (vidaMax) {
    vidaMax.addEventListener("input", () => {
      const max = get("vidaMax");
      if (vidaAtual > max) vidaAtual = max;
      atualizarHP();
      atualizarTemp();
      salvarTudo();
    });
  }

  const camposAutoSave = [
    "classe",
    "forca",
    "destreza",
    "constituicao",
    "inteligencia",
    "sabedoria",
    "carisma",
    "bonusProf",
    "ca",
    "deslocamento",
    "idade",
    "altura",
    "nivel",
    "inspiracao",
    "dtBase",
    "dtAtributo",
    "dtProf",
    "racaSelect",
    "antecedentes",
    "aliados",
    "idiomas",
  ];

  camposAutoSave.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", () => {
      atualizarTudo();
      atualizarDT();
      salvarTudo();
    });
  });

  const popup = document.getElementById("popup");
  if (popup) {
    popup.addEventListener("click", (e) => {
      if (e.target.id === "popup") fecharPopup();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharPopup();
  });

  trocarAba("personagem");
}

document.addEventListener("DOMContentLoaded", init);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .then(() => console.log("SW registrado"))
    .catch((err) => console.log("Erro SW:", err));
}

window.onload = function () {
  restaurarSecoes();
};

atualizarDropdownRacas();


/* ================= LORE MASTER ================= */

function salvarHistoriaPrincipalLore() {

  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  const texto = document.getElementById("historiaPrincipalLore").value;

  campanha.historiaPrincipal = texto;

  salvarCampanhasMaster();
}

/* ================= SESSÕES ================= */

function salvarSessaoLore() {

  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  const nome = document.getElementById("sessaoNome").value.trim();
  const descricao = document.getElementById("sessaoDescricao").value.trim();

  if (!nome || !descricao) return;

  if (!campanha.sessoes) {
    campanha.sessoes = [];
  }

  campanha.sessoes.unshift({
    id: Date.now(),
    nome,
    descricao,
    data: new Date().toLocaleDateString("pt-BR")
  });

  salvarCampanhasMaster();

  document.getElementById("sessaoNome").value = "";
  document.getElementById("sessaoDescricao").value = "";

  renderSessoesLore();
}


function deletarSessaoLore(id) {

  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  campanha.sessoes =
    campanha.sessoes.filter(s => s.id !== id);

  salvarCampanhasMaster();
  renderSessoesLore();
}

/* ================= EVENTOS ================= */

function salvarEventoLore() {

  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  const nome = document.getElementById("eventoNome").value.trim();
  const descricao = document.getElementById("eventoDescricao").value.trim();

  if (!nome || !descricao) return;

  if (!campanha.eventos) {
    campanha.eventos = [];
  }

  campanha.eventos.unshift({
    id: Date.now(),
    nome,
    descricao,
    data: new Date().toLocaleDateString("pt-BR")
  });

  salvarCampanhasMaster();

  document.getElementById("eventoNome").value = "";
  document.getElementById("eventoDescricao").value = "";

  renderEventosLore();
}


function deletarEventoLore(id) {

  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  campanha.eventos =
    campanha.eventos.filter(e => e.id !== id);

  salvarCampanhasMaster();
  renderEventosLore();
}


/* ================= LORE MASTER ================= */

function salvarHistoriaPrincipalLore() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  campanha.historiaPrincipal =
    document.getElementById("historiaPrincipalLore")?.value || "";

  salvarCampanhasMaster();
}

function salvarSessaoLore() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  campanha.sessoes ||= [];

  const nome = document.getElementById("sessaoNome").value.trim();
  const descricao = document.getElementById("sessaoDescricao").value.trim();

  if (!nome || !descricao) return;

  campanha.sessoes.push({
    id: Date.now(),
    nome,
    descricao,
    data: new Date().toLocaleDateString("pt-BR"),
  });

  document.getElementById("sessaoNome").value = "";
  document.getElementById("sessaoDescricao").value = "";

  salvarCampanhasMaster();
  renderSessoesLore();
}

function salvarEventoLore() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  campanha.eventos ||= [];

  const nome = document.getElementById("eventoNome").value.trim();
  const descricao = document.getElementById("eventoDescricao").value.trim();

  if (!nome || !descricao) return;

  campanha.eventos.push({
    id: Date.now(),
    nome,
    descricao,
    data: new Date().toLocaleDateString("pt-BR"),
  });

  document.getElementById("eventoNome").value = "";
  document.getElementById("eventoDescricao").value = "";

  salvarCampanhasMaster();
  renderEventosLore();
}

function renderSessoesLore() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const lista = document.getElementById("listaSessoesLore");
  if (!lista || !campanha) return;

  campanha.sessoes ||= [];

  if (!campanha.sessoes.length) {
    lista.innerHTML = `<p class="master-desc" style="padding:12px 0;">Nenhuma sessão ainda.</p>`;
    return;
  }

  const corStatus  = { completa:"#2a7a40", planejada:"#7a6020", cancelada:"#7a2020" };
  const labelStatus = { completa:"Completa", planejada:"Planejada", cancelada:"Cancelada" };

  lista.innerHTML = campanha.sessoes.map((s, i) => {
    const status = s.status || "planejada";
    const cor = corStatus[status] || "#5a4a3a";
    return `
    <div style="
      background:#F0EBD8;
      border:1px solid rgba(196,169,91,0.3);
      border-left:3px solid ${cor};
       border-radius:10px;
      padding:14px 16px;
      margin-bottom:12px;
      cursor:pointer;
    " onclick="abrirDetalheSessaoLore(${s.id})">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="
          width:28px;height:28px;border-radius:50%;flex-shrink:0;
          background:${cor}22;border:1.5px solid ${cor}66;
          color:${cor};font-size:12px;font-weight:bold;
          display:flex;align-items:center;justify-content:center;">
          ${i + 1}
        </div>
        <strong style="flex:1;color:#2A1A10;font-size:14px;">${escapeHtml(s.nome)}</strong>
        <span style="
          font-size:10px;font-weight:bold;padding:3px 9px;border-radius:20px;
          background:${cor}22;color:${cor};border:1px solid ${cor}44;">
          ${labelStatus[status] || status}
        </span>
      </div>
      ${s.descricao ? `<p style="font-size:12px;color:#7A6A50;margin:0 0 10px 38px;line-height:1.5;">${escapeHtml(s.descricao)}</p>` : ""}
      <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid rgba(196,169,91,0.2);padding-top:8px;margin-top:4px;">
        <button onclick="event.stopPropagation();editarSessaoLore(${s.id})" style="
          background:transparent;border:1px solid rgba(196,169,91,0.4);border-radius:6px;
          color:#7A6A50;font-size:13px;padding:4px 10px;cursor:pointer;">✏</button>
        <button onclick="event.stopPropagation();deletarSessaoLore(${s.id})" style="
          background:transparent;border:1px solid rgba(143,34,34,0.3);border-radius:6px;
          color:#8f2222;font-size:13px;padding:4px 10px;cursor:pointer;">🗑</button>
      </div>
    </div>`;
  }).join("");
}

function renderEventosLore() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const lista = document.getElementById("listaEventosLore");
  if (!lista || !campanha) return;

  campanha.eventos ||= [];

  if (!campanha.eventos.length) {
    lista.innerHTML = `<p class="master-desc" style="padding:12px 0;">Nenhum evento ainda.</p>`;
    return;
  }

  const tipoInfo = {
    batalha:  { emoji:"⚔️", cor:"#8f2222" },
    revelacao:{ emoji:"🔍", cor:"#1a5f8f" },
    morte:    { emoji:"💀", cor:"#4a4a4a" },
    alianca:  { emoji:"🤝", cor:"#2a7a40" },
    outro:    { emoji:"📌", cor:"#7a6020" },
  };

  lista.innerHTML = campanha.eventos.map(e => {
    const t = tipoInfo[e.tipo] || tipoInfo.outro;
    return `
    <div style="
      background:#F0EBD8;
      border:1px solid rgba(196,169,91,0.3);
      border-left:3px solid ${t.cor};
      border-radius:10px;
      padding:14px 16px;
      margin-bottom:12px;
      cursor:pointer;
    " onclick="abrirDetalheEventoLore(${e.id})">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="
          font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;
          padding:3px 9px;border-radius:20px;
          background:${t.cor}22;color:${t.cor};border:1px solid ${t.cor}44;">
          ${t.emoji} ${e.tipo || "outro"}
        </span>
        ${e.data ? `<span style="font-size:11px;color:#7a6040;margin-left:auto;">${e.data}</span>` : ""}
      </div>
      <strong style="color:#2A1A10;font-size:14px;">${escapeHtml(e.nome)}</strong>
      ${e.descricao ? `<p style="font-size:12px;color:#7A6A50;margin:6px 0 10px;line-height:1.5;">${escapeHtml(e.descricao)}</p>` : ""}
      <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid rgba(196,169,91,0.2);padding-top:8px;margin-top:4px;">
        <button onclick="event.stopPropagation();editarEventoLore(${e.id})" style="
          background:transparent;border:1px solid rgba(196,169,91,0.4);border-radius:6px;
          color:#7A6A50;font-size:13px;padding:4px 10px;cursor:pointer;">✏</button>
        <button onclick="event.stopPropagation();deletarEventoLore(${e.id})" style="
          background:transparent;border:1px solid rgba(143,34,34,0.3);border-radius:6px;
          color:#8f2222;font-size:13px;padding:4px 10px;cursor:pointer;">🗑</button>
      </div>
    </div>`;
  }).join("");
}

function deletarSessaoLore(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  campanha.sessoes =
    campanha.sessoes.filter(s => s.id !== id);

  salvarCampanhasMaster();
  renderSessoesLore();
}


function deletarEventoLore(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  campanha.eventos =
    campanha.eventos.filter(e => e.id !== id);

  salvarCampanhasMaster();
  renderEventosLore();
}

function editarSessaoLore(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;
  const s = campanha.sessoes.find(s => s.id === id);
  if (!s) return;

  const modal = document.createElement("div");
  modal.id = "modalEditarSessao";
  modal.style.cssText = `position:fixed;inset:0;z-index:9999;background:rgba(20,12,6,0.85);display:flex;align-items:center;justify-content:center;padding:24px;`;
  modal.innerHTML = `
    <div style="background:#1E1208;border:1px solid rgba(196,169,91,0.35);border-radius:14px;padding:24px;width:100%;max-width:420px;position:relative;">
      <button onclick="document.getElementById('modalEditarSessao').remove()" style="position:absolute;top:12px;right:14px;background:transparent;border:none;color:#7A6A50;font-size:20px;cursor:pointer;">✕</button>
      <h3 style="color:#C4A95B;font-size:16px;margin:0 0 16px;font-family:'Cinzel',serif;">✏ Editar Sessão</h3>

      <label style="color:#7A6A50;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Nome</label>
      <input id="editSessaoNome" value="${escapeHtml(s.nome)}" style="width:100%;background:#2A1A10;border:1px solid rgba(196,169,91,0.3);border-radius:8px;color:#F8F4E3;padding:10px 12px;font-size:14px;margin:6px 0 14px;box-sizing:border-box;">

      <label style="color:#7A6A50;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Status</label>
      <select id="editSessaoStatus" style="width:100%;background:#2A1A10;border:1px solid rgba(196,169,91,0.3);border-radius:8px;color:#F8F4E3;padding:10px 12px;font-size:14px;margin:6px 0 14px;box-sizing:border-box;">
        <option value="planejada" ${s.status==='planejada'?'selected':''}>🟡 Planejada</option>
        <option value="completa"  ${s.status==='completa' ?'selected':''}>✅ Completa</option>
        <option value="cancelada" ${s.status==='cancelada'?'selected':''}>❌ Cancelada</option>
      </select>

      <label style="color:#7A6A50;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Descrição</label>
      <textarea id="editSessaoDescricao" rows="4" style="width:100%;background:#2A1A10;border:1px solid rgba(196,169,91,0.3);border-radius:8px;color:#F8F4E3;padding:10px 12px;font-size:13px;margin:6px 0 16px;box-sizing:border-box;resize:vertical;">${escapeHtml(s.descricao || '')}</textarea>

      <button onclick="salvarEdicaoSessaoLore(${id})" style="width:100%;background:#7B1E28;border:none;border-radius:8px;color:#F8F4E3;padding:12px;font-size:14px;font-family:'Cinzel',serif;cursor:pointer;">Salvar alterações</button>
    </div>
  `;
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function salvarEdicaoSessaoLore(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;
  const sessao = campanha.sessoes.find(s => s.id === id);
  if (!sessao) return;

  sessao.nome      = document.getElementById("editSessaoNome").value;
  sessao.descricao = document.getElementById("editSessaoDescricao").value;
  sessao.status    = document.getElementById("editSessaoStatus").value;

  salvarCampanhasMaster();
  renderSessoesLore();
  document.getElementById("modalEditarSessao")?.remove();
}

function editarEventoLore(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;
  const e = campanha.eventos.find(e => e.id === id);
  if (!e) return;

  const tipoInfo = { batalha:"⚔️ Batalha", revelacao:"🔍 Revelação", morte:"💀 Morte", alianca:"🤝 Aliança", outro:"📌 Outro" };

  const modal = document.createElement("div");
  modal.id = "modalEditarEvento";
  modal.style.cssText = `position:fixed;inset:0;z-index:9999;background:rgba(20,12,6,0.85);display:flex;align-items:center;justify-content:center;padding:24px;`;
  modal.innerHTML = `
    <div style="background:#1E1208;border:1px solid rgba(196,169,91,0.35);border-radius:14px;padding:24px;width:100%;max-width:420px;position:relative;">
      <button onclick="document.getElementById('modalEditarEvento').remove()" style="position:absolute;top:12px;right:14px;background:transparent;border:none;color:#7A6A50;font-size:20px;cursor:pointer;">✕</button>
      <h3 style="color:#C4A95B;font-size:16px;margin:0 0 16px;font-family:'Cinzel',serif;">✏ Editar Evento</h3>

      <label style="color:#7A6A50;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Nome</label>
      <input id="editEventoNome" value="${escapeHtml(e.nome)}" style="width:100%;background:#2A1A10;border:1px solid rgba(196,169,91,0.3);border-radius:8px;color:#F8F4E3;padding:10px 12px;font-size:14px;margin:6px 0 14px;box-sizing:border-box;">

      <label style="color:#7A6A50;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Tipo</label>
      <select id="editEventoTipo" style="width:100%;background:#2A1A10;border:1px solid rgba(196,169,91,0.3);border-radius:8px;color:#F8F4E3;padding:10px 12px;font-size:14px;margin:6px 0 14px;box-sizing:border-box;">
        ${Object.entries(tipoInfo).map(([val, label]) => `<option value="${val}" ${e.tipo===val?'selected':''}>${label}</option>`).join('')}
      </select>

      <label style="color:#7A6A50;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Descrição</label>
      <textarea id="editEventoDescricao" rows="4" style="width:100%;background:#2A1A10;border:1px solid rgba(196,169,91,0.3);border-radius:8px;color:#F8F4E3;padding:10px 12px;font-size:13px;margin:6px 0 16px;box-sizing:border-box;resize:vertical;">${escapeHtml(e.descricao || '')}</textarea>

      <button onclick="salvarEdicaoEventoLore(${id})" style="width:100%;background:#7B1E28;border:none;border-radius:8px;color:#F8F4E3;padding:12px;font-size:14px;font-family:'Cinzel',serif;cursor:pointer;">Salvar alterações</button>
    </div>
  `;
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function salvarEdicaoEventoLore(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;
  const evento = campanha.eventos.find(e => e.id === id);
  if (!evento) return;

  evento.nome      = document.getElementById("editEventoNome").value;
  evento.descricao = document.getElementById("editEventoDescricao").value;
  evento.tipo      = document.getElementById("editEventoTipo").value;

  salvarCampanhasMaster();
  renderEventosLore();
  fecharPopup();
  document.getElementById("modalEditarEvento")?.remove();
}

/* ═══════════════════════════════════════════
   ABA MUNDO — NPCs, Missões, Encontros
═══════════════════════════════════════════ */

function inicializarAbaMundo() {
  document.querySelectorAll(".mundo-secao").forEach(s => s.style.display = "none");
  document.querySelectorAll(".mundo-tab-btn").forEach(b => b.classList.remove("active"));

  const missoes = document.getElementById("mundoSecaoMissoes");
  if (missoes) missoes.style.display = "block";

  const primeiroBtn = document.querySelector("#abaMaster-mundo .mundo-tab-btn");
  if (primeiroBtn) primeiroBtn.classList.add("active");

  renderMundoCampanha();
}

function renderMundoCampanha() {
  renderMissoesMundo();
}

window._darItemContexto = null;

window.abrirDarItem = async function (tipo, index) {
  const ficha = window.personagens?.[personagemAtual];
  if (!ficha) return;

  if (!ficha.grupoAtivo) {
    alertBonito("Essa ficha não está vinculada a nenhum grupo. Vá em Amigos → Grupos e escolha essa ficha num grupo primeiro.");
    return;
  }

  window._darItemContexto = { tipo, index };

  document.getElementById("modalDarItemOverlay").style.display = "block";
  document.getElementById("modalDarItem").style.display = "block";

  const lista = document.getElementById("listaDarItem");
  lista.innerHTML = `<p style="color:#9A8A70;font-size:12px;text-align:center;">Carregando...</p>`;

  try {
    const grupoSnap = await getDoc(doc(db, "grupos", ficha.grupoAtivo));
    if (!grupoSnap.exists()) {
      lista.innerHTML = `<p style="color:#e07a7a;font-size:12px;text-align:center;">Esse grupo não existe mais.</p>`;
      return;
    }
    const g = grupoSnap.data();
    const meuUid = window.usuarioAtual.uid;
    const outros = g.membros.filter(m => m.uid !== meuUid && m.fichaId);

    if (outros.length === 0) {
      lista.innerHTML = `<p style="color:#9A8A70;font-size:12px;text-align:center;">Ninguém do grupo tem uma ficha vinculada ainda.</p>`;
      return;
    }

    lista.innerHTML = outros.map(m => `
      <button onclick="window.confirmarDarItem('${m.uid}', '${m.fichaId}', '${escapeHtml(m.nickname)}')" style="width:100%;text-align:left;padding:10px 12px;border-radius:8px;border:1px solid rgba(196,169,91,0.2);background:rgba(255,255,255,0.03);color:#F8F4E3;font-size:13px;cursor:pointer;">
        ${escapeHtml(m.nickname)}<span style="opacity:.5;">#${escapeHtml(m.tag)}</span>
      </button>
    `).join("");
  } catch (e) {
    console.error(e);
    lista.innerHTML = `<p style="color:#e07a7a;font-size:12px;text-align:center;">Erro: ${e.code || e.message}</p>`;
  }
};

window.fecharDarItem = function () {
  document.getElementById("modalDarItemOverlay").style.display = "none";
  document.getElementById("modalDarItem").style.display = "none";
  window._darItemContexto = null;
};

window.confirmarDarItem = async function (uidDestino, fichaIdDestino, nomeDestino) {
  const ctx = window._darItemContexto;
  if (!ctx) return;

  const ficha = window.personagens[personagemAtual];
  const arrays = { inventario, armas, armaduras };
  const arr = arrays[ctx.tipo];
  const item = arr?.[ctx.index];
  if (!item) return;

  // mochila vai junto com o que tem dentro
  const filhos = ctx.tipo === "inventario" && item.recipiente ? filhosDoRecipiente(item.id) : [];
  const textoConteudo = filhos.length ? ` (com ${filhos.length} ${filhos.length === 1 ? "item" : "itens"} dentro)` : "";

  if (!(await confirmBonito(`Dar "${item.nome || "esse item"}"${textoConteudo} pra ${nomeDestino}?`))) return;

  try {
    const meuUid = window.usuarioAtual.uid;
    const meuSnap = await getDoc(doc(db, "usuarios", meuUid));
    const meuDados = meuSnap.exists() ? meuSnap.data() : {};

    const itemEnviado = { ...item, dentroDe: "" };
    if (filhos.length) itemEnviado.conteudo = filhos.map((f) => ({ ...f }));

    await setDoc(doc(collection(db, "usuarios", uidDestino, "itensRecebidos")), {
      tipo: ctx.tipo,
      item: itemEnviado,
      deUid: meuUid,
      deNickname: meuDados.nickname || "",
      deTag: meuDados.tag || "",
      fichaDestinoId: fichaIdDestino,
      automatico: false,
      criadoEm: new Date().toISOString()
    });

    if (filhos.length) {
      const idsFilhos = new Set(filhos.map((f) => f.id));
      const restante = inventario.filter((i) => i !== item && !idsFilhos.has(i.id));
      inventario.length = 0;
      inventario.push(...restante);
    } else {
      arr.splice(ctx.index, 1);
    }
    if (ctx.tipo === "inventario") { window.inventario = inventario; renderInv(); }
    if (ctx.tipo === "armas") { window.armas = armas; renderArmas(); }
    if (ctx.tipo === "armaduras") { window.armaduras = armaduras; renderArmaduras(); }
    salvarTudo();

    window.fecharDarItem();
    alertBonito("Item enviado!");
  } catch (e) {
    console.error(e);
    alertBonito("Erro ao dar item: " + (e.code || e.message));
  }
};

window.abrirInboxItens = async function () {
  document.getElementById("modalInboxItensOverlay").style.display = "block";
  document.getElementById("modalInboxItens").style.display = "block";
  await window.renderInboxItens();
};

window.fecharInboxItens = function () {
  document.getElementById("modalInboxItensOverlay").style.display = "none";
  document.getElementById("modalInboxItens").style.display = "none";
};

window.renderInboxItens = async function () {
  const lista = document.getElementById("listaInboxItens");
  const meuUid = window.usuarioAtual.uid;

  lista.innerHTML = `<p style="color:#9A8A70;font-size:12px;text-align:center;">Carregando...</p>`;

  try {
    const snap = await getDocs(collection(db, "usuarios", meuUid, "itensRecebidos"));

    if (snap.empty) {
      lista.innerHTML = `<p style="color:#9A8A70;font-size:13px;text-align:center;padding:16px 0;font-style:italic;">Nada por aqui.</p>`;
      atualizarBadgeInboxItens(0);
      return;
    }

    let html = "";
    snap.forEach(docSnap => {
      const d = docSnap.data();
      html += `
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(196,169,91,0.15);border-radius:10px;padding:10px 12px;">
          <div style="font-size:13px;color:#F8F4E3;font-weight:bold;">${escapeHtml(d.item?.nome || "Sem nome")}</div>
          <div style="font-size:11px;color:#9A8A70;margin:2px 0 8px;">de ${escapeHtml(d.deNickname)}<span style="opacity:.5;">#${escapeHtml(d.deTag)}</span> · ${d.tipo}</div>
          <div style="display:flex;gap:8px;">
            <button onclick="window.aceitarItemRecebido('${docSnap.id}')" style="flex:1;padding:6px;border-radius:6px;border:none;background:#4a7c3a;color:#fff;font-size:12px;cursor:pointer;">Aceitar</button>
            <button onclick="window.recusarItemRecebido('${docSnap.id}')" style="flex:1;padding:6px;border-radius:6px;border:none;background:#7B1E28;color:#fff;font-size:12px;cursor:pointer;">Recusar</button>
          </div>
        </div>`;
    });
    lista.innerHTML = html;
    atualizarBadgeInboxItens(snap.size);
  } catch (e) {
    console.error(e);
    lista.innerHTML = `<p style="color:#e07a7a;font-size:12px;text-align:center;">Erro: ${e.code || e.message}</p>`;
  }
};

function atualizarBadgeInboxItens(n) {
  const badge = document.getElementById("badgeInboxItens");
  if (!badge) return;
  if (n > 0) {
    badge.style.display = "flex";
    badge.textContent = n;
  } else {
    badge.style.display = "none";
  }
}

// coloca um item recebido na ficha; se for uma mochila com conteúdo, desempacota tudo
function colocarItemRecebidoNaFicha(ficha, tipo, itemRecebido) {
  ficha[tipo] = ficha[tipo] || [];
  const { conteudo, ...item } = itemRecebido || {};

  if (tipo !== "inventario") {
    ficha[tipo].push(item);
    return;
  }

  const novaMochila = { ...item, id: gerarIdItem(), dentroDe: "" };
  ficha[tipo].push(novaMochila);

  (Array.isArray(conteudo) ? conteudo : []).forEach((filho) => {
    ficha[tipo].push({ ...filho, id: gerarIdItem(), dentroDe: novaMochila.id, recipiente: false });
  });
}

window.aceitarItemRecebido = async function (docId) {
  const meuUid = window.usuarioAtual.uid;
  try {
    const ref = doc(db, "usuarios", meuUid, "itensRecebidos", docId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const d = snap.data();

    const ficha = (window.personagens || []).find(f => String(f.id) === String(d.fichaDestinoId));
    if (!ficha) {
      alertBonito("A ficha que devia receber esse item não existe mais na sua conta.");
      await deleteDoc(ref);
      window.renderInboxItens();
      return;
    }

    colocarItemRecebidoNaFicha(ficha, d.tipo, d.item);

    if (typeof salvarPersonagens === "function") salvarPersonagens();

    if (personagemAtual !== null && window.personagens[personagemAtual]?.id === ficha.id) {
      if (d.tipo === "inventario") { inventario = ficha.inventario; window.inventario = inventario; renderInv(); }
      if (d.tipo === "armas") { armas = ficha.armas; window.armas = armas; renderArmas(); }
      if (d.tipo === "armaduras") { armaduras = ficha.armaduras; window.armaduras = armaduras; renderArmaduras(); }
      if (d.tipo === "mapas") { mapas = ficha.mapas; window.mapas = mapas; renderMapas(); }
    }

    await deleteDoc(ref);
    window.renderInboxItens();
  } catch (e) {
    console.error(e);
    alertBonito("Erro ao aceitar: " + (e.code || e.message));
  }
};

window.recusarItemRecebido = async function (docId) {
  const meuUid = window.usuarioAtual.uid;
  try {
    const ref = doc(db, "usuarios", meuUid, "itensRecebidos", docId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const d = snap.data();

    const meuSnap = await getDoc(doc(db, "usuarios", meuUid));
    const meuDados = meuSnap.exists() ? meuSnap.data() : {};

    // devolve pra quem deu, marcado como automático (não precisa a pessoa aceitar de novo)
    await setDoc(doc(collection(db, "usuarios", d.deUid, "itensRecebidos")), {
      tipo: d.tipo,
      item: d.item,
      deUid: meuUid,
      deNickname: meuDados.nickname || "",
      deTag: meuDados.tag || "",
      fichaDestinoId: null,
      fichaOrigemDevolucao: true,
      automatico: true,
      criadoEm: new Date().toISOString()
    });

    await deleteDoc(ref);
    window.renderInboxItens();
  } catch (e) {
    console.error(e);
    alertBonito("Erro ao recusar: " + (e.code || e.message));
  }
};

// processa devoluções automáticas assim que a conta carrega
window.processarDevolucoesAutomaticas = async function () {
  const meuUid = window.usuarioAtual?.uid;
  if (!meuUid) return;

  try {
    const snap = await getDocs(collection(db, "usuarios", meuUid, "itensRecebidos"));
    for (const docSnap of snap.docs) {
      const d = docSnap.data();
      if (!d.automatico) continue;

      // devolução: acha a ficha de onde o item saiu originalmente (a que estava vinculada ao grupo na hora)
      const fichaAlvo = (window.personagens || []).find(f => f.grupoAtivo) || window.personagens?.[0];
      if (fichaAlvo) {
        colocarItemRecebidoNaFicha(fichaAlvo, d.tipo, d.item);
      }

      await deleteDoc(doc(db, "usuarios", meuUid, "itensRecebidos", docSnap.id));
    }

    if (typeof salvarPersonagens === "function") salvarPersonagens();
    if (typeof renderInv === "function") renderInv();
    if (typeof renderArmas === "function") renderArmas();
    if (typeof renderArmaduras === "function") renderArmaduras();

    const contagemSnap = await getDocs(collection(db, "usuarios", meuUid, "itensRecebidos"));
    atualizarBadgeInboxItens(contagemSnap.size);
  } catch (e) {
    console.error("Erro ao processar devoluções:", e);
  }
};

function trocarAbaLore(aba, btn) {
  const mapa = {
    historia: "loreSecaoHistoria",
    sessoes:  "loreSecaoSessoes",
    eventos:  "loreSecaoEventos",
  };

  const atual = document.querySelector("#abaMaster-lore .mundo-secao[style*='block']");
  const proxEl = document.getElementById(mapa[aba]);
  if (!proxEl) return;

  document.querySelectorAll("#abaMaster-lore .mundo-tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  if (atual && atual !== proxEl) {
    atual.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    atual.style.opacity = "0";
    atual.style.transform = "translateX(-12px)";
    setTimeout(() => {
      atual.style.display = "none";
      atual.style.opacity = "";
      atual.style.transform = "";
      proxEl.style.display = "block";
      proxEl.style.opacity = "0";
      proxEl.style.transform = "translateX(12px)";
      proxEl.style.transition = "opacity 0.2s ease, transform 0.2s ease";
      requestAnimationFrame(() => {
        proxEl.style.opacity = "1";
        proxEl.style.transform = "translateX(0)";
      });
    }, 200);
  } else {
    proxEl.style.display = "block";
    proxEl.style.opacity = "0";
    proxEl.style.transform = "translateX(12px)";
    proxEl.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    requestAnimationFrame(() => {
      proxEl.style.opacity = "1";
      proxEl.style.transform = "translateX(0)";
    });
  }

  if (aba === "sessoes") renderSessoesLore();
  if (aba === "eventos") renderEventosLore();
}

/* ── NPCs ── */
function salvarNPCMundo() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  const nome = document.getElementById("mundoNPCNome")?.value.trim();
  if (!nome) { alertBonito("Digite o nome do NPC."); return; }

  campanha.npcsMundo ||= [];
  campanha.npcsMundo.push({
  id:      Date.now(),
  nome,
  classe:  document.getElementById("mundoNPCClasse")?.value.trim() || "",
  regiao:  document.getElementById("mundoNPCRegiao")?.value.trim() || "",
  relacao: document.getElementById("mundoNPCRelacao")?.value || "neutro",
  desc:    document.getElementById("mundoNPCDesc")?.value.trim()   || "",
});

  salvarCampanhasMaster();
  ["mundoNPCNome","mundoNPCClasse","mundoNPCRegiao","mundoNPCDesc"]
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
  renderNPCsMundo();
  mostrarToastMundo("NPC adicionado!");
}

async function salvarNPCMestre() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) { alertBonito("Nenhuma campanha selecionada."); return; }

  const nome = document.getElementById("npcNome")?.value.trim();
  if (!nome) { alertBonito("Digite o nome do NPC."); return; }

   monstrosMestre.push({
    id: Date.now(), _tipo: "npc", _origem: "usuario",
    nome,
    raca:          document.getElementById("npcRaca")?.value.trim()        || "",
    idade:         document.getElementById("npcIdade")?.value.trim()       || "",
    classe:        document.getElementById("npcClasse")?.value.trim()      || "",
    regiao:        document.getElementById("npcRegiao")?.value.trim()      || "",
    religiao:      document.getElementById("npcReligiao")?.value.trim()    || "",
    localizacao:   document.getElementById("npcLocalizacao")?.value.trim() || "",
    pericias:      document.getElementById("npcPericias")?.value.trim()    || "",
    status: {
      for: parseInt(document.getElementById("npcFor")?.value) || 10,
      des: parseInt(document.getElementById("npcDes")?.value) || 10,
      con: parseInt(document.getElementById("npcCon")?.value) || 10,
      int: parseInt(document.getElementById("npcInt")?.value) || 10,
      sab: parseInt(document.getElementById("npcSab")?.value) || 10,
      car: parseInt(document.getElementById("npcCar")?.value) || 10,
    },
    personalidade: document.getElementById("npcPersonalidade")?.value.trim() || "",
    relacoes:      document.getElementById("npcRelacoes")?.value.trim()      || "",
    observacoes:   document.getElementById("npcObservacoes")?.value.trim()   || "",
    hpMax:         parseInt(document.getElementById("npcHpMax")?.value)      || 20,
    ca:            parseInt(document.getElementById("npcCa")?.value)         || 10,
    velocidade:    document.getElementById("npcVelocidade")?.value.trim()    || "",
    desafio:       document.getElementById("npcDesafio")?.value.trim()       || "",
    habilidades:   document.getElementById("npcHabilidades")?.value.trim()   || "",
    acoes:         document.getElementById("npcAcoes")?.value.trim()         || "",
    reacoes:       document.getElementById("npcReacoes")?.value.trim()       || "",
    resistencias:  document.getElementById("npcResistencias")?.value.trim()  || "",
    ...(window._imagemNpcBase64
    ? await uploadImagemFirebase(window._imagemNpcBase64, `npcs/${Date.now()}.jpg`).then(r => ({ imagem: r.url, imagemDeleteUrl: r.deleteUrl }))
    : { imagem: "", imagemDeleteUrl: "" }),
  });

    salvarMonstrosMestreStorage();

  /* limpa o form */
  _npcAcoesForm = []; _npcHabilidadesForm = [];
  _renderItemForm("npcAcoesList",[],"removerAcaoNpc","npcAcoes");
  _renderItemForm("npcHabilidadesList",[],"removerHabilidadeNpc","npcHabilidades");
  ["npcNome","npcRaca","npcIdade","npcClasse","npcRegiao","npcReligiao",
   "npcLocalizacao","npcPericias","npcPersonalidade","npcRelacoes","npcObservacoes",
   "npcHabilidades","npcAcoes","npcReacoes","npcResistencias","npcVelocidade","npcDesafio"]
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
  ["npcFor","npcDes","npcCon","npcInt","npcSab","npcCar"]
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = "10"; });
  const npcHpEl = document.getElementById("npcHpMax"); if (npcHpEl) npcHpEl.value = "20";
  const npcCaEl = document.getElementById("npcCa"); if (npcCaEl) npcCaEl.value = "10";
  window.imagemNPCBase64 = "";
  const inp = document.getElementById("npcImagemInput"); if (inp) inp.value = "";
  const pre = document.getElementById("previewNPC");
  if (pre) { pre.src = ""; pre.style.display = "none"; }

  renderMonstrosMestre();
  mostrarToastMundo("NPC salvo no Compêndio! 👹");
} 

function renderNPCsMundo() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const lista    = document.getElementById("mundoNPCLista");
  if (!lista) return;
  campanha.npcsMundo ||= [];

  if (!campanha.npcsMundo.length) {
    lista.innerHTML = `<p class="master-desc">Nenhum NPC ainda.</p>`;
    return;
  }

  const relInfo = {
    aliado:  { cor:"#2a7a40", label:"Aliado"  },
    neutro:  { cor:"#7a6020", label:"Neutro"  },
    inimigo: { cor:"#8f2222", label:"Inimigo" },
  };

  lista.innerHTML = campanha.npcsMundo.map(n => {
    const rel      = relInfo[n.relacao] || relInfo.neutro;
    const iniciais = (n.nome||"?").split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase();
    const cor      = _corAvatar(n.nome);
    const d        = n.dadosCompletos || {};
    const mod      = v => { const m = Math.floor(((v||10)-10)/2); return m>=0?`+${m}`:`${m}`; };
    const hpMax    = n.hpMax || d.hpMax || d.hp || 20;
    const hpAtual  = n.hpAtual !== undefined ? n.hpAtual : hpMax;
    const hpPct    = Math.max(0, Math.min(100, Math.round((hpAtual/hpMax)*100)));
    const hpCor    = hpPct > 60 ? "#2a7a40" : hpPct > 30 ? "#7a6020" : "#8f2222";

    const bloco = (titulo, valor) => valor ? `
      <div class="npcc-section">
        <div class="npcc-section-title">${titulo}</div>
        <p class="npcc-section-body">${escapeHtml(valor)}</p>
      </div>` : "";

    return `
<div class="npcc-card" id="npcMundo_${n.id}">
  <div class="npcc-header" onclick="toggleNPCMundo(${n.id})">
    <div class="npcc-avatar" style="background:${cor};">
      ${n.imagem ? `<img src="${n.imagem}" style="width:100%;height:100%;object-fit:cover;">` : iniciais}
    </div>
    <div class="npcc-identity">
      <div class="npcc-name-row">
        <span class="npcc-name">${escapeHtml(n.nome)}</span>
        <span class="npcc-tag" style="color:${rel.cor};border-color:${rel.cor}66;background:${rel.cor}1a;">${rel.label}</span>
      </div>
      <div class="npcc-stat-line">
        <span id="npcHpCoracao_${n.id}" style="color:${hpCor};">❤ ${hpAtual}/${hpMax}</span>
        ${d.ca ? `<span>🛡 CA ${d.ca}</span>` : ""}
      </div>
      <div class="npcc-hp-track">
        <div id="npcHpBarra_${n.id}" class="npcc-hp-fill" style="width:${hpPct}%;background:${hpCor};"></div>
      </div>
    </div>
    <span class="npc-toggle-seta npcc-expand">▼</span>
  </div>

  <div class="npc-card-detalhes" id="npcDetalhes_${n.id}" style="display:none;max-height:0;overflow:hidden;" data-aberto="0">
    <div style="padding:0 22px 20px;">

      <div class="npcc-mod-row">
        <button onclick="event.stopPropagation();alterarHpNPC(${n.id},-10)" class="npcc-mod-btn npcc-neg-strong">-10</button>
        <button onclick="event.stopPropagation();alterarHpNPC(${n.id},-5)"  class="npcc-mod-btn npcc-neg-mid">-5</button>
        <button onclick="event.stopPropagation();alterarHpNPC(${n.id},-1)"  class="npcc-mod-btn npcc-neg-weak">-1</button>
        <button onclick="event.stopPropagation();alterarHpNPC(${n.id},+1)"  class="npcc-mod-btn npcc-pos-weak">+1</button>
        <button onclick="event.stopPropagation();alterarHpNPC(${n.id},+5)"  class="npcc-mod-btn npcc-pos-mid">+5</button>
        <button onclick="event.stopPropagation();alterarHpNPC(${n.id},+10)" class="npcc-mod-btn npcc-pos-strong">+10</button>
      </div>

      ${(d.status && Object.keys(d.status).length) ? `
      <div class="npcc-attrs">
        ${["for","des","con","int","sab","car"].map(a=>`
          <div class="npcc-attr-box">
            <div class="npcc-attr-label">${a}</div>
            <div class="npcc-attr-value">${d.status[a]||10}</div>
            <div class="npcc-attr-bonus">${mod(d.status[a]||10)}</div>
          </div>`).join("")}
      </div>` : ""}

      ${bloco("Personalidade", n.desc)}
      ${bloco("Relações", d.relacoes)}
      ${bloco("Perícias", d.pericias)}
      ${bloco("Religião", d.religiao)}
      ${bloco("Observações", d.observacoes)}

      ${(d.velocidade || d.desafio) ? `
      <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
        ${d.velocidade ? `<span class="npcc-tag" style="color:var(--g-text);"><strong>Vel</strong> ${escapeHtml(d.velocidade)}</span>` : ""}
        ${d.desafio ? `<span class="npcc-tag" style="color:var(--g-text);"><strong>ND</strong> ${escapeHtml(d.desafio)}</span>` : ""}
      </div>` : ""}

      ${bloco("⚔ Habilidades Especiais", d.habilidades)}
      ${bloco("🎯 Ações", d.acoes)}
      ${bloco("Reações", d.reacoes)}
      ${bloco("Resistências / Imunidades", d.resistencias)}

      <div class="npcc-actions">
        <button onclick="event.stopPropagation();enviarNPCParaCombate(${n.id})" class="npcc-btn-combat">⚔ Enviar para Combate</button>
        <span onclick="deletarNPCMundo(${n.id})" class="npcc-btn-remove">🗑 Remover</span>
      </div>
    </div>
  </div>
</div>`;
  }).join("");
}

function enviarNPCParaCombate(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const n = campanha?.npcsMundo?.find(x => x.id === id);
  if (!n) return;

  const d = n.dadosCompletos || {};
  const hpMax = n.hpMax || d.hpMax || 20;

  const copia = {
    instanciaId:  Date.now() + Math.floor(Math.random() * 9999),
    monstroBaseId: n.id,
    origem:       "npc_mundo",
    nome:         n.nome || "NPC",
    tipo:         d.classe || d.raca || "NPC",
    regiao:       n.regiao || "",
    hpMax,
    hpAtual:      n.hpAtual !== undefined ? n.hpAtual : hpMax,
    ca:           d.ca || 10,
    velocidade:   d.velocidade || "",
    desafio:      d.desafio || "",
    status: d.status || { for:10, des:10, con:10, int:10, sab:10, car:10 },
    lore:         n.desc || "",
    habilidades:  d.habilidades || "",
    acoes:        d.acoes || "",
    reacoes:      d.reacoes || "",
    resistencias: d.resistencias || "",
    imagem:       n.imagem || "",
  };

  combatesMestre.push(copia);
  salvarCombatesMestreStorage();
  renderCombatesMestre();

  // Muda para aba de combate
  const btnCombate = document.querySelector('.master-tab-btn[onclick*="combate"]');
  if (btnCombate) btnCombate.click();

  mostrarToastMundo(`${copia.nome} entrou no combate! ⚔️`);
}

function alterarHpNPC(id, delta) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const n = campanha?.npcsMundo?.find(x => x.id === id);
  if (!n) return;

  const hpMax   = n.hpMax || n.dadosCompletos?.hpMax || n.dadosCompletos?.hp || 20;
  const hpAtual = Math.max(0, Math.min(hpMax, (n.hpAtual !== undefined ? n.hpAtual : hpMax) + delta));
  n.hpAtual     = hpAtual;

  const hpPct = Math.max(0, Math.min(100, Math.round((hpAtual/hpMax)*100)));
  const hpCor = hpPct > 60 ? "#2a7a40" : hpPct > 30 ? "#7a6020" : "#8f2222";

  const barra   = document.getElementById(`npcHpBarra_${id}`);
  const valor   = document.getElementById(`npcHpValor_${id}`);
  const coracao = document.getElementById(`npcHpCoracao_${id}`);

  if (barra)   { barra.style.width = `${hpPct}%`; barra.style.background = hpCor; }
  if (valor)   { valor.textContent = `${hpAtual}/${hpMax}`; }
  if (coracao) { coracao.style.color = hpCor; coracao.textContent = `❤ ${hpAtual}/${hpMax}`; }

  salvarCampanhasMaster();
}

function toggleNPCMundo(id) {
  const detalhes = document.getElementById("npcDetalhes_" + id);
  const card     = document.getElementById("npcMundo_" + id);
  if (!detalhes) return;

  const aberto = detalhes.getAttribute("data-aberto") === "1";

  detalhes.style.transition = "max-height 0.3s ease, opacity 0.3s ease";
  detalhes.style.overflow   = "hidden";

  if (aberto) {
    detalhes.style.maxHeight = "0";
    detalhes.style.opacity   = "0";
    detalhes.setAttribute("data-aberto", "0");
    setTimeout(() => { detalhes.style.display = "none"; }, 300);
  } else {
    detalhes.style.display  = "block";
    detalhes.style.maxHeight = "0";
    detalhes.style.opacity   = "0";
    detalhes.setAttribute("data-aberto", "1");
    requestAnimationFrame(() => {
      detalhes.style.maxHeight = "2000px";
      detalhes.style.opacity   = "1";
    });
  }

  const seta = card?.querySelector(".npc-toggle-seta");
  if (seta) seta.textContent = aberto ? "▼" : "▲";
}

function _corAvatar(nome) {
  const cores = ["#8f2222","#1a5f8f","#2a7a40","#7a6020","#5a2a8f","#8f5a20"];
  let hash = 0;
  for (let c of (nome||"")) hash += c.charCodeAt(0);
  return cores[hash % cores.length];
}

function trocarAbaMundo(aba, btn) {
  const mapa = {
    missoes:   "mundoSecaoMissoes",
    npcs:      "mundoSecaoNpcs",
    encontros: "mundoSecaoEncontros",
  };

  const atual = document.querySelector(".mundo-secao[style*='block']");
  const proxEl = document.getElementById(mapa[aba]);
  if (!proxEl || atual === proxEl) return;

  document.querySelectorAll(".mundo-tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  if (atual) {
    atual.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    atual.style.opacity = "0";
    atual.style.transform = "translateX(-12px)";
    setTimeout(() => {
      atual.style.display = "none";
      atual.style.opacity = "";
      atual.style.transform = "";

      proxEl.style.display = "block";
      proxEl.style.opacity = "0";
      proxEl.style.transform = "translateX(12px)";
      proxEl.style.transition = "opacity 0.2s ease, transform 0.2s ease";
      requestAnimationFrame(() => {
        proxEl.style.opacity = "1";
        proxEl.style.transform = "translateX(0)";
      });
    }, 200);
  } else {
    proxEl.style.display = "block";
    proxEl.style.opacity = "0";
    proxEl.style.transform = "translateX(12px)";
    proxEl.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    requestAnimationFrame(() => {
      proxEl.style.opacity = "1";
      proxEl.style.transform = "translateX(0)";
    });
  }

  if (aba === "encontros") renderEncontrosMundo();
  if (aba === "npcs") renderNPCsMundo();
}

function editarNPCMundo(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const npc = campanha?.npcsMundo?.find(n => n.id === id);
  if (!npc) return;

  abrirPopup("Editar NPC", `
    <div class="popup-form">
      <input id="editNPCNome"   value="${escapeHtml(npc.nome)}">
      <input id="editNPCClasse" value="${escapeHtml(npc.classe || "")}">
      <input id="editNPCRegiao" value="${escapeHtml(npc.regiao || "")}">
      <textarea id="editNPCDesc">${escapeHtml(npc.desc || "")}</textarea>
      <button class="popup-salvar-btn" onclick="salvarEdicaoNPCMundo(${id})">Salvar</button>
    </div>`, true);
}

function salvarEdicaoNPCMundo(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const npc = campanha?.npcsMundo?.find(n => n.id === id);
  if (!npc) return;

  npc.nome   = document.getElementById("editNPCNome")?.value.trim()   || npc.nome;
  npc.classe = document.getElementById("editNPCClasse")?.value.trim() || "";
  npc.regiao = document.getElementById("editNPCRegiao")?.value.trim() || "";
  npc.desc   = document.getElementById("editNPCDesc")?.value.trim()   || "";

  salvarCampanhasMaster();
  renderNPCsMundo();
  fecharPopup();
}

async function deletarNPCMundo(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha || !(await confirmBonito("Remover este NPC?"))) return;
  campanha.npcsMundo = campanha.npcsMundo.filter(n => n.id !== id);
  salvarCampanhasMaster();
  renderNPCsMundo();
}

/* ── Missões ── */
function salvarMissaoMundo() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  const nome = document.getElementById("mundoMissaoNome")?.value.trim();
  if (!nome) { alertBonito("Digite o nome da missão."); return; }

  campanha.missoes ||= [];
  campanha.missoes.push({
    id:         Date.now(),
    nome,
    prioridade:  document.getElementById("mundoMissaoPrioridade")?.value || "andamento",
    dificuldade: document.getElementById("mundoMissaoDificuldade")?.value || "medio",
    desc:        document.getElementById("mundoMissaoDesc")?.value.trim() || "",
    etapas:      _etapasForm.map(e => ({ nome: e.nome, feita: false })),
  });

  salvarCampanhasMaster();
  document.getElementById("mundoMissaoNome").value = "";
  document.getElementById("mundoMissaoDesc").value = "";
  _etapasForm = [];
  renderEtapasForm();
  renderMissoesMundo();
  mostrarToastMundo("Missão adicionada!");
}

function renderMissoesMundo() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const lista = document.getElementById("mundoMissaoLista");
  if (!lista) return;
  campanha.missoes ||= [];

  if (!campanha.missoes.length) {
    lista.innerHTML = `<p class="master-desc" style="padding:12px 0;">Nenhuma missão ainda.</p>`;
    return;
  }

  const priorInfo = {
    andamento:  { cor:"#7a6020", label:"Em andamento" },
    concluida:  { cor:"#2a7a40", label:"Concluída"    },
    abandonada: { cor:"#4a4a4a", label:"Abandonada"   },
  };

  const difInfo = {
    facil:  { cor:"#2a7a40", label:"Fácil"  },
    medio:  { cor:"#7a6020", label:"Médio"  },
    dificil:{ cor:"#8f2222", label:"Difícil"},
    epico:  { cor:"#5a1a7a", label:"Épico"  },
  };

  lista.innerHTML = campanha.missoes.map(m => {
    const p = priorInfo[m.prioridade || m.status] || priorInfo.andamento;
    const etapasTotal      = m.etapas?.length || 0;
const etapasConcluidas = m.etapas?.filter(e => e.feita).length || 0;
const pct = etapasTotal ? Math.min(100, Math.round((etapasConcluidas / etapasTotal) * 100)) : 0;

const etapasHtml = (m.etapas || []).map((e, i) => `
  <div class="missao-etapa" onclick="toggleEtapaMissao(${m.id}, ${i})" style="
    display:flex;align-items:center;gap:8px;
    padding:6px 0;border-bottom:1px solid rgba(58,42,28,0.15);
    cursor:pointer;">
    <span style="
      width:18px;height:18px;border-radius:4px;flex-shrink:0;
      border:1px solid ${e.feita ? p.cor : 'rgba(58,42,28,0.35)'};
      background:${e.feita ? p.cor + '33' : 'transparent'};
      display:flex;align-items:center;justify-content:center;
      font-size:11px;color:${p.cor};">
      ${e.feita ? '✓' : ''}
    </span>
    <span style="font-size:14px;color:${e.feita ? '#7A6A50' : '#2A1A10'};
      text-decoration:${e.feita ? 'line-through' : 'none'};">
      ${escapeHtml(e.nome)}
    </span>
  </div>`).join("");

    return `
    <div class="missao-card-mundo" id="missaoMundo_${m.id}">

      <!-- cabeçalho clicável -->
      <div class="missao-card-header" onclick="toggleMissaoMundo(${m.id})">
        <div class="missao-card-topo">
          <strong>${escapeHtml(m.nome)}</strong>
          <span class="lore-badge" style="background:${p.cor}22;color:${p.cor};border:1px solid ${p.cor}44;font-size:14px;padding:6px 14px;">${p.label}</span>
${m.dificuldade ? `<span class="lore-badge" style="background:${(difInfo[m.dificuldade]||difInfo.medio).cor}22;color:${(difInfo[m.dificuldade]||difInfo.medio).cor};border:1px solid ${(difInfo[m.dificuldade]||difInfo.medio).cor}44;font-size:14px;padding:6px 14px;">${(difInfo[m.dificuldade]||difInfo.medio).label}</span>` : ""}
          <span class="npc-toggle-seta">▼</span>
        </div>
        <!-- barra de progresso sempre visível -->
        <div class="missao-progresso" style="margin-top:8px;">
          <div class="missao-barra-bg">
            <div class="missao-barra-fill" style="width:${pct}%;background:${p.cor};"></div>
          </div>
          <small style="color:#7A6A50;font-size:12px;">${etapasConcluidas} de ${etapasTotal} etapas</small>
        </div>
      </div>

      <!-- detalhes expansíveis -->
      <div class="npc-card-detalhes" id="missaoDetalhes_${m.id}" style="display:none;max-height:0;overflow:hidden;" data-aberto="0">
        ${m.desc ? `<p style="color:#2A1A10;font-size:14px;line-height:1.5;margin:0 0 10px;">${escapeHtml(m.desc)}</p>` : ""}
        <div style="margin-bottom:8px;">${etapasHtml}</div>
        <div style="margin-top:10px;text-align:right;">
          <span onclick="deletarMissaoMundo(${m.id})" style="cursor:pointer;font-size:12px;color:#8f2222;opacity:0.8;display:inline-block;">🗑 Remover missão</span>
        </div>
      </div>

    </div>`;
  }).join("");
}

  function toggleMissaoMundo(id) {
  const detalhes = document.getElementById("missaoDetalhes_" + id);
  const card     = document.getElementById("missaoMundo_" + id);
  if (!detalhes) return;

  const aberto = detalhes.getAttribute("data-aberto") === "1";

  detalhes.style.transition = "max-height 0.3s ease, opacity 0.3s ease";
  detalhes.style.overflow   = "hidden";

  if (aberto) {
    detalhes.style.maxHeight = "0";
    detalhes.style.opacity   = "0";
    detalhes.setAttribute("data-aberto", "0");
    setTimeout(() => { detalhes.style.display = "none"; }, 300);
  } else {
    detalhes.style.display   = "block";
    detalhes.style.maxHeight = "0";
    detalhes.style.opacity   = "0";
    detalhes.setAttribute("data-aberto", "1");
    requestAnimationFrame(() => {
      detalhes.style.maxHeight = "600px";
      detalhes.style.opacity   = "1";
    });
  }

  const seta = card?.querySelector(".npc-toggle-seta");
  if (seta) seta.textContent = aberto ? "▼" : "▲";
}

function toggleEtapaMissao(missaoId, etapaIndex) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const m = campanha?.missoes?.find(x => x.id === missaoId);
  if (!m || !m.etapas) return;

  m.etapas[etapaIndex].feita = !m.etapas[etapaIndex].feita;

  if (m.etapas.every(e => e.feita)) m.prioridade = "concluida";
  else if (m.prioridade === "concluida") m.prioridade = "andamento";

  salvarCampanhasMaster();

  // salva quais estão abertos antes de re-renderizar
  const abertos = [];
  document.querySelectorAll(".npc-card-detalhes[data-aberto='1']").forEach(el => {
    abertos.push(el.id);
  });

  renderMissoesMundo();

  // reabre os que estavam abertos
  abertos.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = "block";
    el.style.maxHeight = "600px";
    el.style.opacity = "1";
    el.setAttribute("data-aberto", "1");
    const missaoId = id.replace("missaoDetalhes_", "");
    const seta = document.querySelector(`#missaoMundo_${missaoId} .npc-toggle-seta`);
    if (seta) seta.textContent = "▲";
  });
}

function editarMissaoMundo(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const m = campanha?.missoes?.find(x => x.id === id);
  if (!m) return;

  abrirPopup("Editar Missão", `
    <div class="popup-form">
      <input id="editMissaoNome"   value="${escapeHtml(m.nome)}">
      <input id="editMissaoStatus" value="${escapeHtml(m.status || "ativa")}">
      <textarea id="editMissaoDesc">${escapeHtml(m.desc || "")}</textarea>
      <button class="popup-salvar-btn" onclick="salvarEdicaoMissaoMundo(${id})">Salvar</button>
    </div>`, true);
}

function salvarEdicaoMissaoMundo(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const m = campanha?.missoes?.find(x => x.id === id);
  if (!m) return;

  m.nome   = document.getElementById("editMissaoNome")?.value.trim()   || m.nome;
  m.status = document.getElementById("editMissaoStatus")?.value.trim() || "ativa";
  m.desc   = document.getElementById("editMissaoDesc")?.value.trim()   || "";

  salvarCampanhasMaster();
  renderMissoesMundo();
  fecharPopup();
}

async function deletarMissaoMundo(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha || !(await confirmBonito("Remover esta missão?"))) return;
  campanha.missoes = campanha.missoes.filter(m => m.id !== id);
  salvarCampanhasMaster();
  renderMissoesMundo();
}

async function salvarEncontroMundo() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  const nome = document.getElementById("encontroNome")?.value.trim();
  if (!nome) { mostrarToastMundo("Digite o nome do encontro."); return; }

  campanha.encontrosPlanejados ||= [];
  campanha.encontrosPlanejados.push({
    id:            Date.now(),
    nome,
    regiao:        document.getElementById("encontroRegiao")?.value.trim()        || "",
    localizacao:   document.getElementById("encontroLocalizacao")?.value.trim()   || "",
    envolvidos:    document.getElementById("encontroEnvolvidos")?.value.trim()    || "",
    objetivo:      document.getElementById("encontroObjetivo")?.value.trim()      || "",
    gatilho:       document.getElementById("encontroGatilho")?.value.trim()       || "",
    ambiente:      document.getElementById("encontroAmbiente")?.value.trim()      || "",
    consequencias: document.getElementById("encontroConsequencias")?.value.trim() || "",
    loot:          document.getElementById("encontroLoot")?.value.trim()          || "",
    notas:         document.getElementById("encontroNotas")?.value.trim()         || "",
    dificuldade:   document.getElementById("encontroDificuldade")?.value          || "",
    ...(window._imagemEncontroBase64
    ? await uploadImagemFirebase(window._imagemEncontroBase64, `encontros/${Date.now()}.jpg`).then(r => ({ imagem: r.url, imagemDeleteUrl: r.deleteUrl }))
    : { imagem: "", imagemDeleteUrl: "" }),
  });

  salvarCampanhasMaster();
  ["encontroNome","encontroRegiao","encontroLocalizacao","encontroEnvolvidos",
   "encontroObjetivo","encontroGatilho","encontroAmbiente","encontroConsequencias",
   "encontroLoot","encontroNotas"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  renderEncontrosMundo();
  mostrarToastMundo("Encontro adicionado!");
}

function renderEncontrosMundo() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const lista    = document.getElementById("mundoEncontroLista");
  if (!lista) return;

  campanha.encontrosPlanejados ||= [];

  if (!campanha.encontrosPlanejados.length) {
    lista.innerHTML = `<p class="master-desc">Nenhum encontro planejado ainda.</p>`;
    return;
  }

  lista.innerHTML = campanha.encontrosPlanejados.map(e => {
    const preview = e.objetivo
      ? escapeHtml(e.objetivo).slice(0, 80) + (e.objetivo.length > 80 ? "…" : "")
      : e.envolvidos
        ? escapeHtml(e.envolvidos).slice(0, 80) + (e.envolvidos.length > 80 ? "…" : "")
        : "Sem descrição.";

    return `
    <div style="
      background:#F0EBD8;border:1px solid rgba(196,169,91,0.3);
      border-left:3px solid #7B1E28;border-radius:10px;
      padding:14px 16px;margin-bottom:12px;cursor:pointer;
    " onclick="abrirDetalheEncontro(${e.id})">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <strong style="color:#2A1A10;font-size:14px;">${escapeHtml(e.nome)}</strong>
          ${e.dificuldade ? `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${({facil:'rgba(60,140,40,0.15)',medio:'rgba(180,140,20,0.15)',dificil:'rgba(180,80,20,0.15)',lendario:'rgba(139,26,26,0.15)'}[e.dificuldade]||'transparent')};color:${({facil:'#2a6010',medio:'#6a5010',dificil:'#7a3810',lendario:'#6a1010'}[e.dificuldade]||'#7A6A50')};">${e.dificuldade.charAt(0).toUpperCase()+e.dificuldade.slice(1)}</span>` : ""}
        </div>
        ${e.regiao ? `<span style="font-size:11px;color:#7A6A50;background:rgba(196,169,91,0.15);padding:2px 8px;border-radius:20px;">${escapeHtml(e.regiao)}</span>` : ""}
      </div>
      <p style="font-size:12px;color:#7A6A50;margin:0 0 10px;line-height:1.5;">${preview}</p>
      <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid rgba(196,169,91,0.2);padding-top:8px;">
        <button onclick="event.stopPropagation();editarEncontroMundo(${e.id})" style="background:transparent;border:1px solid rgba(196,169,91,0.4);border-radius:6px;color:#7A6A50;font-size:13px;padding:4px 10px;cursor:pointer;">✏</button>
        <button onclick="event.stopPropagation();deletarEncontroMundo(${e.id})" style="background:transparent;border:1px solid rgba(143,34,34,0.3);border-radius:6px;color:#8f2222;font-size:13px;padding:4px 10px;cursor:pointer;">🗑</button>
      </div>
    </div>`;
  }).join("");
}

function abrirDetalheEncontro(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const e = campanha?.encontrosPlanejados?.find(x => x.id === id);
  if (!e) return;

  const campo = (label, valor) => valor ? `
    <div style="margin-bottom:12px;">
      <span style="font-size:10px;color:#7A6A50;text-transform:uppercase;letter-spacing:1px;">${label}</span>
      <p style="color:#D8C8AA;font-size:13px;line-height:1.6;margin:4px 0 0;background:#2A1A10;border-radius:8px;padding:10px 12px;border:1px solid rgba(196,169,91,0.15);">${escapeHtml(valor)}</p>
    </div>` : "";

  const modal = document.createElement("div");
  modal.id = "modalDetalheEncontro";
  modal.style.cssText = `position:fixed;inset:0;z-index:9999;background:rgba(20,12,6,0.85);display:flex;align-items:flex-start;justify-content:center;padding:24px;overflow-y:auto;`;
  modal.innerHTML = `
    <div style="background:#1E1208;border:1px solid rgba(196,169,91,0.35);border-radius:14px;padding:24px;width:100%;max-width:420px;position:relative;margin:auto;">
      <button onclick="document.getElementById('modalDetalheEncontro').remove()" style="position:absolute;top:12px;right:14px;background:transparent;border:none;color:#7A6A50;font-size:20px;cursor:pointer;">✕</button>

      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <span style="font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(123,30,40,0.2);color:#C4A95B;border:1px solid rgba(123,30,40,0.4);">🗺️ Encontro</span>
        ${e.regiao ? `<span style="font-size:11px;color:#7A6A50;">${escapeHtml(e.regiao)}</span>` : ""}
        ${e.localizacao ? `<span style="font-size:11px;color:#7A6A50;">· ${escapeHtml(e.localizacao)}</span>` : ""}
      </div>

      <h3 style="color:#C4A95B;font-size:18px;margin:0 0 16px;font-family:'Cinzel',serif;">${escapeHtml(e.nome)}</h3>

      ${campo("Envolvidos", e.envolvidos)}
      ${campo("Objetivo", e.objetivo)}
      ${campo("Gatilho", e.gatilho)}
      ${campo("Ambiente", e.ambiente)}
      ${campo("Consequências", e.consequencias)}
      ${campo("Loot / Recompensa", e.loot)}
      ${campo("Notas do Mestre", e.notas)}

      <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end;">
        <button onclick="document.getElementById('modalDetalheEncontro').remove();editarEncontroMundo(${e.id})" style="background:transparent;border:1px solid rgba(196,169,91,0.4);border-radius:8px;color:#C4A95B;padding:8px 16px;cursor:pointer;font-size:13px;">✏ Editar</button>
        <button onclick="document.getElementById('modalDetalheEncontro').remove();deletarEncontroMundo(${e.id})" style="background:transparent;border:1px solid rgba(143,34,34,0.4);border-radius:8px;color:#8f2222;padding:8px 16px;cursor:pointer;font-size:13px;">🗑 Remover</button>
      </div>
    </div>
  `;
  modal.addEventListener("click", ev => { if (ev.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function editarEncontroMundo(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const e = campanha?.encontrosPlanejados?.find(x => x.id === id);
  if (!e) return;

  abrirPopup("Editar Encontro", `
    <div class="popup-form">
      <input id="editEncontroNome"   value="${escapeHtml(e.nome)}">
      <input id="editEncontroRegiao" value="${escapeHtml(e.regiao || "")}">
      <textarea id="editEncontroDesc">${escapeHtml(e.desc || "")}</textarea>
      <button class="popup-salvar-btn" onclick="salvarEdicaoEncontroMundo(${id})">Salvar</button>
    </div>`, true);
}

function salvarEdicaoEncontroMundo(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const e = campanha?.encontrosPlanejados?.find(x => x.id === id);
  if (!e) return;

  e.nome   = document.getElementById("editEncontroNome")?.value.trim()   || e.nome;
  e.regiao = document.getElementById("editEncontroRegiao")?.value.trim() || "";
  e.desc   = document.getElementById("editEncontroDesc")?.value.trim()   || "";

  salvarCampanhasMaster();
  renderEncontrosMundo();
  fecharPopup();
}

async function deletarEncontroMundo(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha || !(await confirmBonito("Remover este encontro?"))) return;
  campanha.encontrosPlanejados = campanha.encontrosPlanejados.filter(e => e.id !== id);
  salvarCampanhasMaster();
  renderEncontrosMundo();
}

/* ── render tudo junto ── */
function renderMundoCampanha() {
  renderNPCsMundo();
  renderMissoesMundo();
  renderEncontrosMundo();
}

/* ── toast leve ── */
function mostrarToastMundo(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText = `
    position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(10px);
    background:linear-gradient(180deg,#5f1717,#2a0b0b);color:#d8c8aa;
    border:1px solid rgba(216,200,170,0.22);border-radius:999px;
    padding:9px 22px;font-size:14px;font-weight:bold;z-index:99999;
    opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;
  `;
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity="1"; t.style.transform="translateX(-50%) translateY(0)"; });
  setTimeout(() => { t.style.opacity="0"; setTimeout(() => t.remove(), 300); }, 2200);
}

function abrirDetalheSessaoLore(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;
  const s = campanha.sessoes.find(s => s.id === id);
  if (!s) return;

  const corStatus = { completa:"#2a7a40", planejada:"#7a6020", cancelada:"#7a2020" };
  const labelStatus = { completa:"Completa", planejada:"Planejada", cancelada:"Cancelada" };
  const cor = corStatus[s.status] || "#7a6020";

  const modal = document.createElement("div");
  modal.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(20,12,6,0.82);
    display:flex;align-items:center;justify-content:center;
    padding:24px;
  `;
  modal.innerHTML = `
    <div style="
      background:#1E1208;
      border:1px solid rgba(196,169,91,0.35);
      border-radius:14px;
      padding:24px;
      width:100%;max-width:420px;
      position:relative;
    ">
      <button onclick="this.closest('[style*=fixed]').remove()" style="
        position:absolute;top:12px;right:14px;
        background:transparent;border:none;color:#7A6A50;
        font-size:20px;cursor:pointer;line-height:1;">✕</button>

      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <span style="
          font-size:11px;font-weight:bold;padding:3px 10px;border-radius:20px;
          background:${cor}22;color:${cor};border:1px solid ${cor}44;">
          ${labelStatus[s.status] || "Planejada"}
        </span>
        ${s.data ? `<span style="font-size:11px;color:#7A6A50;">${s.data}</span>` : ""}
      </div>

      <h3 style="color:#C4A95B;font-size:18px;margin:0 0 12px;">${escapeHtml(s.nome)}</h3>

      ${s.descricao ? `
        <div style="
          background:#2A1A10;border-radius:8px;padding:14px;
          border:1px solid rgba(196,169,91,0.15);
        ">
          <p style="color:#D8C8AA;font-size:13px;line-height:1.7;margin:0;">${escapeHtml(s.descricao)}</p>
        </div>` : ""}

      <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end;">
        <button onclick="this.closest('[style*=fixed]').remove();editarSessaoLore(${s.id})" style="
          background:transparent;border:1px solid rgba(196,169,91,0.4);
          border-radius:8px;color:#C4A95B;padding:8px 16px;cursor:pointer;font-size:13px;">
          ✏ Editar
        </button>
        <button onclick="this.closest('[style*=fixed]').remove();deletarSessaoLore(${s.id})" style="
          background:transparent;border:1px solid rgba(143,34,34,0.4);
          border-radius:8px;color:#8f2222;padding:8px 16px;cursor:pointer;font-size:13px;">
          🗑 Remover
        </button>
      </div>
    </div>
  `;
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function abrirDetalheEventoLore(id) {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;
  const e = campanha.eventos.find(e => e.id === id);
  if (!e) return;

  const tipoInfo = {
    batalha:  { emoji:"⚔️", cor:"#8f2222" },
    revelacao:{ emoji:"🔍", cor:"#1a5f8f" },
    morte:    { emoji:"💀", cor:"#4a4a4a" },
    alianca:  { emoji:"🤝", cor:"#2a7a40" },
    outro:    { emoji:"📌", cor:"#7a6020" },
  };
  const t = tipoInfo[e.tipo] || tipoInfo.outro;

  const modal = document.createElement("div");
  modal.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(20,12,6,0.82);
    display:flex;align-items:center;justify-content:center;
    padding:24px;
  `;
  modal.innerHTML = `
    <div style="
      background:#1E1208;
      border:1px solid rgba(196,169,91,0.35);
      border-left:3px solid ${t.cor};
      border-radius:14px;
      padding:24px;
      width:100%;max-width:420px;
      position:relative;
    ">
      <button onclick="this.closest('[style*=fixed]').remove()" style="
        position:absolute;top:12px;right:14px;
        background:transparent;border:none;color:#7A6A50;
        font-size:20px;cursor:pointer;line-height:1;">✕</button>

      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <span style="
          font-size:11px;font-weight:bold;padding:3px 10px;border-radius:20px;
          background:${t.cor}22;color:${t.cor};border:1px solid ${t.cor}44;">
          ${t.emoji} ${e.tipo || "outro"}
        </span>
        ${e.data ? `<span style="font-size:11px;color:#7A6A50;">${e.data}</span>` : ""}
      </div>

      <h3 style="color:#C4A95B;font-size:18px;margin:0 0 12px;">${escapeHtml(e.nome)}</h3>

      ${e.descricao ? `
        <div style="
          background:#2A1A10;border-radius:8px;padding:14px;
          border:1px solid rgba(196,169,91,0.15);
        ">
          <p style="color:#D8C8AA;font-size:13px;line-height:1.7;margin:0;">${escapeHtml(e.descricao)}</p>
        </div>` : ""}

      <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end;">
        <button onclick="this.closest('[style*=fixed]').remove();editarEventoLore(${e.id})" style="
          background:transparent;border:1px solid rgba(196,169,91,0.4);
          border-radius:8px;color:#C4A95B;padding:8px 16px;cursor:pointer;font-size:13px;">
          ✏ Editar
        </button>
        <button onclick="this.closest('[style*=fixed]').remove();deletarEventoLore(${e.id})" style="
          background:transparent;border:1px solid rgba(143,34,34,0.4);
          border-radius:8px;color:#8f2222;padding:8px 16px;cursor:pointer;font-size:13px;">
          🗑 Remover
        </button>
      </div>
    </div>
  `;
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function renderLoreCampanha() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  const loreInput = document.getElementById("historiaPrincipalLore");
  if (loreInput) loreInput.value = campanha.historiaPrincipal || "";

  // reseta abas — mostra só História
  document.querySelectorAll("#abaMaster-lore .mundo-secao").forEach(s => s.style.display = "none");
  const historia = document.getElementById("loreSecaoHistoria");
  if (historia) historia.style.display = "block";
  document.querySelectorAll("#abaMaster-lore .mundo-tab-btn").forEach(b => b.classList.remove("active"));
  const primeiroBtn = document.querySelector("#abaMaster-lore .mundo-tab-btn");
  if (primeiroBtn) primeiroBtn.classList.add("active");

  renderSessoesLore();
  renderEventosLore();
}

function trocarTipoCriar(tipo, btn) {
  document.querySelectorAll(".criar-form-panel").forEach(p => p.style.display = "none");
  document.querySelectorAll(".criar-tipo-btn").forEach(b => b.classList.remove("active"));
  const painel = document.getElementById("criarForm-" + tipo);
  if (painel) painel.style.display = "block";
  if (btn) btn.classList.add("active");
}

function enviarEntradaSessao() {
  const entry = window._entradaSessaoAtual;
  if (!entry) return;
  enviarParaSessao(entry);
}

function enviarParaSessao(entry) {
  const copia = JSON.parse(JSON.stringify(entry));
  copia.hpAtual = copia.hpMax || 10;
  copia._tipo = "boss";

  combatesMestre.push(copia);
  salvarCombatesMestreStorage();
  renderCombatesMestre();

  const sheet   = document.getElementById("sheetMonstro");
  const overlay = document.getElementById("sheetMonstroOverlay");
  if (sheet)   { sheet.classList.remove("aberto"); sheet.style.display = "none"; }
  if (overlay) { overlay.style.display = "none"; }
  document.body.classList.remove("master-sheet-aberto");

  const btnCombate = document.querySelector('[onclick*="combateMaster"]');
  trocarAbaMaster("combateMaster", btnCombate);

  mostrarToastMundo("Enviado para o combate! ⚔️");
}

function adicionarNPCAoMundo() {
  const npc = window._entradaSessaoAtual;
  if (!npc) return;

  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return;

  campanha.npcsMundo ||= [];

  /* evita duplicata pelo id */
  const jaExiste = campanha.npcsMundo.some(n => n.id === npc.id);
  if (jaExiste) {
    mostrarToastMundo("NPC já está no Mundo!");
    return;
  }

  campanha.npcsMundo.push({
  id:          Date.now() + Math.floor(Math.random() * 9999),
  idOrigem:    npc.id,
  nome:        npc.nome        || "",
  classe:      npc.classe      || "",
  regiao:      npc.regiao      || "",
  relacao:     npc.relacao     || "neutro",
  desc:        npc.personalidade || npc.observacoes || "",
  imagem:      npc.imagem      || "",
  hpMax:       npc.hpMax || npc.hp || 20,
  hpAtual:     npc.hpMax || npc.hp || 20,
  dadosCompletos: npc,
});

  salvarCampanhasMaster();

  /* fecha o sheet */
  _fecharSheetCustom();

  /* vai para o Mundo */
  const btnMundo = document.querySelector('.master-tab-btn[onclick*="mundo"]');
  mostrarToastMundo("NPC adicionado ao Mundo! 🌍");
}

function _fecharSheetCustom() {
  const sheet   = document.getElementById("sheetMonstro");
  const overlay = document.getElementById("sheetMonstroOverlay");
  if (sheet)   { sheet.classList.remove("aberto"); sheet.style.display = "none"; }
  if (overlay) { overlay.style.display = "none"; }
  document.body.classList.remove("master-sheet-aberto");
}

function previewImagemBoss() {
  const input = document.getElementById("bossImagemInput");
  const preview = document.getElementById("previewBoss");
  if (!input?.files?.[0]) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      const scale = 500 / img.width;
      canvas.width = 500;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      window._imagemBossBase64 = canvas.toDataURL("image/jpeg", 0.65);
      if (preview) { preview.src = window._imagemBossBase64; preview.style.display = "block"; }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

function previewImagemNpc() {
  const input = document.getElementById("npcImagemInput");
  const preview = document.getElementById("previewNpc");
  if (!input?.files?.[0]) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      const scale = 500 / img.width;
      canvas.width = 500;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      window._imagemNpcBase64 = canvas.toDataURL("image/jpeg", 0.65);
      if (preview) { preview.src = window._imagemNpcBase64; preview.style.display = "block"; }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

function previewImagemItem() {
  const input = document.getElementById("itemMasterImagemInput");
  const preview = document.getElementById("previewItemMaster");
  if (!input?.files?.[0]) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      const scale = 500 / img.width;
      canvas.width = 500;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      window._imagemItemBase64 = canvas.toDataURL("image/jpeg", 0.65);
      if (preview) { preview.src = window._imagemItemBase64; preview.style.display = "block"; }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

function previewImagemItem() {
  const input = document.getElementById("itemMasterImagemInput");
  const preview = document.getElementById("previewItemMaster");
  if (!input?.files?.[0]) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      const scale = 500 / img.width;
      canvas.width = 500;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      window._imagemItemBase64 = canvas.toDataURL("image/jpeg", 0.65);
      if (preview) { preview.src = window._imagemItemBase64; preview.style.display = "block"; }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

function previewImagemMapaMestre() {
  const input = document.getElementById("mapaMasterImagemInput");
  const preview = document.getElementById("previewMapaMaster");
  if (!input?.files?.[0]) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      const scale = 700 / img.width;
      canvas.width = 700;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      window._imagemMapaMestreBase64 = canvas.toDataURL("image/jpeg", 0.75);
      if (preview) { preview.src = window._imagemMapaMestreBase64; preview.style.display = "block"; }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

function previewImagemEncontro() {
  const input = document.getElementById("encontroImagemInput");
  const preview = document.getElementById("previewEncontro");
  if (!input?.files?.[0]) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      const scale = 500 / img.width;
      canvas.width = 500;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      window._imagemEncontroBase64 = canvas.toDataURL("image/jpeg", 0.65);
      if (preview) { preview.src = window._imagemEncontroBase64; preview.style.display = "block"; }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

function adicionarEtapaForm() {
  const input = document.getElementById("mundoMissaoNovaEtapa");
  const nome  = input?.value.trim();
  if (!nome) return;

  _etapasForm.push({ nome, feita: false });
  input.value = "";
  renderEtapasForm();
}

window._grupoAtualId = null;

window.abrirDetalheGrupo = async function (grupoId) {
  window._grupoAtualId = grupoId;
  const meuUid = window.usuarioAtual.uid;

  document.getElementById("modalGrupoDetalheOverlay").style.display = "block";
  document.getElementById("modalGrupoDetalhe").style.display = "block";
  document.getElementById("detalheGrupoRenomear").style.display = "none";

  const grupoSnap = await getDoc(doc(db, "grupos", grupoId));
  if (!grupoSnap.exists()) {
    fecharDetalheGrupo();
    return;
  }
  const g = grupoSnap.data();
  const souMestre = g.criadoPor === meuUid;
  const minhasFichas = window.personagens || [];

  document.getElementById("detalheGrupoNome").textContent = g.nome;

  const membrosDiv = document.getElementById("detalheGrupoMembros");
  membrosDiv.innerHTML = g.membros.map(m => `
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(196,169,91,0.12);border-radius:8px;padding:8px 10px;">
      <div style="display:flex;align-items:center;gap:8px;">
<div ${m.uid !== meuUid ? `onclick="abrirAcoesMembro('${m.uid}','${escapeHtml(m.nickname)}','${escapeHtml(m.tag)}')" style="cursor:pointer;flex:1;font-size:13px;"` : `style="flex:1;font-size:13px;"`}>${escapeHtml(m.nickname)}<span style="opacity:.5;">#${escapeHtml(m.tag)}</span></div>        ${souMestre && m.uid !== meuUid ? `
          <button onclick="alternarPapelMembro('${m.uid}')" style="font-size:10px;padding:4px 8px;border-radius:6px;border:1px solid rgba(196,169,91,0.3);background:transparent;color:#C4A95B;cursor:pointer;text-transform:uppercase;">${m.papel === "mestre" ? "Mestre" : "Jogador"}</button>
          <button onclick="removerMembroGrupo('${m.uid}')" style="width:22px;height:22px;border-radius:50%;border:none;background:#7B1E28;color:#fff;cursor:pointer;font-size:11px;">✕</button>
        ` : `<span style="font-size:10px;color:#9A8A70;text-transform:uppercase;">${m.papel === "mestre" ? "Mestre" : "Jogador"}</span>`}
      </div>
      ${m.uid === meuUid ? `
        <select id="selectFichaGrupo" style="margin-top:8px;width:100%;background:#1b120c;border:1px solid rgba(196,169,91,0.25);border-radius:6px;padding:6px 8px;color:#F8F4E3;font-size:12px;">
          <option value="">— minha ficha nesse grupo —</option>
          ${minhasFichas.map(f => `<option value="${String(f.id)}" ${String(f.id) === String(m.fichaId) ? "selected" : ""}>${escapeHtml(f.nome || "Sem nome")}</option>`).join("")}
        </select>
        <button onclick="window.salvarFichaGrupoBotao(this)" style="margin-top:6px;width:100%;padding:7px;border-radius:6px;border:none;background:#C4A95B;color:#1a0e05;font-weight:bold;font-size:12px;cursor:pointer;">Salvar vínculo</button>
        <div id="statusFichaGrupo" style="font-size:11px;margin-top:4px;text-align:center;"></div>
      ` : ""}
    </div>
  `).join("");

  const acoesDiv = document.getElementById("detalheGrupoAcoes");
  let acoesHtml = "";
  if (souMestre) {
    acoesHtml += `<button onclick="mostrarRenomearGrupo('${escapeHtml(g.nome)}')" style="width:100%;padding:9px;border-radius:8px;border:1px solid rgba(196,169,91,0.3);background:transparent;color:#E8CC80;font-size:13px;cursor:pointer;">Renomear grupo</button>`;
    acoesHtml += `<button onclick="excluirGrupo()" style="width:100%;padding:9px;border-radius:8px;border:1px solid rgba(123,30,40,0.4);background:rgba(123,30,40,0.15);color:#e07a7a;font-size:13px;cursor:pointer;">Excluir grupo</button>`;
  } else {
    acoesHtml += `<button onclick="sairDoGrupo()" style="width:100%;padding:9px;border-radius:8px;border:1px solid rgba(123,30,40,0.4);background:rgba(123,30,40,0.15);color:#e07a7a;font-size:13px;cursor:pointer;">Sair do grupo</button>`;
  }
  acoesDiv.innerHTML = acoesHtml;
};

window.salvarFichaGrupoBotao = async function (btn) {
  const select = document.getElementById("selectFichaGrupo");
  const status = document.getElementById("statusFichaGrupo");
  if (!select) return;

  const grupoId = window._grupoAtualId;
  const fichaEscolhida = select.value;

  btn.disabled = true;
  btn.textContent = "Salvando...";
  status.textContent = "";

  try {
    await window.escolherFichaGrupo(select);

    if (!fichaEscolhida) {
      status.textContent = "✓ Vínculo removido.";
      status.style.color = "#4a7c3a";
    } else {
      // confere de verdade no Firestore, não confia só na memória
      const confSnap = await getDoc(doc(db, "usuarios", window.usuarioAtual.uid, "fichas", fichaEscolhida));
      const grupoAtivoSalvo = confSnap.exists() ? confSnap.data().grupoAtivo : null;

      if (grupoAtivoSalvo === grupoId) {
        status.textContent = "✓ Vínculo salvo e confirmado!";
        status.style.color = "#4a7c3a";
      } else {
        status.textContent = "✗ Não confirmei o salvamento — tenta de novo.";
        status.style.color = "#e07a7a";
      }
    }
  } catch (e) {
    console.error(e);
    status.textContent = "✗ Erro: " + (e.code || e.message);
    status.style.color = "#e07a7a";
  } finally {
    btn.disabled = false;
    btn.textContent = "Salvar vínculo";
  }
};

window.atualizarCamposCategoriaItem = function () {
  const categoria = document.getElementById("itemMasterCategoria")?.value;
  const campoDano = document.getElementById("itemMasterDano");
  const campoCA = document.getElementById("itemMasterCA");
  if (campoDano) campoDano.style.display = categoria === "armas" ? "block" : "none";
  if (campoCA) campoCA.style.display = categoria === "armaduras" ? "block" : "none";
};

window.carregarGruposParaCampanha = async function (selectId = "novaCampanhaGrupo", valorSelecionado = "") {
  const select = document.getElementById(selectId);
  if (!select || !window.usuarioAtual) return;

  try {
    const meuUid = window.usuarioAtual.uid;
    const q = query(collection(db, "grupos"), where("membrosUids", "array-contains", meuUid));
    const snap = await getDocs(q);

    const meusGrupos = snap.docs.filter(d => d.data().criadoPor === meuUid);

    select.innerHTML = `<option value="">Sem grupo vinculado</option>` +
      meusGrupos.map(d => `<option value="${d.id}" ${d.id === valorSelecionado ? "selected" : ""}>${escapeHtml(d.data().nome)}</option>`).join("");
  } catch (e) {
    console.error(e);
  }
};

window._campanhaEmEdicaoIndex = null;

window.abrirEditarCampanha = async function (index) {
  const campanha = campanhasMaster[index];
  if (!campanha) return;

  window._campanhaEmEdicaoIndex = index;

  document.getElementById("modalEditarCampanhaOverlay").style.display = "block";
  document.getElementById("modalEditarCampanha").style.display = "block";

  document.getElementById("editCampanhaNome").value = campanha.nome || "";
  document.getElementById("editCampanhaSistema").value = campanha.sistema || "";
  document.getElementById("editCampanhaDescricao").value = campanha.descricao || "";

  await window.carregarGruposParaCampanha("editCampanhaGrupo", campanha.grupoVinculado || "");
};

window.fecharEditarCampanha = function () {
  document.getElementById("modalEditarCampanhaOverlay").style.display = "none";
  document.getElementById("modalEditarCampanha").style.display = "none";
  window._campanhaEmEdicaoIndex = null;
};

window.salvarEdicaoCampanha = function () {
  const index = window._campanhaEmEdicaoIndex;
  if (index === null || !campanhasMaster[index]) return;

  const nome = document.getElementById("editCampanhaNome").value.trim();
  if (!nome) {
    alertBonito("Digite o nome da campanha.");
    return;
  }

  campanhasMaster[index].nome = nome;
  campanhasMaster[index].sistema = document.getElementById("editCampanhaSistema").value.trim();
  campanhasMaster[index].descricao = document.getElementById("editCampanhaDescricao").value.trim();
  campanhasMaster[index].grupoVinculado = document.getElementById("editCampanhaGrupo").value || "";

  salvarCampanhasMaster();
  renderCampanhasMaster();
  window.fecharEditarCampanha();
};

window.escolherFichaGrupo = async function (selectEl) {
  const grupoId = window._grupoAtualId;
  const meuUid = window.usuarioAtual.uid;
  const novoFichaId = selectEl.value;
  if (!grupoId) return;

  try {
    const grupoRef = doc(db, "grupos", grupoId);
    const snap = await getDoc(grupoRef);
    const g = snap.data();

    const membroAtual = g.membros.find(m => m.uid === meuUid);
    const fichaAntigaNesteGrupo = membroAtual?.fichaId || "";

    if (fichaAntigaNesteGrupo && fichaAntigaNesteGrupo !== novoFichaId) {
      try {
        await setDoc(doc(db, "usuarios", meuUid, "fichas", fichaAntigaNesteGrupo), { grupoAtivo: "" }, { merge: true });
        const fichaLocalAntiga = (window.personagens || []).find(f => String(f.id) === String(fichaAntigaNesteGrupo));
        if (fichaLocalAntiga) fichaLocalAntiga.grupoAtivo = "";
      } catch (e) {
        console.warn("Não consegui limpar a ficha antiga:", e);
      }
    }

    let veioDeOutroGrupo = false;

    if (novoFichaId) {
      // varre TODOS os grupos que você participa, não só o que o campo grupoAtivo aponta
      const meusGruposSnap = await getDocs(query(collection(db, "grupos"), where("membrosUids", "array-contains", meuUid)));

      for (const outroDoc of meusGruposSnap.docs) {
        if (outroDoc.id === grupoId) continue;

        const outroGrupo = outroDoc.data();
        const meuMembroLa = outroGrupo.membros.find(m => m.uid === meuUid);

        if (meuMembroLa?.fichaId === novoFichaId) {
          veioDeOutroGrupo = true;
          try {
            const membrosAtualizados = outroGrupo.membros.map(m =>
              m.uid === meuUid ? { ...m, fichaId: "" } : m
            );
            await updateDoc(doc(db, "grupos", outroDoc.id), { membros: membrosAtualizados });
          } catch (e) {
            console.warn("Não consegui desvincular do grupo antigo:", e);
          }
        }
      }

      await setDoc(doc(db, "usuarios", meuUid, "fichas", novoFichaId), { grupoAtivo: grupoId }, { merge: true });

      const fichaLocalNova = (window.personagens || []).find(f => String(f.id) === String(novoFichaId));
      if (fichaLocalNova) fichaLocalNova.grupoAtivo = grupoId;
    }

    const novosMembros = g.membros.map(m => m.uid === meuUid ? { ...m, fichaId: novoFichaId } : m);
    await updateDoc(grupoRef, { membros: novosMembros });

    if (novoFichaId) {
      const mestresUids = g.membros.filter(m => m.papel === "mestre").map(m => m.uid);
      if (mestresUids.length > 0) {
        await setDoc(doc(db, "usuarios", meuUid, "fichas", novoFichaId), {
          mestresAutorizados: arrayUnion(...mestresUids)
        }, { merge: true });
      }
    }

    if (veioDeOutroGrupo) {
      alertBonito("Essa ficha já estava vinculada a outro grupo — ela foi movida pra cá.");
    }
  } catch (e) {
    console.error(e);
    alertBonito("Erro ao vincular ficha: " + (e.code || e.message));
  }
};

window._grupoMasterUnsubs = [];
window._grupoMasterAbertos = {};

window._grupoMasterUnsubs = [];
window._grupoMasterAbertos = {};

window.renderGrupoMaster = async function () {
  const conteudo = document.getElementById("grupoMasterConteudo");
  window._grupoMasterUnsubs.forEach(unsub => unsub());
  window._grupoMasterUnsubs = [];

  const campanha = campanhasMaster[campanhaAtualMaster];
  const grupoId = campanha?.grupoVinculado;

  if (!grupoId) {
    conteudo.innerHTML = `<p style="color:#9A8A70;font-size:13px;text-align:center;padding:20px 0;font-style:italic;">Essa campanha não tem um grupo vinculado. Edite a campanha pra escolher um.</p>`;
    return;
  }

  conteudo.innerHTML = `<p style="color:#9A8A70;font-size:13px;text-align:center;">Carregando grupo...</p>`;

  const grupoSnap = await getDoc(doc(db, "grupos", grupoId));
  if (!grupoSnap.exists()) {
    conteudo.innerHTML = `<p style="color:#e07a7a;font-size:13px;text-align:center;">Esse grupo não existe mais.</p>`;
    return;
  }
  const g = grupoSnap.data();
  const meuUid = window.usuarioAtual.uid;
  const alvos = g.membros.filter(m => m.uid !== meuUid && m.fichaId);

  window._grupoMasterAlvos = alvos;
  if (typeof escutarRolagensGrupo === "function") escutarRolagensGrupo(grupoId);

  if (alvos.length === 0) {
    conteudo.innerHTML = `<p style="color:#9A8A70;font-size:13px;text-align:center;padding:20px 0;font-style:italic;">Nenhum jogador vinculou uma ficha a esse grupo ainda.</p>`;
    return;
  }

  conteudo.innerHTML = `
    <div class="compendio-grid">
      ${alvos.map(m => `
        <div id="dashCard-${m.uid}" class="compendio-card" onclick="window.abrirFichaFlutuante('${m.uid}')">
          <div class="compendio-info">
            <p style="color:#9A8A70;font-size:11px;">Carregando...</p>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  alvos.forEach(m => {
    const ref = doc(db, "usuarios", m.uid, "fichas", m.fichaId);
    const unsub = onSnapshot(ref, snap => {
      const card = document.getElementById(`dashCard-${m.uid}`);
      if (!card) return;

      if (!snap.exists()) {
        card.innerHTML = `<div class="compendio-info"><p style="color:#e07a7a;font-size:11px;">Ficha não encontrada.</p></div>`;
        return;
      }

      const f = snap.data();
      const vidaMax = f.vidaMax || 1;
      const vidaAtual = f.vidaAtual ?? vidaMax;
      const pctVida = Math.max(0, Math.min(100, (vidaAtual / vidaMax) * 100));
      const corVida = pctVida <= 25 ? "#e05050" : pctVida <= 60 ? "#e0b050" : "#6bbf59";

      window._grupoMasterFichaCache = window._grupoMasterFichaCache || {};
      window._grupoMasterFichaCache[m.uid] = { nome: f.nome, imagem: f.imagem };

      card.style.backgroundImage = `url("${f.imagem || "icon-512.png"}")`;
      card.innerHTML = `
        <div class="compendio-info">
          <small style="opacity:0.7">${escapeHtml(m.nickname)}</small>
          <strong>${escapeHtml(f.nome || "Sem nome")}</strong>
          <small>${escapeHtml(f.classe || "")}${f.nivel ? " · Nv " + escapeHtml(String(f.nivel)) : ""}</small>
          <div style="height:5px;background:rgba(255,255,255,0.25);border-radius:99px;overflow:hidden;margin-top:4px;">
            <div style="height:100%;width:${pctVida}%;background:${corVida};"></div>
          </div>
          <span>HP ${vidaAtual}/${vidaMax}</span>
        </div>
      `;

      if (window._fichaFlutuanteUid === m.uid) window._renderFichaFlutuanteConteudo(m, f);
    }, err => {
      console.error(err);
      const card = document.getElementById(`dashCard-${m.uid}`);
      if (card) card.innerHTML = `<div class="compendio-info"><p style="color:#e05050;font-size:11px;">Sem permissão pra ver essa ficha ainda.</p></div>`;
    });

    window._grupoMasterUnsubs.push(unsub);
  });
};

/* ================= CARD FLUTUANTE DO JOGADOR (visão detalhada do mestre) ================= */

function _fichaDashPillCirculo(c) {
  if (c === "" || c == null) return "";
  let texto = c === "talento" ? "Talento" : c === "passiva" ? "Passiva" : `Círculo ${c}`;
  return `<span style="display:inline-block;font-size:9.5px;font-weight:bold;padding:2px 8px;border-radius:99px;background:#8a2c22;color:#f5ece0;margin-left:6px;letter-spacing:.02em;">${texto}</span>`;
}

function _fichaDashPillCargas(item) {
  if (!item.temCargas) return "";
  const gastas = (item.cargasGastas || []).filter(Boolean).length;
  const max = item.maxCargas || 0;
  const restantes = max - gastas;
  const cor = restantes === 0 ? "#8a2c22" : "#7c6425";
  return `<span style="display:inline-block;font-size:9.5px;font-weight:bold;padding:2px 8px;border-radius:99px;background:rgba(124,100,37,0.15);border:1px solid ${cor};color:${cor};margin-left:6px;">${restantes}/${max}</span>`;
}

let _fichaDashContadorLinha = 0;
function _fichaDashLinha(uid, nome, extra, pill, desc) {
  const idLinha = `fichaFlutLinha-${uid}-${_fichaDashContadorLinha++}`;
  return `
  <div style="padding:8px 0;border-bottom:1px solid rgba(74,55,40,0.12);${desc ? "cursor:pointer;" : ""}" ${desc ? `onclick="window.alternarDescDash('${idLinha}')"` : ""}>
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:13px;color:#2A1A10;font-weight:600;">${escapeHtml(nome)}${extra ? ` <span style="color:#6b5a42;font-weight:normal;font-size:11.5px;">· ${escapeHtml(extra)}</span>` : ""}</span>
      <span style="flex-shrink:0;">${pill}</span>
    </div>
    ${desc ? `<div id="${idLinha}" data-aberto="0" style="font-size:11.5px;color:#5a4a38;margin-top:4px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(desc)}</div>` : ""}  </div>`;
}

function _fichaDashSecao(titulo, itens) {
  return `
  <div style="background:#E8E0CC;border-radius:10px;margin:10px 14px 0;overflow:hidden;border:1px solid rgba(196,169,91,0.25);">
    <div style="background:#D4C9A8;padding:7px 12px;text-align:center;">
      <span style="font-size:10px;color:#4A3728;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">${titulo}</span>
    </div>
    <div style="padding:8px 12px 10px;">
      ${itens || `<p style="font-size:12px;color:#7A6A50;font-style:italic;padding:4px 0;text-align:center;">Nada aqui.</p>`}
    </div>
  </div>`;
}

window._renderFichaFlutuanteConteudo = function (m, f) {
  const vidaMax = f.vidaMax || 1;
const vidaAtual = f.vidaAtual ?? vidaMax;
const vidaTemp = f.vidaTemp ?? 0;
const pctVida = Math.max(0, Math.min(100, (vidaAtual / vidaMax) * 100));
const pctTemp = Math.max(0, Math.min(100, (vidaTemp / vidaMax) * 100));
const corVida = pctVida <= 25 ? "#8a2c22" : pctVida <= 60 ? "#a9822f" : "#4a6b32";

  const todosPoderes = f.poderes || [];
  const _ehTal = p => p.circulo === "talento" || ((p.circulo ?? "") === "" && p.origem === "talento");
  const _ehPas = p => !_ehTal(p) && (p.circulo === "passiva" || ((p.circulo ?? "") === "" && p.acao === "passiva"));
  const poderesGerais = todosPoderes.filter(p => (p.circulo ?? "") === "" && !_ehTal(p) && !_ehPas(p)).map(p => _fichaDashLinha(m.uid, p.nome || "Sem nome", "", _fichaDashPillCargas(p), p.desc)).join("");
  const talentos = todosPoderes.filter(_ehTal).map(p => _fichaDashLinha(m.uid, p.nome || "Sem nome", "", _fichaDashPillCargas(p), p.desc)).join("");
  const passivas = todosPoderes.filter(_ehPas).map(p => _fichaDashLinha(m.uid, p.nome || "Sem nome", "", _fichaDashPillCargas(p), p.desc)).join("");

  const gastos = f.gastosCirculos || {};
  const bolinhasCirculo = (circulo) => {
    const arr = gastos[circulo] || [];
    if (arr.length === 0) return "";
    return `<div style="display:flex;gap:6px;margin:6px 0 8px;justify-content:center;">${arr.map(gasta => `<span style="width:13px;height:13px;border-radius:50%;display:inline-block;background:${gasta ? "#8a2c22" : "transparent"};border:2px solid #8a2c22;"></span>`).join("")}</div>`;
  };

  let magias = "";
  for (let c = 0; c <= 9; c++) {
    const magiasDoCirculo = todosPoderes.filter(p => String(p.circulo) === String(c));
    if (magiasDoCirculo.length === 0 && (!gastos[c] || gastos[c].length === 0)) continue;

    magias += `
      <div style="margin-top:10px;text-align:center;">
        <div style="font-size:11px;color:#4A3728;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;">Círculo ${c}</div>
        ${bolinhasCirculo(c)}
        ${magiasDoCirculo.map(p => _fichaDashLinha(m.uid, p.nome || "Sem nome", "", _fichaDashPillCargas(p), p.desc)).join("") || `<p style="font-size:11px;color:#8a7860;font-style:italic;">Sem magias registradas.</p>`}
      </div>`;
  }

  const armas = (f.armas || []).map(a => _fichaDashLinha(m.uid, a.nome || "Sem nome", a.dano || "", _fichaDashPillCargas(a), a.desc)).join("");
  const armaduras = (f.armaduras || []).map(a => _fichaDashLinha(m.uid, a.nome || "Sem nome", a.ca ? "CA " + a.ca : "", _fichaDashPillCargas(a), a.desc)).join("");
  const inventario = (f.inventario || []).map(i => _fichaDashLinha(m.uid, i.nome || "Sem nome", "", `<span style="font-size:11px;color:#6b5a42;">x${i.qtd || 1}</span>`, i.desc)).join("");

  const dominioArr = f.dominio || [];
  const dominioHtml = `
    <div style="display:flex;gap:7px;flex-wrap:wrap;padding:10px 0 4px;justify-content:center;">
      ${dominioArr.map(marcado => `<span style="width:16px;height:16px;border-radius:50%;display:inline-block;background:${marcado ? "#8a2c22" : "transparent"};border:2px solid #8a2c22;"></span>`).join("")}
    </div>`;

  const efeitosExaustaoDash = ["Sem exaustão","Desvantagem em testes de atributo","Deslocamento reduzido pela metade ","Desvantagem em jogadas de ataque e salvaguardas","Pontos de vida maximos reduzidos pela metade","Deslocamento reduzido a 0","Morte"];
  const nivelExaustao = f.exaustao ?? 0;
  const exaustaoHtml = `
    <div style="font-size:12px;color:#2A1A10;padding:10px 0 4px;">
      Nível ${nivelExaustao} ${nivelExaustao > 0 ? `<span style="color:#6b5a42;">— ${escapeHtml(efeitosExaustaoDash[nivelExaustao] || "")}</span>` : ""}
    </div>`;

 const alvos = window._grupoMasterAlvos || [];
  document.getElementById("fichaFlutuanteContador").textContent = alvos.length > 1 ? `${window._fichaFlutuanteIndex + 1} / ${alvos.length}` : "";

  document.getElementById("fichaFlutuanteConteudo").innerHTML = `
    <div style="padding-top:16px;text-align:center;">
      <div style="font-family:'Cinzel',serif;font-weight:bold;font-size:22px;color:#4A3728;">${escapeHtml(f.nome || "Sem nome")}</div>
      <div style="font-size:14px;color:#6b5a42;margin-top:4px;">${escapeHtml(m.nickname)} · ${escapeHtml(f.classe || "")}${f.nivel ? " · Nv " + escapeHtml(String(f.nivel)) : ""} · CA ${escapeHtml(String(f.ca ?? "-"))}</div>
    </div>
    <div style="height:7px;background:rgba(74,55,40,0.15);margin:12px 0 0;border-radius:99px;overflow:hidden;">
      <div style="height:100%;width:${pctVida}%;background:${corVida};transition:width .4s ease;"></div>
    </div>
    <div style="font-size:11px;color:#6b5a42;padding:4px 14px 4px;">HP: ${vidaAtual} / ${vidaMax}</div>
<div style="height:5px;background:rgba(74,55,40,0.12);margin:2px 14px 0;border-radius:99px;overflow:hidden;">
  <div style="height:100%;width:${pctTemp}%;background:#4b8f9a;transition:width .4s ease;"></div>
</div>
<div style="font-size:10px;color:#4b8f9a;padding:3px 14px 4px;">PV temporários: ${vidaTemp}</div>
    ${_fichaDashSecao("Poderes", poderesGerais)}
    ${_fichaDashSecao("Magias", magias)}
    ${_fichaDashSecao("Talentos", talentos)}
    ${_fichaDashSecao("Passivas", passivas)}
    ${_fichaDashSecao("Armas", armas)}
    ${_fichaDashSecao("Armaduras", armaduras)}
    ${_fichaDashSecao("Inventário", inventario)}
    ${dominioArr.length ? _fichaDashSecao("Pontos de Domínio", dominioHtml) : ""}
    ${_fichaDashSecao("Exaustão", exaustaoHtml)}
    <div style="height:14px;"></div>
  `;
};

window.abrirFichaFlutuante = function (uid) {
  const idx = (window._grupoMasterAlvos || []).findIndex(m => m.uid === uid);
  if (idx === -1) return;
  window._fichaFlutuanteIndex = idx;
  window._mostrarFichaFlutuanteAtual();
};

window._mostrarFichaFlutuanteAtual = function () {
  const alvos = window._grupoMasterAlvos || [];
  const m = alvos[window._fichaFlutuanteIndex];
  if (!m) return;

  window._fichaFlutuanteUid = m.uid;
  if (window._fichaFlutuanteUnsub) window._fichaFlutuanteUnsub();

  document.getElementById("fichaFlutuanteOverlay").style.display = "block";
  document.getElementById("fichaFlutuante").style.display = "flex";
  window._renderPeeksFichaFlutuante();
  document.getElementById("fichaFlutuanteConteudo").innerHTML = `<p style="color:#9A8A70;font-size:13px;text-align:center;padding:20px 0;">Carregando ${escapeHtml(m.nickname)}...</p>`;

  const ref = doc(db, "usuarios", m.uid, "fichas", m.fichaId);
  window._fichaFlutuanteUnsub = onSnapshot(ref, snap => {
    if (!snap.exists()) {
      document.getElementById("fichaFlutuanteConteudo").innerHTML = `<p style="color:#e05050;font-size:13px;text-align:center;padding:20px 0;">Ficha não encontrada.</p>`;
      return;
    }
    window._renderFichaFlutuanteConteudo(m, snap.data());
  }, err => {
    console.error(err);
    document.getElementById("fichaFlutuanteConteudo").innerHTML = `<p style="color:#e05050;font-size:13px;text-align:center;padding:20px 0;">Sem permissão pra ver essa ficha ainda.</p>`;
  });
};


window.fecharFichaFlutuante = function () {
  document.getElementById("fichaFlutuanteOverlay").style.display = "none";
  document.getElementById("fichaFlutuante").style.display = "none";
  document.getElementById("fichaFlutuantePeekEsq").style.display = "none";
  document.getElementById("fichaFlutuantePeekDir").style.display = "none";
  if (window._fichaFlutuanteUnsub) window._fichaFlutuanteUnsub();
  window._fichaFlutuanteUnsub = null;
  window._fichaFlutuanteUid = null;
};

window.trocarFichaFlutuante = function (direcao) {
  const alvos = window._grupoMasterAlvos || [];
  if (alvos.length <= 1) return;

  const el = document.getElementById("fichaFlutuante");
  const saida = direcao > 0 ? -60 : 60;

  el.style.transition = "transform .22s ease, opacity .22s ease";
  el.style.transform = `translate(-50%,-50%) translateX(${saida}px)`;
  el.style.opacity = "0";

  setTimeout(() => {
    window._fichaFlutuanteIndex = (window._fichaFlutuanteIndex + direcao + alvos.length) % alvos.length;
    window._mostrarFichaFlutuanteAtual();

    el.style.transition = "none";
    el.style.transform = `translate(-50%,-50%) translateX(${-saida}px)`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "transform .22s ease, opacity .22s ease";
        el.style.transform = "translate(-50%,-50%) translateX(0)";
        el.style.opacity = "1";
      });
    });
  }, 220);
};

(function ativarGestosFichaFlutuante() {
  const el = document.getElementById("fichaFlutuante");
  if (!el) return;
  let inicioX = 0, inicioY = 0, arrastando = false;

  el.addEventListener("touchstart", e => {
    const t = e.touches[0];
    inicioX = t.clientX; inicioY = t.clientY; arrastando = true;
    el.style.transition = "none";
  }, { passive: true });

  el.addEventListener("touchmove", e => {
    if (!arrastando) return;
    const t = e.touches[0];
    const diffX = t.clientX - inicioX;
    const diffY = t.clientY - inicioY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      el.style.transform = `translate(-50%,-50%) translateX(${diffX}px)`;
      el.style.opacity = String(1 - Math.min(Math.abs(diffX) / 400, 0.5));
    }
  }, { passive: true });

  el.addEventListener("touchend", e => {
    if (!arrastando) return;
    arrastando = false;
    const t = e.changedTouches[0];
    const diffX = t.clientX - inicioX;
    const diffY = t.clientY - inicioY;

    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY)) {
      window.trocarFichaFlutuante(diffX < 0 ? 1 : -1);
    } else {
      el.style.transition = "transform .2s ease, opacity .2s ease";
      el.style.transform = "translate(-50%,-50%) translateX(0)";
      el.style.opacity = "1";
    }
  }, { passive: true });
})();

window.alternarDescDash = function (idLinha) {
  const el = document.getElementById(idLinha);
  if (!el) return;
  const aberto = el.dataset.aberto === "1";
  if (aberto) {
    el.style.webkitLineClamp = "2";
    el.style.overflow = "hidden";
    el.dataset.aberto = "0";
  } else {
    el.style.webkitLineClamp = "unset";
    el.style.overflow = "visible";
    el.dataset.aberto = "1";
  }
};

window.alternarDescDash = function (idLinha) {
  const el = document.getElementById(idLinha);
  if (!el) return;
  const aberto = el.dataset.aberto === "1";
  if (aberto) {
    el.style.webkitLineClamp = "2";
    el.style.overflow = "hidden";
    el.dataset.aberto = "0";
  } else {
    el.style.webkitLineClamp = "unset";
    el.style.overflow = "visible";
    el.dataset.aberto = "1";
  }
};

window._dashboardUnsubs = [];

window.abrirDashboardMestre = async function (grupoId) {
  document.getElementById("modalDashboardOverlay").style.display = "block";
  document.getElementById("modalDashboard").style.display = "block";

  const conteudo = document.getElementById("dashboardConteudo");
  conteudo.innerHTML = `<p style="color:#9A8A70;font-size:13px;text-align:center;">Carregando...</p>`;

  window._dashboardUnsubs.forEach(unsub => unsub());
  window._dashboardUnsubs = [];

  const grupoSnap = await getDoc(doc(db, "grupos", grupoId));
  if (!grupoSnap.exists()) return;
  const g = grupoSnap.data();
  const meuUid = window.usuarioAtual.uid;

  const alvos = g.membros.filter(m => m.uid !== meuUid && m.fichaId);

  if (alvos.length === 0) {
    conteudo.innerHTML = `<p style="color:#9A8A70;font-size:13px;text-align:center;padding:20px 0;font-style:italic;">Nenhum jogador vinculou uma ficha a esse grupo ainda.</p>`;
    return;
  }

  conteudo.innerHTML = alvos.map(m => `
    <div id="dashCard-${m.uid}" style="background:rgba(255,255,255,0.03);border:1px solid rgba(196,169,91,0.15);border-radius:12px;padding:12px;">
      <p style="color:#9A8A70;font-size:12px;">Carregando ${escapeHtml(m.nickname)}...</p>
    </div>
  `).join("");

  alvos.forEach(m => {
    const ref = doc(db, "usuarios", m.uid, "fichas", m.fichaId);
    const unsub = onSnapshot(ref, snap => {
      const card = document.getElementById(`dashCard-${m.uid}`);
      if (!card) return;

      if (!snap.exists()) {
        card.innerHTML = `<p style="color:#e07a7a;font-size:12px;">Ficha de ${escapeHtml(m.nickname)} não encontrada.</p>`;
        return;
      }

      const vidaMax = f.vidaMax || 1;
const vidaAtual = f.vidaAtual ?? vidaMax;
const vidaTemp = f.vidaTemp ?? 0;
const pctTemp = Math.max(0, Math.min(100, (vidaTemp / vidaMax) * 100));
const pctVida = Math.max(0, Math.min(100, (vidaAtual / vidaMax) * 100));
const corVida = pctVida <= 25 ? "#8a2c22" : pctVida <= 60 ? "#a9822f" : "#4a6b32";

      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
          <span style="font-weight:bold;font-size:14px;">${escapeHtml(f.nome || "Sem nome")}</span>
          <span style="font-size:11px;color:#9A8A70;">${escapeHtml(m.nickname)}</span>
        </div>
        <div style="font-size:12px;color:#9A8A70;margin-bottom:8px;">${escapeHtml(f.classe || "")}${f.nivel ? " · Nv " + escapeHtml(String(f.nivel)) : ""} · CA ${escapeHtml(String(f.ca ?? "-"))}</div>

        <div style="font-size:11px;color:#9A8A70;margin-bottom:2px;">HP: ${vidaAtual} / ${vidaMax}</div>
        <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden;margin-bottom:10px;">
          <div style="height:100%;width:${pctVida}%;background:${pctVida <= 25 ? "#7B1E28" : "#4a7c3a"};"></div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;color:#cdb791;">
          <div>Itens: ${(f.inventario || []).length}</div>
          <div>Armas: ${(f.armas || []).length}</div>
          <div>Armaduras: ${(f.armaduras || []).length}</div>
          <div>Poderes: ${(f.poderes || []).length}</div>
        </div>
      `;
    }, err => {
      console.error(err);
      const card = document.getElementById(`dashCard-${m.uid}`);
      if (card) card.innerHTML = `<p style="color:#e07a7a;font-size:12px;">Sem permissão pra ver essa ficha ainda.</p>`;
    });

    window._dashboardUnsubs.push(unsub);
  });
};

window.fecharDashboardMestre = function () {
  document.getElementById("modalDashboardOverlay").style.display = "none";
  document.getElementById("modalDashboard").style.display = "none";
  window._dashboardUnsubs.forEach(unsub => unsub());
  window._dashboardUnsubs = [];
};

window.fecharDetalheGrupo = function () {
  document.getElementById("modalGrupoDetalheOverlay").style.display = "none";
  document.getElementById("modalGrupoDetalhe").style.display = "none";
  window._grupoAtualId = null;
};

window.mostrarRenomearGrupo = function (nomeAtual) {
  const div = document.getElementById("detalheGrupoRenomear");
  div.style.display = "flex";
  document.getElementById("renomearGrupoInput").value = nomeAtual;
};

window.salvarRenomearGrupo = async function () {
  const novoNome = document.getElementById("renomearGrupoInput").value.trim();
  if (!novoNome || !window._grupoAtualId) return;
  try {
    await updateDoc(doc(db, "grupos", window._grupoAtualId), { nome: novoNome });
    await window.abrirDetalheGrupo(window._grupoAtualId);
    carregarGrupos();
  } catch (e) {
    console.error(e);
    alertBonito("Erro ao renomear: " + (e.code || e.message));
  }
};

window.alternarPapelMembro = async function (uidAlvo) {
  const grupoId = window._grupoAtualId;
  if (!grupoId) return;
  try {
    const grupoRef = doc(db, "grupos", grupoId);
    const snap = await getDoc(grupoRef);
    const g = snap.data();
    const novosMembros = g.membros.map(m =>
      m.uid === uidAlvo ? { ...m, papel: m.papel === "mestre" ? "jogador" : "mestre" } : m
    );
    const novosMestresUids = novosMembros.filter(m => m.papel === "mestre").map(m => m.uid);
    await updateDoc(grupoRef, { membros: novosMembros, mestresUids: novosMestresUids });
    await window.abrirDetalheGrupo(grupoId);
  } catch (e) {
    console.error(e);
    alertBonito("Erro: " + (e.code || e.message));
  }
};

window.removerMembroGrupo = async function (uidAlvo) {
  const grupoId = window._grupoAtualId;
  if (!grupoId) return;
  if (!(await confirmBonito("Remover esse membro do grupo?"))) return;
  try {
    const grupoRef = doc(db, "grupos", grupoId);
    const snap = await getDoc(grupoRef);
    const g = snap.data();
    await updateDoc(grupoRef, {
      membros: g.membros.filter(m => m.uid !== uidAlvo),
      membrosUids: g.membrosUids.filter(u => u !== uidAlvo),
      mestresUids: (g.mestresUids || []).filter(u => u !== uidAlvo)
    });
    await window.abrirDetalheGrupo(grupoId);
    carregarGrupos();
  } catch (e) {
    console.error(e);
    alertBonito("Erro: " + (e.code || e.message));
  }
};

window.sairDoGrupo = async function () {
  const grupoId = window._grupoAtualId;
  const meuUid = window.usuarioAtual.uid;
  if (!grupoId) return;
  if (!(await confirmBonito("Sair desse grupo?"))) return;
  try {
    const grupoRef = doc(db, "grupos", grupoId);
    const snap = await getDoc(grupoRef);
    const g = snap.data();
    await updateDoc(grupoRef, {
      membros: g.membros.filter(m => m.uid !== meuUid),
      membrosUids: g.membrosUids.filter(u => u !== meuUid),
      mestresUids: (g.mestresUids || []).filter(u => u !== meuUid)
    });
    fecharDetalheGrupo();
    carregarGrupos();
  } catch (e) {
    console.error(e);
    alertBonito("Erro: " + (e.code || e.message));
  }
};

window.excluirGrupo = async function () {
  const grupoId = window._grupoAtualId;
  if (!grupoId) return;
  if (!(await confirmBonito("Excluir esse grupo pra sempre? Não dá pra desfazer."))) return;
  try {
    await deleteDoc(doc(db, "grupos", grupoId));
    fecharDetalheGrupo();
    carregarGrupos();
  } catch (e) {
    console.error(e);
    alertBonito("Erro: " + (e.code || e.message));
  }
};

function renderEtapasForm() {
  const lista = document.getElementById("mundoMissaoEtapasList");
  if (!lista) return;

  lista.innerHTML = _etapasForm.map((e, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
      <span style="font-size:14px;color:#2A1A10;flex:1;">${escapeHtml(e.nome)}</span>
      <span onclick="removerEtapaForm(${i})" style="cursor:pointer;color:#8f2222;font-size:14px;">✕</span>
    </div>`).join("");
}

function removerEtapaForm(i) {
  _etapasForm.splice(i, 1);
  renderEtapasForm();
}

// ===== INICIATIVA =====
function abrirPainelIniciativa() {
  // monta lista com monstros do combate
  const nomesMonstros = combatesMestre.map((m, i) => ({
    id: "monstro_" + i,
    nome: m.nome,
    iniciativa: m.iniciativa || 0,
    tipo: "monstro"
  }));

  // jogadores salvos
  const jogadores = JSON.parse(localStorage.getItem("iniciativaJogadores") || "[]");

  iniciativaOrdem = [...jogadores, ...nomesMonstros];

  renderPainelIniciativa();

  document.getElementById("painelIniciativaOverlay").style.display = "block";
  const painel = document.getElementById("painelIniciativa");
  painel.style.display = "flex";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      painel.classList.add("aberto");
    });
  });
}

function fecharPainelIniciativa() {
  const painel = document.getElementById("painelIniciativa");
  painel.classList.remove("aberto");
  setTimeout(() => {
    painel.style.display = "none";
    document.getElementById("painelIniciativaOverlay").style.display = "none";
  }, 300);
}

function renderPainelIniciativa() {
  const lista = document.getElementById("iniciativaLista");
  if (!lista) return;

  // ordena por iniciativa decrescente
  const ordenado = [...iniciativaOrdem].sort((a, b) => b.iniciativa - a.iniciativa);

  lista.innerHTML = `
    <div class="iniciativa-add-jogador">
      <input id="inputNovoJogador" placeholder="Nome do jogador" />
      <button onclick="adicionarJogadorIniciativa()">+</button>
    </div>
    <div class="iniciativa-separador">Ordenar por iniciativa</div>
    ${ordenado.map((entry, i) => `
      <div class="iniciativa-item ${iniciativaTurnoAtual === i ? "ativo" : ""}">
        <span class="iniciativa-nome">${escapeHtml(entry.nome)}</span>
        <input
          class="iniciativa-input"
          type="number"
          value="${entry.iniciativa || ""}"
          placeholder="0"
          onchange="atualizarIniciativa('${entry.id}', this.value)"
        />
        ${entry.tipo === "jogador" ? `<button class="iniciativa-remover" onclick="removerJogadorIniciativa('${entry.id}')">✕</button>` : ""}
      </div>
    `).join("")}
  `;
}

function adicionarJogadorIniciativa() {
  const input = document.getElementById("inputNovoJogador");
  const nome = input?.value.trim();
  if (!nome) return;

  const jogadores = JSON.parse(localStorage.getItem("iniciativaJogadores") || "[]");
  const novo = { id: "jogador_" + Date.now(), nome, iniciativa: 0, tipo: "jogador" };
  jogadores.push(novo);
  localStorage.setItem("iniciativaJogadores", JSON.stringify(jogadores));

  iniciativaOrdem = [...jogadores, ...combatesMestre.map((m, i) => ({
    id: "monstro_" + i, nome: m.nome, iniciativa: m.iniciativa || 0, tipo: "monstro"
  }))];

  input.value = "";
  renderPainelIniciativa();
}

function removerJogadorIniciativa(id) {
  let jogadores = JSON.parse(localStorage.getItem("iniciativaJogadores") || "[]");
  jogadores = jogadores.filter(j => j.id !== id);
  localStorage.setItem("iniciativaJogadores", JSON.stringify(jogadores));

  iniciativaOrdem = iniciativaOrdem.filter(e => e.id !== id);
  renderPainelIniciativa();
}

function atualizarIniciativa(id, valor) {
  const entry = iniciativaOrdem.find(e => e.id === id);
  if (entry) entry.iniciativa = parseInt(valor) || 0;

  // salva jogadores
  const jogadores = iniciativaOrdem.filter(e => e.tipo === "jogador");
  localStorage.setItem("iniciativaJogadores", JSON.stringify(jogadores));

  // atualiza monstros
  iniciativaOrdem.filter(e => e.tipo === "monstro").forEach(e => {
    const i = parseInt(e.id.replace("monstro_", ""));
    if (combatesMestre[i]) combatesMestre[i].iniciativa = e.iniciativa;
  });

  renderPainelIniciativa();
}

function proximoTurno() {
  const ordenado = [...iniciativaOrdem].sort((a, b) => b.iniciativa - a.iniciativa);
  iniciativaTurnoAtual = (iniciativaTurnoAtual + 1) % ordenado.length;
  renderPainelIniciativa();
}

function flushSalvamentoPendente() {
  if (window._debounceSalvar) {
    clearTimeout(window._debounceSalvar);
    window._debounceSalvar = null;
    try { salvarPersonagens(); } catch (e) { console.error("Erro no flush:", e); }
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushSalvamentoPendente();
});
window.addEventListener("pagehide", flushSalvamentoPendente);

if (window.Capacitor?.Plugins?.App) {
  window.Capacitor.Plugins.App.addListener("appStateChange", ({ isActive }) => {
    if (!isActive) flushSalvamentoPendente();
  });
}

/* filtro das perícias */
window._filtroPericias = "todas";
function filtrarPericias(filtro, btn) {
  window._filtroPericias = filtro;
  document.querySelectorAll(".pericias-filtro").forEach((b) => b.classList.toggle("ativo", b === btn));
  atualizarTudo();
}

/* rolar o mouse em cima de um campo numérico não muda mais o valor */
document.addEventListener(
  "wheel",
  (e) => {
    const alvo = e.target;
    if (alvo && alvo.tagName === "INPUT" && alvo.type === "number" && document.activeElement === alvo) {
      alvo.blur();
    }
  },
  { passive: true },
);

/* ================= MODIFICAÇÕES (armas, armaduras e itens) ================= */
// cada modificação: { nome: "Crítico ampliado", efeito: "19-20" }

window._modsTemp = window._modsTemp || {};

function montarEditorMods(containerId, chave, modsIniciais) {
  const box = document.getElementById(containerId);
  if (!box) return;
  if (window._modsEditando) delete window._modsEditando[chave];
  window._modsTemp[chave] = Array.isArray(modsIniciais) ? modsIniciais.map((m) => ({ ...m })) : (window._modsTemp[chave] || []);
  box.className = "mods-editor";
  box.dataset.chave = chave;
  box.innerHTML = `
    <div class="mods-lista" id="modsLista_${chave}"></div>
    <div class="mods-add">
      <input id="modNome_${chave}" placeholder="Nome (ex: Crítico ampliado)" />
      <input id="modEfeito_${chave}" placeholder="Efeito (ex: 19-20)" />
      <button type="button" onclick="adicionarModTemp('${chave}')" title="Adicionar modificação"><i class="ti ti-plus"></i></button>
    </div>`;
  ["modNome_", "modEfeito_"].forEach((pre) => {
    const el = document.getElementById(pre + chave);
    if (el) el.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); adicionarModTemp(chave); } });
  });
  renderModsTemp(chave);
}

function renderModsTemp(chave) {
  const lista = document.getElementById("modsLista_" + chave);
  if (!lista) return;
  const mods = window._modsTemp[chave] || [];
  const editando = window._modsEditando?.[chave];
  lista.innerHTML = mods.length
    ? mods
        .map((m, i) =>
          editando === i
            ? `
        <div class="mods-linha editando">
          <div class="mods-linha-campos">
            <input value="${esc(m.nome || "")}" placeholder="Nome" oninput="editarCampoModTemp('${chave}', ${i}, 'nome', this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();fecharEdicaoModTemp('${chave}')}">
            <input value="${esc(m.efeito || "")}" placeholder="Efeito" oninput="editarCampoModTemp('${chave}', ${i}, 'efeito', this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();fecharEdicaoModTemp('${chave}')}">
          </div>
          <button type="button" class="mods-ok" onclick="fecharEdicaoModTemp('${chave}')" title="Pronto"><i class="ti ti-check"></i></button>
        </div>`
            : `
        <div class="mods-linha">
          <div class="mods-linha-texto" onclick="abrirEdicaoModTemp('${chave}', ${i})" title="Toque para editar">
            <strong>${esc(m.nome)}</strong>${m.efeito ? `<span>${esc(m.efeito)}</span>` : ""}
          </div>
          <button type="button" class="mods-editar" onclick="abrirEdicaoModTemp('${chave}', ${i})" title="Editar"><i class="ti ti-pencil"></i></button>
          <button type="button" onclick="removerModTemp('${chave}', ${i})" title="Remover"><i class="ti ti-x"></i></button>
        </div>`,
        )
        .join("")
    : `<p class="mods-vazio">Nenhuma modificação. Ex: crítico, dano extra, cargas, recarga.</p>`;
}

function adicionarModTemp(chave) {
  const nomeEl = document.getElementById("modNome_" + chave);
  const efeitoEl = document.getElementById("modEfeito_" + chave);
  const nome = (nomeEl?.value || "").trim();
  const efeito = (efeitoEl?.value || "").trim();
  if (!nome && !efeito) return;
  (window._modsTemp[chave] = window._modsTemp[chave] || []).push({ nome: nome || efeito, efeito: nome ? efeito : "" });
  if (nomeEl) nomeEl.value = "";
  if (efeitoEl) efeitoEl.value = "";
  renderModsTemp(chave);
  nomeEl?.focus();
}

function removerModTemp(chave, i) {
  (window._modsTemp[chave] || []).splice(i, 1);
  if (window._modsEditando) delete window._modsEditando[chave];
  renderModsTemp(chave);
}

window._modsEditando = window._modsEditando || {};
function abrirEdicaoModTemp(chave, i) {
  window._modsEditando[chave] = i;
  renderModsTemp(chave);
  const inp = document.querySelector(`#modsLista_${chave} .mods-linha.editando input`);
  if (inp) {
    inp.focus();
    inp.setSelectionRange(inp.value.length, inp.value.length);
  }
}
function editarCampoModTemp(chave, i, campo, valor) {
  const m = (window._modsTemp[chave] || [])[i];
  if (m) m[campo] = valor;
}
function fecharEdicaoModTemp(chave) {
  const mods = window._modsTemp[chave] || [];
  const i = window._modsEditando[chave];
  const m = mods[i];
  if (m) {
    m.nome = (m.nome || "").trim();
    m.efeito = (m.efeito || "").trim();
    if (!m.nome && !m.efeito) mods.splice(i, 1);
    else if (!m.nome) {
      m.nome = m.efeito;
      m.efeito = "";
    }
  }
  delete window._modsEditando[chave];
  renderModsTemp(chave);
}

// usado ao criar: pega o que foi digitado (inclusive o que ficou nos campos sem apertar +) e limpa o editor
function consumirModsTemp(chave) {
  const nomeEl = document.getElementById("modNome_" + chave);
  if (nomeEl && (nomeEl.value.trim() || document.getElementById("modEfeito_" + chave)?.value.trim())) {
    adicionarModTemp(chave);
  }
  const mods = [...(window._modsTemp[chave] || [])];
  window._modsTemp[chave] = [];
  renderModsTemp(chave);
  return mods;
}

function modsChipsHTML(mods) {
  if (!Array.isArray(mods) || !mods.length) return "";
  return `<div class="mods-chips">${mods
    .map((m) => `<span class="mods-chip">${esc(m.nome)}${m.efeito ? ` <b>${esc(m.efeito)}</b>` : ""}</span>`)
    .join("")}</div>`;
}

function modsVerHTML(mods) {
  if (!Array.isArray(mods) || !mods.length) return "";
  return `
    <div style="margin-top: 12px;">
      <span class="popup-label">Modificações</span>
      <div class="mods-ver">${mods
        .map((m) => `<div class="mods-ver-linha"><strong>${esc(m.nome)}</strong>${m.efeito ? `<span>${esc(m.efeito)}</span>` : ""}</div>`)
        .join("")}</div>
    </div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  montarEditorMods("armaMods", "arma");
  montarEditorMods("armaduraMods", "armadura");
  montarEditorMods("itemMods", "item");
});


/* =====================================================================
   PODERES E MAGIAS
   - Poderes agrupados por custo de ação, com recarga, origem e favoritos
   - Magias com painel de espaços, seletor de círculos, conjurar,
     concentração, ritual, componentes e preparadas
   ===================================================================== */

var PM_ACOES = [
  ["acao", "Ação", "Ações"],
  ["bonus", "Ação Bônus", "Ações Bônus"],
  ["reacao", "Reação", "Reações"],
  ["livre", "Livre", "Ações Livres"],
  ["passiva", "Passiva", "Passivas"],
  ["", "Sem definição", "Outros"],
];

var PM_RECARGAS = {
  "": "Sem recarga",
  vontade: "À vontade",
  unico: "Uso único",
  curto: "Descanso curto",
  longo: "Descanso longo",
  dia: "Por dia",
};

var PM_ORIGENS = {
  "": "Sem origem",
  classe: "Classe",
  subclasse: "Subclasse",
  raca: "Raça",
  talento: "Talento",
  item: "Item",
};

var PM_TIPOS = [
  ["", "Tipo de dano"], ["fogo", "🔥 Fogo"], ["gelo", "❄️ Gelo"], ["raio", "⚡ Raio"],
  ["cura", "🩹 Cura"], ["trovejante", "🌩️ Trovejante"], ["necrotico", "💀 Necrótico"],
  ["radiante", "✨ Radiante"], ["veneno", "☠️ Veneno"], ["agua", "💧 Água"],
  ["magico", "☄️ Mágico"], ["psiquico", "🧠 Psíquico"], ["corte", "🔪 Corte"],
  ["perfurante", "📌 Perfurante"], ["concussao", "💥 Concussão"], ["metal", "⚙️ Metal"],
  ["fisico", "🗡️ Físico"], ["vento", "🍃 Vento"], ["madeira", "🌳 Madeira"],
  ["terra", "🌍 Terra"], ["trevas", "🌑 Trevas"], ["luz", "🌕 Luz"], ["espirito", "🌓 Espírito"],
];

var ROMANOS = ["Truques", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

var concentracaoAtiva = "";
window._visaoPM = window._visaoPM || "poderes";
window._circuloSelecionado = window._circuloSelecionado || 0;
window._filtroOrigem = "";
window._soPreparadas = false;
try {
  window._modoCompactoPM = localStorage.getItem("pmCompacto") === "1";
} catch (e) {
  window._modoCompactoPM = false;
}

function pmSetText(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

function ehMagia(p) {
  return /^[0-9]$/.test(String(p?.circulo ?? "").trim());
}

function circuloDe(p) {
  return parseInt(p.circulo);
}

function nomeCirculo(c) {
  return c === 0 ? "Truque" : `${ROMANOS[c]} círculo`;
}

function contMagias(c) {
  return poderes.filter((p) => ehMagia(p) && circuloDe(p) === c).length;
}

// converte poderes antigos (abas Talentos/Passivas, campo "Conjuração" em texto) pro formato novo
function normalizarPoder(p) {
  if (!p) return;
  if (!p.id) p.id = "pw_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const c = String(p.circulo ?? "").trim();
  if (c === "talento") {
    p.circulo = "";
    if (!p.origem) p.origem = "talento";
  }
  if (c === "passiva") {
    p.circulo = "";
    if (p.acao === undefined) p.acao = "passiva";
  }
  if (p.acao === undefined) {
    const t = normalizarTipo(p.tempo);
    p.acao = t.includes("bonus") ? "bonus"
      : t.includes("reac") ? "reacao"
      : t.includes("livre") ? "livre"
      : t.includes("acao") ? "acao"
      : "";
  }
  if (p.recarga === undefined) p.recarga = "";
  if (p.origem === undefined) p.origem = "";
  if (ehMagia(p) && p.preparada === undefined) p.preparada = true;
}

/* ---------- render geral ---------- */

function renderPoderes() {
  poderes.forEach(normalizarPoder);

  const nMagias = poderes.filter(ehMagia).length;
  pmSetText("contadorPoderes", `(${poderes.length - nMagias})`);
  pmSetText("contadorMagias", `(${nMagias})`);

  document
    .querySelectorAll('[onclick="alternarModoCompacto()"]')
    .forEach((b) => b.classList.toggle("ativo", !!window._modoCompactoPM));

  renderListaPoderes();
  renderPainelMagias();
}

// chamado pelo código antigo sempre que os espaços mudam
function renderSlotsCirculo() {
  if (window.__pmPronto) renderPainelMagias();
}

function trocarVisaoPM(visao) {
  window._visaoPM = visao;
  const p = document.getElementById("pmPoderes");
  const m = document.getElementById("pmMagias");
  if (p) p.style.display = visao === "poderes" ? "" : "none";
  if (m) m.style.display = visao === "magias" ? "" : "none";
  document.getElementById("pmBtnPoderes")?.classList.toggle("ativo", visao === "poderes");
  document.getElementById("pmBtnMagias")?.classList.toggle("ativo", visao === "magias");
  renderPoderes();
}

function alternarModoCompacto() {
  window._modoCompactoPM = !window._modoCompactoPM;
  try {
    localStorage.setItem("pmCompacto", window._modoCompactoPM ? "1" : "0");
  } catch (e) {}
  renderPoderes();
}

// todos os filtros possíveis da visão Poderes (só aparecem os que têm algum poder)
function filtrosPoderDisponiveis() {
  const todos = [];
  PM_ACOES.forEach(([k, rotulo, plural]) => {
    if (!k) return;
    todos.push({ v: "acao:" + k, g: "acao", r: k === "passiva" ? "Passivas" : plural, teste: (p) => p.acao === k });
  });
  todos.push({ v: "acao:", g: "acao", r: "Sem ação", teste: (p) => !p.acao });

  todos.push({ v: "usos", g: "rec", r: "Com usos", teste: (p) => p.temCargas && p.maxCargas > 0 });
  Object.entries(PM_RECARGAS).forEach(([k, rotulo]) => {
    if (!k) return;
    todos.push({ v: "rec:" + k, g: "rec", r: rotulo, teste: (p) => p.recarga === k });
  });

  Object.entries(PM_ORIGENS).forEach(([k, rotulo]) => {
    if (!k) return;
    todos.push({ v: "orig:" + k, g: "orig", r: rotulo, teste: (p) => p.origem === k });
  });

  const lista = poderes.filter((p) => !ehMagia(p));
  // todos aparecem sempre; os que não têm nenhum poder ficam apagadinhos
  return todos.map((f) => ({ ...f, n: lista.filter(f.teste).length }));
}

function filtrarOrigemPoder(origem) {
  window._filtroOrigem = origem;
  renderPoderes();
}

/* ---------- card (usado em poderes e magias) ---------- */

function cardPoderEl(index, mostrarCirculo) {
  const p = poderes[index];
  const magia = ehMagia(p);
  const li = document.createElement("li");
  li.className =
    "pw-card" +
    (magia && p.preparada === false ? " nao-preparada" : "") +
    (concentracaoAtiva && concentracaoAtiva === p.id ? " concentrando" : "");
  li.dataset.index = index;

  const tags = [];
  if (magia && mostrarCirculo) tags.push(`<span class="pw-tag pw-tag-circulo">${nomeCirculo(circuloDe(p))}</span>`);
  if (p.acao) tags.push(`<span class="pw-tag">${PM_ACOES.find((a) => a[0] === p.acao)?.[1] || ""}</span>`);
  if (p.dano) tags.push(`<span class="tag-dano">${esc(p.dano)}</span>`);
  if (p.recarga) tags.push(`<span class="pw-tag">${PM_RECARGAS[p.recarga] || ""}</span>`);
  if (p.origem) tags.push(`<span class="pw-tag pw-tag-suave">${PM_ORIGENS[p.origem] || ""}</span>`);
  if (magia) {
    if (p.concentracao) tags.push(`<span class="pw-tag pw-tag-magia">Concentração</span>`);
    if (p.ritual) tags.push(`<span class="pw-tag pw-tag-magia">Ritual</span>`);
    const comp = ["v", "s", "m"].filter((k) => p.componentes && p.componentes[k]).map((k) => k.toUpperCase());
    if (comp.length) tags.push(`<span class="pw-tag pw-tag-suave">${comp.join(" ")}</span>`);
  }

  const pips =
    p.temCargas && p.maxCargas > 0
      ? `<div class="pw-pips">${Array.from(
          { length: p.maxCargas },
          (_, k) =>
            `<span class="pw-pip ${p.cargasGastas?.[k] ? "gasto" : ""}" onclick="event.stopPropagation(); toggleCargaPoder(${index}, ${k})"></span>`,
        ).join("")}</div>`
      : "";

  const conjurar = magia
    ? `<button type="button" class="pw-conjurar" onclick="event.stopPropagation(); conjurarMagia(${index})"><i class="ti ti-sparkles"></i> <span>Conjurar</span></button>`
    : "";

  const preparar = magia
    ? `<button type="button" class="pw-mini ${p.preparada === false ? "" : "ativo"}" title="${p.preparada === false ? "Não preparada (toque para preparar)" : "Preparada (toque para desmarcar)"}" onclick="event.stopPropagation(); alternarPreparada(${index})"><i class="ti ti-bookmark"></i></button>`
    : "";

  li.className += magia ? ` pw-magia pw-c${circuloDe(p)}` : "";

  li.innerHTML = `
    <button type="button" class="drag-handle" aria-label="Arrastar para reordenar"></button>
    <div class="pw-selo" onclick="verPoder(${index})">${magia ? `<small>${ROMANOS[circuloDe(p)] === "Truques" ? "0" : ROMANOS[circuloDe(p)]}</small>` : ""}<span>${getIconeTipo(p.tipo)}</span></div>
    <div class="pw-corpo" onclick="verPoder(${index})">
      <strong class="pw-nome">${esc(p.nome) || "Sem nome"}</strong>
      ${tags.length ? `<div class="pw-tags">${tags.join("")}</div>` : ""}
      ${pips ? `<div class="pw-rodape">${pips}</div>` : ""}
    </div>
    <div class="pw-lado">
      <div class="pw-acoes">
        ${preparar}
        <button type="button" class="pw-mini pw-fav ${p.favorito ? "ativo" : ""}" title="Favorito" onclick="event.stopPropagation(); alternarFavoritoPoder(${index})"><i class="ti ${p.favorito ? "ti-star-filled" : "ti-star"}"></i></button>
      </div>
      ${conjurar}
    </div>`;
  return li;
}

/* ---------- visão Poderes ---------- */

function renderListaPoderes() {
  const box = document.getElementById("listaPoderesSecoes");
  if (!box) return;

  const filtros = poderes.some((p) => !ehMagia(p)) ? filtrosPoderDisponiveis() : [];
  if (window._filtroOrigem && !filtros.some((f) => f.v === window._filtroOrigem)) window._filtroOrigem = "";
  const filtroAtivo = filtros.find((f) => f.v === window._filtroOrigem);

  const filtrosBox = document.getElementById("filtrosOrigem");
  if (filtrosBox) {
    let grupoAnterior = null;
    filtrosBox.innerHTML = !filtros.length ? "" :
      `<button type="button" class="pm-filtro ${!window._filtroOrigem ? "ativo" : ""}" onclick="filtrarOrigemPoder('')">Todos</button>` +
      filtros
        .map((f) => {
          const sep = grupoAnterior !== null && grupoAnterior !== f.g ? `<span class="pm-filtro-sep"></span>` : "";
          grupoAnterior = f.g;
          return `${sep}<button type="button" class="pm-filtro ${window._filtroOrigem === f.v ? "ativo" : ""} ${f.n ? "" : "vazio"}" onclick="filtrarOrigemPoder('${f.v}')">${f.r} <small>${f.n}</small></button>`;
        })
        .join("");
  }

  const busca = normalizarTipo(document.getElementById("buscaPoder")?.value || "");
  const passaBusca = (p) => !busca || normalizarTipo(`${p.nome || ""} ${p.desc || ""}`).includes(busca);

  box.innerHTML = "";
  let algum = false;

  // Favoritos (poderes e magias), com ordem própria
  const favoritos = [];
  poderes.forEach((p, i) => {
    if (p.favorito && passaBusca(p) && (!filtroAtivo || (!ehMagia(p) && filtroAtivo.teste(p)))) favoritos.push(i);
  });
  favoritos.sort((a, b) => (poderes[a].ordemFav ?? 1e9) - (poderes[b].ordemFav ?? 1e9) || a - b);
  if (favoritos.length) {
    box.appendChild(secaoPoderes("Favoritos", "ti-star", favoritos, true));
    algum = true;
  }

  PM_ACOES.forEach(([chave, , titulo]) => {
    const indices = [];
    poderes.forEach((p, i) => {
      if (ehMagia(p)) return;
      if ((p.acao || "") !== chave) return;
      if (filtroAtivo && !filtroAtivo.teste(p)) return;
      if (!passaBusca(p)) return;
      indices.push(i);
    });
    if (indices.length) {
      box.appendChild(secaoPoderes(titulo, null, indices, false));
      algum = true;
    }
  });

  if (!algum) {
    box.innerHTML = `<p class="pm-vazio">${
      busca || window._filtroOrigem ? "Nada encontrado." : "Nenhum poder ainda. Toque em <b>+ Novo</b>."
    }</p>`;
  }
}

function secaoPoderes(titulo, icone, indices, ehFavoritos) {
  const sec = document.createElement("div");
  sec.className = "pm-secao" + (ehFavoritos ? " pm-secao-fav" : "");
  sec.innerHTML = `<div class="pm-secao-titulo">${icone ? `<i class="ti ${icone}"></i>` : ""}<span>${titulo}</span><small>${indices.length}</small></div>`;

  const ul = document.createElement("ul");
  ul.className = "pm-lista" + (window._modoCompactoPM ? " compacto" : "");
  indices.forEach((i, k) => {
    const li = cardPoderEl(i, ehFavoritos);
    // nos favoritos a ordem é só deles: o índice do arraste é a posição na lista
    if (ehFavoritos) li.dataset.index = k;
    ul.appendChild(li);
  });
  sec.appendChild(ul);

  if (ehFavoritos) {
    const favArr = indices.map((i) => poderes[i]);
    habilitarArrastarReordenar(ul, favArr, () => {
      favArr.forEach((p, k) => (p.ordemFav = k));
      renderPoderes();
      salvarTudo();
    });
  } else {
    habilitarArrastarReordenar(ul, poderes, renderPoderes);
  }
  return sec;
}

function alternarFavoritoPoder(index) {
  const p = poderes[index];
  if (!p) return;
  p.favorito = !p.favorito;
  if (p.favorito) {
    // entra no fim da lista de favoritos
    p.ordemFav = Math.max(-1, ...poderes.filter((x) => x.favorito && x !== p).map((x) => x.ordemFav ?? -1)) + 1;
  }
  renderPoderes();
  salvarTudo();
}

/* ---------- visão Magias ---------- */

function atualizarCabecalhoConjurador() {
  const base = parseInt(document.getElementById("dtBase")?.value) || 0;
  const atr = parseInt(document.getElementById("dtAtributo")?.value) || 0;
  const prof = parseInt(document.getElementById("dtProf")?.value) || 0;
  pmSetText("cabCD", base + atr + prof);
  const atk = atr + prof;
  pmSetText("cabAtk", (atk >= 0 ? "+" : "") + atk);
}

function alternarAjusteCD() {
  const box = document.getElementById("dtBoxMagia");
  if (box) box.style.display = box.style.display === "none" ? "" : "none";
}

function renderPainelMagias() {
  const lista = document.getElementById("listaMagias");
  if (!lista) return;

  atualizarCabecalhoConjurador();

  // concentração
  const banner = document.getElementById("concentracaoBanner");
  const pConc = concentracaoAtiva ? poderes.find((p) => p.id === concentracaoAtiva) : null;
  if (concentracaoAtiva && !pConc) concentracaoAtiva = "";
  if (banner) {
    banner.innerHTML = pConc
      ? `<div class="concentracao-banner"><i class="ti ti-brain"></i><span>Concentrando em <b>${esc(pConc.nome)}</b></span><button type="button" onclick="encerrarConcentracao()">Encerrar</button></div>`
      : "";
  }

  // painel de espaços (gemas)
  const painel = document.getElementById("painelEspacos");
  if (painel) {
    const linhas = [];
    for (let c = 1; c <= 9; c++) {
      const arr = gastosCirculos[c] || [];
      if (!arr.length) continue;
      const restam = arr.filter((g) => !g).length;
      linhas.push(`
        <div class="esp-linha ${window._circuloSelecionado === c ? "selecionado" : ""}">
          <button type="button" class="esp-num pw-c${c}" onclick="selecionarCirculo(${c})">${ROMANOS[c]}</button>
          <div class="esp-gemas">${arr
            .map(
              (g, k) =>
                `<button type="button" class="esp-gema ${g ? "gasta" : ""}" title="${g ? "Gasto (toque para recuperar)" : "Disponível (toque para gastar)"}" onclick="alternarEspaco(${c}, ${k})"></button>`,
            )
            .join("")}</div>
          <span class="esp-restam">${restam}/${arr.length}</span>
        </div>`);
    }
    painel.innerHTML = linhas.length
      ? linhas.join("")
      : `<p class="pm-vazio">Nenhum espaço configurado. Toque na engrenagem para dizer quantos você tem em cada círculo.</p>`;
  }

  // seletor de círculos (só os que você usa)
  const seletor = document.getElementById("seletorCirculos");
  if (seletor) {
    const visiveis = [];
    for (let c = 0; c <= 9; c++) {
      const tem = (gastosCirculos[c] || []).length || contMagias(c);
      if (c === 0 || tem || c === window._circuloSelecionado) visiveis.push(c);
    }
    seletor.innerHTML = visiveis
      .map((c) => {
        const qtd = contMagias(c);
        return `<button type="button" class="circ-anel pw-c${c} ${c === window._circuloSelecionado ? "ativo" : ""} ${c === 0 ? "truques" : ""}" onclick="selecionarCirculo(${c})">
          <span>${ROMANOS[c]}</span>${qtd ? `<small>${qtd}</small>` : ""}
        </button>`;
      })
      .join("");
  }

  // lista do círculo escolhido
  const sc = window._circuloSelecionado;
  lista.className = "pm-lista lista-sempre-visivel" + (window._modoCompactoPM ? " compacto" : "");
  lista.innerHTML = "";
  poderes.forEach((p, i) => {
    if (!ehMagia(p) || circuloDe(p) !== sc) return;
    if (window._soPreparadas && p.preparada === false) return;
    lista.appendChild(cardPoderEl(i, false));
  });

  if (!lista.children.length) {
    lista.innerHTML = `<p class="pm-vazio">${
      window._soPreparadas
        ? "Nenhuma magia preparada aqui."
        : sc === 0
          ? "Nenhum truque ainda."
          : `Nenhuma magia do ${ROMANOS[sc]} círculo ainda.`
    }</p>`;
  } else {
    habilitarArrastarReordenar(lista, poderes, renderPoderes);
  }

  document.getElementById("btnSoPreparadas")?.classList.toggle("ativo", !!window._soPreparadas);
}

function selecionarCirculo(c) {
  window._circuloSelecionado = c;
  renderPainelMagias();
}

function alternarEspaco(c, k) {
  if (!Array.isArray(gastosCirculos[c])) return;
  gastosCirculos[c][k] = !gastosCirculos[c][k];
  renderPainelMagias();
  salvarTudo();
}

function alternarSoPreparadas() {
  window._soPreparadas = !window._soPreparadas;
  renderPainelMagias();
}

function alternarPreparada(index) {
  const p = poderes[index];
  if (!p) return;
  p.preparada = p.preparada === false;
  renderPoderes();
  salvarTudo();
}

function encerrarConcentracao() {
  concentracaoAtiva = "";
  renderPoderes();
  salvarTudo();
}

function abrirGerenciarEspacos() {
  let html = `<div class="popup-form"><p class="pm-dica">Quantos espaços de magia você tem em cada círculo:</p><div class="esp-config">`;
  for (let c = 1; c <= 9; c++) {
    html += `<label class="esp-config-linha"><span>${ROMANOS[c]} círculo</span><input type="number" min="0" max="20" id="cfgEsp${c}" value="${(gastosCirculos[c] || []).length}"></label>`;
  }
  html += `</div><button class="popup-salvar-btn" onclick="salvarGerenciarEspacos()">Salvar</button></div>`;
  abrirPopup("Espaços de magia", html, true, null);
}

function salvarGerenciarEspacos() {
  for (let c = 1; c <= 9; c++) {
    let n = parseInt(document.getElementById("cfgEsp" + c)?.value) || 0;
    n = Math.max(0, Math.min(20, n));
    const atual = Array.isArray(gastosCirculos[c]) ? gastosCirculos[c] : [];
    gastosCirculos[c] = Array.from({ length: n }, (_, k) => !!atual[k]);
  }
  fecharPopup();
  renderPoderes();
  salvarTudo();
}

/* ---------- conjurar ---------- */

async function conjurarMagia(index) {
  const p = poderes[index];
  if (!p || !ehMagia(p)) return;
  const c = circuloDe(p);

  if (p.concentracao && concentracaoAtiva && concentracaoAtiva !== p.id) {
    const atual = poderes.find((x) => x.id === concentracaoAtiva);
    if (atual && !(await confirmBonito(`Você está concentrado em "${atual.nome}". Conjurar "${p.nome}" encerra essa concentração. Continuar?`))) {
      return;
    }
  }

  if (c === 0) {
    finalizarConjuracao(index, 0);
    return;
  }

  const opcoes = [];
  for (let k = c; k <= 9; k++) {
    const arr = gastosCirculos[k] || [];
    const livres = arr.filter((g) => !g).length;
    if (livres) opcoes.push({ k, livres });
  }

  if (!opcoes.length) {
    alertBonito(`Sem espaços livres do ${ROMANOS[c]} círculo ou maior. Faça um descanso longo ou ajuste os espaços.`);
    return;
  }

  // só existe o próprio círculo: gasta direto
  if (opcoes.length === 1 && opcoes[0].k === c) {
    gastarEspacoECojurar(index, c);
    return;
  }

  const html = `
    <div class="popup-form">
      <p class="pm-dica">Em qual círculo conjurar?</p>
      ${opcoes
        .map(
          (o) => `<button type="button" class="guardar-opcao" onclick="gastarEspacoECojurar(${index}, ${o.k})">
            <i class="ti ti-sparkles"></i>
            <span>${ROMANOS[o.k]} círculo${o.k > c ? " (elevada)" : ""}</span>
            <small>${o.livres} ${o.livres === 1 ? "livre" : "livres"}</small>
          </button>`,
        )
        .join("")}
    </div>`;
  abrirPopup(`Conjurar ${p.nome || "magia"}`, html, true, null);
}

function gastarEspacoECojurar(index, k) {
  const arr = gastosCirculos[k] || [];
  const livre = arr.findIndex((g) => !g);
  if (livre >= 0) arr[livre] = true;
  fecharPopup();
  finalizarConjuracao(index, k);
}

function finalizarConjuracao(index, k) {
  const p = poderes[index];
  if (!p) return;
  if (p.concentracao) concentracaoAtiva = p.id;
  renderPoderes();
  salvarTudo();
  mostrarToastMundo(`${p.nome || "Magia"} conjurada${k ? ` no ${ROMANOS[k]} círculo` : ""}`);
  if (extrairDados(p.dano)) rolarDanoPoder(index);
}

/* ---------- descansos ---------- */

async function descansoCurto() {
  if (!(await confirmBonito("Descanso curto: recupera os usos dos poderes que recarregam em descanso curto. Continuar?"))) return;
  let n = 0;
  poderes.forEach((p) => {
    if (p.recarga === "curto" && Array.isArray(p.cargasGastas)) {
      if (p.cargasGastas.some(Boolean)) n++;
      p.cargasGastas = p.cargasGastas.map(() => false);
    }
  });
  renderPoderes();
  salvarTudo();
  mostrarToastMundo(n ? `${n} ${n === 1 ? "poder recuperado" : "poderes recuperados"}` : "Descanso curto feito");
}

async function descansoLongo() {
  if (
    !(await confirmBonito(
      "Descanso longo: recupera os usos de todos os poderes (menos os de uso único), todos os espaços de magia e a vida até o máximo, e encerra a concentração. Continuar?",
    ))
  )
    return;

  poderes.forEach((p) => {
    if (p.recarga !== "vontade" && p.recarga !== "unico" && Array.isArray(p.cargasGastas)) {
      p.cargasGastas = p.cargasGastas.map(() => false);
    }
  });
  for (let c = 0; c <= 9; c++) {
    if (Array.isArray(gastosCirculos[c])) gastosCirculos[c] = gastosCirculos[c].map(() => false);
  }
  concentracaoAtiva = "";

  const max = get("vidaMax");
  if (max > 0) {
    vidaAtual = max;
    if (typeof atualizarHP === "function") atualizarHP();
  }

  renderPoderes();
  salvarTudo();
  mostrarToastMundo("Descanso longo: tudo recuperado");
}

/* ---------- formulário (novo / editar) ---------- */

function abrirFormPoder(index, circuloPadrao) {
  const editando = index >= 0;
  const p = editando
    ? poderes[index]
    : { circulo: circuloPadrao ?? "", acao: "", recarga: "", origem: "", preparada: true };
  if (editando) normalizarPoder(p);

  const opts = (pares, sel) =>
    pares.map(([v, rot]) => `<option value="${v}" ${String(v) === String(sel ?? "") ? "selected" : ""}>${rot}</option>`).join("");

  const circulos = [["", "Poder (sem círculo)"], ["0", "Truque (círculo 0)"]].concat(
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map((c) => [String(c), `Magia · ${ROMANOS[c]} círculo`]),
  );
  const comp = p.componentes || {};
  const magia = ehMagia(p);

  const html = `
    <div class="popup-form pf-form">
      <label class="popup-label">Nome</label>
      <input id="pfNome" value="${esc(p.nome || "")}" placeholder="Ex: Bola de Fogo">

      <label class="popup-label">É um...</label>
      <select id="pfCirculo" onchange="atualizarCamposMagiaForm()">${opts(circulos, p.circulo)}</select>

      <div class="pf-duplo">
        <div>
          <span class="pf-mini">Ação</span>
          <select id="pfAcao">${opts(PM_ACOES.map((a) => [a[0], a[0] ? a[1] : "Sem definição"]), p.acao)}</select>
        </div>
        <div>
          <span class="pf-mini">Recarga</span>
          <select id="pfRecarga">${opts(Object.entries(PM_RECARGAS), p.recarga)}</select>
        </div>
      </div>

      <div class="pf-duplo">
        <div>
          <span class="pf-mini">Origem</span>
          <select id="pfOrigem">${opts(Object.entries(PM_ORIGENS), p.origem)}</select>
        </div>
        <div>
          <span class="pf-mini">Tipo de dano</span>
          <select id="pfTipo">${opts(PM_TIPOS, normalizarTipo(p.tipo))}</select>
        </div>
      </div>

      <div class="pf-duplo">
        <div>
          <span class="pf-mini">Dano / efeito</span>
          <input id="pfDano" value="${esc(p.dano || "")}" placeholder="Ex: 8d6">
        </div>
        <div>
          <span class="pf-mini">Alcance</span>
          <input id="pfAlcance" value="${esc(p.alcance || "")}" placeholder="Ex: 36m">
        </div>
      </div>

      <div class="pf-duplo">
        <div>
          <span class="pf-mini">Duração</span>
          <input id="pfDuracao" value="${esc(p.duracao || "")}" placeholder="Ex: 1 minuto">
        </div>
        <div>
          <span class="pf-mini">Tempo de conjuração</span>
          <input id="pfTempo" value="${esc(p.tempo || "")}" placeholder="Ex: 1 ação">
        </div>
      </div>

      <div id="pfCamposMagia" style="display:${magia ? "block" : "none"};">
        <span class="pf-mini">Componentes</span>
        <div class="pf-componentes">
          <label><input type="checkbox" id="pfCompV" ${comp.v ? "checked" : ""}><span>V</span></label>
          <label><input type="checkbox" id="pfCompS" ${comp.s ? "checked" : ""}><span>S</span></label>
          <label><input type="checkbox" id="pfCompM" ${comp.m ? "checked" : ""}><span>M</span></label>
        </div>

        <div class="toggle-cargas">
          <span class="toggle-cargas-texto">Concentração</span>
          <label class="switch-cargas"><input type="checkbox" id="pfConcentracao" ${p.concentracao ? "checked" : ""}><span class="slider-cargas"></span></label>
        </div>
        <div class="toggle-cargas">
          <span class="toggle-cargas-texto">Ritual</span>
          <label class="switch-cargas"><input type="checkbox" id="pfRitual" ${p.ritual ? "checked" : ""}><span class="slider-cargas"></span></label>
        </div>
        <div class="toggle-cargas">
          <span class="toggle-cargas-texto">Preparada</span>
          <label class="switch-cargas"><input type="checkbox" id="pfPreparada" ${p.preparada === false ? "" : "checked"}><span class="slider-cargas"></span></label>
        </div>
      </div>

      <label class="popup-label">Descrição</label>
      <textarea id="pfDesc" placeholder="O que esse poder faz?">${esc(p.desc || "")}</textarea>

      <div class="toggle-cargas">
        <span class="toggle-cargas-texto">Possui usos</span>
        <label class="switch-cargas">
          <input type="checkbox" id="pfTemCargas" ${p.temCargas ? "checked" : ""} onchange="document.getElementById('pfMaxCargas').style.display = this.checked ? 'block' : 'none'">
          <span class="slider-cargas"></span>
        </label>
      </div>
      <input id="pfMaxCargas" type="number" min="1" max="30" placeholder="Quantos usos?" value="${p.maxCargas || ""}" style="display:${p.temCargas ? "block" : "none"};">

      <button class="popup-salvar-btn" onclick="salvarFormPoder(${index})">${editando ? "Salvar" : "Adicionar"}</button>
      ${editando ? `<button type="button" class="pf-remover" onclick="fecharPopup(); removerPoder(${index})"><i class="ti ti-trash"></i> Remover</button>` : ""}
    </div>`;

  abrirPopup(editando ? `Editar ${p.nome || "poder"}` : magia ? "Nova magia" : "Novo poder", html, true, null);
}

function atualizarCamposMagiaForm() {
  const c = document.getElementById("pfCirculo")?.value || "";
  const box = document.getElementById("pfCamposMagia");
  if (box) box.style.display = /^[0-9]$/.test(c) ? "block" : "none";
}

function salvarFormPoder(index) {
  const v = (id) => document.getElementById(id);
  const nome = v("pfNome")?.value.trim();
  if (!nome) {
    v("pfNome")?.focus();
    return;
  }

  const circulo = v("pfCirculo").value;
  const magia = /^[0-9]$/.test(circulo);
  const temCargas = !!v("pfTemCargas").checked;
  const maxCargas = temCargas ? Math.max(1, parseInt(v("pfMaxCargas").value) || 1) : 0;
  const anterior = index >= 0 ? poderes[index] : {};

  let cargasGastas = [];
  if (temCargas) {
    cargasGastas =
      anterior.temCargas && anterior.maxCargas === maxCargas && Array.isArray(anterior.cargasGastas)
        ? anterior.cargasGastas
        : Array(maxCargas).fill(false);
  }

  const poder = {
    ...anterior,
    id: anterior.id || "pw_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    nome,
    circulo,
    acao: v("pfAcao").value,
    recarga: v("pfRecarga").value,
    origem: v("pfOrigem").value,
    tipo: v("pfTipo").value,
    dano: v("pfDano").value.trim(),
    alcance: v("pfAlcance").value.trim(),
    duracao: v("pfDuracao").value.trim(),
    tempo: v("pfTempo").value.trim(),
    desc: v("pfDesc").value.trim(),
    temCargas,
    maxCargas,
    cargasGastas,
    concentracao: magia && !!v("pfConcentracao").checked,
    ritual: magia && !!v("pfRitual").checked,
    preparada: magia ? !!v("pfPreparada").checked : anterior.preparada,
    componentes: magia
      ? { v: !!v("pfCompV").checked, s: !!v("pfCompS").checked, m: !!v("pfCompM").checked }
      : anterior.componentes || {},
  };

  if (index >= 0) poderes[index] = poder;
  else poderes.push(poder);

  if (!poder.concentracao && concentracaoAtiva === poder.id) concentracaoAtiva = "";

  fecharPopup();
  salvarTudo();

  if (magia) {
    window._circuloSelecionado = parseInt(circulo);
    trocarVisaoPM("magias");
  } else {
    trocarVisaoPM("poderes");
  }
}

/* ---------- ver detalhes ---------- */

function verPoder(index) {
  const p = poderes[index];
  if (!p) return;
  normalizarPoder(p);
  const magia = ehMagia(p);

  const tipoRotulo = (PM_TIPOS.find((t) => t[0] && t[0] === normalizarTipo(p.tipo)) || [])[1] || p.tipo || "";
  const comp = ["v", "s", "m"].filter((k) => p.componentes && p.componentes[k]).map((k) => k.toUpperCase()).join(" ");

  const tags = [];
  if (magia && p.concentracao) tags.push(`<span class="pw-tag pw-tag-magia">Concentração</span>`);
  if (magia && p.ritual) tags.push(`<span class="pw-tag pw-tag-magia">Ritual</span>`);
  if (magia && p.preparada === false) tags.push(`<span class="pw-tag pw-tag-suave">Não preparada</span>`);
  if (p.favorito) tags.push(`<span class="pw-tag">Favorito</span>`);

  const e = (v) => (v ? esc(v) : "");
  const html = popupVerHTML({
    infos: [
      ["Círculo", magia ? nomeCirculo(circuloDe(p)) : ""],
      ["Dano / efeito", e(p.dano), true],
      ["Ação", p.acao ? PM_ACOES.find((a) => a[0] === p.acao)?.[1] : ""],
      ["Tipo", e(tipoRotulo)],
      ["Recarga", p.recarga ? PM_RECARGAS[p.recarga] : ""],
      ["Origem", p.origem ? PM_ORIGENS[p.origem] : ""],
      ["Alcance", e(p.alcance)],
      ["Duração", e(p.duracao)],
      ["Conjuração", e(p.tempo)],
      ["Componentes", magia ? comp : ""],
      ["Usos", pvCargas(p)],
    ],
    tags,
    desc: p.desc,
    acoes: `
      ${magia ? `<button type="button" class="pv-principal ${extrairDados(p.dano) ? "pv-meia" : ""}" onclick="fecharPopup(); conjurarMagia(${index})"><i class="ti ti-sparkles"></i><span>Conjurar</span></button>` : ""}
      ${extrairDados(p.dano) ? `<button type="button" class="pv-principal ${magia ? "pv-meia" : ""}" onclick="rolarDanoPoder(${index})">🎲 <span>Rolar ${esc(extrairDados(p.dano))}</span></button>` : ""}
      <button type="button" onclick="alternarFavoritoPoder(${index}); verPoder(${index})"><i class="ti ${p.favorito ? "ti-star-filled" : "ti-star"}"></i><span>${p.favorito ? "Desfavoritar" : "Favoritar"}</span></button>
      <button type="button" class="pv-editar" onclick="abrirFormPoder(${index})"><i class="ti ti-pencil"></i><span>Editar</span></button>
      <button type="button" class="perigo" onclick="fecharPopup(); removerPoder(${index})"><i class="ti ti-trash"></i><span>Remover</span></button>`,
  });

  abrirPopup(`${getIconeTipo(p.tipo)} ${p.nome || "Sem nome"}`, html, true, null);
}

// compatibilidade: nomes antigos ainda chamados em outros lugares
function editarPoder(index) {
  abrirFormPoder(index);
}

function addPoder() {
  abrirFormPoder(-1, "");
}

window.__pmPronto = true;


/* =====================================================================
   MOEDAS (bolsa do personagem)
   1 PL = 10 PO · 1 PO = 2 PE = 10 PP = 100 PC
   ===================================================================== */
var MOEDAS = ["pl", "po", "pe", "pp", "pc"];
var MOEDA_VALOR = { pc: 1, pp: 10, pe: 50, po: 100, pl: 1000 }; // em PC
var MOEDA_NOME = { pl: "Platina", po: "Ouro", pe: "Electrum", pp: "Prata", pc: "Cobre" };
var moedas = { pl: 0, po: 0, pe: 0, pp: 0, pc: 0 };

function normalizarMoedas(m) {
  const r = {};
  MOEDAS.forEach((k) => (r[k] = Math.max(0, parseInt(m && m[k]) || 0)));
  return r;
}

function totalEmPC(m) {
  return MOEDAS.reduce((s, k) => s + (m[k] || 0) * MOEDA_VALOR[k], 0);
}

function formatarPO(pc) {
  const po = pc / 100;
  return po.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

// tira "qtd" moedas do tipo "tipo" de uma bolsa, quebrando moedas maiores se faltar (devolve troco)
function pagarDaBolsa(bolsa, qtd, tipo) {
  const m = normalizarMoedas(bolsa);
  let resta = qtd * MOEDA_VALOR[tipo];
  if (totalEmPC(m) < resta) return null;

  // 1) usa a própria moeda primeiro
  const usaMesma = Math.min(m[tipo], qtd);
  m[tipo] -= usaMesma;
  resta -= usaMesma * MOEDA_VALOR[tipo];

  // 2) usa as outras, das menores pras maiores, sem passar do valor
  const asc = [...MOEDAS].sort((a, b) => MOEDA_VALOR[a] - MOEDA_VALOR[b]);
  for (const c of asc) {
    if (resta <= 0) break;
    const k = Math.min(m[c], Math.floor(resta / MOEDA_VALOR[c]));
    m[c] -= k;
    resta -= k * MOEDA_VALOR[c];
  }

  // 3) se ainda falta, quebra a menor moeda que cubra o resto e devolve troco
  if (resta > 0) {
    const quebra = asc.find((c) => m[c] > 0 && MOEDA_VALOR[c] > resta);
    if (!quebra) return null;
    m[quebra] -= 1;
    let troco = MOEDA_VALOR[quebra] - resta;
    for (const c of ["po", "pp", "pc"]) {
      const k = Math.floor(troco / MOEDA_VALOR[c]);
      m[c] += k;
      troco -= k * MOEDA_VALOR[c];
    }
  }
  return m;
}

// junta moedas pequenas em maiores (cobre → prata → ouro; electrum → ouro)
function organizarBolsa(bolsa) {
  const m = normalizarMoedas(bolsa);
  m.pp += Math.floor(m.pc / 10); m.pc %= 10;
  m.po += Math.floor(m.pp / 10); m.pp %= 10;
  m.po += Math.floor(m.pe / 2); m.pe %= 2;
  return m;
}

// itens antigos tipo "Peças de ouro x190" que podem virar moeda
function detectarMoedasNoInventario() {
  const mapa = { ouro: "po", prata: "pp", cobre: "pc", electrum: "pe", platina: "pl" };
  const achados = [];
  inventario.forEach((item, i) => {
    if (!item || item.recipiente || item.bolsa) return;
    const n = normalizarTipo(item.nome || "").trim();
    let tipo = null;
    const m1 = n.match(/^(pecas?|moedas?)\s+de\s+(ouro|prata|cobre|electrum|platina)$/);
    if (m1) tipo = mapa[m1[2]];
    else if (/^(po|pp|pc|pe|pl)$/.test(n)) tipo = n;
    if (tipo) achados.push({ index: i, tipo, qtd: parseInt(item.qtd) || 1, nome: item.nome });
  });
  return achados;
}







function seletorMoedaHTML(id, padrao) {
  return `<div class="moeda-seletor" id="${id}">${MOEDAS.map(
    (k) => `<button type="button" class="moeda-opt moeda-${k} ${k === padrao ? "ativo" : ""}" data-moeda="${k}" onclick="this.parentElement.querySelectorAll('.moeda-opt').forEach(b=>b.classList.remove('ativo')); this.classList.add('ativo')">${k.toUpperCase()}</button>`,
  ).join("")}</div>`;
}

function lerSeletorMoeda(id) {
  return document.querySelector(`#${id} .moeda-opt.ativo`)?.dataset.moeda || "po";
}







/* =====================================================================
   DADOS
   ===================================================================== */
var historicoRolagens = [];
window._ultimaRolagem = null;

function dado(faces) {
  const arr = new Uint32Array(1);
  (window.crypto || window.msCrypto).getRandomValues(arr);
  return (arr[0] % faces) + 1;
}

// "2d6+3", "1d20 + 1d4 - 1", "8d6" → { total, texto }
function rolarExpressao(expr, dobrarDados) {
  const limpo = String(expr || "").toLowerCase().replace(/\s+/g, "");
  if (!limpo) return null;
  const re = /([+-])?(\d*)d(\d+)|([+-])?(\d+)/g;
  let m, total = 0, partes = [], achouAlgo = false, consumido = 0;
  while ((m = re.exec(limpo))) {
    if (m.index !== consumido) return null; // lixo no meio
    consumido = re.lastIndex;
    achouAlgo = true;
    if (m[3]) {
      const sinal = m[1] === "-" ? -1 : 1;
      let qtd = parseInt(m[2] || "1");
      const faces = parseInt(m[3]);
      if (qtd < 1 || qtd > 100 || faces < 2 || faces > 1000) return null;
      if (dobrarDados) qtd *= 2;
      const vals = Array.from({ length: qtd }, () => dado(faces));
      const soma = vals.reduce((a, b) => a + b, 0);
      total += sinal * soma;
      partes.push(`${sinal < 0 ? "− " : partes.length ? "+ " : ""}${qtd}d${faces} [${vals.join(", ")}]`);
    } else {
      const sinal = m[4] === "-" ? -1 : 1;
      const n = parseInt(m[5]);
      total += sinal * n;
      partes.push(`${sinal < 0 ? "− " : partes.length ? "+ " : ""}${n}`);
    }
  }
  if (!achouAlgo || consumido !== limpo.length) return null;
  return { total, texto: partes.join(" ") };
}

function extrairDados(texto) {
  const m = String(texto || "").match(/(?<![a-zà-ú])\d*\s*d\s*\d+(\s*[+-]\s*\d+(?!\s*d\s*\d))*/i);
  return m ? m[0].replace(/\s+/g, "") : "";
}

function fmtBonus(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}

// teste com d20: rotulo, bonus, modo ("normal" | "vantagem" | "desvantagem")
function rolarD20(rotulo, bonus, modo, extras, composicao) {
  modo = modo || "normal";
  const a = dado(20);
  const b = modo === "normal" ? null : dado(20);
  const escolhido = b == null ? a : modo === "vantagem" ? Math.max(a, b) : Math.min(a, b);
  const descartado = b == null ? null : escolhido === a ? b : a;
  const total = escolhido + bonus;

  const detalhe =
    `d20 <b>${escolhido}</b>` +
    (descartado != null ? ` <s>${descartado}</s>` : "") +
    (composicao ? ` ${composicao}` : bonus ? ` ${bonus >= 0 ? "+" : "−"} ${Math.abs(bonus)}` : "");

  const r = {
    rotulo,
    total,
    detalhe,
    textoSimples: `d20 ${escolhido}${descartado != null ? ` (${descartado})` : ""}${composicao ? ` ${composicao}` : bonus ? ` ${fmtBonus(bonus)}` : ""}`,
    composicao: composicao || "",
    modo,
    nat: escolhido === 20 ? "crit" : escolhido === 1 ? "falha" : "",
    tipo: "d20",
    bonus,
    extras: extras || [],
  };
  registrarRolagem(r);
  return r;
}

function rolarDano(rotulo, expr, critico, extras) {
  const res = rolarExpressao(expr, critico);
  if (!res) {
    alertBonito(`Não entendi "${expr}". Use algo como 2d6+3.`);
    return null;
  }
  const r = {
    rotulo: rotulo + (critico ? " (crítico)" : ""),
    total: res.total,
    detalhe: esc(res.texto),
    textoSimples: res.texto,
    tipo: "expr",
    expr,
    critico: !!critico,
    extras: extras || [],
  };
  registrarRolagem(r);
  return r;
}

function registrarRolagem(r) {
  r.em = Date.now();
  historicoRolagens.unshift(r);
  historicoRolagens = historicoRolagens.slice(0, 25);
  window._ultimaRolagem = r;
  mostrarRolagem(r);
  compartilharRolagem(r);
}

function mostrarRolagem(r) {
  const sheet = document.getElementById("rolagemSheet");
  if (!sheet) return;

  const botoes = [];
  if (r.tipo === "d20") {
    botoes.push(`<button type="button" class="${r.modo === "vantagem" ? "ativo" : ""}" onclick="rerolar('vantagem')">Vantagem</button>`);
    botoes.push(`<button type="button" class="${r.modo === "desvantagem" ? "ativo" : ""}" onclick="rerolar('desvantagem')">Desvantagem</button>`);
    botoes.push(`<button type="button" onclick="rerolar('normal')"><i class="ti ti-refresh"></i> De novo</button>`);
  } else {
    botoes.push(`<button type="button" class="${r.critico ? "ativo" : ""}" onclick="rerolarDano(true)">Crítico</button>`);
    botoes.push(`<button type="button" onclick="rerolarDano(false)"><i class="ti ti-refresh"></i> De novo</button>`);
  }
  (r.extras || []).forEach((e, i) => botoes.push(`<button type="button" class="rs-extra" onclick="executarExtraRolagem(${i})">${e.rotulo}</button>`));

  sheet.innerHTML = `
    <div class="rs-card ${r.nat}">
      <div class="rs-topo">
        <span class="rs-rotulo">${esc(r.rotulo)}</span>
        <button type="button" class="rs-fechar" onclick="fecharRolagem()">×</button>
      </div>
      <div class="rs-total">${r.total}</div>
      <div class="rs-detalhe">${r.detalhe}${r.nat === "crit" ? ` · <b>Crítico!</b>` : r.nat === "falha" ? ` · <b>Falha crítica</b>` : ""}</div>
      <div class="rs-acoes">${botoes.join("")}</div>
    </div>`;
  sheet.style.display = "block";
  sheet.classList.remove("rs-anim");
  void sheet.offsetWidth;
  sheet.classList.add("rs-anim");
}

function fecharRolagem() {
  const sheet = document.getElementById("rolagemSheet");
  if (sheet) sheet.style.display = "none";
}

function rerolar(modo) {
  const r = window._ultimaRolagem;
  if (!r || r.tipo !== "d20") return;
  rolarD20(r.rotulo, r.bonus, modo, r.extras, r.composicao);
}

function rerolarDano(critico) {
  const r = window._ultimaRolagem;
  if (!r || r.tipo !== "expr") return;
  rolarDano(r.rotulo.replace(/ \(crítico\)$/, ""), r.expr, critico, r.extras);
}

function executarExtraRolagem(i) {
  const e = window._ultimaRolagem?.extras?.[i];
  if (e && typeof e.acao === "function") e.acao();
}

/* ---------- atalhos de rolagem na ficha ---------- */
var NOMES_ATRIBUTO = { forca: "Força", destreza: "Destreza", constituicao: "Constituição", inteligencia: "Inteligência", sabedoria: "Sabedoria", carisma: "Carisma" };

function modAtributo(attr) {
  return mod(getAtributoFinal(attr));
}

function rolarAtributo(attr) {
  rolarD20(`Teste de ${NOMES_ATRIBUTO[attr]}`, modAtributo(attr), "normal", [
    { rotulo: "Salvaguarda", acao: () => rolarSalvaguarda(attr) },
  ]);
}

function rolarSalvaguarda(attr) {
  const bonus = modAtributo(attr) + (saves[attr] ? get("bonusProf") : 0);
  rolarD20(`Salvaguarda de ${NOMES_ATRIBUTO[attr]}`, bonus, "normal", [
    { rotulo: "Teste", acao: () => rolarAtributo(attr) },
  ]);
}

function rolarPericia(nome) {
  const p = pericias.find((x) => x.nome === nome);
  if (!p) return;
  const nivel = profs[nome] || 0;
  const bonus = modAtributo(p.attr) + (nivel === 1 ? get("bonusProf") : nivel === 2 ? get("bonusProf") * 2 : 0);
  rolarD20(nome, bonus);
}

function rolarIniciativa() {
  rolarD20("Iniciativa", modAtributo("destreza"));
}

function rolarAtaqueArma(index, attr) {
  const arma = armas[index];
  if (!arma) return;
  attr = attr || "forca";
  const bonus = modAtributo(attr) + get("bonusProf");
  const outro = attr === "forca" ? "destreza" : "forca";
  const extras = [{ rotulo: `Usar ${outro === "forca" ? "FOR" : "DES"}`, acao: () => rolarAtaqueArma(index, outro) }];
  if (extrairDados(arma.dano)) extras.push({ rotulo: "Dano", acao: () => rolarDanoArma(index, attr) });
  rolarD20(`Ataque · ${arma.nome || "arma"}`, bonus, "normal", extras);
}

function rolarDanoArma(index, attr) {
  const arma = armas[index];
  const expr = extrairDados(arma?.dano);
  if (!expr) return;
  rolarDano(`Dano · ${arma.nome || "arma"}`, expr, false, [
    { rotulo: "Ataque", acao: () => rolarAtaqueArma(index, attr) },
  ]);
}

function rolarAtaqueMagico() {
  const atr = parseInt(document.getElementById("dtAtributo")?.value) || 0;
  const prof = parseInt(document.getElementById("dtProf")?.value) || 0;
  rolarD20("Ataque mágico", atr + prof);
}

function rolarDanoPoder(index) {
  const p = poderes[index];
  const expr = extrairDados(p?.dano);
  if (!expr) return;
  rolarDano(p.nome || "Poder", expr, false);
}

/* ---------- bandeja de dados ---------- */
function abrirBandejaDados() {
  const compart = lerPrefCompartilhar();
  const html = `
    <div class="bandeja">
      <div class="bandeja-dados">
        ${[4, 6, 8, 10, 12, 20, 100]
          .map((f) => `<button type="button" class="bd-dado" onclick="adicionarDadoBandeja(${f})"><span>d${f}</span></button>`)
          .join("")}
      </div>
      <div class="bandeja-linha">
        <input id="bandejaExpr" placeholder="Ex: 2d6+3" autocomplete="off" onkeydown="if(event.key==='Enter') rolarBandeja()">
        <button type="button" class="bd-limpar" onclick="document.getElementById('bandejaExpr').value=''" title="Limpar"><i class="ti ti-backspace"></i></button>
      </div>
      <button type="button" class="bandeja-rolar" onclick="rolarBandeja()">🎲 Rolar</button>
      <div class="bandeja-rapidos">
        <button type="button" onclick="rolarIniciativa()">Iniciativa</button>
        <button type="button" onclick="rolarD20('d20', 0, 'vantagem')">d20 vantagem</button>
        <button type="button" onclick="rolarD20('d20', 0, 'desvantagem')">d20 desvantagem</button>
      </div>

      <label class="bandeja-compart">
        <input type="checkbox" ${compart ? "checked" : ""} onchange="salvarPrefCompartilhar(this.checked)">
        <span>Mostrar minhas rolagens pro grupo</span>
      </label>
      <label class="bandeja-compart">
        <input type="checkbox" ${lerPrefAvisosGrupo() ? "checked" : ""} onchange="salvarPrefAvisosGrupo(this.checked)">
        <span>Avisos das rolagens dos outros</span>
      </label>

      <div class="bandeja-abas">
        <button type="button" class="ativo" onclick="trocarAbaBandeja('minhas', this)">Minhas</button>
        <button type="button" onclick="trocarAbaBandeja('grupo', this)">Grupo</button>
      </div>
      <div id="bandejaHistorico" class="bandeja-hist"></div>
    </div>`;
  abrirPopup("Dados", html, true, null);
  window._abaBandeja = "minhas";
  renderHistoricoBandeja();
}

function adicionarDadoBandeja(faces) {
  const input = document.getElementById("bandejaExpr");
  if (!input) return;
  const v = input.value.replace(/\s+/g, "");
  // se o último termo já é do mesmo dado, soma 1 (d6 → 2d6)
  const re = new RegExp(`(^|[+-])(\\d*)d${faces}$`);
  const m = v.match(re);
  if (m) {
    const n = (parseInt(m[2] || "1") || 1) + 1;
    input.value = v.slice(0, v.length - m[0].length) + `${m[1]}${n}d${faces}`;
  } else {
    input.value = v ? `${v}+1d${faces}` : `1d${faces}`;
  }
}

function rolarBandeja() {
  const expr = document.getElementById("bandejaExpr")?.value || "";
  if (!expr.trim()) return;
  // d20 sozinho com modificador → rolagem de teste (com vantagem/desvantagem)
  const m = expr.replace(/\s+/g, "").toLowerCase().match(/^1?d20([+-]\d+)?$/);
  if (m) rolarD20("d20", parseInt(m[1] || "0"));
  else rolarDano(expr.replace(/\s+/g, ""), expr, false);
  renderHistoricoBandeja();
}

function trocarAbaBandeja(aba, btn) {
  window._abaBandeja = aba;
  btn.parentElement.querySelectorAll("button").forEach((b) => b.classList.remove("ativo"));
  btn.classList.add("ativo");
  renderHistoricoBandeja();
}

function renderHistoricoBandeja() {
  const box = document.getElementById("bandejaHistorico");
  if (!box) return;
  if (window._abaBandeja === "grupo") {
    const feed = window._feedRolagensGrupo || [];
    box.innerHTML = !personagens[personagemAtual]?.grupoAtivo
      ? `<p class="pm-vazio">Essa ficha não está num grupo.</p>`
      : feed.length
        ? feed
            .map(
              (r) => `<div class="bh-linha ${r.nat || ""}"><span class="bh-quem">${esc(r.personagem || "Alguém")}</span><span class="bh-rot">${esc(r.rotulo)}</span><b>${r.total}</b><small>${tempoRelativo(r.em)}</small></div>`,
            )
            .join("")
        : `<p class="pm-vazio">Nenhuma rolagem do grupo ainda.</p>`;
    return;
  }
  box.innerHTML = historicoRolagens.length
    ? historicoRolagens
        .map(
          (r) => `<div class="bh-linha ${r.nat || ""}"><span class="bh-rot">${esc(r.rotulo)}</span><small class="bh-det">${esc(r.textoSimples)}</small><b>${r.total}</b></div>`,
        )
        .join("")
    : `<p class="pm-vazio">Nenhuma rolagem ainda.</p>`;
}

function lerPrefCompartilhar() {
  try {
    return localStorage.getItem("compartilharRolagens") !== "0";
  } catch (e) {
    return true;
  }
}

function salvarPrefCompartilhar(v) {
  try {
    localStorage.setItem("compartilharRolagens", v ? "1" : "0");
  } catch (e) {}
}

function tempoRelativo(ms) {
  const s = Math.max(0, Math.round((Date.now() - (ms || 0)) / 1000));
  if (s < 45) return "agora";
  const min = Math.round(s / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? "dia" : "dias"}`;
}

/* ---------- rolagens compartilhadas com o grupo ---------- */
async function compartilharRolagem(r) {
  try {
    const ficha = personagens[personagemAtual];
    if (!ficha?.grupoAtivo || !window.usuarioAtual || !window.addDoc || !lerPrefCompartilhar()) return;
    await addDoc(collection(db, "grupos", ficha.grupoAtivo, "rolagens"), {
      uid: window.usuarioAtual.uid,
      personagem: ficha.nome || "Sem nome",
      rotulo: r.rotulo,
      total: r.total,
      detalhe: r.textoSimples || "",
      nat: r.nat || "",
      em: r.em || Date.now(),
    });
  } catch (e) {
    console.warn("Não deu pra compartilhar a rolagem:", e.code || e.message);
  }
}

window._unsubRolagens = null;
window._rolagensGrupoId = null;
window._feedRolagensGrupo = [];

// escuta as rolagens do grupo (jogador pela ficha; mestre pelo painel do grupo)
function escutarRolagensGrupo(grupoId) {
  if (window._rolagensGrupoId === grupoId) return;
  if (window._unsubRolagens) window._unsubRolagens();
  window._unsubRolagens = null;
  window._rolagensGrupoId = grupoId || null;
  window._feedRolagensGrupo = [];
  if (!grupoId || !window.usuarioAtual || !window.orderBy) return;

  const inicio = Date.now();
  try {
    const q = query(collection(db, "grupos", grupoId, "rolagens"), orderBy("em", "desc"), limit(20));
    window._unsubRolagens = onSnapshot(
      q,
      (snap) => {
        window._feedRolagensGrupo = snap.docs.map((d) => d.data());
        snap.docChanges().forEach((ch) => {
          if (ch.type !== "added") return;
          const r = ch.doc.data();
          if (r.uid === window.usuarioAtual?.uid || (r.em || 0) < inicio) return;
          toastRolagemGrupo(r);
        });
        if (window._abaBandeja === "grupo") renderHistoricoBandeja();
      },
      (err) => console.warn("Rolagens do grupo:", err.code || err.message),
    );
  } catch (e) {
    console.warn(e);
  }
}

function lerPrefAvisosGrupo() {
  try {
    return localStorage.getItem("avisosRolagensGrupo") !== "0";
  } catch (e) {
    return true;
  }
}

function salvarPrefAvisosGrupo(v) {
  try {
    localStorage.setItem("avisosRolagensGrupo", v ? "1" : "0");
  } catch (e) {}
  if (!v) document.querySelectorAll(".toast-rolagem").forEach((t) => t.remove());
}

function toastRolagemGrupo(r) {
  // desligado: as rolagens continuam na aba "Grupo" da bandeja, só não aparece o aviso
  if (!lerPrefAvisosGrupo()) return;
  const t = document.createElement("div");
  t.className = "toast-rolagem " + (r.nat || "");
  t.innerHTML = `<span>🎲 <b>${esc(r.personagem || "Alguém")}</b> · ${esc(r.rotulo)}</span><strong>${r.total}</strong>`;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("sair"), 3600);
  setTimeout(() => t.remove(), 4100);
}

/* =====================================================================
   VEÍCULOS (compartilhados com o grupo, tempo real, sem o mestre)
   grupos/{g}/veiculos/{v}            → dados do veículo + cofre
   grupos/{g}/veiculos/{v}/itens/{i}  → um item por documento
   grupos/{g}/veiculos/{v}/historico  → quem fez o quê
   ===================================================================== */


window._veic = {
  gid: null,
  status: "",
  unsubLista: null,
  unsubItens: {},
  unsubHist: null,
  lista: [],
  itens: {},
  hist: [],
  aberto: null,
};

function veicRef(vid) {
  return doc(db, "grupos", window._veic.gid, "veiculos", vid);
}
function veicItensCol(vid) {
  return collection(db, "grupos", window._veic.gid, "veiculos", vid, "itens");
}
function veicHistCol(vid) {
  return collection(db, "grupos", window._veic.gid, "veiculos", vid, "historico");
}

function meuNomeVeiculo() {
  return personagens[personagemAtual]?.nome || "Alguém";
}

function pararEscutasVeiculos() {
  const v = window._veic;
  if (v.unsubLista) v.unsubLista();
  Object.values(v.unsubItens).forEach((u) => u());
  if (v.unsubHist) v.unsubHist();
  window._veic = { gid: null, status: "", unsubLista: null, unsubItens: {}, unsubHist: null, lista: [], itens: {}, hist: [], aberto: null };
}

async function abrirAbaVeiculos() {
  const ficha = personagens[personagemAtual];
  const gid = ficha?.grupoAtivo || null;

  if (!window.usuarioAtual) {
    window._veic.status = "login";
    renderVeiculos();
    return;
  }
  if (!gid) {
    pararEscutasVeiculos();
    window._veic.status = "semgrupo";
    renderVeiculos();
    return;
  }
  if (window._veic.gid === gid && window._veic.status === "ok") {
    renderVeiculos();
    return;
  }

  pararEscutasVeiculos();
  window._veic.gid = gid;
  window._veic.status = "carregando";
  renderVeiculos();

  try {
    const gSnap = await getDoc(doc(db, "grupos", gid));
    if (!gSnap.exists()) {
      window._veic.status = "semgrupo";
      renderVeiculos();
      return;
    }
    const g = gSnap.data();
    const uid = window.usuarioAtual.uid;
    const souMestre = g.criadoPor === uid || (g.mestresUids || []).includes(uid);
    window._veic.nomeGrupo = g.nome || "grupo";
    if (souMestre) {
      window._veic.status = "mestre";
      renderVeiculos();
      return;
    }

    window._veic.status = "ok";
    window._veic.unsubLista = onSnapshot(
      collection(db, "grupos", gid, "veiculos"),
      (snap) => {
        window._veic.lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.criadoEm || 0) - (b.criadoEm || 0));
        sincronizarEscutasItens();
        if (window._veic.aberto && !window._veic.lista.some((x) => x.id === window._veic.aberto)) {
          window._veic.aberto = null;
        }
        renderVeiculos();
      },
      (err) => {
        console.warn("Veículos:", err);
        window._veic.status = "erro";
        window._veic.erro = err.code || err.message;
        renderVeiculos();
      },
    );
  } catch (e) {
    console.warn(e);
    window._veic.status = "erro";
    window._veic.erro = e.code || e.message;
    renderVeiculos();
  }
}

function sincronizarEscutasItens() {
  const v = window._veic;
  const ids = new Set(v.lista.map((x) => x.id));
  Object.keys(v.unsubItens).forEach((id) => {
    if (!ids.has(id)) {
      v.unsubItens[id]();
      delete v.unsubItens[id];
      delete v.itens[id];
    }
  });
  ids.forEach((id) => {
    if (v.unsubItens[id]) return;
    v.unsubItens[id] = onSnapshot(veicItensCol(id), (snap) => {
      v.itens[id] = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
      renderVeiculos();
    });
  });
}

function escutarHistorico(vid) {
  const v = window._veic;
  if (v.unsubHist) v.unsubHist();
  v.unsubHist = null;
  v.hist = [];
  if (!vid) return;
  v.unsubHist = onSnapshot(query(veicHistCol(vid), orderBy("em", "desc"), limit(30)), (snap) => {
    v.hist = snap.docs.map((d) => d.data());
    renderVeiculos();
  });
}

async function registrarHistorico(vid, texto) {
  try {
    await addDoc(veicHistCol(vid), { texto, uid: window.usuarioAtual.uid, nome: meuNomeVeiculo(), em: Date.now() });
  } catch (e) {
    console.warn("Histórico:", e.code || e.message);
  }
}

function unidadesNoVeiculo(vid) {
  return (window._veic.itens[vid] || []).reduce((s, it) => s + (parseInt(it.qtd) || 1), 0);
}

/* ---------- render ---------- */








function abrirVeiculo(vid) {
  window._veic.aberto = vid;
  escutarHistorico(vid);
  renderVeiculos();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fecharVeiculo() {
  window._veic.aberto = null;
  escutarHistorico(null);
  renderVeiculos();
}



/* ---------- criar / editar / apagar ---------- */
window._veicImagemTemp = "";



function previewImagemVeiculo(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    window._veicImagemTemp = reader.result;
    const img = document.getElementById("vImagemPreview");
    if (img) {
      img.src = reader.result;
      img.style.display = "block";
    }
  };
  reader.readAsDataURL(f);
}

async function salvarVeiculo(vid) {
  const nome = document.getElementById("vNome")?.value.trim();
  if (!nome) {
    document.getElementById("vNome")?.focus();
    return;
  }
  const btn = document.getElementById("vSalvar");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Salvando...";
  }

  const pvMax = Math.max(0, parseInt(document.getElementById("vPvMax").value) || 0);
  const dados = {
    nome,
    tipo: document.getElementById("vTipo")?.dataset.valor || "carroca",
    pvMax,
    ca: document.getElementById("vCA").value.trim(),
    desloc: document.getElementById("vDesloc").value.trim(),
    capacidade: Math.max(0, parseInt(document.getElementById("vCap").value) || 0),
  };

  if (window._veicImagemTemp) {
    const up = await uploadImagemFirebase(window._veicImagemTemp, "veiculo");
    if (up.url) dados.imagemUrl = up.url;
    else alertBonito(_mensagemErroUpload("O veículo vai ser salvo sem a imagem nova."));
  }

  try {
    if (vid) {
      const atual = window._veic.lista.find((x) => x.id === vid) || {};
      if (pvMax && (atual.pv == null || atual.pv > pvMax)) dados.pv = pvMax;
      await updateDoc(veicRef(vid), dados);
      registrarHistorico(vid, "editou o veículo");
    } else {
      const novo = {
        ...dados,
        pv: pvMax,
        moedas: { pl: 0, po: 0, pe: 0, pp: 0, pc: 0 },
        criadoPor: window.usuarioAtual.uid,
        criadoPorNome: meuNomeVeiculo(),
        criadoEm: Date.now(),
      };
      const ref = await addDoc(collection(db, "grupos", window._veic.gid, "veiculos"), novo);
      registrarHistorico(ref.id, "criou o veículo");
    }
    fecharPopup();
    mostrarToastMundo(vid ? "Veículo salvo" : "Veículo criado");
  } catch (e) {
    console.error(e);
    alertBonito("Não consegui salvar o veículo. " + (e.code === "permission-denied" ? "As regras do Firebase ainda não liberam veículos." : ""));
    if (btn) {
      btn.disabled = false;
      btn.textContent = vid ? "Salvar" : "Criar veículo";
    }
  }
}

async function apagarVeiculo(vid) {
  const veic = window._veic.lista.find((x) => x.id === vid);
  if (!veic) return;
  const itens = window._veic.itens[vid] || [];
  const m = totalEmPC(normalizarMoedas(veic.moedas));
  if (itens.length || m) {
    alertBonito("Esvazie o veículo antes de apagar (itens e cofre), pra ninguém perder nada.");
    return;
  }
  if (!(await confirmBonito(`Apagar "${veic.nome}"? Isso some pra todo mundo do grupo.`))) return;
  try {
    const hist = await getDocs(veicHistCol(vid));
    const batch = writeBatch(db);
    hist.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(veicRef(vid));
    await batch.commit();
    window._veic.aberto = null;
    escutarHistorico(null);
    mostrarToastMundo("Veículo apagado");
  } catch (e) {
    console.error(e);
    alertBonito("Não consegui apagar. Só quem criou o veículo pode apagar.");
  }
}

/* ---------- PV ---------- */
async function alterarPVVeiculo(vid, delta) {
  try {
    let antes = 0, depois = 0;
    await runTransaction(db, async (t) => {
      const s = await t.get(veicRef(vid));
      if (!s.exists()) return;
      const d = s.data();
      antes = d.pv ?? d.pvMax ?? 0;
      depois = Math.max(0, Math.min(d.pvMax || 0, antes + delta));
      t.update(veicRef(vid), { pv: depois });
    });
    // agrupa cliques rápidos num registro só
    clearTimeout(window._veicPvTimer);
    window._veicPvInicio = window._veicPvInicio ?? antes;
    window._veicPvTimer = setTimeout(() => {
      if (window._veicPvInicio !== depois) registrarHistorico(vid, `mudou o PV: ${window._veicPvInicio} → ${depois}`);
      window._veicPvInicio = null;
    }, 1500);
  } catch (e) {
    console.warn(e);
  }
}

async function alterarPVVeiculoValor(vid) {
  const v = await promptBonito("Dano (ex: -12) ou cura (ex: 8):", "");
  const n = parseInt(v);
  if (!n) return;
  alterarPVVeiculo(vid, n);
}

/* ---------- cofre ---------- */




/* ---------- itens ---------- */
function chaveMesclagem(tipoItem, item) {
  // itens "simples" e iguais se juntam numa pilha só (ex: 3 cordas + 2 cordas)
  if (tipoItem !== "inventario") return null;
  if (item.bolsa || item.imagemUrl || (item.modificacoes && item.modificacoes.length) || item.requerSintonia) return null;
  const base = `${normalizarTipo(item.nome || "")}|${normalizarTipo(item.desc || "")}`;
  let h = 5381;
  for (let i = 0; i < base.length; i++) h = ((h << 5) + h + base.charCodeAt(i)) >>> 0;
  return "m_" + h.toString(36);
}

function abrirColocarNoVeiculo(vid) {
  const veic = window._veic.lista.find((x) => x.id === vid);
  if (!veic) return;
  window._colocarVeic = { vid, sel: new Set() };

  const grupos = [
    ["inventario", "Inventário", inventario.map((it, i) => ({ it, i })).filter(({ it }) => it && !it.recipiente)],
    ["armas", "Armas", armas.map((it, i) => ({ it, i }))],
    ["armaduras", "Armaduras", armaduras.map((it, i) => ({ it, i }))],
  ];

  const corpo = grupos
    .filter(([, , l]) => l.length)
    .map(
      ([tipo, titulo, l]) => `
      <div class="pm-secao-titulo"><span>${titulo}</span><small>${l.length}</small></div>
      ${l
        .map(
          ({ it, i }) => `
        <button type="button" class="mochila-linha colocar-linha" data-chave="${tipo}:${i}" onclick="alternarColocarVeiculo(this)">
          <span class="sel-check"><i class="ti ti-check"></i></span>
          <span class="mochila-linha-nome">${esc(it.nome || "Sem nome")}${(it.qtd || 1) > 1 ? ` <small>x${it.qtd}</small>` : ""}</span>
        </button>`,
        )
        .join("")}`,
    )
    .join("");

  const livre = veic.capacidade > 0 ? veic.capacidade - unidadesNoVeiculo(vid) : null;
  const html = `
    <div class="mochila-painel">
      ${livre != null ? `<p class="pm-dica">Espaço livre: <b>${Math.max(0, livre)}</b> ${livre === 1 ? "item" : "itens"}.</p>` : ""}
      ${corpo || `<p class="pm-vazio">Você não tem itens pra colocar.</p>`}
      <button class="popup-salvar-btn" id="btnConfirmarVeic" onclick="confirmarColocarNoVeiculo()" disabled>Colocar</button>
    </div>`;
  abrirPopup(`Colocar em ${veic.nome}`, html, true, null);
}

function alternarColocarVeiculo(btn) {
  const s = window._colocarVeic?.sel;
  if (!s) return;
  const k = btn.dataset.chave;
  if (s.has(k)) s.delete(k);
  else s.add(k);
  btn.classList.toggle("selecionada", s.has(k));
  btn.querySelector(".sel-check")?.classList.toggle("ativo", s.has(k));
  const ok = document.getElementById("btnConfirmarVeic");
  if (ok) {
    ok.disabled = !s.size;
    ok.textContent = s.size ? `Colocar ${s.size} ${s.size === 1 ? "item" : "itens"}` : "Colocar";
  }
}

async function confirmarColocarNoVeiculo() {
  const ctx = window._colocarVeic;
  if (!ctx || !ctx.sel.size) return;
  const veic = window._veic.lista.find((x) => x.id === ctx.vid);
  if (!veic) return;

  const fontes = { inventario, armas, armaduras };
  const escolhidos = [...ctx.sel].map((k) => {
    const [tipo, i] = k.split(":");
    return { tipo, i: parseInt(i), item: fontes[tipo][parseInt(i)] };
  }).filter((x) => x.item);

  const unidades = escolhidos.reduce((s, x) => s + (x.tipo === "inventario" ? parseInt(x.item.qtd) || 1 : 1), 0);
  if (veic.capacidade > 0 && unidadesNoVeiculo(ctx.vid) + unidades > veic.capacidade) {
    const livre = Math.max(0, veic.capacidade - unidadesNoVeiculo(ctx.vid));
    if (!(await confirmBonito(`${veic.nome} só tem espaço pra mais ${livre} ${livre === 1 ? "item" : "itens"} e você está colocando ${unidades}. Colocar mesmo assim?`))) return;
  }

  const btn = document.getElementById("btnConfirmarVeic");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Colocando...";
  }

  const feitos = [];
  for (const x of escolhidos) {
    const { id, dentroDe, ...limpo } = x.item;
    const qtd = x.tipo === "inventario" ? parseInt(limpo.qtd) || 1 : 1;
    const chave = chaveMesclagem(x.tipo, limpo);
    try {
      if (chave) {
        const ref = doc(veicItensCol(ctx.vid), chave);
        await runTransaction(db, async (t) => {
          const s = await t.get(ref);
          if (s.exists()) t.update(ref, { qtd: (s.data().qtd || 1) + qtd, em: Date.now() });
          else t.set(ref, { nome: limpo.nome || "Sem nome", qtd, tipoItem: x.tipo, item: { ...limpo, qtd: 1 }, colocadoPor: window.usuarioAtual.uid, colocadoPorNome: meuNomeVeiculo(), em: Date.now() });
        });
      } else {
        await addDoc(veicItensCol(ctx.vid), { nome: limpo.nome || "Sem nome", qtd, tipoItem: x.tipo, item: limpo, colocadoPor: window.usuarioAtual.uid, colocadoPorNome: meuNomeVeiculo(), em: Date.now() });
      }
      feitos.push(x);
    } catch (e) {
      console.error(e);
    }
  }

  // tira da ficha só o que foi mesmo pro veículo (de trás pra frente pra não bagunçar os índices)
  ["inventario", "armas", "armaduras"].forEach((tipo) => {
    feitos
      .filter((x) => x.tipo === tipo)
      .sort((a, b) => b.i - a.i)
      .forEach((x) => fontes[tipo].splice(x.i, 1));
  });
  renderInv();
  renderArmas();
  renderArmaduras();
  salvarTudo();

  if (feitos.length) {
    const desc = feitos.map((x) => `${(x.item.qtd || 1) > 1 && x.tipo === "inventario" ? `${x.item.qtd}× ` : ""}${x.item.nome || "item"}`).join(", ");
    registrarHistorico(ctx.vid, `colocou ${desc}`);
  }
  fecharPopup();
  if (feitos.length < escolhidos.length) alertBonito("Alguns itens não foram colocados. Tenta de novo.");
}

function verItemVeiculo(vid, iid) {
  const it = (window._veic.itens[vid] || []).find((x) => x.id === iid);
  if (!it) return;
  const d = it.item || {};
  const html = popupVerHTML({
    imagem: d.imagemUrl,
    infos: [
      ["Quantidade", `x${it.qtd || 1}`, true],
      ["Dano", it.tipoItem === "armas" ? esc(d.dano || "") : ""],
      ["CA", it.tipoItem === "armaduras" ? esc(d.ca || "") : ""],
      ["Colocado por", esc(it.colocadoPorNome || "")],
    ],
    mods: d.modificacoes,
    desc: d.desc,
    acoes: `<button type="button" class="pv-principal" onclick="fecharPopup(); tirarDoVeiculo('${vid}', '${iid}')"><i class="ti ti-arrow-bar-up"></i><span>Pegar pra mim</span></button>`,
  });
  abrirPopup(it.nome || "Item", html, true, null);
}

async function tirarDoVeiculo(vid, iid) {
  const it = (window._veic.itens[vid] || []).find((x) => x.id === iid);
  if (!it) return;

  let quantos = 1;
  if ((it.qtd || 1) > 1) {
    const r = await promptBonito(`Quantos "${it.nome}" você quer pegar? (tem ${it.qtd})`, String(it.qtd));
    if (r == null) return;
    quantos = Math.max(1, Math.min(it.qtd, parseInt(r) || 0));
    if (!parseInt(r)) return;
  }

  let dados = null;
  try {
    const ref = doc(veicItensCol(vid), iid);
    await runTransaction(db, async (t) => {
      const s = await t.get(ref);
      if (!s.exists()) throw new Error("sumiu");
      const d = s.data();
      const tem = d.qtd || 1;
      if (quantos > tem) quantos = tem;
      if (quantos >= tem) t.delete(ref);
      else t.update(ref, { qtd: tem - quantos });
      dados = d;
    });
  } catch (e) {
    alertBonito(e.message === "sumiu" ? "Alguém já pegou esse item." : "Não consegui pegar agora. Tenta de novo.");
    return;
  }

  const base = { ...(dados.item || {}), nome: dados.item?.nome || dados.nome };
  if (dados.tipoItem === "armas") armas.push(base);
  else if (dados.tipoItem === "armaduras") armaduras.push(base);
  else {
    // se já tenho um igual solto no inventário, junta
    const igual = inventario.find(
      (x) => x && !x.recipiente && !x.dentroDe && chaveMesclagem("inventario", x) && chaveMesclagem("inventario", x) === chaveMesclagem("inventario", base),
    );
    if (igual) igual.qtd = (parseInt(igual.qtd) || 1) + quantos;
    else inventario.push({ ...base, id: gerarIdItem(), qtd: quantos, dentroDe: "" });
  }

  renderInv();
  renderArmas();
  renderArmaduras();
  salvarTudo();
  registrarHistorico(vid, `pegou ${quantos > 1 ? `${quantos}× ` : ""}${dados.nome}`);
  mostrarToastMundo(`${quantos > 1 ? `${quantos}× ` : ""}${dados.nome} foi pra sua ficha`);
}

// ícones desenhados (traço dourado, combinam com o app)
var ICONES_VEICULO = {
  carroca: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 26V18c0-6 7-10 16-10s16 4 16 10v8"/><path d="M16 10.5V26M24 8v18M32 10.5V26"/><path d="M5 26h38l-2 6H7z"/><circle cx="14" cy="37" r="5"/><circle cx="34" cy="37" r="5"/><path d="M14 37h.01M34 37h.01"/><path d="M43 29l3 0"/></svg>`,
  carruagem: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 28V16a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v12"/><path d="M14 18h7v7h-7zM25 18h5v7h-5z"/><path d="M6 28h34l-2 5H8z"/><path d="M22 12V8M19 8h6"/><circle cx="13" cy="38" r="4.5"/><circle cx="33" cy="38" r="4.5"/><path d="M40 30h5"/></svg>`,
  barco: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6v26"/><path d="M24 8l13 20H24"/><path d="M24 12L13 28h11"/><path d="M6 32h36l-5 8H11z"/><path d="M4 44c3 0 3-2 6-2s3 2 6 2 3-2 6-2 3 2 6 2 3-2 6-2 3 2 6 2"/></svg>`,
  navio: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M16 6v24M32 9v21"/><path d="M10 10h12v8H10zM27 12h10v7H27z"/><path d="M10 22h12M27 23h10"/><path d="M4 30h40l-6 9H10z"/><path d="M38 30l4-6"/><path d="M4 44c3 0 3-2 6-2s3 2 6 2 3-2 6-2 3 2 6 2 3-2 6-2 3 2 6 2"/></svg>`,
  montaria: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 40c-4-5-6-10-6-16C8 14 15 7 24 7s16 7 16 17c0 6-2 11-6 16"/><path d="M18 40c-3-4-4-9-4-16 0-6 4-11 10-11s10 5 10 11c0 7-1 12-4 16"/><path d="M11 18h.01M37 18h.01M9 28h.01M39 28h.01"/></svg>`,
  voadora: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 30c-4-8-12-12-20-12 3 4 4 8 4 12 5-1 10 0 16 4"/><path d="M24 30c4-8 12-12 20-12-3 4-4 8-4 12-5-1-10 0-16 4"/><path d="M24 34v6M21 42h6"/><path d="M12 22c2 1 4 3 5 5M36 22c-2 1-4 3-5 5"/><circle cx="24" cy="24" r="3"/></svg>`,
  aeronave: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="24" cy="15" rx="16" ry="9"/><path d="M8 15h32M24 6c-5 3-5 15 0 18M24 6c5 3 5 15 0 18"/><path d="M40 15l5-4v8z"/><path d="M18 23l-2 9M30 23l2 9"/><path d="M15 32h18l-2 7H17z"/></svg>`,
  outro: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h34v20H7z"/><path d="M7 20c0-7 7-12 17-12s17 5 17 12"/><path d="M7 27h34"/><path d="M21 24h6v7h-6z"/><path d="M15 9v11M33 9v11"/></svg>`,
};

var TIPOS_VEICULO = {
  carroca: ["Carroça", ""],
  carruagem: ["Carruagem", ""],
  montaria: ["Montaria", ""],
  barco: ["Barco", ""],
  navio: ["Navio", ""],
  aeronave: ["Dirigível", ""],
  voadora: ["Montaria voadora", ""],
  outro: ["Outro", ""],
};

function iconeVeiculo(tipo) {
  return ICONES_VEICULO[tipo] || ICONES_VEICULO.outro;
}

function medalhaoVeiculo(veic, grande) {
  return `<div class="veic-medalhao ${grande ? "grande" : ""}">${
    veic.imagemUrl ? `<img src="${esc(veic.imagemUrl)}" alt="">` : `<span class="veic-medalhao-ic">${iconeVeiculo(veic.tipo)}</span>`
  }</div>`;
}

function medidorVeiculo(icone, rotulo, atual, max, classe) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0;
  return `
    <div class="veic-medidor ${classe || ""}">
      <div class="veic-medidor-topo"><span><i class="ti ${icone}"></i> ${rotulo}</span><b>${atual}${max > 0 ? `<small>/${max}</small>` : ""}</b></div>
      ${max > 0 ? `<div class="veic-medidor-barra"><div style="width:${pct}%"></div></div>` : ""}
    </div>`;
}

function classeCapacidade(veic) {
  if (!(veic.capacidade > 0)) return "";
  const u = unidadesNoVeiculo(veic.id);
  return u >= veic.capacidade ? "lotado" : u / veic.capacidade >= 0.8 ? "quase" : "";
}

function medidoresVeiculo(veic) {
  const out = [];
  if (veic.pvMax > 0) {
    const pv = veic.pv ?? veic.pvMax;
    out.push(medidorVeiculo("ti-heart", "PV", pv, veic.pvMax, "pv" + (pv / veic.pvMax <= 0.25 ? " critico" : "")));
  }
  const cls = classeCapacidade(veic);
  out.push(medidorVeiculo("ti-package", cls === "lotado" ? "Lotado" : "Carga", unidadesNoVeiculo(veic.id), veic.capacidade || 0, "carga " + cls));
  return out.join("");
}

function renderVeiculos() {
  const box = document.getElementById("veiculosConteudo");
  if (!box) return;
  const v = window._veic;

  const aviso = (icone, titulo, texto) =>
    `<div class="veic-aviso"><div class="veic-aviso-icone">${icone}</div><strong>${titulo}</strong><p>${texto}</p></div>`;

  if (v.status === "login") return (box.innerHTML = aviso('<i class="ti ti-lock"></i>', "Entre na sua conta", "Os veículos ficam salvos no grupo, então é preciso estar logado."));
  if (v.status === "semgrupo")
    return (box.innerHTML = aviso(iconeVeiculo("carroca"), "Essa ficha não está num grupo", "Vá em <b>Amigos → Grupos</b>, abra o grupo e escolha essa ficha. Aí todo mundo do grupo divide os mesmos veículos, em tempo real."));
  if (v.status === "mestre")
    return (box.innerHTML = aviso('<i class="ti ti-shield"></i>', "Só para jogadores", "Os veículos são do grupo de jogadores. Como você é mestre desse grupo, eles não aparecem pra você."));
  if (v.status === "erro")
    return (box.innerHTML = aviso('<i class="ti ti-alert-triangle"></i>', "Não consegui abrir os veículos", `Confira se as regras do Firebase foram atualizadas. <small>(${esc(v.erro || "")})</small>`));
  if (v.status === "carregando" || v.status === "") return (box.innerHTML = `<p class="veic-vazio">Carregando veículos...</p>`);

  if (v.aberto) return renderDetalheVeiculo(box, v.lista.find((x) => x.id === v.aberto));

  const cards = v.lista.map((veic) => cardVeiculoHTML(veic)).join("");
  box.innerHTML = `
    <div class="veic-grupo-chip"><i class="ti ti-users"></i> <span>${esc(v.nomeGrupo || "Grupo")}</span><small><span class="veic-ao-vivo"></span> ao vivo</small></div>
    <div class="veic-lista">${
      cards ||
      `<div class="veic-aviso veic-aviso-vazio"><div class="veic-aviso-icone">${iconeVeiculo("carroca")}</div><strong>Nenhum veículo ainda</strong><p>Crie a carroça, o barco ou a montaria do grupo. Todo mundo vê e mexe junto.</p></div>`
    }</div>
    <button type="button" class="inv-add-btn btn-adicionar" onclick="abrirFormVeiculo()"><i class="ti ti-plus"></i><span>Adicionar veículo</span></button>`;
}

function cardVeiculoHTML(veic) {
  const tipo = TIPOS_VEICULO[veic.tipo] || TIPOS_VEICULO.outro;
  const itens = window._veic.itens[veic.id] || [];
  const chips = itens.length
    ? itens
        .slice(0, 4)
        .map((it) => `<span class="recipiente-chip">${esc(it.nome)}${(it.qtd || 1) > 1 ? ` <small>x${it.qtd}</small>` : ""}</span>`)
        .join("") + (itens.length > 4 ? `<span class="recipiente-chip recipiente-chip-mais">+${itens.length - 4}</span>` : "")
    : `<span class="recipiente-vazio">Vazio</span>`;
  const moedasTot = totalEmPC(normalizarMoedas(veic.moedas));

  return `
    <div class="veic-card" onclick="abrirVeiculo('${veic.id}')">
      <div class="veic-card-topo">
        ${medalhaoVeiculo(veic)}
        <div class="veic-card-nome">
          <strong>${esc(veic.nome || "Sem nome")}</strong>
          <span><span class="veic-tipo-ic">${iconeVeiculo(veic.tipo)}</span>${tipo[0]}${moedasTot ? ` · <i class="ti ti-coins"></i> ${formatarPO(moedasTot)} PO` : ""}</span>
        </div>
        <i class="ti ti-chevron-right veic-seta"></i>
      </div>
      <div class="veic-medidores">${medidoresVeiculo(veic)}</div>
      <div class="recipiente-chips">${chips}</div>
    </div>`;
}

function renderDetalheVeiculo(box, veic) {
  if (!veic) {
    fecharVeiculo();
    return;
  }
  const tipo = TIPOS_VEICULO[veic.tipo] || TIPOS_VEICULO.outro;
  const itens = window._veic.itens[veic.id] || [];
  const m = normalizarMoedas(veic.moedas);
  const souDono = veic.criadoPor === window.usuarioAtual?.uid;
  const iconeTipoItem = { inventario: "ti-package", armas: "ti-sword", armaduras: "ti-shield-half" };
  const pv = veic.pv ?? veic.pvMax ?? 0;

  box.innerHTML = `
    <div class="veic-barra-topo">
      <button type="button" class="veic-voltar" onclick="fecharVeiculo()"><i class="ti ti-arrow-left"></i> Veículos</button>
      <div class="veic-cab-acoes">
        <button type="button" class="card-ico" title="Editar" onclick="abrirFormVeiculo('${veic.id}')"><i class="ti ti-pencil"></i></button>
        ${souDono ? `<button type="button" class="card-ico perigo" title="Apagar veículo" onclick="apagarVeiculo('${veic.id}')"><i class="ti ti-trash"></i></button>` : ""}
      </div>
    </div>

    <div class="veic-hero ${veic.imagemUrl ? "com-imagem" : ""}">
      ${veic.imagemUrl ? `<img class="veic-hero-img" src="${esc(veic.imagemUrl)}" alt="">` : `<div class="veic-hero-ic">${iconeVeiculo(veic.tipo)}</div>`}
      <div class="veic-hero-texto">
        <span class="veic-hero-tipo">${tipo[0]}</span>
        <strong>${esc(veic.nome || "Sem nome")}</strong>
        ${veic.criadoPorNome ? `<small>criado por ${esc(veic.criadoPorNome)}</small>` : ""}
      </div>
    </div>

    <div class="veic-stats">
      <div class="veic-stat"><i class="ti ti-shield"></i><span>CA</span><b>${esc(veic.ca || "—")}</b></div>
      <div class="veic-stat"><i class="ti ti-route"></i><span>Desloc.</span><b>${esc(veic.desloc || "—")}</b></div>
      <div class="veic-stat ${classeCapacidade(veic)}"><i class="ti ti-package"></i><span>Carga</span><b>${unidadesNoVeiculo(veic.id)}${veic.capacidade > 0 ? `<small>/${veic.capacidade}</small>` : ""}</b></div>
    </div>

    ${
      veic.pvMax > 0
        ? `<div class="veic-painel">
            <div class="veic-painel-titulo"><i class="ti ti-heart"></i><span>Pontos de vida</span><small>${pv}/${veic.pvMax}</small></div>
            <div class="veic-pv-linha">
              <button type="button" onclick="alterarPVVeiculo('${veic.id}', -1)" aria-label="Menos 1">−</button>
              <div class="veic-pv-grande ${pv / veic.pvMax <= 0.25 ? "critico" : ""}"><div style="width:${Math.max(0, Math.min(100, (pv / veic.pvMax) * 100))}%"></div><span>${pv} / ${veic.pvMax}</span></div>
              <button type="button" onclick="alterarPVVeiculo('${veic.id}', 1)" aria-label="Mais 1">+</button>
            </div>
            <button type="button" class="veic-btn-sec" onclick="alterarPVVeiculoValor('${veic.id}')"><i class="ti ti-plus-minus"></i> Dano ou reparo de uma vez</button>
          </div>`
        : ""
    }

    <div class="veic-painel">
      <div class="veic-painel-titulo"><i class="ti ti-coins"></i><span>Cofre</span><small>≈ ${formatarPO(totalEmPC(m))} PO</small></div>
      <div class="veic-cofre">${MOEDAS.map((k) => `<div class="moeda moeda-${k}"><span class="moeda-sigla">${k.toUpperCase()}</span><b>${m[k]}</b></div>`).join("")}</div>
      <div class="bolsa-acoes">
        <button type="button" onclick="abrirMovimentoCofre('${veic.id}', 'depositar')"><i class="ti ti-arrow-bar-to-down"></i> Guardar</button>
        <button type="button" onclick="abrirMovimentoCofre('${veic.id}', 'sacar')"><i class="ti ti-arrow-bar-up"></i> Pegar</button>
      </div>
    </div>

    <div class="veic-painel">
      <div class="veic-painel-titulo"><i class="ti ti-box"></i><span>Itens</span><small>${itens.length}</small></div>
      ${veic.capacidade > 0 ? medidorVeiculo("ti-package", "Carga", unidadesNoVeiculo(veic.id), veic.capacidade, "carga " + classeCapacidade(veic)) : ""}
      <div class="veic-itens">
        ${
          itens.length
            ? itens
                .map(
                  (it) => `
          <div class="veic-item" onclick="verItemVeiculo('${veic.id}', '${it.id}')">
            <span class="veic-item-ic"><i class="ti ${iconeTipoItem[it.tipoItem] || "ti-package"}"></i></span>
            <div class="veic-item-info">
              <strong>${esc(it.nome)}</strong>
              <span>${esc(it.colocadoPorNome || "")}</span>
            </div>
            ${(it.qtd || 1) > 1 ? `<span class="item-qtd-badge">x${it.qtd}</span>` : ""}
            <button type="button" class="veic-tirar" title="Pegar pra mim" onclick="event.stopPropagation(); tirarDoVeiculo('${veic.id}', '${it.id}')"><i class="ti ti-arrow-bar-up"></i></button>
          </div>`,
                )
                .join("")
            : `<p class="veic-vazio">Nada guardado ainda.</p>`
        }
      </div>
      <button type="button" class="inv-add-btn btn-adicionar" onclick="abrirColocarNoVeiculo('${veic.id}')"><i class="ti ti-package-import"></i><span>Colocar itens</span></button>
    </div>

    <div class="veic-painel">
      <div class="veic-painel-titulo"><i class="ti ti-history"></i><span>Histórico</span></div>
      <div class="veic-hist">
        ${
          window._veic.hist.length
            ? window._veic.hist
                .map((h) => `<div class="veic-hist-linha"><span class="veic-hist-ponto"></span><span class="veic-hist-txt"><b>${esc(h.nome || "Alguém")}</b> ${esc(h.texto)}</span><small>${tempoRelativo(h.em)}</small></div>`)
                .join("")
            : `<p class="veic-vazio">Sem movimentações ainda.</p>`
        }
      </div>
    </div>`;
}

function abrirFormVeiculo(vid) {
  const veic = vid ? window._veic.lista.find((x) => x.id === vid) : null;
  const e = veic || { tipo: "carroca", capacidade: 0 };
  window._veicImagemTemp = "";

  const html = `
    <div class="popup-form">
      <label class="popup-label">Tipo</label>
      <div class="veic-tipos" id="vTipo" data-valor="${esc(e.tipo || "carroca")}">
        ${Object.entries(TIPOS_VEICULO)
          .map(
            ([k, [rot]]) => `<button type="button" class="veic-tipo-opt ${k === (e.tipo || "carroca") ? "ativo" : ""}" onclick="escolherTipoVeiculo(this, '${k}')">
              <span>${iconeVeiculo(k)}</span><small>${rot}</small>
            </button>`,
          )
          .join("")}
      </div>

      <label class="popup-label">Nome</label>
      <input id="vNome" value="${esc(e.nome || "")}" placeholder="Ex: Carroça do grupo">

      <div class="pf-duplo">
        <div><span class="pf-mini">PV máximo</span><input id="vPvMax" type="number" min="0" value="${e.pvMax || ""}" placeholder="Ex: 100"></div>
        <div><span class="pf-mini">CA</span><input id="vCA" value="${esc(e.ca || "")}" placeholder="Ex: 11"></div>
      </div>
      <div class="pf-duplo">
        <div><span class="pf-mini">Deslocamento</span><input id="vDesloc" value="${esc(e.desloc || "")}" placeholder="Ex: 9 m"></div>
        <div><span class="pf-mini">Capacidade (itens)</span><input id="vCap" type="number" min="0" value="${e.capacidade || ""}" placeholder="Sem limite"></div>
      </div>

      <label class="popup-label">Imagem (opcional)</label>
      <input type="file" id="vImagem" accept="image/*" onchange="previewImagemVeiculo(this)">
      <label for="vImagem" class="botao-upload"><i class="ti ti-photo-plus"></i><span>${e.imagemUrl ? "Trocar imagem" : "Adicionar imagem"}</span></label>
      <img id="vImagemPreview" src="${esc(e.imagemUrl || "")}" style="display:${e.imagemUrl ? "block" : "none"}; width:100%; max-height:180px; object-fit:cover; border-radius:12px;">

      <button class="popup-salvar-btn" id="vSalvar" onclick="salvarVeiculo(${vid ? `'${vid}'` : "null"})">${vid ? "Salvar" : "Criar veículo"}</button>
    </div>`;
  abrirPopup(vid ? `Editar ${e.nome || "veículo"}` : "Novo veículo", html, true, null);
}

function escolherTipoVeiculo(btn, tipo) {
  const box = document.getElementById("vTipo");
  if (!box) return;
  box.dataset.valor = tipo;
  box.querySelectorAll(".veic-tipo-opt").forEach((b) => b.classList.toggle("ativo", b === btn));
}


/* =====================================================================
   BOLSA DE DINHEIRO COMO ITEM DO INVENTÁRIO
   Um item com "bolsa: true" guarda moedas (item.moedas).
   ===================================================================== */
function bolsasInventario() {
  const r = [];
  inventario.forEach((it, i) => {
    if (it && it.bolsa) r.push({ item: it, index: i });
  });
  return r;
}

function garantirBolsaPadrao() {
  const b = bolsasInventario();
  if (b.length) return b[0].index;
  inventario.push({ id: gerarIdItem(), nome: "Bolsa de moedas", desc: "", qtd: 1, bolsa: true, moedas: normalizarMoedas({}), dentroDe: "" });
  return inventario.length - 1;
}

// fichas que já tinham moedas na "bolsa antiga" ganham um item de bolsa com elas
function migrarMoedasParaBolsa() {
  if (totalEmPC(normalizarMoedas(moedas)) > 0) {
    const i = garantirBolsaPadrao();
    const b = normalizarMoedas(inventario[i].moedas);
    MOEDAS.forEach((k) => (b[k] += moedas[k] || 0));
    inventario[i].moedas = b;
  }
  moedas = normalizarMoedas({});
}

function renderBolsaMoedas() {
  /* a bolsa agora é um item do inventário; nada pra desenhar aqui */
}

function resumoMoedasHTML(m) {
  const tem = MOEDAS.filter((k) => m[k] > 0);
  if (!tem.length) return `<span class="recipiente-vazio">Vazia</span>`;
  return tem.map((k) => `<span class="moeda-chip moeda-${k}"><span class="moeda-ponto"></span>${m[k]} <small>${k.toUpperCase()}</small></span>`).join("");
}

function cardBolsaHTML(item, index) {
  const m = normalizarMoedas(item.moedas);
  const temMochila = recipientesInventario().length > 0;
  return `
      <button type="button" class="drag-handle" aria-label="Arrastar para reordenar">⠿</button>
      <div class="item-info bolsa-info" onclick="abrirBolsa(${index})">
        <div class="item-topo-linha">
          <strong class="item-nome"><i class="ti ti-coins bolsa-icone"></i>${esc(item.nome || "Bolsa")}</strong>
          <span class="item-qtd-badge bolsa-total-badge">≈ ${formatarPO(totalEmPC(m))} PO</span>
        </div>
        <div class="moeda-chips">${resumoMoedasHTML(m)}</div>
      </div>
      <div class="card-acoes-ico">
        ${temMochila ? `<button type="button" class="card-ico" title="Guardar em uma mochila" onclick="event.stopPropagation(); abrirGuardarItem(${index})"><i class="ti ti-backpack"></i></button>` : ""}
        <button type="button" class="card-ico" title="Dar para outro jogador" onclick="event.stopPropagation(); window.abrirDarItem('inventario', ${index})"><i class="ti ti-gift"></i></button>
      </div>`;
}

function abrirBolsa(index) {
  const item = inventario[index];
  if (!item || !item.bolsa) return;
  item.moedas = normalizarMoedas(item.moedas);
  const m = item.moedas;
  const achados = detectarMoedasNoInventario();

  const html = `
    <div class="pv bolsa-painel">
      <div class="bolsa-total-grande"><span>Total aproximado</span><b>${formatarPO(totalEmPC(m))} <small>PO</small></b></div>
      <div class="bolsa-grade">
        ${MOEDAS.map(
          (k) => `
          <label class="moeda moeda-${k}" title="${MOEDA_NOME[k]}">
            <span class="moeda-sigla">${k.toUpperCase()}</span>
            <input type="number" min="0" inputmode="numeric" value="${m[k]}" onchange="alterarMoedaBolsa(${index}, '${k}', this.value)">
            <small>${MOEDA_NOME[k]}</small>
          </label>`,
        ).join("")}
      </div>
      <div class="bolsa-acoes">
        <button type="button" onclick="abrirMovimentoMoedas('pagar', ${index})"><i class="ti ti-minus"></i> Pagar</button>
        <button type="button" onclick="abrirMovimentoMoedas('receber', ${index})"><i class="ti ti-plus"></i> Receber</button>
        <button type="button" onclick="organizarBolsaItem(${index})" title="Junta moedas pequenas em maiores"><i class="ti ti-arrows-sort"></i> Organizar</button>
      </div>
      ${
        achados.length
          ? `<div class="bolsa-aviso">
              <span>Encontrei ${achados.map((a) => `<b>${esc(a.nome)} x${a.qtd}</b>`).join(", ")} no inventário.</span>
              <button type="button" onclick="moverMoedasDoInventario(${index})">Pôr nesta bolsa</button>
            </div>`
          : ""
      }
      ${item.desc ? `<div class="pv-secao"><span class="pv-rotulo"><i class="ti ti-file-text"></i> Descrição</span><div class="pv-desc">${esc(item.desc)}</div></div>` : ""}
      <div class="pv-acoes">
        <button type="button" onclick="fecharPopup(); window.abrirDarItem('inventario', ${index})"><i class="ti ti-gift"></i><span>Dar</span></button>
        <button type="button" class="pv-editar" onclick="editarItem(${index})"><i class="ti ti-pencil"></i><span>Editar</span></button>
        <button type="button" class="perigo" onclick="fecharPopup(); removerItem(${index})"><i class="ti ti-trash"></i><span>Remover</span></button>
      </div>
    </div>`;
  abrirPopup(item.nome || "Bolsa", html, true, null);
}

function alterarMoedaBolsa(index, tipo, valor) {
  const item = inventario[index];
  if (!item) return;
  item.moedas = normalizarMoedas(item.moedas);
  item.moedas[tipo] = Math.max(0, parseInt(valor) || 0);
  renderInv();
  salvarTudo();
  abrirBolsa(index);
}

function organizarBolsaItem(index) {
  const item = inventario[index];
  if (!item) return;
  item.moedas = organizarBolsa(item.moedas);
  renderInv();
  salvarTudo();
  abrirBolsa(index);
  mostrarToastMundo("Moedas organizadas");
}

function abrirMovimentoMoedas(modo, index) {
  const item = inventario[index];
  if (!item) return;
  const html = `
    <div class="popup-form">
      <label class="popup-label">Quantidade</label>
      <input id="movQtd" type="number" min="1" inputmode="numeric" placeholder="Ex: 25">
      <label class="popup-label">Moeda</label>
      ${seletorMoedaHTML("movMoeda", "po")}
      ${modo === "pagar" ? `<p class="pm-dica">Se faltar dessa moeda, o app quebra uma maior e devolve o troco.</p>` : ""}
      <button class="popup-salvar-btn" onclick="confirmarMovimentoMoedas('${modo}', ${index})">${modo === "pagar" ? "Pagar" : "Receber"}</button>
      <button type="button" class="veic-btn-sec" onclick="abrirBolsa(${index})"><i class="ti ti-arrow-left"></i> Voltar pra bolsa</button>
    </div>`;
  abrirPopup(`${modo === "pagar" ? "Pagar" : "Receber"} · ${item.nome || "Bolsa"}`, html, true, null);
  setTimeout(() => document.getElementById("movQtd")?.focus(), 50);
}

function confirmarMovimentoMoedas(modo, index) {
  const item = inventario[index];
  if (!item) return;
  const qtd = parseInt(document.getElementById("movQtd")?.value) || 0;
  const tipo = lerSeletorMoeda("movMoeda");
  if (qtd <= 0) return;
  item.moedas = normalizarMoedas(item.moedas);

  if (modo === "pagar") {
    const nova = pagarDaBolsa(item.moedas, qtd, tipo);
    if (!nova) {
      alertBonito(`Não tem o suficiente nessa bolsa (≈ ${formatarPO(totalEmPC(item.moedas))} PO).`);
      return;
    }
    item.moedas = nova;
  } else {
    item.moedas[tipo] += qtd;
  }
  renderInv();
  salvarTudo();
  abrirBolsa(index);
  mostrarToastMundo(`${modo === "pagar" ? "Pagou" : "Recebeu"} ${qtd} ${tipo.toUpperCase()}`);
}

function moverMoedasDoInventario(index) {
  const bolsa = inventario[index];
  const achados = detectarMoedasNoInventario();
  if (!bolsa || !achados.length) return;
  bolsa.moedas = normalizarMoedas(bolsa.moedas);
  achados.forEach((a) => (bolsa.moedas[a.tipo] += a.qtd));
  const remover = new Set(achados.map((a) => a.index));
  const idBolsa = bolsa.id;
  inventario = inventario.filter((_, i) => !remover.has(i));
  renderInv();
  salvarTudo();
  const novoIndex = inventario.findIndex((x) => x.id === idBolsa);
  if (novoIndex >= 0) abrirBolsa(novoIndex);
  mostrarToastMundo("Moedas guardadas na bolsa");
}

/* ---------- cofre do veículo usando as bolsas ---------- */
function opcoesBolsasHTML() {
  return bolsasInventario()
    .map(({ item, index }) => `<option value="${index}">${esc(item.nome || "Bolsa")} (≈ ${formatarPO(totalEmPC(normalizarMoedas(item.moedas)))} PO)</option>`)
    .join("");
}

function abrirMovimentoCofre(vid, modo) {
  const bolsas = bolsasInventario();
  if (modo === "depositar" && !bolsas.length) {
    alertBonito("Você não tem nenhuma bolsa de dinheiro. Crie um item no inventário e marque \"É uma bolsa de dinheiro\".");
    return;
  }
  const html = `
    <div class="popup-form">
      <label class="popup-label">${modo === "depositar" ? "Tirar da bolsa" : "Colocar na bolsa"}</label>
      ${
        bolsas.length
          ? `<div class="select-wrapper"><select id="cofreBolsa">${opcoesBolsasHTML()}</select></div>`
          : `<p class="pm-dica">Você ainda não tem bolsa: vou criar uma "Bolsa de moedas" no seu inventário.</p>`
      }
      <label class="popup-label">Quantidade</label>
      <input id="cofreQtd" type="number" min="1" inputmode="numeric" placeholder="Ex: 50">
      <label class="popup-label">Moeda</label>
      ${seletorMoedaHTML("cofreMoeda", "po")}
      <button class="popup-salvar-btn" id="cofreOk" onclick="confirmarMovimentoCofre('${vid}', '${modo}')">${modo === "depositar" ? "Guardar no cofre" : "Pegar do cofre"}</button>
    </div>`;
  abrirPopup(modo === "depositar" ? "Guardar no cofre" : "Pegar do cofre", html, true, null);
}

async function confirmarMovimentoCofre(vid, modo) {
  const qtd = parseInt(document.getElementById("cofreQtd")?.value) || 0;
  const tipo = lerSeletorMoeda("cofreMoeda");
  if (qtd <= 0) return;
  const sel = document.getElementById("cofreBolsa");
  let idx = sel ? parseInt(sel.value) : -1;
  const btn = document.getElementById("cofreOk");
  if (btn) btn.disabled = true;

  try {
    if (modo === "depositar") {
      const bolsa = inventario[idx];
      const nova = bolsa ? pagarDaBolsa(bolsa.moedas, qtd, tipo) : null;
      if (!nova) {
        alertBonito("Essa bolsa não tem tudo isso.");
        if (btn) btn.disabled = false;
        return;
      }
      await runTransaction(db, async (t) => {
        const s = await t.get(veicRef(vid));
        if (!s.exists()) throw new Error("sumiu");
        const m = normalizarMoedas(s.data().moedas);
        m[tipo] += qtd;
        t.update(veicRef(vid), { moedas: m });
      });
      bolsa.moedas = nova;
    } else {
      await runTransaction(db, async (t) => {
        const s = await t.get(veicRef(vid));
        if (!s.exists()) throw new Error("sumiu");
        const m = pagarDaBolsa(s.data().moedas, qtd, tipo);
        if (!m) throw new Error("sem-saldo");
        t.update(veicRef(vid), { moedas: m });
      });
      if (!(idx >= 0 && inventario[idx]?.bolsa)) idx = garantirBolsaPadrao();
      inventario[idx].moedas = normalizarMoedas(inventario[idx].moedas);
      inventario[idx].moedas[tipo] += qtd;
    }
    renderInv();
    salvarTudo();
    registrarHistorico(vid, `${modo === "depositar" ? "guardou" : "pegou"} ${qtd} ${tipo.toUpperCase()} ${modo === "depositar" ? "no" : "do"} cofre`);
    fecharPopup();
  } catch (e) {
    if (btn) btn.disabled = false;
    alertBonito(e.message === "sem-saldo" ? "O cofre não tem tudo isso." : "Não consegui mexer no cofre agora. Tenta de novo.");
  }
}

function alternarBolsaForm(prefixo) {
  // bolsa de dinheiro e mochila não combinam: marcar um desmarca o outro
  const bolsa = document.getElementById(prefixo + "Bolsa");
  const rec = document.getElementById(prefixo + "Recipiente");
  if (bolsa?.checked && rec?.checked) {
    rec.checked = false;
    rec.dispatchEvent(new Event("change"));
  }
}

/* =====================================================================
   ESCOLHER ABAS (engrenagem na aba Personagem)
   Cada ficha guarda quais abas ficam escondidas (p.abasOcultas).
   ===================================================================== */
var NOMES_ABAS = {
  personagem: ["👤", "Personagem"],
  atributos: ["📊", "Atributos"],
  combate: ["⚔️", "Combate"],
  inventario: ["🎒", "Inventário"],
  poderes: ["🔥", "Poderes e Magias"],
  estilo: ["💀", "Estilo (Devil Trigger)"],
  veiculos: ["🐴", "Veículos"],
  companheiros: ["🐾", "Companheiros"],
};
var abasOcultas = [];

function idAbaDoBotao(btn) {
  const m = (btn.getAttribute("onclick") || "").match(/trocarAba\('(\w+)'/);
  return m ? m[1] : null;
}

function aplicarAbasVisiveis() {
  const ocultas = new Set(abasOcultas);
  document.querySelectorAll("#ficha .tabs .tab-btn").forEach((btn) => {
    const id = idAbaDoBotao(btn);
    if (!id || id === "personagem") return;
    btn.style.display = ocultas.has(id) ? "none" : "";
  });
  const atual = document.querySelector("#ficha .aba.active");
  if (atual && ocultas.has(atual.id)) trocarAba("personagem");
}

function abrirConfigAbas() {
  const ids = [...document.querySelectorAll("#ficha .tabs .tab-btn")].map(idAbaDoBotao).filter(Boolean);
  const ocultas = new Set(abasOcultas);
  const linhas = ids
    .map((id) => {
      const [ic, nome] = NOMES_ABAS[id] || ["•", id];
      const fixa = id === "personagem";
      return `
      <div class="toggle-cargas cfg-aba ${fixa ? "fixa" : ""}">
        <span class="toggle-cargas-texto"><span class="cfg-aba-ic">${ic}</span> ${nome}${fixa ? ` <small>(sempre aparece)</small>` : ""}</span>
        <label class="switch-cargas">
          <input type="checkbox" data-cfg-aba="${id}" ${ocultas.has(id) ? "" : "checked"} ${fixa ? "disabled" : ""}>
          <span class="slider-cargas"></span>
        </label>
      </div>`;
    })
    .join("");
  abrirPopup(
    "Abas da ficha",
    `<div class="popup-form"><p class="pm-dica">Escolha quais abas aparecem na barra de baixo. Dá pra mudar quando quiser.</p>${linhas}
      <span class="mods-titulo" style="margin-top:12px;display:block">Avisos</span>
      <div class="toggle-cargas cfg-aba">
        <span class="toggle-cargas-texto"><span class="cfg-aba-ic">🎲</span> Rolagens dos outros jogadores</span>
        <label class="switch-cargas">
          <input type="checkbox" id="cfgAvisosGrupo" ${lerPrefAvisosGrupo() ? "checked" : ""}>
          <span class="slider-cargas"></span>
        </label>
      </div>
      <p class="pm-dica" style="margin-top:4px">Desligado, o pop-up some, mas as rolagens continuam em 🎲 Dados → Grupo.</p>
      <button type="button" class="popup-salvar-btn" onclick="salvarConfigAbas()">Salvar</button></div>`,
    true,
    null,
  );
}

function salvarConfigAbas() {
  const ocultas = [];
  document.querySelectorAll("#popup [data-cfg-aba]").forEach((el) => {
    if (!el.checked && el.dataset.cfgAba !== "personagem") ocultas.push(el.dataset.cfgAba);
  });
  abasOcultas = ocultas;
  const av = document.getElementById("cfgAvisosGrupo");
  if (av) salvarPrefAvisosGrupo(av.checked);
  aplicarAbasVisiveis();
  salvarTudo();
  fecharPopup();
  if (typeof mostrarToastMundo === "function") mostrarToastMundo("Configuração salva");
}

function alternarAbaVisivel(id, visivel) {
  const s = new Set(abasOcultas);
  if (visivel) s.delete(id);
  else s.add(id);
  abasOcultas = [...s];
  aplicarAbasVisiveis();
  salvarTudo();
}

/* =====================================================================
   ARMAS: atributo, proficiência e bônus calculados automaticamente
   ===================================================================== */
var SIGLAS_ATRIBUTO = { forca: "FOR", destreza: "DES", constituicao: "CON", inteligencia: "INT", sabedoria: "SAB", carisma: "CAR" };

// arma criada antes dessa função não tem o campo → continua no jeito antigo
function armaUsaCalculo(arma) {
  return !!arma && arma.atributoAtaque !== undefined;
}

function calcAtaqueArma(arma) {
  const termos = [];
  const attr = arma.atributoAtaque || "";
  if (attr && NOMES_ATRIBUTO[attr]) termos.push({ rot: SIGLAS_ATRIBUTO[attr], n: modAtributo(attr) });
  if (arma.somarProf) termos.push({ rot: "Prof", n: get("bonusProf") });
  const extra = parseInt(arma.bonusAtaque) || 0;
  if (extra) termos.push({ rot: "Bônus", n: extra });
  const total = termos.reduce((a, t) => a + t.n, 0);
  return {
    total,
    termos,
    conta: termos.map((t) => `${t.rot} ${fmtBonus(t.n)}`).join(" · "),
    composicao: termos.map((t) => `${t.n < 0 ? "−" : "+"} ${t.rot} ${Math.abs(t.n)}`).join(" "),
  };
}

function bonusDanoArma(arma) {
  let n = parseInt(arma.bonusDano) || 0;
  if (arma.somarAtribDano && arma.atributoAtaque && NOMES_ATRIBUTO[arma.atributoAtaque]) n += modAtributo(arma.atributoAtaque);
  return n;
}

// junta os dados da arma com o bônus fixo: "1d8+1" + 4 → "1d8+5"
function exprDanoArma(arma) {
  const base = extrairDados(arma?.dano);
  if (!base) return "";
  if (!armaUsaCalculo(arma)) return base;
  const dadosTermos = [];
  let fixo = bonusDanoArma(arma);
  (base.match(/[+-]?[^+-]+/g) || []).forEach((t) => {
    if (/d/i.test(t)) dadosTermos.push(t.replace(/^\+/, ""));
    else fixo += parseInt(t) || 0;
  });
  let expr = dadosTermos.map((t, i) => (i && !/^-/.test(t) ? "+" + t : t)).join("");
  if (fixo) expr += fixo > 0 ? `+${fixo}` : `${fixo}`;
  return expr;
}

// texto do dano com o bônus já somado (mantém o resto, ex: "cortante")
function danoArmaTexto(arma) {
  const txt = String(arma?.dano || "");
  const expr = exprDanoArma(arma);
  if (!expr) return txt;
  return txt.replace(/(?<![a-zà-ú])\d*\s*d\s*\d+(\s*[+-]\s*\d+(?!\s*d\s*\d))*/i, expr);
}

// separa "2d6+7 cortante" em { expr: "2d6+7", tipo: "cortante" }
function separarDanoArma(arma) {
  const txt = String(arma?.dano || "").trim();
  const re = /(?<![a-zà-ú])\d*\s*d\s*\d+(\s*[+-]\s*\d+(?!\s*d\s*\d))*/i;
  if (!re.test(txt)) return { expr: txt, tipo: "", rolavel: false };
  const expr = armaUsaCalculo(arma) ? exprDanoArma(arma) : extrairDados(txt);
  const tipo = txt.replace(re, "").replace(/\s{2,}/g, " ").replace(/^[\s,.;-]+|[\s,.;-]+$/g, "");
  return { expr, tipo, rolavel: true };
}

// dano no card: só o texto "Dano: 2d6+7 cortante" (o ataque e as rolagens ficam no popup)
function armaCalcChipsHTML(arma) {
  if (!String(arma.dano || "").trim()) return "";
  const texto = armaUsaCalculo(arma) ? danoArmaTexto(arma) : arma.dano;
  return `<p class="arma-dano-preview">Dano: ${esc(texto)}</p>`;
}

// atualiza só os números dos cards quando atributo/proficiência mudam
function atualizarCalculosArmas() {
  document.querySelectorAll("#listaArmas [data-arma-calc]").forEach((el) => {
    const arma = armas[parseInt(el.dataset.armaCalc)];
    if (arma) el.innerHTML = armaCalcChipsHTML(arma);
  });
}

(function () {
  if (typeof atualizarTudo !== "function" || atualizarTudo._comArmas) return;
  const orig = atualizarTudo;
  atualizarTudo = function () {
    const r = orig.apply(this, arguments);
    try { atualizarCalculosArmas(); } catch (e) {}
    return r;
  };
  atualizarTudo._comArmas = true;
  window.atualizarTudo = atualizarTudo;
})();

/* ---------- campos no formulário (criar e editar) ---------- */
function camposAtaqueArmaHTML(prefixo, arma) {
  const novo = !armaUsaCalculo(arma);
  const attr = novo ? "forca" : arma.atributoAtaque || "";
  const prof = novo ? true : !!arma.somarProf;
  const somaDano = novo ? true : !!arma.somarAtribDano;
  const bAtk = novo ? "" : arma.bonusAtaque || "";
  const bDano = novo ? "" : arma.bonusDano || "";
  const opts = [`<option value="" ${attr === "" ? "selected" : ""}>Nenhum</option>`]
    .concat(Object.keys(NOMES_ATRIBUTO).map((k) => `<option value="${k}" ${k === attr ? "selected" : ""}>${NOMES_ATRIBUTO[k]}</option>`))
    .join("");
  const up = `atualizarPreviewAtaqueArma('${prefixo}')`;
  return `
    <div class="arma-atk-box" id="${prefixo}AtkBox">
      <div class="arma-atk-topo">
        <span class="mods-titulo"><i class="ti ti-flame"></i> Dano e ataque</span>
      </div>
      <label class="arma-atk-campo">
        <span>Dano (dados e tipo)</span>
        <input id="${prefixo}Dano" value="${esc(arma?.dano || "")}" placeholder="Ex: 2d6 cortante" oninput="${up}" autocomplete="off">
      </label>
      <div class="arma-atk-resultado" id="${prefixo}AtkPreview"></div>
      <label class="arma-atk-campo">
        <span>Atributo usado</span>
        <select id="${prefixo}Atrib" onchange="${up}">${opts}</select>
      </label>
      <div class="arma-atk-linha">
        <label class="arma-atk-campo"><span>Bônus no ataque</span><input id="${prefixo}BonusAtk" type="number" placeholder="0" value="${esc(String(bAtk))}" oninput="${up}"></label>
        <label class="arma-atk-campo"><span>Bônus no dano</span><input id="${prefixo}BonusDano" type="number" placeholder="0" value="${esc(String(bDano))}" oninput="${up}"></label>
      </div>
      <div class="toggle-cargas">
        <span class="toggle-cargas-texto">Somar proficiência no ataque</span>
        <label class="switch-cargas"><input type="checkbox" id="${prefixo}SomaProf" ${prof ? "checked" : ""} onchange="${up}"><span class="slider-cargas"></span></label>
      </div>
      <div class="toggle-cargas">
        <span class="toggle-cargas-texto">Somar atributo no dano</span>
        <label class="switch-cargas"><input type="checkbox" id="${prefixo}SomaDano" ${somaDano ? "checked" : ""} onchange="${up}"><span class="slider-cargas"></span></label>
      </div>
    </div>`;
}

function lerCamposAtaqueArma(prefixo) {
  const sel = document.getElementById(prefixo + "Atrib");
  if (!sel) return {};
  return {
    atributoAtaque: sel.value || "",
    somarProf: !!document.getElementById(prefixo + "SomaProf")?.checked,
    somarAtribDano: !!document.getElementById(prefixo + "SomaDano")?.checked,
    bonusAtaque: parseInt(document.getElementById(prefixo + "BonusAtk")?.value) || 0,
    bonusDano: parseInt(document.getElementById(prefixo + "BonusDano")?.value) || 0,
  };
}

function atualizarPreviewAtaqueArma(prefixo) {
  const out = document.getElementById(prefixo + "AtkPreview");
  if (!out) return;
  const danoEl = document.getElementById(prefixo === "arma" ? "armaDano" : "editArmaDano");
  const tmp = { ...lerCamposAtaqueArma(prefixo), dano: danoEl?.value || "" };
  const atk = calcAtaqueArma(tmp);
  const dano = danoArmaTexto(tmp);
  const sep = separarDanoArma(tmp);
  out.innerHTML = `
    <div class="aar-dano"><small>Dano</small><b>${esc(sep.expr || "—")}</b>${sep.tipo ? `<span>${esc(sep.tipo)}</span>` : ""}</div>
    <div class="aar-atk"><small>Ataque</small><b>${fmtBonus(atk.total)}</b></div>`;
}

function montarCamposAtaqueFormArma() {
  const box = document.getElementById("armaCamposAtaque");
  if (!box) return;
  box.innerHTML = camposAtaqueArmaHTML("arma", null);
  atualizarPreviewAtaqueArma("arma");
}

function limparCamposAtaqueArma() {
  montarCamposAtaqueFormArma();
}

// prévia ao vivo também no popup de editar
document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "editArmaDano") atualizarPreviewAtaqueArma("editArma");
});

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montarCamposAtaqueFormArma);
else montarCamposAtaqueFormArma();

// prévia do popup de editar assim que ele abre
(function () {
  const orig = editarArma;
  editarArma = function (index) {
    const r = orig.apply(this, arguments);
    atualizarPreviewAtaqueArma("editArma");
    return r;
  };
  window.editarArma = editarArma;
})();

/* ---------- rolagens ---------- */
function rolarAtaqueArma(index, attr) {
  const arma = armas[index];
  if (!arma) return;
  if (!armaUsaCalculo(arma)) {
    // arma antiga: jeito de antes (FOR/DES + proficiência)
    attr = attr || "forca";
    const bonus = modAtributo(attr) + get("bonusProf");
    const outro = attr === "forca" ? "destreza" : "forca";
    const extras = [{ rotulo: `Usar ${outro === "forca" ? "FOR" : "DES"}`, acao: () => rolarAtaqueArma(index, outro) }];
    if (extrairDados(arma.dano)) extras.push({ rotulo: "Dano", acao: () => rolarDanoArma(index, attr) });
    rolarD20(`Ataque · ${arma.nome || "arma"}`, bonus, "normal", extras);
    return;
  }
  const atk = calcAtaqueArma(arma);
  const extras = extrairDados(arma.dano) ? [{ rotulo: "Dano", acao: () => rolarDanoArma(index) }] : [];
  rolarD20(`Ataque · ${arma.nome || "arma"}`, atk.total, "normal", extras, atk.composicao);
}

function rolarDanoArma(index, attr) {
  const arma = armas[index];
  const expr = exprDanoArma(arma);
  if (!expr) return;
  rolarDano(`Dano · ${arma.nome || "arma"}`, expr, false, [
    { rotulo: "Ataque", acao: () => rolarAtaqueArma(index, attr) },
  ]);
}

/* =====================================================================
   COMPANHEIROS (pets, montarias, familiares, invocações, ajudantes)
   Ficam na própria ficha: p.companheiros = [...]
   ===================================================================== */
var TIPOS_COMP = {
  fera: ["🐺", "Fera"],
  montaria: ["🐎", "Montaria"],
  familiar: ["🦉", "Familiar"],
  invocacao: ["✨", "Invocação"],
  ajudante: ["🧑", "Ajudante"],
  outro: ["🐾", "Outro"],
};
var ATRIBS_COMP = ["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "carisma"];
window._comp = window._comp || { aberto: null, imgTemp: "" };

function listaComp() {
  const p = personagens[personagemAtual];
  if (!p) return [];
  if (!Array.isArray(p.companheiros)) p.companheiros = [];
  return p.companheiros;
}
function acharComp(id) {
  return listaComp().find((c) => String(c.id) === String(id));
}
function salvarComp() {
  salvarTudo();
}
function modComp(c, attr) {
  const v = parseInt(c?.atributos?.[attr]);
  return isNaN(v) ? null : Math.floor((v - 10) / 2);
}
function iconeComp(c) {
  return (TIPOS_COMP[c?.tipo] || TIPOS_COMP.outro)[0];
}
function medalhaoComp(c) {
  return `<div class="veic-medalhao comp-medalhao">${
    c.imagemUrl ? `<img src="${esc(c.imagemUrl)}" alt="">` : `<span class="comp-emoji">${iconeComp(c)}</span>`
  }</div>`;
}
function calcAtaqueComp(c, a) {
  const termos = [];
  const m = a.atributo ? modComp(c, a.atributo) : null;
  if (m !== null) termos.push({ rot: SIGLAS_ATRIBUTO[a.atributo], n: m });
  const b = parseInt(a.bonusAtaque) || 0;
  if (b) termos.push({ rot: "Bônus", n: b });
  return {
    total: termos.reduce((s, t) => s + t.n, 0),
    composicao: termos.map((t) => `${t.n < 0 ? "−" : "+"} ${t.rot} ${Math.abs(t.n)}`).join(" "),
  };
}
function exprDanoComp(c, a) {
  const fake = {
    dano: a.dano,
    atributoAtaque: "",
    somarAtribDano: false,
    bonusDano: (parseInt(a.bonusDano) || 0) + (a.somarAtribDano && a.atributo ? modComp(c, a.atributo) || 0 : 0),
  };
  return { expr: exprDanoArma(fake), texto: danoArmaTexto(fake) };
}

/* ---------- render ---------- */
function corVidaComp(pct) {
  return pct > 0.5 ? "#7fbf6a" : pct > 0.25 ? "#e0a84a" : "#d9584a";
}

// retrato redondo com a vida desenhada num anel em volta
function retratoComp(c, grande) {
  const max = parseInt(c.pvMax) || 0;
  const pv = c.pv ?? max;
  const pct = max > 0 ? Math.max(0, Math.min(1, pv / max)) : 1;
  const cor = max > 0 ? corVidaComp(pct) : "rgba(216,181,106,0.55)";
  return `
    <div class="comp-retrato ${grande ? "grande" : ""} ${max > 0 && pv <= 0 ? "caido" : ""}" style="--pct:${pct * 100}%; --anel:${cor}">
      <div class="comp-retrato-in">${
        c.imagemUrl ? `<img src="${esc(c.imagemUrl)}" alt="">` : `<span class="comp-emoji">${iconeComp(c)}</span>`
      }</div>
    </div>`;
}

function renderCompanheiros() {
  const box = document.getElementById("companheirosConteudo");
  if (!box || personagemAtual === null) return;
  const lista = listaComp();
  if (window._comp.aberto) {
    const c = acharComp(window._comp.aberto);
    if (c) return renderDetalheComp(box, c);
    window._comp.aberto = null;
  }
  box.innerHTML = lista.length
    ? `<div class="comp-grade">
        ${lista.map(cardCompHTML).join("")}
        <button type="button" class="comp-card-novo" onclick="abrirFormComp()"><i class="ti ti-plus"></i><span>Novo companheiro</span></button>
      </div>`
    : `<div class="comp-vazio">
        <div class="comp-vazio-pegadas"><span class="comp-emoji">🐾</span></div>
        <strong>Nenhum companheiro ainda</strong>
        <p>Domou um lobo? Ganhou um cavalo? Invocou um familiar? Ele mora aqui, com vida, ataques e habilidades.</p>
        <button type="button" class="comp-card-novo largo" onclick="abrirFormComp()"><i class="ti ti-plus"></i><span>Novo companheiro</span></button>
      </div>`;
}

function cardCompHTML(c) {
  const t = TIPOS_COMP[c.tipo] || TIPOS_COMP.outro;
  const max = parseInt(c.pvMax) || 0;
  const pv = c.pv ?? max;
  return `
    <div class="comp-card" onclick="abrirComp('${esc(String(c.id))}')">
      ${retratoComp(c)}
      <strong class="comp-card-nome">${esc(c.nome || "Sem nome")}</strong>
      <span class="comp-tipo"><span class="comp-emoji">${t[0]}</span>${t[1]}</span>
      ${c.especie ? `<small class="comp-card-esp">${esc(c.especie)}</small>` : ""}
      <div class="comp-card-stats">
        ${max > 0 ? `<span><i class="ti ti-heart"></i>${pv}<small>/${max}</small></span>` : ""}
        ${c.ca ? `<span><i class="ti ti-shield"></i>${esc(String(c.ca))}</span>` : ""}
      </div>
    </div>`;
}

function pipsVinculoComp(c, id) {
  const v = c.vinculo || {};
  const max = parseInt(v.max) || 0;
  const atual = parseInt(v.atual) || 0;
  if (max > 0 && max <= 10) {
    return `<div class="comp-pips">${Array.from({ length: max }, (_, i) =>
      `<button type="button" class="comp-pip ${i < atual ? "on" : ""}" onclick="definirVinculoComp('${id}', ${i + 1 === atual ? i : i + 1})" aria-label="${i + 1}"></button>`).join("")}</div>`;
  }
  return `<div class="comp-vinc-num"><button type="button" onclick="mudarVinculoComp('${id}',-1)">−</button><b>${atual}${max ? `<small>/${max}</small>` : ""}</b><button type="button" onclick="mudarVinculoComp('${id}',1)">+</button></div>`;
}

function definirVinculoComp(id, n) {
  const c = acharComp(id);
  if (!c || !c.vinculo) return;
  c.vinculo.atual = Math.max(0, n);
  salvarComp();
  renderCompanheiros();
}

function trocarAbaComp(aba) {
  window._comp.aba = aba;
  renderCompanheiros();
}

function renderDetalheComp(box, c) {
  const t = TIPOS_COMP[c.tipo] || TIPOS_COMP.outro;
  const id = esc(String(c.id));
  const max = parseInt(c.pvMax) || 0;
  const pv = c.pv ?? max;
  const vinc = c.vinculo || {};
  const aba = window._comp.aba || "ataques";
  const nAtk = (c.ataques || []).length;
  const nHab = (c.habilidades || []).length;
  const nIt = (c.itens || []).length;

  const atributos = ATRIBS_COMP.map((a) => {
    const m = modComp(c, a);
    return m === null
      ? `<div class="comp-at vazio"><span>${SIGLAS_ATRIBUTO[a]}</span><b>—</b></div>`
      : `<button type="button" class="comp-at" onclick="rolarAtribComp('${id}','${a}')"><span>${SIGLAS_ATRIBUTO[a]}</span><b>${fmtBonus(m)}</b><small>${esc(String(c.atributos[a]))}</small></button>`;
  }).join("");
  const temAttr = ATRIBS_COMP.some((a) => modComp(c, a) !== null);

  let conteudo = "";
  if (aba === "ataques") {
    conteudo =
      (nAtk
        ? (c.ataques || [])
            .map((a, i) => {
              const atk = calcAtaqueComp(c, a);
              const dn = exprDanoComp(c, a);
              return `
            <div class="comp-golpe" onclick="abrirFormAtaqueComp('${id}', ${i})">
              <div class="comp-golpe-info">
                <strong>${esc(a.nome || "Ataque")}</strong>
                ${a.desc ? `<span>${esc(a.desc)}</span>` : ""}
              </div>
              <div class="comp-golpe-dados">
                <button type="button" class="comp-dado atk" onclick="event.stopPropagation(); rolarAtaqueComp('${id}', ${i})"><small>acerto</small><b>${fmtBonus(atk.total)}</b></button>
                ${dn.expr
                  ? `<button type="button" class="comp-dado dano" onclick="event.stopPropagation(); rolarDanoComp('${id}', ${i})"><small>dano</small><b>${esc(dn.texto)}</b></button>`
                  : a.dano ? `<span class="comp-dado dano parado"><small>dano</small><b>${esc(a.dano)}</b></span>` : ""}
              </div>
            </div>`;
            })
            .join("")
        : `<p class="comp-nada">Nenhum ataque ainda. Mordida, coice, garras...</p>`) +
      `<button type="button" class="comp-add-linha" onclick="abrirFormAtaqueComp('${id}')"><i class="ti ti-plus"></i> Adicionar ataque</button>`;
  } else if (aba === "habilidades") {
    conteudo =
      (nHab
        ? (c.habilidades || [])
            .map((h, i) => `
            <div class="comp-hab" onclick="abrirFormHabComp('${id}', ${i})">
              <strong>${esc(h.nome || "Habilidade")}</strong>
              ${h.desc ? `<p>${esc(h.desc)}</p>` : ""}
            </div>`)
            .join("")
        : `<p class="comp-nada">Nenhuma habilidade ainda. Faro, truques, comandos que ele conhece...</p>`) +
      `<button type="button" class="comp-add-linha" onclick="abrirFormHabComp('${id}')"><i class="ti ti-plus"></i> Adicionar habilidade</button>`;
  } else if (aba === "itens") {
    conteudo =
      (nIt
        ? `<div class="comp-alforje">${(c.itens || [])
            .map((it, i) => `
            <div class="comp-item">
              <span class="comp-item-nome">${esc(it.nome)}${(it.qtd || 1) > 1 ? ` <small>x${it.qtd}</small>` : ""}</span>
              <button type="button" class="comp-item-btn" title="Passar pro meu inventário" onclick="pegarItemComp('${id}', ${i})"><i class="ti ti-arrow-bar-up"></i></button>
              <button type="button" class="comp-item-btn perigo" title="Jogar fora" onclick="removerItemComp('${id}', ${i})"><i class="ti ti-x"></i></button>
            </div>`)
            .join("")}</div>`
        : `<p class="comp-nada">Ele não está carregando nada.</p>`) +
      `<div class="comp-add-duplo">
        <button type="button" class="comp-add-linha" onclick="abrirInventarioParaComp('${id}')"><i class="ti ti-backpack"></i> Do meu inventário</button>
        <button type="button" class="comp-add-linha" onclick="abrirFormItemComp('${id}')"><i class="ti ti-plus"></i> Item novo</button>
      </div>`;
  } else {
    conteudo = `<textarea class="comp-notas" placeholder="Como conseguiu, do que gosta, comandos que conhece..." oninput="notasComp('${id}', this.value)">${esc(c.notas || "")}</textarea>`;
  }

  const abaBtn = (k, ic, rot, n) =>
    `<button type="button" class="${aba === k ? "ativo" : ""}" onclick="trocarAbaComp('${k}')"><i class="ti ${ic}"></i><span>${rot}</span>${n ? `<small>${n}</small>` : ""}</button>`;

  box.innerHTML = `
    <div class="comp-det">
      <div class="comp-det-topo">
        <button type="button" class="comp-voltar" onclick="fecharComp()" aria-label="Voltar"><i class="ti ti-chevron-left"></i></button>
        <div class="comp-det-acoes">
          <button type="button" class="comp-ico" title="Editar" onclick="abrirFormComp('${id}')"><i class="ti ti-pencil"></i></button>
          <button type="button" class="comp-ico perigo" title="Remover companheiro" onclick="removerComp('${id}')"><i class="ti ti-trash"></i></button>
        </div>
      </div>

      <div class="comp-perfil">
        ${retratoComp(c, true)}
        <strong class="comp-perfil-nome">${esc(c.nome || "Sem nome")}</strong>
        <span class="comp-tipo"><span class="comp-emoji">${t[0]}</span>${t[1]}</span>
        ${c.especie ? `<small class="comp-perfil-esp">${esc(c.especie)}</small>` : ""}

        ${max > 0
          ? `<div class="comp-vida">
              <button type="button" onclick="alterarPVComp('${id}', -1)" aria-label="Menos 1">−</button>
              <button type="button" class="comp-vida-num" onclick="alterarPVCompValor('${id}')" title="Dano ou cura de uma vez">
                <i class="ti ti-heart-filled" style="color:${corVidaComp(Math.max(0, pv / max))}"></i><b>${pv}</b><small>/ ${max}</small>
              </button>
              <button type="button" onclick="alterarPVComp('${id}', 1)" aria-label="Mais 1">+</button>
            </div>
            <small class="comp-dica">toque no número para dano ou cura de uma vez</small>`
          : ""}
      </div>

      <div class="comp-pilulas">
        <div class="comp-pilula"><i class="ti ti-shield"></i><span>CA</span><b>${esc(String(c.ca || "—"))}</b></div>
        <div class="comp-pilula"><i class="ti ti-route"></i><span>Desloc.</span><b>${esc(c.desloc || "—")}</b></div>
      </div>

      ${vinc.ativo
        ? `<div class="comp-vinculo-box"><span><i class="ti ti-heart-handshake"></i> ${esc(vinc.nome || "Vínculo")}</span>${pipsVinculoComp(c, id)}</div>`
        : ""}

      ${temAttr ? `<div class="comp-ats">${atributos}</div>` : ""}

      <div class="comp-abas">
        ${abaBtn("ataques", "ti-paw", "Ataques", nAtk)}
        ${abaBtn("habilidades", "ti-sparkles", "Habilidades", nHab)}
        ${abaBtn("itens", "ti-backpack", "Carrega", nIt)}
        ${abaBtn("notas", "ti-notes", "Notas", 0)}
      </div>
      <div class="comp-aba-conteudo">${conteudo}</div>
    </div>`;
}

function abrirComp(id) {
  window._comp.aberto = id;
  renderCompanheiros();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function fecharComp() {
  window._comp.aberto = null;
  renderCompanheiros();
}

/* ---------- criar / editar ---------- */
function abrirFormComp(id) {
  const c = id ? acharComp(id) : null;
  const e = c || { tipo: "fera", atributos: {}, vinculo: {} };
  const v = e.vinculo || {};
  window._comp.imgTemp = "";
  const html = `
    <div class="popup-form">
      <label class="popup-label">Tipo</label>
      <div class="veic-tipos" id="cTipo" data-valor="${esc(e.tipo || "fera")}">
        ${Object.entries(TIPOS_COMP)
          .map(([k, [ic, rot]]) => `<button type="button" class="veic-tipo-opt ${k === (e.tipo || "fera") ? "ativo" : ""}" onclick="escolherTipoComp(this, '${k}')"><span class="comp-emoji">${ic}</span><small>${rot}</small></button>`)
          .join("")}
      </div>

      <label class="popup-label">Nome</label>
      <input id="cNome" value="${esc(e.nome || "")}" placeholder="Ex: Fenrir">
      <label class="popup-label">Espécie / descrição curta</label>
      <input id="cEspecie" value="${esc(e.especie || "")}" placeholder="Ex: Lobo cinzento, domado na floresta">

      <div class="pf-duplo">
        <div><span class="pf-mini">PV máximo</span><input id="cPvMax" type="number" min="0" value="${e.pvMax || ""}" placeholder="Ex: 11"></div>
        <div><span class="pf-mini">CA</span><input id="cCA" value="${esc(String(e.ca || ""))}" placeholder="Ex: 13"></div>
      </div>
      <span class="pf-mini">Deslocamento</span>
      <input id="cDesloc" value="${esc(e.desloc || "")}" placeholder="Ex: 12 m">

      <label class="popup-label">Atributos <small>(opcional)</small></label>
      <div class="comp-attrs-form">
        ${ATRIBS_COMP.map((a) => `<label><span>${SIGLAS_ATRIBUTO[a]}</span><input id="cAttr_${a}" type="number" value="${esc(String(e.atributos?.[a] ?? ""))}" placeholder="—"></label>`).join("")}
      </div>

      <div class="toggle-cargas" style="margin-top:6px;">
        <span class="toggle-cargas-texto">Contador de vínculo / lealdade</span>
        <label class="switch-cargas"><input type="checkbox" id="cVincAtivo" ${v.ativo ? "checked" : ""} onchange="document.getElementById('cVincBox').style.display=this.checked?'grid':'none'"><span class="slider-cargas"></span></label>
      </div>
      <div class="pf-duplo" id="cVincBox" style="display:${v.ativo ? "grid" : "none"}">
        <div><span class="pf-mini">Nome do contador</span><input id="cVincNome" value="${esc(v.nome || "")}" placeholder="Vínculo"></div>
        <div><span class="pf-mini">Máximo</span><input id="cVincMax" type="number" min="0" value="${v.max || ""}" placeholder="Ex: 5"></div>
      </div>

      <label class="popup-label">Imagem (opcional)</label>
      <input type="file" id="cImagem" accept="image/*" onchange="previewImagemComp(this)">
      <label for="cImagem" class="botao-upload"><i class="ti ti-photo-plus"></i><span>${e.imagemUrl ? "Trocar imagem" : "Adicionar imagem"}</span></label>
      <img id="cImagemPreview" src="${esc(e.imagemUrl || "")}" style="display:${e.imagemUrl ? "block" : "none"}; width:100%; max-height:200px; object-fit:cover; border-radius:12px;">
      ${e.imagemUrl ? `<span class="link-remover-imagem" onclick="window._comp.imgTemp='REMOVIDA'; document.getElementById('cImagemPreview').style.display='none'"><i class="ti ti-trash"></i> Remover imagem</span>` : ""}

      <button class="popup-salvar-btn" id="cSalvar" onclick="salvarFormComp(${id ? `'${esc(String(id))}'` : "null"})">${id ? "Salvar" : "Criar companheiro"}</button>
    </div>`;
  abrirPopup(id ? `Editar ${e.nome || "companheiro"}` : "Novo companheiro", html, true, null);
}

function escolherTipoComp(btn, tipo) {
  const box = document.getElementById("cTipo");
  if (!box) return;
  box.dataset.valor = tipo;
  box.querySelectorAll(".veic-tipo-opt").forEach((b) => b.classList.toggle("ativo", b === btn));
}

function previewImagemComp(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    window._comp.imgTemp = r.result;
    const img = document.getElementById("cImagemPreview");
    if (img) {
      img.src = r.result;
      img.style.display = "block";
    }
  };
  r.readAsDataURL(f);
}

async function salvarFormComp(id) {
  const nome = document.getElementById("cNome")?.value.trim();
  if (!nome) return document.getElementById("cNome")?.focus();
  const btn = document.getElementById("cSalvar");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Salvando...";
  }
  const atual = id ? acharComp(id) : null;
  const pvMax = Math.max(0, parseInt(document.getElementById("cPvMax").value) || 0);
  const atributos = {};
  ATRIBS_COMP.forEach((a) => {
    const n = parseInt(document.getElementById("cAttr_" + a)?.value);
    if (!isNaN(n)) atributos[a] = n;
  });
  const vincAtivo = !!document.getElementById("cVincAtivo")?.checked;
  const vincMax = Math.max(0, parseInt(document.getElementById("cVincMax")?.value) || 0);
  const vincAntes = atual?.vinculo?.atual ?? 0;

  const dados = {
    nome,
    tipo: document.getElementById("cTipo")?.dataset.valor || "fera",
    especie: document.getElementById("cEspecie").value.trim(),
    pvMax,
    ca: document.getElementById("cCA").value.trim(),
    desloc: document.getElementById("cDesloc").value.trim(),
    atributos,
    vinculo: { ativo: vincAtivo, nome: document.getElementById("cVincNome")?.value.trim() || "", max: vincMax, atual: vincMax ? Math.min(vincAntes, vincMax) : vincAntes },
  };

  let imagemUrl = atual?.imagemUrl || "";
  let imagemDeleteUrl = atual?.imagemDeleteUrl || "";
  if (window._comp.imgTemp === "REMOVIDA") {
    imagemUrl = "";
    imagemDeleteUrl = "";
  } else if (window._comp.imgTemp) {
    const up = await uploadImagemFirebase(window._comp.imgTemp, "companheiro");
    if (up.url) {
      imagemUrl = up.url;
      imagemDeleteUrl = up.deleteUrl || "";
    } else alertBonito(_mensagemErroUpload("O companheiro vai ser salvo sem a imagem nova."));
  }
  dados.imagemUrl = imagemUrl;
  dados.imagemDeleteUrl = imagemDeleteUrl;

  if (atual) {
    Object.assign(atual, dados);
    if (pvMax && (atual.pv == null || atual.pv > pvMax)) atual.pv = pvMax;
  } else {
    listaComp().push({ id: gerarIdItem(), ...dados, pv: pvMax, ataques: [], habilidades: [], itens: [], notas: "" });
  }
  window._comp.imgTemp = "";
  salvarComp();
  fecharPopup();
  renderCompanheiros();
}

async function removerComp(id) {
  const c = acharComp(id);
  if (!c) return;
  if (!(await confirmBonito(`Remover ${c.nome || "esse companheiro"}? Ataques, habilidades e itens dele somem junto.`))) return;
  const p = personagens[personagemAtual];
  p.companheiros = listaComp().filter((x) => x !== c);
  window._comp.aberto = null;
  salvarComp();
  renderCompanheiros();
}

/* ---------- PV e vínculo ---------- */
function alterarPVComp(id, delta) {
  const c = acharComp(id);
  if (!c) return;
  const max = parseInt(c.pvMax) || 0;
  c.pv = Math.max(0, Math.min(max, (c.pv ?? max) + delta));
  salvarComp();
  renderCompanheiros();
}
async function alterarPVCompValor(id) {
  const v = await promptBonito("Dano (ex: -7) ou cura (ex: 5):", "");
  const n = parseInt(v);
  if (n) alterarPVComp(id, n);
}
function mudarVinculoComp(id, delta) {
  const c = acharComp(id);
  if (!c || !c.vinculo) return;
  const max = parseInt(c.vinculo.max) || 0;
  let n = (parseInt(c.vinculo.atual) || 0) + delta;
  n = Math.max(0, max ? Math.min(max, n) : n);
  c.vinculo.atual = n;
  salvarComp();
  renderCompanheiros();
}

/* ---------- rolagens ---------- */
function rolarAtribComp(id, attr) {
  const c = acharComp(id);
  const m = modComp(c, attr);
  if (m === null) return;
  rolarD20(`${NOMES_ATRIBUTO[attr]} · ${c.nome || "companheiro"}`, m, "normal", [], `${m < 0 ? "−" : "+"} ${SIGLAS_ATRIBUTO[attr]} ${Math.abs(m)}`);
}
function rolarAtaqueComp(id, i) {
  const c = acharComp(id);
  const a = c?.ataques?.[i];
  if (!a) return;
  const atk = calcAtaqueComp(c, a);
  const extras = exprDanoComp(c, a).expr ? [{ rotulo: "Dano", acao: () => rolarDanoComp(id, i) }] : [];
  rolarD20(`${a.nome || "Ataque"} · ${c.nome || "companheiro"}`, atk.total, "normal", extras, atk.composicao);
}
function rolarDanoComp(id, i) {
  const c = acharComp(id);
  const a = c?.ataques?.[i];
  if (!a) return;
  const { expr } = exprDanoComp(c, a);
  if (!expr) return;
  rolarDano(`Dano · ${a.nome || "ataque"} (${c.nome || "companheiro"})`, expr, false, [{ rotulo: "Ataque", acao: () => rolarAtaqueComp(id, i) }]);
}

/* ---------- ataques ---------- */
function abrirFormAtaqueComp(id, i) {
  const c = acharComp(id);
  if (!c) return;
  const a = i != null ? c.ataques[i] : { atributo: ATRIBS_COMP.find((x) => modComp(c, x) !== null) ? "forca" : "", somarAtribDano: true };
  const sid = esc(String(id));
  const opts = [`<option value="">Nenhum</option>`]
    .concat(ATRIBS_COMP.map((k) => `<option value="${k}" ${k === a.atributo ? "selected" : ""}>${NOMES_ATRIBUTO[k]}${modComp(c, k) !== null ? ` (${fmtBonus(modComp(c, k))})` : ""}</option>`))
    .join("");
  const html = `
    <div class="popup-form">
      <label class="popup-label">Nome</label>
      <input id="caNome" value="${esc(a.nome || "")}" placeholder="Ex: Mordida">
      <label class="popup-label">Dano</label>
      <input id="caDano" value="${esc(a.dano || "")}" placeholder="Ex: 2d4 perfurante" oninput="previewAtaqueComp('${sid}')">
      <div class="arma-atk-box">
        <div class="arma-atk-topo"><span class="mods-titulo"><i class="ti ti-sword"></i> Ataque e dano</span><span class="arma-atk-preview" id="caPreview"></span></div>
        <label class="arma-atk-campo"><span>Atributo do companheiro</span><select id="caAtrib" onchange="previewAtaqueComp('${sid}')">${opts}</select></label>
        <div class="arma-atk-linha">
          <label class="arma-atk-campo"><span>Bônus no ataque</span><input id="caBonusAtk" type="number" placeholder="0" value="${a.bonusAtaque || ""}" oninput="previewAtaqueComp('${sid}')"></label>
          <label class="arma-atk-campo"><span>Bônus no dano</span><input id="caBonusDano" type="number" placeholder="0" value="${a.bonusDano || ""}" oninput="previewAtaqueComp('${sid}')"></label>
        </div>
        <div class="toggle-cargas">
          <span class="toggle-cargas-texto">Somar atributo no dano</span>
          <label class="switch-cargas"><input type="checkbox" id="caSomaDano" ${a.somarAtribDano ? "checked" : ""} onchange="previewAtaqueComp('${sid}')"><span class="slider-cargas"></span></label>
        </div>
      </div>
      <label class="popup-label">Descrição (opcional)</label>
      <textarea id="caDesc" placeholder="Ex: se acertar, o alvo faz teste ou cai">${esc(a.desc || "")}</textarea>
      <button class="popup-salvar-btn" onclick="salvarAtaqueComp('${sid}', ${i != null ? i : "null"})">${i != null ? "Salvar" : "Adicionar ataque"}</button>
      ${i != null ? `<button type="button" class="veic-btn-sec perigo" onclick="removerAtaqueComp('${sid}', ${i})"><i class="ti ti-trash"></i> Remover ataque</button>` : ""}
    </div>`;
  abrirPopup(i != null ? `Editar ${a.nome || "ataque"}` : "Novo ataque", html, true, null);
  previewAtaqueComp(id);
}
function lerAtaqueComp() {
  return {
    nome: document.getElementById("caNome")?.value.trim() || "",
    dano: document.getElementById("caDano")?.value.trim() || "",
    atributo: document.getElementById("caAtrib")?.value || "",
    bonusAtaque: parseInt(document.getElementById("caBonusAtk")?.value) || 0,
    bonusDano: parseInt(document.getElementById("caBonusDano")?.value) || 0,
    somarAtribDano: !!document.getElementById("caSomaDano")?.checked,
    desc: document.getElementById("caDesc")?.value.trim() || "",
  };
}
function previewAtaqueComp(id) {
  const c = acharComp(id);
  const out = document.getElementById("caPreview");
  if (!c || !out) return;
  const a = lerAtaqueComp();
  const dn = exprDanoComp(c, a);
  out.innerHTML = `Ataque <b>${fmtBonus(calcAtaqueComp(c, a).total)}</b>${dn.texto ? ` · Dano <b>${esc(dn.texto)}</b>` : ""}`;
}
function salvarAtaqueComp(id, i) {
  const c = acharComp(id);
  if (!c) return;
  const a = lerAtaqueComp();
  if (!a.nome) return document.getElementById("caNome")?.focus();
  if (!Array.isArray(c.ataques)) c.ataques = [];
  if (i != null) c.ataques[i] = a;
  else c.ataques.push(a);
  salvarComp();
  fecharPopup();
  renderCompanheiros();
}
async function removerAtaqueComp(id, i) {
  const c = acharComp(id);
  if (!c || !(await confirmBonito(`Remover o ataque "${c.ataques[i]?.nome || ""}"?`))) return;
  c.ataques.splice(i, 1);
  salvarComp();
  fecharPopup();
  renderCompanheiros();
}

/* ---------- habilidades ---------- */
function abrirFormHabComp(id, i) {
  const c = acharComp(id);
  if (!c) return;
  const h = i != null ? c.habilidades[i] : {};
  const sid = esc(String(id));
  const html = `
    <div class="popup-form">
      <label class="popup-label">Nome</label>
      <input id="chNome" value="${esc(h.nome || "")}" placeholder="Ex: Faro aguçado">
      <label class="popup-label">Descrição</label>
      <textarea id="chDesc" placeholder="O que ela faz">${esc(h.desc || "")}</textarea>
      <button class="popup-salvar-btn" onclick="salvarHabComp('${sid}', ${i != null ? i : "null"})">${i != null ? "Salvar" : "Adicionar habilidade"}</button>
      ${i != null ? `<button type="button" class="veic-btn-sec perigo" onclick="removerHabComp('${sid}', ${i})"><i class="ti ti-trash"></i> Remover habilidade</button>` : ""}
    </div>`;
  abrirPopup(i != null ? h.nome || "Habilidade" : "Nova habilidade", html, true, null);
}
function salvarHabComp(id, i) {
  const c = acharComp(id);
  if (!c) return;
  const nome = document.getElementById("chNome")?.value.trim();
  if (!nome) return document.getElementById("chNome")?.focus();
  const h = { nome, desc: document.getElementById("chDesc")?.value.trim() || "" };
  if (!Array.isArray(c.habilidades)) c.habilidades = [];
  if (i != null) c.habilidades[i] = h;
  else c.habilidades.push(h);
  salvarComp();
  fecharPopup();
  renderCompanheiros();
}
async function removerHabComp(id, i) {
  const c = acharComp(id);
  if (!c || !(await confirmBonito(`Remover "${c.habilidades[i]?.nome || ""}"?`))) return;
  c.habilidades.splice(i, 1);
  salvarComp();
  fecharPopup();
  renderCompanheiros();
}

/* ---------- itens carregados ---------- */
function abrirFormItemComp(id) {
  const sid = esc(String(id));
  const html = `
    <div class="popup-form">
      <label class="popup-label">Item</label>
      <input id="ciNome" placeholder="Ex: Alforje com rações">
      <label class="popup-label">Quantidade</label>
      <input id="ciQtd" type="number" min="1" value="1">
      <button class="popup-salvar-btn" onclick="salvarItemComp('${sid}')">Adicionar</button>
    </div>`;
  abrirPopup("Item do companheiro", html, true, null);
  setTimeout(() => document.getElementById("ciNome")?.focus(), 50);
}
function salvarItemComp(id) {
  const c = acharComp(id);
  const nome = document.getElementById("ciNome")?.value.trim();
  if (!c || !nome) return;
  const qtd = Math.max(1, parseInt(document.getElementById("ciQtd")?.value) || 1);
  if (!Array.isArray(c.itens)) c.itens = [];
  const igual = c.itens.find((x) => x.nome.toLowerCase() === nome.toLowerCase());
  if (igual) igual.qtd = (igual.qtd || 1) + qtd;
  else c.itens.push({ nome, qtd });
  salvarComp();
  fecharPopup();
  renderCompanheiros();
}
async function removerItemComp(id, i) {
  const c = acharComp(id);
  const it = c?.itens?.[i];
  if (!it || !(await confirmBonito(`Jogar fora "${it.nome}"?`))) return;
  c.itens.splice(i, 1);
  salvarComp();
  renderCompanheiros();
}
function pegarItemComp(id, i) {
  const c = acharComp(id);
  const it = c?.itens?.[i];
  if (!it) return;
  const base = { ...it };
  delete base.id;
  const igual = inventario.find(
    (x) => x && !x.recipiente && !x.bolsa && !x.dentroDe && chaveMesclagem("inventario", x) && chaveMesclagem("inventario", x) === chaveMesclagem("inventario", base),
  );
  if (igual) igual.qtd = (parseInt(igual.qtd) || 1) + (parseInt(it.qtd) || 1);
  else inventario.push({ desc: "", ...base, id: gerarIdItem(), qtd: it.qtd || 1, dentroDe: "" });
  c.itens.splice(i, 1);
  if (typeof renderInv === "function") renderInv();
  salvarComp();
  renderCompanheiros();
  if (typeof mostrarToastMundo === "function") mostrarToastMundo(`${it.nome} foi pro seu inventário`);
}

/* ---------- anotações ---------- */
function notasComp(id, txt) {
  const c = acharComp(id);
  if (!c) return;
  c.notas = txt;
  clearTimeout(window._comp.tNotas);
  window._comp.tNotas = setTimeout(salvarComp, 600);
}

/* ---------- mandar item do inventário pro companheiro ---------- */
function podeIrProComp(item) {
  if (!item || item.bolsa) return false;
  if (item.recipiente && typeof filhosDoRecipiente === "function" && filhosDoRecipiente(item.id).length) return false;
  return true;
}

function abrirEscolherCompParaItem(index) {
  const item = inventario[index];
  if (!item) return;
  const lista = listaComp();
  if (lista.length === 1) return mandarItemProComp(lista[0].id, index);
  const html = `
    <div class="comp-escolha">
      ${lista
        .map(
          (c) => `<button type="button" class="comp-escolha-op" onclick="mandarItemProComp('${esc(String(c.id))}', ${index})">
            ${retratoComp(c)}
            <span><strong>${esc(c.nome || "Sem nome")}</strong><small>${(TIPOS_COMP[c.tipo] || TIPOS_COMP.outro)[1]} · carrega ${(c.itens || []).length}</small></span>
          </button>`,
        )
        .join("")}
    </div>`;
  abrirPopup(`Dar "${item.nome}" pra quem?`, html, true, null);
}

function abrirInventarioParaComp(cid) {
  const c = acharComp(cid);
  if (!c) return;
  const op = inventario
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => podeIrProComp(it))
    .map(
      ({ it, i }) => `<button type="button" class="comp-inv-op" onclick="mandarItemProComp('${esc(String(cid))}', ${i})">
        <span>${esc(it.nome || "Sem nome")}${(it.qtd || 1) > 1 ? ` <small>x${it.qtd}</small>` : ""}</span>
        <i class="ti ti-chevron-right"></i>
      </button>`,
    )
    .join("");
  abrirPopup(
    `Dar pro ${c.nome || "companheiro"}`,
    op ? `<div class="comp-inv-lista">${op}</div>` : `<p class="comp-nada">Nada no inventário que dê pra passar. Bolsas de dinheiro e mochilas com coisas dentro ficam com você.</p>`,
    true,
    null,
  );
}

async function mandarItemProComp(cid, index) {
  const c = acharComp(cid);
  const item = inventario[index];
  if (!c || !item) return;
  const tem = parseInt(item.qtd) || 1;
  let quantos = tem;
  if (tem > 1) {
    const r = await promptBonito(`Quantos "${item.nome}" pro ${c.nome || "companheiro"}? (tem ${tem})`, String(tem));
    if (r == null || !parseInt(r)) return;
    quantos = Math.max(1, Math.min(tem, parseInt(r)));
  }
  const copia = { ...item };
  delete copia.id;
  copia.dentroDe = "";
  copia.qtd = quantos;
  if (!Array.isArray(c.itens)) c.itens = [];
  const chave = chaveMesclagem("inventario", copia);
  const igual = chave && c.itens.find((x) => chaveMesclagem("inventario", x) === chave);
  if (igual) igual.qtd = (parseInt(igual.qtd) || 1) + quantos;
  else c.itens.push(copia);

  if (quantos >= tem) inventario.splice(index, 1);
  else item.qtd = tem - quantos;

  renderInv();
  salvarComp();
  fecharPopup();
  if (window._comp.aberto) {
    window._comp.aba = "itens";
    renderCompanheiros();
  }
  if (typeof mostrarToastMundo === "function") mostrarToastMundo(`${quantos > 1 ? quantos + "x " : ""}${item.nome} foi pro ${c.nome || "companheiro"}`);
}

var VERSAO_FICHA = "web-2026-11-04zb";
console.log("%cFicha Ígnea " + VERSAO_FICHA, "color:#d8b56a;font-weight:bold");

/* ---------- tela de login ---------- */
function alternarSenhaLogin() {
  const inp = document.getElementById("loginSenha");
  const btn = document.getElementById("loginOlho");
  if (!inp) return;
  const mostrar = inp.type === "password";
  inp.type = mostrar ? "text" : "password";
  if (btn) {
    btn.innerHTML = `<i class="ti ${mostrar ? "ti-eye-off" : "ti-eye"}"></i>`;
    btn.setAttribute("aria-label", mostrar ? "Esconder senha" : "Mostrar senha");
  }
  inp.focus();
}

(function prepararLogin() {
  const iniciar = () => {
    try {
      const salvo = localStorage.getItem("ultimoEmailLogin");
      const inp = document.getElementById("loginEmail");
      if (salvo && inp && !inp.value) inp.value = salvo;
    } catch (e) {}
    const rod = document.getElementById("loginRodape");
    if (rod && typeof VERSAO_FICHA !== "undefined") rod.textContent = "Ficha Ígnea · versão " + VERSAO_FICHA.split(" ")[0];
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();

function abrirCriarConta() {
  const emailLogin = document.getElementById("loginEmail")?.value.trim() || "";
  const enter = (prox) => `onkeydown="if(event.key==='Enter'){event.preventDefault();${prox}}"`;
  const html = `
    <div class="popup-form cc-form">
      <p class="cc-intro">Com uma conta, suas fichas ficam salvas na nuvem e você pode abrir em qualquer aparelho, entrar em grupos com os amigos e jogar com o mestre.</p>

      <label class="popup-label">Email</label>
      <input id="ccEmail" type="email" inputmode="email" autocomplete="email" placeholder="seuemail@exemplo.com" value="${esc(emailLogin)}" ${enter("document.getElementById('ccSenha').focus();")}>

      <label class="popup-label">Senha</label>
      <div class="lg-senha cc-senha">
        <input id="ccSenha" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" ${enter("document.getElementById('ccConfirma').focus();")}>
        <button type="button" class="lg-olho" onclick="alternarSenhaCC(this)" aria-label="Mostrar senha"><i class="ti ti-eye"></i></button>
      </div>

      <label class="popup-label">Confirmar senha</label>
      <input id="ccConfirma" type="password" autocomplete="new-password" placeholder="Digite a senha de novo" ${enter("criarContaPopup();")}>

      <div id="ccErro" class="login-erro cc-erro"></div>

      <button type="button" class="inv-add-btn btn-adicionar cc-criar" id="ccCriar" onclick="criarContaPopup()"><span>Criar conta</span></button>
      <p class="cc-depois">Depois de criar, você escolhe seu nome de jogador (é como seus amigos te encontram).</p>
    </div>`;
  abrirPopup("Criar conta", html, true, null);
  setTimeout(() => document.getElementById(emailLogin ? "ccSenha" : "ccEmail")?.focus(), 60);
}

function alternarSenhaCC(btn) {
  const mostrar = document.getElementById("ccSenha")?.type === "password";
  ["ccSenha", "ccConfirma"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.type = mostrar ? "text" : "password";
  });
  if (btn) btn.innerHTML = `<i class="ti ${mostrar ? "ti-eye-off" : "ti-eye"}"></i>`;
}

/* =====================================================================
   PERFIL: mural, elogios, conquistas, títulos, estatísticas de dados,
   procurando mesa, status, ações, molduras e fundos
   usuarios/{uid}                 → stats, conquistas, titulo, moldura, efeitoFundo,
                                    procurandoMesa, vistoEm, atividade, mostrarStatus
   usuarios/{uid}/recados/{id}    → recados do mural (só amigos escrevem)
   usuarios/{uid}/elogios/{deUid} → selos que cada amigo deu
   ===================================================================== */

var SELOS_ELOGIO = [
  { id: "rp", ic: "🎭", nome: "Bom de RP" },
  { id: "justo", ic: "⚖️", nome: "Mestre justo" },
  { id: "nat20", ic: "🎲", nome: "Rei do nat 20" },
  { id: "salvou", ic: "🛡️", nome: "Salvou o grupo" },
  { id: "estrategista", ic: "🧠", nome: "Estrategista" },
  { id: "comico", ic: "😂", nome: "Alívio cômico" },
  { id: "narrador", ic: "📜", nome: "Narrador nato" },
  { id: "leal", ic: "🤝", nome: "Parceiro leal" },
];

var CONQUISTAS = [
  { id: "primeira_rolagem", ic: "🎲", nome: "Primeiros dados", desc: "Rolou o primeiro dado no app.", titulo: "Aprendiz dos Dados", ok: (c) => c.stats.rolagens >= 1 },
  { id: "nat20", ic: "✨", nome: "Crítico!", desc: "Tirou o primeiro 20 natural.", titulo: "Tocado pela Sorte", ok: (c) => c.stats.nat20 >= 1 },
  { id: "nat20_10", ic: "🌟", nome: "Favorito dos deuses", desc: "10 vezes 20 natural.", titulo: "Favorito dos Deuses", ok: (c) => c.stats.nat20 >= 10 },
  { id: "nat1_10", ic: "💀", nome: "Dado amaldiçoado", desc: "10 vezes 1 natural.", titulo: "Amaldiçoado dos Dados", ok: (c) => c.stats.nat1 >= 10 },
  { id: "rol_100", ic: "🔥", nome: "Mão quente", desc: "100 rolagens.", titulo: "Mão Quente", ok: (c) => c.stats.rolagens >= 100 },
  { id: "rol_1000", ic: "☄️", nome: "Lenda das rolagens", desc: "1000 rolagens.", titulo: "Lenda das Rolagens", ok: (c) => c.stats.rolagens >= 1000 },
  { id: "dano_50", ic: "💥", nome: "Golpe devastador", desc: "Rolou 50 ou mais de dano de uma vez.", titulo: "Destruidor", ok: (c) => c.stats.maiorDano >= 50 },
  { id: "por_um_fio", ic: "🩸", nome: "Por um fio", desc: "Ficou com 1 PV e continuou de pé.", titulo: "Sobrevivente", ok: (c) => !!c.stats.porUmFio },
  { id: "fichas_3", ic: "📚", nome: "Colecionador de heróis", desc: "Tem 3 fichas ou mais.", titulo: "Colecionador de Heróis", ok: (c) => c.nFichas >= 3 },
  { id: "domador", ic: "🐾", nome: "Domador", desc: "Tem um companheiro numa ficha.", titulo: "Domador de Feras", ok: (c) => c.temCompanheiro },
  { id: "grupo", ic: "🏕️", nome: "Companhia formada", desc: "Entrou num grupo.", titulo: "Membro da Companhia", ok: (c) => c.emGrupo },
  { id: "mestre", ic: "📖", nome: "Narrador", desc: "Criou a primeira campanha.", titulo: "Narrador", ok: (c) => c.nCampanhas >= 1 },
  { id: "mestre_3", ic: "🗺️", nome: "Mestre de mundos", desc: "3 campanhas ou mais.", titulo: "Mestre de Mundos", ok: (c) => c.nCampanhas >= 3 },
  { id: "amigos_5", ic: "🍻", nome: "Taverneiro popular", desc: "5 amigos ou mais.", titulo: "Taverneiro Popular", ok: (c) => c.nAmigos >= 5 },
  { id: "elogiado_10", ic: "🏅", nome: "Querido da mesa", desc: "Recebeu 10 elogios.", titulo: "Querido da Mesa", ok: (c) => c.nElogios >= 10 },
];

// molduras do avatar e efeitos do fundo: livre, por conquista ou por plano pago
var MOLDURAS = [
  { id: "", nome: "Simples" },
  { id: "ouro", nome: "Ouro" },
  { id: "brasas", nome: "Brasas", conquista: "nat20" },
  { id: "runas", nome: "Runas", conquista: "mestre" },
  { id: "sangue", nome: "Sangue", conquista: "nat1_10" },
  { id: "natureza", nome: "Natureza", conquista: "domador" },
  { id: "lendaria", nome: "Lendária", plano: true },
  { id: "gelo", nome: "Gelo", plano: true },
];
var EFEITOS_FUNDO = [
  { id: "", nome: "Nenhum" },
  { id: "nevoa", nome: "Névoa", conquista: "grupo" },
  { id: "estrelas", nome: "Estrelas", conquista: "rol_100" },
  { id: "brasas", nome: "Brasas subindo", plano: true },
  { id: "runas", nome: "Runas girando", plano: true },
];

var DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

window._pf = window._pf || { uid: null, ehMeu: false, d: {}, ehAmigo: false, recados: [], elogios: [], unsubRecados: null };

function pfStatsVazias() {
  return { rolagens: 0, d20: 0, nat20: 0, nat1: 0, maiorDano: 0, porUmFio: false };
}

/* ---------- estatísticas de dados (contadas no próprio aparelho e salvas no perfil) ---------- */
window._pfStats = null;
window._pfStatsCarregando = null;

async function pfGarantirStats() {
  if (window._pfStats) return window._pfStats;
  if (window._pfStatsCarregando) return window._pfStatsCarregando;
  window._pfStatsCarregando = (async () => {
    let base = pfStatsVazias();
    try {
      const uid = window.usuarioAtual?.uid;
      if (uid && window.getDoc) {
        const s = await getDoc(doc(db, "usuarios", uid));
        if (s.exists() && s.data().stats) base = { ...base, ...s.data().stats };
      }
    } catch (e) {}
    window._pfStats = base;
    return base;
  })();
  return window._pfStatsCarregando;
}

function pfSalvarStatsDepois() {
  clearTimeout(window._pfStatsTimer);
  window._pfStatsTimer = setTimeout(async () => {
    const uid = window.usuarioAtual?.uid;
    if (!uid || !window._pfStats || !window.setDoc) return;
    try {
      await setDoc(doc(db, "usuarios", uid), { stats: window._pfStats }, { merge: true });
    } catch (e) {
      console.warn("stats:", e.code || e.message);
    }
  }, 4000);
}

async function pfContarRolagem(r) {
  if (!window.usuarioAtual) return;
  const st = await pfGarantirStats();
  st.rolagens = (st.rolagens || 0) + 1;
  if (r.tipo === "d20") {
    st.d20 = (st.d20 || 0) + 1;
    if (r.nat === "crit") st.nat20 = (st.nat20 || 0) + 1;
    if (r.nat === "falha") st.nat1 = (st.nat1 || 0) + 1;
  } else if (r.tipo === "expr") {
    st.maiorDano = Math.max(st.maiorDano || 0, parseInt(r.total) || 0);
  }
  pfSalvarStatsDepois();
}

(function () {
  if (typeof registrarRolagem !== "function" || registrarRolagem._pf) return;
  const orig = registrarRolagem;
  registrarRolagem = function (r) {
    const out = orig.apply(this, arguments);
    try { pfContarRolagem(r); } catch (e) {}
    return out;
  };
  registrarRolagem._pf = true;
  window.registrarRolagem = registrarRolagem;
})();

// "Por um fio": ficar com exatamente 1 PV numa ficha com 10+ de vida máxima
(function () {
  if (typeof atualizarHP !== "function" || atualizarHP._pf) return;
  const orig = atualizarHP;
  atualizarHP = function () {
    const out = orig.apply(this, arguments);
    try {
      if (typeof vidaAtual !== "undefined" && vidaAtual === 1 && get("vidaMax") >= 10 && window.usuarioAtual) {
        pfGarantirStats().then((st) => {
          if (!st.porUmFio) {
            st.porUmFio = true;
            pfSalvarStatsDepois();
          }
        });
      }
    } catch (e) {}
    return out;
  };
  atualizarHP._pf = true;
  window.atualizarHP = atualizarHP;
})();

/* ---------- status: online / jogando ---------- */
function pfAtividadeAgora() {
  const ficha = document.getElementById("ficha");
  const master = document.getElementById("masterIgnea");
  if (ficha && ficha.style.display === "block" && personagemAtual !== null && personagens[personagemAtual]) {
    return `Jogando com ${personagens[personagemAtual].nome || "uma ficha"}`;
  }
  if (master && master.style.display && master.style.display !== "none") return "Mestrando";
  return "";
}

async function pfBatimento() {
  const uid = window.usuarioAtual?.uid;
  if (!uid || !window.setDoc || document.visibilityState === "hidden") return;
  try {
    await setDoc(doc(db, "usuarios", uid), { vistoEm: Date.now(), atividade: { texto: pfAtividadeAgora(), em: Date.now() } }, { merge: true });
  } catch (e) {}
}
setInterval(pfBatimento, 120000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") pfBatimento(); });
setTimeout(pfBatimento, 8000);

function pfStatusTexto(d) {
  if (d.mostrarStatus === false || !d.vistoEm) return "";
  const diff = Date.now() - d.vistoEm;
  if (diff < 4 * 60 * 1000) {
    const at = d.atividade?.texto && Date.now() - (d.atividade.em || 0) < 4 * 60 * 1000 ? ` · ${esc(d.atividade.texto)}` : "";
    return `<span class="pf-online"></span>Online${at}`;
  }
  return `Visto ${tempoRelativo(d.vistoEm)}`;
}

/* ---------- conquistas ---------- */
async function pfContextoConquistas(uid) {
  const st = { ...pfStatsVazias(), ...(await pfGarantirStats()) };
  let nAmigos = 0;
  try {
    nAmigos = (await getDocs(collection(db, "usuarios", uid, "amigos"))).docs.length;
  } catch (e) {}
  return {
    stats: st,
    nFichas: (personagens || []).length,
    temCompanheiro: (personagens || []).some((p) => Array.isArray(p.companheiros) && p.companheiros.length),
    emGrupo: (personagens || []).some((p) => p.grupoAtivo),
    nCampanhas: (typeof campanhasMaster !== "undefined" ? campanhasMaster : []).length,
    nAmigos,
    nElogios: window._pf.elogios.reduce((s, e) => s + (e.selos || []).length, 0),
  };
}

async function pfAtualizarConquistas(uid) {
  const ctx = await pfContextoConquistas(uid);
  const ganhas = CONQUISTAS.filter((c) => {
    try { return c.ok(ctx); } catch (e) { return false; }
  }).map((c) => c.id);
  const antes = (window._pf.d.conquistas || []).slice().sort().join(",");
  window._pf.ctx = ctx;
  if (ganhas.slice().sort().join(",") !== antes) {
    window._pf.d.conquistas = ganhas;
    try {
      await setDoc(doc(db, "usuarios", uid), { conquistas: ganhas, stats: ctx.stats }, { merge: true });
    } catch (e) {}
  }
  return ganhas;
}

function pfTemConquista(id) {
  return (window._pf.d.conquistas || []).includes(id);
}

function pfTituloTexto(d) {
  const c = CONQUISTAS.find((x) => x.id === d.titulo);
  return c && (d.conquistas || []).includes(c.id) ? c.titulo : "";
}

/* ---------- render principal ---------- */
async function renderPerfilExtras(uid, ehMeu, d) {
  const pf = window._pf;
  pf.uid = uid;
  pf.ehMeu = ehMeu;
  pf.d = { ...d };
  pf.recados = [];
  pf.elogios = [];
  pf.ehAmigo = false;
  if (pf.unsubRecados) { pf.unsubRecados(); pf.unsubRecados = null; }

  pfAplicarVisual(d);
  pfRenderCabecalho();
  document.getElementById("perfilExtras").innerHTML = `<p class="pf-vazio">Carregando...</p>`;
  document.getElementById("perfilAcoes").innerHTML = "";
  pfRenderProcurando();

  const meuUid = window.usuarioAtual.uid;
  try {
    if (!ehMeu) pf.ehAmigo = (await getDoc(doc(db, "usuarios", meuUid, "amigos", uid))).exists();
  } catch (e) {}
  try {
    pf.elogios = (await getDocs(collection(db, "usuarios", uid, "elogios"))).docs.map((x) => ({ id: x.id, ...x.data() }));
  } catch (e) {
    pf.elogios = [];
  }
  if (ehMeu) await pfAtualizarConquistas(uid);

  pfRenderAcoes();
  pfRenderCabecalho();
  pfRenderExtras();
  pfEsconderVazios();

  try {
    pf.unsubRecados = onSnapshot(
      query(collection(db, "usuarios", uid, "recados"), orderBy("em", "desc"), limit(30)),
      (snap) => {
        if (window._pf.uid !== uid) return;
        pf.recados = snap.docs.map((x) => ({ id: x.id, ...x.data() }));
        pfRenderMural();
      },
      (err) => console.warn("recados:", err.code || err.message),
    );
  } catch (e) {}
}

// fecha a escuta do mural junto com o perfil
(function () {
  const orig = window.fecharPerfil;
  window.fecharPerfil = function () {
    if (window._pf.unsubRecados) { window._pf.unsubRecados(); window._pf.unsubRecados = null; }
    window._pf.uid = null;
    return orig.apply(this, arguments);
  };
})();

// no perfil dos outros, some com as partes vazias (no seu fica tudo, com as dicas)
function pfEsconderVazios() {
  const { ehMeu, d, ehAmigo } = window._pf;
  const bio = document.getElementById("perfilBioView");
  const showcase = document.getElementById("perfilShowcase");
  const rotuloPers = showcase?.previousElementSibling;
  const semPers = !(d.personagensDestaque || []).length;
  const semBio = !(d.bio || "").trim();
  const mostrar = (el, sim) => { if (el) el.style.display = sim ? "" : "none"; };
  if (ehMeu) {
    mostrar(bio, true); mostrar(showcase, true); mostrar(rotuloPers, true);
    document.getElementById("pfPerfilVazio")?.remove();
    return;
  }
  mostrar(bio, !semBio);
  mostrar(showcase, !semPers);
  mostrar(rotuloPers, !semPers);
  const semConq = !(d.conquistas || []).length;
  const semDados = !(d.stats && d.stats.rolagens);
  const semElogios = !window._pf.elogios.length;
  mostrar(document.getElementById("pfSecConquistas"), !semConq);
  mostrar(document.getElementById("pfSecDados"), !semDados);
  mostrar(document.getElementById("pfSecElogios"), !semElogios || ehAmigo);
  const tudoVazio = semBio && semPers && semConq && semDados && semElogios && !(d.procurandoMesa && d.procurandoMesa.ativo);
  const extras = document.getElementById("perfilExtras");
  document.getElementById("pfPerfilVazio")?.remove();
  if (tudoVazio && extras) {
    extras.insertAdjacentHTML(
      "afterbegin",
      `<div id="pfPerfilVazio" class="pf-perfil-vazio"><span>📜</span><p>${esc(d.nickname || "Essa pessoa")} ainda não preencheu o perfil.</p>${ehAmigo ? `<small>Que tal deixar o primeiro recado?</small>` : ""}</div>`,
    );
  }
}

function pfAplicarVisual(d) {
  const wrap = document.getElementById("perfilAvatarWrap");
  const fundo = document.getElementById("perfilFundo");
  if (wrap) wrap.dataset.moldura = d.moldura || "";
  if (fundo) fundo.dataset.efeito = d.efeitoFundo || "";
}

function pfRenderCabecalho() {
  const { d, ehMeu } = window._pf;
  const tEl = document.getElementById("perfilTitulo");
  const sEl = document.getElementById("perfilStatus");
  const titulo = pfTituloTexto(d);
  if (tEl) {
    tEl.innerHTML = titulo
      ? `<span>${esc(titulo)}</span>${ehMeu ? ` <button type="button" class="pf-mini-btn" onclick="abrirEscolherTitulo()" title="Trocar título"><i class="ti ti-pencil"></i></button>` : ""}`
      : ehMeu && (d.conquistas || []).length
        ? `<button type="button" class="pf-link" onclick="abrirEscolherTitulo()">Escolher um título</button>`
        : "";
  }
  if (sEl) sEl.innerHTML = pfStatusTexto(d);
}

function pfRenderAcoes() {
  const { uid, ehMeu, d, ehAmigo } = window._pf;
  const box = document.getElementById("perfilAcoes");
  if (!box) return;
  if (ehMeu) {
    box.innerHTML = `
      <button type="button" class="pf-acao" onclick="abrirVisualPerfil()"><i class="ti ti-sparkles"></i><span>Moldura e fundo</span></button>
      <button type="button" class="pf-acao" onclick="abrirProcurandoMesa()"><i class="ti ti-calendar"></i><span>Disponível pra jogar</span></button>`;
    return;
  }
  const nick = esc(d.nickname || "");
  const tag = esc(d.tag || "");
  box.innerHTML = `
    ${ehAmigo
      ? `<button type="button" class="pf-acao" onclick="abrirConvidarParaGrupo()"><i class="ti ti-users-plus"></i><span>Convidar pro grupo</span></button>`
      : `<button type="button" class="pf-acao destaque" onclick="window.enviarSolicitacaoAmizadePorUid('${esc(uid)}', '${nick}', '${tag}')"><i class="ti ti-user-plus"></i><span>Adicionar amigo</span></button>`}
    <button type="button" class="pf-acao" id="pfBtnMesas" onclick="abrirMesasEmComum()"><i class="ti ti-swords"></i><span>Mesas em comum</span></button>`;
  pfContarMesasEmComum().then((lista) => {
    const b = document.getElementById("pfBtnMesas");
    if (b && window._pf.uid === uid) b.querySelector("span").textContent = lista.length ? `${lista.length} ${lista.length === 1 ? "mesa" : "mesas"} em comum` : "Nenhuma mesa em comum";
  });
}

function pfRenderProcurando() {
  const box = document.getElementById("perfilProcurando");
  const pm = window._pf.d.procurandoMesa;
  if (!box) return;
  if (!pm || !pm.ativo) {
    box.innerHTML = "";
    return;
  }
  const modo = { jogador: "Disponível pra jogar", mestre: "Disponível pra mestrar", ambos: "Disponível pra jogar ou mestrar" }[pm.modo] || "Disponível pra jogar";
  box.innerHTML = `
    <div class="pf-procurando">
      <div class="pf-procurando-topo"><i class="ti ti-calendar"></i><strong>${modo}</strong></div>
      ${pm.sistemas ? `<div class="pf-procurando-linha"><span>Sistemas</span>${esc(pm.sistemas)}</div>` : ""}
      ${(pm.dias || []).length ? `<div class="pf-dias">${DIAS_SEMANA.map((dd) => `<span class="${pm.dias.includes(dd) ? "on" : ""}">${dd}</span>`).join("")}</div>` : ""}
      ${pm.periodo ? `<div class="pf-procurando-linha"><span>Horário</span>${esc(pm.periodo)}</div>` : ""}
      ${pm.obs ? `<p class="pf-procurando-obs">${esc(pm.obs)}</p>` : ""}
    </div>`;
}

function pfRenderExtras() {
  const box = document.getElementById("perfilExtras");
  if (!box) return;
  box.innerHTML = `
    <div class="pf-secao" id="pfSecConquistas"></div>
    <div class="pf-secao" id="pfSecDados"></div>
    <div class="pf-secao" id="pfSecElogios"></div>
    <div class="pf-secao" id="pfSecMural"></div>`;
  pfRenderConquistas();
  pfRenderDados();
  pfRenderElogios();
  pfRenderMural();
}

function pfTituloSecao(ic, txt, extra) {
  return `<div class="pf-secao-titulo"><span>${ic} ${txt}</span>${extra || ""}</div>`;
}

function pfRenderConquistas() {
  const box = document.getElementById("pfSecConquistas");
  if (!box) return;
  const ganhas = window._pf.d.conquistas || [];
  const lista = window._pf.ehMeu ? CONQUISTAS : CONQUISTAS.filter((c) => ganhas.includes(c.id));
  box.innerHTML =
    pfTituloSecao("🏆", "Conquistas", `<small>${ganhas.length}/${CONQUISTAS.length}</small>`) +
    (lista.length
      ? `<div class="pf-medalhas">${lista
          .map((c) => {
            const tem = ganhas.includes(c.id);
            return `<button type="button" class="pf-medalha ${tem ? "" : "bloqueada"}" onclick="verConquista('${c.id}')" title="${esc(c.nome)}"><span>${tem ? c.ic : "🔒"}</span></button>`;
          })
          .join("")}</div>`
      : `<p class="pf-vazio">Nenhuma conquista ainda.</p>`);
}

function verConquista(id) {
  const c = CONQUISTAS.find((x) => x.id === id);
  if (!c) return;
  const tem = pfTemConquista(id);
  const html = `
    <div class="pf-conq-ver">
      <div class="pf-conq-ic ${tem ? "" : "bloqueada"}">${tem ? c.ic : "🔒"}</div>
      <p>${esc(c.desc)}</p>
      <div class="pf-conq-titulo">Título: <b>${esc(c.titulo)}</b></div>
      ${tem && window._pf.ehMeu ? `<button type="button" class="inv-add-btn btn-adicionar" onclick="definirTitulo('${c.id}')"><span>Usar esse título</span></button>` : ""}
      ${!tem ? `<p class="pf-vazio">Ainda não conquistada.</p>` : ""}
    </div>`;
  abrirPopup(c.nome, html, true, null);
}

function abrirEscolherTitulo() {
  const ganhas = window._pf.d.conquistas || [];
  const atual = window._pf.d.titulo || "";
  const ops = [`<button type="button" class="pf-op ${!atual ? "ativo" : ""}" onclick="definirTitulo('')"><span>Sem título</span></button>`]
    .concat(
      CONQUISTAS.filter((c) => ganhas.includes(c.id)).map(
        (c) => `<button type="button" class="pf-op ${atual === c.id ? "ativo" : ""}" onclick="definirTitulo('${c.id}')"><span>${c.ic} ${esc(c.titulo)}</span><small>${esc(c.nome)}</small></button>`,
      ),
    )
    .join("");
  abrirPopup("Escolher título", `<div class="pf-ops">${ops}</div>`, true, null);
}

async function definirTitulo(id) {
  window._pf.d.titulo = id;
  try {
    await setDoc(doc(db, "usuarios", window.usuarioAtual.uid), { titulo: id }, { merge: true });
  } catch (e) {
    return alertBonito("Não consegui salvar o título agora.");
  }
  fecharPopup();
  pfRenderCabecalho();
}

function pfRenderDados() {
  const box = document.getElementById("pfSecDados");
  if (!box) return;
  const st = { ...pfStatsVazias(), ...(window._pf.ehMeu ? window._pf.ctx?.stats || window._pfStats || {} : window._pf.d.stats || {}) };
  if (!st.rolagens) {
    box.innerHTML = pfTituloSecao("🎲", "Dados") + `<p class="pf-vazio">${window._pf.ehMeu ? "Role uns dados na ficha pra começar a contar." : "Ainda não rolou nenhum dado."}</p>`;
    return;
  }
  const taxa20 = st.d20 ? st.nat20 / st.d20 : 0;
  const taxa1 = st.d20 ? st.nat1 / st.d20 : 0;
  let humor = "";
  if (st.d20 >= 20) {
    if (taxa20 - taxa1 >= 0.03) humor = `<div class="pf-humor quente">🔥 Dado quente</div>`;
    else if (taxa1 - taxa20 >= 0.03) humor = `<div class="pf-humor frio">🧊 Dado frio</div>`;
    else humor = `<div class="pf-humor">⚖️ Dado honesto</div>`;
  }
  box.innerHTML =
    pfTituloSecao("🎲", "Dados", humor) +
    `<div class="pf-numeros">
      <div><b>${st.rolagens}</b><span>rolagens</span></div>
      <div class="bom"><b>${st.nat20}</b><span>20 natural</span></div>
      <div class="ruim"><b>${st.nat1}</b><span>1 natural</span></div>
      <div><b>${st.maiorDano || 0}</b><span>maior dano</span></div>
    </div>`;
}

function pfRenderElogios() {
  const box = document.getElementById("pfSecElogios");
  if (!box) return;
  const { ehMeu, ehAmigo, elogios } = window._pf;
  const cont = {};
  elogios.forEach((e) => (e.selos || []).forEach((s) => (cont[s] = (cont[s] || 0) + 1)));
  const recebidos = SELOS_ELOGIO.filter((s) => cont[s.id]).sort((a, b) => cont[b.id] - cont[a.id]);
  box.innerHTML =
    pfTituloSecao("🏅", "Elogios de mesa", !ehMeu && ehAmigo ? `<button type="button" class="pf-link" onclick="abrirDarElogio()">Elogiar</button>` : "") +
    (recebidos.length
      ? `<div class="pf-selos">${recebidos.map((s) => `<span class="pf-selo"><i>${s.ic}</i>${esc(s.nome)}<b>${cont[s.id]}</b></span>`).join("")}</div>`
      : `<p class="pf-vazio">${ehMeu ? "Seus amigos podem te dar elogios depois de jogar junto." : "Seja o primeiro a elogiar."}</p>`);
}

function abrirDarElogio() {
  const meu = window._pf.elogios.find((e) => e.id === window.usuarioAtual.uid);
  window._pfSelosTemp = new Set(meu?.selos || []);
  const html = `
    <div class="pf-dar-elogio">
      <p class="pf-vazio" style="text-align:left">Escolha o que combina com ${esc(window._pf.d.nickname || "essa pessoa")} na mesa. Dá pra mudar depois.</p>
      <div class="pf-selos-escolha">
        ${SELOS_ELOGIO.map((s) => `<button type="button" class="pf-selo-op ${window._pfSelosTemp.has(s.id) ? "ativo" : ""}" onclick="alternarSeloTemp(this, '${s.id}')"><i>${s.ic}</i><span>${esc(s.nome)}</span></button>`).join("")}
      </div>
      <button type="button" class="inv-add-btn btn-adicionar" onclick="salvarElogio()"><span>Salvar elogios</span></button>
    </div>`;
  abrirPopup("Elogiar", html, true, null);
}

function alternarSeloTemp(btn, id) {
  const s = window._pfSelosTemp;
  if (s.has(id)) s.delete(id);
  else s.add(id);
  btn.classList.toggle("ativo", s.has(id));
}

async function salvarElogio() {
  const uid = window._pf.uid;
  const meuUid = window.usuarioAtual.uid;
  const selos = [...window._pfSelosTemp].filter((id) => SELOS_ELOGIO.some((s) => s.id === id));
  try {
    const ref = doc(db, "usuarios", uid, "elogios", meuUid);
    if (selos.length) await setDoc(ref, { selos, deUid: meuUid, em: Date.now() });
    else await deleteDoc(ref);
    window._pf.elogios = window._pf.elogios.filter((e) => e.id !== meuUid);
    if (selos.length) window._pf.elogios.push({ id: meuUid, selos, deUid: meuUid });
    fecharPopup();
    pfRenderElogios();
    if (typeof mostrarToastMundo === "function") mostrarToastMundo("Elogios salvos");
  } catch (e) {
    console.error(e);
    alertBonito("Não consegui salvar. " + (e.code === "permission-denied" ? "Confira se as regras novas do Firebase foram publicadas." : ""));
  }
}

/* ---------- mural de recados ---------- */
function pfRenderMural() {
  const box = document.getElementById("pfSecMural");
  if (!box) return;
  const { ehMeu, ehAmigo, recados } = window._pf;
  const meuUid = window.usuarioAtual?.uid;
  const podeEscrever = !ehMeu && ehAmigo;
  box.style.display = !ehMeu && !ehAmigo && !recados.length ? "none" : "";
  box.innerHTML =
    pfTituloSecao("📜", "Mural", recados.length ? `<small>${recados.length}</small>` : "") +
    (podeEscrever
      ? `<div class="pf-recado-novo">
          <textarea id="pfRecadoTexto" maxlength="280" placeholder="Deixe um recado..." oninput="document.getElementById('pfRecadoCont').textContent = this.value.length + '/280'"></textarea>
          <div class="pf-recado-novo-rodape"><small id="pfRecadoCont">0/280</small><button type="button" class="pf-enviar" onclick="enviarRecado()"><i class="ti ti-send"></i> Enviar</button></div>
        </div>`
      : "") +
    (recados.length
      ? `<div class="pf-recados">${recados
          .map(
            (r) => `
        <div class="pf-recado">
          <button type="button" class="pf-recado-av" style="${r.deFoto ? `background-image:url('${esc(r.deFoto)}')` : ""}" onclick="abrirPerfil('${esc(r.deUid)}')"></button>
          <div class="pf-recado-corpo">
            <div class="pf-recado-topo"><button type="button" class="pf-recado-nome" onclick="abrirPerfil('${esc(r.deUid)}')">${esc(r.deNickname || "Alguém")}<span>#${esc(r.deTag || "")}</span></button><small>${tempoRelativo(r.em)}</small></div>
            <p>${esc(r.texto || "")}</p>
          </div>
          ${ehMeu || r.deUid === meuUid ? `<button type="button" class="pf-recado-x" title="Apagar" onclick="apagarRecado('${esc(r.id)}')"><i class="ti ti-x"></i></button>` : ""}
        </div>`,
          )
          .join("")}</div>`
      : ehMeu ? `<p class="pf-vazio">Quando seus amigos deixarem recados, eles aparecem aqui.</p>` : "");
}

async function enviarRecado() {
  const el = document.getElementById("pfRecadoTexto");
  const texto = (el?.value || "").trim().slice(0, 280);
  if (!texto) return el?.focus();
  const meuUid = window.usuarioAtual.uid;
  try {
    const eu = (await getDoc(doc(db, "usuarios", meuUid))).data() || {};
    await addDoc(collection(db, "usuarios", window._pf.uid, "recados"), {
      deUid: meuUid,
      deNickname: eu.nickname || "",
      deTag: eu.tag || "",
      deFoto: eu.fotoPerfil || "",
      texto,
      em: Date.now(),
    });
    if (el) el.value = "";
  } catch (e) {
    console.error(e);
    alertBonito("Não consegui enviar o recado. " + (e.code === "permission-denied" ? "Confira se as regras novas do Firebase foram publicadas." : ""));
  }
}

async function apagarRecado(id) {
  if (!(await confirmBonito("Apagar esse recado?"))) return;
  try {
    await deleteDoc(doc(db, "usuarios", window._pf.uid, "recados", id));
  } catch (e) {
    alertBonito("Não consegui apagar agora.");
  }
}

/* ---------- mesas em comum e convite ---------- */
async function pfMeusGrupos() {
  const meuUid = window.usuarioAtual.uid;
  try {
    const snap = await getDocs(query(collection(db, "grupos"), where("membrosUids", "array-contains", meuUid)));
    return snap.docs.map((x) => ({ id: x.id, ...x.data() }));
  } catch (e) {
    console.warn("grupos:", e.code || e.message);
    return [];
  }
}

async function pfContarMesasEmComum() {
  const uid = window._pf.uid;
  const grupos = await pfMeusGrupos();
  return grupos.filter((g) => (g.membrosUids || []).includes(uid));
}

async function abrirMesasEmComum() {
  const lista = await pfContarMesasEmComum();
  const html = lista.length
    ? `<div class="pf-ops">${lista.map((g) => `<div class="pf-op parado"><span>🏕️ ${esc(g.nome || "Grupo")}</span><small>${(g.membrosUids || []).length} membros</small></div>`).join("")}</div>`
    : `<p class="pf-vazio">Vocês ainda não estão em nenhum grupo juntos.</p>`;
  abrirPopup("Mesas em comum", html, true, null);
}

async function abrirConvidarParaGrupo() {
  const uid = window._pf.uid;
  const grupos = (await pfMeusGrupos()).filter((g) => !(g.membrosUids || []).includes(uid));
  const html = grupos.length
    ? `<div class="pf-ops">${grupos.map((g) => `<button type="button" class="pf-op" onclick="convidarParaGrupoPerfil('${esc(g.id)}')"><span>🏕️ ${esc(g.nome || "Grupo")}</span><small>${(g.membrosUids || []).length} membros</small></button>`).join("")}</div>`
    : `<p class="pf-vazio">Você não tem nenhum grupo em que ${esc(window._pf.d.nickname || "essa pessoa")} ainda não esteja.</p>`;
  abrirPopup("Convidar pro grupo", html, true, null);
}

async function convidarParaGrupoPerfil(grupoId) {
  const meuUid = window.usuarioAtual.uid;
  try {
    const g = (await getDoc(doc(db, "grupos", grupoId))).data() || {};
    const eu = (await getDoc(doc(db, "usuarios", meuUid))).data() || {};
    await setDoc(doc(db, "usuarios", window._pf.uid, "convitesGrupo", grupoId), {
      grupoId,
      nomeGrupo: g.nome || "",
      deUid: meuUid,
      deNickname: eu.nickname || "",
      deTag: eu.tag || "",
      criadoEm: new Date().toISOString(),
    });
    fecharPopup();
    if (typeof mostrarToastMundo === "function") mostrarToastMundo("Convite enviado");
  } catch (e) {
    console.error(e);
    alertBonito("Não consegui enviar o convite agora.");
  }
}

/* ---------- procurando mesa ---------- */
function abrirProcurandoMesa() {
  const pm = window._pf.d.procurandoMesa || {};
  const dias = new Set(pm.dias || []);
  const html = `
    <div class="popup-form">
      <div class="toggle-cargas">
        <span class="toggle-cargas-texto">Mostrar no meu perfil</span>
        <label class="switch-cargas"><input type="checkbox" id="pmAtivo" ${pm.ativo ? "checked" : ""}><span class="slider-cargas"></span></label>
      </div>
      <label class="popup-label">Disponível pra</label>
      <select id="pmModo">
        <option value="jogador" ${pm.modo === "jogador" || !pm.modo ? "selected" : ""}>Jogar</option>
        <option value="mestre" ${pm.modo === "mestre" ? "selected" : ""}>Mestrar</option>
        <option value="ambos" ${pm.modo === "ambos" ? "selected" : ""}>Jogar ou mestrar</option>
      </select>
      <label class="popup-label">Sistemas</label>
      <input id="pmSistemas" maxlength="80" value="${esc(pm.sistemas || "")}" placeholder="Ex: D&D 5e, Ordem Paranormal">
      <label class="popup-label">Dias livres</label>
      <div class="pf-dias escolher" id="pmDias">${DIAS_SEMANA.map((dd) => `<button type="button" class="${dias.has(dd) ? "on" : ""}" onclick="this.classList.toggle('on')">${dd}</button>`).join("")}</div>
      <label class="popup-label">Horário</label>
      <input id="pmPeriodo" maxlength="40" value="${esc(pm.periodo || "")}" placeholder="Ex: à noite, depois das 20h">
      <label class="popup-label">Recado (opcional)</label>
      <textarea id="pmObs" maxlength="140" placeholder="Ex: sexta só depois das 21h">${esc(pm.obs || "")}</textarea>

      <div class="toggle-cargas" style="margin-top:10px">
        <span class="toggle-cargas-texto">Mostrar quando estou online</span>
        <label class="switch-cargas"><input type="checkbox" id="pmStatus" ${window._pf.d.mostrarStatus === false ? "" : "checked"}><span class="slider-cargas"></span></label>
      </div>
      <button type="button" class="inv-add-btn btn-adicionar" style="width:100%;margin-top:12px" onclick="salvarProcurandoMesa()"><span>Salvar</span></button>
    </div>`;
  abrirPopup("Disponível pra jogar", html, true, null);
}

async function salvarProcurandoMesa() {
  const procurandoMesa = {
    ativo: !!document.getElementById("pmAtivo")?.checked,
    modo: document.getElementById("pmModo")?.value || "jogador",
    sistemas: (document.getElementById("pmSistemas")?.value || "").trim(),
    dias: [...document.querySelectorAll("#pmDias button.on")].map((b) => b.textContent),
    periodo: (document.getElementById("pmPeriodo")?.value || "").trim(),
    obs: (document.getElementById("pmObs")?.value || "").trim(),
  };
  const mostrarStatus = !!document.getElementById("pmStatus")?.checked;
  try {
    await setDoc(doc(db, "usuarios", window.usuarioAtual.uid), { procurandoMesa, mostrarStatus }, { merge: true });
  } catch (e) {
    return alertBonito("Não consegui salvar agora.");
  }
  window._pf.d.procurandoMesa = procurandoMesa;
  window._pf.d.mostrarStatus = mostrarStatus;
  fecharPopup();
  pfRenderProcurando();
  pfRenderCabecalho();
}

/* ---------- moldura e fundo ---------- */
function pfLiberado(item) {
  if (item.plano) return getPlanoUsuario() !== "free";
  if (item.conquista) return pfTemConquista(item.conquista);
  return true;
}
function pfMotivoBloqueio(item) {
  if (item.plano) return "Plano pago";
  const c = CONQUISTAS.find((x) => x.id === item.conquista);
  return c ? `Conquista: ${c.nome}` : "";
}

function abrirVisualPerfil() {
  const d = window._pf.d;
  window._pfVisualTemp = { moldura: d.moldura || "", efeitoFundo: d.efeitoFundo || "" };
  const opMoldura = (m) => {
    const ok = pfLiberado(m);
    return `<button type="button" class="pf-vis-op ${window._pfVisualTemp.moldura === m.id ? "ativo" : ""} ${ok ? "" : "bloqueada"}" ${ok ? `onclick="escolherVisualTemp('moldura','${m.id}', this)"` : ""}>
      <span class="pf-vis-av" data-moldura="${m.id}"><span></span></span>
      <small>${esc(m.nome)}</small>${ok ? "" : `<em>🔒 ${esc(pfMotivoBloqueio(m))}</em>`}
    </button>`;
  };
  const opFundo = (f) => {
    const ok = pfLiberado(f);
    return `<button type="button" class="pf-vis-op largo ${window._pfVisualTemp.efeitoFundo === f.id ? "ativo" : ""} ${ok ? "" : "bloqueada"}" ${ok ? `onclick="escolherVisualTemp('efeitoFundo','${f.id}', this)"` : ""}>
      <span class="pf-vis-fundo" data-efeito="${f.id}"></span>
      <small>${esc(f.nome)}</small>${ok ? "" : `<em>🔒 ${esc(pfMotivoBloqueio(f))}</em>`}
    </button>`;
  };
  const html = `
    <div class="pf-visual">
      <label class="popup-label">Moldura da foto</label>
      <div class="pf-vis-grade" data-grupo="moldura">${MOLDURAS.map(opMoldura).join("")}</div>
      <label class="popup-label">Efeito no fundo</label>
      <div class="pf-vis-grade fundos" data-grupo="efeitoFundo">${EFEITOS_FUNDO.map(opFundo).join("")}</div>
      <button type="button" class="inv-add-btn btn-adicionar" style="width:100%;margin-top:14px" onclick="salvarVisualPerfil()"><span>Salvar</span></button>
    </div>`;
  abrirPopup("Moldura e fundo", html, true, null);
}

function escolherVisualTemp(campo, id, btn) {
  window._pfVisualTemp[campo] = id;
  btn.parentElement.querySelectorAll(".pf-vis-op").forEach((b) => b.classList.toggle("ativo", b === btn));
}

async function salvarVisualPerfil() {
  const v = window._pfVisualTemp;
  try {
    await setDoc(doc(db, "usuarios", window.usuarioAtual.uid), { moldura: v.moldura, efeitoFundo: v.efeitoFundo }, { merge: true });
  } catch (e) {
    return alertBonito("Não consegui salvar agora.");
  }
  window._pf.d.moldura = v.moldura;
  window._pf.d.efeitoFundo = v.efeitoFundo;
  fecharPopup();
  pfAplicarVisual(window._pf.d);
}

/* =====================================================================
   GRUPOS v2: capa, foto, descrição, criar e convidar com fotos dos amigos
   ===================================================================== */
window._amCache = window._amCache || {};
async function gpResumo(uid) {
  const c = window._amCache[uid];
  if (c && Date.now() - (c._em || 0) < 60000) return c;
  try {
    const s = await getDoc(doc(db, "usuarios", uid));
    const d = s.exists() ? s.data() : {};
    d._em = Date.now();
    window._amCache[uid] = d;
    return d;
  } catch (e) {
    return c || {};
  }
}
function gpOnline(d) {
  return d && d.mostrarStatus !== false && d.vistoEm && Date.now() - d.vistoEm < 4 * 60 * 1000;
}
function gpAvatar(d, cls) {
  const foto = d && d.fotoPerfil ? `background-image:url('${String(d.fotoPerfil).replace(/'/g, "%27")}')` : "";
  return `<span class="am-av ${cls || ""}" data-moldura="${esc((d && d.moldura) || "")}"><span class="am-av-img" style="${foto}"></span>${gpOnline(d) ? `<span class="am-dot"></span>` : ""}</span>`;
}
function gpFotoGrupo(g, cls) {
  return `<span class="gp-foto ${cls || ""}" style="${g.fotoUrl ? `background-image:url('${esc(g.fotoUrl)}')` : ""}">${g.fotoUrl ? "" : "🏕️"}</span>`;
}

/* ---------- detalhe do grupo ---------- */
window.abrirDetalheGrupo = async function (grupoId) {
  window._grupoAtualId = grupoId;
  const meuUid = window.usuarioAtual.uid;
  const ov = document.getElementById("modalGrupoDetalheOverlay");
  const box = document.getElementById("modalGrupoDetalhe");
  ov.style.display = "block";
  box.style.display = "block";
  box.classList.add("gp-modal");
  if (!box.innerHTML.includes("gp-capa")) box.innerHTML = `<p class="am-vazio">Carregando...</p>`;

  const snap = await getDoc(doc(db, "grupos", grupoId));
  if (!snap.exists()) return fecharDetalheGrupo();
  const g = snap.data();
  window._grupoAtual = { id: grupoId, ...g };
  const souMestre = g.criadoPor === meuUid;
  const membros = g.membros || [];
  const perfis = {};
  (await Promise.all(membros.map((m) => gpResumo(m.uid)))).forEach((p, i) => (perfis[membros[i].uid] = p));
  const onlineN = membros.filter((m) => gpOnline(perfis[m.uid])).length;
  const eu = membros.find((m) => m.uid === meuUid) || {};
  const minhasFichas = personagens || window.personagens || [];

  const ordenados = [...membros].sort((a, b) => (b.papel === "mestre") - (a.papel === "mestre") || (a.nickname || "").localeCompare(b.nickname || "", "pt-BR"));
  const membrosHTML = ordenados
    .map((m) => {
      const p = perfis[m.uid] || {};
      const ehEu = m.uid === meuUid;
      const status = gpOnline(p)
        ? `<span class="am-on">${esc(p.atividade?.texto && Date.now() - (p.atividade.em || 0) < 4 * 60 * 1000 ? p.atividade.texto : "Online")}</span>`
        : p.vistoEm && p.mostrarStatus !== false ? `Visto ${tempoRelativo(p.vistoEm)}` : "";
      return `
      <div class="am-item gp-membro" ${ehEu ? "" : `onclick="abrirPerfil('${esc(m.uid)}')"`}>
        ${gpAvatar(p)}
        <div class="am-info">
          <div class="am-nome">${esc(m.nickname || "Sem nome")}<span>#${esc(m.tag || "")}</span>${ehEu ? ` <small class="gp-voce">você</small>` : ""}</div>
          <div class="am-sub">${status}</div>
        </div>
        ${souMestre && !ehEu
          ? `<button type="button" class="gp-papel ${m.papel === "mestre" ? "mestre" : ""}" onclick="event.stopPropagation(); alternarPapelMembro('${esc(m.uid)}')" title="Trocar papel">${m.papel === "mestre" ? "Mestre" : "Jogador"}</button>
             <button type="button" class="am-resp nao" title="Remover do grupo" onclick="event.stopPropagation(); removerMembroGrupo('${esc(m.uid)}')"><i class="ti ti-x"></i></button>`
          : `<span class="gp-papel parado ${m.papel === "mestre" ? "mestre" : ""}">${m.papel === "mestre" ? "Mestre" : "Jogador"}</span>`}
      </div>`;
    })
    .join("");

  box.innerHTML = `
    <div class="gp-capa" style="${g.capaUrl ? `background-image:url('${esc(g.capaUrl)}')` : ""}">
      <button type="button" class="gp-fechar" onclick="fecharDetalheGrupo()" aria-label="Fechar">✕</button>
    </div>
    <div class="gp-cabeca">
      ${gpFotoGrupo(g, "grande")}
      <h3 class="gp-nome">${esc(g.nome || "Grupo")}</h3>
      ${g.descricao ? `<p class="gp-desc">${esc(g.descricao)}</p>` : ""}
      <div class="gp-info">${membros.length} membro${membros.length === 1 ? "" : "s"}${onlineN ? ` · <span class="am-on">${onlineN} online</span>` : ""}</div>
      <div class="gp-botoes">
        <button type="button" class="gp-btn" onclick="abrirConvidarGrupo()"><i class="ti ti-user-plus"></i><span>Convidar</span></button>
        ${souMestre ? `<button type="button" class="gp-btn" onclick="abrirEditarGrupo()"><i class="ti ti-pencil"></i><span>Editar grupo</span></button>` : ""}
      </div>
    </div>

    <div class="gp-corpo">
      <div class="am-sep">Minha ficha nesse grupo</div>
      <select id="selectFichaGrupo" style="display:none">
        <option value="">Nenhuma ficha</option>
        ${minhasFichas.map((f) => `<option value="${esc(String(f.id))}" ${String(f.id) === String(eu.fichaId) ? "selected" : ""}>${esc(f.nome || "Sem nome")}</option>`).join("")}
      </select>
      ${gpBotaoFichaHTML(minhasFichas.find((f) => String(f.id) === String(eu.fichaId)))}
      <div id="statusFichaGrupo" class="gp-status"></div>

      <div class="am-sep">Membros · ${membros.length}</div>
      <div class="am-lista">${membrosHTML}</div>

      <div class="gp-rodape">
        ${souMestre
          ? `<button type="button" class="gp-perigo" onclick="excluirGrupo()"><i class="ti ti-trash"></i> Excluir grupo</button>`
          : `<button type="button" class="gp-perigo" onclick="sairDoGrupo()"><i class="ti ti-door-exit"></i> Sair do grupo</button>`}
      </div>
    </div>`;
};

/* ---------- editar grupo (mestre) ---------- */
window._gpImg = { foto: "", capa: "" };

function gpPreviewImagem(input, tipo) {
  const f = input.files && input.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    window._gpImg[tipo] = r.result;
    const alvo = document.getElementById(tipo === "capa" ? "gpCapaPrev" : "gpFotoPrev");
    if (alvo) {
      alvo.style.backgroundImage = `url('${r.result}')`;
      alvo.classList.add("tem");
    }
  };
  r.readAsDataURL(f);
}

function gpFormHTML(g, criando) {
  return `
    <div class="popup-form gp-form">
      <div class="gp-form-capa ${g.capaUrl ? "tem" : ""}" id="gpCapaPrev" style="${g.capaUrl ? `background-image:url('${esc(g.capaUrl)}')` : ""}" onclick="document.getElementById('gpCapaInput').click()">
        <span><i class="ti ti-photo"></i> ${g.capaUrl ? "Trocar capa" : "Adicionar capa"}</span>
      </div>
      <input type="file" id="gpCapaInput" accept="image/*" style="display:none" onchange="gpPreviewImagem(this,'capa')">
      <div class="gp-form-foto ${g.fotoUrl ? "tem" : ""}" id="gpFotoPrev" style="${g.fotoUrl ? `background-image:url('${esc(g.fotoUrl)}')` : ""}" onclick="document.getElementById('gpFotoInput').click()">
        <span>🏕️</span><i class="ti ti-camera"></i>
      </div>
      <input type="file" id="gpFotoInput" accept="image/*" style="display:none" onchange="gpPreviewImagem(this,'foto')">

      <label class="popup-label">Nome do grupo</label>
      <input id="gpNome" maxlength="40" value="${esc(g.nome || "")}" placeholder="Ex: Os Errantes">
      <label class="popup-label">Descrição (opcional)</label>
      <textarea id="gpDesc" maxlength="160" placeholder="Ex: Campanha de sexta à noite, mundo de Tormenta">${esc(g.descricao || "")}</textarea>
      ${criando ? `<label class="popup-label">Convidar amigos</label><div id="gpConvidarLista" class="gp-amigos"><p class="am-vazio">Carregando amigos...</p></div>` : ""}
      <button type="button" class="inv-add-btn btn-adicionar" id="gpSalvarBtn" style="width:100%;margin-top:12px" onclick="${criando ? "salvarNovoGrupo()" : "salvarEditarGrupo()"}"><span>${criando ? "Criar grupo" : "Salvar"}</span></button>
    </div>`;
}

window.abrirEditarGrupo = function () {
  const g = window._grupoAtual;
  if (!g) return;
  window._gpImg = { foto: "", capa: "" };
  abrirPopup("Editar grupo", gpFormHTML(g, false), true, null);
};

async function gpSubirImagens() {
  const out = {};
  for (const tipo of ["foto", "capa"]) {
    if (!window._gpImg[tipo]) continue;
    let base64 = window._gpImg[tipo];
    try { if (typeof comprimirImagemBase64 === "function") base64 = await comprimirImagemBase64(base64); } catch (e) {}
    const up = await uploadImagemFirebase(base64, "grupo");
    if (up.url) out[tipo === "foto" ? "fotoUrl" : "capaUrl"] = up.url;
    else alertBonito(_mensagemErroUpload(`A ${tipo === "foto" ? "foto" : "capa"} não foi salva.`));
  }
  return out;
}

window.salvarEditarGrupo = async function () {
  const g = window._grupoAtual;
  const nome = document.getElementById("gpNome")?.value.trim();
  if (!g || !nome) return document.getElementById("gpNome")?.focus();
  const btn = document.getElementById("gpSalvarBtn");
  if (btn) { btn.disabled = true; btn.querySelector("span").textContent = "Salvando..."; }
  try {
    const imgs = await gpSubirImagens();
    await updateDoc(doc(db, "grupos", g.id), { nome, descricao: document.getElementById("gpDesc")?.value.trim() || "", ...imgs });
    fecharPopup();
    await window.abrirDetalheGrupo(g.id);
    if (typeof carregarGrupos === "function") carregarGrupos();
  } catch (e) {
    console.error(e);
    alertBonito("Não consegui salvar o grupo. " + (e.code || e.message));
    if (btn) { btn.disabled = false; btn.querySelector("span").textContent = "Salvar"; }
  }
};

/* ---------- escolher amigos (criar e convidar) ---------- */
async function gpRenderEscolhaAmigos(alvoId, excluirUids) {
  const alvo = document.getElementById(alvoId);
  if (!alvo) return;
  window._gpSelecionados = new Set();
  try {
    const snap = await getDocs(collection(db, "usuarios", window.usuarioAtual.uid, "amigos"));
    const amigos = snap.docs.map((x) => ({ uid: x.id, ...x.data() })).filter((a) => !(excluirUids || []).includes(a.uid));
    if (!amigos.length) {
      alvo.innerHTML = `<p class="am-vazio">${excluirUids && excluirUids.length ? "Todos os seus amigos já estão nesse grupo." : "Você ainda não tem amigos pra convidar."}</p>`;
      return;
    }
    const perfis = await Promise.all(amigos.map((a) => gpResumo(a.uid)));
    amigos.sort((a, b) => (a.nickname || "").localeCompare(b.nickname || "", "pt-BR"));
    alvo.innerHTML = amigos
      .map((a) => {
        const p = window._amCache[a.uid] || perfis[0] || {};
        return `<button type="button" class="gp-amigo" data-uid="${esc(a.uid)}" data-nick="${esc(a.nickname || "")}" data-tag="${esc(a.tag || "")}" onclick="gpAlternarAmigo(this)">
          ${gpAvatar(p)}<span class="gp-amigo-nome">${esc(a.nickname || "")}</span><i class="gp-check ti ti-check"></i>
        </button>`;
      })
      .join("");
  } catch (e) {
    alvo.innerHTML = `<p class="am-vazio erro">Não consegui carregar seus amigos.</p>`;
  }
}

function gpAlternarAmigo(btn) {
  const s = window._gpSelecionados;
  const uid = btn.dataset.uid;
  if (s.has(uid)) s.delete(uid);
  else s.add(uid);
  btn.classList.toggle("ativo", s.has(uid));
  const b = document.getElementById("gpConvidarBtn");
  if (b) b.querySelector("span").textContent = s.size ? `Convidar ${s.size}` : "Escolha quem convidar";
}

async function gpEnviarConvites(grupoId, nomeGrupo) {
  const meuUid = window.usuarioAtual.uid;
  const eu = (await getDoc(doc(db, "usuarios", meuUid))).data() || {};
  const btns = [...document.querySelectorAll(".gp-amigo.ativo")];
  for (const b of btns) {
    await setDoc(doc(db, "usuarios", b.dataset.uid, "convitesGrupo", grupoId), {
      grupoId,
      nomeGrupo: nomeGrupo || "",
      deUid: meuUid,
      deNickname: eu.nickname || "",
      deTag: eu.tag || "",
      criadoEm: new Date().toISOString(),
    });
  }
  return btns.length;
}

window.abrirConvidarGrupo = function () {
  const g = window._grupoAtual;
  if (!g) return;
  const html = `
    <div class="popup-form">
      <p class="pm-dica">Toque nos amigos que você quer chamar pro <b>${esc(g.nome || "grupo")}</b>.</p>
      <div id="gpConvidarLista" class="gp-amigos"><p class="am-vazio">Carregando amigos...</p></div>
      <button type="button" class="inv-add-btn btn-adicionar" id="gpConvidarBtn" style="width:100%;margin-top:12px" onclick="confirmarConvitesGrupo()"><span>Escolha quem convidar</span></button>
    </div>`;
  abrirPopup("Convidar pro grupo", html, true, null);
  gpRenderEscolhaAmigos("gpConvidarLista", g.membrosUids || []);
};

window.confirmarConvitesGrupo = async function () {
  const g = window._grupoAtual;
  if (!g || !window._gpSelecionados?.size) return;
  try {
    const n = await gpEnviarConvites(g.id, g.nome);
    fecharPopup();
    if (typeof mostrarToastMundo === "function") mostrarToastMundo(n === 1 ? "Convite enviado" : `${n} convites enviados`);
  } catch (e) {
    console.error(e);
    alertBonito("Não consegui enviar os convites agora.");
  }
};

/* ---------- criar grupo ---------- */
window.abrirCriarGrupo = function () {
  window._gpImg = { foto: "", capa: "" };
  abrirPopup("Novo grupo", gpFormHTML({}, true), true, null);
  gpRenderEscolhaAmigos("gpConvidarLista", []);
  setTimeout(() => document.getElementById("gpNome")?.focus(), 60);
};
window.mostrarFormCriarGrupo = window.abrirCriarGrupo;

window.salvarNovoGrupo = async function () {
  const nome = document.getElementById("gpNome")?.value.trim();
  if (!nome) return document.getElementById("gpNome")?.focus();
  const btn = document.getElementById("gpSalvarBtn");
  if (btn) { btn.disabled = true; btn.querySelector("span").textContent = "Criando..."; }
  const meuUid = window.usuarioAtual.uid;
  try {
    const eu = (await getDoc(doc(db, "usuarios", meuUid))).data() || {};
    const imgs = await gpSubirImagens();
    const ref = doc(collection(db, "grupos"));
    await setDoc(ref, {
      nome,
      descricao: document.getElementById("gpDesc")?.value.trim() || "",
      ...imgs,
      criadoPor: meuUid,
      criadoEm: new Date().toISOString(),
      membros: [{ uid: meuUid, nickname: eu.nickname || "", tag: eu.tag || "", papel: "mestre" }],
      membrosUids: [meuUid],
      mestresUids: [meuUid],
    });
    const n = await gpEnviarConvites(ref.id, nome);
    fecharPopup();
    if (typeof carregarGrupos === "function") carregarGrupos();
    if (typeof mostrarToastMundo === "function") mostrarToastMundo(n ? `Grupo criado · ${n} convite${n > 1 ? "s" : ""}` : "Grupo criado");
  } catch (e) {
    console.error(e);
    alertBonito("Erro ao criar grupo: " + (e.code || e.message));
    if (btn) { btn.disabled = false; btn.querySelector("span").textContent = "Criar grupo"; }
  }
};

/* ---------- escolher a ficha do grupo (no lugar da caixinha de seleção) ---------- */
function gpRetratoFicha(f) {
  const img = f && (f.imagem || (f.imagens && f.imagens[0] && f.imagens[0].url));
  return `<span class="gp-ficha-img" style="${img ? `background-image:url('${esc(img)}')` : ""}">${img ? "" : f ? "🛡️" : "—"}</span>`;
}
function gpBotaoFichaHTML(f) {
  return `
    <button type="button" class="gp-ficha-btn" id="gpFichaBtn" onclick="abrirEscolherFichaGrupo()">
      ${gpRetratoFicha(f)}
      <span class="gp-ficha-txt"><strong>${f ? esc(f.nome || "Sem nome") : "Nenhuma ficha"}</strong><small>${f ? [f.classe, f.nivel ? "Nv " + f.nivel : ""].filter(Boolean).map(esc).join(" · ") || "Toque pra trocar" : "Toque pra escolher qual ficha você usa aqui"}</small></span>
      <i class="ti ti-chevron-down"></i>
    </button>`;
}
function abrirEscolherFichaGrupo() {
  const sel = document.getElementById("selectFichaGrupo");
  const atual = sel ? sel.value : "";
  const fichas = personagens || window.personagens || [];
  const op = (f) => {
    const v = f ? String(f.id) : "";
    return `<button type="button" class="gp-ficha-op ${v === atual ? "ativo" : ""}" onclick="escolherFichaGrupoOp('${esc(v)}')">
      ${gpRetratoFicha(f)}
      <span class="gp-ficha-txt"><strong>${f ? esc(f.nome || "Sem nome") : "Nenhuma ficha"}</strong><small>${f ? [f.classe, f.nivel ? "Nv " + f.nivel : ""].filter(Boolean).map(esc).join(" · ") : "Não usar ficha nesse grupo"}</small></span>
      ${v === atual ? `<i class="ti ti-check"></i>` : ""}
    </button>`;
  };
  abrirPopup("Minha ficha no grupo", `<div class="gp-ficha-lista">${fichas.map(op).join("")}${op(null)}</div>`, true, null);
}
async function escolherFichaGrupoOp(valor) {
  const sel = document.getElementById("selectFichaGrupo");
  if (!sel) return;
  sel.value = valor;
  fecharPopup();
  const fichas = personagens || window.personagens || [];
  const btn = document.getElementById("gpFichaBtn");
  if (btn) btn.outerHTML = gpBotaoFichaHTML(fichas.find((f) => String(f.id) === valor));
  // salva na hora, sem precisar de outro botão
  const fake = document.createElement("button");
  await window.salvarFichaGrupoBotao(fake);
}

/* =====================================================================
   CRIATURAS v2 (Grimório): blocos dinâmicos, editor em popup e fases
   Campos novos na criatura (os antigos em texto continuam sendo gerados):
     blocos: { ataques:[{nome,acerto,dano,desc}], habilidades:[{nome,desc,uso,usosMax,recarga}],
               reacoes:[{nome,desc}], lendarias:{max, acoes:[{nome,custo,desc}]} }
     resistTags, imunTags, vulnTags: [texto]
     fases: [{id,nome,gatilho,ca,velocidade,imagem,ganha:[nome],perde:[nome],fala}]
     textoAntigo: { ... }   (o que estava escrito antes da conversão)
   No combate cada cópia guarda: faseAtual, usosGastos{}, recargaGasta{}, lendGastas, fasesOferecidas[]
   ===================================================================== */

var CR_ATR = ["for", "des", "con", "int", "sab", "car"];

function crMod(v) {
  return Math.floor(((parseInt(v) || 10) - 10) / 2);
}
function crFmt(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}

// "Nome: texto | Nome 2: texto" (ou frases "Nome: ... . Nome2: ...") → [{nome, desc}]
function crDividirLista(txt) {
  const s = String(txt || "").trim();
  if (!s) return [];
  let partes = s.includes("|") ? s.split("|") : s.split(/\n+/);
  if (partes.length === 1) partes = s.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú][^:.]{1,40}:)/);
  return partes
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = p.match(/^([^:—–-]{1,60}?)\s*(?::|—|–| - )\s*(.+)$/s);
      return m ? { nome: m[1].trim(), desc: m[2].trim() } : { nome: p.length <= 40 ? p : "", desc: p.length <= 40 ? "" : p };
    });
}

function crParseAtaque(a) {
  const desc = a.desc || "";
  const mA = desc.match(/([+-]\s*\d+)\s*(?:para acertar|pra acertar|de acerto|acerto)?/i);
  const acerto = mA && /acertar|acerto|^\s*[+-]\d+\s*,/i.test(desc) ? parseInt(mA[1].replace(/\s+/g, "")) : null;
  const dano = typeof extrairDados === "function" ? extrairDados(desc) : "";
  let resto = desc;
  if (acerto !== null) resto = resto.replace(mA[0], "");
  const reTipo = /(?<![a-zà-ú])\d*\s*d\s*\d+(?:\s*[+-]\s*\d+(?!\s*d\s*\d))*(?:\s+de)?(?:\s+dano)?(?:\s+de)?(?:\s+([a-zà-ú]+))?/i;
  const mT = desc.match(reTipo);
  let tipoDano = mT && mT[1] ? mT[1] : "";
  if (/^(de|dano|e|ao|no|na|para|por|se|que)$/i.test(tipoDano)) tipoDano = "";
  if (dano && mT) resto = resto.replace(tipoDano ? mT[0] : mT[0].replace(/\s+[a-zà-ú]+$/i, (w) => (/^\s+(de|dano)$/i.test(w) ? w : "")), "");
  resto = resto.replace(/^[\s,.;—–-]+|[\s,.;—–-]+$/g, "").replace(/\s{2,}/g, " ").replace(/,\s*,/g, ",");
  return { nome: a.nome || "Ataque", acerto, dano: dano ? (tipoDano ? `${dano} ${tipoDano}` : dano) : "", desc: resto };
}

function crTags(txt) {
  return String(txt || "")
    .split(/[,;\n]+/)
    .map((t) => t.replace(/^(resistente a|imune a|vulnerável a)\s*/i, "").trim().replace(/\.$/, ""))
    .filter(Boolean);
}

// lê frases tipo "Resistente a necrótico e veneno. Imune a medo e charme." e separa em 3 listas
function crDefesas(c) {
  const out = { res: [], imu: [], vul: [] };
  const fontes = [[c.resistencias, "res"], [c.imunidades, "imu"], [c.vulnerabilidades, "vul"]];
  fontes.forEach(([txt, padrao]) => {
    String(txt || "")
      .split(/[.;\n]+/)
      .map((f) => f.trim())
      .filter(Boolean)
      .forEach((frase) => {
        let cat = padrao;
        let corpo = frase;
        const m = frase.match(/^(resistente|resistência|resistencia|resiste|imune|imunidade|vulnerável|vulneravel|vulnerabilidade)s?\s*(a|à|ao|aos|às|contra)?\s*/i);
        if (m) {
          const w = m[1].toLowerCase();
          cat = w.startsWith("imun") ? "imu" : w.startsWith("vuln") ? "vul" : "res";
          corpo = frase.slice(m[0].length);
        }
        corpo
          .split(/,|\s+e\s+/)
          .map((t) => t.replace(/^(dano|danos)\s+(de\s+)?/i, "").trim())
          .filter(Boolean)
          .forEach((t) => { if (!out[cat].includes(t)) out[cat].push(t); });
      });
  });
  return out;
}

// devolve a criatura com os blocos novos (sem perder nada do que já existia)
function crNormalizar(m) {
  const c = JSON.parse(JSON.stringify(m || {}));
  c.status = { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10, ...(c.status || {}) };
  if (!c.blocos) {
    const antigo = {};
    ["ataques", "habilidades", "reacoes", "fases", "mecanicas", "resistencias", "imunidades", "vulnerabilidades"].forEach((k) => {
      if (typeof c[k] === "string" && c[k].trim()) antigo[k] = c[k];
    });
    c.textoAntigo = { ...(c.textoAntigo || {}), ...antigo };
    c.blocos = {
      ataques: crDividirLista(c.ataques).map(crParseAtaque),
      habilidades: crDividirLista(c.habilidades).map((h) => ({ nome: h.nome || "Habilidade", desc: h.desc, uso: "", usosMax: 0, recarga: 0 })),
      reacoes: crDividirLista(c.reacoes).map((r) => ({ nome: r.nome || "Reação", desc: r.desc })),
      lendarias: { max: 3, acoes: [] },
    };
  }
  c.blocos.ataques = c.blocos.ataques || [];
  c.blocos.habilidades = c.blocos.habilidades || [];
  c.blocos.reacoes = c.blocos.reacoes || [];
  c.blocos.lendarias = c.blocos.lendarias || { max: 3, acoes: [] };
  if (!Array.isArray(c.resistTags) || !Array.isArray(c.imunTags) || !Array.isArray(c.vulnTags)) {
    const d = crDefesas(c);
    if (!Array.isArray(c.resistTags)) c.resistTags = d.res;
    if (!Array.isArray(c.imunTags)) c.imunTags = d.imu;
    if (!Array.isArray(c.vulnTags)) c.vulnTags = d.vul;
  }
  if (!Array.isArray(c.fases)) c.fases = [];
  return c;
}

// gera de volta os campos de texto antigos (outras partes do app ainda usam)
function crGerarTextos(c) {
  c.ataques = c.blocos.ataques
    .map((a) => `${a.nome}: ${[a.acerto !== null && a.acerto !== "" && !isNaN(a.acerto) ? `${crFmt(parseInt(a.acerto))} para acertar` : "", a.dano, a.desc].filter(Boolean).join(", ")}`)
    .join(" | ");
  c.habilidades = c.blocos.habilidades.map((h) => (h.desc ? `${h.nome}: ${h.desc}` : h.nome)).join(" | ");
  c.reacoes = c.blocos.reacoes.map((r) => (r.desc ? `${r.nome}: ${r.desc}` : r.nome)).join(" | ");
  c.resistencias = c.resistTags.join(", ");
  c.imunidades = c.imunTags.join(", ");
  c.vulnerabilidades = c.vulnTags.join(", ");
  c.fases = c.fases || [];
  return c;
}

function crEhMinha(entry) {
  return (monstrosMestre || []).some((m) => String(m.id) === String(entry.id));
}
function crEhChefe(c) {
  return c._tipo === "boss";
}

/* ---------- estado efetivo (com a fase aplicada) ---------- */
function crEfetivo(c, faseIdx) {
  const n = crNormalizar(c);
  const ef = { ...n, status: { ...n.status } };
  let ataques = [...n.blocos.ataques];
  let habilidades = [...n.blocos.habilidades];
  const fases = n.fases || [];
  for (let i = 0; i < Math.min(faseIdx || 0, fases.length); i++) {
    const f = fases[i];
    if (f.ca !== "" && f.ca != null && !isNaN(parseInt(f.ca))) ef.ca = parseInt(f.ca);
    if (f.velocidade) ef.velocidade = f.velocidade;
    if (f.imagem) ef.imagem = f.imagem;
    CR_ATR.forEach((a) => {
      if (f.status && f.status[a] !== "" && f.status[a] != null && !isNaN(parseInt(f.status[a]))) ef.status[a] = parseInt(f.status[a]);
    });
    const perde = new Set(f.perde || []);
    ataques = ataques.filter((x) => !perde.has(x.nome));
    habilidades = habilidades.filter((x) => !perde.has(x.nome));
    (f.ganhaAtaques || []).forEach((a) => ataques.push({ ...a, _daFase: f.nome }));
    (f.ganhaHabilidades || []).forEach((h) => habilidades.push({ ...h, _daFase: f.nome }));
  }
  ef._ataques = ataques;
  ef._habilidades = habilidades;
  ef._faseNome = faseIdx ? fases[faseIdx - 1]?.nome : "";
  return ef;
}

/* =====================================================================
   FICHA DA CRIATURA (substitui a antiga, para monstros e chefes)
   ===================================================================== */
var CR_ICONES = { Ataques: "⚔️", Habilidades: "✨", "Reações": "🛡️", "Ações lendárias": "👑", Defesas: "🧱", Fraquezas: "💔", "Mecânicas": "⚙️", Lore: "📜", "Diálogos": "💬", "Pontos de encontro": "📍", Fases: "🔥" };
function crBloco(titulo, corpo, extra) {
  const ic = CR_ICONES[titulo] || (titulo.startsWith("Fases") ? "🔥" : "");
  return `<section class="cr-bloco"><header class="cr-bloco-tit"><span class="cr-bloco-nome">${ic ? `<i>${ic}</i>` : ""}${titulo}</span>${extra ? `<span class="cr-bloco-extra">${extra}</span>` : ""}</header><div class="cr-bloco-corpo">${corpo}</div></section>`;
}

function crListaAtaquesHTML(ataques, ctx) {
  if (!ataques.length) return "";
  return crBloco(
    "Ataques",
    ataques
      .map((a, i) => {
        const temAc = a.acerto !== null && a.acerto !== "" && !isNaN(parseInt(a.acerto));
        const rolavel = typeof extrairDados === "function" && extrairDados(a.dano);
        return `
        <div class="cr-linha cr-atk">
          <div class="cr-linha-txt">
            <strong>${escapeHtml(a.nome)}${a._daFase ? ` <em class="cr-tag-fase">${escapeHtml(a._daFase)}</em>` : ""}</strong>
            ${a.desc ? `<span>${escapeHtml(a.desc)}</span>` : ""}
          </div>
          ${temAc || a.dano ? `<div class="cr-pills">
            ${temAc ? `<button type="button" class="cr-pill atk" title="Rolar acerto" onclick="event.stopPropagation(); crRolarAtaque(${ctx}, ${i})"><i>🎯</i>${crFmt(parseInt(a.acerto))}</button>` : ""}
            ${a.dano ? `<button type="button" class="cr-pill dano" title="Rolar dano" ${rolavel ? `onclick="event.stopPropagation(); crRolarDano(${ctx}, ${i})"` : "disabled"}><i>🩸</i>${escapeHtml(a.dano)}</button>` : ""}
          </div>` : ""}
        </div>`;
      })
      .join(""),
  );
}

function crUsoTexto(h) {
  if (h.uso === "usos" && h.usosMax > 0) return `${h.usosMax}x`;
  if (h.uso === "recarga" && h.recarga) return `Recarga ${h.recarga}${h.recarga < 6 ? "–6" : ""}`;
  return "";
}

function crListaHabilidadesHTML(habs, combateIdx) {
  if (!habs.length) return "";
  const inst = combateIdx != null ? combatesMestre[combateIdx] : null;
  return crBloco(
    "Habilidades",
    habs
      .map((h, i) => {
        let controle = "";
        if (inst && h.uso === "usos" && h.usosMax > 0) {
          const gastos = (inst.usosGastos || {})[h.nome] || 0;
          controle = `<div class="cr-pips">${Array.from({ length: h.usosMax }, (_, k) => `<button type="button" class="cr-pip ${k < h.usosMax - gastos ? "on" : ""}" onclick="crUsarHabilidade(${combateIdx}, '${escapeHtml(h.nome).replace(/'/g, "\\'")}', ${k < h.usosMax - gastos ? 1 : -1})"></button>`).join("")}</div>`;
        } else if (inst && h.uso === "recarga" && h.recarga) {
          const gasta = !!(inst.recargaGasta || {})[h.nome];
          controle = gasta
            ? `<button type="button" class="cr-mini-btn" onclick="crRolarRecarga(${combateIdx}, '${escapeHtml(h.nome).replace(/'/g, "\\'")}', ${h.recarga})">🎲 Recarga ${h.recarga}–6</button>`
            : `<button type="button" class="cr-mini-btn on" onclick="crUsarRecarga(${combateIdx}, '${escapeHtml(h.nome).replace(/'/g, "\\'")}')">Usar</button>`;
        } else if (crUsoTexto(h)) {
          controle = `<span class="cr-uso">${crUsoTexto(h)}</span>`;
        }
        return `
        <div class="cr-linha">
          <div class="cr-linha-txt"><strong>${escapeHtml(h.nome)}</strong>${h._daFase ? `<em class="cr-tag-fase">${escapeHtml(h._daFase)}</em>` : ""}${h.desc ? `<span>${escapeHtml(h.desc)}</span>` : ""}</div>
          ${controle}
        </div>`;
      })
      .join(""),
  );
}

function crListaSimplesHTML(titulo, itens) {
  if (!itens.length) return "";
  return crBloco(titulo, itens.map((r) => `<div class="cr-linha"><div class="cr-linha-txt"><strong>${escapeHtml(r.nome)}</strong>${r.desc ? `<span>${escapeHtml(r.desc)}</span>` : ""}</div></div>`).join(""));
}

function crLendariasHTML(c, combateIdx) {
  const L = c.blocos.lendarias;
  if (!L || !L.acoes.length) return "";
  const inst = combateIdx != null ? combatesMestre[combateIdx] : null;
  const max = parseInt(L.max) || 3;
  const gastas = inst ? inst.lendGastas || 0 : 0;
  const extra = inst
    ? `<span class="cr-lend-ctrl"><span class="cr-pips">${Array.from({ length: max }, (_, k) => `<i class="cr-pip ${k < max - gastas ? "on" : ""}"></i>`).join("")}</span><button type="button" class="cr-mini-btn" onclick="crNovoTurnoLend(${combateIdx})" title="Começo do turno: volta tudo">↺</button></span>`
    : `<small>${max} por rodada</small>`;
  return crBloco(
    "Ações lendárias",
    L.acoes
      .map(
        (a, i) => `
      <div class="cr-linha">
        <div class="cr-linha-txt"><strong>${escapeHtml(a.nome)}</strong>${a.desc ? `<span>${escapeHtml(a.desc)}</span>` : ""}</div>
        ${inst ? `<button type="button" class="cr-mini-btn ${max - gastas >= (parseInt(a.custo) || 1) ? "on" : ""}" onclick="crGastarLend(${combateIdx}, ${parseInt(a.custo) || 1})">Usar · ${parseInt(a.custo) || 1}</button>` : `<span class="cr-uso">custa ${parseInt(a.custo) || 1}</span>`}
      </div>`,
      )
      .join(""),
    extra,
  );
}

function crTagsHTML(c) {
  const g = (rot, arr, cls) => (arr && arr.length ? `<div class="cr-tags-linha"><span>${rot}</span>${arr.map((t) => `<em class="cr-chip ${cls}">${escapeHtml(t)}</em>`).join("")}</div>` : "");
  const html = g("Resiste", c.resistTags, "res") + g("Imune", c.imunTags, "imu") + g("Vulnerável", c.vulnTags, "vul");
  return html ? crBloco("Defesas", html) : "";
}

function crFasesFichaHTML(c) {
  if (!crEhChefe(c)) return "";
  const minha = crEhMinha(c);
  const botao = `<button type="button" class="cr-link" onclick="crAbrirEditor('${minha ? "editar" : "copia"}', 'fases')">${c.fases.length ? "Editar fases" : "+ Criar fases"}</button>`;
  if (!c.fases.length) {
    return crBloco(
      "Fases",
      `<div class="cr-fases-vazio">
        <p>Esse chefe ainda não tem fases. Monte a <b>Fase 2</b> (ex: abaixo de 50% de vida ele fica mais forte, ganha ataques novos e você lê uma fala).</p>
        ${c.textoAntigo?.fases ? `<div class="cr-antigo"><small>O que estava escrito antes:</small><p>${escapeHtml(c.textoAntigo.fases)}</p></div>` : ""}
        <button type="button" class="cr-btn-fase" onclick="crAbrirEditor('${minha ? "editar" : "copia"}', 'fases')">🔥 ${minha ? "Montar fases" : "Montar fases numa cópia"}</button>
      </div>`,
      botao,
    );
  }
  return crBloco(
    "Fases",
    `<div class="cr-linha"><div class="cr-linha-txt"><strong>Base</strong><span>Começa o combate assim.</span></div></div>` +
      c.fases
        .map(
          (f) => `
      <div class="cr-linha cr-fase-item">
        <div class="cr-linha-txt"><strong>${escapeHtml(f.nome || "Fase")}</strong>
          <span>${f.gatilho ? `Quando a vida chega a ${parseInt(f.gatilho)}%` : "Troca manual"}${f.ca ? ` · CA ${escapeHtml(String(f.ca))}` : ""}${(f.ganhaAtaques || []).length + (f.ganhaHabilidades || []).length ? ` · ganha ${[...(f.ganhaAtaques || []), ...(f.ganhaHabilidades || [])].map((x) => escapeHtml(x.nome)).join(", ")}` : ""}${(f.perde || []).length ? ` · perde ${f.perde.map(escapeHtml).join(", ")}` : ""}</span>
          ${f.fala ? `<span class="cr-fala">“${escapeHtml(f.fala)}”</span>` : ""}
        </div>
      </div>`,
        )
        .join(""),
    botao,
  );
}

window._crFichaAtual = null;

function crAbrirFicha(entry) {
  const c = crNormalizar(entry);
  window._crFichaAtual = c;
  window._entradaSessaoAtual = entry;
  const minha = crEhMinha(entry);
  const chefe = crEhChefe(c);
  const st = c.status;
  const texto = (v) => (typeof formatarTexto === "function" ? formatarTexto(v) : escapeHtml(v));
  const antigo = Object.entries(c.textoAntigo || {}).filter(([k, v]) => v && ["fases", "mecanicas"].includes(k) && !c[k + "Mostrado"]);

  const conteudo = `
    ${c.imagem ? `<img class="sheet-img" src="${escapeHtml(c.imagem)}" alt="" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px;margin-bottom:12px;">` : ""}
    <h2 class="sheet-titulo" style="text-align:center;margin-bottom:4px;">${escapeHtml(c.nome || "Sem nome")}</h2>
    <div class="sheet-meta" style="text-align:center;margin-bottom:8px;">${[chefe ? "💀 Chefe" : "", c.titulo, c.tipo, c.regiao].filter(Boolean).map(escapeHtml).join(" · ")}</div>
    <div class="cr-selos">
      <span><i>❤️</i><b>${c.hpMax || 0}</b><small>HP</small></span>
      <span><i>🛡️</i><b>${c.ca || 0}</b><small>CA</small></span>
      ${c.velocidade ? `<span><i>👣</i><b>${escapeHtml(c.velocidade)}</b><small>Desloc.</small></span>` : ""}
    </div>
    <div class="cr-cc-atrs cr-ficha-atrs">
      ${CR_ATR.map((a) => `<button type="button" class="cr-cc-atr" onclick="crRolarAtributo('ficha','${a}')"><small>${a.toUpperCase()}</small><b>${crFmt(crMod(st[a]))}</b><em>${st[a]}</em></button>`).join("")}
    </div>
    ${c.saves || c.sentidos || c.idiomas ? `<div class="cr-ficha-extra">${[c.saves ? "Testes: " + escapeHtml(c.saves) : "", c.sentidos ? escapeHtml(c.sentidos) : "", c.idiomas ? "Idiomas: " + escapeHtml(c.idiomas) : ""].filter(Boolean).join(" · ")}</div>` : ""}

    <div class="cr-acoes-ficha">
      <button type="button" class="cr-btn-combate" onclick="crEnviarCombate()">⚔️ Enviar para combate</button>
      <div class="cr-acoes-linha">
        <button type="button" class="cr-btn-sec" onclick="crAbrirEditor('${minha ? "editar" : "copia"}')">✏️ ${minha ? "Editar" : "Editar uma cópia"}</button>
        ${minha ? `<button type="button" class="cr-btn-sec" onclick="crAbrirEditor('copia')">📄 Duplicar</button>` : ""}
      </div>
    </div>

    ${crFasesFichaHTML(c)}
    ${crListaAtaquesHTML(c.blocos.ataques, "'ficha'")}
    ${crListaHabilidadesHTML(c.blocos.habilidades, null)}
    ${crListaSimplesHTML("Reações", c.blocos.reacoes)}
    ${crLendariasHTML(c, null)}
    ${crTagsHTML(c)}
    ${c.fraquezas ? crBloco("Fraquezas", texto(c.fraquezas)) : ""}
    ${c.mecanicas ? crBloco("Mecânicas", texto(c.mecanicas)) : ""}
    ${c.lore ? crBloco("Lore", texto(c.lore)) : ""}
    ${c.dialogos?.length ? crBloco("Diálogos", c.dialogos.map((f) => `“${escapeHtml(f)}”`).join("<br>")) : ""}
    ${c.encontros ? crBloco("Pontos de encontro", texto(c.encontros)) : ""}
    ${minha ? `<button type="button" class="cr-btn-excluir" onclick="crExcluir()">🗑️ Excluir ${chefe ? "chefe" : "criatura"}</button>` : ""}
  `;
  _abrirSheetCustom(conteudo);
}

// as fichas antigas passam a abrir a nova
function abrirSheetMonstroPadrao(monstro) {
  crAbrirFicha(monstro);
}
function _abrirPopupBossCompendio(boss) {
  crAbrirFicha(boss);
}
function abrirSheetMonstro(index) {
  if (monstrosMestre[index]) {
    sheetMonstroIndexAtual = index;
    crAbrirFicha(monstrosMestre[index]);
  }
}

function crEnviarCombate() {
  const c = window._crFichaAtual;
  if (!c) return;
  const copia = JSON.parse(JSON.stringify(c));
  copia.instanciaId = Date.now() + Math.floor(Math.random() * 9999);
  copia.monstroBaseId = c.id;
  copia.origem = "combate";
  copia.nome = gerarNomeInstanciaCombate(c.nome);
  copia.hpAtual = c.hpMax || c.hpAtual || 0;
  copia.faseAtual = 0;
  copia.usosGastos = {};
  copia.recargaGasta = {};
  copia.lendGastas = 0;
  copia.fasesOferecidas = [];
  combatesMestre.push(copia);
  salvarCombatesMestreStorage();
  renderCombatesMestre();
  if (typeof mostrarToastMundo === "function") mostrarToastMundo(`${c.nome} entrou no combate`);
  else alertBonito(`${c.nome} foi enviado para o combate.`);
}
function enviarMonstroPadraoParaCombate(monstro) {
  window._crFichaAtual = crNormalizar(monstro);
  crEnviarCombate();
}
function enviarMonstroParaCombate(index) {
  if (!monstrosMestre[index]) return;
  window._crFichaAtual = crNormalizar(monstrosMestre[index]);
  crEnviarCombate();
}
function criarCopiaEditavelMonstroPadrao(monstro) {
  window._crFichaAtual = crNormalizar(monstro);
  window._entradaSessaoAtual = monstro;
  crAbrirEditor("copia");
}

async function crExcluir() {
  const c = window._crFichaAtual;
  if (!c) return;
  const idx = monstrosMestre.findIndex((m) => String(m.id) === String(c.id));
  if (idx === -1) return;
  if (!(await confirmBonito(`Excluir "${c.nome}"? Não dá pra desfazer.`))) return;
  try {
    if (window.usuarioAtual && window.deleteDoc) await window.deleteDoc(window.doc(window.db, "usuarios", window.usuarioAtual.uid, "monstros", String(c.id)));
  } catch (e) {}
  monstrosMestre.splice(idx, 1);
  salvarMonstrosMestreStorage();
  renderMonstrosMestre();
  fecharSheetMonstro();
}

/* ---------- rolagens do mestre (não vão pro grupo dos jogadores) ---------- */
(function () {
  if (typeof compartilharRolagem !== "function" || compartilharRolagem._cr) return;
  const orig = compartilharRolagem;
  compartilharRolagem = function (r) {
    const m = document.getElementById("masterIgnea");
    if (m && m.style.display && m.style.display !== "none") return;
    return orig.apply(this, arguments);
  };
  compartilharRolagem._cr = true;
})();

function crFonte(ctx) {
  if (ctx === "ficha") return crEfetivo(window._crFichaAtual, 0);
  const inst = combatesMestre[ctx];
  return inst ? crEfetivo(inst, inst.faseAtual || 0) : null;
}
function crRolarAtaque(ctx, i) {
  const c = crFonte(ctx);
  const a = c?._ataques?.[i];
  if (!a) return;
  rolarD20(`${a.nome} · ${c.nome}`, parseInt(a.acerto) || 0, "normal", extrairDados(a.dano) ? [{ rotulo: "Dano", acao: () => crRolarDano(ctx, i) }] : []);
}
function crRolarDano(ctx, i) {
  const c = crFonte(ctx);
  const a = c?._ataques?.[i];
  const expr = a && extrairDados(a.dano);
  if (!expr) return;
  rolarDano(`Dano · ${a.nome} (${c.nome})`, expr, false, [{ rotulo: "Acerto", acao: () => crRolarAtaque(ctx, i) }]);
}
function crRolarAtributo(ctx, atr) {
  const c = crFonte(ctx);
  if (!c) return;
  const m = crMod(c.status[atr]);
  rolarD20(`${atr.toUpperCase()} · ${c.nome}`, m);
}

/* =====================================================================
   EDITOR EM POPUP
   ===================================================================== */
window._crEd = null;

function crAbrirEditor(modo, irPara) {
  const base = modo === "novo"
    ? crNormalizar({ nome: "", _tipo: "boss", hpMax: 100, ca: 15 })
    : window._crFichaAtual ? JSON.parse(JSON.stringify(window._crFichaAtual)) : crNormalizar({ nome: "", hpMax: 10, ca: 10 });
  const ed = crNormalizar(base);
  ed.fases = (ed.fases || []).map((f) => ({ ganhaAtaques: [], ganhaHabilidades: [], perde: [], status: {}, ...f }));
  window._crEd = { modo, c: ed, imgNova: "", origId: base.id };
  if (modo === "copia") ed.nome = crEhMinha(base) ? `${base.nome} (cópia)` : base.nome;
  if (irPara === "fases" && crEhChefe(ed) && !ed.fases.length) {
    ed.fases.push({ id: Date.now(), nome: "Fase 2", gatilho: 50, ca: "", velocidade: "", status: {}, perde: [], ganhaAtaques: [], ganhaHabilidades: [], fala: "" });
  }
  crRenderEditor();
  if (irPara === "fases") setTimeout(() => (crEdHost() || document).querySelector("#crEdFases")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
}
function crNovoChefe() {
  window._crFichaAtual = null;
  crAbrirEditor("novo");
}

function crCampo(rot, campo, val, extra) {
  return `<label class="cr-ed-campo"><span>${rot}</span><input value="${escapeHtml(val == null ? "" : String(val))}" oninput="crEdSet('${campo}', this.value)" ${extra || ""}></label>`;
}

// campo de etiquetas: digita e aperta Enter (ou vírgula) pra virar etiqueta
function crTagsCampo(rot, chave, ph) {
  const arr = window._crEd.c[chave] || [];
  return `
    <div class="cr-ed-campo">
      <span>${rot}</span>
      <div class="cr-tags-input" onclick="this.querySelector('input').focus()">
        ${arr.map((t, i) => `<em class="cr-tag-ed">${escapeHtml(t)}<button type="button" onclick="event.stopPropagation(); crTagRem('${chave}', ${i})" aria-label="Tirar">×</button></em>`).join("")}
        <input placeholder="${arr.length ? "" : ph}" onkeydown="crTagTecla(event, '${chave}', this)" onblur="crTagAdd('${chave}', this)">
      </div>
    </div>`;
}
function crTagTecla(ev, chave, el) {
  if (ev.key === "Enter" || ev.key === ",") {
    ev.preventDefault();
    crTagAdd(chave, el, true);
  } else if (ev.key === "Backspace" && !el.value) {
    const arr = window._crEd.c[chave] || [];
    if (arr.length) { arr.pop(); crRenderEditor(true); crFocarTag(chave); }
  }
}
function crTagAdd(chave, el, focar) {
  const v = (el.value || "").replace(/,/g, " ").trim();
  if (!v) return;
  const arr = (window._crEd.c[chave] = window._crEd.c[chave] || []);
  if (!arr.includes(v)) arr.push(v);
  el.value = "";
  crRenderEditor(true);
  if (focar) crFocarTag(chave);
}
function crTagRem(chave, i) {
  window._crEd.c[chave].splice(i, 1);
  crRenderEditor(true);
}
function crFocarTag(chave) {
  setTimeout(() => {
    const host = crEdHost();
    const el = host && [...host.querySelectorAll(".cr-tags-input input")].find((x) => (x.getAttribute("onkeydown") || "").includes(`'${chave}'`));
    if (el) el.focus();
  }, 0);
}

function crEdHost() {
  const ed = window._crEd;
  if (ed && ed.alvo) return document.getElementById(ed.alvo);
  return document.getElementById("popup-texto");
}

function crSecao(id, titulo, corpo, abertoPadrao) {
  const ed = window._crEd;
  ed.abertos = ed.abertos || {};
  const aberto = ed.abertos[id] ?? abertoPadrao;
  return `
    <details class="cr-sec" id="crSec-${id}" ${aberto ? "open" : ""} ontoggle="if (window._crEd) (window._crEd.abertos = window._crEd.abertos || {})['${id}'] = this.open">
      <summary><span>${titulo}</span><i class="cr-sec-seta">▾</i></summary>
      <div class="cr-sec-corpo">${corpo}</div>
    </details>`;
}

function crIrSecao(id, btn) {
  // procura dentro do editor do botão (há vários editores na aba Criar ao mesmo tempo)
  const caixa = (btn && btn.closest(".cr-editor")) || crEdHost() || document;
  const el = caixa.querySelector("#crSec-" + id);
  if (!el) return;
  el.open = true;
  if (window._crEd) (window._crEd.abertos = window._crEd.abertos || {})[id] = true;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function crRenderEditor(manterFoco) {
  const ed = window._crEd;
  const { c, modo } = ed;
  const chefe = crEhChefe(c);
  const linhaAtk = (a, i) => `
    <div class="cr-ed-item">
      <div class="cr-ed-item-topo">
        <input class="cr-ed-nome" value="${escapeHtml(a.nome || "")}" placeholder="Nome (ex: Garra)" oninput="crEdLista('ataques', ${i}, 'nome', this.value)">
        <button type="button" class="cr-ed-x" onclick="crEdRemover('ataques', ${i})" title="Remover">✕</button>
      </div>
      <div class="cr-ed-duplo">
        <label class="cr-ed-campo"><span>🎯 Acerto</span><input type="number" value="${a.acerto == null ? "" : escapeHtml(String(a.acerto))}" placeholder="ex: 5" oninput="crEdLista('ataques', ${i}, 'acerto', this.value === '' ? null : parseInt(this.value))"></label>
        <label class="cr-ed-campo"><span>🩸 Dano</span><input value="${escapeHtml(a.dano || "")}" placeholder="ex: 2d6+4 cortante" oninput="crEdLista('ataques', ${i}, 'dano', this.value)"></label>
      </div>
      <input value="${escapeHtml(a.desc || "")}" placeholder="Detalhes (alcance, efeito...)" oninput="crEdLista('ataques', ${i}, 'desc', this.value)">
    </div>`;
  const linhaHab = (h, i) => `
    <div class="cr-ed-item">
      <div class="cr-ed-item-topo">
        <input class="cr-ed-nome" value="${escapeHtml(h.nome || "")}" placeholder="Nome (ex: Regeneração)" oninput="crEdLista('habilidades', ${i}, 'nome', this.value)">
        <button type="button" class="cr-ed-x" onclick="crEdRemover('habilidades', ${i})" title="Remover">✕</button>
      </div>
      <textarea placeholder="O que faz" oninput="crEdLista('habilidades', ${i}, 'desc', this.value)">${escapeHtml(h.desc || "")}</textarea>
      <div class="cr-ed-duplo">
        <select onchange="crEdLista('habilidades', ${i}, 'uso', this.value); crRenderEditor()">
          <option value="" ${!h.uso ? "selected" : ""}>Sem limite</option>
          <option value="usos" ${h.uso === "usos" ? "selected" : ""}>Usos por combate</option>
          <option value="recarga" ${h.uso === "recarga" ? "selected" : ""}>Recarga no d6</option>
        </select>
        ${h.uso === "usos" ? `<input type="number" min="1" max="10" value="${h.usosMax || 1}" placeholder="Quantos" oninput="crEdLista('habilidades', ${i}, 'usosMax', parseInt(this.value) || 1)">` : ""}
        ${h.uso === "recarga" ? `<select onchange="crEdLista('habilidades', ${i}, 'recarga', parseInt(this.value))">${[6, 5, 4].map((n) => `<option value="${n}" ${parseInt(h.recarga || 5) === n ? "selected" : ""}>Recarga ${n}${n < 6 ? "–6" : ""}</option>`).join("")}</select>` : ""}
      </div>
    </div>`;
  const linhaSimples = (lista, ph) => (r, i) => `
    <div class="cr-ed-item">
      <div class="cr-ed-item-topo">
        <input class="cr-ed-nome" value="${escapeHtml(r.nome || "")}" placeholder="${ph}" oninput="crEdLista('${lista}', ${i}, 'nome', this.value)">
        ${lista === "lendarias" ? `<input type="number" min="1" max="3" class="cr-ed-custo" value="${r.custo || 1}" title="Custo" oninput="crEdLista('lendarias', ${i}, 'custo', parseInt(this.value) || 1)">` : ""}
        <button type="button" class="cr-ed-x" onclick="crEdRemover('${lista}', ${i})" title="Remover">✕</button>
      </div>
      <textarea placeholder="O que faz" oninput="crEdLista('${lista}', ${i}, 'desc', this.value)">${escapeHtml(r.desc || "")}</textarea>
    </div>`;
  const nomesBase = [...c.blocos.ataques.map((a) => a.nome), ...c.blocos.habilidades.map((h) => h.nome)].filter(Boolean);
  const linhaFase = (f, i) => `
    <div class="cr-ed-item cr-ed-fase">
      <div class="cr-ed-item-topo">
        <span class="cr-ed-fase-num">${i + 2}</span>
        <input class="cr-ed-nome" value="${escapeHtml(f.nome || "")}" placeholder="Nome da fase (ex: Fúria)" oninput="crEdFase(${i}, 'nome', this.value)">
        <button type="button" class="cr-ed-x" onclick="crEdRemoverFase(${i})" title="Remover fase">✕</button>
      </div>
      <div class="cr-ed-duplo">
        <label class="cr-ed-campo"><span>Gatilho (% de vida)</span><input type="number" min="1" max="99" value="${f.gatilho || ""}" placeholder="Vazio = manual" oninput="crEdFase(${i}, 'gatilho', this.value === '' ? '' : parseInt(this.value))"></label>
        <label class="cr-ed-campo"><span>Nova CA</span><input type="number" value="${f.ca || ""}" placeholder="igual" oninput="crEdFase(${i}, 'ca', this.value)"></label>
      </div>
      <label class="cr-ed-campo"><span>Novo deslocamento</span><input value="${escapeHtml(f.velocidade || "")}" placeholder="igual" oninput="crEdFase(${i}, 'velocidade', this.value)"></label>
      <div class="cr-ed-sub">Atributos que mudam <small>(vazio = igual)</small></div>
      <div class="cr-ed-atrs">${CR_ATR.map((a) => `<label><span>${a.toUpperCase()}</span><input type="number" value="${f.status?.[a] ?? ""}" placeholder="—" oninput="crEdFaseAtr(${i}, '${a}', this.value)"></label>`).join("")}</div>
      ${nomesBase.length ? `<div class="cr-ed-sub">Perde nessa fase <small>(toque pra riscar)</small></div><div class="cr-ed-chips">${nomesBase.map((n) => `<button type="button" class="cr-ed-chip ${(f.perde || []).includes(n) ? "on" : ""}" onclick="crEdFasePerde(${i}, '${escapeHtml(n).replace(/'/g, "\\'")}')">${escapeHtml(n)}</button>`).join("")}</div>` : ""}
      <div class="cr-ed-sub">Ganha nessa fase</div>
      ${(f.ganhaAtaques || []).map((a, k) => `<div class="cr-ed-ganho"><span>⚔️ ${escapeHtml(a.nome)}${a.acerto != null ? ` · ${crFmt(parseInt(a.acerto))}` : ""}${a.dano ? ` · ${escapeHtml(a.dano)}` : ""}</span><button type="button" class="cr-ed-x" onclick="crEdFaseRemGanho(${i}, 'ganhaAtaques', ${k})">✕</button></div>`).join("")}
      ${(f.ganhaHabilidades || []).map((h, k) => `<div class="cr-ed-ganho"><span>✨ ${escapeHtml(h.nome)}</span><button type="button" class="cr-ed-x" onclick="crEdFaseRemGanho(${i}, 'ganhaHabilidades', ${k})">✕</button></div>`).join("")}
      <div class="cr-ed-acoes-mini">
        <button type="button" class="cr-ed-add mini" onclick="crEdFaseGanho(${i}, 'ataque')">+ Ataque</button>
        <button type="button" class="cr-ed-add mini" onclick="crEdFaseGanho(${i}, 'habilidade')">+ Habilidade</button>
      </div>
      <label class="cr-ed-campo"><span>Fala de transição</span><textarea placeholder="O que você lê em voz alta quando a fase começa" oninput="crEdFase(${i}, 'fala', this.value)">${escapeHtml(f.fala || "")}</textarea></label>
    </div>`;

  const temDetalhes = c.saves || c.sentidos || c.idiomas;
  const nAcoes = c.blocos.ataques.length + c.blocos.habilidades.length + c.blocos.reacoes.length;
  const nDef = c.resistTags.length + c.imunTags.length + c.vulnTags.length;

  const secIdent = `
    <div class="cr-ed-ident">
      <label class="cr-ed-img-prev" id="crImgPrev" style="${c.imagem ? `background-image:url('${escapeHtml(c.imagem)}')` : ""}" title="Trocar imagem">
        ${c.imagem ? "" : `<span>📷<small>Imagem</small></span>`}
        <input type="file" accept="image/*" style="display:none" onchange="crEdImagem(this)">
      </label>
      <div class="cr-ed-ident-campos">
        ${crCampo("Nome", "nome", c.nome, 'placeholder="Ex: Lobo das Cinzas"')}
        ${crCampo("Tipo", "tipo", c.tipo, 'placeholder="Ex: Fera, Morto-vivo"')}
      </div>
    </div>
    ${chefe ? crCampo("Título / epíteto", "titulo", c.titulo, 'placeholder="Ex: A Tecelã do Destino"') : ""}
`;

  const secCombate = `
    <div class="cr-ed-triplo">
      ${crCampo("❤️ HP", "hpMax", c.hpMax, 'type="number" min="0"')}
      ${crCampo("🛡️ CA", "ca", c.ca, 'type="number" min="0"')}
      ${crCampo("👣 Deslocamento", "velocidade", c.velocidade, 'placeholder="9 m"')}
    </div>
    <div class="cr-ed-sub">Atributos</div>
    <div class="cr-ed-atrs">${CR_ATR.map((a) => `<label><span>${a.toUpperCase()}</span><input type="number" value="${c.status[a]}" oninput="crEdAtr('${a}', this.value); this.nextElementSibling.textContent = crFmt(crMod(this.value))"><small>${crFmt(crMod(c.status[a]))}</small></label>`).join("")}</div>
    <details class="cr-ed-mais" ${temDetalhes ? "open" : ""}>
      <summary>+ Mais detalhes <small>(testes, sentidos, idiomas)</small></summary>
      ${crCampo("Testes de resistência", "saves", c.saves, 'placeholder="Ex: DES +5, CON +7"')}
      ${crCampo("Sentidos", "sentidos", c.sentidos, 'placeholder="Ex: Visão no escuro 18 m"')}
      ${crCampo("Idiomas", "idiomas", c.idiomas, 'placeholder="Ex: Comum, Abissal"')}
    </details>`;

  const secAcoes = `
    <div class="cr-ed-sub grande">⚔️ Ataques</div>
    ${c.blocos.ataques.map(linhaAtk).join("")}
    <button type="button" class="cr-ed-add" onclick="crEdAdicionar('ataques')">+ Adicionar ataque</button>
    <div class="cr-ed-sub grande">✨ Habilidades</div>
    ${c.blocos.habilidades.map(linhaHab).join("")}
    <button type="button" class="cr-ed-add" onclick="crEdAdicionar('habilidades')">+ Adicionar habilidade</button>
    <div class="cr-ed-sub grande">🛡️ Reações</div>
    ${c.blocos.reacoes.map(linhaSimples("reacoes", "Nome (ex: Aparar)")).join("")}
    <button type="button" class="cr-ed-add" onclick="crEdAdicionar('reacoes')">+ Adicionar reação</button>`;

  const secChefe = `
    <div class="cr-ed-sub grande">🔥 Fases</div>
    <p class="cr-dica">A <b>Base</b> é como ele começa. Cada fase nova só muda o que você preencher; o resto continua igual.</p>
    ${c.textoAntigo?.fases ? `<div class="cr-ed-antigo"><small>Texto antigo das fases:</small><p>${escapeHtml(c.textoAntigo.fases)}</p></div>` : ""}
    ${c.fases.map(linhaFase).join("")}
    <button type="button" class="cr-ed-add" onclick="crEdAdicionarFase()">+ Adicionar fase</button>
    <div class="cr-ed-sub grande">👑 Ações lendárias ${c.blocos.lendarias.acoes.length ? `<label class="cr-ed-max">por rodada <input type="number" min="1" max="5" value="${c.blocos.lendarias.max || 3}" oninput="window._crEd.c.blocos.lendarias.max = parseInt(this.value) || 3"></label>` : ""}</div>
    ${c.blocos.lendarias.acoes.map(linhaSimples("lendarias", "Nome (ex: Golpe de cauda)")).join("")}
    <button type="button" class="cr-ed-add" onclick="crEdAdicionar('lendarias')">+ Adicionar ação lendária</button>
    <label class="cr-ed-campo" style="margin-top:12px"><span>⚙️ Mecânicas especiais</span><textarea oninput="crEdSet('mecanicas', this.value)">${escapeHtml(c.mecanicas || "")}</textarea></label>`;

  const secDefesas = `
    ${crTagsCampo("Resiste", "resistTags", "Ex: fogo (Enter pra adicionar)")}
    ${crTagsCampo("Imune", "imunTags", "Ex: veneno, amedrontado")}
    ${crTagsCampo("Vulnerável", "vulnTags", "Ex: radiante")}
    <label class="cr-ed-campo"><span>Fraquezas</span><textarea placeholder="Ex: luz do sol o enfraquece" oninput="crEdSet('fraquezas', this.value)">${escapeHtml(c.fraquezas || "")}</textarea></label>`;

  const secHistoria = `
    <label class="cr-ed-campo"><span>Lore</span><textarea placeholder="De onde vem, o que quer, por que é perigoso" oninput="crEdSet('lore', this.value)">${escapeHtml(c.lore || "")}</textarea></label>
    <label class="cr-ed-campo"><span>Diálogos <small>(um por linha)</small></span><textarea oninput="crEdSet('dialogos', this.value.split('\\n').map(s=>s.trim()).filter(Boolean))">${escapeHtml((c.dialogos || []).join("\n"))}</textarea></label>
    <div class="cr-ed-sub">Onde encontrar</div>
    <div class="cr-ed-duplo">${crCampo("Região", "regiao", c.regiao)}${crCampo("Localização", "localizacao", c.localizacao)}</div>
    <div class="cr-ed-duplo">${crCampo("Idade", "idade", c.idade)}${crCampo("Ponto de encontro", "pontoEncontro", c.pontoEncontro)}</div>
    <label class="cr-ed-campo"><span>Notas de encontros</span><textarea oninput="crEdSet('encontros', this.value)">${escapeHtml(c.encontros || "")}</textarea></label>`;

  const atalhos = [
    ["ident", "Identidade"],
    ["combate", "Combate"],
    ["acoes", `Ações${nAcoes ? ` ${nAcoes}` : ""}`],
    ...(chefe ? [["chefe", `Fases${c.fases.length ? ` ${c.fases.length}` : ""}`]] : []),
    ["defesas", `Defesas${nDef ? ` ${nDef}` : ""}`],
    ["historia", "História"],
  ];

  const html = `
    <div class="cr-editor ${ed.alvo ? "cr-inline" : ""}">
      ${modo === "copia" ? `<p class="cr-dica">Você está editando uma <b>cópia</b>. O original fica do jeito que está.</p>` : ""}
      <div class="cr-ed-atalhos">${atalhos.map(([id, rot]) => `<button type="button" onclick="crIrSecao('${id}', this)">${rot}</button>`).join("")}</div>
      ${crSecao("ident", "🖼️ Identidade", secIdent, true)}
      ${crSecao("combate", "⚔️ Combate", secCombate, true)}
      ${crSecao("acoes", `🎯 O que ele faz${nAcoes ? ` <small>${nAcoes}</small>` : ""}`, secAcoes, modo !== "novo" || nAcoes > 0)}
      ${chefe ? crSecao("chefe", `🔥 Chefe: fases e lendárias${c.fases.length ? ` <small>${c.fases.length} fase${c.fases.length > 1 ? "s" : ""}</small>` : ""}`, secChefe, false) : ""}
      ${crSecao("defesas", `🛡️ Defesas${nDef ? ` <small>${nDef}</small>` : ""}`, secDefesas, false)}
      ${crSecao("historia", "📜 História e mesa", secHistoria, false)}
      <div class="cr-ed-rodape">
        ${modo === "editar"
          ? `<button type="button" class="cr-ed-salvar" id="crSalvar" onclick="crSalvarEditor(false)"><span>Salvar</span></button>
             <button type="button" class="cr-ed-salvar-outro" onclick="crSalvarEditor(true)">Salvar como outro</button>`
          : `<button type="button" class="cr-ed-salvar" id="crSalvar" onclick="crSalvarEditor(true)"><span>${modo === "novo" ? (chefe ? "⚡ Criar chefe" : "⚡ Criar criatura") : "Salvar cópia"}</span></button>`}
      </div>
    </div>`;

  if (ed.alvo) {
    const host = document.getElementById(ed.alvo);
    if (host) host.innerHTML = html;
    return;
  }
  const popupTexto = document.getElementById("popup-texto");
  const box = popupTexto && popupTexto.closest(".popup-content, .popup-box");
  const sc1 = popupTexto ? popupTexto.scrollTop : 0;
  const sc2 = box ? box.scrollTop : 0;
  const aberto = document.getElementById("popup")?.style.display === "flex";
  if (aberto && popupTexto && popupTexto.querySelector(".cr-editor")) {
    popupTexto.innerHTML = html;
    popupTexto.scrollTop = sc1;
    if (box) box.scrollTop = sc2;
  } else {
    abrirPopup(modo === "editar" ? `Editar ${c.nome || ""}` : modo === "novo" ? "Novo" : "Editar cópia", html, true, null);
  }
}

/* ---------- formulário da aba Criar (Monstro e Boss) usa o mesmo editor ---------- */
window._crRascunhos = window._crRascunhos || {};

function crIniciarCriar(tipo) {
  const hostId = tipo === "boss" ? "crCriarHost-boss" : "crCriarHost-monstro";
  const host = document.getElementById(hostId);
  if (!host) return;
  let ed = window._crRascunhos[tipo];
  if (!ed) {
    const c = crNormalizar({ nome: "", hpMax: tipo === "boss" ? 100 : 10, ca: tipo === "boss" ? 15 : 10, ...(tipo === "boss" ? { _tipo: "boss" } : {}) });
    c.fases = [];
    ed = { modo: "novo", c, imgNova: "", origId: null, alvo: hostId, tipoCriar: tipo, abertos: {} };
    window._crRascunhos[tipo] = ed;
  }
  window._crEd = ed;
  crRenderEditor();
  host.onfocusin = host.onpointerdown = () => { window._crEd = window._crRascunhos[tipo]; };
}

(function () {
  if (typeof trocarTipoCriar !== "function" || trocarTipoCriar._cr) return;
  const orig = trocarTipoCriar;
  trocarTipoCriar = function (tipo, btn) {
    const r = orig.apply(this, arguments);
    if (tipo === "monstro" || tipo === "boss") crIniciarCriar(tipo);
    return r;
  };
  trocarTipoCriar._cr = true;
  window.trocarTipoCriar = trocarTipoCriar;
})();
setTimeout(() => { try { crIniciarCriar("boss"); crIniciarCriar("monstro"); } catch (e) {} }, 0);

function crNovoChefe() {
  const btn = document.querySelectorAll(".criar-tipo-btn")[1];
  trocarTipoCriar("boss", btn);
}

function crEdSet(campo, valor) {
  const c = window._crEd.c;
  if (campo === "hpMax" || campo === "ca") valor = parseInt(valor) || 0;
  if (campo === "_tipo") {
    if (valor) c._tipo = "boss";
    else delete c._tipo;
    return;
  }
  c[campo] = valor;
}
function crEdAtr(a, v) {
  window._crEd.c.status[a] = parseInt(v) || 10;
}
function crEdLista(lista, i, campo, v) {
  const L = lista === "lendarias" ? window._crEd.c.blocos.lendarias.acoes : window._crEd.c.blocos[lista];
  if (L[i]) L[i][campo] = v;
}
function crEdAdicionar(lista) {
  const b = window._crEd.c.blocos;
  if (lista === "ataques") b.ataques.push({ nome: "", acerto: null, dano: "", desc: "" });
  if (lista === "habilidades") b.habilidades.push({ nome: "", desc: "", uso: "", usosMax: 1, recarga: 5 });
  if (lista === "reacoes") b.reacoes.push({ nome: "", desc: "" });
  if (lista === "lendarias") b.lendarias.acoes.push({ nome: "", custo: 1, desc: "" });
  crRenderEditor();
}
function crEdRemover(lista, i) {
  const L = lista === "lendarias" ? window._crEd.c.blocos.lendarias.acoes : window._crEd.c.blocos[lista];
  L.splice(i, 1);
  crRenderEditor();
}
function crEdAdicionarFase() {
  const c = window._crEd.c;
  c.fases.push({ id: Date.now(), nome: `Fase ${c.fases.length + 2}`, gatilho: c.fases.length ? "" : 50, ca: "", velocidade: "", status: {}, perde: [], ganhaAtaques: [], ganhaHabilidades: [], fala: "" });
  crRenderEditor();
}
function crEdRemoverFase(i) {
  window._crEd.c.fases.splice(i, 1);
  crRenderEditor();
}
function crEdFase(i, campo, v) {
  const f = window._crEd.c.fases[i];
  if (f) f[campo] = v;
}
function crEdFaseAtr(i, a, v) {
  const f = window._crEd.c.fases[i];
  if (!f) return;
  f.status = f.status || {};
  if (v === "") delete f.status[a];
  else f.status[a] = parseInt(v);
}
function crEdFasePerde(i, nome) {
  const f = window._crEd.c.fases[i];
  const s = new Set(f.perde || []);
  if (s.has(nome)) s.delete(nome);
  else s.add(nome);
  f.perde = [...s];
  crRenderEditor();
}
async function crEdFaseGanho(i, tipo) {
  const nome = await promptBonito(tipo === "ataque" ? "Nome do ataque novo:" : "Nome da habilidade nova:", "");
  if (!nome || !nome.trim()) return;
  const f = window._crEd.c.fases[i];
  if (tipo === "ataque") {
    const ac = await promptBonito("Bônus de acerto (ex: 7). Deixe vazio se não rola acerto:", "");
    const dano = await promptBonito("Dano (ex: 3d8 fogo). Pode deixar vazio:", "");
    f.ganhaAtaques = f.ganhaAtaques || [];
    f.ganhaAtaques.push({ nome: nome.trim(), acerto: ac === "" || ac == null || isNaN(parseInt(ac)) ? null : parseInt(ac), dano: (dano || "").trim(), desc: "" });
  } else {
    const desc = await promptBonito("O que ela faz:", "");
    f.ganhaHabilidades = f.ganhaHabilidades || [];
    f.ganhaHabilidades.push({ nome: nome.trim(), desc: (desc || "").trim(), uso: "", usosMax: 0, recarga: 0 });
  }
  crRenderEditor();
}
function crEdFaseRemGanho(i, campo, k) {
  window._crEd.c.fases[i][campo].splice(k, 1);
  crRenderEditor();
}
function crEdImagem(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    window._crEd.imgNova = r.result;
    const p = input.closest(".cr-ed-img-prev") || (crEdHost() || document).querySelector("#crImgPrev");
    if (p) { p.style.backgroundImage = `url('${r.result}')`; const sp = p.querySelector("span"); if (sp) sp.remove(); }
  };
  r.readAsDataURL(f);
}

async function crSalvarEditor(comoNovo) {
  const ed = window._crEd;
  if (!ed) return;
  const c = JSON.parse(JSON.stringify(ed.c));
  if (!(c.nome || "").trim()) return alertBonito("Coloque um nome.");
  c.nome = c.nome.trim();
  c.blocos.ataques = c.blocos.ataques.filter((a) => (a.nome || "").trim());
  c.blocos.habilidades = c.blocos.habilidades.filter((h) => (h.nome || "").trim());
  c.blocos.reacoes = c.blocos.reacoes.filter((r) => (r.nome || "").trim());
  c.blocos.lendarias.acoes = c.blocos.lendarias.acoes.filter((r) => (r.nome || "").trim());
  c.fases = (c.fases || []).filter((f) => (f.nome || "").trim());
  const btn = (crEdHost() || document).querySelector("#crSalvar");
  if (btn) { btn.disabled = true; const sp = btn.querySelector("span"); if (sp) sp.textContent = "Salvando..."; }

  if (ed.imgNova) {
    const up = await uploadImagemFirebase(ed.imgNova, "monstro");
    if (up.url) {
      c.imagem = up.url;
      c.imagemDeleteUrl = up.deleteUrl || "";
    } else alertBonito(_mensagemErroUpload("A criatura foi salva sem a imagem nova."));
  }
  crGerarTextos(c);
  c.hpAtual = c.hpMax;
  delete c._ataques; delete c._habilidades; delete c._faseNome;

  if (comoNovo) {
    c.id = Date.now();
    c.origem = "usuario";
    monstrosMestre.push(c);
  } else {
    const idx = monstrosMestre.findIndex((m) => String(m.id) === String(ed.origId));
    if (idx === -1) monstrosMestre.push(c);
    else monstrosMestre[idx] = c;
  }
  salvarMonstrosMestreStorage();
  renderMonstrosMestre();
  if (ed.alvo) {
    delete window._crRascunhos[ed.tipoCriar];
    crIniciarCriar(ed.tipoCriar);
  } else {
    window._crEd = null;
    fecharPopup();
  }
  crAbrirFicha(c);
  if (typeof mostrarToastMundo === "function") mostrarToastMundo(comoNovo ? "Cópia salva no compêndio" : "Criatura salva");
}

/* =====================================================================
   COMBATE: fases, ataques que rolam, usos, recarga e lendárias
   ===================================================================== */
function crHpCor(p) {
  return p > 0.5 ? "linear-gradient(90deg,#8e2a33,#b8434b)" : p > 0.25 ? "linear-gradient(90deg,#9a6a22,#c99a3e)" : "linear-gradient(90deg,#5e1219,#8f2222)";
}
function crHpEstado(p) {
  return p > 0.5 ? "bem" : p > 0.25 ? "ferido" : "critico";
}

/* topo dos cards de combate e dos NPCs do mundo */
function crTopoCardHTML(o) {
  const pct = Math.max(0, Math.min(1, o.pct || 0));
  const estado = o.morto ? "morto" : crHpEstado(pct);
  const img = o.img
    ? `style="background-image:url('${escapeHtml(o.img)}')"`
    : `style="background:${o.corFundo || "var(--gi-ivory-3)"}"`;
  return `
    <div class="cr-cc-topo" onclick="${o.toggle}">
      <div class="cr-cc-retrato">
        <div class="cr-cc-img ${o.redonda ? "redonda" : ""}" ${img}>${o.morto ? `<span class="cr-cc-caveira">💀</span>` : o.img ? "" : `<span class="cr-iniciais">${escapeHtml(o.iniciais || "?")}</span>`}</div>
        <em class="cr-cc-escudo" title="Classe de armadura"><b>${o.ca || 0}</b></em>
      </div>
      <div class="cr-cc-info">
        <div class="cr-cc-linha">
          <strong>${escapeHtml(o.nome || "")}</strong>
          <span class="cr-cc-hpnum est-${estado}">${o.morto ? "Caiu" : `${o.atual}<small>/${o.max}</small>`}</span>
        </div>
        <small class="cr-cc-sub">${o.sub || ""}</small>
        <button type="button" class="cr-cc-vida est-${estado}" onclick="event.stopPropagation(); ${o.vida}" title="Toque pra atalhos de dano e cura" aria-label="Vida ${o.atual} de ${o.max}">
          <i style="width:${Math.round(pct * 100)}%;background:${crHpCor(pct)}"></i>
        </button>
        ${o.extra || ""}
      </div>
      <span class="cr-cc-seta ${o.aberto ? "aberto" : ""}" aria-hidden="true"></span>
    </div>`;
}

window._crAba = window._crAba || {};
window._crRapido = window._crRapido || {};

var CR_CONDICOES = ["Caído", "Atordoado", "Envenenado", "Amedrontado", "Agarrado", "Cego", "Paralisado", "Invisível", "Enfeitiçado", "Concentrando"];

function crChaveInst(inst, i) {
  return String(inst.instanciaId || i);
}

function renderCombatesMestre() {
  const lista = document.getElementById("listaCombateMestre");
  if (!lista) return;
  lista.innerHTML = "";
  if (!combatesMestre.length) {
    lista.innerHTML = `<div class="cr-cc-vazio"><span>⚔️</span><p>Nenhum inimigo no combate.</p><small>Abra uma criatura no compêndio e toque em <b>Enviar para combate</b>.</small></div>`;
    return;
  }

  // grupos de inimigos iguais (ex: Lobo ×3)
  const porBase = {};
  combatesMestre.forEach((m, i) => {
    const k = String(m.monstroBaseId || m.id || m.nome);
    (porBase[k] = porBase[k] || []).push(i);
  });
  const jaMostrouGrupo = new Set();

  combatesMestre.forEach((inst, index) => {
    const baseK = String(inst.monstroBaseId || inst.id || inst.nome);
    const grupo = porBase[baseK];
    if (grupo.length > 1 && !jaMostrouGrupo.has(baseK)) {
      jaMostrouGrupo.add(baseK);
      const nomeBase = (inst.nome || "").replace(/\s+\d+$/, "");
      const cab = document.createElement("div");
      cab.className = "cr-grupo";
      cab.innerHTML = `<div class="cr-grupo-topo"><strong>${escapeHtml(nomeBase)}</strong><span>×${grupo.length}</span></div>
        <div class="cr-grupo-barras">${grupo
          .map((gi) => {
            const g = combatesMestre[gi];
            const p = g.hpMax ? Math.max(0, Math.min(1, g.hpAtual / g.hpMax)) : 0;
            return `<button type="button" class="cr-grupo-barra ${p <= 0 ? "morto" : ""}" onclick="document.getElementById('crCard${gi}')?.scrollIntoView({behavior:'smooth',block:'center'})" title="${escapeHtml(g.nome)}"><i style="width:${Math.round(p * 100)}%;background:${crHpCor(p)}"></i></button>`;
          })
          .join("")}</div>`;
      lista.appendChild(cab);
    }

    const fase = inst.faseAtual || 0;
    const c = crEfetivo(inst, fase);
    const max = inst.hpMax || 0;
    const pct = max ? Math.max(0, Math.min(1, inst.hpAtual / max)) : 0;
    const morto = max > 0 && inst.hpAtual <= 0;
    const chave = crChaveInst(inst, index);
    const aba = window._crAba[chave] || "acoes";
    const rapido = !!window._crRapido[chave];
    const fases = c.fases || [];
    const conds = inst.condicoes || [];

    const card = document.createElement("div");
    card.id = `crCard${index}`;
    card.className = `combate-card cr-cc ${inst.minimizado ? "minimizado" : ""} ${crEhChefe(c) ? "cr-chefe" : ""} ${morto ? "cr-morto" : ""}`;

    const atrs = CR_ATR.map((a) => `<button type="button" class="cr-cc-atr" onclick="crRolarAtributo(${index},'${a}')"><small>${a.toUpperCase()}</small><b>${crFmt(crMod(c.status[a]))}</b></button>`).join("");

    const nAcoes = c._ataques.length + c.blocos.reacoes.length + (c.blocos.lendarias.acoes.length ? 1 : 0);
    const nHabs = c._habilidades.length;
    const nDef = c.resistTags.length + c.imunTags.length + c.vulnTags.length + (c.fraquezas ? 1 : 0);
    const nLog = (inst.log || []).length;
    const abas = [
      ["acoes", "Ações", nAcoes],
      ["habs", "Habilidades", nHabs],
      ["def", "Defesas", nDef],
      ["log", "Log", nLog],
    ];
    let conteudoAba = "";
    if (aba === "acoes") {
      conteudoAba = crListaAtaquesHTML(c._ataques, index) + crListaSimplesHTML("Reações", c.blocos.reacoes) + crLendariasHTML(c, index);
      if (!conteudoAba) conteudoAba = `<p class="cr-cc-nada">Sem ataques cadastrados.</p>`;
    } else if (aba === "habs") {
      conteudoAba = crListaHabilidadesHTML(c._habilidades, index) + (c.mecanicas ? crBloco("Mecânicas", formatarTexto(c.mecanicas)) : "") || `<p class="cr-cc-nada">Sem habilidades.</p>`;
    } else if (aba === "def") {
      conteudoAba = crTagsHTML(c) + (c.fraquezas ? crBloco("Fraquezas", formatarTexto(c.fraquezas)) : "") || `<p class="cr-cc-nada">Sem defesas cadastradas.</p>`;
    } else {
      conteudoAba = nLog
        ? `<div class="combate-log">${inst.log.map((e) => `<div class="combate-log-item combate-log-${e.tipo}"><span class="combate-log-hora">${e.hora}</span><span>${e.texto}</span></div>`).join("")}</div>`
        : `<p class="cr-cc-nada">Nada aconteceu ainda.</p>`;
    }

    card.innerHTML = `
      ${crTopoCardHTML({
        img: c.imagem || "icon-192.png", nome: inst.nome, ca: c.ca, atual: inst.hpAtual, max, pct, morto, aberto: !inst.minimizado,
        sub: `${escapeHtml(c.tipo || "Criatura")}${c._faseNome ? ` · <b class="cr-cc-fase">🔥 ${escapeHtml(c._faseNome)}</b>` : ""}`,
        toggle: `toggleMinimizarCombate(${index})`, vida: `crAlternarRapido(${index})`,
      })}

      ${conds.length ? `<div class="cr-cc-conds">${conds.map((cd, k) => `<button type="button" class="cr-cond" onclick="crRemoverCondicao(${index}, ${k})" title="Tirar">${escapeHtml(cd.nome)}${cd.rodadas ? ` <small>${cd.rodadas}r</small>` : ""} ×</button>`).join("")}</div>` : ""}

      <div class="cr-cc-detalhes">
        ${rapido ? `<div class="cr-cc-rapido">${[-10, -5, -1].map((v) => `<button type="button" class="dano" onclick="alterarHpCombate(${index}, ${v})">${v}</button>`).join("")}${[1, 5, 10].map((v) => `<button type="button" class="cura" onclick="alterarHpCombate(${index}, ${v})">+${v}</button>`).join("")}</div>` : ""}
        <div class="cr-cc-hp">
          <input id="crHp${index}" type="number" min="0" inputmode="numeric" placeholder="Valor" onkeydown="if(event.key==='Enter') crAplicarHp(${index}, -1)">
          <button type="button" class="dano" onclick="crAplicarHp(${index}, -1)">🩸 Dano</button>
          <button type="button" class="cura" onclick="crAplicarHp(${index}, 1)">💚 Cura</button>
        </div>

        ${crEhChefe(c) && fases.length ? `<div class="cr-fases-bar">${["Base", ...fases.map((f) => f.nome || "Fase")].map((n, i) => `<button type="button" class="cr-fase-chip ${i === fase ? "on" : ""}" onclick="crMudarFase(${index}, ${i})">${escapeHtml(n)}${i && fases[i - 1].gatilho ? `<small>${parseInt(fases[i - 1].gatilho)}%</small>` : ""}</button>`).join("")}</div>` : ""}

        <div class="cr-cc-atrs">${atrs}</div>

        <div class="cr-cc-abas">${abas.map(([id, rot, n]) => `<button type="button" class="${aba === id ? "on" : ""}" onclick="crTrocarAba(${index}, '${id}')">${rot}${n ? `<small>${n}</small>` : ""}</button>`).join("")}</div>
        <div class="cr-cc-aba">${conteudoAba}</div>

        <div class="cr-cc-rodape">
          ${morto ? "" : `<button type="button" onclick="crFimTurno(${index})">⏭ Fim do turno</button>
          <button type="button" onclick="crAbrirCondicao(${index})">+ Condição</button>`}
          <button type="button" class="perigo" onclick="removerDoCombate(${index})">${morto ? "🗑 Remover" : "Remover"}</button>
        </div>
      </div>`;
    lista.appendChild(card);
  });
}

function toggleMinimizarCombate(index) {
  const inst = combatesMestre[index];
  if (!inst) return;
  inst.minimizado = !inst.minimizado;
  salvarCombatesMestreStorage();
  renderCombatesMestre();
}

function crTrocarAba(index, aba) {
  const inst = combatesMestre[index];
  if (!inst) return;
  window._crAba[crChaveInst(inst, index)] = aba;
  renderCombatesMestre();
}

function crAlternarRapido(index) {
  const inst = combatesMestre[index];
  if (!inst) return;
  const k = crChaveInst(inst, index);
  window._crRapido[k] = !window._crRapido[k];
  if (inst.minimizado) inst.minimizado = false;
  renderCombatesMestre();
}

function crAplicarHp(index, sinal) {
  const el = document.getElementById(`crHp${index}`);
  const v = parseInt(el?.value) || 0;
  if (v <= 0) return el?.focus();
  alterarHpCombate(index, sinal * v);
}

function crAbrirCondicao(index) {
  const html = `
    <div class="popup-form">
      <div class="cr-cond-opcoes">${CR_CONDICOES.map((n) => `<button type="button" class="cr-cond-op" onclick="document.getElementById('crCondNome').value='${n}'; this.parentElement.querySelectorAll('.cr-cond-op').forEach(b=>b.classList.toggle('on', b===this))">${n}</button>`).join("")}</div>
      <label class="popup-label">Ou escreva</label>
      <input id="crCondNome" placeholder="Ex: Em chamas">
      <label class="popup-label">Dura quantas rodadas? <small>(vazio = até tirar)</small></label>
      <input id="crCondRodadas" type="number" min="1" placeholder="—">
      <button type="button" class="inv-add-btn btn-adicionar" style="width:100%;margin-top:12px" onclick="crSalvarCondicao(${index})"><span>Adicionar</span></button>
    </div>`;
  abrirPopup("Condição", html, true, null);
}
function crSalvarCondicao(index) {
  const inst = combatesMestre[index];
  const nome = (document.getElementById("crCondNome")?.value || "").trim();
  if (!inst || !nome) return;
  const rodadas = parseInt(document.getElementById("crCondRodadas")?.value) || 0;
  inst.condicoes = inst.condicoes || [];
  inst.condicoes.push({ nome, rodadas });
  crLog(inst, "acao", `${inst.nome} ficou ${nome}${rodadas ? ` (${rodadas} rodada${rodadas > 1 ? "s" : ""})` : ""}`);
  fecharPopup();
  salvarCombatesMestreStorage();
  renderCombatesMestre();
}
function crRemoverCondicao(index, k) {
  const inst = combatesMestre[index];
  if (!inst || !inst.condicoes) return;
  const [cd] = inst.condicoes.splice(k, 1);
  if (cd) crLog(inst, "acao", `${inst.nome} não está mais ${cd.nome}`);
  salvarCombatesMestreStorage();
  renderCombatesMestre();
}
function crFimTurno(index) {
  const inst = combatesMestre[index];
  if (!inst) return;
  inst.lendGastas = 0;
  const acabaram = [];
  inst.condicoes = (inst.condicoes || []).filter((cd) => {
    if (!cd.rodadas) return true;
    cd.rodadas -= 1;
    if (cd.rodadas <= 0) { acabaram.push(cd.nome); return false; }
    return true;
  });
  crLog(inst, "acao", `Fim do turno de ${inst.nome}${acabaram.length ? ` · acabou: ${acabaram.join(", ")}` : ""}`);
  salvarCombatesMestreStorage();
  renderCombatesMestre();
  if (typeof mostrarToastMundo === "function") mostrarToastMundo(`Turno de ${inst.nome} encerrado`);
}

function crLog(inst, tipo, texto) {
  inst.log = inst.log || [];
  inst.log.unshift({ tipo, texto: escapeHtml(texto), hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) });
  if (inst.log.length > 20) inst.log.pop();
}

function crMudarFase(index, novaFase, semFala) {
  const inst = combatesMestre[index];
  if (!inst) return;
  const fases = crNormalizar(inst).fases || [];
  novaFase = Math.max(0, Math.min(fases.length, novaFase));
  if ((inst.faseAtual || 0) === novaFase) return;
  inst.faseAtual = novaFase;
  inst.fasesOferecidas = inst.fasesOferecidas || [];
  if (!inst.fasesOferecidas.includes(novaFase)) inst.fasesOferecidas.push(novaFase);
  const nome = novaFase ? fases[novaFase - 1].nome : "Base";
  crLog(inst, "fase", `${inst.nome} entrou na fase: ${nome}`);
  salvarCombatesMestreStorage();
  renderCombatesMestre();
  const f = novaFase ? fases[novaFase - 1] : null;
  if (f && f.fala && !semFala) {
    abrirPopup(
      `${inst.nome} · ${f.nome}`,
      `<div class="cr-fala-popup">${f.imagem ? `<img src="${escapeHtml(f.imagem)}" alt="">` : ""}<p>“${escapeHtml(f.fala)}”</p><small>Leia em voz alta pros jogadores.</small></div>`,
      true,
      null,
    );
  }
}

// quando a vida cruza o gatilho de uma fase, pergunta se quer ativar
(function () {
  if (typeof alterarHpCombate !== "function" || alterarHpCombate._cr) return;
  const orig = alterarHpCombate;
  alterarHpCombate = async function (index, valor) {
    const out = orig.apply(this, arguments);
    const inst = combatesMestre[index];
    if (!inst || !crEhChefe(inst) || !(valor < 0)) return out;
    const fases = crNormalizar(inst).fases || [];
    const pct = inst.hpMax ? (inst.hpAtual / inst.hpMax) * 100 : 100;
    inst.fasesOferecidas = inst.fasesOferecidas || [];
    for (let i = fases.length; i >= 1; i--) {
      const g = parseInt(fases[i - 1].gatilho);
      if (!g || pct > g || i <= (inst.faseAtual || 0) || inst.fasesOferecidas.includes(i)) continue;
      inst.fasesOferecidas.push(i);
      salvarCombatesMestreStorage();
      const sim = await confirmBonito(`${inst.nome} chegou a ${Math.round(pct)}% de vida. Ativar a fase "${fases[i - 1].nome}"?`);
      if (sim) crMudarFase(index, i);
      break;
    }
    return out;
  };
  alterarHpCombate._cr = true;
  window.alterarHpCombate = alterarHpCombate;
})();

function crUsarHabilidade(index, nome, delta) {
  const inst = combatesMestre[index];
  if (!inst) return;
  const c = crEfetivo(inst, inst.faseAtual || 0);
  const h = c._habilidades.find((x) => x.nome === nome);
  if (!h) return;
  inst.usosGastos = inst.usosGastos || {};
  const atual = inst.usosGastos[nome] || 0;
  inst.usosGastos[nome] = Math.max(0, Math.min(h.usosMax, atual + delta));
  if (delta > 0) crLog(inst, "acao", `${inst.nome} usou ${nome} (${h.usosMax - inst.usosGastos[nome]} restante${h.usosMax - inst.usosGastos[nome] === 1 ? "" : "s"})`);
  salvarCombatesMestreStorage();
  renderCombatesMestre();
}
function crUsarRecarga(index, nome) {
  const inst = combatesMestre[index];
  if (!inst) return;
  inst.recargaGasta = inst.recargaGasta || {};
  inst.recargaGasta[nome] = true;
  crLog(inst, "acao", `${inst.nome} usou ${nome}`);
  salvarCombatesMestreStorage();
  renderCombatesMestre();
}
function crRolarRecarga(index, nome, alvo) {
  const inst = combatesMestre[index];
  if (!inst) return;
  const r = Math.floor(Math.random() * 6) + 1;
  const voltou = r >= alvo;
  if (voltou) inst.recargaGasta[nome] = false;
  crLog(inst, "acao", `Recarga de ${nome}: ${r} — ${voltou ? "voltou!" : "ainda não"}`);
  salvarCombatesMestreStorage();
  renderCombatesMestre();
  if (typeof mostrarToastMundo === "function") mostrarToastMundo(`🎲 ${r} · ${nome} ${voltou ? "recarregou" : "não recarregou"}`);
}
function crGastarLend(index, custo) {
  const inst = combatesMestre[index];
  if (!inst) return;
  const max = parseInt(crNormalizar(inst).blocos.lendarias.max) || 3;
  if (max - (inst.lendGastas || 0) < custo) return mostrarToastMundo ? mostrarToastMundo("Sem ações lendárias sobrando nessa rodada") : null;
  inst.lendGastas = (inst.lendGastas || 0) + custo;
  salvarCombatesMestreStorage();
  renderCombatesMestre();
}
function crNovoTurnoLend(index) {
  const inst = combatesMestre[index];
  if (!inst) return;
  inst.lendGastas = 0;
  salvarCombatesMestreStorage();
  renderCombatesMestre();
}

/* =====================================================================
   NPC, ITEM e ENCONTRO no mesmo estilo das criaturas
   (editor em blocos, fichas em pergaminho e lista de NPCs do Mundo)
   ===================================================================== */
var CR_RELACOES = { aliado: ["🤝", "Aliado"], neutro: ["⚖️", "Neutro"], inimigo: ["⚔️", "Inimigo"] };
var CR_RARIDADES = { comum: "Comum", incomum: "Incomum", raro: "Raro", muitoraro: "Muito raro", lendario: "Lendário" };
var CR_DIFICULDADES = { facil: "Fácil", medio: "Médio", dificil: "Difícil", lendario: "Lendário" };
var CR_CATEGORIAS = { inventario: ["🎒", "Item diverso"], armas: ["⚔️", "Arma"], armaduras: ["🛡️", "Armadura"] };

function crTodosCompendio() {
  return [
    ...(typeof compendioPadrao !== "undefined" ? compendioPadrao : []),
    ...(typeof bossesPadrao !== "undefined" ? bossesPadrao : []),
    ...(typeof npcsPadrao !== "undefined" ? npcsPadrao : []),
    ...(typeof itensPadrao !== "undefined" ? itensPadrao : []),
    ...(monstrosMestre || []),
  ];
}
function crAcharPorId(id) {
  return crTodosCompendio().find((x) => String(x.id) === String(id));
}

/* ---------- normalizar por tipo ---------- */
function crNormalizarNpc(n) {
  const base = { ...n };
  if (!base.ataques && base.acoes) base.ataques = base.acoes;
  const c = crNormalizar(base);
  c._tipo = "npc";
  c.relacao = c.relacao || "neutro";
  if (c.hpMax == null) c.hpMax = c.hp || 20;
  return c;
}
function crNormalizarItem(i) {
  const c = JSON.parse(JSON.stringify(i || {}));
  c._tipo = "item";
  c.categoria = c.categoria || (/(arma)$/i.test(c.tipo || "") ? "armas" : /armadura/i.test(c.tipo || "") ? "armaduras" : "inventario");
  c.raridade = CR_RARIDADES[c.raridade] ? c.raridade : String(c.raridade || "").toLowerCase().replace(/\s+/g, "") in CR_RARIDADES ? String(c.raridade).toLowerCase().replace(/\s+/g, "") : "comum";
  if (c.sintonia !== "sim" && /sim/i.test(c.sintonizacao || "")) c.sintonia = "sim";
  c.sintonia = c.sintonia === "sim" ? "sim" : "nao";
  c.classificacao = c.classificacao === "artefato" ? "artefato" : "normal";
  if (/^(padrao|usuario)$/i.test(c.origem || "")) c.origem = "";
  return c;
}
function crNormalizarEncontro(e) {
  const c = JSON.parse(JSON.stringify(e || {}));
  c._tipo = "encontro";
  const d = String(c.dificuldade || "").toLowerCase().replace("á", "a").replace("é", "e").replace("í", "i");
  c.dificuldade = CR_DIFICULDADES[d] ? d : d.startsWith("fac") ? "facil" : d.startsWith("med") ? "medio" : d.startsWith("dif") ? "dificil" : d.startsWith("len") ? "lendario" : "";
  c.criaturas = Array.isArray(c.criaturas) ? c.criaturas : [];
  return c;
}

/* ---------- abrir o editor certo ---------- */
function crAbrirEditorTipo(tipoEd, modo, entrada, alvo) {
  const norm = tipoEd === "npc" ? crNormalizarNpc : tipoEd === "item" ? crNormalizarItem : crNormalizarEncontro;
  const c = norm(entrada || {});
  if (modo === "copia") {
    const minha = crEhMinha(entrada || {});
    if (minha) c.nome = `${c.nome} (cópia)`;
  }
  window._crEd = { tipoEd, modo, c, imgNova: "", origId: entrada?.id ?? null, alvo: alvo || null, abertos: {} };
  crRenderEditor();
}

// o crRenderEditor das criaturas passa a perguntar o tipo
(function () {
  const orig = crRenderEditor;
  crRenderEditor = function () {
    const ed = window._crEd;
    if (ed && ed.tipoEd === "npc") return crRenderEditorNpc();
    if (ed && ed.tipoEd === "item") return crRenderEditorItem();
    if (ed && ed.tipoEd === "encontro") return crRenderEditorEncontro();
    return orig.apply(this, arguments);
  };
  window.crRenderEditor = crRenderEditor;
  const origSalvar = crSalvarEditor;
  crSalvarEditor = function (comoNovo) {
    const ed = window._crEd;
    if (ed && ed.tipoEd === "npc") return crSalvarNpc(comoNovo);
    if (ed && ed.tipoEd === "item") return crSalvarItem(comoNovo);
    if (ed && ed.tipoEd === "encontro") return crSalvarEncontro(comoNovo);
    return origSalvar.apply(this, arguments);
  };
  window.crSalvarEditor = crSalvarEditor;
})();

function crMontarEditor(atalhos, secoes, rodapeTexto, titulo) {
  const ed = window._crEd;
  const html = `
    <div class="cr-editor ${ed.alvo ? "cr-inline" : ""}">
      ${ed.modo === "copia" ? `<p class="cr-dica">Você está editando uma <b>cópia</b>. O original fica do jeito que está.</p>` : ""}
      <div class="cr-ed-atalhos">${atalhos.map(([id, rot]) => `<button type="button" onclick="crIrSecao('${id}', this)">${rot}</button>`).join("")}</div>
      ${secoes.join("")}
      <div class="cr-ed-rodape">
        ${ed.modo === "editar"
          ? `<button type="button" class="cr-ed-salvar" id="crSalvar" onclick="crSalvarEditor(false)"><span>Salvar</span></button>
             <button type="button" class="cr-ed-salvar-outro" onclick="crSalvarEditor(true)">Salvar como outro</button>`
          : `<button type="button" class="cr-ed-salvar" id="crSalvar" onclick="crSalvarEditor(true)"><span>${rodapeTexto}</span></button>`}
      </div>
    </div>`;
  if (ed.alvo) {
    const host = document.getElementById(ed.alvo);
    if (host) host.innerHTML = html;
    return;
  }
  const popupTexto = document.getElementById("popup-texto");
  const aberto = document.getElementById("popup")?.style.display === "flex";
  if (aberto && popupTexto && popupTexto.querySelector(".cr-editor")) {
    const box = popupTexto.closest(".popup-content, .popup-box");
    const s1 = popupTexto.scrollTop, s2 = box ? box.scrollTop : 0;
    popupTexto.innerHTML = html;
    popupTexto.scrollTop = s1;
    if (box) box.scrollTop = s2;
  } else {
    abrirPopup(titulo, html, true, null);
  }
}

function crImgCampo(c, rotulo) {
  return `
    <label class="cr-ed-img-prev" id="crImgPrev" style="${c.imagem ? `background-image:url('${escapeHtml(c.imagem)}')` : ""}" title="Trocar imagem">
      ${c.imagem ? "" : `<span>📷<small>${rotulo || "Imagem"}</small></span>`}
      <input type="file" accept="image/*" style="display:none" onchange="crEdImagem(this)">
    </label>`;
}
function crTexto(rot, campo, val, ph) {
  return `<label class="cr-ed-campo"><span>${rot}</span><textarea placeholder="${ph || ""}" oninput="crEdSet('${campo}', this.value)">${escapeHtml(val || "")}</textarea></label>`;
}
function crEscolhas(campo, opcoes, atual, extraClasse) {
  return `<div class="cr-escolhas ${extraClasse || ""}">${Object.entries(opcoes)
    .map(([k, v]) => {
      const [ic, rot] = Array.isArray(v) ? v : ["", v];
      return `<button type="button" class="cr-escolha ${k === atual ? "on" : ""} op-${k}" onclick="crEdSet('${campo}', '${k}'); crRenderEditor()">${ic ? `<i>${ic}</i>` : ""}${rot}</button>`;
    })
    .join("")}</div>`;
}

/* ---------- NPC ---------- */
function crRenderEditorNpc() {
  const ed = window._crEd;
  const c = ed.c;
  const nAcoes = c.blocos.ataques.length + c.blocos.habilidades.length + c.blocos.reacoes.length;
  const nDef = c.resistTags.length + c.imunTags.length + c.vulnTags.length;
  // reaproveita os pedaços do editor das criaturas
  const linhaAtk = (a, i) => `
    <div class="cr-ed-item">
      <div class="cr-ed-item-topo">
        <input class="cr-ed-nome" value="${escapeHtml(a.nome || "")}" placeholder="Nome (ex: Adaga)" oninput="crEdLista('ataques', ${i}, 'nome', this.value)">
        <button type="button" class="cr-ed-x" onclick="crEdRemover('ataques', ${i})">✕</button>
      </div>
      <div class="cr-ed-duplo">
        <label class="cr-ed-campo"><span>🎯 Acerto</span><input type="number" value="${a.acerto == null ? "" : escapeHtml(String(a.acerto))}" placeholder="ex: 4" oninput="crEdLista('ataques', ${i}, 'acerto', this.value === '' ? null : parseInt(this.value))"></label>
        <label class="cr-ed-campo"><span>🩸 Dano</span><input value="${escapeHtml(a.dano || "")}" placeholder="ex: 1d4+2 perfurante" oninput="crEdLista('ataques', ${i}, 'dano', this.value)"></label>
      </div>
      <input value="${escapeHtml(a.desc || "")}" placeholder="Detalhes" oninput="crEdLista('ataques', ${i}, 'desc', this.value)">
    </div>`;
  const linhaTxt = (lista, ph) => (r, i) => `
    <div class="cr-ed-item">
      <div class="cr-ed-item-topo">
        <input class="cr-ed-nome" value="${escapeHtml(r.nome || "")}" placeholder="${ph}" oninput="crEdLista('${lista}', ${i}, 'nome', this.value)">
        <button type="button" class="cr-ed-x" onclick="crEdRemover('${lista}', ${i})">✕</button>
      </div>
      <textarea placeholder="O que faz" oninput="crEdLista('${lista}', ${i}, 'desc', this.value)">${escapeHtml(r.desc || "")}</textarea>
    </div>`;

  const secoes = [
    crSecao("ident", "🧙 Identidade", `
      <div class="cr-ed-ident">
        ${crImgCampo(c, "Retrato")}
        <div class="cr-ed-ident-campos">
          ${crCampo("Nome", "nome", c.nome, 'placeholder="Ex: Mirela, a ferreira"')}
          <div class="cr-ed-duplo">${crCampo("Raça", "raca", c.raca)}${crCampo("Classe / profissão", "classe", c.classe)}</div>
        </div>
      </div>
      <div class="cr-ed-sub">Relação com o grupo</div>
      ${crEscolhas("relacao", CR_RELACOES, c.relacao, "rel")}`, true),
    crSecao("persona", "🎭 Personalidade", `
      ${crTexto("Personalidade", "personalidade", c.personalidade, "Bordão, trejeitos, voz, jeito de falar")}
      ${crTexto("Relações", "relacoes", c.relacoes, "Com quem se dá bem, quem odeia")}
      ${crTexto("🔒 Segredo (só o mestre vê)", "segredo", c.segredo, "O que esconde dos jogadores")}
      ${crTexto("Observações do mestre", "observacoes", c.observacoes)}`, true),
    crSecao("combate", "⚔️ Combate", `
      <div class="cr-ed-triplo">
        ${crCampo("❤️ HP", "hpMax", c.hpMax, 'type="number" min="0"')}
        ${crCampo("🛡️ CA", "ca", c.ca, 'type="number" min="0"')}
        ${crCampo("👣 Deslocamento", "velocidade", c.velocidade, 'placeholder="9 m"')}
      </div>
      ${crCampo("Nível de desafio", "desafio", c.desafio, 'placeholder="Ex: 2"')}
      <div class="cr-ed-sub">Atributos</div>
      <div class="cr-ed-atrs">${CR_ATR.map((a) => `<label><span>${a.toUpperCase()}</span><input type="number" value="${c.status[a]}" oninput="crEdAtr('${a}', this.value); this.nextElementSibling.textContent = crFmt(crMod(this.value))"><small>${crFmt(crMod(c.status[a]))}</small></label>`).join("")}</div>
      ${crTexto("Perícias", "pericias", c.pericias, "Ex: Persuasão +5, Enganação +3")}`, false),
    crSecao("acoes", `🎯 O que ele faz${nAcoes ? ` <small>${nAcoes}</small>` : ""}`, `
      <div class="cr-ed-sub grande">⚔️ Ataques</div>
      ${c.blocos.ataques.map(linhaAtk).join("")}
      <button type="button" class="cr-ed-add" onclick="crEdAdicionar('ataques')">+ Adicionar ataque</button>
      <div class="cr-ed-sub grande">✨ Habilidades</div>
      ${c.blocos.habilidades.map(linhaTxt("habilidades", "Nome (ex: Lábia)")).join("")}
      <button type="button" class="cr-ed-add" onclick="crEdAdicionar('habilidades')">+ Adicionar habilidade</button>
      <div class="cr-ed-sub grande">🛡️ Reações</div>
      ${c.blocos.reacoes.map(linhaTxt("reacoes", "Nome (ex: Aparar)")).join("")}
      <button type="button" class="cr-ed-add" onclick="crEdAdicionar('reacoes')">+ Adicionar reação</button>`, false),
    crSecao("defesas", `🛡️ Defesas${nDef ? ` <small>${nDef}</small>` : ""}`, `
      ${crTagsCampo("Resiste", "resistTags", "Ex: fogo (Enter pra adicionar)")}
      ${crTagsCampo("Imune", "imunTags", "Ex: veneno")}
      ${crTagsCampo("Vulnerável", "vulnTags", "Ex: radiante")}
      ${crTexto("Fraquezas", "fraquezas", c.fraquezas)}`, false),
    crSecao("onde", "📍 Onde encontrar", `
      <div class="cr-ed-duplo">${crCampo("Região", "regiao", c.regiao)}${crCampo("Localização", "localizacao", c.localizacao)}</div>
      <div class="cr-ed-duplo">${crCampo("Idade", "idade", c.idade)}${crCampo("Religião", "religiao", c.religiao)}</div>`, false),
  ];
  crMontarEditor(
    [["ident", "Identidade"], ["persona", "Personalidade"], ["combate", "Combate"], ["acoes", `Ações${nAcoes ? ` ${nAcoes}` : ""}`], ["defesas", "Defesas"], ["onde", "Onde"]],
    secoes,
    "⚡ Criar NPC",
    ed.modo === "editar" ? `Editar ${c.nome || "NPC"}` : ed.modo === "copia" ? "Editar cópia" : "Novo NPC",
  );
}

/* ---------- ITEM ---------- */
function crRenderEditorItem() {
  const ed = window._crEd;
  const c = ed.c;
  const secoes = [
    crSecao("ident", "🗡️ Identidade", `
      <div class="cr-ed-ident">
        ${crImgCampo(c, "Imagem")}
        <div class="cr-ed-ident-campos">
          ${crCampo("Nome", "nome", c.nome, 'placeholder="Ex: Lâmina do Crepúsculo"')}
          ${crCampo("Tipo", "tipo", c.tipo, 'placeholder="Ex: espada longa, anel, poção"')}
        </div>
      </div>
      <div class="cr-ed-sub">Vai pra qual parte da ficha do jogador</div>
      ${crEscolhas("categoria", CR_CATEGORIAS, c.categoria)}
      ${c.categoria === "armas" ? crCampo("🩸 Dano", "dano", c.dano, 'placeholder="Ex: 1d8+2 cortante"') : ""}
      ${c.categoria === "armaduras" ? crCampo("🛡️ CA", "ca", c.ca, 'placeholder="Ex: 16"') : ""}`, true),
    crSecao("raridade", "✨ Raridade e poder", `
      ${crEscolhas("raridade", CR_RARIDADES, c.raridade, "rar")}
      <div class="toggle-cargas cr-ed-chefe">
        <span class="toggle-cargas-texto">🔱 Artefato <small>(único, lendário de verdade)</small></span>
        <label class="switch-cargas"><input type="checkbox" ${c.classificacao === "artefato" ? "checked" : ""} onchange="crEdSet('classificacao', this.checked ? 'artefato' : 'normal')"><span class="slider-cargas"></span></label>
      </div>
      <div class="toggle-cargas cr-ed-chefe">
        <span class="toggle-cargas-texto">🔗 Requer sintonização</span>
        <label class="switch-cargas"><input type="checkbox" ${c.sintonia === "sim" ? "checked" : ""} onchange="crEdSet('sintonia', this.checked ? 'sim' : 'nao')"><span class="slider-cargas"></span></label>
      </div>
      ${crTexto("Efeito / habilidade", "efeito", c.efeito, "O que ele faz quando usado ou equipado")}`, true),
    crSecao("historia", "📜 Descrição e história", `
      ${crTexto("Aparência", "descricao", c.descricao, "Como ele é, cheiro, peso, brilho")}
      ${crTexto("História", "historia", c.historia, "Quem fez, por quê, quem já carregou")}
      ${crTexto("Onde encontrar", "origem", c.origem, "Ex: no cofre do Barão")}`, false),
  ];
  crMontarEditor(
    [["ident", "Identidade"], ["raridade", "Raridade"], ["historia", "História"]],
    secoes,
    "⚡ Criar item",
    ed.modo === "editar" ? `Editar ${c.nome || "item"}` : ed.modo === "copia" ? "Editar cópia" : "Novo item",
  );
}

/* ---------- ENCONTRO ---------- */
function crRenderEditorEncontro() {
  const ed = window._crEd;
  const c = ed.c;
  const criaturas = c.criaturas || [];
  const secoes = [
    crSecao("ident", "🗺️ Identidade", `
      <div class="cr-ed-ident">
        ${crImgCampo(c, "Cena")}
        <div class="cr-ed-ident-campos">
          ${crCampo("Nome", "nome", c.nome, 'placeholder="Ex: Emboscada na estrada"')}
          <div class="cr-ed-duplo">${crCampo("Região", "regiao", c.regiao)}${crCampo("Localização", "localizacao", c.localizacao)}</div>
        </div>
      </div>
      <div class="cr-ed-sub">Dificuldade</div>
      ${crEscolhas("dificuldade", CR_DIFICULDADES, c.dificuldade, "dif")}`, true),
    crSecao("quem", `👥 Quem está lá${criaturas.length ? ` <small>${criaturas.reduce((s, x) => s + (x.qtd || 1), 0)}</small>` : ""}`, `
      <div class="cr-ed-sub">Criaturas do compêndio <small>(vão pro combate com um toque)</small></div>
      ${criaturas.length ? criaturas.map((x, i) => `
        <div class="cr-ed-criatura">
          <span class="cr-ed-criatura-nome">${escapeHtml(x.nome)}</span>
          <div class="cr-ed-qtd">
            <button type="button" onclick="crEncQtd(${i}, -1)">−</button><b>${x.qtd || 1}</b><button type="button" onclick="crEncQtd(${i}, 1)">+</button>
          </div>
          <button type="button" class="cr-ed-x" onclick="crEncQtd(${i}, -999)">✕</button>
        </div>`).join("") : ""}
      <button type="button" class="cr-ed-add" onclick="crEncEscolherCriatura()">+ Adicionar criatura do compêndio</button>
      ${crTexto("Outros envolvidos", "envolvidos", c.envolvidos, "NPCs, facções, quem mais aparece")}`, true),
    crSecao("cena", "🎬 A cena", `
      ${crTexto("Objetivo", "objetivo", c.objetivo, "O que os jogadores precisam fazer")}
      ${crTexto("Gatilho", "gatilho", c.gatilho, "O que faz o encontro começar")}
      ${crTexto("Clima / ambiente", "ambiente", c.ambiente, "Luz, terreno, sons, cheiros")}`, false),
    crSecao("fim", "🏁 Desfecho", `
      ${crTexto("Consequências", "consequencias", c.consequencias, "O que muda se ganharem, perderem ou fugirem")}
      ${crTexto("Loot / recompensa", "loot", c.loot)}
      ${crTexto("Anotações do mestre", "notas", c.notas)}`, false),
  ];
  crMontarEditor(
    [["ident", "Identidade"], ["quem", "Quem"], ["cena", "Cena"], ["fim", "Desfecho"]],
    secoes,
    "⚡ Criar encontro",
    ed.modo === "editar" ? `Editar ${c.nome || "encontro"}` : "Novo encontro",
  );
}

function crEncQtd(i, d) {
  const L = window._crEd.c.criaturas;
  if (!L[i]) return;
  L[i].qtd = (L[i].qtd || 1) + d;
  if (L[i].qtd <= 0) L.splice(i, 1);
  crRenderEditor();
}

function crEncEscolherCriatura() {
  const ed = window._crEd;
  const lista = crTodosCompendio().filter((x) => !x._tipo || x._tipo === "boss" || x._tipo === "npc");
  window._crEncPicker = { ed };
  const html = `
    <div class="popup-form">
      <input id="crEncBusca" placeholder="🔍 Buscar criatura" oninput="crEncFiltrar(this.value)">
      <div class="cr-enc-lista" id="crEncLista">
        ${lista
          .map((x) => `<button type="button" class="cr-enc-op" data-nome="${escapeHtml((x.nome || "").toLowerCase())}" onclick="crEncAdicionar('${escapeHtml(String(x.id))}')">
            <span class="cr-enc-img" style="${x.imagem ? `background-image:url('${escapeHtml(x.imagem)}')` : ""}"></span>
            <span class="cr-enc-txt"><strong>${escapeHtml(x.nome || "")}</strong><small>${x._tipo === "boss" ? "💀 Chefe" : x._tipo === "npc" ? "🧙 NPC" : "👹 Criatura"} · HP ${x.hpMax || "?"} · CA ${x.ca || "?"}</small></span>
          </button>`)
          .join("")}
      </div>
    </div>`;
  // guarda o editor (o popup vai ser trocado pela lista)
  window._crEncVoltar = JSON.parse(JSON.stringify({ ...ed, c: ed.c }));
  abrirPopup("Escolher criatura", html, true, null);
}
function crEncFiltrar(t) {
  t = (t || "").toLowerCase();
  document.querySelectorAll("#crEncLista .cr-enc-op").forEach((b) => (b.style.display = b.dataset.nome.includes(t) ? "" : "none"));
}
function crEncAdicionar(id) {
  const x = crAcharPorId(id);
  const voltar = window._crEncPicker?.ed || window._crEd;
  if (!x || !voltar) return;
  const L = (voltar.c.criaturas = voltar.c.criaturas || []);
  const j = L.find((y) => String(y.id) === String(id));
  if (j) j.qtd = (j.qtd || 1) + 1;
  else L.push({ id: x.id, nome: x.nome, qtd: 1 });
  window._crEd = voltar;
  fecharPopup();
  setTimeout(() => crRenderEditor(), 30);
}

/* ---------- salvar ---------- */
async function crSubirImagemEd(c) {
  const ed = window._crEd;
  if (!ed.imgNova) return;
  const up = await uploadImagemFirebase(ed.imgNova, "compendio");
  if (up.url) {
    c.imagem = up.url;
    c.imagemDeleteUrl = up.deleteUrl || "";
  } else alertBonito(_mensagemErroUpload("Foi salvo sem a imagem nova."));
}
function crTravarSalvar() {
  const btn = (crEdHost() || document).querySelector("#crSalvar");
  if (btn) { btn.disabled = true; const sp = btn.querySelector("span"); if (sp) sp.textContent = "Salvando..."; }
}
function crDepoisDeSalvar(c, abrirFicha) {
  const ed = window._crEd;
  if (ed.alvo) {
    delete window._crRascunhos[ed.tipoCriar];
    crIniciarCriar(ed.tipoCriar);
  } else {
    window._crEd = null;
    fecharPopup();
  }
  if (abrirFicha) abrirFicha(c);
}
function crGuardarNoCompendio(c, comoNovo, origId) {
  if (comoNovo) {
    c.id = Date.now();
    c._origem = "usuario";
    if (c._tipo !== "item") c.origem = "usuario";
    monstrosMestre.push(c);
  } else {
    const idx = monstrosMestre.findIndex((m) => String(m.id) === String(origId));
    if (idx === -1) monstrosMestre.push(c);
    else monstrosMestre[idx] = c;
  }
  salvarMonstrosMestreStorage();
  renderMonstrosMestre();
}

async function crSalvarNpc(comoNovo) {
  const ed = window._crEd;
  const c = JSON.parse(JSON.stringify(ed.c));
  if (!(c.nome || "").trim()) return alertBonito("Coloque um nome.");
  c.nome = c.nome.trim();
  ["ataques", "habilidades", "reacoes"].forEach((k) => (c.blocos[k] = c.blocos[k].filter((x) => (x.nome || "").trim())));
  crTravarSalvar();
  await crSubirImagemEd(c);
  crGerarTextos(c);
  c.acoes = c.ataques;
  c._tipo = "npc";
  c.hpAtual = c.hpMax;
  crGuardarNoCompendio(c, comoNovo, ed.origId);
  crDepoisDeSalvar(c, crAbrirFichaNpc);
  if (typeof mostrarToastMundo === "function") mostrarToastMundo(comoNovo ? "NPC salvo no compêndio" : "NPC atualizado");
}

async function crSalvarItem(comoNovo) {
  const ed = window._crEd;
  const c = JSON.parse(JSON.stringify(ed.c));
  if (!(c.nome || "").trim()) return alertBonito("Coloque um nome.");
  c.nome = c.nome.trim();
  crTravarSalvar();
  await crSubirImagemEd(c);
  c._tipo = "item";
  crGuardarNoCompendio(c, comoNovo, ed.origId);
  crDepoisDeSalvar(c, crAbrirFichaItem);
  if (typeof mostrarToastMundo === "function") mostrarToastMundo(comoNovo ? "Item salvo no compêndio" : "Item atualizado");
}

async function crSalvarEncontro(comoNovo) {
  const ed = window._crEd;
  const c = JSON.parse(JSON.stringify(ed.c));
  if (!(c.nome || "").trim()) return alertBonito("Coloque um nome.");
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return alertBonito("Abra uma campanha primeiro.");
  c.nome = c.nome.trim();
  crTravarSalvar();
  await crSubirImagemEd(c);
  delete c._tipo;
  campanha.encontrosPlanejados ||= [];
  if (comoNovo || ed.origId == null) {
    c.id = Date.now();
    campanha.encontrosPlanejados.push(c);
  } else {
    const idx = campanha.encontrosPlanejados.findIndex((x) => String(x.id) === String(ed.origId));
    if (idx === -1) campanha.encontrosPlanejados.push(c);
    else campanha.encontrosPlanejados[idx] = c;
  }
  salvarCampanhasMaster();
  if (typeof renderEncontrosMundo === "function") renderEncontrosMundo();
  crDepoisDeSalvar(c, crAbrirFichaEncontro);
  if (typeof mostrarToastMundo === "function") mostrarToastMundo(comoNovo ? "Encontro criado" : "Encontro atualizado");
}

/* ---------- aba Criar: NPC, Item e Encontro também usam o editor ---------- */
(function () {
  const origIni = crIniciarCriar;
  crIniciarCriar = function (tipo) {
    if (tipo !== "npc" && tipo !== "item" && tipo !== "encontro") return origIni.apply(this, arguments);
    const hostId = "crCriarHost-" + tipo;
    const host = document.getElementById(hostId);
    if (!host) return;
    let ed = window._crRascunhos[tipo];
    if (!ed) {
      const norm = tipo === "npc" ? crNormalizarNpc : tipo === "item" ? crNormalizarItem : crNormalizarEncontro;
      ed = { tipoEd: tipo, modo: "novo", c: norm(tipo === "npc" ? { hpMax: 20, ca: 10 } : {}), imgNova: "", origId: null, alvo: hostId, tipoCriar: tipo, abertos: {} };
      window._crRascunhos[tipo] = ed;
    }
    window._crEd = ed;
    crRenderEditor();
    host.onfocusin = host.onpointerdown = () => { window._crEd = window._crRascunhos[tipo]; };
  };
  window.crIniciarCriar = crIniciarCriar;
  const origTroca = trocarTipoCriar;
  trocarTipoCriar = function (tipo, btn) {
    const r = origTroca.apply(this, arguments);
    if (tipo === "npc" || tipo === "item" || tipo === "encontro") crIniciarCriar(tipo);
    return r;
  };
  window.trocarTipoCriar = trocarTipoCriar;
})();
setTimeout(() => { try { ["encontro", "item", "npc"].forEach((t) => crIniciarCriar(t)); crIniciarCriar("monstro"); } catch (e) { console.warn(e); } }, 0);

/* =====================================================================
   FICHAS
   ===================================================================== */
function crRelTag(rel) {
  const r = CR_RELACOES[rel] || CR_RELACOES.neutro;
  return `<span class="cr-rel cr-rel-${rel || "neutro"}">${r[0]} ${r[1]}</span>`;
}

function crAbrirFichaNpc(entry) {
  const c = crNormalizarNpc(entry);
  window._crFichaAtual = c;
  window._entradaSessaoAtual = entry;
  const minha = crEhMinha(entry);
  const st = c.status;
  const txt = (v) => formatarTexto(v);
  const conteudo = `
    ${c.imagem ? `<img class="sheet-img" src="${escapeHtml(c.imagem)}" alt="" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px;margin-bottom:12px;">` : ""}
    <h2 class="sheet-titulo" style="text-align:center;margin-bottom:4px;">${escapeHtml(c.nome || "Sem nome")}</h2>
    <div class="sheet-meta" style="text-align:center;margin-bottom:8px;">${[c.raca, c.classe].filter(Boolean).map(escapeHtml).join(" · ") || "NPC"}</div>
    <div style="text-align:center;margin-bottom:10px;">${crRelTag(c.relacao)}</div>
    <div class="cr-selos">
      <span><i>❤️</i><b>${c.hpMax || 0}</b><small>HP</small></span>
      <span><i>🛡️</i><b>${c.ca || 0}</b><small>CA</small></span>
      ${c.velocidade ? `<span><i>👣</i><b>${escapeHtml(c.velocidade)}</b><small>Desloc.</small></span>` : ""}
      ${c.desafio ? `<span><i>⭐</i><b>${escapeHtml(String(c.desafio))}</b><small>ND</small></span>` : ""}
    </div>
    <div class="cr-cc-atrs cr-ficha-atrs">${CR_ATR.map((a) => `<button type="button" class="cr-cc-atr" onclick="crRolarAtributo('ficha','${a}')"><small>${a.toUpperCase()}</small><b>${crFmt(crMod(st[a]))}</b><em>${st[a]}</em></button>`).join("")}</div>
    <div class="cr-acoes-ficha">
      <div class="cr-acoes-linha">
        <button type="button" class="cr-btn-combate" onclick="adicionarNPCAoMundo()">🌍 Adicionar ao Mundo</button>
        <button type="button" class="cr-btn-combate escuro" onclick="crEnviarCombate()">⚔️ Combate</button>
      </div>
      <div class="cr-acoes-linha">
        <button type="button" class="cr-btn-sec" onclick="crAbrirEditorTipo('npc', '${minha ? "editar" : "copia"}', window._entradaSessaoAtual)">✏️ ${minha ? "Editar" : "Editar uma cópia"}</button>
        ${minha ? `<button type="button" class="cr-btn-sec" onclick="crAbrirEditorTipo('npc', 'copia', window._entradaSessaoAtual)">📄 Duplicar</button>` : ""}
      </div>
    </div>
    ${c.personalidade ? crBloco("Personalidade", txt(c.personalidade)) : ""}
    ${c.relacoes ? crBloco("Relações", txt(c.relacoes)) : ""}
    ${c.segredo ? crBloco("🔒 Segredo", txt(c.segredo)) : ""}
    ${c.pericias ? crBloco("Perícias", txt(c.pericias)) : ""}
    ${crListaAtaquesHTML(c.blocos.ataques, "'ficha'")}
    ${crListaHabilidadesHTML(c.blocos.habilidades, null)}
    ${crListaSimplesHTML("Reações", c.blocos.reacoes)}
    ${crTagsHTML(c)}
    ${c.fraquezas ? crBloco("Fraquezas", txt(c.fraquezas)) : ""}
    ${c.observacoes ? crBloco("Observações", txt(c.observacoes)) : ""}
    ${c.regiao || c.localizacao || c.idade || c.religiao ? crBloco("Pontos de encontro", [c.regiao && `<b>Região:</b> ${escapeHtml(c.regiao)}`, c.localizacao && `<b>Local:</b> ${escapeHtml(c.localizacao)}`, c.idade && `<b>Idade:</b> ${escapeHtml(c.idade)}`, c.religiao && `<b>Religião:</b> ${escapeHtml(c.religiao)}`].filter(Boolean).join("<br>")) : ""}
    ${minha ? `<button type="button" class="cr-btn-excluir" onclick="crExcluir()">🗑️ Excluir NPC</button>` : ""}`;
  _abrirSheetCustom(conteudo);
}

function crRaridadeTag(r) {
  return `<span class="cr-rar cr-rar-${r || "comum"}">${CR_RARIDADES[r] || "Comum"}</span>`;
}

function crAbrirFichaItem(entry) {
  const c = crNormalizarItem(entry);
  window._crFichaAtual = c;
  window._entradaSessaoAtual = entry;
  const minha = crEhMinha(entry);
  const cat = CR_CATEGORIAS[c.categoria] || CR_CATEGORIAS.inventario;
  const conteudo = `
    ${c.imagem ? `<img class="sheet-img" src="${escapeHtml(c.imagem)}" alt="" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px;margin-bottom:12px;">` : ""}
    <h2 class="sheet-titulo" style="text-align:center;margin-bottom:4px;">${escapeHtml(c.nome || "Sem nome")}</h2>
    <div class="sheet-meta" style="text-align:center;margin-bottom:8px;">${[cat[0] + " " + cat[1], c.tipo].filter(Boolean).map(escapeHtml).join(" · ")}</div>
    <div class="cr-item-tags">
      ${crRaridadeTag(c.raridade)}
      ${c.classificacao === "artefato" ? `<span class="cr-rar cr-rar-artefato">🔱 Artefato</span>` : ""}
      ${c.sintonia === "sim" ? `<span class="cr-rar cr-rar-sint">🔗 Sintonização</span>` : ""}
    </div>
    ${c.categoria === "armas" && c.dano ? `<div class="cr-selos"><span><i>🩸</i><b>${escapeHtml(c.dano)}</b><small>Dano</small></span></div>` : ""}
    ${c.categoria === "armaduras" && c.ca ? `<div class="cr-selos"><span><i>🛡️</i><b>${escapeHtml(String(c.ca))}</b><small>CA</small></span></div>` : ""}
    <div class="cr-acoes-ficha">
      <button type="button" class="cr-btn-ouro" onclick="window.abrirDarItemMestre('${escapeHtml(String(c.id))}')">🎁 Dar pra jogador</button>
      <div class="cr-acoes-linha">
        <button type="button" class="cr-btn-sec" onclick="crAbrirEditorTipo('item', '${minha ? "editar" : "copia"}', window._entradaSessaoAtual)">✏️ ${minha ? "Editar" : "Editar uma cópia"}</button>
        ${minha ? `<button type="button" class="cr-btn-sec" onclick="crAbrirEditorTipo('item', 'copia', window._entradaSessaoAtual)">📄 Duplicar</button>` : ""}
      </div>
    </div>
    ${c.efeito ? crBloco("✨ Efeito", formatarTexto(c.efeito)) : ""}
    ${c.descricao ? crBloco("Aparência", formatarTexto(c.descricao)) : ""}
    ${c.historia ? crBloco("📜 História", formatarTexto(c.historia)) : ""}
    ${c.origem && !/^(padrao|usuario)$/i.test(c.origem) ? crBloco("📍 Onde encontrar", formatarTexto(c.origem)) : ""}
    ${minha ? `<button type="button" class="cr-btn-excluir" onclick="crExcluir()">🗑️ Excluir item</button>` : ""}`;
  _abrirSheetCustom(conteudo);
}

function crDifTag(d) {
  return d ? `<span class="cr-dif cr-dif-${d}">${CR_DIFICULDADES[d]}</span>` : "";
}

function crAbrirFichaEncontro(entry) {
  const c = crNormalizarEncontro(entry);
  window._crEncontroAtual = c;
  const daCampanha = (campanhasMaster[campanhaAtualMaster]?.encontrosPlanejados || []).some((x) => String(x.id) === String(c.id));
  const total = c.criaturas.reduce((s, x) => s + (x.qtd || 1), 0);
  const txt = (v) => formatarTexto(v);
  const conteudo = `
    ${c.imagem ? `<img class="sheet-img" src="${escapeHtml(c.imagem)}" alt="" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px;margin-bottom:12px;">` : ""}
    <h2 class="sheet-titulo" style="text-align:center;margin-bottom:4px;">${escapeHtml(c.nome || "Encontro")}</h2>
    <div class="sheet-meta" style="text-align:center;margin-bottom:8px;">${[c.regiao, c.localizacao].filter(Boolean).map(escapeHtml).join(" · ") || "🗺️ Encontro"}</div>
    <div class="cr-item-tags">${crDifTag(c.dificuldade)}${total ? `<span class="cr-rar">👥 ${total} criatura${total > 1 ? "s" : ""}</span>` : ""}</div>
    <div class="cr-acoes-ficha">
      ${total ? `<button type="button" class="cr-btn-combate" onclick="crEncontroParaCombate()">⚔️ Mandar tudo pro combate</button>` : ""}
      ${daCampanha ? `<div class="cr-acoes-linha">
        <button type="button" class="cr-btn-sec" onclick="crAbrirEditorTipo('encontro', 'editar', window._crEncontroAtual)">✏️ Editar</button>
        <button type="button" class="cr-btn-sec" onclick="crRemoverEncontro()">🗑️ Remover</button>
      </div>` : ""}
    </div>
    ${total ? crBloco("👥 Criaturas", c.criaturas.map((x) => `<div class="cr-linha"><div class="cr-linha-txt"><strong>${escapeHtml(x.nome)}</strong></div><span class="cr-uso">×${x.qtd || 1}</span></div>`).join("")) : ""}
    ${c.envolvidos ? crBloco("Envolvidos", txt(c.envolvidos)) : ""}
    ${c.objetivo ? crBloco("🎯 Objetivo", txt(c.objetivo)) : ""}
    ${c.gatilho ? crBloco("⚡ Gatilho", txt(c.gatilho)) : ""}
    ${c.ambiente ? crBloco("🌫️ Ambiente", txt(c.ambiente)) : ""}
    ${c.consequencias ? crBloco("🏁 Consequências", txt(c.consequencias)) : ""}
    ${c.loot ? crBloco("💰 Loot", txt(c.loot)) : ""}
    ${c.notas ? crBloco("📝 Notas do mestre", txt(c.notas)) : ""}`;
  _abrirSheetCustom(conteudo);
}

function crEncontroParaCombate() {
  const c = window._crEncontroAtual;
  if (!c) return;
  let n = 0;
  c.criaturas.forEach((x) => {
    const base = crAcharPorId(x.id);
    if (!base) return;
    for (let k = 0; k < (x.qtd || 1); k++) {
      window._crFichaAtual = base._tipo === "npc" ? crNormalizarNpc(base) : crNormalizar(base);
      const copia = JSON.parse(JSON.stringify(window._crFichaAtual));
      copia.instanciaId = Date.now() + Math.floor(Math.random() * 99999) + k;
      copia.monstroBaseId = base.id;
      copia.origem = "combate";
      copia.nome = gerarNomeInstanciaCombate(base.nome);
      copia.hpAtual = copia.hpMax || 0;
      copia.faseAtual = 0; copia.usosGastos = {}; copia.recargaGasta = {}; copia.lendGastas = 0; copia.fasesOferecidas = [];
      combatesMestre.push(copia);
      n++;
    }
  });
  salvarCombatesMestreStorage();
  renderCombatesMestre();
  fecharSheetMonstro();
  if (typeof mostrarToastMundo === "function") mostrarToastMundo(`${n} no combate · ${c.nome}`);
}

async function crRemoverEncontro() {
  const c = window._crEncontroAtual;
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!c || !campanha || !(await confirmBonito(`Remover "${c.nome}"?`))) return;
  campanha.encontrosPlanejados = (campanha.encontrosPlanejados || []).filter((x) => String(x.id) !== String(c.id));
  salvarCampanhasMaster();
  renderEncontrosMundo();
  fecharSheetMonstro();
}

// as fichas antigas abrem as novas
function _abrirPopupNPCCompendio(npc) { crAbrirFichaNpc(npc); }
function _abrirPopupItemCompendio(item) { crAbrirFichaItem(item); }
function _abrirPopupEncontroCompendio(e) { crAbrirFichaEncontro(e); }
function abrirDetalheEncontro(id) {
  const e = campanhasMaster[campanhaAtualMaster]?.encontrosPlanejados?.find((x) => String(x.id) === String(id));
  if (e) crAbrirFichaEncontro(e);
}
function editarEncontroMundo(id) {
  const e = campanhasMaster[campanhaAtualMaster]?.encontrosPlanejados?.find((x) => String(x.id) === String(id));
  if (e) crAbrirEditorTipo("encontro", "editar", e);
}
function editarItemMestre(id) {
  const it = monstrosMestre.find((m) => String(m.id) === String(id) && m._tipo === "item");
  if (it) { fecharSheetMonstro(); crAbrirEditorTipo("item", "editar", it); }
}

/* =====================================================================
   LISTA DE ENCONTROS (aba Mundo)
   ===================================================================== */
function renderEncontrosMundo() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const lista = document.getElementById("mundoEncontroLista");
  if (!lista || !campanha) return;
  campanha.encontrosPlanejados ||= [];
  if (!campanha.encontrosPlanejados.length) {
    lista.innerHTML = `<div class="cr-cc-vazio"><span>🗺️</span><p>Nenhum encontro planejado.</p><small>Crie um em <b>Criar → Encontro</b>.</small></div>`;
    return;
  }
  lista.innerHTML = campanha.encontrosPlanejados
    .map((e0) => {
      const e = crNormalizarEncontro(e0);
      const total = e.criaturas.reduce((s, x) => s + (x.qtd || 1), 0);
      const resumo = e.objetivo || e.envolvidos || "";
      return `
      <div class="cr-enc-card" onclick="abrirDetalheEncontro(${JSON.stringify(e.id)})">
        <div class="cr-enc-card-img" style="${e.imagem ? `background-image:url('${escapeHtml(e.imagem)}')` : ""}">${e.imagem ? "" : "🗺️"}</div>
        <div class="cr-enc-card-info">
          <strong>${escapeHtml(e.nome)}</strong>
          <div class="cr-enc-card-tags">${crDifTag(e.dificuldade)}${e.regiao ? `<span class="cr-rar">📍 ${escapeHtml(e.regiao)}</span>` : ""}${total ? `<span class="cr-rar">👥 ${total}</span>` : ""}</div>
          ${resumo ? `<p>${escapeHtml(resumo.slice(0, 90))}${resumo.length > 90 ? "…" : ""}</p>` : ""}
        </div>
      </div>`;
    })
    .join("");
}

/* =====================================================================
   LISTA DE NPCs (aba Mundo) no estilo do combate
   ===================================================================== */
window._crNpcAberto = window._crNpcAberto || {};
window._crNpcAba = window._crNpcAba || {};
window._crNpcRapido = window._crNpcRapido || {};

function crNpcMundoDados(n) {
  const d = crNormalizarNpc({ ...(n.dadosCompletos || {}), nome: n.nome, imagem: n.imagem || n.dadosCompletos?.imagem, relacao: n.relacao || n.dadosCompletos?.relacao });
  d.hpMax = n.hpMax || d.hpMax || 20;
  return d;
}

function renderNPCsMundo() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  const lista = document.getElementById("mundoNPCLista");
  if (!lista || !campanha) return;
  campanha.npcsMundo ||= [];
  if (!campanha.npcsMundo.length) {
    lista.innerHTML = `<div class="cr-cc-vazio"><span>🧙</span><p>Nenhum NPC no mundo ainda.</p><small>Abra um NPC no compêndio e toque em <b>Adicionar ao Mundo</b>.</small></div>`;
    return;
  }
  lista.innerHTML = campanha.npcsMundo
    .map((n) => {
      const d = crNpcMundoDados(n);
      const max = d.hpMax;
      const atual = n.hpAtual !== undefined ? n.hpAtual : max;
      const pct = max ? Math.max(0, Math.min(1, atual / max)) : 0;
      const id = JSON.stringify(n.id);
      const aberto = !!window._crNpcAberto[n.id];
      const aba = window._crNpcAba[n.id] || "sobre";
      const rapido = !!window._crNpcRapido[n.id];
      const iniciais = (n.nome || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
      const sobre = [
        d.personalidade || n.desc ? crBloco("Personalidade", formatarTexto(d.personalidade || n.desc)) : "",
        d.relacoes ? crBloco("Relações", formatarTexto(d.relacoes)) : "",
        d.segredo ? crBloco("🔒 Segredo", formatarTexto(d.segredo)) : "",
        d.observacoes ? crBloco("Observações", formatarTexto(d.observacoes)) : "",
        d.pericias ? crBloco("Perícias", formatarTexto(d.pericias)) : "",
      ].join("");
      const combate = crListaAtaquesHTML(d.blocos.ataques, `'npc:${n.id}'`) + crListaHabilidadesHTML(d.blocos.habilidades, null) + crListaSimplesHTML("Reações", d.blocos.reacoes);
      const defesas = crTagsHTML(d) + (d.fraquezas ? crBloco("Fraquezas", formatarTexto(d.fraquezas)) : "");
      const conteudo = aba === "sobre" ? sobre || `<p class="cr-cc-nada">Sem anotações.</p>` : aba === "combate" ? combate || `<p class="cr-cc-nada">Sem ataques ou habilidades.</p>` : defesas || `<p class="cr-cc-nada">Sem defesas.</p>`;
      return `
      <div class="combate-card cr-cc cr-npc-card cr-rel-borda-${d.relacao} ${aberto ? "" : "minimizado"}" id="npcMundo_${n.id}">
        ${crTopoCardHTML({
          img: d.imagem || "", corFundo: _corAvatar(n.nome), iniciais, redonda: true, nome: n.nome, ca: d.ca, atual, max, pct, morto: false, aberto,
          sub: [d.classe, n.regiao || d.regiao].filter(Boolean).map(escapeHtml).join(" · ") || "NPC",
          extra: "", toggle: `crNpcAbrir(${id})`, vida: `crNpcRapido(${id})`,
        }).replace('<small class="cr-cc-sub">', `<small class="cr-cc-sub">${crRelTag(d.relacao)} `)}
        <div class="cr-cc-detalhes">
          ${rapido ? `<div class="cr-cc-rapido">${[-10, -5, -1].map((v) => `<button type="button" class="dano" onclick="crNpcHp(${id}, ${v})">${v}</button>`).join("")}${[1, 5, 10].map((v) => `<button type="button" class="cura" onclick="crNpcHp(${id}, ${v})">+${v}</button>`).join("")}</div>` : ""}
          <div class="cr-cc-hp">
            <input id="crNpcHp_${n.id}" type="number" min="0" placeholder="Valor" onkeydown="if(event.key==='Enter') crNpcHpCampo(${id}, -1)">
            <button type="button" class="dano" onclick="crNpcHpCampo(${id}, -1)">🩸 Dano</button>
            <button type="button" class="cura" onclick="crNpcHpCampo(${id}, 1)">💚 Cura</button>
          </div>
          <div class="cr-cc-atrs">${CR_ATR.map((a) => `<button type="button" class="cr-cc-atr" onclick="crNpcRolarAtr(${id}, '${a}')"><small>${a.toUpperCase()}</small><b>${crFmt(crMod(d.status[a]))}</b></button>`).join("")}</div>
          <div class="cr-cc-abas tres">
            ${[["sobre", "Sobre"], ["combate", "Combate"], ["def", "Defesas"]].map(([k, r]) => `<button type="button" class="${aba === k ? "on" : ""}" onclick="crNpcAba(${id}, '${k}')">${r}</button>`).join("")}
          </div>
          <div class="cr-cc-aba">${conteudo}</div>
          <div class="cr-cc-rodape">
            <button type="button" onclick="enviarNPCParaCombate(${id})">⚔️ Combate</button>
            <button type="button" onclick="crNpcFicha(${id})">📖 Ficha</button>
            <button type="button" class="perigo" onclick="deletarNPCMundo(${id})">Remover</button>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

function crNpcAchar(id) {
  return campanhasMaster[campanhaAtualMaster]?.npcsMundo?.find((x) => String(x.id) === String(id));
}
function crNpcAbrir(id) {
  window._crNpcAberto[id] = !window._crNpcAberto[id];
  renderNPCsMundo();
}
function toggleNPCMundo(id) { crNpcAbrir(id); }
function crNpcAba(id, aba) {
  window._crNpcAba[id] = aba;
  renderNPCsMundo();
}
function crNpcRapido(id) {
  window._crNpcRapido[id] = !window._crNpcRapido[id];
  window._crNpcAberto[id] = true;
  renderNPCsMundo();
}
function crNpcHp(id, delta) {
  const n = crNpcAchar(id);
  if (!n) return;
  const max = n.hpMax || n.dadosCompletos?.hpMax || 20;
  const atual = n.hpAtual !== undefined ? n.hpAtual : max;
  n.hpAtual = Math.max(0, Math.min(max, atual + delta));
  salvarCampanhasMaster();
  renderNPCsMundo();
}
function alterarHpNPC(id, delta) { crNpcHp(id, delta); }
function crNpcHpCampo(id, sinal) {
  const el = document.getElementById(`crNpcHp_${id}`);
  const v = parseInt(el?.value) || 0;
  if (v <= 0) return el?.focus();
  crNpcHp(id, sinal * v);
}
function crNpcRolarAtr(id, atr) {
  const n = crNpcAchar(id);
  if (!n) return;
  const d = crNpcMundoDados(n);
  rolarD20(`${atr.toUpperCase()} · ${n.nome}`, crMod(d.status[atr]));
}
function crNpcFicha(id) {
  const n = crNpcAchar(id);
  if (!n) return;
  crAbrirFichaNpc({ ...(n.dadosCompletos || {}), nome: n.nome, imagem: n.imagem || n.dadosCompletos?.imagem });
}
// rolagens dos ataques do NPC do mundo
(function () {
  const orig = crFonte;
  crFonte = function (ctx) {
    if (typeof ctx === "string" && ctx.startsWith("npc:")) {
      const n = crNpcAchar(ctx.slice(4));
      return n ? crEfetivo(crNpcMundoDados(n), 0) : null;
    }
    return orig.apply(this, arguments);
  };
})();

// NPC do mundo vai pro combate com ataques e habilidades em blocos
function enviarNPCParaCombate(id) {
  const n = crNpcAchar(id);
  if (!n) return;
  const d = crNpcMundoDados(n);
  const copia = JSON.parse(JSON.stringify(d));
  copia.instanciaId = Date.now() + Math.floor(Math.random() * 9999);
  copia.monstroBaseId = n.id;
  copia.origem = "npc_mundo";
  copia.nome = n.nome || "NPC";
  copia.tipo = d.classe || d.raca || "NPC";
  copia.hpAtual = n.hpAtual !== undefined ? n.hpAtual : d.hpMax;
  copia.faseAtual = 0; copia.usosGastos = {}; copia.recargaGasta = {}; copia.lendGastas = 0; copia.fasesOferecidas = [];
  delete copia._tipo;
  combatesMestre.push(copia);
  salvarCombatesMestreStorage();
  renderCombatesMestre();
  if (typeof mostrarToastMundo === "function") mostrarToastMundo(`${copia.nome} entrou no combate`);
}

/* =====================================================================
   FICHA DO JOGADOR VISTA PELO MESTRE (card flutuante) — layout novo
   ===================================================================== */
window._ffAba = window._ffAba || "poderes";
window._ffAbertos = window._ffAbertos || {};

function _ffPill(texto, tipo) {
  return `<span class="ff-pill ${tipo || ""}">${escapeHtml(String(texto))}</span>`;
}
function _ffCargas(item) {
  if (!item.temCargas) return "";
  const gastas = (item.cargasGastas || []).filter(Boolean).length;
  const max = item.maxCargas || 0;
  return _ffPill(`${max - gastas}/${max}`, max - gastas === 0 ? "vazio" : "cargas");
}
function _ffLinha(chave, nome, extra, pills, desc) {
  const aberto = !!window._ffAbertos[chave];
  return `
    <div class="ff-linha ${desc ? "tem-desc" : ""} ${aberto ? "aberta" : ""}" ${desc ? `onclick="window._ffAlternar(this, '${escapeHtml(chave).replace(/'/g, "")}')"` : ""}>
      <div class="ff-linha-topo">
        <strong>${escapeHtml(nome || "Sem nome")}</strong>
        <span class="ff-linha-pills">${pills || ""}</span>
      </div>
      ${extra ? `<div class="ff-linha-extra">${extra}</div>` : ""}
      ${desc ? `<p>${escapeHtml(desc)}</p>` : ""}
    </div>`;
}
window._ffAlternar = function (el, chave) {
  window._ffAbertos[chave] = !window._ffAbertos[chave];
  el.classList.toggle("aberta", !!window._ffAbertos[chave]);
};
function _ffGrupo(titulo, conteudo, extraTopo) {
  if (!conteudo) return "";
  return `<div class="ff-grupo"><div class="ff-grupo-tit"><span>${titulo}</span>${extraTopo || ""}</div>${conteudo}</div>`;
}
function _ffBolinhas(arr, cls) {
  return `<span class="ff-bolinhas">${(arr || []).map((m) => `<i class="${m ? "on" : ""} ${cls || ""}"></i>`).join("")}</span>`;
}

window._renderFichaFlutuanteConteudo = function (m, f) {
  const vidaMax = parseInt(f.vidaMax) || 1;
  const vidaAtual = f.vidaAtual ?? vidaMax;
  const vidaTemp = parseInt(f.vidaTemp) || 0;
  const pct = Math.max(0, Math.min(1, vidaAtual / vidaMax));
  const pctTemp = Math.max(0, Math.min(1, vidaTemp / vidaMax));
  const caido = vidaAtual <= 0;
  const estado = caido ? "morto" : crHpEstado(pct);

  const alvos = window._grupoMasterAlvos || [];
  const cont = document.getElementById("fichaFlutuanteContador");
  if (cont) cont.textContent = alvos.length > 1 ? `${window._fichaFlutuanteIndex + 1} / ${alvos.length}` : "";

  /* ---- poderes ---- */
  const todos = f.poderes || [];
  const ehTal = (p) => p.circulo === "talento" || ((p.circulo ?? "") === "" && p.origem === "talento");
  const ehPas = (p) => !ehTal(p) && (p.circulo === "passiva" || ((p.circulo ?? "") === "" && p.acao === "passiva"));
  const linhaPoder = (p, i) => _ffLinha(`p-${m.uid}-${i}-${p.nome}`, p.nome, p.dano ? `🩸 ${escapeHtml(p.dano)}` : "", _ffCargas(p), p.desc);
  const gerais = todos.map((p, i) => [p, i]).filter(([p]) => (p.circulo ?? "") === "" && !ehTal(p) && !ehPas(p)).map(([p, i]) => linhaPoder(p, i)).join("");
  const talentos = todos.map((p, i) => [p, i]).filter(([p]) => ehTal(p)).map(([p, i]) => linhaPoder(p, i)).join("");
  const passivas = todos.map((p, i) => [p, i]).filter(([p]) => ehPas(p)).map(([p, i]) => linhaPoder(p, i)).join("");
  const gastos = f.gastosCirculos || {};
  let magias = "";
  for (let c = 0; c <= 9; c++) {
    const lista = todos.map((p, i) => [p, i]).filter(([p]) => String(p.circulo) === String(c));
    const esp = gastos[c] || [];
    if (!lista.length && !esp.length) continue;
    const livres = esp.filter((g) => !g).length;
    magias += _ffGrupo(
      c === 0 ? "Truques" : `Círculo ${c}`,
      lista.map(([p, i]) => linhaPoder(p, i)).join("") || `<p class="ff-nada">Sem magias anotadas.</p>`,
      esp.length ? `<span class="ff-espacos" title="Espaços livres">${_ffBolinhas(esp.map((g) => !g))}<small>${livres}/${esp.length}</small></span>` : "",
    );
  }
  const nPoderes = todos.length;

  /* ---- equipamento ---- */
  const armas = (f.armas || []).map((a, i) => _ffLinha(`a-${m.uid}-${i}`, a.nome, a.dano ? `🩸 ${escapeHtml(a.dano)}` : "", _ffCargas(a), a.desc)).join("");
  const armaduras = (f.armaduras || []).map((a, i) => _ffLinha(`d-${m.uid}-${i}`, a.nome, "", (a.ca ? _ffPill("CA " + a.ca) : "") + _ffCargas(a), a.desc)).join("");
  const nEquip = (f.armas || []).length + (f.armaduras || []).length;

  /* ---- mochila ---- */
  const inv = (f.inventario || []).filter((i) => !i.dentroDe).map((it, i) => _ffLinha(`i-${m.uid}-${i}-${it.nome}`, it.nome, "", (it.qtd > 1 ? _ffPill("×" + it.qtd) : "") + (it.recipiente ? _ffPill("🎒") : ""), it.desc)).join("");
  const moedas = f.moedas || {};
  const moedasHtml = ["pl", "po", "pe", "pp", "pc"].filter((k) => parseInt(moedas[k]) > 0).map((k) => `<span class="ff-moeda m-${k}"><b>${parseInt(moedas[k])}</b>${k.toUpperCase()}</span>`).join("");
  const nInv = (f.inventario || []).length;

  /* ---- companheiros ---- */
  const comps = (f.companheiros || []).map((c, i) => {
    const max = parseInt(c.pvMax) || 0, at = c.pvAtual ?? max;
    const tp = (typeof TIPOS_COMP !== "undefined" && TIPOS_COMP[c.tipo]) || ["🐾", ""];
    return _ffLinha(`c-${m.uid}-${i}`, `${tp[0]} ${c.nome || ""}`, [tp[1], c.especie].filter(Boolean).map(escapeHtml).join(" · "), (max ? _ffPill(`❤️ ${at}/${max}`) : "") + (c.ca ? _ffPill("CA " + c.ca) : ""), c.notas || c.desc || "");
  }).join("");

  /* ---- estado ---- */
  const concNome = f.concentracao ? ((f.poderes || []).find((p) => String(p.id) === String(f.concentracao))?.nome || "") : "";
  const exaust = parseInt(f.exaustao) || 0;
  const efeitos = ["Sem exaustão", "Desvantagem em testes de atributo", "Deslocamento pela metade", "Desvantagem em ataques e salvaguardas", "PV máximos pela metade", "Deslocamento 0", "Morte"];
  const morte = f.morte || { sucessos: [false, false, false], falhas: [false, false, false] };
  const temMorte = (morte.sucessos || []).some(Boolean) || (morte.falhas || []).some(Boolean) || caido;
  const dominio = f.dominio || [];
  const estadoHtml = `
    <div class="ff-estado">
      <div class="ff-estado-item ${exaust ? "ativo" : ""}">
        <small>Exaustão</small>
        <div class="ff-exaustao">${[1, 2, 3, 4, 5, 6].map((n) => `<i class="${n <= exaust ? "on" : ""}"></i>`).join("")}</div>
        <span>${exaust ? `Nível ${exaust} · ${escapeHtml(efeitos[exaust] || "")}` : "Nenhuma"}</span>
      </div>
      <div class="ff-estado-item ${temMorte ? "ativo" : ""}">
        <small>Testes de morte</small>
        <div class="ff-morte">
          <span>✓ ${_ffBolinhas(morte.sucessos, "suc")}</span>
          <span>✕ ${_ffBolinhas(morte.falhas, "fal")}</span>
        </div>
      </div>
      ${dominio.length ? `<div class="ff-estado-item"><small>Pontos de domínio</small><div>${_ffBolinhas(dominio)}</div><span>${dominio.filter(Boolean).length}/${dominio.length}</span></div>` : ""}
      ${f.concentracao ? `<div class="ff-estado-item ativo"><small>Concentrando</small><span>🔮 ${escapeHtml(concNome || "um poder")}</span></div>` : ""}
    </div>`;
  const alertas = (exaust ? 1 : 0) + (caido ? 1 : 0) + (f.concentracao ? 1 : 0);

  const abas = [
    ["poderes", "Poderes", nPoderes],
    ["equip", "Equip.", nEquip],
    ["mochila", "Mochila", nInv],
    ["estado", "Estado", alertas],
  ];
  if ((f.companheiros || []).length) abas.splice(3, 0, ["comps", "Pets", f.companheiros.length]);
  if (!abas.some(([k]) => k === window._ffAba)) window._ffAba = "poderes";
  const aba = window._ffAba;

  let corpo = "";
  if (aba === "poderes") corpo = _ffGrupo("Poderes", gerais) + _ffGrupo("Talentos", talentos) + _ffGrupo("Passivas", passivas) + (magias ? `<div class="ff-sep">✦ Magias ✦</div>${magias}` : "");
  else if (aba === "equip") corpo = _ffGrupo("Armas", armas) + _ffGrupo("Armaduras", armaduras);
  else if (aba === "mochila") corpo = (moedasHtml ? `<div class="ff-moedas">${moedasHtml}</div>` : "") + _ffGrupo("Itens", inv);
  else if (aba === "comps") corpo = _ffGrupo("Companheiros", comps);
  else corpo = estadoHtml;
  if (!corpo.trim()) corpo = `<p class="ff-nada grande">Nada anotado aqui ainda.</p>`;

  const atrs = [["forca", "FOR"], ["destreza", "DES"], ["constituicao", "CON"], ["inteligencia", "INT"], ["sabedoria", "SAB"], ["carisma", "CAR"]];
  const iniciais = (f.nome || "?").replace(/\(.*?\)/g, "").split(/\s+/).filter((p) => /^[a-zà-ú]/i.test(p)).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";
  const sub = [f.classe, f.nivel ? `Nv ${f.nivel}` : ""].filter(Boolean).map((x) => escapeHtml(String(x))).join(" · ");
  const caixa = document.getElementById("fichaFlutuanteConteudo");
  const scroll = caixa.scrollTop;

  caixa.innerHTML = `
    <div class="ff">
      <div class="ff-topo">
        <div class="ff-retrato">
          <div class="ff-foto" style="${f.imagem ? `background-image:url('${escapeHtml(f.imagem)}');background-position:${f.imagemPosX ?? 50}% ${f.imagemPosY ?? 50}%` : `background:${_corAvatar(f.nome || "")}`}">${f.imagem ? "" : `<span>${escapeHtml(iniciais)}</span>`}</div>
          <em class="cr-cc-escudo" title="Classe de armadura"><b>${escapeHtml(String(f.ca ?? "–"))}</b></em>
        </div>
        <div class="ff-id">
          <h3>${escapeHtml(f.nome || "Sem nome")}</h3>
          <small>${sub || "Aventureiro"}</small>
          <span class="ff-jogador">🎲 ${escapeHtml(m.nickname || "Jogador")}</span>
        </div>
      </div>

      <div class="ff-vida">
        <div class="ff-vida-num">
          <span class="cr-cc-hpnum est-${estado}">${caido ? "Caído" : `${vidaAtual}<small>/${vidaMax}</small>`}</span>
          ${vidaTemp ? `<span class="ff-temp">🛡 +${vidaTemp} temp.</span>` : ""}
        </div>
        <div class="ff-barra">
          <i style="width:${Math.round(pct * 100)}%;background:${crHpCor(pct)}" class="${estado === "critico" ? "pulsa" : ""}"></i>
          ${vidaTemp ? `<b style="width:${Math.round(pctTemp * 100)}%"></b>` : ""}
        </div>
      </div>

      <div class="ff-chips">
        ${f.deslocamento ? `<span>👣 ${escapeHtml(String(f.deslocamento))}</span>` : ""}
        ${f.bonusProf ? `<span>⭐ Prof. +${escapeHtml(String(f.bonusProf))}</span>` : ""}
        ${parseInt(f.inspiracao) > 0 ? `<span class="ouro">✨ Inspiração ${escapeHtml(String(f.inspiracao))}</span>` : ""}
        ${f.concentracao ? `<span class="roxo">🔮 ${escapeHtml(concNome || "um poder")}</span>` : ""}
        ${exaust ? `<span class="vinho">😩 Exaustão ${exaust}</span>` : ""}
      </div>

      <div class="ff-atrs">${atrs.map(([k, r]) => { const v = parseInt(f[k]) || 10; return `<div><small>${r}</small><b>${crFmt(crMod(v))}</b><em>${v}</em></div>`; }).join("")}</div>

      <div class="ff-abas">${abas.map(([k, r, n]) => `<button type="button" class="${aba === k ? "on" : ""}" onclick="window._ffTrocarAba('${k}')">${r}${n ? `<small>${n}</small>` : ""}</button>`).join("")}</div>
      <div class="ff-corpo">${corpo}</div>
    </div>`;
  caixa.scrollTop = scroll;
  window._ffUltimo = { m, f };
};

window._ffTrocarAba = function (aba) {
  window._ffAba = aba;
  const u = window._ffUltimo;
  if (u) window._renderFichaFlutuanteConteudo(u.m, u.f);
};

/* =====================================================================
   TROCAR DE ABA SEM A PÁGINA PULAR PRA CIMA
   Quando a aba nova é mais curta, a página segura a altura que tinha e
   vai soltando aos poucos conforme você rola pra cima.
   ===================================================================== */
(function () {
  const raiz = () => document.scrollingElement || document.documentElement;
  let preso = null; // container que está segurando a altura

  // a página visível (ficha, grimório...) — é ela que cresce, então o fundo continua o mesmo
  function paginaVisivel() {
    const cands = ["masterIgnea", "ficha", "telaCampanhasMaster"].map((id) => document.getElementById(id)).filter((el) => el && el.offsetParent !== null);
    return cands.sort((x, y) => y.offsetHeight - x.offsetHeight)[0] || null;
  }
  function segurarAltura() {
    const pg = paginaVisivel();
    if (!pg) return;
    if (preso && preso !== pg) preso.style.minHeight = "";
    const atual = parseFloat(pg.style.minHeight) || 0;
    pg.style.minHeight = Math.max(pg.offsetHeight, atual) + "px";
    preso = pg;
  }
  function soltarAos_poucos() {
    if (!preso) return;
    const pg = preso;
    const precisa = window.scrollY + window.innerHeight;
    const antes = parseFloat(pg.style.minHeight) || 0;
    pg.style.minHeight = "";
    const natural = pg.offsetHeight;
    const real = raiz().scrollHeight;
    if (precisa > real + 1) pg.style.minHeight = Math.min(antes || Infinity, natural + (precisa - real)) + "px";
    else preso = null;
  }
  window.addEventListener("scroll", () => requestAnimationFrame(soltarAos_poucos), { passive: true });
  window.crSegurarAltura = segurarAltura;

  const nomes = ["trocarAba", "trocarAbaMaster", "trocarAbaMundo", "trocarVisaoPM", "crTrocarAba", "crNpcAba", "trocarTipoCriar", "window._ffTrocarAba"];
  nomes.forEach((n) => {
    const naJanela = n.startsWith("window.");
    const chave = naJanela ? n.slice(7) : n;
    let orig;
    try { orig = naJanela ? window[chave] : eval(chave); } catch (e) { return; }
    if (typeof orig !== "function" || orig._seguraAltura) return;
    const novo = function () {
      segurarAltura();
      return orig.apply(this, arguments);
    };
    novo._seguraAltura = true;
    if (naJanela) window[chave] = novo;
    else {
      try { eval(`${chave} = novo`); } catch (e) {}
      window[chave] = novo;
    }
  });
})();


/* crédito no rodapé das páginas */
(function () {
  ["ficha", "masterIgnea"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el || el.querySelector(":scope > .credito-app")) return;
    const c = document.createElement("div");
    c.className = "credito-app";
    c.innerHTML = "Criado por <b>Leonardo José dos Santos</b>";
    el.appendChild(c);
  });
})();


/* excluir pela ficha: apaga de verdade (nuvem + imagem) e a ficha some da tela */
async function crExcluir() {
  const c = window._crFichaAtual;
  if (!c) return;
  const idx = monstrosMestre.findIndex((m) => String(m.id) === String(c.id));
  if (idx === -1) return;
  const oQue = c._tipo === "item" ? "este item" : c._tipo === "npc" ? "este NPC" : "esta criatura";
  if (!(await confirmBonito(`Excluir ${oQue}${c.nome ? ` ("${c.nome}")` : ""}? Não dá pra desfazer.`))) return;
  const alvo = monstrosMestre[idx];
  try {
    if (window.usuarioAtual && window.deleteDoc) await window.deleteDoc(window.doc(window.db, "usuarios", window.usuarioAtual.uid, "monstros", String(c.id)));
  } catch (e) {}
  if (alvo.imagemDeleteUrl && String(alvo.imagemDeleteUrl).startsWith("https://")) {
    try { fetch(alvo.imagemDeleteUrl, { method: "GET" }); } catch (e) {}
  }
  monstrosMestre.splice(idx, 1);
  salvarMonstrosMestreStorage();
  renderMonstrosMestre();
  window._crFichaAtual = null;
  fecharSheetMonstro();
  if (typeof mostrarToastMundo === "function") mostrarToastMundo(`${c.nome || "Excluído"} foi excluído`);
}
window.crExcluir = crExcluir;

// qualquer outro botão antigo de excluir também fecha a ficha quando a entrada some
(function () {
  const orig = excluirEntradaCompendio;
  excluirEntradaCompendio = async function (tipo, id) {
    const antes = monstrosMestre.length + JSON.stringify(campanhasMaster[campanhaAtualMaster] || {}).length;
    const r = await orig.apply(this, arguments);
    const depois = monstrosMestre.length + JSON.stringify(campanhasMaster[campanhaAtualMaster] || {}).length;
    if (antes !== depois) {
      try { fecharSheetMonstro(); } catch (e) {}
      try { fecharPopup(); } catch (e) {}
    }
    return r;
  };
  window.excluirEntradaCompendio = excluirEntradaCompendio;
})();

function abrirImagemExpandida(btn) {
  const url = btn.getAttribute("data-img");
  if (!url) return;

  const overlay = document.createElement("div");
  overlay.className = "img-expandida-overlay";
  overlay.innerHTML = `<img src="${url}" class="img-expandida-conteudo" onclick="event.stopPropagation()">`;
  overlay.onclick = () => overlay.remove();

  document.body.appendChild(overlay);
}

async function apagarEventoLore(index) {
  const campanha = garantirEstruturaLoreCampanha();
  if (!campanha) return;

  if (!(await confirmBonito("Apagar este evento?"))) return;

  campanha.loreDados.eventos.splice(index, 1);
  salvarCampanhasMaster();
  renderLoreCampanha();
}

async function apagarSessaoLore(index) {
  const campanha = garantirEstruturaLoreCampanha();
  if (!campanha) return;

  if (!(await confirmBonito("Apagar esta sessão?"))) return;

  campanha.loreDados.sessoes.splice(index, 1);
  salvarCampanhasMaster();
  renderLoreCampanha();
}

function atualizarPeeksSheetMonstro() {
  const prevEl = document.getElementById("sheetPeekPrev");
  const nextEl = document.getElementById("sheetPeekNext");
  if (!prevEl || !nextEl) return;

  const total = listaSheetCompendio.length;
  if (!total) { prevEl.style.backgroundImage = ""; prevEl.innerHTML = ""; nextEl.style.backgroundImage = ""; nextEl.innerHTML = ""; return; }

  const atual   = sheetMonstroIndexAtual ?? 0;
  const idxPrev = (atual - 1 + total) % total;
  const idxNext = (atual + 1) % total;

  const setPeek = (el, entry) => {
    if (!entry) { el.style.backgroundImage = ""; el.innerHTML = ""; return; }
    el.style.backgroundImage = `url("${entry.imagem || "icon-512.png"}")`;
    el.innerHTML = `<span>${escapeHtml(entry.nome || "")}</span>`;
  };

  setPeek(prevEl, listaSheetCompendio[idxPrev]);
  setPeek(nextEl, listaSheetCompendio[idxNext]);
}

function formatarDescricao(texto) {
  if (!texto) return "Sem descrição";

  return esc(String(texto))
    .replace(/\r\n/g, "<br>")
    .replace(/\n/g, "<br>");
}

function getCampanhaAtualLore() {
  const campanha = campanhasMaster[campanhaAtualMaster];
  if (!campanha) return null;

  if (!campanha.loreDados) {
    campanha.loreDados = {
      historiaPrincipal: "",
      sessoes: [],
      eventos: []
    };
  }

  campanha.loreDados.sessoes ??= [];
  campanha.loreDados.eventos ??= [];
  campanha.loreDados.historiaPrincipal ??= "";

  return campanha;
}

function previewEdicaoAliadoImagem() {
  const input = document.getElementById("editAliadoImagem");
  const preview = document.getElementById("editAliadoImagemPreview");
  const remover = document.getElementById("editAliadoRemoverImagem");

  if (!input?.files?.[0]) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    if (preview) {
      preview.src = e.target.result;
      preview.style.display = "block";
    }

    if (remover) remover.style.display = "block";
  };

  reader.readAsDataURL(input.files[0]);
}

function previewImagemAliado(input) {
  if (!input?.files?.[0]) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    aliadoImagemBase64Temp = e.target.result;

    const preview = document.getElementById("aliadoImagemPreview");
    const remover = document.getElementById("aliadoRemoverImagem");

    if (preview) {
      preview.src = e.target.result;
      preview.style.display = "block";
    }

    if (remover) remover.style.display = "block";
  };

  reader.readAsDataURL(input.files[0]);
}

window._renderPeeksFichaFlutuante = function () {
  const alvos = window._grupoMasterAlvos || [];
  const peekEsq = document.getElementById("fichaFlutuantePeekEsq");
  const peekDir = document.getElementById("fichaFlutuantePeekDir");
  if (!peekEsq || !peekDir) return;

  if (alvos.length <= 1) {
    peekEsq.style.display = "none";
    peekDir.style.display = "none";
    return;
  }

  const idx = window._fichaFlutuanteIndex;
  const prevIdx = (idx - 1 + alvos.length) % alvos.length;
  const nextIdx = (idx + 1) % alvos.length;

  const montarPeek = (m) => {
    const cache = (window._grupoMasterFichaCache || {})[m.uid] || {};
    return `
      <div style="height:320px;background:${cache.imagem ? `url('${cache.imagem}')` : "#1a1310"} center/cover no-repeat;"></div>
      <div style="padding:16px;text-align:center;">
        <div style="font-family:'Cinzel',serif;font-weight:bold;font-size:16px;color:#4A3728;">${escapeHtml(cache.nome || m.nickname)}</div>
      </div>
    `;
  };

  peekEsq.innerHTML = montarPeek(alvos[prevIdx]);
  peekDir.innerHTML = montarPeek(alvos[nextIdx]);
  peekEsq.style.display = "block";
  peekDir.style.display = "block";
};

/* ===== site: botão instalar app ===== */
let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = document.getElementById("btnInstalarApp");
  if (btn) btn.style.display = "block";
});

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnInstalarApp");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    btn.style.display = "none";
  });
});

window.addEventListener("appinstalled", () => {
  const btn = document.getElementById("btnInstalarApp");
  if (btn) btn.style.display = "none";
});


/* ===== site: colunas do combate do mestre ===== */
let _combateColunasAnterior = null;
window.addEventListener("resize", () => {
  const largura = window.innerWidth;
  let cols = 1;
  if (largura >= 1040) cols = 3;
  else if (largura >= 660) cols = 2;

  if (cols !== _combateColunasAnterior) {
    _combateColunasAnterior = cols;
    if (document.getElementById("listaCombateMestre")) {
      renderCombatesMestre();
    }
  }
});



/* =====================================================================
   SITE · JOGADOR NO PC (a partir de 1100px)
   Barra fina de ícones, topo com título da aba, coluna de resumo fixa à
   direita (vida, CA, condições, últimas rolagens, dados), formulários de
   "adicionar" numa gaveta lateral e armas com Acerto/Dano no card.
   No celular nada disso aparece (o CSS esconde).
   ===================================================================== */
(function () {
  var WJ_NOMES_ABA = {
    personagem: "Personagem", atributos: "Atributos", combate: "Combate", inventario: "Inventário",
    poderes: "Poderes", veiculos: "Veículos", companheiros: "Companheiros", diario: "Diário",
  };
  // formulários que viram gaveta: caixa do form, título da gaveta e texto do botão
  var WJ_GAVETAS = [
    { box: "boxArmasForm", aba: "combate", titulo: "Nova arma", botao: "Nova arma", cheio: true },
    { box: "boxArmadurasForm", aba: "combate", titulo: "Nova armadura", botao: "Nova armadura" },
    { box: "boxItensForm", aba: "inventario", titulo: "Novo item", botao: "Novo item", cheio: true },
    { box: "boxAliadosForm", aba: "personagem", titulo: "Novo aliado", botao: "Novo aliado" },
    { box: "boxMapasForm", aba: "personagem", titulo: "Novo mapa", botao: "Novo mapa" },
  ];
  var desk = window.matchMedia ? window.matchMedia("(min-width: 1100px)") : { matches: false, addEventListener: function () {} };

  function el(id) { return document.getElementById(id); }
  function txt(v) { return typeof esc === "function" ? esc(v == null ? "" : String(v)) : String(v == null ? "" : v); }
  function abaAtiva() {
    // durante a animação a aba antiga ainda está marcada: vale a última pedida
    if (window._wjAba && el(window._wjAba)) return window._wjAba;
    var a = document.querySelector("#ficha .aba.active") || [].slice.call(document.querySelectorAll("#ficha .aba")).find(function (x) { return x.style.display === "block"; });
    return a ? a.id : "personagem";
  }
  function n(id) { var v = parseInt((el(id) || {}).value); return isNaN(v) ? 0 : v; }

  /* ---------- montar estrutura (topo, resumo, gaveta) ---------- */
  function montar() {
    var ficha = el("ficha");
    if (!ficha || el("wjResumo")) return;
    var topo = document.createElement("div");
    topo.id = "wjTopo";
    var primeiraAba = ficha.querySelector(".aba");
    if (primeiraAba) primeiraAba.parentNode.insertBefore(topo, primeiraAba);
    var resumo = document.createElement("aside");
    resumo.id = "wjResumo";
    ficha.appendChild(resumo);
    var veu = document.createElement("div");
    veu.id = "wjVeu";
    veu.onclick = fecharGaveta;
    document.body.appendChild(veu);
    var gav = document.createElement("aside");
    gav.id = "wjGaveta";
    gav.innerHTML = '<div class="wj-gv-topo"><h2 id="wjGavetaTitulo"></h2><button type="button" class="wj-gv-x" onclick="wjFecharGaveta()" aria-label="Fechar">✕</button></div><div id="wjGavetaCorpo"></div>';
    document.body.appendChild(gav);
    // marca as seções que têm gaveta (no PC o form some de dentro da página)
    WJ_GAVETAS.forEach(function (g) {
      var box = el(g.box);
      var sec = box && box.closest(".secao-toggle");
      if (sec) sec.classList.add("wj-tem-gaveta");
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharGaveta(); });
    // a engrenagem de escolher abas fica no pé da barra (o topo antigo some no PC)
    var tabs = ficha.querySelector(".tabs");
    if (tabs && !tabs.querySelector(".wj-cfg-abas")) {
      var cfg = document.createElement("button");
      cfg.type = "button";
      cfg.className = "tab-btn wj-cfg-abas";
      cfg.setAttribute("aria-label", "Escolher abas");
      cfg.onclick = function () { if (typeof abrirConfigAbas === "function") abrirConfigAbas(); };
      cfg.innerHTML = '⚙️<span class="tab-label">Abas da ficha</span>';
      tabs.appendChild(cfg);
    }
    // depois de clicar em "Adicionar" dentro da gaveta: se o form limpou, deu certo e fecha
    gav.addEventListener("click", function (e) {
      var b = e.target.closest(".btn-adicionar, .inv-add-btn");
      if (!b) return;
      var corpo = el("wjGavetaCorpo");
      var campo = corpo && corpo.querySelector('input:not([type="file"]):not([type="checkbox"]):not([type="number"])');
      var antes = campo ? campo.value : "";
      if (!campo || !antes) return;
      // salvar pode demorar (envio de imagem): espera o formulário limpar, até 4 s
      var t0 = Date.now();
      (function olhar() {
        if (!gavAberta) return;
        if (!campo.value) return fecharGaveta();
        if (Date.now() - t0 < 4000) setTimeout(olhar, 150);
      })();
    }, true); // captura: lê o nome antes do botão salvar e limpar
    desk.addEventListener && desk.addEventListener("change", function () { if (!desk.matches) fecharGaveta(); renderTudo(); });
  }

  /* ---------- gaveta ---------- */
  var gavAberta = null; // { box, marcador }
  function abrirGaveta(boxId) {
    var g = WJ_GAVETAS.find(function (x) { return x.box === boxId; });
    var box = el(boxId);
    if (!g || !box) return;
    fecharGaveta();
    var marcador = document.createComment("wj-gaveta");
    box.parentNode.insertBefore(marcador, box);
    el("wjGavetaCorpo").appendChild(box);
    el("wjGavetaTitulo").textContent = g.titulo;
    gavAberta = { box: box, marcador: marcador };
    document.body.classList.add("wj-gaveta-aberta");
    setTimeout(function () { var i = box.querySelector("input, textarea"); if (i) i.focus(); }, 260);
  }
  function fecharGaveta() {
    if (!gavAberta) return;
    var g = gavAberta;
    gavAberta = null;
    document.body.classList.remove("wj-gaveta-aberta");
    if (g.marcador.parentNode) { g.marcador.parentNode.insertBefore(g.box, g.marcador); g.marcador.remove(); }
  }
  window.wjAbrirGaveta = abrirGaveta;
  window.wjFecharGaveta = fecharGaveta;

  /* ---------- topo ---------- */
  function renderTopo() {
    var topo = el("wjTopo");
    if (!topo) return;
    var aba = abaAtiva();
    var badge = el("badgeInboxItens");
    var nInbox = badge && badge.style.display !== "none" ? parseInt(badge.textContent) || 0 : 0;
    var botoes = WJ_GAVETAS.filter(function (g) { return g.aba === aba && el(g.box); })
      .map(function (g) { return '<button type="button" class="wj-btn ' + (g.cheio ? "cheio" : "") + '" onclick="wjAbrirGaveta(\'' + g.box + '\')">＋ ' + g.botao + "</button>"; }).join("");
    if (aba === "atributos") botoes = '<button type="button" class="wj-btn" onclick="abrirBandejaDados()">🎲 Rolar dados</button>' + botoes;
    topo.innerHTML =
      '<h1>' + (WJ_NOMES_ABA[aba] || "") + "</h1>" +
      '<button type="button" class="wj-btn ghost" onclick="abrirInboxItens()">📥 Itens recebidos' + (nInbox ? ' <b>' + nInbox + "</b>" : "") + "</button>" +
      botoes;
  }

  /* ---------- resumo ---------- */
  function fotoAtual() {
    try {
      if (typeof imagensPersonagem !== "undefined" && imagensPersonagem[0] && imagensPersonagem[0].url) return imagensPersonagem[0].url;
      if (typeof imagemBase64 !== "undefined" && imagemBase64) return imagemBase64;
    } catch (e) {}
    var p = (typeof personagens !== "undefined" ? personagens : window.personagens || [])[personagemAtual];
    return (p && p.imagem) || "";
  }
  function nomeConcentracao() {
    if (typeof concentracaoAtiva === "undefined" || !concentracaoAtiva) return "";
    var pd = (typeof poderes !== "undefined" ? poderes : []).find(function (x) { return String(x.id) === String(concentracaoAtiva); });
    return pd ? pd.nome || "Poder" : String(concentracaoAtiva);
  }
  function pips(arr, acao, cls) {
    return '<span class="wj-pips">' + arr.map(function (on, k) { return '<button type="button" class="' + (on ? "on " : "") + (cls || "") + '" onclick="' + acao(k) + '"></button>'; }).join("") + "</span>";
  }
  function secao(id, titulo, corpo, extra) {
    if (!corpo) return "";
    var fechada = !!(window._wjFechadas || {})[id];
    return '<section class="wj-sec ' + (fechada ? "fechada" : "") + '"><button type="button" class="wj-sec-tit" onclick="wjAlternarSecao(\'' + id + '\')"><span>' + titulo + "</span>" + (extra || "") + '<i></i></button><div class="wj-sec-corpo">' + corpo + "</div></section>";
  }
  window.wjAlternarSecao = function (id) {
    window._wjFechadas = window._wjFechadas || {};
    window._wjFechadas[id] = !window._wjFechadas[id];
    try { localStorage.setItem("wjFechadas", JSON.stringify(window._wjFechadas)); } catch (e) {}
    renderResumo();
  };
  try { window._wjFechadas = JSON.parse(localStorage.getItem("wjFechadas") || "{}"); } catch (e) { window._wjFechadas = {}; }

  function renderResumo() {
    var box = el("wjResumo");
    if (!box || personagemAtual === null || personagemAtual === undefined) return;
    var rolagem = box.scrollTop;
    var nome = (el("nome") || {}).value || "Sem nome";
    var classe = (el("classe") || {}).value || "";
    var nivel = (el("nivel") || {}).value || "";
    var rs = el("racaSelect");
    var raca = "";
    if (rs && rs.value && rs.selectedIndex >= 0) raca = rs.options[rs.selectedIndex].text;
    if (/escolh|selecione|personaliz|custom/i.test(raca)) raca = (typeof nomeRacaCustom !== "undefined" && nomeRacaCustom) || "";
    var max = n("vidaMax") || 1;
    var atual = typeof vidaAtual === "number" ? vidaAtual : max;
    var temp = typeof vidaTemp === "number" ? vidaTemp : 0;
    var pct = Math.max(0, Math.min(1, atual / max));
    var pctTemp = Math.max(0, Math.min(1, temp / max));
    var cor = pct > 0.5 ? "linear-gradient(90deg,#8e2a33,#c4505a)" : pct > 0.25 ? "linear-gradient(90deg,#9a6a22,#d09a40)" : "linear-gradient(90deg,#5e1219,#9a2626)";
    var ca = (el("ca") || {}).value || "–";
    var desloc = (el("deslocamento") || {}).value || "–";
    var ini = typeof modAtributo === "function" ? modAtributo("destreza") : 0;
    var prof = n("bonusProf");
    var fmt = function (v) { return (v >= 0 ? "+" : "−") + Math.abs(v); };
    var foto = fotoAtual();
    var inicial = (nome.replace(/\(.*?\)/g, "").trim()[0] || "?").toUpperCase();

    /* estado: inspiração, exaustão, concentração, morte */
    var insp = n("inspiracao");
    var exa = typeof exaustao !== "undefined" ? exaustao || 0 : 0;
    var conc = nomeConcentracao();
    var estado =
      '<div class="wj-linha-est"><span>✨ Inspiração</span><span class="wj-cont"><button type="button" onclick="wjInsp(-1)">−</button><b>' + insp + '</b><button type="button" onclick="wjInsp(1)">+</button></span></div>' +
      '<div class="wj-linha-est"><span>😩 Exaustão</span><span class="wj-exa">' + [1, 2, 3, 4, 5, 6].map(function (k) { return '<button type="button" class="' + (k <= exa ? "on" : "") + '" title="Nível ' + k + '" onclick="setExaustao(' + (k === exa ? k - 1 : k) + ')"></button>'; }).join("") + "</span></div>" +
      (conc ? '<div class="wj-linha-est conc"><span>🔮 Concentrando</span><span class="wj-conc-nome">' + txt(conc) + '<button type="button" title="Parar de concentrar" onclick="encerrarConcentracao()">✕</button></span></div>' : "") +
      (atual <= 0 && typeof morte !== "undefined" ? '<div class="wj-linha-est morte"><span>💀 Testes de morte</span><span class="wj-morte">✓ ' + pips(morte.sucessos || [], function (k) { return "toggleMorte('sucessos'," + k + ")"; }, "suc") + " ✕ " + pips(morte.falhas || [], function (k) { return "toggleMorte('falhas'," + k + ")"; }, "fal") + "</span></div>" : "");

    /* atributos: clicar rola */
    var siglas = [["forca", "FOR"], ["destreza", "DES"], ["constituicao", "CON"], ["inteligencia", "INT"], ["sabedoria", "SAB"], ["carisma", "CAR"]];
    var atrs = '<div class="wj-atrs">' + siglas.map(function (s2) {
      var v = typeof getAtributoFinal === "function" ? getAtributoFinal(s2[0]) : n(s2[0]);
      return '<button type="button" title="Rolar ' + s2[1] + '" onclick="rolarAtributo(\'' + s2[0] + '\')"><small>' + s2[1] + "</small><b>" + fmt(Math.floor((v - 10) / 2)) + "</b></button>";
    }).join("") + "</div>";

    /* ataques rápidos */
    var lista = typeof armas !== "undefined" ? armas : [];
    var ataques = lista.slice(0, 6).map(function (a, i) {
      var calc = typeof armaUsaCalculo === "function" && armaUsaCalculo(a);
      var atk = calc ? calcAtaqueArma(a).total : (typeof modAtributo === "function" ? modAtributo("forca") : 0) + prof;
      var sd = typeof separarDanoArma === "function" ? separarDanoArma(a) : { expr: a.dano || "", rolavel: !!a.dano };
      return '<div class="wj-atk"><span class="wj-atk-nome">' + txt(a.nome || "Arma") + '</span><button type="button" class="atk" onclick="rolarAtaqueArma(' + i + ')">🎯 ' + fmt(atk) + "</button>" +
        (a.dano && sd.rolavel ? '<button type="button" class="dn" onclick="rolarDanoArma(' + i + ')">🩸 ' + txt(sd.expr) + "</button>" : "") + "</div>";
    }).join("");

    /* recursos: cargas de poderes e armas, domínio e espaços de magia */
    var rec = "";
    (typeof poderes !== "undefined" ? poderes : []).forEach(function (pd, i) {
      if (!pd.temCargas || !(pd.maxCargas > 0)) return;
      var g = Array.isArray(pd.cargasGastas) ? pd.cargasGastas : Array(pd.maxCargas).fill(false);
      var livres = Array.from({ length: pd.maxCargas }, function (_, k) { return !g[k]; });
      rec += '<div class="wj-rec"><span>' + txt(pd.nome || "Poder") + "</span>" + pips(livres, function (k) { return "toggleCargaPoder(" + i + "," + k + ")"; }) + "</div>";
    });
    lista.forEach(function (a, i) {
      if (!a.temCargas || !(a.maxCargas > 0)) return;
      var livres = Array.from({ length: a.maxCargas }, function (_, k) { return !(a.cargasGastas || [])[k]; });
      rec += '<div class="wj-rec"><span>⚔️ ' + txt(a.nome || "Arma") + "</span>" + pips(livres, function (k) { return "toggleCargaArma(" + i + "," + k + ")"; }) + "</div>";
    });
    if (typeof gastosCirculos !== "undefined") {
      for (var c = 1; c <= 9; c++) {
        var esp = gastosCirculos[c];
        if (!Array.isArray(esp) || !esp.length) continue;
        rec += '<div class="wj-rec"><span>Círculo ' + c + "</span>" + pips(esp.map(function (x) { return !x; }), (function (cc) { return function (k) { return "alternarEspaco(" + cc + "," + k + ")"; }; })(c), "mag") + "</div>";
      }
    }
    if (typeof dominio !== "undefined" && Array.isArray(dominio) && dominio.some(Boolean)) {
      rec += '<div class="wj-rec"><span>Domínio</span>' + pips(dominio, function (k) { return "toggleDominio(" + k + ")"; }, "dom") + "</div>";
    }
    if (rec) rec += '<div class="wj-descanso"><button type="button" onclick="descansoCurto()">☕ Descanso curto</button><button type="button" onclick="descansoLongo()">🌙 Descanso longo</button></div>';

    /* bolsa */
    var mo = typeof moedas !== "undefined" ? moedas : {};
    var bolsa = ["pl", "po", "pe", "pp", "pc"].filter(function (k) { return parseInt(mo[k]) > 0; })
      .map(function (k) { return '<span class="wj-moeda m-' + k + '"><b>' + parseInt(mo[k]) + "</b>" + k.toUpperCase() + "</span>"; }).join("");

    /* rolagens */
    var hist = (typeof historicoRolagens !== "undefined" ? historicoRolagens : []).slice(0, 3);
    var rolHTML = hist.length
      ? hist.map(function (r, k) {
          var cls = r.nat === "crit" ? "cr" : r.nat === "falha" ? "fa" : r.tipo === "expr" ? "dn" : "";
          return '<div class="wj-rol"><span class="wj-d20 ' + cls + '">' + txt(r.total) + "</span><div>" + txt(r.rotulo || "Rolagem") + "<small>" + txt(r.textoSimples || "") + (r.nat === "crit" ? " · crítico!" : r.nat === "falha" ? " · falha crítica" : "") + "</small></div></div>";
        }).join("")
      : '<p class="wj-vazio">Suas rolagens aparecem aqui.</p>';

    box.innerHTML =
      '<div class="wj-quem">' +
        '<button type="button" class="wj-foto" title="Ver personagem" onclick="trocarAba(\'personagem\')" style="' + (foto ? "background-image:url('" + String(foto).replace(/'/g, "%27") + "')" : "") + '">' + (foto ? "" : "<span>" + txt(inicial) + "</span>") + "</button>" +
        '<button type="button" class="wj-ca" title="Mudar CA" onclick="wjEditar(\'ca\')">' + txt(ca) + "</button>" +
        "<div class=\"wj-quem-txt\"><h3>" + txt(nome) + "</h3><small>" + [classe, nivel ? "Nv " + nivel : "", raca].filter(Boolean).map(txt).join(" · ") + "</small></div>" +
      "</div>" +
      '<div class="wj-vida">' +
        '<div class="wj-num"><button type="button" class="wj-hp" title="Mudar vida máxima" onclick="wjEditar(\'vidaMax\')"><b>' + atual + "<small>/" + max + "</small></b></button>" +
          '<button type="button" class="wj-temp ' + (temp ? "" : "zero") + '" onclick="wjEditar(\'temp\')">🛡 ' + (temp ? "+" + temp + " temp." : "PV temporários") + "</button></div>" +
        '<div class="wj-barra"><i style="width:' + Math.round(pct * 100) + "%;background:" + cor + '"></i>' + (temp ? '<em style="width:' + Math.round(pctTemp * 100) + '%"></em>' : "") + "</div>" +
        '<div class="wj-hpbtns"><button type="button" class="d" onclick="wjVida(-1)">− Dano</button><input id="wjHpValor" type="number" min="0" placeholder="valor" onkeydown="if(event.key===\'Enter\')wjVida(-1)"><button type="button" class="c" onclick="wjVida(1)">+ Cura</button></div>' +
      "</div>" +
      '<div class="wj-stats">' +
        '<button type="button" title="Mudar CA" onclick="wjEditar(\'ca\')"><small>CA</small><b>' + txt(ca) + "</b></button>" +
        '<button type="button" title="Mudar deslocamento" onclick="wjEditar(\'deslocamento\')"><small>Desloc.</small><b>' + txt(desloc) + "</b></button>" +
        '<button type="button" title="Rolar iniciativa" onclick="rolarD20(\'Iniciativa\', ' + ini + ')"><small>Inic. 🎲</small><b>' + fmt(ini) + "</b></button>" +
        '<button type="button" title="Mudar proficiência" onclick="wjEditar(\'bonusProf\')"><small>Prof.</small><b>' + fmt(prof) + "</b></button>" +
      "</div>" +
      secao("estado", "Estado", estado) +
      secao("atrs", "Testes rápidos", atrs) +
      secao("ataques", "Ataques", ataques) +
      secao("recursos", "Recursos", rec) +
      secao("bolsa", "Bolsa", bolsa ? '<button type="button" class="wj-bolsa" onclick="trocarAba(\'inventario\')">' + bolsa + "</button>" : "") +
      secao("rolagens", "Últimas rolagens", rolHTML, hist.length ? '<em class="wj-ver" onclick="event.stopPropagation(); wjHistorico()">ver todas</em>' : "") +
      '<div class="wj-dados">' + [20, 12, 10, 8, 6, 4].map(function (d) { return '<button type="button" class="' + (d === 20 ? "d" : "") + '" onclick="wjDado(' + d + ')">d' + d + "</button>"; }).join("") +
        '<button type="button" title="Bandeja de dados" onclick="abrirBandejaDados()">🎲</button></div>';
    box.scrollTop = rolagem;
  }

  window.wjInsp = function (d) {
    var i = el("inspiracao");
    if (!i) return;
    i.value = Math.max(0, (parseInt(i.value) || 0) + d);
    salvarTudo();
    renderResumo();
  };
  window.wjHistorico = function () {
    var h = typeof historicoRolagens !== "undefined" ? historicoRolagens : [];
    var html = '<div class="wj-hist">' + (h.length ? h.map(function (r) {
      var cls = r.nat === "crit" ? "cr" : r.nat === "falha" ? "fa" : r.tipo === "expr" ? "dn" : "";
      var hora = r.em ? new Date(r.em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
      return '<div class="wj-rol"><span class="wj-d20 ' + cls + '">' + txt(r.total) + "</span><div>" + txt(r.rotulo || "Rolagem") + "<small>" + txt(r.textoSimples || "") + "</small></div><time>" + hora + "</time></div>";
    }).join("") : '<p class="wj-vazio">Nenhuma rolagem ainda.</p>') + "</div>";
    abrirPopup("Rolagens desta sessão", html, true, null);
  };

  window.wjVida = function (sinal) {
    var i = el("wjHpValor");
    var v = parseInt(i && i.value) || 0;
    if (v <= 0) { if (i) i.focus(); return; }
    if (sinal < 0 && typeof vidaTemp === "number" && vidaTemp > 0) {
      var tira = Math.min(vidaTemp, v);
      vidaTemp -= tira; v -= tira;
      if (typeof atualizarTemp === "function") atualizarTemp();
    }
    if (v) alterarVida(sinal * v);
    else salvarTudo();
    renderResumo();
  };
  window.wjDado = function (d) {
    if (d === 20) rolarD20("d20", 0);
    else rolarDano("d" + d, "1d" + d);
  };
  window.wjEditar = async function (qual) {
    var rot = { ca: "CA", deslocamento: "Deslocamento", vidaMax: "Vida máxima", temp: "PV temporários", bonusProf: "Bônus de proficiência" }[qual];
    var atual = qual === "temp" ? (typeof vidaTemp === "number" ? vidaTemp : 0) : (el(qual) || {}).value;
    var novo = await promptBonito(rot + ":", String(atual == null ? "" : atual));
    if (novo == null) return;
    if (qual === "temp") {
      var t = Math.max(0, parseInt(novo) || 0);
      alterarTemp(t - vidaTemp);
    } else {
      var inp = el(qual);
      if (!inp) return;
      inp.value = String(novo).trim();
      if (qual === "vidaMax") { if (vidaAtual > get("vidaMax")) vidaAtual = get("vidaMax"); atualizarHP(); }
      if (qual === "bonusProf" && typeof atualizarTudo === "function") atualizarTudo();
      salvarTudo();
    }
    renderResumo();
  };

  /* ---------- armas: Acerto e Dano direto no card ---------- */
  function pillsArmas() {
    var ul = el("listaArmas");
    if (!ul || typeof armas === "undefined") return;
    [].slice.call(ul.querySelectorAll("li.arma-card")).forEach(function (li) {
      var i = parseInt(li.dataset.index);
      var a = armas[i];
      if (!a || li.querySelector(".wj-rolar")) return;
      var calc = typeof armaUsaCalculo === "function" && armaUsaCalculo(a);
      var atk = calc ? calcAtaqueArma(a).total : (typeof modAtributo === "function" ? modAtributo("forca") : 0) + get("bonusProf");
      var sd = typeof separarDanoArma === "function" ? separarDanoArma(a) : { expr: a.dano || "", tipo: "", rolavel: !!a.dano };
      var div = document.createElement("div");
      div.className = "wj-rolar";
      div.innerHTML =
        '<button type="button" class="atk" title="Rolar acerto" onclick="event.stopPropagation(); rolarAtaqueArma(' + i + ')">🎯 ' + (atk >= 0 ? "+" : "−") + Math.abs(atk) + "</button>" +
        (a.dano ? '<button type="button" class="dano" title="Rolar dano" ' + (sd.rolavel ? 'onclick="event.stopPropagation(); rolarDanoArma(' + i + ')"' : "disabled") + ">🩸 " + txt(sd.expr) + (sd.tipo ? " <small>" + txt(sd.tipo) + "</small>" : "") + "</button>" : "");
      var info = li.querySelector(".arma-info") || li;
      var calcEl = info.querySelector(".arma-calc");
      if (calcEl) calcEl.parentNode.insertBefore(div, calcEl.nextSibling);
      else info.appendChild(div);
    });
  }


  /* ---------- etiquetas nas armas e escudo da CA nas armaduras ---------- */
  function tagsArmas() {
    var ul = el("listaArmas");
    if (!ul || typeof armas === "undefined") return;
    [].slice.call(ul.querySelectorAll("li.arma-card")).forEach(function (li) {
      var a = armas[parseInt(li.dataset.index)];
      if (!a || li.querySelector(".wj-tags")) return;
      var tags = [];
      if (a.atributoAtaque && typeof NOMES_ATRIBUTO !== "undefined" && NOMES_ATRIBUTO[a.atributoAtaque]) tags.push(NOMES_ATRIBUTO[a.atributoAtaque]);
      if (a.requerSintonia) tags.push('<span class="' + (a.sintonizado ? "ok" : "") + '">' + (a.sintonizado ? "Sintonizado" : "Requer sintonia") + "</span>");
      (a.modificacoes || []).slice(0, 2).forEach(function (m) { if (m && m.nome) tags.push('<span class="magico">' + txt(m.nome) + "</span>"); });
      if (!tags.length) return;
      var div = document.createElement("div");
      div.className = "wj-tags";
      div.innerHTML = tags.map(function (t) { return t.indexOf("<span") === 0 ? t : "<span>" + txt(t) + "</span>"; }).join("");
      var rol = li.querySelector(".wj-rolar");
      if (rol) rol.parentNode.insertBefore(div, rol);
    });
  }
  function escudosArmaduras() {
    var ul = el("listaArmaduras");
    if (!ul || typeof armaduras === "undefined") return;
    [].slice.call(ul.querySelectorAll("li.armadura-card")).forEach(function (li, k) {
      var a = armaduras[li.dataset.index != null ? parseInt(li.dataset.index) : k];
      if (!a || li.querySelector(".wj-escudo")) return;
      var info = li.querySelector(".armadura-info");
      if (!info) return;
      var s = document.createElement("span");
      s.className = "wj-escudo";
      s.textContent = a.ca || "–";
      info.insertBefore(s, info.firstChild);
    });
  }

  /* ---------- atualizar sem pesar ---------- */
  var agendado = false;
  function renderTudo() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () {
      agendado = false;
      try {
        var f = el("ficha");
        document.body.classList.toggle("wj-na-ficha", !!(f && f.offsetParent !== null && getComputedStyle(f).display !== "none"));
        document.body.dataset.wjAba = abaAtiva();
        renderTopo(); renderResumo();
      } catch (e) { console.warn("wj", e); }
    });
  }
  window.wjAtualizar = renderTudo;

  function envolver(nome, depois) {
    var orig = window[nome];
    try { if (typeof orig !== "function") orig = eval(nome); } catch (e) {}
    if (typeof orig !== "function" || orig._wj) return;
    var novo = function () {
      var r = orig.apply(this, arguments);
      try { depois.apply(this, arguments); } catch (e) {}
      return r;
    };
    novo._wj = true;
    // mantém o que outros envoltórios marcaram
    Object.keys(orig).forEach(function (k) { if (!(k in novo)) novo[k] = orig[k]; });
    try { eval(nome + " = novo"); } catch (e) {}
    window[nome] = novo;
  }
  ["atualizarHP", "atualizarTemp", "atualizarTudo", "salvarTudo", "registrarRolagem", "carregarPersonagem", "setExaustao", "alterarVida", "alterarTemp", "renderPoderes", "renderDominio", "atualizarMorte", "renderPainelMagias", "encerrarConcentracao", "voltarInicio"].forEach(function (n2) { envolver(n2, renderTudo); });
  envolver("trocarAba", function (id) { if (id) window._wjAba = id; fecharGaveta(); renderTudo(); });
  envolver("renderArmas", function () { pillsArmas(); tagsArmas(); });
  envolver("renderArmaduras", escudosArmaduras);

  function iniciar() {
    montar();
    renderTudo();
    pillsArmas(); tagsArmas(); escudosArmaduras();
    // o selo de "Itens recebidos" muda sozinho: acompanha
    var badge = el("badgeInboxItens");
    if (badge && window.MutationObserver) new MutationObserver(renderTudo).observe(badge, { attributes: true, childList: true, characterData: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();


/* =====================================================================
   SITE · ABA PERSONAGEM NO PC (a partir de 1100px)
   Cartaz com a foto, modo leitura / modo edição com campos nomeados,
   idiomas e proficiências em etiquetas, história, mapas e vínculos.
   Os campos de verdade da ficha continuam onde estavam (escondidos no
   PC): aqui só espelhamos e escrevemos de volta neles.
   ===================================================================== */
(function () {
  function el(id) { return document.getElementById(id); }
  function txt(v) { return typeof esc === "function" ? esc(v == null ? "" : String(v)) : String(v == null ? "" : v); }
  function pAtual() { var L = typeof personagens !== "undefined" ? personagens : window.personagens || []; return L[personagemAtual]; }
  function val(id) { var e = el(id); return e ? e.value : ""; }
  window._wjPersEdit = false;
  window._wjVincFiltro = window._wjVincFiltro || "todos";

  /* escreve no campo original e avisa a ficha */
  function escrever(id, v) {
    var e = el(id);
    if (!e) return;
    e.value = v;
    e.dispatchEvent(new Event("input", { bubbles: true }));
    e.dispatchEvent(new Event("change", { bubbles: true }));
  }
  window.wjPersCampo = function (id, v) {
    escrever(id, v);
    if (id === "lorePersonagem" && typeof salvarLorePersonagem === "function") salvarLorePersonagem();
    else salvarTudo();
  };
  window.wjPersExtra = function (campo, v) {
    var p = pAtual();
    if (!p) return;
    p[campo] = v;
    salvarTudo();
  };

  /* ---------- etiquetas (idiomas / proficiências) ---------- */
  function lista(id) {
    return val(id).split(/[,;\n]+/).map(function (s) { return s.trim(); }).filter(Boolean);
  }
  window.wjPersTagAdd = function (id, inp) {
    var v = (inp.value || "").replace(/,/g, " ").trim();
    if (!v) return;
    var L = lista(id);
    if (L.indexOf(v) === -1) L.push(v);
    wjPersCampo(id, L.join(", "));
    render(true);
    setTimeout(function () { var i = document.querySelector('#wjPers [data-tag-input="' + id + '"]'); if (i) i.focus(); }, 0);
  };
  window.wjPersTagRem = function (id, k) {
    var L = lista(id);
    L.splice(k, 1);
    wjPersCampo(id, L.join(", "));
    render(true);
  };
  function tagsHTML(id, vazio) {
    var L = lista(id);
    var ed = window._wjPersEdit;
    var chips = L.map(function (t, k) {
      return "<span>" + txt(t) + (ed ? '<button type="button" onclick="wjPersTagRem(\'' + id + "'," + k + ')" aria-label="Tirar">×</button>' : "") + "</span>";
    }).join("");
    if (ed) chips += '<input class="nova" data-tag-input="' + id + '" placeholder="＋ digite e Enter" onkeydown="if(event.key===\'Enter\'||event.key===\',\'){event.preventDefault();wjPersTagAdd(\'' + id + '\', this)}" onblur="wjPersTagAdd(\'' + id + '\', this)">';
    return '<div class="wjp-pilulas">' + (chips || '<em class="wjp-vazio">' + vazio + "</em>") + "</div>";
  }

  /* ---------- fotos ---------- */
  function fotos() { return typeof imagensPersonagem !== "undefined" ? imagensPersonagem : []; }
  function fotoPrincipal() {
    var F = fotos();
    var i = typeof indiceCarrossel === "number" ? indiceCarrossel : 0;
    if (F[i] && F[i].url) return F[i].url;
    if (typeof imagemBase64 !== "undefined" && imagemBase64) return imagemBase64;
    var p = pAtual();
    return (p && p.imagem) || "";
  }
  window.wjPersFoto = function (i) {
    indiceCarrossel = i;
    if (typeof atualizarPreviewCarrossel === "function") atualizarPreviewCarrossel();
    render(true);
  };

  /* ---------- vínculos ---------- */
  var REL = { companheiro: ["🤝", "Companheiro", "alia"], inimigo: ["⚔️", "Inimigo", "inim"], neutro: ["⚖️", "Neutro", "neut"] };
  window.wjPersFiltro = function (f) { window._wjVincFiltro = f; render(true); };

  /* ---------- diário ---------- */
  window.wjPersDiario = function () {
    trocarAba("inventario");
    setTimeout(function () {
      var box = el("diario-box");
      if (box && box.style.display === "none" && typeof toggleDiario === "function") toggleDiario();
      if (box) box.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
  };

  window.wjPersEditar = function (on) {
    window._wjPersEdit = !!on;
    if (!on) salvarTudo();
    render(true);
    if (on) setTimeout(function () { var i = document.querySelector("#wjPers .wjp-campos input"); if (i) i.focus(); }, 0);
  };

  /* ---------- montar ---------- */
  function render(forcar) {
    var aba = el("personagem");
    if (!aba || personagemAtual === null || personagemAtual === undefined) return;
    // editando: não redesenha a cada tecla (perderia o foco)
    if (window._wjPersEdit && !forcar && document.activeElement && document.activeElement.closest && document.activeElement.closest("#wjPers")) return;
    var box = el("wjPers");
    if (!box) {
      box = document.createElement("div");
      box.id = "wjPers";
      aba.insertBefore(box, aba.firstChild);
    }
    var p = pAtual() || {};
    var ed = window._wjPersEdit;
    var nome = val("nome") || "Sem nome";
    var rs = el("racaSelect");
    var raca = "";
    if (rs && rs.value && rs.selectedIndex >= 0) raca = rs.options[rs.selectedIndex].text;
    if (/escolh|selecione|personaliz|custom/i.test(raca)) raca = (typeof nomeRacaCustom !== "undefined" && nomeRacaCustom) || "";
    var nivel = val("nivel");
    var linha = [val("classe"), raca, nivel ? "Nível " + nivel : "", val("antecedentes")].filter(Boolean).map(txt).join(" · ");
    var idade = val("idade"), altura = val("altura");
    var tags = [];
    if (idade) tags.push("🎂 " + txt(idade) + (/^\d+$/.test(idade.trim()) ? " anos" : ""));
    if (altura) tags.push("📏 " + txt(altura));
    if (p.wjTitulo) tags.push("⚔️ " + txt(p.wjTitulo));
    var foto = fotoPrincipal();
    var urlCss = foto ? "url('" + String(foto).replace(/'/g, "%27") + "')" : "none";
    var F = fotos();
    var iAt = typeof indiceCarrossel === "number" ? indiceCarrossel : 0;
    var minis = F.map(function (f, i) {
      return '<button type="button" class="' + (i === iAt ? "on" : "") + '" style="background-image:url(\'' + String(f.url || "").replace(/'/g, "%27") + '\')" onclick="wjPersFoto(' + i + ')" aria-label="Foto ' + (i + 1) + '"></button>';
    }).join("") + '<button type="button" class="add" onclick="abrirPopupFotoPersonagem()" title="Fotos">＋</button>';
    var badge = el("badgeInboxItens");
    var nInbox = badge && badge.style.display !== "none" ? parseInt(badge.textContent) || 0 : 0;

    var opcoesRaca = rs ? [].map.call(rs.options, function (o) { return '<option value="' + txt(o.value) + '"' + (o.value === rs.value ? " selected" : "") + ">" + txt(o.text) + "</option>"; }).join("") : "";
    var campo = function (rot, id, extra) {
      return '<label class="c ' + (extra || "") + '"><span>' + rot + '</span><input value="' + txt(val(id)) + '" oninput="wjPersCampo(\'' + id + '\', this.value)"></label>';
    };
    var heroiTxt = ed
      ? '<div class="wjp-campos">' +
          campo("Nome", "nome", "largo") + campo("Classe", "classe") +
          '<label class="c"><span>Raça</span><select onchange="wjPersCampo(\'racaSelect\', this.value); setTimeout(function(){wjAtualizar && wjAtualizar()},50)">' + opcoesRaca + "</select></label>" +
          campo("Nível", "nivel") + campo("Antecedente", "antecedentes") + campo("Idade", "idade") + campo("Altura", "altura") +
          '<label class="c largo"><span>Título / quem é</span><input value="' + txt(p.wjTitulo || "") + '" placeholder="Ex: Mercenário de Valdris" oninput="wjPersExtra(\'wjTitulo\', this.value)"></label>' +
          '<label class="c largo"><span>Frase / lema</span><input value="' + txt(p.wjFrase || "") + '" placeholder="Uma frase que resume o personagem" oninput="wjPersExtra(\'wjFrase\', this.value)"></label>' +
        "</div>"
      : '<h1 class="wjp-nome">' + txt(nome) + "</h1>" +
        (linha ? '<p class="wjp-linha">' + linha + "</p>" : "") +
        (tags.length ? '<div class="wjp-tags">' + tags.map(function (t) { return "<span>" + t + "</span>"; }).join("") + "</div>" : "") +
        (p.wjFrase ? '<p class="wjp-frase">“' + txt(p.wjFrase) + "”</p>" : "");

    /* história */
    var lore = val("lorePersonagem");
    var historia = ed
      ? '<textarea class="wjp-lore" placeholder="História, origem, motivações do seu personagem..." oninput="wjPersCampo(\'lorePersonagem\', this.value)">' + txt(lore) + "</textarea>"
      : lore ? '<p class="wjp-lore-txt">' + txt(lore).replace(/\n/g, "<br>") + "</p>" : '<p class="wjp-vazio">Ainda sem história. Toque em ✏️ Editar pra escrever.</p>';

    /* mapas */
    var M = typeof mapas !== "undefined" ? mapas : [];
    var mapasHTML = M.map(function (m, i) {
      return '<button type="button" class="wjp-mapa" style="' + (m.imagemUrl ? "background-image:url('" + String(m.imagemUrl).replace(/'/g, "%27") + "')" : "") + '" onclick="verMapa(' + i + ')">' + (m.imagemUrl ? "" : "<b>🗺</b>") + "<i>" + txt(m.nome || "Mapa") + "</i></button>";
    }).join("") + '<button type="button" class="wjp-mapa add" onclick="wjAbrirGaveta(\'boxMapasForm\')" title="Novo mapa">＋</button>';

    /* vínculos */
    var A = Array.isArray(p.aliados) ? p.aliados : [];
    var f = window._wjVincFiltro;
    var cont = { todos: A.length, companheiro: 0, inimigo: 0, neutro: 0 };
    A.forEach(function (a) { cont[a.tipo || "companheiro"] = (cont[a.tipo || "companheiro"] || 0) + 1; });
    var chips = [["todos", "Todos"], ["companheiro", "🤝 Companheiros"], ["inimigo", "⚔️ Inimigos"], ["neutro", "⚖️ Neutros"]]
      .map(function (c) { return '<button type="button" class="wjp-chip ' + (f === c[0] ? "on" : "") + '" onclick="wjPersFiltro(\'' + c[0] + '\')">' + c[1] + (cont[c[0]] ? " <small>" + cont[c[0]] + "</small>" : "") + "</button>"; }).join("");
    var vinc = A.map(function (a, i) { return [a, i]; }).filter(function (x) { return f === "todos" || (x[0].tipo || "companheiro") === f; }).map(function (x) {
      var a = x[0], i = x[1];
      var r = REL[a.tipo] || REL.companheiro;
      var ini = (a.nome || "?").split(/\s+/).filter(function (w) { return /^[a-zà-ú]/i.test(w) && !/^(o|a|os|as|de|da|do|das|dos|e)$/i.test(w); }).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase() || "?";
      var cor = typeof _corAvatar === "function" ? _corAvatar(a.nome || "") : "#6b4a2b";
      return '<button type="button" class="wjp-v ' + r[2] + '" onclick="abrirDetalhesAliado(' + i + ')">' +
        '<span class="wjp-av" style="' + (a.imagem ? "background-image:url('" + String(a.imagem).replace(/'/g, "%27") + "')" : "background:" + cor) + '">' + (a.imagem ? "" : txt(ini)) + "</span>" +
        "<span class=\"wjp-v-txt\"><strong>" + txt(a.nome || "Sem nome") + "</strong><small>" + [r[1], a.local].filter(Boolean).map(txt).join(" · ") + "</small>" + (a.desc ? "<em>" + txt(a.desc) + "</em>" : "") + "</span></button>";
    }).join("") + '<button type="button" class="wjp-v add" onclick="wjAbrirGaveta(\'boxAliadosForm\')">＋ Novo vínculo</button>';

    box.className = ed ? "editando" : "";
    box.innerHTML =
      '<section class="wjp-heroi">' +
        '<div class="wjp-capa" style="background-image:' + urlCss + '"></div>' +
        '<div class="wjp-foto-col">' +
          '<button type="button" class="wjp-foto" style="background-image:' + urlCss + '" onclick="aoClicarFotoPersonagem()" title="Fotos do personagem">' + (foto ? "" : "<span>📷<small>Adicionar foto</small></span>") + "</button>" +
          '<div class="wjp-minis">' + minis + "</div>" +
        "</div>" +
        '<div class="wjp-txt">' +
          '<div class="wjp-topo"><span class="wjp-selo">Personagem</span>' +
            '<button type="button" class="wj-btn ghost" onclick="abrirInboxItens()">📥 Itens recebidos' + (nInbox ? " <b>" + nInbox + "</b>" : "") + "</button>" +
            (ed ? '<button type="button" class="wj-btn cheio" onclick="wjPersEditar(false)">✓ Salvar</button>' : '<button type="button" class="wj-btn" onclick="wjPersEditar(true)">✏️ Editar</button>') +
          "</div>" + heroiTxt +
        "</div>" +
      "</section>" +
      '<div class="wjp-duas">' +
        '<div class="wjp-col">' +
          '<div class="wjp-sec"><h2>Sobre</h2><span></span></div>' +
          '<div class="wjp-card"><div class="wjp-rot">Idiomas</div>' + tagsHTML("idiomas", "Nenhum idioma anotado.") +
            '<div class="wjp-rot" style="margin-top:14px">Proficiências</div>' + tagsHTML("proficienciasExtras", "Nenhuma proficiência anotada.") + "</div>" +
          '<div class="wjp-card"><div class="wjp-rot">História <button type="button" class="wjp-link" onclick="wjPersDiario()">abrir diário →</button></div>' + historia + "</div>" +
          '<div class="wjp-sec" style="margin-top:22px"><h2>Mapas</h2>' + (M.length ? "<small>" + M.length + "</small>" : "") + "<span></span></div>" +
          '<div class="wjp-mapas">' + mapasHTML + "</div>" +
        "</div>" +
        '<div class="wjp-col">' +
          '<div class="wjp-sec"><h2>Vínculos</h2>' + (A.length ? "<small>" + A.length + "</small>" : "") + "<span></span></div>" +
          '<div class="wjp-chips">' + chips + "</div>" +
          '<div class="wjp-vinc">' + vinc + "</div>" +
        "</div>" +
      "</div>";
  }
  window.wjPersRender = render;

  function envolver(nome) {
    var orig;
    try { orig = eval(nome); } catch (e) { orig = window[nome]; }
    if (typeof orig !== "function" || orig._wjp) return;
    var novo = function () {
      var r = orig.apply(this, arguments);
      try { render(false); } catch (e) { console.warn("wjp", e); }
      return r;
    };
    Object.keys(orig).forEach(function (k) { if (!(k in novo)) novo[k] = orig[k]; });
    novo._wjp = true;
    try { eval(nome + " = novo"); } catch (e) {}
    window[nome] = novo;
  }
  ["carregarPersonagem", "renderAliados", "renderMapas", "atualizarPreviewCarrossel", "salvarTudo", "aoMudarRaca"].forEach(envolver);
  // trocar de personagem sai do modo edição
  (function () {
    var orig;
    try { orig = eval("carregarPersonagem"); } catch (e) {}
    if (typeof orig !== "function") return;
    var novo = function () { window._wjPersEdit = false; return orig.apply(this, arguments); };
    Object.keys(orig).forEach(function (k) { novo[k] = orig[k]; });
    try { eval("carregarPersonagem = novo"); } catch (e) {}
    window.carregarPersonagem = novo;
  })();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { render(true); });
  else render(true);
})();

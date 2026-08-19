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
      const fantasma = liArrastado.cloneNode(true);
      fantasma.classList.add("card-fantasma");
      fantasma.style.position = "fixed";
      fantasma.style.left = rectOriginal.left + "px";
      fantasma.style.top = rectOriginal.top + "px";
      fantasma.style.width = rectOriginal.width + "px";
      fantasma.style.margin = "0";
      fantasma.style.pointerEvents = "none";
      fantasma.style.zIndex = "9999";
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


window._grupoMasterUnsubs = window._grupoMasterUnsubs || [];

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

window._renderFichaFlutuanteConteudo = function (m, f) {
  const vidaMax = f.vidaMax || 1;
const vidaAtual = f.vidaAtual ?? vidaMax;
const vidaTemp = f.vidaTemp ?? 0;
const pctVida = Math.max(0, Math.min(100, (vidaAtual / vidaMax) * 100));
const pctTemp = Math.max(0, Math.min(100, (vidaTemp / vidaMax) * 100));
const corVida = pctVida <= 25 ? "#8a2c22" : pctVida <= 60 ? "#a9822f" : "#4a6b32";

  const todosPoderes = f.poderes || [];
  const poderesGerais = todosPoderes.filter(p => (p.circulo ?? "") === "").map(p => _fichaDashLinha(m.uid, p.nome || "Sem nome", "", _fichaDashPillCargas(p), p.desc)).join("");
  const talentos = todosPoderes.filter(p => p.circulo === "talento").map(p => _fichaDashLinha(m.uid, p.nome || "Sem nome", "", _fichaDashPillCargas(p), p.desc)).join("");
  const passivas = todosPoderes.filter(p => p.circulo === "passiva").map(p => _fichaDashLinha(m.uid, p.nome || "Sem nome", "", _fichaDashPillCargas(p), p.desc)).join("");

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
  "nicolastresca@gmail.com"
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
let aliadoImagemBase64Temp = "";
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
let exaustao = 0;
let armaduras = [];
let editandoArmadura = -1;
let personagens = JSON.parse(localStorage.getItem("personagens")) || [];
window.personagens = personagens;
let personagemAtual = null;
let modoExportacao = false;
let imagemPosX = 50;
let imagemPosY = 50;

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

const racas = {};

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

    el.textContent = getAtributoFinal(attr);
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

function salvarRacasCustomStorage() {
  localStorage.setItem("racasCustomSalvas", JSON.stringify(racasCustomSalvas));
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

function salvarPersonagens() {
  try {
    localStorage.setItem("personagens", JSON.stringify(personagens));
  } catch (erro) {
    console.warn("localStorage cheio. Salvando apenas na nuvem.", erro);
  }

  if (typeof window.salvarFichasNaNuvem === "function") {
    window.salvarFichasNaNuvem();
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

function trocarSubAbaPoderes(tipo, btn) {
  const subabas = document.querySelectorAll(".subaba-poderes");
  subabas.forEach((el) => {
    el.style.display = "none";
    el.classList.remove("active");
  });

  document
    .querySelectorAll(".subtab-poder")
    .forEach((b) => b.classList.remove("active"));

  if (tipo === "poderes-comuns") {
    const alvo = document.getElementById("subaba-poderes-comuns");
    if (alvo) {
      alvo.style.display = "block";
      alvo.classList.add("active");
    }
  }

  if (tipo === "magias") {
    const alvo = document.getElementById("subaba-magias");
    if (alvo) {
      alvo.style.display = "block";
      alvo.classList.add("active");
    }
  }

  if (tipo === "talentos") {
    const alvo = document.getElementById("subaba-talentos");
    if (alvo) {
      alvo.style.display = "block";
      alvo.classList.add("active");
    }
  }

  if (tipo === "passivas") {
    const alvo = document.getElementById("subaba-passivas");
    if (alvo) {
      alvo.style.display = "block";
      alvo.classList.add("active");
    }
  }

  if (btn) btn.classList.add("active");
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

function trocarSubAbaCirculo(circulo, btn) {
  const caixas = document.querySelectorAll(".circulo-box");
  caixas.forEach((el) => {
    el.style.display = "none";
    el.classList.remove("active");
  });

  document
    .querySelectorAll(".subtab-circulo")
    .forEach((b) => b.classList.remove("active"));

  const alvo = document.getElementById(`circulo-${circulo}`);
  if (alvo) {
    alvo.style.display = "block";
    alvo.classList.add("active");
  }

  if (btn) btn.classList.add("active");
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

async function editarQuantidadeSlotsCirculo(circulo) {
  if (!gastosCirculos[circulo]) gastosCirculos[circulo] = [];

  const atual = gastosCirculos[circulo].length;
  const resposta = await promptBonito(`Quantas bolinhas no círculo ${circulo}?`, atual);

  if (resposta === null) return;

  let novoTotal = parseInt(resposta);
  if (isNaN(novoTotal) || novoTotal < 0) novoTotal = 0;

  const novoArray = [];
  for (let i = 0; i < novoTotal; i++) {
    novoArray.push(gastosCirculos[circulo][i] || false);
  }

  gastosCirculos[circulo] = novoArray;

  renderSlotsCirculo(circulo);
  salvarTudo();
}

function renderSlotsCirculo(circulo) {
  const container = document.getElementById(`slotsCirculo${circulo}`);
  if (!container) return;

  container.innerHTML = "";

  const slots = gastosCirculos[circulo] || [];

  slots.forEach((usado, i) => {
    const bolinha = document.createElement("div");
    bolinha.className = "slot-bolinha" + (usado ? " usado" : "");

    bolinha.onclick = () => {
      gastosCirculos[circulo][i] = !gastosCirculos[circulo][i];
      renderSlotsCirculo(circulo);
      salvarTudo();
    };

    container.appendChild(bolinha);
  });
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

      <label class="popup-label">Quantidade</label>
      <input id="editItemQtd" type="number" min="1" value="${item.qtd || 1}">

      <label class="popup-label">Imagem (opcional)</label>
      <input type="file" id="editItemImagem" accept="image/*" onchange="previewEditItemImagem()" />
      <label for="editItemImagem" class="botao-upload">🖼 Trocar imagem</label>
      <img
        id="editItemImagemPreview"
        src="${item.imagemUrl || ""}"
        style="display:${item.imagemUrl ? "block" : "none"}; max-width:100%; border-radius:10px; margin-top:8px;"
      />
      <span class="link-remover-imagem" onclick="removerEditImagemItem()">Remover imagem</span>

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

      <button class="popup-salvar-btn" onclick="salvarEdicaoItem(${index})">
        Salvar
      </button>
    </div>
  `;

  abrirPopup("Editar item", html, true, null);
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
    try {
      const resultado = await uploadImagemFirebase(editItemImagemBase64Temp, "item");
      imagemUrl = resultado.url;
      imagemDeleteUrl = resultado.deleteUrl;
    } catch (e) {
      console.warn("Upload da imagem do item falhou, usando base64");
      imagemUrl = editItemImagemBase64Temp;
      imagemDeleteUrl = "";
    }
  }

  inventario[index] = {
    nome,
    desc,
    qtd,
    requerSintonia,
    sintonizado,
    imagemUrl,
    imagemDeleteUrl,
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

      <label class="popup-label">Dano</label>
      <input id="editArmaDano" value="${arma.dano || ""}">

      <label class="popup-label">Descrição</label>
      <textarea id="editArmaDesc">${arma.desc || ""}</textarea>

      <label class="popup-label">Imagem (opcional)</label>
      <input type="file" id="editArmaImagem" accept="image/*" onchange="previewEditArmaImagem()" />
      <label for="editArmaImagem" class="botao-upload">🖼 Trocar imagem</label>
      <img
        id="editArmaImagemPreview"
        src="${arma.imagemUrl || ""}"
        style="display:${arma.imagemUrl ? "block" : "none"}; max-width:100%; border-radius:10px; margin-top:8px;"
      />
      <span class="link-remover-imagem" onclick="removerEditImagemArma()">Remover imagem</span>

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

function editarPoder(index) {
  const poder = poderes[index];
  if (!poder) return;

  const html = `
    <div class="popup-form">
      <label class="popup-label">Nome</label>
      <input id="editPoderNome" value="${poder.nome || ""}">

      <label class="popup-label">Tipo</label>
      <select id="editPoderTipo" class="input-personagem">
  <option value="">Tipo de dano</option>
  <option value="fogo" ${normalizarTipo(poder.tipo) === "fogo" ? "selected" : ""}>🔥 Fogo</option>
  <option value="gelo" ${normalizarTipo(poder.tipo) === "gelo" ? "selected" : ""}>❄️ Gelo</option>
  <option value="raio" ${normalizarTipo(poder.tipo) === "raio" ? "selected" : ""}>⚡ Raio</option>
  <option value="trovejante" ${normalizarTipo(poder.tipo) === "trovejante" ? "selected" : ""}>🌩️ Trovejante</option>
  <option value="necrotico" ${normalizarTipo(poder.tipo) === "necrotico" ? "selected" : ""}>💀 Necrótico</option>
  <option value="radiante" ${normalizarTipo(poder.tipo) === "radiante" ? "selected" : ""}>✨ Radiante</option>
  <option value="veneno" ${normalizarTipo(poder.tipo) === "veneno" ? "selected" : ""}>☠️ Veneno</option>
  <option value="agua" ${normalizarTipo(poder.tipo) === "agua" ? "selected" : ""}>💧 Água</option>
  <option value="magico" ${normalizarTipo(poder.tipo) === "magico" ? "selected" : ""}>☄️ Mágico</option>
  <option value="psiquico" ${normalizarTipo(poder.tipo) === "psiquico" ? "selected" : ""}>🧠 Psíquico</option>
  <option value="corte" ${normalizarTipo(poder.tipo) === "corte" ? "selected" : ""}>🔪 Corte</option>
  <option value="perfurante" ${normalizarTipo(poder.tipo) === "perfurante" ? "selected" : ""}>📌 Perfurante</option>
  <option value="concussao" ${normalizarTipo(poder.tipo) === "concussao" ? "selected" : ""}>💥 Concussão</option>
  <option value="metal" ${normalizarTipo(poder.tipo) === "metal" ? "selected" : ""}>⚙️ Metal</option>
  <option value="fisico" ${normalizarTipo(poder.tipo) === "fisico" ? "selected" : ""}>🗡️ Físico</option>
  <option value="vento" ${normalizarTipo(poder.tipo) === "vento" ? "selected" : ""}>🍃 Vento</option>
  <option value="madeira" ${normalizarTipo(poder.tipo) === "madeira" ? "selected" : ""}>🌳 Madeira</option>
  <option value="terra" ${normalizarTipo(poder.tipo) === "terra" ? "selected" : ""}>🌍 Terra</option>
  <option value="trevas" ${normalizarTipo(poder.tipo) === "trevas" ? "selected" : ""}>🌑 Trevas</option>
  <option value="luz" ${normalizarTipo(poder.tipo) === "luz" ? "selected" : ""}>🌕 Luz</option>
  <option value="espirito" ${normalizarTipo(poder.tipo) === "espirito" ? "selected" : ""}>🌓 Espírito</option>
</select>

      <label class="popup-label">Dano</label>
      <input id="editPoderDano" value="${poder.dano || ""}">

      <label class="popup-label">Círculo</label>
<select id="editPoderCirculo" class="input-personagem">
  <option value="" ${(poder.circulo ?? "") === "" ? "selected" : ""}>Sem círculo (Poder)</option>
  <option value="talento" ${(poder.circulo ?? "") === "talento" ? "selected" : ""}>Talento</option>
  <option value="passiva" ${(poder.circulo ?? "") === "passiva" ? "selected" : ""}>Passiva</option>
  <option value="0" ${String(poder.circulo ?? "") === "0" ? "selected" : ""}>Círculo 0 (Truque)</option>
  <option value="1" ${String(poder.circulo ?? "") === "1" ? "selected" : ""}>Círculo 1</option>
  <option value="2" ${String(poder.circulo ?? "") === "2" ? "selected" : ""}>Círculo 2</option>
  <option value="3" ${String(poder.circulo ?? "") === "3" ? "selected" : ""}>Círculo 3</option>
  <option value="4" ${String(poder.circulo ?? "") === "4" ? "selected" : ""}>Círculo 4</option>
  <option value="5" ${String(poder.circulo ?? "") === "5" ? "selected" : ""}>Círculo 5</option>
  <option value="6" ${String(poder.circulo ?? "") === "6" ? "selected" : ""}>Círculo 6</option>
  <option value="7" ${String(poder.circulo ?? "") === "7" ? "selected" : ""}>Círculo 7</option>
  <option value="8" ${String(poder.circulo ?? "") === "8" ? "selected" : ""}>Círculo 8</option>
  <option value="9" ${String(poder.circulo ?? "") === "9" ? "selected" : ""}>Círculo 9</option>
</select>

      <label class="popup-label">Conjuração</label>
      <input id="editPoderTempo" value="${poder.tempo || ""}">

      <label class="popup-label">Alcance</label>
      <input id="editPoderAlcance" value="${poder.alcance || ""}">

      <label class="popup-label">Duração</label>
      <input id="editPoderDuracao" value="${poder.duracao || ""}">

      <label class="popup-label">Descrição</label>
<textarea id="editPoderDesc">${poder.desc || ""}</textarea>

<div class="toggle-cargas" style="margin-top:10px;">
  <span class="toggle-cargas-texto">Possui uso</span>

  <label class="switch-cargas">
    <input
      type="checkbox"
      id="editPoderTemCargas"
      ${poder.temCargas ? "checked" : ""}
      onchange="toggleEditCampoCargasPoder()"
    >
    <span class="slider-cargas"></span>
  </label>
</div>

<input
  id="editPoderMaxCargas"
  type="number"
  min="1"
  max="30"
  placeholder="Qtd. de usos"
  value="${poder.maxCargas || ""}"
  style="display:${poder.temCargas ? "block" : "none"};"
>

<button class="popup-salvar-btn" onclick="salvarEdicaoPoder(${index})">
        Salvar
      </button>
    </div>
  `;

  abrirPopup("Editar poder", html, true, null);
}

function salvarEdicaoPoder(index) {
  const nome = document.getElementById("editPoderNome").value.trim();
  const tipo = document.getElementById("editPoderTipo").value.trim();
  const dano = document.getElementById("editPoderDano").value.trim();
  const circulo = document.getElementById("editPoderCirculo").value.trim();
  const tempo = document.getElementById("editPoderTempo").value.trim();
  const alcance = document.getElementById("editPoderAlcance").value.trim();
  const duracao = document.getElementById("editPoderDuracao").value.trim();
  const desc = document.getElementById("editPoderDesc").value.trim();

  const temCargas = !!document.getElementById("editPoderTemCargas")?.checked;
  const maxCargas = temCargas
    ? parseInt(document.getElementById("editPoderMaxCargas")?.value) || 0
    : 0;

  if (!nome) return;
  if (temCargas && maxCargas <= 0) return;

  const poderAnterior = poderes[index];

  let cargasGastas = [];

  if (temCargas) {
    if (
      poderAnterior?.temCargas &&
      poderAnterior.maxCargas === maxCargas &&
      Array.isArray(poderAnterior.cargasGastas)
    ) {
      cargasGastas = poderAnterior.cargasGastas;
    } else {
      cargasGastas = Array(maxCargas).fill(false);
    }
  }

  poderes[index] = {
    nome,
    tipo,
    dano,
    circulo,
    tempo,
    alcance,
    duracao,
    desc,
    temCargas,
    maxCargas,
    cargasGastas,
  };

  renderPoderes();
  salvarTudo();
  fecharPopup();
}

function atualizarTextoBotaoEdicao() {
  const btnItem = document.querySelector("#inventario .inv-add-btn");
  const btnArma = document.querySelector(
    "#combate .arma-add .inv-add-btn, #combate .arma-add button",
  );
  const btnPoder = document.querySelector("#poderes .inv-add-btn");

  if (btnItem) btnItem.textContent = editandoItem >= 0 ? "Salvar edição" : "+";
  if (btnArma) btnArma.textContent = editandoArma >= 0 ? "Salvar edição" : "+";
  if (btnPoder)
    btnPoder.textContent = editandoPoder >= 0 ? "Salvar edição" : "+";
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
    try {
      const resultado = await uploadImagemFirebase(editArmaImagemBase64Temp, "arma");
      imagemUrl = resultado.url;
      imagemDeleteUrl = resultado.deleteUrl;
    } catch (e) {
      console.warn("Upload da imagem da arma falhou, usando base64");
      imagemUrl = editArmaImagemBase64Temp;
      imagemDeleteUrl = "";
    }
  }

  armas[index] = {
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
    const tipo = aliado.tipo || "companheiro";
    aliado.tipo = tipo;

    const li = document.createElement("li");
    li.className = "item-card";
    li.dataset.index = index;

    let etiqueta = "⚔ Companheiro";

    if (tipo === "inimigo") etiqueta = "☠ Inimigo";
    if (tipo === "neutro") etiqueta = "◈ Neutro";

    li.innerHTML = `
      <button type="button" class="drag-handle" aria-label="Arrastar para reordenar"></button>

      <div class="item-info" onclick="abrirDetalhesAliado(${index})" style="cursor:pointer;">
        <strong class="item-nome">${esc(aliado.nome) || "Sem nome"}</strong>
        <div class="aliado-tipo">${etiqueta}</div>
        ${aliado.local ? `<div class="aliado-local">📍 ${esc(aliado.local)}</div>` : ""}
        <p class="item-preview">${aliado.desc ? esc(aliado.desc).substring(0, 80) + (aliado.desc.length > 80 ? "..." : "") : "Sem descrição"}</p>
      </div>

      <div class="item-acoes">
        <div class="acoes-topo">
          <button type="button" class="btn-editar" onclick="event.stopPropagation(); editarAliado(${index})">✏️</button>
        </div>
        <button type="button" class="item-remover" onclick="event.stopPropagation(); removerAliado(${index})">X</button>
      </div>
    `;

    ul.appendChild(li);
  });

  habilitarArrastarReordenar(ul, p.aliados, renderAliados);
}



function removerAliado(index) {
  const p = personagens[personagemAtual];

  if (!p || !Array.isArray(p.aliados)) return;

  p.aliados.splice(index, 1);

  salvarTudo();
  renderAliados();
}

function toggleDominio(index) {
  dominio[index] = !dominio[index];
  renderDominio();
  salvarTudo();
}

function filtrarAliados(tipo, botao) {
  const botoes = document.querySelectorAll(".aliado-filtro");

  botoes.forEach(btn => btn.classList.remove("ativo"));

  if (botao) botao.classList.add("ativo");

  const ul = document.getElementById("listaAliados");
  if (!ul || personagemAtual === null) return;

  const p = personagens[personagemAtual];

  if (!p || !Array.isArray(p.aliados)) return;

  ul.innerHTML = "";

  p.aliados.forEach((aliado, index) => {
    const tipoAliado = aliado.tipo || "companheiro";

    if (tipo !== "todos" && tipoAliado !== tipo) return;

    const li = document.createElement("li");
    li.className = "item-card";
    li.dataset.index = index;

    let etiqueta = "⚔ Companheiro";

    if (tipoAliado === "inimigo") etiqueta = "☠ Inimigo";
    if (tipoAliado === "neutro") etiqueta = "◈ Neutro";

    li.innerHTML = `
      <button type="button" class="drag-handle" aria-label="Arrastar para reordenar"></button>

      <div class="item-info" onclick="abrirDetalhesAliado(${index})" style="cursor:pointer;">
        <strong class="item-nome">${esc(aliado.nome) || "Sem nome"}</strong>
        <div class="aliado-tipo">${etiqueta}</div>
        ${aliado.local ? `<div class="aliado-local">📍 ${esc(aliado.local)}</div>` : ""}
        <p class="item-preview">${aliado.desc ? esc(aliado.desc).substring(0, 80) + (aliado.desc.length > 80 ? "..." : "") : "Sem descrição"}</p>
      </div>

      <div class="item-acoes">
        <div class="acoes-topo">
          <button type="button" class="btn-editar" onclick="event.stopPropagation(); editarAliado(${index})">✏️</button>
        </div>
        <button type="button" class="item-remover" onclick="event.stopPropagation(); removerAliado(${index})">X</button>
      </div>
    `;

    ul.appendChild(li);
  });

  habilitarArrastarReordenar(ul, p.aliados, () => filtrarAliados(tipo, botao));
}

function abrirDetalhesAliado(index) {
  const p = personagens[personagemAtual];

  if (!p || !Array.isArray(p.aliados)) return;

  const aliado = p.aliados[index];

  if (!aliado) return;

  const tipo = aliado.tipo || "companheiro";

  let tipoTexto = "⚔ Companheiro";

  if (tipo === "inimigo") tipoTexto = "☠ Inimigo";
  if (tipo === "neutro") tipoTexto = "◈ Neutro";

  const html = `
    <div class="aliado-detalhes">
      ${aliado.imagem ? `
        <div class="aliado-detalhes-imagem">
          <img src="${aliado.imagem}" alt="">
        </div>
      ` : ""}

      <div class="aliado-detalhes-tipo">${tipoTexto}</div>

      <h2 class="aliado-detalhes-nome">${esc(aliado.nome) || "Sem nome"}</h2>

      ${aliado.local ? `<div class="aliado-detalhes-local">📍 ${esc(aliado.local)}</div>` : ""}

      <div class="aliado-detalhes-corpo">
        <h3>Descrição</h3>
        <p>${aliado.desc ? esc(aliado.desc) : "Nenhuma descrição foi adicionada."}</p>
      </div>
    </div>
  `;

  abrirPopup(aliado.nome || "Detalhes", html, true, () => editarAliado(index));
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
      <input id="editAliadoNome" value="${esc(aliado.nome || "")}">

      <label class="popup-label">Tipo</label>
      <select id="editAliadoTipo">
        <option value="companheiro" ${tipo === "companheiro" ? "selected" : ""}>⚔ Companheiro</option>
        <option value="inimigo" ${tipo === "inimigo" ? "selected" : ""}>☠ Inimigo</option>
        <option value="neutro" ${tipo === "neutro" ? "selected" : ""}>◈ Neutro</option>
      </select>

      <label class="popup-label">Região / Local</label>
      <input id="editAliadoLocal" value="${esc(aliado.local || "")}">

      <label class="popup-label">Descrição</label>
      <textarea id="editAliadoDesc">${esc(aliado.desc || "")}</textarea>

      <label class="popup-label">Imagem do personagem (opcional)</label>

      <input type="file" id="editAliadoImagem" accept="image/*" onchange="previewEdicaoAliadoImagem()" style="display:none;">

      <label for="editAliadoImagem" class="botao-upload">🖼 Alterar imagem (opcional)</label>

      <img id="editAliadoImagemPreview" src="${aliado.imagem || ""}" style="display:${aliado.imagem ? "block" : "none"};max-width:100%;max-height:180px;object-fit:contain;border-radius:10px;margin-top:8px;">

      <span id="editAliadoRemoverImagem" class="link-remover-imagem" onclick="removerImagemEdicaoAliado()" style="display:${aliado.imagem ? "block" : "none"};">Remover imagem</span>

      <button class="popup-salvar-btn" onclick="salvarEdicaoAliado(${index})">Salvar</button>
    </div>
  `;

  abrirPopup("Editar personagem", html, true, null);
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

function removerImagemEdicaoAliado() {
  const input = document.getElementById("editAliadoImagem");
  const preview = document.getElementById("editAliadoImagemPreview");
  const remover = document.getElementById("editAliadoRemoverImagem");

  if (input) input.value = "";

  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }

  if (remover) remover.style.display = "none";

  const botaoSalvar = document.querySelector(".popup-salvar-btn");

  if (botaoSalvar) botaoSalvar.dataset.removerImagem = "true";
}

async function salvarEdicaoAliado(index) {
  const p = personagens[personagemAtual];

  if (!p || !Array.isArray(p.aliados)) return;

  const aliado = p.aliados[index];

  if (!aliado) return;

  const nome = document.getElementById("editAliadoNome").value.trim();
  const local = document.getElementById("editAliadoLocal").value.trim();
  const desc = document.getElementById("editAliadoDesc").value.trim();
  const tipo = document.getElementById("editAliadoTipo")?.value || "companheiro";

  if (!nome) return;

  aliado.nome = nome;
  aliado.local = local;
  aliado.desc = desc;
  aliado.tipo = tipo;

  const botaoSalvar = document.querySelector(".popup-salvar-btn");
  const removerImagem = botaoSalvar?.dataset.removerImagem === "true";

  if (removerImagem) {
    aliado.imagem = "";
  }

  const imagemInput = document.getElementById("editAliadoImagem");

  if (imagemInput?.files?.[0]) {
    try {
      aliado.imagem = await comprimirImagem(imagemInput.files[0], 900, 0.72);
    } catch (e) {
      console.error("Erro ao processar imagem do aliado:", e);
      alertBonito("Não consegui processar essa imagem.");
      return;
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
  const tipo = document.getElementById("aliadoTipo")?.value || "companheiro";
  const imagem = aliadoImagemBase64Temp || "";

  if (!nome) return;

  const p = personagens[personagemAtual];

  if (!Array.isArray(p.aliados)) {
    p.aliados = [];
  }

  p.aliados.push({ nome, local, desc, tipo, imagem });

  document.getElementById("aliadoNome").value = "";
  document.getElementById("aliadoLocal").value = "";
  document.getElementById("aliadoDesc").value = "";

  const tipoInput = document.getElementById("aliadoTipo");
  if (tipoInput) tipoInput.value = "companheiro";

  const imagemInput = document.getElementById("aliadoImagem");
  if (imagemInput) imagemInput.value = "";

  const imagemPreview = document.getElementById("aliadoImagemPreview");
  if (imagemPreview) {
    imagemPreview.src = "";
    imagemPreview.style.display = "none";
  }

  const remover = document.getElementById("aliadoRemoverImagem");
  if (remover) remover.style.display = "none";

  aliadoImagemBase64Temp = "";

  salvarTudo();
  renderAliados();
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

  const requerSintonia =
  !!document.getElementById("armaduraRequerSintonia")?.checked;

const sintonizado =
  requerSintonia &&
  !!document.getElementById("armaduraSintonizado")?.checked;

  if (!nome) return;
  if (temCargas && maxCargas <= 0) return;

  let imagemUrl = editandoArmadura >= 0 ? armaduras[editandoArmadura]?.imagemUrl || "" : "";
  let imagemDeleteUrl = editandoArmadura >= 0 ? armaduras[editandoArmadura]?.imagemDeleteUrl || "" : "";

  if (armaduraImagemBase64Temp === "REMOVIDA") {
    imagemUrl = "";
    imagemDeleteUrl = "";
  } else if (armaduraImagemBase64Temp) {
    try {
      const resultado = await uploadImagemFirebase(armaduraImagemBase64Temp, "armadura");
      imagemUrl = resultado.url;
      imagemDeleteUrl = resultado.deleteUrl;
    } catch (e) {
      console.warn("Upload da imagem da armadura falhou, usando base64");
      imagemUrl = armaduraImagemBase64Temp;
      imagemDeleteUrl = "";
    }
  }

  const novaArmadura = {
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

  if (temCargasEl) temCargasEl.checked = false;
  if (maxCargasEl) {
    maxCargasEl.value = "";
    maxCargasEl.style.display = "none";
  }

  const requerSintoniaEl =
  document.getElementById("armaduraRequerSintonia");

const sintonizadoEl =
  document.getElementById("armaduraSintonizado");

const boxSintonizadoEl =
  document.getElementById("boxArmaduraSintonizado");

if (requerSintoniaEl) requerSintoniaEl.checked = false;
if (sintonizadoEl) sintonizadoEl.checked = false;
if (boxSintonizadoEl) boxSintonizadoEl.style.display = "none";

  armaduraImagemBase64Temp = "";
  document.getElementById("armaduraImagem").value = "";
  document.getElementById("armaduraImagemPreview").style.display = "none";
}

function toggleSintoniaArma() {
  const requer = document.getElementById("armaRequerSintonia");
  const box = document.getElementById("boxArmaSintonizado");
  const sintonizado = document.getElementById("armaSintonizado");

  if (!requer || !box || !sintonizado) return;

  if (requer.checked) {
    box.style.display = "block";
  } else {
    box.style.display = "none";
    sintonizado.checked = false;
  }
}

function toggleSintoniaArmadura() {
  const requer = document.getElementById("armaduraRequerSintonia");
  const box = document.getElementById("boxArmaduraSintonizado");
  const sintonizado = document.getElementById("armaduraSintonizado");

  if (!requer || !box || !sintonizado) return;

  if (requer.checked) {
    box.style.display = "block";
  } else {
    box.style.display = "none";
    sintonizado.checked = false;
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

        const sintoniaHTML = armadura.requerSintonia
  ? `
    <div class="sintonia-preview">
      🔗 Requer sintonização
      ${armadura.sintonizado ? "• ✅ Sintonizado" : "• ❌ Não sintonizado"}
    </div>
  `
  : "";

    li.innerHTML = `
      <button type="button" class="drag-handle" aria-label="Arrastar para reordenar">⠿</button>

      <div class="armadura-info" onclick="verArmadura(${index})">
        <strong class="armadura-nome">${esc(armadura.nome) || "Sem nome"}</strong>
        <p class="armadura-ca-preview">CA: ${esc(armadura.ca) || "Sem CA"}</p>
        <p class="armadura-desc-preview">
          <p class="armadura-desc-preview">
  ${armadura.desc ? esc(armadura.desc).substring(0, 60) + (armadura.desc.length > 60 ? "..." : "") : "Sem descrição"}
</p>

${sintoniaHTML}

${cargasHTML}
      </div>

      <div class="item-acoes">
        <button type="button" class="btn-editar" onclick="event.stopPropagation(); editarArmadura(${index})">✏️</button>
        <button type="button" class="btn-editar" style="color:#C4A95B;" onclick="event.stopPropagation(); window.abrirDarItem('armaduras', ${index})">🎁</button>
        <button type="button" class="arma-remover" onclick="event.stopPropagation(); removerArmadura(${index})">X</button>
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

  const html = `
    <div class="popup-bloco">
      ${
        armadura.imagemUrl
          ? `<div><img src="${armadura.imagemUrl}" class="popup-imagem-item" /></div>`
          : ""
      }

      <div>
  <span class="popup-label">CA</span>
  <div class="popup-descricao-pequena">${esc(armadura.ca) || "Sem CA"}</div>
</div>

<div style="margin-top: 12px;">
  <span class="popup-label">Sintonia</span>

  <div class="popup-descricao-pequena">
    ${
      armadura.requerSintonia
        ? armadura.sintonizado
          ? "🔗 Requer sintonização — ✅ Sintonizado"
          : "🔗 Requer sintonização — ❌ Não sintonizado"
        : "Não requer sintonização"
    }
  </div>
</div>

<div style="margin-top: 12px;">
  <span class="popup-label">Descrição</span>
  <div class="popup-descricao">${esc(armadura.desc) || "Sem descrição"}</div>
</div>
    </div>
  `;

  abrirPopup(armadura.nome || "Sem nome", html, true, () =>
    editarArmadura(index),
  );
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

      <label class="popup-label">Imagem (opcional)</label>
      <input type="file" id="editArmaduraImagem" accept="image/*" onchange="previewEditArmaduraImagem()" />
      <label for="editArmaduraImagem" class="botao-upload">🖼 Trocar imagem</label>
      <img
        id="editArmaduraImagemPreview"
        src="${armadura.imagemUrl || ""}"
        style="display:${armadura.imagemUrl ? "block" : "none"}; max-width:100%; border-radius:10px; margin-top:8px;"
      />
      <span class="link-remover-imagem" onclick="removerEditImagemArmadura()">Remover imagem</span>

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
    try {
      const resultado = await uploadImagemFirebase(editArmaduraImagemBase64Temp, "armadura");
      imagemUrl = resultado.url;
      imagemDeleteUrl = resultado.deleteUrl;
    } catch (e) {
      console.warn("Upload da imagem da armadura falhou, usando base64");
      imagemUrl = editArmaduraImagemBase64Temp;
      imagemDeleteUrl = "";
    }
  }

  armaduras[index] = {
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
  if (diarioEl) diarioEl.value = p.diario || "";

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

  document.getElementById("preview").src = p.imagem || "";
  imagemBase64 = p.imagem || "";
  imagemOriginalBase64 = p.imagemOriginal || p.imagem || "";
  imagemDeleteUrl = p.imagemDeleteUrl || "";

  const nomeArquivo = document.getElementById("nome-arquivo");
  if (nomeArquivo) {
    nomeArquivo.innerText = p.imagem
      ? "Imagem carregada"
      : "Nenhum arquivo escolhido";
  }

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
  p.imagem = imagemBase64;
  p.imagemOriginal = imagemOriginalBase64;
  p.imagemDeleteUrl = imagemDeleteUrl;
  p.imagemPosX = imagemPosX;
  p.imagemPosY = imagemPosY;
  const resistenciasEl = document.getElementById("resistencias");
  const diarioEl = document.getElementById("diario");

  p.resistencias = resistenciasEl ? resistenciasEl.value : "";
  p.diario = diarioEl ? diarioEl.value : "";

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

function previewImagem() {
  const input = document.getElementById("imagem");
  const preview = document.getElementById("preview");
  const nomeArquivo = document.getElementById("nome-arquivo");

  if (!input || !preview || !input.files || !input.files[0]) return;

  const file = input.files[0];
  if (nomeArquivo) nomeArquivo.innerText = file.name;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const base64Local = e.target.result;
    imagemPosX = 50;
    imagemPosY = 50;

    preview.src = base64Local;
    preview.style.objectPosition = `${imagemPosX}% ${imagemPosY}%`;

    if (nomeArquivo) nomeArquivo.innerText = "Enviando imagem...";

    const resultado = await uploadImagemFirebase(base64Local, `personagens/${Date.now()}.jpg`);
    imagemBase64 = resultado.url;
    imagemOriginalBase64 = resultado.url;
    imagemDeleteUrl = resultado.deleteUrl || "";

    if (nomeArquivo) nomeArquivo.innerText = file.name;

    salvarTudo();
    renderPersonagens();
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
  imagemBase64 = resultado.url;
  imagemDeleteUrl = resultado.deleteUrl || "";
  // não sobrescreve imagemOriginalBase64 — mantém original para reedição

  salvarTudo();
  renderPersonagens();
  fecharEditorImagem();
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
    try {
      const resultado = await uploadImagemFirebase(itemImagemBase64Temp, "item");
      imagemUrl = resultado.url;
      imagemDeleteUrl = resultado.deleteUrl;
    } catch (e) {
      console.warn("Upload da imagem do item falhou, usando base64");
      imagemUrl = itemImagemBase64Temp;
      imagemDeleteUrl = "";
    }
  }

  const novoItem = {
    nome,
    desc,
    qtd,
    requerSintonia,
    sintonizado,
    imagemUrl,
    imagemDeleteUrl,
  };

  if (editandoItem >= 0) {
    inventario[editandoItem] = novoItem;
    editandoItem = -1;
  } else {
    inventario.push(novoItem);
  }

  renderInv();
  salvarTudo();

  document.getElementById("itemNome").value = "";
  document.getElementById("itemDesc").value = "";
  document.getElementById("itemQtd").value = "";
  document.getElementById("itemRequerSintonia").checked = false;
  document.getElementById("itemSintonizado").checked = false;
  document.getElementById("boxItemSintonizado").style.display = "none";
  document.getElementById("itemImagem").value = "";
  document.getElementById("itemImagemPreview").style.display = "none";
  itemImagemBase64Temp = "";
}

function previewItemImagem() {
  const input = document.getElementById("itemImagem");
  const preview = document.getElementById("itemImagemPreview");
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    itemImagemBase64Temp = e.target.result;
    preview.src = itemImagemBase64Temp;
    preview.style.display = "block";
  };
  reader.readAsDataURL(input.files[0]);
}

function removerImagemItem() {
  itemImagemBase64Temp = "REMOVIDA";
  const preview = document.getElementById("itemImagemPreview");
  const input = document.getElementById("itemImagem");
  if (preview) { preview.style.display = "none"; preview.src = ""; }
  if (input) input.value = "";
}

function previewEditItemImagem() {
  const input = document.getElementById("editItemImagem");
  const preview = document.getElementById("editItemImagemPreview");
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    editItemImagemBase64Temp = e.target.result;
    preview.src = editItemImagemBase64Temp;
    preview.style.display = "block";
  };
  reader.readAsDataURL(input.files[0]);
}

function removerEditImagemItem() {
  editItemImagemBase64Temp = "REMOVIDA";
  const preview = document.getElementById("editItemImagemPreview");
  const input = document.getElementById("editItemImagem");
  if (preview) { preview.style.display = "none"; preview.src = ""; }
  if (input) input.value = "";
}

function previewArmaImagem() {
  const input = document.getElementById("armaImagem");
  const preview = document.getElementById("armaImagemPreview");
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    armaImagemBase64Temp = e.target.result;
    preview.src = armaImagemBase64Temp;
    preview.style.display = "block";
  };
  reader.readAsDataURL(input.files[0]);
}

function removerImagemArma() {
  armaImagemBase64Temp = "REMOVIDA";
  const preview = document.getElementById("armaImagemPreview");
  const input = document.getElementById("armaImagem");
  if (preview) { preview.style.display = "none"; preview.src = ""; }
  if (input) input.value = "";
}

function previewEditArmaImagem() {
  const input = document.getElementById("editArmaImagem");
  const preview = document.getElementById("editArmaImagemPreview");
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    editArmaImagemBase64Temp = e.target.result;
    preview.src = editArmaImagemBase64Temp;
    preview.style.display = "block";
  };
  reader.readAsDataURL(input.files[0]);
}

function removerEditImagemArma() {
  editArmaImagemBase64Temp = "REMOVIDA";
  const preview = document.getElementById("editArmaImagemPreview");
  const input = document.getElementById("editArmaImagem");
  if (preview) { preview.style.display = "none"; preview.src = ""; }
  if (input) input.value = "";
}

function previewArmaduraImagem() {
  const input = document.getElementById("armaduraImagem");
  const preview = document.getElementById("armaduraImagemPreview");
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    armaduraImagemBase64Temp = e.target.result;
    preview.src = armaduraImagemBase64Temp;
    preview.style.display = "block";
  };
  reader.readAsDataURL(input.files[0]);
}

function removerImagemArmadura() {
  armaduraImagemBase64Temp = "REMOVIDA";
  const preview = document.getElementById("armaduraImagemPreview");
  const input = document.getElementById("armaduraImagem");
  if (preview) { preview.style.display = "none"; preview.src = ""; }
  if (input) input.value = "";
}

function previewEditArmaduraImagem() {
  const input = document.getElementById("editArmaduraImagem");
  const preview = document.getElementById("editArmaduraImagemPreview");
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    editArmaduraImagemBase64Temp = e.target.result;
    preview.src = editArmaduraImagemBase64Temp;
    preview.style.display = "block";
  };
  reader.readAsDataURL(input.files[0]);
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

function renderInv() {
  const ul = document.getElementById("lista");
  if (!ul) return;

  ul.innerHTML = "";

  inventario.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "item-card";
    li.dataset.index = index;

    li.innerHTML = `
      <button type="button" class="drag-handle" aria-label="Arrastar para reordenar">⠿</button>

      <div class="item-info" onclick="verItem(${index})">
        <div class="item-topo-linha">
          <strong class="item-nome">
            ${item.nome ? esc(item.nome) : "Sem nome"}
            ${item.requerSintonia ? `<span class="item-tag-sintonia">${item.sintonizado ? "Sint." : "Req. Sint."}</span>` : ""}
          </strong>

          <span class="item-qtd-badge">x${item.qtd || 1}</span>
        </div>

        <div class="item-subtags">
          ${item.requerSintonia ? `<span class="item-subtag">🔗 Requer sintonia</span>` : ""}
          ${item.sintonizado ? `<span class="item-subtag ativo">✅ Sintonizado</span>` : ""}
        </div>

        <p class="item-preview">
  ${formatarDescricao(item.desc)}
</p>
      </div>

      <div class="item-acoes">
        <div class="acoes-topo">
          <button type="button" class="btn-editar" onclick="event.stopPropagation(); editarItem(${index})">✏️</button>
        </div>

        <button type="button" class="btn-editar" style="color:#C4A95B;" onclick="event.stopPropagation(); window.abrirDarItem('inventario', ${index})">🎁</button>
        <button type="button" class="item-remover" onclick="event.stopPropagation(); removerItem(${index})">X</button>
      </div>
    `;

    ul.appendChild(li);
  });

  habilitarArrastarReordenar(ul, inventario, renderInv);
}

function formatarDescricao(texto) {
  if (!texto) return "Sem descrição";

  return esc(String(texto))
    .replace(/\r\n/g, "<br>")
    .replace(/\n/g, "<br>");
}

function corContraste(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0,2), 16);
  const g = parseInt(c.substring(2,4), 16);
  const b = parseInt(c.substring(4,6), 16);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.55 ? "#1a0e05" : "#F8F4E3";
}

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

  function salvarLorePersonagem() {
  const p = personagens[personagemAtual];
  if (!p) return;
  p.lore = document.getElementById("lorePersonagem").value;
  salvarTudo();
}

function verItem(index) {
  const item = inventario[index];
  if (!item) return;

  const html = `
  <div class="popup-bloco">
    ${
      item.imagemUrl
        ? `<div><img src="${item.imagemUrl}" class="popup-imagem-item" /></div>`
        : ""
    }

    <div>
      <span class="popup-label">Quantidade</span>
      <div class="popup-descricao popup-descricao-pequena">${item.qtd || 1}</div>
    </div>

    <div style="margin-top: 12px;">
      <span class="popup-label">Sintonia</span>
      <div class="popup-descricao popup-descricao-pequena">
        ${
          item.requerSintonia
            ? item.sintonizado
              ? "Requer sintonia — Sintonizado"
              : "Requer sintonia — Não sintonizado"
            : "Não requer sintonia"
        }
      </div>
    </div>

    <div style="margin-top: 12px;">
      <span class="popup-label">Descrição</span>
      <div class="popup-descricao popup-descricao-grande">${formatarDescricao(item.desc)}</div>
    </div>
  </div>
`;

  abrirPopup(item.nome || "Sem nome", html, true, () => editarItem(index));
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

async function removerItem(index) {
  const item = inventario[index];
  if (!item) return;

  const confirmar = await confirmBonito(`Remover "${item.nome}"?`);
  if (!confirmar) return;

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

const requerSintonia =
  !!document.getElementById("armaRequerSintonia")?.checked;

const sintonizado =
  requerSintonia &&
  !!document.getElementById("armaSintonizado")?.checked;

if (!nome) return;
  if (temCargas && maxCargas <= 0) return;

  let imagemUrl = editandoArma >= 0 ? armas[editandoArma]?.imagemUrl || "" : "";
  let imagemDeleteUrl = editandoArma >= 0 ? armas[editandoArma]?.imagemDeleteUrl || "" : "";

  if (armaImagemBase64Temp === "REMOVIDA") {
    imagemUrl = "";
    imagemDeleteUrl = "";
  } else if (armaImagemBase64Temp) {
    try {
      const resultado = await uploadImagemFirebase(armaImagemBase64Temp, "arma");
      imagemUrl = resultado.url;
      imagemDeleteUrl = resultado.deleteUrl;
    } catch (e) {
      console.warn("Upload da imagem da arma falhou, usando base64");
      imagemUrl = armaImagemBase64Temp;
      imagemDeleteUrl = "";
    }
  }

  const novaArma = {
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

  if (temCargasEl) temCargasEl.checked = false;
  if (maxCargasEl) {
    maxCargasEl.value = "";
    maxCargasEl.style.display = "none";
  }

  const requerSintoniaEl =
  document.getElementById("armaRequerSintonia");

const sintonizadoEl =
  document.getElementById("armaSintonizado");

const boxSintonizadoEl =
  document.getElementById("boxArmaSintonizado");

if (requerSintoniaEl) requerSintoniaEl.checked = false;
if (sintonizadoEl) sintonizadoEl.checked = false;
if (boxSintonizadoEl) boxSintonizadoEl.style.display = "none";

  armaImagemBase64Temp = "";
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

        const sintoniaHTML = arma.requerSintonia
  ? `
    <div class="sintonia-preview">
      🔗 Requer sintonização
      ${arma.sintonizado ? "• ✅ Sintonizado" : "• ❌ Não sintonizado"}
    </div>
  `
  : "";

    li.innerHTML = `
      <button type="button" class="drag-handle" aria-label="Arrastar para reordenar">⠿</button>

      <div class="arma-info" onclick="verArma(${index})">
        <strong class="arma-nome">${esc(arma.nome) || "Sem nome"}</strong>
        <p class="arma-dano-preview">${esc(arma.dano) || "Sem dano"}</p>
        <p class="arma-desc-preview">
  ${formatarDescricao(arma.desc)}
</p>

${sintoniaHTML}

${cargasHTML}
      </div>

      <div class="item-acoes">
        <button type="button" class="btn-editar" onclick="event.stopPropagation(); editarArma(${index})">✏️</button>
        <button type="button" class="btn-editar" style="color:#C4A95B;" onclick="event.stopPropagation(); window.abrirDarItem('armas', ${index})">🎁</button>
        <button type="button" class="arma-remover" onclick="event.stopPropagation(); removerArma(${index})">X</button>
      </div>
    `;

    ul.appendChild(li);
  });

  habilitarArrastarReordenar(ul, armas, renderArmas);
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

  const html = `
    <div class="popup-bloco">
      ${
        arma.imagemUrl
          ? `<div><img src="${arma.imagemUrl}" class="popup-imagem-item" /></div>`
          : ""
      }

      <div>
        <span class="popup-label">Dano</span>
        <div class="popup-tags">
          <span class="tag-dano">${arma.dano || "—"}</span>
        </div>
      </div>

      <div style="margin-top: 12px;">
        <span class="popup-label">Sintonia</span>

        <div class="popup-descricao popup-descricao-grande">
          ${
            arma.requerSintonia
              ? arma.sintonizado
                ? "🔗 Requer sintonização — ✅ Sintonizado"
                : "🔗 Requer sintonização — ❌ Não sintonizado"
              : "Não requer sintonização"
          }
        </div>
      </div>

      <div style="margin-top: 12px;">
        <span class="popup-label">Descrição</span>

        <div class="popup-descricao popup-descricao-grande">
          ${formatarDescricao(arma.desc)}
        </div>
      </div>
    </div>
  `;

  abrirPopup(arma.nome || "Sem nome", html, true, () => editarArma(index));
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

function addPoder() {
  const nome = document.getElementById("poderNome").value.trim();
  const tipo = document.getElementById("poderTipo").value.trim();
  const dano = document.getElementById("poderDano").value.trim();
  const circulo = document.getElementById("poderCirculo").value.trim();
  const tempo = document.getElementById("poderTempo").value.trim();
  const alcance = document.getElementById("poderAlcance").value.trim();
  const duracao = document.getElementById("poderDuracao").value.trim();
  const desc = document.getElementById("poderDesc").value.trim();
  const temCargas = !!document.getElementById("poderTemCargas")?.checked;
  const maxCargas = temCargas
    ? parseInt(document.getElementById("poderMaxCargas")?.value) || 0
    : 0;

  if (!nome) return;

  const novoPoder = {
    nome,
    tipo,
    dano,
    circulo,
    tempo,
    alcance,
    duracao,
    desc,
    temCargas,
    maxCargas,
    cargasGastas: temCargas ? Array(maxCargas).fill(false) : [],
  };

  if (editandoPoder >= 0) {
    poderes[editandoPoder] = novoPoder;
    editandoPoder = -1;
  } else {
    poderes.push(novoPoder);
  }

  renderPoderes();
  salvarTudo();

  document.getElementById("poderNome").value = "";
  document.getElementById("poderTipo").value = "";
  document.getElementById("poderDano").value = "";
  document.getElementById("poderCirculo").value = "";
  document.getElementById("poderTempo").value = "";
  document.getElementById("poderAlcance").value = "";
  document.getElementById("poderDuracao").value = "";
  document.getElementById("poderDesc").value = "";
  document.getElementById("poderTemCargas").checked = false;
  document.getElementById("poderMaxCargas").value = "";
  document.getElementById("poderMaxCargas").style.display = "none";
}

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

function renderPoderes() {
  const listaPoderesComuns = document.getElementById("listaPoderesComuns");
  const listaTalentos = document.getElementById("listaTalentos");
  const listaPassivas = document.getElementById("listaPassivas");

  const listasCirculos = {
    0: document.getElementById("listaMagiasCirculo0"),
    1: document.getElementById("listaMagiasCirculo1"),
    2: document.getElementById("listaMagiasCirculo2"),
    3: document.getElementById("listaMagiasCirculo3"),
    4: document.getElementById("listaMagiasCirculo4"),
    5: document.getElementById("listaMagiasCirculo5"),
    6: document.getElementById("listaMagiasCirculo6"),
    7: document.getElementById("listaMagiasCirculo7"),
    8: document.getElementById("listaMagiasCirculo8"),
    9: document.getElementById("listaMagiasCirculo9"),
  };

  if (listaPoderesComuns) listaPoderesComuns.innerHTML = "";
  if (listaTalentos) listaTalentos.innerHTML = "";
  if (listaPassivas) listaPassivas.innerHTML = "";

  Object.values(listasCirculos).forEach((lista) => {
    if (lista) lista.innerHTML = "";
  });

  poderes.forEach((poder, index) => {
    const icone = getIconeTipo(poder.tipo);
    const circulo = (poder.circulo ?? "").toString().trim();

    // 🔥 ===== CARGAS =====
    let cargasHTML = "";

    if (poder.temCargas && poder.maxCargas > 0) {
      if (!Array.isArray(poder.cargasGastas)) {
        poder.cargasGastas = Array(poder.maxCargas).fill(false);
      }

      cargasHTML = `<div style="margin-top:6px;">`;

      for (let i = 0; i < poder.maxCargas; i++) {
        const usada = poder.cargasGastas[i];

        cargasHTML += `
          <span
            style="
              display:inline-block;
              width:14px;
              height:14px;
              border-radius:50%;
              border:2px solid #b89654;
              margin-right:4px;
              background:${usada ? "#b89654" : "transparent"};
              cursor:pointer;
            "
            onclick="event.stopPropagation(); toggleCargaPoder(${index}, ${i})"
          ></span>
        `;
      }

      cargasHTML += `</div>`;
    }
    // 🔥 ===== FIM CARGAS =====

    const li = document.createElement("li");
    li.className = "poder-card";
    li.dataset.index = index;

    li.innerHTML = `
      <button type="button" class="drag-handle" aria-label="Arrastar para reordenar">⠿</button>

      <div class="poder-info" onclick="verPoder(${index})">
        <strong class="poder-nome">${icone} ${esc(poder.nome) || "Sem nome"}</strong>

        ${
          poder.dano
            ? `
          <div class="poder-tags">
            <span class="tag-dano">${esc(poder.dano)}</span>
          </div>
        `
            : ""
        }

        <p class="poder-preview">
          ${poder.desc ? esc(poder.desc).substring(0, 70) + (poder.desc.length > 70 ? "..." : "") : "Sem descrição"}
        </p>

        ${cargasHTML}
      </div>

      <div class="item-acoes">
        <div class="acoes-topo">
          <button class="btn-editar" onclick="editarPoder(${index})">✏️</button>
        </div>

        <button class="btn-deletar" onclick="removerPoder(${index})">X</button>
      </div>
    `;

    if (circulo === "") {
      if (listaPoderesComuns) listaPoderesComuns.appendChild(li);
    } else if (circulo === "talento") {
      if (listaTalentos) listaTalentos.appendChild(li);
    } else if (circulo === "passiva") {
      if (listaPassivas) listaPassivas.appendChild(li);
    } else if (listasCirculos[circulo]) {
      listasCirculos[circulo].appendChild(li);
    } else {
      if (listaPoderesComuns) listaPoderesComuns.appendChild(li);
    }
  });

  habilitarArrastarReordenar(listaPoderesComuns, poderes, renderPoderes);
  habilitarArrastarReordenar(listaTalentos, poderes, renderPoderes);
  habilitarArrastarReordenar(listaPassivas, poderes, renderPoderes);
  Object.values(listasCirculos).forEach((lista) => {
    habilitarArrastarReordenar(lista, poderes, renderPoderes);
  });

  let totalPoderes = 0;
  let totalMagias = 0;
  let totalTalentos = 0;
  let totalPassivas = 0;

  poderes.forEach((poder) => {
    const c = (poder.circulo ?? "").toString().trim();
    if (c === "") totalPoderes++;
    else if (c === "talento") totalTalentos++;
    else if (c === "passiva") totalPassivas++;
    else totalMagias++;
  });

  const contadorPoderes = document.getElementById("contadorPoderes");
  const contadorMagias = document.getElementById("contadorMagias");
  const contadorTalentos = document.getElementById("contadorTalentos");
  const contadorPassivas = document.getElementById("contadorPassivas");

  if (contadorPoderes) contadorPoderes.textContent = `(${totalPoderes})`;
  if (contadorMagias) contadorMagias.textContent = `(${totalMagias})`;
  if (contadorTalentos) contadorTalentos.textContent = `(${totalTalentos})`;
  if (contadorPassivas) contadorPassivas.textContent = `(${totalPassivas})`;

  for (let i = 0; i <= 9; i++) {
    const inputGasto = document.getElementById(`gastoCirculo${i}`);
    if (inputGasto) {
      inputGasto.value = gastosCirculos[i] || 0;
    }
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

function verPoder(index) {
  const poder = poderes[index];
  if (!poder) return;

  const tipoTexto = poder.tipo || "Sem tipo";
  const icone = getIconeTipo(tipoTexto);

  const tags = [
    poder.dano ? `<span class="tag-dano">${poder.dano}</span>` : "",
    poder.circulo
      ? `<span class="popup-tag">Círculo: ${poder.circulo}</span>`
      : "",
    poder.tempo
      ? `<span class="popup-tag">Conjuração: ${poder.tempo}</span>`
      : "",
    poder.alcance
      ? `<span class="popup-tag">Alcance: ${poder.alcance}</span>`
      : "",
    poder.duracao
      ? `<span class="popup-tag">Duração: ${poder.duracao}</span>`
      : "",
  ].join("");

  const html = `
    <div class="popup-bloco">
      ${tags ? `<div class="popup-tags">${tags}</div>` : ""}

      <div style="margin-top: 12px;">
        <span class="popup-label">Descrição</span>
        <div class="popup-descricao">
          ${poder.desc || "Sem descrição"}
        </div>
      </div>
    </div>
  `;

  abrirPopup(`${icone} ${poder.nome}`, html, true, null);
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
  const el = document.getElementById(id).closest(".attr");
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

    if (saves[attr]) {
      badge.style.display = "flex";
      badge.textContent = valor >= 0 ? `+${valor}` : `${valor}`;
    } else {
      badge.style.display = "none";
      badge.textContent = "";
    }
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

    pericias.forEach((pericia) => {
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
        </label>
        <span>${valor >= 0 ? `+${valor}` : valor}</span>
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


let editandoItemMestre = -1;
let editandoMonstroMestre = -1;
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

  // reset estado da tela
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
    if (desc) desc.innerHTML = '<p style="font-style:italic;font-size:13px;color:rgba(154,138,112,0.45);">Toque em um caminho para revelar seu destino…</p>';
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

async function uploadImagemFirebase(base64, caminho) {
  try {
    const formData = new FormData();
    formData.append("image", base64.split(",")[1]);
    formData.append("key", "26dfe793d942b94afde4b0cf7a63a385");
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (data.success) return { url: data.data.url, deleteUrl: data.data.delete_url };
    throw new Error("ImgBB upload falhou");
  } catch(e) {
    console.error("Erro upload imagem ImgBB:", e);
    return { url: base64, deleteUrl: "" };
  }
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
  if (btn) { btn.disabled = true; btn.textContent = "..."; }

  let imagemUrl = mapaBase64Temp;
  let imagemDeleteUrl = "";

  try {
    const resultado = await uploadImagemFirebase(mapaBase64Temp, "mapa");
    imagemUrl = resultado.url;
    imagemDeleteUrl = resultado.deleteUrl;
  } catch(e) { console.warn("Upload mapa falhou, usando base64"); }

  mapas.push({ nome, desc, imagemUrl, imagemDeleteUrl, anotacoes: [] });

  document.getElementById("mapaNome").value = "";
  document.getElementById("mapaDesc").value = "";
  document.getElementById("mapaImagem").value = "";
  document.getElementById("mapaPreviewBox").style.display = "none";
  mapaBase64Temp = "";

  if (btn) { btn.disabled = false; btn.textContent = "+"; }

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

  const thumbHTML = mapa.imagemUrl
    ? `<img src="${mapa.imagemUrl}" style="width:100%;max-height:180px;object-fit:cover;border-radius:12px;margin-bottom:12px;border:1px solid rgba(200,169,107,0.2)" />`
    : "";

  const html = `
    <div class="popup-bloco">
      ${thumbHTML}
      <div>
        <span class="popup-label">Descrição</span>
        <div class="popup-descricao" style="min-height:auto;padding:10px 12px">${mapa.desc || "Sem descrição"}</div>
      </div>
      <div style="margin-top:14px;text-align:center">
        <span class="popup-label" style="color:#b89654">${(mapa.anotacoes||[]).length}/30 anotações</span>
      </div>
      <button
        onclick="fecharPopup(); abrirMapaViewer(${index})"
        style="margin-top:14px;width:100%;padding:11px;border-radius:12px;background:#b89654;color:#1b1411;font-weight:bold;border:none;cursor:pointer;font-family:'Cinzel',serif;letter-spacing:1px"
      >
        Abrir Mapa
      </button>
    </div>
  `;

  abrirPopup(mapa.nome, html, true, () => editarMapa(index));
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

function abrirImagemExpandida(btn) {
  const url = btn.getAttribute("data-img");
  if (!url) return;

  const overlay = document.createElement("div");
  overlay.className = "img-expandida-overlay";
  overlay.innerHTML = `<img src="${url}" class="img-expandida-conteudo" onclick="event.stopPropagation()">`;
  overlay.onclick = () => overlay.remove();

  document.body.appendChild(overlay);
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

  if (editandoItemMestre >= 0) {
    monstrosMestre[editandoItemMestre] = novoItem;
    editandoItemMestre = -1;
  } else {
    monstrosMestre.push(novoItem);
  }

  salvarMonstrosMestreStorage();
  renderMonstrosMestre();

  ["itemMasterNome","itemMasterTipo","itemMasterEfeito","itemMasterDescricao",
   "itemMasterHistoria","itemMasterOrigem"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  const preview = document.getElementById("previewItemMaster");
  if (preview) { preview.src = ""; preview.style.display = "none"; }
  window._imagemItemBase64 = "";

  mostrarToastMundo(editandoItemMestre >= 0 ? "Item atualizado!" : "Item salvo!");
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

    document.addEventListener("touchmove", (e) => {
      if (arrastando) e.preventDefault();
      aoMover(e);
    }, { passive: false });

    document.addEventListener("touchend", (e) => {
      aoSoltar(e);
    }, { passive: false });
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

function salvarHistoriaPrincipalLore() {
  const campanha = getCampanhaAtualLore();
  if (!campanha) return;

  campanha.loreDados.historiaPrincipal =
    document.getElementById("historiaPrincipalLore")?.value || "";

  salvarCampanhasMaster();
}



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
 
function salvarHistoriaPrincipalLore() {
  const campanha = garantirEstruturaLoreCampanha();
  if (!campanha) return;

  campanha.loreDados.historiaPrincipal =
    document.getElementById("historiaPrincipalLore")?.value || "";

  salvarCampanhasMaster();
}

async function apagarSessaoLore(index) {
  const campanha = garantirEstruturaLoreCampanha();
  if (!campanha) return;

  if (!(await confirmBonito("Apagar esta sessão?"))) return;

  campanha.loreDados.sessoes.splice(index, 1);
  salvarCampanhasMaster();
  renderLoreCampanha();
}


async function apagarEventoLore(index) {
  const campanha = garantirEstruturaLoreCampanha();
  if (!campanha) return;

  if (!(await confirmBonito("Apagar este evento?"))) return;

  campanha.loreDados.eventos.splice(index, 1);
  salvarCampanhasMaster();
  renderLoreCampanha();
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

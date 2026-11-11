/* =====================================================================
   LEITOR-ITEM.JS · Ficha Ígnea
   "Colar texto" dos itens do Grimório: lê um ou vários itens do jeito que
   o mestre colar (anotação, conversa, site, PDF) — nome, tipo, raridade,
   sintonização e efeito.
   ===================================================================== */
(function () {
  "use strict";

  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const PEQ = ["de", "da", "do", "das", "dos", "e", "em", "a", "o", "com", "na", "no", "of", "the", "and"];
  function capitalizar(t) {
    const s = String(t || "").trim().replace(/\s+/g, " ");
    const le = (s.match(/[A-Za-zÀ-ÿ]/g) || []).length, ma = (s.match(/[A-ZÀ-Ý]/g) || []).length;
    if (!le || ma / le < 0.7) return s.charAt(0).toUpperCase() + s.slice(1);
    return s.toLowerCase().split(" ").map((w, i) => (i && PEQ.includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(" ");
  }

  const TIPOS = "item maravilhoso|wondrous item|arma|weapon|armadura|armor|armour|escudo|shield|anel|ring|bast[aã]o|rod|cajado|staff|varinha|wand|po[cç][aã]o|potion|pergaminho|scroll|muni[cç][aã]o|ammunition|amuleto|colar|manto|capa|botas|luvas|elmo|cinto|braceletes|instrumento|ferramenta|item|objeto";
  const RARS = "comum|incomum|rar[oa]|muito rar[oa]|lend[aá]ri[oa]|artefato|raridade vari[aá]vel|raridade varia|varia|common|uncommon|rare|very rare|legendary|artifact|rarity varies";
  // "Item maravilhoso, raro (requer sintonização por um mago)" · "Arma (espada longa), incomum" · "Wondrous Item, Rare (Requires Attunement)"
  const RX_TIPO = new RegExp("^(" + TIPOS + ")\\b([^,\\n]{0,60}),\\s*(" + RARS + ")\\b(.*)$", "i");
  const RX_TIPO2 = new RegExp("^(" + RARS + ")\\s+(" + TIPOS + ")\\b(.*)$", "i"); // "Rare wondrous item"
  const RARIDADE = (r) => {
    const t = norm(r);
    if (/muito rar|very rare/.test(t)) return "muitoraro";
    if (/incomum|uncommon/.test(t)) return "incomum";
    if (/lendari|legendary/.test(t)) return "lendario";
    if (/artefato|artifact/.test(t)) return "artefato";
    if (/rar[oa]|\brare\b/.test(t)) return "raro";
    if (/comum|common/.test(t)) return "comum";
    return "";
  };
  const ARMAS = /\b(espada|espadas|machado|machadinha|adaga|arco|besta|lanca|martelo|maca|cimitarra|rapieira|tridente|alabarda|glaive|azagaia|chicote|clava|mangual|picareta|foice|bordao|cajado de combate|sword|axe|dagger|bow|crossbow|spear|hammer|mace|rapier|scimitar)\b/;
  function categoriaDe(tipo, nome, desc) {
    if (!tipo && (ARMAS.test(norm(nome)) || (/\+\d/.test(nome) && ARMAS.test(norm(String(desc || "").slice(0, 40)))))) return "armas";
    if (!tipo && /\b(armadura|escudo|cota de malha|brunea|couro batido|meia armadura|armor|shield)\b/.test(norm(nome))) return "armaduras";
    const t = norm(tipo + " " + nome);
    if (/^(arma|weapon|municao|ammunition)/.test(norm(tipo)) || /\b(espada|machado|adaga|arco|besta|lanca|martelo|maca|cimitarra|rapieira|tridente|alabarda|glaive|azagaia|chicote|clava|mangual|picareta|foice|sword|axe|dagger|bow|crossbow|spear|hammer|mace)\b/.test(norm(nome)) && /^(arma|weapon)/.test(norm(tipo))) return "armas";
    if (/^(armadura|armor|armour|escudo|shield)/.test(norm(tipo))) return "armaduras";
    if (/^(arma|weapon)/.test(t)) return "armas";
    return "inventario";
  }

  function linhas(txt) {
    let t = String(txt || "");
    if (typeof window.limparTextoColado === "function") t = window.limparTextoColado(t);
    t = t.replace(/\r/g, "").replace(/­/g, "").replace(/\t/g, " ").replace(/ {2,}/g, " ").replace(/([a-zà-ÿ])-\n\s*([a-zà-ÿ])/g, "$1$2");
    return t.split("\n").map((l) => l.trim()).filter((l) => !/^\d{1,4}$/.test(l) && !/^fonte\s*:/i.test(l));
  }
  function paragrafos(ls) {
    const out = [];
    ls.forEach((l) => {
      if (!l) { if (out.length && out[out.length - 1] !== "") out.push(""); return; }
      const u = out[out.length - 1];
      if (u && !/[.!?:]["”)]?$/.test(u) && !/^[-–•·*]\s/.test(l)) out[out.length - 1] = u + " " + l;
      else out.push(l);
    });
    return out.join("\n").replace(/\n{2,}/g, "\n\n").trim();
  }

  function analisarTipo(l) {
    let m = l.match(RX_TIPO);
    if (m) return { tipo: (m[1] + m[2]).trim(), rar: m[3], resto: m[4] || "" };
    m = l.match(RX_TIPO2);
    if (m) return { tipo: m[2] + (m[3] || ""), rar: m[1], resto: m[3] || "" };
    return null;
  }
  function montar(nome, tp, corpo) {
    const sint = /(requer sintoniza|requer sintonia|requires attunement|sintoniza[cç][aã]o)/i.test(tp.resto + " " + tp.tipo);
    const por = (tp.resto.match(/(?:sintoniza[cç][aã]o|sintonia|attunement)\s+(?:por|by)\s+([^)]+)\)/i) || [])[1] || "";
    const tipo = capitalizar(tp.tipo.replace(/\s*\(([^)]*)\)\s*/, " ($1)").trim());
    const base = (tp.tipo.match(/\(([^)]*)\)/) || [])[1] || "";
    const r = RARIDADE(tp.rar);
    const efeito = paragrafos(corpo);
    const bonus = (nome.match(/\+\s?(\d)\b/) || [])[1] || (efeito.match(/\+(\d)\s*(?:de\s+)?(?:b[oô]nus\s+)?(?:na|à|a|em|to|bonus to)\s+(?:sua\s+)?(?:CA|AC)\b/i) || [])[1];
    const ca = (efeito.match(/\b(?:CA|AC)\s*(?:de\s*)?(\d{1,2})\b/) || [])[1];
    return {
      nome: capitalizar(nome.replace(/\s*\((?:[^)]*)\)\s*$/, (m) => (/\+\d/.test(m) ? m : ""))),
      tipo, base: base.toLowerCase(), bonus: bonus ? Number(bonus) : 0,
      categoria: categoriaDe(tp.tipo, nome),
      raridade: r === "artefato" ? "lendario" : r || "comum", classificacao: r === "artefato" ? "artefato" : "normal",
      sintonia: sint ? "sim" : "nao", sintoniaPor: por.trim(),
      efeito: efeito + (por ? `\n\nSintonia: ${por.trim()}` : ""),
      ca: ca ? Number(ca) : null,
    };
  }

  // jeito de mesa: "Anel do Fogo (raro, sintonia): +1 na CA e resistência a fogo" · "Nome: … / Raridade: rara / Sintonização: sim"
  function informal(ls) {
    const out = [];
    let atual = null;
    const RX = /^(?:[-–•·*]\s+)?([A-ZÀ-Ý][^:(\n]{1,50}?)\s*(?:\(([^)]*)\))?\s*[:–—]\s+(\S.*)$/;
    ls.forEach((l, k) => {
      if (!l) return;
      const campo = l.match(/^(raridade|rarity|tipo|type|sintoniza[cç][aã]o|sintonia|attunement|efeito|descri[cç][aã]o|effect|description|nome|name|pre[cç]o|valor|peso|dano|ca)\s*:\s*(.*)$/i);
      if (campo && atual) {
        const k2 = norm(campo[1]), v = campo[2];
        if (/^(raridade|rarity)/.test(k2)) atual.rar = v;
        else if (/^(tipo|type)/.test(k2)) atual.tipo = v;
        else if (/^(sinton|attun)/.test(k2)) atual.sint = !/^(nao|não|no|sem)\b/i.test(v) ? v || "sim" : "";
        else if (/^nome|^name/.test(k2)) atual.nome = v;
        else if (/^dano/.test(k2)) atual.dano = v;
        else if (/^ca$/.test(k2)) atual.ca = v;
        else if (/^(preco|valor|peso)/.test(k2)) atual.extra.push(`${capitalizar(campo[1])}: ${v}`);
        else atual.txt.push(v);
        return;
      }
      if (campo && !atual && /^nome|^name/i.test(campo[1])) { atual = { nome: campo[2], txt: [], extra: [], rar: "", tipo: "", sint: "" }; out.push(atual); return; }
      const m = l.match(RX);
      const ant = ls.slice(0, k).reverse().find(Boolean) || "";
      if (m && (!atual || /^[-–•·*]\s/.test(l) || /[.!?]$/.test(ant)) && m[1].split(/\s+/).length <= 7) {
        const par = m[2] || "";
        atual = { nome: m[1], txt: [m[3]], extra: [], rar: par, tipo: "", sint: /sinton|attun/i.test(par) ? "sim" : "" };
        out.push(atual);
        return;
      }
      if (atual) atual.txt.push(l);
    });
    return out.map((x) => {
      const r = RARIDADE(x.rar || x.txt.join(" ").slice(0, 80));
      const tipo = x.tipo || "";
      return {
        nome: capitalizar(x.nome), tipo: capitalizar(tipo), base: ((m) => (m ? norm(x.txt.join(" ")).slice(m.index, m.index + 24) : ""))(norm(x.txt.join(" ")).match(ARMAS)), bonus: Number((x.nome.match(/\+\s?(\d)\b/) || [])[1] || 0),
        categoria: categoriaDe(tipo, x.nome, x.txt.join(" ")), raridade: r === "artefato" ? "lendario" : r || "comum", classificacao: r === "artefato" ? "artefato" : "normal",
        sintonia: x.sint ? "sim" : "nao", sintoniaPor: "", efeito: [x.txt.join("\n").trim().replace(/^./, (c) => c.toUpperCase()), x.extra.join(" · ")].filter(Boolean).join("\n\n"),
        dano: x.dano || "", ca: x.ca ? Number(String(x.ca).replace(/\D/g, "")) || null : null,
      };
    });
  }

  function ler(txt) {
    const ls = linhas(txt);
    if (!ls.some(Boolean)) return { itens: [] };
    // 1) bloco de livro/site: nome + linha de tipo/raridade
    const ancoras = [];
    ls.forEach((l, k) => {
      if (l.length >= 140) return;
      // "…incomum (requer sintonização por um" / "feiticeiro)": junta a linha quebrada
      let linha = l, extra = 0;
      while (ls[k + 1 + extra] && (linha.split("(").length > linha.split(")").length || /^\((requer|requires)/i.test(ls[k + 1 + extra])) && extra < 2) { extra++; linha += " " + ls[k + extra]; }
      const tp = analisarTipo(linha);
      if (tp) ancoras.push({ k, tp, pula: extra });
    });
    if (ancoras.length) {
      // o que vier antes do primeiro bloco (uma lista do jeito de mesa) também conta
      let u0 = ancoras[0].k - 1;
      while (u0 >= 0 && !ls[u0]) u0--;
      const antes = u0 > 0 ? informal(ls.slice(0, u0)) : [];
      const itens = antes.concat(ancoras.map((a, j) => {
        let u = a.k - 1;
        while (u >= 0 && !ls[u]) u--;
        const nome = u >= 0 && ls[u].length <= 60 && !/[.:;]$/.test(ls[u]) ? ls[u] : "Item";
        const prox = ancoras[j + 1];
        let fim = prox ? prox.k - 1 : ls.length;
        while (prox && fim > a.k && !ls[fim]) fim--;
        return montar(nome, a.tp, ls.slice(a.k + 1 + (a.pula || 0), prox ? fim : ls.length));
      }));
      return { itens };
    }
    // 2) jeito de mesa
    const inf = informal(ls);
    if (inf.length) return { itens: inf };
    // 3) um item só: primeira linha = nome
    const cheias = ls.filter(Boolean);
    const nome = cheias[0].length <= 60 && cheias.length > 1 ? cheias[0] : "Item";
    const corpo = nome === "Item" ? ls : ls.slice(ls.indexOf(cheias[0]) + 1);
    const r = RARIDADE(corpo.join(" ").slice(0, 120));
    return { itens: [{ nome: capitalizar(nome), tipo: "", base: "", bonus: 0, categoria: categoriaDe("", nome), raridade: r || "comum", classificacao: r === "artefato" ? "artefato" : "normal", sintonia: /sinton|attun/i.test(corpo.join(" ")) ? "sim" : "nao", sintoniaPor: "", efeito: paragrafos(corpo), ca: null }] };
  }

  window.lerItensColados = ler;
})();

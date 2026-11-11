/* =====================================================================
   LEITOR-ORIGEM.JS · Ficha Ígnea
   "Colar texto" de antecedente e de raça: lê o que a pessoa colar
   (anotação, conversa do grupo, site, PDF) e devolve no formato da ficha.
     window.lerAntecedenteColado(txt) -> { nome, d, atrs, talento, pericias, ferramenta, equipA, poA, poB }
     window.lerRacaColada(txt)        -> { nome, d, tam, desl, bonus, t: [traços] }
   ===================================================================== */
(function () {
  "use strict";

  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const PEQ = ["de", "da", "do", "das", "dos", "e", "em", "a", "o", "com", "na", "no", "of", "the", "and"];
  function capitalizar(t) {
    const s = String(t || "").trim().replace(/\s+/g, " ");
    const le = (s.match(/[A-Za-zÀ-ÿ]/g) || []).length, ma = (s.match(/[A-ZÀ-Ý]/g) || []).length;
    if (!le || ma / le < 0.7) return s.charAt(0).toUpperCase() + s.slice(1);
    return s.toLowerCase().split(" ").map((w, i) => (i && PEQ.includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(" ");
  }
  const ATRS = [["for", /\b(forca|for|strength|str)\b/], ["des", /\b(destreza|des|dexterity|dex)\b/], ["con", /\b(constituicao|con|constitution)\b/], ["int", /\b(inteligencia|int|intelligence)\b/], ["sab", /\b(sabedoria|sab|wisdom|wis)\b/], ["car", /\b(carisma|car|charisma|cha)\b/]];
  const ATR_LONGO = { for: "forca", des: "destreza", con: "constituicao", int: "inteligencia", sab: "sabedoria", car: "carisma" };
  const atrsEm = (t) => { const n = norm(t); return ATRS.filter(([, r]) => r.test(n)).map(([k]) => k); };
  const NUM = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10 };
  const PER_ALIAS = { "adestrar animais": "Lidar com Animais", "trato com animais": "Lidar com Animais", blefar: "Enganação", acrobatics: "Acrobacia", arcana: "Arcanismo", athletics: "Atletismo", deception: "Enganação", history: "História", insight: "Intuição", intimidation: "Intimidação", investigation: "Investigação", medicine: "Medicina", nature: "Natureza", perception: "Percepção", performance: "Atuação", persuasion: "Persuasão", religion: "Religião", "sleight of hand": "Prestidigitação", stealth: "Furtividade", survival: "Sobrevivência" };
  function periciasEm(t) {
    const lista = typeof PERICIAS_IGNEA !== "undefined" ? PERICIAS_IGNEA : [];
    const n = norm(t), out = [];
    lista.forEach((p) => { if (n.includes(norm(p))) out.push(p); });
    Object.entries(PER_ALIAS).forEach(([k, p]) => { if (n.includes(k) && !out.includes(p)) out.push(p); });
    return out;
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
  // "Campo: valor" que continua nas linhas de baixo até outro campo
  function campos(ls, RX) {
    const achou = {}, resto = [];
    let atual = null;
    ls.forEach((l) => {
      if (!l) { atual = null; resto.push(""); return; }
      const sem = l.replace(/^[-–•·*]\s+/, "");
      const m = RX.map(([k, rx]) => [k, sem.match(rx)]).find(([, x]) => x);
      if (m && !achou[m[0]]) { atual = m[0]; achou[atual] = (m[1][1] || "").trim(); return; }
      if (atual && !/^[A-ZÀ-Ý][^.:]{1,40}[.:]\s/.test(sem)) { achou[atual] += " " + sem; return; }
      atual = null;
      resto.push(l);
    });
    return { achou, resto };
  }
  const nomeDe = (ls) => {
    const cheias = ls.filter(Boolean);
    const m = cheias[0] && cheias[0].match(/^(?:nome|name|antecedente|background|ra[cç]a|esp[eé]cie|povo|species|race)\s*[:\-–]\s*(.+)$/i);
    if (m) return { nome: capitalizar(m[1]), i: ls.indexOf(cheias[0]) };
    return cheias[0] && cheias[0].length <= 50 && !/[.:]$/.test(cheias[0]) ? { nome: capitalizar(cheias[0].replace(/^(antecedente|background|ra[cç]a)\s+/i, "")), i: ls.indexOf(cheias[0]) } : { nome: "", i: -1 };
  };

  /* ---------- antecedente ---------- */
  const RX_ANT = [
    ["atrs", /^(?:valores? de atributos?|atributos?|aumento de atributos?|ability scores?)\s*[:\-–]\s*(.*)$/i],
    ["talento", /^(?:talento(?: de origem)?|feat|origin feat)\s*[:\-–]\s*(.*)$/i],
    ["carac", /^(?:caracter[ií]stica|feature|habilidade)(?:\s*[:\-–]\s*|\s+)(.*)$/i],
    ["per", /^(?:profici[eê]ncias? (?:em|de) per[ií]cias?|per[ií]cias(?: treinadas)?|skill proficiencies|skills)\s*[:\-–]\s*(.*)$/i],
    ["ferr", /^(?:profici[eê]ncias? (?:em|com|de) ferramentas?|ferramentas?|tool proficiency|tools?)\s*[:\-–]\s*(.*)$/i],
    ["idi", /^(?:idiomas|l[ií]nguas|languages)\s*[:\-–]\s*(.*)$/i],
    ["equip", /^(?:equipamento(?: inicial)?|equipment|itens)\s*[:\-–]\s*(.*)$/i],
  ];
  function equipamento(txt) {
    const t = String(txt || "").replace(/\s+/g, " ").trim();
    if (!t) return { itens: [], poA: 0, poB: 0 };
    // "Escolha A ou B: (A) …, 8 PO; ou (B) 50 PO"
    const pa = t.match(/\(A\)\s*:?\s*(.*?)(?=;?\s*(?:ou|or)?\s*\(B\)|$)/i), pb = t.match(/\(B\)\s*:?\s*(.*)$/i);
    const parteA = pa ? pa[1] : t.replace(/^escolha[^:]*:\s*/i, "");
    const po = (x) => { const m = String(x || "").match(/(\d+)\s*(?:po|pe[cç]as de ouro|gp|moedas de ouro|ouro)\b/i); return m ? Number(m[1]) : 0; };
    const itens = [];
    parteA.replace(/[.;]\s*$/, "").split(/,|;|\s+e\s+(?=\d|[A-ZÀ-Ýa-zà-ÿ])/).map((x) => x.trim()).filter(Boolean).forEach((x) => {
      if (/^\d+\s*(po|pe[cç]as de ouro|gp|moedas|ouro)\b/i.test(x) || /bolsa com \d+/i.test(x)) return;
      let qtd = 1, nome = x;
      let m = x.match(/^(\d+|um|uma|dois|duas|tres|três|quatro|cinco|dez|vinte)\s+(.+)$/i);
      if (m) { qtd = Number(m[1]) || NUM[norm(m[1])] || 1; nome = m[2]; }
      const mm = nome.match(/^(metros?|m)\s+de\s+(.+)$/i);
      if (mm && qtd > 1) { nome = `${mm[2]} (${qtd} m)`; qtd = 1; }
      m = nome.match(/^(.+?)\s*\((\d+)\)$/) || nome.match(/^(.+?)\s*[x×]\s*(\d+)$/i);
      if (m) { nome = m[1]; qtd = Number(m[2]) || qtd; }
      nome = capitalizar(nome.replace(/^(um|uma|o|a|os|as)\s+/i, "").replace(/\.$/, ""));
      if (nome.length < 2 || nome.length > 60) return;
      const armas = typeof CATALOGO_IGNEA !== "undefined" ? CATALOGO_IGNEA.armas : [];
      const arma = armas.find((w) => norm(w.nome) === norm(nome) || norm(w.nome) + "s" === norm(nome));
      itens.push(arma ? { a: arma.nome, qtd } : { i: nome, qtd });
    });
    return { itens, poA: po(parteA), poB: pb ? po(pb[1]) : 0 };
  }
  function lerAntecedente(txt) {
    const ls = linhas(txt);
    const nm = nomeDe(ls);
    const corpo = ls.slice(nm.i + 1);
    const { achou, resto } = campos(corpo, RX_ANT);
    // "Característica: Abrigo dos Fiéis" + parágrafo, ou "Abrigo dos Fiéis. Você…" na linha do campo
    let talento = null;
    const talentos = typeof TALENTOS_IGNEA !== "undefined" ? TALENTOS_IGNEA : [];
    if (achou.talento) {
      const n0 = achou.talento.replace(/\s*\(ver[^)]*\)\s*$/i, "").replace(/\.$/, "").trim();
      const cat = talentos.find((x) => norm(x.nome) === norm(n0) || norm(n0).startsWith(norm(x.nome)));
      const [n1, ...d1] = n0.split(/[.:]\s+/);
      talento = { nome: capitalizar(cat ? n0 : n1).slice(0, 60), d: cat ? cat.d : d1.join(". ") || "Talento do antecedente." };
    }
    if (!talento && achou.carac) {
      const [n1, ...d1] = achou.carac.split(/[.:]\s+/);
      const descr = d1.join(". ") || paragrafos(resto.slice(resto.findIndex(Boolean)));
      talento = { nome: capitalizar(n1).slice(0, 60), d: descr.slice(0, 700) };
    }
    const atrs = achou.atrs ? atrsEm(achou.atrs).slice(0, 3) : [];
    const eq = equipamento(achou.equip);
    const d = paragrafos(resto).split("\n\n")[0] || "";
    return {
      nome: nm.nome || "Antecedente", d: d.slice(0, 400), atrs,
      talento, pericias: achou.per ? periciasEm(achou.per).slice(0, 4) : [],
      ferramenta: achou.ferr ? capitalizar(achou.ferr.replace(/\.$/, "").replace(/^(um|uma)\s+/i, "")).slice(0, 60) : "",
      idiomas: achou.idi || "",
      equipA: eq.itens, poA: eq.poA, poB: eq.poB || 50,
    };
  }

  /* ---------- raça ---------- */
  const TAM = [["Miúdo", /mi[uú]d|tiny/], ["Pequeno", /pequen|small/], ["Médio", /m[eé]di|medium/], ["Grande", /grande|large/]];
  function lerRaca(txt) {
    const ls = linhas(txt);
    const nm = nomeDe(ls);
    const corpo = ls.slice(nm.i + 1);
    const tudo = norm(corpo.join(" "));
    // traços: o leitor de poderes já separa "Nome. texto" e tira Idade, Tamanho, Idiomas…
    let tracos = [];
    if (typeof window.lerPoderesColados === "function") {
      try { tracos = window.lerPoderesColados(corpo.join("\n")).poderes || []; } catch (e) { tracos = []; }
    }
    const RX_CAMPO = /^(?:tamanho|size)\s*[.:\-–]\s*(.*)$|^(?:deslocamento|velocidade|movimento|speed)\s*[.:\-–]\s*(.*)$|^(?:aumento (?:no|do|de) valor de (?:habilidade|atributo)|aumento de atributos?|atributos?|b[oô]nus de atributos?|ability score increase)\s*[.:\-–]\s*(.*)$/i;
    let tam = "", desl = "", bonusTxt = "";
    corpo.forEach((l, k) => {
      const m = l.replace(/^[-–•·*]\s+/, "").match(RX_CAMPO);
      if (!m) return;
      let v = (m[1] || m[2] || m[3] || "");
      let j = k + 1;
      while (corpo[j] && !/[.!?]$/.test(v) && !/^[-–•·*]\s/.test(corpo[j]) && !/^[A-ZÀ-Ý][^.:]{1,40}[.:]\s/.test(corpo[j]) && !RX_CAMPO.test(corpo[j])) v += " " + corpo[j++];
      if (m[1] !== undefined && !tam) { const t = TAM.find(([, rx]) => rx.test(norm(v))); if (t) tam = t[0]; }
      if (m[2] !== undefined && !desl) {
        const mm = v.match(/(\d+(?:[.,]\d+)?)\s*(m|metros|ft|p[eé]s|feet|quadrados|q)\b/i);
        if (mm) desl = /ft|p[eé]s|feet/i.test(mm[2]) ? `${String(Math.round(Number(mm[1]) * 0.3 * 10) / 10).replace(".", ",")} m` : /quadrados|^q$/i.test(mm[2]) ? `${String(Number(mm[1]) * 1.5).replace(".", ",")} m` : `${mm[1]} m`;
      }
      if (m[3] !== undefined && !bonusTxt) bonusTxt = v;
    });
    if (!tam) { const t = TAM.find(([, rx]) => new RegExp("(seu tamanho|tamanho) (e|é)?\\s*" + rx.source).test(tudo)); if (t) tam = t[0]; }
    // "+2 Destreza, +1 Carisma" · "Sua Destreza aumenta em 2 e seu Carisma em 1" · "FOR +1, CON +2"
    const bonus = {};
    const bt = norm(bonusTxt || (corpo.join(" ").match(/[^.]*(aumenta(?:m)? em \d|\+\d\s*(?:em\s+)?(?:for|des|con|int|sab|car))[^.]*/i) || [])[0] || "");
    let m;
    const rx1 = /\+?\s*(\d)\s*(?:em|na|no|de)?\s*(forca|destreza|constituicao|inteligencia|sabedoria|carisma|for|des|con|int|sab|car)\b/g;
    while ((m = rx1.exec(bt))) { const k = atrsEm(m[2])[0]; if (k && !bonus[ATR_LONGO[k]]) bonus[ATR_LONGO[k]] = Number(m[1]); }
    const rx2 = /(forca|destreza|constituicao|inteligencia|sabedoria|carisma|for|des|con|int|sab|car)\s*(?:aumenta(?:m)?\s*(?:em\s*)?|[:]?\s*\+)\s*(\d)/g;
    while ((m = rx2.exec(bt))) { const k = atrsEm(m[1])[0]; if (k && !bonus[ATR_LONGO[k]]) bonus[ATR_LONGO[k]] = Number(m[2]); }
    const rx3 = /(?:e|,)\s*(?:seu|sua)?\s*(forca|destreza|constituicao|inteligencia|sabedoria|carisma)\s+em\s+(\d)/g;
    while ((m = rx3.exec(bt))) { const k = atrsEm(m[1])[0]; if (k && !bonus[ATR_LONGO[k]]) bonus[ATR_LONGO[k]] = Number(m[2]); }
    const fora = /^(aumento (no|do|de) valor|aumento de atributo|atributos?|b[oô]nus de atributo|tamanho|deslocamento|velocidade|movimento|idade|idiomas|l[ií]nguas|tend[eê]ncia|alinhamento|sub-?ra[cç]as?)/i;
    const t = tracos.filter((p) => p.nome && !fora.test(p.nome) && norm(p.nome) !== norm(nm.nome)).map((p) => {
      const tr = { nome: p.nome, d: p.desc, a: p.acao || "passiva", r: p.recarga || "" };
      if (/igual (a|ao) seu b[oô]nus de profici[eê]ncia/i.test(p.desc)) tr.u = "pb";
      else if (p.temCargas && p.maxCargas) tr.u = p.maxCargas;
      const vn = p.desc.match(/(?:vis[aã]o no escuro|darkvision)[^.]{0,40}?(\d+(?:,\d+)?)\s*m/i);
      if (vn && /vis[aã]o no escuro|darkvision/i.test(p.nome)) tr.d = p.desc;
      return tr;
    });
    const intro = [];
    for (const l of corpo) { if (!l) { if (intro.length) break; continue; } if (/^[A-ZÀ-Ý][^.:]{1,40}[.:]\s/.test(l.replace(/^[-–•·*]\s+/, "")) || RX_CAMPO.test(l)) break; intro.push(l); }
    return { nome: nm.nome || "Raça", d: paragrafos(intro).slice(0, 300), tam: tam || "Médio", desl: desl || "9 m", bonus, t };
  }

  window.lerAntecedenteColado = lerAntecedente;
  window.lerRacaColada = lerRaca;
})();

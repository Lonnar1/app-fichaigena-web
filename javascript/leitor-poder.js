/* =====================================================================
   LEITOR-PODER.JS · Ficha Ígnea
   "Colar texto" da aba Poderes: lê magias, talentos, traços e habilidades
   do jeito que a pessoa colar (anotação, conversa, site, PDF) e devolve
   poderes no formato da ficha. Vários de uma vez também.
   ===================================================================== */
(function () {
  "use strict";

  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const NUM = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, once: 1, twice: 2 };
  const PEQ = ["de", "da", "do", "das", "dos", "e", "em", "a", "o", "com", "na", "no", "of", "the", "and", "por", "para"];
  function capitalizar(t) {
    const s = String(t || "").trim().replace(/\s+/g, " ");
    const letras = (s.match(/[A-Za-zÀ-ÿ]/g) || []).length, maius = (s.match(/[A-ZÀ-Ý]/g) || []).length;
    if (!letras || maius / letras < 0.7) return s.charAt(0).toUpperCase() + s.slice(1);
    return s.toLowerCase().split(" ").map((w, i) => (i && PEQ.includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(" ");
  }
  const ehCaixaAlta = (l) => { const le = (l.match(/[A-Za-zÀ-ÿ]/g) || []).length, ma = (l.match(/[A-ZÀ-Ý]/g) || []).length; return le >= 3 && ma / le >= 0.8; };

  /* ---------- limpeza ---------- */
  function linhas(txt) {
    let t = String(txt || "");
    if (typeof window.limparTextoColado === "function") t = window.limparTextoColado(t);
    t = t.replace(/\r/g, "").replace(/­/g, "").replace(/[​﻿]/g, "").replace(/\t/g, " ").replace(/ {2,}/g, " ");
    t = t.replace(/([a-zà-ÿ])-\n\s*([a-zà-ÿ])/g, "$1$2");
    t = t.replace(/([a-zà-ÿ]{3})(à|às)(?= )/g, "$1 $2");
    return t.split("\n").map((l) => l.trim()).filter((l, i, a) => !(/^\d{1,4}$/.test(l)) && !/^fonte\s*:/i.test(l));
  }

  /* ---------- magia: "3° nível de evocação", "Truque de ilusão", "Evocação de 3º nível", "Nível 3 Evocação", "3rd-level evocation" ---------- */
  const ESCOLAS = "abjura[cç][aã]o|adivinha[cç][aã]o|conjura[cç][aã]o|encantamento|evoca[cç][aã]o|ilus[aã]o|necromancia|transmuta[cç][aã]o|abjuration|divination|conjuration|enchantment|evocation|illusion|necromancy|transmutation";
  const RX_ESCOLA = new RegExp("^(?:truque de (" + ESCOLAS + ")|(\\d)\\s*[º°ª]?\\s*n[ií]vel,? (?:de )?(" + ESCOLAS + ")|(" + ESCOLAS + ") (?:de )?(\\d)\\s*[º°ª]?\\s*n[ií]vel|n[ií]vel (\\d)\\s*(?:de\\s+)?(" + ESCOLAS + ")|(" + ESCOLAS + ") cantrip|(\\d)(?:st|nd|rd|th)[- ]level (" + ESCOLAS + ")|level (\\d) (" + ESCOLAS + "))", "i");
  function escolaDe(l) {
    const m = String(l || "").match(RX_ESCOLA);
    if (!m) return null;
    const c = m[1] || m[8] ? 0 : Number(m[2] || m[5] || m[6] || m[9] || m[11]);
    const esc = m[1] || m[3] || m[4] || m[7] || m[8] || m[10] || m[12] || "";
    return { c, escola: capitalizar(esc.toLowerCase()), ritual: /\britual\b/i.test(l) };
  }
  const CAMPO_MAGIA = [
    ["tempo", /^(?:tempo de conjura[cç][aã]o|tempo|casting time)\s*:?\s*(.+)$/i],
    ["alcance", /^(?:alcance|range)\s*:?\s*(.+)$/i],
    ["comp", /^(?:componentes|components)\s*:?\s*(.+)$/i],
    ["duracao", /^(?:dura[cç][aã]o|duration)\s*:?\s*(.+)$/i],
    ["classes", /^(?:classes?|listas?|lista de magias)\s*:\s*(.+)$/i],
  ];

  /* ---------- o que o texto diz ---------- */
  const TIPOS = [
    [/\bfogo\b|\bfire\b/, "fogo"], [/\bfrio\b|\bcold\b/, "gelo"], [/el[eé]tric|rel[aâ]mpago|\blightning\b/, "raio"],
    [/trovejante|trov[aã]o|\bthunder\b/, "trovejante"], [/necr[oó]tic|necrotic/, "necrotico"], [/radiante|radiant/, "radiante"],
    [/veneno|poison/, "veneno"], [/ps[ií]quic|psychic/, "psiquico"], [/cortante|slashing/, "corte"], [/perfurante|piercing/, "perfurante"],
    [/concuss[aã]o|contundente|bludgeoning/, "concussao"], [/energia|\bforce\b|\bfor[cç]a\b(?= damage| de dano)/, "magico"], [/[aá]cido|\bacid\b/, "magico"],
  ];
  function analisar(d, extra) {
    const t = norm(d);
    const o = {};
    // ação
    const tempo = norm(extra && extra.tempo);
    if (tempo) o.acao = /bonus/.test(tempo) ? "bonus" : /reac/.test(tempo) ? "reacao" : /acao|action/.test(tempo) ? "acao" : "";
    else {
      // o que aparece primeiro no texto é o jeito de usar ("usa uma ação pra se transformar… termina com uma ação bônus")
      const pos = (rx) => { const m = t.match(rx); return m ? m.index : 1e9; };
      const cand = [
        ["bonus", pos(/(^|[(,;:\s])(uma |sua )?acao bonus|bonus action/)],
        ["reacao", pos(/(^|[(,;:\s])(uma |sua )?reac(ao|oes)\b|\breaction\b/)],
        ["acao", pos(/(com|como|usar|use|gastar|gaste|realizar|usando) (uma |um |sua |a )?acao\b(?! bonus| livre)|uma acao para|\bas an action\b|\buse your action\b|\btake an? \w+ action\b|^acao\b(?! bonus)/)],
        ["livre", pos(/acao livre|free action/)],
      ].sort((a, b) => a[1] - b[1]);
      o.acao = cand[0][1] < 1e9 ? cand[0][0] : /acao bonus/.test(t) ? "bonus" : "passiva";
    }
    // recarga e usos
    const frasesDesc = (t.match(/[^.!?]*(descanso|rest)[^.!?]*/g) || []).filter((f) => !/imune|immune|nao pode ser (alvo|afetad)|can.t be (targeted|affected)/.test(f) || /(recupera|usar|uso|usos|vez|vezes|novamente|regain|use|once|cargas)/.test(f));
    const tr = frasesDesc.join(". ");
    if (/a vontade|at will/.test(t)) o.recarga = "vontade";
    else if (/descanso curto ou longo|short or long rest|descanso curto|short rest/.test(tr)) o.recarga = "curto";
    else if (/descanso longo|long rest/.test(tr)) o.recarga = "longo";
    else if (/\d\s*\/\s*(dia|day)|vezes? por dia|uma vez por dia|once per day|per day/.test(t)) o.recarga = "dia";
    let usos = 0;
    const mu = t.match(/(\d)\s*\/\s*(?:dia|day|descanso)/) || t.match(/(?:usar|use|usa-la|usa-lo|usar essa caracteristica|usar este tra[cç]o)[^.]{0,40}?\b(\d+|uma|duas|tres|quatro|cinco)\s+vez(?:es)?/) || t.match(/\b(\d+|duas|tres|quatro|cinco|twice)\s+(?:vezes|times)\b[^.]{0,40}(?:descanso|rest|dia|day)/);
    if (mu) usos = Number(mu[1]) || NUM[mu[1]] || 0;
    else if (o.recarga && o.recarga !== "vontade" && /(nao pode (usa|faz|conjura)[\w-]* (essa|esse|este|esta|novamente|de novo|ate)|can.t use (it|this) again|uma vez|once)/.test(t)) usos = 1;
    if (/igual (a|ao) seu bonus de proficiencia|equal to your proficiency bonus|igual (a|ao) seu modificador/.test(t)) usos = 0; // depende da ficha: o jogador marca
    if (usos > 0 && usos <= 20) { o.temCargas = true; o.maxCargas = usos; }
    // dano / cura
    const md = d.match(/(\d+d\d+(?:\s*[+\-]\s*\d+)?)\s*(?:\)\s*)?(?:pontos? )?(?:de dano\s+)?(?:de\s+)?([a-zà-ÿ]+)?/i);
    if (md) {
      o.dano = md[1].replace(/\s+/g, "");
      const depois = norm(d.slice(md.index, md.index + 60));
      const cura = /(recupera|recuperar|cura|regain|heal)/.test(norm(d.slice(Math.max(0, md.index - 60), md.index + 40))) || /^\s*(pv|pontos de vida|hit points)/i.test(d.slice(md.index + md[1].length, md.index + md[1].length + 20));
      o.tipo = cura ? "cura" : (TIPOS.find(([rx]) => rx.test(depois)) || [])[1] || "";
    } else if (/(recupera|recuperar|regain)\w* [^.]{0,30}pontos de vida|hit points/.test(t) && /(recupera|regain)/.test(t)) o.tipo = "cura";
    // alcance e duração soltos no texto
    if (!(extra && extra.alcance)) {
      const ma = d.match(/\ba at[eé] ([\d,]+\s*(?:m|metros))\b/i) || d.match(/\bwithin (\d+) (?:feet|ft)/i) || d.match(/\braio de ([\d,]+\s*(?:m|metros))/i);
      if (ma) o.alcance = /feet|ft/i.test(ma[0]) ? `${Math.round(Number(ma[1]) * 0.3 * 10) / 10} m`.replace(".", ",") : ma[1].replace(/\s*metros/, " m");
      else if (/\b(toque|touch)\b/.test(t) && /(toca|toque|touch)/.test(t.slice(0, 120))) o.alcance = "Toque";
    }
    if (!(extra && extra.duracao)) {
      const mdu = d.match(/\b(?:dura(?:r)?|por|for)\s+(1 minuto|10 minutos|1 hora|8 horas|24 horas|\d+ (?:rodadas?|minutos?|horas?|dias?|rounds?|minutes?|hours?))\b/i);
      if (mdu) o.duracao = mdu[1];
    }
    return o;
  }

  /* ---------- uma magia ---------- */
  function lerMagia(nome, esc, corpo) {
    const campos = {};
    const resto = [];
    let i = 0;
    for (; i < corpo.length; i++) {
      const l = corpo[i];
      const cp = CAMPO_MAGIA.find(([, rx]) => rx.test(l));
      if (cp && Object.keys(campos).length < 6) {
        let v = l.match(cp[1])[1].trim();
        // componentes quebrados em duas linhas: "M (uma bola de guano de" / "morcego e enxofre)"
        while (corpo[i + 1] && (v.split("(").length > v.split(")").length || /[,(]$/.test(v)) && !CAMPO_MAGIA.some(([, rx]) => rx.test(corpo[i + 1]))) v += " " + corpo[++i];
        campos[cp[0]] = v;
        continue;
      }
      if (!Object.keys(campos).length && i < 2) continue;
      resto.push(...corpo.slice(i));
      break;
    }
    const desc = paragrafos(resto);
    const comp = norm(campos.comp || "");
    const dur = campos.duracao || "";
    const an = analisar(desc, { tempo: campos.tempo, alcance: campos.alcance, duracao: dur });
    const tempoN = norm(campos.tempo || "");
    return {
      nome: capitalizar(nome.replace(/\s*\((?:ritual|evoca\w*|abjura\w*|adivinha\w*|conjura\w*|encanta\w*|ilus\w*|necro\w*|transmuta\w*)\)\s*$/i, "")),
      circulo: String(esc.c),
      acao: campos.tempo ? (/bonus/.test(tempoN) ? "bonus" : /reac|reaction/.test(tempoN) ? "reacao" : /acao|action/.test(tempoN) ? "acao" : "") : an.acao,
      recarga: "", origem: "", tipo: an.tipo || "", dano: an.dano || "",
      alcance: (campos.alcance || "").replace(/\s*metros?\b/i, " m").replace(/\s{2,}/g, " "),
      duracao: dur.replace(/^concentra[cç][aã]o,?\s*/i, "").replace(/^(até|up to)\s+/i, (m) => m).replace(/^./, (c) => c.toUpperCase()),
      tempo: campos.tempo || "",
      desc: [desc, campos.classes ? `Listas: ${campos.classes}` : ""].filter(Boolean).join("\n\n"),
      temCargas: false, maxCargas: 0,
      componentes: { v: /\bv\b/.test(comp), s: /\bs\b/.test(comp), m: /\bm\b/.test(comp) },
      concentracao: /concentra/i.test(dur), ritual: esc.ritual || /\britual\b/i.test(nome),
      _escola: esc.escola, _magia: true,
    };
  }

  /* ---------- parágrafos: junta linhas quebradas no meio da frase ---------- */
  function paragrafos(ls) {
    const out = [];
    ls.forEach((l) => {
      if (!l) { if (out.length && out[out.length - 1] !== "") out.push(""); return; }
      const u = out[out.length - 1];
      const novo = !u || /[.!?:]["”)]?$/.test(u) || /^[-–•·*]\s/.test(l) || /^(em n[ií]veis superiores|at higher levels|usando um espa[cç]o|pr[eé]-requisito)/i.test(l);
      if (u !== undefined && u !== "" && !novo) out[out.length - 1] = u + " " + l;
      else out.push(l);
    });
    return out.filter((x, i, a) => x || (i && a[i - 1])).join("\n").replace(/\n{2,}/g, "\n\n").trim();
  }

  /* ---------- entradas "Nome. texto" e "Nome: texto" ---------- */
  const PRON = /^(o|a|os|as|um|uma|se|ele|ela|eles|elas|quando|enquanto|cada|essa|esse|este|esta|isso|voc[eê]|caso|ap[oó]s|at[eé]|seu|sua|seus|suas|the|if|it|its|an|when|while|each|this|that|on|until|after|you|your|como|com|para|por|no|na|em|de|ao|à)$/i;
  const CAMPOS_NAO = /^(pr[eé]-requisito|prerequisite|tempo de conjura|alcance|componentes|dura[cç][aã]o|casting time|range|components|duration|classes?|listas?|fonte|source|n[ií]vel|level|dano|damage|a[cç][aã]o|recarga|usos|custo|cd|teste)$/i;
  function entrada(l, ant, forte) {
    const ok = !ant || /[.!?:]["”)]?$/.test(ant) || forte;
    if (!ok) return null;
    const bala = /^[-–•·*]\s+/.test(l);
    const x = l.replace(/^[-–•·*]\s+/, "");
    const m = x.match(/^([A-ZÀ-Ý0-9][^.:!?]{1,60}?)\s*([.:])\s+(\S.*)$/) || x.match(/^([A-ZÀ-Ý][^.:!?]{1,60}?)\s*[–—]\s+(\S.*)$/);
    if (!m) return null;
    const nome = m[1].trim(), txt = m[3] || m[2];
    const ws = nome.replace(/\(.*?\)/g, "").trim().split(/\s+/);
    if (ws.length > 7 || PRON.test(ws[0]) || CAMPOS_NAO.test(nome.replace(/\(.*?\)/g, "").trim())) return null;
    const minusc = ws.slice(1).filter((w) => /^[a-zà-ÿ]{4,}/.test(w)).length;
    if (m[2] === "." && minusc > Math.max(1, Math.floor(ws.length / 2))) return null;
    if (m[2] === ":" && !bala && minusc > Math.max(2, ws.length - 1)) return null;
    return { nome, txt, bala };
  }

  /* ---------- título solto: "ACROBATA", "Sentinela" + "Pré-requisito: …" ---------- */
  function ehTitulo(l, prox, ant) {
    if (!l || l.length > 60 || /[.,;:!?]$/.test(l) || RX_ESCOLA.test(l)) return false;
    const ws = l.split(/\s+/);
    if (ws.length > 7) return false;
    if (/^pr[eé]-requisito|^prerequisite/i.test(prox || "")) return true;
    if (ehCaixaAlta(l)) return true;
    // "Título" curto entre um texto que terminou e outro que começa
    return ws.length <= 5 && /^[A-ZÀ-Ý]/.test(l) && ws.filter((w) => /^[A-ZÀ-Ý]/.test(w) || PEQ.includes(w.toLowerCase())).length === ws.length && (!ant || /[.!?]["”)]?$/.test(ant)) && prox && /^[A-ZÀ-Ý]/.test(prox) && !entrada(l, ant);
  }
  const SECAO = /^(talentos?|feats?|ra[cç]as?|tra[cç]os( raciais)?|caracter[ií]sticas( raciais)?|habilidades|poderes|magias|spells|truques|cantrips|lista de magias)$/i;

  /* ---------- glossário do próprio texto: "habilidades Imediatas (efeito instantâneo) ou Prolongadas (ativas por 1 minuto)", "usam Pontos de Domínio" ---------- */
  const radTag = (w) => norm(w).replace(/[^a-z]/g, "").slice(0, 5);
  function glossario(txt) {
    const g = { tags: {}, custo: "" };
    const t = String(txt || "");
    const rx = /([A-Za-zÀ-ÿ]{4,})\s*\(([^()]{3,160})\)/g;
    let m;
    while ((m = rx.exec(t))) {
      const def = norm(m[2]);
      const dur = /instant/.test(def) ? "Instantânea" : (def.match(/(?:por|durante|for)\s+(\d+\s+(?:rodadas?|minutos?|horas?|rounds?|minutes?|hours?))/) || [])[1];
      if (dur) g.tags[radTag(m[1])] = { dur: dur.replace(/^./, (c) => c.toUpperCase()), def: m[2].trim() };
    }
    const c = t.match(/\b(?:usam|gastam|custam|consomem|use|cost)\s+((?:pontos?|points?) (?:de |of )?[A-ZÀ-Ýa-zà-ÿ]+)/i);
    if (c) g.custo = c[1].replace(/^./, (x) => x.toUpperCase());
    return g;
  }
  let ctxLeitura = { glos: { tags: {}, custo: "" } };

  function poderSimples(nome, linhasTxt, origem, pre, grupo) {
    const desc = paragrafos(linhasTxt);
    const an = analisar(desc);
    let nm = nome, d = desc, tag = "";
    // "(ação bônus, 1/descanso curto)" no nome vira campo
    const par = nm.match(/\s*\(([^)]*)\)\s*$/);
    if (par && /(a[cç][aã]o|bonus|rea[cç][aã]o|descanso|\/dia|recarga|vontade|vez)/i.test(par[1])) {
      const p = analisar(par[1]);
      if (p.acao !== "passiva") an.acao = p.acao;
      if (p.recarga) an.recarga = p.recarga;
      if (p.temCargas) { an.temCargas = true; an.maxCargas = p.maxCargas; }
      nm = nm.slice(0, par.index);
    } else if (par && par[1].trim().split(/\s+/).length <= 3 && /^[A-Za-zÀ-ÿ ]+$/.test(par[1].trim())) {
      // "Atleta (Prolongado)": etiqueta do sistema da mesa, sai do nome e vai pra descrição
      tag = capitalizar(par[1].trim());
      nm = nm.slice(0, par.index);
    }
    const gl = ctxLeitura.glos.tags[radTag(tag)];
    if (gl && !an.duracao) an.duracao = gl.dur;
    d = d.charAt(0).toUpperCase() + d.slice(1);
    const cab = [grupo ? capitalizar(grupo) : "", tag ? `${tag}${gl && gl.dur !== "Instantânea" ? ` (${gl.dur})` : ""}` : "", tag && ctxLeitura.glos.custo ? `gasta ${ctxLeitura.glos.custo}` : ""].filter(Boolean).join(" · ");
    if (cab) d = `${cab}\n\n${d}`;
    if (pre) d = `Pré-requisito: ${pre}\n\n${d}`;
    return {
      nome: capitalizar(nm), circulo: "", acao: an.acao || "", recarga: an.recarga || "", origem: origem || "",
      tipo: an.tipo || "", dano: an.dano || "", alcance: an.alcance || "", duracao: an.duracao || "", tempo: "",
      desc: d, temCargas: !!an.temCargas, maxCargas: an.maxCargas || 0, componentes: {}, concentracao: false, ritual: false,
    };
  }

  /* ---------- texto inteiro ---------- */
  function ler(txt) {
    const ls = linhas(txt);
    const cheias = ls.filter(Boolean);
    if (!cheias.length) return { poderes: [], modo: "" };
    ctxLeitura = { glos: glossario(cheias.join(" ")) };
    const out = [];

    // 1) magias: cada uma começa no nome logo acima da linha "3° nível de evocação"
    const iEsc = [];
    ls.forEach((l, k) => { if (escolaDe(l) && l.length < 70) iEsc.push(k); });
    if (iEsc.length) {
      const inicios = iEsc.map((k) => { let u = k - 1; while (u >= 0 && !ls[u]) u--; return u; });
      inicios.forEach((ini, j) => {
        if (ini < 0) return;
        const fim = j + 1 < inicios.length ? inicios[j + 1] : ls.length;
        const nome = ls[ini].replace(/\s*\((?:ritual)\)\s*$/i, "");
        out.push(lerMagia(nome, escolaDe(ls[iEsc[j]]), ls.slice(iEsc[j] + 1, fim)));
      });
      // o que vier antes da primeira magia e for um poder solto
      return { poderes: out, modo: "magias" };
    }

    // 2) títulos soltos (talentos, habilidades com título em linha própria)
    const titulos = [];
    let secao = "";
    ls.forEach((l, k) => {
      const ant = ls.slice(0, k).reverse().find(Boolean) || "", prox = ls.slice(k + 1).find(Boolean) || "";
      if (SECAO.test(l.trim())) { secao = norm(l); titulos.push({ k, secao: true, nome: l }); return; }
      if (ehTitulo(l, prox, ant)) titulos.push({ k, nome: l, secaoAtual: secao });
    });
    // "DOMÍNIOS" seguido de "DOMÍNIO DO CORPO", "DOMÍNIO DA MENTE"…: é o título do sistema (explicação), não um poder
    const radT = (x) => norm(x).replace(/[^a-z ]/g, "").trim();
    const reais = titulos.filter((t) => !t.secao).filter((t, j, arr) => {
      const r = radT(t.nome).replace(/s$/, "");
      // bloco que só explica o sistema ("habilidades Rápidas (…) ou Longas (…)") também não é poder
      const px = titulos.find((x) => x.k > t.k), corpoT = ls.slice(t.k + 1, px ? px.k : ls.length);
      if (Object.keys(glossario(corpoT.join(" ")).tags).length >= 2 && entradasDe(corpoT).length < 2) return false;
      if (!(r.length >= 4 && !r.includes(" ") && arr.filter((o, k) => k > j && radT(o.nome).startsWith(r + " ")).length >= 2)) return true;
      // com habilidades no corpo ("AASIMAR" e depois "AASIMAR PROTETOR") continua valendo
      const prox = titulos.find((x) => x.k > t.k);
      return entradasDe(ls.slice(t.k + 1, prox ? prox.k : ls.length)).length >= 2;
    });
    if (reais.length) {
      reais.forEach((t, j) => {
        const prox = titulos.find((x) => x.k > t.k);
        const corpo = ls.slice(t.k + 1, prox ? prox.k : ls.length);
        let pre = "";
        const ip = corpo.findIndex((l) => /^pr[eé]-requisito|^prerequisite/i.test(l));
        if (ip >= 0 && ip < 2) {
          pre = corpo[ip].replace(/^pr[eé]-requisitos?\s*:?\s*|^prerequisites?\s*:?\s*/i, "");
          let k = ip + 1;
          while (corpo[k] && /^[a-zà-ÿ(]/.test(corpo[k])) pre += " " + corpo[k++];
          corpo.splice(ip, k - ip);
        }
        const sec = t.secaoAtual || "";
        // várias "Nome. texto" dentro do título (uma raça e seus traços): cada uma vira um poder
        const ent = entradasDe(corpo);
        if (ent.length >= 2 && !pre && !/talento|feat/.test(sec)) {
          // marcador sem nome antes das habilidades ("* Aumente sua Força em 1"): é o que o grupo dá de base
          const i0 = corpo.findIndex((l) => entrada(l, "", true));
          const base = corpo.slice(0, Math.max(0, i0)).filter((l) => /^[-–•·*]\s+/.test(l)).map((l) => l.replace(/^[-–•·*]\s+/, ""));
          if (base.length) out.push(poderSimples(t.nome, base, "", "", ""));
          const grupo = /^[A-ZÀ-Ý]/.test(t.nome) && t.nome.split(/\s+/).length <= 5 ? t.nome : "";
          ent.forEach((e) => out.push(poderSimples(e.nome, e.linhas, /ra[cç]a|tra[cç]o/.test(sec) || ent.some((x) => /^(idade|tamanho|deslocamento|idiomas|tend[eê]ncia|alinhamento)$/i.test(x.nome.trim())) ? "raca" : "", "", grupo)));
          return;
        }
        if (!corpo.some(Boolean)) return;
        out.push(poderSimples(t.nome, corpo, /talento|feat/.test(sec) || pre ? "talento" : /ra[cç]a|tra[cç]o/.test(sec) ? "raca" : "", pre));
      });
      return { poderes: limparTracosDescritivos(out), modo: "titulos" };
    }

    // 3) entradas "Nome. texto" / "Nome: texto" / "- Nome: texto"
    const ent = entradasDe(ls);
    if (ent.length) {
      ent.forEach((e) => out.push(poderSimples(e.nome, e.linhas, "", "")));
      return { poderes: limparTracosDescritivos(out), modo: "entradas" };
    }

    // 4) um poder só: primeira linha curta = nome
    const primeira = cheias[0];
    if (primeira.length <= 60 && !/[.!?]$/.test(primeira) && cheias.length > 1) out.push(poderSimples(primeira, ls.slice(ls.indexOf(primeira) + 1), "", ""));
    else out.push(poderSimples("Poder", ls, "", ""));
    return { poderes: out, modo: "um" };
  }
  function entradasDe(ls) {
    const ent = [];
    let atual = null;
    ls.forEach((l, k) => {
      if (!l) { if (atual) atual.linhas.push(""); return; }
      const ant = ls.slice(0, k).reverse().find(Boolean) || "";
      const e = entrada(l, ant, !atual || /^[-–•·*]\s+/.test(l));
      if (e) { atual = { nome: e.nome, linhas: [e.txt] }; ent.push(atual); return; }
      if (atual) atual.linhas.push(l);
    });
    return ent;
  }
  // "Idade", "Tamanho", "Tendência"… de uma raça são informação, não poder: ficam fora
  function limparTracosDescritivos(l) {
    return l.filter((p) => !/^(idade|tamanho|tend[eê]ncia|alinhamento|nomes?|age|size|alignment|names?|aumento (no|do|de) valor de habilidade|ability score increase|sub-?ra[cç]as?|subraces?|deslocamento|idiomas|l[ií]nguas|speed|languages)$/i.test(p.nome));
  }

  window.lerPoderesColados = ler;
  window._leitorPoder = { escolaDe, analisar, entradasDe };
})();

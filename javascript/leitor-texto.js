/* =====================================================================
   LEITOR-TEXTO.JS · Ficha Ígnea
   Lê um texto colado (anotação, conversa, site, PDF) e tenta montar uma classe
   ou subclasse: níveis, habilidades, usos, recarga, dado de vida etc.
   Nada sai daqui sem passar pela tela de revisão do editor.
   ===================================================================== */
(function () {
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

  const ATRS = [
    ["for", /\b(forca|strength|str)\b/],
    ["des", /\b(destreza|dexterity|dex)\b/],
    ["con", /\b(constituicao|constitution|con)\b/],
    ["int", /\b(inteligencia|intelligence|int)\b/],
    ["sab", /\b(sabedoria|wisdom|wis)\b/],
    ["car", /\b(carisma|charisma|cha)\b/],
  ];
  const atrsEm = (txt) => { const t = norm(txt); return ATRS.filter(([, r]) => r.test(t)).map(([k]) => k); };
  const NUM_PAL = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, once: 1, twice: 2 };
  const numDe = (s) => { const t = norm(s); return /^\d+$/.test(t) ? Number(t) : NUM_PAL[t] || 0; };

  // nomes alternativos das perícias (outras traduções e inglês)
  const PER_ALIAS = {
    "adestrar animais": "Lidar com Animais", "animal handling": "Lidar com Animais", "trato com animais": "Lidar com Animais",
    "acrobatics": "Acrobacia", "arcana": "Arcanismo", "athletics": "Atletismo", "deception": "Enganação", "history": "História", "insight": "Intuição",
    "intimidation": "Intimidação", "investigation": "Investigação", "medicine": "Medicina", "nature": "Natureza", "perception": "Percepção",
    "performance": "Atuação", "persuasion": "Persuasão", "religion": "Religião", "sleight of hand": "Prestidigitação", "stealth": "Furtividade", "survival": "Sobrevivência",
    "furtividade": "Furtividade", "atuacao": "Atuação", "performance (atuacao)": "Atuação", "blefar": "Enganação", "enganacao": "Enganação",
  };
  function periciasEm(txt) {
    const t = norm(txt), out = [];
    const lista = typeof PERICIAS_IGNEA !== "undefined" ? PERICIAS_IGNEA : [];
    lista.forEach((p) => { if (t.includes(norm(p))) out.push(p); });
    Object.entries(PER_ALIAS).forEach(([k, v]) => { if (t.includes(k) && !out.includes(v)) out.push(v); });
    return out;
  }

  /* ---------- títulos com nível ---------- */
  const SUF = "(?:\\s*(?:º|°|ª|o|st|nd|rd|th))?";
  const RX_TITULO = [
    // Nível 3: Nome · Level 3 - Nome
    [new RegExp("^(?:n[ií]vel|level)\\s*(\\d{1,2})" + SUF + "\\s*[:\\-–—.]\\s*(.+)$", "i"), (m) => [m[1], m[2]]],
    // 3º nível: Nome · 3rd level: Nome · 3rd-Level Feature: Nome
    [new RegExp("^(\\d{1,2})" + SUF + "[\\s-]*(?:n[ií]vel|level)(?:\\s*feature)?\\s*[:\\-–—.]\\s*(.+)$", "i"), (m) => [m[1], m[2]]],
    // Nome (Nível 3) · Nome [3º nível]
    [new RegExp("^(.{2,70}?)\\s*[\\(\\[]\\s*(?:n[ií]vel|level)\\s*(\\d{1,2})" + SUF + "\\s*[\\)\\]]\\s*$", "i"), (m) => [m[2], m[1]]],
    [new RegExp("^(.{2,70}?)\\s*[\\(\\[]\\s*(\\d{1,2})" + SUF + "\\s*(?:n[ií]vel|level)\\s*[\\)\\]]\\s*$", "i"), (m) => [m[2], m[1]]],
  ];
  function tituloComNivel(l) {
    for (const [rx, f] of RX_TITULO) {
      const m = l.match(rx);
      if (!m) continue;
      const [n, nome] = f(m);
      const nv = Number(n);
      if (nv < 1 || nv > 20) continue;
      let nm = nome.trim(), resto = "";
      { const dp = nm.match(/^([^:.!?]{1,55}?)\s*:\s+(\S.*)$/); if (dp) { nm = dp[1]; resto = dp[2]; } }
      if (nm.length > 70) { const i = nm.search(/[.!?]\s/); if (i > 0 && i < 70) { resto = nm.slice(i + 1).trim(); nm = nm.slice(0, i); } else continue; }
      return { n: nv, nome: nm.replace(/[.:]+$/, "").trim(), resto };
    }
    return null;
  }
  // nível escrito no começo do texto da habilidade
  const RX_NIVEL_TEXTO = new RegExp("(?:a partir do|comecando no|comecando a partir do|quando (?:voce )?(?:alcanca|alcancar|atinge|atingir|chega ao|chegar ao)|ao (?:alcancar|atingir|chegar ao)|no|starting at|beginning at|at|when you reach)\\s+(?:o\\s+)?(\\d{1,2})" + SUF + "[\\s-]*(?:nivel|level)", "i");
  const RX_NIVEL_TEXTO2 = /\b(\d{1,2})(?:st|nd|rd|th)[\s-]level\b/i;
  function nivelNoTexto(t) {
    if (/^\s*(pr[ée]-?requisitos?|prerequisite|item)\s*:/i.test(t)) return 0; // opção com pré-requisito, não habilidade
    // erros comuns de OCR: "rúvel"/"mvel" = nível, "3<>"/"3!!"/"3�" = 3º
    const s = norm(t.slice(0, 260)).replace(/\b(ruvel|mvel|nfvel|nlvel|nivei|nivcl)\b/g, "nivel").replace(/(\d)\s*(<>|!!|\ufffd|"|\?)/g, "$1º");
    const m = s.match(RX_NIVEL_TEXTO) || s.match(RX_NIVEL_TEXTO2) || s.match(/(?:^|\s)(?:no|ao alcancar o|a partir do|quando (?:voce )?(?:alcanca|atinge) o) nivel (\d{1,2})\b/);
    const n = m ? Number(m[1]) : 0;
    return n >= 1 && n <= 20 ? n : 0;
  }

  // linha da tabela da classe: "3º +2 Escolha de Subclasse, Fúria ..."
  const RX_TABELA = new RegExp("^(\\d{1,2})" + SUF + "\\s+\\+\\s?(\\d)\\s+(.+)$", "i");

  /* ---------- campos da classe ---------- */
  const CAMPOS = [
    ["dv", /^(?:dados? de vida|dado de pontos de vida|hit (?:die|dice|point die)|dv)\b\s*[:\-–]?\s*(.*)$/i],
    ["saves", /^(?:testes? de resist[eê]ncia|salvaguardas?|saving throws?)(?:\s+proficientes?)?\s*[:\-–]\s*(.*)$/i],
    ["prim", /^(?:atributos? principa(?:l|is)|atributo prim[aá]rio|primary abilit(?:y|ies))\s*[:\-–]\s*(.*)$/i],
    ["per", /^(?:per[ií]cias(?:\s+proficientes)?|profici[eê]ncia em per[ií]cias|skills?(?: proficiencies)?)\s*[:\-–]\s*(.*)$/i],
    ["armas", /^(?:armas|treinamento com armas|profici[eê]ncia (?:com|em) armas|weapons?(?: proficiencies)?)\s*[:\-–]\s*(.*)$/i],
    ["armaduras", /^(?:armaduras?|treinamento (?:com|em) armaduras?|profici[eê]ncia (?:com|em) armaduras?|armor(?: training| proficiencies)?)\s*[:\-–]\s*(.*)$/i],
    ["ferr", /^(?:ferramentas|tools?(?: proficiencies)?)\s*[:\-–]\s*(.*)$/i],
  ];

  const RX_ASI = /(?:aumento|incremento) (?:no|do|de) valor de (?:habilidade|atributo)|aumento de (?:habilidade|atributo)|melhoria de atributo|ability score improvement/i;
  const RX_DADIVA = /d[aá]diva [ée]pica|epic boon/i;
  const RX_SUBF = /caracter[ií]stica de subclasse|habilidade de subclasse|subclass feature|^subclasse\b|subclass$|escolha de subclasse|^subclasse de|\bsubclass\b/i;

  /* ---------- usos, recarga e ação ---------- */
  function analisar(nome, d) {
    const t = norm(d);
    let a = "passiva";
    if (/acao bonus|bonus action/.test(t)) a = "bonus";
    else if (/\breacao\b|\breaction\b/.test(t)) a = "reacao";
    else if (/(como|usar|use|gastar|gasta|com) (uma |um |sua )?acao\b|acao (de )?(usar )?magia|magic action|\btake an? .{0,15}action|\bas an action\b|\bthe attack action\b|^acao\b|^(uma )?acao[,:]/.test(t)) a = "acao";
    let u = "", r = "";
    if (/numero de vezes igual (a|ao) seu bonus de proficiencia|number of times equal to your proficiency bonus|vezes igual ao seu bonus de proficiencia/.test(t)) u = "pb";
    else {
      const m = t.match(/(?:numero de vezes|vezes) igual (?:a|ao) (?:seu )?modificador de (\w+)/) || t.match(/number of times equal to your (\w+) modifier/);
      if (m) { const k = atrsEm(m[1])[0]; if (k) u = k; }
    }
    if (!u && /descanso|rest/.test(t)) {
      const m = t.match(/(\d|uma|duas|tres|quatro|cinco|once|twice|one|two|three) (?:vez|vezes|time|times)\b[^.]{0,60}(descanso|rest)/) || t.match(/\b(once|twice)\b[^.]{0,60}rest/);
      const so1 = t.search(/(nao pode|nao podera|can't|cannot) (usar|use|utilizar|usa-la|utiliza-la|usa-lo|utiliza-lo|fazer|faze-lo)[^.]{0,60}(novamente|de novo|again)/);
      if (so1 >= 0 && (!m || so1 < m.index)) u = 1;
      else if (m) u = numDe(m[1]) || "";
      else if (/(nao pode|nao podera|can't|cannot) (usar|use|utilizar|usa-la|utiliza-la|usa-lo|utiliza-lo|fazer|faze-lo)|(ate|until|antes de) (terminar|realizar|completar|you finish)|(precisa|need|deve|must) (de )?(terminar|realizar|completar|finish)? ?(um|a) (descanso|short|long)|(precisa|need) (de )?(um|a) descanso/.test(t)) u = 1;
    }
    if (u) r = /descanso curto|short rest|short or long rest/.test(t) ? "curto" : "longo";
    return { a, u, r };
  }

  const PEQ = ["de", "da", "do", "das", "dos", "e", "a", "o", "em", "of", "the", "and", "to"];
  function capitalizar(s) {
    const letras = (s.match(/[A-Za-zÀ-ÿ]/g) || []).length, maius = (s.match(/[A-ZÀ-Ý]/g) || []).length;
    if (!letras || (s !== s.toUpperCase() && maius / letras < 0.7)) return s;
    return s.toLowerCase().split(" ").map((w, i) => (i && PEQ.includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(" ");
  }

  /* ---------- texto de conversa (WhatsApp, Discord, bloco de notas) ---------- */
  // tira o "[21:03, 10/11/2026] Fulano:", os *negritos*, os emojis e os marcadores de lista
  function limparColado(txt) {
    return String(txt || "").replace(/\r/g, "").split("\n").map((l) => {
      let x = l
        .replace(/^\s*\[\s*\d{1,2}[\/:.h]\d{1,2}[^\]\n]{0,30}\]\s*[^:\n]{1,40}?:\s?/, "") // [10/11/2026 21:03] Nome: · [22:12, 10/11/2026] Nome:
        .replace(/^\s*\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}\s*[-–]\s*[^:\n]{1,40}?:\s?/, "") // 10/11/2026 21:03 - Nome:
        .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}️‍⃣]/gu, "")
        .replace(/^\s*#{1,6}\s+/, "")
        .replace(/\*\*|__/g, "")
        .replace(/(^|[\s(\[“"])[*_~]([^*_~\n]+?)[*_~](?=[\s.,:;!?)\]”"]|$)/g, "$1$2")
        .replace(/^\s*>\s?/, "")
        .replace(/!?\[([^\]\n]*)\]\((?:https?:\/\/|\/|#)[^)\s]*\)/g, "$1") // [texto](link) de site/markdown
        .replace(/<(?:https?:\/\/)[^>\s]+>/g, "")
        .replace(/\s*\bhttps?:\/\/\S+/g, "");
      return x.replace(/\s+$/, "");
    }).join("\n");
  }
  // "Nível 3 - Uivo: texto", ou "Nível 3" sozinho com a lista embaixo: vira "Nível 3: Uivo" + texto
  function niveisColados(txt) {
    const out = [];
    let nv = 0;
    const RX_NV_SO = /^\s*(?:n[ií]vel|nv\.?|lv\.?|lvl\.?|level)\s*(\d{1,2})\s*[º°ª]?\s*:?\s*$/i;
    const RX_NV_ITEM = /^\s*(?:[-–—•·*]\s*)?(?:n[ií]vel|nv\.?|lv\.?|lvl\.?|level)\s*(\d{1,2})\s*[º°ª]?\s*[-–—:.)]\s*(.+)$/i;
    const RX_ITEM = /^\s*(?:[-–—•·*]\s+)?([A-ZÀ-Ý][^:.!?]{1,55}?)\s*[:–—]\s+(\S.*)$/;
    const RX_ITEM_SO = /^\s*[-–—•·*]\s+([A-ZÀ-Ý][^:.!?]{1,60})\s*$/;
    const ehCampoCol = (n) => /^(dado de vida|dados? de vida|pv|pontos de vida|hit|salvaguardas?|testes? de resist|per[ií]cias|armaduras?|armas|ferramentas|equipamento|atributo|conjura|magias|truques|ca|nd|idiomas|sentidos|deslocamento|subclasse|classe)\b/i.test(n);
    txt.split("\n").forEach((l) => {
      let m;
      if ((m = l.match(RX_NV_SO))) { nv = Number(m[1]); return; }
      if ((m = l.match(RX_NV_ITEM))) {
        const it = m[2].match(/^([^:.!?]{1,55}?)\s*[:–—]\s+(\S.*)$/);
        if (it) { out.push(`Nível ${m[1]}: ${it[1].trim()}`, it[2]); return; }
        out.push(`Nível ${m[1]}: ${m[2].trim()}`); return;
      }
      if (nv && (m = l.match(RX_ITEM)) && !ehCampoCol(m[1]) && m[1].split(/\s+/).length <= 7) { out.push(`Nível ${nv}: ${m[1].trim()}`, m[2]); return; }
      if (nv && (m = l.match(RX_ITEM_SO)) && !ehCampoCol(m[1]) && m[1].split(/\s+/).length <= 8) { out.push(`Nível ${nv}: ${m[1].trim()}`); return; }
      if (/^\s*$/.test(l) || /^(sub)?classes?\b|^trilhas?\b|^arqu[eé]tipos?\b|^caminhos?\b/i.test(l.trim()) && l.trim().split(/\s+/).length <= 2) { if (!/^\s*$/.test(l)) nv = 0; }
      // título de subclasse/classe solto no meio da conversa encerra a lista do nível
      if (nv && l.trim() && !/^\s*[-–—•·*]/.test(l) && !RX_ITEM.test(l) && l.trim().split(/\s+/).length <= 6 && !/[.!?,;]$/.test(l.trim())) nv = 0;
      out.push(l);
    });
    return out.join("\n");
  }

  /* ---------- limpeza do texto ---------- */
  function linhas(txt) {
    let t = String(txt || "").replace(/\r/g, "").replace(/­/g, "").replace(/[​﻿]/g, "").replace(/\t/g, " ").replace(/ {2,}/g, " ");
    t = t.replace(/([a-zà-ÿ])-\n\s*([a-zà-ÿ])/g, "$1$2"); // palavra quebrada com hífen
    t = t.replace(/([a-zà-ÿ]{3})(à|às)(?= )/g, "$1 $2"); // "Resistênciaà Magia": crase grudada pelo PDF
    // letra separada pelo PDF ("T rilha", "V ocê")
    t = t.replace(/(^|[\s(“"])([TVWYPF]) ([a-zà-ÿ]{2,})/gm, "$1$2$3");
    let ls = t.split("\n").map((l) => l.replace(/[\uf000-\uf8ff]/g, "•").replace(/^\s*[•●▪■◆♦\-–]\s*/, "• ").trim());
    for (let i = 0; i < ls.length - 1; i++) {
      // "…nível da T" / "rilha da Besta"
      if (/(^|\s)[TVWYPF]$/.test(ls[i]) && /^[a-zà-ÿ]/.test(ls[i + 1])) { ls[i] = ls[i] + ls[i + 1]; ls.splice(i + 1, 1); i--; continue; }
      // pontuação sozinha numa linha
      if (i > 0 && /^[.,;:!?”"]+$/.test(ls[i])) { ls[i - 1] = ls[i - 1] + ls[i]; ls.splice(i, 1); i -= 2; continue; }
    }
    // título em caixa alta com letras soltas pelo OCR: "DISPARO ARCA N O" → "DISPARO ARCANO"
    const COMUNS = new Set(["DE", "DA", "DO", "DAS", "DOS", "E", "A", "O", "OS", "AS", "NO", "NA", "EM", "UM", "AO", "OU", "OF", "THE", "AND"]);
    ls = ls.map((l) => {
      const letras = (l.match(/[A-Za-zÀ-ÿ]/g) || []).length, maius = (l.match(/[A-ZÀ-Ý]/g) || []).length;
      if (!letras || maius / letras < 0.7 || l.length > 60) return l;
      const tk = l.split(/\s+/);
      if (!tk.some((t) => /^[A-ZÀ-Ý]$/.test(t) && !/^[EAO]$/.test(t))) return l;
      const out = [];
      tk.forEach((t) => {
        const ant = out[out.length - 1];
        const solta = /^[A-ZÀ-Ý]{1,2}$/.test(t) && !COMUNS.has(t);
        const curtaComum = /^[A-ZÀ-Ý]$/.test(t);
        if (ant && (solta || (curtaComum && !COMUNS.has(ant))) && /[A-ZÀ-Ý]{2,}$/.test(ant) && !COMUNS.has(ant)) out[out.length - 1] = ant + t;
        else out.push(t);
      });
      return out.join(" ");
    });
    // título em caixa alta quebrado pelo OCR ("TEM PESTADE", "CONSU LTAR", "ESP1R1TUAL"): junta usando as palavras do próprio texto
    const vocab = new Set();
    ls.forEach((l) => { const lt = (l.match(/[A-Za-zÀ-ÿ]/g) || []).length; if (lt && (l.match(/[A-ZÀ-Ý]/g) || []).length / lt < 0.5) norm(l).split(/[^a-z]+/).forEach((w) => { if (w.length >= 4) vocab.add(w); }); });
    const nw = (w) => norm(w).replace(/[^a-z]/g, "");
    ls = ls.map((l) => {
      const letras = (l.match(/[A-Za-zÀ-ÿ]/g) || []).length, maius = (l.match(/[A-ZÀ-Ý]/g) || []).length;
      if (!letras || maius / letras < 0.7 || l.length > 70) return l;
      let tk = l.replace(/([A-ZÀ-Ý])1(?=[A-ZÀ-Ý])/g, "$1I").replace(/([A-ZÀ-Ý])0(?=[A-ZÀ-Ý])/g, "$1O").split(/\s+/);
      for (let i = 0; i < tk.length - 1; i++) {
        for (const n of [3, 2]) {
          if (i + n > tk.length) continue;
          const parte = tk.slice(i, i + n), junto = parte.map(nw).join("");
          if (junto.length >= 4 && vocab.has(junto) && parte.some((p) => !vocab.has(nw(p)))) { tk.splice(i, n, parte.join("")); break; }
        }
      }
      return tk.join(" ");
    });
    // título partido: "Características Opcionais" / "de Classe"
    for (let i = 0; i < ls.length - 2; i++) {
      if (ls[i].length < 40 && /^[A-ZÀ-Ý]/.test(ls[i]) && !/[.,;:!?]$/.test(ls[i]) && /^(de|da|do|das|dos|e)\s+[A-ZÀ-Ý][\wÀ-ÿ]+$/.test(ls[i + 1]) && /^[A-ZÀ-Ý"“]/.test(ls[i + 2])) { ls[i] = ls[i] + " " + ls[i + 1]; ls.splice(i + 1, 1); }
    }
    // assinatura de citação: uma palavra só logo depois de uma fala entre aspas ("…”" / "*Fulano")
    ls = ls.map((l) => l.replace(/([.!?]["”])\s*\*?[A-ZÀ-Ý][a-zà-ÿ]{2,14}\s*$/, "$1")).filter((l, k, a) => !(/^[\-–—*]\s*[A-ZÀ-Ý][a-zà-ÿ]{2,14}\.?\s*$/.test(l) || (/^\*[A-ZÀ-Ý][a-zà-ÿ]{2,14}\s*$/.test(l))) || !/["”]\s*$/.test(a[k - 1] || ""));
    const conta = {};
    const semPag = (l) => l.replace(/^\d{1,4}\s+|\s+\d{1,4}$/g, "");
    ls.forEach((l) => { if (l && l.length < 50) { const k = semPag(l); conta[k] = (conta[k] || 0) + 1; } });
    // subtítulo quebrado do PDF: "Manobras" / ". Você aprende…" vira "Manobras. Você aprende…"
    for (let i = 1; i < ls.length; i++) {
      if (/^\.\s*\S/.test(ls[i]) && ls[i - 1] && ls[i - 1].length < 45 && !/[.!?:]$/.test(ls[i - 1])) { ls[i - 1] = ls[i - 1] + ". " + ls[i].replace(/^\.\s*/, ""); ls.splice(i, 1); i--; }
    }
    const caps = (x) => !!x && /[A-ZÀ-Ý]{2}/.test(x) && x === x.toUpperCase() && !/\d/.test(x) && x.length < 50;
    // título em caixa alta grudado no fim da frase anterior ("…seu próximo turno. INVESTIDA")
    for (let i = 0; i < ls.length; i++) {
      const m = ls[i].match(/^(.*?[.!?])\s+([A-ZÀ-Ý][A-ZÀ-Ý' -]{2,})$/);
      if (m && /[a-zà-ÿ]/.test(m[1]) && m[2].replace(/[^A-ZÀ-Ý]/g, "").length >= 4) ls.splice(i, 1, m[1], m[2].trim());
    }
    // título em caixa alta quebrado em várias linhas ("GOLPE / MÍSTICO", "MAGIA DE / GUERRA / APRIMORADA")
    for (let i = 0; i < ls.length - 1; i++) {
      const a = ls[i], b = ls[i + 1], c = ls[i + 2] || "";
      if (!caps(a) || !caps(b)) continue;
      const preposicao = /\s(DA|DE|DO|DAS|DOS|E|EM|COM|A|O|OF|THE|AND)$/.test(a);
      const curto = (a + " " + b).length <= 40 && b.split(/\s+/).length <= 2 && (!caps(c) || /\s(DA|DE|DO|E|OF)$/.test(b));
      if (preposicao || curto) { ls[i] = a + " " + b; ls.splice(i + 1, 1); i--; }
    }
    return ls.filter((l, i) => {
      if (/^n[ií]vel de \S+ n[uú]mero de .{2,30}$/i.test(l)) return false;
      if (/^n[ií]vel de \S+ magias( de [\wÀ-ÿ ]{2,25})?$/i.test(l)) return false; // "Nível de Druida Magias de Círculo"
      if (/^(n[ií]vel de|[A-ZÀ-Ý][a-zà-ÿ]+ magias|n[ií]vel de [a-zà-ÿ]+( magias)?|magias|spells|c[ií]rculo d[ae]( magias?)?|magia magias|c[ií]rculo de magias|spell level|[a-z]+ level spells?)$/i.test(l)) return false; // cabeçalho de tabela de magias
      if (ls[i + 1] && marcaNivel(ls[i + 1]) && !marcaNivel(l)) return true; // título logo acima de "Característica de Xº nível"
      if (/^\d{1,4}$/.test(l)) return false; // número de página
      if (/^(\d{1,4}\s+)?(cap[ií]tulo|chapter)\s+\d+/i.test(l) && l.length < 60 && (l.includes("|") || l === l.toUpperCase() || /\d{1,4}$/.test(l))) return false;
      if (/^(n[ií]vel|level)( de| of)? (magia|spell|\w+)?\s*(magias|spells)$/i.test(l)) return false; // cabeçalho de tabela de magias
      if (/^(cap[ií]tulo|chapter)\s+\d+.*\d{1,4}$/i.test(l) && l.length < 60) return false; // rodapé com página
      if (/^(cap[ií]tulo|cap\.|chapter)\s*[\dlI]+\s*[|J\]1lI!:\-–]?\s*[A-ZÀ-Ý]/i.test(l) && l.length < 60 && !/[.!?]$/.test(l)) return false; // cabeçalho "Capítulo 1 | Opções…"
      if (/^(N[IÍ]VEL|N[ií]vel|LEVEL|Level)\b(?!\s*[,.;])/.test(l) && /profici[eê]ncia|proficiency/i.test(l) && l.length < 90) return false; // cabeçalho da tabela
      if (l.length < 50 && conta[semPag(l)] >= 3 && !/^[a-zà-ÿ]/.test(l) && !/[.,;]$/.test(l) && !/^[\d—–\-\s°º+,dx]+$/.test(l) && !(ls[i + 1] && /^[\d—–\-\s°º+]+$/.test(ls[i + 1])) && !RX_TABELA.test(ls[i - 1] || "") && !tituloComNivel(l) && !marcaNivel(l) && !(ls[i + 1] && /^[a-zà-ÿ]/.test(ls[i + 1])) && !(ls[i + 1] && /^(Quando voc[eê]|A partir d[oa] \d|No \d{1,2}\s*[º°ª]|Come[cç]ando|Tamb[eé]m no|Ao (alcan|atingir|chegar)|Starting at|When you|At \d)/.test(ls[i + 1]))) return false; // cabeçalho/rodapé repetido (não pedaço de frase)
      if (/^\d{1,4}\s+[A-ZÀ-Ý][\wÀ-ÿ ]{3,40}$/.test(l) && conta[semPag(l)] >= 2) return false;
      return true;
    });
  }
  const terminaFrase = (l) => /[.!?:;)"”]$/.test(l);
  // linha logo abaixo do título dizendo o nível
  const RX_MARCA = /^(?:caracter[ií]stica|habilidade|feature)\b[^.]{0,40}?\b(\d{1,2})\s*[º°ª]?\s*n[ií]vel\b[^.]{0,45}$/i;
  const RX_MARCA_EN = /^(\d{1,2})(?:st|nd|rd|th)-level\b[^.]{0,40}\bfeature\b.{0,20}$/i;
  const RX_MARCA_PONTO = /^(?:caracter[ií]stica|habilidade)\b[^.]{0,40}?\b(\d{1,2})\s*[º°ª]?\s*n[ií]vel\b[^.]{0,45}\.\s*(.*)$/i;
  function marcaNivel(l) {
    const mp = l.match(RX_MARCA_PONTO);
    if (mp) return { n: Number(mp[1]), resto: mp[2] || "" };
    let m = l.match(RX_MARCA) || l.match(RX_MARCA_EN);
    if (!m) return null;
    const resto = (l.match(/n[ií]vel\b.*?\s((?:Você|Quando|Como|Seu|Sua|Seus|Suas|Ao|Enquanto|Durante|Sempre|Uma vez|You|When|Your|While|Whenever)(?=\s|$).*)$/i) || [])[1] || "";
    return { n: Number(m[1]), resto };
  }
  function pareceTitulo(l, ant, prox) {
    if (!l || l.length < 3 || l.length > 60) return false;
    // a linha de baixo é "Característica de Xº nível…": isso aqui é título com certeza
    if (prox && marcaNivel(prox) && /^[A-ZÀ-Ý"“]/.test(l) && !/[.,;:]$/.test(l) && !marcaNivel(l)) return true;
    // TÍTULO EM CAIXA ALTA é título quase sempre
    if (/[A-ZÀ-Ý]{3}/.test(l) && l === l.toUpperCase() && !/[,;]$/.test(l) && !RX_TABELA.test(l) && prox) return true;
    if (/[.,;:]$/.test(l) || l.startsWith("•")) return false;
    if (/^(pr[ée]-?requisitos?|prerequisite)\s*:/i.test(l)) return false;
    if (/[a-zà-ÿ]\.\s+[A-ZÀ-Ý]/.test(l)) return false; // frase, não título
    if (!/^[A-ZÀ-Ý"“]/.test(l)) return false;
    if (l.split(/\s+/).length > 8) return false;
    if (RX_TABELA.test(l)) return false;
    if (ant && !terminaFrase(ant) && ant.length > 30) return false; // continuação de frase
    if (ant && /^\d{1,2}\s*[º°ª]?\s+\S/.test(ant) && !terminaFrase(ant)) return false; // resto de linha de tabela
    if (ant && /(,|\s(de|da|do|e|ou|of|and|the))$/i.test(ant)) return false;
    if (/;/.test(l)) return false;
    if (!prox || /^[a-zà-ÿ]/.test(prox)) return false; // a linha de baixo continua a frase
    const pal = l.split(/\s+/);
    const minusc = pal.filter((w, i) => i && w.length > 3 && /^[a-zà-ÿ]/.test(w) && !PEQ.includes(w)).length;
    if (minusc > (pal.length <= 3 ? 1 : 0)) return false; // frase comum, não título
    return true;
  }

  function montarParagrafos(ls) {
    let out = "";
    ls.forEach((l) => {
      if (!l) { if (out && !out.endsWith("\n")) out += "\n"; return; }
      if (!out || out.endsWith("\n")) out += l;
      else if (l.startsWith("•") || (terminaFrase(out) && /^[A-ZÀ-Ý"“]/.test(l))) out += "\n" + l;
      else out += " " + l;
    });
    return out.replace(/\n{2,}/g, "\n").trim();
  }

  // "Luz, Proteção contra o Bem e o Mal e Santuário": só separa no "e" quando não é parte do nome da magia
  function separarMagias(txt) {
    const cat = typeof CATALOGO_MAGIAS !== "undefined" ? new Set(CATALOGO_MAGIAS.map((m) => norm(m.nome))) : null;
    const out = [];
    // nomes que têm "e" de verdade: Proteção contra o Bem e o Mal, Clarividência e Clariaudiência…
    txt = txt.replace(/\b(bem) e (o )?(mal)\b/gi, "$1\u0001$2$3").replace(/\b(good) and (evil)\b/gi, "$1\u0002$2").replace(/\b(clarivid[eê]ncia) e (clariaudi[eê]ncia)\b/gi, "$1\u0001$2");
    const volta = (x) => x.replace(/\u0001/g, " e ").replace(/\u0002/g, " and ");
    return separarMagias0(txt, cat).map(volta);
  }
  function separarMagias0(txt, cat) {
    const out = [];
    txt.split(/[,;]/).map((x) => x.trim().replace(/\.$/, "")).filter(Boolean).forEach((pedaco) => {
      if (!/\s(e|and)\s/i.test(pedaco) || (cat && cat.has(norm(pedaco)))) { out.push(pedaco); return; }
      const partes = pedaco.split(/\s+(?:e|and)\s+/i);
      if (!cat) { out.push(...partes); return; }
      // junta de volta os pedaços que só fazem sentido juntos
      let buf = "";
      partes.forEach((p) => {
        buf = buf ? buf + " e " + p : p;
        if (cat.has(norm(buf))) { out.push(buf); buf = ""; }
      });
      if (buf) { const resto = buf.split(/\s+e\s+/); out.push(...resto); }
    });
    return out.filter((x) => x.length > 2);
  }

  /* ---------- leitura ---------- */
  /* ---------- colunas numéricas da tabela (truques, magias, espaços, invocações…) ---------- */
  const COLS = [
    [/truques( conhecidos)?|cantrips( known)?/, "Truques"],
    [/magias (conhecidas|preparadas)|spells (known|prepared)|prepared spells/, "Magias"],
    [/espacos de magia|spell slots/, "Espaços"],
    [/nivel (de|do) (magia|espaco)|slot level|circulo do espaco/, "Círculo"],
    [/dano (de|da) furia|rage damage/, "Dano da Fúria"],
    [/furias|rages/, "Fúrias"],
    [/artes marciais|martial arts/, "Artes Marciais"],
    [/pontos de (ki|feiticaria|foco)|sorcery points|ki points|focus points/, "Pontos"],
    [/ataque furtivo|sneak attack/, "Ataque Furtivo"],
    [/movimento sem armadura|unarmored movement/, "Movimento"],
    [/canalizar divindade|channel divinity/, "Canalizar Divindade"],
    [/forma selvagem|wild shape/, "Forma Selvagem"],
    [/inimigo favorito|favored enemy/, "Inimigo Favorito"],
    [/maestria|weapon mastery/, "Maestria"],
    [/itens infundidos|infused items/, "Itens Infundidos"],
    [/([a-z]+) conhecid[oa]s|([a-z]+) known/, null],
  ];
  const RX_TOKEN = /^(\d+\s?[°º]?|[—–-]|\+\d+|\d+d\d+|\d+(,\d+)?\s?m|x\d+)$/i;
  function colunasTabela(cab, crua) {
    let t = norm(cab).replace(/\s+/g, " ");
    const i = t.search(/caracteristicas|features/);
    if (i < 0) return null;
    // colunas antes de "Características" (Pontos de Feitiçaria do Feiticeiro antigo)
    const t0 = t.slice(0, i), ip = Math.max(t0.lastIndexOf("proficiencia"), t0.lastIndexOf("proficiency"));
    const antes = ip >= 0 ? colunasAntes(t0.slice(ip + 12), crua) : null;
    t = t.slice(i).replace(/^(caracteristicas|features)/, " ".repeat(15)).replace(/^(\s*)(conhecid[ao]s)\b/, "$1magias $2");
    const achou = [];
    COLS.forEach(([rx, nome]) => {
      const g = new RegExp(rx.source, "g");
      t = t.replace(g, (m, a, b, pos) => {
        const p = typeof pos === "number" ? pos : t.indexOf(m);
        let nm = nome;
        // "––– Espaços de Magia por Nível –––" é o título do grupo 1º…9º, não uma coluna
        if (nm === "Espaços" && /^[a-z ]{0,20}(por nivel|per spell level)/.test(t.slice(p + m.length, p + m.length + 30))) return m;
        if (!nm) { const w = (m.match(/^([a-z]+)/) || [])[1] || "Extra"; if (/^(magias?|truques?|spells?)$/.test(w)) return m; const orig = String(cab).split(/\s+/).find((x) => norm(x) === w) || w; nm = orig.charAt(0).toUpperCase() + orig.slice(1).toLowerCase(); }
        achou.push({ pos: p, nome: nm });
        return " ".repeat(m.length);
      });
    });
    // colunas de espaço por círculo (1° 2° 3°…)
    t.replace(/\b(\d)\s?[°º]/g, (m, d, pos) => { achou.push({ pos, nome: d + "º" }); return m; });
    achou.sort((a, b) => a.pos - b.pos);
    const cols = achou.map((x) => x.nome);
    if (!cols.length) return null;
    const cauda = (txt) => { const tk = String(txt).trim().split(/\s+/); const out = []; while (tk.length && RX_TOKEN.test(tk[tk.length - 1])) out.unshift(tk.pop()); return { out, temFeat: tk.length > 0 }; };
    // confere: nas linhas com habilidade, a quantidade de números bate com as colunas
    const contas = Object.values(crua).map(cauda).filter((x) => x.temFeat).map((x) => x.out.length);
    if (!contas.length) return null;
    const moda = contas.sort((a, b) => contas.filter((v) => v === a).length - contas.filter((v) => v === b).length).pop();
    if (moda !== cols.length) return null;
    const val = (v) => { if (!v || /^[—–-]$/.test(v)) return 0; const n = parseInt(String(v).replace(/[^\d]/g, ""), 10); return /^\d+\s?[°º]?$/.test(v) ? n : v; };
    const linhas = Array.from({ length: 20 }, (_, k) => {
      const r = crua[k + 1];
      if (!r) return cols.map(() => 0);
      const tk = cauda(r).out.slice(-cols.length);
      while (tk.length < cols.length) tk.unshift("");
      return tk.map(val);
    });
    if (antes) return { cols: antes.cols.concat(cols), linhas: linhas.map((l, k) => antes.linhas[k].concat(l)) };
    return { cols, linhas };
  }
  function colunasAntes(t, crua) {
    const achou = [];
    COLS.forEach(([rx, nome]) => {
      if (!nome) return;
      new RegExp(rx.source, "g").test(t) && achou.push({ pos: t.search(rx), nome });
    });
    if (!achou.length) return null;
    achou.sort((a, b) => a.pos - b.pos);
    const cols = achou.map((x) => x.nome);
    const frente = (txt) => { const tk = String(txt).trim().split(/\s+/); const out = []; while (tk.length && RX_TOKEN.test(tk[0])) out.push(tk.shift()); return out; };
    const contas = Object.values(crua).map((r) => frente(r).length);
    if (!contas.length || contas.filter((n) => n === cols.length).length < contas.length * 0.6) return null;
    const val = (v) => { if (!v || /^[—–-]$/.test(v)) return 0; const n = parseInt(String(v).replace(/[^\d]/g, ""), 10); return /^\d+\s?[°º]?$/.test(v) ? n : v; };
    const linhas = Array.from({ length: 20 }, (_, k) => { const r = crua[k + 1]; const tk = r ? frente(r).slice(0, cols.length) : []; while (tk.length < cols.length) tk.push(""); return tk.map(val); });
    return { cols, linhas };
  }

  /* ---------- opções pra escolher (estilos de luta, manobras, invocações…) ---------- */
  const NUM_RX = "(um|uma|dois|duas|tres|quatro|cinco|seis|\\d)";
  function contarEscolha(t) {
    const m = norm(t).match(new RegExp("(?:aprende|aprender|conhece|ganha|escolha|escolhe|escolher|adquire|learn|gain|choose)(?:\\s+[a-z]+){0,3}?\\s+" + NUM_RX + "\\b"));
    return m ? numDe(m[1]) : 0;
  }
  function maisEscolhas(t) {
    const out = {};
    const m = norm(t).match(new RegExp(NUM_RX + "\\s+(?:[a-z]+\\s+){0,2}adiciona(?:l|is)[^.]*?\\bno\\s+((?:\\d+\\s*[°º]?\\s*(?:,|e)?\\s*)+)\\s*nivel"));
    if (m) { const n = numDe(m[1]); (m[2].match(/\d+/g) || []).forEach((lv) => { if (Number(lv) <= 20) out[Number(lv)] = n; }); }
    // "Você adquire outra no 10° e 17° nível"
    const m2 = !m && norm(t).match(/(?:adquire|aprende|ganha|escolhe|learn|gain)\s+(?:outr[ao]|mais (?:um|uma)|another)\b[^.]{0,40}?\b(?:no|nos|at)\s+((?:\d+\s*[°º]?\s*(?:,|e|and)?\s*)+)\s*(?:nivel|niveis|level)/);
    if (m2) (m2[1].match(/\d+/g) || []).forEach((lv) => { if (Number(lv) <= 20) out[Number(lv)] = 1; });
    return Object.keys(out).length ? out : undefined;
  }
  function opcaoDe(o) {
    let d = o.d || "", pr = "";
    const ls = (o.linhas || []).filter(Boolean);
    if (ls.length && /^pr[ée]-?requisitos?\s*:/i.test(ls[0])) { pr = ls[0].replace(/^pr[ée]-?requisitos?\s*:\s*/i, "").replace(/\.$/, ""); d = montarParagrafos(ls.slice(1)); }
    // "Cavalgar o Vento (11° nível Requerido)": o nível vira pré-requisito
    let nome = o.nome;
    const mq = String(nome).match(/\s*\(\s*(\d{1,2})\s*[°ºª]?\s*n[ií]vel(?:\s+(?:requerido|necess[aá]rio|exigido))?\s*\)\s*$/i) || String(nome).match(/\s*\(\s*(\d{1,2})(?:st|nd|rd|th)[\s-]level(?:\s+required)?\s*\)\s*$/i);
    if (mq && !pr) { pr = `${mq[1]}º nível`; nome = nome.slice(0, mq.index); }
    const an = analisar(nome, d);
    return { nome: capitalizar(nome).slice(0, 60), d: (pr ? `Pré-requisito: ${pr}. ` : "") + resumir(d, 140, 260), a: an.a, r: an.r };
  }
  /* ---------- poderes ou opções escritos dentro da habilidade ("Campo protetor. Quando…", "Runa da Nuvem. A magia…") ---------- */
  const RX_ENTRADA = /^([A-ZÀ-Ý][^.:!?]{2,45})\.\s+(\S.*)$/;
  const RX_CONJ_SUB = /^(truques|espa[cç]os de magia|magias conhecidas|magias preparadas|habilidade de conjura|atributo de conjura|foco de conjura|preparando|ritual|conjurando|cantrips|spell ?slots|spellcasting|spells known|teste de resist|salvaguarda)/i;
  const RX_ACAO = /voce pode|como uma acao|sua reacao|gastar um|uma vez por turno|you can|as a bonus action|as an action|your reaction/;
  function dividirInline(linhas) {
    const intro = [], ent = [];
    let atual = null;
    (linhas || []).forEach((l, k) => {
      const m = l.match(RX_ENTRADA);
      const antes = k ? linhas[k - 1] : "";
      const novo = !antes || /[.!?:)]$/.test(String(antes).trim());
      const pronome = m && /^(você|voce|seu|sua|seus|suas|quando|se|como|ao|uma|um|o|a|os|as|essa|esse|isso|esta|este|cada|além|alem|you|your|when|if|as|the|this|each)(?=\s|$)/i.test(m[1]);
      if (m && novo && !pronome && m[1].split(/\s+/).length <= 6) { atual = { nome: m[1].trim(), d: m[2], linhas: [m[2]] }; ent.push(atual); }
      else if (atual) { if (l) { atual.d += (/[.!?:]$/.test(atual.d) && /^[A-ZÀ-Ý•]/.test(l) ? "\n" : " ") + l; atual.linhas.push(l); } }
      else intro.push(l);
    });
    return { intro, ent };
  }
  // tabelinha "Nível de Guerreiro / Número de Runas: 3º 2, 7º 3…"
  function contagemTabela(linhas) {
    const rows = (linhas || []).map((l) => String(l).match(/^(\d{1,2})\s*[º°ª]?\s+(\d{1,2})$/)).filter(Boolean).map((m) => [Number(m[1]), Number(m[2])]);
    if (rows.length < 2) return null;
    const mais = {};
    for (let i = 1; i < rows.length; i++) if (rows[i][1] > rows[i - 1][1]) mais[rows[i][0]] = rows[i][1] - rows[i - 1][1];
    return { inicial: rows[0][1], mais };
  }
  function habilidadesDe(b, base) {
    const div = dividirInline(b.linhas);
    if (div.ent.length < 2) return [base];
    const intro = montarParagrafos(div.intro);
    const ni = norm(intro);
    // o texto anuncia quais são as opções ("…modelos de armadura: Guardião ou Infiltrador"): o resto são detalhes delas
    const anunc = (intro.match(/:\s*([^.:]{3,120})\.?\s*$/m) || intro.match(/:\s*([^.:]{3,120})\./) || [])[1];
    if (anunc) {
      const nomes = anunc.split(/,|\s+ou\s+|\s+e\s+|\s+or\s+|\s+and\s+/).map((x) => norm(x).replace(/^(o|a|the)\s+/, "")).filter((x) => x.length > 2);
      const casa = (e) => nomes.includes(norm(e.nome).replace(/^(o|a|the)\s+/, ""));
      if (nomes.length >= 2 && div.ent.filter(casa).length >= 2) {
        const top = [];
        div.ent.forEach((e) => { if (casa(e) || !top.length) top.push({ ...e }); else top[top.length - 1].d += `\n${e.nome}. ${e.d}`; });
        div.ent = top;
      }
    }
    const cadaVez = /(cada|toda) vez que|sempre que voce (entra|usa|termina)|quando (voce )?o fizer|each time|whenever you|when you do so/.test(ni);
    if (!cadaVez && /escolh[ae] (um|uma) d[oa]s seguintes|(um|uma) d[oa]s seguintes [a-z]+,? a sua escolha|voce escolhe (um|uma) [a-z]+ [a-z]+ e ganha|pode escolher o mesmo|sua escolha,? (dentre|entre)|(dentre|entre) as? [a-z ]{0,30}(descritas|a seguir|abaixo)|uma das (opcoes|caracteristicas) a seguir|estao disponiveis quando|of your choice from|from the following|choose (one|two|three) of the following/.test(ni) && !div.ent.some((e) => RX_CONJ_SUB.test(e.nome))) {
      const tb = contagemTabela(b.linhas);
      base.d = resumir(intro || base.d);
      base._full = intro;
      base.esc = { n: (tb && tb.inicial) || contarEscolha(intro) || 1, ops: div.ent.map(opcaoDe), mais: tb && Object.keys(tb.mais).length ? tb.mais : maisEscolhas(intro), titulo: base.nome };
      return [base];
    }
    const poderes = div.ent.filter((e) => !RX_CONJ_SUB.test(e.nome) && RX_ACAO.test(norm(e.d.slice(0, 260))));
    if (!poderes.length) return [base];
    if (intro.trim()) { base.d = resumir(intro); base._full = intro; const an = analisar(base.nome, intro); base.a = an.a; base.u = an.u; base.r = an.r; }
    return [base].concat(poderes.map((e) => { const an = analisar(e.nome, e.d); return { n: base.n, nome: capitalizar(e.nome).slice(0, 70), d: resumir(e.d), a: an.a, u: an.u, r: an.r, imp: true, duvida: false, _full: e.d, _split: true }; }));
  }
  const RX_GRUPO_FORA = /caracter[ií]sticas opcionais|optional class features|^op[cç][oõ]es de|^variante|class feature variants/i;

  const RX_NAO_LISTA = /^(arqu[eé]tipos?|patronos?|subclasses?|caminhos?|juramentos?|col[eé]gios?|dom[ií]nios?|c[ií]rculos?|tradi[cç][oõ]es|origens?|conclaves?|trilhas?|especializa[cç][oõ]es)\b|lista de magia|magias? expandid|^sua |^seu /i;
  const radical = (x) => { const w = norm(x).split(/[^a-z]+/).find((p) => p.length >= 5); return w ? w.slice(0, 6) : ""; };
  function listasDeOpcoes(blocos, subNome) {
    const listas = [], rSub = subNome ? radical(subNome) : "";
    const entradaInline = /^([A-ZÀ-Ý][^.:!?]{2,62})\.\s+(\S.*)$/;
    const temNivel = (b) => b.certo || !!nivelNoTexto(b.d || "");
    blocos.forEach((h, i) => {
      if (h.usado || h.emLista || temNivel(h) || RX_SECAO.test(h.nome) || RX_NAO_LISTA.test(h.nome) || RX_GRUPO_FORA.test(h.nome)) return;
      const rad = radical(h.nome);
      if (!rad || rad === rSub) return;
      // a) opções escritas dentro do próprio bloco: "Aparar. Quando outra criatura…"
      const ops = [];
      let atual = null;
      // "Defesa Eterna da Montanha (17° nível" / "Requerido). Você pode…": junta o nome quebrado
      const hl = [];
      h.linhas.forEach((l) => { const u = hl[hl.length - 1]; if (u && /\(\s*\d{1,2}\s*[°ºª]?\s*n[ií]vel$/i.test(u) && /^[A-Za-zÀ-ÿ]+\)/.test(l)) hl[hl.length - 1] = u + " " + l; else hl.push(l); });
      const entradaSo = /^([A-ZÀ-Ý][^.:!?]{2,45}\(\s*\d{1,2}\s*[°ºª]?\s*n[ií]vel[^)]*\))\.$/i;
      hl.forEach((l, k) => {
        const m = l.match(entradaInline) || ((x) => x && [x[0], x[1], ""])(l.match(entradaSo));
        const antes = k ? hl[k - 1] : "";
        const paragrafoNovo = !antes || /[.!?:)]$/.test(antes.trim());
        if (m && paragrafoNovo && semParen(m[1]).split(/\s+/).length <= 6 && semParen(m[1]).length <= 45) { atual = { nome: m[1].trim(), d: m[2] }; ops.push(atual); }
        else if (atual && l) atual.d += (/[.!?:]$/.test(atual.d) && /^[A-ZÀ-Ý•]/.test(l) ? "\n" : " ") + l;
      });
      if (ops.length >= 3) { listas.push({ rad, nome: h.nome, ops: ops.map(opcaoDe), tabela: contagemTabela(h.linhas) }); return; }
      // b) opções como títulos seguidos: "ARMADURA DE SOMBRAS", "CORRENTES DE CÁRCERI"…
      const seg = [];
      for (let j = i + 1; j < blocos.length; j++) {
        const b = blocos[j];
        if (/\(\s*\d{1,2}\s*[º°ª]?\s*n[ií]vel/i.test(b.nome) && b.d.length < 900) continue; // legenda de tabela dentro da lista
        if (temNivel(b) || b.usado || RX_SECAO.test(b.nome) || RX_NAO_LISTA.test(b.nome) || b.d.length > 1800 || !b.d) break;
        seg.push({ nome: b.nome, d: b.d, linhas: b.linhas });
      }
      if (seg.length >= 3 && !/^caracter[ií]sticas? d/i.test(h.nome) && seg.filter((x) => x.d.length < 25).length <= seg.length / 3) { listas.push({ rad, nome: h.nome, ops: seg.map(opcaoDe) }); for (let j = i + 1; j <= i + seg.length; j++) blocos[j].emLista = true; }
    });
    return listas;
  }
  function ligarLista(L, feats, tab) {
    const txt = (f) => f._conjTxt || f._full || f.d;
    const relac = (f) => radical(f.nome) === L.rad || norm(txt(f)).includes(L.rad);
    const escolhe = (f) => /escolh|aprende|conhece|choose|learn/.test(norm(txt(f)));
    const pref = L.rad.slice(0, 4);
    let dono = feats.find((f) => !f.esc && radical(f.nome) === L.rad) || feats.find((f) => !f.esc && pref.length === 4 && radical(f.nome).startsWith(pref)) || feats.find((f) => !f.esc && relac(f) && escolhe(f) && contarEscolha(txt(f)));
    if (!dono) return;
    const col = tab && tab.cols ? tab.cols.find((c) => radical(c) === L.rad) : null;
    dono.esc = { n: (L.tabela && L.tabela.inicial) || contarEscolha(txt(dono)) || 1, ops: L.ops, mais: L.tabela && Object.keys(L.tabela.mais).length ? L.tabela.mais : maisEscolhas(txt(dono)), titulo: /^(n[ií]vel|n[uú]mero|level|number)\b/i.test(L.nome) ? dono.nome : capitalizar(L.nome) };
    if (col) dono.esc.col = col;
    // outras habilidades que mandam escolher mais uma ("escolher um segundo Estilo de Combate")
    feats.forEach((f) => { if (f !== dono && !f.esc && relac(f) && /(escolher|escolha|aprende|choose|learn)\s+(um|uma|mais um|mais uma)?\s*(segund|outr|adicional|another|second)/.test(norm(f._full || f.d))) f.esc = { n: 1, ops: L.ops, titulo: capitalizar(L.nome) }; });
  }
  // a lista que veio como subseção de uma habilidade também serve pras outras que citam ela
  function ligarSubsecoes(feats) {
    feats.filter((f) => f.esc && f.esc.ops).forEach((d) => {
      const rad = radical(d.nome);
      feats.forEach((f) => { if (f !== d && !f.esc && rad && norm(f._full || f.d).includes(rad) && /segund|outr|adicional|another|second/.test(norm(f._full || f.d)) && /escolh|choose/.test(norm(f._full || f.d))) f.esc = { n: 1, ops: d.esc.ops }; });
    });
  }

  // seções do texto que não são habilidades
  const RX_SECAO = /^(pontos de vida|profici[eê]ncias|equipamento( inicial)?|criando (um|uma)|cria[cç][aã]o r[aá]pida|constru[cç][aã]o r[aá]pida|caracter[ií]sticas de classe|multiclasse|tra[cç]os (b[aá]sicos|principais)|tornando-se|class features|hit points|proficiencies|equipment|creating an?|quick build|core .* traits|becoming an?)\b/i;
  const RX_MAGIAS_BLOCO = /^(magias? d|magias? de|lista de magias|.*\bspells$|spells of)/i;
  const RX_EXPANDIDA = /expandid|expanded/i;
  const semParen = (x) => String(x).replace(/\s*\(.*?\)\s*/g, " ").trim();
  const chave = (x) => norm(semParen(x)).replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

  // descrição curta: as primeiras frases que importam, sem "veja o capítulo X"
  const RX_FRASE_RUIM = /cap[ií]tulo \d|veja o cap|veja a tabela|see chapter|como mostrado na (coluna|tabela)|na tabela o |coluna .{0,30}tabela|as shown in the .{0,30}(table|column)|detalhad[oa]s? no final|described at the end/i;
  // o texto vai inteiro (só limpo): classe e sistema da mesa dependem dos detalhes
  function resumir(d) {
    return String(d || "")
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 6000);
  }
  const RX_OPCOES = /a sua escolha|à sua escolha|uma das (caracter[ií]sticas|op[cç][oõ]es) a seguir|escolha (uma|um) d|choose one|one of the following/i;

  function lerMagiasBloco(b, res) {
    let achou = 0;
    // junta a linha quebrada da tabela ("3º Cegueira/ Surdez, Repouso" / "Tranquilo")
    const rows = [];
    b.linhas.forEach((l) => {
      if (!l) return;
      const m = l.match(new RegExp("^(\\d{1,2})" + SUF + "\\s*(?:n[ií]vel|level)?\\s*[:\\-–]?\\s+(.+)$", "i"));
      if (m && Number(m[1]) <= 20) rows.push([Number(m[1]), m[2]]);
      else if (rows.length && l.length < 40 && !/[.!?]$/.test(rows[rows.length - 1][1])) rows[rows.length - 1][1] += " " + l;
    });
    rows.forEach(([n, txt]) => {
      const nomes = separarMagias(txt.replace(/\/\s+/g, "/").replace(/\s*\([^)]*\)/g, ""));
      if (nomes.length) { res.magias[n] = (res.magias[n] || []).concat(nomes); achou += nomes.length; }
    });
    return achou;
  }

  function ler(txt, modo) {
    txt = niveisColados(limparColado(txt));
    // "Subclasse nova pro Guerreiro – Guardião do Farol": o nome é o que vem depois do traço
    txt = txt.replace(/^\s*(?:nova\s+)?(?:sub)?classe\b[^\n–—:]{0,40}[–—:-]\s+([^\n]{2,50})$/im, (m, n) => n.trim());
    const ls = linhas(txt);
    const res = { nome: "", d: "", f: [], campos: {}, achados: [], tabela: {}, magias: {}, outraSub: false, ignoradas: 0 };
    const blocos = [];
    let atual = null, intro = [], primeiroTitulo = "";
    const camposLinhas = {};
    const ehCampo = (l) => CAMPOS.some(([, rx]) => rx.test(l));
    const recentes = []; // últimas linhas antes da tabela (cabeçalho das colunas)
    const tabelaCrua = {};
    let cabTabela = "";

    // classe: o que sobra entre a primeira e a última linha da tabela é pedaço da tabela (cópia embaralhada)
    let tIni = -1, tFim = -1;
    if (modo === "classe") ls.forEach((x, k) => { const m = x && x.match(RX_TABELA); if (m && Number(m[1]) <= 20) { if (tIni < 0 && Number(m[1]) === 1) tIni = k; if (tIni >= 0 && k - tIni < 120) tFim = k; } });
    for (let i = 0; i < ls.length; i++) {
      const l = ls[i];
      if (!l) { (atual ? atual.linhas : intro).push(""); continue; }
      if (i > tIni && i < tFim && !RX_TABELA.test(l) && !/[.!?]$/.test(l) && l.length < 60) continue;
      const ant = ls.slice(0, i).reverse().find((x) => x) || "";
      const prox = ls.slice(i + 1).find((x) => x) || "";
      if (!cabTabela && !RX_TABELA.test(l)) { recentes.push(l); if (recentes.length > 30) recentes.shift(); }

      // tabela da classe
      let tb = l.match(RX_TABELA);
      if (tb && modo === "classe") {
        // linha da tabela quebrada em várias ("A ferramenta certa / para o trabalho / 4 2 2 3 — —")
        const soNum = (x) => /^[\d—–\-\s°º+]+$/.test(x || "");
        let j = i + 1, junta = l;
        while (j < ls.length && ls[j] && !RX_TABELA.test(ls[j]) && j - i <= 3 && (soNum(ls[j]) || (ls[j].length < 45 && !marcaNivel(ls[j]) && soNum(ls[j + 1])))) { junta += " " + ls[j]; j++; }
        if (j > i + 1) { tb = junta.match(RX_TABELA) || tb; i = j - 1; }
        const n = Number(tb[1]);
        if (n >= 1 && n <= 20) {
          if (!cabTabela) cabTabela = recentes.join(" ");
          tabelaCrua[n] = tb[3];
          // "1d4 – – Artes Marciais, Defesa…", "+4,5m Evasão": tira as colunas numéricas do começo (vírgula de decimal não separa)
          res.tabela[n] = tb[3].split(/,(?!\d)|;/)
            .map((x) => x.replace(/^\s*((\d+d\d+|[—–-]|\+?\d+(,\d+)?\s?m|\+\d+|\d+\s*[°º]?|x\d+)\s+)+(?=[A-ZÀ-Ýa-zà-ÿ])/, "").replace(/(\s+(\d+\s*[°º]?|[—–-]|\+\d+|ilimitad[oa]s?|unlimited))+\s*$/i, "").trim())
            .filter((x) => x && !/^[\d—–\-\s°º]+$/.test(x) && !/^(\d+d\d+|\+?\d+(,\d+)?\s?m|x\d+)(\s+\S+)?$/i.test(x));
          continue;
        }
      }
      // campos da classe (dado de vida, resistências…), com continuação nas linhas de baixo
      if (modo === "classe") {
        let pegou = false;
        for (const [k, rx] of CAMPOS) {
          const m = l.match(rx);
          if (m && !camposLinhas[k]) {
            let v = (m[1] || "").trim(), j = i;
            // o valor continua nas linhas de baixo até um ponto final, outro campo ou um título
            while (j + 1 < ls.length && j - i < 5 && ls[j + 1] && !ehCampo(ls[j + 1]) && !tituloComNivel(ls[j + 1]) && !RX_TABELA.test(ls[j + 1])
              && ls[j + 1] !== ls[j + 1].toUpperCase() && !/\.$/.test(v)) { j++; v += " " + ls[j]; }
            i = j;
            camposLinhas[k] = v;
            pegou = true;
            break;
          }
        }
        if (pegou) continue;
      }
      // "Característica de 3º Nível do …" logo abaixo do título
      const mk = marcaNivel(l);
      if (mk && mk.n >= 1 && mk.n <= 20) {
        if (atual && !atual.linhas.some((x) => x)) { atual.n = mk.n; atual.certo = true; atual.marca = true; if (mk.resto) atual.linhas.push(mk.resto); }
        continue;
      }
      // título com nível
      const tn = tituloComNivel(l);
      if (tn) {
        atual = { n: tn.n, nome: capitalizar(tn.nome), linhas: tn.resto ? [tn.resto] : [], certo: true };
        blocos.push(atual);
        continue;
      }
      // linha de tabelinha ("Azul Elétrico", "Branco Frio"…): as duas de cima são do mesmo jeito, então não é título
      const linhaTab = (x) => x && x.length < 32 && !/[.,;:!?]$/.test(x) && x.split(/\s+/).length <= 3 && /^[A-ZÀ-Ý]/.test(x) && (x.match(/[A-ZÀ-Ý]/g) || []).length / ((x.match(/[A-Za-zÀ-ÿ]/g) || []).length || 1) < 0.6;
      const ant2 = ls.slice(0, i).reverse().filter((x) => x).slice(0, 2);
      const prox2 = ls.slice(i + 1).filter((x) => x).slice(0, 2);
      const naTabela = linhaTab(l) && ((ant2.length === 2 && ant2.every(linhaTab)) || (linhaTab(ant2[0]) && linhaTab(prox2[0])) || (prox2.length === 2 && prox2.every(linhaTab)));
      // título solto
      if (!naTabela && pareceTitulo(l, ant, prox)) {
        if (modo === "sub" && !primeiroTitulo && !blocos.length) {
          if (/^(subclasse|subclass)\b/i.test(l) || /\bsubclass(e)?$/i.test(l)) continue;
          primeiroTitulo = capitalizar(l);
          continue;
        }
        if (modo === "classe" && !blocos.length && !res.nome && !intro.some((x) => x)) { res.nome = capitalizar(l.replace(/^(o|a|the)\s+/i, "")); continue; }
        const lt = (l.match(/[A-Za-zÀ-ÿ]/g) || []).length;
        atual = { n: 0, nome: capitalizar(l), linhas: [], certo: false, caps: lt > 0 && (l.match(/[A-ZÀ-Ý]/g) || []).length / lt >= 0.7 };
        blocos.push(atual);
        continue;
      }
      (atual ? atual.linhas : intro).push(l);
    }
    blocos.forEach((b) => { b.d = montarParagrafos(b.linhas); });
    if (modo === "classe" && cabTabela) {
      // cabeçalho das colunas a partir do texto original (a limpeza tira linhas como "Magias")
      const brutas = String(txt).split("\n").map((x) => x.trim()).filter(Boolean);
      const i0 = brutas.findIndex((x) => RX_TABELA.test(x));
      const cab = i0 > 0 ? brutas.slice(Math.max(0, i0 - 30), i0).join(" ") : cabTabela;
      const tab = colunasTabela(cab, tabelaCrua) || colunasTabela(cabTabela, tabelaCrua);
      if (tab) res.campos.tab = tab;
    }

    if (modo === "sub") res.nome = primeiroTitulo;
    if (modo === "classe" && !res.nome) { const l0 = String(txt).split("\n").map((x) => x.trim()).find((x) => x); if (l0 && l0.length <= 30 && /^[A-ZÀ-Ý]/.test(l0)) res.nome = capitalizar(l0.replace(/^(o|a|the)\s+/i, "")); }
    let intr = montarParagrafos(intro);
    if (intr) intr = intr.charAt(0).toUpperCase() + intr.slice(1);
    res.d = intr.slice(0, 3000);

    const c = res.campos;
    const asi = new Set(), subN = new Set();
    const nomesTab = Object.values(res.tabela).flat();
    // tabela embaralhada na cópia (só números, nomes soltos em outro lugar): não dá pra confiar nela
    const linhasComNome = Object.values(res.tabela).filter((l) => l.length).length;
    const guiada = modo === "classe" && nomesTab.length >= 3 && linhasComNome >= Math.min(8, Object.keys(res.tabela).length * 0.5);

    if (guiada) {
      /* ---- classe com tabela: a tabela diz o que é habilidade; o resto é subseção ou texto de fora ---- */
      const tab = {}; // chave -> { n, nome }
      Object.entries(res.tabela).forEach(([n, l]) => l.forEach((x) => {
        n = Number(n);
        const k = chave(x);
        if (!k) return;
        if (RX_ASI.test(x)) { asi.add(n); return; }
        if (RX_DADIVA.test(x)) { c.dadiva = true; return; }
        const sb = x.match(/^(?:caracter[ií]stica|habilidade) d[eoa]s?\s+(.+)$/i);
        if (sb || RX_SUBF.test(x)) { subN.add(n); if (sb && !/^subclass/i.test(sb[1])) tab._subNome = semParen(sb[1]); return; }
        if (!tab[k]) tab[k] = { n, nome: semParen(x) };
      }));
      // "Característica de Patrono Transcendental": a habilidade "Patrono Transcendental" é a escolha da subclasse
      if (tab._subNome) {
        let k = chave(tab._subNome);
        if (!tab[k]) k = Object.keys(tab).find((x) => k && x.startsWith(k)) || k; // nome cortado na tabela ("especialização de")
        if (tab[k]) { subN.add(tab[k].n); tab[k].sub = true; c.subNome = tab[k].nome; }
        else c.subNome = tab._subNome.replace(/\s+(de|da|do)$/i, "");
      }
      delete tab._subNome;
      const maxN = Math.max(0, ...Object.values(tab).filter((t) => !t.sub).map((t) => t.n));
      let cur = null, acabou = false, lastN = 0;
      const usadas = new Set();
      blocos.forEach((b) => {
        const k = chave(b.nome);
        const t = tab[k] || (b.certo && tab[Object.keys(tab).find((x) => k && (x.startsWith(k) || k.startsWith(x)))]);
        if (acabou) { if (nivelNoTexto(b.d) || b.certo) res.outraSub = true; res.ignoradas++; return; }
        if (t && !usadas.has(k)) {
          usadas.add(k);
          if (t.sub) { cur = null; return; } // texto da escolha de subclasse
          if (RX_ASI.test(b.nome) || RX_DADIVA.test(b.nome)) { cur = null; return; }
          cur = { n: t.n, nome: capitalizar(b.nome.length <= t.nome.length + 3 ? b.nome : t.nome), partes: [b.d] };
          res.f.push(cur);
          lastN = Math.max(lastN, t.n);
          return;
        }
        if (RX_ASI.test(b.nome) || RX_DADIVA.test(b.nome) || RX_SUBF.test(b.nome)) { cur = null; return; }
        if (RX_MAGIAS_BLOCO.test(b.nome) && !RX_EXPANDIDA.test(b.nome) && cur && lerMagiasBloco(b, res)) return;
        // título com nível que a tabela não tem: habilidade nova, ou começo de uma subclasse se o nível voltou
        if (b.certo) {
          if (b.n < lastN) { acabou = true; res.outraSub = true; res.ignoradas++; return; }
          cur = { n: b.n, nome: b.nome, partes: [b.d], duv: true };
          res.f.push(cur);
          lastN = Math.max(lastN, b.n);
          return;
        }
        // título que não está na tabela: depois da última habilidade, é o fim da classe
        if (lastN >= maxN && res.f.length) { acabou = true; if (nivelNoTexto(b.d)) res.outraSub = true; res.ignoradas++; return; }
        if (cur && !RX_SECAO.test(b.nome)) { (cur.subs = cur.subs || []).push({ nome: b.nome, d: b.d, linhas: b.linhas }); b.usado = true; } // subseção (Truques, Pacto da Lâmina…)
      });
      res.f = res.f.map((x) => {
        const base = x.partes[0] || "";
        const d = resumir(base);
        const an = analisar(x.nome, base);
        const f = { n: x.n, nome: x.nome.slice(0, 70), d, a: an.a, u: an.u, r: an.r, imp: true, duvida: !d || !!x.duv, _full: base, _conjTxt: [base].concat((x.subs || []).map((z) => `${z.nome}. ${z.d}`)).join("\n") };
        // "escolha uma das opções a seguir": as subseções viram opções pra escolher, não habilidades
        if (x.subs && x.subs.length >= 2 && RX_OPCOES.test(base)) f.esc = { n: contarEscolha(base) || 1, ops: x.subs.map(opcaoDe), mais: maisEscolhas(base) };
        return f;
      });
      // o que só existe na tabela
      Object.entries(tab).forEach(([k, t]) => {
        if (t.sub || usadas.has(k) || res.f.some((f) => chave(f.nome) === k)) return;
        if (/^(magias?|truques?|espacos|cantrips|spells?)\b/i.test(t.nome)) return;
        const dois = chave(t.nome).split(" ").slice(0, 2).join(" ");
        if (res.f.some((f) => chave(f.nome).startsWith(dois) || chave(f.nome).replace(/[^a-z]/g, "").slice(0, 8) === chave(t.nome).replace(/[^a-z]/g, "").slice(0, 8))) return; // nome cortado/escrito diferente na tabela
        if (Object.keys(tab).some((x) => x !== k && x.startsWith(k) && x.length > k.length)) return;
        res.f.push({ n: t.n, nome: capitalizar(t.nome), d: "", a: "passiva", u: "", r: "", imp: true, duvida: true, soTabela: true });
      });
      res.f.sort((a, b) => a.n - b.n);
      if (c.dadiva === undefined) c.dadiva = false;
    } else if (modo === "sub") {
      /* ---- subclasse: separa cada subclasse do texto (o texto pode trazer várias seguidas) ---- */
      const feat = (b, certo, n) => { const an = analisar(b.nome, b.d); return { n: b.n || n || 1, nome: b.nome.slice(0, 70), d: resumir(b.d), a: an.a, u: an.u, r: an.r, imp: true, duvida: !certo || !b.d, _full: b.d }; };
      const juntaMag = (alvo, de) => Object.entries(de).forEach(([n, l]) => { alvo[n] = (alvo[n] || []).concat(l); });
      const grupos = [];
      let g = null, pend = { nome: primeiroTitulo, d: res.d, magias: {} }, lastN = 0;
      const RX_APRESENTA = /escolha de (sua |uma )?subclasse|(fornece|oferece) a (ele a |voc[eê] a )?escolha|seguintes op[cç][oõ]es (de [a-zà-ÿ]+ )?est[aã]o|op[cç][oõ]es a seguir est[aã]o dispon[ií]veis|grants? you a choice of subclass|the following options are available/i;
      // nomes das subclasses que o próprio texto anuncia ("…disponíveis: o Insondável e o Gênio.")
      const anunciadas = new Map(); // nome limpo -> nome como o texto escreveu
      // "Ü CELESTIAL" (letra capitular lida errado), "o Caminho do…": tira artigo e letra solta
      const semArt = (x) => norm(x).replace(/^[a-z0-9]\s+(?=[a-z]{3})/, "").replace(/^(o|a|os|as|the)\s+/, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
      const so = (x) => semArt(x).replace(/[^a-z]/g, "");
      const dist = (a, b) => { if (Math.abs(a.length - b.length) > 3) return 9; const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
      const ehAnunciada = (nome, capsOrig) => {
        const t = so(String(nome).replace(/^caracter\S{0,3}sticas? d[oa]s?\s+/i, ""));
        if (t.length < 4) return null;
        for (const [a, orig] of anunciadas) {
          const k = a.replace(/[^a-z]/g, "");
          const tipo = /^(dominio|circulo|caminho|colegio|juramento|estilo|tradicao|escola|patrono|origem|arquetipo|path|college|domain|circle|oath|school)s?\s+(d[aoe]s?\s+)?/;
          const tSem = so(norm(String(nome)).replace(/^caracter\S{0,3}sticas? d[oa]s?\s+/, "").replace(tipo, ""));
          const kSem = so(a.replace(tipo, ""));
          const mesmoRadical = tSem.length >= 5 && kSem.length >= 5 && tSem !== kSem && tSem.slice(0, 5) === kSem.slice(0, 5) && Math.abs(tSem.length - kSem.length) <= 2 && tipo.test(norm(String(nome))) && tipo.test(a);
          if (t === k || mesmoRadical || (k.length > 6 && dist(t, k) <= (k.length >= 12 ? 3 : 2)) || (k.length > 6 && t.length - k.length <= 2 && t.endsWith(k)) || (tSem === k && k.length >= 4)) {
            // título igual ao anunciado: fica o título (com artigo, "O Insondável"); lido torto pelo OCR: fica o anunciado
            const limpo = String(nome).replace(/^caracter\S{0,3}sticas? d[oa]s?\s+/i, "").replace(/^[^OoAa\s]\s+(?=\S{3})/, "").trim();
            const soltas = limpo.split(/\s+/).filter((t) => t.length === 1);
            const sujo = soltas.length >= 2 || soltas.some((t) => !/^[aeoAEO]$/.test(t)) || /[^A-Za-zÀ-ÿ\s\-]/.test(limpo) || /[a-zà-ÿ][A-ZÀ-Ý]/.test(limpo);
            const pal = (x) => norm(x).replace(/^(o|a|os|as|the)\s+/, "").split(/\s+/).length;
            const letras = (limpo.match(/[A-Za-zÀ-ÿ]/g) || []).length, maius = (limpo.match(/[A-ZÀ-Ý]/g) || []).length;
            const caixaAlta = capsOrig || (letras && maius / letras >= 0.7); // título decorativo (OCR erra mais nele)
            const temTipo = tipo.test(norm(limpo));
            if (tSem === k && !sujo && temTipo && t !== k) {
              // "Domínio da Forja" anunciado como "Forja": tipo do título + nome anunciado
              const ws = capitalizar(limpo).split(/\s+/), n = orig.split(/\s+/).length;
              return caixaAlta ? ws.slice(0, Math.max(0, ws.length - n)).concat(orig.split(/\s+/)).join(" ") : capitalizar(limpo);
            }
            return !sujo && !caixaAlta && dist(so(limpo), k) <= 2 && pal(limpo) === pal(orig) ? capitalizar(limpo) : orig;
          }
        }
        return null;
      };
      // "…você escolhe o Juramento de Devoção, o Juramento dos Anciões ou o Juramento de Vingança, todos detalhados no final…"
      const RX_DETALHADAS = /(todas?|todos|ambos|ambas)\s+(eles\s+|elas\s+)?(detalhad|descrit)|detalhad[oa]s\s+(no|ao)\s+final|described at the end|detailed at the end/i;
      blocos.forEach((b) => {
        if (RX_APRESENTA.test(b.d.slice(0, 400)) || !RX_DETALHADAS.test(b.d.slice(0, 700))) return;
        const frase = (b.d.replace(/\n/g, " ").match(/[^.]+\./g) || []).find((f) => RX_DETALHADAS.test(f));
        if (!frase) return;
        const nomes = [...frase.matchAll(/(?:^|[\s:,])(?:o|a|the)\s+([A-ZÀ-Ý][\wÀ-ÿ]*(?:\s+(?:d[aeo]s?|of|the|[A-ZÀ-Ý][\wÀ-ÿ]*))*)/g)].map((m) => m[1].replace(/\s+(d[aeo]s?|of|the)$/i, ""));
        if (nomes.length < 2) return;
        nomes.forEach((n) => { const k = semArt(n); if (k.length > 2 && k.split(" ").length <= 6) anunciadas.set(k, capitalizar(n)); });
      });
      blocos.forEach((b) => {
        if (!RX_APRESENTA.test(b.d.slice(0, 400))) return;
        let m = b.d.match(/escolha\s*:\s*([^.]+)\./i) || b.d.match(/dispon[ií]veis[^:.]*:\s*([^.]+)\./i);
        let lista = m ? m[1] : "";
        if (!lista) {
          // "…disponíveis…: o Caminho do X, o Caminho do Y e o Caminho do Z."
          let i = b.d.search(/dispo\S{0,3}veis/i);
          if (i < 0) i = b.d.search(/seguintes op/i);
          const frases = (b.d.slice(i) .match(/[^.]+\./g) || []).slice(1, 3);
          lista = frases.find((f) => (f.match(/,|\se\s/g) || []).length >= 1 && (f.match(/\b[A-ZÀ-Ý][a-zà-ÿ]+/g) || []).length >= 2) || "";
        }
        if (lista.includes(":")) lista = lista.slice(lista.lastIndexOf(":") + 1);
        lista.split(/,|\se\s|\sou\s|\sand\s|\sor\s/).forEach((n) => { const k = semArt(n); if (k.length > 2 && k.split(" ").length <= 6) anunciadas.set(k, capitalizar(n.trim().replace(/^(o|a|os|as|the)\s+/i, "").replace(/\.$/, ""))); });
      });
      // texto de grupo: "Ao adquirir esse arquétipo no 3º nível, você…" logo abaixo do nome já é a primeira habilidade,
      // e os títulos sem nível que vêm antes da primeira habilidade com nível são do mesmo nível (não outra subclasse)
      const introCompleta = montarParagrafos(intro);
      const nIntro = !anunciadas.size && primeiroTitulo && /(^|[^a-zà-ÿ])voc[eê](?![a-zà-ÿ])/i.test(introCompleta.slice(0, 400)) ? nivelNoTexto(introCompleta) : 0;
      let introUsada = false;
      blocos.forEach((b) => {
        if (nIntro && !g && !pend.fixo && pend.nome === primeiroTitulo && !b.certo && b.d && /(^|[^a-zà-ÿ])voc[eê](?![a-zà-ÿ])/i.test(b.d.slice(0, 400)) && !RX_MAGIAS_BLOCO.test(b.nome)) { b.n = nivelNoTexto(b.d) || nIntro; b.certo = true; }
        if (RX_APRESENTA.test(b.d.slice(0, 400)) && !b.marca) return;
        if (/^(especializa[cç][oõ]es|arqu[eé]tipos|tradi[cç][oõ]es|caminhos|juramentos|col[eé]gios|dom[ií]nios|c[ií]rculos|origens|patronos|trilhas|subclasses)\b/i.test(b.nome) && !b.marca) return;
        if (/^(classe de armadura|pontos de vida|deslocamento|for des con|sentidos|idiomas|a[cç][oõ]es|rea[cç][oõ]es|resist[eê]ncias? a|imunidades?|n[ií]vel de desafio|armor class|hit points|speed|str dex con)\b/i.test(b.nome)) return;
        if (!b.certo && !ehAnunciada(b.nome, b.caps) && !nivelNoTexto(b.d)) { const dv = dividirInline(b.linhas); if (dv.ent.length >= 3 && montarParagrafos(dv.intro).length < 900) return; } // lista de opções: vira escolha depois
        let anun = !b.certo && ehAnunciada(b.nome, b.caps);
        // tabela "Características do X": o nome da subclasse está ali
        const cap = !b.certo && String(b.nome).match(/^caracter\S{0,3}sticas? d[oa]s?\s+(.{3,40})$/i);
        if (!anun && cap && !anunciadas.size) { const x = cap[1].trim(); if (!/[<>|{}\[\]0-9(]/.test(x) && !/(^|\s)\S(\s\S){1,}(\s|$)/.test(x)) anun = capitalizar(x); }
        if (anun) { if (!(pend.fixo && pend.nome === anun)) pend = { nome: anun, d: b.d, magias: pend.magias, fixo: true }; return; }
        if (!b.n) { const n1 = nivelNoTexto(b.d); if (n1) { b.n = n1; b.certo = true; } }
        if (RX_MAGIAS_BLOCO.test(b.nome) && !RX_EXPANDIDA.test(b.nome)) {
          const tmp = { magias: {} };
          if (lerMagiasBloco(b, tmp)) {
            // a tabela é da subclasse que acabou de ser apresentada ("Magias do Juramento de Vingança") ou da atual
            const pals = (x) => new Set(norm(x || "").split(/[^a-z]+/).filter((w) => w.length >= 3 && !/^(das|dos|del|the|and|magias?|spells?|juramento|dominio|circulo|caminho|colegio|patrono|expandidas?)$/.test(w)));
            const pb = pals(b.nome), doPend = pend.nome && [...pals(pend.nome)].some((w) => pb.has(w)) && !(g && [...pals(g.nome)].some((w) => pb.has(w)));
            juntaMag(g && !doPend ? g.magias : pend.magias, tmp.magias); return;
          }
        }
        if (b.certo) {
          if (!g || b.n < lastN || pend.fixo) {
            g = { nome: pend.nome, d: pend.d, magias: pend.magias, f: [], extras: [], anun: !!pend.fixo };
            grupos.push(g);
            if (nIntro && !introUsada && g.nome === primeiroTitulo) { introUsada = true; g.f.push(feat({ n: nIntro, nome: primeiroTitulo, d: introCompleta, linhas: [] }, true)); }
            pend = { nome: "", d: "", magias: {} };
          }
          g.extras.forEach((x) => g.f.push(x));
          g.extras = [];
          habilidadesDe(b, feat(b, true)).forEach((x) => g.f.push(x));
          lastN = b.n;
          return;
        }
        if (RX_EXPANDIDA.test(b.nome) || RX_SECAO.test(b.nome)) return;
        // só vira nome da próxima subclasse um título com parágrafo de verdade (não tabela de magias)
        const cheias = b.linhas.filter((x) => x).length || 1;
        const linhasNum = b.linhas.filter((x) => /^\d/.test(x)).length;
        const tabela = linhasNum >= 3 && linhasNum / cheias > 0.45;
        // "Escolha o terreno – ártico, costa…" seguido de uma tabela de magias por terreno: cada tabela é uma opção
        const ultima = g && (g.extras.length ? g.extras[g.extras.length - 1] : g.f[g.f.length - 1]);
        if (tabela && ultima && !ultima._split && /escolh[ae] (o|a|um|uma) [a-zà-ÿ]+\s*[–—:-]/i.test(ultima._full || "") && norm(ultima._full || "").includes(norm(b.nome).slice(0, 5))) {
          const tmp = { magias: {} };
          if (lerMagiasBloco(b, tmp)) {
            ultima.esc = ultima.esc || { n: 1, ops: [], titulo: ultima.nome };
            ultima.esc.ops.push({ nome: capitalizar(b.nome), d: Object.entries(tmp.magias).map(([n, l]) => `${n}º: ${l.join(", ")}`).join(" · "), a: "passiva", r: "" });
            ultima.duvida = false;
            return;
          }
        }
        if (tabela) return; // tabela (de magias, de espaços…), não é habilidade
        // "Você escolhe um tipo de dragão" + tabelinha "Azul Elétrico / Branco Frio…": cada linha é uma opção
        const lt = (x) => x && x.length < 32 && !/[.,;:!?]$/.test(x) && x.split(/\s+/).length <= 3 && /^[A-ZÀ-Ý]/.test(x);
        const cheiasL = b.linhas.filter((x) => x);
        let nt = 0; while (nt < cheiasL.length && lt(cheiasL[nt])) nt++;
        if (ultima && !ultima.esc && nt >= 4 && /escolh[ae] (um|uma) (tipo|tipos) de/i.test(ultima._full || "")) {
          ultima.esc = { n: 1, ops: cheiasL.slice(0, nt).map((x) => { const w = x.split(/\s+/); return { nome: w.length === 2 ? `${w[0]} (${w[1]})` : x, d: "", a: "passiva", r: "" }; }), titulo: ultima.nome };
          const resto = montarParagrafos(cheiasL.slice(nt));
          if (resto) { ultima._full = (ultima._full || "") + "\n" + resto; ultima.d = resumir(ultima._full); }
          return;
        }
        // quadro lateral (texto em 3ª pessoa, sem "você"): não é habilidade
        const quadro = (!/(^|[^a-zà-ÿ])(voc[eê]|you)(?![a-zà-ÿ])/i.test(b.d.slice(0, 400)) && b.d.length > 300) || !/[.!?]/.test(b.d); // ou pedaço de tabela, sem frase nenhuma
        if (pend.fixo) { if (g && b.d && b.d.length >= 50 && !quadro) g.extras.push(feat(b, false, lastN)); return; }
        // "Dogmas de Devoção", "Magias de Juramento" logo depois de "Juramento de Devoção": é parte dela, não outra subclasse
        const palsN = (x) => norm(x || "").split(/[^a-z]+/).filter((w) => w.length >= 4 && !/^(juramento|dominio|circulo|caminho|colegio|patrono|escola|tradicao|conclave|arquetipo|magias?)$/.test(w));
        const daPend = pend.nome && (!g || g.nome !== pend.nome) && (RX_MAGIAS_BLOCO.test(b.nome) || /^(dogmas?|tenets|princ[ií]pios|c[oó]digo)\b/i.test(b.nome) || palsN(b.nome).some((w) => palsN(pend.nome).includes(w)));
        if (daPend) { if (!pend.d) pend.d = b.d; }
        else if (b.d.length >= 60 && linhasNum / cheias <= 0.4) pend = { nome: b.nome, d: b.d, magias: pend.magias };
        else if (/^(subclasse|subclass)\b.*:/i.test(b.nome) || (!b.d && !pend.nome)) pend = { nome: b.nome, d: b.d, magias: pend.magias };
        if (g && b.d && b.d.length >= 50 && !quadro) g.extras.push(feat(b, false, lastN));
      });
      // grupo com Melhoria de Atributo ou campos de classe é o texto da classe, não subclasse
      const RX_INTRO_FORA = /caracter[ií]sticas opcionais|recebe novas caracter[ií]sticas|optional class features|gains new features/i;
      res.subs = grupos.filter((x) => x.f.length && !RX_GRUPO_FORA.test(x.nome || "") && !(RX_INTRO_FORA.test(String(x.d || "").slice(0, 400)) && x === grupos[0]) && !RX_GRUPO_FORA.test(x.f[0].nome) && !x.f.some((f) => RX_ASI.test(f.nome) || /^(testes? de resist|per[ií]cias|dados? de vida)/i.test(f.nome))).map((x) => ({
        nome: capitalizar(String(x.nome || "").replace(/^(subclasse|subclass)[^:]*:\s*/i, "")).slice(0, 60),
        d: resumir(x.d, 120, 260),
        // poderes separados que na verdade são as opções já escolhidas em outra habilidade (Guardião/Infiltrador)
        f: (() => { const ops = new Set(x.f.filter((f) => f.esc).flatMap((f) => f.esc.ops.map((o) => norm(o.nome)))); return x.f.filter((f) => !(f._split && ops.has(norm(f.nome)))); })(),
        magias: x.magias,
        anun: x.anun,
      }));
      if (res.subs.length > 1) res.subs = res.subs.filter((x) => x.nome && (x.f.length > 1 || x.anun || res.subs.every((y) => y.f.length <= 1)));
      res.subs.forEach((x) => delete x.anun);
      if (!res.subs.length && grupos.length) res.subs = [{ nome: primeiroTitulo, d: resumir(res.d, 120, 260), f: grupos.flatMap((x) => x.f), magias: {} }];
      const s0 = res.subs[0] || { nome: primeiroTitulo, d: res.d, f: [], magias: {} };
      res.nome = s0.nome; res.d = s0.d; res.f = s0.f; res.magias = s0.magias;
    } else {
      /* ---- sem tabela: nível vem do título, do texto ou da habilidade anterior ---- */
      let ultimo = 0, maxN = 0, viuNivel = false, fora = false;
      blocos.forEach((b, idx) => {
        if (!b.n) { const n1 = nivelNoTexto(b.d); if (n1) { b.n = n1; b.certo = true; } }
        if (modo === "classe" && b.certo && maxN >= 10 && b.n <= 3 && idx > 3) fora = true;
        // "ARQUÉTIPOS DE LADINO": daqui pra baixo são as subclasses
        const raizSub = norm(c.subNome || "").split(" ")[0];
        if (modo === "classe" && maxN >= 5 && (/^(especializa[cç][oõ]es|arqu[eé]tipos|tradi[cç][oõ]es|caminhos|juramentos|col[eé]gios|dom[ií]nios|c[ií]rculos|origens|patronos|conclaves|trilhas|subclasses)\b/i.test(b.nome) || (raizSub.length >= 4 && new RegExp("^" + raizSub + "s\\b").test(norm(b.nome))))) fora = true;
        if (fora) { b.fora = true; res.outraSub = true; res.ignoradas++; return; }
        if (b.certo) { viuNivel = true; maxN = Math.max(maxN, b.n); ultimo = b.n; }
        else { b.n = ultimo; b.antes = !viuNivel; }
      });
      blocos.forEach((b) => {
        if (b.fora) return;
        if (RX_MAGIAS_BLOCO.test(b.nome)) {
          if (RX_EXPANDIDA.test(b.nome)) return;
          const achou = lerMagiasBloco(b, res);
          if (achou) return;
        }
        if (RX_EXPANDIDA.test(b.nome)) return;
        if (RX_SECAO.test(b.nome)) return;
        if (b.antes) return; // texto de apresentação antes da primeira habilidade
        if (!b.d && !b.certo) return;
        if (modo === "classe") {
          if (RX_ASI.test(b.nome)) { if (b.n) asi.add(b.n); (String(b.d).slice(0, 160).split(/voc[eê] pode|you can/i)[0].match(/\b\d{1,2}(?=\s*[°ºª]|st|nd|rd|th)/g) || []).forEach((x) => { if (Number(x) >= 2 && Number(x) <= 20) asi.add(Number(x)); }); return; }
          // "você escolhe um arquétipo…: Assassino, Ladrão ou Trapaceiro Arcano, todos detalhados no final": escolha da subclasse
          // "Trilha do Caçador: escolha sua trilha (subclasse)"
          if (b.d.length < 300 && /\(sub-?classe\)|\(subclass\)|escolh\w*\s+(a\s+|sua\s+)?sub-?classe|choose (a|your) subclass/i.test(b.d + " " + b.nome)) {
            if (!c.subNome) c.subNome = capitalizar(b.nome);
            if (b.n) subN.add(b.n);
            return;
          }
          if (/escolhe (um|uma)|escolha (um|uma)|choose (a|an|one)/i.test(b.d.slice(0, 200)) && /detalhad[oa]s?\s+(no|ao)\s+final|described at the end|detalhad[oa]s? (mais )?(abaixo|adiante)/i.test(b.d)) {
            if (!c.subNome) c.subNome = capitalizar(b.nome);
            (b.d.match(/\b\d{1,2}(?=\s*[°ºª]|st|nd|rd|th)/g) || []).forEach((x) => { if (Number(x) <= 20) subN.add(Number(x)); });
            return;
          }
          if (RX_DADIVA.test(b.nome)) { c.dadiva = true; return; }
          if (RX_SUBF.test(b.nome) && b.d.length < 400) { if (b.n) subN.add(b.n); return; }
        }
        const an = analisar(b.nome, b.d);
        res.f.push({ n: b.n || 1, nome: b.nome.slice(0, 70), d: resumir(b.d), a: an.a, u: an.u, r: an.r, imp: true, duvida: !b.certo || !b.d });
      });
    }
    const nMag = Object.values(res.magias).flat().length;
    if (nMag) res.achados.push(`${nMag} magias`);

    if (modo === "classe") {
      if (asi.size) c.asi = [...asi].sort((a, b) => a - b);
      if (subN.size) c.subNiveis = [...subN].sort((a, b) => a - b);
      const dvm = (camposLinhas.dv || "").match(/d\s?(6|8|10|12)\b/i);
      if (dvm) c.dv = Number(dvm[1]);
      if (camposLinhas.saves) { const s = atrsEm(camposLinhas.saves).slice(0, 2); if (s.length) c.saves = s; }
      if (camposLinhas.prim) { const s = atrsEm(camposLinhas.prim).slice(0, 2); if (s.length) c.prim = s; }
      if (camposLinhas.per) {
        const t = norm(camposLinhas.per);
        const m = t.match(/(?:escolha|choose|escolhe)\s+(\w+)/);
        if (m && numDe(m[1])) c.perN = Math.min(4, numDe(m[1]));
        if (!/qualquer|any/.test(t)) { const l = periciasEm(camposLinhas.per); if (l.length > (c.perN || 2)) c.perDe = l; }
      }
      if (camposLinhas.armas) c.armas = camposLinhas.armas.replace(/\.$/, "").slice(0, 80);
      if (camposLinhas.armaduras) c.armaduras = camposLinhas.armaduras.replace(/\.$/, "").slice(0, 80);
      // conjuração
      const conjF = res.f.find((f) => /^(conjura[cç][aã]o|spellcasting|magia de pacto|pact magic)/i.test(f.nome));
      if (conjF) {
        const tOrig = conjF._conjTxt || conjF._full || conjF.d;
        const t = norm(tOrig);
        // regras de quantas magias aprender/preparar, quando a tabela não tem coluna
        const NUMR = "(um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|\\d+)";
        const rg = {};
        let m1 = t.match(new RegExp("(?:contendo|com|conhece|aprende|escolhe|escolha)\\s+" + NUMR + "\\s+magias\\s+(?:de\\s+(?!1|primeiro)[a-z]+\\s+)?(?:de\\s+)?(?:1|primeiro)"));
        if (m1) rg.inicial = numDe(m1[1]);
        m1 = t.match(new RegExp("(?:cada vez que|sempre que|toda vez que)\\s+(?:voce\\s+)?(?:adquire|ganha|alcanca|sobe|atinge)[^.]{0,40}nivel[^.]{0,90}?" + NUMR + "\\s+magias"));
        if (!m1) m1 = t.match(new RegExp("a cada nivel de [a-z]+ (?:adquirido|que voce adquire|que voce ganha)[^.]{0,60}?" + NUMR + "\\s+magias"));
        if (m1) rg.porNivel = numDe(m1[1]);
        m1 = t.match(/igual ao (?:seu )?modificador de (\w+)\s*\+\s*(?:a metade do |metade do )?(?:seu )?nivel/);
        if (m1) { const k = atrsEm(m1[1])[0]; if (k) rg.preparo = { atr: k, meio: /\+\s*(a )?metade do (seu )?nivel/.test(t) }; }
        const frases = String(tOrig).replace(/\n/g, " ").match(/[^.!?]+[.!?]/g) || [];
        const nota = frases.find((f) => /escolas?\b|abjura[cç][aã]o|evoca[cç][aã]o|ilus[aã]o|encantamento|necromancia|adivinha[cç][aã]o|transmuta[cç][aã]o/i.test(f) && /devem?|precisa|deve ser|must/i.test(f));
        if (nota) rg.nota = nota.trim().slice(0, 220);
        if (Object.keys(rg).length) c.magRegra = rg;
        if (/^(magia de pacto|pact magic)/i.test(conjF.nome)) c.conj = "pacto";
        else c.conj = /meio|half|paladino|patrulheiro|ranger|paladin|5[º°o]? circulo|5th level/.test(t) && !/9[º°o]? circulo|9th/.test(t) ? "meio" : "total";
        const m = t.match(/(\w+) (?:e|eh) (?:o |a )?(?:seu|sua) (?:atributo|habilidade) (?:de conjuracao|para (?:voce )?conjurar)|(\w+) is your spellcasting ability|(?:atributo|habilidade) de conjuracao (?:e|eh) (?:a |o )?(\w+)/);
        const k = m ? atrsEm(m[1] || m[2] || m[3])[0] : null;
        if (k) c.atrConj = k;
      }
      // a tabela diz até que círculo vai: até o 5º é meio conjurador
      if (c.conj && c.conj !== "pacto" && c.tab) { const circ = c.tab.cols.filter((x) => /^\dº$/.test(x)).map((x) => parseInt(x)); if (circ.length) c.conj = Math.max(...circ) <= 5 ? "meio" : "total"; }
      if (!c.prim && c.atrConj && c.conj) c.prim = [c.atrConj];
    }

    // classe: as subclasses que vieram junto no texto também são separadas
    if (modo === "classe" && !ler._dentro) {
      ler._dentro = true;
      try {
        // sem tabela e sem dado de vida/resistências: não é uma classe inteira (é suplemento com subclasses)
        res.naoClasse = Object.keys(res.tabela).length < 3 && !res.campos.dv && !res.campos.saves;
        if (res.naoClasse) { res.f = []; res.campos = {}; }
        const nomesClasse = new Set(res.f.map((f) => chave(f.nome)));
        res.subs = (ler(txt, "sub").subs || []).filter((x) => x.f.length && x.f.filter((f) => nomesClasse.has(chave(f.nome))).length < 2);
      } finally { ler._dentro = false; }
    }
    // listas de opções do texto (Manobras, Invocações…) viram escolhas nas habilidades que mandam escolher
    if (!ler._dentro) {
      const todas = res.f.concat(...(res.subs || []).map((x) => x.f));
      ligarSubsecoes(todas);
      listasDeOpcoes(blocos, res.campos.subNome).forEach((L) => ligarLista(L, todas, res.campos.tab));
      todas.forEach((f) => { delete f._full; delete f._conjTxt; delete f._split; });
      const nOps = todas.filter((f) => f.esc).reduce((t, f) => t + f.esc.ops.length, 0);
      if (nOps) res.achados.push(`${nOps} opções pra escolher`);
    }
    const NOME = { for: "Força", des: "Destreza", con: "Constituição", int: "Inteligência", sab: "Sabedoria", car: "Carisma" };
    if (c.dv) res.achados.push(`dado de vida d${c.dv}`);
    if (c.saves) res.achados.push(`resistências de ${c.saves.map((k) => NOME[k]).join(" e ")}`);
    if (c.perDe && c.perDe.length) res.achados.push(`${c.perN || 2} perícias entre ${c.perDe.length}`);
    if (c.asi) res.achados.push(`melhorias nos níveis ${c.asi.join(", ")}`);
    if (c.subNiveis) res.achados.push(`${(c.subNome || "subclasse").toLowerCase()} nos níveis ${c.subNiveis.join(", ")}`);
    if (c.conj) res.achados.push(c.conj === "meio" ? "meio conjurador" : c.conj === "pacto" ? "magia de pacto" : "conjurador");
    return res;
  }

  window.lerTextoColado = ler;
  window.limparTextoColado = limparColado;
})();

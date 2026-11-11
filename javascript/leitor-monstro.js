/* Leitor de bloco de estatísticas de criatura ("Colar texto" do Grimório do mestre).
   Lê o texto que o mestre colou (anotação, conversa, site, PDF; português ou inglês)
   e devolve criaturas no mesmo formato do bestiário do app (CATALOGO_MONSTROS). */
(function () {
  "use strict";

  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const MENOS = /[−–—]/g;
  const PEQ = ["de", "da", "do", "das", "dos", "e", "em", "a", "o", "com", "na", "no", "of", "the", "and"];
  function capitalizar(t) {
    const s = String(t || "").trim();
    if (!s) return s;
    const letras = (s.match(/[A-Za-zÀ-ÿ]/g) || []).length, maius = (s.match(/[A-ZÀ-Ý]/g) || []).length;
    if (letras && maius / letras < 0.7) return s.charAt(0).toUpperCase() + s.slice(1);
    return s.toLowerCase().split(/\s+/).map((w, i) => (i && PEQ.includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(" ");
  }

  /* ---------- inglês → português (só o que vira etiqueta/campo) ---------- */
  const TAM = [
    [/^(mi[uú]d[oa]|min[uú]scul[oa]|tiny)$/i, "Miúdo"], [/^(pequen[oa]|small)$/i, "Pequeno"], [/^(m[eé]di[oa]|medium)$/i, "Médio"],
    [/^(grande|large)$/i, "Grande"], [/^(enorme|huge)$/i, "Enorme"], [/^(imens[oa]|colossal|gargantuan|gigantesc[oa])$/i, "Colossal"],
  ];
  const TIPO_EN = { aberration: "Aberração", beast: "Fera", celestial: "Celestial", construct: "Constructo", dragon: "Dragão", elemental: "Elemental", fey: "Feérico", fiend: "Corruptor", giant: "Gigante", humanoid: "Humanoide", monstrosity: "Monstruosidade", ooze: "Limo", plant: "Planta", undead: "Morto-vivo", swarm: "Enxame" };
  const DANO_EN = { bludgeoning: "concussão", piercing: "perfurante", slashing: "cortante", fire: "fogo", cold: "frio", lightning: "elétrico", thunder: "trovejante", poison: "veneno", acid: "ácido", psychic: "psíquico", necrotic: "necrótico", radiant: "radiante", force: "energia" };
  const COND_EN = { blinded: "cego", charmed: "enfeitiçado", deafened: "surdo", exhaustion: "exaustão", frightened: "amedrontado", grappled: "agarrado", incapacitated: "incapacitado", invisible: "invisível", paralyzed: "paralisado", petrified: "petrificado", poisoned: "envenenado", prone: "caído", restrained: "contido", stunned: "atordoado", unconscious: "inconsciente" };
  const ALIN_EN = { lawful: "leal", chaotic: "caótico", neutral: "neutro", good: "bom", evil: "mau", unaligned: "sem tendência", any: "qualquer", alignment: "tendência" };
  const SENT_EN = [[/darkvision/gi, "Visão no escuro"], [/blindsight/gi, "Percepção às cegas"], [/tremorsense/gi, "Sentido sísmico"], [/truesight/gi, "Visão verdadeira"], [/passive perception/gi, "Percepção passiva"]];
  const VEL_EN = [[/\bclimb\b/gi, "escalada"], [/\bfly\b/gi, "voo"], [/\bswim\b/gi, "natação"], [/\bburrow\b/gi, "escavação"], [/\bhover\b/gi, "flutuar"]];
  const PER_EN = { acrobatics: "Acrobacia", "animal handling": "Lidar com Animais", arcana: "Arcanismo", athletics: "Atletismo", deception: "Enganação", history: "História", insight: "Intuição", intimidation: "Intimidação", investigation: "Investigação", medicine: "Medicina", nature: "Natureza", perception: "Percepção", performance: "Atuação", persuasion: "Persuasão", religion: "Religião", "sleight of hand": "Prestidigitação", stealth: "Furtividade", survival: "Sobrevivência" };

  // "30 ft." → "9 m" ; "60-foot" → "18 m"
  const pes = (n) => { const m = Math.round(Number(n) * 0.3 * 10) / 10; return String(m).replace(".", ","); };
  function metros(t) {
    return String(t || "")
      .replace(/(\d+)\s*\/\s*(\d+)\s*(?:ft\.?|feet)(?![a-z])/gi, (m, a, b) => `${pes(a)}/${pes(b)} m`)
      .replace(/(\d+(?:,\d{3})*)\s*(?:-|\s)?(?:ft\.?|feet|foot)(?![a-z])/gi, (m, n) => `${pes(n.replace(/,/g, ""))} m`)
      .replace(/(\d+)\/(\d+)\s*m\b/g, "$1/$2 m");
  }
  const trocar = (t, mapa) => String(t || "").replace(/[A-Za-z]+(?: [a-z]+)?/g, (w) => { const k = w.toLowerCase(); return mapa[k] || (mapa[k.split(" ")[0]] ? mapa[k.split(" ")[0]] + w.slice(k.split(" ")[0].length) : w); });

  /* ---------- linhas ---------- */
  function linhas(txt) {
    let t = String(txt || "").replace(/\r/g, "").replace(/­/g, "").replace(/[​﻿]/g, "").replace(/\t/g, " ").replace(/ {2,}/g, " ");
    t = t.replace(/([a-zà-ÿ])-\n\s*([a-zà-ÿ])/g, "$1$2"); // palavra quebrada com hífen
    t = t.replace(/([a-zà-ÿ]{3})(à|às)(?= )/g, "$1 $2");
    const ls = t.split("\n").map((l) => l.trim());
    // número sozinho é página, a não ser que venha logo depois de FOR/DES/… (atributo um por linha)
    return ls.filter((l, k) => {
      if (!l) return false;
      if (/^\d{1,4}$/.test(l)) { const a = (ls.slice(0, k).reverse().find((x) => x) || ""); return /^(for|des|con|int|sab|car|str|dex|wis|cha)\.?$/i.test(a); }
      return !/system reference document/i.test(l) && !/^(ap[eê]ndice|cap[ií]tulo|chapter)\s+[a-z0-9]+\s*[:|]/i.test(l) && !/^(fonte|source)\s*:?\s+\S/i.test(l);
    });
  }

  /* ---------- reconhecer as linhas do cabeçalho ---------- */
  const RX_CA = /^(?:classe de armadura|armor class|ca|ac)\s*:?\s*(\d{1,2})\b(.*)$/i;
  const RX_PV = /^(?:pontos de vida|hit points|pv|hp)\s*:?\s*(\d{1,4})\s*(?:\(([^)]*)\))?(.*)$/i;
  const RX_VEL = /^(?:deslocamento|desloc\.?|movimento|velocidade|speed)\s*:?\s*(.+)$/i;
  const CAMPOS = [
    ["sv", /^(?:testes? de resist[eê]ncia|testes|salvaguardas?|saving throws?|saves?)\s*:?\s*(.*)$/i],
    ["per", /^(?:per[ií]cias|skills)\s*:?\s*(.*)$/i],
    ["vul", /^(?:vulnerabilidades?(?: a dano| de dano)?|damage vulnerabilities|vulnerabilities)\s*:?\s*(.*)$/i],
    ["res", /^(?:resist[eê]ncias?(?: a danos?| de danos?)?|damage resistances|resistances)\s*:?\s*(.*)$/i],
    ["cond", /^(?:imunidades? (?:a|de) condi[cç][oõ]es|imunidades? (?:a|de) condi[cç][aã]o|condition immunities)\s*:?\s*(.*)$/i],
    ["imu", /^(?:imunidades?(?: a danos?| de danos?)?|imunes?|damage immunities|immunities)\s*:?\s*(.*)$/i],
    ["equip", /^(?:equipamento|gear)\s*:?\s*(.*)$/i],
    ["sen", /^(?:sentidos|senses)\s*:?\s*(.*)$/i],
    ["idi", /^(?:idiomas|l[ií]nguas|languages)\s*:?\s*(.*)$/i],
    ["nd", /^(?:n[ií]vel de desafio|desafio|nd|challenge|cr)\s*:?\s*([\d/½¼⅛]+.*)$/i],
    ["ini", /^(?:iniciativa|initiative)\s*:?\s*(.*)$/i],
    ["pb", /^(?:b[oô]nus de profici[eê]ncia|proficiency bonus)\s*:?\s*(.*)$/i],
  ];
  const ATR = ["for", "des", "con", "int", "sab", "car"];
  const RX_ATR_ROT = /^(for|des|con|int|sab|car|str|dex|wis|cha)\b/i;
  const ROT_ATR = { for: 0, str: 0, des: 1, dex: 1, con: 2, int: 3, sab: 4, wis: 4, car: 5, cha: 5 };
  const RX_SECAO = /^(tra[cç]os|caracter[ií]sticas|habilidades especiais|habilidades|passivas|ataques|traits|a[cç][oõ]es b[oô]nus|bonus actions|a[cç][oõ]es lend[aá]rias|legendary actions|a[cç][oõ]es m[ií]ticas|mythic actions|a[cç][oõ]es de covil|lair actions|efeitos regionais|regional effects|rea[cç][oõ]es|reactions|a[cç][oõ]es|actions)\s*:?$/i;
  const secaoDe = (l) => {
    const n = norm(l).replace(/:$/, "").trim();
    if (/^(tracos|caracteristicas|habilidades especiais|habilidades|passivas|traits)$/.test(n)) return "h";
    if (/^ataques$/.test(n)) return "a";
    if (/bonus/.test(n)) return "b";
    if (/lendari|legendary/.test(n)) return "l";
    if (/miticas|mythic|covil|lair|regionais|regional/.test(n)) return "x";
    if (/^(reacoes|reactions)$/.test(n)) return "r";
    if (/^(acoes|actions)$/.test(n)) return "a";
    return null;
  };
  const ehCampo = (l) => RX_CA.test(l) || RX_PV.test(l) || RX_VEL.test(l) || CAMPOS.some(([, rx]) => rx.test(l)) || RX_ATR_ROT.test(l) || /^mod\s+(tr|save)/i.test(l);

  // "Besta grande, neutro e bom" · "Large Aberration, Lawful Evil" · "Aberração Grande, Leal e Mau"
  function linhaTipo(l) {
    if (!l || l.length > 90 || /[.:;]$/.test(l)) return null;
    let prof = 0, iv = -1;
    for (let k = 0; k < l.length; k++) { if (l[k] === "(") prof++; else if (l[k] === ")") prof--; else if (l[k] === "," && !prof) { iv = k; break; } }
    const antes = iv >= 0 ? l.slice(0, iv) : l;
    // "Medium or Small Humanoid", "Médio ou Pequeno": fica o primeiro tamanho
    let base = antes.replace(/\(.*?\)/g, " ").replace(/\b(or|ou)\s+(tiny|small|medium|large|huge|gargantuan|mi[uú]d[oa]|pequen[oa]|m[eé]di[oa]|grande|enorme|imens[oa])\b/i, " ");
    let enxame = false;
    base = base.replace(/\bswarm of (tiny|small|medium) (\w+)|\benxame de (\S+) (\S+)/i, () => { enxame = true; return "Enxame"; });
    const ws = base.trim().split(/\s+/);
    const iTam = ws.findIndex((w) => TAM.some(([rx]) => rx.test(w)));
    if (iTam < 0 || ws.length > 6) return null;
    const tam = TAM.find(([rx]) => rx.test(ws[iTam]))[1];
    let tipo = ws.filter((_, i) => i !== iTam).join(" ");
    const PAR_EN = { devil: "diabo", demon: "demônio", chromatic: "cromático", metallic: "metálico", dinosaur: "dinossauro", goblinoid: "goblinoide", shapechanger: "metamorfo", titan: "titã", wizard: "mago", cleric: "clérigo", angel: "anjo", genie: "gênio", lycanthrope: "licantropo" };
    let par = (antes.match(/\(([^)]*)\)/) || [])[1];
    if (par) par = par.split(/,\s*/).map((w) => PAR_EN[norm(w)] || w).join(", ");
    if (TIPO_EN[norm(tipo)]) tipo = TIPO_EN[norm(tipo)];
    if (enxame) tipo = "Enxame";
    tipo = capitalizar(tipo.toLowerCase()) + (par ? ` (${par.toLowerCase()})` : "");
    let tend = iv >= 0 ? l.slice(iv + 1).trim() : "";
    if (/^[a-z ]+$/i.test(tend) && /lawful|chaotic|neutral|unaligned|good|evil|any/i.test(tend)) {
      const w = tend.toLowerCase().split(/\s+/);
      tend = w.length === 2 && ALIN_EN[w[0]] && ALIN_EN[w[1]] && w[0] !== "any" ? `${ALIN_EN[w[0]]} e ${ALIN_EN[w[1]]}` : w.map((p) => ALIN_EN[p] || p).join(" ");
      if (tend === "neutro neutro") tend = "neutro";
    }
    if (/^(imparcial|unaligned)$/i.test(tend)) tend = "sem tendência";
    tend = tend ? tend.charAt(0).toUpperCase() + tend.slice(1).toLowerCase() : "";
    return { tam, tipo: tipo || "Criatura", tend };
  }

  /* ---------- atributos: "FOR / 16 (+3)", "FOR DES… / 16 (+3) 17 (+3)…", "Str 21 +5 +5 Dex 9 −1 +3…" ---------- */
  function lerAtributos(txt) {
    const t = String(txt).replace(MENOS, "-");
    const at = [null, null, null, null, null, null], sv = [null, null, null, null, null, null];
    // rótulo seguido do valor
    const rx = /\b(FOR|DES|CON|INT|SAB|CAR|STR|DEX|WIS|CHA)\.?\s*:?\s*(\d{1,2})\b(?:\s*\(\s*[+-]?\d+\s*\))?(?:\s+([+-]\d+)\s+([+-]\d+))?/gi;
    let m, achou = 0;
    while ((m = rx.exec(t))) {
      const i = ROT_ATR[m[1].toLowerCase()];
      if (at[i] === null) { at[i] = Number(m[2]); achou++; if (m[4] !== undefined) sv[i] = Number(m[4]); }
    }
    if (achou >= 6) return { at, sv };
    // rótulos todos juntos, valores depois
    const nums = (t.replace(/\b(FOR|DES|CON|INT|SAB|CAR|STR|DEX|WIS|CHA)\b/gi, " ").match(/(?<![+\-\d(])\b\d{1,2}\b(?!\s*[)d])/g) || []).map(Number).filter((n) => n >= 1 && n <= 30);
    if (nums.length >= 6) return { at: nums.slice(0, 6), sv };
    return null;
  }

  /* ---------- entradas "Nome. texto" ---------- */
  const PRON = /^(o|a|os|as|um|uma|se|ele|ela|eles|elas|quando|enquanto|cada|essa|esse|este|esta|isso|voc[eê]|caso|ap[oó]s|at[eé]|the|if|it|its|a|an|when|while|each|this|that|on|until|after)$/i;
  function entradaDe(l, ant) {
    if (ant && !/^[-–—•·*]\s+/.test(l) && !/[.!?]["”]?$/.test(ant) && !(RX_SECAO.test(ant) && secaoDe(ant)) && !(ant === ant.toUpperCase() && /[A-ZÀ-Ý]{3}/.test(ant)) && !/^(n[ií]vel de desafio|desafio|nd|cr|challenge|idiomas|languages|sentidos|senses|b[oô]nus de prof)/i.test(ant)) return null;
    const bala = /^[-–—•·*]\s+/.test(l);
    l = l.replace(/^[-–—•·*]\s+/, "");
    // "- Mordida: +5 para acertar…" (lista de conversa)
    const mDois = (bala || !ant || /[.!?:]$/.test(ant) || (RX_SECAO.test(ant) && secaoDe(ant))) && !/^(acerto|hit|falha|sucesso|failure|success|gatilho|resposta|trigger|response|dano|damage|(melee|ranged|melee or ranged)( weapon| spell)? attack( roll)?|jogada de ataque[^:]*|ataque (corpo|[aà] dist)[^:]*|saving throw|teste de resist[eê]ncia[^:]*)\s*:/i.test(l) ? l.match(/^([A-ZÀ-Ý][^:.!?]{1,60}?)\s*:\s+(\S.*)$/) : null;
    const m = mDois || l.match(/^([A-ZÀ-Ý0-9][^.!?]{1,80}?)\.\s+(.*)$/) || l.match(/^([A-ZÀ-Ý][^.!?]{1,80}?\))\.?\s*$/) || l.match(/^([A-ZÀ-Ý][^.!?]{1,60})\.$/);
    if (!m) return null;
    const nome = m[1].trim();
    const semPar = nome.replace(/\(.*?\)/g, "").trim();
    const ws = semPar.split(/\s+/);
    if (!semPar || ws.length > 7 || PRON.test(ws[0]) || /^\d/.test(semPar) || /:/.test(semPar) || /\d+\s*\(\d+d\d+/.test(nome)) return null;
    if (/^(failure|success|failure or success|trigger|response|first failure|second failure|falha|sucesso|falha ou sucesso|gatilho|resposta|primeira falha|segunda falha|hit|miss|acerto|erro)$/i.test(semPar)) return null;
    // palavra comprida em minúscula no meio = frase, não nome (exceto ligações curtas)
    const minusc = ws.slice(1).filter((w) => /^[a-zà-ÿ]{4,}/.test(w)).length;
    if (minusc > Math.max(1, Math.floor(ws.length / 2))) return null;
    return { nome, txt: m[2] || "" };
  }

  /* ---------- ataque: bônus, dano e o resto ---------- */
  const RX_ATAQUE = /(ataque (?:corpo[ -]a[ -]corpo|[aà] dist[aâ]ncia|corpo[ -]a[ -]corpo ou [aà] dist[aâ]ncia)(?: com (?:arma|magia))?|jogada de ataque (?:corpo a corpo|[aà] dist[aâ]ncia|corpo a corpo ou [aà] dist[aâ]ncia)|(?:melee|ranged|melee or ranged) (?:weapon |spell )?attack(?: roll)?)\s*:?\s*([+-]\s?\d+)/i;
  function tipoDano(w) {
    const k = norm(w);
    if (DANO_EN[k]) return DANO_EN[k];
    if (k === "contundente" || k === "impacto") return "concussão";
    return String(w || "").toLowerCase();
  }
  function lerAtaque(nome, txt) {
    const t = metros(String(txt).replace(MENOS, "-"));
    const m = t.match(RX_ATAQUE);
    if (!m) return lerAtaqueSolto(nome, t);
    const bonus = parseInt(m[2].replace(/\s/g, ""), 10);
    const dist = (t.match(/(?:dist[aâ]ncia|range|alcance)\s+([\d,]+\s*m?\s*\/\s*[\d,]+\s*m)/i) || [])[1];
    const alc = (t.match(/(?:alcance|reach)\s+([\d,]+\s*m)/i) || [])[1];
    // "Acerto: 6 (1d6 + 3) de dano perfurante" · "Hit: 12 (2d6 + 5) Bludgeoning damage"
    let iHit = t.search(/\b(acerto|hit|dano)\s*:/i);
    let depois = iHit >= 0 ? t.slice(iHit).replace(/^\S+\s*:\s*/, "") : "";
    // sem "Acerto:": "…alcance 1,5 m. 15 (2d10 + 4) de dano perfurante."
    if (iHit < 0) { const j = t.slice(m.index + m[0].length).search(/\b\d+\s*\(\s*\d+d\d+/); if (j >= 0) depois = t.slice(m.index + m[0].length + j); }
    const RX_DANO = /(\d+)\s*\(\s*(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*\)\s*(?:de dano\s+(?:de\s+)?)?([A-Za-zÀ-ÿ]+)?(?:\s+damage)?/i;
    const RX_FIXO = /^(\d+)\s+(?:de dano\s+(?:de\s+)?)?([A-Za-zÀ-ÿ]+)/i;
    let dano = "", resto = depois, extras = [];
    const md = depois.match(RX_DANO);
    if (md && md.index < 20) {
      let tp = md[3] || "";
      if (/^(de|dano|damage|plus|mais|e|and)$/i.test(tp)) tp = "";
      dano = `${md[2].replace(/\s+/g, "")}${tp ? " " + tipoDano(tp) : ""}`;
      resto = depois.slice(md.index + md[0].length);
      // dano a mais: "mais 5 (2d4) de dano de fogo" / "plus 5 (2d4) Fire damage"
      const RX_MAIS = /^\s*,?\s*(?:mais|plus|e|and)\s+(\d+)\s*\(\s*(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*\)\s*(?:de dano\s+(?:de\s+)?)?([A-Za-zÀ-ÿ]+)?(?:\s+damage)?/i;
      let mm;
      while ((mm = resto.match(RX_MAIS))) { extras.push(`+${mm[2].replace(/\s+/g, "")}${mm[3] ? " de " + tipoDano(mm[3]) : ""}`); resto = resto.slice(mm[0].length); }
    } else {
      const mf = depois.match(RX_FIXO);
      if (mf && !/^(o|a|the)$/i.test(mf[2])) { dano = `${mf[1]} ${tipoDano(mf[2])}`; resto = depois.slice(mf[0].length); }
    }
    resto = resto.replace(/^[\s.,;]+/, "").replace(/^(?:e|and)\s+/i, "").trim();
    if (!(extras.length && /^(se|if|caso)\b/i.test(resto))) resto = resto.charAt(0).toUpperCase() + resto.slice(1);
    extras = extras.map((e) => e.replace(/ de (\S+)$/, (m, w) => (/^(fogo|frio|veneno|[aá]cido|energia|for[cç]a)$/i.test(w) ? m : " " + w)));
    if (!dano && depois) resto = depois.trim();
    const nota = [alc && dist ? `Alcance ${alc} ou distância ${dist.replace(/\s*m\s*\//, "/").replace(/\s*\/\s*/, "/")}.` : alc ? `Alcance ${alc}.` : dist ? `Distância ${dist.replace(/\s*m\s*\//, "/").replace(/\s+/g, " ").replace(/\s*\/\s*/, "/")}.` : "", extras.join(" "), resto].filter(Boolean).join(" ").replace(/\s{2,}/g, " ").trim();
    return [nome, bonus, dano, nota];
  }

  // jeito de mesa: "+5 para acertar, 2d6+3 perfurante + 1d6 de fogo"
  function lerAtaqueSolto(nome, t) {
    const mb = t.match(/([+-]\s?\d{1,2})\s*(?:para acertar|pra acertar|p\/\s*acertar|to hit|de acerto|no acerto|acerto)\b/i) || t.match(/\b(?:acerto|ataque)\s*:?\s*([+-]\s?\d{1,2})\b/i);
    if (!mb) return null;
    const bonus = parseInt(mb[1].replace(/\s/g, ""), 10);
    let resto = t.slice(mb.index + mb[0].length).replace(/^[\s,;.]+/, "");
    const md = resto.match(/(?:\d+\s*\(\s*)?(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*\)?\s*(?:de dano\s+(?:de\s+)?|dano\s+)?([A-Za-zÀ-ÿ]+)?/i);
    let dano = "", extras = [];
    if (!md || md.index >= 25 || /spell save|cd de resist[eê]ncia de magia|conjura[cç][aã]o|spellcasting/i.test(nome + " " + t.slice(0, 120))) return null;
    {
      let tp = md[2] || "";
      if (/^(de|dano|damage|plus|mais|e|and)$/i.test(tp)) tp = "";
      dano = `${md[1].replace(/\s+/g, "")}${tp ? " " + tipoDano(tp) : ""}`;
      resto = resto.slice(md.index + md[0].length);
      let mm;
      const RX_MAIS = /^\s*(?:,\s*)?(?:\+|mais|plus|e|and)\s*(?:\d+\s*\(\s*)?(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*\)?\s*(?:de dano\s+)?(?:de\s+)?([A-Za-zÀ-ÿ]+)?/i;
      while ((mm = resto.match(RX_MAIS))) { extras.push(`+${mm[1].replace(/\s+/g, "")}${mm[2] ? " de " + tipoDano(mm[2]) : ""}`); resto = resto.slice(mm[0].length); }
    }
    resto = resto.replace(/^[\s.,;]+/, "").trim();
    const nota = [extras.join(" "), resto ? resto.charAt(0).toUpperCase() + resto.slice(1) : ""].filter(Boolean).join(" ").trim();
    return [nome, bonus, dano, nota];
  }

  // "(Recarrega 5–6)", "(Recharge 5–6)", "(3/dia)", "(Custa 2 Ações)"
  function ajustarNome(nome) {
    return String(nome)
      .replace(/\(\s*(?:recarga|recarrega|recharge)\s*(\d)\s*[-–—]?\s*6?\s*\)/i, (m, n) => (n === "6" ? "(Recarga 6)" : `(Recarga ${n}–6)`))
      .replace(/\(\s*(\d)\s*\/\s*(?:dia|day)([^)]*)\)/i, (m, n, r) => `(${n}/Dia${r})`)
      .replace(/\s{2,}/g, " ").trim();
  }

  /* ---------- um bloco ---------- */
  function lerBloco(nome, ls, tipoL) {
    const x = { nome: capitalizar(nome), tam: "", tipo: "", tend: "", nd: "", xp: "", ca: 10, caNota: "", pv: 1, pvd: "", vel: "", at: [10, 10, 10, 10, 10, 10], sv: "", per: "", sen: "", idi: "", res: [], imu: [], vul: [], lore: "", h: [], a: [], r: [], l: [], lm: 3, avisos: [] };
    if (tipoL) Object.assign(x, linhaTipo(tipoL));
    let i = 0;
    const campos = {};
    const atrTxt = [];
    // cabeçalho: até a primeira entrada "Nome. texto" ou seção
    for (; i < ls.length; i++) {
      const l = ls[i];
      if (RX_SECAO.test(l) && secaoDe(l)) break;
      if (!ehCampo(l) && Object.keys(campos).some((k) => k === "nd" || k === "idi" || k === "sen") && entradaDe(l, ls[i - 1])) break;
      let m;
      if ((m = l.match(RX_CA))) {
        x.ca = Number(m[1]);
        const nota = (m[2].match(/^\s*\(([^)]*)\)/) || [])[1];
        if (nota) x.caNota = nota;
        const ini = m[2].match(/(?:iniciativa|initiative)\s*([+-−–]?\s*\d+)/i);
        if (ini) campos.ini = ini[1];
        continue;
      }
      if ((m = l.match(RX_PV))) { x.pv = Number(m[1]); x.pvd = (m[2] || "").replace(/\s+/g, "").replace(MENOS, "-"); continue; }
      if ((m = l.match(RX_VEL))) {
        let v = m[1];
        while (ls[i + 1] && !ehCampo(ls[i + 1]) && !RX_SECAO.test(ls[i + 1]) && (/[,(;]$/.test(v) || (v.split("(").length > v.split(")").length))) v += " " + ls[++i];
        x.vel = v;
        continue;
      }
      if (/^mod\s+(tr|save)/i.test(l)) continue;
      if (RX_ATR_ROT.test(l) || (atrTxt.length && /^\d{1,2}\s*\(/.test(l)) || (atrTxt.length && atrTxt.length < 30 && /^[\d\s()+\-−–]+$/.test(l))) { atrTxt.push(l); continue; }
      const cp = CAMPOS.find(([, rx]) => rx.test(l));
      if (cp) {
        let v = l.match(cp[1])[1];
        while (ls[i + 1] && !ehCampo(ls[i + 1]) && !RX_SECAO.test(ls[i + 1]) && !entradaDe(ls[i + 1], v) && (/[,;]$/.test(v) || /^[a-zà-ÿ(]/.test(ls[i + 1]))) v += " " + ls[++i];
        campos[cp[0]] = (campos[cp[0]] ? campos[cp[0]] + "; " : "") + v.trim();
        continue;
      }
      if (!tipoL && !x.tam) { const tp = linhaTipo(l); if (tp) { Object.assign(x, tp); continue; } }
      if (entradaDe(l, ls[i - 1])) break;
    }
    const atr = lerAtributos(atrTxt.join(" "));
    if (atr) {
      x.at = atr.at.map((v) => v || 10);
      // tabela nova (MOD / TR): o que tem teste diferente do modificador é proficiente
      const svs = atr.sv.map((s, k) => (s !== null && s !== Math.floor((x.at[k] - 10) / 2) ? `${ATR[k].toUpperCase()} ${s >= 0 ? "+" : ""}${s}` : "")).filter(Boolean);
      if (svs.length) x.sv = svs.join(", ");
    } else x.avisos.push("atributos");
    if (campos.sv) x.sv = campos.sv.replace(/\b(str|dex|con|int|wis|cha|for|des|sab|car)\b/gi, (w) => ATR[ROT_ATR[w.toLowerCase()]].toUpperCase()).replace(MENOS, "-");
    if (campos.per) x.per = trocar(campos.per, PER_EN).replace(MENOS, "-");
    if (campos.sen) { let s = metros(campos.sen); SENT_EN.forEach(([rx, pt]) => (s = s.replace(rx, pt))); x.sen = s.replace(/;\s*/g, ", ").replace(/^./, (c) => c.toUpperCase()); }
    if (campos.idi) x.idi = /^[–—-]+$/.test(campos.idi.trim()) ? "Nenhum" : metros(campos.idi);
    x.vel = metros(x.vel);
    VEL_EN.forEach(([rx, pt]) => (x.vel = x.vel.replace(rx, pt)));
    x.vel = x.vel.replace(/\s{2,}/g, " ").trim();
    // defesas viram etiquetas: "frio, fogo; concussão, cortante e perfurante de ataques não mágicos"
    const tags = (v) => {
      const out = [];
      String(v || "").split(";").forEach((parte) => {
        const p = parte.trim();
        if (!p) return;
        if (/n[aã]o[ -]m[aá]gic|nonmagical|que n[aã]o sejam|n[aã]o forem/i.test(p)) { out.push(p.replace(/\.$/, "")); return; }
        p.split(/,|\s+e\s+|\s+and\s+/).map((w) => w.trim().replace(/\.$/, "")).filter(Boolean).forEach((w) => out.push(DANO_EN[norm(w)] || COND_EN[norm(w)] || w.toLowerCase()));
      });
      return out;
    };
    x.res = tags(campos.res);
    x.vul = tags(campos.vul);
    x.imu = tags(campos.imu).concat(tags(campos.cond));
    if (campos.nd) {
      const m = campos.nd.replace(/½/, "1/2").replace(/¼/, "1/4").replace(/⅛/, "1/8").match(/^([\d/]+)\s*(?:\((?:xp\s*)?([\d.,]+)\s*(?:xp)?)?/i);
      if (m) { x.nd = m[1]; if (m[2]) x.xp = m[2].replace(/[.,]$/, "").replace(/,/g, "."); }
    }
    // corpo: traços, ações, reações, lendárias
    let sec = "h", atual = null;
    const listas = { h: [], a: [], b: [], r: [], l: [], x: [] };
    const intro = { l: "", x: "" };
    for (; i < ls.length; i++) {
      const l = ls[i];
      if (RX_SECAO.test(l) && secaoDe(l)) { sec = secaoDe(l); atual = null; continue; }
      // título em caixa alta que não é seção ("VARIAÇÃO: ARMADURA PARA CAVALO"): o que vem depois não é da criatura
      if (l.length > 3 && l === l.toUpperCase() && /[A-ZÀ-Ý]{4}/.test(l) && !/^\d/.test(l)) { sec = "fora"; atual = null; x._fora = { titulo: l, txt: "" }; continue; }
      if (sec === "fora") { x._fora.txt += (x._fora.txt ? " " : "") + l; continue; }
      const e = entradaDe(l, ls[i - 1]);
      if (e && !(sec === "l" && /^(legendary action uses|usos de a[cç][aã]o lend)/i.test(e.nome))) {
        atual = { nome: ajustarNome(e.nome), txt: e.txt };
        listas[sec].push(atual);
        continue;
      }
      if (atual) atual.txt += (atual.txt ? (/^(à vontade|a vontade|at will|\d+\s*\/\s*(dia|day)\b|truques|cantrips|\d+[º°]?\s*(c[ií]rculo|n[ií]vel|level))/i.test(l) ? "\n" : " ") : "") + l;
      else if (sec === "l" || sec === "x") intro[sec] += " " + l;
      else if (sec === "h" && x.h.length === 0 && listas.h.length === 0) {
        // texto solto antes do primeiro traço (descrição)
        x.lore += (x.lore ? " " : "") + l;
      }
    }
    const lendIntro = intro.l + " " + listas.l.filter((e) => /^(legendary action uses|usos de a[cç][aã]o lend)/i.test(e.nome)).map((e) => e.txt).join(" ");
    const mLm = lendIntro.match(/(?:pode (?:realizar|executar|usar|fazer)|can take|uses?:)\s*(\d)/i) || lendIntro.match(/(\d)\s+(?:a[cç][oõ]es lend[aá]rias|legendary actions)/i);
    if (mLm) x.lm = Number(mLm[1]);
    const limpa = (t) => metros(String(t).replace(/[ \t]{2,}/g, " ").replace(/ *\n */g, "\n").trim());
    listas.h.forEach((e) => x.h.push([e.nome, limpa(e.txt)]));
    listas.a.forEach((e) => { const at = lerAtaque(e.nome, e.txt); if (at) x.a.push(at); else x.h.push([e.nome, limpa(e.txt)]); });
    listas.b.forEach((e) => { const at = lerAtaque(e.nome + " (Ação Bônus)", e.txt); if (at) x.a.push(at); else x.h.push([`${e.nome} (Ação Bônus)`, limpa(e.txt)]); });
    listas.r.forEach((e) => x.r.push([e.nome, limpa(e.txt)]));
    listas.l.filter((e) => !/^(legendary action uses|usos de a[cç][aã]o lend)/i.test(e.nome)).forEach((e) => {
      const c = e.nome.match(/\((?:custa|costs)\s*(\d)\s*(?:a[cç][oõ]es|actions)\)/i);
      x.l.push([e.nome.replace(/\s*\((?:custa|costs)[^)]*\)/i, "").trim(), limpa(e.txt), c ? Number(c[1]) : 1]);
    });
    listas.x.forEach((e) => x.h.push([e.nome, limpa(e.txt)]));
    if (!x.l.length) delete x.lm;
    x.lore = limpa(x.lore).slice(0, 600);
    if (!x.pvd) x.avisos.push("dado de vida");
    if (!x.a.length && !x.h.length) x.avisos.push("ações");
    return x;
  }

  /* ---------- texto inteiro: acha cada bloco pela linha da CA ---------- */
  function ler(txt) {
    if (typeof window.limparTextoColado === "function") txt = window.limparTextoColado(txt);
    // "CA 16 (penas) / PV 120 (16d10+32)" numa linha só
    txt = String(txt).replace(/\s+[\/|]\s+(?=(?:pv|hp|pontos de vida|hit points|desloc\w*|velocidade|speed|ca|ac|nd|cr|desafio)\b)/gi, "\n");
    // "18 m (60 ft)": já veio em metros, o pé entre parênteses sobra
    txt = String(txt).replace(/(\d+(?:,\d+)?\+?\s*m\.?)\s*\(\s*\d+(?:[.,]\d+)?\+?\s*(?:ft|feet|p[eé]s)\.?\s*\)/gi, "$1");
    const ls = linhas(txt);
    const ancoras = [];
    ls.forEach((l, k) => { if (RX_CA.test(l) && /^(classe de armadura|armor class|ca\b|ac\b)/i.test(l)) ancoras.push(k); });
    const blocos = [];
    ancoras.forEach((k, j) => {
      // sobe: linha do tipo e o nome
      let kTipo = -1, kNome = -1;
      for (let u = k - 1; u >= Math.max(0, k - 4); u--) {
        if (linhaTipo(ls[u])) { kTipo = u; break; }
      }
      let u = (kTipo >= 0 ? kTipo : k) - 1;
      while (u > 0 && /^(\d{4}|\d+|(fonte|source|livro|book)\b.*|(edi[cç][aã]o|vers[aã]o)\b.*)$/i.test(ls[u])) u--;
      while (u >= 0 && (ls[u + 1] && norm(ls[u]) === norm(ls[u + 1]) && u !== (kTipo >= 0 ? kTipo : k) - 1)) u--;
      kNome = u;
      // nome repetido em cima ("Aboleth / Aboleth"): começa no de cima
      if (kNome > 0 && norm(ls[kNome - 1]) === norm(ls[kNome])) kNome--;
      const nome = kNome >= 0 && ls[kNome].length <= 70 && !/[.:;]$/.test(ls[kNome]) ? ls[kNome].replace(/\s*\([^)]{2,40}\)\s*$/, "").trim() || ls[kNome] : "Criatura";
      blocos.push({ ini: kNome >= 0 ? kNome : k, nome, kTipo, k });
    });
    const monstros = blocos.map((b, j) => {
      const fim = j + 1 < blocos.length ? blocos[j + 1].ini : ls.length;
      const corpo = ls.slice(b.k, fim);
      return lerBloco(b.nome, corpo, b.kTipo >= 0 ? ls[b.kTipo] : "");
    });
    // texto de apresentação (título em caixa alta + parágrafos antes do bloco) vira a descrição da próxima
    monstros.forEach((m, j) => {
      const f = m._fora, prox = monstros[j + 1];
      if (f && prox && !prox.lore && f.txt && norm(f.titulo).replace(/[^a-z]/g, "") === norm(prox.nome).replace(/[^a-z]/g, "")) prox.lore = metros(f.txt).slice(0, 600);
      delete m._fora;
    });
    // primeira criatura: parágrafos antes do nome
    if (blocos[0] && monstros[0] && !monstros[0].lore) {
      const antes = ls.slice(0, blocos[0].ini).filter((l) => norm(l) !== norm(blocos[0].nome));
      const t = antes.filter((l) => !(l === l.toUpperCase() && /[A-ZÀ-Ý]{3}/.test(l))).join(" ");
      if (t.length > 40) monstros[0].lore = metros(t).replace(/\s{2,}/g, " ").slice(0, 600);
    }
    return { monstros };
  }

  window.lerCriaturasColadas = ler;
  window._leitorMonstro = { lerAtaque, linhaTipo, lerAtributos, metros };
})();

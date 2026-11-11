/* Referência rápida de regras para o mestre (Grimório › Compêndio › Regras).
   Regras compatíveis com o SRD 5.2.1 (CC-BY-4.0), escritas com palavras próprias da Ficha Ígnea. */
const REGRAS_IGNEA = [
  /* ---------------- CONDIÇÕES ---------------- */
  { cat: "Condições", nome: "Agarrado", txt: [
    "Deslocamento vira 0 e não aumenta.",
    "Ataques contra qualquer alvo que não seja quem está agarrando têm desvantagem.",
    "Quem agarra pode arrastar ou carregar a vítima, gastando 1,5 m extra a cada 1,5 m (a não ser que ela seja Miúda ou dois tamanhos menor).",
    "<b>Escapar:</b> no turno, a vítima usa a ação e faz teste de Força (Atletismo) ou Destreza (Acrobacia) contra a CD de quem agarrou."] },
  { cat: "Condições", nome: "Amedrontado", txt: [
    "Desvantagem em testes e ataques enquanto a fonte do medo estiver à vista.",
    "Não pode se aproximar da fonte do medo por vontade própria."] },
  { cat: "Condições", nome: "Atordoado", txt: [
    "Fica incapacitado (sem ação, ação bônus ou reação, sem concentração e sem falar).",
    "Falha automaticamente em testes de resistência de Força e Destreza.",
    "Ataques contra ele têm vantagem."] },
  { cat: "Condições", nome: "Caído", txt: [
    "Só consegue rastejar, ou gastar metade do deslocamento pra levantar. Com deslocamento 0, não levanta.",
    "Seus ataques têm desvantagem.",
    "Ataques contra ele têm vantagem se o atacante estiver a até 1,5 m; de mais longe, têm desvantagem."] },
  { cat: "Condições", nome: "Cego", txt: [
    "Não enxerga e falha automaticamente em testes que dependem da visão.",
    "Ataques contra ele têm vantagem; os ataques dele têm desvantagem."] },
  { cat: "Condições", nome: "Contido", txt: [
    "Deslocamento vira 0 e não aumenta.",
    "Ataques contra ele têm vantagem; os ataques dele têm desvantagem.",
    "Desvantagem em testes de resistência de Destreza."] },
  { cat: "Condições", nome: "Enfeitiçado", txt: [
    "Não pode atacar quem o enfeitiçou nem mirar nele com dano ou efeitos mágicos.",
    "Quem enfeitiçou tem vantagem em testes sociais contra ele."] },
  { cat: "Condições", nome: "Envenenado", txt: ["Desvantagem em jogadas de ataque e testes de atributo."] },
  { cat: "Condições", nome: "Exaustão", sub: "Cumulativa, níveis 1 a 6", txt: [
    "Cada vez que recebe, ganha 1 nível. No nível 6, morre.",
    "Todo teste de d20 perde 2 × o nível de exaustão.",
    "Deslocamento cai 1,5 m × o nível de exaustão.",
    "Cada descanso longo tira 1 nível."] },
  { cat: "Condições", nome: "Incapacitado", txt: [
    "Não faz ação, ação bônus nem reação.",
    "Perde a concentração e não consegue falar.",
    "Se estiver assim ao rolar iniciativa, rola com desvantagem."] },
  { cat: "Condições", nome: "Inconsciente", txt: [
    "Fica incapacitado e caído, e solta o que estiver segurando. Quando acorda, continua caído.",
    "Deslocamento 0. Falha automaticamente em resistências de Força e Destreza.",
    "Ataques contra ele têm vantagem, e acerto a até 1,5 m é sempre crítico.",
    "Não percebe nada ao redor."] },
  { cat: "Condições", nome: "Invisível", txt: [
    "Vantagem na iniciativa.",
    "Não é afetado por nada que exija ver o alvo, a não ser que o autor consiga vê-lo. O equipamento some junto.",
    "Ataques contra ele têm desvantagem; os ataques dele têm vantagem (não vale contra quem consegue vê-lo)."] },
  { cat: "Condições", nome: "Paralisado", txt: [
    "Fica incapacitado e com deslocamento 0.",
    "Falha automaticamente em resistências de Força e Destreza.",
    "Ataques contra ele têm vantagem, e acerto a até 1,5 m é sempre crítico."] },
  { cat: "Condições", nome: "Petrificado", txt: [
    "Vira pedra (ou outra matéria inerte) junto com o que carrega de não mágico. Fica 10 vezes mais pesado e para de envelhecer.",
    "Incapacitado, deslocamento 0, falha em resistências de Força e Destreza, ataques contra ele têm vantagem.",
    "Resistência a todo dano e imunidade a veneno (condição envenenado)."] },
  { cat: "Condições", nome: "Surdo", txt: ["Não ouve e falha automaticamente em testes que dependem da audição."] },

  /* ---------------- COMBATE ---------------- */
  { cat: "Combate", nome: "Ações no turno", sub: "O que dá pra fazer com a ação", txt: [
    "<b>Atacar:</b> faz um ataque com arma ou desarmado (agarrar e empurrar também entram aqui).",
    "<b>Disparar:</b> ganha deslocamento extra igual ao seu deslocamento neste turno.",
    "<b>Desengajar:</b> seu movimento não provoca ataques de oportunidade neste turno.",
    "<b>Esquivar:</b> até seu próximo turno, ataques contra você têm desvantagem e você tem vantagem em resistências de Destreza (perde se ficar incapacitado ou com deslocamento 0).",
    "<b>Ajudar:</b> dá vantagem no próximo teste de um aliado, ou no próximo ataque dele contra um inimigo a até 1,5 m de você.",
    "<b>Esconder:</b> teste de Destreza (Furtividade) CD 15 fora da vista dos inimigos. Dá a condição invisível até ser achado ou fazer barulho.",
    "<b>Influenciar:</b> tenta convencer, enganar ou intimidar uma criatura.",
    "<b>Magia:</b> conjura uma magia com tempo de ação.",
    "<b>Preparar:</b> escolhe um gatilho e uma ação; quando o gatilho acontecer, usa a reação pra fazer.",
    "<b>Procurar:</b> teste de Sabedoria (Percepção, Intuição, Medicina ou Sobrevivência) pra notar algo.",
    "<b>Estudar:</b> teste de Inteligência (Arcanismo, História, Investigação, Natureza ou Religião) pra entender algo.",
    "<b>Usar objeto:</b> usa um item que exige uma ação."] },
  { cat: "Combate", nome: "Ataque de oportunidade", txt: [
    "Quando uma criatura que você vê sai do seu alcance, você pode usar a reação pra fazer um ataque corpo a corpo contra ela.",
    "Não provoca se ela usou Desengajar, se foi teleportada ou se foi movida sem usar o próprio movimento."] },
  { cat: "Combate", nome: "Cobertura", txt: [
    "<b>Meia cobertura:</b> +2 na CA e em resistências de Destreza (mureta, móvel, outra criatura).",
    "<b>Três quartos:</b> +5 na CA e em resistências de Destreza (seteira, tronco grosso).",
    "<b>Total:</b> não pode ser alvo direto de ataques nem magias."] },
  { cat: "Combate", nome: "Vantagem e desvantagem", txt: [
    "Com vantagem, rola 2d20 e fica com o maior; com desvantagem, fica com o menor.",
    "Várias fontes não se somam. Se tiver vantagem e desvantagem ao mesmo tempo, as duas se anulam."] },
  { cat: "Combate", nome: "Acerto crítico", txt: [
    "Um 20 natural no d20 de ataque sempre acerta e é crítico.",
    "No crítico, rola os dados de dano do ataque duas vezes e soma os modificadores uma vez só.",
    "Um 1 natural sempre erra."] },
  { cat: "Combate", nome: "Agarrar e empurrar", txt: [
    "Usa um ataque desarmado. O alvo (no máximo um tamanho maior que você e ao alcance) faz resistência de Força ou Destreza contra CD 8 + mod. de Força + bônus de proficiência.",
    "<b>Agarrar:</b> se falhar, fica agarrado. Precisa de uma mão livre.",
    "<b>Empurrar:</b> se falhar, você o empurra 1,5 m ou o derruba (caído)."] },
  { cat: "Combate", nome: "Surpresa", txt: ["Quem é pego desprevenido no começo do combate rola iniciativa com desvantagem."] },
  { cat: "Combate", nome: "Concentração", txt: [
    "Algumas magias exigem concentração. Só dá pra manter uma por vez.",
    "Ao sofrer dano, faz resistência de Constituição: CD 10 ou metade do dano (o que for maior, até CD 30). Se falhar, perde a magia.",
    "Também perde se ficar incapacitado ou morrer."] },
  { cat: "Combate", nome: "Cair a 0 PV e testes contra a morte", txt: [
    "Com 0 PV, o personagem fica inconsciente. Se o dano que sobrou for igual ou maior que o PV máximo, morre na hora.",
    "No começo de cada turno a 0 PV, rola 1d20: 10 ou mais é sucesso, menos de 10 é falha. Três sucessos: fica estável. Três falhas: morre.",
    "Um 20 natural: volta com 1 PV. Um 1 natural: conta como duas falhas.",
    "Sofrer dano a 0 PV conta uma falha (duas se for crítico).",
    "<b>Estabilizar:</b> ação de primeiros socorros, teste de Sabedoria (Medicina) CD 10."] },
  { cat: "Combate", nome: "Nocautear", txt: ["Ao zerar alguém com ataque corpo a corpo, dá pra deixar com 1 PV em vez disso. Ele fica inconsciente até recuperar PV ou receber primeiros socorros (Medicina CD 10)."] },

  /* ---------------- EXPLORAÇÃO ---------------- */
  { cat: "Exploração", nome: "Descanso curto", txt: [
    "Pelo menos 1 hora de atividade leve.",
    "Pode gastar Dados de Vida: rola cada um e soma o modificador de Constituição pra recuperar PV.",
    "É interrompido por combate, conjuração ou dano."] },
  { cat: "Exploração", nome: "Descanso longo", txt: [
    "Pelo menos 8 horas, dormindo 6 e o resto em atividade leve. Só um a cada 24 horas.",
    "Recupera todo o PV e todos os Dados de Vida gastos, e tira 1 nível de exaustão.",
    "Uma hora de esforço (andar, lutar, conjurar) interrompe; se for interrompido, conta como descanso curto se passou de 1 hora."] },
  { cat: "Exploração", nome: "Ritmo de viagem", txt: [
    "<b>Rápido:</b> cerca de 6 km por hora, 45 km por dia. Desvantagem em Percepção e Sobrevivência.",
    "<b>Normal:</b> cerca de 4,5 km por hora, 36 km por dia.",
    "<b>Lento:</b> cerca de 3 km por hora, 27 km por dia. Vantagem em Percepção e Sobrevivência.",
    "Marchar mais de 8 horas por dia exige resistência de Constituição a cada hora extra (CD 10 + 1 por hora) ou ganha 1 nível de exaustão."] },
  { cat: "Exploração", nome: "Luz e visão", txt: [
    "<b>Penumbra (levemente obscurecido):</b> desvantagem em Percepção pela visão.",
    "<b>Escuridão (fortemente obscurecido):</b> quem tenta enxergar ali fica, na prática, cego.",
    "<b>Visão no escuro:</b> enxerga na penumbra como se fosse luz plena e no escuro como penumbra, sem cores.",
    "<b>Percepção às cegas:</b> percebe tudo no alcance sem usar os olhos, inclusive invisíveis.",
    "<b>Visão verdadeira:</b> vê no escuro, vê invisíveis, enxerga através de ilusões e a forma real de quem mudou de forma."] },
  { cat: "Exploração", nome: "Terreno difícil, escalar e nadar", txt: [
    "Cada 1,5 m em terreno difícil custa 3 m de deslocamento.",
    "Escalar e nadar também custam o dobro (o triplo em terreno difícil), a não ser que a criatura tenha deslocamento de escalada ou natação.",
    "Superfície escorregadia ou água agitada podem pedir Força (Atletismo) CD 15."] },
  { cat: "Exploração", nome: "Saltos", txt: [
    "<b>Distância:</b> com 3 m de corrida, pula em metros o valor de Força × 0,3. Parado, metade disso.",
    "<b>Altura:</b> com corrida, sobe (3 + mod. de Força) × 0,3 m. Parado, metade."] },
  { cat: "Exploração", nome: "Carga", txt: [
    "Uma criatura Média carrega até Força × 7,5 kg. Miúda, metade; Grande, o dobro; Enorme, 4×; Colossal, 8×.",
    "Pode arrastar, erguer ou empurrar o dobro disso, mas fica com no máximo 1,5 m de deslocamento."] },

  /* ---------------- PERIGOS ---------------- */
  { cat: "Perigos", nome: "Pegando fogo", txt: [
    "Sofre 1d4 de fogo no começo de cada turno.",
    "Dá pra apagar com uma ação, se jogando no chão (fica caído). Água, mergulho ou abafar também apagam."] },
  { cat: "Perigos", nome: "Queda", txt: [
    "1d6 de concussão a cada 3 m de queda, no máximo 20d6. Cai no chão (caído) se sofrer dano.",
    "Caindo na água, pode usar a reação e fazer Força (Atletismo) ou Destreza (Acrobacia) CD 15: se passar, o dano cai pela metade."] },
  { cat: "Perigos", nome: "Sufocamento", txt: [
    "Segura o fôlego por 1 + mod. de Constituição minutos (mínimo 30 segundos).",
    "Sem ar ou engasgado, ganha 1 nível de exaustão no fim de cada turno. Ao voltar a respirar, perde toda a exaustão que ganhou assim."] },
  { cat: "Perigos", nome: "Sede", sub: "Desidratação", txt: [
    "Água por dia: Miúda 1 L; Pequena ou Média 4 L; Grande 16 L; Enorme 64 L; Colossal 256 L.",
    "Bebeu menos da metade no dia: ganha 1 nível de exaustão no fim do dia. Essa exaustão só sai depois de beber a quantidade certa num dia."] },
  { cat: "Perigos", nome: "Fome", sub: "Desnutrição", txt: [
    "Comida por dia: Miúda 125 g; Pequena ou Média 0,5 kg; Grande 2 kg; Enorme 8 kg; Colossal 32 kg.",
    "Comeu menos da metade: resistência de Constituição CD 10 no fim do dia, ou ganha 1 nível de exaustão.",
    "Cinco dias sem comer nada: ganha 1 nível no fim do quinto dia e mais 1 a cada dia seguinte. Só sai comendo direito."] },

  /* ---------------- AMBIENTE ---------------- */
  { cat: "Ambiente", nome: "Água profunda", txt: ["A cada hora nadando em águas com mais de 30 m de profundidade, quem não tem deslocamento de natação faz resistência de Constituição CD 10 ou ganha 1 nível de exaustão."] },
  { cat: "Ambiente", nome: "Frio extremo", sub: "Abaixo de −18 °C", txt: ["Exposto, faz resistência de Constituição CD 10 no fim de cada hora ou ganha 1 nível de exaustão. Quem tem resistência ou imunidade a frio passa automaticamente."] },
  { cat: "Ambiente", nome: "Calor extremo", sub: "Acima de 38 °C", txt: [
    "Sem água potável, faz resistência de Constituição no fim de cada hora: CD 5 na primeira hora, +1 a cada hora seguinte. Falhou, ganha 1 nível de exaustão.",
    "Armadura média ou pesada dá desvantagem. Resistência ou imunidade a fogo passa automaticamente."] },
  { cat: "Ambiente", nome: "Água gelada", txt: [
    "Aguenta um número de minutos igual ao valor de Constituição sem problema.",
    "Cada minuto a mais pede resistência de Constituição CD 10 ou ganha 1 nível de exaustão. Resistência a frio ou adaptação natural passam automaticamente."] },
  { cat: "Ambiente", nome: "Chuva ou neve forte", txt: ["Tudo na área fica levemente obscurecido e há desvantagem em Percepção. Chuva forte apaga chamas abertas."] },
  { cat: "Ambiente", nome: "Altitude elevada", sub: "Acima de 3.000 m", txt: [
    "Cada hora de viagem conta como duas pra saber quanto o grupo aguenta andar.",
    "Dá pra se acostumar passando 30 dias na altitude. Acima de 6.000 m, só quem é nativo se acostuma."] },
  { cat: "Ambiente", nome: "Gelo escorregadio", txt: ["É terreno difícil. Ao entrar nele pela primeira vez no turno ou começar o turno ali, resistência de Destreza CD 10 ou cai (caído)."] },
  { cat: "Ambiente", nome: "Vento forte", txt: [
    "Desvantagem em ataques à distância com armas. Apaga chamas e dispersa névoa.",
    "Quem voa precisa pousar no fim do turno ou cai.",
    "No deserto, vira tempestade de areia: desvantagem em Percepção."] },
  { cat: "Ambiente", nome: "Gelo fino", txt: ["Cada quadrado de 3 m aguenta 3d10 × 5 kg. Passou disso, quebra, e quem estiver em cima cai na água gelada."] },
  { cat: "Ambiente", nome: "Medo e horror", txt: [
    "Use a condição amedrontado como base, com resistência de Sabedoria.",
    "Sugestão de CD: 10 para um susto inofensivo, 15 para uma visão aterradora pessoal, 20 para algo que desafia a sanidade."] },

  /* ---------------- VENENOS ---------------- */
  { cat: "Venenos", nome: "Como venenos funcionam", sub: "Os quatro tipos", txt: [
    "<b>Contato:</b> passado num objeto, age em quem tocar com a pele. Dura até ser tocado ou lavado.",
    "<b>Ingerido:</b> precisa engolir a dose inteira (comida ou bebida). Meia dose pode dar vantagem na resistência ou metade do dano.",
    "<b>Inalado:</b> pó ou gás que afeta um cubo de 1,5 m e some logo depois. Prender a respiração não adianta.",
    "<b>Ferimento:</b> aplicado na arma ou munição com uma ação bônus. Age em quem sofrer dano perfurante ou cortante dela.",
    "<b>Extrair veneno:</b> de criatura venenosa morta ou incapacitada, 1d6 minutos e Inteligência (Natureza) CD 20 com kit de venenos. Falhar por 5 ou mais envenena quem tentou."] },
  { cat: "Venenos", nome: "Sangue do Assassino", sub: "Ingerido · 150 PO", txt: ["Resistência de Constituição CD 10. Falha: 1d12 de veneno e envenenado por 24 horas. Sucesso: metade do dano e nada mais."] },
  { cat: "Venenos", nome: "Fumaça Negra", sub: "Inalado · 500 PO", txt: ["Resistência de Constituição CD 13 ou 3d6 de veneno. Repete a resistência no começo de cada turno, sofrendo 1d6 a cada falha. Depois de três sucessos, acaba."] },
  { cat: "Venenos", nome: "Muco de Rastejador", sub: "Contato · 200 PO", txt: ["Resistência de Constituição CD 13 ou fica envenenado e paralisado por 1 minuto. Repete no fim de cada turno pra se livrar."] },
  { cat: "Venenos", nome: "Essência de Éter", sub: "Inalado · 300 PO", txt: ["Resistência de Constituição CD 15 ou fica envenenado e inconsciente por 8 horas. Acorda se sofrer dano ou se alguém usar uma ação pra sacudi-lo."] },
  { cat: "Venenos", nome: "Malícia", sub: "Inalado · 250 PO", txt: ["Resistência de Constituição CD 15 ou fica envenenado e cego por 1 hora."] },
  { cat: "Venenos", nome: "Lágrimas da Meia-Noite", sub: "Ingerido · 1.500 PO", txt: ["Não faz nada até a meia-noite. Se não for neutralizado antes (qualquer coisa que cure envenenado serve), resistência de Constituição CD 17: 9d6 de veneno, metade se passar."] },
  { cat: "Venenos", nome: "Óleo Sonífero", sub: "Contato · 400 PO", txt: ["Resistência de Constituição CD 13 ou fica envenenado e inconsciente por 24 horas. Acorda se sofrer dano."] },
  { cat: "Venenos", nome: "Tintura Pálida", sub: "Ingerido · 250 PO", txt: ["Resistência de Constituição CD 16 ou 1d6 de veneno e envenenado. Repete a cada 24 horas, sofrendo 1d6 a cada falha. Esse dano não cura enquanto durar. Depois de sete sucessos, acaba."] },
  { cat: "Venenos", nome: "Veneno de Verme Púrpura", sub: "Ferimento · 2.000 PO", txt: ["Resistência de Constituição CD 21: 10d6 de veneno, metade se passar."] },
  { cat: "Venenos", nome: "Veneno de Serpente", sub: "Ferimento · 200 PO", txt: ["Resistência de Constituição CD 11: 3d6 de veneno, metade se passar."] },
  { cat: "Venenos", nome: "Ferroada de Aranha", sub: "Ferimento · 200 PO", txt: ["Resistência de Constituição CD 13 ou fica envenenado por 1 hora. Falhando por 5 ou mais, também fica inconsciente; acorda com dano ou sacudido."] },
  { cat: "Venenos", nome: "Torpor", sub: "Ingerido · 600 PO", txt: ["Resistência de Constituição CD 15 ou fica envenenado por 4d6 horas, com o deslocamento pela metade."] },
  { cat: "Venenos", nome: "Soro da Verdade", sub: "Ingerido · 150 PO", txt: ["Resistência de Constituição CD 11 ou fica envenenado por 1 hora e não consegue mentir de propósito."] },
  { cat: "Venenos", nome: "Veneno de Serpe", sub: "Ferimento · 1.200 PO", txt: ["Resistência de Constituição CD 14: 7d6 de veneno, metade se passar."] },

  /* ---------------- DOENÇAS E MALDIÇÕES ---------------- */
  { cat: "Doenças e maldições", nome: "Repouso e recuperação", txt: ["Quem passa 3 dias só descansando faz resistência de Constituição CD 15 no fim. Se passar, tem vantagem nas resistências contra a doença pelas próximas 24 horas."] },
  { cat: "Doenças e maldições", nome: "Febre do Riso", sub: "Doença mágica · humanoides", txt: [
    "Vem de poções baratas e mal feitas. Os sintomas aparecem 1d4 dias depois.",
    "<b>Febre:</b> ganha 1 nível de exaustão enquanto estiver doente.",
    "<b>Riso descontrolado:</b> com exaustão, toda vez que sofre dano (menos psíquico) faz Constituição CD 13. Falha: 1d10 psíquico e incapacitado de tanto rir; repete no fim de cada turno, no máximo 1 minuto.",
    "<b>Cura:</b> Constituição CD 13 no fim de cada descanso longo. Três sucessos curam e dão imunidade por 1 ano.",
    "<b>Contágio:</b> humanoide que começa o turno a até 3 m de um doente faz Constituição CD 10 ou pega."] },
  { cat: "Doenças e maldições", nome: "Peste do Esgoto", sub: "Doença mágica", txt: [
    "Pega de ferida de bicho portador (ratos, otyughs) ou de contato com sujeira contaminada: Constituição CD 11. Sintomas em 1d4 dias.",
    "<b>Cansaço:</b> ganha 1 nível de exaustão.",
    "<b>Fraqueza:</b> com exaustão, Dados de Vida curam só metade.",
    "<b>Inquietação:</b> com exaustão, o descanso longo não cura PV nem tira exaustão.",
    "<b>Cura:</b> todo amanhecer, Constituição CD 11. Falha: +1 nível de exaustão. Sucesso: −1 nível. Chegou a 0, curou."] },
  { cat: "Doenças e maldições", nome: "Podridão Ocular", sub: "Doença mágica", txt: [
    "Pega bebendo água contaminada: Constituição CD 15 ou fica cego até curar.",
    "<b>Cura:</b> Restauração Menor ou Cura Completa curam na hora. Quem sabe usar kit de herbalismo faz uma pomada em 1 hora, que segura a doença por 24 horas; três aplicações (72 horas) curam.",
    "<b>Contágio:</b> tocar a pele de um doente pede Constituição CD 15."] },
  { cat: "Doenças e maldições", nome: "Possessão Demoníaca", sub: "Maldição de lugar", txt: [
    "Surge em lugares profanados ou com objetos demoníacos. Resistência de Carisma CD 15 ou é possuído.",
    "Sempre que tirar 1 num teste de d20, o demônio assume o controle. No fim de cada turno seguinte, Carisma CD 15 pra retomar.",
    "Depois de cada descanso longo, Carisma CD 15: se passar, se livra. Dissipar o Bem e o Mal ou remover maldição também acabam."] },
  { cat: "Doenças e maldições", nome: "Maldições na história", txt: [
    "Maldições narrativas nascem de quebrar um tabu: profanar um túmulo, quebrar um juramento, matar um inocente.",
    "Quem é amaldiçoado deve saber por quê e conseguir descobrir como reparar o erro. Remover Maldição pode só aliviar por um tempo, você decide."] },

  /* ---------------- ARMADILHAS ---------------- */
  { cat: "Armadilhas", nome: "Teto que desaba", sub: "Mortal · níveis 1–4 · fio esticado", txt: [
    "Um fio a 8 cm do chão derruba os apoios e parte do teto cai.",
    "Quem estiver embaixo: Destreza CD 13, 2d10 de concussão (metade se passar). O entulho vira terreno difícil.",
    "<b>Achar:</b> Procurar, Sabedoria (Percepção) CD 11. Achado, é só cortar ou pular o fio.",
    "<b>Níveis maiores:</b> 5–10: 4d10, CD 15 · 11–16: 10d10, CD 17 · 17–20: 18d10, CD 19."] },
  { cat: "Armadilhas", nome: "Rede que cai", sub: "Incômoda · níveis 1–4 · fio esticado", txt: [
    "Uma rede pesada de 3 m cai em quem passar pelo fio: Destreza CD 10 ou fica contido (Enorme ou maior passa sempre).",
    "Uma ação e Força (Atletismo) CD 10 soltam a vítima ou alguém ao alcance.",
    "<b>Achar:</b> Percepção CD 11. <b>Montar:</b> com ferramentas de ladrão, Destreza (Prestidigitação) CD 13 e 10 minutos.",
    "<b>Níveis maiores:</b> CD 12 (5–10), 14 (11–16), 16 (17–20)."] },
  { cat: "Armadilhas", nome: "Estátua que cospe fogo", sub: "Mortal · níveis 1–4 · placa de pressão", txt: [
    "Pisou na placa (ou começou o turno nela): a estátua solta um cone de fogo de 4,5 m. Destreza CD 15, 2d10 de fogo (metade se passar). Rearma no turno seguinte.",
    "<b>Achar:</b> Detectar Magia mostra a aura. Percepção CD 10 perto da estátua acha uma runa; Estudar com Arcanismo CD 15 entende que é “fogo”. Raspar a runa com uma ação desarma.",
    "A placa: Percepção CD 15; um cravo de ferro embaixo impede o disparo.",
    "<b>Níveis maiores:</b> 5–10: 4d10, cone de 9 m · 11–16: 10d10, cone de 18 m · 17–20: 18d10, cone de 36 m."] },
  { cat: "Armadilhas", nome: "Fosso escondido", sub: "Incômoda · níveis 1–4 · tampa falsa", txt: [
    "Uma tampa igual ao chão abre e a vítima cai num fosso de 3 m: 1d6 de concussão.",
    "<b>Achar:</b> Estudar, Inteligência (Investigação) CD 15. Um cravo de ferro trava a tampa.",
    "Sair exige escalada, equipamento ou magia, a não ser que as paredes tenham rachaduras.",
    "<b>Níveis maiores:</b> 5–10: 9 m e 3d6 · 11–16: 18 m e 6d6 · 17–20: 36 m e 12d6."] },
  { cat: "Armadilhas", nome: "Dardos envenenados", sub: "Mortal · níveis 1–4 · placa de pressão", txt: [
    "Dardos saem de furos escondidos nas paredes: Destreza CD 13 ou leva 1d3 dardos, 1d6 de veneno cada. Rearma até três vezes.",
    "<b>Achar:</b> Percepção CD 15 nos furos (tampar com cera ou pano desarma) ou na placa (cravo embaixo).",
    "<b>Níveis maiores:</b> por dardo, 2d6 (5–10), 4d6 (11–16), 7d6 (17–20)."] },
  { cat: "Armadilhas", nome: "Agulha envenenada", sub: "Incômoda · níveis 1–4 · fechadura", txt: [
    "Abrir a fechadura sem a chave certa: a agulha pica. Constituição CD 11, 1d10 de veneno e envenenado por 1 hora (metade do dano e nada mais se passar).",
    "Magia de abrir fechaduras não dispara.",
    "<b>Achar:</b> Percepção CD 15. <b>Desarmar:</b> ação e Destreza (Prestidigitação) CD 15; falhar dispara.",
    "<b>Níveis maiores:</b> 2d10 CD 13 · 4d10 CD 15 · 10d10 CD 17."] },
  { cat: "Armadilhas", nome: "Pedra rolante", sub: "Mortal · níveis 11–16 · placa de pressão", txt: [
    "Uma esfera de pedra de 3 m de diâmetro é solta e rola iniciativa com +8. Anda 18 m por turno em linha reta.",
    "Quem ela atravessar: Destreza CD 15 ou 10d10 de concussão e caído.",
    "Para numa parede. Pedra: CA 17, 100 PV, limite de dano 10.",
    "<b>Frear:</b> ação e Força (Atletismo) CD 20 reduz 4,5 m do movimento dela.",
    "<b>Achar:</b> Estudar, Investigação CD 15 na placa."] },
  { cat: "Armadilhas", nome: "Fosso com estacas", sub: "Mortal · níveis 1–4 · tampa falsa", txt: [
    "Como o fosso escondido, mas com estacas no fundo: 1d6 de concussão mais 2d8 perfurante.",
    "<b>Achar:</b> Investigação CD 15. Um cravo trava a tampa.",
    "<b>Níveis maiores:</b> 9 m, 3d6 + 3d8 · 18 m, 6d6 + 8d8 · 36 m, 12d6 + 13d8."] },
  { cat: "Armadilhas", nome: "Criando sua armadilha", txt: [
    "Diga o gatilho (placa, fio, fechadura), o efeito e como achar e desarmar.",
    "<b>Incômoda</b> atrapalha; <b>mortal</b> pode matar personagens daquele nível. Uma armadilha incômoda pra nível alto pode ser mortal pra nível baixo.",
    "Use com moderação: armadilha demais deixa a mesa lenta e desconfiada."] },

  /* ---------------- MESTRE ---------------- */
  { cat: "Mestre", nome: "Dificuldade dos testes", sub: "Tabela de CD", txt: [
    "<b>Muito fácil:</b> 5 · <b>Fácil:</b> 10 · <b>Média:</b> 15 · <b>Difícil:</b> 20 · <b>Muito difícil:</b> 25 · <b>Quase impossível:</b> 30."] },
  { cat: "Mestre", nome: "Montar um encontro", sub: "Calculadora de XP", calc: true, txt: [
    "<b>Baixa:</b> um ou dois sustos, mas o grupo vence sem baixas. <b>Moderada:</b> sem cura pode dar ruim. <b>Alta:</b> pode matar alguém.",
    "Some o XP das criaturas (aparece no Bestiário) sem passar do orçamento. Uma criatura sozinha de ND igual ao nível do grupo de 4 costuma ser um encontro baixo."] },
];

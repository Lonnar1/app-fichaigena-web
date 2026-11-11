/* =====================================================================
   CLASSES-DADOS.JS · Classes, subclasses e raças (Ficha Ígnea)
   Progressão compatível com a 5ª edição, a partir do SRD 5.2.1 (CC-BY-4.0).
   Nomes em português e descrições resumidas escritas pela Ficha Ígnea.

   Campos de cada característica (f):
     n   nível da classe em que é ganha
     nome, d (descrição)
     a   ação: acao | bonus | reacao | livre | passiva
     r   recarga: curto | longo | vontade | dia
     u   usos: número | "pb" (bônus de proficiência) | "c0".."c3" (coluna da tabela) | "for".."car" (modificador, mín. 1)
     x   não vira poder na aba 🔥 (só aparece na evolução)
     asi melhoria de atributo / talento (abre a escolha ao subir)
   ===================================================================== */

const PROG_PB = [0, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6];

// espaços de magia por nível de conjurador (tabela única; meio-conjurador usa metade, arredondando pra cima)
const PROG_ESPACOS = [
  [], [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

const ASI = (n) => ({ n, nome: "Melhoria de Atributo", d: "+2 em um atributo ou +1 em dois (máximo 20), ou um talento à sua escolha.", asi: 1, x: 1 });
const DADIVA = { n: 19, nome: "Dádiva Épica", d: "Você ganha um talento de Dádiva Épica (ou outro talento à sua escolha). Dádivas épicas podem levar um atributo até 30.", asi: 2, x: 1 };
const ATAQUE_EXTRA = (n) => ({ n, nome: "Ataque Extra", d: "Quando usa a ação Atacar no seu turno, você ataca duas vezes em vez de uma.", a: "passiva" });
const MAESTRIA = { n: 1, nome: "Maestria em Armas", d: "Você usa a propriedade de maestria de alguns tipos de arma à sua escolha (quantidade na tabela). Depois de um descanso longo, pode trocar uma delas.", a: "passiva" };
const ESTILO = (n, extra) => ({ n, nome: "Estilo de Luta", d: "Você ganha um talento de Estilo de Luta à sua escolha (Arquearia, Defesa, Arma Grande, Duas Armas...)." + (extra || ""), a: "passiva", x: 1 });
const EVASAO = (n) => ({ n, nome: "Evasão", d: "Quando um efeito permite um teste de Destreza pra sofrer metade do dano, você não sofre dano se passar e só metade se falhar. Não funciona se estiver incapacitado.", a: "passiva" });
const CONJ = (fonte, atr, extra) => ({ n: 1, nome: "Conjuração", d: `Você conjura magias ${fonte}, usando ${atr} como atributo de conjuração. Truques, magias preparadas e espaços seguem a tabela da classe.${extra ? " " + extra : ""}`, a: "passiva", x: 1 });

const CLASSES_IGNEA = [
  /* ============================== BÁRBARO ============================== */
  {
    id: "barbaro", nome: "Bárbaro", dv: 12, prim: ["for"], saves: ["for", "con"],
    pericias: "Escolha 2: Lidar com Animais, Atletismo, Intimidação, Natureza, Percepção ou Sobrevivência",
    armas: "Simples e marciais", armaduras: "Leves, médias e escudos",
    multi: "Dado de vida, armas marciais e escudos.",
    resumo: "Guerreiro movido pela fúria primal, resistente e devastador no corpo a corpo.",
    subNome: "Caminho", subNiveis: [3, 6, 10, 14],
    tabela: { cols: ["Fúrias", "Dano da Fúria", "Maestria"], linhas: [
      [2, "+2", 2], [2, "+2", 2], [3, "+2", 2], [3, "+2", 3], [3, "+2", 3], [4, "+2", 3], [4, "+2", 3], [4, "+2", 3], [4, "+3", 3], [4, "+3", 4],
      [4, "+3", 4], [5, "+3", 4], [5, "+3", 4], [5, "+3", 4], [5, "+3", 4], [5, "+4", 4], [6, "+4", 4], [6, "+4", 4], [6, "+4", 4], [6, "+4", 4]] },
    f: [
      { n: 1, nome: "Fúria", d: "Ação bônus, sem armadura pesada. Dura até o fim do próximo turno e pode ser estendida atacando, forçando um teste ou com ação bônus (até 10 minutos). Enquanto dura: resistência a concussão, perfurante e cortante; bônus de dano da Fúria em ataques de Força; vantagem em testes e resistências de Força; não conjura magia nem mantém concentração. Recupera 1 uso no descanso curto e todos no longo.", a: "bonus", r: "longo", u: "c0" },
      { n: 1, nome: "Defesa sem Armadura", d: "Sem armadura, sua CA é 10 + mod. de Destreza + mod. de Constituição. Escudo vale.", a: "passiva" },
      MAESTRIA,
      { n: 2, nome: "Sentido de Perigo", d: "Vantagem em testes de resistência de Destreza, a não ser que esteja incapacitado.", a: "passiva" },
      { n: 2, nome: "Ataque Imprudente", d: "No primeiro ataque do turno, pode atacar sem cuidado: vantagem nos ataques de Força até seu próximo turno, mas ataques contra você também têm vantagem.", a: "livre" },
      { n: 3, nome: "Conhecimento Primal", d: "Ganha mais uma perícia da lista do Bárbaro. Em Fúria, pode fazer testes de Acrobacia, Intimidação, Percepção, Furtividade e Sobrevivência usando Força.", a: "passiva" },
      ASI(4),
      ATAQUE_EXTRA(5),
      { n: 5, nome: "Movimento Rápido", d: "Seu deslocamento aumenta em 3 m se não estiver usando armadura pesada.", a: "passiva" },
      { n: 7, nome: "Instinto Selvagem", d: "Vantagem nas jogadas de iniciativa.", a: "passiva" },
      { n: 7, nome: "Bote Instintivo", d: "Ao entrar em Fúria, você também pode se mover até metade do seu deslocamento.", a: "passiva" },
      ASI(8),
      { n: 9, nome: "Golpe Brutal", d: "Usando Ataque Imprudente, pode abrir mão da vantagem em um ataque de Força. Se acertar, causa +1d10 de dano e escolhe um efeito: Golpe Forte (empurra 4,5 m e você pode avançar até metade do deslocamento) ou Golpe no Jarrete (o alvo perde 4,5 m de deslocamento até seu próximo turno).", a: "passiva" },
      { n: 11, nome: "Fúria Implacável", d: "Se cair a 0 PV em Fúria, faça um teste de Constituição CD 10: se passar, fica com PV igual ao dobro do seu nível de Bárbaro. A CD sobe 5 a cada uso e volta a 10 no descanso.", a: "passiva" },
      ASI(12),
      { n: 13, nome: "Golpe Brutal Aprimorado", d: "Novas opções de Golpe Brutal: Golpe Atordoante (o alvo tem desvantagem no próximo teste de resistência e não usa reação) e Golpe Partidor (o próximo ataque de outra criatura contra o alvo ganha +5).", a: "passiva" },
      { n: 15, nome: "Fúria Persistente", d: "Ao rolar iniciativa, recupera todas as Fúrias (uma vez por descanso longo). A Fúria dura 10 minutos sem precisar ser estendida.", a: "passiva" },
      ASI(16),
      { n: 17, nome: "Golpe Brutal Aprimorado II", d: "O dano extra do Golpe Brutal vira 2d10 e você aplica dois efeitos diferentes.", a: "passiva" },
      { n: 18, nome: "Poder Indomável", d: "Se o total de um teste de Força ou resistência de Força for menor que seu valor de Força, use o valor de Força.", a: "passiva" },
      DADIVA,
      { n: 20, nome: "Campeão Primal", d: "Força e Constituição aumentam em 4, até o máximo de 25.", a: "passiva" },
    ],
    sub: { id: "berserker", nome: "Caminho do Furioso", d: "Bárbaros que canalizam a fúria em violência pura e incontrolável.", f: [
      { n: 3, nome: "Frenesi", d: "Usando Ataque Imprudente em Fúria, o primeiro alvo que você acertar no turno sofre dano extra: uma quantidade de d6 igual ao seu bônus de dano da Fúria.", a: "passiva" },
      { n: 6, nome: "Fúria Irracional", d: "Em Fúria, você é imune a enfeitiçado e amedrontado. Se já estava, o efeito para enquanto a Fúria durar.", a: "passiva" },
      { n: 10, nome: "Retaliação", d: "Quando uma criatura a até 1,5 m causa dano a você, pode usar a reação pra fazer um ataque corpo a corpo contra ela.", a: "reacao" },
      { n: 14, nome: "Presença Intimidante", d: "Ação bônus: criaturas à sua escolha a até 9 m fazem teste de Sabedoria (CD 8 + Força + proficiência) ou ficam amedrontadas por 1 minuto. Uma vez por descanso longo, ou gastando uma Fúria.", a: "bonus", r: "longo", u: 1 },
    ] },
  },

  /* ============================== BARDO ============================== */
  {
    id: "bardo", nome: "Bardo", dv: 8, prim: ["car"], saves: ["des", "car"],
    pericias: "Escolha 3 perícias quaisquer", armas: "Simples", armaduras: "Leves", ferramentas: "3 instrumentos musicais",
    multi: "Dado de vida, uma perícia, um instrumento musical e armaduras leves.",
    resumo: "Artista mágico que inspira aliados e domina magias versáteis.",
    conj: "total", atrConj: "car", subNome: "Colégio", subNiveis: [3, 6, 14],
    tabela: { cols: ["Inspiração", "Truques", "Preparadas"], linhas: [
      ["d6", 2, 4], ["d6", 2, 5], ["d6", 2, 6], ["d6", 3, 7], ["d8", 3, 9], ["d8", 3, 10], ["d8", 3, 11], ["d8", 3, 12], ["d8", 3, 14], ["d10", 4, 15],
      ["d10", 4, 16], ["d10", 4, 16], ["d10", 4, 17], ["d10", 4, 17], ["d12", 4, 18], ["d12", 4, 18], ["d12", 4, 19], ["d12", 4, 20], ["d12", 4, 21], ["d12", 4, 22]] },
    f: [
      { n: 1, nome: "Inspiração de Bardo", d: "Ação bônus: uma criatura a até 18 m ganha seu dado de Inspiração por 1 hora. Quando ela falhar num teste de d20, pode rolar o dado e somar, possivelmente virando sucesso. Usos iguais ao mod. de Carisma (mín. 1) por descanso longo.", a: "bonus", r: "longo", u: "car" },
      CONJ("de bardo", "Carisma", "Pode usar um instrumento musical como foco."),
      { n: 2, nome: "Especialização", d: "Escolha duas perícias em que é proficiente: seu bônus de proficiência dobra nelas.", a: "passiva", x: 1 },
      { n: 2, nome: "Pau pra Toda Obra", d: "Soma metade do bônus de proficiência (arredondado pra baixo) em testes de perícia em que não é proficiente.", a: "passiva" },
      ASI(4),
      { n: 5, nome: "Fonte de Inspiração", d: "Recupera todas as Inspirações no descanso curto também. Pode gastar um espaço de magia pra recuperar uma Inspiração.", a: "passiva" },
      { n: 7, nome: "Contraencanto", d: "Quando você ou uma criatura a até 9 m falha num teste contra enfeitiçado ou amedrontado, pode usar a reação pra ela repetir o teste com vantagem.", a: "reacao" },
      ASI(8),
      { n: 9, nome: "Especialização II", d: "Escolha mais duas perícias em que é proficiente pra dobrar o bônus de proficiência.", a: "passiva", x: 1 },
      { n: 10, nome: "Segredos Mágicos", d: "Pode escolher magias preparadas também das listas de Clérigo, Druida e Mago; elas contam como magias de bardo.", a: "passiva" },
      ASI(12), ASI(16),
      { n: 18, nome: "Inspiração Superior", d: "Ao rolar iniciativa, se tiver menos de duas Inspirações, recupera até ficar com duas.", a: "passiva" },
      DADIVA,
      { n: 20, nome: "Palavras da Criação", d: "Palavra de Poder: Curar e Palavra de Poder: Matar ficam sempre preparadas. Ao conjurá-las, pode escolher uma segunda criatura a até 3 m da primeira.", a: "passiva" },
    ],
    sub: { id: "conhecimento", nome: "Colégio do Conhecimento", d: "Bardos que colecionam saberes, segredos e magias de toda parte.", f: [
      { n: 3, nome: "Proficiências Adicionais", d: "Proficiência em três perícias à sua escolha.", a: "passiva", x: 1 },
      { n: 3, nome: "Palavras Cortantes", d: "Quando uma criatura a até 18 m acerta um dano, faz um teste de atributo ou ataque, use a reação e gaste uma Inspiração: role o dado e subtraia do resultado.", a: "reacao" },
      { n: 6, nome: "Descobertas Mágicas", d: "Aprenda duas magias das listas de Clérigo, Druida ou Mago. Elas ficam sempre preparadas e contam como magias de bardo.", a: "passiva" },
      { n: 14, nome: "Perícia Inigualável", d: "Quando falha num teste de atributo ou ataque, pode gastar uma Inspiração e somar o dado. Se ainda falhar, a Inspiração não é gasta.", a: "livre" },
    ] },
  },

  /* ============================== CLÉRIGO ============================== */
  {
    id: "clerigo", nome: "Clérigo", dv: 8, prim: ["sab"], saves: ["sab", "car"],
    pericias: "Escolha 2: História, Intuição, Medicina, Persuasão ou Religião", armas: "Simples", armaduras: "Leves, médias e escudos",
    multi: "Dado de vida, armaduras leves e médias e escudos.",
    resumo: "Servo de uma divindade que cura, protege e castiga com magia divina.",
    conj: "total", atrConj: "sab", subNome: "Domínio", subNiveis: [3, 6, 17],
    tabela: { cols: ["Canalizar Divindade", "Truques", "Preparadas"], linhas: [
      ["—", 3, 4], [2, 3, 5], [2, 3, 6], [2, 4, 7], [2, 4, 9], [3, 4, 10], [3, 4, 11], [3, 4, 12], [3, 4, 14], [3, 5, 15],
      [3, 5, 16], [3, 5, 16], [3, 5, 17], [3, 5, 17], [3, 5, 18], [3, 5, 18], [3, 5, 19], [4, 5, 20], [4, 5, 21], [4, 5, 22]] },
    f: [
      CONJ("de clérigo", "Sabedoria", "Pode usar um símbolo sagrado como foco."),
      { n: 1, nome: "Ordem Divina", d: "Escolha um papel: Protetor (armas marciais e armadura pesada) ou Taumaturgo (um truque extra e soma o mod. de Sabedoria, mín. +1, em testes de Arcanismo e Religião).", a: "passiva", x: 1 },
      { n: 2, nome: "Canalizar Divindade", d: "Energia divina com usos pela tabela (recupera 1 no descanso curto e todos no longo). Centelha Divina: ação mágica, uma criatura a até 9 m recupera ou sofre (radiante ou necrótico, Constituição pra metade) 1d8 + mod. de Sabedoria. Expulsar Mortos-Vivos: mortos-vivos a até 9 m fazem teste de Sabedoria ou ficam amedrontados e incapacitados por 1 minuto.", a: "acao", r: "longo", u: "c0" },
      ASI(4),
      { n: 5, nome: "Queimar Mortos-Vivos", d: "Ao Expulsar Mortos-Vivos, role uma quantidade de d8 igual ao mod. de Sabedoria: cada morto-vivo que falhar sofre esse dano radiante.", a: "passiva" },
      { n: 7, nome: "Golpes Abençoados", d: "Escolha: Golpe Divino (uma vez por turno, +1d8 radiante ou necrótico ao acertar com arma) ou Conjuração Potente (soma o mod. de Sabedoria ao dano dos truques de clérigo). A Centelha Divina passa a 2d8.", a: "passiva", x: 1 },
      ASI(8),
      { n: 10, nome: "Intervenção Divina", d: "Ação mágica: conjura qualquer magia de clérigo de 5º círculo ou menor sem gastar espaço nem componentes. Uma vez por descanso longo.", a: "acao", r: "longo", u: 1 },
      ASI(12),
      { n: 14, nome: "Golpes Abençoados Aprimorados", d: "Golpe Divino passa a 2d8; ou, com Conjuração Potente, ao causar dano com truque você dá PV temporários iguais ao dobro do mod. de Sabedoria a você ou a um aliado a até 18 m. A Centelha Divina passa a 3d8.", a: "passiva" },
      ASI(16),
      { n: 18, nome: "Centelha Divina 4d8", d: "A Centelha Divina passa a 4d8.", a: "passiva", x: 1 },
      DADIVA,
      { n: 20, nome: "Intervenção Divina Maior", d: "Na Intervenção Divina, pode escolher Desejo. Depois disso, só usa a Intervenção de novo após 2d4 descansos longos.", a: "passiva" },
    ],
    sub: { id: "vida", nome: "Domínio da Vida", d: "Clérigos dedicados à cura, à vitalidade e à proteção dos vivos.", f: [
      { n: 3, nome: "Discípulo da Vida", d: "Quando uma magia sua com espaço restaura PV, a criatura recupera mais 2 + o círculo do espaço.", a: "passiva" },
      { n: 3, nome: "Magias do Domínio da Vida", d: "Sempre preparadas: Auxílio, Bênção, Curar Ferimentos e Restauração Menor (nível 3); Palavra Curativa em Massa e Revivificar (5); Aura de Vida e Proteção contra a Morte (7); Restauração Maior e Curar Ferimentos em Massa (9).", a: "passiva" },
      { n: 3, nome: "Preservar a Vida", d: "Canalizar Divindade: cura um total de PV igual a 5 × seu nível de Clérigo, dividido entre criaturas sangrando a até 9 m (cada uma até metade do PV máximo).", a: "acao" },
      { n: 6, nome: "Curandeiro Abençoado", d: "Quando cura outra criatura com magia de espaço, você também recupera 2 + o círculo do espaço.", a: "passiva" },
      { n: 17, nome: "Cura Suprema", d: "Quando rolaria dados pra restaurar PV com magia ou Canalizar Divindade, use o valor máximo de cada dado.", a: "passiva" },
    ] },
  },

  /* ============================== DRUIDA ============================== */
  {
    id: "druida", nome: "Druida", dv: 8, prim: ["sab"], saves: ["int", "sab"],
    pericias: "Escolha 2: Lidar com Animais, Arcanismo, Intuição, Medicina, Natureza, Percepção, Religião ou Sobrevivência",
    armas: "Simples", armaduras: "Leves e escudos", ferramentas: "Kit de herbalismo",
    multi: "Dado de vida, armaduras leves e escudos.",
    resumo: "Guardião da natureza que muda de forma e controla os elementos.",
    conj: "total", atrConj: "sab", subNome: "Círculo", subNiveis: [3, 6, 10, 14],
    tabela: { cols: ["Forma Selvagem", "Truques", "Preparadas"], linhas: [
      ["—", 2, 4], [2, 2, 5], [2, 2, 6], [2, 3, 7], [2, 3, 9], [3, 3, 10], [3, 3, 11], [3, 3, 12], [3, 3, 14], [3, 4, 15],
      [3, 4, 16], [3, 4, 16], [3, 4, 17], [3, 4, 17], [3, 4, 18], [3, 4, 18], [4, 4, 19], [4, 4, 20], [4, 4, 21], [4, 4, 22]] },
    f: [
      CONJ("de druida", "Sabedoria", "Pode usar um foco druídico."),
      { n: 1, nome: "Druídico", d: "Você conhece a língua secreta dos druidas e sempre tem Falar com Animais preparada.", a: "passiva" },
      { n: 1, nome: "Ordem Primal", d: "Escolha: Mago (um truque extra e soma o mod. de Sabedoria, mín. +1, em Arcanismo e Natureza) ou Guardião (armas marciais e armadura média).", a: "passiva", x: 1 },
      { n: 2, nome: "Forma Selvagem", d: "Ação bônus: assume a forma de uma fera que você conhece, por horas iguais a metade do nível de Druida. Ganha PV temporários iguais ao nível de Druida. Formas conhecidas: nível 2, 4 formas até ND 1/4 sem voo; nível 4, 6 formas até ND 1/2; nível 8, 8 formas até ND 1 com voo. Recupera 1 uso no descanso curto e todos no longo.", a: "bonus", r: "longo", u: "c0" },
      { n: 2, nome: "Companheiro Selvagem", d: "Gaste um espaço de magia ou um uso de Forma Selvagem pra conjurar Convocar Familiar sem componentes. O familiar é uma fada e some depois de um descanso longo.", a: "acao" },
      ASI(4),
      { n: 5, nome: "Ressurgimento Selvagem", d: "Sem usos de Forma Selvagem, pode gastar um espaço de magia pra recuperar um (uma vez por turno). Ou gaste um uso de Forma Selvagem pra ganhar um espaço de 1º círculo (uma vez por descanso longo).", a: "livre" },
      { n: 7, nome: "Fúria Elemental", d: "Escolha: Conjuração Potente (soma o mod. de Sabedoria ao dano dos truques de druida) ou Golpe Primal (uma vez por turno, +1d8 de frio, fogo, raio ou trovão ao acertar com arma ou ataque de fera).", a: "passiva", x: 1 },
      ASI(8), ASI(12),
      { n: 15, nome: "Fúria Elemental Aprimorada", d: "Conjuração Potente: truques com alcance de 3 m ou mais ganham +90 m de alcance. Golpe Primal: o dano extra passa a 2d8.", a: "passiva" },
      ASI(16),
      { n: 18, nome: "Magias de Fera", d: "Você conjura magias em Forma Selvagem, desde que não exijam componentes materiais com custo.", a: "passiva" },
      DADIVA,
      { n: 20, nome: "Arquidruida", d: "Selvageria Eterna: ao rolar iniciativa sem usos de Forma Selvagem, recupera um. Mago da Natureza: converte usos de Forma Selvagem em um espaço de magia (2 círculos por uso), uma vez por descanso longo. Longevidade: você envelhece 1 ano a cada 10.", a: "passiva" },
    ],
    sub: { id: "terra", nome: "Círculo da Terra", d: "Druidas ligados a um tipo de terra: árida, polar, temperada ou tropical.", f: [
      { n: 3, nome: "Magias do Círculo da Terra", d: "Depois de cada descanso longo, escolha um tipo de terra; ganha magias sempre preparadas dele. Árida: Nublar, Mãos Flamejantes, Raio de Fogo; Bola de Fogo (5); Praga (7); Muralha de Pedra (9). Polar: Névoa Obscurecente, Imobilizar Pessoa, Raio de Gelo; Nevasca (5); Tempestade de Gelo (7); Cone de Frio (9). Temperada: Passo Nebuloso, Toque Chocante, Sono; Relâmpago (5); Movimentação Livre (7); Caminhar em Árvores (9). Tropical: Respingo Ácido, Raio Adoecente, Teia; Névoa Fétida (5); Metamorfose (7); Praga de Insetos (9).", a: "passiva" },
      { n: 3, nome: "Auxílio da Terra", d: "Ação mágica, gastando Forma Selvagem: esfera de 3 m a até 18 m. Inimigos ali fazem Constituição ou sofrem 2d6 necrótico (metade se passar), e uma criatura na área recupera 2d6 PV. Sobe para 3d6 no nível 10 e 4d6 no 14.", a: "acao" },
      { n: 6, nome: "Recuperação Natural", d: "Conjura uma magia do círculo sem espaço uma vez por descanso longo. No descanso curto, recupera espaços somando até metade do nível de Druida (nenhum de 6º círculo ou mais), uma vez por descanso longo.", a: "passiva", r: "longo", u: 1 },
      { n: 10, nome: "Proteção da Natureza", d: "Imune a envenenado e com resistência a um dano conforme a terra escolhida: fogo (árida), frio (polar), raio (temperada) ou veneno (tropical).", a: "passiva" },
      { n: 14, nome: "Santuário da Natureza", d: "Ação mágica, gastando Forma Selvagem: árvores espectrais num cubo de 4,5 m a até 36 m, por 1 minuto. Você e aliados ali têm meia cobertura e ganham a resistência da sua Proteção da Natureza.", a: "acao" },
    ] },
  },
];

CLASSES_IGNEA.push(
  /* ============================== GUERREIRO ============================== */
  {
    id: "guerreiro", nome: "Guerreiro", dv: 10, prim: ["for", "des"], primOu: true, saves: ["for", "con"],
    pericias: "Escolha 2: Acrobacia, Lidar com Animais, Atletismo, História, Intuição, Intimidação, Persuasão, Percepção ou Sobrevivência",
    armas: "Simples e marciais", armaduras: "Todas e escudos",
    multi: "Dado de vida, armas marciais, armaduras leves e médias e escudos.",
    resumo: "Mestre das armas e da guerra, versátil e difícil de derrubar.",
    subNome: "Arquétipo", subNiveis: [3, 7, 10, 15, 18],
    tabela: { cols: ["Retomar o Fôlego", "Maestria"], linhas: [
      [2, 3], [2, 3], [2, 3], [3, 4], [3, 4], [3, 4], [3, 4], [3, 4], [3, 4], [4, 5], [4, 5], [4, 5], [4, 5], [4, 5], [4, 5], [4, 6], [4, 6], [4, 6], [4, 6], [4, 6]] },
    f: [
      ESTILO(1),
      { n: 1, nome: "Retomar o Fôlego", d: "Ação bônus: recupera 1d10 + seu nível de Guerreiro em PV. Recupera 1 uso no descanso curto e todos no longo.", a: "bonus", r: "longo", u: "c0" },
      MAESTRIA,
      { n: 2, nome: "Surto de Ação", d: "No seu turno, ganha uma ação extra (menos a ação Magia). Uma vez por descanso curto ou longo; dois usos a partir do nível 17 (só um por turno).", a: "livre", r: "curto", u: 1 },
      { n: 2, nome: "Mente Tática", d: "Quando falha num teste de atributo, pode gastar um uso de Retomar o Fôlego pra somar 1d10. Se ainda falhar, o uso não é gasto.", a: "livre" },
      ASI(4),
      ATAQUE_EXTRA(5),
      { n: 5, nome: "Recuo Tático", d: "Ao usar Retomar o Fôlego, pode se mover até metade do deslocamento sem provocar ataques de oportunidade.", a: "passiva" },
      ASI(6), ASI(8),
      { n: 9, nome: "Indomável", d: "Quando falha num teste de resistência, pode rolar de novo somando seu nível de Guerreiro. Um uso por descanso longo; dois no nível 13 e três no 17.", a: "livre", r: "longo", u: 1 },
      { n: 9, nome: "Mestre Tático", d: "Ao atacar com uma arma de que tem maestria, pode trocar a propriedade dela por Empurrar, Minar ou Retardar naquele ataque.", a: "passiva" },
      { n: 11, nome: "Dois Ataques Extras", d: "Na ação Atacar, você ataca três vezes.", a: "passiva" },
      ASI(12),
      { n: 13, nome: "Ataques Estudados", d: "Se errar um ataque contra uma criatura, tem vantagem no próximo ataque contra ela até o fim do seu próximo turno.", a: "passiva" },
      ASI(14), ASI(16),
      { n: 17, nome: "Surto de Ação e Indomável aprimorados", d: "Surto de Ação passa a 2 usos (um por turno) e Indomável a 3 usos.", a: "passiva", x: 1 },
      DADIVA,
      { n: 20, nome: "Três Ataques Extras", d: "Na ação Atacar, você ataca quatro vezes.", a: "passiva" },
    ],
    sub: { id: "campeao", nome: "Campeão", d: "Guerreiros que buscam a excelência física e a glória da vitória.", f: [
      { n: 3, nome: "Crítico Aprimorado", d: "Seus ataques com arma e desarmados fazem crítico com 19 ou 20 no d20.", a: "passiva" },
      { n: 3, nome: "Atleta Notável", d: "Vantagem em iniciativa e em testes de Força (Atletismo). Logo depois de um crítico, pode se mover até metade do deslocamento sem provocar ataques de oportunidade.", a: "passiva" },
      { n: 7, nome: "Estilo de Luta Adicional", d: "Ganha outro talento de Estilo de Luta.", a: "passiva", x: 1 },
      { n: 10, nome: "Guerreiro Heroico", d: "Em combate, se começar o turno sem Inspiração Heroica, você ganha uma.", a: "passiva" },
      { n: 15, nome: "Crítico Superior", d: "Seus ataques com arma e desarmados fazem crítico com 18 a 20.", a: "passiva" },
      { n: 18, nome: "Sobrevivente", d: "Desafiar a Morte: vantagem em testes contra a morte, e 18 a 20 conta como 20. Recuperação Heroica: no começo do turno, se estiver sangrando e com pelo menos 1 PV, recupera 5 + mod. de Constituição.", a: "passiva" },
    ] },
  },

  /* ============================== MONGE ============================== */
  {
    id: "monge", nome: "Monge", dv: 8, prim: ["des", "sab"], saves: ["for", "des"],
    pericias: "Escolha 2: Acrobacia, Atletismo, História, Intuição, Religião ou Furtividade",
    armas: "Simples e marciais leves", armaduras: "Nenhuma", ferramentas: "Um tipo de ferramenta de artesão ou instrumento",
    multi: "Dado de vida.",
    resumo: "Artista marcial que transforma disciplina em golpes rápidos e foco sobrenatural.",
    subNome: "Tradição", subNiveis: [3, 6, 11, 17],
    tabela: { cols: ["Artes Marciais", "Foco", "Deslocamento extra"], linhas: [
      ["1d6", "—", "—"], ["1d6", 2, "+3 m"], ["1d6", 3, "+3 m"], ["1d6", 4, "+3 m"], ["1d8", 5, "+3 m"], ["1d8", 6, "+4,5 m"], ["1d8", 7, "+4,5 m"], ["1d8", 8, "+4,5 m"], ["1d8", 9, "+4,5 m"], ["1d8", 10, "+6 m"],
      ["1d10", 11, "+6 m"], ["1d10", 12, "+6 m"], ["1d10", 13, "+6 m"], ["1d10", 14, "+7,5 m"], ["1d10", 15, "+7,5 m"], ["1d10", 16, "+7,5 m"], ["1d12", 17, "+7,5 m"], ["1d12", 18, "+9 m"], ["1d12", 19, "+9 m"], ["1d12", 20, "+9 m"]] },
    f: [
      { n: 1, nome: "Artes Marciais", d: "Sem armadura e escudo: pode usar Destreza nos ataques desarmados e com armas de monge, rolar o dado de Artes Marciais no dano delas e fazer um ataque desarmado como ação bônus.", a: "bonus" },
      { n: 1, nome: "Defesa sem Armadura", d: "Sem armadura e escudo, sua CA é 10 + mod. de Destreza + mod. de Sabedoria.", a: "passiva" },
      { n: 2, nome: "Foco do Monge", d: "Pontos de Foco pela tabela, recuperados no descanso curto ou longo. Rajada de Golpes (1 ponto: dois ataques desarmados como ação bônus), Defesa Paciente (Desengajar como ação bônus; com 1 ponto, também Esquivar) e Passo do Vento (Disparar como ação bônus; com 1 ponto, também Desengajar e salto dobrado).", a: "bonus", r: "curto", u: "c1" },
      { n: 2, nome: "Movimento sem Armadura", d: "Sem armadura e escudo, seu deslocamento aumenta conforme a tabela.", a: "passiva" },
      { n: 2, nome: "Metabolismo Sobrenatural", d: "Ao rolar iniciativa, recupera todos os pontos de Foco e cura um dado de Artes Marciais + nível de Monge. Uma vez por descanso longo.", a: "livre", r: "longo", u: 1 },
      { n: 3, nome: "Desviar Ataques", d: "Quando um ataque te causa dano de concussão, perfuração ou corte, reduza o dano em 1d10 + mod. de Destreza + nível de Monge. Se zerar, pode gastar 1 Foco pra redirecionar: alguém a até 1,5 m (ou 18 m) faz Destreza ou sofre dois dados de Artes Marciais + Destreza.", a: "reacao" },
      ASI(4),
      { n: 4, nome: "Queda Lenta", d: "Ao cair, reduza o dano da queda em 5 × seu nível de Monge.", a: "reacao" },
      ATAQUE_EXTRA(5),
      { n: 5, nome: "Golpe Atordoante", d: "Uma vez por turno, ao acertar com arma de monge ou desarmado, gaste 1 Foco: o alvo faz Constituição ou fica atordoado até seu próximo turno. Se passar, perde metade do deslocamento e o próximo ataque contra ele tem vantagem.", a: "livre" },
      { n: 6, nome: "Golpes Fortalecidos", d: "Seus ataques desarmados podem causar dano de energia em vez do normal.", a: "passiva" },
      EVASAO(7),
      ASI(8),
      { n: 9, nome: "Movimento Acrobático", d: "Sem armadura e escudo, você pode andar por superfícies verticais e por líquidos no seu turno sem cair.", a: "passiva" },
      { n: 10, nome: "Foco Elevado", d: "Rajada de Golpes passa a três ataques; Defesa Paciente dá PV temporários iguais a dois dados de Artes Marciais; Passo do Vento pode levar uma criatura voluntária junto.", a: "passiva" },
      { n: 10, nome: "Autorrestauração", d: "No fim do turno, pode encerrar enfeitiçado, amedrontado ou envenenado em você. Ficar sem comida e água não te dá exaustão.", a: "passiva" },
      ASI(12),
      { n: 13, nome: "Desviar Energia", d: "Desviar Ataques passa a funcionar contra ataques de qualquer tipo de dano.", a: "passiva" },
      { n: 14, nome: "Sobrevivente Disciplinado", d: "Proficiência em todos os testes de resistência. Ao falhar num, pode gastar 1 Foco pra rolar de novo.", a: "passiva" },
      { n: 15, nome: "Foco Perfeito", d: "Ao rolar iniciativa sem usar Metabolismo Sobrenatural, se tiver 3 pontos de Foco ou menos, fica com 4.", a: "passiva" },
      ASI(16),
      { n: 18, nome: "Defesa Superior", d: "Gaste 3 Foco: por 1 minuto, resistência a todo dano, menos energia.", a: "livre" },
      DADIVA,
      { n: 20, nome: "Corpo e Mente", d: "Destreza e Sabedoria aumentam em 4, até o máximo de 25.", a: "passiva" },
    ],
    sub: { id: "mao-aberta", nome: "Guerreiro da Mão Aberta", d: "Monges mestres do combate desarmado, que derrubam e empurram inimigos.", f: [
      { n: 3, nome: "Técnica da Mão Aberta", d: "Ao acertar um golpe da Rajada de Golpes, escolha: Atrapalhar (o alvo não usa reação até o próximo turno), Empurrar (Força ou é empurrado 4,5 m) ou Derrubar (Destreza ou cai).", a: "passiva" },
      { n: 6, nome: "Integridade do Corpo", d: "Ação bônus: recupera PV iguais a um dado de Artes Marciais + mod. de Sabedoria. Usos iguais ao mod. de Sabedoria por descanso longo.", a: "bonus", r: "longo", u: "sab" },
      { n: 11, nome: "Passo Ligeiro", d: "Quando usa uma ação bônus que não seja Passo do Vento, pode usar Passo do Vento logo depois.", a: "passiva" },
      { n: 17, nome: "Palma Vibrante", d: "Ao acertar um ataque desarmado, gaste 4 Foco pra plantar vibrações. Depois, com uma ação, o alvo faz Constituição: 10d12 de energia, metade se passar.", a: "acao" },
    ] },
  },

  /* ============================== PALADINO ============================== */
  {
    id: "paladino", nome: "Paladino", dv: 10, prim: ["for", "car"], saves: ["sab", "car"],
    pericias: "Escolha 2: Atletismo, Intuição, Intimidação, Medicina, Persuasão ou Religião",
    armas: "Simples e marciais", armaduras: "Todas e escudos",
    multi: "Dado de vida, armas marciais, armaduras leves e médias e escudos.",
    resumo: "Guerreiro sagrado ligado a um juramento, que protege aliados e castiga inimigos.",
    conj: "meio", atrConj: "car", subNome: "Juramento", subNiveis: [3, 7, 15, 20],
    tabela: { cols: ["Canalizar Divindade", "Preparadas"], linhas: [
      ["—", 2], ["—", 3], [2, 4], [2, 5], [2, 6], [2, 6], [2, 7], [2, 7], [2, 9], [2, 9], [3, 10], [3, 10], [3, 11], [3, 11], [3, 12], [3, 12], [3, 14], [3, 14], [3, 15], [3, 15]] },
    f: [
      { n: 1, nome: "Cura pelas Mãos", d: "Reserva de cura igual a 5 × seu nível de Paladino, recuperada no descanso longo. Ação bônus: toque uma criatura e cure PV da reserva. Gastando 5 pontos, remove envenenado.", a: "bonus", r: "longo" },
      CONJ("de paladino", "Carisma", "Pode usar um símbolo sagrado como foco."),
      MAESTRIA,
      ESTILO(2, " Ou Guerreiro Abençoado: dois truques de clérigo."),
      { n: 2, nome: "Golpe do Paladino", d: "Golpe Divino fica sempre preparado. Pode conjurá-lo sem gastar espaço uma vez por descanso longo.", a: "bonus", r: "longo", u: 1 },
      { n: 3, nome: "Canalizar Divindade", d: "Usos pela tabela (recupera 1 no descanso curto e todos no longo). Sentido Divino: ação bônus, por 10 minutos sabe onde há celestiais, infernais e mortos-vivos a até 18 m.", a: "bonus", r: "longo", u: "c0" },
      ASI(4),
      ATAQUE_EXTRA(5),
      { n: 5, nome: "Montaria Fiel", d: "Convocar Montaria fica sempre preparada e pode ser conjurada sem espaço uma vez por descanso longo.", a: "acao", r: "longo", u: 1 },
      { n: 6, nome: "Aura de Proteção", d: "Você e aliados a até 3 m somam seu mod. de Carisma (mín. +1) nos testes de resistência, se você não estiver incapacitado.", a: "passiva" },
      ASI(8),
      { n: 9, nome: "Abjurar Inimigos", d: "Canalizar Divindade (ação mágica): criaturas à escolha a até 18 m, num número igual ao mod. de Carisma, fazem Sabedoria ou ficam amedrontadas por 1 minuto, podendo só se mover, agir ou usar ação bônus em cada turno.", a: "acao" },
      { n: 10, nome: "Aura de Coragem", d: "Você e aliados na sua aura são imunes a amedrontado.", a: "passiva" },
      { n: 11, nome: "Golpes Radiantes", d: "Ataques corpo a corpo com arma ou desarmados causam +1d8 radiante.", a: "passiva" },
      ASI(12),
      { n: 14, nome: "Toque Restaurador", d: "Com Cura pelas Mãos, gaste 5 pontos pra remover também cego, enfeitiçado, surdo, amedrontado, paralisado ou atordoado.", a: "passiva" },
      ASI(16),
      { n: 18, nome: "Expansão de Aura", d: "Sua Aura de Proteção passa a 9 m.", a: "passiva" },
      DADIVA,
    ],
    sub: { id: "devocao", nome: "Juramento de Devoção", d: "Paladinos que seguem os ideais de justiça, honra e virtude.", f: [
      { n: 3, nome: "Magias do Juramento de Devoção", d: "Sempre preparadas: Proteção contra o Bem e o Mal e Escudo da Fé (3); Auxílio e Zona da Verdade (5); Sinal de Esperança e Dissipar Magia (9); Movimentação Livre e Guardião da Fé (13); Comunhão e Coluna de Chamas (17).", a: "passiva" },
      { n: 3, nome: "Arma Sagrada", d: "Ao usar a ação Atacar, gaste Canalizar Divindade: por 10 minutos sua arma soma o mod. de Carisma nos ataques, brilha e pode causar dano radiante.", a: "livre" },
      { n: 7, nome: "Aura de Devoção", d: "Você e aliados na sua aura são imunes a enfeitiçado.", a: "passiva" },
      { n: 15, nome: "Golpe de Proteção", d: "Ao conjurar Golpe Divino, você e aliados na aura ganham meia cobertura até seu próximo turno.", a: "passiva" },
      { n: 20, nome: "Halo Sagrado", d: "Ação bônus, por 10 minutos: vantagem em resistências contra infernais e mortos-vivos, inimigos que começam o turno na aura sofrem dano radiante (Carisma + proficiência) e a aura emite luz do sol. Uma vez por descanso longo, ou gastando um espaço de 5º círculo.", a: "bonus", r: "longo", u: 1 },
    ] },
  },

  /* ============================== PATRULHEIRO ============================== */
  {
    id: "patrulheiro", nome: "Patrulheiro", dv: 10, prim: ["des", "sab"], saves: ["for", "des"],
    pericias: "Escolha 3: Lidar com Animais, Atletismo, Intuição, Investigação, Natureza, Percepção, Furtividade ou Sobrevivência",
    armas: "Simples e marciais", armaduras: "Leves, médias e escudos",
    multi: "Dado de vida, uma perícia da lista, armas marciais, armaduras leves e médias e escudos.",
    resumo: "Caçador e explorador das terras selvagens, com magia da natureza.",
    conj: "meio", atrConj: "sab", subNome: "Conclave", subNiveis: [3, 7, 11, 15],
    tabela: { cols: ["Inimigo Favorito", "Preparadas"], linhas: [
      [2, 2], [2, 3], [2, 4], [2, 5], [3, 6], [3, 6], [3, 7], [3, 7], [4, 9], [4, 9], [4, 10], [4, 10], [5, 11], [5, 11], [5, 12], [5, 12], [6, 14], [6, 14], [6, 15], [6, 15]] },
    f: [
      CONJ("de patrulheiro", "Sabedoria", "Pode usar um foco druídico."),
      { n: 1, nome: "Inimigo Favorito", d: "Marca do Caçador fica sempre preparada. Pode conjurá-la sem gastar espaço um número de vezes pela tabela, por descanso longo.", a: "bonus", r: "longo", u: "c0" },
      MAESTRIA,
      { n: 2, nome: "Explorador Hábil", d: "Especialização numa perícia em que é proficiente e dois idiomas à sua escolha.", a: "passiva", x: 1 },
      ESTILO(2, " Ou Guerreiro Druídico: dois truques de druida."),
      ASI(4),
      ATAQUE_EXTRA(5),
      { n: 6, nome: "Andarilho", d: "Sem armadura pesada, seu deslocamento aumenta 3 m e você ganha deslocamento de escalada e natação iguais ao deslocamento.", a: "passiva" },
      ASI(8),
      { n: 9, nome: "Especialização", d: "Escolha duas perícias em que é proficiente pra dobrar o bônus de proficiência.", a: "passiva", x: 1 },
      { n: 10, nome: "Incansável", d: "Ação mágica: ganha 1d8 + mod. de Sabedoria em PV temporários (usos iguais ao mod. de Sabedoria por descanso longo). Ao terminar um descanso curto, reduz a exaustão em 1.", a: "acao", r: "longo", u: "sab" },
      ASI(12),
      { n: 13, nome: "Caçador Implacável", d: "Sofrer dano não quebra sua concentração na Marca do Caçador.", a: "passiva" },
      { n: 14, nome: "Véu da Natureza", d: "Ação bônus: fica invisível até o fim do seu próximo turno. Usos iguais ao mod. de Sabedoria por descanso longo.", a: "bonus", r: "longo", u: "sab" },
      ASI(16),
      { n: 17, nome: "Caçador Preciso", d: "Vantagem nos ataques contra a criatura marcada com a sua Marca do Caçador.", a: "passiva" },
      { n: 18, nome: "Sentidos Selvagens", d: "Percepção às cegas a até 9 m.", a: "passiva" },
      DADIVA,
      { n: 20, nome: "Matador de Inimigos", d: "O dano da Marca do Caçador passa a d10.", a: "passiva" },
    ],
    sub: { id: "cacador", nome: "Caçador", d: "Patrulheiros que protegem o mundo das ameaças mais perigosas.", f: [
      { n: 3, nome: "Conhecimento do Caçador", d: "Enquanto uma criatura estiver com sua Marca do Caçador, você sabe se ela tem imunidades, resistências ou vulnerabilidades, e quais são.", a: "passiva" },
      { n: 3, nome: "Presa do Caçador", d: "Escolha (troca no descanso): Matador de Colossos (+1d8 uma vez por turno contra quem já perdeu PV) ou Quebra-Hordas (uma vez por turno, ataque extra contra outra criatura a até 1,5 m do primeiro alvo).", a: "passiva", x: 1 },
      { n: 7, nome: "Táticas Defensivas", d: "Escolha (troca no descanso): Escapar da Horda (ataques de oportunidade contra você têm desvantagem) ou Defesa contra Múltiplos Ataques (depois que uma criatura te acerta, os outros ataques dela no turno têm desvantagem).", a: "passiva", x: 1 },
      { n: 11, nome: "Presa do Caçador Superior", d: "Uma vez por turno, ao causar o dano da Marca do Caçador, cause o mesmo dano a outra criatura a até 9 m do alvo.", a: "passiva" },
      { n: 15, nome: "Defesa Superior do Caçador", d: "Ao sofrer dano, ganha resistência a esse tipo de dano até o fim do turno.", a: "reacao" },
    ] },
  },
);

CLASSES_IGNEA.push(
  /* ============================== LADINO ============================== */
  {
    id: "ladino", nome: "Ladino", dv: 8, prim: ["des"], saves: ["des", "int"],
    pericias: "Escolha 4: Acrobacia, Atletismo, Enganação, Intuição, Intimidação, Investigação, Percepção, Persuasão, Prestidigitação ou Furtividade",
    armas: "Simples e marciais com Acuidade ou Leve", armaduras: "Leves", ferramentas: "Ferramentas de ladrão",
    multi: "Dado de vida, uma perícia da lista, ferramentas de ladrão e armaduras leves.",
    resumo: "Especialista em furtividade, perícias e golpes certeiros nos pontos fracos.",
    subNome: "Arquétipo", subNiveis: [3, 9, 13, 17],
    tabela: { cols: ["Ataque Furtivo"], linhas: [
      ["1d6"], ["1d6"], ["2d6"], ["2d6"], ["3d6"], ["3d6"], ["4d6"], ["4d6"], ["5d6"], ["5d6"], ["6d6"], ["6d6"], ["7d6"], ["7d6"], ["8d6"], ["8d6"], ["9d6"], ["9d6"], ["10d6"], ["10d6"]] },
    f: [
      { n: 1, nome: "Especialização", d: "Escolha duas perícias em que é proficiente: seu bônus de proficiência dobra nelas.", a: "passiva", x: 1 },
      { n: 1, nome: "Ataque Furtivo", d: "Uma vez por turno, causa dano extra (tabela) ao acertar com arma de Acuidade ou à distância, se tiver vantagem ou se um aliado estiver a até 1,5 m do alvo (e você não tiver desvantagem).", a: "passiva" },
      { n: 1, nome: "Gíria de Ladrão", d: "Você conhece a gíria secreta dos ladrões e mais um idioma.", a: "passiva", x: 1 },
      MAESTRIA,
      { n: 2, nome: "Ação Astuta", d: "Ação bônus: Disparar, Desengajar ou Esconder.", a: "bonus" },
      { n: 3, nome: "Mira Firme", d: "Ação bônus, se não se moveu no turno: vantagem no próximo ataque do turno. Seu deslocamento vira 0 até o fim do turno.", a: "bonus" },
      ASI(4),
      { n: 5, nome: "Golpe Astuto", d: "Ao causar Ataque Furtivo, troque dados por efeitos: Veneno (1d6: Constituição ou envenenado por 1 minuto), Rasteira (1d6: Destreza ou cai) ou Recuo (1d6: você se move metade do deslocamento sem provocar ataques).", a: "passiva" },
      { n: 5, nome: "Esquiva Sobrenatural", d: "Quando um atacante que você vê te acerta, reduza o dano desse ataque à metade.", a: "reacao" },
      { n: 6, nome: "Especialização II", d: "Escolha mais duas perícias em que é proficiente pra dobrar o bônus de proficiência.", a: "passiva", x: 1 },
      EVASAO(7),
      { n: 7, nome: "Talento Confiável", d: "Em testes de perícia ou ferramenta em que é proficiente, trate um 9 ou menos no d20 como 10.", a: "passiva" },
      ASI(8), ASI(10),
      { n: 11, nome: "Golpe Astuto Aprimorado", d: "Pode usar até dois efeitos de Golpe Astuto no mesmo Ataque Furtivo, pagando os dois.", a: "passiva" },
      ASI(12),
      { n: 14, nome: "Golpes Ardilosos", d: "Novos efeitos: Atordoar (2d6: Constituição ou só faz uma coisa no próximo turno), Nocaute (6d6: Constituição ou fica inconsciente por 1 minuto) e Ofuscar (3d6: Destreza ou fica cego até o fim do próximo turno).", a: "passiva" },
      { n: 15, nome: "Mente Escorregadia", d: "Proficiência em testes de resistência de Sabedoria e Carisma.", a: "passiva" },
      ASI(16),
      { n: 18, nome: "Elusivo", d: "Nenhum ataque tem vantagem contra você, a não ser que esteja incapacitado.", a: "passiva" },
      DADIVA,
      { n: 20, nome: "Golpe de Sorte", d: "Quando falha num teste de d20, pode transformar o resultado em 20. Uma vez por descanso curto ou longo.", a: "livre", r: "curto", u: 1 },
    ],
    sub: { id: "ladrao", nome: "Ladrão", d: "Ladinos aventureiros: arrombadores, caçadores de tesouro e exploradores.", f: [
      { n: 3, nome: "Mãos Rápidas", d: "Ação bônus: Prestidigitação pra abrir fechadura, desarmar armadilha ou bater carteira; ou usar um objeto, inclusive item mágico que exija a ação Magia.", a: "bonus" },
      { n: 3, nome: "Trabalho no Segundo Andar", d: "Deslocamento de escalada igual ao deslocamento, e sua distância de salto usa Destreza em vez de Força.", a: "passiva" },
      { n: 9, nome: "Furtividade Suprema", d: "Novo Golpe Astuto: Ataque Furtivo Oculto (1d6). Se você estava escondido, o ataque não revela sua posição se terminar o turno atrás de cobertura.", a: "passiva" },
      { n: 13, nome: "Usar Dispositivo Mágico", d: "Sintoniza até 4 itens. Ao gastar cargas de um item, role 1d6: com 6, não gasta. Pode usar qualquer pergaminho de magia, com Inteligência como atributo (e teste de Arcanismo se a magia não for da sua lista).", a: "passiva" },
      { n: 17, nome: "Reflexos de Ladrão", d: "Na primeira rodada de combate você joga dois turnos: o normal e outro na iniciativa −10.", a: "passiva" },
    ] },
  },

  /* ============================== FEITICEIRO ============================== */
  {
    id: "feiticeiro", nome: "Feiticeiro", dv: 6, prim: ["car"], saves: ["con", "car"],
    pericias: "Escolha 2: Arcanismo, Enganação, Intuição, Intimidação, Persuasão ou Religião", armas: "Simples", armaduras: "Nenhuma",
    multi: "Dado de vida.",
    resumo: "Conjurador com magia no sangue, que molda os feitiços com Metamagia.",
    conj: "total", atrConj: "car", subNome: "Origem", subNiveis: [3, 6, 14, 18],
    tabela: { cols: ["Pontos de Feitiçaria", "Truques", "Preparadas"], linhas: [
      ["—", 4, 2], [2, 4, 4], [3, 4, 6], [4, 5, 7], [5, 5, 9], [6, 5, 10], [7, 5, 11], [8, 5, 12], [9, 5, 14], [10, 6, 15],
      [11, 6, 16], [12, 6, 16], [13, 6, 17], [14, 6, 17], [15, 6, 18], [16, 6, 18], [17, 6, 19], [18, 6, 20], [19, 6, 21], [20, 6, 22]] },
    f: [
      CONJ("de feiticeiro", "Carisma", "Pode usar um foco arcano."),
      { n: 1, nome: "Feitiçaria Inata", d: "Ação bônus: por 1 minuto, +1 na CD das suas magias de feiticeiro e vantagem nos ataques mágicos delas. Dois usos por descanso longo.", a: "bonus", r: "longo", u: 2 },
      { n: 2, nome: "Fonte de Magia", d: "Pontos de Feitiçaria pela tabela, recuperados no descanso longo. Converta espaços em pontos (pontos = círculo) ou pontos em espaços (1º: 2, 2º: 3, 3º: 5, 4º: 6, 5º: 7).", a: "bonus", r: "longo", u: "c0" },
      { n: 2, nome: "Metamagia", d: "Aprenda duas opções (mais duas nos níveis 10 e 17) e use uma por magia gastando pontos: Cuidadosa, Distante, Potencializada, Estendida, Elevada, Acelerada, Buscadora, Sutil, Transmutada ou Gêmea.", a: "passiva" },
      ASI(4),
      { n: 5, nome: "Restauração Feiticeira", d: "No descanso curto, recupera Pontos de Feitiçaria até metade do nível de Feiticeiro. Uma vez por descanso longo.", a: "passiva", r: "longo", u: 1 },
      { n: 7, nome: "Feitiçaria Encarnada", d: "Sem usos de Feitiçaria Inata, pode ativá-la gastando 2 pontos. Com ela ativa, pode usar até duas Metamagias na mesma magia.", a: "passiva" },
      ASI(8), ASI(12), ASI(16),
      DADIVA,
      { n: 20, nome: "Apoteose Arcana", d: "Com Feitiçaria Inata ativa, uma Metamagia por turno não custa pontos.", a: "passiva" },
    ],
    sub: { id: "draconica", nome: "Feitiçaria Dracônica", d: "Feiticeiros com sangue de dragão correndo nas veias.", f: [
      { n: 3, nome: "Resiliência Dracônica", d: "Seu PV máximo aumenta 3, e mais 1 a cada nível de Feiticeiro depois. Sem armadura, sua CA é 10 + mod. de Destreza + mod. de Carisma.", a: "passiva" },
      { n: 3, nome: "Magias Dracônicas", d: "Sempre preparadas: Alterar-se, Orbe Cromático, Comando e Sopro do Dragão (3); Medo e Voo (5); Olho Arcano e Enfeitiçar Monstro (7); Lendas e Histórias e Invocar Dragão (9).", a: "passiva" },
      { n: 6, nome: "Afinidade Elemental", d: "Escolha ácido, frio, fogo, raio ou veneno: ganha resistência a ele e soma o mod. de Carisma a uma rolagem de dano das magias desse tipo.", a: "passiva" },
      { n: 14, nome: "Asas de Dragão", d: "Ação bônus: asas dracônicas por 1 hora, com deslocamento de voo de 18 m. Uma vez por descanso longo, ou gastando 3 pontos.", a: "bonus", r: "longo", u: 1 },
      { n: 18, nome: "Companheiro Dracônico", d: "Conjura Invocar Dragão sem componente material e, uma vez por descanso longo, sem gastar espaço. A magia pode durar 1 minuto sem concentração.", a: "acao", r: "longo", u: 1 },
    ] },
  },

  /* ============================== BRUXO ============================== */
  {
    id: "bruxo", nome: "Bruxo", dv: 8, prim: ["car"], saves: ["sab", "car"],
    pericias: "Escolha 2: Arcanismo, Enganação, História, Intimidação, Investigação, Natureza ou Religião", armas: "Simples", armaduras: "Leves",
    multi: "Dado de vida e armaduras leves.",
    resumo: "Conjurador que firmou um pacto com um ser poderoso em troca de magia.",
    conj: "pacto", atrConj: "car", subNome: "Patrono", subNiveis: [3, 6, 10, 14],
    tabela: { cols: ["Invocações", "Truques", "Preparadas", "Espaços", "Círculo"], linhas: [
      [1, 2, 2, 1, 1], [3, 2, 3, 2, 1], [3, 2, 4, 2, 2], [3, 3, 5, 2, 2], [5, 3, 6, 2, 3], [5, 3, 7, 2, 3], [6, 3, 8, 2, 4], [6, 3, 9, 2, 4], [7, 3, 10, 2, 5], [7, 4, 10, 2, 5],
      [7, 4, 11, 3, 5], [8, 4, 11, 3, 5], [8, 4, 12, 3, 5], [8, 4, 12, 3, 5], [9, 4, 13, 3, 5], [9, 4, 13, 3, 5], [9, 4, 14, 4, 5], [10, 4, 14, 4, 5], [10, 4, 15, 4, 5], [10, 4, 15, 4, 5]] },
    f: [
      { n: 1, nome: "Invocações Místicas", d: "Fragmentos de conhecimento proibido que dão poderes permanentes ou magias à vontade. Quantidade pela tabela; ao subir de nível pode trocar uma.", a: "passiva" },
      { n: 1, nome: "Magia de Pacto", d: "Conjura magias de bruxo com Carisma. Seus espaços de magia são poucos, todos do mesmo círculo (tabela), e voltam no descanso curto ou longo.", a: "passiva", x: 1 },
      { n: 2, nome: "Astúcia Mágica", d: "Com um ritual de 1 minuto, recupera até metade dos espaços de Magia de Pacto (arredondado pra cima). Uma vez por descanso longo.", a: "acao", r: "longo", u: 1 },
      ASI(4), ASI(8),
      { n: 9, nome: "Contatar Patrono", d: "Contatar Outro Plano fica sempre preparada. Uma vez por descanso longo, conjura sem espaço pra falar com seu patrono, passando automaticamente no teste.", a: "acao", r: "longo", u: 1 },
      { n: 11, nome: "Arcano Místico (6º)", d: "Escolha uma magia de bruxo de 6º círculo: conjura uma vez por descanso longo sem gastar espaço.", a: "acao", r: "longo", u: 1 },
      ASI(12),
      { n: 13, nome: "Arcano Místico (7º)", d: "Escolha uma magia de bruxo de 7º círculo: conjura uma vez por descanso longo sem gastar espaço.", a: "acao", r: "longo", u: 1 },
      { n: 15, nome: "Arcano Místico (8º)", d: "Escolha uma magia de bruxo de 8º círculo: conjura uma vez por descanso longo sem gastar espaço.", a: "acao", r: "longo", u: 1 },
      ASI(16),
      { n: 17, nome: "Arcano Místico (9º)", d: "Escolha uma magia de bruxo de 9º círculo: conjura uma vez por descanso longo sem gastar espaço.", a: "acao", r: "longo", u: 1 },
      DADIVA,
      { n: 20, nome: "Mestre Místico", d: "Astúcia Mágica passa a recuperar todos os espaços de Magia de Pacto.", a: "passiva" },
    ],
    sub: { id: "infernal", nome: "Patrono Infernal", d: "Bruxos que fizeram pacto com um poder dos planos inferiores.", f: [
      { n: 3, nome: "Bênção do Obscuro", d: "Quando você (ou alguém a até 3 m de você) reduz um inimigo a 0 PV, ganha PV temporários iguais ao mod. de Carisma + nível de Bruxo (mín. 1).", a: "passiva" },
      { n: 3, nome: "Magias Infernais", d: "Sempre preparadas: Mãos Flamejantes, Comando, Raio Ardente e Sugestão (3); Bola de Fogo e Névoa Fétida (5); Escudo de Fogo e Muralha de Fogo (7); Missão e Praga de Insetos (9).", a: "passiva" },
      { n: 6, nome: "Sorte do Próprio Obscuro", d: "Some 1d10 a um teste de atributo ou de resistência, depois de ver a rolagem. Usos iguais ao mod. de Carisma por descanso longo (um por rolagem).", a: "livre", r: "longo", u: "car" },
      { n: 10, nome: "Resiliência Infernal", d: "Depois de um descanso, escolha um tipo de dano (menos energia): você tem resistência a ele até escolher outro.", a: "passiva" },
      { n: 14, nome: "Arremessar pelo Inferno", d: "Uma vez por turno, ao acertar um ataque: o alvo faz Carisma ou é arrastado pelos planos inferiores, sofrendo 8d10 psíquico (se não for infernal) e ficando incapacitado até o fim do seu próximo turno. Uma vez por descanso longo, ou gastando um espaço de pacto.", a: "livre", r: "longo", u: 1 },
    ] },
  },

  /* ============================== MAGO ============================== */
  {
    id: "mago", nome: "Mago", dv: 6, prim: ["int"], saves: ["int", "sab"],
    pericias: "Escolha 2: Arcanismo, História, Intuição, Investigação, Medicina, Natureza ou Religião", armas: "Simples", armaduras: "Nenhuma",
    multi: "Dado de vida.",
    resumo: "Estudioso das artes arcanas, com o grimório mais versátil de todos.",
    conj: "total", atrConj: "int", subNome: "Escola", subNiveis: [3, 6, 10, 14],
    tabela: { cols: ["Truques", "Preparadas"], linhas: [
      [3, 4], [3, 5], [3, 6], [4, 7], [4, 9], [4, 10], [4, 11], [4, 12], [4, 14], [5, 15], [5, 16], [5, 16], [5, 17], [5, 18], [5, 19], [5, 21], [5, 22], [5, 23], [5, 24], [5, 25]] },
    f: [
      CONJ("de mago", "Inteligência", "Suas magias ficam num grimório: comece com seis de 1º círculo e copie mais quando encontrar."),
      { n: 1, nome: "Ritualista", d: "Pode conjurar como ritual qualquer magia com a marca Ritual que esteja no seu grimório, mesmo sem prepará-la.", a: "passiva" },
      { n: 1, nome: "Recuperação Arcana", d: "No descanso curto, recupera espaços de magia somando até metade do nível de Mago (arredondado pra cima), nenhum de 6º círculo ou mais. Uma vez por descanso longo.", a: "passiva", r: "longo", u: 1 },
      { n: 2, nome: "Erudito", d: "Especialização numa destas perícias em que é proficiente: Arcanismo, História, Investigação, Medicina, Natureza ou Religião.", a: "passiva", x: 1 },
      ASI(4),
      { n: 5, nome: "Memorizar Magia", d: "Ao terminar um descanso curto, pode trocar uma magia preparada por outra do grimório.", a: "passiva" },
      ASI(8), ASI(12), ASI(16),
      { n: 18, nome: "Maestria em Magia", d: "Escolha uma magia de 1º e uma de 2º círculo do grimório (com tempo de ação): conjura à vontade no círculo mais baixo, sem gastar espaço.", a: "passiva" },
      DADIVA,
      { n: 20, nome: "Magias Assinatura", d: "Escolha duas magias de 3º círculo do grimório: ficam sempre preparadas e cada uma pode ser conjurada uma vez sem espaço por descanso curto ou longo.", a: "passiva" },
    ],
    sub: { id: "evocador", nome: "Evocador", d: "Magos que dominam a magia de destruição: fogo, raio, gelo e energia pura.", f: [
      { n: 3, nome: "Sábio da Evocação", d: "Adicione duas magias de evocação de mago (até 2º círculo) ao grimório de graça, e mais uma cada vez que ganhar acesso a um novo círculo.", a: "passiva" },
      { n: 3, nome: "Truque Potente", d: "Quando um truque de dano seu erra ou o alvo passa no teste, ele ainda sofre metade do dano (sem efeitos extras).", a: "passiva" },
      { n: 6, nome: "Esculpir Magias", d: "Ao conjurar uma evocação que afeta outras criaturas, escolha 1 + o círculo da magia delas: passam automaticamente no teste e não sofrem dano.", a: "passiva" },
      { n: 10, nome: "Evocação Fortalecida", d: "Some o mod. de Inteligência a uma rolagem de dano das suas magias de evocação de mago.", a: "passiva" },
      { n: 14, nome: "Sobrecarga", d: "Ao conjurar uma magia de mago de 1º a 5º círculo que cause dano, cause o dano máximo. Depois do primeiro uso no descanso longo, cada novo uso causa 2d12 necrótico por círculo em você (e aumenta a cada vez).", a: "livre" },
    ] },
  },
);

/* ============================== RAÇAS ============================== */
const RACAS_IGNEA = [
  { id: "draconato", nome: "Draconato", tam: "Médio", desl: "9 m", d: "Descendentes de dragões, com escamas e um sopro elemental.", t: [
    { nome: "Ancestralidade Dracônica", d: "Escolha um dragão ancestral; ele define o tipo de dano do seu sopro e da sua resistência: ácido (negro, cobre), raio (azul, bronze), fogo (latão, ouro, vermelho), veneno (verde) ou frio (prata, branco).", a: "passiva", x: 1 },
    { nome: "Arma de Sopro", d: "No lugar de um ataque da ação Atacar: cone de 4,5 m ou linha de 9 m. Teste de Destreza (CD 8 + Constituição + proficiência): 1d10 do seu tipo, metade se passar. Sobe para 2d10 no nível 5, 3d10 no 11 e 4d10 no 17. Usos iguais ao bônus de proficiência por descanso longo.", a: "acao", r: "longo", u: "pb" },
    { nome: "Resistência a Dano", d: "Resistência ao tipo de dano da sua ancestralidade.", a: "passiva" },
    { nome: "Visão no Escuro", d: "Enxerga no escuro a até 18 m.", a: "passiva" },
    { nome: "Voo Dracônico", nivel: 5, d: "Ação bônus: asas espectrais por 10 minutos, com deslocamento de voo igual ao seu deslocamento. Uma vez por descanso longo.", a: "bonus", r: "longo", u: 1 },
  ] },
  { id: "anao", nome: "Anão", tam: "Médio", desl: "9 m", d: "Povo robusto das montanhas, resistente e ligado à pedra.", t: [
    { nome: "Visão no Escuro", d: "Enxerga no escuro a até 36 m.", a: "passiva" },
    { nome: "Resiliência Anã", d: "Resistência a veneno e vantagem em testes pra evitar ou encerrar envenenado.", a: "passiva" },
    { nome: "Robustez Anã", d: "Seu PV máximo aumenta 1, e mais 1 a cada nível.", a: "passiva", pvNivel: 1 },
    { nome: "Conhecimento de Pedras", d: "Ação bônus: sentido sísmico de 18 m por 10 minutos, estando sobre ou tocando pedra. Usos iguais ao bônus de proficiência por descanso longo.", a: "bonus", r: "longo", u: "pb" },
  ] },
  { id: "elfo", nome: "Elfo", tam: "Médio", desl: "9 m", d: "Povo longevo e gracioso, ligado à magia feérica.", t: [
    { nome: "Visão no Escuro", d: "Enxerga no escuro a até 18 m.", a: "passiva" },
    { nome: "Linhagem Élfica", d: "Escolha: Drow (visão no escuro de 36 m e Luzes Dançantes; Fogo das Fadas no nível 3 e Escuridão no 5), Alto Elfo (Prestidigitação, trocável por outro truque de mago; Detectar Magia no 3 e Passo Nebuloso no 5) ou Elfo da Floresta (deslocamento 10,5 m e Arte Druídica; Passos Longos no 3 e Passos sem Pegadas no 5). As magias de nível 3 e 5 podem ser conjuradas uma vez sem espaço por descanso longo.", a: "passiva" },
    { nome: "Ancestralidade Feérica", d: "Vantagem em testes pra evitar ou encerrar enfeitiçado.", a: "passiva" },
    { nome: "Sentidos Aguçados", d: "Proficiência em Intuição, Percepção ou Sobrevivência.", a: "passiva", x: 1 },
    { nome: "Transe", d: "Não precisa dormir e magia não te faz dormir. Termina um descanso longo em 4 horas de meditação, consciente.", a: "passiva" },
  ] },
  { id: "gnomo", nome: "Gnomo", tam: "Pequeno", desl: "9 m", d: "Povo pequeno, curioso e inventivo, cheio de magia de ilusão.", t: [
    { nome: "Visão no Escuro", d: "Enxerga no escuro a até 18 m.", a: "passiva" },
    { nome: "Astúcia Gnômica", d: "Vantagem em testes de resistência de Inteligência, Sabedoria e Carisma.", a: "passiva" },
    { nome: "Linhagem Gnômica", d: "Escolha: Gnomo da Floresta (Ilusão Menor; Falar com Animais sem espaço, usos iguais ao bônus de proficiência por descanso longo) ou Gnomo das Rochas (Consertar e Prestidigitação; cria até três pequenos dispositivos mecânicos com efeitos de Prestidigitação).", a: "passiva" },
  ] },
  { id: "golias", nome: "Goliath", tam: "Médio", desl: "10,5 m", d: "Descendentes de gigantes, enormes e fortes.", t: [
    { nome: "Ancestralidade Gigante", d: "Escolha um dom, com usos iguais ao bônus de proficiência por descanso longo: Salto das Nuvens (ação bônus, teleporta 9 m), Queimadura do Fogo (+1d10 de fogo ao acertar), Calafrio do Gelo (+1d6 de frio e −3 m de deslocamento ao acertar), Tombo da Colina (derruba alvo Grande ou menor ao acertar), Resistência da Pedra (reação: reduz dano em 1d12 + Constituição) ou Trovão da Tempestade (reação: 1d8 de trovão em quem te feriu a até 18 m).", a: "livre", r: "longo", u: "pb" },
    { nome: "Forma Grande", nivel: 5, d: "Ação bônus: vira Grande por 10 minutos, com vantagem em testes de Força e +3 m de deslocamento. Uma vez por descanso longo.", a: "bonus", r: "longo", u: 1 },
    { nome: "Constituição Poderosa", d: "Vantagem em testes pra escapar de agarrado, e conta como um tamanho maior pra carga.", a: "passiva" },
  ] },
  { id: "halfling", nome: "Halfling", tam: "Pequeno", desl: "9 m", d: "Povo pequeno e alegre, de sorte famosa.", t: [
    { nome: "Corajoso", d: "Vantagem em testes pra evitar ou encerrar amedrontado.", a: "passiva" },
    { nome: "Agilidade Halfling", d: "Pode passar pelo espaço de criaturas um tamanho maiores que você, sem parar ali.", a: "passiva" },
    { nome: "Sortudo", d: "Quando tira 1 num teste de d20, pode rolar de novo e usar o novo resultado.", a: "passiva" },
    { nome: "Furtividade Natural", d: "Pode se esconder atrás de uma criatura pelo menos um tamanho maior que você.", a: "passiva" },
  ] },
  { id: "humano", nome: "Humano", tam: "Médio ou Pequeno", desl: "9 m", d: "O povo mais numeroso e adaptável do mundo.", t: [
    { nome: "Engenhoso", d: "Ganha Inspiração Heroica sempre que termina um descanso longo.", a: "passiva" },
    { nome: "Habilidoso", d: "Proficiência em uma perícia à sua escolha.", a: "passiva", x: 1 },
    { nome: "Versátil", d: "Ganha um talento de Origem à sua escolha (Habilidoso é o recomendado).", a: "passiva", x: 1 },
  ] },
  { id: "orc", nome: "Orc", tam: "Médio", desl: "9 m", d: "Povo forte e resistente, de vigor incansável.", t: [
    { nome: "Surto de Adrenalina", d: "Pode usar Disparar como ação bônus e ganhar PV temporários iguais ao bônus de proficiência. Usos iguais ao bônus de proficiência por descanso curto ou longo.", a: "bonus", r: "curto", u: "pb" },
    { nome: "Visão no Escuro", d: "Enxerga no escuro a até 36 m.", a: "passiva" },
    { nome: "Resistência Implacável", d: "Quando cai a 0 PV sem morrer na hora, fica com 1 PV. Uma vez por descanso longo.", a: "livre", r: "longo", u: 1 },
  ] },
  { id: "tiferino", nome: "Tiefling", tam: "Médio ou Pequeno", desl: "9 m", d: "Pessoas com um legado infernal no sangue.", t: [
    { nome: "Visão no Escuro", d: "Enxerga no escuro a até 18 m.", a: "passiva" },
    { nome: "Legado Infernal", d: "Escolha: Abissal (resistência a veneno e Rajada de Veneno; Raio Adoecente no nível 3 e Imobilizar Pessoa no 5), Ctônico (resistência a necrótico e Toque Arrepiante; Vitalidade Falsa no 3 e Raio do Enfraquecimento no 5) ou Infernal (resistência a fogo e Raio de Fogo; Repreensão Infernal no 3 e Escuridão no 5). As magias de nível 3 e 5 podem ser conjuradas uma vez sem espaço por descanso longo.", a: "passiva" },
    { nome: "Presença de Outro Mundo", d: "Você conhece o truque Taumaturgia.", a: "passiva", x: 1 },
  ] },
];

/* talentos do SRD pra escolha na Melhoria de Atributo / Dádiva Épica */
const TALENTOS_IGNEA = [
  { nome: "Alerta", tipo: "Origem", d: "Soma o bônus de proficiência na iniciativa e pode trocar de iniciativa com um aliado." },
  { nome: "Iniciado em Magia", tipo: "Origem", d: "Dois truques e uma magia de 1º círculo de clérigo, druida ou mago." },
  { nome: "Atacante Selvagem", tipo: "Origem", d: "Uma vez por turno, rola o dano da arma duas vezes e usa o maior." },
  { nome: "Habilidoso", tipo: "Origem", d: "Proficiência em três perícias ou ferramentas." },
  { nome: "Agarrador", tipo: "Geral", d: "+1 em Força ou Destreza; vantagem contra quem você agarra e mais facilidade pra arrastar." },
  { nome: "Arquearia", tipo: "Estilo de Luta", d: "+2 nos ataques com armas à distância." },
  { nome: "Defesa", tipo: "Estilo de Luta", d: "+1 na CA usando armadura leve, média ou pesada." },
  { nome: "Combate com Arma Grande", tipo: "Estilo de Luta", d: "Com arma de duas mãos ou versátil em duas mãos, 1 e 2 nos dados de dano contam como 3." },
  { nome: "Combate com Duas Armas", tipo: "Estilo de Luta", d: "Soma o modificador de atributo no dano do ataque extra com a arma leve." },
  { nome: "Dádiva da Proeza em Combate", tipo: "Dádiva Épica", d: "+1 em um atributo (até 30); quando erra um ataque, pode acertar em vez disso (uma vez até o começo do seu próximo turno)." },
  { nome: "Dádiva da Viagem Dimensional", tipo: "Dádiva Épica", d: "+1 em um atributo (até 30); depois de Atacar ou Magia, teleporta 9 m." },
  { nome: "Dádiva do Destino", tipo: "Dádiva Épica", d: "+1 em um atributo (até 30); quando alguém a até 18 m passa ou falha num teste de d20, soma ou subtrai 2d4. Recarrega na iniciativa ou no descanso." },
  { nome: "Dádiva da Ofensiva Irresistível", tipo: "Dádiva Épica", d: "+1 em Força ou Destreza (até 30); seu dano de concussão, perfuração e corte ignora resistência, e um 20 natural no ataque causa dano extra igual ao atributo aumentado." },
  { nome: "Dádiva da Recuperação de Magia", tipo: "Dádiva Épica", d: "+1 em Int, Sab ou Car (até 30); ao conjurar com espaço de 1º a 4º círculo, role 1d4: se der o círculo do espaço, ele não é gasto." },
  { nome: "Dádiva do Espírito Noturno", tipo: "Dádiva Épica", d: "+1 em um atributo (até 30); na penumbra ou escuridão, fica invisível com ação bônus (até agir) e resiste a todo dano exceto psíquico e radiante." },
  { nome: "Dádiva da Visão Verdadeira", tipo: "Dádiva Épica", d: "+1 em um atributo (até 30); visão verdadeira a até 18 m." },
];

/* ============================== ESCOLHAS E MAGIAS ==============================
   per    perícias da classe no 1º nível (lido do texto "Escolha N: ...")
   ESCOLHAS_IGNEA  o que o jogador escolhe ao ganhar um nível ("classe:nível" ou "sub:id:nível")
     t: pericia | espec (especialização) | idioma · n: quantas · de: lista, "classe" ou vazio (qualquer) · fixo: ganhos automáticos
   MAGIAS_SUB      magias sempre preparadas da subclasse, por nível da classe
   ============================================================================== */
const PERICIAS_IGNEA = ["Acrobacia", "Arcanismo", "Atletismo", "Atuação", "Enganação", "Furtividade", "História", "Intimidação", "Intuição", "Investigação", "Lidar com Animais", "Medicina", "Natureza", "Percepção", "Persuasão", "Prestidigitação", "Religião", "Sobrevivência"];
const IDIOMAS_IGNEA = {
  comuns: ["Comum", "Língua de Sinais Comum", "Anão", "Dracônico", "Élfico", "Gigante", "Gnômico", "Goblin", "Halfling", "Orc"],
  raros: ["Abissal", "Celestial", "Dialeto Profundo", "Infernal", "Primordial", "Silvestre", "Subcomum"],
};
CLASSES_IGNEA.forEach((c) => {
  const m = c.pericias.match(/Escolha (\d+)(?::\s*(.+))?/);
  const n = m ? Number(m[1]) : 2;
  const de = m && m[2] && !/quaisquer/.test(c.pericias) ? m[2].replace(/\s+ou\s+/, ", ").split(/,\s*/).map((x) => x.trim()) : null;
  c.per = { n, de };
});
const MULTI_PERICIA = { bardo: { n: 1 }, patrulheiro: { n: 1, de: "classe" }, ladino: { n: 1, de: "classe" } };
const ESCOLHAS_IGNEA = {
  "bardo:2": [{ t: "espec", n: 2 }],
  "bardo:9": [{ t: "espec", n: 2 }],
  "ladino:1": [{ t: "espec", n: 2 }, { t: "idioma", n: 1, fixo: ["Gíria de Ladrão"] }],
  "ladino:6": [{ t: "espec", n: 2 }],
  "patrulheiro:2": [{ t: "espec", n: 1 }, { t: "idioma", n: 2 }],
  "patrulheiro:9": [{ t: "espec", n: 2 }],
  "mago:2": [{ t: "espec", n: 1, de: ["Arcanismo", "História", "Investigação", "Medicina", "Natureza", "Religião"] }],
  "barbaro:3": [{ t: "pericia", n: 1, de: "classe" }],
  "druida:1": [{ t: "idioma", n: 0, fixo: ["Druídico"] }],
  "sub:conhecimento:3": [{ t: "pericia", n: 3 }],
};
const ESCOLHAS_RACA = {
  elfo: { t: "pericia", n: 1, de: ["Intuição", "Percepção", "Sobrevivência"] },
  humano: { t: "pericia", n: 1 },
};
// magias sempre preparadas que vêm de habilidades da classe
const MAGIAS_CLASSE = {
  "druida:1": ["Falar com Animais"],
  "patrulheiro:1": ["Marca do Caçador"],
  "paladino:2": ["Golpe Divino"],
  "paladino:5": ["Convocar Montaria"],
  "bruxo:9": ["Contatar Outro Plano"],
  "bardo:20": ["Palavra de Poder: Curar", "Palavra de Poder: Matar"],
};
const MAGIAS_SUB = {
  vida: { 3: ["Auxílio", "Bênção", "Curar Ferimentos", "Restauração Menor"], 5: ["Palavra Curativa em Massa", "Revivificar"], 7: ["Aura de Vida", "Proteção contra a Morte"], 9: ["Restauração Maior", "Curar Ferimentos em Massa"] },
  devocao: { 3: ["Proteção contra o Bem e o Mal", "Escudo da Fé"], 5: ["Auxílio", "Zona da Verdade"], 9: ["Sinal de Esperança", "Dissipar Magia"], 13: ["Movimentação Livre", "Guardião da Fé"], 17: ["Comunhão", "Coluna de Chamas"] },
  draconica: { 3: ["Alterar-se", "Orbe Cromático", "Comando", "Sopro do Dragão"], 5: ["Medo", "Voo"], 7: ["Olho Arcano", "Enfeitiçar Monstro"], 9: ["Lendas e Histórias", "Invocar Dragão"] },
  infernal: { 3: ["Mãos Flamejantes", "Comando", "Raio Ardente", "Sugestão"], 5: ["Bola de Fogo", "Névoa Fétida"], 7: ["Escudo de Fogo", "Muralha de Fogo"], 9: ["Missão", "Praga de Insetos"] },
};
const TERRAS_IGNEA = {
  arida: { nome: "Árida", magias: { 3: ["Nublar", "Mãos Flamejantes", "Raio de Fogo"], 5: ["Bola de Fogo"], 7: ["Praga"], 9: ["Muralha de Pedra"] } },
  polar: { nome: "Polar", magias: { 3: ["Névoa Obscurecente", "Imobilizar Pessoa", "Raio de Gelo"], 5: ["Nevasca"], 7: ["Tempestade de Gelo"], 9: ["Cone de Frio"] } },
  temperada: { nome: "Temperada", magias: { 3: ["Passo Nebuloso", "Toque Chocante", "Sono"], 5: ["Relâmpago"], 7: ["Movimentação Livre"], 9: ["Caminhar em Árvores"] } },
  tropical: { nome: "Tropical", magias: { 3: ["Respingo Ácido", "Raio Adoecente", "Teia"], 5: ["Névoa Fétida"], 7: ["Metamorfose"], 9: ["Praga de Insetos"] } },
};

/* opções de habilidades que viram poder na aba 🔥 quando escolhidas */
const OP_ESTILO = () => TALENTOS_IGNEA.filter((t) => t.tipo === "Estilo de Luta").map((t) => ({ nome: t.nome, d: t.d, a: "passiva" }));
const OPCOES_IGNEA = {
  "guerreiro:1": { rot: "Estilo de Luta", ops: OP_ESTILO },
  "paladino:2": { rot: "Estilo de Luta", ops: () => OP_ESTILO().concat([{ nome: "Guerreiro Abençoado", d: "Você aprende dois truques de clérigo à sua escolha; eles contam como magias de paladino.", a: "passiva" }]) },
  "patrulheiro:2": { rot: "Estilo de Luta", ops: () => OP_ESTILO().concat([{ nome: "Guerreiro Druídico", d: "Você aprende dois truques de druida à sua escolha; eles contam como magias de patrulheiro.", a: "passiva" }]) },
  "sub:campeao:7": { rot: "Estilo de Luta adicional", ops: OP_ESTILO },
  "clerigo:1": { rot: "Ordem Divina", ops: () => [
    { nome: "Ordem Divina: Protetor", d: "Proficiência com armas marciais e treino com armadura pesada.", a: "passiva" },
    { nome: "Ordem Divina: Taumaturgo", d: "Um truque de clérigo extra e soma o mod. de Sabedoria (mín. +1) nos testes de Arcanismo e Religião.", a: "passiva" }] },
  "druida:1": { rot: "Ordem Primal", ops: () => [
    { nome: "Ordem Primal: Mago", d: "Um truque de druida extra e soma o mod. de Sabedoria (mín. +1) nos testes de Arcanismo e Natureza.", a: "passiva" },
    { nome: "Ordem Primal: Guardião", d: "Proficiência com armas marciais e treino com armadura média.", a: "passiva" }] },
  "clerigo:7": { rot: "Golpes Abençoados", ops: () => [
    { nome: "Golpe Divino", d: "Uma vez por turno, ao acertar com arma, causa +1d8 radiante ou necrótico (2d8 no nível 14).", a: "passiva" },
    { nome: "Conjuração Potente", d: "Soma o mod. de Sabedoria ao dano dos truques de clérigo.", a: "passiva" }] },
  "druida:7": { rot: "Fúria Elemental", ops: () => [
    { nome: "Conjuração Potente", d: "Soma o mod. de Sabedoria ao dano dos truques de druida.", a: "passiva" },
    { nome: "Golpe Primal", d: "Uma vez por turno, +1d8 de frio, fogo, raio ou trovão ao acertar com arma ou ataque de fera (2d8 no nível 15).", a: "passiva" }] },
  "sub:cacador:3": { rot: "Presa do Caçador", ops: () => [
    { nome: "Matador de Colossos", d: "Uma vez por turno, +1d8 de dano com arma contra criatura que já perdeu PV.", a: "passiva" },
    { nome: "Quebra-Hordas", d: "Uma vez por turno, faz um ataque extra contra outra criatura a até 1,5 m do primeiro alvo.", a: "passiva" }] },
  "sub:cacador:7": { rot: "Táticas Defensivas", ops: () => [
    { nome: "Escapar da Horda", d: "Ataques de oportunidade contra você têm desvantagem.", a: "passiva" },
    { nome: "Defesa contra Múltiplos Ataques", d: "Depois que uma criatura te acerta, os outros ataques dela no mesmo turno têm desvantagem.", a: "passiva" }] },
};
const METAMAGIAS = [
  { nome: "Magia Cuidadosa", d: "1 ponto: criaturas à escolha passam automaticamente no teste da magia e não sofrem dano se passariam com metade.", a: "passiva" },
  { nome: "Magia Distante", d: "1 ponto: dobra o alcance da magia, ou toque vira 9 m.", a: "passiva" },
  { nome: "Magia Potencializada", d: "1 ponto: rola de novo dados de dano até o mod. de Carisma.", a: "passiva" },
  { nome: "Magia Estendida", d: "1 ponto: dobra a duração (até 24 h) e dá vantagem nos testes pra manter a concentração.", a: "passiva" },
  { nome: "Magia Elevada", d: "2 pontos: um alvo tem desvantagem no teste contra a magia.", a: "passiva" },
  { nome: "Magia Acelerada", d: "2 pontos: conjura com ação bônus uma magia de 1 ação (sem outra magia de 1º círculo ou mais no turno).", a: "passiva" },
  { nome: "Magia Buscadora", d: "1 ponto: rola de novo um ataque mágico que errou.", a: "passiva" },
  { nome: "Magia Sutil", d: "1 ponto: conjura sem componentes verbais, somáticos ou materiais sem custo.", a: "passiva" },
  { nome: "Magia Transmutada", d: "1 ponto: troca o tipo de dano entre ácido, frio, fogo, raio, veneno e trovão.", a: "passiva" },
  { nome: "Magia Gêmea", d: "Pontos iguais ao círculo: a magia de alvo único afeta mais uma criatura.", a: "passiva" },
];
["feiticeiro:2", "feiticeiro:10", "feiticeiro:17"].forEach((k) => { OPCOES_IGNEA[k] = { rot: "Metamagia", n: 2, ops: () => METAMAGIAS }; });
const OPCOES_RACA = { humano: { rot: "Talento de Origem (Versátil)", ops: () => TALENTOS_IGNEA.filter((t) => t.tipo === "Origem").map((t) => ({ nome: t.nome, d: t.d, a: "passiva" })) } };

/* ============================== ANTECEDENTES ==============================
   atrs: atributos que o antecedente pode aumentar (+2/+1 ou +1 nos três)
   equipA: itens do pacote A (i = nome no catálogo de itens/armas) · poA: moedas do pacote A · poB: pacote B só em PO
   ========================================================================== */
const ANTECEDENTES_IGNEA = [
  { id: "acolito", nome: "Acólito", d: "Você serviu num templo, cuidando dos ritos e estudando os textos sagrados.", atrs: ["int", "sab", "car"],
    talento: { nome: "Iniciado em Magia (Clérigo)", d: "Você aprende dois truques de clérigo e uma magia de 1º círculo de clérigo. A magia de 1º círculo pode ser conjurada uma vez sem espaço por descanso longo, e também com seus espaços. Sabedoria é o atributo de conjuração dessas magias." },
    pericias: ["Intuição", "Religião"], ferramenta: "Suprimentos de calígrafo",
    equipA: [{ i: "Suprimentos de calígrafo" }, { i: "Livro", nome: "Livro de orações" }, { i: "Amuleto sagrado", nome: "Símbolo sagrado" }, { i: "Pergaminho (folha)", qtd: 10 }, { i: "Manto cerimonial", nome: "Túnica" }], poA: 8, poB: 50 },
  { id: "criminoso", nome: "Criminoso", d: "Você ganhava a vida nos becos, entre roubos, contrabando e segredos.", atrs: ["des", "con", "int"],
    talento: { nome: "Alerta", d: "Soma o bônus de proficiência na iniciativa. Logo depois de rolar iniciativa, pode trocar seu resultado com o de um aliado voluntário." },
    pericias: ["Prestidigitação", "Furtividade"], ferramenta: "Ferramentas de ladrão",
    equipA: [{ a: "Adaga", qtd: 2 }, { i: "Ferramentas de ladrão" }, { i: "Pé de cabra" }, { i: "Algibeira", qtd: 2 }, { i: "Roupas de viajante" }], poA: 16, poB: 50 },
  { id: "sabio", nome: "Sábio", d: "Você passou anos entre livros e mestres, atrás de conhecimento.", atrs: ["con", "int", "sab"],
    talento: { nome: "Iniciado em Magia (Mago)", d: "Você aprende dois truques de mago e uma magia de 1º círculo de mago. A magia de 1º círculo pode ser conjurada uma vez sem espaço por descanso longo, e também com seus espaços. Inteligência é o atributo de conjuração dessas magias." },
    pericias: ["Arcanismo", "História"], ferramenta: "Suprimentos de calígrafo",
    equipA: [{ a: "Bordão" }, { i: "Suprimentos de calígrafo" }, { i: "Livro", nome: "Livro de história" }, { i: "Pergaminho (folha)", qtd: 8 }, { i: "Manto cerimonial", nome: "Túnica" }], poA: 8, poB: 50 },
  { id: "soldado", nome: "Soldado", d: "Você treinou e lutou num exército, numa milícia ou numa guarda.", atrs: ["for", "des", "con"],
    talento: { nome: "Atacante Selvagem", d: "Uma vez por turno, ao acertar com uma arma, você rola os dados de dano dela duas vezes e usa qualquer um dos resultados." },
    pericias: ["Atletismo", "Intimidação"], ferramenta: "jogo", jogos: ["Dados", "Baralho", "Xadrez de dragão", "Jogo de cartas de aposta"],
    equipA: [{ a: "Lança" }, { a: "Arco curto" }, { i: "Flechas (20)" }, { i: "jogo" }, { i: "Kit de primeiros socorros" }, { i: "Aljava" }, { i: "Roupas de viajante" }], poA: 14, poB: 50 },
];

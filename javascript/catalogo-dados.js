/* =====================================================================
   CATALOGO-DADOS.JS · Catálogo básico de fantasia (Ficha Ígnea)
   Equipamentos comuns de fantasia medieval: armas, armaduras, escudos,
   munição, ferramentas, kits, consumíveis, montarias e veículos.

   Números (dano, CA, peso, preço) compatíveis com a 5ª edição, a partir do
   System Reference Document 5.2.1 (SRD 5.2.1), de Wizards of the Coast LLC,
   disponível em https://www.dndbeyond.com/srd. O SRD 5.2.1 está licenciado
   sob a Creative Commons Attribution 4.0 International License, disponível
   em https://creativecommons.org/licenses/by/4.0/legalcode.
   Nomes em português e descrições resumidas escritos para a Ficha Ígnea.
   Peso: 1 lb ≈ 0,5 kg · distância: 5 pés = 1,5 m.
   Moedas: PC (cobre), PP (prata), PO (ouro).
   ===================================================================== */

/* ---------------- ARMAS ----------------
   [nome, tipo (S = simples, M = marcial), uso (c = corpo a corpo, d = distância),
    dano, tipo de dano, propriedades, peso, preço, descrição] */
const CTG_ARMAS_RAW = [
  ["Clava", "S", "c", "1d4", "concussão", "Leve", "1 kg", "1 PP", "Um pedaço de madeira grosso e pesado, às vezes reforçado com pregos ou tiras de couro. É a arma mais simples e barata que existe, usada por camponeses, bandidos e qualquer um que precise se defender sem gastar nada. Leve o bastante pra ser usada numa mão só."],
  ["Adaga", "S", "c", "1d4", "perfurante", "Acuidade, Leve, Arremesso (6/18 m)", "0,5 kg", "2 PO", "Lâmina curta de dois gumes, fácil de esconder na bota, na manga ou no cinto. Serve tanto pra lutar de perto quanto pra arremessar, e por ser ágil dá pra usar Destreza no lugar de Força. Quase todo aventureiro carrega uma, nem que seja pra cortar corda e comida."],
  ["Clava grande", "S", "c", "1d8", "concussão", "Duas mãos", "5 kg", "2 PP", "Um tronco grosso, com a ponta mais pesada, que precisa das duas mãos pra ser girado. Não tem técnica nenhuma: é bater com força e esperar que o outro caia. Comum entre ogros, bárbaros e guerreiros de tribos."],
  ["Machadinha", "S", "c", "1d6", "cortante", "Leve, Arremesso (6/18 m)", "1 kg", "5 PO", "Machado pequeno de uma mão, usado tanto pra cortar lenha quanto pra lutar. É leve e bem equilibrado, então dá pra arremessar com precisão. Muitos guerreiros carregam duas: uma pra lutar e outra pra jogar."],
  ["Azagaia", "S", "c", "1d6", "perfurante", "Arremesso (9/36 m)", "1 kg", "5 PP", "Lança curta e leve, feita pra ser arremessada. Caçadores e soldados de linha levam várias nas costas e jogam antes do inimigo chegar perto. Também funciona no corpo a corpo, mas o forte dela é o arremesso."],
  ["Martelo leve", "S", "c", "1d4", "concussão", "Leve, Arremesso (6/18 m)", "1 kg", "2 PO", "Martelo de cabo curto, parecido com uma ferramenta de ferreiro, mas balanceado pra combate. É leve o bastante pra arremessar e pra lutar com uma arma em cada mão. Também serve pra pregar cravos e quebrar cadeados."],
  ["Maça", "S", "c", "1d6", "concussão", "—", "2 kg", "5 PO", "Um bastão com a cabeça de metal pesada, às vezes com flanges ou saliências. Feita pra amassar armaduras e quebrar ossos mesmo através do metal. Muito usada por clérigos e guardas."],
  ["Bordão", "S", "c", "1d6", "concussão", "Versátil (1d8)", "2 kg", "2 PP", "Um cajado longo de madeira, simples e resistente. Dá pra usar com uma mão ou com as duas; com as duas, os golpes ficam mais fortes. Também serve de bengala nas viagens e muitos magos e druidas usam como foco."],
  ["Foice curta", "S", "c", "1d4", "cortante", "Leve", "1 kg", "1 PO", "Lâmina curva de colheita, presa num cabo curto. É uma ferramenta de fazendeiro que também vira arma quando precisa. Leve e rápida, é a arma preferida de muitos druidas."],
  ["Lança", "S", "c", "1d6", "perfurante", "Arremesso (6/18 m), Versátil (1d8)", "1,5 kg", "1 PO", "Uma haste de madeira com ponta de metal, uma das armas mais antigas que existem. Dá pra estocar com uma mão, com as duas (batendo mais forte) ou arremessar. Barata e versátil, é a arma de exércitos inteiros."],
  ["Dardo", "S", "d", "1d4", "perfurante", "Acuidade, Arremesso (6/18 m)", "0,1 kg", "5 PC", "Pequeno projétil com ponta afiada, arremessado com a mão. É leve, preciso e fácil de levar aos montes. Por ser ágil, usa Destreza no ataque e no dano."],
  ["Besta leve", "S", "d", "1d8", "perfurante", "Munição (24/96 m · virote), Recarga, Duas mãos", "2,5 kg", "25 PO", "Uma besta simples de manejar, que dispara virotes com força. Não exige treino de arqueiro: é mirar e puxar o gatilho. O problema é recarregar, então só dispara um virote por ação, mesmo pra quem ataca várias vezes."],
  ["Arco curto", "S", "d", "1d6", "perfurante", "Munição (24/96 m · flecha), Duas mãos", "1 kg", "25 PO", "Arco compacto, mais fácil de carregar e de usar a cavalo ou em lugares apertados. Não alcança tão longe quanto o arco longo, mas é rápido e confiável. Precisa das duas mãos e de flechas."],
  ["Funda", "S", "d", "1d4", "concussão", "Munição (9/36 m · bala de funda)", "—", "1 PP", "Uma tira de couro com um bolso no meio, girada pra arremessar pedras ou balas de metal. É quase de graça, cabe no bolso e munição dá pra achar no chão. Simples, mas pode derrubar até um gigante."],
  ["Machado de batalha", "M", "c", "1d8", "cortante", "Versátil (1d10)", "2 kg", "10 PO", "Machado de guerra de lâmina larga, feito pra cortar escudos e armaduras. Pode ser usado com uma mão (junto com um escudo) ou com as duas pra golpes mais fortes. A arma clássica de anões e guerreiros do norte."],
  ["Mangual", "M", "c", "1d8", "concussão", "—", "1 kg", "10 PO", "Uma bola de metal, às vezes cheia de pontas, presa a um cabo por uma corrente. O balanço da corrente dá força ao golpe e ajuda a contornar escudos. Difícil de bloquear e assustadora de enfrentar."],
  ["Glaive", "M", "c", "1d10", "cortante", "Pesada, Alcance, Duas mãos", "3 kg", "20 PO", "Uma lâmina longa e curva presa na ponta de uma haste comprida. Permite atacar inimigos a 3 m de distância, mantendo eles longe. Pesada e de duas mãos, é usada por soldados em formação."],
  ["Machado grande", "M", "c", "1d12", "cortante", "Pesada, Duas mãos", "3,5 kg", "30 PO", "Machado enorme de duas mãos, com uma lâmina do tamanho de um escudo. Cada golpe é lento, mas devastador, capaz de partir alguém ao meio. A arma favorita de bárbaros."],
  ["Espada grande", "M", "c", "2d6", "cortante", "Pesada, Duas mãos", "3 kg", "50 PO", "Espadão de lâmina longa e larga, usado com as duas mãos. Golpes amplos que causam muito dano e mantêm os inimigos à distância. Exige força e espaço pra ser bem usada."],
  ["Alabarda", "M", "c", "1d10", "cortante", "Pesada, Alcance, Duas mãos", "3 kg", "20 PO", "Haste longa com uma lâmina de machado, uma ponta de lança e às vezes um gancho do outro lado. Ataca de longe (3 m) e é ótima pra derrubar cavaleiros. Pesada e de duas mãos."],
  ["Lança de montaria", "M", "c", "1d10", "perfurante", "Pesada, Alcance, Duas mãos (uma mão se montado)", "3 kg", "10 PO", "Lança longa e pesada de cavaleiro, feita pra investidas a cavalo. Montado, dá pra usar com uma mão só; a pé, precisa das duas e é desajeitada. Ataca de longe (3 m)."],
  ["Espada longa", "M", "c", "1d8", "cortante", "Versátil (1d10)", "1,5 kg", "15 PO", "A espada clássica do guerreiro, de lâmina reta e dois gumes. Equilibrada pra uma mão (com escudo) ou duas (golpes mais fortes). Versátil, confiável e símbolo de cavaleiros e heróis."],
  ["Malho", "M", "c", "2d6", "concussão", "Pesada, Duas mãos", "5 kg", "10 PO", "Uma marreta de guerra enorme, com a cabeça de ferro maciço. Precisa das duas mãos e de muita força, mas amassa armaduras como latas. Cada golpe pode derrubar um inimigo."],
  ["Maça estrela", "M", "c", "1d8", "perfurante", "—", "2 kg", "15 PO", "Uma maça com a cabeça cheia de pontas de metal, como uma estrela. Junta o peso de uma maça com o poder de furar de uma lança. Muito usada contra inimigos de armadura."],
  ["Pique", "M", "c", "1d10", "perfurante", "Pesada, Alcance, Duas mãos", "9 kg", "5 PO", "Uma lança muito longa, com até 5 metros, usada em formações de infantaria pra segurar cavalaria e inimigos longe. Ataca de 3 m de distância. Pesada, de duas mãos e difícil de carregar em lugares fechados."],
  ["Rapieira", "M", "c", "1d8", "perfurante", "Acuidade", "1 kg", "25 PO", "Espada fina e longa, com a ponta muito afiada, feita pra estocadas rápidas e precisas. Usa Destreza em vez de Força, perfeita pra duelistas e espadachins ágeis. Elegante e mortal nas mãos certas."],
  ["Cimitarra", "M", "c", "1d6", "cortante", "Acuidade, Leve", "1,5 kg", "25 PO", "Uma espada de lâmina curva, leve e rápida nos cortes. Usa Destreza no lugar de Força e é leve o bastante pra lutar com uma em cada mão. Comum entre povos do deserto e piratas."],
  ["Espada curta", "M", "c", "1d6", "perfurante", "Acuidade, Leve", "1 kg", "10 PO", "Espada pequena e ágil, ótima pra lutar em lugares apertados. Usa Destreza no lugar de Força e é leve, então combina com outra arma na outra mão. A favorita de ladinos e batedores."],
  ["Tridente", "M", "c", "1d8", "perfurante", "Arremesso (6/18 m), Versátil (1d10)", "2 kg", "5 PO", "Uma lança de três pontas, usada por pescadores, gladiadores e povos do mar. Dá pra estocar com uma ou duas mãos ou arremessar. As pontas ajudam a prender e controlar o inimigo."],
  ["Martelo de guerra", "M", "c", "1d8", "concussão", "Versátil (1d10)", "2,5 kg", "15 PO", "Martelo pesado de combate, com uma cabeça feita pra amassar placas de metal e às vezes uma ponta do outro lado. Uma ou duas mãos. Muito usado por anões e paladinos."],
  ["Picareta de guerra", "M", "c", "1d8", "perfurante", "Versátil (1d10)", "1 kg", "5 PO", "Uma picareta com a ponta reforçada, feita pra furar armaduras pesadas. Golpes concentrados num ponto só atravessam o metal. Uma ou duas mãos."],
  ["Chicote", "M", "c", "1d4", "cortante", "Acuidade, Alcance", "1,5 kg", "2 PO", "Uma tira longa de couro trançado. Não causa muito dano, mas alcança 3 m de distância e usa Destreza. Bom pra manter inimigos longe ou pra estilo de aventureiro."],
  ["Zarabatana", "M", "d", "1", "perfurante", "Munição (7,5/30 m · agulha), Recarga", "0,5 kg", "10 PO", "Um tubo de madeira ou osso que dispara agulhas com um sopro. Silenciosa e discreta, quase sempre usada com veneno. Causa pouco dano sozinha, mas é perfeita pra emboscadas."],
  ["Besta de mão", "M", "d", "1d6", "perfurante", "Munição (9/36 m · virote), Leve, Recarga", "1,5 kg", "75 PO", "Uma besta pequena que cabe numa mão só. Dá pra usar junto com outra arma e é fácil de esconder. Muito usada por espiões, assassinos e ladinos."],
  ["Besta pesada", "M", "d", "1d10", "perfurante", "Munição (30/120 m · virote), Pesada, Recarga, Duas mãos", "9 kg", "50 PO", "Besta grande e muito potente, com alcance enorme. Precisa das duas mãos, é pesada e lenta de recarregar, mas cada virote atravessa armaduras. Ótima pra defender muralhas."],
  ["Arco longo", "M", "d", "1d8", "perfurante", "Munição (45/180 m · flecha), Pesada, Duas mãos", "1 kg", "50 PO", "Arco alto, quase do tamanho de quem usa, com alcance enorme (até 180 m). Exige força e treino, mas é a arma de arqueiros de elite. Precisa das duas mãos e de flechas."],
  ["Mosquete", "M", "d", "1d12", "perfurante", "Munição (12/36 m · bala), Recarga, Duas mãos", "5 kg", "500 PO", "Arma de fogo longa, que dispara balas de chumbo com pólvora. Barulhenta, lenta de recarregar e cara, mas muito forte. Só existe em mundos com pólvora; confirme com o mestre."],
  ["Pistola", "M", "d", "1d10", "perfurante", "Munição (9/27 m · bala), Recarga", "1,5 kg", "250 PO", "Arma de fogo de uma mão, que dispara uma bala por vez. Cara, barulhenta e lenta de recarregar, mas causa muito dano. Só existe em mundos com pólvora; confirme com o mestre."],
  ["Ataque desarmado", "S", "c", "1", "concussão", "Soco, chute ou cabeçada", "—", "—", "Lutar sem arma nenhuma: soco, chute, cotovelada, cabeçada. O dano costuma ser baixo (1 + Força), mas monges e lutadores treinados fazem muito mais. Útil quando você foi desarmado ou quer só nocautear."],
  ["Arma improvisada", "S", "c", "1d4", "variável", "Arremesso (6/18 m) se der pra jogar", "—", "—", "Qualquer objeto usado como arma: uma perna de mesa, uma garrafa, uma frigideira, uma pedra. O mestre decide o dano, normalmente 1d4. Se o objeto parecer com uma arma de verdade, pode usar as regras dela."],
];

/* propriedades das armas, explicadas no cartão */
const CTG_PROPRIEDADES = {
  "Acuidade": "Pode usar Força ou Destreza no ataque e no dano.",
  "Leve": "Pequena o bastante pra lutar com uma em cada mão.",
  "Arremesso": "Pode ser arremessada. Alcance normal / máximo, com desvantagem além do normal.",
  "Duas mãos": "Precisa das duas mãos pra atacar.",
  "Versátil": "Uma ou duas mãos. Com as duas, usa o dano entre parênteses.",
  "Pesada": "Grande e pesada. Exige força pra usar bem.",
  "Alcance": "Ataca alvos 1,5 m mais longe que o normal.",
  "Munição": "Precisa de munição. Alcance normal / máximo.",
  "Recarga": "Só dispara uma vez por ação, mesmo com vários ataques.",
};

/* ---------------- ARMADURAS E ESCUDOS ----------------
   [nome, tipo, CA, força mínima, furtividade, peso, preço, tempo pra vestir, descrição] */
const CTG_ARMADURAS_RAW = [
  ["Armadura acolchoada", "Leve", "11 + Des", "", "Desvantagem", "4 kg", "5 PO", "1 min", "Várias camadas de pano grosso e enchimento, costuradas juntas. É a armadura mais barata, mas é quente, abafada e faz barulho, atrapalhando a furtividade. Melhor que nada pra quem está começando."],
  ["Armadura de couro", "Leve", "11 + Des", "", "", "5 kg", "10 PO", "1 min", "Peitoral e ombreiras de couro endurecido em óleo fervente, com o resto do corpo em couro mais macio. Leve, silenciosa e confortável. A escolha padrão de ladinos e patrulheiros."],
  ["Couro batido", "Leve", "12 + Des", "", "", "6,5 kg", "45 PO", "1 min", "Couro resistente reforçado com rebites e pequenas placas de metal. É a melhor das armaduras leves: protege bem sem atrapalhar os movimentos nem a furtividade."],
  ["Gibão de peles", "Média", "12 + Des (máx. 2)", "", "", "6 kg", "10 PO", "5 min (tirar: 1 min)", "Peles grossas de animais costuradas em camadas. Rústico, mas protege bem. Comum entre bárbaros, druidas e povos das terras selvagens."],
  ["Camisão de malha", "Média", "13 + Des (máx. 2)", "", "", "10 kg", "50 PO", "5 min (tirar: 1 min)", "Camisa de anéis de metal entrelaçados, usada por baixo da roupa ou de couro. Protege o tronco sem chamar atenção e sem fazer muito barulho."],
  ["Brunea", "Média", "14 + Des (máx. 2)", "", "Desvantagem", "22,5 kg", "50 PO", "5 min (tirar: 1 min)", "Um casaco de couro coberto de escamas de metal sobrepostas, como as de um peixe. Protege bem, mas é pesada e faz barulho, atrapalhando a furtividade."],
  ["Peitoral", "Média", "14 + Des (máx. 2)", "", "", "10 kg", "400 PO", "5 min (tirar: 1 min)", "Uma placa de metal moldada que cobre o peito e as costas, com o resto do corpo em couro. Protege muito bem e é silenciosa. Cara, mas é a preferida de quem quer proteção sem perder agilidade."],
  ["Meia armadura", "Média", "15 + Des (máx. 2)", "", "Desvantagem", "20 kg", "750 PO", "5 min (tirar: 1 min)", "Placas de metal moldadas cobrindo a maior parte do corpo, com só as pernas mais livres. É a armadura média mais forte, mas pesada e barulhenta."],
  ["Cota de anéis", "Pesada", "14", "", "Desvantagem", "20 kg", "30 PO", "10 min (tirar: 5 min)", "Uma armadura de couro com anéis de metal pesados costurados por cima. Protege mais que couro, mas menos que malha de verdade. Barata, mas barulhenta."],
  ["Cota de malha", "Pesada", "16", "13", "Desvantagem", "27,5 kg", "75 PO", "10 min (tirar: 5 min)", "Malha de anéis de metal entrelaçados cobrindo o corpo todo, usada sobre roupa acolchoada. Protege muito bem, mas pesa muito: exige Força 13, senão deixa você mais lento, e atrapalha a furtividade."],
  ["Cota de talas", "Pesada", "17", "15", "Desvantagem", "30 kg", "200 PO", "10 min (tirar: 5 min)", "Tiras verticais de metal presas sobre couro e malha. Uma armadura pesada robusta, mais barata que placas. Exige Força 15, senão deixa você mais lento, e atrapalha a furtividade."],
  ["Armadura de placas", "Pesada", "18", "15", "Desvantagem", "32,5 kg", "1.500 PO", "10 min (tirar: 5 min)", "Placas de metal moldadas e encaixadas cobrindo o corpo inteiro, com elmo e manoplas. A melhor proteção que existe, mas cara e pesadíssima. Exige Força 15, senão deixa você mais lento, e atrapalha a furtividade."],
  ["Escudo", "Escudo", "+2", "", "", "3 kg", "10 PO", "1 ação", "Um escudo de madeira ou metal preso no braço. Soma +2 na CA de quem estiver treinado com ele. Ocupa uma mão, então não combina com armas de duas mãos."],
];

/* ---------------- ITENS ----------------
   [grupo, nome, peso, preço, descrição, extras?] — extras: { qtd, recipiente } */
const CTG_ITENS_RAW = [
  /* munição */
  ["Munição", "Flechas (20)", "0,5 kg", "1 PO", "Vinte flechas com ponta de metal e penas. Munição pra arcos curtos e longos. Depois de um combate, dá pra recuperar metade das que foram disparadas procurando pelo chão. Costumam ir numa aljava.", { qtd: 20 }],
  ["Munição", "Virotes (20)", "0,75 kg", "1 PO", "Vinte virotes curtos e grossos, munição de bestas. Depois de um combate, dá pra recuperar metade dos disparados. Costumam ir num estojo próprio.", { qtd: 20 }],
  ["Munição", "Balas de arma de fogo (10)", "1 kg", "3 PO", "Dez cargas de chumbo e pólvora pra pistola ou mosquete. Diferente de flechas, não dá pra recuperar depois de disparadas. Mantenha secas.", { qtd: 10 }],
  ["Munição", "Balas de funda (20)", "0,75 kg", "4 PC", "Vinte bolinhas de chumbo ou pedra polida pra funda. Também dá pra usar pedras comuns na falta delas.", { qtd: 20 }],
  ["Munição", "Agulhas de zarabatana (50)", "0,5 kg", "1 PO", "Cinquenta agulhas finas pra zarabatana. Sozinhas causam pouco dano, mas são perfeitas pra levar veneno.", { qtd: 50 }],

  /* consumíveis */
  ["Consumíveis", "Poção de cura", "0,25 kg", "50 PO", "Um frasco de líquido vermelho que brilha levemente. Quem bebe recupera 2d4 + 2 PV na hora. Beber ou dar a alguém do seu lado leva só uma ação bônus. Todo aventureiro devia ter pelo menos uma."],
  ["Consumíveis", "Poção de cura maior", "0,25 kg", "—", "Versão mais forte da poção de cura, com um vermelho mais intenso. Recupera 4d4 + 4 PV. Mais rara, costuma ser encontrada em tesouros ou comprada de alquimistas experientes."],
  ["Consumíveis", "Poção de cura superior", "0,25 kg", "—", "Uma poção rara e muito potente. Recupera 8d4 + 8 PV, o suficiente pra salvar alguém à beira da morte. Difícil de achar à venda."],
  ["Consumíveis", "Poção de cura suprema", "0,25 kg", "—", "A poção de cura mais forte que existe, quase lendária. Recupera 10d4 + 20 PV de uma vez. Guardada pras situações mais desesperadoras."],
  ["Consumíveis", "Antitoxina", "—", "50 PO", "Um frasco com um líquido amargo que protege contra venenos. Bebendo (ação bônus), você tem vantagem nos testes contra ficar envenenado por 1 hora. Bom de tomar antes de enfrentar aranhas e serpentes."],
  ["Consumíveis", "Ácido (frasco)", "0,5 kg", "25 PO", "Um frasco de vidro com ácido corrosivo. No lugar de um ataque, você arremessa em alguém a até 6 m: ele faz teste de Destreza ou sofre 2d6 de ácido. Também serve pra derreter fechaduras e correntes com tempo."],
  ["Consumíveis", "Fogo alquímico", "0,5 kg", "50 PO", "Um frasco com um líquido grudento que pega fogo ao entrar em contato com o ar. No lugar de um ataque, arremessa em alguém a até 6 m: teste de Destreza ou sofre 1d4 de fogo e começa a queimar, até alguém apagar."],
  ["Consumíveis", "Água benta", "0,5 kg", "25 PO", "Água abençoada por um sacerdote, num frasco. No lugar de um ataque, arremessa até 6 m: se o alvo for um morto-vivo ou criatura profana, faz teste de Destreza ou sofre 2d8 radiante. Contra o resto, é só água."],
  ["Consumíveis", "Óleo (frasco)", "0,5 kg", "1 PP", "Um frasco de óleo que serve de combustível pra lampiões e lanternas (queima por 6 horas). Jogado num alvo ou derramado no chão, faz o fogo causar 5 de dano extra; aceso no chão, vira uma poça em chamas."],
  ["Consumíveis", "Veneno básico", "—", "100 PO", "Um frasquinho de veneno pra passar em armas. Cobre uma arma ou até 3 munições. Quem levar dano perfurante ou cortante delas sofre +1d4 de veneno. O efeito dura 1 minuto ou até acertar alguém."],
  ["Consumíveis", "Rações (1 dia)", "1 kg", "5 PP", "Comida de viagem que não estraga: carne seca, frutas secas, biscoito duro e castanhas. Uma porção alimenta uma pessoa por um dia. Sem comida, a pessoa começa a ficar exausta."],
  ["Consumíveis", "Pergaminho de truque", "—", "30 PO", "Um pergaminho mágico com um truque escrito. Quem tem esse truque na lista de magias pode lê-lo e conjurá-lo uma vez, sem precisar de componentes. Depois ele vira pó."],
  ["Consumíveis", "Pergaminho de magia (1º círculo)", "—", "50 PO", "Um pergaminho mágico com uma magia de 1º círculo escrita. Quem tem a magia na lista pode conjurá-la uma vez lendo o texto, com CD 13 e +5 de ataque. Depois de usado, se desfaz."],

  /* luz e fogo */
  ["Luz e fogo", "Tocha", "0,5 kg", "1 PC", "Um pedaço de madeira com a ponta envolta em pano e piche. Queima por 1 hora, com luz forte em 6 m e fraca por mais 6 m. Em apuros, dá pra bater com ela como arma (1 de dano de fogo)."],
  ["Luz e fogo", "Vela", "—", "1 PC", "Uma vela de cera ou sebo. Queima por 1 hora, iluminando pouco: luz forte em 1,5 m e fraca por mais 1,5 m. Boa pra ler à noite ou marcar um lugar."],
  ["Luz e fogo", "Lâmpada", "0,5 kg", "5 PP", "Uma lamparina de barro ou metal que queima óleo (6 horas por frasco). Luz forte em 4,5 m e fraca por mais 9 m. Ilumina bem um quarto ou acampamento."],
  ["Luz e fogo", "Lanterna furta-fogo", "1 kg", "5 PO", "Lanterna de metal com uma tampa que abre e fecha, queimando óleo. Aberta, dá luz forte em 9 m e fraca por mais 9 m; com a tampa abaixada (ação bônus), quase apaga. Ótima pra se esgueirar."],
  ["Luz e fogo", "Lanterna focada", "1 kg", "10 PO", "Lanterna com um refletor que concentra a luz num cone de 18 m, mais luz fraca por mais 18 m. Ilumina longe numa direção só, como um farol de mão. Queima óleo."],
  ["Luz e fogo", "Pederneira", "0,5 kg", "5 PP", "Caixinha com pedra de fogo, aço e material seco. Acender vela, tocha ou lampião leva só uma ação bônus; uma fogueira leva 1 minuto. Indispensável em qualquer viagem."],

  /* recipientes */
  ["Recipientes", "Mochila", "2,5 kg", "2 PO", "Uma mochila de couro ou lona com alças. Carrega até 15 kg de coisas e também serve como alforje numa montaria. O item mais básico de qualquer aventureiro.", { recipiente: true }],
  ["Recipientes", "Saco", "0,25 kg", "1 PC", "Um saco de pano ou estopa. Carrega até 15 kg, mas é desconfortável de levar por muito tempo. Útil pra guardar tesouro ou carregar mantimentos.", { recipiente: true }],
  ["Recipientes", "Algibeira", "0,5 kg", "5 PP", "Uma bolsinha de couro ou pano presa ao cinto. Carrega até 3 kg: moedas, componentes, pequenos objetos. Costuma ser o primeiro alvo dos batedores de carteira.", { recipiente: true }],
  ["Recipientes", "Baú", "12,5 kg", "5 PO", "Uma caixa grande de madeira reforçada, com tampa e lugar pra cadeado. Guarda bastante coisa, mas é pesada demais pra carregar nas costas. Ideal pra deixar numa carroça ou no quarto.", { recipiente: true }],
  ["Recipientes", "Cesto", "1 kg", "4 PP", "Um cesto de vime trançado, com alça. Carrega até 20 kg. Comum em mercados e colheitas.", { recipiente: true }],
  ["Recipientes", "Barril", "35 kg", "2 PO", "Um barril de madeira com aros de metal. Guarda até 150 litros de líquido ou grãos. Pesado demais pra carregar cheio, mas ótimo pra estocar."],
  ["Recipientes", "Aljava", "0,5 kg", "1 PO", "Um estojo de couro pendurado nas costas ou no quadril, que guarda até 20 flechas e deixa elas fáceis de pegar.", { recipiente: true }],
  ["Recipientes", "Estojo de virotes", "0,5 kg", "1 PO", "Um estojo de couro ou madeira que guarda até 20 virotes de besta, protegidos e organizados.", { recipiente: true }],
  ["Recipientes", "Estojo de mapas ou pergaminhos", "0,5 kg", "1 PO", "Um tubo de couro ou osso com tampa que protege papéis da chuva e do desgaste. Guarda até 10 folhas de papel ou 5 de pergaminho enroladas.", { recipiente: true }],
  ["Recipientes", "Bolsa de componentes", "1 kg", "25 PO", "Uma bolsinha de couro à prova d'água, cheia de compartimentos com pitadas de ervas, pós, penas e outros ingredientes. Substitui os componentes materiais comuns das magias (os que não têm custo)."],
  ["Recipientes", "Odre", "2,5 kg (cheio)", "2 PP", "Uma bolsa de couro feita pra carregar água ou vinho. Leva uns 2 litros. Ficar sem beber água deixa a pessoa exausta rápido, então nunca saia sem ele."],
  ["Recipientes", "Garrafa de vidro", "1 kg", "2 PO", "Uma garrafa de vidro com rolha, que leva quase 1 litro. Boa pra bebidas, poções caseiras ou mensagens."],
  ["Recipientes", "Frasco", "0,5 kg", "2 PC", "Um frasco de barro ou metal com tampa, de meio litro. Serve pra óleo, bebida ou qualquer líquido."],
  ["Recipientes", "Frasquinho", "—", "1 PO", "Um frasco de vidro bem pequeno, de uns 100 ml, com rolha. Usado pra poções, venenos, tintas e amostras."],
  ["Recipientes", "Jarro", "2 kg", "2 PC", "Um jarro de barro de uns 4 litros, com alça. Pra água, vinho ou azeite."],
  ["Recipientes", "Balde", "1 kg", "5 PC", "Um balde de madeira ou metal com alça. Pra água, areia, ou pra jogar em alguém pegando fogo."],
  ["Recipientes", "Panela de ferro", "5 kg", "2 PO", "Uma panela de ferro de uns 4 litros pra cozinhar no acampamento. Pesada, mas dura a vida inteira. Também serve de arma improvisada."],

  /* aventura */
  ["Aventura", "Corda (15 m)", "2,5 kg", "1 PO", "Quinze metros de corda resistente de cânhamo. Dá pra escalar, descer, amarrar coisas ou prender alguém que já esteja agarrado ou contido (escapar pede um teste difícil). Um dos itens mais úteis de qualquer aventura."],
  ["Aventura", "Barbante (3 m)", "—", "1 PP", "Três metros de fio fino e resistente. Dá pra dar nó rapidinho, amarrar pacotes, montar armadilhas simples ou marcar um caminho."],
  ["Aventura", "Corrente (3 m)", "5 kg", "5 PO", "Três metros de corrente de ferro. Prende uma criatura agarrada ou contida; escapar exige um teste muito difícil, e arrebentar, mais ainda. Também serve pra trancar portas e baús."],
  ["Aventura", "Gancho de escalada", "2 kg", "2 PO", "Um gancho de metal de três pontas. Arremessado até 15 m, prende numa beirada, janela ou galho (teste de Acrobacia). Com uma corda amarrada, dá pra subir onde não tem escada."],
  ["Aventura", "Kit de escalada", "6 kg", "25 PO", "Luvas, ponteiras pra botas, grampos e um cinto com mosquetão. Ancorado (uma ação), você não cai mais que 7,5 m do ponto de apoio, mas também não se afasta mais que isso sem soltar."],
  ["Aventura", "Pé de cabra", "2,5 kg", "2 PO", "Uma barra de ferro com a ponta achatada. Dá vantagem em testes de Força pra arrombar portas, abrir baús e levantar coisas pesadas, onde der pra usar como alavanca."],
  ["Aventura", "Aríete portátil", "17,5 kg", "4 PO", "Uma tora de madeira com ponta de ferro e alças. Usado pra arrombar portas: +4 no teste de Força. Se outra pessoa ajudar a carregar, você ainda tem vantagem."],
  ["Aventura", "Pá", "2,5 kg", "2 PO", "Uma pá de ferro com cabo de madeira. Em 1 hora de trabalho, cava um buraco de 1,5 m de lado. Pra trincheiras, enterrar tesouros (ou desenterrar)."],
  ["Aventura", "Vara (3 m)", "3,5 kg", "5 PC", "Uma vara longa de madeira. Serve pra cutucar coisas suspeitas de longe (tipo chão com armadilha), medir profundidade de água ou ajudar num salto em distância ou altura."],
  ["Aventura", "Escada (3 m)", "12,5 kg", "1 PP", "Uma escada de madeira de 3 metros. Pesada pra carregar, mas resolve muros, janelas e buracos."],
  ["Aventura", "Cravos de ferro (10)", "2,5 kg", "1 PO", "Dez pregos grandes de ferro. Martelados no chão, na parede ou numa porta, servem pra travar a porta, prender uma corda ou montar um ponto de apoio.", { qtd: 10 }],
  ["Aventura", "Estrepes", "1 kg", "1 PO", "Um saco de pequenas pontas de metal que sempre caem com uma ponta pra cima. Espalhados num quadrado de 1,5 m, quem entrar faz teste de Destreza ou sofre 1 de dano perfurante e fica parado até o próximo turno. Ótimos pra fugir."],
  ["Aventura", "Esferas de metal", "1 kg", "1 PO", "Um saco com centenas de bolinhas de metal. Espalhadas num quadrado de 3 m, quem entrar faz teste de Destreza ou escorrega e cai no chão. Ótimas pra cobrir uma fuga."],
  ["Aventura", "Rede", "1,5 kg", "1 PO", "Uma rede com pesos nas pontas, feita pra prender. No lugar de um ataque, você arremessa até 4,5 m: o alvo faz teste de Destreza ou fica contido até se soltar (ação e teste de Força) ou alguém cortar a rede."],
  ["Aventura", "Armadilha de caça", "12,5 kg", "5 PO", "Uma mandíbula de aço com dentes, presa por corrente a uma estaca. Quem pisa faz teste de Destreza ou sofre 1d4 perfurante e fica preso, sem conseguir se mover até se soltar com um teste de Força."],
  ["Aventura", "Algemas", "3 kg", "2 PO", "Grilhões de ferro com chave. Prendem uma criatura pequena ou média que esteja agarrada ou contida; quem está algemado tem desvantagem nos ataques. Escapar ou arrebentar é bem difícil, e sem a chave dá pra abrir com ferramentas de ladrão."],
  ["Aventura", "Cadeado", "0,5 kg", "10 PO", "Um cadeado de ferro com chave. Sem a chave, dá pra abrir com ferramentas de ladrão e um teste de Destreza, ou na força bruta."],
  ["Aventura", "Sino", "—", "1 PO", "Um sininho de metal. Tocado, dá pra ouvir a até 18 m. Ótimo pra montar alarmes simples com barbante."],
  ["Aventura", "Apito de sinalização", "—", "5 PC", "Um apito agudo que dá pra ouvir a até 180 m. Útil pra combinar sinais com o grupo ou chamar ajuda."],
  ["Aventura", "Espelho de mão", "0,25 kg", "5 PO", "Um pequeno espelho de aço polido. Serve pra se arrumar, espiar esquinas sem se expor, fazer sinais com a luz do sol ou olhar criaturas que petrificam com o olhar."],
  ["Aventura", "Lupa", "—", "100 PO", "Uma lente de vidro que aumenta o que você olha. Dá vantagem pra avaliar ou examinar objetos cheios de detalhes. Com sol forte e um pouco de paciência, também acende fogo."],
  ["Aventura", "Luneta", "0,5 kg", "1.000 PO", "Um tubo com lentes que mostra as coisas com o dobro do tamanho. Caríssima, mas perfeita pra observar inimigos e terrenos de longe."],
  ["Aventura", "Roldana", "2,5 kg", "1 PO", "Um sistema de polias e corda pra levantar peso. Com ela você ergue até quatro vezes o que levantaria normalmente."],
  ["Aventura", "Saco de dormir", "3,5 kg", "1 PO", "Um saco acolchoado pra dormir no chão. Cabe uma pessoa. Dentro dele, você resiste automaticamente ao frio extremo."],
  ["Aventura", "Cobertor", "1,5 kg", "5 PP", "Um cobertor grosso de lã. Enrolado nele, você tem vantagem contra o frio extremo. Pode virar capa ou forrar o chão."],
  ["Aventura", "Tenda", "10 kg", "2 PO", "Uma tenda de lona com estacas, que abriga até duas pessoas da chuva e do vento. Desmontada, cabe na mochila."],
  ["Aventura", "Kit de primeiros socorros", "1,5 kg", "5 PO", "Uma bolsa com bandagens, pomadas e talas. Tem dez usos; cada uso estabiliza alguém com 0 PV sem precisar de teste de Medicina. Não cura PV, mas impede que o aliado morra.", { qtd: 1 }],
  ["Aventura", "Livro", "2,5 kg", "25 PO", "Um livro sobre algum assunto: história, plantas, criaturas, religião. Se o conteúdo for preciso, consultar dá +5 em testes de conhecimento sobre aquele tema."],
  ["Aventura", "Mapa", "—", "1 PO", "Um mapa de uma região, cidade ou masmorra. Se for preciso e confiável, dá +5 nos testes pra se orientar e achar caminho no lugar que ele mostra."],
  ["Aventura", "Tinta (frasco)", "—", "10 PO", "Um frasquinho de tinta preta, o bastante pra escrever umas 500 páginas. Precisa de pena pra usar."],
  ["Aventura", "Pena de escrever", "—", "2 PC", "Uma pena de ave com a ponta cortada, usada com tinta pra escrever ou desenhar."],
  ["Aventura", "Papel (folha)", "—", "2 PP", "Uma folha de papel, cabe umas 250 palavras escritas à mão. Mais barato que pergaminho, mas menos resistente."],
  ["Aventura", "Pergaminho (folha)", "—", "1 PP", "Uma folha de pergaminho feita de couro curtido. Mais resistente que papel; dura séculos se bem guardada."],
  ["Aventura", "Perfume", "—", "5 PO", "Um frasquinho de perfume caro. Por 1 hora depois de usar, você tem vantagem pra convencer alguém neutro que esteja bem perto de você."],

  /* focos */
  ["Focos de magia", "Cristal (foco arcano)", "0,5 kg", "10 PO", "Um cristal lapidado que magos, feiticeiros e bruxos usam pra canalizar magia. Substitui os componentes materiais comuns das magias."],
  ["Focos de magia", "Orbe (foco arcano)", "1,5 kg", "20 PO", "Uma esfera de cristal, vidro ou pedra polida usada como foco arcano. Substitui os componentes materiais comuns das magias."],
  ["Focos de magia", "Cetro (foco arcano)", "1 kg", "10 PO", "Um bastão curto de metal ou madeira entalhada usado como foco arcano. Substitui os componentes materiais comuns das magias."],
  ["Focos de magia", "Cajado (foco arcano)", "2 kg", "5 PO", "Um cajado entalhado que funciona como foco arcano e também como bordão no combate."],
  ["Focos de magia", "Varinha (foco arcano)", "0,5 kg", "10 PO", "Uma varinha de madeira, osso ou metal entalhado usada como foco arcano. Substitui os componentes materiais comuns das magias."],
  ["Focos de magia", "Ramo de visco (foco druídico)", "—", "1 PO", "Um raminho de visco colhido com cerimônia. Druidas e patrulheiros usam como foco pra suas magias."],
  ["Focos de magia", "Cajado de madeira (foco druídico)", "2 kg", "5 PO", "Um cajado feito de uma árvore viva, usado como foco druídico e também como bordão."],
  ["Focos de magia", "Varinha de teixo (foco druídico)", "0,5 kg", "10 PO", "Uma varinha de madeira de teixo, usada como foco por druidas e patrulheiros."],
  ["Focos de magia", "Amuleto sagrado", "0,5 kg", "5 PO", "Um símbolo do seu deus usado no pescoço ou segurado na mão. Clérigos e paladinos usam como foco pras magias divinas."],
  ["Focos de magia", "Emblema sagrado", "—", "5 PO", "O símbolo do seu deus pintado ou gravado num escudo ou num tecido (tabardo, estandarte). Funciona como foco divino sem ocupar a mão."],
  ["Focos de magia", "Relicário", "1 kg", "5 PO", "Uma caixinha que guarda uma relíquia sagrada (um osso, um fio de cabelo de um santo). Segurado na mão, funciona como foco divino."],

  /* roupas */
  ["Roupas", "Roupas de viajante", "2 kg", "2 PO", "Roupas resistentes de lã e couro, feitas pra estrada: capa, botas, calças e camisa. Aguentam chuva, sol e poeira."],
  ["Roupas", "Roupas finas", "3 kg", "15 PO", "Roupas de tecidos caros, bem cortadas e com detalhes bordados. Alguns lugares e eventos só aceitam quem está vestido assim."],
  ["Roupas", "Fantasia", "2 kg", "5 PO", "Um disfarce completo de um tipo de pessoa (guarda, sacerdote, mendigo, nobre). Vestido nela, você tem vantagem pra se passar por esse tipo de pessoa."],
  ["Roupas", "Manto cerimonial", "2 kg", "1 PO", "Um manto de ofício ou de cerimônia, com cores e símbolos de uma ordem, templo ou guilda. Alguns lugares só deixam entrar quem usa o manto certo."],

  /* kits */
  ["Kits de aventura", "Kit de explorador", "27,5 kg", "10 PO", "Pacote pronto pra viagens longas: mochila, saco de dormir, 2 frascos de óleo, 10 dias de rações, corda, pederneira, 10 tochas e odre. Prático pra quem não quer comprar item por item.", { recipiente: true }],
  ["Kits de aventura", "Kit de masmorra", "27,5 kg", "12 PO", "Pacote pra explorar lugares subterrâneos: mochila, estrepes, pé de cabra, 2 frascos de óleo, 10 dias de rações, corda, pederneira, 10 tochas e odre.", { recipiente: true }],
  ["Kits de aventura", "Kit de assaltante", "21 kg", "16 PO", "Pacote pra quem entra onde não devia: mochila, esferas de metal, sino, 10 velas, pé de cabra, lanterna furta-fogo, 7 frascos de óleo, 5 dias de rações, corda, pederneira e odre.", { recipiente: true }],
  ["Kits de aventura", "Kit de artista", "29 kg", "40 PO", "Pacote de artista de estrada: mochila, saco de dormir, sino, lanterna focada, 3 fantasias, espelho, 8 frascos de óleo, 9 dias de rações, pederneira e odre.", { recipiente: true }],
  ["Kits de aventura", "Kit de diplomata", "19,5 kg", "39 PO", "Pacote pra negociações e cortes: baú, roupas finas, tinta, 5 penas, lâmpada, 2 estojos de pergaminho, 4 frascos de óleo, 5 folhas de papel, 5 de pergaminho, perfume e pederneira.", { recipiente: true }],
  ["Kits de aventura", "Kit de sacerdote", "14,5 kg", "33 PO", "Pacote de viagem de religioso: mochila, cobertor, água benta, lâmpada, 7 dias de rações, manto e pederneira.", { recipiente: true }],
  ["Kits de aventura", "Kit de estudioso", "11 kg", "40 PO", "Pacote de quem vive entre livros: mochila, livro, tinta, pena, lâmpada, 10 frascos de óleo, 10 folhas de pergaminho e pederneira.", { recipiente: true }],

  /* ferramentas de artesão */
  ["Ferramentas de artesão", "Suprimentos de alquimista", "4 kg", "50 PO", "Frascos, alambique, pinças e reagentes. Usa Inteligência. Com eles você identifica substâncias e acende fogo, e pode fabricar ácido, fogo alquímico, óleo, papel e perfume."],
  ["Ferramentas de artesão", "Suprimentos de cervejeiro", "4,5 kg", "20 PO", "Barril pequeno, mangueiras, lúpulo e fermento. Usa Inteligência. Dá pra notar bebida envenenada, identificar álcool e fabricar antitoxina."],
  ["Ferramentas de artesão", "Suprimentos de calígrafo", "2,5 kg", "10 PO", "Penas finas, tintas e pergaminhos de qualidade. Usa Destreza. Escreve com uma letra caprichada e difícil de falsificar, e permite fazer tinta e pergaminhos de magia."],
  ["Ferramentas de artesão", "Ferramentas de carpinteiro", "3 kg", "8 PO", "Serrote, martelo, pregos, formão e plaina. Usa Força. Dá pra lacrar ou forçar portas e caixas, e fabricar clavas, bordões, baús, escadas, varas e tochas."],
  ["Ferramentas de artesão", "Ferramentas de cartógrafo", "3 kg", "15 PO", "Réguas, compasso, tintas e papéis. Usa Sabedoria. Dá pra desenhar o mapa de uma área pequena e fabricar mapas."],
  ["Ferramentas de artesão", "Ferramentas de sapateiro", "2,5 kg", "5 PO", "Martelo, sovela, couro e pregos. Usa Destreza. Ajusta calçados pra dar vantagem na próxima acrobacia e fabrica kits de escalada."],
  ["Ferramentas de artesão", "Utensílios de cozinheiro", "4 kg", "1 PO", "Panela, facas, garfos e temperos. Usa Sabedoria. Melhora o sabor da comida, nota comida estragada ou envenenada e prepara rações."],
  ["Ferramentas de artesão", "Ferramentas de vidreiro", "2,5 kg", "30 PO", "Maçarico, tubo de sopro e pinças. Usa Inteligência. Descobre o que um objeto de vidro guardou nas últimas 24 horas e fabrica garrafas, frascos, lupas e lunetas."],
  ["Ferramentas de artesão", "Ferramentas de joalheiro", "1 kg", "25 PO", "Lupa de joalheiro, pinças finas e pequenas serras. Usa Inteligência. Avalia o valor de gemas e fabrica focos arcanos e símbolos sagrados."],
  ["Ferramentas de artesão", "Ferramentas de coureiro", "2,5 kg", "5 PO", "Facas, sovelas, agulhas e linha grossa. Usa Destreza. Decora peças de couro e fabrica fundas, chicotes, armaduras de couro, mochilas, algibeiras, aljavas e odres."],
  ["Ferramentas de artesão", "Ferramentas de pedreiro", "4 kg", "10 PO", "Talhadeira, martelo de pedra e prumo. Usa Força. Talha símbolos ou buracos na pedra e fabrica roldanas."],
  ["Ferramentas de artesão", "Suprimentos de pintor", "2,5 kg", "10 PO", "Pincéis, tintas, cavalete e telas. Usa Sabedoria. Pinta com fidelidade algo que você viu e fabrica focos druídicos e símbolos sagrados."],
  ["Ferramentas de artesão", "Ferramentas de oleiro", "1,5 kg", "10 PO", "Torno, estecas e barro. Usa Inteligência. Descobre o que um objeto de barro guardou nas últimas 24 horas e fabrica jarros e lâmpadas."],
  ["Ferramentas de artesão", "Ferramentas de ferreiro", "4 kg", "20 PO", "Martelos, pinças, carvão e lima. Usa Força. Força portas e caixas e fabrica armas corpo a corpo, armaduras médias e pesadas, correntes, cravos, pés de cabra e munição de metal."],
  ["Ferramentas de artesão", "Ferramentas de funileiro", "5 kg", "50 PO", "Ferramentas pequenas, engrenagens e sucata. Usa Destreza. Monta uma bugiganga que dura 1 minuto e fabrica armas de fogo, lanternas, cadeados, algemas, espelhos e pederneiras."],
  ["Ferramentas de artesão", "Ferramentas de tecelão", "2,5 kg", "1 PO", "Fios, agulhas e um tear pequeno. Usa Destreza. Remenda roupas e borda, e fabrica armadura acolchoada, cestos, cobertores, redes, cordas, sacos, tendas e roupas."],
  ["Ferramentas de artesão", "Ferramentas de entalhador", "2,5 kg", "1 PO", "Facas e goivas pra madeira. Usa Destreza. Entalha desenhos e fabrica clavas, bordões, arcos, bestas, flechas, virotes, focos e penas de escrever."],

  /* outras ferramentas */
  ["Outras ferramentas", "Ferramentas de ladrão", "0,5 kg", "25 PO", "Gazuas, uma lima pequena, um espelhinho e alicates. Usa Destreza. Abre fechaduras e desarma armadilhas. Ter isso sem justificativa costuma dar problema com a guarda."],
  ["Outras ferramentas", "Kit de disfarce", "1,5 kg", "25 PO", "Maquiagem, perucas, tintas de cabelo e pequenos acessórios. Usa Carisma. Muda sua aparência pra se disfarçar e permite fabricar fantasias."],
  ["Outras ferramentas", "Kit de falsificação", "2,5 kg", "15 PO", "Papéis, tintas, selos e ferramentas finas. Usa Destreza. Imita a letra de alguém ou copia um selo de cera, perfeito pra documentos falsos."],
  ["Outras ferramentas", "Kit de herbalismo", "1,5 kg", "5 PO", "Bolsas, tesourinhas, pilão e frascos pra ervas. Usa Inteligência. Identifica plantas e fabrica antitoxina, velas, kits de primeiros socorros e poções de cura."],
  ["Outras ferramentas", "Kit de envenenador", "1 kg", "50 PO", "Frascos, pipetas e substâncias perigosas. Usa Inteligência. Nota objetos envenenados e fabrica veneno básico."],
  ["Outras ferramentas", "Instrumentos de navegação", "1 kg", "25 PO", "Sextante, bússola, cartas e réguas. Usa Sabedoria. Traça rotas no mar ou no deserto e descobre onde você está olhando as estrelas."],

  /* jogos */
  ["Jogos", "Dados", "—", "1 PP", "Um conjunto de dados de osso ou madeira. Usa Sabedoria pra notar trapaça ou ganhar a partida. Comum em toda taverna."],
  ["Jogos", "Baralho", "—", "5 PP", "Um baralho de cartas pintadas à mão. Usa Sabedoria pra notar trapaça ou ganhar a partida."],
  ["Jogos", "Xadrez de dragão", "—", "1 PO", "Um jogo de tabuleiro de estratégia com peças de criaturas fantásticas. Usa Sabedoria pra ganhar ou pegar trapaça."],
  ["Jogos", "Jogo de cartas de aposta", "—", "1 PO", "Um jogo de cartas com apostas, muito comum em tavernas e navios. Usa Sabedoria pra ganhar ou pegar trapaça."],

  /* instrumentos */
  ["Instrumentos musicais", "Gaita de foles", "3 kg", "30 PO", "Instrumento de sopro com um saco de couro e tubos. Usa Carisma pra tocar uma música conhecida ou improvisar. Alto e marcante."],
  ["Instrumentos musicais", "Tambor", "1,5 kg", "6 PO", "Tambor de couro esticado, tocado com as mãos ou baquetas. Usa Carisma pra tocar. Bom pra marchas e festas."],
  ["Instrumentos musicais", "Saltério", "5 kg", "25 PO", "Instrumento de cordas tocado com martelinhos, de som delicado. Usa Carisma pra tocar."],
  ["Instrumentos musicais", "Flauta", "0,5 kg", "2 PO", "Flauta de madeira ou osso. Usa Carisma pra tocar uma música conhecida ou improvisar."],
  ["Instrumentos musicais", "Trompa", "1 kg", "3 PO", "Uma trompa de chifre ou metal, de som forte. Usa Carisma pra tocar. Também serve pra dar sinais à distância."],
  ["Instrumentos musicais", "Alaúde", "1 kg", "35 PO", "Instrumento de cordas de corpo arredondado, o clássico dos bardos. Usa Carisma pra tocar uma música conhecida ou improvisar."],
  ["Instrumentos musicais", "Lira", "1 kg", "30 PO", "Uma pequena harpa de cordas, de som suave. Usa Carisma pra tocar."],
  ["Instrumentos musicais", "Flauta de pã", "1 kg", "12 PO", "Várias flautas de tamanhos diferentes presas lado a lado. Usa Carisma pra tocar."],
  ["Instrumentos musicais", "Charamela", "0,5 kg", "2 PO", "Instrumento de sopro de palheta dupla, de som forte e agudo. Usa Carisma pra tocar."],
  ["Instrumentos musicais", "Viola", "0,5 kg", "30 PO", "Instrumento de cordas tocado com arco. Usa Carisma pra tocar uma música conhecida ou improvisar."],

  /* montarias e animais */
  ["Montarias e animais", "Camelo", "—", "50 PO", "Animal do deserto que aguenta dias sem água. Carrega até 225 kg. Lento e mal-humorado, mas incansável."],
  ["Montarias e animais", "Elefante", "—", "200 PO", "Um animal enorme e muito forte. Carrega até 660 kg e assusta qualquer um no campo de batalha."],
  ["Montarias e animais", "Cavalo de tração", "—", "50 PO", "Cavalo forte e calmo, criado pra puxar carroças e arados. Carrega até 270 kg, mas não é rápido nem treinado pra guerra."],
  ["Montarias e animais", "Cavalo de montaria", "—", "75 PO", "Cavalo rápido, bom pra viagens. Carrega até 240 kg. Pode se assustar em combate."],
  ["Montarias e animais", "Cavalo de guerra", "—", "400 PO", "Cavalo grande e treinado pra batalha, que não foge do barulho nem do sangue. Carrega até 270 kg. Caro, mas leal."],
  ["Montarias e animais", "Mastim", "—", "25 PO", "Cachorro enorme, bom de guarda, de caça e até de montaria pra gente pequena. Carrega até 97 kg."],
  ["Montarias e animais", "Mula", "—", "8 PO", "Teimosa e resistente, anda bem em terrenos difíceis. Carrega até 210 kg. A preferida pra levar carga."],
  ["Montarias e animais", "Pônei", "—", "30 PO", "Cavalo pequeno e resistente, ótimo pra gente baixinha e pra trilhas. Carrega até 112 kg."],

  /* arreios e veículos */
  ["Arreios e veículos", "Sela de montaria", "12,5 kg", "10 PO", "Sela comum, com rédeas e freio. Necessária pra montar com conforto em viagens longas."],
  ["Arreios e veículos", "Sela militar", "15 kg", "20 PO", "Sela reforçada pra combate, que te segura melhor. Dá vantagem nos testes pra não cair da montaria."],
  ["Arreios e veículos", "Sela exótica", "20 kg", "60 PO", "Sela especial, necessária pra montar criaturas que voam ou nadam (como grifos ou cavalos-marinhos)."],
  ["Arreios e veículos", "Ração animal (1 dia)", "5 kg", "5 PC", "Feno, aveia ou carne, o bastante pra alimentar um animal de montaria ou carga por um dia."],
  ["Arreios e veículos", "Estábulo (1 dia)", "—", "5 PP", "Um dia de abrigo, comida e cuidado pra uma montaria numa estalagem ou cidade."],
  ["Arreios e veículos", "Carroça", "100 kg", "15 PO", "Carroça simples de duas rodas, puxada por um animal. Leva carga ou poucas pessoas."],
  ["Arreios e veículos", "Carroção", "200 kg", "35 PO", "Carroça grande de quatro rodas, coberta, puxada por dois ou mais animais. Leva muita carga em viagens longas."],
  ["Arreios e veículos", "Carruagem", "300 kg", "100 PO", "Veículo fechado e confortável, com bancos pra passageiros, puxado por cavalos. Coisa de nobres e mercadores ricos."],
  ["Arreios e veículos", "Biga", "50 kg", "250 PO", "Carro de guerra leve, de duas rodas, puxado por cavalos. Rápido e feito pra combate."],
  ["Arreios e veículos", "Trenó", "150 kg", "20 PO", "Veículo com esquis em vez de rodas, puxado por animais na neve e no gelo."],

  /* embarcações */
  ["Embarcações", "Bote a remo", "50 kg", "50 PO", "Barco pequeno pra 1 tripulante e 3 passageiros, a uns 2,4 km/h. CA 11 e 50 PV. Leve o bastante pra ser carregado nas costas entre rios."],
  ["Embarcações", "Barco de quilha", "—", "3.000 PO", "Barco de rio pra 1 tripulante e 6 passageiros, com meia tonelada de carga, a uns 1,6 km/h. CA 15 e 100 PV."],
  ["Embarcações", "Navio a vela", "—", "10.000 PO", "Navio mercante com 20 tripulantes, 20 passageiros e 100 toneladas de carga, a uns 3,2 km/h. CA 15 e 300 PV."],
  ["Embarcações", "Drakkar", "—", "10.000 PO", "Navio longo a remo e vela, de povos navegadores. 40 tripulantes e até 150 passageiros, a uns 4,8 km/h. CA 15 e 300 PV."],
  ["Embarcações", "Galé", "—", "30.000 PO", "Grande navio a remo, com 80 tripulantes e 150 toneladas de carga, a uns 6,4 km/h. CA 15 e 500 PV."],
  ["Embarcações", "Navio de guerra", "—", "25.000 PO", "Navio armado pra batalha, com 60 tripulantes, 60 passageiros e 200 toneladas de carga, a uns 4 km/h. CA 15 e 500 PV."],
  ["Embarcações", "Aeronave", "—", "40.000 PO", "Um navio que voa, movido por magia. 10 tripulantes e 20 passageiros, a uns 12,8 km/h. CA 13 e 300 PV. Raríssimo e caríssimo."],
];

/* ---------------- monta os objetos ---------------- */
function _ctgId(t, n) {
  return t + "." + String(n).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const CATALOGO_IGNEA = {
  armas: CTG_ARMAS_RAW.map(([nome, tipo, uso, dano, tipoDano, props, peso, preco, desc]) => ({
    id: _ctgId("arma", nome), nome, tipo: tipo === "S" ? "Simples" : "Marcial",
    uso: uso === "c" ? "Corpo a corpo" : "À distância", dano, tipoDano, props, peso, preco, desc,
  })),
  armaduras: CTG_ARMADURAS_RAW.map(([nome, tipo, ca, forca, furt, peso, preco, vestir, desc]) => ({
    id: _ctgId("armadura", nome), nome, tipo, ca, forca, furt, peso, preco, vestir, desc,
  })),
  itens: CTG_ITENS_RAW.map(([grupo, nome, peso, preco, desc, extra]) => ({
    id: _ctgId("item", nome), grupo, nome, peso, preco, desc, ...(extra || {}),
  })),
};

/* =====================================================================
   DOMINIOS.JS · Ficha Ígnea
   Sistema de Domínios (Corpo, Mente e Alma), criado por
   Vinicius Edney e Giovany Queiroz (não é do SRD).
   Só os dados: a escolha fica na Evolução (progressao.js).
   ===================================================================== */
window.DOMINIOS_AUTORES = "Vinicius Edney e Giovany Queiroz";
window.DOMINIOS_REGRAS = "Expansões das habilidades dos seres vivos, em três grupos: Corpo, Mente e Alma. Você escolhe seu Domínio ao chegar no nível 3. As habilidades são Imediatas (efeito instantâneo) ou Prolongadas (ficam ativas por 1 minuto; só dá pra manter uma Prolongada por vez) e gastam Pontos de Domínio. Você tem Pontos de Domínio iguais ao seu bônus de proficiência e recupera todos num descanso longo. Usar três habilidades antes de descansar dá 1 nível de exaustão.";
window.DOMINIOS_IGNEA = [
  {
    id: "corpo", nome: "Domínio do Corpo", ic: "💪", d: "Força, resistência e agilidade levadas ao limite.",
    atrs: ["for", "des", "con"],
    ext: { nivel: 6, p: [
      { nome: "Vigor Inabalável", tipo: "Prolongado", a: "acao", d: "Com uma ação, você entra num estado de homeostase perfeita. Enquanto ativo, recupera pontos de vida iguais ao seu modificador de Constituição no início de cada um dos seus turnos e ignora os efeitos de até dois níveis de exaustão." },
      { nome: "Impulso Cinético", tipo: "Imediato", a: "livre", d: "Ao fazer a ação Atacar ou um arremesso, você pode gastar 1 Ponto de Domínio para triplicar o alcance de armas à distância ou saltar até o dobro do seu deslocamento antes de um ataque corpo a corpo. Se o ataque acertar, o alvo faz uma salvaguarda de Força (CD 8 + proficiência + modificador de Força) ou é empurrado 4,5 m e fica caído." },
      { nome: "Sobrecarga Muscular", tipo: "Imediato", a: "bonus", d: "Com uma ação bônus, você pode fazer uma ação adicional de Atacar ou Disparar neste turno. Se usar para atacar, adiciona um dado de dano extra da arma, mas sofre dano necrótico igual ao seu bônus de proficiência pelo esforço extremo das fibras musculares." },
    ] },
    ult: { nivel: 12, p: [
      { nome: "Forma do Colosso", tipo: "Prolongado", a: "bonus", custo: 2, d: "Com uma ação bônus, por 1 minuto você vira Grande: seu alcance corpo a corpo aumenta 1,5 m, seus ataques armados causam +2d8 de dano, você tem resistência a dano cortante, perfurante e de concussão, fica imune a caído, agarrado e contido, e cada acerto empurra o alvo 3 m." },
      { nome: "Tempestade de Golpes", tipo: "Imediato", a: "acao", custo: 2, d: "Com uma ação, você avança até o dobro do seu deslocamento sem provocar ataques de oportunidade e faz um ataque contra cada criatura que passar a até 1,5 m. Cada acerto causa +1d10 de dano e é crítico com 18–20." },
      { nome: "Corpo Imortal", tipo: "Imediato", a: "livre", custo: 2, recarga: "longo", d: "Quando cairia a 0 PV, você fica com metade do seu PV máximo e, até o fim do seu próximo turno, nenhum dano te leva abaixo de 1 PV. Uma vez por descanso longo." },
    ] },
    p: [
      { nome: "Atleta", tipo: "Prolongado", a: "acao", d: "Com uma ação, seu deslocamento aumenta em 3 m (2 quadrados) e você tem vantagem em todos os testes de Atletismo e Acrobacia e em salvaguardas de Força ou Destreza." },
      { nome: "Robusto", tipo: "Imediato", a: "reacao", d: "Ao ser alvo de um ataque, você pode gastar a reação para receber um aumento na CA igual ao seu bônus de proficiência e resistência ao tipo de dano que provocou a habilidade, até o fim do seu próximo turno." },
      { nome: "Frenesi", tipo: "Prolongado", a: "bonus", d: "Com uma ação bônus, seus ataques armados causam dano adicional igual ao seu bônus de proficiência e você recebe pontos de vida temporários iguais ao seu nível + modificador de Constituição. Porém, sua CA diminui em 2." },
    ],
  },
  {
    id: "mente", nome: "Domínio da Mente", ic: "🧠", d: "Percepção afiada, reflexos mentais e magia levada à loucura.",
    atrs: ["int", "sab", "car"],
    ext: { nivel: 6, p: [
      { nome: "Projeção Analítica", tipo: "Prolongado", a: "acao", d: "Com uma ação, você processa todas as variáveis do combate. Enquanto ativo, não pode ter desvantagem em jogadas de ataque e sua margem de crítico aumenta em 1 (se era 20, vira 19–20). Além disso, soma o modificador do atributo aumentado pelo Domínio na iniciativa e nas salvaguardas de Destreza." },
      { nome: "Pulso Psíquico", tipo: "Imediato", a: "reacao", d: "Com uma reação, ao ser alvo de uma magia ou efeito de área, você emite uma interferência mental. Você e os aliados a até 3 m recebem resistência a dano mágico e vantagem na salvaguarda contra esse efeito." },
      { nome: "Sinapse Instantânea", tipo: "Imediato", a: "reacao", d: "Com uma reação, quando uma criatura que você possa ver a até 18 m faz uma ação, você pode gastar 1 Ponto de Domínio para obrigá-la a fazer um teste de Inteligência (CD 8 + proficiência + atributo do Domínio). Se falhar, a criatura perde aquela ação (fica confusa por um instante) e a reação dela é gasta." },
    ] },
    ult: { nivel: 12, p: [
      { nome: "Tempo Partido", tipo: "Prolongado", a: "acao", custo: 2, d: "Com uma ação, sua mente acelera por 1 minuto: em cada turno você ganha uma ação extra (um ataque, Disparar, Desengajar, Esconder, Usar um objeto ou conjurar um truque) e tem duas reações por rodada." },
      { nome: "Marionete", tipo: "Prolongado", a: "acao", custo: 2, d: "Com uma ação, uma criatura a até 18 m faz uma salvaguarda de Inteligência (CD 8 + proficiência + atributo do Domínio). Se falhar, você controla o turno dela (movimento e ação) enquanto durar. Ela repete a salvaguarda toda vez que sofre dano." },
      { nome: "Vislumbre do Futuro", tipo: "Imediato", a: "livre", custo: 1, d: "Sempre que rolar iniciativa, role 3d20 e anote os resultados. Durante o combate, você pode trocar qualquer d20 (seu, de um aliado ou de um inimigo que você veja) por um desses, antes de saber se deu certo. Cada troca gasta 1 Ponto de Domínio." },
    ] },
    p: [
      { nome: "Pressentimento", tipo: "Prolongado", a: "acao", d: "Com uma ação, você pode usar o atributo aumentado pelo Domínio em testes de Intuição e Percepção feitos ao interagir com outros seres, e tem vantagem nesses testes." },
      { nome: "Mente Treinada", tipo: "Imediato", a: "reacao", d: "Ao ser alvo de um ataque, você pode gastar a reação para Esquivar (o ataque tem desvantagem). Se o ataque errar, você troca de iniciativa com o atacante." },
      { nome: "Insanidade", tipo: "Imediato", a: "livre", d: "Como uma ação livre ao conjurar uma magia, você pode gastar vitalidade para adicionar dados extras ao dano e/ou efeito da magia. Cada dado extra causa a você dano psíquico igual à metade do seu nível." },
    ],
  },
  {
    id: "alma", nome: "Domínio da Alma", ic: "✨", d: "Presença que esmaga, vínculo espiritual com a arma e vontade de aço.",
    atrs: ["for", "des", "con", "int", "sab", "car"],
    ext: { nivel: 6, p: [
      { nome: "Ressonância Espiritual", tipo: "Prolongado", a: "acao", d: "Com uma ação, você emite uma aura de 4,5 m. Aliados dentro dela somam seu bônus de proficiência em todas as jogadas de dano. Ao ativar, você também escolhe um tipo de dano elemental (fogo, frio, elétrico ou ácido): os ataques dos aliados na aura causam esse tipo de dano a mais." },
      { nome: "Translocação de Essência", tipo: "Imediato", a: "reacao", d: "Com uma reação, ao sofrer dano, você troca de lugar com uma criatura voluntária ou com uma das suas armas vinculadas a até 12 m, e o dano cai pela metade antes de ser aplicado (em você ou no novo alvo). Se trocar com um inimigo (ele precisa falhar numa salvaguarda de Carisma), ele recebe o dano no seu lugar." },
      { nome: "Sopro de Vida/Morte", tipo: "Imediato", a: "bonus", dano: "2d8", d: "Com uma ação bônus, você toca uma criatura e gasta Pontos de Domínio para escolher:\n• Vida: cura 2d8 + modificador do atributo do Domínio.\n• Morte: adiciona 2d8 de dano necrótico ou radiante ao seu próximo ataque.\nCada Ponto de Domínio extra gasto aumenta em 1d8 (no máximo 3 dados extras)." },
    ] },
    ult: { nivel: 12, p: [
      { nome: "Ascensão", tipo: "Prolongado", a: "acao", custo: 2, d: "Com uma ação, por 1 minuto você vira uma manifestação espiritual: ganha voo igual ao seu deslocamento e seus ataques causam +2d8 de dano radiante ou necrótico. Numa aura de 4,5 m, aliados recuperam PV iguais ao modificador do atributo do Domínio no início do turno deles, e inimigos que começam o turno nela sofrem 2d6 de dano necrótico." },
      { nome: "Retorno da Alma", tipo: "Imediato", a: "acao", custo: 3, recarga: "longo", d: "Com uma ação, você toca uma criatura que morreu há até 1 minuto: ela volta à vida com PV iguais ao seu nível e sem exaustão. Uma vez por descanso longo." },
      { nome: "Lâmina do Espírito", tipo: "Imediato", a: "livre", custo: 1, d: "Sua arma vinculada causa +1d8 de dano de energia e ignora resistências o tempo todo. Uma vez por turno, ao acertar, você pode gastar 1 Ponto de Domínio para se teleportar até 9 m; o alvo faz uma salvaguarda de Carisma ou fica atordoado até o fim do próximo turno dele." },
    ] },
    p: [
      { nome: "Presença Esmagadora", tipo: "Prolongado", a: "acao", d: "Com uma ação, você desperta o senso de mortalidade em criaturas que possa ver a até 18 m (número de alvos igual ao modificador do atributo aumentado pelo Domínio). Cada alvo faz uma salvaguarda de Sabedoria (CD 8 + proficiência + modificador do atributo aumentado pelo Domínio) ou fica amedrontado por você até o efeito acabar. O alvo pode repetir a salvaguarda no fim de cada turno dele; um sucesso encerra o efeito nele e o deixa imune até o próximo descanso longo. Numa falha crítica (1 no d20), o alvo fica inconsciente até o fim do efeito." },
      { nome: "Vínculo Arma e Alma", tipo: "Prolongado", a: "bonus", d: "Com uma ação bônus, você transmite sua energia espiritual para a arma que está empunhando: ela ganha +1 nas jogadas de ataque e dano (a não ser que já seja uma arma mágica com bônus), faz acerto crítico com 19 ou 20 e você não pode ser desarmado dela, a não ser que esteja incapacitado. Se a arma estiver no mesmo plano que você, pode invocá-la com uma ação bônus, e ela se teleporta para a sua mão." },
      { nome: "Alma de Aço", tipo: "Imediato", a: "reacao", d: "Com uma reação, você tem vantagem em jogadas contra efeitos mentais e evita ficar inconsciente." },
    ],
  },
];

import { tr } from './i18n.js';
// Dados inventados do modo demonstração (/demo): um acervo de uns 3 anos, as pessoas com acesso,
// comentários e os sonhos que uma amiga compartilhou. As datas são contadas a partir de hoje,
// para a demonstração parecer sempre recente. Nada daqui vai para o banco.

const DIA = 864e5;

export const EU = { id: 'd0000000-0000-4000-8000-00000000e000', email: 'voce@demonstracao.sonhario.app', nome: tr("Você (demonstração)") };
const MARINA = { id: 'd0000000-0000-4000-8000-00000000a000', email: 'marina.lopes@exemplo.com', nome: 'Marina Lopes' };
const HELENA = { email: 'helena.prado@exemplo.com', nome: 'Helena Prado' };
const TOMAS = { email: 'tomas.ribeiro@exemplo.com', nome: tr("Tomás Ribeiro") };
const BIA = { email: 'bia.castro@exemplo.com', nome: 'Bia Castro' };

const uuid = (n) => 'd0000000-0000-4000-8000-' + String(n).padStart(12, '0');

// Quando foi: dias atrás, o mesmo dia N anos atrás ({ anos }) ou um dia fixo de um ano anterior ({ ano, mes, dia }).
function quando(q, hora = '06:30') {
  const [h, m] = hora.split(':').map(Number);
  const hoje = new Date();
  let d;
  if (typeof q === 'number') d = new Date(Date.now() - q * DIA);
  else if (q.anos) d = new Date(hoje.getFullYear() - q.anos, hoje.getMonth(), hoje.getDate());
  else d = new Date(hoje.getFullYear() + q.ano, q.mes, q.dia);
  d.setHours(h, m, 0, 0);
  // Um dia "fixo" do ano corrente que ainda não chegou vai para o ano anterior.
  if (d > hoje) d.setFullYear(d.getFullYear() - 1);
  return d;
}

// [quando, hora, título, temas, relato, extras]
// extras: st (status), cor, fav, amp (amplificações: [dias depois, texto]), img, sessao, com (quem vê)
const MEUS = [
  [2, '06:42', tr("O porão alagado"), ['casa', tr("água"), tr("avó")],
    tr("Eu estava na casa da minha avó, mas ela tinha um porão que nunca existiu. Desci a escada devagar e a água batia nos joelhos. Não era fria. Boiavam cadernos da escola, todos com a minha letra, e uma lanterna acesa no fundo. Ouvi alguém me chamar lá de cima pelo apelido de criança. Acordei antes de chegar ao último degrau."),
    { st: 'aberto', cor: 'azul', fav: true, sessao: true, img: ['porao'], com: ['helena', 'tomas'], amp: [
      [0.4, tr("O porão me lembra o sonho da casa que Jung conta nas Memórias: descer andar por andar até o mais antigo. Na casa da vó, o lugar proibido era o quartinho dos fundos, não um porão.")],
      [1.2, tr("Os cadernos: no colégio eu escrevia todo dia. Parei quando comecei a trabalhar. A água não assustava, parecia morna como banho de bacia.")],
    ] }],
  [5, '07:10', tr("Ônibus sem ponto final"), ['viagem', 'cidade'],
    tr("Peguei o ônibus para o trabalho, mas ele seguia por ruas que eu não conhecia, ao lado de um rio largo. Perguntei ao motorista onde era o ponto final e ele respondeu que eu sabia. Fiquei olhando pela janela, calmo, sem pressa de descer."),
    { st: 'aberto', cor: 'amarelo', com: ['tomas'], amp: [[0.5, tr("Seguir sem saber onde termina. A calma que apareceu no sonho ainda não aparece acordado.")]] }],
  [6, '06:15', tr("Prova de uma matéria que eu nunca cursei"), ['escola', 'casa'],
    tr("Era dia de prova na faculdade, numa sala que ficava dentro da casa onde cresci. Eu não tinha assistido a nenhuma aula daquela matéria. Os colegas escreviam rápido. Virei a folha e as perguntas eram sobre a minha própria vida."),
    { st: 'aberto', cor: 'lilas' }],
  [8, '05:58', '', [tr("água"), tr("mãe")],
    tr("Minha mãe lavava o meu cabelo numa bacia, como quando eu era pequeno. A água ia ficando escura. Ela dizia que era normal."),
    { st: 'nao_aberto' }],
  [10, '06:30', tr("A casa sem paredes"), ['casa'],
    tr("Era a minha casa de hoje, mas sem as paredes de fora. Dava para ver a rua da cama. Caiu uma chuva forte e ninguém se molhava. Eu queria pôr cortinas e não achava onde pendurar."),
    { st: 'aberto' }],
  [11, '07:45', tr("Visitas na madrugada"), ['casa', 'desconhecido'],
    tr("Tocaram a campainha às três da manhã. Abri e era um grupo de pessoas que eu não conhecia, cada uma com uma mala. Disseram que iam ficar só até a lua sumir. Arrumei colchões pela sala inteira."),
    { st: 'nao_aberto', cor: 'verde' }],
  [13, '06:05', tr("O quarto que eu esqueci"), ['casa', tr("mãe")],
    tr("Descobri um quarto no apartamento que eu tinha esquecido que existia. Estava cheio de coisas da minha mãe, dobradas com cuidado. Senti culpa por ter deixado tudo ali tanto tempo."),
    { st: 'aberto', fav: true, com: ['helena'], amp: [[1, tr("Veio na semana da mudança. Parece o porão: um cômodo da casa que eu não conhecia.")]] }],
  [17, '06:50', tr("Nadando no escuro"), [tr("água"), 'noite'],
    tr("Nadava num lago à noite, sem ver o fundo. A lua fazia um caminho na água e eu seguia por ele. Não tinha medo, só um cansaço bom."),
    { st: 'aberto', cor: 'azul' }],
  [21, '06:20', '', ['trabalho'], tr("Reunião em que todos falavam uma língua que eu quase entendia."), {}],
  [24, '07:30', tr("O cachorro que falava"), ['animal', 'pai'],
    tr("Um cachorro grande e caramelo me seguia pela rua. Quando parei, ele disse, com a voz do meu pai: \"você está indo pelo lado errado\". Voltei, e ele veio junto."),
    { st: 'dar_atencao', cor: 'amarelo', sessao: true, com: ['helena'] }],
  [28, '06:10', tr("Enchente na rua de casa"), [tr("água"), 'cidade'],
    tr("A rua de casa virou um rio. Os vizinhos passavam de barco, acenando, como se fosse feriado. Eu tentava salvar livros e eles flutuavam para longe."),
    { st: 'aberto' }],
  [34, '06:40', tr("A ponte de corda"), ['travessia', tr("água")],
    tr("Atravessava uma ponte de corda sobre um rio barrento. No meio, a ponte virava a escada da casa da minha avó. Cheguei do outro lado molhado e rindo."),
    { st: 'aberto', com: ['tomas'] }],
  [41, '07:05', '', [tr("mãe"), 'casa'], tr("Minha mãe pintava a parede da cozinha de amarelo e me pedia ajuda. A tinta não secava."), {}],
  [47, '06:25', tr("O mar dentro do banheiro"), [tr("água"), 'casa'],
    tr("Abri a porta do banheiro e havia o mar inteiro ali dentro, com ondas e horizonte. Fechei a porta com cuidado para não molhar o corredor."),
    { st: 'aberto', cor: 'azul' }],
  [55, '05:50', tr("A carta"), ['desconhecido'], tr("Recebi uma carta escrita à mão, sem remetente. Era a minha letra."), { st: 'dar_atencao' }],
  [63, '06:35', tr("Dente de leite"), ['corpo'],
    tr("Um dente mole, que eu sabia ser de leite, apesar da idade. Guardei no bolso para mostrar para alguém, mas não lembro para quem."), {}],
  [70, '07:15', tr("Chuva no escritório"), [tr("água"), 'trabalho'],
    tr("Chovia dentro do escritório e ninguém parava de digitar. Abri um guarda-chuva e todos me olharam como se eu estivesse exagerando."),
    { st: 'aberto' }],
  [78, '06:00', '', ['viagem', tr("mãe")], tr("Viajava de trem com a minha mãe para uma cidade de praia que não existe. Ela dormia no meu ombro."), {}],
  [86, '06:45', tr("O elevador que andava de lado"), ['cidade'],
    tr("O elevador do prédio andava para os lados, atravessando os apartamentos dos vizinhos. Cada porta que abria mostrava uma família jantando."), { cor: 'lilas' }],
  [95, '06:20', tr("Atrasado para a apresentação"), ['trabalho'],
    tr("Tinha que apresentar um projeto e não achava o arquivo. Todos esperavam em silêncio. Meu chefe ria sem fazer barulho."), { st: 'aberto' }],
  [101, '07:00', '', ['trabalho', tr("perseguição")], tr("Corria pelos corredores de um prédio comercial fugindo de alguém de terno. Toda porta dava numa sala de reunião."), {}],
  [108, '06:10', tr("O avião que pousou na avenida"), [tr("avião"), 'cidade'],
    tr("Eu estava num avião que pousou no meio de uma avenida, entre os carros. O piloto avisou que dali em diante era a pé."), { st: 'aberto' }],
  [115, '05:55', tr("O envelope branco"), ['trabalho'],
    tr("Todos da empresa recebiam um envelope branco. O meu estava vazio, e eu não sabia se era bom ou ruim."), { st: 'dar_atencao' }],
  [123, '06:30', '', ['trabalho'], tr("Meu computador do trabalho mostrava fotos da minha infância no lugar das planilhas."), {}],
  [131, '07:20', tr("A empresa na casa onde cresci"), ['trabalho', 'casa'],
    tr("A empresa se mudou para a casa onde cresci. Minha mesa ficava no meu antigo quarto, e eu não conseguia trabalhar olhando pela janela."), { st: 'aberto' }],
  [140, '06:05', '', [tr("avião"), 'viagem'], tr("Perdi um voo por ficar arrumando a mala. A mala não fechava, porque tinha coisas que não eram minhas."), {}],
  [150, '06:40', tr("O chefe na praia"), ['trabalho'], tr("Meu chefe aparecia de sunga na praia e queria discutir metas. Eu só queria entrar no mar."), { cor: 'amarelo' }],
  [162, '07:10', tr("A lua vermelha"), ['noite'],
    tr("A lua estava vermelha e enorme, encostada nos prédios. As pessoas fotografavam, e eu sentia que ela olhava para mim."), { st: 'aberto', fav: true }],
  [171, '06:25', '', ['trabalho', tr("água")], tr("Uma reunião numa sala alagada até os tornozelos. Ninguém comentava."), {}],
  [178, '06:00', tr("Cavalo branco no estacionamento"), ['animal'],
    tr("Um cavalo branco, sem dono, no estacionamento do mercado. Ele me deixou fazer carinho no pescoço."), { st: 'aberto', cor: 'verde' }],
  [195, '06:20', '', [tr("avião")], tr("Turbulência forte. Eu segurava a mão de uma senhora desconhecida e ela me contava receitas."), {}],
  [210, '07:00', tr("O enterro de alguém vivo"), ['morte', tr("família")],
    tr("Fui a um enterro e o morto era meu tio, que está vivo. Ele mesmo recebia as pessoas na porta e agradecia a presença."), { st: 'dar_atencao' }],
  [228, '06:45', '', ['casa', tr("mãe"), 'pai'], tr("Almoço de domingo na casa dos meus pais, mas a mesa era comprida demais. Eu não alcançava a comida."), {}],
  [250, '06:30', tr("Voando baixo"), ['voo', 'cidade'],
    tr("Descobri que conseguia voar se corresse antes, mas só até a altura dos postes. Era suficiente para passar por cima do trânsito."), { st: 'aberto', fav: true }],
  [270, '06:10', tr("O irmão que eu não tenho"), [tr("família"), 'desconhecido'],
    tr("Um homem da minha idade sentava à mesa do almoço de domingo e todos o tratavam como meu irmão. Ninguém achava estranho, só eu. Ele me olhava como quem espera que eu diga alguma coisa."),
    { st: 'dar_atencao', cor: 'verde' }],
  [290, '07:15', tr("A escola vazia"), ['escola', tr("criança")],
    tr("Voltei à escola primária à noite. Todas as carteiras eram pequenas, e havia uma criança sentada na minha, desenhando um mapa."), { st: 'aberto' }],
  [{ ano: 0, mes: 0, dia: 18 }, '06:50', tr("Mar de ressaca"), ['mar', tr("água")],
    tr("O mar subia até a calçada e eu ficava parado, deixando a água chegar. As ondas eram mornas e traziam cartas fechadas."), { st: 'aberto', cor: 'azul' }],
  [{ ano: 0, mes: 1, dia: 7 }, '07:30', '', ['mar', 'festa'], tr("Festa na areia, com gente de todas as épocas da minha vida. Ninguém estranhava ninguém."), {}],
  [330, '06:15', tr("Prova oral"), ['escola'],
    tr("Uma professora me fazia perguntas em voz alta na frente da turma. Eu sabia todas as respostas, mas a voz não saía."), {}],
  [{ anos: 1 }, '06:40', tr("O trem que não parava"), ['viagem'],
    tr("Um trem atravessava cidades sem parar em nenhuma estação. Eu tinha um bilhete, mas não lembrava o destino. Pela janela, uma chuva fina caía só de um lado."), { st: 'aberto' }],
  [400, '06:20', '', ['escola', tr("mãe")], tr("Minha mãe ia me buscar na escola, mas eu já era adulto e ela fingia não perceber."), {}],
  [{ ano: -1, mes: 11, dia: 28 }, '07:05', tr("Barcos de papel"), ['mar'],
    tr("Fazia barcos de papel com páginas de um diário e soltava no mar. Eles não afundavam."), { st: 'aberto' }],
  [{ ano: -1, mes: 0, dia: 12 }, '06:35', tr("A baleia"), ['mar', 'animal'],
    tr("Uma baleia passava devagar ao lado do barco, tão perto que eu via o olho dela. Ela parecia me reconhecer."), { st: 'aberto', cor: 'azul', fav: true, img: ['baleia'] }],
  [{ ano: -1, mes: 6, dia: 20 }, '06:55', '', ['mar'], tr("Praia no inverno, vento frio, e eu entrava no mar de roupa."), {}],
  [{ ano: -1, mes: 3, dia: 9 }, '06:10', tr("Turbulência"), [tr("avião")], tr("O avião balançava, e uma voz no alto-falante dizia o meu nome completo."), {}],
  [{ ano: -1, mes: 8, dia: 3 }, '07:20', '', [tr("avião"), tr("mãe")], tr("Minha mãe pilotava o avião e eu era o copiloto. Ela não sabia pilotar, mas estava tudo bem."), {}],
  [{ ano: -1, mes: 4, dia: 22 }, '06:30', tr("A casa da praia"), ['casa'],
    tr("A casa de praia da família tinha virado uma pousada. Me deram a chave do quarto onde eu dormia criança."), { st: 'aberto' }],
  [{ ano: -1, mes: 9, dia: 14 }, '05:45', '', ['cobra'], tr("Uma cobra verde dormia enrolada no meu sapato. Calcei mesmo assim."), {}],
  [{ ano: -1, mes: 1, dia: 27 }, '06:25', tr("Dente quebrado"), ['corpo'], tr("Mordi uma pedra no pão e um dente quebrou. Eu guardava os pedaços num lenço."), {}],
  [{ ano: -1, mes: 7, dia: 2 }, '06:00', '', [tr("perseguição")], tr("Alguém me seguia num mercado enorme. Quando me virei, era eu mesmo, mais velho."), { st: 'dar_atencao' }],
  [{ ano: -1, mes: 10, dia: 2 }, '07:40', tr("Festa de casamento"), ['festa', tr("família")],
    tr("Era o casamento de um primo, mas a noiva usava o vestido da minha avó. Dançamos até amanhecer."), { cor: 'amarelo' }],
  [{ anos: 2 }, '06:15', tr("Neblina na serra"), ['viagem'],
    tr("Dirigia numa estrada de serra com neblina. Os faróis iluminavam só a placa seguinte, e as placas tinham nomes de pessoas que conheci."), { st: 'aberto' }],
  [{ ano: -2, mes: 0, dia: 20 }, '06:40', tr("Ondas gigantes"), ['mar'],
    tr("Ondas enormes vinham na direção da praia e eu corria para um prédio. Lá de cima, elas eram bonitas."), {}],
  [{ ano: -2, mes: 1, dia: 11 }, '07:00', '', ['mar', tr("criança")], tr("Uma criança me ensinava a boiar. Ela dizia que era só confiar."), {}],
  [{ ano: -2, mes: 11, dia: 30 }, '06:50', tr("Sete ondas"), ['mar', 'festa'],
    tr("Pulava sete ondas, e a cada uma ia ficando mais leve, até sair flutuando acima da praia."), { st: 'aberto', fav: true }],
  [{ ano: -2, mes: 3, dia: 5 }, '06:20', tr("O piloto dormindo"), [tr("avião")],
    tr("Fui até a cabine e o piloto dormia. Eu não sabia pilotar e mesmo assim o avião seguia reto."), {}],
  [{ ano: -2, mes: 5, dia: 18 }, '06:35', '', [tr("avião"), 'viagem'], tr("Aeroporto sem portões de embarque. As pessoas esperavam sem saber para onde ir."), {}],
  [{ ano: -2, mes: 2, dia: 14 }, '06:05', tr("A casa da avó à venda"), ['casa', tr("avó")],
    tr("Uma placa de \"vende-se\" na casa da minha avó. Entrei e os móveis ainda estavam lá, cobertos com lençóis."), { st: 'aberto' }],
  [{ ano: -2, mes: 7, dia: 25 }, '06:45', '', ['escola'], tr("Eu procurava a minha sala de aula, e cada corredor dava numa escada."), {}],
  [{ ano: -2, mes: 9, dia: 8 }, '07:10', tr("Chuva de pássaros"), ['animal'],
    tr("Caía uma chuva de pássaros pequenos, que pousavam vivos no chão e saíam andando."), { cor: 'verde' }],
  [{ ano: -2, mes: 6, dia: 1 }, '06:30', '', [tr("mãe"), 'casa'], tr("Minha mãe me esperava acordada na porta de casa, como quando eu chegava tarde."), {}],
  [{ ano: -2, mes: 4, dia: 28 }, '06:15', tr("A cobra na escada"), ['cobra', 'casa'],
    tr("Uma cobra subia a escada de casa degrau por degrau. Não era perigosa, só tinha pressa."), {}],
  [{ ano: -2, mes: 8, dia: 16 }, '06:55', '', ['trabalho'], tr("Primeiro dia num emprego novo. Ninguém me explicava o que eu tinha que fazer."), {}],
  [{ ano: -3, mes: 7, dia: 9 }, '06:20', tr("A casa com um andar a mais"), ['casa'],
    tr("A casa onde cresci tinha um andar que eu nunca tinha visto. Subi por uma escada estreita e encontrei uma biblioteca empoeirada, com os livros em ordem alfabética do meu nome. Acordei com a sensação de ter achado algo importante."),
    { st: 'aberto', cor: 'marrom', fav: true, img: ['casa'], com: ['helena'], amp: [[2, tr("O primeiro sonho que anotei. A biblioteca: meu avô lia muito, e eu nunca entrei no escritório dele.")]] }],
  [{ ano: -3, mes: 8, dia: 21 }, '07:05', '', [tr("avião")], tr("Um avião de papel enorme, em que cabiam várias pessoas. Eu tinha medo de que chovesse."), {}],
  [{ ano: -3, mes: 9, dia: 30 }, '06:40', tr("Duas luas"), ['noite'],
    tr("Havia duas luas no céu, uma cheia e uma minguante. Eu tentava explicar para alguém que isso não era normal."), { cor: 'lilas' }],
  [{ ano: -3, mes: 10, dia: 12 }, '06:10', '', ['escola'], tr("Prova de matemática, e eu tinha esquecido como se escreve o número sete."), {}],
  [{ ano: -3, mes: 11, dia: 26 }, '07:30', tr("Natal na casa vazia"), ['casa', tr("família")],
    tr("Ceia de Natal na casa da minha avó, mas sem ninguém. A mesa posta, as velas acesas."), { st: 'aberto' }],
];

const PESSOAS = { helena: HELENA, tomas: TOMAS };

// O sonho que o link /demo abre primeiro.
export const SONHO_DESTAQUE = uuid(1);

function montarSonho([q, hora, titulo, temas, texto, x], i, dono = EU) {
  const d = quando(q, hora);
  const iso = d.toISOString();
  const id = dono === EU ? uuid(i + 1) : uuid(900 + i);
  return {
    id, user_id: dono.id, sonhado_em: iso, criado_em: iso, atualizado_em: iso,
    titulo, texto, temas: temas.map((t) => tr(t)), status: x.st || 'nao_aberto', cor: x.cor || 'branco', favorito: !!x.fav,
    levar_sessao: !!x.sessao, audio: null, apagado_em: null,
    conclusoes: (x.amp || []).map(([depois, t], k) => ({ id: id + '-a' + k, em: new Date(+d + depois * DIA).toISOString(), texto: t })),
    imagens: (x.img || []).map((nome) => ({ ref: 'demo/' + nome + '.svg', nome: nome + '.svg', largura: 800, altura: 600 })),
    compartilhado_com: (x.com || []).map((p) => PESSOAS[p].email),
  };
}

const DA_MARINA = [
  [3, '07:20', tr("A biblioteca submersa"), [tr("água"), 'amiga'],
    tr("Eu e você (é, você estava lá) nadávamos dentro de uma biblioteca alagada. Os livros não molhavam. Você procurava um livro específico e não dizia qual."),
    { st: 'aberto', amp: [[0.3, tr("Lembrei de você porque falamos de livros na quarta. Mandei porque achei que você ia gostar da imagem.")]] }],
  [9, '06:45', tr("O jardim da minha mãe"), [tr("mãe"), 'jardim'],
    tr("Minha mãe cuidava de um jardim que crescia enquanto ela falava. Cada planta tinha o nome de uma tia. Ela me pedia para regar a que estava murcha, e eu não achava o regador."), { st: 'aberto' }],
  [20, '06:10', '', ['viagem'], tr("Perdi o celular num aeroporto e, sem ele, fiquei tranquila pela primeira vez em anos."), {}],
];

export function dadosIniciais() {
  const sonhos = MEUS.map((s, i) => montarSonho(s, i));
  const daMarina = DA_MARINA.map((s, i) => ({ ...montarSonho(s, i, MARINA), compartilhado_com: [EU.email] }));
  const agora = Date.now();
  const iso = (diasAtras) => new Date(agora - diasAtras * DIA).toISOString();
  const base = { dono_id: EU.id, dono_nome: EU.nome, dono_email: EU.email, escopo: 'escolhidos', pendente: false, sonhos_pedidos: [], eh_terapeuta: false };
  const compartilhamentos = [
    { ...base, id: uuid(501), convidado_email: HELENA.email, convidado_nome: HELENA.nome, papel: 'terapeuta', ver_amplificacoes: true, eh_terapeuta: true, criado_em: iso(420) },
    { ...base, id: uuid(502), convidado_email: TOMAS.email, convidado_nome: TOMAS.nome, papel: 'amigo', ver_amplificacoes: false, criado_em: iso(60) },
    // Abriu o link de um sonho e espera aprovação.
    { ...base, id: uuid(503), convidado_email: BIA.email, convidado_nome: '', papel: 'amigo', ver_amplificacoes: false, pendente: true, sonhos_pedidos: [uuid(8)], criado_em: iso(1) },
    // Marina compartilhou sonhos comigo.
    { ...base, id: uuid(504), dono_id: MARINA.id, dono_nome: MARINA.nome, dono_email: MARINA.email, convidado_email: EU.email, convidado_nome: tr("Você"), papel: 'amigo', ver_amplificacoes: true, criado_em: iso(30) },
  ];
  const perfis = [HELENA, TOMAS, BIA, MARINA].map((p) => ({ email: p.email, nome: p.nome, foto: '' }));
  // Comentário de N dias atrás numa hora do dia; o de hoje fica no máximo uma hora antes de agora.
  const emHora = (dias, hora) => {
    const [h, m] = hora.split(':').map(Number);
    const d = new Date(agora - dias * DIA); d.setHours(h, m, 0, 0);
    return new Date(Math.min(+d, agora - 36e5)).toISOString();
  };
  const c = (n, sonho, dono, leitor, autor, autorNome, texto, [dias, hora], visto, privado = false) => ({
    id: uuid(700 + n), sonho_id: sonho, dono_id: dono, leitor_email: leitor, autor_id: autor, autor_nome: autorNome, autor_foto: '',
    texto, privado, visto, criado_em: emHora(dias, hora), editado_em: null,
  });
  const H = 'd0000000-0000-4000-8000-0000000b0001', T = 'd0000000-0000-4000-8000-0000000b0002';
  const comentarios = [
    c(1, uuid(1), EU.id, HELENA.email, H, HELENA.nome, tr("O porão aparece em outros sonhos seus? Lembro de você contar da casa da sua avó na nossa primeira conversa."), [1, '19:40'], true),
    c(2, uuid(1), EU.id, HELENA.email, EU.id, EU.nome, tr("Aparece! Tem um de 2023 em que a casa ganha um andar a mais. Vou levar os dois para a sessão."), [1, '21:15'], true),
    c(3, uuid(1), EU.id, HELENA.email, H, HELENA.nome, tr("Traga também os cadernos: quero ouvir o que você lembra daquela época."), [0, '07:50'], false),
    c(4, uuid(1), EU.id, TOMAS.email, T, TOMAS.nome, tr("Esse apelido de criança me pegou. Quem chamava você assim?"), [1, '22:30'], false),
    c(5, uuid(2), EU.id, TOMAS.email, T, TOMAS.nome, tr("O motorista dizendo que você sabia me deu arrepio. Sonhei com ônibus semana passada também."), [4, '12:10'], true),
    c(6, uuid(2), EU.id, TOMAS.email, EU.id, EU.nome, tr("Haha, a gente devia comparar os mapas."), [4, '12:32'], true),
    c(7, uuid(900), MARINA.id, EU.email, EU.id, EU.nome, tr("Que imagem! Os livros que não molham… fiquei pensando nisso o dia todo."), [2, '18:05'], true),
    c(8, uuid(900), MARINA.id, EU.email, MARINA.id, MARINA.nome, tr("Né? Quando acordei, fui direto anotar antes que sumisse."), [0, '07:20'], false),
    c(9, uuid(901), MARINA.id, EU.email, EU.id, EU.nome, tr("Perguntar à Marina se o jardim é o da casa da infância dela."), [8, '09:00'], true, true),
  ];
  return { sonhos, daMarina, compartilhamentos, perfis, comentarios };
}

// Desenhos dos sonhos, como quem rabisca no caderno ao acordar.
const papel = (conteudo) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#F6F3EC"/><g fill="none" stroke="#2B2B2B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${conteudo}</g></svg>`;
const DESENHOS = {
  porao: papel(
    '<path d="M120 90 H680 V520 H120 Z" stroke-width="3" opacity=".35"/>' +
    '<path d="M200 120 h90 v60 h90 v60 h90 v60 h90 v60"/>' +
    '<rect x="120" y="380" width="560" height="140" fill="#9CC8F5" fill-opacity=".55" stroke="none"/>' +
    '<path d="M130 380 q35 -14 70 0 t70 0 t70 0 t70 0 t70 0 t70 0 t70 0 t70 0" stroke="#1F5FA8"/>' +
    '<path d="M250 430 l60 -10 l8 30 l-60 10 z M420 455 l55 6 l-4 28 l-55 -6 z M560 425 l45 -14 l9 26 l-45 14 z" fill="#fff"/>' +
    '<circle cx="600" cy="490" r="14" fill="#F2C94C" stroke="#B8860B"/>' +
    '<path d="M600 470 v-20 M585 478 l-12 -12 M615 478 l12 -12" stroke="#B8860B" stroke-width="3"/>'),
  casa: papel(
    '<path d="M230 520 V300 L400 170 L570 300 V520 Z"/>' +
    '<path d="M300 300 h200 M300 300 V180 M500 300 V180 M300 180 h200" stroke-dasharray="12 10"/>' +
    '<path d="M280 180 L400 90 L520 180"/>' +
    '<rect x="370" y="420" width="60" height="100"/><rect x="270" y="360" width="60" height="50"/><rect x="470" y="360" width="60" height="50"/>' +
    '<path d="M330 230 h40 M330 250 h40 M430 230 h40 M430 250 h40" stroke-width="3"/>' +
    '<text x="560" y="140" font-family="Georgia, serif" font-size="30" fill="#2B2B2B" stroke="none">o andar a mais?</text>'),
  baleia: papel(
    '<rect x="0" y="330" width="800" height="270" fill="#9CC8F5" fill-opacity=".45" stroke="none"/>' +
    '<path d="M0 330 q50 -16 100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0" stroke="#1F5FA8"/>' +
    '<path d="M180 400 q140 -110 330 -20 q60 30 90 -10 q-10 50 -50 60 q-150 90 -370 -30 z" fill="#5B7A99" fill-opacity=".5"/>' +
    '<circle cx="260" cy="410" r="7" fill="#2B2B2B"/>' +
    '<path d="M560 250 l140 0 l-30 50 l-80 0 z M630 250 v-120 l60 110"/>'),
};

export function urlDesenho(ref) {
  const nome = String(ref).replace(/^demo\//, '').replace(/\.svg$/, '');
  return DESENHOS[nome] ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(DESENHOS[nome]) : null;
}

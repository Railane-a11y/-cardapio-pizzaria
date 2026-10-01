/* ==========================================================================
   CONFIGURAÇÃO DA CASA DAS PIZZAS
   Este é o único arquivo que você precisa editar para mudar preços, sabores,
   ofertas, banners ou abrir/fechar a loja.
   ========================================================================== */

const CONFIG = {
  // 'aberto' ou 'fechado'. Em 'fechado' aparece um aviso cobrindo o site.
  statusLoja: 'aberto',

  nomeExibicao: 'Casa das Pizzas',
  whatsapp: '5598970100184',
  whatsappExibicao: '(98) 97010-0184',

  mensagemFechado: {
    titulo: 'Pizzas esgotadas por hoje',
    texto: 'Agradecemos a preferência! Hoje a procura foi grande e nossas massas acabaram.',
    retorno: 'Voltamos segunda-feira com tudo!'
  },

  pix: { chave: '98970100184', nome: 'Francisco de Sousa' },

  // Aparecem no rodapé do site
  endereco: 'Av. Antônio Bacelar, Centro, Afonso Cunha - MA',
  horario: 'Segunda a domingo, das 19h às 23h',
  atendimento: 'Delivery, retirada e atendimento no local',
  instagram: 'casadaspizzaass'
};

/* --------------------------------------------------------------------------
   BANNER DE FOTOS
   Para trocar ou adicionar uma foto: coloque o arquivo na pasta img/banners/
   e inclua uma linha abaixo.
     imagem: foto para computador (horizontal, ideal 1600 x 640 px)
     mobile: foto para celular (quadrada, ideal 800 x 800 px). Opcional:
             se não existir, a foto "imagem" é usada também no celular.
     titulo / texto: legenda que aparece sobre a foto (opcional)
   Mantenha cada foto abaixo de 250 KB para o site abrir rápido.
   -------------------------------------------------------------------------- */
const BANNERS = [
  { imagem: 'img/banners/calabresa-requeijao-desktop.jpg', mobile: 'img/banners/calabresa-requeijao-mobile.jpg', titulo: 'Calabresa com Requeijão', texto: 'Calabresa, catupiry e orégano' },
  { imagem: 'img/banners/calabresa-desktop.jpg',         mobile: 'img/banners/calabresa-mobile.jpg',         titulo: 'Calabresa',                texto: 'Mussarela, calabresa e orégano' },
  { imagem: 'img/banners/carne-seca-desktop.jpg',        mobile: 'img/banners/carne-seca-mobile.jpg',        titulo: 'Carne Seca',               texto: 'Mussarela, carne seca e requeijão cremoso' },
  { imagem: 'img/banners/frango-requeijao-desktop.jpg',  mobile: 'img/banners/frango-requeijao-mobile.jpg',  titulo: 'Frango com Requeijão',     texto: 'Frango, mussarela, requeijão e orégano' },
  { imagem: 'img/banners/portuguesa-desktop.jpg',        mobile: 'img/banners/portuguesa-mobile.jpg',        titulo: 'Portuguesa',               texto: 'Mortadela Perdigão, ovos e mussarela' },
  { imagem: 'img/banners/calabresa-frango-desktop.jpg',  mobile: 'img/banners/calabresa-frango-mobile.jpg',  titulo: 'Calabresa e Frango',       texto: 'Dois sabores na mesma pizza' },
  { imagem: 'img/banners/frango-carne-seca-desktop.jpg', mobile: 'img/banners/frango-carne-seca-mobile.jpg', titulo: 'Frango e Carne Seca',      texto: 'Dois sabores na mesma pizza' },
  { imagem: 'img/banners/queijo-calabresa-desktop.jpg',  mobile: 'img/banners/queijo-calabresa-mobile.jpg',  titulo: 'Queijo e Calabresa',       texto: 'Dois sabores na mesma pizza' }
];

/* --------------------------------------------------------------------------
   CARDÁPIO
   pizza(nome, selo, descrição, preçoP, preçoM, preçoG)
   selo: 'Tradicional' | 'Especial' | 'Premium'
   -------------------------------------------------------------------------- */
const FATIAS = { P: 4, M: 6, G: 8 };

const pizza = (nome, selo, descricao, p, m, g) => ({
  nome, selo, descricao,
  precos: [
    { rotulo: 'P', detalhe: `${FATIAS.P} fatias`, valor: p },
    { rotulo: 'M', detalhe: `${FATIAS.M} fatias`, valor: m },
    { rotulo: 'G', detalhe: `${FATIAS.G} fatias`, valor: g }
  ]
});

const CATEGORIAS = [
  {
    id: 'destaques',
    titulo: 'Destaques da Casa',
    subtitulo: 'As mais pedidas',
    tema: 'claro',
    itens: [
      pizza('Calabresa com Requeijão', 'Especial', 'Calabresa, catupiry e orégano.', 40.00, 45.00, 49.90),
      pizza('Portuguesa', 'Especial', 'Mortadela Perdigão, ovos e mussarela.', 40.00, 45.00, 49.90),
      pizza('Calabresa', 'Tradicional', 'Mussarela, calabresa e orégano.', 34.90, 39.90, 45.00),
      pizza('Frango', 'Tradicional', 'Mussarela, frango desfiado e orégano.', 34.90, 39.90, 45.00),
      pizza('Frango com Requeijão Normal', 'Especial', 'Frango, requeijão cremoso e orégano.', 40.00, 45.00, 49.90),
      pizza('Calabresa Paulista', 'Tradicional', 'Calabresa, molho de tomate e orégano.', 29.90, 34.90, 39.90)
    ]
  },
  {
    id: 'especiais',
    titulo: 'Variedades Especiais',
    subtitulo: 'Experimente novos sabores',
    tema: 'neutro',
    itens: [
      pizza('Pizza de Queijo', 'Tradicional', 'Mussarela, queijo coalho, parmesão e requeijão cremoso.', 34.90, 39.90, 45.00),
      pizza('Moda da Casa', 'Especial', 'Mussarela, frango desfiado, bacon e orégano.', 40.00, 45.00, 49.90),
      pizza('Clássica da Casa', 'Tradicional', 'Mussarela, mortadela Perdigão e orégano.', 34.90, 39.90, 45.00)
    ]
  },
  {
    id: 'premium',
    titulo: 'Linha Premium',
    subtitulo: 'Exclusivas e sofisticadas',
    tema: 'escuro',
    itens: [
      pizza('Frango com Requeijão', 'Premium', 'Frango, mussarela, requeijão e orégano.', 48.00, 53.00, 58.00),
      pizza('Carne Seca', 'Premium', 'Mussarela, carne seca e requeijão cremoso.', 48.00, 53.00, 58.00)
    ]
  },
  {
    id: 'bordas',
    titulo: 'Bordas Recheadas',
    subtitulo: '',
    tema: 'claro',
    itens: [
      {
        nome: 'Bordas Especiais', selo: '', descricao: 'Catupiry e Cheddar',
        precos: [
          { rotulo: 'M', detalhe: '', valor: 10.00 },
          { rotulo: 'G', detalhe: '', valor: 12.00 }
        ]
      }
    ]
  },
  {
    id: 'bebidas',
    titulo: 'Bebidas',
    subtitulo: '',
    tema: 'neutro',
    itens: [
      {
        nome: 'Refrigerantes', selo: '', descricao: 'Coca-Cola e Guaraná',
        precos: [
          { rotulo: '1 Litro', detalhe: '', valor: 10.00 },
          { rotulo: '2 Litros', detalhe: '', valor: 15.00 }
        ]
      }
    ]
  }
];

/* --------------------------------------------------------------------------
   OFERTA DO DIA
   Os preços abaixo são usados SOMENTE para calcular a oferta do dia.
   dia: 0 = domingo ... 6 = sábado
   -------------------------------------------------------------------------- */
const PRODUTOS_OFERTA = {
  calabresa:         { nome: 'Pizza de Calabresa (G)',               preco: 44.90 },
  calabresacatupiry: { nome: 'Pizza de Calabresa com Catupiry (G)',  preco: 49.90 },
  frangorequeijao:   { nome: 'Pizza de Frango com Requeijão (G)',    preco: 49.90 },
  portuguesa:        { nome: 'Pizza Portuguesa (G)',                 preco: 49.90 },
  quatroqueijos:     { nome: 'Pizza 4 Queijos (G)',                  preco: 44.90 },
  modadacasa:        { nome: 'Pizza Moda da Casa (G)',               preco: 49.90 },
  calabresapaulista: { nome: 'Pizza Calabresa Paulista (G)',         preco: 35.90 },
  guarana2l:         { nome: 'Guaraná 2L',                           preco: 14.00 },
  bordacatupiry:     { nome: 'Borda de Catupiry',                    preco: 12.00 }
};

const OFERTAS_DA_SEMANA = [
  { dia: 0, titulo: 'Domingão em Família',  itens: ['portuguesa', 'guarana2l'],                      desconto: 0.05 },
  { dia: 1, titulo: 'Segunda da Economia',  itens: ['calabresapaulista', 'guarana2l'],               desconto: 0.05 },
  { dia: 2, titulo: 'Terça do Clássico',    itens: ['calabresa', 'guarana2l'],                       desconto: 0.05 },
  { dia: 3, titulo: 'Quarta do Futebol',    itens: ['quatroqueijos', 'guarana2l', 'bordacatupiry'],  desconto: 0.0518 },
  { dia: 4, titulo: 'Quinta Especial',      itens: ['frangorequeijao', 'guarana2l'],                 desconto: 0.05 },
  { dia: 5, titulo: 'Sextou com Pizza',     itens: ['calabresacatupiry', 'guarana2l'],               desconto: 0.05 },
  { dia: 6, titulo: 'Sabadão Imperdível',   itens: ['modadacasa', 'guarana2l'],                      desconto: 0.05 }
];

/* ==========================================================================
   CONTEÚDO INICIAL DO SITE
   Este arquivo é só o "plano B": é usado se o painel ainda não foi ativado
   ou se o site ficar sem internet. Para mudar preços, fotos, ofertas e
   textos use o PAINEL em /admin (não é preciso editar este arquivo).
   ========================================================================== */

const CONTEUDO_PADRAO = {
  "versao": 1,
  "loja": {
    "status": "aberto",
    "mensagemFechado": {
      "titulo": "Pizzas esgotadas por hoje",
      "texto": "Agradecemos a preferência! Hoje a procura foi grande e nossas massas acabaram.",
      "retorno": "Voltamos segunda-feira com tudo!"
    }
  },
  "aviso": {
    "ativo": false,
    "texto": ""
  },
  "marca": {
    "nome": "Casa das Pizzas",
    "slogan": "As melhores pizzas da cidade",
    "faixaEntrega": "Entrega grátis para toda a cidade",
    "logo": ""
  },
  "contato": {
    "whatsapp": "5598970100184",
    "whatsappExibicao": "(98) 97010-0184",
    "endereco": "Av. Antônio Bacelar, Centro, Afonso Cunha - MA",
    "horario": "Segunda a domingo, das 19h às 23h",
    "atendimento": "Delivery, retirada e atendimento no local",
    "instagram": "casadaspizzaass"
  },
  "pix": {
    "chave": "98970100184",
    "nome": "Francisco de Sousa"
  },
  "banners": [
    {
      "ativo": true,
      "imagem": "img/banners/calabresa-requeijao-desktop.jpg",
      "mobile": "img/banners/calabresa-requeijao-mobile.jpg",
      "titulo": "Calabresa com Requeijão",
      "texto": "Calabresa, catupiry e orégano"
    },
    {
      "ativo": true,
      "imagem": "img/banners/calabresa-desktop.jpg",
      "mobile": "img/banners/calabresa-mobile.jpg",
      "titulo": "Calabresa",
      "texto": "Mussarela, calabresa e orégano"
    },
    {
      "ativo": true,
      "imagem": "img/banners/carne-seca-desktop.jpg",
      "mobile": "img/banners/carne-seca-mobile.jpg",
      "titulo": "Carne Seca",
      "texto": "Mussarela, carne seca e requeijão cremoso"
    },
    {
      "ativo": true,
      "imagem": "img/banners/frango-requeijao-desktop.jpg",
      "mobile": "img/banners/frango-requeijao-mobile.jpg",
      "titulo": "Frango com Requeijão",
      "texto": "Frango, mussarela, requeijão e orégano"
    },
    {
      "ativo": true,
      "imagem": "img/banners/portuguesa-desktop.jpg",
      "mobile": "img/banners/portuguesa-mobile.jpg",
      "titulo": "Portuguesa",
      "texto": "Mortadela Perdigão, ovos e mussarela"
    },
    {
      "ativo": true,
      "imagem": "img/banners/calabresa-frango-desktop.jpg",
      "mobile": "img/banners/calabresa-frango-mobile.jpg",
      "titulo": "Calabresa e Frango",
      "texto": "Dois sabores na mesma pizza"
    },
    {
      "ativo": true,
      "imagem": "img/banners/frango-carne-seca-desktop.jpg",
      "mobile": "img/banners/frango-carne-seca-mobile.jpg",
      "titulo": "Frango e Carne Seca",
      "texto": "Dois sabores na mesma pizza"
    },
    {
      "ativo": true,
      "imagem": "img/banners/queijo-calabresa-desktop.jpg",
      "mobile": "img/banners/queijo-calabresa-mobile.jpg",
      "titulo": "Queijo e Calabresa",
      "texto": "Dois sabores na mesma pizza"
    }
  ],
  "categorias": [
    {
      "id": "destaques",
      "titulo": "Destaques da Casa",
      "rotuloMenu": "Destaques",
      "subtitulo": "As mais pedidas",
      "tema": "claro",
      "visivel": true,
      "itens": [
        {
          "nome": "Calabresa com Requeijão",
          "selo": "Especial",
          "descricao": "Calabresa, catupiry e orégano.",
          "disponivel": true,
          "precos": [
            {
              "rotulo": "P",
              "detalhe": "4 fatias",
              "valor": 40
            },
            {
              "rotulo": "M",
              "detalhe": "6 fatias",
              "valor": 45
            },
            {
              "rotulo": "G",
              "detalhe": "8 fatias",
              "valor": 49.9
            }
          ]
        },
        {
          "nome": "Portuguesa",
          "selo": "Especial",
          "descricao": "Mortadela Perdigão, ovos e mussarela.",
          "disponivel": true,
          "precos": [
            {
              "rotulo": "P",
              "detalhe": "4 fatias",
              "valor": 40
            },
            {
              "rotulo": "M",
              "detalhe": "6 fatias",
              "valor": 45
            },
            {
              "rotulo": "G",
              "detalhe": "8 fatias",
              "valor": 49.9
            }
          ]
        },
        {
          "nome": "Calabresa",
          "selo": "Tradicional",
          "descricao": "Mussarela, calabresa e orégano.",
          "disponivel": true,
          "precos": [
            {
              "rotulo": "P",
              "detalhe": "4 fatias",
              "valor": 34.9
            },
            {
              "rotulo": "M",
              "detalhe": "6 fatias",
              "valor": 39.9
            },
            {
              "rotulo": "G",
              "detalhe": "8 fatias",
              "valor": 45
            }
          ]
        },
        {
          "nome": "Frango",
          "selo": "Tradicional",
          "descricao": "Mussarela, frango desfiado e orégano.",
          "disponivel": true,
          "precos": [
            {
              "rotulo": "P",
              "detalhe": "4 fatias",
              "valor": 34.9
            },
            {
              "rotulo": "M",
              "detalhe": "6 fatias",
              "valor": 39.9
            },
            {
              "rotulo": "G",
              "detalhe": "8 fatias",
              "valor": 45
            }
          ]
        },
        {
          "nome": "Frango com Requeijão Normal",
          "selo": "Especial",
          "descricao": "Frango, requeijão cremoso e orégano.",
          "disponivel": true,
          "precos": [
            {
              "rotulo": "P",
              "detalhe": "4 fatias",
              "valor": 40
            },
            {
              "rotulo": "M",
              "detalhe": "6 fatias",
              "valor": 45
            },
            {
              "rotulo": "G",
              "detalhe": "8 fatias",
              "valor": 49.9
            }
          ]
        },
        {
          "nome": "Calabresa Paulista",
          "selo": "Tradicional",
          "descricao": "Calabresa, molho de tomate e orégano.",
          "disponivel": true,
          "precos": [
            {
              "rotulo": "P",
              "detalhe": "4 fatias",
              "valor": 29.9
            },
            {
              "rotulo": "M",
              "detalhe": "6 fatias",
              "valor": 34.9
            },
            {
              "rotulo": "G",
              "detalhe": "8 fatias",
              "valor": 39.9
            }
          ]
        }
      ]
    },
    {
      "id": "especiais",
      "titulo": "Variedades Especiais",
      "rotuloMenu": "Especiais",
      "subtitulo": "Experimente novos sabores",
      "tema": "neutro",
      "visivel": true,
      "itens": [
        {
          "nome": "Pizza de Queijo",
          "selo": "Tradicional",
          "descricao": "Mussarela, queijo coalho, parmesão e requeijão cremoso.",
          "disponivel": true,
          "precos": [
            {
              "rotulo": "P",
              "detalhe": "4 fatias",
              "valor": 34.9
            },
            {
              "rotulo": "M",
              "detalhe": "6 fatias",
              "valor": 39.9
            },
            {
              "rotulo": "G",
              "detalhe": "8 fatias",
              "valor": 45
            }
          ]
        },
        {
          "nome": "Moda da Casa",
          "selo": "Especial",
          "descricao": "Mussarela, frango desfiado, bacon e orégano.",
          "disponivel": true,
          "precos": [
            {
              "rotulo": "P",
              "detalhe": "4 fatias",
              "valor": 40
            },
            {
              "rotulo": "M",
              "detalhe": "6 fatias",
              "valor": 45
            },
            {
              "rotulo": "G",
              "detalhe": "8 fatias",
              "valor": 49.9
            }
          ]
        },
        {
          "nome": "Clássica da Casa",
          "selo": "Tradicional",
          "descricao": "Mussarela, mortadela Perdigão e orégano.",
          "disponivel": true,
          "precos": [
            {
              "rotulo": "P",
              "detalhe": "4 fatias",
              "valor": 34.9
            },
            {
              "rotulo": "M",
              "detalhe": "6 fatias",
              "valor": 39.9
            },
            {
              "rotulo": "G",
              "detalhe": "8 fatias",
              "valor": 45
            }
          ]
        }
      ]
    },
    {
      "id": "premium",
      "titulo": "Linha Premium",
      "rotuloMenu": "Premium",
      "subtitulo": "Exclusivas e sofisticadas",
      "tema": "escuro",
      "visivel": true,
      "itens": [
        {
          "nome": "Frango com Requeijão",
          "selo": "Premium",
          "descricao": "Frango, mussarela, requeijão e orégano.",
          "disponivel": true,
          "precos": [
            {
              "rotulo": "P",
              "detalhe": "4 fatias",
              "valor": 48
            },
            {
              "rotulo": "M",
              "detalhe": "6 fatias",
              "valor": 53
            },
            {
              "rotulo": "G",
              "detalhe": "8 fatias",
              "valor": 58
            }
          ]
        },
        {
          "nome": "Carne Seca",
          "selo": "Premium",
          "descricao": "Mussarela, carne seca e requeijão cremoso.",
          "disponivel": true,
          "precos": [
            {
              "rotulo": "P",
              "detalhe": "4 fatias",
              "valor": 48
            },
            {
              "rotulo": "M",
              "detalhe": "6 fatias",
              "valor": 53
            },
            {
              "rotulo": "G",
              "detalhe": "8 fatias",
              "valor": 58
            }
          ]
        }
      ]
    },
    {
      "id": "bordas",
      "titulo": "Bordas Recheadas",
      "rotuloMenu": "Bordas",
      "subtitulo": "",
      "tema": "claro",
      "visivel": true,
      "itens": [
        {
          "nome": "Bordas Especiais",
          "selo": "",
          "descricao": "Catupiry e Cheddar",
          "disponivel": true,
          "precos": [
            {
              "rotulo": "M",
              "detalhe": "",
              "valor": 10
            },
            {
              "rotulo": "G",
              "detalhe": "",
              "valor": 12
            }
          ]
        }
      ]
    },
    {
      "id": "bebidas",
      "titulo": "Bebidas",
      "rotuloMenu": "Bebidas",
      "subtitulo": "",
      "tema": "neutro",
      "visivel": true,
      "itens": [
        {
          "nome": "Refrigerantes",
          "selo": "",
          "descricao": "Coca-Cola e Guaraná",
          "disponivel": true,
          "precos": [
            {
              "rotulo": "1 Litro",
              "detalhe": "",
              "valor": 10
            },
            {
              "rotulo": "2 Litros",
              "detalhe": "",
              "valor": 15
            }
          ]
        }
      ]
    }
  ],
  "ofertas": [
    {
      "dia": 0,
      "ativo": true,
      "titulo": "Domingão em Família",
      "descricao": "Pizza Portuguesa (G) + Guaraná 2L",
      "de": 63.9,
      "por": 60.71
    },
    {
      "dia": 1,
      "ativo": true,
      "titulo": "Segunda da Economia",
      "descricao": "Pizza Calabresa Paulista (G) + Guaraná 2L",
      "de": 49.9,
      "por": 47.4
    },
    {
      "dia": 2,
      "ativo": true,
      "titulo": "Terça do Clássico",
      "descricao": "Pizza de Calabresa (G) + Guaraná 2L",
      "de": 58.9,
      "por": 55.96
    },
    {
      "dia": 3,
      "ativo": true,
      "titulo": "Quarta do Futebol",
      "descricao": "Pizza 4 Queijos (G) + Guaraná 2L + Borda de Catupiry",
      "de": 70.9,
      "por": 67.23
    },
    {
      "dia": 4,
      "ativo": true,
      "titulo": "Quinta Especial",
      "descricao": "Pizza de Frango com Requeijão (G) + Guaraná 2L",
      "de": 63.9,
      "por": 60.71
    },
    {
      "dia": 5,
      "ativo": true,
      "titulo": "Sextou com Pizza",
      "descricao": "Pizza de Calabresa com Catupiry (G) + Guaraná 2L",
      "de": 63.9,
      "por": 60.71
    },
    {
      "dia": 6,
      "ativo": true,
      "titulo": "Sabadão Imperdível",
      "descricao": "Pizza Moda da Casa (G) + Guaraná 2L",
      "de": 63.9,
      "por": 60.71
    }
  ]
};

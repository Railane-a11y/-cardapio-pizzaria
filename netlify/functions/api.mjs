/* ==========================================================================
   API da Casa das Pizzas (Netlify Function)
   - Guarda o conteúdo do site (preços, fotos, ofertas...) no Netlify Blobs
   - Protege o painel com senha (variável de ambiente ADMIN_PASSWORD)

   Rotas:
     GET  /api/conteudo           público   conteúdo publicado do site
     GET  /api/img/:id            público   foto enviada pelo painel
     POST /api/admin/login        senha     devolve um token de acesso
     GET  /api/admin/conteudo     token     conteúdo atual + dados do painel
     PUT  /api/admin/conteudo     token     salva e publica
     POST /api/admin/restaurar    token     volta para a versão anterior
     POST /api/admin/imagem       token     envia uma foto
   ========================================================================== */

import { getStore } from '@netlify/blobs';
import { createHmac, createHash, timingSafeEqual, randomBytes } from 'node:crypto';

export const config = { path: '/api/*' };

const VALIDADE_TOKEN_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 15 * 60 * 1000;
const MAX_IMAGEM = 1_500_000;

const dados = () => getStore({ name: 'casa-das-pizzas', consistency: 'strong' });
const imagens = () => getStore({ name: 'imagens', consistency: 'strong' });

/* ---------- Respostas ---------- */
const CABECALHOS = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' };
const json = (corpo, status = 200, extra = {}) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CABECALHOS, ...extra }
  });
const erro = (mensagem, status = 400, extra) => json({ erro: mensagem }, status, extra);

/* ---------- Senha e token ---------- */
const senhaAdmin = () => (process.env.ADMIN_PASSWORD || '').trim();
const chave = () => createHash('sha256').update('casa-das-pizzas|' + senhaAdmin()).digest();
const assinar = (texto) => createHmac('sha256', chave()).update(texto).digest('base64url');

function iguais(a, b) {
  const x = createHash('sha256').update(String(a)).digest();
  const y = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(x, y);
}

function criarToken() {
  const exp = String(Date.now() + VALIDADE_TOKEN_MS);
  return `${exp}.${assinar(exp)}`;
}

function tokenValido(req) {
  if (!senhaAdmin()) return false;
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const [exp, sig] = token.split('.');
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return iguais(sig, assinar(exp));
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- Validação do conteúdo ---------- */
const TEMAS = ['claro', 'neutro', 'escuro'];
const SELOS = ['', 'Tradicional', 'Especial', 'Premium'];

function texto(v, max, padrao = '') {
  if (typeof v !== 'string') return padrao;
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}
function numero(v, min, max, rotulo) {
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`Valor inválido em ${rotulo}.`);
  return Math.round(n * 100) / 100;
}
function urlImagem(v) {
  if (typeof v !== 'string' || v === '') return '';
  if (/^\/api\/img\/[A-Za-z0-9_-]{6,40}$/.test(v)) return v;
  if (/^img\/[A-Za-z0-9_\-./]{1,120}$/.test(v) && !v.includes('..')) return v;
  return '';
}
const lista = (v, max, rotulo) => {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > max) throw new Error(`Lista inválida em ${rotulo}.`);
  return v;
};

function sanear(c) {
  if (!c || typeof c !== 'object') throw new Error('Conteúdo inválido.');
  const loja = c.loja || {}, marca = c.marca || {}, contato = c.contato || {}, pix = c.pix || {}, aviso = c.aviso || {};
  const mf = loja.mensagemFechado || {};

  const limpo = {
    versao: 1,
    loja: {
      status: loja.status === 'fechado' ? 'fechado' : 'aberto',
      mensagemFechado: {
        titulo: texto(mf.titulo, 80, 'Estamos fechados'),
        texto: texto(mf.texto, 240),
        retorno: texto(mf.retorno, 120)
      }
    },
    aviso: { ativo: !!aviso.ativo, texto: texto(aviso.texto, 160) },
    marca: {
      nome: texto(marca.nome, 40, 'Casa das Pizzas'),
      slogan: texto(marca.slogan, 80),
      faixaEntrega: texto(marca.faixaEntrega, 80),
      logo: urlImagem(marca.logo)
    },
    contato: {
      whatsapp: texto(contato.whatsapp, 20).replace(/\D/g, ''),
      whatsappExibicao: texto(contato.whatsappExibicao, 25),
      endereco: texto(contato.endereco, 140),
      horario: texto(contato.horario, 100),
      atendimento: texto(contato.atendimento, 100),
      instagram: texto(contato.instagram, 40).replace(/^@/, '').replace(/[^A-Za-z0-9._]/g, '')
    },
    pix: { chave: texto(pix.chave, 80), nome: texto(pix.nome, 80) },
    banners: [], categorias: [], ofertas: []
  };
  if (limpo.contato.whatsapp.length < 10) throw new Error('Informe o WhatsApp com DDD, só números (ex: 5598999999999).');

  lista(c.banners, 20, 'banners').forEach((b, i) => {
    const imagem = urlImagem(b && b.imagem);
    if (!imagem) throw new Error(`O banner ${i + 1} está sem foto válida.`);
    limpo.banners.push({
      ativo: b.ativo !== false, imagem, mobile: urlImagem(b.mobile),
      titulo: texto(b.titulo, 60), texto: texto(b.texto, 100)
    });
  });

  const idsUsados = new Set();
  lista(c.categorias, 15, 'categorias').forEach((cat, i) => {
    if (!cat || typeof cat !== 'object') throw new Error('Categoria inválida.');
    let id = texto(cat.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!id || idsUsados.has(id)) id = `cat-${randomBytes(4).toString('hex')}`;
    idsUsados.add(id);
    const titulo = texto(cat.titulo, 60);
    if (!titulo) throw new Error(`A categoria ${i + 1} precisa de um nome.`);
    const nova = {
      id, titulo, rotuloMenu: texto(cat.rotuloMenu, 24) || titulo.slice(0, 24),
      subtitulo: texto(cat.subtitulo, 80),
      tema: TEMAS.includes(cat.tema) ? cat.tema : 'claro',
      visivel: cat.visivel !== false, itens: []
    };
    lista(cat.itens, 60, `itens de "${titulo}"`).forEach((it, j) => {
      const nome = texto(it && it.nome, 70);
      if (!nome) throw new Error(`Um item de "${titulo}" está sem nome.`);
      const item = {
        nome, selo: SELOS.includes(it.selo) ? it.selo : '', descricao: texto(it.descricao, 160),
        disponivel: it.disponivel !== false, precos: []
      };
      lista(it.precos, 8, `preços de "${nome}"`).forEach((p) => {
        item.precos.push({
          rotulo: texto(p && p.rotulo, 20, '-'), detalhe: texto(p && p.detalhe, 24),
          valor: numero(p && p.valor, 0, 9999, `preço de "${nome}"`)
        });
      });
      nova.itens.push(item);
    });
    limpo.categorias.push(nova);
  });

  const dias = new Set();
  lista(c.ofertas, 7, 'ofertas').forEach((o) => {
    const dia = Number(o && o.dia);
    if (!Number.isInteger(dia) || dia < 0 || dia > 6 || dias.has(dia)) return;
    dias.add(dia);
    const por = numero(o.por, 0, 9999, 'preço da oferta');
    const de = o.de === '' || o.de === null || o.de === undefined ? 0 : numero(o.de, 0, 9999, 'preço "de" da oferta');
    limpo.ofertas.push({
      dia, ativo: o.ativo !== false, titulo: texto(o.titulo, 60), descricao: texto(o.descricao, 160), de, por
    });
  });
  limpo.ofertas.sort((a, b) => a.dia - b.dia);
  return limpo;
}

/* ---------- Imagens ---------- */
function tipoDaImagem(bytes) {
  const b = new Uint8Array(bytes.slice(0, 12));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}

/* ---------- Rotas ---------- */
async function login(req, context) {
  if (!senhaAdmin()) return erro('O painel ainda não foi ativado: falta cadastrar a variável ADMIN_PASSWORD no Netlify.', 503);
  if (senhaAdmin().length < 8) return erro('A senha cadastrada no Netlify é curta demais. Use pelo menos 8 caracteres.', 503);
  const seg = getStore({ name: 'seguranca', consistency: 'strong' });
  const ip = (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || 'desconhecido';
  const chaveIp = 'tentativas-' + createHash('sha256').update(String(ip)).digest('hex').slice(0, 24);
  const reg = (await seg.get(chaveIp, { type: 'json' }).catch(() => null)) || { n: 0, ate: 0 };

  if (reg.n >= MAX_TENTATIVAS && Date.now() < reg.ate) {
    const min = Math.ceil((reg.ate - Date.now()) / 60000);
    return erro(`Muitas tentativas. Tente de novo em ${min} minuto(s).`, 429);
  }
  let corpo; try { corpo = await req.json(); } catch { return erro('Pedido inválido.'); }

  if (!iguais(corpo && corpo.senha ? corpo.senha : '', senhaAdmin())) {
    await seg.setJSON(chaveIp, { n: (Date.now() < reg.ate ? reg.n : 0) + 1, ate: Date.now() + BLOQUEIO_MS });
    await espera(700);
    return erro('Senha incorreta.', 401);
  }
  await seg.delete(chaveIp).catch(() => {});
  return json({ token: criarToken(), expiraEm: Date.now() + VALIDADE_TOKEN_MS });
}

async function salvar(req) {
  const bruto = await req.text();
  if (bruto.length > 400_000) return erro('Conteúdo grande demais.', 413);
  let entrada; try { entrada = JSON.parse(bruto); } catch { return erro('Pedido inválido.'); }
  let limpo; try { limpo = sanear(entrada); } catch (e) { return erro(e.message, 422); }

  const loja = dados();
  const atual = await loja.get('conteudo', { type: 'json' }).catch(() => null);
  if (atual) await loja.setJSON('conteudo-anterior', atual);
  limpo.atualizadoEm = new Date().toISOString();
  await loja.setJSON('conteudo', limpo);
  return json({ ok: true, conteudo: limpo, temAnterior: !!atual });
}

async function restaurar() {
  const loja = dados();
  const anterior = await loja.get('conteudo-anterior', { type: 'json' }).catch(() => null);
  if (!anterior) return erro('Não existe versão anterior guardada.', 404);
  const atual = await loja.get('conteudo', { type: 'json' }).catch(() => null);
  anterior.atualizadoEm = new Date().toISOString();
  await loja.setJSON('conteudo', anterior);
  if (atual) await loja.setJSON('conteudo-anterior', atual);
  return json({ ok: true, conteudo: anterior, temAnterior: !!atual });
}

async function enviarImagem(req) {
  const bytes = await req.arrayBuffer();
  if (!bytes.byteLength) return erro('Arquivo vazio.');
  if (bytes.byteLength > MAX_IMAGEM) return erro('Foto grande demais (máximo 1,5 MB).', 413);
  const tipo = tipoDaImagem(bytes);
  if (!tipo) return erro('Formato não aceito. Use JPG, PNG ou WebP.', 415);
  const id = randomBytes(9).toString('base64url');
  await imagens().set(id, bytes, { metadata: { tipo } });
  return json({ ok: true, url: `/api/img/${id}` });
}

async function servirImagem(id) {
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(id)) return erro('Não encontrada.', 404);
  const r = await imagens().getWithMetadata(id, { type: 'arrayBuffer' }).catch(() => null);
  if (!r) return erro('Não encontrada.', 404);
  const tipo = ['image/jpeg', 'image/png', 'image/webp'].includes(r.metadata && r.metadata.tipo) ? r.metadata.tipo : 'image/jpeg';
  return new Response(r.data, {
    headers: { 'Content-Type': tipo, 'Cache-Control': 'public, max-age=31536000, immutable', ...CABECALHOS }
  });
}

export default async (req, context) => {
  try {
    const url = new URL(req.url);
    const rota = url.pathname.replace(/\/+$/, '');
    const m = req.method;

    if (rota === '/api/conteudo' && m === 'GET') {
      const c = await dados().get('conteudo', { type: 'json' }).catch(() => null);
      return json({ conteudo: c || null });
    }
    if (rota.startsWith('/api/img/') && m === 'GET') return servirImagem(rota.slice('/api/img/'.length));

    if (rota === '/api/admin/login' && m === 'POST') return login(req, context);

    if (rota.startsWith('/api/admin/')) {
      if (!tokenValido(req)) return erro('Sessão expirada. Entre novamente.', 401);
      if (rota === '/api/admin/conteudo' && m === 'GET') {
        const loja = dados();
        const [c, ant] = await Promise.all([
          loja.get('conteudo', { type: 'json' }).catch(() => null),
          loja.get('conteudo-anterior', { type: 'json' }).catch(() => null)
        ]);
        return json({ conteudo: c || null, temAnterior: !!ant });
      }
      if (rota === '/api/admin/conteudo' && m === 'PUT') return salvar(req);
      if (rota === '/api/admin/restaurar' && m === 'POST') return restaurar();
      if (rota === '/api/admin/imagem' && m === 'POST') return enviarImagem(req);
    }
    return erro('Não encontrado.', 404);
  } catch (e) {
    console.error('Erro na API:', e);
    return erro('Erro interno. Tente novamente em instantes.', 500);
  }
};

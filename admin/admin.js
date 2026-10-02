/* ==========================================================================
   PAINEL DA LOJA | Casa das Pizzas
   Edita o conteúdo do site e publica na hora (via /api/admin/*).
   ========================================================================== */

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clonar = (o) => JSON.parse(JSON.stringify(o));
const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const TEMAS = [['claro', 'Branco (destaque)'], ['neutro', 'Bege (suave)'], ['escuro', 'Escuro (premium)']];
const SELOS = [['', 'Sem selo'], ['Tradicional', 'Tradicional'], ['Especial', 'Especial'], ['Premium', 'Premium']];

let S = null;             // conteúdo que está sendo editado
let aba = 'geral';
let sujo = false;         // há mudanças não salvas?
let temAnterior = false;
let primeiraVez = false;
let token = null;
const abertos = new Set(); // categorias/itens abertos

/* ---------- Utilidades ---------- */
const pegar = (p) => p.split('.').reduce((o, k) => (o == null ? o : o[k]), S);
function por(p, v) {
  const ks = p.split('.'); const ult = ks.pop();
  ks.reduce((o, k) => o[k], S)[ult] = v;
}
const fmt = (v) => (v === '' || v == null || Number(v) === 0 ? '' : Number.isFinite(Number(v)) ? Number(v).toFixed(2).replace('.', ',') : v);
const num = (v) => { const n = Number(String(v).trim().replace(',', '.')); return Number.isFinite(n) ? n : NaN; };
const mover = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return false; [arr[i], arr[j]] = [arr[j], arr[i]]; return true; };
const idNovo = () => 'cat-' + Math.random().toString(16).slice(2, 8);

function avisar(msg, tipo = 'ok') {
  const t = $('aviso-toast');
  t.textContent = msg; t.className = `toast toast--${tipo}`; t.hidden = false;
  clearTimeout(avisar.t); avisar.t = setTimeout(() => { t.hidden = true; }, tipo === 'erro' ? 6000 : 3200);
}

function marcarSujo() {
  sujo = true;
  $('estado').textContent = 'Há mudanças ainda não publicadas';
  $('barra-salvar').classList.add('salvar--sujo');
  $('btn-salvar').disabled = false;
}
function marcarLimpo() {
  sujo = false;
  $('estado').textContent = 'Tudo publicado';
  $('barra-salvar').classList.remove('salvar--sujo');
  $('btn-salvar').disabled = true;
}
window.addEventListener('beforeunload', (e) => { if (sujo) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- Comunicação com a API ---------- */
async function api(caminho, { metodo = 'GET', corpo, tipo } = {}) {
  const cab = {};
  if (token) cab.Authorization = `Bearer ${token}`;
  let body;
  if (corpo instanceof Blob) { body = corpo; cab['Content-Type'] = tipo || corpo.type; }
  else if (corpo !== undefined) { body = JSON.stringify(corpo); cab['Content-Type'] = 'application/json'; }
  let r;
  try { r = await fetch(caminho, { method: metodo, headers: cab, body, cache: 'no-store' }); }
  catch (e) { throw new Error('Sem conexão com a internet. Tente de novo.'); }
  let dados = null; try { dados = await r.json(); } catch (e) { /* sem corpo */ }
  if (r.status === 401 && token && caminho !== '/api/admin/login') { sair(true); throw new Error('Sua sessão expirou. Entre novamente.'); }
  if (!r.ok) throw new Error((dados && dados.erro) || `Erro ${r.status}`);
  return dados;
}

/* ---------- Entrada e saída ---------- */
function mostrarLogin(msg) {
  $('app').hidden = true; $('tela-login').hidden = false;
  $('login-senha').value = ''; $('login-erro').hidden = !msg; $('login-erro').textContent = msg || '';
  setTimeout(() => $('login-senha').focus(), 50);
}
function sair(expirou) {
  token = null; localStorage.removeItem('painel-token'); sujo = false; S = null;
  mostrarLogin(expirou ? 'Sua sessão expirou. Entre novamente.' : '');
}

$('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('login-btn'); btn.disabled = true; btn.textContent = 'Entrando...'; $('login-erro').hidden = true;
  try {
    const r = await api('/api/admin/login', { metodo: 'POST', corpo: { senha: $('login-senha').value } });
    token = r.token; localStorage.setItem('painel-token', JSON.stringify({ token: r.token, exp: r.expiraEm }));
    await abrirPainel();
  } catch (err) { $('login-erro').textContent = err.message; $('login-erro').hidden = false; }
  btn.disabled = false; btn.textContent = 'Entrar';
});

async function abrirPainel() {
  const r = await api('/api/admin/conteudo');
  primeiraVez = !r.conteudo;
  S = clonar(r.conteudo || CONTEUDO_PADRAO);
  temAnterior = !!r.temAnterior;
  $('tela-login').hidden = true; $('app').hidden = false;
  $('topo-logo').src = S.marca.logo ? S.marca.logo : '../img/logo.png';
  marcarLimpo(); desenhar();
}

/* ---------- Abas ---------- */
document.querySelectorAll('.abas [data-aba]').forEach((b) => b.addEventListener('click', () => {
  aba = b.dataset.aba;
  document.querySelectorAll('.abas [data-aba]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  desenhar(); window.scrollTo({ top: 0 });
}));

/* ---------- Componentes de formulário ---------- */
function campo(rotulo, caminho, { tipo = 'text', dica = '', max = 100, area = false, inputmode = '', ph = '', t = '', re = false } = {}) {
  const v = pegar(caminho);
  const valor = t === 'preco' ? fmt(v) : v;
  const attrs = `data-k="${caminho}" ${t ? `data-t="${t}"` : ''} ${re ? 'data-re="1"' : ''} maxlength="${max}" placeholder="${esc(ph)}" ${inputmode ? `inputmode="${inputmode}"` : ''}`;
  return `<label class="campo"><span>${rotulo}</span>${area
    ? `<textarea ${attrs} rows="2">${esc(valor)}</textarea>`
    : `<input type="${tipo}" ${attrs} value="${esc(valor)}">`}${dica ? `<small>${dica}</small>` : ''}</label>`;
}
function chave(rotulo, caminho, { re = false, ajuda = '' } = {}) {
  return `<label class="chave"><input type="checkbox" data-k="${caminho}" ${re ? 'data-re="1"' : ''} ${pegar(caminho) ? 'checked' : ''}>
    <span class="chave__trilho" aria-hidden="true"></span><span class="chave__texto">${rotulo}${ajuda ? `<small>${ajuda}</small>` : ''}</span></label>`;
}
function seletor(rotulo, caminho, opcoes) {
  return `<label class="campo"><span>${rotulo}</span><select data-k="${caminho}">${opcoes.map(([v, n]) => `<option value="${esc(v)}" ${pegar(caminho) === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`;
}
const botaoIcone = (acao, rotulo, simbolo, dados = '', extra = '') => `<button type="button" class="ico ${extra}" data-acao="${acao}" ${dados} aria-label="${rotulo}" title="${rotulo}">${simbolo}</button>`;

/* ---------- Telas ---------- */
function telaGeral() {
  const fechado = S.loja.status === 'fechado';
  return `
  ${primeiraVez ? `<div class="cartao cartao--info"><strong>Seu painel está pronto.</strong>
    <p>Tudo o que você mudar aqui e publicar aparece para os clientes na hora. O que você vê agora é o cardápio atual do site.</p></div>` : ''}

  <section class="cartao">
    <h2>Loja</h2>
    <div class="segmento" role="group" aria-label="Situação da loja">
      <button type="button" data-acao="status" data-v="aberto" aria-pressed="${!fechado}">Aberta</button>
      <button type="button" data-acao="status" data-v="fechado" aria-pressed="${fechado}" class="segmento__fechado">Fechada</button>
    </div>
    <p class="dica">${fechado ? 'Os clientes veem um aviso cobrindo o site e não conseguem pedir.' : 'Os clientes podem ver o cardápio e fazer pedidos.'}</p>
    ${fechado ? `<div class="grupo">
      ${campo('Título do aviso', 'loja.mensagemFechado.titulo', { max: 80 })}
      ${campo('Mensagem', 'loja.mensagemFechado.texto', { max: 240, area: true })}
      ${campo('Quando voltamos', 'loja.mensagemFechado.retorno', { max: 120, ph: 'Ex: Voltamos amanhã às 19h!' })}
    </div>` : ''}
  </section>

  <section class="cartao">
    <h2>Aviso do dia</h2>
    ${chave('Mostrar um aviso no topo do site', 'aviso.ativo', { re: true, ajuda: 'Ex: "Hoje fechamos mais cedo" ou "Sem calabresa hoje".' })}
    ${S.aviso.ativo ? campo('Texto do aviso', 'aviso.texto', { max: 160 }) : ''}
  </section>

  <section class="cartao">
    <h2>Marca</h2>
    <div class="logo-linha">
      <img src="${esc(S.marca.logo || '../img/logo.png')}" alt="Logo atual" width="84" height="84">
      <div class="logo-botoes">
        <button type="button" class="btn btn--leve btn--escuro" data-acao="logo-trocar">Trocar logo</button>
        ${S.marca.logo ? '<button type="button" class="btn btn--leve btn--escuro" data-acao="logo-padrao">Usar o logo original</button>' : ''}
      </div>
    </div>
    ${campo('Nome da pizzaria', 'marca.nome', { max: 40, dica: 'A primeira palavra aparece em amarelo.' })}
    ${campo('Frase abaixo do nome', 'marca.slogan', { max: 80 })}
    ${campo('Faixa amarela', 'marca.faixaEntrega', { max: 80, dica: 'Deixe vazio para esconder a faixa.' })}
  </section>

  <section class="cartao">
    <h2>Contato e endereço</h2>
    ${campo('WhatsApp que recebe os pedidos', 'contato.whatsapp', { max: 20, inputmode: 'numeric', ph: '5598999999999', dica: 'Só números, com 55 e o DDD.' })}
    ${campo('WhatsApp como aparece no site', 'contato.whatsappExibicao', { max: 25, ph: '(98) 99999-9999' })}
    ${campo('Endereço', 'contato.endereco', { max: 140 })}
    ${campo('Horário de funcionamento', 'contato.horario', { max: 100 })}
    ${campo('Tipo de atendimento', 'contato.atendimento', { max: 100 })}
    ${campo('Instagram (sem o @)', 'contato.instagram', { max: 40 })}
  </section>

  <section class="cartao">
    <h2>PIX</h2>
    <p class="dica">Aparece na mensagem do pedido quando o cliente escolhe pagar com PIX.</p>
    ${campo('Chave PIX', 'pix.chave', { max: 80 })}
    ${campo('Nome do recebedor', 'pix.nome', { max: 80 })}
  </section>

  <section class="cartao">
    <h2>Segurança</h2>
    <p class="dica">Errou alguma coisa? Volte para a versão que estava no ar antes da última vez que você publicou.</p>
    <button type="button" class="btn btn--leve btn--escuro" data-acao="restaurar" ${temAnterior ? '' : 'disabled'}>Voltar para a versão anterior</button>
  </section>`;
}

function telaFotos() {
  const cartoes = S.banners.map((b, i) => `
    <article class="cartao foto${b.ativo === false ? ' foto--off' : ''}">
      <img class="foto__img" src="${esc(b.imagem)}" alt="" loading="lazy">
      <div class="foto__campos">
        ${campo('Nome da pizza', `banners.${i}.titulo`, { max: 60 })}
        ${campo('Descrição curta', `banners.${i}.texto`, { max: 100 })}
        <div class="linha-acoes">
          ${chave('Mostrar no site', `banners.${i}.ativo`)}
          <div class="ico-grupo">
            ${botaoIcone('b-sobe', 'Subir', '↑', `data-i="${i}"`, i === 0 ? 'ico--off' : '')}
            ${botaoIcone('b-desce', 'Descer', '↓', `data-i="${i}"`, i === S.banners.length - 1 ? 'ico--off' : '')}
            ${botaoIcone('b-remove', 'Remover foto', '✕', `data-i="${i}"`, 'ico--perigo')}
          </div>
        </div>
      </div>
    </article>`).join('');
  return `
  <section class="cartao cartao--topo">
    <h2>Fotos do banner</h2>
    <p class="dica">São as fotos que passam no topo do site. A primeira da lista aparece primeiro.</p>
    <button type="button" class="btn btn--vermelho btn--cheio" data-acao="b-novo">+ Adicionar foto</button>
  </section>
  ${cartoes || '<p class="vazio">Nenhuma foto ainda. Sem fotos, o site mostra o logo no topo.</p>'}`;
}

function resumoPrecos(it) { return it.precos.map((p) => `${esc(p.rotulo)} ${fmt(p.valor)}`).join(' · '); }

function telaCardapio() {
  const cats = S.categorias.map((c, ci) => {
    const aberta = abertos.has(`c${ci}`);
    const itens = c.itens.map((it, ii) => {
      const k = `c${ci}i${ii}`;
      return `
      <details class="item-ed${it.disponivel === false ? ' item-ed--off' : ''}" data-aberto="${k}" ${abertos.has(k) ? 'open' : ''}>
        <summary><span class="item-ed__nome">${esc(it.nome || 'Sem nome')}</span><span class="item-ed__precos">${it.disponivel === false ? 'Esgotado' : resumoPrecos(it)}</span></summary>
        <div class="item-ed__corpo">
          ${campo('Nome do sabor', `categorias.${ci}.itens.${ii}.nome`, { max: 70 })}
          ${campo('Ingredientes / descrição', `categorias.${ci}.itens.${ii}.descricao`, { max: 160, area: true })}
          ${seletor('Selo', `categorias.${ci}.itens.${ii}.selo`, SELOS)}
          ${chave('Disponível hoje', `categorias.${ci}.itens.${ii}.disponivel`, { re: true, ajuda: 'Desligue quando acabar. Aparece como "Esgotado".' })}
          <div class="precos-ed">
            <p class="precos-ed__titulo">Tamanhos e preços</p>
            ${it.precos.map((p, pi) => `
              <div class="preco-ed">
                ${campo('Tamanho', `categorias.${ci}.itens.${ii}.precos.${pi}.rotulo`, { max: 20, ph: 'M' })}
                ${campo('Detalhe', `categorias.${ci}.itens.${ii}.precos.${pi}.detalhe`, { max: 24, ph: '6 fatias' })}
                ${campo('Preço (R$)', `categorias.${ci}.itens.${ii}.precos.${pi}.valor`, { max: 10, inputmode: 'decimal', t: 'preco', ph: '0,00' })}
                ${botaoIcone('p-remove', 'Remover tamanho', '✕', `data-c="${ci}" data-i="${ii}" data-p="${pi}"`, 'ico--perigo')}
              </div>`).join('')}
            <button type="button" class="btn btn--leve btn--escuro" data-acao="p-novo" data-c="${ci}" data-i="${ii}">+ Tamanho</button>
          </div>
          <div class="ico-grupo ico-grupo--linha">
            ${botaoIcone('i-sobe', 'Subir', '↑', `data-c="${ci}" data-i="${ii}"`, ii === 0 ? 'ico--off' : '')}
            ${botaoIcone('i-desce', 'Descer', '↓', `data-c="${ci}" data-i="${ii}"`, ii === c.itens.length - 1 ? 'ico--off' : '')}
            <button type="button" class="btn btn--leve btn--escuro" data-acao="i-dup" data-c="${ci}" data-i="${ii}">Duplicar</button>
            <button type="button" class="btn btn--leve btn--perigo" data-acao="i-remove" data-c="${ci}" data-i="${ii}">Excluir sabor</button>
          </div>
        </div>
      </details>`;
    }).join('');

    return `
    <details class="cat-ed${c.visivel === false ? ' cat-ed--off' : ''}" data-aberto="c${ci}" ${aberta ? 'open' : ''}>
      <summary><span class="cat-ed__nome">${esc(c.titulo || 'Sem nome')}</span><span class="cat-ed__info">${c.visivel === false ? 'Oculta · ' : ''}${c.itens.length} ${c.itens.length === 1 ? 'item' : 'itens'}</span></summary>
      <div class="cat-ed__corpo">
        ${campo('Nome da categoria', `categorias.${ci}.titulo`, { max: 60 })}
        ${campo('Subtítulo', `categorias.${ci}.subtitulo`, { max: 80 })}
        ${campo('Nome no menu de atalhos', `categorias.${ci}.rotuloMenu`, { max: 24, dica: 'Palavra curta que aparece no menu do topo.' })}
        ${seletor('Cor do fundo', `categorias.${ci}.tema`, TEMAS)}
        ${chave('Mostrar esta categoria no site', `categorias.${ci}.visivel`)}
        <div class="ico-grupo ico-grupo--linha">
          ${botaoIcone('c-sobe', 'Subir categoria', '↑', `data-c="${ci}"`, ci === 0 ? 'ico--off' : '')}
          ${botaoIcone('c-desce', 'Descer categoria', '↓', `data-c="${ci}"`, ci === S.categorias.length - 1 ? 'ico--off' : '')}
          <button type="button" class="btn btn--leve btn--perigo" data-acao="c-remove" data-c="${ci}">Excluir categoria</button>
        </div>
        <h3 class="sub-titulo">Sabores e itens</h3>
        ${itens || '<p class="vazio">Nenhum item nesta categoria.</p>'}
        <button type="button" class="btn btn--vermelho btn--cheio" data-acao="i-novo" data-c="${ci}">+ Novo sabor / item</button>
      </div>
    </details>`;
  }).join('');
  return `
  <section class="cartao cartao--topo">
    <h2>Cardápio</h2>
    <p class="dica">Toque numa categoria para abrir, e num sabor para mudar nome, ingredientes e preços.</p>
  </section>
  ${cats}
  <button type="button" class="btn btn--leve btn--escuro btn--cheio mt" data-acao="c-novo">+ Nova categoria</button>`;
}

function telaOfertas() {
  const hoje = new Date().getDay();
  DIAS.forEach((_, dia) => {
    if (!S.ofertas.some((o) => o.dia === dia)) S.ofertas.push({ dia, ativo: false, titulo: '', descricao: '', de: 0, por: 0 });
  });
  S.ofertas.sort((a, b) => a.dia - b.dia);
  const cartoes = DIAS.map((nome, dia) => {
    const i = S.ofertas.findIndex((o) => o.dia === dia);
    const o = S.ofertas[i];
    return `
    <details class="cat-ed${o.ativo === false ? ' cat-ed--off' : ''}" data-aberto="o${dia}" ${abertos.has(`o${dia}`) || dia === hoje ? 'open' : ''}>
      <summary><span class="cat-ed__nome">${nome}${dia === hoje ? ' <em>hoje</em>' : ''}</span><span class="cat-ed__info">${o.ativo === false ? 'Sem oferta' : (o.por ? `R$ ${fmt(o.por)}` : '')}</span></summary>
      <div class="cat-ed__corpo">
        ${chave('Ter oferta neste dia', `ofertas.${i}.ativo`, { re: true })}
        ${o.ativo === false ? '' : `
          ${campo('Nome da oferta', `ofertas.${i}.titulo`, { max: 60, ph: 'Ex: Quinta Especial' })}
          ${campo('O que vem na oferta', `ofertas.${i}.descricao`, { max: 160, area: true, ph: 'Ex: Pizza de Frango com Requeijão (G) + Guaraná 2L' })}
          <div class="duas-colunas">
            ${campo('Preço normal (R$)', `ofertas.${i}.de`, { max: 10, inputmode: 'decimal', t: 'preco', dica: 'Aparece riscado. Opcional.', ph: '0,00' })}
            ${campo('Preço da oferta (R$)', `ofertas.${i}.por`, { max: 10, inputmode: 'decimal', t: 'preco', ph: '0,00' })}
          </div>`}
      </div>
    </details>`;
  }).join('');
  return `
  <section class="cartao cartao--topo">
    <h2>Ofertas da semana</h2>
    <p class="dica">O site mostra automaticamente a oferta do dia da semana de hoje. Dias sem oferta ficam sem o quadro amarelo.</p>
  </section>${cartoes}`;
}

function desenhar() {
  const y = window.scrollY;
  $('conteudo').innerHTML = { geral: telaGeral, fotos: telaFotos, cardapio: telaCardapio, ofertas: telaOfertas }[aba]();
  window.scrollTo({ top: y });
}

/* ---------- Edição dos campos ---------- */
$('conteudo').addEventListener('input', (e) => {
  const el = e.target.closest('[data-k]'); if (!el || !S) return;
  por(el.dataset.k, el.type === 'checkbox' ? el.checked : el.value);
  marcarSujo();
  if (el.dataset.re) desenhar();
});
$('conteudo').addEventListener('blur', (e) => {  // formata o preço quando sai do campo
  const el = e.target.closest && e.target.closest('[data-t="preco"]'); if (!el) return;
  const n = num(el.value); if (el.value.trim() !== '' && Number.isFinite(n)) el.value = fmt(n);
}, true);
$('conteudo').addEventListener('toggle', (e) => {
  const d = e.target; if (!d.dataset || !d.dataset.aberto) return;
  d.open ? abertos.add(d.dataset.aberto) : abertos.delete(d.dataset.aberto);
}, true);

/* ---------- Ações (botões) ---------- */
$('conteudo').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-acao]'); if (!b || b.disabled || b.classList.contains('ico--off')) return;
  const c = Number(b.dataset.c), i = Number(b.dataset.i), p = Number(b.dataset.p);
  const a = b.dataset.acao;

  if (a === 'status') { S.loja.status = b.dataset.v; marcarSujo(); }
  else if (a === 'logo-trocar') { $('arq-logo').click(); return; }
  else if (a === 'logo-padrao') { S.marca.logo = ''; marcarSujo(); $('topo-logo').src = '../img/logo.png'; }
  else if (a === 'restaurar') { return restaurar(); }
  /* banner */
  else if (a === 'b-novo') { return abrirDialogoFoto(); }
  else if (a === 'b-sobe') { if (mover(S.banners, i, -1)) marcarSujo(); }
  else if (a === 'b-desce') { if (mover(S.banners, i, 1)) marcarSujo(); }
  else if (a === 'b-remove') { if (!confirm('Remover esta foto do banner?')) return; S.banners.splice(i, 1); marcarSujo(); }
  /* categorias */
  else if (a === 'c-novo') { S.categorias.push({ id: idNovo(), titulo: 'Nova categoria', rotuloMenu: 'Nova', subtitulo: '', tema: 'claro', visivel: true, itens: [] }); abertos.add(`c${S.categorias.length - 1}`); marcarSujo(); }
  else if (a === 'c-sobe') { if (mover(S.categorias, c, -1)) { abertos.clear(); abertos.add(`c${c - 1}`); marcarSujo(); } }
  else if (a === 'c-desce') { if (mover(S.categorias, c, 1)) { abertos.clear(); abertos.add(`c${c + 1}`); marcarSujo(); } }
  else if (a === 'c-remove') { if (!confirm(`Excluir a categoria "${S.categorias[c].titulo}" e todos os itens dela?`)) return; S.categorias.splice(c, 1); abertos.clear(); marcarSujo(); }
  /* itens */
  else if (a === 'i-novo') {
    S.categorias[c].itens.push({ nome: 'Novo sabor', selo: '', descricao: '', disponivel: true,
      precos: [{ rotulo: 'P', detalhe: '4 fatias', valor: '' }, { rotulo: 'M', detalhe: '6 fatias', valor: '' }, { rotulo: 'G', detalhe: '8 fatias', valor: '' }] });
    abertos.add(`c${c}i${S.categorias[c].itens.length - 1}`); marcarSujo();
  }
  else if (a === 'i-sobe') { if (mover(S.categorias[c].itens, i, -1)) { abertos.delete(`c${c}i${i}`); abertos.add(`c${c}i${i - 1}`); marcarSujo(); } }
  else if (a === 'i-desce') { if (mover(S.categorias[c].itens, i, 1)) { abertos.delete(`c${c}i${i}`); abertos.add(`c${c}i${i + 1}`); marcarSujo(); } }
  else if (a === 'i-dup') { const nova = clonar(S.categorias[c].itens[i]); nova.nome += ' (cópia)'; S.categorias[c].itens.splice(i + 1, 0, nova); abertos.add(`c${c}i${i + 1}`); marcarSujo(); }
  else if (a === 'i-remove') { if (!confirm(`Excluir o sabor "${S.categorias[c].itens[i].nome}"?`)) return; S.categorias[c].itens.splice(i, 1); abertos.forEach((k) => { if (k.startsWith(`c${c}i`)) abertos.delete(k); }); marcarSujo(); }
  /* tamanhos */
  else if (a === 'p-novo') { S.categorias[c].itens[i].precos.push({ rotulo: '', detalhe: '', valor: '' }); marcarSujo(); }
  else if (a === 'p-remove') { S.categorias[c].itens[i].precos.splice(p, 1); marcarSujo(); }
  else return;
  desenhar();
});

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-acao="sair"], [data-acao="salvar"]'); if (!b) return;
  if (b.dataset.acao === 'sair') { if (!sujo || confirm('Você tem mudanças não publicadas. Sair mesmo assim?')) sair(false); }
  else salvar();
});

/* ---------- Salvar e publicar ---------- */
function preparar() {
  const c = clonar(S);
  const erroEm = (tela, msg) => { const e = new Error(msg); e.tela = tela; return e; };
  if (String(c.contato.whatsapp).replace(/\D/g, '').length < 10) throw erroEm('geral', 'Informe o WhatsApp com 55 e DDD, só números.');
  if (!c.marca.nome.trim()) throw erroEm('geral', 'Informe o nome da pizzaria.');
  c.categorias.forEach((cat) => {
    if (!cat.titulo.trim()) throw erroEm('cardapio', 'Uma categoria está sem nome.');
    cat.itens.forEach((it) => {
      if (!it.nome.trim()) throw erroEm('cardapio', `Há um item sem nome em "${cat.titulo}".`);
      if (!it.precos.length) throw erroEm('cardapio', `"${it.nome}" precisa de ao menos um tamanho com preço.`);
      it.precos.forEach((p) => {
        const n = num(p.valor);
        if (!Number.isFinite(n) || n <= 0) throw erroEm('cardapio', `Preencha o preço de "${it.nome}" (${p.rotulo || 'tamanho sem nome'}).`);
        if (!String(p.rotulo).trim()) throw erroEm('cardapio', `Dê um nome ao tamanho de "${it.nome}" (ex: P, M, G).`);
        p.valor = n;
      });
    });
  });
  c.ofertas.forEach((o) => {
    o.de = String(o.de).trim() === '' ? 0 : num(o.de);
    o.por = String(o.por).trim() === '' ? 0 : num(o.por);
    if (o.ativo !== false) {
      if (!(o.por > 0)) throw erroEm('ofertas', `Informe o preço da oferta de ${DIAS[o.dia]}.`);
      if (!o.titulo.trim()) throw erroEm('ofertas', `Dê um nome à oferta de ${DIAS[o.dia]}.`);
    }
    if (!Number.isFinite(o.de) || !Number.isFinite(o.por)) throw erroEm('ofertas', `Preço inválido na oferta de ${DIAS[o.dia]}.`);
  });
  c.ofertas = c.ofertas.filter((o) => o.ativo !== false || o.titulo || o.por);
  return c;
}

function irParaAba(nome) { document.querySelector(`.abas [data-aba="${nome}"]`).click(); }

async function salvar() {
  let pronto;
  try { pronto = preparar(); } catch (e) { if (e.tela) irParaAba(e.tela); avisar(e.message, 'erro'); return; }
  const btn = $('btn-salvar'); btn.disabled = true; btn.textContent = 'Publicando...';
  try {
    const r = await api('/api/admin/conteudo', { metodo: 'PUT', corpo: pronto });
    S = clonar(r.conteudo); temAnterior = r.temAnterior; primeiraVez = false;
    $('topo-logo').src = S.marca.logo || '../img/logo.png';
    marcarLimpo(); desenhar();
    avisar('Publicado! Os clientes já veem as mudanças.');
  } catch (e) { btn.disabled = false; avisar(e.message, 'erro'); }
  btn.textContent = 'Salvar e publicar';
}

async function restaurar() {
  if (!confirm('Voltar para a versão anterior? As mudanças atuais ficam guardadas e você pode desfazer depois.')) return;
  try {
    const r = await api('/api/admin/restaurar', { metodo: 'POST', corpo: {} });
    S = clonar(r.conteudo); temAnterior = r.temAnterior; marcarLimpo(); desenhar();
    avisar('Pronto! A versão anterior está no ar.');
  } catch (e) { avisar(e.message, 'erro'); }
}

/* ---------- Fotos: recorte, compressão e envio ---------- */
async function lerImagem(arquivo) {
  if (!arquivo || !/^image\/(jpeg|png|webp)$/.test(arquivo.type)) throw new Error('Use uma foto JPG, PNG ou WebP.');
  if (arquivo.size > 25 * 1024 * 1024) throw new Error('Essa foto é muito grande (máximo 25 MB).');
  return createImageBitmap(arquivo, { imageOrientation: 'from-image' });
}

function recortar(canvas, img, proporcao, zoom, px, py) {
  const W = img.width, H = img.height;
  let cw, ch;
  if (W / H > proporcao) { ch = H; cw = H * proporcao; } else { cw = W; ch = W / proporcao; }
  cw /= zoom; ch /= zoom;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (W - cw) * px, (H - ch) * py, cw, ch, 0, 0, canvas.width, canvas.height);
}

async function comprimir(canvas, tipo = 'image/jpeg', limite = 1_400_000) {
  for (let q = 0.85; q >= 0.4; q -= 0.1) {
    const blob = await new Promise((r) => canvas.toBlob(r, tipo, q));
    if (!blob) throw new Error('Não foi possível preparar a foto.');
    if (blob.size <= limite || tipo === 'image/png') return blob;
  }
  throw new Error('A foto ficou grande demais. Tente outra.');
}

async function enviarImagem(blob) {
  const r = await api('/api/admin/imagem', { metodo: 'POST', corpo: blob });
  return r.url;
}

let fotoAtual = null;
const dlg = $('dlg-foto');
function atualizarPrevia() {
  if (!fotoAtual) return;
  const z = Number($('foto-zoom').value), x = Number($('foto-x').value), y = Number($('foto-y').value);
  recortar($('previa-pc'), fotoAtual, 5 / 2, z, x, y);
  recortar($('previa-cel'), fotoAtual, 1, z, x, y);
}
function abrirDialogoFoto() {
  fotoAtual = null; $('foto-arquivo').value = ''; $('foto-area').hidden = true; $('foto-erro').hidden = true;
  $('foto-titulo').value = ''; $('foto-texto').value = ''; $('foto-ok').disabled = true;
  $('foto-zoom').value = 1; $('foto-x').value = 0.5; $('foto-y').value = 0.5;
  dlg.showModal();
}
$('foto-arquivo').addEventListener('change', async (e) => {
  $('foto-erro').hidden = true;
  try {
    fotoAtual = await lerImagem(e.target.files[0]);
    $('foto-area').hidden = false; $('foto-ok').disabled = false; atualizarPrevia();
  } catch (err) { fotoAtual = null; $('foto-area').hidden = true; $('foto-ok').disabled = true; $('foto-erro').textContent = err.message; $('foto-erro').hidden = false; }
});
['foto-zoom', 'foto-x', 'foto-y'].forEach((id) => $(id).addEventListener('input', atualizarPrevia));
$('foto-cancelar').addEventListener('click', () => dlg.close());
$('foto-ok').addEventListener('click', async () => {
  const btn = $('foto-ok'); btn.disabled = true; btn.textContent = 'Enviando...'; $('foto-erro').hidden = true;
  try {
    const z = Number($('foto-zoom').value), x = Number($('foto-x').value), y = Number($('foto-y').value);
    const pc = document.createElement('canvas'); pc.width = 1600; pc.height = 640; recortar(pc, fotoAtual, 5 / 2, z, x, y);
    const cel = document.createElement('canvas'); cel.width = 800; cel.height = 800; recortar(cel, fotoAtual, 1, z, x, y);
    const [urlPc, urlCel] = await Promise.all([comprimir(pc).then(enviarImagem), comprimir(cel).then(enviarImagem)]);
    S.banners.push({ ativo: true, imagem: urlPc, mobile: urlCel, titulo: $('foto-titulo').value.trim(), texto: $('foto-texto').value.trim() });
    marcarSujo(); dlg.close(); if (aba === 'fotos') desenhar();
    avisar('Foto adicionada. Clique em "Salvar e publicar" para colocar no site.');
  } catch (err) { $('foto-erro').textContent = err.message; $('foto-erro').hidden = false; }
  btn.disabled = false; btn.textContent = 'Adicionar';
});

/* ---------- Logo ---------- */
$('arq-logo').addEventListener('change', async (e) => {
  try {
    const img = await lerImagem(e.target.files[0]);
    const lado = Math.min(320, Math.max(img.width, img.height));
    const cv = document.createElement('canvas'); cv.width = cv.height = lado;
    const esc_ = Math.min(lado / img.width, lado / img.height);
    const w = img.width * esc_, h = img.height * esc_;
    const ctx = cv.getContext('2d'); ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (lado - w) / 2, (lado - h) / 2, w, h);
    S.marca.logo = await comprimir(cv, 'image/png').then(enviarImagem);
    marcarSujo(); desenhar(); avisar('Logo trocado. Clique em "Salvar e publicar" para valer no site.');
  } catch (err) { avisar(err.message, 'erro'); }
  e.target.value = '';
});

/* ---------- Início ---------- */
(async function iniciar() {
  try {
    const guardado = JSON.parse(localStorage.getItem('painel-token'));
    if (guardado && guardado.exp > Date.now()) { token = guardado.token; await abrirPainel(); return; }
  } catch (e) { /* cai para o login */ }
  token = null; localStorage.removeItem('painel-token');
  mostrarLogin();
})();

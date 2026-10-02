/* ==========================================================================
   CASA DAS PIZZAS  |  Lógica do cardápio
   Todo o conteúdo (preços, fotos, ofertas, textos) vem do PAINEL (/admin).
   Se o painel não responder, o site usa o último conteúdo guardado no
   aparelho ou o conteúdo inicial de js/config.js.
   ========================================================================== */

const moeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const $ = (id) => document.getElementById(id);
const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LOGO_PADRAO = 'img/logo.png';

let D = CONTEUDO_PADRAO; // conteúdo atual do site

/* ---------- Busca do conteúdo ---------- */
async function carregarConteudo() {
  try {
    const controle = new AbortController();
    const limite = setTimeout(() => controle.abort(), 4000);
    const r = await fetch('/api/conteudo', { signal: controle.signal, cache: 'no-store' });
    clearTimeout(limite);
    if (r.ok) {
      const { conteudo } = await r.json();
      if (conteudo) {
        try { localStorage.setItem('conteudo-v1', JSON.stringify(conteudo)); } catch (e) { /* sem espaço: ignora */ }
        return conteudo;
      }
      return CONTEUDO_PADRAO; // painel ativo, mas ainda sem nada salvo
    }
  } catch (e) { /* sem rede ou painel fora do ar */ }
  try {
    const guardado = JSON.parse(localStorage.getItem('conteudo-v1'));
    if (guardado && guardado.categorias) return guardado;
  } catch (e) { /* ignora */ }
  return CONTEUDO_PADRAO;
}

/* ---------- Marca, textos e contato ---------- */
function aplicarMarca() {
  const { marca, contato, aviso } = D;
  const logo = marca.logo || LOGO_PADRAO;
  document.querySelectorAll('.js-logo').forEach((img) => { img.src = logo; img.alt = `Logo ${marca.nome}`; });

  const [primeira, ...resto] = marca.nome.split(' ');
  $('marca-nome').innerHTML = `<span class="wordmark__casa">${escapar(primeira)}</span>${resto.length ? ` <span class="wordmark__das">${escapar(resto.join(' '))}</span>` : ''}`;
  $('marca-slogan').textContent = marca.slogan;
  $('marca-slogan').hidden = !marca.slogan;
  document.title = `Cardápio Digital | ${marca.nome}`;

  $('faixa-entrega').hidden = !marca.faixaEntrega;
  $('faixa-entrega-texto').textContent = marca.faixaEntrega;
  $('aviso').hidden = !(aviso && aviso.ativo && aviso.texto);
  $('aviso-texto').textContent = aviso ? aviso.texto : '';

  const whats = $('rodape-whats');
  whats.href = `https://wa.me/${contato.whatsapp}`;
  whats.textContent = `WhatsApp ${contato.whatsappExibicao || contato.whatsapp}`;
  $('rodape-endereco').textContent = contato.endereco;
  $('rodape-horario').textContent = contato.horario;
  $('rodape-atendimento').textContent = contato.atendimento;
  const insta = $('rodape-insta');
  insta.hidden = !contato.instagram;
  insta.href = `https://www.instagram.com/${contato.instagram}/`;
  $('rodape-insta-texto').textContent = `@${contato.instagram}`;
  $('rodape-copy').textContent = `${marca.nome}. Todos os direitos reservados.`;
}

/* ---------- Loja aberta / fechada ---------- */
function verificarLoja() {
  if (D.loja.status !== 'fechado') return;
  const m = D.loja.mensagemFechado;
  $('fechado-titulo').textContent = m.titulo;
  $('fechado-texto').textContent = m.texto;
  $('fechado-retorno').textContent = m.retorno;
  $('fechado-contato').href = `https://wa.me/${D.contato.whatsapp}`;
  $('loja-fechada').hidden = false;
  document.body.style.overflow = 'hidden';
}

/* ---------- Cardápio ---------- */
function renderizarCardapio() {
  const categorias = D.categorias.filter((c) => c.visivel !== false && c.itens.length);
  $('cardapio').innerHTML = categorias.map((cat) => `
    <section id="${escapar(cat.id)}" class="categoria categoria--${escapar(cat.tema)}">
      <h2 class="categoria__titulo">${escapar(cat.titulo)}</h2>
      ${cat.subtitulo ? `<p class="categoria__sub">${escapar(cat.subtitulo)}</p>` : ''}
      <div class="itens">
        ${cat.itens.map((item) => `
          <article class="item${item.disponivel === false ? ' item--esgotado' : ''}">
            <div class="item__cabeca">
              <h3 class="item__nome">${escapar(item.nome)}</h3>
              ${item.disponivel === false
                ? '<span class="selo selo--esgotado">Esgotado</span>'
                : item.selo ? `<span class="selo selo--${escapar(item.selo.toLowerCase())}">${escapar(item.selo)}</span>` : ''}
            </div>
            <p class="item__desc">${escapar(item.descricao)}</p>
            <div class="precos">
              ${item.precos.map((p) => `
                <div class="preco">
                  <span class="preco__rotulo">${escapar(p.rotulo)}</span>
                  ${p.detalhe ? `<span class="preco__detalhe">${escapar(p.detalhe)}</span>` : ''}
                  <span class="preco__valor">${moeda(p.valor)}</span>
                </div>`).join('')}
            </div>
          </article>`).join('')}
      </div>
    </section>`).join('');
  return categorias;
}

/* ---------- Oferta do dia ---------- */
function renderizarOferta() {
  const secao = $('oferta');
  const oferta = (D.ofertas || []).find((o) => o.dia === new Date().getDay() && o.ativo !== false && o.por > 0);
  if (!oferta) { secao.hidden = true; return false; }
  secao.innerHTML = `
    <span class="oferta__selo">Oferta de hoje</span>
    <h2 class="oferta__titulo">${escapar(oferta.titulo)}</h2>
    ${oferta.descricao ? `<p class="oferta__itens">${escapar(oferta.descricao)}</p>` : ''}
    ${oferta.de > oferta.por ? `<p class="oferta__de">De ${moeda(oferta.de)}</p>` : ''}
    <p class="oferta__por">Por apenas ${moeda(oferta.por)}</p>
    <p class="oferta__validade">Válida somente hoje</p>`;
  secao.hidden = false;
  return true;
}

/* ---------- Menu de atalhos ---------- */
function renderizarMenu(categorias, temOferta) {
  const links = [];
  if (temOferta) links.push(['oferta', 'Oferta do dia']);
  categorias.forEach((c) => links.push([c.id, c.rotuloMenu || c.titulo]));
  links.push(['pedido', 'Pedido']);
  $('nav-lista').innerHTML = links.map(([id, nome]) => `<a href="#${escapar(id)}">${escapar(nome)}</a>`).join('');
}

/* ---------- Banner de fotos ---------- */
function iniciarBanner() {
  const banner = $('banner');
  const trilho = $('banner-trilho');
  const pontos = $('banner-pontos');
  const logo = D.marca.logo || LOGO_PADRAO;

  const slideMarca = () => `
    <div class="slide slide--marca">
      <div>
        <img class="slide__logo" src="${escapar(logo)}" alt="Logo ${escapar(D.marca.nome)}" width="140" height="140">
        <p class="slide__texto">${escapar(D.marca.slogan || 'Peça pelo WhatsApp.')}</p>
      </div>
    </div>`;

  const fotos = (D.banners || []).filter((b) => b.ativo !== false && b.imagem);
  trilho.innerHTML = fotos.length
    ? fotos.map((b, i) => `
        <figure class="slide">
          <picture>
            ${b.mobile ? `<source media="(max-width: 799px)" srcset="${escapar(b.mobile)}">` : ''}
            <img class="slide__img" src="${escapar(b.imagem)}" alt="${escapar(b.titulo || 'Pizza')}"
                 ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
          </picture>
          ${b.titulo ? `<figcaption class="slide__legenda">
            <p class="slide__titulo">${escapar(b.titulo)}</p>
            ${b.texto ? `<p class="slide__texto">${escapar(b.texto)}</p>` : ''}
          </figcaption>` : ''}
        </figure>`).join('')
    : slideMarca();

  // Foto que não carregar sai do banner; se nenhuma carregar, volta o banner da marca.
  trilho.querySelectorAll('.slide__img').forEach((img) => {
    img.addEventListener('error', () => {
      img.closest('.slide').remove();
      if (!trilho.children.length) trilho.innerHTML = slideMarca();
      montarControles();
    });
  });

  let timer = null;
  let indice = 0;

  function slides() { return Array.from(trilho.children); }

  function irPara(i) {
    const lista = slides();
    indice = (i + lista.length) % lista.length;
    trilho.scrollTo({ left: lista[indice].offsetLeft - trilho.offsetLeft, behavior: 'smooth' });
  }

  function atualizarPontos() {
    pontos.querySelectorAll('.ponto').forEach((p, i) => p.setAttribute('aria-current', i === indice ? 'true' : 'false'));
  }

  function montarControles() {
    const total = slides().length;
    banner.classList.toggle('banner--varios', total > 1);
    pontos.innerHTML = total > 1
      ? slides().map((_, i) => `<button type="button" class="ponto" aria-label="Ir para a foto ${i + 1}"></button>`).join('')
      : '';
    pontos.querySelectorAll('.ponto').forEach((p, i) => p.addEventListener('click', () => { irPara(i); reiniciar(); }));
    indice = Math.min(indice, total - 1);
    atualizarPontos();
    reiniciar();
  }

  function parar() { clearInterval(timer); timer = null; }
  function reiniciar() {
    parar();
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (slides().length > 1 && !reduzir && !document.hidden) timer = setInterval(() => irPara(indice + 1), 5000);
  }

  // Atualiza o indicador quando o usuário arrasta o banner
  let quadro = null;
  trilho.addEventListener('scroll', () => {
    cancelAnimationFrame(quadro);
    quadro = requestAnimationFrame(() => {
      const novo = Math.round(trilho.scrollLeft / trilho.clientWidth);
      if (novo !== indice) { indice = novo; atualizarPontos(); }
    });
  }, { passive: true });

  $('banner-prev').addEventListener('click', () => { irPara(indice - 1); reiniciar(); });
  $('banner-next').addEventListener('click', () => { irPara(indice + 1); reiniciar(); });
  banner.addEventListener('mouseenter', parar);
  banner.addEventListener('mouseleave', reiniciar);
  banner.addEventListener('touchstart', parar, { passive: true });
  banner.addEventListener('touchend', reiniciar, { passive: true });
  document.addEventListener('visibilitychange', () => (document.hidden ? parar() : reiniciar()));

  montarControles();
}

/* ---------- Formulário e envio para o WhatsApp ---------- */
function iniciarFormulario() {
  const form = $('form-pedido');
  const telefone = $('telefone');
  const erro = $('form-erro');
  const botao = $('enviar-btn');
  const textoBotao = $('enviar-texto');
  let enviando = false;

  telefone.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = v.slice(0, 15);
  });

  form.querySelectorAll('input, textarea').forEach((el) => el.addEventListener('input', () => {
    el.classList.remove('invalido');
    erro.hidden = true;
  }));

  function mostrarErro(mensagem, campo) {
    erro.textContent = mensagem;
    erro.hidden = false;
    if (campo) { campo.classList.add('invalido'); campo.focus(); }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (enviando) return;

    const nome = $('nome');
    const endereco = $('endereco');
    const pedido = $('pedido-texto');
    const pagamento = form.querySelector('input[name="pagamento"]:checked');

    if (!nome.value.trim()) return mostrarErro('Informe o seu nome.', nome);
    if (!telefone.value.trim()) return mostrarErro('Informe o seu telefone ou WhatsApp.', telefone);
    if (!endereco.value.trim()) return mostrarErro('Informe o endereço para entrega.', endereco);
    if (!pedido.value.trim()) return mostrarErro('Escreva o seu pedido.', pedido);
    if (!pagamento) return mostrarErro('Escolha a forma de pagamento.');

    // Bloqueia cliques repetidos por 5 segundos
    enviando = true;
    botao.disabled = true;
    textoBotao.textContent = 'Abrindo o WhatsApp...';
    setTimeout(() => { enviando = false; botao.disabled = false; textoBotao.textContent = 'Enviar pelo WhatsApp'; }, 5000);

    // Mensagem enviada ao WhatsApp.
    const formas = { dinheiro: '💵 Dinheiro', pix: '📱 PIX' };
    let mensagem = `🍕 *NOVO PEDIDO - CasadasPizzaass* 🍕\n\n` +
      `*Cliente:* ${nome.value}\n` +
      `*Contato:* ${telefone.value}\n` +
      `*Endereço:* ${endereco.value}\n\n` +
      `*Pedido Detalhado:*\n${pedido.value}\n\n` +
      `*Pagamento:* ${formas[pagamento.value]}\n\n`;

    if (pagamento.value === 'pix' && D.pix.chave) {
      mensagem += `*Dados para PIX:*\n*Chave (Celular):* ${D.pix.chave}\n*Nome:* ${D.pix.nome}\n\n_O pedido só é liberado após o envio do comprovante._\n\n`;
    }
    mensagem += `_Pedido enviado via cardápio digital._`;

    window.open(`https://wa.me/${D.contato.whatsapp}?text=${encodeURIComponent(mensagem)}`, '_blank');
  });
}

/* ---------- Barra fixa do celular: some quando o formulário está na tela ---------- */
function iniciarBarraFixa() {
  const barra = $('barra-fixa');
  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entrada]) => barra.classList.toggle('escondida', entrada.isIntersecting), { threshold: 0.15 })
    .observe($('pedido'));
}

/* ---------- Instalação do app (PWA) ---------- */
function iniciarPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.error('Falha no Service Worker:', err));
  }

  let convite;
  const faixa = $('instalar');
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); convite = e; faixa.hidden = false; });
  $('instalar-btn').addEventListener('click', async () => {
    faixa.hidden = true;
    if (!convite) return;
    convite.prompt();
    await convite.userChoice;
    convite = null;
  });
  window.addEventListener('appinstalled', () => { faixa.hidden = true; });
}

/* ---------- Início ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  iniciarFormulario();
  iniciarBarraFixa();
  iniciarPWA();

  D = await carregarConteudo();
  aplicarMarca();
  verificarLoja();
  iniciarBanner();
  const temOferta = renderizarOferta();
  const categorias = renderizarCardapio();
  renderizarMenu(categorias, temOferta);

  // Se o endereço tiver #categoria, vai até ela depois de montar a página
  if (location.hash) {
    const alvo = document.getElementById(location.hash.slice(1));
    if (alvo) alvo.scrollIntoView();
  }
});

/* ==========================================================================
   CASA DAS PIZZAS  |  Lógica do cardápio
   Os dados (preços, sabores, ofertas, banners) ficam em js/config.js
   ========================================================================== */

const moeda = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const $ = (id) => document.getElementById(id);
const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Loja aberta / fechada ---------- */
function verificarLoja() {
  const aviso = $('loja-fechada');
  if (CONFIG.statusLoja !== 'fechado') return;
  $('fechado-titulo').textContent = CONFIG.mensagemFechado.titulo;
  $('fechado-texto').textContent = CONFIG.mensagemFechado.texto;
  $('fechado-retorno').textContent = CONFIG.mensagemFechado.retorno;
  $('fechado-contato').href = `https://wa.me/${CONFIG.whatsapp}`;
  aviso.hidden = false;
  document.body.style.overflow = 'hidden';
}

/* ---------- Contato e endereço no rodapé ---------- */
function preencherContato() {
  const whats = $('rodape-whats');
  whats.href = `https://wa.me/${CONFIG.whatsapp}`;
  whats.textContent = `WhatsApp ${CONFIG.whatsappExibicao}`;
  $('rodape-endereco').textContent = CONFIG.endereco;
  $('rodape-horario').textContent = CONFIG.horario;
  $('rodape-atendimento').textContent = CONFIG.atendimento;
  $('rodape-insta').href = `https://www.instagram.com/${CONFIG.instagram}/`;
  $('rodape-insta-texto').textContent = `@${CONFIG.instagram}`;
}

/* ---------- Cardápio ---------- */
function renderizarCardapio() {
  $('cardapio').innerHTML = CATEGORIAS.map((cat) => `
    <section id="${cat.id}" class="categoria categoria--${cat.tema}">
      <h2 class="categoria__titulo">${escapar(cat.titulo)}</h2>
      ${cat.subtitulo ? `<p class="categoria__sub">${escapar(cat.subtitulo)}</p>` : ''}
      <div class="itens">
        ${cat.itens.map((item) => `
          <article class="item">
            <div class="item__cabeca">
              <h3 class="item__nome">${escapar(item.nome)}</h3>
              ${item.selo ? `<span class="selo selo--${item.selo.toLowerCase()}">${escapar(item.selo)}</span>` : ''}
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
}

/* ---------- Oferta do dia ---------- */
function renderizarOferta() {
  const oferta = OFERTAS_DA_SEMANA.find((o) => o.dia === new Date().getDay());
  if (!oferta) return;

  const produtos = oferta.itens.map((id) => PRODUTOS_OFERTA[id]).filter(Boolean);
  const precoOriginal = produtos.reduce((soma, p) => soma + p.preco, 0);
  if (!precoOriginal) return;

  const precoFinal = precoOriginal * (1 - oferta.desconto);
  const secao = $('oferta');
  secao.innerHTML = `
    <span class="oferta__selo">Oferta de hoje</span>
    <h2 class="oferta__titulo">${escapar(oferta.titulo)}</h2>
    <p class="oferta__itens">${produtos.map((p) => escapar(p.nome)).join(' + ')}</p>
    <p class="oferta__de">De ${moeda(precoOriginal)}</p>
    <p class="oferta__por">Por apenas ${moeda(precoFinal)}</p>
    <p class="oferta__validade">Válida somente hoje</p>`;
  secao.hidden = false;
  $('nav-oferta').hidden = false;
}

/* ---------- Banner de fotos ---------- */
function iniciarBanner() {
  const banner = $('banner');
  const trilho = $('banner-trilho');
  const pontos = $('banner-pontos');

  const slideMarca = () => `
    <div class="slide slide--marca">
      <div>
        <img class="slide__logo" src="img/logo.png" alt="Casa das Pizzas" width="140" height="140">
        <p class="slide__texto">As melhores pizzas da cidade. Peça pelo WhatsApp.</p>
      </div>
    </div>`;

  trilho.innerHTML = BANNERS.length
    ? BANNERS.map((b, i) => `
        <figure class="slide">
          <picture>
            ${b.mobile ? `<source media="(max-width: 799px)" srcset="${escapar(b.mobile)}">` : ''}
            <img class="slide__img" src="${escapar(b.imagem)}" alt="${escapar(b.titulo || 'Pizza da Casa das Pizzas')}"
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

    // Mensagem enviada ao WhatsApp. O formato é o mesmo de sempre.
    const formas = { dinheiro: '💵 Dinheiro', pix: '📱 PIX' };
    let mensagem = `🍕 *NOVO PEDIDO - CasadasPizzaass* 🍕\n\n` +
      `*Cliente:* ${nome.value}\n` +
      `*Contato:* ${telefone.value}\n` +
      `*Endereço:* ${endereco.value}\n\n` +
      `*Pedido Detalhado:*\n${pedido.value}\n\n` +
      `*Pagamento:* ${formas[pagamento.value]}\n\n`;

    if (pagamento.value === 'pix') {
      mensagem += `*Dados para PIX:*\n*Chave (Celular):* ${CONFIG.pix.chave}\n*Nome:* ${CONFIG.pix.nome}\n\n_O pedido só é liberado após o envio do comprovante._\n\n`;
    }
    mensagem += `_Pedido enviado via cardápio digital._`;

    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`, '_blank');
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
document.addEventListener('DOMContentLoaded', () => {
  verificarLoja();
  preencherContato();
  iniciarBanner();
  renderizarOferta();
  renderizarCardapio();
  iniciarFormulario();
  iniciarBarraFixa();
  iniciarPWA();
});

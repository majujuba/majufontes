/* PÁGINAS DE PROJETO NO CELULAR — o comportamento comum (o visual está em assets/projeto-celular.css):
   - cada imagem fica com a mesma proporção do computador (e o mesmo recorte)
   - o título diminui só se uma palavra não couber na largura da tela
   - o botão "saiba mais!" abre e fecha o texto do projeto (#sobre-projeto) sem sair da página
   Carregar no fim do <body>. No computador não muda nada. */
(() => {
  const html = document.documentElement;
  const celular = () => html.classList.contains('celular');

  document.querySelectorAll('.page > .bloco, .page > .peca').forEach(b => {
    const w = parseFloat(b.style.width), h = parseFloat(b.style.height);
    if (w && h) b.style.setProperty('--ar', w + ' / ' + h);
  });

  // título: começa em 27vw (CSS) e diminui de 1 em 1 até a maior palavra caber
  const titulo = document.querySelector('.titulo');
  function cabeTitulo() {
    if (!titulo) return;
    titulo.style.fontSize = '';
    if (!celular()) return;
    let vw = 27;
    while (vw > 12 && titulo.scrollWidth > titulo.clientWidth + 1) { vw -= 1; titulo.style.fontSize = vw + 'vw'; }
  }
  cabeTitulo();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(cabeTitulo);
  addEventListener('celular-mudou', cabeTitulo);
  addEventListener('orientationchange', () => setTimeout(cabeTitulo, 300));

  /* estampas / adesivos soltos (Dengo, Lord Ruthven): no celular vão para o espaço .campo-adesivos, depois das imagens.
     data-arranjo="grade": 3 por fileira, todas do mesmo tamanho aproximado, alternando a altura como no computador;
     sem ele: a mesma composição do computador, reduzida até caber no espaço.
     As que a pessoa já arrastou ficam onde ela deixou; voltando ao layout do computador, todas voltam ao lugar de lá. */
  const campo = document.querySelector('.campo-adesivos');
  const adesivos = [...document.querySelectorAll('.adesivo')];
  if (campo && adesivos.length) {
    const original = adesivos.map(el => el.getAttribute('style') || '');
    const num = (s, k) => parseFloat((s.match(new RegExp('(?:^|;)\\s*' + k + ':\\s*([\\d.]+)')) || [0, 0])[1]);
    const dados = adesivos.map((el, i) => ({ el, i, x: num(original[i], 'left'), y: num(original[i], 'top'), w: num(original[i], 'width'), h: num(original[i], 'height') }));
    const arrastou = new Set();
    adesivos.forEach(el => el.addEventListener('pointerdown', () => arrastou.add(el)));
    const poe = (d, x, y, esc) => { if (!arrastou.has(d.el)) Object.assign(d.el.style, { left: x + 'px', top: y + 'px', width: d.w * esc + 'px', height: d.h * esc + 'px' }); };
    const arruma = () => {
      if (!celular()) { adesivos.forEach((el, i) => el.setAttribute('style', original[i])); arrastou.clear(); return; }
      const L = campo.offsetLeft, T = campo.offsetTop, W = campo.offsetWidth, H = campo.offsetHeight;
      if (campo.dataset.arranjo === 'grade') {
        const esc = W / 3 * .82 / Math.max(...dados.map(d => d.w));
        [...dados].sort((a, b) => a.x - b.x).forEach((d, k) => {
          const col = k % 3, lin = Math.floor(k / 3), linhas = Math.ceil(dados.length / 3);
          const cx = L + W * (col + .5) / 3, cy = T + H * (lin + .5) / linhas + (col % 2 ? H * .04 : -H * .04);
          poe(d, cx - d.w * esc / 2, cy - d.h * esc / 2, esc);
        });
      } else {
        const x0 = Math.min(...dados.map(d => d.x)), x1 = Math.max(...dados.map(d => d.x + d.w));
        const y0 = Math.min(...dados.map(d => d.y)), y1 = Math.max(...dados.map(d => d.y + d.h));
        const esc = Math.min(W / (x1 - x0), H / (y1 - y0));
        const dx = L + (W - (x1 - x0) * esc) / 2, dy = T + (H - (y1 - y0) * esc) / 2;
        dados.forEach(d => poe(d, dx + (d.x - x0) * esc, dy + (d.y - y0) * esc, esc));
      }
    };
    arruma();
    addEventListener('load', arruma);
    addEventListener('celular-mudou', arruma);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(arruma);   // o título pode mudar de tamanho e empurrar a página
  }

  const botao = document.querySelector('.saiba-mais'), sec = document.getElementById('sobre-projeto');
  if (!botao || !sec) return;
  const txt = botao.querySelector('.txt');
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DURA = calmo ? 0 : 720;   // um pouco mais que a transição da altura (.7 s)
  const altura = v => sec.style.setProperty('height', v, 'important');
  let aberta = false, fim = 0, troca = 0, rolando = 0;
  const suave = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function acompanha(de, dist) {
    cancelAnimationFrame(rolando);
    if (calmo) { scrollTo(0, de + dist); return; }
    const t0 = performance.now(), MS = 900;
    const para = () => { cancelAnimationFrame(rolando); removeEventListener('touchstart', para); removeEventListener('wheel', para); };
    addEventListener('touchstart', para, { passive: true, once: true });   // se a pessoa rolar por conta própria, para de puxar
    addEventListener('wheel', para, { passive: true, once: true });
    (function passo(t) {
      const p = Math.min(1, (t - t0) / MS);
      scrollTo(0, de + dist * suave(p));
      if (p < 1 && aberta) rolando = requestAnimationFrame(passo); else para();
    })(t0);
  }

  function alterna() {
    aberta = !aberta;
    botao.setAttribute('aria-expanded', String(aberta));
    // o texto do botão esmaece e volta já trocado
    clearTimeout(troca);
    botao.classList.add('troca');
    troca = setTimeout(() => { txt.textContent = aberta ? 'fechar' : 'saiba mais!'; botao.classList.remove('troca'); }, calmo ? 0 : 220);

    clearTimeout(fim);
    altura(sec.getBoundingClientRect().height + 'px');   // parte da altura atual (mesmo no meio de outra animação)
    sec.offsetHeight;
    if (aberta) {
      sec.classList.add('aberta', 'visivel');
      const alvo = sec.scrollHeight;
      altura(alvo + 'px');
      fim = setTimeout(() => altura('auto'), DURA);
      // rola junto com a abertura até o texto inteiro aparecer, sem deixar o botão sumir por cima
      // (quadro a quadro: no começo a página ainda não cresceu, e um scrollBy suave pararia no fim antigo)
      const b = botao.getBoundingClientRect(), s = sec.getBoundingClientRect();
      const falta = Math.min(s.top + alvo + 24 - innerHeight, b.top - 56 - 16);
      if (falta > 0) acompanha(scrollY, falta);
    } else {
      sec.classList.remove('aberta');
      altura('0px');
      fim = setTimeout(() => sec.style.removeProperty('height'), DURA);
    }
  }
  botao.addEventListener('click', alterna);
  // voltando ao layout do computador (janela alargada), o texto fica como lá: sempre à mostra
  addEventListener('celular-mudou', () => {
    if (celular()) return;
    clearTimeout(fim); sec.style.removeProperty('height');
    if (aberta) { aberta = false; sec.classList.remove('aberta'); botao.setAttribute('aria-expanded', 'false'); txt.textContent = 'saiba mais!'; }
  });
})();

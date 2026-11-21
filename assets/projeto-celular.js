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

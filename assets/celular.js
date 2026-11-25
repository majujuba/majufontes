/* VERSÃO CELULAR — decide, antes de a página desenhar, se ela abre no layout de celular.
   (carregar no <head>, logo depois da <meta name="viewport">, SEM defer)

   - celular (o lado menor da tela até 600px, em pé ou deitado): viewport com a largura do aparelho
     e a classe "celular" no <html>; o CSS de cada página e o assets/celular.css cuidam do layout
   - tablet e computador: tudo como antes (viewport de 1280px, layout desktop intocado)
   - computador com a janela estreita (até 760px): também usa o layout de celular (ajuda a testar) */
(function () {
  var html = document.documentElement;
  var vp = document.querySelector('meta[name="viewport"]');
  var curto = Math.min(screen.width || 9999, screen.height || 9999);
  var aparelho = curto <= 600;
  if (vp) vp.setAttribute('content', aparelho ? 'width=device-width, initial-scale=1, viewport-fit=cover' : 'width=1280');

  function confere() {
    // janela minimizada (ou ainda sem tamanho) tem largura 0: não conta como celular
    var celular = aparelho || (window.innerWidth > 0 && window.innerWidth <= 760);
    if (celular !== html.classList.contains('celular')) {
      html.classList.toggle('celular', celular);
      window.__celular = celular;
      try { window.dispatchEvent(new Event('celular-mudou')); } catch (e) {}
    }
  }
  window.__celular = false;
  confere();
  if (!aparelho) window.addEventListener('resize', confere);
})();

/* COMPUTADOR — ESCALA CONTÍNUA DA PÁGINA
   Cada página do computador é uma composição de 1490px de largura (o Figma), centralizada.
   - janela mais estreita que 1490px (ex.: MacBook, 1280–1470px): a composição inteira diminui na mesma proporção
     (CSS zoom em .frame e na header), em vez de ter as laterais cortadas
   - janela mais larga: fica no tamanho do Figma (não estica) e centralizada; a header acompanha as margens do conteúdo
   Variáveis no <html>: --escala (0–1), --larg (largura da janela em px da página, para fundos que vão de ponta a ponta)
   e --margem (sobra de cada lado). window.retangulo(el) devolve a caixa do elemento em px da janela em qualquer
   navegador (o Safari mede elementos com zoom sem a escala; o Chrome com ela). No celular nada disso vale. */
(function () {
  var html = document.documentElement, LARGURA = 1490;
  var css = document.createElement('style');
  css.textContent =
    'html:not(.celular) .frame, html:not(.celular) header.header { zoom: var(--escala, 1); }' +
    // header: estrela e links nas bordas da janela, com margens proporcionais à largura (--margem-header-esq / -dir)
    'html:not(.celular) header.header .estrela { translate: var(--margem-header-esq, 0px) 0; }' +
    'html:not(.celular) header.header .nav { translate: calc(-1 * var(--margem-header-dir, 0px)) 0; }';
  document.head.appendChild(css);
  var k = 1, fator = null;
  function escala() {
    var cel = html.classList.contains('celular');
    var cw = html.clientWidth || window.innerWidth || LARGURA;
    k = cel ? 1 : Math.min(1, cw / LARGURA);
    html.style.setProperty('--escala', String(k));
    html.style.setProperty('--larg', (cw / k) + 'px');
    html.style.setProperty('--margem', cel ? '0px' : Math.max(0, (cw / k - LARGURA) / 2) + 'px');
    // header: margens laterais proporcionais à largura da janela, como na referência dela (estrela a 4,8% da borda esquerda,
    // "contact" a 4,2% da direita), em qualquer largura do computador; no Figma (1490px) eram 51px dos dois lados
    const W = cw / k;
    html.style.setProperty('--margem-header-esq', cel ? '0px' : (W * 0.048 - 51) + 'px');
    html.style.setProperty('--margem-header-dir', cel ? '0px' : (W * 0.042 - 51) + 'px');
    window.escalaPagina = k;
    fator = null;
  }
  // quanto multiplicar uma medida do getBoundingClientRect (de algo dentro de .frame) para ter px da janela
  function multiplicador() {
    if (fator === null) {
      var p = document.querySelector('.frame .page') || document.querySelector('.page');
      var r = p && p.getBoundingClientRect().width, w = p && p.offsetWidth;
      fator = (r && w) ? k / (r / w) : 1;
      if (Math.abs(fator - 1) < 0.002) fator = 1;
    }
    return fator;
  }
  window.retangulo = function (el) {
    var r = el.getBoundingClientRect(), m = multiplicador();
    if (m === 1) return r;
    return { left: r.left * m, top: r.top * m, right: r.right * m, bottom: r.bottom * m, width: r.width * m, height: r.height * m, x: r.left * m, y: r.top * m };
  };
  escala();
  window.addEventListener('resize', escala);
  window.addEventListener('celular-mudou', escala);
  window.addEventListener('DOMContentLoaded', escala);   // a barra de rolagem pode mudar a largura útil
})();

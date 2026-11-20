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

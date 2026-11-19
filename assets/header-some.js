/* Páginas de trabalho: a header sobe suavemente quando a pessoa rola para baixo
   e volta quando ela rola para cima (ou chega ao topo da página). */
(() => {
  const header = document.querySelector('.header');
  if (!header) return;
  const estilo = document.createElement('style');
  estilo.textContent =
    '.header { transition: transform .5s cubic-bezier(.4,0,.2,1); will-change: transform; }' +
    '.header.escondida { transform: translateY(-100%); }' +
    '@media (prefers-reduced-motion: reduce) { .header { transition: none; } }';
  document.head.appendChild(estilo);

  const TOPO = 60;        // perto do topo, a header fica sempre visível
  const FOLGA = 8;        // ignora tremidinhas da rolagem (trackpad)
  let ultimo = scrollY, pedido = false;

  function atualiza() {
    pedido = false;
    const y = scrollY, delta = y - ultimo;
    if (y <= TOPO) header.classList.remove('escondida');
    else if (delta > FOLGA) header.classList.add('escondida');
    else if (delta < -FOLGA) header.classList.remove('escondida');
    else return;          // movimento pequeno: guarda a referência antiga
    ultimo = y;
  }
  addEventListener('scroll', () => { if (!pedido) { pedido = true; requestAnimationFrame(atualiza); } }, { passive: true });
  // navegando pelo teclado (Tab), a header aparece para o foco não ficar escondido
  header.addEventListener('focusin', () => header.classList.remove('escondida'));
})();

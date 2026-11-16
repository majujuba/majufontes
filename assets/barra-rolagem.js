/* BARRA DE ROLAGEM PERSONALIZADA (estilo em assets/barra-rolagem.css).
   Acompanha a rolagem da página; dá para arrastar a barra e clicar no trilho para pular até o ponto. */
(() => {
  /* ================== AJUSTES ================== */
  const MINIMO = 48;          // altura mínima da barra (px)
  const ASPEREZA = 2.4;       // quanto a borda "treme" (0 = lisa)
  const GRAO = 0.9;           // tamanho do grão da textura (maior = mais miúdo)
  const MARGEM = 6;           // espaço livre em cima e embaixo da barra, dentro do trilho (px)
  /* ============================================ */
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  svg.innerHTML = `<filter id="barra-aspera" x="-40%" y="-5%" width="180%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="${GRAO}" numOctaves="2" seed="4" result="ruido"/>
    <feDisplacementMap in="SourceGraphic" in2="ruido" scale="${ASPEREZA}" xChannelSelector="R" yChannelSelector="G"/>
  </filter>`;
  const trilho = document.createElement('div');
  trilho.className = 'barra-trilho';
  trilho.setAttribute('aria-hidden', 'true');
  const polegar = document.createElement('div');
  polegar.className = 'barra-polegar';
  trilho.appendChild(polegar);

  const raiz = document.scrollingElement || document.documentElement;
  let alturaPolegar = MINIMO, pedido = false;

  function mede() {
    pedido = false;
    const total = raiz.scrollHeight, janela = innerHeight, H = (trilho.clientHeight || janela) - 2 * MARGEM;
    const sobra = total - janela;
    trilho.classList.toggle('sem-rolagem', sobra <= 1);
    if (sobra <= 1) return;
    alturaPolegar = Math.max(MINIMO, Math.round(H * janela / total));
    polegar.style.height = alturaPolegar + 'px';
    const y = (raiz.scrollTop / sobra) * (H - alturaPolegar);
    polegar.style.transform = `translateY(${(MARGEM + y).toFixed(1)}px)`;
  }
  const agenda = () => { if (!pedido) { pedido = true; requestAnimationFrame(mede); } };

  // arrastar a barra
  let inicioY = 0, inicioRolagem = 0;
  polegar.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    polegar.setPointerCapture(e.pointerId);
    polegar.classList.add('arrastando'); document.documentElement.classList.add('arrastando-barra');
    inicioY = e.clientY; inicioRolagem = raiz.scrollTop;
  });
  polegar.addEventListener('pointermove', e => {
    if (!polegar.hasPointerCapture(e.pointerId)) return;
    const H = trilho.clientHeight - 2 * MARGEM, sobra = raiz.scrollHeight - innerHeight;
    const fator = sobra / Math.max(1, H - alturaPolegar);
    raiz.scrollTop = inicioRolagem + (e.clientY - inicioY) * fator;
  });
  const solta = e => {
    if (polegar.hasPointerCapture && polegar.hasPointerCapture(e.pointerId)) polegar.releasePointerCapture(e.pointerId);
    polegar.classList.remove('arrastando'); document.documentElement.classList.remove('arrastando-barra');
  };
  polegar.addEventListener('pointerup', solta);
  polegar.addEventListener('pointercancel', solta);

  // clicar no trilho: a barra vai até o ponto clicado (com rolagem suave)
  trilho.addEventListener('pointerdown', e => {
    if (e.target !== trilho || e.button !== 0) return;
    e.preventDefault();
    const H = trilho.clientHeight - 2 * MARGEM, sobra = raiz.scrollHeight - innerHeight;
    const alvo = (e.clientY - MARGEM - alturaPolegar / 2) / Math.max(1, H - alturaPolegar) * sobra;
    scrollTo({ top: Math.max(0, Math.min(sobra, alvo)), behavior: 'smooth' });
  });

  function monta() {
    document.body.appendChild(svg);
    document.body.appendChild(trilho);
    mede();
    addEventListener('scroll', agenda, { passive: true });
    addEventListener('resize', agenda);
    addEventListener('load', agenda);
    if ('ResizeObserver' in window) new ResizeObserver(agenda).observe(document.body);
  }
  if (document.body) monta(); else addEventListener('DOMContentLoaded', monta, { once: true });
})();

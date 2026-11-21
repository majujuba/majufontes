/* BARRAS DO NAVEGADOR NO CELULAR — a barra de cima fica da cor da header da página e a de baixo
   (e o fundo que aparece ao "puxar" a página além do fim) da cor do rodapé.
   Sem isso o Safari do iPhone pegava a cor da tela de carregamento / da transição de pixels (azul).
   Carregar no <head> de todas as páginas. */
(() => {
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  document.head.appendChild(meta);
  const vazia = c => !c || c === 'transparent' || /^rgba\(.*,\s*0\)$/.test(c);
  function aplica() {
    const h = document.querySelector('header.header'), r = document.querySelector('.rodape');
    const corH = h && getComputedStyle(h).backgroundColor;
    let corR = r && getComputedStyle(r, '::before').backgroundColor;
    if (r && vazia(corR)) corR = getComputedStyle(r).backgroundColor;
    if (!vazia(corH)) meta.content = corH;
    // o conteúdo das páginas tem fundo próprio: esta cor só aparece fora dele (barra de baixo, "puxar" a página)
    if (!vazia(corR)) document.documentElement.style.backgroundColor = corR;
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', aplica); else aplica();
})();

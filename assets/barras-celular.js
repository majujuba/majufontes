/* BARRAS DO NAVEGADOR NO CELULAR — a barra de cima fica da cor da header da página e a de baixo
   (e o fundo que aparece ao "puxar" a página além do fim) da cor do rodapé.
   Enquanto uma camada cobre a tela inteira (transição de pixels, tela de carregamento, menu), a barra de cima
   fica da cor dela, para a tela ficar integrada de ponta a ponta (pedido dela): window.corBarra.poe(cor) / .volta().
   A transição de pixels chega antes deste script (fica antes no <head>) e avisa por window.__corBarraInicial.
   Carregar no <head> de todas as páginas. */
(() => {
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  document.head.appendChild(meta);
  const vazia = c => !c || c === 'transparent' || /^rgba\(.*,\s*0\)$/.test(c);
  let imposta = window.__corBarraInicial || null;   // cor de uma camada que cobre a tela
  let corHeader = null;
  const atualiza = () => { const c = imposta || corHeader; if (c) meta.content = c; };
  window.corBarra = {
    poe(cor) { imposta = cor; atualiza(); },
    volta() { imposta = null; atualiza(); }
  };
  atualiza();
  function aplica() {
    const h = document.querySelector('header.header'), r = document.querySelector('.rodape');
    const corH = h && getComputedStyle(h).backgroundColor;
    let corR = r && getComputedStyle(r, '::before').backgroundColor;
    if (r && vazia(corR)) corR = getComputedStyle(r).backgroundColor;
    if (!vazia(corH)) corHeader = corH;
    atualiza();
    // o conteúdo das páginas tem fundo próprio: esta cor só aparece fora dele (barra de baixo, "puxar" a página)
    // o <body> também: o Safari do iPhone pinta o espaço abaixo do rodapé (atrás da barra de baixo) com a cor do body,
    // que era o cinza do site — aparecia uma faixa clara no fim da página (pedido dela)
    if (!vazia(corR)) document.documentElement.style.backgroundColor = document.body.style.backgroundColor = corR;
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', aplica); else aplica();
})();

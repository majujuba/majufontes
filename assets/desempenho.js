/* DESEMPENHO DURANTE A ROLAGEM
   Enquanto a página rola, as animações mais pesadas (ondulação das flores e da faixa) dão uma pausa
   e continuam de onde pararam logo que a rolagem termina — assim a rolagem não engasga.
   - flores (iframes): recebem as mensagens 'onda-pausa' / 'onda-segue'
   - scripts desta página: eventos 'rolagem-inicio' / 'rolagem-fim' e window.__rolando */
(() => {
  const ESPERA = 180;   // ms sem rolar para considerar que a rolagem terminou
  let timer = null;
  window.__rolando = false;
  const avisa = msg => document.querySelectorAll('iframe').forEach(f => {
    try { f.contentWindow && f.contentWindow.postMessage(msg, '*'); } catch (e) {}
  });
  addEventListener('scroll', () => {
    if (!window.__rolando) {
      window.__rolando = true;
      avisa('onda-pausa');
      dispatchEvent(new Event('rolagem-inicio'));
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      window.__rolando = false;
      avisa('onda-segue');
      dispatchEvent(new Event('rolagem-fim'));
    }, ESPERA);
  }, { passive: true });
})();

/* PREPARAR ANTES DE APARECER
   O que mais engasga quando os blocos surgem (fade in) é o navegador decodificar fotos grandes e começar
   a baixar/abrir os vídeos exatamente nesse momento. Aqui isso é feito um pouco antes, enquanto o bloco
   ainda está uma tela e meia abaixo: as fotos já chegam decodificadas e os vídeos já com dados baixados. */
(() => {
  if (!('IntersectionObserver' in window)) return;
  const prepara = el => {
    if (el.tagName === 'IMG') {
      el.loading = 'eager';
      if (el.decode) el.decode().catch(() => {});
    } else if (el.tagName === 'VIDEO') {
      if (el.preload !== 'auto') { el.preload = 'auto'; try { el.load(); } catch (e) {} }
    }
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { prepara(e.target); io.unobserve(e.target); }
  }), { rootMargin: '150% 0px' });
  const inicia = () => {
    document.querySelectorAll('img[loading="lazy"]').forEach(i => io.observe(i));
    // vídeos em loop (os GIFs); a abertura com som continua carregando só quando a pessoa der play
    document.querySelectorAll('video[muted][loop]:not(.abertura), video[loop]:not(.abertura)').forEach(v => io.observe(v));
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', inicia); else inicia();
})();

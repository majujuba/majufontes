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

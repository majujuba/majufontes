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
      if (el.preload !== 'auto') {
        el.preload = 'auto';
        // só recarrega se o vídeo ainda não começou; se já estiver na tela, volta a tocar depois de carregar
        if (el.readyState === 0 && el.paused) {
          try { el.load(); } catch (e) {}
          const r = window.retangulo ? retangulo(el) : el.getBoundingClientRect();
          if (el.loop && el.muted && r.bottom > 0 && r.top < innerHeight) el.play().catch(() => {});
        }
      }
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

/* SURGIR AO ROLAR (fade in) — comum a todas as páginas (antes repetido em cada uma):
   cada .fade-in-element aparece (uma vez) quando entra na tela, depois que a tela de carregamento sai */
(() => {
  const MARGEM = 16;   // quantos px o elemento precisa ter entrado na tela para aparecer
  let pendentes = [...document.querySelectorAll('.fade-in-element')];
  if (!pendentes.length) return;
  let pedido = false;
  function confere() {
    pedido = false;
    if (!window.__carregou) return;                 // espera a tela de carregamento sair
    // só a posição vertical importa; o que já ficou acima da tela também aparece
    pendentes = pendentes.filter(e => {
      if (retangulo(e).top < innerHeight - MARGEM) { e.classList.add('visivel'); return false; }
      return true;
    });
    if (!pendentes.length) { removeEventListener('scroll', agenda); removeEventListener('resize', agenda); }
  }
  function agenda() { if (!pedido) { pedido = true; requestAnimationFrame(confere); } }
  addEventListener('scroll', agenda, { passive: true });
  addEventListener('resize', agenda);
  if (window.quandoCarregar) quandoCarregar(agenda); else agenda();
})();

/* VÍDEOS SÓ TOCAM NA TELA (os GIFs do Figma, os olhos do topo…) — economiza processamento (antes repetido nas páginas de projeto).
   Ficam de fora a abertura com som da A Substância (só toca no play) e as capas do celular da work (têm o próprio controle). */
(() => {
  const videos = [...document.querySelectorAll('video:not(.abertura):not(.capa-celular)')];
  if (!videos.length) return;
  if (!('IntersectionObserver' in window)) { videos.forEach(v => v.play().catch(() => {})); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) e.target.play().catch(() => {}); else e.target.pause();
  }), { rootMargin: '200px 0px' });
  videos.forEach(v => io.observe(v));
})();

/* CAPAS DO CELULAR DA WORK (TipoSP, A Substância, Fósforo): só tocam no layout de celular e enquanto estão na tela.
   No computador ficam escondidas e nem carregam (preload="none") */
(() => {
  const videos = [...document.querySelectorAll('video.capa-celular')];
  if (!videos.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && document.documentElement.classList.contains('celular')) e.target.play().catch(() => {});
    else e.target.pause();
  }), { rootMargin: '200px 0px' });
  videos.forEach(v => io.observe(v));
})();

/* ESTRELA DO RODAPÉ = "VOLTAR AO TOPO" (todas as páginas, computador e celular)
   A estrela continua igual (imagem, tamanho, lugar); vira um botão: clique, Enter ou Espaço rolam a página até o topo.
   Rolagem própria (requestAnimationFrame, curva easeOutExpo: sai fluida e pousa devagar no topo), com duração proporcional à distância (1,1 s a 1,5 s);
   se a pessoa rolar por conta própria no meio (roda, toque, teclas), a rolagem para na hora.
   Com "reduzir movimento" no sistema, vai direto ao topo. */
(() => {
  const estrela = document.querySelector('.rodape .estrela');
  if (!estrela) return;
  estrela.setAttribute('role', 'button');
  estrela.setAttribute('tabindex', '0');
  estrela.setAttribute('aria-label', 'voltar ao topo da página');
  estrela.setAttribute('title', 'voltar ao topo');
  estrela.style.cursor = 'pointer';
  const calmo = matchMedia('(prefers-reduced-motion: reduce)');
  // easeOutExpo: a subida sai fluida e desacelera bem devagar nos últimos pixels — a página "pousa" no topo
  const suave = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  let quadro = 0;
  const para = () => {
    cancelAnimationFrame(quadro); quadro = 0;
    removeEventListener('wheel', para); removeEventListener('touchstart', para); removeEventListener('keydown', paraTecla);
  };
  const paraTecla = e => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) para(); };
  function sobe() {
    para();
    const de = scrollY;
    if (de <= 0) return;
    if (calmo.matches) { scrollTo(0, 0); return; }
    const dura = Math.min(1500, Math.max(1100, 1000 + de * 0.08));   // 1,1 s a 1,5 s, conforme a distância
    const t0 = performance.now();
    addEventListener('wheel', para, { passive: true });
    addEventListener('touchstart', para, { passive: true });
    addEventListener('keydown', paraTecla);
    const passo = agora => {
      const p = Math.min(1, (agora - t0) / dura);
      scrollTo(0, de * (1 - suave(p)));
      if (p < 1) quadro = requestAnimationFrame(passo); else para();
    };
    quadro = requestAnimationFrame(passo);
  }
  estrela.addEventListener('click', sobe);
  estrela.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); sobe(); }
  });
})();

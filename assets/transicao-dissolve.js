/* TRANSIÇÃO DE PIXELS QUE SE DISSOLVEM — em toda troca de página do site, como no vídeo de referência.
   Página de saída: ao clicar num link para outra página do site, quadrados coloridos cobrem a tela em ordem aleatória.
   Página de chegada: abre já coberta e os quadrados somem aos poucos.
   Carregar no <head> de todas as páginas (precisa agir antes do primeiro desenho da página de chegada). */
(() => {
  /* ================== AJUSTES ================== */
  const CORES = [            // cor e peso (proporção no vídeo)
    ['#3F3166', 40],         // roxo
    ['#731212', 20],         // vinho
    ['#B2C3D8', 22],         // azul-claro
    ['#D8D8D8', 18]          // cinza-claro
  ];
  const COLUNAS = 48;        // quadrados por linha (≈ largura da tela / 48) — era 30
  const COBRIR_MS = 500;     // quadrados aparecendo até cobrir a tela (cada um esmaece ao entrar) — era 320
  const SEGURAR_MS = 100;    // pausa já na about, coberta
  const DISSOLVER_MS = 500;  // quadrados sumindo — igual ao tempo de surgir
  const ESQ_DIR = 0;         // ordem de sumir: 0 = aleatória, igual à de surgir (era 0,6, da esquerda para a direita)
  const FADE = 0.14;         // fração do tempo em que cada quadrado esmaece (0 = some de uma vez)
  const DESTINO = /(^|\/)[\w-]+\.html(\?|#|$)/;   // qualquer página do site (about, work e projetos) chega pela transição — menos a home
  /* ============================================ */
  const CHAVE = 'maju-dissolve-chegada';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ss = {
    get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: k => { try { sessionStorage.removeItem(k); } catch (e) {} }
  };

  const total = CORES.reduce((s, c) => s + c[1], 0);
  const sorteiaCor = () => { let r = Math.random() * total; for (let k = 0; k < CORES.length; k++) if ((r -= CORES[k][1]) <= 0) return k; return 0; };
  const CHAVE_CORES = 'maju-dissolve-cores';   // a Home guarda as cores sorteadas; a about usa as mesmas

  function criaTela(salvas) {
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true'); cv.setAttribute('data-transicao', '');
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483000;pointer-events:none;display:block';
    // no celular fica presa à página, na altura da rolagem atual: fixa na tela, o Safari do iPhone pintava as barras do navegador com ela
    if (matchMedia('(hover: none), (pointer: coarse)').matches)
      cv.style.cssText = 'position:absolute;left:' + scrollX + 'px;top:' + scrollY + 'px;width:100vw;height:100vh;z-index:2147483000;pointer-events:none;display:block';
    const dpr = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = W / COLUNAS, linhas = Math.ceil(H / s), cel = [];
    // mesmas cores e mesma ordem da página anterior, se a tela tiver o mesmo tamanho (senão, sorteia)
    const igual = salvas && salvas.w === W && salvas.h === H && salvas.c.length === linhas * COLUNAS;
    const usar = igual ? salvas.c : null;
    // a ordem vem de um sorteio com "semente": a mesma semente gera a mesma sequência nas duas páginas
    const semente = igual && salvas.s ? salvas.s : (Math.random() * 4294967296) >>> 0;
    let st = semente;
    const sorteio = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    for (let j = 0; j < linhas; j++) for (let i = 0; i < COLUNAS; i++) {
      const k = usar ? +usar[j * COLUNAS + i] : sorteiaCor();
      cel.push({ x: i * s, y: j * s, k, cor: CORES[k][0], ordem: sorteio(), dir: i / (COLUNAS - 1) });
    }
    return { cv, ctx, W, H, s, cel, semente };
  }
  const pinta = (ctx, c, s, alfa) => { ctx.globalAlpha = alfa; ctx.fillStyle = c.cor; ctx.fillRect(c.x, c.y, s + .6, s + .6); };
  // relógio da animação: conta no máximo 34 ms por quadro. Se o navegador engasgar (página carregando),
  // a animação continua de onde parou em vez de pular pixels — entrada e saída andam no mesmo ritmo
  const relogio = () => { let ultimo = null, acc = 0; return t => { if (ultimo !== null) acc += Math.min(t - ultimo, 34); ultimo = t; return acc; }; };

  /* ---------- Home: clique num link para a about ---------- */
  let saindo = false;
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || saindo || !DESTINO.test(a.getAttribute('href'))) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    const alvo = new URL(a.href, location.href);
    if (alvo.origin !== location.origin && location.protocol !== 'file:') return;   // link para outro site
    if (alvo.pathname === location.pathname) return;   // já está nessa página
    if (/(^|\/)(index\.html)?$/.test(alvo.pathname)) return;   // indo para a home: sem transição (a pedido dela)
    e.preventDefault(); saindo = true;
    const { cv, ctx, W, H, s, cel, semente } = criaTela();
    document.documentElement.appendChild(cv);
    // cada quadrado entra num momento aleatório e esmaece até ficar opaco (sem "estalar")
    for (const c of cel) c.entra = c.ordem * (1 - FADE);
    const rel = relogio();
    let floresEscondidas = false;
    (function quadro(t) {
      const p = Math.min(1, rel(t) / COBRIR_MS);
      ctx.clearRect(0, 0, W, H);
      for (const c of cel) {
        const a = Math.max(0, Math.min(1, (p - c.entra) / FADE));
        if (a > 0) pinta(ctx, c, s, a);
      }
      // com a tela quase coberta, as animações pesadas da página (flores) param de ser desenhadas
      if (!floresEscondidas && p > 0.75) {
        floresEscondidas = true;
        document.querySelectorAll('iframe').forEach(f => { f.style.visibility = 'hidden'; });
      }
      if (p < 1) requestAnimationFrame(quadro);
      else {
        ss.set(CHAVE_CORES, JSON.stringify({ w: W, h: H, c: cel.map(c => c.k).join(''), s: semente }));
        ss.set(CHAVE, String(Date.now()));
        location.href = a.href;
      }
    })(performance.now());
  }, true);
  // voltando pelo botão "voltar", a Home pode vir da memória ainda coberta
  addEventListener('pageshow', e => { if (e.persisted) {
    saindo = false;
    document.querySelectorAll('canvas[data-transicao]').forEach(c => c.remove());
    document.querySelectorAll('iframe').forEach(f => { f.style.visibility = ''; });
  } });

  /* ---------- About: chega coberta e dissolve ---------- */
  // a página de destino pode esperar o fim da dissolução: window.__chegandoDissolve + evento 'transicao-fim'
  const marca = +ss.get(CHAVE);
  window.__chegandoDissolve = false;
  if (marca && Date.now() - marca < 6000) {
    ss.del(CHAVE);
    window.__chegandoDissolve = true;
    let salvas = null;
    try { salvas = JSON.parse(ss.get(CHAVE_CORES)); } catch (e) {}
    ss.del(CHAVE_CORES);
    const { cv, ctx, W, H, s, cel } = criaTela(salvas);
    for (const c of cel) pinta(ctx, c, s, 1);                // já coberta no primeiro quadro
    document.documentElement.appendChild(cv);
    // cada quadrado tem um momento de sumir: parte aleatório, parte da esquerda para a direita
    for (const c of cel) c.some = (ESQ_DIR * c.dir + (1 - ESQ_DIR) * c.ordem) * (1 - FADE);
    const rel = relogio();
    (function quadro(t) {
      const p = Math.max(0, Math.min(1, (rel(t) - SEGURAR_MS) / DISSOLVER_MS));
      ctx.clearRect(0, 0, W, H);
      for (const c of cel) {
        const a = 1 - Math.max(0, Math.min(1, (p - c.some) / FADE));
        if (a > 0) pinta(ctx, c, s, a);
      }
      if (p < 1) requestAnimationFrame(quadro);
      else { cv.remove(); dispatchEvent(new Event('transicao-fim')); }
    })(performance.now());
  }
})();

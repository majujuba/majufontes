/* MENU DO CELULAR — botão "hambúrguer" na header + menu de tela cheia.
   Só aparece no layout de celular (classe "celular" no <html>, ver assets/celular.js);
   no computador nada muda. O visual está em assets/celular.css.

   - o botão usa a cor dos links da header de cada página
   - o fundo do menu é a cor da header da página (na home roxo, na about cinza…), com os links na cor dos links
   - abre com quadradinhos (pixels) que preenchem a tela de cima à direita até embaixo à esquerda;
     depois os links entram um depois do outro. Fecha com os pixels sumindo no mesmo sentido
   - fecha no ✕, na tecla Esc ou ao escolher um link; a página por trás não rola enquanto ele está aberto */
(() => {
  const header = document.querySelector('header.header');
  if (!header) return;
  const html = document.documentElement;
  const aqui = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // cores da página: fundo = cor da header; texto = cor dos links da header
  const corFundo = getComputedStyle(header).backgroundColor || 'rgb(63, 49, 102)';
  const corLink = (() => { const n = header.querySelector('.nav'); return n ? getComputedStyle(n).color : '#D8D8D8'; })();
  const rgb = c => (c.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
  const [fr, fg, fb] = rgb(corFundo);
  const claro = (0.299 * fr + 0.587 * fg + 0.114 * fb) > 150;   // fundo claro (ex.: cinza da about)

  // botão (as duas linhas desenhadas)
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'menu-botao';
  botao.setAttribute('aria-label', 'abrir o menu');
  botao.setAttribute('aria-expanded', 'false');
  botao.setAttribute('aria-controls', 'menu-celular');
  botao.style.color = corLink;
  botao.innerHTML = '<span></span><span></span>';
  header.appendChild(botao);

  // o menu
  const ativo = nome => (aqui === nome || (nome === 'work.html' && aqui.startsWith('work-'))) ? 'aqui' : '';
  const menu = document.createElement('nav');
  menu.className = 'menu-celular' + (claro ? ' claro' : '');
  menu.id = 'menu-celular';
  menu.setAttribute('aria-label', 'menu');
  menu.setAttribute('aria-hidden', 'true');
  menu.style.setProperty('--menu-fundo', corFundo);
  menu.style.setProperty('--menu-texto', claro ? corLink : '#D8D8D8');
  menu.innerHTML =
    '<div class="menu-topo">' +
      '<a class="menu-estrela" href="index.html" aria-label="início"><img src="assets/' + (claro ? 'estrela-roxa.svg' : 'estrela-header.svg') + '" alt=""></a>' +
      '<button type="button" class="menu-fechar" aria-label="fechar o menu"><span></span><span></span></button>' +
    '</div>' +
    '<ul class="menu-links">' +
      '<li><a class="' + ativo('index.html') + '" href="index.html"><small>00</small>home</a></li>' +
      '<li><a class="' + ativo('work.html') + '" href="work.html"><small>01</small>work</a></li>' +
      '<li><a class="' + ativo('about.html') + '" href="about.html"><small>02</small>about</a></li>' +
      '<li><a class="' + ativo('contact.html') + '" href="contact.html"><small>03</small>contact</a></li>' +
    '</ul>' +
    '<div class="menu-flor" aria-hidden="true"></div>';
  document.body.appendChild(menu);
  const fechar = menu.querySelector('.menu-fechar');

  // flor azul animada (carregada na primeira abertura); em fundo claro os pixels ficam roxos para aparecerem
  function poeFlor() {
    const caixa = menu.querySelector('.menu-flor');
    if (caixa.firstChild) return;
    const f = document.createElement('iframe');
    f.src = 'assets/desenho-azul-flor.html';
    f.title = ''; f.tabIndex = -1; f.setAttribute('scrolling', 'no');
    if (claro) f.addEventListener('load', () => {
      try {
        const r = f.contentDocument.documentElement;
        r.style.setProperty('--pixel', corLink);
        r.style.setProperty('--linha', '#799FD3');
      } catch (e) { /* abrindo o arquivo direto do computador o navegador não deixa mexer: fica a cor padrão */ }
    });
    caixa.appendChild(f);
  }

  /* ── pixels: uma tela de quadradinhos na cor do fundo do menu ──
     cada quadradinho aparece (ou some) num tempo que depende da distância até o canto de cima à direita,
     com um pouco de acaso, como a transição de pixels do site */
  const LADO = 22, DURA = 620, ESPALHA = 0.18;
  let tela = null, ctx = null, cels = [], quadro = 0;
  function preparaTela() {
    if (!tela) {
      tela = document.createElement('canvas');
      tela.className = 'menu-pixels';
      tela.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tela);
      ctx = tela.getContext('2d');
    }
    const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    tela.width = Math.ceil(W * dpr); tela.height = Math.ceil(H * dpr);
    tela.style.width = W + 'px'; tela.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cels = [];
    const nx = Math.ceil(W / LADO), ny = Math.ceil(H / LADO), max = (nx - 1) + (ny - 1) || 1;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const d = ((nx - 1 - i) + j) / max;                        // 0 no canto de cima à direita, 1 no de baixo à esquerda
      cels.push({ x: i * LADO, y: j * LADO, t: Math.min(1, Math.max(0, d * (1 - ESPALHA) + Math.random() * ESPALHA)) });
    }
  }
  // enchendo = true: os quadradinhos vão aparecendo; false: vão sumindo (mesmo sentido)
  function anima(enchendo, fim) {
    cancelAnimationFrame(quadro);
    preparaTela();
    tela.style.display = 'block';
    const cor = corFundo, t0 = performance.now();
    const passo = agora => {
      const p = Math.min(1, (agora - t0) / DURA);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.fillStyle = cor;
      for (const c of cels) {
        const visivel = enchendo ? c.t <= p : c.t > p;
        if (visivel) ctx.fillRect(c.x, c.y, LADO + 0.5, LADO + 0.5);
      }
      if (p < 1) quadro = requestAnimationFrame(passo);
      else { if (!enchendo) tela.style.display = 'none'; if (fim) fim(); }
    };
    quadro = requestAnimationFrame(passo);
  }

  let aberto = false;
  function abre() {
    if (aberto || !html.classList.contains('celular')) return;
    aberto = true;
    poeFlor();
    botao.setAttribute('aria-expanded', 'true');
    html.classList.add('menu-aberto');
    const mostra = () => {
      if (!aberto) return;
      menu.setAttribute('aria-hidden', 'false');
      menu.classList.add('aberto');
      if (tela) tela.style.display = 'none';
      setTimeout(() => fechar.focus({ preventScroll: true }), 300);
    };
    if (calmo) mostra(); else anima(true, mostra);
  }
  function fecha(devolveFoco) {
    if (!aberto) return;
    aberto = false;
    menu.classList.remove('aberto');
    menu.setAttribute('aria-hidden', 'true');
    botao.setAttribute('aria-expanded', 'false');
    html.classList.remove('menu-aberto');
    if (!calmo) anima(false, null);   // a tela começa cheia de pixels e eles vão sumindo
    if (devolveFoco) botao.focus({ preventScroll: true });
  }
  botao.addEventListener('click', abre);
  fechar.addEventListener('click', () => fecha(true));
  addEventListener('keydown', e => { if (e.key === 'Escape') fecha(true); });
  // escolher um link: o menu fica por baixo da transição de pixels da página
  menu.addEventListener('click', e => { if (e.target.closest('.menu-links a')) setTimeout(() => { aberto && (menu.classList.remove('aberto'), aberto = false, html.classList.remove('menu-aberto')); }, 900); });
  addEventListener('resize', () => { if (tela && tela.style.display === 'block') preparaTela(); });
  addEventListener('celular-mudou', () => { if (!html.classList.contains('celular')) fecha(false); });
})();

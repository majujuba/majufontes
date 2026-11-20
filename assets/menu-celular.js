/* MENU DO CELULAR — botão "hambúrguer" na header + menu de tela cheia.
   Só aparece no layout de celular (classe "celular" no <html>, ver assets/celular.js);
   no computador nada muda. O visual está em assets/celular.css.

   - o botão usa a cor dos links da header de cada página (roxo, vermelho, cinza…)
   - o menu abre num círculo que cresce a partir do botão; os links entram um depois do outro
   - fecha no ✕, na tecla Esc ou ao escolher um link; a página por trás não rola enquanto ele está aberto */
(() => {
  const header = document.querySelector('header.header');
  if (!header) return;
  const html = document.documentElement;
  const aqui = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const corLink = (() => { const n = header.querySelector('.nav'); return n ? getComputedStyle(n).color : '#D8D8D8'; })();

  // botão (duas linhas que viram um ✕)
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
  const ativo = nome => (aqui === nome || (nome === 'work.html' && aqui.startsWith('work-'))) ? ' aqui' : '';
  const menu = document.createElement('nav');
  menu.className = 'menu-celular';
  menu.id = 'menu-celular';
  menu.setAttribute('aria-label', 'menu');
  menu.setAttribute('aria-hidden', 'true');
  menu.innerHTML =
    '<div class="menu-topo">' +
      '<a class="menu-estrela" href="index.html" aria-label="início"><img src="assets/estrela-header.svg" alt=""></a>' +
      '<button type="button" class="menu-fechar" aria-label="fechar o menu"><span></span><span></span></button>' +
    '</div>' +
    '<ul class="menu-links">' +
      '<li><a class="' + ativo('index.html').trim() + '" href="index.html"><small>00</small>home</a></li>' +
      '<li><a class="' + ativo('work.html').trim() + '" href="work.html"><small>01</small>work</a></li>' +
      '<li><a class="' + ativo('about.html').trim() + '" href="about.html"><small>02</small>about</a></li>' +
      '<li><a class="' + ativo('contact.html').trim() + '" href="contact.html"><small>03</small>contact</a></li>' +
    '</ul>' +
    '<div class="menu-contato">' +
      '<small>entre em contato</small>' +
      '<a class="menu-email" href="mailto:mariafontesju@gmail.com">mariafontesju@gmail.com</a>' +
      '<p><a href="https://www.linkedin.com/in/maria-j%C3%BAlia-fontes-leite/" target="_blank" rel="noopener">linkedIn</a>' +
      '<a href="https://www.behance.net/majufontes" target="_blank" rel="noopener">behance</a></p>' +
    '</div>' +
    '<div class="menu-flor" aria-hidden="true"></div>';
  document.body.appendChild(menu);
  const fechar = menu.querySelector('.menu-fechar');

  let aberto = false;
  function abre() {
    if (aberto || !html.classList.contains('celular')) return;
    aberto = true;
    // a flor animada só é carregada na primeira vez que o menu abre
    const flor = menu.querySelector('.menu-flor');
    if (!flor.firstChild) flor.innerHTML = '<iframe src="assets/desenho-azul-flor.html" title="" tabindex="-1" scrolling="no"></iframe>';
    // o círculo cresce a partir do centro do botão
    const r = botao.getBoundingClientRect();
    menu.style.setProperty('--cx', (r.left + r.width / 2) + 'px');
    menu.style.setProperty('--cy', (r.top + r.height / 2) + 'px');
    menu.setAttribute('aria-hidden', 'false');
    botao.setAttribute('aria-expanded', 'true');
    html.classList.add('menu-aberto');
    requestAnimationFrame(() => menu.classList.add('aberto'));
    setTimeout(() => fechar.focus({ preventScroll: true }), 350);
  }
  function fecha(devolveFoco) {
    if (!aberto) return;
    aberto = false;
    menu.classList.remove('aberto');
    menu.setAttribute('aria-hidden', 'true');
    botao.setAttribute('aria-expanded', 'false');
    html.classList.remove('menu-aberto');
    if (devolveFoco) botao.focus({ preventScroll: true });
  }
  botao.addEventListener('click', abre);
  fechar.addEventListener('click', () => fecha(true));
  addEventListener('keydown', e => { if (e.key === 'Escape') fecha(true); });
  // escolher um link: o menu fecha por baixo da transição de pixels (ou na hora, se for o mesmo endereço)
  menu.addEventListener('click', e => { if (e.target.closest('.menu-links a, .menu-contato a')) setTimeout(() => fecha(false), 400); });
  // se a janela voltar ao layout de computador, o menu fecha
  addEventListener('celular-mudou', () => { if (!html.classList.contains('celular')) fecha(false); });
})();

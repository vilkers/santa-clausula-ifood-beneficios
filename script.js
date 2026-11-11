/* ===========================================================
   Santa Cláusula — iFood Benefícios
   Typewriter simulator
   =========================================================== */

const $ = (id) => document.getElementById(id);

const onboardingModal = $('onboardingModal');
const onboardingForm  = $('onboardingForm');
const sentModal       = $('sentModal');
const lettersModal    = $('lettersModal');
const galleryGrid     = $('galleryGrid');

const fNome    = $('fNome');
const fEmpresa = $('fEmpresa');
const fEmail   = $('fEmail');
const sigName  = $('sigName');
const sigHr    = $('sigHr');

const typewriterField = $('typewriterField');
const paperWrap       = $('paperWrap');
const toggleBtn       = $('toggleTypewriterBtn');
const viewBtn         = $('viewLettersBtn');
const closeLettersBtn = $('closeLettersBtn');
const sendBtn         = $('sendLetterBtn');
const requestSignBtn  = $('requestSignBtn');
const writeAnotherBtn = $('writeAnotherBtn');
const viewCampaignBtn = $('viewCampaignBtn');
const audioToggle     = $('audioToggle');
const audioLabel      = $('audioLabel');

const metaLineEl = $('metaLine');
const metaColEl  = $('metaCol');
const metaBellEl = $('metaBell');

const state = {
  user:      '',
  company:   '',
  userEmail: '',
  hrName:    '',
  hrEmail:   '',
  audio:     true,
  sentOnce:  false,
};

// ======================================================
// AUDIO: pool of real recorded samples (typewritesomething style)
// ======================================================
const AUDIO_FILES = {
  key:       ['assets/audio/key1.mp3', 'assets/audio/key2.mp3', 'assets/audio/key3.mp3'],
  space:     ['assets/audio/space1.mp3', 'assets/audio/space2.mp3'],
  return:    ['assets/audio/return1.mp3', 'assets/audio/return2.mp3'],
  backspace: ['assets/audio/backspace1.mp3'],
};
const POOL_SIZE = 6; // enough parallel voices for fast typing
const audioPools = {};
function initAudioPools() {
  for (const kind of Object.keys(AUDIO_FILES)) {
    audioPools[kind] = AUDIO_FILES[kind].map(src => {
      const pool = [];
      for (let i = 0; i < POOL_SIZE; i++) {
        const a = new Audio(src);
        a.preload = 'auto';
        a.volume = 0.9;
        pool.push(a);
      }
      return pool;
    });
  }
}
let poolCursor = {};
function playKind(kind, vol = 0.9) {
  if (!state.audio) return;
  const variants = audioPools[kind];
  if (!variants || variants.length === 0) return;
  // pick a random variant
  const variant = variants[Math.floor(Math.random() * variants.length)];
  // round-robin cursor over the pool for this variant
  const key = kind + '_' + variants.indexOf(variant);
  poolCursor[key] = ((poolCursor[key] ?? 0) + 1) % variant.length;
  const a = variant[poolCursor[key]];
  try {
    a.currentTime = 0;
    a.volume = vol;
    a.play().catch(() => {});
  } catch (e) {}
}

// ======================================================
// Typing visual pulse (keys glow / strike flash)
// ======================================================
let typingTimer = null;
function pulseTyping() {
  document.body.classList.add('typing');
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => document.body.classList.remove('typing'), 110);
}

// ======================================================
// Line / column tracker + margin bell
// ======================================================
const COLS_PER_LINE = 65;
const BELL_COL = 58;
let bellRangTimer = null;
function updateMeta() {
  const text = typewriterField.innerText || '';
  // find current caret position (lines/cols)
  const sel = window.getSelection();
  let pre = '';
  if (sel && sel.anchorNode && typewriterField.contains(sel.anchorNode)) {
    const range = document.createRange();
    range.selectNodeContents(typewriterField);
    range.setEnd(sel.anchorNode, sel.anchorOffset);
    pre = range.toString();
  } else {
    pre = text;
  }
  const parts = pre.split('\n');
  const line = parts.length;
  const col  = parts[parts.length - 1].length + 1;
  metaLineEl.textContent = line;
  metaColEl.textContent  = col;
  if (col >= BELL_COL && col < BELL_COL + 2) {
    ringBell();
  }
}
function ringBell() {
  if (!metaBellEl) return;
  metaBellEl.classList.add('ring');
  metaBellEl.textContent = '🔔 ding!';
  // ding sound
  playKind('return', 0.4); // reuse the bell from return
  clearTimeout(bellRangTimer);
  bellRangTimer = setTimeout(() => {
    metaBellEl.classList.remove('ring');
    metaBellEl.textContent = '🔔 pronto';
  }, 1200);
}

// ======================================================
// Typewriter field keyboard
// ======================================================
typewriterField.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Enter')      { playKind('return');    pulseTyping(); return; }
  if (e.key === 'Backspace')  { playKind('backspace'); pulseTyping(); return; }
  if (e.key === ' ')          { playKind('space');     pulseTyping(); return; }
  if (e.key.length === 1)     { playKind('key');       pulseTyping(); return; }
});
['keyup', 'input', 'click'].forEach(ev =>
  typewriterField.addEventListener(ev, updateMeta)
);

function focusLetter() {
  setTimeout(() => {
    typewriterField.focus();
    const range = document.createRange();
    range.selectNodeContents(typewriterField);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    updateMeta();
  }, 300);
}

// ======================================================
// Onboarding submit
// ======================================================
onboardingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name      = $('userName').value.trim();
  const company   = $('companyName').value.trim();
  const userEmail = $('userEmail').value.trim();
  const hr        = $('hrName').value.trim();
  const hrEmail   = $('hrEmail').value.trim();

  if (!name || !company || !userEmail || !hr || !hrEmail) return;

  state.user      = name;
  state.company   = company;
  state.userEmail = userEmail;
  state.hrName    = hr;
  state.hrEmail   = hrEmail;

  fNome.textContent    = name;
  fEmpresa.textContent = company;
  fEmail.textContent   = userEmail;
  sigName.textContent  = name;

  onboardingModal.setAttribute('hidden', '');
  onboardingModal.setAttribute('aria-hidden', 'true');

  initAudioPools();
  focusLetter();
});

// ======================================================
// Topbar actions
// ======================================================
toggleBtn.addEventListener('click', () => {
  const enabled = document.body.classList.toggle('machine-mode');
  toggleBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  toggleBtn.classList.toggle('active', enabled);
  // scroll a bit so the typewriter is visible on toggle
  if (enabled) {
    setTimeout(() => {
      window.scrollTo({top: document.body.scrollHeight, behavior:'smooth'});
    }, 50);
  }
});
viewBtn.addEventListener('click', openLetters);
closeLettersBtn.addEventListener('click', () => lettersModal.setAttribute('hidden',''));

// Audio toggle
audioToggle.addEventListener('click', () => {
  state.audio = !state.audio;
  audioLabel.textContent = 'Som: ' + (state.audio ? 'on' : 'off');
  audioToggle.classList.toggle('off', !state.audio);
});

// Request signature
requestSignBtn.addEventListener('click', () => {
  if (sigHr.hidden) {
    sigHr.hidden = false;
    sigHr.querySelector('.sig-hr-name').textContent = state.hrName || 'Aguardando…';
    requestSignBtn.textContent = '✓ Assinatura solicitada';
    requestSignBtn.disabled = true;
    requestSignBtn.style.opacity = '.6';
  }
});

// Send letter
sendBtn.addEventListener('click', () => {
  const content = typewriterField.innerText.trim();
  if (!content || content.length < 10) {
    typewriterField.focus();
    paperWrap.animate(
      [{ transform: 'translateX(0)' },
       { transform: 'translateX(-10px)' },
       { transform: 'translateX(10px)' },
       { transform: 'translateX(0)' }],
      { duration: 320, easing: 'ease-in-out' }
    );
    return;
  }
  playKind('return');
  setTimeout(() => {
    sentModal.removeAttribute('hidden');
    state.sentOnce = true;
  }, 400);
});

writeAnotherBtn.addEventListener('click', () => {
  sentModal.setAttribute('hidden','');
  typewriterField.innerHTML = '';
  focusLetter();
});
viewCampaignBtn.addEventListener('click', () => {
  sentModal.setAttribute('hidden','');
  openLetters();
});

// ======================================================
// Gallery
// ======================================================
const SAMPLE_LETTERS = [
  {
    name: 'Fernanda Ramos',
    company: 'YouDare',
    email: 'fernanda.ramos@youdare.com.br',
    body:
`Fui uma ótima colaboradora este ano. Bebi muita água, dei prazo pro time da criação e fui muito fofa com os clientes 😇  Neste Natal, meu pedido é óbvio: trocar a cesta por saldo livre. Assim, eu escolho o que quero ganhar.

Ativa a Santa Cláusula? 👉 👈`,
    rot: '-1.5deg',
  },
  {
    name: 'João Pedro Lima',
    company: 'Nebula Tech',
    email: 'joao.lima@nebulatech.com',
    body:
`Fechei dois trimestres batendo meta, salvei o Q3 e ainda arrumei o café da copa quando ninguém queria. Não quero panetone, quero liberdade.

Com saldo livre eu escolho se é mercado, farmácia, iFood ou aquele presente pra minha mãe. É só ativar a cláusula.`,
    rot: '1.2deg',
  },
  {
    name: 'Mariana Souza',
    company: 'Luma Studio',
    email: 'mari@lumastudio.co',
    body:
`Oi, RH 💌 Topa a troca mais justa do ano? Cesta de Natal por saldo livre.

A cesta vem cheia de coisas que eu talvez nem use. O saldo vem cheio de possibilidades: compras de casa, um jantar, um presente. Confia.`,
    rot: '-.8deg',
  },
  {
    name: 'Rafael Nogueira',
    company: 'Caravela',
    email: 'rafael.n@caravela.com.br',
    body:
`Eu fui 100% feelgood o ano todo. Entreguei projeto, ajudei o time, sorri na daily. Agora peço só uma coisa: autonomia no benefício.

Saldo livre no cartão iFood Benefícios. Natal feliz pra todo mundo.`,
    rot: '1.8deg',
  },
  {
    name: 'Camila Prado',
    company: 'Boa Vibe Co.',
    email: 'camila@boavibe.co',
    body:
`Não é por mal, cesta. Mas a gente precisa conversar. Este ano eu quero escolher: mercado de verdade, aquele vinho específico, talvez um presente. Com saldo livre, dá.

Ativa a Santa Cláusula aí 🎄`,
    rot: '-2deg',
  },
  {
    name: 'Igor Faria',
    company: 'Movera',
    email: 'igor.faria@movera.app',
    body:
`Levei projeto difícil até o fim, fui pro happy hour com cara de quem queria, e abri 11 chamados pro suporte sorrindo. Em troca peço só flexibilidade.

Saldo livre > cesta. Promete pensar?`,
    rot: '1deg',
  },
];

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function openLetters() {
  const cards = [];
  const userContent = typewriterField.innerText.trim();
  if (state.user && userContent.length > 2) {
    cards.push(renderMiniLetter({
      name: state.user,
      company: state.company,
      email: state.userEmail,
      body: userContent,
      rot: '0deg',
      mine: true,
    }));
  }
  SAMPLE_LETTERS.forEach(l => cards.push(renderMiniLetter(l)));

  galleryGrid.innerHTML = cards.join('');
  lettersModal.removeAttribute('hidden');
}

function renderMiniLetter(l) {
  return `
    <div class="mini-letter" style="--rot:${l.rot}">
      ${l.mine ? '<div class="mini-stamp">A sua</div>' : '<div class="mini-stamp">Santa Cláusula</div>'}
      <div class="mini-label">Nome:</div>
      <div class="mini-value">${escapeHtml(l.name)}</div>
      <div class="mini-label">Empresa:</div>
      <div class="mini-value">${escapeHtml(l.company)}</div>
      <div class="mini-label">Cartinha:</div>
      <div class="mini-body">Santo RH,

${escapeHtml(l.body)}

Com carinho,
${escapeHtml(l.name)}</div>
    </div>`;
}

// ======================================================
// Close modals on backdrop click / Escape
// ======================================================
[sentModal, lettersModal].forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.setAttribute('hidden','');
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  [sentModal, lettersModal].forEach(m => m.setAttribute('hidden',''));
});

onboardingModal.addEventListener('click', (e) => {
  if (e.target === onboardingModal) {
    const card = onboardingModal.querySelector('.modal-card');
    card.animate(
      [{ transform: 'translateX(0)' },
       { transform: 'translateX(-6px)' },
       { transform: 'translateX(6px)' },
       { transform: 'translateX(0)' }],
      { duration: 240 }
    );
  }
});

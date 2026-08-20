// --- confettis (globaux, réutilisés à l'ouverture du site ET après inscription) ---
function launchConfetti(duration) {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);
  const colors = ['#3ecf7a', '#F3EEE2', '#0f6b3a', '#E8E4D9', '#8fe3ab'];
  const total = 110;
  for (let i = 0; i < total; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    const size = 6 + Math.random() * 8;
    const isRound = Math.random() > 0.5;
    piece.style.left = (Math.random() * 100) + 'vw';
    piece.style.width = size + 'px';
    piece.style.height = (isRound ? size : size * 1.6) + 'px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.borderRadius = isRound ? '50%' : '2px';
    const fallDuration = 2.4 + Math.random() * 1.1;
    piece.style.animationDuration = fallDuration + 's';
    piece.style.animationDelay = (Math.random() * 0.5) + 's';
    container.appendChild(piece);
  }
  setTimeout(() => { container.remove(); }, duration + 600);
}

// confettis à chaque ouverture du site, sans condition (script en fin de body : DOM déjà prêt)
setTimeout(() => launchConfetti(3000), 250);

// --- pop-up d'inscription de présence ---
(function(){
  const overlay = document.getElementById('presenceOverlay');
  const form = document.getElementById('presenceForm');
  const submitBtn = document.getElementById('presenceSubmit');
  const errorEl = document.getElementById('presenceError');
  const successEl = document.getElementById('presenceSuccess');
  const ALREADY_KEY = 'meta_reveil_heros_2_presence_ok';

  function encode(data) {
    return Object.keys(data)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
      .join('&');
  }

  function closeOverlay() {
    overlay.classList.add('closing');
    document.body.classList.remove('presence-locked');
    setTimeout(() => { overlay.classList.remove('open', 'closing'); }, 500);
  }

  function celebrateAndClose() {
    localStorage.setItem(ALREADY_KEY, 'yes');
    form.style.display = 'none';
    errorEl.textContent = '';
    successEl.classList.add('show');
    launchConfetti(3000);
    setTimeout(closeOverlay, 3000);
  }

  if (localStorage.getItem(ALREADY_KEY) === 'yes') {
    overlay.classList.remove('open');
  } else {
    document.body.classList.add('presence-locked');
    requestAnimationFrame(() => overlay.classList.add('open'));
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    errorEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = (currentLang === 'en') ? 'SENDING...' : 'ENVOI...';

    const formData = new FormData(form);
    const payload = {};
    formData.forEach((v, k) => { payload[k] = v; });

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encode(payload)
    })
    .then(celebrateAndClose)
    .catch(celebrateAndClose); // même hors ligne / en local, on laisse entrer et on célèbre
  });
})();

// --- traductions & messages : voir translations.js ---
 currentLang = localStorage.getItem('meta_lang') || 'fr';

function t(key){
  return (translations[currentLang] && translations[currentLang][key]) || key;
}

function applyLanguage(lang){
  currentLang = lang;
  localStorage.setItem('meta_lang', lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key] !== undefined) el.textContent = translations[lang][key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (translations[lang][key] !== undefined) el.innerHTML = translations[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang][key] !== undefined) el.setAttribute('placeholder', translations[lang][key]);
  });

  const toggle = document.getElementById('langToggle');
  toggle.querySelector('.lang-fr').classList.toggle('active', lang === 'fr');
  toggle.querySelector('.lang-en').classList.toggle('active', lang === 'en');

  // reset awaken button/message to translated defaults if not showing a random message yet
  const awakenBtn = document.getElementById('awakenBtn');
  if (awakenBtn && !awakenBtn.dataset.clicked) {
    awakenBtn.textContent = t('awaken.button');
  }
}

document.getElementById('langToggle').addEventListener('click', () => {
  applyLanguage(currentLang === 'fr' ? 'en' : 'fr');
});

applyLanguage(currentLang);

// --- scroll reveal ---
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });
reveals.forEach((el) => observer.observe(el));

const btn = document.getElementById('awakenBtn');
const box = document.getElementById('messageBox');
const text = document.getElementById('messageText');

btn.addEventListener('click', () => {
  const list = messages[currentLang];
  const message = list[Math.floor(Math.random() * list.length)];
  text.textContent = message;
  box.classList.remove('flash');
  void box.offsetWidth;
  box.classList.add('flash');
  btn.textContent = t('awaken.buttonAgain');
  btn.dataset.clicked = 'true';
});
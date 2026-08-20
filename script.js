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

const messages = [
  "Tu as été appelé pour un temps comme celui-ci.",
  "Ce que Dieu a placé en toi doit servir à ta génération.",
  "N'attends pas d'être parfait pour répondre à l'appel.",
  "Ton obéissance d'aujourd'hui peut changer l'histoire de quelqu'un demain.",
  "Le monde n'a pas besoin d'une copie. Il a besoin de ce que Dieu a placé en toi.",
  "Commence là où tu es, avec ce que tu as.",
  "Les héros ne sont pas ceux qui n'ont jamais peur, mais ceux qui avancent malgré la peur.",
  "Ta génération a besoin de ta voix, de ta foi et de ton courage.",
  "Dieu peut utiliser une vie disponible pour accomplir bien plus qu'elle ne l'imagine.",
  "Ton histoire n'est pas trop petite pour avoir un impact éternel."
];

const btn = document.getElementById('awakenBtn');
const box = document.getElementById('messageBox');
const text = document.getElementById('messageText');

btn.addEventListener('click', () => {
  const message = messages[Math.floor(Math.random() * messages.length)];
  text.textContent = message;
  box.classList.remove('flash');
  void box.offsetWidth;
  box.classList.add('flash');
  btn.textContent = 'UN AUTRE MESSAGE';
});

const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('navLinks');
const canvas = document.getElementById('dotCanvas');
const ctx = canvas.getContext('2d');
const glow = document.querySelector('.cursor-glow');

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') body.classList.add('light');

themeToggle.addEventListener('click', () => {
  body.classList.toggle('light');
  localStorage.setItem('theme', body.classList.contains('light') ? 'light' : 'dark');
});

menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
document.querySelectorAll('nav a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
document.getElementById('year').textContent = new Date().getFullYear();

// Interactive 3D-feeling dotted field: dots drift toward the cursor and parallax with it.
let width = 0, height = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
let dots = [];
const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = Math.min(900, Math.max(260, Math.floor((width * height) / 1700)));
  dots = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    z: Math.random(),
    phase: Math.random() * Math.PI * 2
  }));
}

function animateDots(t = 0) {
  if (reducedMotion) return;
  pointer.x += (pointer.tx - pointer.x) * 0.075;
  pointer.y += (pointer.ty - pointer.y) * 0.075;
  ctx.clearRect(0, 0, width, height);

  const isLight = body.classList.contains('light');
  const dotColor = isLight ? '16,18,21' : '216,255,113';

  for (const d of dots) {
    const depth = 0.35 + d.z * 0.9;
    const driftX = Math.sin(t * 0.00025 + d.phase) * 8 * depth;
    const driftY = Math.cos(t * 0.00018 + d.phase) * 6 * depth;
    const px = d.x + driftX + (pointer.x - width / 2) * d.z * 0.025;
    const py = d.y + driftY + (pointer.y - height / 2) * d.z * 0.025;
    let x = px, y = py;

    const dx = x - pointer.x, dy = y - pointer.y;
    const dist = Math.hypot(dx, dy);
    const radius = 170;
    if (dist < radius) {
      const force = (1 - dist / radius) ** 2;
      x += (dx / Math.max(dist, 1)) * force * 26 * depth;
      y += (dy / Math.max(dist, 1)) * force * 26 * depth;
    }

    const alpha = 0.12 + d.z * 0.42 + (dist < radius ? 0.25 : 0);
    const size = 0.65 + d.z * 1.15;
    ctx.beginPath();
    ctx.fillStyle = `rgba(${dotColor},${alpha})`;
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(animateDots);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('pointermove', e => {
  pointer.tx = e.clientX;
  pointer.ty = e.clientY;
  if (glow) {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  }
});
window.addEventListener('pointerleave', () => { pointer.tx = -9999; pointer.ty = -9999; });
animateDots();

// Reveal sections.
const observer = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) e.target.classList.add('visible');
}), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Project flip cards: buttons are explicit; clicking the card body also works without hijacking links.
document.querySelectorAll('.flip-card').forEach(card => {
  card.querySelectorAll('.flip-trigger').forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    card.classList.toggle('flipped');
  }));
});

// Active navigation.
const sections = [...document.querySelectorAll('main section[id]')];
const links = [...document.querySelectorAll('nav a')];
window.addEventListener('scroll', () => {
  let current = 'home';
  sections.forEach(s => { if (scrollY >= s.offsetTop - 170) current = s.id; });
  links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
}, { passive: true });

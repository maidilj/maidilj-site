/* ── Nav: scroll state + mobile toggle ──────────────────── */

const nav       = document.getElementById('nav');
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

navToggle?.addEventListener('click', () => {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!expanded));
  navLinks.classList.toggle('open', !expanded);
});

navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
  });
});

document.addEventListener('click', e => {
  if (!nav.contains(e.target) && navLinks.classList.contains('open')) {
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
  }
});

/* ── Nav: active section highlight ─────────────────────── */

const navItems = navLinks?.querySelectorAll('a') ?? [];
const sections = document.querySelectorAll('main section[id]');

const activeObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navItems.forEach(link => {
        if (link.getAttribute('href') === `#${id}`) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }
  }
}, { rootMargin: '-45% 0px -55% 0px' });

sections.forEach(s => activeObserver.observe(s));

/* ── Hero canvas: trajectory clustering animation ───────── *
 * Particles are slowly attracted to four cluster centres,   *
 * connected by thin lines when nearby — a nod to VaDER,    *
 * which clusters multivariate trajectories in exactly       *
 * this way. One kinetic moment; everything else is still.   *
 * ─────────────────────────────────────────────────────── */

(function initCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, rafId;
  let running = false;

  const CLUSTERS = [
    { x: 0.18, y: 0.30 },
    { x: 0.78, y: 0.22 },
    { x: 0.62, y: 0.72 },
    { x: 0.28, y: 0.78 },
  ];

  const N = 52;
  const particles = [];

  function createParticles() {
    particles.length = 0;
    for (let i = 0; i < N; i++) {
      const cluster = CLUSTERS[i % CLUSTERS.length];
      particles.push({
        x:       Math.random(),
        y:       Math.random(),
        vx:      (Math.random() - 0.5) * 0.0007,
        vy:      (Math.random() - 0.5) * 0.0007,
        cluster,
        pull:    0.00022 + Math.random() * 0.00018,
      });
    }
  }

  function resize() {
    W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
    H = canvas.height = canvas.offsetHeight || window.innerHeight;
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      p.vx += (p.cluster.x - p.x) * p.pull;
      p.vy += (p.cluster.y - p.y) * p.pull;
      p.vx *= 0.993;
      p.vy *= 0.993;
      p.x  += p.vx;
      p.y  += p.vy;
      if (p.x < 0 || p.x > 1) p.vx *= -1;
      if (p.y < 0 || p.y > 1) p.vy *= -1;
    }

    ctx.lineWidth = 0.6;
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const a = particles[i], b = particles[j];
        const dx = (a.x - b.x) * W;
        const dy = (a.y - b.y) * H;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14400) {
          const alpha = ((1 - Math.sqrt(d2) / 120) * 0.22).toFixed(3);
          ctx.strokeStyle = `rgba(10,143,126,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x * W, a.y * H);
          ctx.lineTo(b.x * W, b.y * H);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = 'rgba(10,143,126,0.48)';
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    drawFrame();
    if (running) rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    loop();
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const heroObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        if (!reduced) start();
      } else {
        stop();
      }
    }
  }, { threshold: 0.01 });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }, { passive: true });

  resize();
  createParticles();
  drawFrame();

  if (!reduced) {
    heroObserver.observe(canvas.closest('section') ?? canvas);
  }
})();

/* ── Repos: fetch from GitHub API ───────────────────────── */

const LANG_COLORS = {
  JavaScript:        '#f1e05a',
  Python:            '#3572A5',
  HTML:              '#e34c26',
  CSS:               '#563d7c',
  TypeScript:        '#2b7489',
  'Jupyter Notebook':'#DA5B0B',
  Shell:             '#89e051',
  Go:                '#00ADD8',
  Rust:              '#dea584',
  Java:              '#b07219',
  C:                 '#555555',
  'C++':             '#f34b7d',
};

function buildRepoCard(repo) {
  const a = document.createElement('a');
  a.href   = repo.html_url;
  a.target = '_blank';
  a.rel    = 'noopener noreferrer';
  a.className = 'repo-card';

  const nameDiv = document.createElement('div');
  nameDiv.className = 'repo-name';
  nameDiv.textContent = repo.name;
  a.appendChild(nameDiv);

  if (repo.description) {
    const desc = document.createElement('p');
    desc.className = 'repo-desc';
    desc.textContent = repo.description;
    a.appendChild(desc);
  }

  const meta = document.createElement('div');
  meta.className = 'repo-meta';

  if (repo.language) {
    const langSpan = document.createElement('span');
    langSpan.className = 'repo-lang';

    const dot = document.createElement('span');
    dot.className = 'lang-dot';
    dot.style.background = LANG_COLORS[repo.language] ?? '#8b949e';

    langSpan.appendChild(dot);
    langSpan.appendChild(document.createTextNode(repo.language));
    meta.appendChild(langSpan);
  }

  if (repo.stargazers_count > 0) {
    const stars = document.createElement('span');
    stars.className = 'repo-stars';
    stars.textContent = `★ ${repo.stargazers_count}`;
    meta.appendChild(stars);
  }

  a.appendChild(meta);
  return a;
}

async function loadRepos() {
  const grid = document.getElementById('repos-grid');
  if (!grid) return;

  grid.innerHTML = Array.from({ length: 6 },
    () => '<div class="skeleton-card" aria-hidden="true"></div>'
  ).join('');

  try {
    const res = await fetch(
      'https://api.github.com/users/maidilj/repos?sort=updated&per_page=12'
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const repos = await res.json();

    grid.innerHTML = '';

    if (!Array.isArray(repos) || repos.length === 0) {
      grid.innerHTML = '<p class="repos-empty">No public repositories yet.</p>';
      return;
    }

    const frag = document.createDocumentFragment();
    for (const repo of repos) frag.appendChild(buildRepoCard(repo));
    grid.appendChild(frag);

  } catch (_e) {
    grid.innerHTML = `
      <p class="repos-error">
        Couldn't load repositories right now.
        <a href="https://github.com/maidilj" target="_blank" rel="noopener noreferrer">Browse on GitHub →</a>
      </p>
    `;
  }
}

loadRepos();

/* ── Footer year ────────────────────────────────────────── */

const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

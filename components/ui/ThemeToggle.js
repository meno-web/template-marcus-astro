// ThemeToggle.js - Theme toggle with localStorage persistence
// el and props are automatically available

const html = document.querySelector('html');

function getPreferredTheme() {
  const stored = localStorage.getItem('theme');
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
  html.setAttribute('theme', theme);
  // Update all theme root containers (Layout)
  document.querySelectorAll('[data-theme-root]').forEach(el => {
    el.setAttribute('theme', theme);
  });
  localStorage.setItem('theme', theme);
}

setTheme(getPreferredTheme());

el.addEventListener('click', function() {
  const current = html.getAttribute('theme') || 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
  if (!localStorage.getItem('theme')) {
    setTheme(e.matches ? 'dark' : 'light');
  }
});

const trigger = el.querySelector('[data-el="trigger"]');

const open = () => {
  el.classList.add('is-open');
  trigger?.setAttribute('aria-expanded', 'true');
};

const close = () => {
  el.classList.remove('is-open');
  trigger?.setAttribute('aria-expanded', 'false');
};

const toggle = () => {
  if (el.classList.contains('is-open')) {
    close();
  } else {
    // Close sibling dropdowns first
    const nav = el.closest('nav') || el.closest('ul');
    if (nav) {
      nav.querySelectorAll('.is-open').forEach((sibling) => {
        if (sibling !== el) {
          sibling.classList.remove('is-open');
          const sibTrigger = sibling.querySelector('[data-el="trigger"]');
          sibTrigger?.setAttribute('aria-expanded', 'false');
        }
      });
    }
    open();
  }
};

// Click toggle
trigger?.addEventListener('click', (e) => {
  e.preventDefault();
  toggle();
});

// Desktop hover
el.addEventListener('mouseenter', () => {
  if (window.innerWidth > 768) {
    open();
  }
});

el.addEventListener('mouseleave', () => {
  if (window.innerWidth > 768) {
    close();
  }
});

// Click outside
document.addEventListener('click', (e) => {
  if (!el.contains(e.target)) {
    close();
  }
});

// Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && el.classList.contains('is-open')) {
    close();
    trigger?.focus();
  }
});

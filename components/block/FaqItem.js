const questionEl = el.querySelector('[data-el="question"]');

questionEl?.addEventListener('click', () => {
  const isOpening = !el.classList.contains('is-open');

  el.classList.toggle('is-open');

  if (isOpening) {
    el.dispatchEvent(new CustomEvent('faq-item-open', { bubbles: true }));
  }
});

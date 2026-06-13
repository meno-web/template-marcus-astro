const closeBtn = el.querySelector('[data-el="close-btn"]');
if (closeBtn) {
  closeBtn.addEventListener('click', function () {
    el.style.display = 'none';
  });
}
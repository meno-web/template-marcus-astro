if (props.singleOpen) {
  el.addEventListener('faq-item-open', (e) => {
    const openedItem = e.target;
    const allItems = el.querySelectorAll('[data-component="FaqItem"]');

    allItems.forEach((item) => {
      if (item !== openedItem) {
        item.classList.remove('is-open');
      }
    });
  });
}

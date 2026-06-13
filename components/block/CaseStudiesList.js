var cursors = el.querySelectorAll('[data-el="cursor"]');

cursors.forEach(function(cursor) {
  var card = cursor.parentElement;
  var mouseX = 0, mouseY = 0;
  var cursorX = 0, cursorY = 0;
  var isHovering = false;

  card.addEventListener('mousemove', function(e) {
    var rect = card.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  card.addEventListener('mouseenter', function(e) {
    var rect = card.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    cursorX = mouseX;
    cursorY = mouseY;
    isHovering = true;
  });

  card.addEventListener('mouseleave', function() {
    isHovering = false;
  });

  function animate() {
    if (isHovering) {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
    }
    requestAnimationFrame(animate);
  }
  animate();
});

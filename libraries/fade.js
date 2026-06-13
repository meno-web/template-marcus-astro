(function () {
  var all = document.querySelectorAll("[fade]");
  var els = [];
  for (var i = 0; i < all.length; i++) {
    var val = all[i].getAttribute("fade");
    if (val === "" || val === null) continue;
    els.push(all[i]);
  }
  if (!els.length) return;

  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    var delay = parseFloat(el.getAttribute("fade")) || 0;
    el.style.transition =
      "opacity 0.6s ease " + delay + "s, transform 0.6s ease " + delay + "s";
  }

  // Force reflow so the browser paints opacity:0 before the observer fires
  void document.body.offsetHeight;

  var observer = new IntersectionObserver(
    function (entries) {
      for (var j = 0; j < entries.length; j++) {
        if (entries[j].isIntersecting) {
          var target = entries[j].target;
          target.style.opacity = "1";
          target.style.transform = "none";
          observer.unobserve(target);
        }
      }
    },
    { threshold: 0.15 }
  );

  for (var k = 0; k < els.length; k++) {
    observer.observe(els[k]);
  }
})();
var slides = el.querySelectorAll('[data-el="slide"]');
var prevBtn = el.querySelector('[data-el="prev"]');
var nextBtn = el.querySelector('[data-el="next"]');
var pagination = el.querySelector('[data-el="pagination"]');

if (!slides.length) return;

var current = 0;
var total = slides.length;
var loop = props.loop !== false;
var autoplay = props.autoplay === true;
var autoplayTimer;

function goTo(index) {
  if (index === current) return;
  slides[current].classList.remove('is-active');
  current = index;
  slides[current].classList.add('is-active');
  updateDots();
}

function next() {
  var idx = current + 1;
  if (idx >= total) idx = loop ? 0 : total - 1;
  goTo(idx);
}

function prev() {
  var idx = current - 1;
  if (idx < 0) idx = loop ? total - 1 : 0;
  goTo(idx);
}

function buildDots() {
  if (!pagination) return;
  pagination.innerHTML = '';
  for (var i = 0; i < total; i++) {
    var dot = document.createElement('button');
    dot.className = 'ts-dot';
    dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
    (function(idx) {
      dot.addEventListener('click', function() { goTo(idx); resetAutoplay(); });
    })(i);
    pagination.appendChild(dot);
  }
}

function updateDots() {
  if (!pagination) return;
  var dots = pagination.querySelectorAll('.ts-dot');
  dots.forEach(function(dot, i) {
    dot.classList.toggle('is-active', i === current);
  });
}

function resetAutoplay() {
  if (!autoplay) return;
  clearInterval(autoplayTimer);
  autoplayTimer = setInterval(next, 4000);
}

// Init
el.classList.add('is-initialized');
slides[0].classList.add('is-active');
buildDots();
updateDots();

if (prevBtn) prevBtn.addEventListener('click', function() { prev(); resetAutoplay(); });
if (nextBtn) nextBtn.addEventListener('click', function() { next(); resetAutoplay(); });

if (autoplay) {
  autoplayTimer = setInterval(next, 4000);
}

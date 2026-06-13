// Slider.js - Embla Carousel based slider
// el and props are automatically available via defineVars

var viewport = el.querySelector('[data-el="viewport"]');
var container = el.querySelector('[data-el="container"]');
var pagination = el.querySelector('[data-el="pagination"]');
var prevBtn = el.querySelector('[data-el="prev"]');
var nextBtn = el.querySelector('[data-el="next"]');

if (!viewport || !container) return;

var columns = parseInt(props.columns) || 3;
var gap = parseInt(props.gap) || 24;
var peek = props.cropped === false ? 0.2 : 0;

function getColumnsForWidth(width) {
  if (width <= 540) return 1;
  if (width <= 1024) return Math.min(columns, 2);
  return columns;
}

function applySlideWidths() {
  var cols = getColumnsForWidth(window.innerWidth) + peek;
  var totalGap = gap * (Math.ceil(cols) - 1);
  var basis = 'calc((100% - ' + totalGap + 'px) / ' + cols + ')';
  Array.from(container.children).forEach(function (slide) {
    slide.style.flex = '0 0 ' + basis;
    slide.style.minWidth = '0';
  });
}

function buildDots(emblaApi) {
  if (!pagination) return;
  pagination.innerHTML = '';
  var snaps = emblaApi.scrollSnapList();
  snaps.forEach(function (_, i) {
    var dot = document.createElement('button');
    dot.className = 'embla-dot';
    dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    dot.addEventListener('click', function () { emblaApi.scrollTo(i); });
    pagination.appendChild(dot);
  });
  updateDots(emblaApi);
}

function updateDots(emblaApi) {
  if (!pagination) return;
  var selected = emblaApi.selectedScrollSnap();
  var dots = pagination.querySelectorAll('.embla-dot');
  dots.forEach(function (dot, i) {
    dot.classList.toggle('is-active', i === selected);
  });
}

function init() {
  viewport.style.overflow = props.cropped === false ? 'visible' : 'hidden';
  applySlideWidths();

  var plugins = [];
  if (props.autoplay === true && typeof EmblaCarouselAutoplay !== 'undefined') {
    plugins.push(EmblaCarouselAutoplay({ delay: 4000, stopOnInteraction: false }));
  }

  var emblaApi = EmblaCarousel(viewport, {
    loop: props.loop !== false,
    align: 'start',
    containScroll: 'trimSnaps',
    slidesToScroll: 1
  }, plugins);

  buildDots(emblaApi);
  emblaApi.on('select', function () { updateDots(emblaApi); });
  emblaApi.on('reInit', function () { buildDots(emblaApi); });

  if (prevBtn) {
    prevBtn.addEventListener('click', function () { emblaApi.scrollPrev(); });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () { emblaApi.scrollNext(); });
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      applySlideWidths();
      emblaApi.reInit();
    }, 150);
  });
}

// Wait for Embla library if not yet loaded
if (typeof EmblaCarousel !== 'undefined') {
  init();
} else {
  var tries = 0;
  var poll = setInterval(function () {
    if (typeof EmblaCarousel !== 'undefined') { clearInterval(poll); init(); }
    else if (++tries > 50) clearInterval(poll);
  }, 100);
}

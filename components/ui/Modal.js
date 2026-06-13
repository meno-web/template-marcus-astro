// Modal.js - Generic modal component with defineVars: true
// el and props are automatically available

const closeBtn = el.querySelector('[data-el="close-btn"]');
const backdrop = el.querySelector('[data-el="backdrop"]');
const mId = props.modalId || 'modal';

// Lazy video loading - only load iframe when modal opens (prevents third-party cookies on page load)
const loadVideo = () => {
  const videoContainer = el.querySelector('[data-video-src]');
  if (videoContainer && !videoContainer.querySelector('iframe')) {
    const src = videoContainer.getAttribute('data-video-src');
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.style.cssText = 'width: 100%; height: 100%; display: block; border: none;';
    videoContainer.appendChild(iframe);
  }
};

const unloadVideo = () => {
  const videoContainer = el.querySelector('[data-video-src]');
  if (videoContainer) {
    const iframe = videoContainer.querySelector('iframe');
    if (iframe) {
      iframe.remove();
    }
  }
};

// Create a handler function for opening the modal
const openModalHandler = (eventName) => {
  return (event) => {
    el.classList.add('is-open');
    loadVideo();
  };
};

// Listen for ID-specific open-modal custom event
const idSpecificEventName = `open-modal-${mId}`;
el.addEventListener(idSpecificEventName, openModalHandler(idSpecificEventName));

// Also listen for generic open-modal event as fallback
el.addEventListener('open-modal', openModalHandler('open-modal'));

// Handle close button click
closeBtn?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  el.classList.remove('is-open');
  unloadVideo();
});

// Close modal when clicking on backdrop (Filter)
backdrop?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  el.classList.remove('is-open');
  unloadVideo();
});

// ======================================
// Attribute-based trigger system (uses document-level delegation for timing safety)
// ======================================
document.addEventListener('click', (event) => {
  const trigger = event.target.closest(`[open-modal="${mId}"]`);
  if (trigger) {
    event.preventDefault();
    event.stopPropagation();
    el.classList.add('is-open');
    loadVideo();
  }
});

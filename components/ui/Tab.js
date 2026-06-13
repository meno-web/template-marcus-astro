// Tab.js - Main tab container managing state and interactions

function initTabs() {
  const { activeTab } = props;
  
  // Find all tab buttons and panels within this component
  const tabButtons = el.querySelectorAll('[data-tab-button]');
  const tabPanels = el.querySelectorAll('[data-tab-panel]');
  
  if (tabButtons.length === 0 || tabPanels.length === 0) return;
  
  // Set initial active tab from prop
  const activeIndex = parseInt(activeTab) || 0;
  
  // Update data attribute for CSS targeting
  el.setAttribute('data-active-tab', activeIndex);
  
  // Activate the correct tab
  activateTab(activeIndex, tabButtons, tabPanels);
  
  // Add click handlers
  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      activateTab(index, tabButtons, tabPanels);
      el.setAttribute('data-active-tab', index);
      el.dispatchEvent(new CustomEvent('tab-changed', {
        detail: { tabIndex: index },
        bubbles: true
      }));
    });
  });
  
  // Add keyboard navigation
  tabButtons.forEach((button, index) => {
    button.addEventListener('keydown', (e) => {
      let targetIndex = index;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        targetIndex = index === 0 ? tabButtons.length - 1 : index - 1;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        targetIndex = index === tabButtons.length - 1 ? 0 : index + 1;
      } else if (e.key === 'Home') {
        e.preventDefault();
        targetIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        targetIndex = tabButtons.length - 1;
      }
      
      if (targetIndex !== index) {
        activateTab(targetIndex, tabButtons, tabPanels);
        el.setAttribute('data-active-tab', targetIndex);
        tabButtons[targetIndex].focus();
      }
    });
  });
}

function activateTab(index, buttons, panels) {
  // Deactivate all
  buttons.forEach(btn => btn.classList.remove('is-active'));
  panels.forEach(panel => panel.classList.remove('is-active'));
  
  // Activate selected
  if (buttons[index]) buttons[index].classList.add('is-active');
  if (panels[index]) panels[index].classList.add('is-active');
}

// Initialize immediately for editor and build
initTabs();

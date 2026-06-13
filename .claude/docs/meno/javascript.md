## JavaScript in Components (CRITICAL)

**\`defineVars\` is automatic** - When you create a \`.js\` file for a component, \`defineVars: true\` is set automatically. You only need to set it manually if defining JavaScript inline in the JSON.

### How defineVars Works

When a component has a \`.js\` file (e.g., \`Button.js\` for \`Button.json\`), your JS file automatically receives:
- \`el\` - The component's root DOM element
- \`props\` - Object containing all props from interface

\`\`\`json
{
  "component": {
    "interface": {
      "title": { "type": "string", "default": "Click me" }
    },
    "structure": { ... }
  }
}
\`\`\`

\`\`\`javascript
// ComponentName.js - el and props are automatically available (defineVars is auto-enabled)
const button = el.querySelector('[data-action="submit"]');
const { title } = props;

button?.addEventListener('click', () => {
  console.log('Clicked:', title);
});
\`\`\`

### Why NOT to use DOMContentLoaded

**NEVER use \`document.addEventListener('DOMContentLoaded', ...)\`** - It breaks in the editor!

- In static build: DOMContentLoaded fires after HTML loads ✓
- In editor: DOMContentLoaded already fired when React loaded, your callback never runs ✗

\`\`\`javascript
// WRONG - breaks in editor
document.addEventListener('DOMContentLoaded', function() {
  // This never runs in the editor!
});

// CORRECT - use defineVars instead
// With defineVars: true, your JS runs at the right time automatically
\`\`\`

### Data Attribute Patterns

Use data attributes to query child elements:

\`\`\`json
// In component structure:
{
  "type": "node",
  "tag": "button",
  "attributes": { "data-action": "submit" }
}
\`\`\`

\`\`\`javascript
// In JS file (with defineVars: true):
const button = el.querySelector('[data-action="submit"]');
const menu = el.querySelector('[data-el="menu"]');
\`\`\`

Common patterns:
- \`[data-el="menu"]\` - Named child elements
- \`[data-action="submit"]\` - Clickable actions
- \`[data-toggle="dropdown"]\` - Toggle triggers

### Component Communication

For cross-component interaction, use CustomEvent:

\`\`\`javascript
// ComponentA.js (Trigger)
el.addEventListener('click', () => {
  const modal = document.querySelector('[data-component="Modal"]');
  if (modal) {
    modal.dispatchEvent(new CustomEvent('open-modal', {
      detail: { url: 'https://...' },
      bubbles: true
    }));
  }
});

// Modal.js
el.addEventListener('open-modal', (e) => {
  el.classList.add('is-open');
  console.log(e.detail.url);
});
\`\`\`

### Rules Summary

1. **Create a .js file** - defineVars is automatic when .js file exists
2. **Never use DOMContentLoaded** - Breaks in editor
3. **Never use React** - No JSX, hooks, or React imports
4. Use \`el.querySelector()\` to find child elements
5. Use \`data-el\` attributes for reliable element selection
6. Use CustomEvent for cross-component communication
7. **NEVER manually add data-component attribute** - The system adds it automatically

### CRITICAL: Don't Add data-component Manually

When a component has a \`.js\` file, the system **automatically** adds:
- \`data-component="ComponentName"\` - Component identifier
- \`data-props='{"prop": "value"}'\` - Props for JS access

**WRONG** - manually adding data-component breaks the editor:
\`\`\`json
{
  "type": "node",
  "tag": "div",
  "attributes": {
    "data-component": "Modal"
  }
}
\`\`\`

**CORRECT** - just create the component and its .js file:
\`\`\`json
{
  "component": {
    "structure": {
      "type": "node",
      "tag": "div"
    }
  }
}
\`\`\`

If you manually add \`data-component\`, the system won't add \`data-props\`, and your JS won't receive props correctly. This causes components to work in static build but break in the editor.

### Global Template Variables
These variables are available in all template expressions without passing as props:
- \`{{isEditorMode}}\` - \`true\` in the editor, \`false\` in production/static build

**Use case**: Disable autoplay, animations, or other behaviors that interfere with editing:
\`\`\`json
{
  "type": "node",
  "tag": "video",
  "attributes": {
    "autoPlay": "{{autoPlay && !isEditorMode}}"
  }
}
\`\`\`
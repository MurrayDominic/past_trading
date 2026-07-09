// Activate demo mode styling if the DEMO_MODE flag is set in config.
// Lives in its own file because the CSP (script-src 'self') blocks inline
// scripts; the old inline version logged a console error on every load.
if (typeof DEMO_MODE !== 'undefined' && DEMO_MODE) {
  document.body.classList.add('demo-mode');
}

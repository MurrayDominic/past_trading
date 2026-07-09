// ============================================================================
// PAST TRADING - Instant Tooltips (v2 Feel Overhaul, Phase 1)
// Any element with a data-tip attribute gets an instant hover tooltip that
// states its exact mechanical effect. No delay, no tutorials needed.
// (DESIGN.md section 9: tooltips beat tutorials.)
// ============================================================================

class InstantTooltip {
  static init() {
    if (document.getElementById('v2-tooltip')) return;

    const tip = document.createElement('div');
    tip.id = 'v2-tooltip';
    tip.style.display = 'none';
    document.body.appendChild(tip);

    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest ? e.target.closest('[data-tip]') : null;
      if (!target) {
        tip.style.display = 'none';
        return;
      }
      tip.textContent = target.dataset.tip;
      tip.style.display = 'block';
      const r = target.getBoundingClientRect();
      const left = Math.min(
        window.innerWidth - tip.offsetWidth - 8,
        Math.max(8, r.left + r.width / 2 - tip.offsetWidth / 2)
      );
      const top = r.top - tip.offsetHeight - 8 < 8
        ? r.bottom + 8
        : r.top - tip.offsetHeight - 8;
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest && e.target.closest('[data-tip]')) {
        tip.style.display = 'none';
      }
    });
  }
}

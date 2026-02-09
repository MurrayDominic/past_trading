// ============================================================================
// PAST TRADING - Achievement & Title Display Helpers
// ============================================================================
// Achievement definitions live in config.js (ACHIEVEMENTS object).
// This file provides rendering and UI helpers for the achievement system.

const AchievementUI = {
  getEarnedList(progression) {
    const earned = [];
    for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
      if (progression.data.earnedAchievements[id]) {
        earned.push({
          id,
          name: ach.name,
          description: ach.description,
          isTitle: ach.title || false,
          titleDescription: ach.titleDescription || '',
          equipped: progression.data.equippedTitle === id,
        });
      }
    }
    return earned;
  },

  getLockedList(progression) {
    const locked = [];
    for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
      if (!progression.data.earnedAchievements[id]) {
        locked.push({
          id,
          name: '???',
          hint: ach.description,
          isTitle: ach.title || false,
        });
      }
    }
    return locked;
  },

  getTitleList(progression) {
    const titles = [];
    for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
      if (!ach.title) continue;
      titles.push({
        id,
        name: ach.name,
        // Bug Fix #32: Fallback for missing titleDescription
        description: ach.titleDescription || ach.description || 'No description',
        bonus: ach.titleBonus,
        earned: !!progression.data.earnedAchievements[id],
        equipped: progression.data.equippedTitle === id,
      });
    }
    return titles;
  },

  renderNewAchievementPopup(achievement) {
    return `
      <div class="achievement-popup">
        <div class="achievement-icon">${achievement.title ? '👑' : '🏆'}</div>
        <div class="achievement-text">
          <strong>${achievement.name}</strong>
          <span>${achievement.description}</span>
          ${achievement.title ? `<em>Title unlocked: ${achievement.titleDescription}</em>` : ''}
        </div>
      </div>
    `;
  },

  getProgressSummary(progression) {
    const total = Object.keys(ACHIEVEMENTS).length;
    const earned = Object.keys(progression.data.earnedAchievements).length;
    return { earned, total, percent: Math.round((earned / total) * 100) };
  }
};

// Steam integration module
// Uses steamworks.js for Steamworks SDK bindings

let steamClient = null;
let initialized = false;

// Achievement mapping: game achievement ID -> Steam achievement API name
const ACHIEVEMENT_MAP = {
  maleAstrology:      'MALE_ASTROLOGY',
  diamondHands:       'DIAMOND_HANDS',
  paperHands:         'PAPER_HANDS',
  theOracle:          'THE_ORACLE',
  teflonDon:          'TEFLON_DON',
  wolfOfWallSt:       'WOLF_OF_WALL_ST',
  marginCallSurvivor: 'MARGIN_CALL_SURVIVOR',
  hodlKing:           'HODL_KING',
  theLobbyist:        'THE_LOBBYIST',
  cleanHands:         'CLEAN_HANDS',
  speedDemon:         'SPEED_DEMON',
  literallyCriminal:  'LITERALLY_CRIMINAL',
  firstMillion:       'FIRST_MILLION',
  bankrupt:           'GUH',
  perfectTiming:      'BOUGHT_THE_DIP',
  soldTheTop:         'SOLD_THE_TOP',
};

function initSteam() {
  try {
    const steamworks = require('steamworks.js');
    // Replace 480 with your real Steam App ID
    steamClient = steamworks.init(480);
    initialized = true;
    console.log('Steam initialized successfully');
    return true;
  } catch (e) {
    console.warn('Steam initialization failed (running outside Steam?):', e.message);
    initialized = false;
    return false;
  }
}

function isInitialized() {
  return initialized;
}

function unlockAchievement(gameAchievementId) {
  if (!initialized || !steamClient) return false;

  const steamName = ACHIEVEMENT_MAP[gameAchievementId];
  if (!steamName) return false;

  try {
    const achievement = steamClient.achievement;
    if (!achievement.isActivated(steamName)) {
      achievement.activate(steamName);
      return true;
    }
  } catch (e) {
    console.warn(`Failed to unlock Steam achievement ${steamName}:`, e.message);
  }
  return false;
}

function clearAllAchievements() {
  if (!initialized || !steamClient) return;
  for (const steamName of Object.values(ACHIEVEMENT_MAP)) {
    try {
      steamClient.achievement.clear(steamName);
    } catch (e) { /* ignore */ }
  }
}

module.exports = { initSteam, isInitialized, unlockAchievement, clearAllAchievements };

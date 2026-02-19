// ============================================================================
// PAST TRADING - Quarterly Target System (Balatro-style)
// ============================================================================

class QuarterlyTargetSystem {
  constructor() {
    this.currentQuarter = 0;       // 0-indexed (0 = Q1 Y1)
    this.completedLevels = 0;
    this.ppEarned = 0;
    this.fired = false;
    this.dayOffset = 0;
  }

  init(startingNetWorth, dayOffset = 0) {
    this.currentQuarter = 0;
    this.completedLevels = 0;
    this.ppEarned = 0;
    this.fired = false;
    this.dayOffset = dayOffset;  // Days before quarterly targets start counting
  }

  // Called every tick. Returns { fired, levelUp, levelUpInfo, failInfo }
  // Targets are total net worth thresholds - hit it at any point and you pass.
  // Remaining time carries over because quarter deadlines are fixed at multiples of 91.
  // dayOffset shifts all quarter deadlines forward (head start period before targets begin).
  tick(currentDay, currentNetWorth) {
    if (this.fired || this.isAllComplete()) return { fired: false, levelUp: false };

    // During head start period, no target checking
    const adjustedDay = currentDay - this.dayOffset;
    if (adjustedDay < 0) return { fired: false, levelUp: false };

    let leveledUp = false;
    let levelUpInfo = null;

    // Check if net worth meets current target (can cascade through multiple levels)
    while (this.currentQuarter < CONFIG.TOTAL_QUARTERS) {
      const target = this.getCurrentTarget();

      if (currentNetWorth >= target.target) {
        // Passed this level!
        this.ppEarned += target.pp;
        this.completedLevels++;
        this.currentQuarter++;
        leveledUp = true;

        // Check if all 8 quarters completed
        if (this.completedLevels >= CONFIG.TOTAL_QUARTERS) {
          this.ppEarned += CONFIG.ALL_QUARTERS_BONUS_PP;
          levelUpInfo = {
            level: this.completedLevels,
            target: target.target,
            pp: target.pp,
            allComplete: true,
            bonusPP: CONFIG.ALL_QUARTERS_BONUS_PP
          };
          break;
        }

        levelUpInfo = {
          level: this.completedLevels,
          target: target.target,
          pp: target.pp,
          allComplete: false
        };
        // Continue loop - might cascade through multiple levels
      } else {
        break; // Current target not met
      }
    }

    if (leveledUp) {
      return { fired: false, levelUp: true, levelUpInfo };
    }

    // Check if quarter time expired without meeting target
    // Quarter deadlines are fixed at offset + (n+1)*91
    const quarterEndDay = this.dayOffset + (this.currentQuarter + 1) * CONFIG.QUARTER_DAYS;
    if (currentDay >= quarterEndDay) {
      this.fired = true;
      const target = this.getCurrentTarget();
      return {
        fired: true,
        levelUp: false,
        failInfo: {
          level: this.currentQuarter + 1,
          netWorth: currentNetWorth,
          target: target.target,
          shortfall: target.target - currentNetWorth
        }
      };
    }

    return { fired: false, levelUp: false };
  }

  getCurrentTarget() {
    if (this.currentQuarter >= CONFIG.QUARTERLY_TARGETS.length) {
      return CONFIG.QUARTERLY_TARGETS[CONFIG.QUARTERLY_TARGETS.length - 1];
    }
    return CONFIG.QUARTERLY_TARGETS[this.currentQuarter];
  }

  getDaysRemainingInQuarter(currentDay) {
    const quarterEndDay = this.dayOffset + (this.currentQuarter + 1) * CONFIG.QUARTER_DAYS;
    return Math.max(0, quarterEndDay - currentDay);
  }

  getQuarterProgress(currentDay) {
    const quarterStartDay = this.dayOffset + this.currentQuarter * CONFIG.QUARTER_DAYS;
    const daysIntoQuarter = currentDay - quarterStartDay;
    return Math.min(1, daysIntoQuarter / CONFIG.QUARTER_DAYS);
  }

  // Progress toward current target (net worth vs target)
  getEarningsProgress(currentNetWorth) {
    const target = this.getCurrentTarget();
    return Math.min(1, Math.max(0, currentNetWorth / target.target));
  }

  // Returns current net worth for display (caller passes it in)
  getCurrentEarnings(currentNetWorth) {
    return currentNetWorth;
  }

  getQuarterLabel() {
    const target = this.getCurrentTarget();
    return target.label;
  }

  isAllComplete() {
    return this.completedLevels >= CONFIG.TOTAL_QUARTERS;
  }

  // Whether still in head start period (before targets begin)
  isInHeadStart(currentDay) {
    return currentDay < this.dayOffset;
  }
}

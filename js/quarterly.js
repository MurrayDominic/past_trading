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
    this.mandate = null;           // v2 board mandate for the current quarter
    this.mandateViolated = false;
    this.mandateProgress = 0;
    this.mandateStartDay = 0;
  }

  init(startingNetWorth, dayOffset = 0) {
    this.currentQuarter = 0;
    this.completedLevels = 0;
    this.ppEarned = 0;
    this.fired = false;
    this.dayOffset = dayOffset;  // Days before quarterly targets start counting
    this.rollMandate(0);
  }

  // ---- Board mandates (v2) ----

  rollMandate(currentDay) {
    this.mandate = BOARD_MANDATES[Math.floor(Math.random() * BOARD_MANDATES.length)];
    this.mandateViolated = false;
    this.mandateProgress = 0;
    this.mandateStartDay = currentDay;
  }

  _checkMandateDaily(trading, market) {
    const m = this.mandate;
    if (!m || !trading || this.mandateViolated) return;
    if (m.type === 'banCategory') {
      if (trading.positions.some(p => getTickerCategory(p.ticker) === m.category)) {
        this.mandateViolated = true;
      }
    } else if (m.type === 'maxPositionPct' && market) {
      for (const p of trading.positions) {
        const asset = market.getAsset(p.ticker);
        if (asset && asset.price * p.quantity > trading.netWorth * m.param) {
          this.mandateViolated = true;
          break;
        }
      }
    } else if (m.type === 'shortDays') {
      if (trading.positions.some(p => p.type === 'short')) this.mandateProgress++;
    }
  }

  _resolveMandate(trading) {
    const m = this.mandate;
    if (!m || !trading) return null;
    let satisfied = false;
    if (m.type === 'banCategory' || m.type === 'maxPositionPct') satisfied = !this.mandateViolated;
    else if (m.type === 'shortDays') satisfied = this.mandateProgress >= m.param;
    else if (m.type === 'minTrades') {
      satisfied = trading.tradeHistory.filter(t => t.day >= this.mandateStartDay).length >= m.param;
    }
    else if (m.type === 'endDiversified') satisfied = trading.positions.length >= m.param;

    let bonus = 0;
    if (satisfied) {
      bonus = Math.floor(trading.netWorth * m.bonusPct);
      trading.cash += bonus;
    }
    return { name: m.name, desc: m.desc, satisfied, bonus };
  }

  // Live status for the HUD
  getMandateStatus(trading) {
    const m = this.mandate;
    if (!m) return null;
    let label = m.name;
    if (m.type === 'shortDays') label = `${m.name} ${this.mandateProgress}/${m.param}`;
    else if (m.type === 'minTrades' && trading) {
      const n = trading.tradeHistory.filter(t => t.day >= this.mandateStartDay).length;
      label = `${m.name} ${n}/${m.param}`;
    }
    return {
      label,
      blown: this.mandateViolated,
      tip: `${m.desc} Compliance bonus: ${Math.round(m.bonusPct * 100)}% of net worth, paid at the quarter review.`,
    };
  }

  // Called every tick. Returns { fired, levelUp, levelUpInfo, failInfo }
  // Targets are total net worth thresholds - hit it at any point and you pass.
  // Remaining time carries over because quarter deadlines are fixed at multiples of 91.
  // dayOffset shifts all quarter deadlines forward (head start period before targets begin).
  tick(currentDay, currentNetWorth, trading = null, market = null) {
    if (this.fired || this.isAllComplete()) return { fired: false, levelUp: false };

    // During head start period, no target checking
    const adjustedDay = currentDay - this.dayOffset;
    if (adjustedDay < 0) return { fired: false, levelUp: false };

    // Daily board-mandate compliance check (v2)
    this._checkMandateDaily(trading, market);

    let leveledUp = false;
    let levelUpInfo = null;

    // Check if net worth meets current target (can cascade through multiple levels)
    while (this.currentQuarter < CONFIG.TOTAL_QUARTERS) {
      const target = this.getCurrentTarget();

      if (currentNetWorth >= target.target) {
        // Passed this level!
        this.completedLevels++;
        this.currentQuarter++;
        leveledUp = true;

        // Check if all 8 quarters completed
        if (this.completedLevels >= CONFIG.TOTAL_QUARTERS) {
          levelUpInfo = {
            level: this.completedLevels,
            target: target.target,
            allComplete: true,
          };
          break;
        }

        levelUpInfo = {
          level: this.completedLevels,
          target: target.target,
          allComplete: false
        };
        // Continue loop - might cascade through multiple levels
      } else {
        break; // Current target not met
      }
    }

    if (leveledUp) {
      // Resolve the quarter's board mandate (pays bonus into cash) and roll
      // the next one (v2)
      levelUpInfo.mandateResult = this._resolveMandate(trading);
      this.rollMandate(currentDay);
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
    const idx = Math.min(this.currentQuarter, CONFIG.QUARTERLY_TARGETS.length - 1);
    const base = CONFIG.QUARTERLY_TARGETS[idx];
    const mult = (RUN_ASCENSION.targetMult || 1) * (RUN_ARCHETYPE.targetMult || 1);
    if (mult === 1) return base;
    return { ...base, target: Math.round(base.target * mult) };
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

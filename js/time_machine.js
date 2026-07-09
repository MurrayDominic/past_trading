// ============================================================================
// PAST TRADING - Time Machine (v2, Phase 3)
// The flagship run format: 8 quarters, each in a different era. You don't
// choose when you go; the machine offers windows and you pick one.
// ============================================================================

class TimeMachine {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.visited = [];     // years already jumped to this run
    this.jumpCount = 0;
    this.currentDest = null;
  }

  start() {
    this.reset();
    this.active = true;
  }

  // A single random destination (used for the run's first insertion)
  randomDestination() {
    return this._makeDestination(2000 + Math.floor(Math.random() * 24));
  }

  // Offer 3 distinct destination windows, preferring unvisited years
  offerDestinations() {
    const pool = [];
    for (let y = 2000; y <= 2023; y++) pool.push(y);
    const fresh = pool.filter(y => !this.visited.includes(y));
    const source = fresh.length >= 3 ? fresh : pool;

    const years = [];
    while (years.length < 3) {
      const y = source[Math.floor(Math.random() * source.length)];
      if (!years.includes(y)) years.push(y);
    }
    return years.map(y => this._makeDestination(y));
  }

  _makeDestination(year) {
    // Land at the start of a random month; the last quarter of a year still
    // needs ~4.3 calendar months of data, which endYear = year + 1 covers.
    const month = Math.floor(Math.random() * 12);
    const phase = month < 4 ? 'Early' : month < 8 ? 'Mid' : 'Late';
    return {
      year,
      month,
      phase,
      hint: ERA_HINTS[year] || 'The past. Probably.',
    };
  }

  recordJump(dest) {
    this.visited.push(dest.year);
    this.jumpCount++;
    this.currentDest = dest;
  }
}

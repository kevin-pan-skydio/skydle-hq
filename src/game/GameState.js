export class GameState {
  constructor() {
    this.devMode = new URLSearchParams(window.location.search).has('dev');

    this.flowers = this.devMode ? 999 : 0;
    this.totalFlowersCollected = 0;
    this.flowersPerSecond = 0;

    this.dronesOwned = 0;

    // Map upgrades
    this.spawnSpeedLevel = 0;
    this.megaFlowerLevel = 0;

    this.prices = {
      'r1-drone': this.devMode ? 1 : 20,
      'r1-dock': this.devMode ? 1 : 30,
      'drone-speed': this.devMode ? 1 : 15,
      'drone-harvest': this.devMode ? 1 : 20,
      'spawn-speed': this.devMode ? 1 : 25,
      'mega-flower': this.devMode ? 1 : 40,
    };

    this._listeners = [];
    this._recentCollections = [];
  }

  onChange(fn) {
    this._listeners.push(fn);
  }

  _notify() {
    for (const fn of this._listeners) fn(this);
  }

  addFlowers(n) {
    this.flowers += n;
    this.totalFlowersCollected += n;
    this._recentCollections.push({ amount: n, time: performance.now() });
    this._notify();
  }

  spendFlowers(n) {
    if (this.flowers < n) return false;
    this.flowers -= n;
    this._notify();
    return true;
  }

  canAfford(item) {
    return this.flowers >= (this.prices[item] || Infinity);
  }

  buyDrone() {
    const cost = this.prices['r1-drone'];
    if (!this.spendFlowers(cost)) return false;
    this.dronesOwned++;
    this.prices['r1-drone'] = this.devMode ? 1 : Math.floor(this.prices['r1-drone'] * 1.6);
    this._notify();
    return true;
  }

  buySpawnSpeed() {
    const cost = this.prices['spawn-speed'];
    if (!this.spendFlowers(cost)) return false;
    this.spawnSpeedLevel++;
    this.prices['spawn-speed'] = this.devMode ? 1 : Math.floor(this.prices['spawn-speed'] * 1.8);
    this._notify();
    return true;
  }

  buyMegaFlower() {
    const cost = this.prices['mega-flower'];
    if (!this.spendFlowers(cost)) return false;
    this.megaFlowerLevel++;
    this.prices['mega-flower'] = this.devMode ? 1 : Math.floor(this.prices['mega-flower'] * 2.0);
    this._notify();
    return true;
  }

  getSpawnInterval() {
    // Base 8s, each level reduces by 1s, min 2s
    return Math.max(2, 8 - this.spawnSpeedLevel);
  }

  getMegaFlowerChance() {
    // Each level adds 8% chance, max 60%
    return Math.min(0.6, this.megaFlowerLevel * 0.08);
  }

  getMegaFlowerValue() {
    return 5 + this.megaFlowerLevel;
  }

  computeFlowersPerSecond() {
    const now = performance.now();
    this._recentCollections = this._recentCollections.filter(
      (c) => now - c.time < 5000
    );
    const total = this._recentCollections.reduce((s, c) => s + c.amount, 0);
    this.flowersPerSecond = Math.round((total / 5) * 10) / 10;
  }
}

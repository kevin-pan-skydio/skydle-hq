import CONFIG from '../config.json';

const R1 = CONFIG.drones.r1;
const UPG = R1.upgrades;
const FLOWERS = CONFIG.collectibles.flowers;

export class GameState {
  constructor() {
    this.devMode = new URLSearchParams(window.location.search).has('dev');
    const dev = this.devMode;
    const d = CONFIG.devMode.allPrices;

    this.flowers = dev ? CONFIG.devMode.startingFlowers : 0;
    this.totalFlowersCollected = 0;
    this.flowersPerSecond = 0;

    this.dronesOwned = 0;
    this.dockLevel = 0;
    this.droneSpeedLevel = 0;
    this.droneHarvestLevel = 0;

    this.spawnSpeedLevel = 0;
    this.spawnBatchLevel = 0;
    this.flowerValueLevel = 0;
    this.flowerMultiplierLevel = 0;
    this.megaFlowerLevel = 0;

    this.prices = {
      'r1-drone': dev ? d : R1.price.base,
      'r1-dock': dev ? d : R1.upgrades.dock.price.base,
      'drone-speed': dev ? d : R1.upgrades.propeller.price.base,
      'drone-harvest': dev ? d : R1.upgrades.harvester.price.base,
      'r1-ultimate': dev ? d : R1.upgrades.ultimate.price.base,
      'spawn-speed': dev ? d : FLOWERS.spawnUpgrade.price.base,
      'spawn-batch': dev ? d : FLOWERS.batchUpgrade.price.base,
      'flower-value': dev ? d : FLOWERS.valueUpgrade.price.base,
      'flower-multi': dev ? d : FLOWERS.multiplierUpgrade.price.base,
      'mega-flower': dev ? d : (FLOWERS.megaUpgrade.price.levels || [FLOWERS.megaUpgrade.price.base])[0],
    };

    this._priceScales = {
      'r1-drone': R1.price.scale,
      'drone-speed': R1.upgrades.propeller.price.scale,
      'drone-harvest': R1.upgrades.harvester.price.scale,
      'spawn-speed': FLOWERS.spawnUpgrade.price.scale,
      'spawn-batch': FLOWERS.batchUpgrade.price.scale,
      'flower-value': FLOWERS.valueUpgrade.price.scale,
      'flower-multi': FLOWERS.multiplierUpgrade.price.scale,
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

  _scalePrice(key, level, maxLevel) {
    if (this.devMode) return;
    const scale = this._priceScales[key];
    if (!scale) return;
    const effective = this._effectiveScale(scale, level, maxLevel);
    this.prices[key] = Math.floor(this.prices[key] * effective);
  }

  _effectiveScale(scale, level, maxLevel) {
    if (typeof scale === 'number') return scale;
    const [low, peak, late] = scale;
    const t = level / Math.max(maxLevel, 1);
    const bell = Math.sin(t * Math.PI);
    return t <= 0.5
      ? low + (peak - low) * bell
      : late + (peak - late) * bell;
  }

  buyDrone() {
    const cost = this.prices['r1-drone'];
    if (!this.spendFlowers(cost)) return false;
    this.dronesOwned++;
    this._scalePrice('r1-drone', this.dronesOwned);
    this._notify();
    return true;
  }

  buyGlobalDock() {
    if (this.dockLevel >= 1) return false;
    const cost = this.prices['r1-dock'];
    if (!this.spendFlowers(cost)) return false;
    this.dockLevel = 1;
    this._notify();
    return true;
  }

  buyGlobalSpeed() {
    if (this.droneSpeedLevel >= UPG.propeller.maxLevel) return false;
    const cost = this.prices['drone-speed'];
    if (!this.spendFlowers(cost)) return false;
    this.droneSpeedLevel++;
    this._scalePrice('drone-speed', this.droneSpeedLevel, UPG.propeller.maxLevel);
    this._notify();
    return true;
  }

  buyGlobalHarvest() {
    if (UPG.harvester.maxLevel && this.droneHarvestLevel >= UPG.harvester.maxLevel) return false;
    const cost = this.prices['drone-harvest'];
    if (!this.spendFlowers(cost)) return false;
    this.droneHarvestLevel++;
    this._scalePrice('drone-harvest', this.droneHarvestLevel, UPG.harvester.maxLevel);
    this._notify();
    return true;
  }

  buySpawnSpeed() {
    const su = FLOWERS.spawnUpgrade;
    if (this.spawnSpeedLevel >= su.maxLevel) return false;
    const cost = this.prices['spawn-speed'];
    if (!this.spendFlowers(cost)) return false;
    this.spawnSpeedLevel++;
    this._scalePrice('spawn-speed', this.spawnSpeedLevel, FLOWERS.spawnUpgrade.maxLevel);
    this._notify();
    return true;
  }

  getSpawnSpeedMaxLevel() {
    return FLOWERS.spawnUpgrade.maxLevel;
  }

  buySpawnBatch() {
    const bu = FLOWERS.batchUpgrade;
    if (this.spawnBatchLevel >= bu.maxLevel) return false;
    const cost = this.prices['spawn-batch'];
    if (!this.spendFlowers(cost)) return false;
    this.spawnBatchLevel++;
    this._scalePrice('spawn-batch', this.spawnBatchLevel, FLOWERS.batchUpgrade.maxLevel);
    this._notify();
    return true;
  }

  getSpawnBatchMaxLevel() {
    return FLOWERS.batchUpgrade.maxLevel;
  }

  getSpawnBatchCount() {
    const bu = FLOWERS.batchUpgrade;
    const lvl = this.spawnBatchLevel;
    if (lvl < bu.guaranteed.length) return bu.guaranteed[lvl];

    const base = bu.postGuaranteedMin;
    const extraSlots = bu.maxCount - base;
    const p = ((lvl - bu.guaranteed.length + 1) / (bu.maxLevel - bu.guaranteed.length + 1)) * bu.maxRollProb;
    let count = base;
    for (let i = 0; i < extraSlots; i++) {
      if (Math.random() < p) count++;
    }
    return count;
  }

  getSpawnBatchExpected() {
    const bu = FLOWERS.batchUpgrade;
    const lvl = this.spawnBatchLevel;
    if (lvl < bu.guaranteed.length) return bu.guaranteed[lvl];

    const base = bu.postGuaranteedMin;
    const extraSlots = bu.maxCount - base;
    const p = ((lvl - bu.guaranteed.length + 1) / (bu.maxLevel - bu.guaranteed.length + 1)) * bu.maxRollProb;
    return Math.round((base + extraSlots * p) * 10) / 10;
  }

  buyFlowerValue() {
    const vu = FLOWERS.valueUpgrade;
    if (this.flowerValueLevel >= vu.maxLevel) return false;
    const cost = this.prices['flower-value'];
    if (!this.spendFlowers(cost)) return false;
    this.flowerValueLevel++;
    this._scalePrice('flower-value', this.flowerValueLevel, FLOWERS.valueUpgrade.maxLevel);
    this._notify();
    return true;
  }

  getFlowerValueMaxLevel() {
    return FLOWERS.valueUpgrade.maxLevel;
  }

  getFlowerBaseValue() {
    const vu = FLOWERS.valueUpgrade;
    const t = this.flowerValueLevel / vu.maxLevel;
    const curved = Math.pow(t, vu.curve || 1);
    return Math.max(1 + this.flowerValueLevel, Math.round(vu.baseValue + (vu.maxValue - vu.baseValue) * curved));
  }

  buyFlowerMultiplier() {
    const mu = FLOWERS.multiplierUpgrade;
    if (this.flowerMultiplierLevel >= mu.maxLevel) return false;
    const cost = this.prices['flower-multi'];
    if (!this.spendFlowers(cost)) return false;
    this.flowerMultiplierLevel++;
    this._scalePrice('flower-multi', this.flowerMultiplierLevel, FLOWERS.multiplierUpgrade.maxLevel);
    this._notify();
    return true;
  }

  getFlowerMultiplierMaxLevel() {
    return FLOWERS.multiplierUpgrade.maxLevel;
  }

  getFlowerMultiplier() {
    const mu = FLOWERS.multiplierUpgrade;
    const t = this.flowerMultiplierLevel / mu.maxLevel;
    return Math.round((mu.baseMultiplier + (mu.maxMultiplier - mu.baseMultiplier) * t) * 10) / 10;
  }

  getCollectionValue(baseValue) {
    return Math.round(baseValue * this.getFlowerBaseValue() * this.getFlowerMultiplier());
  }

  buyMegaFlower() {
    const mu = FLOWERS.megaUpgrade;
    if (this.megaFlowerLevel >= mu.maxLevel) return false;
    const cost = this.prices['mega-flower'];
    if (!this.spendFlowers(cost)) return false;
    this.megaFlowerLevel++;
    const levels = FLOWERS.megaUpgrade.price.levels;
    if (levels && this.megaFlowerLevel < levels.length) {
      this.prices['mega-flower'] = levels[this.megaFlowerLevel];
    }
    this._notify();
    return true;
  }

  getMegaMaxLevel() {
    return FLOWERS.megaUpgrade.maxLevel;
  }

  getSpawnInterval() {
    const su = FLOWERS.spawnUpgrade;
    const range = FLOWERS.baseSpawnInterval - su.minInterval;
    const t = Math.min(this.spawnSpeedLevel / su.maxLevel, 1);
    return FLOWERS.baseSpawnInterval - range * t;
  }

  getMegaFlowerChance() {
    return this.megaFlowerLevel * FLOWERS.megaUpgrade.chancePerLevel;
  }

  getMegaFlowerValue() {
    return FLOWERS.megaUpgrade.megaValue;
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

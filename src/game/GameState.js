import CONFIG from '../config.json';
import SKILL_TREE from '../config-skill-tree.json';

const R1 = CONFIG.drones.r1;
const S2 = CONFIG.drones.s2;
const UPG = R1.upgrades;
const S2UPG = S2.upgrades;
const FLOWERS = CONFIG.collectibles.flowers;
const SP = CONFIG.skillPoints;

export class GameState {
  constructor() {
    this.devMode = new URLSearchParams(window.location.search).has('dev');
    const dev = this.devMode;
    const d = CONFIG.devMode.allPrices;

    this.flowers = dev ? CONFIG.devMode.startingFlowers : 1;
    this.totalFlowersCollected = 0;
    this.flowersPerSecond = 0;

    this.dronesOwned = 0;
    this.s2DronesOwned = 0;
    this.dockLevel = 0;
    this.dockSkillGen = false;
    this.droneSpeedLevel = 0;
    this.droneHarvestLevel = 0;
    this.s2SpeedLevel = 0;
    this.s2HarvestLevel = 0;

    this.skillPoints = dev ? 100 : 0;
    this.skillCurrency = 0;
    this.totalSkillPointsEarned = 0;

    this.spawnSpeedLevel = 0;
    this.spawnBatchLevel = 0;
    this.flowerValueLevel = 0;
    this.flowerMultiplierLevel = 0;
    this.megaFlowerLevel = 0;
    this.mushroomLevel = 0;
    this.capacityLevel = 0;

    this._initPrices(dev, d);

    this._priceScales = {
      'r1-drone': R1.price.scale,
      'spawn-speed': FLOWERS.spawnUpgrade.price.scale,
      'spawn-batch': FLOWERS.batchUpgrade.price.scale,
    };

    this.skillPerks = {};
    for (const [id, node] of Object.entries(SKILL_TREE.nodes)) {
      this.skillPerks[id] = { cost: node.cost, owned: false, requires: node.requires };
    }

    this._listeners = [];
    this._recentCollections = [];
  }

  onChange(fn) {
    this._listeners.push(fn);
  }

  _initPrices(dev, d) {
    this.prices = {
      'r1-drone': dev ? d : R1.price.earlyPrices[0],
      'r1-dock': dev ? d : R1.upgrades.dock.price.base,
      'dock-skill-gen': dev ? d : R1.upgrades.dockSkillGen.price.base,
      'drone-speed': dev ? d : R1.upgrades.propeller.price.levels[0],
      'drone-harvest': dev ? d : R1.upgrades.harvester.price.levels[0],
      'r1-ultimate': dev ? d : R1.upgrades.ultimate.price.base,
      'spawn-speed': dev ? d : FLOWERS.spawnUpgrade.price.base,
      'spawn-batch': dev ? d : FLOWERS.batchUpgrade.price.base,
      'flower-value': dev ? d : FLOWERS.valueUpgrade.price.levels[0],
      'flower-multi': dev ? d : FLOWERS.multiplierUpgrade.price.levels[0],
      'mega-flower': dev ? d : (FLOWERS.megaUpgrade.price.levels || [FLOWERS.megaUpgrade.price.base])[0],
      'mushroom': dev ? d : FLOWERS.mushroomUpgrade.price.levels[0],
      'flower-capacity': dev ? d : FLOWERS.capacityUpgrade.price.levels[0],
      's2-drone': dev ? d : S2.price.earlyPrices[0],
      's2-speed': dev ? d : S2UPG.propeller.price.levels[0],
      's2-harvest': dev ? d : S2UPG.harvester.price.levels[0],
      's2-ultimate': dev ? d : S2UPG.ultimate.price.base,
    };
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

    if (Array.isArray(scale) && scale.length >= 4) {
      const maxPrice = scale[3];
      const current = this.prices[key];
      const remaining = maxLevel - level;

      if (current >= maxPrice) return;

      if (current > maxPrice * 0.4 && remaining > 0) {
        const step = Math.floor((maxPrice - current) / (remaining + 1));
        this.prices[key] = current + Math.max(step, 1);
        return;
      }
    }

    const effective = this._effectiveScale(scale, level, maxLevel);
    this.prices[key] = Math.floor(this.prices[key] * effective);
  }

  _scaleDronePrice() {
    if (this.devMode) return;
    const cfg = R1.price;
    const n = this.dronesOwned;
    if (n < cfg.earlyPrices.length) {
      this.prices['r1-drone'] = cfg.earlyPrices[n];
    } else if (n < cfg.linearAfter) {
      this.prices['r1-drone'] = Math.floor(this.prices['r1-drone'] * cfg.scale);
    } else {
      const k = n - cfg.linearAfter + 1;
      this.prices['r1-drone'] = this.prices['r1-drone'] + cfg.linearStep * k;
    }
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
    this.lastDroneCost = cost;
    this.dronesOwned++;
    this._scaleDronePrice();
    this._notify();
    return true;
  }

  buyS2Drone() {
    if (!this.hasPerk('s2Drone')) return false;
    const cost = this.prices['s2-drone'];
    if (!this.spendFlowers(cost)) return false;
    this.lastS2Cost = cost;
    this.s2DronesOwned++;
    this._scaleS2Price();
    this._notify();
    return true;
  }

  _scaleS2Price() {
    if (this.devMode) return;
    const cfg = S2.price;
    const n = this.s2DronesOwned;
    if (n < cfg.earlyPrices.length) {
      this.prices['s2-drone'] = cfg.earlyPrices[n];
    } else if (n < cfg.linearAfter) {
      this.prices['s2-drone'] = Math.floor(this.prices['s2-drone'] * cfg.scale);
    } else {
      const k = n - cfg.linearAfter + 1;
      this.prices['s2-drone'] = this.prices['s2-drone'] + cfg.linearStep * k;
    }
  }

  buyGlobalDock() {
    if (this.dockLevel >= 1) return false;
    const cost = this.prices['r1-dock'];
    if (!this.spendFlowers(cost)) return false;
    this.dockLevel = 1;
    this._notify();
    return true;
  }

  buyDockSkillGen() {
    if (this.dockSkillGen) return false;
    if (this.dockLevel < 1) return false;
    const cost = this.prices['dock-skill-gen'];
    if (!this.spendFlowers(cost)) return false;
    this.dockSkillGen = true;
    this._notify();
    return true;
  }

  getDockSkillXpPerSecond() {
    if (!this.dockSkillGen) return 0;
    return UPG.dockSkillGen.skillXpPerSecond * this.dronesOwned;
  }

  tickPassiveSkillXp(dt) {
    const rate = this.getDockSkillXpPerSecond();
    if (rate <= 0) return;
    this.skillCurrency += rate * dt;

    let gained = false;
    const barMax = this.getSkillBarMax();
    while (this.skillCurrency >= barMax) {
      this.skillCurrency -= barMax;
      this.skillPoints++;
      this.totalSkillPointsEarned++;
      gained = true;
    }

    if (gained) this._notify();
  }

  buyGlobalSpeed() {
    if (this.droneSpeedLevel >= UPG.propeller.maxLevel) return false;
    const cost = this.prices['drone-speed'];
    if (!this.spendFlowers(cost)) return false;
    this.droneSpeedLevel++;
    if (!this.devMode && this.droneSpeedLevel < UPG.propeller.maxLevel) {
      this.prices['drone-speed'] = UPG.propeller.price.levels[this.droneSpeedLevel];
    }
    this._notify();
    return true;
  }

  buyGlobalHarvest() {
    if (this.droneHarvestLevel >= UPG.harvester.maxLevel) return false;
    const cost = this.prices['drone-harvest'];
    if (!this.spendFlowers(cost)) return false;
    this.droneHarvestLevel++;
    if (!this.devMode && this.droneHarvestLevel < UPG.harvester.maxLevel) {
      this.prices['drone-harvest'] = UPG.harvester.price.levels[this.droneHarvestLevel];
    }
    this._notify();
    return true;
  }

  buyS2Speed() {
    if (this.s2SpeedLevel >= S2UPG.propeller.maxLevel) return false;
    const cost = this.prices['s2-speed'];
    if (!this.spendFlowers(cost)) return false;
    this.s2SpeedLevel++;
    if (!this.devMode && this.s2SpeedLevel < S2UPG.propeller.maxLevel) {
      this.prices['s2-speed'] = S2UPG.propeller.price.levels[this.s2SpeedLevel];
    }
    this._notify();
    return true;
  }

  buyS2Harvest() {
    if (this.s2HarvestLevel >= S2UPG.harvester.maxLevel) return false;
    const cost = this.prices['s2-harvest'];
    if (!this.spendFlowers(cost)) return false;
    this.s2HarvestLevel++;
    if (!this.devMode && this.s2HarvestLevel < S2UPG.harvester.maxLevel) {
      this.prices['s2-harvest'] = S2UPG.harvester.price.levels[this.s2HarvestLevel];
    }
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
    if (!this.devMode) {
      const levels = vu.price.levels;
      if (this.flowerValueLevel < levels.length) {
        this.prices['flower-value'] = levels[this.flowerValueLevel];
      }
    }
    this._notify();
    return true;
  }

  getFlowerValueMaxLevel() {
    return FLOWERS.valueUpgrade.maxLevel;
  }

  getFlowerBaseValue() {
    const vu = FLOWERS.valueUpgrade;
    const base = this.hasPerk('bloomBoost') ? 5 : vu.baseValue;
    const t = this.flowerValueLevel / vu.maxLevel;
    const curved = Math.pow(t, vu.curve || 1);
    return Math.max(base + this.flowerValueLevel, Math.round(base + (vu.maxValue - base) * curved));
  }

  buyFlowerMultiplier() {
    const mu = FLOWERS.multiplierUpgrade;
    if (this.flowerMultiplierLevel >= mu.maxLevel) return false;
    const cost = this.prices['flower-multi'];
    if (!this.spendFlowers(cost)) return false;
    this.flowerMultiplierLevel++;
    if (!this.devMode) {
      const levels = mu.price.levels;
      if (this.flowerMultiplierLevel < levels.length) {
        this.prices['flower-multi'] = levels[this.flowerMultiplierLevel];
      }
    }
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
    if (!this.devMode) {
      const levels = FLOWERS.megaUpgrade.price.levels;
      if (levels && this.megaFlowerLevel < levels.length) {
        this.prices['mega-flower'] = levels[this.megaFlowerLevel];
      }
    }
    this._notify();
    return true;
  }

  getMegaMaxLevel() {
    return FLOWERS.megaUpgrade.maxLevel;
  }

  buyMushroom() {
    const mu = FLOWERS.mushroomUpgrade;
    if (this.mushroomLevel >= mu.maxLevel) return false;
    const cost = this.prices['mushroom'];
    if (!this.spendFlowers(cost)) return false;
    this.mushroomLevel++;
    if (!this.devMode) {
      const levels = mu.price.levels;
      if (this.mushroomLevel < levels.length) {
        this.prices['mushroom'] = levels[this.mushroomLevel];
      }
    }
    this._notify();
    return true;
  }

  getMushroomMaxLevel() {
    return FLOWERS.mushroomUpgrade.maxLevel;
  }

  getMushroomChance() {
    return this.mushroomLevel * FLOWERS.mushroomUpgrade.chancePerLevel;
  }

  getMushroomFlowerValue() {
    return FLOWERS.mushroomUpgrade.flowerValue;
  }

  getMushroomSkillXp() {
    return FLOWERS.mushroomUpgrade.skillXpPerCollect;
  }

  addSkillXp(amount) {
    this.skillCurrency += amount;
    const barMax = this.getSkillBarMax();
    while (this.skillCurrency >= barMax) {
      this.skillCurrency -= barMax;
      this.skillPoints++;
      this.totalSkillPointsEarned++;
    }
    this._notify();
  }

  buyCapacity() {
    const cu = FLOWERS.capacityUpgrade;
    if (this.capacityLevel >= cu.maxLevel) return false;
    const cost = this.prices['flower-capacity'];
    if (!this.spendFlowers(cost)) return false;
    this.capacityLevel++;
    if (!this.devMode) {
      const levels = cu.price.levels;
      if (this.capacityLevel < levels.length) {
        this.prices['flower-capacity'] = levels[this.capacityLevel];
      }
    }
    this._notify();
    return true;
  }

  getCapacityMaxLevel() {
    return FLOWERS.capacityUpgrade.maxLevel;
  }

  getCapacityBonus() {
    return this.capacityLevel * FLOWERS.capacityUpgrade.bonusPerLevel;
  }

  getSpawnInterval() {
    const su = FLOWERS.spawnUpgrade;
    const range = FLOWERS.baseSpawnInterval - su.minInterval;
    const t = Math.min(this.spawnSpeedLevel / su.maxLevel, 1);
    return FLOWERS.baseSpawnInterval - range * t;
  }

  getMegaFlowerChance() {
    let chance = this.megaFlowerLevel * FLOWERS.megaUpgrade.chancePerLevel;
    if (this.hasPerk('megaChance')) chance += 0.2;
    return chance;
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

  getSkillBarMax() {
    return SP.priceStep * (this.totalSkillPointsEarned + 1);
  }

  getSkillCurrencyPerFlower() {
    return SP.flowersPerSkillCurrency;
  }

  convertAllFlowersToSkillCurrency() {
    if (this.flowers < 1) return false;
    const amount = Math.floor(this.flowers);
    const currencyGain = amount * this.getSkillCurrencyPerFlower();
    this.flowers -= amount;
    this.skillCurrency += currencyGain;

    const barMax = this.getSkillBarMax();
    while (this.skillCurrency >= barMax) {
      this.skillCurrency -= barMax;
      this.skillPoints++;
      this.totalSkillPointsEarned++;
    }

    this._notify();
    return true;
  }

  buySkillPerk(id) {
    const perk = this.skillPerks[id];
    if (!perk || perk.owned) return false;
    if (!this.isPerkUnlocked(id)) return false;
    if (this.skillPoints < perk.cost) return false;
    this.skillPoints -= perk.cost;
    perk.owned = true;
    this.resetProgress();
    this._notify();
    return true;
  }

  resetProgress() {
    const dev = this.devMode;
    const d = CONFIG.devMode.allPrices;

    this.flowers = dev ? CONFIG.devMode.startingFlowers : 1;
    this.totalFlowersCollected = 0;
    this.flowersPerSecond = 0;

    this.dronesOwned = 0;
    this.s2DronesOwned = 0;
    this.dockLevel = 0;
    this.dockSkillGen = false;
    this.droneSpeedLevel = 0;
    this.droneHarvestLevel = 0;
    this.s2SpeedLevel = 0;
    this.s2HarvestLevel = 0;

    this.skillCurrency = 0;

    this.spawnSpeedLevel = 0;
    this.spawnBatchLevel = 0;
    this.flowerValueLevel = 0;
    this.flowerMultiplierLevel = 0;
    this.megaFlowerLevel = 0;
    this.mushroomLevel = 0;
    this.capacityLevel = 0;

    this._initPrices(dev, d);

    this._onReset?.();
  }

  isPerkUnlocked(id) {
    const perk = this.skillPerks[id];
    if (!perk) return false;
    if (!perk.requires) return true;
    if (Array.isArray(perk.requires)) {
      return perk.requires.some(r => this.skillPerks[r]?.owned);
    }
    return this.skillPerks[perk.requires]?.owned === true;
  }

  hasPerk(id) {
    return this.skillPerks[id]?.owned === true;
  }

  exportSave() {
    const data = {
      sp: this.skillPoints,
      sc: this.skillCurrency,
      tsp: this.totalSkillPointsEarned,
      perks: Object.fromEntries(
        Object.entries(this.skillPerks)
          .filter(([, v]) => v.owned)
          .map(([k]) => [k, 1])
      ),
      v: 1,
    };
    return btoa(JSON.stringify(data));
  }

  importSave(encoded) {
    try {
      const data = JSON.parse(atob(encoded));
      if (!data || data.v !== 1) return false;
      if (typeof data.sp === 'number') this.skillPoints = data.sp;
      if (typeof data.sc === 'number') this.skillCurrency = data.sc;
      if (typeof data.tsp === 'number') this.totalSkillPointsEarned = data.tsp;
      if (data.perks) {
        for (const id of Object.keys(data.perks)) {
          if (this.skillPerks[id]) this.skillPerks[id].owned = true;
        }
      }
      this._notify();
      this._onImport?.();
      return true;
    } catch {
      return false;
    }
  }
}

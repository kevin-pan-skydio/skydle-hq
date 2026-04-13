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
    this.dronesBought = 0;
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
    this.catCooldownLevel = 0;

    this._initPrices(dev, d);

    this.skillPerks = {};
    for (const [id, node] of Object.entries(SKILL_TREE.nodes)) {
      this.skillPerks[id] = { cost: node.cost, owned: false, requires: node.requires };
    }

    this.powerups = {};

    this.whiskeyFocusEnd = 0;

    this._listeners = [];
    this._recentCollections = [];
  }

  onChange(fn) {
    this._listeners.push(fn);
  }

  _initPrices(dev, d) {
    this.prices = {
      'r1-drone':        dev ? d : R1.prices[0],
      'r1-dock':         dev ? d : UPG.dock.price,
      'dock-skill-gen':  dev ? d : UPG.dockSkillGen.price,
      'drone-speed':     dev ? d : UPG.propeller.prices[0],
      'drone-harvest':   dev ? d : UPG.harvester.prices[0],
      'r1-ultimate':     dev ? d : UPG.ultimate.prices[0],
      'spawn-speed':     dev ? d : FLOWERS.spawnUpgrade.prices[0],
      'spawn-batch':     dev ? d : FLOWERS.batchUpgrade.prices[0],
      'flower-value':    dev ? d : FLOWERS.valueUpgrade.prices[0],
      'flower-multi':    dev ? d : FLOWERS.multiplierUpgrade.prices[0],
      'mega-flower':     dev ? d : FLOWERS.megaUpgrade.prices[0],
      'mushroom':        dev ? d : FLOWERS.mushroomUpgrade.prices[0],
      'flower-capacity': dev ? d : FLOWERS.capacityUpgrade.prices[0],
      's2-drone':        dev ? d : S2.prices[0],
      's2-speed':        dev ? d : S2UPG.propeller.prices[0],
      's2-harvest':      dev ? d : S2UPG.harvester.prices[0],
      's2-ultimate':     dev ? d : S2UPG.ultimate.prices[0],
      'cat-cooldown':    dev ? d : CONFIG.cats.cooldownUpgrade.prices[0],
    };
  }

  _notify() {
    for (const fn of this._listeners) fn(this);
  }

  isWhiskeyFocusActive() {
    return performance.now() < this.whiskeyFocusEnd;
  }

  activateWhiskeyFocus(durationSec) {
    this.whiskeyFocusEnd = performance.now() + durationSec * 1000;
    this._notify();
  }

  addFlowers(n) {
    if (this.isWhiskeyFocusActive()) {
      this.addSkillXp(n);
      this._recentCollections.push({ amount: n, time: performance.now() });
      this._notify();
      return;
    }
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

  _advancePrice(key, level, table) {
    if (this.devMode) return;
    if (level < table.length) {
      this.prices[key] = table[level];
    }
  }

  // --- Drones ---

  buyDrone() {
    const cost = this.prices['r1-drone'];
    if (!this.spendFlowers(cost)) return false;
    this.lastDroneCost = cost;
    this.dronesOwned++;
    this.dronesBought++;
    this._advancePrice('r1-drone', this.dronesBought, R1.prices);
    this._notify();
    return true;
  }

  buyS2Drone() {
    if (!this.hasPerk('s2Drone')) return false;
    const cost = this.prices['s2-drone'];
    if (!this.spendFlowers(cost)) return false;
    this.lastS2Cost = cost;
    this.s2DronesOwned++;
    this._advancePrice('s2-drone', this.s2DronesOwned, S2.prices);
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
    const max = UPG.propeller.prices.length;
    if (this.droneSpeedLevel >= max) return false;
    const cost = this.prices['drone-speed'];
    if (!this.spendFlowers(cost)) return false;
    this.droneSpeedLevel++;
    this._advancePrice('drone-speed', this.droneSpeedLevel, UPG.propeller.prices);
    this._notify();
    return true;
  }

  buyGlobalHarvest() {
    const max = UPG.harvester.prices.length;
    if (this.droneHarvestLevel >= max) return false;
    const cost = this.prices['drone-harvest'];
    if (!this.spendFlowers(cost)) return false;
    this.droneHarvestLevel++;
    this._advancePrice('drone-harvest', this.droneHarvestLevel, UPG.harvester.prices);
    this._notify();
    return true;
  }

  buyS2Speed() {
    const max = S2UPG.propeller.prices.length;
    if (this.s2SpeedLevel >= max) return false;
    const cost = this.prices['s2-speed'];
    if (!this.spendFlowers(cost)) return false;
    this.s2SpeedLevel++;
    this._advancePrice('s2-speed', this.s2SpeedLevel, S2UPG.propeller.prices);
    this._notify();
    return true;
  }

  buyS2Harvest() {
    const max = S2UPG.harvester.prices.length;
    if (this.s2HarvestLevel >= max) return false;
    const cost = this.prices['s2-harvest'];
    if (!this.spendFlowers(cost)) return false;
    this.s2HarvestLevel++;
    this._advancePrice('s2-harvest', this.s2HarvestLevel, S2UPG.harvester.prices);
    this._notify();
    return true;
  }

  // --- Flower upgrades ---

  buySpawnSpeed() {
    const table = FLOWERS.spawnUpgrade.prices;
    if (this.spawnSpeedLevel >= table.length) return false;
    const cost = this.prices['spawn-speed'];
    if (!this.spendFlowers(cost)) return false;
    this.spawnSpeedLevel++;
    this._advancePrice('spawn-speed', this.spawnSpeedLevel, table);
    this._notify();
    return true;
  }

  getSpawnSpeedMaxLevel() {
    return FLOWERS.spawnUpgrade.prices.length;
  }

  getSpawnInterval() {
    if (this.spawnSpeedLevel === 0) return FLOWERS.baseSpawnInterval;
    return FLOWERS.spawnUpgrade.intervals[this.spawnSpeedLevel - 1];
  }

  buySpawnBatch() {
    const table = FLOWERS.batchUpgrade.prices;
    if (this.spawnBatchLevel >= table.length) return false;
    const cost = this.prices['spawn-batch'];
    if (!this.spendFlowers(cost)) return false;
    this.spawnBatchLevel++;
    this._advancePrice('spawn-batch', this.spawnBatchLevel, table);
    this._notify();
    return true;
  }

  getSpawnBatchMaxLevel() {
    return FLOWERS.batchUpgrade.prices.length;
  }

  getSpawnBatchCount() {
    if (this.spawnBatchLevel === 0) return 1;
    const expected = FLOWERS.batchUpgrade.expected[this.spawnBatchLevel - 1];
    const base = Math.floor(expected);
    const frac = expected - base;
    return Math.random() < frac ? base + 1 : base;
  }

  getSpawnBatchExpected() {
    if (this.spawnBatchLevel === 0) return 1;
    return FLOWERS.batchUpgrade.expected[this.spawnBatchLevel - 1];
  }

  buyFlowerValue() {
    const table = FLOWERS.valueUpgrade.prices;
    if (this.flowerValueLevel >= table.length) return false;
    const cost = this.prices['flower-value'];
    if (!this.spendFlowers(cost)) return false;
    this.flowerValueLevel++;
    this._advancePrice('flower-value', this.flowerValueLevel, table);
    this._notify();
    return true;
  }

  getFlowerValueMaxLevel() {
    return FLOWERS.valueUpgrade.prices.length;
  }

  getFlowerBaseValue() {
    if (this.flowerValueLevel === 0) {
      return this.hasPerk('bloomBoost') ? 5 : 1;
    }
    const val = FLOWERS.valueUpgrade.values[this.flowerValueLevel - 1];
    return this.hasPerk('bloomBoost') ? Math.max(val, 5) : val;
  }

  buyFlowerMultiplier() {
    const table = FLOWERS.multiplierUpgrade.prices;
    if (this.flowerMultiplierLevel >= table.length) return false;
    const cost = this.prices['flower-multi'];
    if (!this.spendFlowers(cost)) return false;
    this.flowerMultiplierLevel++;
    this._advancePrice('flower-multi', this.flowerMultiplierLevel, table);
    this._notify();
    return true;
  }

  getFlowerMultiplierMaxLevel() {
    return FLOWERS.multiplierUpgrade.prices.length;
  }

  getFlowerMultiplier() {
    if (this.flowerMultiplierLevel === 0) return 1;
    return FLOWERS.multiplierUpgrade.multipliers[this.flowerMultiplierLevel - 1];
  }

  getCollectionValue(baseValue) {
    return Math.round(baseValue * this.getFlowerBaseValue() * this.getFlowerMultiplier());
  }

  buyMegaFlower() {
    const table = FLOWERS.megaUpgrade.prices;
    if (this.megaFlowerLevel >= table.length) return false;
    const cost = this.prices['mega-flower'];
    if (!this.spendFlowers(cost)) return false;
    this.megaFlowerLevel++;
    this._advancePrice('mega-flower', this.megaFlowerLevel, table);
    this._notify();
    return true;
  }

  getMegaMaxLevel() {
    return FLOWERS.megaUpgrade.prices.length;
  }

  getMegaFlowerChance() {
    if (this.megaFlowerLevel === 0) return 0;
    let chance = FLOWERS.megaUpgrade.chances[this.megaFlowerLevel - 1];
    if (this.hasPerk('megaChance')) chance += 0.2;
    return chance;
  }

  getMegaFlowerValue() {
    return FLOWERS.megaUpgrade.megaValue;
  }

  buyMushroom() {
    const table = FLOWERS.mushroomUpgrade.prices;
    if (this.mushroomLevel >= table.length) return false;
    const cost = this.prices['mushroom'];
    if (!this.spendFlowers(cost)) return false;
    this.mushroomLevel++;
    this._advancePrice('mushroom', this.mushroomLevel, table);
    this._notify();
    return true;
  }

  getMushroomMaxLevel() {
    return FLOWERS.mushroomUpgrade.prices.length;
  }

  getMushroomChance() {
    if (this.mushroomLevel === 0) return 0;
    return FLOWERS.mushroomUpgrade.chances[this.mushroomLevel - 1];
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
    const table = FLOWERS.capacityUpgrade.prices;
    if (this.capacityLevel >= table.length) return false;
    const cost = this.prices['flower-capacity'];
    if (!this.spendFlowers(cost)) return false;
    this.capacityLevel++;
    this._advancePrice('flower-capacity', this.capacityLevel, table);
    this._notify();
    return true;
  }

  getCapacityMaxLevel() {
    return FLOWERS.capacityUpgrade.prices.length;
  }

  getCapacityBonus() {
    if (this.capacityLevel === 0) return 0;
    return FLOWERS.capacityUpgrade.bonuses[this.capacityLevel - 1];
  }

  // --- Cat Cooldown ---

  getCatOfferInterval() {
    return CONFIG.cats.cooldownUpgrade.intervals[this.catCooldownLevel];
  }

  getCatCooldownMaxLevel() {
    return CONFIG.cats.cooldownUpgrade.prices.length;
  }

  buyCatCooldown() {
    const table = CONFIG.cats.cooldownUpgrade.prices;
    if (this.catCooldownLevel >= table.length) return false;
    const cost = this.prices['cat-cooldown'];
    if (!this.spendFlowers(cost)) return false;
    this.catCooldownLevel++;
    this._advancePrice('cat-cooldown', this.catCooldownLevel, table);
    this._notify();
    return true;
  }

  // --- Powerups ---

  collectPowerup(id) {
    this.powerups[id] = (this.powerups[id] || 0) + 1;
    this._notify();
  }

  usePowerup(id) {
    if (!this.powerups[id] || this.powerups[id] <= 0) return false;
    this.powerups[id]--;
    if (this.powerups[id] <= 0) delete this.powerups[id];
    this._notify();
    return true;
  }

  getPowerupCount(id) {
    return this.powerups[id] || 0;
  }

  // --- Stats ---

  computeFlowersPerSecond() {
    const now = performance.now();
    this._recentCollections = this._recentCollections.filter(
      (c) => now - c.time < 60000
    );
    const total = this._recentCollections.reduce((s, c) => s + c.amount, 0);
    this.flowersPerSecond = Math.round((total / 60) * 10) / 10;
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
    this.dronesBought = 0;
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
    this.catCooldownLevel = 0;

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
      v: 2,
      fl: this.flowers,
      tfc: this.totalFlowersCollected,
      dr: this.dronesOwned,
      drb: this.dronesBought,
      s2dr: this.s2DronesOwned,
      dock: this.dockLevel,
      dsg: this.dockSkillGen,
      dsl: this.droneSpeedLevel,
      dhl: this.droneHarvestLevel,
      s2sl: this.s2SpeedLevel,
      s2hl: this.s2HarvestLevel,
      sp: this.skillPoints,
      sc: this.skillCurrency,
      tsp: this.totalSkillPointsEarned,
      ssl: this.spawnSpeedLevel,
      sbl: this.spawnBatchLevel,
      fvl: this.flowerValueLevel,
      fml: this.flowerMultiplierLevel,
      mfl: this.megaFlowerLevel,
      mul: this.mushroomLevel,
      cal: this.capacityLevel,
      prices: this.prices,
      perks: Object.fromEntries(
        Object.entries(this.skillPerks)
          .filter(([, v]) => v.owned)
          .map(([k]) => [k, 1])
      ),
      pup: this.powerups,
    };
    return btoa(JSON.stringify(data));
  }

  importSave(encoded) {
    try {
      const data = JSON.parse(atob(encoded));
      if (!data) return false;

      if (data.v === 1) {
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
      }

      if (data.v === 2) {
        if (typeof data.fl === 'number') this.flowers = data.fl;
        if (typeof data.tfc === 'number') this.totalFlowersCollected = data.tfc;
        if (typeof data.dr === 'number') this.dronesOwned = data.dr;
        if (typeof data.drb === 'number') this.dronesBought = data.drb;
        if (typeof data.s2dr === 'number') this.s2DronesOwned = data.s2dr;
        if (typeof data.dock === 'number') this.dockLevel = data.dock;
        if (typeof data.dsg === 'boolean') this.dockSkillGen = data.dsg;
        if (typeof data.dsl === 'number') this.droneSpeedLevel = data.dsl;
        if (typeof data.dhl === 'number') this.droneHarvestLevel = data.dhl;
        if (typeof data.s2sl === 'number') this.s2SpeedLevel = data.s2sl;
        if (typeof data.s2hl === 'number') this.s2HarvestLevel = data.s2hl;
        if (typeof data.sp === 'number') this.skillPoints = data.sp;
        if (typeof data.sc === 'number') this.skillCurrency = data.sc;
        if (typeof data.tsp === 'number') this.totalSkillPointsEarned = data.tsp;
        if (typeof data.ssl === 'number') this.spawnSpeedLevel = data.ssl;
        if (typeof data.sbl === 'number') this.spawnBatchLevel = data.sbl;
        if (typeof data.fvl === 'number') this.flowerValueLevel = data.fvl;
        if (typeof data.fml === 'number') this.flowerMultiplierLevel = data.fml;
        if (typeof data.mfl === 'number') this.megaFlowerLevel = data.mfl;
        if (typeof data.mul === 'number') this.mushroomLevel = data.mul;
        if (typeof data.cal === 'number') this.capacityLevel = data.cal;
        if (data.prices) {
          for (const [k, v] of Object.entries(data.prices)) {
            if (k in this.prices) this.prices[k] = v;
          }
        }
        if (data.perks) {
          for (const id of Object.keys(data.perks)) {
            if (this.skillPerks[id]) this.skillPerks[id].owned = true;
          }
        }
        if (data.pup && typeof data.pup === 'object') {
          this.powerups = { ...data.pup };
        }
        this._notify();
        this._onImport?.();
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }
}

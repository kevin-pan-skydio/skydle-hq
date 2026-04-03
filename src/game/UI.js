import * as THREE from 'three';
import CONFIG from '../config.json';

const R1 = CONFIG.drones.r1;
const UPG = R1.upgrades;

export class UI {
  constructor(state, droneManager, flowerManager, camera, renderer) {
    this.state = state;
    this.droneManager = droneManager;
    this.flowerManager = flowerManager;
    this.camera = camera;
    this.renderer = renderer;

    this.flowerCountEl = document.getElementById('flower-count');
    this.fpsEl = document.getElementById('flowers-per-sec');
    this.mapFlowerCountEl = document.getElementById('map-flower-count');
    this.mapFlowerMaxEl = document.getElementById('map-flower-max');
    this.mapFlowersEl = document.getElementById('map-flowers');
    this.shopEl = document.getElementById('shop');
    this.toastContainer = document.getElementById('toast-container');
    this.placementBanner = document.getElementById('placement-banner');
    this.buyR1Btn = document.getElementById('buy-r1-btn');
    this.costEl = document.getElementById('r1-cost');

    this.dockLevelEl = document.getElementById('dock-level');
    this.dockCostEl = document.getElementById('global-dock-cost');
    this.globalSpeedLevelEl = document.getElementById('global-speed-level');
    this.globalSpeedCostEl = document.getElementById('global-speed-cost');
    this.globalHarvestLevelEl = document.getElementById('global-harvest-level');
    this.globalHarvestCostEl = document.getElementById('global-harvest-cost');

    this.spawnLevelEl = document.getElementById('spawn-level');
    this.spawnCostEl = document.getElementById('spawn-speed-cost');
    this.batchLevelEl = document.getElementById('batch-level');
    this.batchCostEl = document.getElementById('spawn-batch-cost');
    this.valueLevelEl = document.getElementById('value-level');
    this.valueCostEl = document.getElementById('flower-value-cost');
    this.multiLevelEl = document.getElementById('multi-level');
    this.multiCostEl = document.getElementById('flower-multi-cost');
    this.megaLevelEl = document.getElementById('mega-level');
    this.megaCostEl = document.getElementById('mega-flower-cost');

    this.badgeSpawn = document.getElementById('badge-spawn');
    this.badgeSpawnVal = document.getElementById('badge-spawn-val');
    this.badgeSpawnTip = document.getElementById('badge-spawn-tip');
    this.badgeBatch = document.getElementById('badge-batch');
    this.badgeBatchVal = document.getElementById('badge-batch-val');
    this.badgeBatchTip = document.getElementById('badge-batch-tip');
    this.badgeValue = document.getElementById('badge-value');
    this.badgeValueVal = document.getElementById('badge-value-val');
    this.badgeValueTip = document.getElementById('badge-value-tip');
    this.badgeMulti = document.getElementById('badge-multi');
    this.badgeMultiVal = document.getElementById('badge-multi-val');
    this.badgeMultiTip = document.getElementById('badge-multi-tip');
    this.badgeMega = document.getElementById('badge-mega');
    this.badgeMegaVal = document.getElementById('badge-mega-val');
    this.badgeMegaTip = document.getElementById('badge-mega-tip');
    this.badgeDrones = document.getElementById('badge-drones');
    this.badgeDronesVal = document.getElementById('badge-drones-val');
    this.badgeDronesTip = document.getElementById('badge-drones-tip');

    this.dronePopup = document.getElementById('drone-popup');
    this.dronePopupTitle = document.getElementById('drone-popup-title');
    this.dronePopupStatus = document.getElementById('drone-popup-status');
    this.dronePopupUpgrades = document.getElementById('drone-popup-upgrades');
    this.selectedDroneIdx = -1;

    this.setupShop();
    this.setupTabs();
    this.setupUpgrades();
    this.setupDronePopup();
    this.state.onChange(() => this.updateDisplay());
    this.droneManager.onPlacementChange((active) => this.onPlacementChange(active));
    this.fpsTimer = 0;
  }

  setupTabs() {
    const tabs = document.querySelectorAll('.shop-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.shop-tab-content').forEach((c) => c.classList.add('hidden'));
        const target = document.getElementById('tab-' + tab.dataset.tab);
        if (target) target.classList.remove('hidden');
      });
    });
  }

  setupShop() {
    document.getElementById('shop-toggle').addEventListener('click', () => {
      this.shopEl.classList.toggle('hidden');
    });

    document.getElementById('shop-close').addEventListener('click', () => {
      this.shopEl.classList.add('hidden');
    });

    this.buyR1Btn.addEventListener('click', () => {
      if (this.state.buyDrone()) {
        this.showToast('Skydio R1 purchased! Place it on a purple tile.');
        this.shopEl.classList.add('hidden');
        this.closeDronePopup();
        this.droneManager.enterPlacementMode();
      } else {
        this.showToast('Not enough flowers!');
      }
    });

    document.getElementById('cancel-placement').addEventListener('click', () => {
      this.droneManager.cancelPlacement();
      this.state.dronesOwned--;
      const prevCost = Math.floor(this.state.prices['r1-drone'] / R1.price.scale);
      this.state.flowers += prevCost;
      this.state.prices['r1-drone'] = prevCost;
      this.state._notify();
      this.showToast('Placement cancelled, flowers refunded.');
    });

    document.getElementById('buy-global-dock').addEventListener('click', () => {
      if (this.state.buyGlobalDock()) {
        this.droneManager.applyGlobalDock();
        this.showToast('Drone Dock installed! 1s cooldown for all R1s.');
      } else {
        this.showToast('Not enough flowers!');
      }
    });

    document.getElementById('buy-global-speed').addEventListener('click', () => {
      if (this.state.buyGlobalSpeed()) {
        this.showToast(`Propeller+ upgraded for all R1s! Lv.${this.state.droneSpeedLevel}`);
      } else {
        this.showToast('Not enough flowers!');
      }
    });

    document.getElementById('buy-global-harvest').addEventListener('click', () => {
      if (this.state.buyGlobalHarvest()) {
        this.showToast(`Harvester+ upgraded for all R1s! Lv.${this.state.droneHarvestLevel}`);
      } else {
        this.showToast('Not enough flowers!');
      }
    });
  }

  setupUpgrades() {
    document.getElementById('buy-spawn-speed').addEventListener('click', () => {
      if (this.state.buySpawnSpeed()) {
        const interval = this.state.getSpawnInterval();
        this.showToast(`Spawn speed upgraded! Now ${interval}s`);
      } else {
        this.showToast('Not enough flowers!');
      }
    });

    document.getElementById('buy-spawn-batch').addEventListener('click', () => {
      if (this.state.buySpawnBatch()) {
        const expected = this.state.getSpawnBatchExpected();
        this.showToast(`Batch spawns upgraded! Avg ~${expected} per cycle`);
      } else {
        this.showToast('Not enough flowers!');
      }
    });

    document.getElementById('buy-flower-value').addEventListener('click', () => {
      if (this.state.buyFlowerValue()) {
        const val = this.state.getFlowerBaseValue();
        this.showToast(`Flower value upgraded! Now ${val} per flower`);
      } else {
        this.showToast('Not enough flowers!');
      }
    });

    document.getElementById('buy-flower-multi').addEventListener('click', () => {
      if (this.state.buyFlowerMultiplier()) {
        const mul = this.state.getFlowerMultiplier();
        this.showToast(`Multiplier upgraded! Now ${mul}x`);
      } else {
        this.showToast('Not enough flowers!');
      }
    });

    document.getElementById('buy-mega-flower').addEventListener('click', () => {
      if (this.state.buyMegaFlower()) {
        const chance = Math.round(this.state.getMegaFlowerChance() * 100);
        this.showToast(`Mega flowers upgraded! ${chance}% chance`);
      } else {
        this.showToast('Not enough flowers!');
      }
    });
  }

  setupDronePopup() {
    document.getElementById('drone-popup-close').addEventListener('click', () => {
      this.closeDronePopup();
    });
  }

  showDronePopup(droneIdx) {
    this.selectedDroneIdx = droneIdx;
    this.dronePopup.classList.remove('hidden');
    this.renderDronePopup();
    this.updatePopupPosition();
  }

  closeDronePopup() {
    this.selectedDroneIdx = -1;
    this.dronePopup.classList.add('hidden');
  }

  renderDronePopup() {
    const drones = this.droneManager.getDrones();
    const drone = drones[this.selectedDroneIdx];
    if (!drone) {
      this.closeDronePopup();
      return;
    }

    const num = this.selectedDroneIdx + 1;
    const label = drone.isUltimate ? `✨ Ultimate R1 #${num}` : `R1 #${num}`;
    this.dronePopupTitle.textContent = label;

    const stateLabels = {
      idle: '💤 Idle',
      flying: '✈️ Flying',
      harvesting: '🌸 Harvesting',
      returning: '↩️ Returning',
      cooling: '⏳ Cooling',
    };
    const spd = this.droneManager.getDroneSpeed(drone).toFixed(1);
    const ht = this.droneManager.getDroneHarvestTime(drone).toFixed(1);
    const cd = this.droneManager.getDroneCooldown(drone).toFixed(1);
    this.dronePopupStatus.textContent = `${stateLabels[drone.state] || drone.state} · ${spd} spd · ${ht}s harvest · ${cd}s cd`;

    let upgradesHtml = '';

    if (drone.isUltimate) {
      upgradesHtml += `<div class="popup-upgrade">
        <div class="item-icon" style="font-size:18px;width:32px;height:32px;">🌈</div>
        <div class="popup-upgrade-info">
          <div class="popup-upgrade-name">Ultimate R1</div>
          <div class="popup-upgrade-desc">3x all stats · Rainbow Holo</div>
        </div>
        <span class="popup-upgrade-done">✓ Active</span>
      </div>`;
    } else {
      const ultCost = this.state.prices['r1-ultimate'];
      const canAfford = this.state.canAfford('r1-ultimate');
      upgradesHtml += `<div class="popup-upgrade">
        <div class="item-icon" style="font-size:18px;width:32px;height:32px;">🌈</div>
        <div class="popup-upgrade-info">
          <div class="popup-upgrade-name">Ultimate R1</div>
          <div class="popup-upgrade-desc">3x speed, 3x harvest, 3x cooldown · Rainbow Holo mode</div>
        </div>
        <button class="buy-btn popup-buy-ultimate${canAfford ? '' : ' cannot-afford'}">${ultCost} 🌸</button>
      </div>`;
    }

    this.dronePopupUpgrades.innerHTML = upgradesHtml;
    this._bindPopupUpgradeButtons();
  }

  _bindPopupUpgradeButtons() {
    const ultBtn = this.dronePopupUpgrades.querySelector('.popup-buy-ultimate');
    if (ultBtn) {
      ultBtn.addEventListener('click', () => {
        const cost = this.state.prices['r1-ultimate'];
        if (!this.state.spendFlowers(cost)) {
          this.showToast('Not enough flowers!');
          return;
        }
        if (this.droneManager.upgradeDroneUltimate(this.selectedDroneIdx)) {
          this.showToast('🌈 Ultimate R1 activated! 3x all stats!');
          this.state._notify();
          this.renderDronePopup();
        }
      });
    }
  }

  updatePopupPosition() {
    if (this.selectedDroneIdx < 0) return;

    const drones = this.droneManager.getDrones();
    const drone = drones[this.selectedDroneIdx];
    if (!drone) {
      this.closeDronePopup();
      return;
    }

    const worldPos = new THREE.Vector3(
      drone.homePos.x,
      1.5,
      drone.homePos.z
    );

    const screenPos = worldPos.clone().project(this.camera);
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();

    const x = (screenPos.x * 0.5 + 0.5) * rect.width + rect.left;
    const y = (-screenPos.y * 0.5 + 0.5) * rect.height + rect.top;

    this.dronePopup.style.left = x + 'px';
    this.dronePopup.style.top = y + 'px';
  }

  onPlacementChange(active) {
    this.placementBanner.classList.toggle('hidden', !active);
    document.body.classList.toggle('placement-mode', active);
    if (active) this.closeDronePopup();
  }

  updateDisplay() {
    this.flowerCountEl.textContent = Math.floor(this.state.flowers);

    // Buy R1 button
    this.costEl.textContent = this.state.prices['r1-drone'] + ' 🌸';
    this.buyR1Btn.classList.toggle('cannot-afford', !this.state.canAfford('r1-drone'));

    // Global drone upgrades
    const hasDock = this.state.dockLevel >= 1;
    this.dockLevelEl.textContent = hasDock ? `Installed — ${UPG.dock.cooldown}s cooldown` : 'Not installed';
    const dockBtn = document.getElementById('buy-global-dock');
    if (hasDock) {
      dockBtn.textContent = '✓ Owned';
      dockBtn.classList.add('cannot-afford');
    } else {
      this.dockCostEl.textContent = this.state.prices['r1-dock'] + ' 🌸';
      dockBtn.classList.toggle('cannot-afford', !this.state.canAfford('r1-dock'));
    }

    const spdLvl = this.state.droneSpeedLevel;
    const maxSpd = spdLvl >= UPG.propeller.maxLevel;
    const spdVal = (R1.baseSpeed + spdLvl * UPG.propeller.speedPerLevel).toFixed(1);
    this.globalSpeedLevelEl.textContent = maxSpd ? `${spdLvl}/${UPG.propeller.maxLevel} — MAX` : `${spdLvl}/${UPG.propeller.maxLevel} — ${spdVal} speed`;
    this.globalSpeedCostEl.textContent = this.state.prices['drone-speed'] + ' 🌸';
    const spdBtn = document.getElementById('buy-global-speed');
    spdBtn.classList.toggle('cannot-afford', !this.state.canAfford('drone-speed') || maxSpd);
    if (maxSpd) spdBtn.textContent = 'MAX';

    const hvLvl = this.state.droneHarvestLevel;
    const hvMax = UPG.harvester.maxLevel || 99;
    const hvVal = Math.max(UPG.harvester.minHarvestTime, R1.baseHarvestTime - hvLvl * UPG.harvester.reductionPerLevel).toFixed(1);
    const maxHv = hvLvl >= hvMax || parseFloat(hvVal) <= UPG.harvester.minHarvestTime;
    this.globalHarvestLevelEl.textContent = maxHv ? `${hvLvl}/${hvMax} — MAX` : `${hvLvl}/${hvMax} — ${hvVal}s harvest`;
    this.globalHarvestCostEl.textContent = this.state.prices['drone-harvest'] + ' 🌸';
    const hvBtn = document.getElementById('buy-global-harvest');
    hvBtn.classList.toggle('cannot-afford', !this.state.canAfford('drone-harvest') || maxHv);
    if (maxHv) hvBtn.textContent = 'MAX';

    // Spawn speed upgrade
    const interval = this.state.getSpawnInterval();
    const spawnMax = this.state.getSpawnSpeedMaxLevel();
    const maxSpawn = this.state.spawnSpeedLevel >= spawnMax;
    this.spawnLevelEl.textContent = maxSpawn
      ? `${this.state.spawnSpeedLevel}/${spawnMax} — MAX`
      : `${this.state.spawnSpeedLevel}/${spawnMax} — ${interval.toFixed(1)}s interval`;
    this.spawnCostEl.textContent = this.state.prices['spawn-speed'] + ' 🌸';
    const spawnBtn = document.getElementById('buy-spawn-speed');
    spawnBtn.classList.toggle('cannot-afford', !this.state.canAfford('spawn-speed') || maxSpawn);
    if (maxSpawn) spawnBtn.textContent = 'MAX';

    // Batch spawn upgrade
    const batchExpected = this.state.getSpawnBatchExpected();
    const batchMax = this.state.getSpawnBatchMaxLevel();
    const maxBatch = this.state.spawnBatchLevel >= batchMax;
    const batchLvl = this.state.spawnBatchLevel;
    const bu = CONFIG.collectibles.flowers.batchUpgrade;
    if (maxBatch) {
      this.batchLevelEl.textContent = `${batchLvl}/${batchMax} — MAX`;
    } else if (batchLvl < bu.guaranteed.length) {
      this.batchLevelEl.textContent = `${batchLvl}/${batchMax} — ${bu.guaranteed[batchLvl]} per cycle`;
    } else {
      this.batchLevelEl.textContent = `${batchLvl}/${batchMax} — avg ~${batchExpected} per cycle`;
    }
    this.batchCostEl.textContent = this.state.prices['spawn-batch'] + ' 🌸';
    const batchBtn = document.getElementById('buy-spawn-batch');
    batchBtn.classList.toggle('cannot-afford', !this.state.canAfford('spawn-batch') || maxBatch);
    if (maxBatch) batchBtn.textContent = 'MAX';

    // Flower value upgrade
    const flowerVal = this.state.getFlowerBaseValue();
    const valueMax = this.state.getFlowerValueMaxLevel();
    const maxValue = this.state.flowerValueLevel >= valueMax;
    this.valueLevelEl.textContent = maxValue
      ? `${this.state.flowerValueLevel}/${valueMax} — MAX`
      : `${this.state.flowerValueLevel}/${valueMax} — ${flowerVal} per flower`;
    this.valueCostEl.textContent = this.state.prices['flower-value'] + ' 🌸';
    const valueBtn = document.getElementById('buy-flower-value');
    valueBtn.classList.toggle('cannot-afford', !this.state.canAfford('flower-value') || maxValue);
    if (maxValue) valueBtn.textContent = 'MAX';

    // Multiplier upgrade
    const flowerMul = this.state.getFlowerMultiplier();
    const multiMax = this.state.getFlowerMultiplierMaxLevel();
    const maxMulti = this.state.flowerMultiplierLevel >= multiMax;
    this.multiLevelEl.textContent = maxMulti
      ? `${this.state.flowerMultiplierLevel}/${multiMax} — MAX`
      : `${this.state.flowerMultiplierLevel}/${multiMax} — ${flowerMul}x`;
    this.multiCostEl.textContent = this.state.prices['flower-multi'] + ' 🌸';
    const multiBtn = document.getElementById('buy-flower-multi');
    multiBtn.classList.toggle('cannot-afford', !this.state.canAfford('flower-multi') || maxMulti);
    if (maxMulti) multiBtn.textContent = 'MAX';

    // Mega flower upgrade
    const chance = Math.round(this.state.getMegaFlowerChance() * 100);
    const megaMax = this.state.getMegaMaxLevel();
    const maxMega = this.state.megaFlowerLevel >= megaMax;
    const megaVal = this.state.getMegaFlowerValue();
    this.megaLevelEl.textContent = maxMega
      ? `${this.state.megaFlowerLevel}/${megaMax} — MAX (${chance}%, ${megaVal}x)`
      : `${this.state.megaFlowerLevel}/${megaMax} — ${chance}% chance (${megaVal}x value)`;
    this.megaCostEl.textContent = this.state.prices['mega-flower'] + ' 🌸';
    const megaBtn = document.getElementById('buy-mega-flower');
    megaBtn.classList.toggle('cannot-afford', !this.state.canAfford('mega-flower') || maxMega);
    if (maxMega) megaBtn.textContent = 'MAX';

    // Badges
    if (this.state.spawnSpeedLevel > 0) {
      this.badgeSpawn.classList.remove('hidden');
      this.badgeSpawnVal.textContent = this.state.spawnSpeedLevel;
      this.badgeSpawnTip.textContent = `Faster Spawns ${this.state.spawnSpeedLevel}/${spawnMax} — ${interval.toFixed(1)}s`;
    }
    if (this.state.spawnBatchLevel > 0) {
      this.badgeBatch.classList.remove('hidden');
      this.badgeBatchVal.textContent = this.state.spawnBatchLevel;
      const batchTipText = batchLvl < bu.guaranteed.length
        ? `Batch Spawns ${batchLvl}/${batchMax} — ${bu.guaranteed[batchLvl]} per cycle`
        : `Batch Spawns ${batchLvl}/${batchMax} — avg ~${batchExpected}, up to ${bu.maxCount}`;
      this.badgeBatchTip.textContent = batchTipText;
    }
    if (this.state.flowerValueLevel > 0) {
      this.badgeValue.classList.remove('hidden');
      this.badgeValueVal.textContent = this.state.flowerValueLevel;
      this.badgeValueTip.textContent = `Flower Value ${this.state.flowerValueLevel}/${valueMax} — ${flowerVal} per flower`;
    }
    if (this.state.flowerMultiplierLevel > 0) {
      this.badgeMulti.classList.remove('hidden');
      this.badgeMultiVal.textContent = this.state.flowerMultiplierLevel;
      this.badgeMultiTip.textContent = `Multiplier ${this.state.flowerMultiplierLevel}/${multiMax} — ${flowerMul}x`;
    }
    if (this.state.megaFlowerLevel > 0) {
      this.badgeMega.classList.remove('hidden');
      this.badgeMegaVal.textContent = this.state.megaFlowerLevel;
      this.badgeMegaTip.textContent = `Mega Flowers ${this.state.megaFlowerLevel}/${megaMax} — ${chance}% chance`;
    }
    if (this.state.dronesOwned > 0) {
      this.badgeDrones.classList.remove('hidden');
      this.badgeDronesVal.textContent = this.state.dronesOwned;
      const ultCount = this.droneManager.getDrones().filter((d) => d.isUltimate).length;
      this.badgeDronesTip.textContent = `${this.state.dronesOwned} drone${this.state.dronesOwned > 1 ? 's' : ''}${ultCount > 0 ? `, ${ultCount} ultimate` : ''}`;
    }

    if (this.selectedDroneIdx >= 0) this.renderDronePopup();
  }

  update(dt) {
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fpsTimer = 0;
      this.state.computeFlowersPerSecond();
      this.fpsEl.textContent = `(${this.state.flowersPerSecond}/s)`;
    }

    const counts = this.flowerManager.getCounts();
    this.mapFlowerCountEl.textContent = counts.total;
    this.mapFlowerMaxEl.textContent = counts.max;
    this.mapFlowersEl.classList.toggle('at-cap', counts.total >= counts.max);

    if (this.selectedDroneIdx >= 0) {
      this.updatePopupPosition();
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 1500);
  }
}

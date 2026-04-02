import * as THREE from 'three';

export class UI {
  constructor(state, droneManager, camera, renderer) {
    this.state = state;
    this.droneManager = droneManager;
    this.camera = camera;
    this.renderer = renderer;

    this.flowerCountEl = document.getElementById('flower-count');
    this.fpsEl = document.getElementById('flowers-per-sec');
    this.shopEl = document.getElementById('shop');
    this.toastContainer = document.getElementById('toast-container');
    this.placementBanner = document.getElementById('placement-banner');
    this.buyBtn = document.getElementById('buy-r1');
    this.costEl = document.getElementById('r1-cost');
    this.ownedEl = document.getElementById('drones-owned');

    this.spawnLevelEl = document.getElementById('spawn-level');
    this.spawnCostEl = document.getElementById('spawn-speed-cost');
    this.megaLevelEl = document.getElementById('mega-level');
    this.megaCostEl = document.getElementById('mega-flower-cost');

    this.badgeSpawn = document.getElementById('badge-spawn');
    this.badgeSpawnVal = document.getElementById('badge-spawn-val');
    this.badgeSpawnTip = document.getElementById('badge-spawn-tip');
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

    this.buyBtn.addEventListener('click', () => {
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
      const prevCost = Math.floor(this.state.prices['r1-drone'] / 1.6);
      this.state.flowers += prevCost;
      this.state.prices['r1-drone'] = prevCost;
      this.state._notify();
      this.showToast('Placement cancelled, flowers refunded.');
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

    const parts = ['R1'];
    if (drone.hasDock) parts.push('Dock');
    if (drone.speedLevel > 0) parts.push(`P+${drone.speedLevel}`);
    if (drone.harvestLevel > 0) parts.push(`H+${drone.harvestLevel}`);
    const num = this.selectedDroneIdx + 1;
    this.dronePopupTitle.textContent = `${parts.join(' · ')} #${num}`;

    const stateLabels = {
      idle: '💤 Idle',
      flying: '✈️ Flying',
      harvesting: '🌸 Harvesting',
      returning: '↩️ Returning',
      cooling: '⏳ Cooling',
    };
    const cooldownInfo = drone.hasDock ? '3s cd' : '7s cd';
    const spd = this.droneManager.getDroneSpeed(drone).toFixed(1);
    const ht = this.droneManager.getDroneHarvestTime(drone).toFixed(1);
    this.dronePopupStatus.textContent = `${stateLabels[drone.state] || drone.state} · ${cooldownInfo} · ${spd} spd · ${ht}s harvest`;

    const dockCost = this.state.prices['r1-dock'];
    const canAffordDock = this.state.canAfford('r1-dock');
    const speedCost = this.state.prices['drone-speed'];
    const canAffordSpeed = this.state.canAfford('drone-speed');
    const harvestCost = this.state.prices['drone-harvest'];
    const canAffordHarvest = this.state.canAfford('drone-harvest');

    const speed = this.droneManager.getDroneSpeed(drone);
    const harvestTime = this.droneManager.getDroneHarvestTime(drone);
    const maxSpeed = drone.speedLevel >= 5;
    const maxHarvest = harvestTime <= 0.5;

    let upgradesHtml = '';

    // Dock
    if (drone.hasDock) {
      upgradesHtml += `<div class="popup-upgrade">
        <div class="item-icon" style="font-size:18px;width:32px;height:32px;">🏗️</div>
        <div class="popup-upgrade-info">
          <div class="popup-upgrade-name">Drone Dock</div>
          <div class="popup-upgrade-desc">3s cooldown active</div>
        </div>
        <span class="popup-upgrade-done">✓ Installed</span>
      </div>`;
    } else {
      upgradesHtml += `<div class="popup-upgrade">
        <div class="item-icon" style="font-size:18px;width:32px;height:32px;">🏗️</div>
        <div class="popup-upgrade-info">
          <div class="popup-upgrade-name">Drone Dock</div>
          <div class="popup-upgrade-desc">Reduces cooldown to 3s</div>
        </div>
        <button class="buy-btn popup-buy-dock${canAffordDock ? '' : ' cannot-afford'}">${dockCost} 🌸</button>
      </div>`;
    }

    // Speed
    upgradesHtml += `<div class="popup-upgrade">
      <div class="item-icon" style="font-size:18px;width:32px;height:32px;">💨</div>
      <div class="popup-upgrade-info">
        <div class="popup-upgrade-name">Propeller+${maxSpeed ? ' MAX' : ''}</div>
        <div class="popup-upgrade-desc">Lv.${drone.speedLevel} — ${speed.toFixed(1)} speed</div>
      </div>
      ${maxSpeed
        ? '<span class="popup-upgrade-done">MAX</span>'
        : `<button class="buy-btn popup-buy-speed${canAffordSpeed ? '' : ' cannot-afford'}">${speedCost} 🌸</button>`}
    </div>`;

    // Harvest
    upgradesHtml += `<div class="popup-upgrade">
      <div class="item-icon" style="font-size:18px;width:32px;height:32px;">⚙️</div>
      <div class="popup-upgrade-info">
        <div class="popup-upgrade-name">Harvester+${maxHarvest ? ' MAX' : ''}</div>
        <div class="popup-upgrade-desc">Lv.${drone.harvestLevel} — ${harvestTime.toFixed(1)}s harvest</div>
      </div>
      ${maxHarvest
        ? '<span class="popup-upgrade-done">MAX</span>'
        : `<button class="buy-btn popup-buy-harvest${canAffordHarvest ? '' : ' cannot-afford'}">${harvestCost} 🌸</button>`}
    </div>`;

    this.dronePopupUpgrades.innerHTML = upgradesHtml;

    this._bindPopupUpgradeButtons();
  }

  _bindPopupUpgradeButtons() {
    const dockBtn = this.dronePopupUpgrades.querySelector('.popup-buy-dock');
    if (dockBtn) {
      dockBtn.addEventListener('click', () => {
        const cost = this.state.prices['r1-dock'];
        if (!this.state.spendFlowers(cost)) {
          this.showToast('Not enough flowers!');
          return;
        }
        if (this.droneManager.upgradeDroneDock(this.selectedDroneIdx)) {
          this.showToast('Dock installed! Cooldown reduced to 3s.');
          this.state._notify();
          this.renderDronePopup();
        }
      });
    }

    const speedBtn = this.dronePopupUpgrades.querySelector('.popup-buy-speed');
    if (speedBtn) {
      speedBtn.addEventListener('click', () => {
        const cost = this.state.prices['drone-speed'];
        if (!this.state.spendFlowers(cost)) {
          this.showToast('Not enough flowers!');
          return;
        }
        if (this.droneManager.upgradeDroneSpeed(this.selectedDroneIdx)) {
          this.state.prices['drone-speed'] = this.state.devMode ? 1 : Math.floor(this.state.prices['drone-speed'] * 1.5);
          const spd = this.droneManager.getDroneSpeed(this.droneManager.getDrones()[this.selectedDroneIdx]);
          this.showToast(`Propeller upgraded! Speed: ${spd.toFixed(1)}`);
          this.state._notify();
          this.renderDronePopup();
        }
      });
    }

    const harvestBtn = this.dronePopupUpgrades.querySelector('.popup-buy-harvest');
    if (harvestBtn) {
      harvestBtn.addEventListener('click', () => {
        const cost = this.state.prices['drone-harvest'];
        if (!this.state.spendFlowers(cost)) {
          this.showToast('Not enough flowers!');
          return;
        }
        if (this.droneManager.upgradeDroneHarvest(this.selectedDroneIdx)) {
          this.state.prices['drone-harvest'] = this.state.devMode ? 1 : Math.floor(this.state.prices['drone-harvest'] * 1.5);
          const ht = this.droneManager.getDroneHarvestTime(this.droneManager.getDrones()[this.selectedDroneIdx]);
          this.showToast(`Harvester upgraded! ${ht.toFixed(1)}s harvest time`);
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

    // Drone shop
    this.costEl.textContent = this.state.prices['r1-drone'] + ' 🌸';
    this.ownedEl.textContent = 'Owned: ' + this.state.dronesOwned;
    this.buyBtn.classList.toggle('cannot-afford', !this.state.canAfford('r1-drone'));

    // Spawn speed upgrade
    const interval = this.state.getSpawnInterval();
    const maxSpawn = interval <= 2;
    this.spawnLevelEl.textContent = maxSpawn
      ? `Level ${this.state.spawnSpeedLevel} — MAX`
      : `Level ${this.state.spawnSpeedLevel} — ${interval}s interval`;
    this.spawnCostEl.textContent = this.state.prices['spawn-speed'] + ' 🌸';
    const spawnBtn = document.getElementById('buy-spawn-speed');
    spawnBtn.classList.toggle('cannot-afford', !this.state.canAfford('spawn-speed') || maxSpawn);
    if (maxSpawn) spawnBtn.textContent = 'MAX';

    // Mega flower upgrade
    const chance = Math.round(this.state.getMegaFlowerChance() * 100);
    const maxMega = chance >= 60;
    const val = this.state.getMegaFlowerValue();
    this.megaLevelEl.textContent = maxMega
      ? `Level ${this.state.megaFlowerLevel} — MAX (${val}🌸 each)`
      : `Level ${this.state.megaFlowerLevel} — ${chance}% chance (${val}🌸 each)`;
    this.megaCostEl.textContent = this.state.prices['mega-flower'] + ' 🌸';
    const megaBtn = document.getElementById('buy-mega-flower');
    megaBtn.classList.toggle('cannot-afford', !this.state.canAfford('mega-flower') || maxMega);
    if (maxMega) megaBtn.textContent = 'MAX';

    // Badges
    if (this.state.spawnSpeedLevel > 0) {
      this.badgeSpawn.classList.remove('hidden');
      this.badgeSpawnVal.textContent = this.state.spawnSpeedLevel;
      this.badgeSpawnTip.textContent = `Faster Spawns Lv.${this.state.spawnSpeedLevel} — ${interval}s between flowers`;
    }
    if (this.state.megaFlowerLevel > 0) {
      this.badgeMega.classList.remove('hidden');
      this.badgeMegaVal.textContent = this.state.megaFlowerLevel;
      this.badgeMegaTip.textContent = `Mega Flowers Lv.${this.state.megaFlowerLevel} — ${chance}% chance, worth ${val}🌸`;
    }
    if (this.state.dronesOwned > 0) {
      this.badgeDrones.classList.remove('hidden');
      this.badgeDronesVal.textContent = this.state.dronesOwned;
      const dockedCount = this.droneManager.getDrones().filter((d) => d.hasDock).length;
      this.badgeDronesTip.textContent = `${this.state.dronesOwned} drone${this.state.dronesOwned > 1 ? 's' : ''}, ${dockedCount} docked`;
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

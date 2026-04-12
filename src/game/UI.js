import * as THREE from 'three';
import CONFIG from '../config.json';
import SKILL_TREE from '../config-skill-tree.json';

const R1 = CONFIG.drones.r1;
const S2 = CONFIG.drones.s2;
const UPG = R1.upgrades;
const S2UPG = S2.upgrades;

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
    this.dockSkillGenItem = document.getElementById('dock-skill-gen-item');
    this.dockSkillGenLevelEl = document.getElementById('dock-skill-gen-level');
    this.dockSkillGenCostEl = document.getElementById('dock-skill-gen-cost');
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
    this.capacityLevelEl = document.getElementById('capacity-level');
    this.capacityCostEl = document.getElementById('flower-capacity-cost');
    this.mushroomLevelEl = document.getElementById('mushroom-level');
    this.mushroomCostEl = document.getElementById('mushroom-cost');

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
    this.badgeMushroom = document.getElementById('badge-mushroom');
    this.badgeMushroomVal = document.getElementById('badge-mushroom-val');
    this.badgeMushroomTip = document.getElementById('badge-mushroom-tip');
    this.badgeDrones = document.getElementById('badge-drones');
    this.badgeDronesVal = document.getElementById('badge-drones-val');
    this.badgeDronesTip = document.getElementById('badge-drones-tip');

    this.skillPointsCountEl = document.getElementById('skill-points-count');
    this.skillBarFillEl = document.getElementById('skill-bar-fill');
    this.skillBarLabelEl = document.getElementById('skill-bar-label');
    this.convertBtn = document.getElementById('convert-flowers-btn');
    this.skillPointsDisplayEl = document.getElementById('skill-points-display');
    this._lastSkillPoints = 0;

    this.dronePopup = document.getElementById('drone-popup');
    this.dronePopupTitle = document.getElementById('drone-popup-title');
    this.dronePopupStatus = document.getElementById('drone-popup-status');
    this.dronePopupUpgrades = document.getElementById('drone-popup-upgrades');
    this.selectedDroneIdx = -1;

    this.skillOverlay = document.getElementById('skill-overlay');
    this.skillMenuBalance = document.getElementById('skill-menu-balance');
    this.skillTreeLines = document.getElementById('skill-tree-lines');

    this.setupShop();
    this.setupTabs();
    this.setupUpgrades();
    this.setupDronePopup();
    this.setupSkillPoints();
    this._buildSkillTreeNodes();
    this.setupSkillMenu();
    this.setupWelcome();
    this.setupSaveLoad();
    this.setupPowerupMenu();
    this.state.onChange(() => this.updateDisplay());
    this.droneManager.onPlacementChange((active) => this.onPlacementChange(active));
    this.fpsTimer = 0;
    this.updateDisplay();
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
      if (this.droneManager.placementMode) {
        this.showToast('Place your current drone first!');
        return;
      }
      if (this.state.buyDrone()) {
        this.showToast('Skydio R1 purchased! Place it on a purple tile.');
        this.shopEl.classList.add('hidden');
        this.closeDronePopup();
        this.droneManager.enterPlacementMode(false);
      } else {
        this.showToast('Not enough flowers!');
      }
    });

    this.buyS2Btn = document.getElementById('buy-s2-btn');
    this.s2CostEl = document.getElementById('s2-cost');

    this.buyS2Btn.addEventListener('click', () => {
      if (this.droneManager.placementMode) {
        this.showToast('Place your current drone first!');
        return;
      }
      if (this.state.buyS2Drone()) {
        this.showToast('Skydio S2 purchased! Place it on a purple tile.');
        this.shopEl.classList.add('hidden');
        this.closeDronePopup();
        this.droneManager.enterPlacementMode(true);
      } else {
        this.showToast('Not enough flowers!');
      }
    });

    document.getElementById('cancel-placement').addEventListener('click', () => {
      const wasS2 = this.droneManager._pendingS2;
      this.droneManager.cancelPlacement();
      if (wasS2) {
        this.state.s2DronesOwned--;
        const refund = this.state.lastS2Cost || 0;
        this.state.flowers += refund;
        this.state.prices['s2-drone'] = refund;
      } else {
        this.state.dronesOwned--;
        const refund = this.state.lastDroneCost || 0;
        this.state.flowers += refund;
        this.state.prices['r1-drone'] = refund;
      }
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

    document.getElementById('buy-dock-skill-gen').addEventListener('click', () => {
      if (this.state.buyDockSkillGen()) {
        this.droneManager.applyDockSkillGen();
        this.showToast('★ Ultimate Dock active! Docks now generate skill XP.');
      } else if (this.state.dockLevel < 1) {
        this.showToast('Buy Drone Dock first!');
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

    document.getElementById('buy-s2-speed').addEventListener('click', () => {
      if (this.state.buyS2Speed()) {
        this.showToast(`S2 Propeller+ upgraded! Lv.${this.state.s2SpeedLevel}`);
      } else {
        this.showToast('Not enough flowers!');
      }
    });

    document.getElementById('buy-s2-harvest').addEventListener('click', () => {
      if (this.state.buyS2Harvest()) {
        this.showToast(`S2 Harvester+ upgraded! Lv.${this.state.s2HarvestLevel}`);
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

    document.getElementById('buy-mushroom').addEventListener('click', () => {
      if (this.state.buyMushroom()) {
        const chance = Math.round(this.state.getMushroomChance() * 100);
        this.showToast(`🍄 Mushrooms upgraded! ${chance}% chance`);
      } else {
        this.showToast('Not enough flowers!');
      }
    });

    document.getElementById('buy-flower-capacity').addEventListener('click', () => {
      if (this.state.buyCapacity()) {
        const bonus = this.state.getCapacityBonus();
        this.showToast(`Grid capacity +${bonus}!`);
      } else {
        this.showToast('Not enough flowers!');
      }
    });
  }

  setupDronePopup() {
    document.getElementById('drone-popup-close').addEventListener('click', () => {
      this.closeDronePopup();
    });

    this.dronePopupUpgrades.addEventListener('click', (e) => {
      const ultBtn = e.target.closest('.popup-buy-ultimate');
      if (!ultBtn) return;
      const drones = this.droneManager.getDrones();
      const drone = drones[this.selectedDroneIdx];
      if (!drone) return;
      const isS2 = drone.isS2;
      const priceKey = isS2 ? 's2-ultimate' : 'r1-ultimate';
      const cost = this.state.prices[priceKey];
      if (!this.state.spendFlowers(cost)) {
        this.showToast('Not enough flowers!');
        return;
      }
      if (this.droneManager.upgradeDroneUltimate(this.selectedDroneIdx)) {
        const typeName = isS2 ? 'S2' : 'R1';
        this.showToast(`🌈 Ultimate ${typeName} activated!`);
        if (!this.state.devMode) {
          const ultTable = isS2 ? S2UPG.ultimate.prices : UPG.ultimate.prices;
          const ultCount = this.droneManager.getDrones().filter(d => d.isS2 === isS2 && d.isUltimate).length;
          if (ultCount < ultTable.length) {
            this.state.prices[priceKey] = ultTable[ultCount];
          }
        }
        this.state._notify();
        this.renderDronePopup();
      }
    });
  }

  setupSkillPoints() {
    this.convertBtn.addEventListener('click', () => {
      if (this.state.flowers < 1) return;
      const prevSP = this.state.skillPoints;
      if (this.state.convertAllFlowersToSkillCurrency()) {
        const gained = this.state.skillPoints - prevSP;
        if (gained > 0) {
          this.showToast(`★ +${gained} Skill Point${gained > 1 ? 's' : ''}!`);
          this.skillPointsDisplayEl.classList.remove('gained');
          void this.skillPointsDisplayEl.offsetWidth;
          this.skillPointsDisplayEl.classList.add('gained');
        } else {
          this.showToast('Flowers converted to skill XP!');
        }
      }
    });
  }

  _buildSkillTreeNodes() {
    const container = document.getElementById('skill-tree-nodes');
    container.innerHTML = '';
    for (const [id, node] of Object.entries(SKILL_TREE.nodes)) {
      const posClass = node.position === 'center' ? '' : ` ${node.position}`;
      const div = document.createElement('div');
      div.className = `skill-node tier-${node.tier}${posClass}`;
      div.dataset.skill = id;
      div.innerHTML = `
        <div class="node-ring"><div class="node-icon">${node.icon}</div></div>
        <div class="node-label">${node.label}</div>
        <div class="node-desc">${node.desc}</div>
        <div class="node-cost">${node.cost} ★</div>`;
      container.appendChild(div);
    }
  }

  setupSkillMenu() {
    this.skillPointsDisplayEl.style.cursor = 'pointer';
    this.skillPointsDisplayEl.addEventListener('click', (e) => {
      if (e.target.id === 'skill-info-icon') return;
      this.skillOverlay.classList.toggle('hidden');
      if (!this.skillOverlay.classList.contains('hidden')) {
        this._drawTreeLines();
      }
    });

    document.getElementById('skill-menu-close').addEventListener('click', () => {
      this.skillOverlay.classList.add('hidden');
    });

    this.skillOverlay.addEventListener('click', (e) => {
      if (e.target === this.skillOverlay) {
        this.skillOverlay.classList.add('hidden');
      }
    });

    this._confirmEl = document.getElementById('skill-confirm');
    this._confirmNameEl = document.getElementById('skill-confirm-name');
    this._confirmDescEl = document.getElementById('skill-confirm-desc');
    this._confirmCostEl = document.getElementById('skill-confirm-cost-val');
    this._pendingPerkId = null;

    document.getElementById('skill-confirm-no').addEventListener('click', () => {
      this._confirmEl.classList.add('hidden');
      this._pendingPerkId = null;
    });

    document.getElementById('skill-confirm-yes').addEventListener('click', () => {
      this._confirmEl.classList.add('hidden');
      const id = this._pendingPerkId;
      this._pendingPerkId = null;
      if (!id) return;
      const name = document.querySelector(`.skill-node[data-skill="${id}"] .node-label`).textContent;
      if (this.state.buySkillPerk(id)) {
        this.skillOverlay.classList.add('hidden');
        this.closeDronePopup();
        this.showToast(`★ ${name} unlocked! Board reset — rebuild your empire.`);
      }
    });

    document.querySelectorAll('.skill-node').forEach((node) => {
      node.addEventListener('click', () => {
        const id = node.dataset.skill;
        const perk = this.state.skillPerks[id];
        if (perk?.owned) {
          this.showToast('Already unlocked!');
          return;
        }
        if (!this.state.isPerkUnlocked(id)) {
          this.showToast('Unlock the prerequisite first!');
          return;
        }
        if (this.state.skillPoints < perk.cost) {
          this.showToast('Not enough skill points!');
          return;
        }
        this._pendingPerkId = id;
        this._confirmNameEl.textContent = node.querySelector('.node-label').textContent;
        this._confirmDescEl.textContent = node.querySelector('.node-desc').textContent;
        this._confirmCostEl.textContent = perk.cost + ' ★';
        this._confirmEl.classList.remove('hidden');
      });
    });

    this._setupTreeDrag();
  }

  _setupTreeDrag() {
    const body = document.getElementById('skill-tree-body');
    let dragging = false;
    let startX, startY, scrollLeft, scrollTop;

    body.addEventListener('mousedown', (e) => {
      if (e.target.closest('.skill-node')) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      scrollLeft = body.scrollLeft;
      scrollTop = body.scrollTop;
      body.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      body.scrollLeft = scrollLeft - (e.clientX - startX);
      body.scrollTop = scrollTop - (e.clientY - startY);
    });

    window.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      body.style.cursor = '';
    });
  }

  setupWelcome() {
    const modal = document.getElementById('welcome-modal');
    if (!modal) return;
    if (this.state.dronesOwned > 0) {
      modal.classList.add('hidden');
      return;
    }
    document.getElementById('welcome-go').addEventListener('click', () => {
      modal.classList.add('hidden');
      this.buyR1Btn.click();
    });
    const loadFileInput = document.getElementById('load-file-input');
    document.getElementById('welcome-load').addEventListener('click', () => {
      loadFileInput.click();
    });
    loadFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (this.state.importSave(reader.result.trim())) {
          modal.classList.add('hidden');
          this.showToast('Save loaded!');
          this.updateDisplay();
        } else {
          this.showToast('Invalid save file');
        }
      };
      reader.readAsText(file);
    });
  }

  setupSaveLoad() {
    const menuBtn = document.getElementById('game-menu-btn');
    const menu = document.getElementById('game-menu');
    const saveBtn = document.getElementById('btn-save');
    const loadBtn = document.getElementById('btn-load');
    const loadInput = document.getElementById('load-file-game');
    if (!menuBtn || !menu) return;

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target !== menuBtn) {
        menu.classList.add('hidden');
      }
    });

    saveBtn.addEventListener('click', () => {
      const data = this.state.exportSave();
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'skydle-hq.skydle';
      a.click();
      URL.revokeObjectURL(url);
      menu.classList.add('hidden');
      this.showToast('Game saved!');
    });

    loadBtn.addEventListener('click', () => {
      loadInput.click();
    });

    loadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (this.state.importSave(reader.result.trim())) {
          this.showToast('Save loaded!');
          this.updateDisplay();
        } else {
          this.showToast('Invalid save file');
        }
        loadInput.value = '';
      };
      reader.readAsText(file);
      menu.classList.add('hidden');
    });
  }

  setupPowerupMenu() {
    this._powerupBadge = document.getElementById('badge-powerup');
    this._powerupCount = document.getElementById('powerup-count');
    this._powerupMenu = document.getElementById('powerup-menu');
    this._powerupItems = document.getElementById('powerup-menu-items');
    this._powerupEmpty = document.getElementById('powerup-menu-empty');

    this._powerupBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      this._powerupMenu.classList.toggle('hidden');
      if (!this._powerupMenu.classList.contains('hidden')) {
        this.updatePowerupMenu();
      }
    });

    document.getElementById('powerup-menu-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this._powerupMenu.classList.add('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!this._powerupBadge.contains(e.target) && !this._powerupMenu.contains(e.target)) {
        this._powerupMenu.classList.add('hidden');
      }
    });
  }

  updatePowerupMenu() {
    const catCfg = CONFIG.cats;
    const DEFS = {};
    for (const [, cat] of Object.entries(catCfg)) {
      const p = cat.powerup;
      DEFS[p.id] = { icon: p.icon, label: p.label, desc: p.desc, value: p.value };
    }

    const entries = Object.entries(this.state.powerups).filter(([, qty]) => qty > 0);
    const totalCount = entries.reduce((sum, [, qty]) => sum + qty, 0);

    this._powerupCount.textContent = totalCount;
    this._powerupBadge.classList.toggle('has-items', totalCount > 0);

    if (entries.length === 0) {
      this._powerupItems.innerHTML = '';
      this._powerupEmpty.style.display = '';
      return;
    }

    this._powerupEmpty.style.display = 'none';
    this._powerupItems.innerHTML = '';

    for (const [id, qty] of entries) {
      const def = DEFS[id] || { icon: '❓', label: id, desc: '', value: 0 };
      const div = document.createElement('div');
      div.className = 'powerup-item';
      div.innerHTML = `
        <div class="powerup-item-icon">${def.icon}</div>
        <div class="powerup-item-info">
          <div class="powerup-item-name">${def.label}</div>
          <div class="powerup-item-desc">${def.desc}</div>
          <div class="powerup-item-qty">×${qty}</div>
        </div>
        <button class="powerup-use-btn" data-powerup="${id}">Use</button>`;
      this._powerupItems.appendChild(div);
    }

    this._powerupItems.querySelectorAll('.powerup-use-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.powerup;
        const def = DEFS[pid];
        if (def && this.state.usePowerup(pid)) {
          this.state.addFlowers(def.value);
          this.showToast(`+${def.value.toLocaleString()} 🌸 from ${def.label}!`);
          this.updatePowerupMenu();
        }
      });
    });
  }

  _drawTreeLines() {
    const svg = this.skillTreeLines;
    const body = document.getElementById('skill-tree-body');
    const rect = body.getBoundingClientRect();
    const w = body.scrollWidth;
    const h = body.scrollHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.width = w + 'px';
    svg.style.height = h + 'px';
    svg.innerHTML = '';

    const scrollX = body.scrollLeft;
    const scrollY = body.scrollTop;
    const branches = SKILL_TREE.branches;

    for (const [fromId, toId] of branches) {
      const fromEl = document.querySelector(`.skill-node[data-skill="${fromId}"] .node-ring`);
      const toEl = document.querySelector(`.skill-node[data-skill="${toId}"] .node-ring`);
      if (!fromEl || !toEl) continue;

      const fr = fromEl.getBoundingClientRect();
      const tr = toEl.getBoundingClientRect();
      const x1 = fr.left + fr.width / 2 - rect.left + scrollX;
      const y1 = fr.top + fr.height / 2 - rect.top + scrollY;
      const x2 = tr.left + tr.width / 2 - rect.left + scrollX;
      const y2 = tr.top + tr.height / 2 - rect.top + scrollY;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);

      const fromOwned = this.state.hasPerk(fromId);
      const toOwned = this.state.hasPerk(toId);
      if (fromOwned && toOwned) line.classList.add('active');

      svg.appendChild(line);
    }
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
    const typeName = drone.isS2 ? 'S2' : 'R1';
    const label = drone.isUltimate ? `✨ Ultimate ${typeName} #${num}` : `${typeName} #${num}`;
    this.dronePopupTitle.textContent = label;

    this._updateDronePopupStatus(drone);

    let upgradesHtml = '';

    const isS2 = drone.isS2;
    const ultPriceKey = isS2 ? 's2-ultimate' : 'r1-ultimate';
    const ultName = isS2 ? 'Ultimate S2' : 'Ultimate R1';
    const ultHarvests = isS2 ? S2UPG.ultimate.harvestsPerSortie : UPG.ultimate.harvestsPerSortie;
    const ultDesc = `+50% speed · ${ultHarvests} flowers per run · Rainbow Holo`;

    if (drone.isUltimate) {
      upgradesHtml += `<div class="popup-upgrade">
        <div class="item-icon" style="font-size:18px;width:32px;height:32px;">🌈</div>
        <div class="popup-upgrade-info">
          <div class="popup-upgrade-name">${ultName}</div>
          <div class="popup-upgrade-desc">${ultDesc}</div>
        </div>
        <span class="popup-upgrade-done">✓ Active</span>
      </div>`;
    } else {
      const ultCost = this.state.prices[ultPriceKey];
      const canAfford = this.state.canAfford(ultPriceKey);
      upgradesHtml += `<div class="popup-upgrade">
        <div class="item-icon" style="font-size:18px;width:32px;height:32px;">🌈</div>
        <div class="popup-upgrade-info">
          <div class="popup-upgrade-name">${ultName}</div>
          <div class="popup-upgrade-desc">${ultDesc} mode</div>
        </div>
      </div>
      <button class="buy-btn popup-buy-ultimate popup-buy-row${canAfford ? '' : ' cannot-afford'}">${ultCost.toLocaleString()} 🌸</button>`;
    }

    this.dronePopupUpgrades.innerHTML = upgradesHtml;
  }

  _updateDronePopupStatus(drone) {
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
    const valStr = drone.totalValueHarvested >= 1000 ? (drone.totalValueHarvested / 1000).toFixed(1) + 'k' : drone.totalValueHarvested;
    this.dronePopupStatus.innerHTML = `${stateLabels[drone.state] || drone.state}<br>${spd} spd · ${ht}s harvest · ${cd}s cd<br>🌸 ${drone.totalHarvested} harvested · ${valStr} value`;
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
      drone.homeX,
      1.5,
      drone.homeZ
    );

    const screenPos = worldPos.clone().project(this.camera);
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();

    const x = (screenPos.x * 0.5 + 0.5) * rect.width + rect.left;
    const y = (-screenPos.y * 0.5 + 0.5) * rect.height + rect.top;

    const popupH = this.dronePopup.offsetHeight;
    const flipped = y - popupH - 12 < 0;

    this.dronePopup.style.left = x + 'px';
    this.dronePopup.classList.toggle('flipped', flipped);
    if (flipped) {
      this.dronePopup.style.top = (y + 40) + 'px';
    } else {
      this.dronePopup.style.top = y + 'px';
    }
  }

  onPlacementChange(active) {
    this.placementBanner.classList.toggle('hidden', !active);
    document.body.classList.toggle('placement-mode', active);
    if (active) this.closeDronePopup();
  }

  _setBtnState(btn, costId, isMaxed, label) {
    if (isMaxed) {
      btn.textContent = label || 'MAX';
    } else if (!btn.querySelector('.cost')) {
      btn.innerHTML = `<span class="cost" id="${costId}"></span>`;
    }
  }

  updateDisplay() {
    this.flowerCountEl.textContent = Math.floor(this.state.flowers).toLocaleString();

    const totalPowerups = Object.values(this.state.powerups).reduce((s, q) => s + q, 0);
    this._powerupCount.textContent = totalPowerups;
    this._powerupBadge.classList.toggle('hidden', !this.state.hasPerk('felix'));
    this._powerupBadge.classList.toggle('has-items', totalPowerups > 0);

    // Buy R1 button
    this.costEl.textContent = this.state.prices['r1-drone'].toLocaleString() + ' 🌸';
    this.buyR1Btn.classList.toggle('cannot-afford', !this.state.canAfford('r1-drone'));

    if (this.state.hasPerk('s2Drone')) {
      this.buyS2Btn.classList.remove('hidden');
      this.s2CostEl.textContent = this.state.prices['s2-drone'].toLocaleString() + ' 🌸';
      this.buyS2Btn.classList.toggle('cannot-afford', !this.state.canAfford('s2-drone'));
    } else {
      this.buyS2Btn.classList.add('hidden');
    }

    // Global drone upgrades
    const hasDock = this.state.dockLevel >= 1;
    this.dockLevelEl.textContent = hasDock ? `Installed — ${UPG.dock.cooldown}s cooldown` : 'Not installed';
    const dockBtn = document.getElementById('buy-global-dock');
    this._setBtnState(dockBtn, 'global-dock-cost', hasDock, '✓ Owned');
    if (hasDock) {
      dockBtn.classList.add('cannot-afford');
    } else {
      const costEl = dockBtn.querySelector('.cost');
      if (costEl) costEl.textContent = this.state.prices['r1-dock'].toLocaleString() + ' 🌸';
      dockBtn.classList.toggle('cannot-afford', !this.state.canAfford('r1-dock'));
    }

    // Dock Skill Generator — always visible, greyed out if dock not owned
    this.dockSkillGenItem.classList.remove('hidden');
    const genBtn = document.getElementById('buy-dock-skill-gen');
    this._setBtnState(genBtn, 'dock-skill-gen-cost', this.state.dockSkillGen, '✓ Active');
    if (this.state.dockSkillGen) {
      const rate = this.state.getDockSkillXpPerSecond();
      this.dockSkillGenLevelEl.textContent = `Active — ★ ${rate}/s (${this.state.dronesOwned} drones)`;
      genBtn.classList.add('cannot-afford');
    } else if (!hasDock) {
      this.dockSkillGenLevelEl.textContent = 'Requires Drone Dock';
      const costEl = genBtn.querySelector('.cost');
      if (costEl) costEl.textContent = this.state.prices['dock-skill-gen'].toLocaleString() + ' 🌸';
      genBtn.classList.add('cannot-afford');
    } else {
      this.dockSkillGenLevelEl.textContent = 'Not installed';
      const costEl = genBtn.querySelector('.cost');
      if (costEl) costEl.textContent = this.state.prices['dock-skill-gen'].toLocaleString() + ' 🌸';
      genBtn.classList.toggle('cannot-afford', !this.state.canAfford('dock-skill-gen'));
    }

    const spdLvl = this.state.droneSpeedLevel;
    const spdMax = UPG.propeller.prices.length;
    const maxSpd = spdLvl >= spdMax;
    const spdNow = spdLvl === 0 ? R1.baseSpeed : UPG.propeller.speeds[spdLvl - 1];
    const spdNext = spdLvl < spdMax ? UPG.propeller.speeds[spdLvl] : spdNow;
    const spdPct = spdLvl > 0 ? Math.round(((spdNow / R1.baseSpeed) - 1) * 100) : 0;
    const spdTier = UPG.propeller.tiers?.[spdLvl - 1] || '';
    if (maxSpd) {
      this.globalSpeedLevelEl.textContent = `${spdLvl}/${spdMax} — MAX (${spdTier}) — ${spdNow} speed (+${spdPct}%)`;
    } else if (spdLvl === 0) {
      this.globalSpeedLevelEl.textContent = `0/${spdMax} — ${spdNow} → ${spdNext} speed`;
    } else {
      this.globalSpeedLevelEl.textContent = `${spdLvl}/${spdMax} (${spdTier}) — ${spdNow} → ${spdNext} speed (+${spdPct}%)`;
    }
    const spdBtn = document.getElementById('buy-global-speed');
    this._setBtnState(spdBtn, 'global-speed-cost', maxSpd);
    spdBtn.classList.toggle('cannot-afford', !this.state.canAfford('drone-speed') || maxSpd);
    if (!maxSpd) { const c = spdBtn.querySelector('.cost'); if (c) c.textContent = this.state.prices['drone-speed'].toLocaleString() + ' 🌸'; }

    const hvLvl = this.state.droneHarvestLevel;
    const hvMax = UPG.harvester.prices.length;
    const hvNow = hvLvl === 0 ? R1.baseHarvestTime : UPG.harvester.times[hvLvl - 1];
    const hvNext = hvLvl < hvMax ? UPG.harvester.times[hvLvl] : hvNow;
    const hvPct = hvLvl > 0 ? Math.round((1 - hvNow / R1.baseHarvestTime) * 100) : 0;
    const hvTier = UPG.harvester.tiers?.[hvLvl - 1] || '';
    const maxHv = hvLvl >= hvMax;
    if (maxHv) {
      this.globalHarvestLevelEl.textContent = `${hvLvl}/${hvMax} — MAX (${hvTier}) — ${hvNow}s harvest (-${hvPct}%)`;
    } else if (hvLvl === 0) {
      this.globalHarvestLevelEl.textContent = `0/${hvMax} — ${hvNow}s → ${hvNext}s harvest`;
    } else {
      this.globalHarvestLevelEl.textContent = `${hvLvl}/${hvMax} (${hvTier}) — ${hvNow}s → ${hvNext}s harvest (-${hvPct}%)`;
    }
    const hvBtn = document.getElementById('buy-global-harvest');
    this._setBtnState(hvBtn, 'global-harvest-cost', maxHv);
    hvBtn.classList.toggle('cannot-afford', !this.state.canAfford('drone-harvest') || maxHv);
    if (!maxHv) { const c = hvBtn.querySelector('.cost'); if (c) c.textContent = this.state.prices['drone-harvest'].toLocaleString() + ' 🌸'; }

    // S2 upgrades — visible only with s2Drone perk
    const hasS2Perk = this.state.hasPerk('s2Drone');
    const s2Divider = document.getElementById('s2-upgrades-divider');
    const s2SpeedItem = document.getElementById('s2-speed-item');
    const s2HarvestItem = document.getElementById('s2-harvest-item');
    if (hasS2Perk) {
      s2Divider.classList.remove('hidden');
      s2SpeedItem.classList.remove('hidden');
      s2HarvestItem.classList.remove('hidden');

      const s2sLvl = this.state.s2SpeedLevel;
      const s2sMaxLvl = S2UPG.propeller.prices.length;
      const s2sMax = s2sLvl >= s2sMaxLvl;
      const s2BaseSpd = R1.baseSpeed * S2.baseSpeedMultiplier;
      const s2sNow = s2sLvl === 0 ? s2BaseSpd : S2UPG.propeller.speeds[s2sLvl - 1];
      const s2sNext = s2sLvl < s2sMaxLvl ? S2UPG.propeller.speeds[s2sLvl] : s2sNow;
      const s2sPct = s2sLvl > 0 ? Math.round(((s2sNow / s2BaseSpd) - 1) * 100) : 0;
      const s2sTier = S2UPG.propeller.tiers?.[s2sLvl - 1] || '';
      const s2SpeedLevelEl = document.getElementById('s2-speed-level');
      if (s2sMax) {
        s2SpeedLevelEl.textContent = `${s2sLvl}/${s2sMaxLvl} — MAX (${s2sTier}) — ${s2sNow} speed (+${s2sPct}%)`;
      } else if (s2sLvl === 0) {
        s2SpeedLevelEl.textContent = `0/${s2sMaxLvl} — ${s2sNow} → ${s2sNext} speed`;
      } else {
        s2SpeedLevelEl.textContent = `${s2sLvl}/${s2sMaxLvl} (${s2sTier}) — ${s2sNow} → ${s2sNext} speed (+${s2sPct}%)`;
      }
      const s2SpdBtn = document.getElementById('buy-s2-speed');
      this._setBtnState(s2SpdBtn, 's2-speed-cost', s2sMax);
      s2SpdBtn.classList.toggle('cannot-afford', !this.state.canAfford('s2-speed') || s2sMax);
      if (!s2sMax) { const c = s2SpdBtn.querySelector('.cost'); if (c) c.textContent = this.state.prices['s2-speed'].toLocaleString() + ' 🌸'; }

      const s2hLvl = this.state.s2HarvestLevel;
      const s2hMaxLvl = S2UPG.harvester.prices.length;
      const s2BaseHt = R1.baseHarvestTime / S2.baseHarvestDivisor;
      const s2hNow = s2hLvl === 0 ? s2BaseHt : S2UPG.harvester.times[s2hLvl - 1];
      const s2hNext = s2hLvl < s2hMaxLvl ? S2UPG.harvester.times[s2hLvl] : s2hNow;
      const s2hPct = s2hLvl > 0 ? Math.round((1 - s2hNow / s2BaseHt) * 100) : 0;
      const s2hTier = S2UPG.harvester.tiers?.[s2hLvl - 1] || '';
      const maxS2h = s2hLvl >= s2hMaxLvl;
      const s2HarvestLevelEl = document.getElementById('s2-harvest-level');
      if (maxS2h) {
        s2HarvestLevelEl.textContent = `${s2hLvl}/${s2hMaxLvl} — MAX (${s2hTier}) — ${s2hNow}s harvest (-${s2hPct}%)`;
      } else if (s2hLvl === 0) {
        s2HarvestLevelEl.textContent = `0/${s2hMaxLvl} — ${s2hNow}s → ${s2hNext}s harvest`;
      } else {
        s2HarvestLevelEl.textContent = `${s2hLvl}/${s2hMaxLvl} (${s2hTier}) — ${s2hNow}s → ${s2hNext}s harvest (-${s2hPct}%)`;
      }
      const s2HvBtn = document.getElementById('buy-s2-harvest');
      this._setBtnState(s2HvBtn, 's2-harvest-cost', maxS2h);
      s2HvBtn.classList.toggle('cannot-afford', !this.state.canAfford('s2-harvest') || maxS2h);
      if (!maxS2h) { const c = s2HvBtn.querySelector('.cost'); if (c) c.textContent = this.state.prices['s2-harvest'].toLocaleString() + ' 🌸'; }
    } else {
      s2Divider.classList.add('hidden');
      s2SpeedItem.classList.add('hidden');
      s2HarvestItem.classList.add('hidden');
    }

    const FLCFG = CONFIG.collectibles.flowers;
    const interval = this.state.getSpawnInterval();
    const spawnMax = this.state.getSpawnSpeedMaxLevel();
    const maxSpawn = this.state.spawnSpeedLevel >= spawnMax;
    if (maxSpawn) {
      this.spawnLevelEl.textContent = `${this.state.spawnSpeedLevel}/${spawnMax} — MAX`;
    } else {
      const intervalNext = FLCFG.spawnUpgrade.intervals[this.state.spawnSpeedLevel];
      this.spawnLevelEl.textContent = `${this.state.spawnSpeedLevel}/${spawnMax} — ${interval.toFixed(1)}s → ${intervalNext}s interval`;
    }
    const spawnBtn = document.getElementById('buy-spawn-speed');
    this._setBtnState(spawnBtn, 'spawn-speed-cost', maxSpawn);
    spawnBtn.classList.toggle('cannot-afford', !this.state.canAfford('spawn-speed') || maxSpawn);
    if (!maxSpawn) { const c = spawnBtn.querySelector('.cost'); if (c) c.textContent = this.state.prices['spawn-speed'].toLocaleString() + ' 🌸'; }

    // Batch spawn upgrade
    const batchExpected = this.state.getSpawnBatchExpected();
    const batchMax = this.state.getSpawnBatchMaxLevel();
    const maxBatch = this.state.spawnBatchLevel >= batchMax;
    const batchLvl = this.state.spawnBatchLevel;
    const bu = FLCFG.batchUpgrade;
    if (maxBatch) {
      this.batchLevelEl.textContent = `${batchLvl}/${batchMax} — MAX`;
    } else {
      const batchNow = batchLvl === 0 ? '1' : `~${batchExpected}`;
      const batchNextStr = `~${bu.expected[batchLvl]}`;
      this.batchLevelEl.textContent = `${batchLvl}/${batchMax} — ${batchNow} → ${batchNextStr} per cycle`;
    }
    const batchBtn = document.getElementById('buy-spawn-batch');
    this._setBtnState(batchBtn, 'spawn-batch-cost', maxBatch);
    batchBtn.classList.toggle('cannot-afford', !this.state.canAfford('spawn-batch') || maxBatch);
    if (!maxBatch) { const c = batchBtn.querySelector('.cost'); if (c) c.textContent = this.state.prices['spawn-batch'].toLocaleString() + ' 🌸'; }

    // Flower value upgrade
    const flowerVal = this.state.getFlowerBaseValue();
    const valueMax = this.state.getFlowerValueMaxLevel();
    const maxValue = this.state.flowerValueLevel >= valueMax;
    if (maxValue) {
      this.valueLevelEl.textContent = `${this.state.flowerValueLevel}/${valueMax} — MAX`;
    } else {
      const flowerValNext = FLCFG.valueUpgrade.values[this.state.flowerValueLevel];
      this.valueLevelEl.textContent = `${this.state.flowerValueLevel}/${valueMax} — ${flowerVal} → ${flowerValNext} per flower`;
    }
    const valueBtn = document.getElementById('buy-flower-value');
    this._setBtnState(valueBtn, 'flower-value-cost', maxValue);
    valueBtn.classList.toggle('cannot-afford', !this.state.canAfford('flower-value') || maxValue);
    if (!maxValue) { const c = valueBtn.querySelector('.cost'); if (c) c.textContent = this.state.prices['flower-value'].toLocaleString() + ' 🌸'; }

    // Multiplier upgrade
    const flowerMul = this.state.getFlowerMultiplier();
    const multiMax = this.state.getFlowerMultiplierMaxLevel();
    const maxMulti = this.state.flowerMultiplierLevel >= multiMax;
    if (maxMulti) {
      this.multiLevelEl.textContent = `${this.state.flowerMultiplierLevel}/${multiMax} — MAX`;
    } else {
      const flowerMulNext = FLCFG.multiplierUpgrade.multipliers[this.state.flowerMultiplierLevel];
      this.multiLevelEl.textContent = `${this.state.flowerMultiplierLevel}/${multiMax} — ${flowerMul}x → ${flowerMulNext}x`;
    }
    const multiBtn = document.getElementById('buy-flower-multi');
    this._setBtnState(multiBtn, 'flower-multi-cost', maxMulti);
    multiBtn.classList.toggle('cannot-afford', !this.state.canAfford('flower-multi') || maxMulti);
    if (!maxMulti) { const c = multiBtn.querySelector('.cost'); if (c) c.textContent = this.state.prices['flower-multi'].toLocaleString() + ' 🌸'; }

    // Mega flower upgrade
    const chance = Math.round(this.state.getMegaFlowerChance() * 100);
    const megaMax = this.state.getMegaMaxLevel();
    const maxMega = this.state.megaFlowerLevel >= megaMax;
    const megaVal = this.state.getMegaFlowerValue();
    if (maxMega) {
      this.megaLevelEl.textContent = `${this.state.megaFlowerLevel}/${megaMax} — MAX (${chance}%, ${megaVal}x)`;
    } else {
      const megaPerkBonus = this.state.hasPerk('megaChance') ? 20 : 0;
      const chanceNext = Math.round(FLCFG.megaUpgrade.chances[this.state.megaFlowerLevel] * 100) + megaPerkBonus;
      this.megaLevelEl.textContent = `${this.state.megaFlowerLevel}/${megaMax} — ${chance}% → ${chanceNext}% chance (${megaVal}x value)`;
    }
    const megaBtn = document.getElementById('buy-mega-flower');
    this._setBtnState(megaBtn, 'mega-flower-cost', maxMega);
    megaBtn.classList.toggle('cannot-afford', !this.state.canAfford('mega-flower') || maxMega);
    if (!maxMega) { const c = megaBtn.querySelector('.cost'); if (c) c.textContent = this.state.prices['mega-flower'].toLocaleString() + ' 🌸'; }

    // Mushroom upgrade
    const shroomChance = Math.round(this.state.getMushroomChance() * 100);
    const shroomMax = this.state.getMushroomMaxLevel();
    const maxShroom = this.state.mushroomLevel >= shroomMax;
    const shroomXp = this.state.getMushroomSkillXp();
    if (maxShroom) {
      this.mushroomLevelEl.textContent = `${this.state.mushroomLevel}/${shroomMax} — MAX (${shroomChance}%, ★${shroomXp})`;
    } else {
      const shroomChanceNext = Math.round(FLCFG.mushroomUpgrade.chances[this.state.mushroomLevel] * 100);
      this.mushroomLevelEl.textContent = `${this.state.mushroomLevel}/${shroomMax} — ${shroomChance}% → ${shroomChanceNext}% chance (★${shroomXp} XP)`;
    }
    const shroomBtn = document.getElementById('buy-mushroom');
    this._setBtnState(shroomBtn, 'mushroom-cost', maxShroom);
    shroomBtn.classList.toggle('cannot-afford', !this.state.canAfford('mushroom') || maxShroom);
    if (!maxShroom) { const c = shroomBtn.querySelector('.cost'); if (c) c.textContent = this.state.prices['mushroom'].toLocaleString() + ' 🌸'; }

    // Capacity upgrade
    const capMax = this.state.getCapacityMaxLevel();
    const maxCap = this.state.capacityLevel >= capMax;
    const capBonus = this.state.getCapacityBonus();
    const baseMax = this.flowerManager ? this.flowerManager.getCounts().max - capBonus : 70;
    if (maxCap) {
      this.capacityLevelEl.textContent = `${this.state.capacityLevel}/${capMax} — MAX (${baseMax + capBonus})`;
    } else {
      const capBonusNext = FLCFG.capacityUpgrade.bonuses[this.state.capacityLevel];
      this.capacityLevelEl.textContent = `${this.state.capacityLevel}/${capMax} — Max: ${baseMax + capBonus} → ${baseMax + capBonusNext}`;
    }
    const capBtn = document.getElementById('buy-flower-capacity');
    this._setBtnState(capBtn, 'flower-capacity-cost', maxCap);
    capBtn.classList.toggle('cannot-afford', !this.state.canAfford('flower-capacity') || maxCap);
    if (!maxCap) { const c = capBtn.querySelector('.cost'); if (c) c.textContent = this.state.prices['flower-capacity'].toLocaleString() + ' 🌸'; }

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
    if (this.state.mushroomLevel > 0) {
      this.badgeMushroom.classList.remove('hidden');
      this.badgeMushroomVal.textContent = this.state.mushroomLevel;
      this.badgeMushroomTip.textContent = `Mushrooms ${this.state.mushroomLevel}/${shroomMax} — ${shroomChance}% chance`;
    }
    const totalDrones = this.state.dronesOwned + this.state.s2DronesOwned;
    if (totalDrones > 0) {
      this.badgeDrones.classList.remove('hidden');
      this.badgeDronesVal.textContent = totalDrones;
      const ultCount = this.droneManager.getDrones().filter((d) => d.isUltimate).length;
      let tip = `${this.state.dronesOwned} R1`;
      if (this.state.s2DronesOwned > 0) tip += `, ${this.state.s2DronesOwned} S2`;
      if (ultCount > 0) tip += `, ${ultCount} ultimate`;
      this.badgeDronesTip.textContent = tip;
    }

    if (this.selectedDroneIdx >= 0) {
      const drones = this.droneManager.getDrones();
      const selDrone = drones[this.selectedDroneIdx];
      const ultPriceKey = selDrone?.isS2 ? 's2-ultimate' : 'r1-ultimate';
      const ultBtn = this.dronePopupUpgrades.querySelector('.popup-buy-ultimate');
      if (ultBtn) {
        ultBtn.classList.toggle('cannot-afford', !this.state.canAfford(ultPriceKey));
      }
    }

    // Skill points
    this.skillPointsCountEl.textContent = this.state.skillPoints;
    const barMax = this.state.getSkillBarMax();
    const pct = Math.min(100, (this.state.skillCurrency / barMax) * 100);
    this.skillBarFillEl.style.width = pct + '%';
    const cur = Math.floor(this.state.skillCurrency).toLocaleString();
    const max = barMax.toLocaleString();
    this.skillBarLabelEl.textContent = cur + ' / ' + max;
    const noFlowers = this.state.flowers < 1;
    this.convertBtn.classList.toggle('no-flowers', noFlowers);
    const xpPreview = Math.floor(this.state.flowers * this.state.getSkillCurrencyPerFlower());
    this.convertBtn.textContent = noFlowers
      ? 'Convert All 🌸 → ★'
      : `Convert All 🌸 → ★ (+${xpPreview.toLocaleString()} XP)`;

    // Skill tree
    this.skillMenuBalance.textContent = this.state.skillPoints + ' SP';
    for (const [id, perk] of Object.entries(this.state.skillPerks)) {
      const el = document.querySelector(`.skill-node[data-skill="${id}"]`);
      if (!el) continue;
      const unlocked = this.state.isPerkUnlocked(id);
      el.classList.toggle('owned', perk.owned);
      el.classList.toggle('locked', !perk.owned && !unlocked);
      el.classList.toggle('cant-afford', !perk.owned && unlocked && this.state.skillPoints < perk.cost);
    }
  }

  update(dt) {
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fpsTimer = 0;
      this.state.computeFlowersPerSecond();
      this.fpsEl.textContent = `(${this.state.flowersPerSecond.toLocaleString()}/s)`;
    }

    const prevSP = this.state.skillPoints;
    this.state.tickPassiveSkillXp(dt);
    if (this.state.skillPoints > prevSP) {
      const gained = this.state.skillPoints - prevSP;
      this.showToast(`★ +${gained} Skill Point${gained > 1 ? 's' : ''}!`);
      this.skillPointsDisplayEl.classList.remove('gained');
      void this.skillPointsDisplayEl.offsetWidth;
      this.skillPointsDisplayEl.classList.add('gained');
      this.updateDisplay();
    }

    // Update skill bar smoothly for passive gen
    if (this.state.dockSkillGen) {
      this.skillPointsCountEl.textContent = this.state.skillPoints;
      const barMax = this.state.getSkillBarMax();
      const pct = Math.min(100, (this.state.skillCurrency / barMax) * 100);
      this.skillBarFillEl.style.width = pct + '%';
      const cur = Math.floor(this.state.skillCurrency).toLocaleString();
      const max = barMax.toLocaleString();
      this.skillBarLabelEl.textContent = cur + ' / ' + max;
    }

    const counts = this.flowerManager.getCounts();
    this.mapFlowerCountEl.textContent = counts.total;
    this.mapFlowerMaxEl.textContent = counts.max;
    this.mapFlowersEl.classList.toggle('at-cap', counts.total >= counts.max);

    if (this.selectedDroneIdx >= 0) {
      this.updatePopupPosition();
      const drones = this.droneManager.getDrones();
      const drone = drones[this.selectedDroneIdx];
      if (drone) this._updateDronePopupStatus(drone);
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

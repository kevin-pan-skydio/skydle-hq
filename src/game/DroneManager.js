import * as THREE from 'three';
import CONFIG from '../config.json';

const R1 = CONFIG.drones.r1;
const UPG = R1.upgrades;

function createR1Drone() {
  const group = new THREE.Group();
  const black = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const darkGray = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
  const propMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const blueLed = new THREE.MeshBasicMaterial({ color: 0x2288ff });

  // Central fuselage — elongated rounded body
  const fuselage = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.16, 1.1),
    black
  );
  fuselage.castShadow = true;
  group.add(fuselage);

  // Fuselage top cap
  const topCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.06, 0.95),
    darkGray
  );
  topCap.position.y = 0.1;
  group.add(topCap);

  // Two rectangular prop guard frames (left and right)
  for (const side of [-1, 1]) {
    const guardGroup = new THREE.Group();
    const cx = side * 0.6;
    const guardW = 0.75;
    const guardD = 1.05;
    const barThick = 0.06;
    const barH = 0.1;

    // Front & back bars
    for (const fz of [-1, 1]) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(guardW, barH, barThick),
        black
      );
      bar.position.set(cx, 0.02, fz * guardD * 0.5);
      bar.castShadow = true;
      group.add(bar);
    }
    // Left & right side bars
    for (const fx of [-1, 1]) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(barThick, barH, guardD),
        black
      );
      bar.position.set(cx + fx * guardW * 0.5, 0.02, 0);
      bar.castShadow = true;
      group.add(bar);
    }

    // Connecting struts from fuselage to guard
    for (const fz of [-0.3, 0.3]) {
      const strut = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.07, 0.08),
        darkGray
      );
      strut.position.set(side * 0.33, 0, fz);
      strut.castShadow = true;
      group.add(strut);
    }

    // Two propeller hubs + blades per guard
    for (const pz of [-0.28, 0.28]) {
      // Hub
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.08, 6),
        darkGray
      );
      hub.position.set(cx, 0.1, pz);
      group.add(hub);

      // Propeller blades (5 per rotor)
      for (let b = 0; b < 5; b++) {
        const angle = (b / 5) * Math.PI * 2;
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.02, 0.05),
          propMat
        );
        blade.position.set(
          cx + Math.cos(angle) * 0.14,
          0.12,
          pz + Math.sin(angle) * 0.14
        );
        blade.rotation.y = -angle;
        blade.userData.propAngle = angle;
        group.add(blade);
      }
    }

    // Blue LED accent on front edge of each guard
    const ledStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.04, 0.04),
      blueLed
    );
    ledStrip.position.set(cx, -0.02, -guardD * 0.5);
    group.add(ledStrip);
  }

  // Front camera gimbal
  const camMount = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.08, 8),
    darkGray
  );
  camMount.position.set(0, -0.06, -0.55);
  group.add(camMount);

  const camLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.04, 8),
    new THREE.MeshLambertMaterial({ color: 0x333344 })
  );
  camLens.position.set(0, -0.06, -0.6);
  camLens.rotation.x = Math.PI / 2;
  group.add(camLens);

  // Camera LED ring
  const camRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.065, 0.012, 6, 12),
    blueLed
  );
  camRing.position.set(0, -0.06, -0.59);
  camRing.rotation.x = Math.PI / 2;
  group.add(camRing);

  // Status LED (used for cooldown pulsing)
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.06, 0.06),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  led.position.set(0, 0.14, -0.35);
  led.userData.isLed = true;
  group.add(led);

  return group;
}

function createDockMesh() {
  const group = new THREE.Group();
  const skyBlue = new THREE.MeshLambertMaterial({ color: 0x3a7bd5 });
  const darkBlue = new THREE.MeshLambertMaterial({ color: 0x2a5a9a });
  const silver = new THREE.MeshLambertMaterial({ color: 0x999999 });

  const platformY = 0.8;

  // Tripod legs built from stacked voxel segments so they're clearly visible
  const legTargets = [
    { x: 0, z: -0.9 },
    { x: 0.78, z: 0.45 },
    { x: -0.78, z: 0.45 },
  ];
  for (const foot of legTargets) {
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, platformY / steps + 0.02, 0.14),
        silver
      );
      seg.position.set(
        foot.x * t,
        platformY - t * platformY + (platformY / steps) / 2,
        foot.z * t
      );
      seg.castShadow = true;
      group.add(seg);
    }
    // Foot pad
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.06, 0.2),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    pad.position.set(foot.x, 0.03, foot.z);
    group.add(pad);
  }

  // Platform
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.12, 0.75),
    skyBlue
  );
  platform.position.y = platformY;
  platform.castShadow = true;
  platform.receiveShadow = true;
  group.add(platform);

  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.03, 0.85),
    darkBlue
  );
  rim.position.y = platformY + 0.07;
  group.add(rim);

  // April tag
  const tagBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.02, 0.26),
    new THREE.MeshLambertMaterial({ color: 0xeeeeee })
  );
  tagBase.position.set(-0.17, platformY + 0.09, -0.17);
  group.add(tagBase);

  const tagMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const s = 0.05;
  const tagBlocks = [
    [-2,-2],[-1,-2],[0,-2],[1,-2],[2,-2],
    [-2,-1],[2,-1],[-2,0],[0,0],[2,0],
    [-2,1],[2,1],[-2,2],[-1,2],[0,2],[1,2],[2,2],
  ];
  for (const [px, pz] of tagBlocks) {
    const blk = new THREE.Mesh(
      new THREE.BoxGeometry(s, 0.02, s),
      tagMat
    );
    blk.position.set(-0.17 + px * s, platformY + 0.1, -0.17 + pz * s);
    group.add(blk);
  }

  // Charging contacts
  const contacts = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.03, 0.06),
    new THREE.MeshBasicMaterial({ color: 0xccaa00 })
  );
  contacts.position.set(0.1, platformY + 0.08, 0.15);
  group.add(contacts);

  group.castShadow = true;
  return group;
}

function createTimerSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;

  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2, 1, 1);
  sprite.visible = false;
  sprite.userData.canvas = canvas;
  sprite.userData.ctx = ctx;
  sprite.userData.texture = texture;
  return sprite;
}

function updateTimerSprite(sprite, seconds) {
  const { canvas, ctx, texture } = sprite.userData;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.roundRect(4, 2, 56, 28, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(Math.ceil(seconds) + 's', 32, 16);
  texture.needsUpdate = true;
}

function createProgressBarSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;

  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.2, 0.55, 1);
  sprite.visible = false;
  sprite.userData.canvas = canvas;
  sprite.userData.ctx = ctx;
  sprite.userData.texture = texture;
  return sprite;
}

function updateProgressBar(sprite, progress) {
  const { canvas, ctx, texture } = sprite.userData;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.roundRect(2, 2, w - 4, h - 4, 4);
  ctx.fill();

  // Bar background
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.roundRect(5, 4, w - 10, h - 8, 3);
  ctx.fill();

  // Fill (goes from full to empty as progress goes 1 -> 0)
  const barW = Math.max(0, (w - 10) * progress);
  if (barW > 0) {
    const green = Math.floor(180 * progress);
    const red = Math.floor(220 * (1 - progress));
    ctx.fillStyle = `rgb(${red}, ${green + 60}, 80)`;
    ctx.roundRect(5, 4, barW, h - 8, 3);
    ctx.fill();
  }

  texture.needsUpdate = true;
}

export class DroneManager {
  constructor(scene, state, flowerManager, world, floatingText) {
    this.scene = scene;
    this.state = state;
    this.flowerManager = flowerManager;
    this.world = world;
    this.floatingText = floatingText;
    this.drones = [];
    this.reservedIds = new Set();
    this.placementMode = false;
    this._onPlacementChange = [];
  }

  onPlacementChange(fn) {
    this._onPlacementChange.push(fn);
  }

  _notifyPlacement() {
    for (const fn of this._onPlacementChange) fn(this.placementMode);
  }

  enterPlacementMode() {
    this.placementMode = true;
    this._notifyPlacement();
  }

  cancelPlacement() {
    this.placementMode = false;
    this._notifyPlacement();
  }

  placeDrone(dockRow, dockCol) {
    if (!this.placementMode) return false;
    if (this.world.isDockOccupied(dockRow, dockCol)) return false;

    const pos = this.world.getDockWorldPos(dockRow, dockCol);
    if (!pos) return false;

    const mesh = createR1Drone();
    mesh.position.set(pos.x, R1.groundHeight, pos.z);
    this.scene.add(mesh);

    const harvestBar = createProgressBarSprite();
    harvestBar.position.set(0, 1.6, 0);
    mesh.add(harvestBar);

    this.world.markDockOccupied(dockRow, dockCol);

    const droneObj = {
      mesh,
      harvestBar,
      dockMesh: null,
      dockRow,
      dockCol,
      homePos: new THREE.Vector3(pos.x, 0, pos.z),
      targetPos: null,
      targetId: null,
      cooldown: 0,
      harvestTimer: 0,
      harvestCount: 0,
      totalHarvested: 0,
      totalValueHarvested: 0,
      isUltimate: false,
      state: 'idle',
    };

    if (this.state.dockLevel > 0) {
      const dockMesh = createDockMesh();
      dockMesh.position.set(pos.x, 0, pos.z);
      this.scene.add(dockMesh);
      droneObj.dockMesh = dockMesh;
    }

    this.drones.push(droneObj);

    this.placementMode = false;
    this._notifyPlacement();
    return true;
  }

  getDrones() {
    return this.drones;
  }

  getDroneByDockTile(row, col) {
    for (let i = 0; i < this.drones.length; i++) {
      if (this.drones[i].dockRow === row && this.drones[i].dockCol === col) return i;
    }
    return -1;
  }

  getDroneSpeed(drone) {
    const base = R1.baseSpeed + this.state.droneSpeedLevel * UPG.propeller.speedPerLevel;
    return drone.isUltimate ? base * UPG.ultimate.statMultiplier : base;
  }

  getDroneHarvestTime(drone) {
    const base = Math.max(UPG.harvester.minHarvestTime, R1.baseHarvestTime - this.state.droneHarvestLevel * UPG.harvester.reductionPerLevel);
    return drone.isUltimate ? base / UPG.ultimate.statMultiplier : base;
  }

  getDroneCooldown(drone) {
    const base = this.state.dockLevel > 0 ? UPG.dock.cooldown : R1.cooldown;
    return drone.isUltimate ? base / UPG.ultimate.statMultiplier : base;
  }

  applyGlobalDock() {
    for (const drone of this.drones) {
      if (!drone.dockMesh) {
        const dockMesh = createDockMesh();
        dockMesh.position.set(drone.homePos.x, 0, drone.homePos.z);
        this.scene.add(dockMesh);
        drone.dockMesh = dockMesh;
      }
    }
  }

  upgradeDroneUltimate(index) {
    const drone = this.drones[index];
    if (!drone || drone.isUltimate) return false;
    drone.isUltimate = true;
    this._applyRainbowHolo(drone);
    return true;
  }

  _applyRainbowHolo(drone) {
    drone.mesh.traverse((child) => {
      if (child.isMesh && !child.userData.isLed) {
        child.material = child.material.clone();
        child.userData.holoMat = child.material;
        child.userData.holoBaseColor = child.material.color.clone();
      }
    });
  }

  update(dt) {
    for (const drone of this.drones) {
      const isGrounded = drone.state === 'idle' || drone.state === 'cooling';

      for (const child of drone.mesh.children) {
        if (child.userData.propAngle !== undefined) {
          if (!isGrounded) {
            child.userData.propAngle += dt * 25;
          }
          child.rotation.y = child.userData.propAngle;
        }
      }

      // Rainbow holo color cycling for ultimate drones
      if (drone.isUltimate) {
        const t = performance.now() * 0.001;
        const baseHue = (t * 0.3) % 1;
        let idx = 0;
        drone.mesh.traverse((child) => {
          if (child.userData.holoMat) {
            const hue = (baseHue + idx * 0.02) % 1;
            child.userData.holoMat.color.setHSL(hue, 0.7, 0.45);
            idx++;
          }
        });
      }

      if (isGrounded) {
        drone.mesh.position.y = drone.dockMesh ? R1.groundHeight + 0.65 : R1.groundHeight;
      } else {
        drone.mesh.position.y = R1.flightHeight + Math.sin(performance.now() * 0.003 + drone.mesh.id) * 0.15;
      }

      // LED indicator: green = ready, pulsing red = cooling
      const led = drone.mesh.children.find((c) => c.userData.isLed);
      if (led) {
        if (drone.state === 'cooling') {
          const pulse = Math.sin(performance.now() * 0.008) * 0.5 + 0.5;
          led.material.color.setRGB(1, pulse * 0.2, 0);
          led.scale.setScalar(0.8 + pulse * 0.5);
        } else {
          led.material.color.setHex(0x00ff00);
          led.scale.setScalar(1);
        }
      }

      if (drone.state === 'harvesting') {
        drone.harvestBar.visible = true;
        const progress = drone.harvestTimer / this.getDroneHarvestTime(drone);
        updateProgressBar(drone.harvestBar, progress);
      } else {
        drone.harvestBar.visible = false;
      }

      switch (drone.state) {
        case 'idle':
          this.handleIdle(drone);
          break;
        case 'flying':
          this.handleFlying(drone, dt);
          break;
        case 'harvesting':
          this.handleHarvesting(drone, dt);
          break;
        case 'returning':
          this.handleReturning(drone, dt);
          break;
        case 'cooling':
          this.handleCooling(drone, dt);
          break;
      }
    }
  }

  _claim(id) {
    this.reservedIds.add(id);
  }

  _release(drone) {
    if (drone.targetId !== null) {
      this.reservedIds.delete(drone.targetId);
    }
  }

  _findNearestUnreserved(fromPos) {
    const flowers = this.flowerManager.getAvailableFlowers();
    let nearest = null;
    let nearestDist = Infinity;
    for (const f of flowers) {
      if (this.reservedIds.has(f.id)) continue;
      const d = fromPos.distanceTo(f.pos);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = f;
      }
    }
    return nearest;
  }

  handleIdle(drone) {
    const nearest = this._findNearestUnreserved(drone.homePos);
    if (!nearest) return;

    drone.harvestCount = 0;
    drone.targetPos = nearest.pos;
    drone.targetId = nearest.id;
    this._claim(nearest.id);
    drone.state = 'flying';
  }

  handleFlying(drone, dt) {
    if (!this.flowerManager.hasFlower(drone.targetId)) {
      this._release(drone);
      const currentPos = new THREE.Vector3(drone.mesh.position.x, 0, drone.mesh.position.z);
      const next = this._findNearestUnreserved(currentPos);
      if (next) {
        drone.targetPos = next.pos;
        drone.targetId = next.id;
        this._claim(next.id);
      } else {
        drone.targetPos = null;
        drone.targetId = null;
        drone.state = 'returning';
      }
      return;
    }

    const target = new THREE.Vector3(drone.targetPos.x, drone.mesh.position.y, drone.targetPos.z);
    const dir = target.clone().sub(drone.mesh.position);
    const dist = new THREE.Vector2(dir.x, dir.z).length();

    if (dist < 0.5) {
      const isMega = this.flowerManager.isFlowerMega(drone.targetId);
      drone.harvestTimer = this.getDroneHarvestTime(drone) * (isMega ? 2 : 1);
      drone.state = 'harvesting';
    } else {
      dir.y = 0;
      dir.normalize().multiplyScalar(this.getDroneSpeed(drone) * dt);
      drone.mesh.position.x += dir.x;
      drone.mesh.position.z += dir.z;
      drone.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    }
  }

  handleHarvesting(drone, dt) {
    if (!this.flowerManager.hasFlower(drone.targetId)) {
      this._release(drone);
      const currentPos = new THREE.Vector3(drone.mesh.position.x, 0, drone.mesh.position.z);
      const next = this._findNearestUnreserved(currentPos);
      if (next) {
        drone.targetPos = next.pos;
        drone.targetId = next.id;
        this._claim(next.id);
        drone.state = 'flying';
      } else {
        drone.targetPos = null;
        drone.targetId = null;
        drone.state = 'returning';
      }
      return;
    }

    drone.harvestTimer -= dt;
    if (drone.harvestTimer <= 0) {
      const baseVal = this.flowerManager.getFlowerValue(drone.targetId);
      const collected = this.flowerManager.collectById(drone.targetId);
      if (collected) {
        const val = this.state.getCollectionValue(baseVal);
        this.state.addFlowers(val);
        const p = collected.position;
        this.floatingText.spawn(p.x, p.y, p.z, '+' + val);
        drone.totalHarvested++;
        drone.totalValueHarvested += val;
      }
      this._release(drone);
      drone.harvestCount++;

      const maxHarvests = drone.isUltimate ? UPG.ultimate.harvestsPerSortie : 1;
      const currentPos = new THREE.Vector3(drone.mesh.position.x, 0, drone.mesh.position.z);
      if (drone.harvestCount < maxHarvests) {
        const next = this._findNearestUnreserved(currentPos);
        if (next) {
          drone.targetPos = next.pos;
          drone.targetId = next.id;
          this._claim(next.id);
          drone.state = 'flying';
          return;
        }
      }

      drone.targetPos = null;
      drone.targetId = null;
      drone.state = 'returning';
    }
  }

  handleReturning(drone, dt) {
    const home = new THREE.Vector3(drone.homePos.x, drone.mesh.position.y, drone.homePos.z);
    const dir = home.clone().sub(drone.mesh.position);
    const dist = new THREE.Vector2(dir.x, dir.z).length();

    if (dist < 0.5) {
      drone.mesh.position.x = drone.homePos.x;
      drone.mesh.position.z = drone.homePos.z;
      drone.cooldown = this.getDroneCooldown(drone);
      drone.state = 'cooling';
    } else {
      dir.y = 0;
      dir.normalize().multiplyScalar(this.getDroneSpeed(drone) * dt);
      drone.mesh.position.x += dir.x;
      drone.mesh.position.z += dir.z;
      drone.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    }
  }

  handleCooling(drone, dt) {
    drone.cooldown -= dt;
    if (drone.cooldown <= 0) {
      drone.cooldown = 0;
      drone.state = 'idle';
    }
  }
}

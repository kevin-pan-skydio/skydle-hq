import * as THREE from 'three';

const DRONE_HEIGHT = 2.5;
const GROUND_HEIGHT = 0.25;
const BASE_DRONE_SPEED = 3;
const SPEED_PER_LEVEL = 1.5;
const COLLECT_COOLDOWN = 7.0;
const COLLECT_COOLDOWN_DOCK = 3.0;
const BASE_HARVEST_TIME = 3.0;
const HARVEST_REDUCTION_PER_LEVEL = 0.5;
const MIN_HARVEST_TIME = 0.5;

function createR1Drone() {
  const group = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8);
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xdd3333 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  const innerGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 8);
  const innerMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  inner.castShadow = true;
  group.add(inner);

  const armMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
  const propMat = new THREE.MeshLambertMaterial({ color: 0x999999 });

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.45), armMat);
    arm.position.set(Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5);
    arm.rotation.y = -angle;
    arm.castShadow = true;
    group.add(arm);

    const prop = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 0.07), propMat);
    prop.position.set(Math.cos(angle) * 0.7, 0.1, Math.sin(angle) * 0.7);
    prop.userData.propAngle = i * Math.PI / 2;
    group.add(prop);
  }

  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  led.position.set(0, 0.15, 0.45);
  led.userData.isLed = true;
  group.add(led);

  return group;
}

function createDockMesh() {
  const group = new THREE.Group();

  // Base platform
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.15, 1.8),
    new THREE.MeshLambertMaterial({ color: 0x555555 })
  );
  base.position.y = 0.075;
  base.receiveShadow = true;
  group.add(base);

  // Landing pad
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.04, 8),
    new THREE.MeshLambertMaterial({ color: 0x3a7bd5 })
  );
  pad.position.y = 0.17;
  group.add(pad);

  // Corner posts
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.5, 0.12),
        new THREE.MeshLambertMaterial({ color: 0x444444 })
      );
      post.position.set(sx * 0.78, 0.4, sz * 0.78);
      post.castShadow = true;
      group.add(post);
    }
  }

  // Side rails
  for (const sx of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 1.44),
      new THREE.MeshLambertMaterial({ color: 0x666666 })
    );
    rail.position.set(sx * 0.78, 0.62, 0);
    group.add(rail);
  }
  for (const sz of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(1.44, 0.06, 0.06),
      new THREE.MeshLambertMaterial({ color: 0x666666 })
    );
    rail.position.set(0, 0.62, sz * 0.78);
    group.add(rail);
  }

  // Status light
  const light = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x00aaff })
  );
  light.position.set(0.78, 0.7, 0.78);
  group.add(light);

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
    mesh.position.set(pos.x, GROUND_HEIGHT, pos.z);
    this.scene.add(mesh);

    const harvestBar = createProgressBarSprite();
    harvestBar.position.set(0, 1.6, 0);
    mesh.add(harvestBar);

    this.world.markDockOccupied(dockRow, dockCol);

    this.drones.push({
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
      hasDock: false,
      speedLevel: 0,
      harvestLevel: 0,
      state: 'idle',
    });

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
    return BASE_DRONE_SPEED + drone.speedLevel * SPEED_PER_LEVEL;
  }

  getDroneHarvestTime(drone) {
    return Math.max(MIN_HARVEST_TIME, BASE_HARVEST_TIME - drone.harvestLevel * HARVEST_REDUCTION_PER_LEVEL);
  }

  upgradeDroneSpeed(index) {
    const drone = this.drones[index];
    if (!drone) return false;
    drone.speedLevel++;
    return true;
  }

  upgradeDroneHarvest(index) {
    const drone = this.drones[index];
    if (!drone) return false;
    drone.harvestLevel++;
    return true;
  }

  upgradeDroneDock(index) {
    const drone = this.drones[index];
    if (!drone || drone.hasDock) return false;
    drone.hasDock = true;

    // Add dock mesh at the drone's home position
    const dockMesh = createDockMesh();
    dockMesh.position.set(drone.homePos.x, 0, drone.homePos.z);
    this.scene.add(dockMesh);
    drone.dockMesh = dockMesh;

    return true;
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

      if (isGrounded) {
        drone.mesh.position.y = drone.hasDock ? GROUND_HEIGHT + 0.65 : GROUND_HEIGHT;
      } else {
        drone.mesh.position.y = DRONE_HEIGHT + Math.sin(performance.now() * 0.003 + drone.mesh.id) * 0.15;
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
      drone.harvestTimer = this.getDroneHarvestTime(drone);
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
      const val = this.flowerManager.getFlowerValue(drone.targetId);
      const collected = this.flowerManager.collectById(drone.targetId);
      if (collected) {
        this.state.addFlowers(val);
        const p = collected.position;
        this.floatingText.spawn(p.x, p.y, p.z, '+' + val);
      }
      this._release(drone);
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
      drone.cooldown = drone.hasDock ? COLLECT_COOLDOWN_DOCK : COLLECT_COOLDOWN;
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

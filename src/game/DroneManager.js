import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import CONFIG from '../config.json';

const R1 = CONFIG.drones.r1;
const S2 = CONFIG.drones.s2;
const UPG = R1.upgrades;
const S2UPG = S2.upgrades;

const _color = new THREE.Color();
const _holoLight = new THREE.Color(0x44aaff);
const _holoDark = new THREE.Color(0xff8800);

function applyVertexColors(geo, hex) {
  _color.setHex(hex);
  const count = geo.attributes.position.count;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = _color.r;
    arr[i * 3 + 1] = _color.g;
    arr[i * 3 + 2] = _color.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

const _sharedBodyMat = new THREE.MeshLambertMaterial({ vertexColors: true });
const _sharedPropMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
const _sharedPropGeo = new THREE.BoxGeometry(0.22, 0.02, 0.05);

function createR1Drone() {
  const group = new THREE.Group();
  const bodyParts = [];

  // Fuselage
  const fuselage = new THREE.BoxGeometry(0.35, 0.16, 1.1);
  bodyParts.push(applyVertexColors(fuselage, 0x1a1a1a));

  // Fuselage top cap
  const topCap = new THREE.BoxGeometry(0.3, 0.06, 0.95);
  topCap.translate(0, 0.1, 0);
  bodyParts.push(applyVertexColors(topCap, 0x2a2a2a));

  const props = [];

  for (const side of [-1, 1]) {
    const cx = side * 0.6;
    const guardW = 0.75;
    const guardD = 1.05;
    const barThick = 0.06;
    const barH = 0.1;

    for (const fz of [-1, 1]) {
      const bar = new THREE.BoxGeometry(guardW, barH, barThick);
      bar.translate(cx, 0.02, fz * guardD * 0.5);
      bodyParts.push(applyVertexColors(bar, 0x1a6dcc));
    }

    for (const fx of [-1, 1]) {
      const bar = new THREE.BoxGeometry(barThick, barH, guardD);
      bar.translate(cx + fx * guardW * 0.5, 0.02, 0);
      bodyParts.push(applyVertexColors(bar, 0x1a6dcc));
    }

    for (const fz of [-0.3, 0.3]) {
      const strut = new THREE.BoxGeometry(0.28, 0.07, 0.08);
      strut.translate(side * 0.33, 0, fz);
      bodyParts.push(applyVertexColors(strut, 0x2a2a2a));
    }

    for (const pz of [-0.28, 0.28]) {
      const hub = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 6);
      hub.translate(cx, 0.1, pz);
      bodyParts.push(applyVertexColors(hub, 0x2a2a2a));

      for (let b = 0; b < 5; b++) {
        const angle = (b / 5) * Math.PI * 2;
        const blade = new THREE.Mesh(_sharedPropGeo, _sharedPropMat);
        blade.position.set(cx + Math.cos(angle) * 0.14, 0.12, pz + Math.sin(angle) * 0.14);
        blade.rotation.y = -angle;
        blade.userData.propAngle = angle;
        group.add(blade);
        props.push(blade);
      }
    }

    const ledStrip = new THREE.BoxGeometry(0.25, 0.04, 0.04);
    ledStrip.translate(cx, -0.02, -guardD * 0.5);
    bodyParts.push(applyVertexColors(ledStrip, 0x2288ff));
  }

  // Camera gimbal
  const camMount = new THREE.CylinderGeometry(0.07, 0.07, 0.08, 8);
  camMount.translate(0, -0.06, -0.55);
  bodyParts.push(applyVertexColors(camMount, 0x2a2a2a));

  const camLens = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 8);
  camLens.rotateX(Math.PI / 2);
  camLens.translate(0, -0.06, -0.6);
  bodyParts.push(applyVertexColors(camLens, 0x333344));

  const camRing = new THREE.TorusGeometry(0.065, 0.012, 6, 12);
  camRing.rotateX(Math.PI / 2);
  camRing.translate(0, -0.06, -0.59);
  bodyParts.push(applyVertexColors(camRing, 0x2288ff));

  // Merge all static body parts into one mesh
  const bodyGeo = mergeGeometries(bodyParts);
  const bodyMesh = new THREE.Mesh(bodyGeo, _sharedBodyMat);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Status LED — kept separate for color changes
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.06, 0.06),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  led.position.set(0, 0.14, -0.35);
  group.add(led);

  group.userData.props = props;
  group.userData.led = led;
  group.userData.bodyMesh = bodyMesh;

  return group;
}

function createS2Drone() {
  const group = new THREE.Group();
  const bodyParts = [];
  const props = [];

  const DARK = 0x1a1a1e;
  const MID = 0x2a2a2e;
  const BLUE = 0x1a6dff;
  const BLUE_DEEP = 0x0044cc;

  // Central waist — narrow bridge connecting front and back halves
  const waist = new THREE.BoxGeometry(0.22, 0.11, 0.35);
  bodyParts.push(applyVertexColors(waist, DARK));

  // Front body block — wider, houses camera
  const frontBody = new THREE.BoxGeometry(0.5, 0.12, 0.4);
  frontBody.translate(0, 0.01, -0.3);
  bodyParts.push(applyVertexColors(frontBody, DARK));

  const frontTop = new THREE.BoxGeometry(0.4, 0.04, 0.3);
  frontTop.translate(0, 0.08, -0.3);
  bodyParts.push(applyVertexColors(frontTop, MID));

  // Rear body block
  const rearBody = new THREE.BoxGeometry(0.45, 0.12, 0.35);
  rearBody.translate(0, 0.01, 0.3);
  bodyParts.push(applyVertexColors(rearBody, DARK));

  const rearTop = new THREE.BoxGeometry(0.35, 0.04, 0.25);
  rearTop.translate(0, 0.08, 0.3);
  bodyParts.push(applyVertexColors(rearTop, MID));

  // Four swept arms — front arms angle forward, rear arms angle backward (10% shorter)
  const arms = [
    { ex: 0.675, ez: -0.585 }, // front-right
    { ex: -0.675, ez: -0.585 }, // front-left
    { ex: 0.72, ez: 0.63 },     // back-right
    { ex: -0.72, ez: 0.63 },    // back-left
  ];

  for (const arm of arms) {
    const mx = arm.ex * 0.45;
    const mz = arm.ez * 0.45;
    const dx = arm.ex - 0;
    const dz = arm.ez - 0;
    const len = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    // Arm — wide tapered strut
    const strut = new THREE.BoxGeometry(0.18, 0.1, len * 0.92);
    strut.rotateY(angle);
    strut.translate(mx, 0.01, mz);
    bodyParts.push(applyVertexColors(strut, DARK));

    // Blue edge strip along arm underside
    const edgeStrip = new THREE.BoxGeometry(0.22, 0.03, len * 0.85);
    edgeStrip.rotateY(angle);
    edgeStrip.translate(mx, -0.04, mz);
    bodyParts.push(applyVertexColors(edgeStrip, BLUE_DEEP));

    // Motor pod — cylinder at tip
    const pod = new THREE.CylinderGeometry(0.14, 0.16, 0.1, 8);
    pod.translate(arm.ex, 0.06, arm.ez);
    bodyParts.push(applyVertexColors(pod, MID));

    const podCap = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 8);
    podCap.translate(arm.ex, 0.12, arm.ez);
    bodyParts.push(applyVertexColors(podCap, DARK));

    // Propeller blades
    for (let b = 0; b < 5; b++) {
      const ba = (b / 5) * Math.PI * 2;
      const blade = new THREE.Mesh(_sharedPropGeo, _sharedPropMat);
      blade.position.set(arm.ex + Math.cos(ba) * 0.14, 0.15, arm.ez + Math.sin(ba) * 0.14);
      blade.rotation.y = -ba;
      blade.userData.propAngle = ba;
      group.add(blade);
      props.push(blade);
    }
  }

  // Blue accent strips along body sides
  for (const side of [-1, 1]) {
    const sideStrip = new THREE.BoxGeometry(0.03, 0.06, 0.9);
    sideStrip.translate(side * 0.26, -0.02, 0);
    bodyParts.push(applyVertexColors(sideStrip, BLUE));
  }

  // Front fuselage extension — tapers forward to house the gimbal
  const noseMid = new THREE.BoxGeometry(0.42, 0.11, 0.17);
  noseMid.translate(0, 0.01, -0.52);
  bodyParts.push(applyVertexColors(noseMid, DARK));

  const noseTip = new THREE.BoxGeometry(0.32, 0.1, 0.13);
  noseTip.translate(0, 0.0, -0.64);
  bodyParts.push(applyVertexColors(noseTip, DARK));

  const noseEnd = new THREE.BoxGeometry(0.24, 0.09, 0.08);
  noseEnd.translate(0, -0.01, -0.72);
  bodyParts.push(applyVertexColors(noseEnd, MID));

  // Camera lens at the front face
  const camLens = new THREE.CylinderGeometry(0.065, 0.065, 0.05, 8);
  camLens.rotateX(Math.PI / 2);
  camLens.translate(0, -0.01, -0.78);
  bodyParts.push(applyVertexColors(camLens, 0x222233));

  const camRing = new THREE.TorusGeometry(0.075, 0.013, 6, 12);
  camRing.rotateX(Math.PI / 2);
  camRing.translate(0, -0.01, -0.77);
  bodyParts.push(applyVertexColors(camRing, BLUE));

  // Bottom LED glow strip
  const bottomLed = new THREE.BoxGeometry(0.15, 0.02, 0.06);
  bottomLed.translate(0, -0.07, -0.15);
  bodyParts.push(applyVertexColors(bottomLed, 0x00ccff));

  // Merge all static parts
  const bodyGeo = mergeGeometries(bodyParts);
  const bodyMesh = new THREE.Mesh(bodyGeo, _sharedBodyMat);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Status LED
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.05, 0.05),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  led.position.set(0, 0.11, -0.15);
  group.add(led);

  group.userData.props = props;
  group.userData.led = led;
  group.userData.bodyMesh = bodyMesh;

  return group;
}

const _sharedDockMat = new THREE.MeshLambertMaterial({ vertexColors: true });
let _dockGeoCache = null;

function buildDockGeo() {
  if (_dockGeoCache) return _dockGeoCache;
  const parts = [];
  const platformY = 0.8;

  const legTargets = [
    { x: 0, z: -0.9 },
    { x: 0.78, z: 0.45 },
    { x: -0.78, z: 0.45 },
  ];
  for (const foot of legTargets) {
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const seg = new THREE.BoxGeometry(0.14, platformY / steps + 0.02, 0.14);
      seg.translate(foot.x * t, platformY - t * platformY + (platformY / steps) / 2, foot.z * t);
      parts.push(applyVertexColors(seg, 0x999999));
    }
    const pad = new THREE.BoxGeometry(0.2, 0.06, 0.2);
    pad.translate(foot.x, 0.03, foot.z);
    parts.push(applyVertexColors(pad, 0x222222));
  }

  const platform = new THREE.BoxGeometry(0.75, 0.12, 0.75);
  platform.translate(0, platformY, 0);
  parts.push(applyVertexColors(platform, 0x3a7bd5));

  const rim = new THREE.BoxGeometry(0.85, 0.03, 0.85);
  rim.translate(0, platformY + 0.07, 0);
  parts.push(applyVertexColors(rim, 0x2a5a9a));

  const tagBase = new THREE.BoxGeometry(0.26, 0.02, 0.26);
  tagBase.translate(-0.17, platformY + 0.09, -0.17);
  parts.push(applyVertexColors(tagBase, 0xeeeeee));

  const s = 0.05;
  const tagBlocks = [
    [-2,-2],[-1,-2],[0,-2],[1,-2],[2,-2],
    [-2,-1],[2,-1],[-2,0],[0,0],[2,0],
    [-2,1],[2,1],[-2,2],[-1,2],[0,2],[1,2],[2,2],
  ];
  for (const [px, pz] of tagBlocks) {
    const blk = new THREE.BoxGeometry(s, 0.02, s);
    blk.translate(-0.17 + px * s, platformY + 0.1, -0.17 + pz * s);
    parts.push(applyVertexColors(blk, 0x111111));
  }

  const contacts = new THREE.BoxGeometry(0.18, 0.03, 0.06);
  contacts.translate(0.1, platformY + 0.08, 0.15);
  parts.push(applyVertexColors(contacts, 0xccaa00));

  _dockGeoCache = mergeGeometries(parts);
  return _dockGeoCache;
}

function createDockMesh() {
  const mesh = new THREE.Mesh(buildDockGeo(), _sharedDockMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
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
  const quantized = Math.round(progress * 20);
  if (sprite.userData.lastQ === quantized) return;
  sprite.userData.lastQ = quantized;

  const { canvas, ctx, texture } = sprite.userData;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.roundRect(2, 2, w - 4, h - 4, 4);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.roundRect(5, 4, w - 10, h - 8, 3);
  ctx.fill();

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

  resetAll() {
    for (const drone of this.drones) {
      this.scene.remove(drone.mesh);
      if (drone.dockMesh) this.scene.remove(drone.dockMesh);
      if (drone.harvestBar) this.scene.remove(drone.harvestBar);
    }
    this.drones = [];
    this.reservedIds.clear();
    this.placementMode = false;
    this._dockSkillGen = false;
    this._notifyPlacement();
  }

  _notifyPlacement() {
    for (const fn of this._onPlacementChange) fn(this.placementMode);
  }

  enterPlacementMode(isS2 = false) {
    this.placementMode = true;
    this._pendingS2 = isS2;
    this._notifyPlacement();
  }

  cancelPlacement() {
    this.placementMode = false;
    this._pendingS2 = false;
    this._notifyPlacement();
  }

  placeDrone(dockRow, dockCol) {
    if (!this.placementMode) return false;
    if (this.world.isDockOccupied(dockRow, dockCol)) return false;

    const pos = this.world.getDockWorldPos(dockRow, dockCol);
    if (!pos) return false;

    const isS2 = this._pendingS2 || false;
    const mesh = isS2 ? createS2Drone() : createR1Drone();
    mesh.position.set(pos.x, R1.groundHeight, pos.z);
    this.scene.add(mesh);

    const harvestBar = createProgressBarSprite();
    harvestBar.position.set(0, 1.6, 0);
    mesh.add(harvestBar);

    this.world.markDockOccupied(dockRow, dockCol);

    const droneObj = {
      mesh,
      harvestBar,
      led: mesh.userData.led,
      props: mesh.userData.props,
      bodyMesh: mesh.userData.bodyMesh,
      holoMat: null,
      dockMesh: null,
      dockRow,
      dockCol,
      homeX: pos.x,
      homeZ: pos.z,
      targetX: 0,
      targetZ: 0,
      targetId: null,
      cooldown: 0,
      harvestTimer: 0,
      harvestCount: 0,
      totalHarvested: 0,
      totalValueHarvested: 0,
      sortieTimer: 0,
      isUltimate: false,
      isS2,
      state: 'idle',
    };

    if (this.state.dockLevel > 0) {
      const dockMesh = createDockMesh();
      dockMesh.position.set(droneObj.homeX, 0, droneObj.homeZ);
      this.scene.add(dockMesh);
      droneObj.dockMesh = dockMesh;
    }

    this.drones.push(droneObj);

    this.placementMode = false;
    this._pendingS2 = false;
    this._notifyPlacement();
    return true;
  }

  spawnDroneAt(dockRow, dockCol, isS2 = false) {
    if (this.world.isDockOccupied(dockRow, dockCol)) return false;
    const pos = this.world.getDockWorldPos(dockRow, dockCol);
    if (!pos) return false;

    const mesh = isS2 ? createS2Drone() : createR1Drone();
    mesh.position.set(pos.x, R1.groundHeight, pos.z);
    this.scene.add(mesh);

    const harvestBar = createProgressBarSprite();
    harvestBar.position.set(0, 1.6, 0);
    mesh.add(harvestBar);

    this.world.markDockOccupied(dockRow, dockCol);

    const droneObj = {
      mesh,
      harvestBar,
      led: mesh.userData.led,
      props: mesh.userData.props,
      bodyMesh: mesh.userData.bodyMesh,
      holoMat: null,
      dockMesh: null,
      dockRow,
      dockCol,
      homeX: pos.x,
      homeZ: pos.z,
      targetX: 0,
      targetZ: 0,
      targetId: null,
      cooldown: 0,
      harvestTimer: 0,
      harvestCount: 0,
      totalHarvested: 0,
      totalValueHarvested: 0,
      sortieTimer: 0,
      isUltimate: false,
      isS2,
      state: 'idle',
    };

    if (this.state.dockLevel > 0) {
      const dockMesh = createDockMesh();
      dockMesh.position.set(droneObj.homeX, 0, droneObj.homeZ);
      this.scene.add(dockMesh);
      droneObj.dockMesh = dockMesh;
    }

    this.drones.push(droneObj);
    this.state.dronesOwned++;
    this.state._notify();
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
    if (drone.isS2) {
      let base = (R1.baseSpeed * R1.s2Multiplier) + this.state.s2SpeedLevel * S2UPG.propeller.speedPerLevel;
      if (this.state.hasPerk('speedBoost')) base *= 1.5;
      return drone.isUltimate ? base * S2UPG.ultimate.speedMultiplier : base;
    }
    let base = R1.baseSpeed + this.state.droneSpeedLevel * UPG.propeller.speedPerLevel;
    if (this.state.hasPerk('speedBoost')) base *= 1.5;
    return drone.isUltimate ? base * UPG.ultimate.speedMultiplier : base;
  }

  getDroneHarvestTime(drone) {
    if (drone.isS2) {
      return Math.max(S2UPG.harvester.minHarvestTime, (R1.baseHarvestTime / R1.s2Multiplier) - this.state.s2HarvestLevel * S2UPG.harvester.reductionPerLevel);
    }
    return Math.max(UPG.harvester.minHarvestTime, R1.baseHarvestTime - this.state.droneHarvestLevel * UPG.harvester.reductionPerLevel);
  }

  getDroneCooldown(drone) {
    let base = this.state.dockLevel > 0 ? UPG.dock.cooldown : R1.cooldown;
    if (this.state.hasPerk('fastCooldown')) base *= 0.5;
    return base;
  }

  applyGlobalDock() {
    for (const drone of this.drones) {
      if (!drone.dockMesh) {
        const dockMesh = createDockMesh();
        dockMesh.position.set(drone.homeX, 0, drone.homeZ);
        this.scene.add(dockMesh);
        drone.dockMesh = dockMesh;
      }
    }
  }

  applyDockSkillGen() {
    this._dockSkillGen = true;
    for (const drone of this.drones) {
      if (drone.dockMesh) {
        drone.dockMesh.material = new THREE.MeshLambertMaterial({
          color: 0xbb44ff, vertexColors: false,
        });
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
    const holoMat = new THREE.MeshLambertMaterial();
    drone.bodyMesh.material = holoMat;
    drone.holoMat = holoMat;
    const propHoloMat = new THREE.MeshLambertMaterial();
    for (const prop of drone.props) {
      prop.material = propHoloMat;
    }
    drone.propHoloMat = propHoloMat;

    if (drone.dockMesh) {
      const dockHoloMat = new THREE.MeshLambertMaterial({ vertexColors: true });
      drone.dockMesh.material = dockHoloMat;
      drone.dockHoloMat = dockHoloMat;
    }
  }

  update(dt) {
    const now = performance.now();

    for (const drone of this.drones) {
      const isGrounded = drone.state === 'idle' || drone.state === 'cooling';

      if (!isGrounded) {
        for (const blade of drone.props) {
          blade.userData.propAngle += dt * 25;
          blade.rotation.y = blade.userData.propAngle;
        }
      }

      if (drone.holoMat) {
        const t = (Math.sin(now * 0.003) + 1) * 0.5;
        drone.holoMat.color.lerpColors(_holoLight, _holoDark, t);
        if (drone.propHoloMat) drone.propHoloMat.color.lerpColors(_holoLight, _holoDark, t * 0.8);
        if (drone.dockHoloMat && !this._dockSkillGen) drone.dockHoloMat.color.lerpColors(_holoLight, _holoDark, t);
      }

      if (this._dockSkillGen && drone.dockMesh && !drone._dockSkillGenApplied) {
        drone.dockMesh.material = new THREE.MeshLambertMaterial({
          color: 0xbb44ff, vertexColors: false,
        });
        drone._dockSkillGenApplied = true;
      }

      if (isGrounded) {
        drone.mesh.position.y = drone.dockMesh ? R1.groundHeight + 0.65 : R1.groundHeight;
      } else {
        drone.mesh.position.y = R1.flightHeight + Math.sin(now * 0.003 + drone.mesh.id) * 0.15;
      }

      const led = drone.led;
      if (led) {
        if (drone.state === 'cooling') {
          const pulse = Math.sin(now * 0.008) * 0.5 + 0.5;
          led.material.color.setRGB(1, pulse * 0.2, 0);
          led.scale.setScalar(0.8 + pulse * 0.5);
          drone._ledState = 'cool';
        } else if (drone._ledState !== 'green') {
          led.material.color.setHex(0x00ff00);
          led.scale.setScalar(1);
          drone._ledState = 'green';
        }
      }

      if (drone.state === 'harvesting') {
        drone.harvestBar.visible = true;
        const progress = drone.harvestTimer / this.getDroneHarvestTime(drone);
        updateProgressBar(drone.harvestBar, progress);
      } else {
        drone.harvestBar.visible = false;
      }

      if (drone.state === 'flying' || drone.state === 'harvesting') {
        drone.sortieTimer += dt;
        if (drone.sortieTimer >= 30) {
          this._release(drone);
          drone.targetId = null;
          drone.state = 'returning';
        }
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

    if (this.state.hasPerk('autoCollect')) {
      this._autoCollectTimer = (this._autoCollectTimer || 0) + (now - (this._lastAutoCollect || now));
      this._lastAutoCollect = now;
      if (this._autoCollectTimer > 1000) {
        this._autoCollectTimer = 0;
        for (const drone of this.drones) {
          if (!drone.dockMesh) continue;
          const collected = this.flowerManager.collectNearPoint(drone.homeX, drone.homeZ, 2.5);
          for (const c of collected) {
            if (!c) continue;
            if (c.isMushroom) {
              const xp = this.state.getMushroomSkillXp();
              this.state.addSkillXp(xp);
              this.floatingText.spawn(c.x, c.y, c.z, '+★' + xp);
            } else {
              let val = this.state.getCollectionValue(c.value);
              if (this.beehive?.isInRadius(c.x, c.z)) val *= 2;
              this.state.addFlowers(val);
              this.floatingText.spawn(c.x, c.y, c.z, '+' + val);
            }
          }
        }
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

  _findNearestUnreserved(fromX, fromZ) {
    return this.flowerManager.findNearestAvailable(fromX, fromZ, this.reservedIds);
  }

  handleIdle(drone) {
    const nearest = this._findNearestUnreserved(drone.homeX, drone.homeZ);
    if (!nearest) return;

    drone.harvestCount = 0;
    drone.sortieTimer = 0;
    drone.targetX = nearest.x;
    drone.targetZ = nearest.z;
    drone.targetId = nearest.id;
    this._claim(nearest.id);
    drone.state = 'flying';
  }

  handleFlying(drone, dt) {
    if (!this.flowerManager.hasFlower(drone.targetId)) {
      this._release(drone);
      const next = this._findNearestUnreserved(drone.mesh.position.x, drone.mesh.position.z);
      if (next) {
        drone.targetX = next.x;
        drone.targetZ = next.z;
        drone.targetId = next.id;
        this._claim(next.id);
      } else {
        drone.targetId = null;
        drone.state = 'returning';
      }
      return;
    }

    const dx = drone.targetX - drone.mesh.position.x;
    const dz = drone.targetZ - drone.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.5) {
      const isMega = this.flowerManager.isFlowerMega(drone.targetId);
      drone.harvestTimer = this.getDroneHarvestTime(drone) * (isMega ? 2 : 1);
      drone.state = 'harvesting';
    } else {
      const step = this.getDroneSpeed(drone) * dt / dist;
      const mx = dx * step;
      const mz = dz * step;
      drone.mesh.position.x += mx;
      drone.mesh.position.z += mz;
      drone.mesh.rotation.y = Math.atan2(mx, mz) + Math.PI;
    }
  }

  handleHarvesting(drone, dt) {
    if (!this.flowerManager.hasFlower(drone.targetId)) {
      this._release(drone);
      const next = this._findNearestUnreserved(drone.mesh.position.x, drone.mesh.position.z);
      if (next) {
        drone.targetX = next.x;
        drone.targetZ = next.z;
        drone.targetId = next.id;
        this._claim(next.id);
        drone.state = 'flying';
      } else {
        drone.targetId = null;
        drone.state = 'returning';
      }
      return;
    }

    drone.harvestTimer -= dt;
    if (drone.harvestTimer <= 0) {
      const collected = this.flowerManager.collectById(drone.targetId);
      let harvestVal = 0;
      if (collected) {
        if (collected.isMushroom) {
          const xp = this.state.getMushroomSkillXp();
          this.state.addSkillXp(xp);
          this.floatingText.spawn(collected.x, collected.y, collected.z, '+★' + xp);
        } else {
          harvestVal = this.state.getCollectionValue(collected.value);
          if (this.beehive?.isInRadius(collected.x, collected.z)) harvestVal *= 2;
          this.state.addFlowers(harvestVal);
          this.floatingText.spawn(collected.x, collected.y, collected.z, '+' + harvestVal);
        }
        drone.totalHarvested++;
        drone.totalValueHarvested += harvestVal;
        drone.sortieTimer = 0;
      }
      this._release(drone);
      drone.harvestCount++;

      const ultCfg = drone.isS2 ? S2UPG.ultimate : UPG.ultimate;
      const maxHarvests = drone.isUltimate ? ultCfg.harvestsPerSortie : 1;
      if (drone.harvestCount < maxHarvests) {
        const next = this._findNearestUnreserved(drone.mesh.position.x, drone.mesh.position.z);
        if (next) {
          drone.targetX = next.x;
          drone.targetZ = next.z;
          drone.targetId = next.id;
          this._claim(next.id);
          drone.state = 'flying';
          return;
        }
      }

      drone.targetId = null;
      drone.state = 'returning';
    }
  }

  handleReturning(drone, dt) {
    const dx = drone.homeX - drone.mesh.position.x;
    const dz = drone.homeZ - drone.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.5) {
      drone.mesh.position.x = drone.homeX;
      drone.mesh.position.z = drone.homeZ;
      drone.cooldown = this.getDroneCooldown(drone);
      drone.state = 'cooling';
    } else {
      const step = this.getDroneSpeed(drone) * dt / dist;
      const mx = dx * step;
      const mz = dz * step;
      drone.mesh.position.x += mx;
      drone.mesh.position.z += mz;
      drone.mesh.rotation.y = Math.atan2(mx, mz) + Math.PI;
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

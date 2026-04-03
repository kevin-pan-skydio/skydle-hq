import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import CONFIG from '../config.json';

const FLOWER_COLORS = [0xff5cb8, 0xff2d6e, 0xffe940, 0xffa726, 0xea40ff, 0xff3d3d, 0x40e8ff];
const MEGA_COLOR = 0xff00ff;
const MUSHROOM_COLOR = 0x9b30ff;
const F = CONFIG.collectibles.flowers;
const MAX_INSTANCES = 256;

function lookupMax(table, gridSize) {
  return table[gridSize] || table[Object.keys(table).pop()];
}

let nextId = 0;

function applyVertexColors(geo, color) {
  const count = geo.attributes.position.count;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = color.r;
    arr[i * 3 + 1] = color.g;
    arr[i * 3 + 2] = color.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

function buildFlowerTemplate(petalColorHex, isMega) {
  const parts = [];

  if (isMega) {
    // Grand mega flower — tall stem, double petal ring, golden crown
    const stemGeo = new THREE.BoxGeometry(0.18, 0.9, 0.18);
    stemGeo.translate(0, 0.45, 0);
    parts.push(applyVertexColors(stemGeo, new THREE.Color(0x2e7d32)));

    // Leaf accents on stem
    const leafGeo = new THREE.BoxGeometry(0.28, 0.08, 0.12);
    const leafL = leafGeo.clone(); leafL.translate(-0.12, 0.35, 0);
    const leafR = leafGeo.clone(); leafR.translate(0.12, 0.55, 0);
    parts.push(applyVertexColors(leafL, new THREE.Color(0x43a047)));
    parts.push(applyVertexColors(leafR, new THREE.Color(0x43a047)));

    const pc = new THREE.Color(petalColorHex);
    const pcBright = new THREE.Color(petalColorHex).lerp(new THREE.Color(0xffffff), 0.3);

    // Outer petal ring — 8 large petals
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const pg = new THREE.BoxGeometry(0.32, 0.14, 0.32);
      pg.translate(Math.cos(angle) * 0.34, 0.96, Math.sin(angle) * 0.34);
      parts.push(applyVertexColors(pg, pc));
    }

    // Inner petal ring — 6 slightly smaller, rotated, brighter
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + 0.26;
      const pg = new THREE.BoxGeometry(0.24, 0.16, 0.24);
      pg.translate(Math.cos(angle) * 0.2, 1.04, Math.sin(angle) * 0.2);
      parts.push(applyVertexColors(pg, pcBright));
    }

    // Large golden center
    const centerGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    centerGeo.translate(0, 1.04, 0);
    parts.push(applyVertexColors(centerGeo, new THREE.Color(0xffd700)));

    // Golden crown spike on top
    const crownGeo = new THREE.BoxGeometry(0.14, 0.2, 0.14);
    crownGeo.translate(0, 1.28, 0);
    parts.push(applyVertexColors(crownGeo, new THREE.Color(0xffea00)));

    // Small sparkle tips
    for (const [sx, sz] of [[0.1, 0.1], [-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1]]) {
      const sg = new THREE.BoxGeometry(0.06, 0.1, 0.06);
      sg.translate(sx, 1.22, sz);
      parts.push(applyVertexColors(sg, new THREE.Color(0xfff176)));
    }
  } else {
    // Regular flower — slightly plumper petals, vivid colors
    const stemGeo = new THREE.BoxGeometry(0.1, 0.5, 0.1);
    stemGeo.translate(0, 0.25, 0);
    parts.push(applyVertexColors(stemGeo, new THREE.Color(0x43a047)));

    const pc = new THREE.Color(petalColorHex);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const pg = new THREE.BoxGeometry(0.24, 0.14, 0.24);
      pg.translate(Math.cos(angle) * 0.19, 0.6, Math.sin(angle) * 0.19);
      parts.push(applyVertexColors(pg, pc));
    }

    const centerGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    centerGeo.translate(0, 0.62, 0);
    parts.push(applyVertexColors(centerGeo, new THREE.Color(0xffee58)));
  }

  return mergeGeometries(parts);
}

function createCollectMesh(petalColorHex, isMega) {
  const group = new THREE.Group();

  if (isMega) {
    const stem = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.9, 0.18),
      new THREE.MeshLambertMaterial({ color: 0x2e7d32 })
    );
    stem.position.y = 0.45;
    group.add(stem);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.14, 0.32),
        new THREE.MeshLambertMaterial({ color: petalColorHex })
      );
      petal.position.set(Math.cos(angle) * 0.34, 0.96, Math.sin(angle) * 0.34);
      group.add(petal);
    }

    const center = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.28, 0.28),
      new THREE.MeshLambertMaterial({ color: 0xffd700 })
    );
    center.position.y = 1.04;
    group.add(center);

    const crown = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.2, 0.14),
      new THREE.MeshLambertMaterial({ color: 0xffea00 })
    );
    crown.position.y = 1.28;
    group.add(crown);
  } else {
    const stem = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.5, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x43a047 })
    );
    stem.position.y = 0.25;
    group.add(stem);

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.14, 0.24),
        new THREE.MeshLambertMaterial({ color: petalColorHex })
      );
      petal.position.set(Math.cos(angle) * 0.19, 0.6, Math.sin(angle) * 0.19);
      group.add(petal);
    }

    const center = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.18, 0.18),
      new THREE.MeshLambertMaterial({ color: 0xffee58 })
    );
    center.position.y = 0.62;
    group.add(center);
  }

  return group;
}

function buildMushroomTemplate() {
  const s = 1.6;
  const parts = [];

  // Stipe (stem) — pale purple, thick
  const stipeGeo = new THREE.BoxGeometry(0.16 * s, 0.5 * s, 0.16 * s);
  stipeGeo.translate(0, 0.25 * s, 0);
  parts.push(applyVertexColors(stipeGeo, new THREE.Color(0xd4b0e8)));

  // Cap — wide dome, stacked layers
  const capColor = new THREE.Color(MUSHROOM_COLOR);
  const cap1 = new THREE.BoxGeometry(0.6 * s, 0.14 * s, 0.6 * s);
  cap1.translate(0, 0.55 * s, 0);
  parts.push(applyVertexColors(cap1, capColor));

  const cap2 = new THREE.BoxGeometry(0.48 * s, 0.12 * s, 0.48 * s);
  cap2.translate(0, 0.66 * s, 0);
  parts.push(applyVertexColors(cap2, new THREE.Color(0xb040e0)));

  const cap3 = new THREE.BoxGeometry(0.32 * s, 0.1 * s, 0.32 * s);
  cap3.translate(0, 0.75 * s, 0);
  parts.push(applyVertexColors(cap3, new THREE.Color(0xd060ff)));

  const capTip = new THREE.BoxGeometry(0.16 * s, 0.08 * s, 0.16 * s);
  capTip.translate(0, 0.82 * s, 0);
  parts.push(applyVertexColors(capTip, new THREE.Color(0xe888ff)));

  // Psychedelic spots on cap
  const spotColor = new THREE.Color(0xeea0ff);
  const spotBright = new THREE.Color(0xffccff);
  for (const [sx, sz, c] of [
    [0.18, 0.18, spotColor], [-0.22, 0.12, spotBright],
    [0.08, -0.22, spotColor], [-0.15, -0.15, spotBright],
    [0.25, -0.05, spotColor], [-0.05, 0.25, spotBright],
  ]) {
    const spot = new THREE.BoxGeometry(0.1 * s, 0.04 * s, 0.1 * s);
    spot.translate(sx * s, 0.58 * s, sz * s);
    parts.push(applyVertexColors(spot, c));
  }

  return mergeGeometries(parts);
}

function createMushroomCollectMesh() {
  const s = 1.6;
  const shiny = (c) => new THREE.MeshPhongMaterial({ color: c, shininess: 80, specular: 0x886688 });
  const group = new THREE.Group();

  const stipe = new THREE.Mesh(
    new THREE.BoxGeometry(0.16 * s, 0.5 * s, 0.16 * s),
    shiny(0xd4b0e8)
  );
  stipe.position.y = 0.25 * s;
  group.add(stipe);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(0.6 * s, 0.14 * s, 0.6 * s),
    shiny(MUSHROOM_COLOR)
  );
  cap.position.y = 0.55 * s;
  group.add(cap);

  const cap2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.48 * s, 0.12 * s, 0.48 * s),
    shiny(0xb040e0)
  );
  cap2.position.y = 0.66 * s;
  group.add(cap2);

  const cap3 = new THREE.Mesh(
    new THREE.BoxGeometry(0.32 * s, 0.1 * s, 0.32 * s),
    shiny(0xd060ff)
  );
  cap3.position.y = 0.75 * s;
  group.add(cap3);

  return group;
}

const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _clickPoint = new THREE.Vector3();

export class FlowerManager {
  constructor(scene, state, world) {
    this.scene = scene;
    this.state = state;
    this.world = world;
    this.flowers = [];
    this.flowerById = new Map();
    this.spawnTimer = 0;
    this.collectAnimations = [];

    const gs = this.world.gridSize;
    const step = 2 + 0.15;
    const offset = ((gs - 1) * step) / 2;
    this.spawnHalf = offset + 0.8;

    this._dummy = new THREE.Object3D();
    this._instanceMat = new THREE.MeshLambertMaterial({ vertexColors: true });

    this._variants = new Map();
    for (const c of FLOWER_COLORS) {
      this._addVariant(c, false);
    }
    this._addVariant(MEGA_COLOR, true);

    // Mushroom variant — shiny phong material
    const shroomGeo = buildMushroomTemplate();
    const shroomMat = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 80, specular: 0x886688 });
    const shroomMesh = new THREE.InstancedMesh(shroomGeo, shroomMat, MAX_INSTANCES);
    shroomMesh.count = 0;
    shroomMesh.castShadow = true;
    shroomMesh.frustumCulled = false;
    this.scene.add(shroomMesh);
    this._variants.set('mushroom', { mesh: shroomMesh, colorHex: MUSHROOM_COLOR, isMega: false });

    this._megaGlowGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.06, 10);
    this._megaGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffd700, transparent: true, opacity: 0.35,
    });
    this._megaGlowMesh = new THREE.InstancedMesh(this._megaGlowGeo, this._megaGlowMat, MAX_INSTANCES);
    this._megaGlowMesh.count = 0;
    this._megaGlowMesh.frustumCulled = false;
    this.scene.add(this._megaGlowMesh);

    // Second glow ring for mega — outer halo
    this._megaHaloGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.04, 10);
    this._megaHaloMat = new THREE.MeshBasicMaterial({
      color: 0xffea00, transparent: true, opacity: 0.15,
    });
    this._megaHaloMesh = new THREE.InstancedMesh(this._megaHaloGeo, this._megaHaloMat, MAX_INSTANCES);
    this._megaHaloMesh.count = 0;
    this._megaHaloMesh.frustumCulled = false;
    this.scene.add(this._megaHaloMesh);

    // Mushroom glow
    this._shroomGlowGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.05, 10);
    this._shroomGlowMat = new THREE.MeshBasicMaterial({
      color: 0xb040e0, transparent: true, opacity: 0.25,
    });
    this._shroomGlowMesh = new THREE.InstancedMesh(this._shroomGlowGeo, this._shroomGlowMat, MAX_INSTANCES);
    this._shroomGlowMesh.count = 0;
    this._shroomGlowMesh.frustumCulled = false;
    this.scene.add(this._shroomGlowMesh);

    for (let i = 0; i < F.initialSpawnCount; i++) {
      this.spawnFlower();
    }
  }

  _addVariant(colorHex, isMega) {
    const key = isMega ? 'mega' : colorHex;
    const geo = buildFlowerTemplate(colorHex, isMega);
    const mesh = new THREE.InstancedMesh(geo, this._instanceMat, MAX_INSTANCES);
    mesh.count = 0;
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    this._variants.set(key, { mesh, colorHex, isMega });
  }

  _variantKey(flower) {
    if (flower.isMushroom) return 'mushroom';
    return flower.isMega ? 'mega' : flower.colorHex;
  }

  _randomPos() {
    const h = this.spawnHalf;
    return {
      x: (Math.random() - 0.5) * h * 2,
      z: (Math.random() - 0.5) * h * 2,
    };
  }

  spawnFlower() {
    const gs = this.world.gridSize;
    const max = lookupMax(F.maxByGridSize, gs) + this.state.getCapacityBonus();
    if (this.flowers.length >= max) return;

    const megaChance = this.state.getMegaFlowerChance();
    const isMega = Math.random() < megaChance;
    const shroomChance = this.state.getMushroomChance();
    const isMushroom = !isMega && Math.random() < shroomChance;

    const p = this._randomPos();
    let colorHex;
    if (isMushroom) colorHex = MUSHROOM_COLOR;
    else if (isMega) colorHex = MEGA_COLOR;
    else colorHex = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];

    const id = nextId++;
    let value;
    if (isMega) value = this.state.getMegaFlowerValue();
    else if (isMushroom) value = this.state.getMushroomFlowerValue();
    else value = 1;

    const flower = {
      id,
      x: p.x,
      z: p.z,
      colorHex,
      value,
      isMega,
      isMushroom,
      age: 0,
      spawning: true,
    };
    this.flowers.push(flower);
    this.flowerById.set(id, flower);
  }

  _rebuildInstances() {
    const counts = new Map();
    for (const [key] of this._variants) counts.set(key, 0);
    let megaGlowCount = 0;
    let megaHaloCount = 0;
    let shroomGlowCount = 0;

    const now = performance.now();

    for (const f of this.flowers) {
      const key = this._variantKey(f);
      const variant = this._variants.get(key);
      if (!variant) continue;

      const idx = counts.get(key);
      counts.set(key, idx + 1);

      let scale = 1;
      if (f.spawning) {
        const t = Math.min(f.age / 0.35, 1);
        scale = 1 - Math.pow(1 - t, 3);
      }

      const bob = f.isMega
        ? Math.sin(now * 0.004 + f.id * 1.7) * 0.1
        : Math.sin(now * 0.003 + f.id * 1.7) * 0.04;
      const y = 0.01 + bob;

      this._dummy.position.set(f.x, y, f.z);
      this._dummy.scale.setScalar(scale);
      const spin = f.isMega || f.isMushroom;
      this._dummy.rotation.set(0, spin ? now * 0.001 + f.id : 0, 0);
      this._dummy.updateMatrix();
      variant.mesh.setMatrixAt(idx, this._dummy.matrix);

      if (f.isMega) {
        // Inner glow — pulses
        const glowPulse = 0.9 + Math.sin(now * 0.005 + f.id * 3.1) * 0.15;
        this._dummy.position.set(f.x, 0.02, f.z);
        this._dummy.scale.setScalar(scale * glowPulse);
        this._dummy.rotation.set(0, 0, 0);
        this._dummy.updateMatrix();
        this._megaGlowMesh.setMatrixAt(megaGlowCount++, this._dummy.matrix);

        // Outer halo — slower counter-pulse
        const haloPulse = 0.85 + Math.sin(now * 0.003 + f.id * 2.0 + 1.5) * 0.2;
        this._dummy.scale.setScalar(scale * haloPulse);
        this._dummy.updateMatrix();
        this._megaHaloMesh.setMatrixAt(megaHaloCount++, this._dummy.matrix);
      }

      if (f.isMushroom) {
        const glowPulse = 0.25 + Math.sin(now * 0.004 + f.id * 2.3) * 0.1;
        this._dummy.position.set(f.x, 0.02, f.z);
        this._dummy.scale.setScalar(scale * (0.9 + glowPulse * 0.4));
        this._dummy.rotation.set(0, 0, 0);
        this._dummy.updateMatrix();
        this._shroomGlowMesh.setMatrixAt(shroomGlowCount++, this._dummy.matrix);
      }
    }

    for (const [key, variant] of this._variants) {
      const c = counts.get(key);
      variant.mesh.count = c;
      if (c > 0) variant.mesh.instanceMatrix.needsUpdate = true;
    }
    this._megaGlowMesh.count = megaGlowCount;
    if (megaGlowCount > 0) this._megaGlowMesh.instanceMatrix.needsUpdate = true;
    this._megaHaloMesh.count = megaHaloCount;
    if (megaHaloCount > 0) this._megaHaloMesh.instanceMatrix.needsUpdate = true;
    this._shroomGlowMesh.count = shroomGlowCount;
    if (shroomGlowCount > 0) this._shroomGlowMesh.instanceMatrix.needsUpdate = true;
  }

  update(dt) {
    this.spawnTimer += dt;
    const interval = this.state.getSpawnInterval();
    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      const batch = this.state.getSpawnBatchCount();
      for (let i = 0; i < batch; i++) {
        this.spawnFlower();
      }
    }

    for (const flower of this.flowers) {
      if (flower.spawning) {
        flower.age += dt;
        if (flower.age >= 0.35) flower.spawning = false;
      }
    }

    this._rebuildInstances();

    let i = this.collectAnimations.length;
    while (i-- > 0) {
      const anim = this.collectAnimations[i];
      anim.time += dt;
      const t = anim.time / 0.3;

      if (t >= 1) {
        this.scene.remove(anim.mesh);
        const last = this.collectAnimations.length - 1;
        if (i !== last) this.collectAnimations[i] = this.collectAnimations[last];
        this.collectAnimations.pop();
      } else {
        anim.mesh.position.y += dt * 4;
        anim.mesh.scale.setScalar(1 - t);
      }
    }
  }

  checkClick(raycaster) {
    raycaster.ray.intersectPlane(_groundPlane, _clickPoint);
    if (!_clickPoint) return null;

    let closestIdx = -1;
    let closestDist = Infinity;

    for (let i = this.flowers.length - 1; i >= 0; i--) {
      const f = this.flowers[i];
      if (f.spawning) continue;
      const dx = _clickPoint.x - f.x;
      const dz = _clickPoint.z - f.z;
      const dist = dx * dx + dz * dz;
      const hr = (f.isMega || f.isMushroom) ? 0.94 * 1.6 : 0.94;
      if (dist < hr * hr && dist < closestDist) {
        closestIdx = i;
        closestDist = dist;
      }
    }

    if (closestIdx >= 0) {
      return this._collectByIndex(closestIdx);
    }
    return null;
  }

  collectById(id) {
    const flower = this.flowerById.get(id);
    if (!flower) return null;
    const idx = this.flowers.indexOf(flower);
    if (idx === -1) return null;
    return this._collectByIndex(idx);
  }

  _collectByIndex(index) {
    const flower = this.flowers[index];
    const last = this.flowers.length - 1;
    if (index !== last) this.flowers[index] = this.flowers[last];
    this.flowers.pop();
    this.flowerById.delete(flower.id);

    const mesh = flower.isMushroom
      ? createMushroomCollectMesh()
      : createCollectMesh(flower.colorHex, flower.isMega);
    mesh.position.set(flower.x, 0.01, flower.z);
    this.scene.add(mesh);
    this.collectAnimations.push({ mesh, time: 0 });

    return { value: flower.value, x: flower.x, y: 0.01, z: flower.z, isMushroom: !!flower.isMushroom };
  }

  hasFlower(id) {
    const f = this.flowerById.get(id);
    return f !== undefined && !f.spawning;
  }

  getFlowerValue(id) {
    const f = this.flowerById.get(id);
    return f ? f.value : 1;
  }

  isFlowerMega(id) {
    const f = this.flowerById.get(id);
    return f ? f.isMega : false;
  }

  isFlowerMushroom(id) {
    const f = this.flowerById.get(id);
    return f ? !!f.isMushroom : false;
  }

  getCounts() {
    const gs = this.world.gridSize;
    return {
      total: this.flowers.length,
      max: lookupMax(F.maxByGridSize, gs) + this.state.getCapacityBonus(),
    };
  }

  findNearestAvailable(fromX, fromZ, excludeIds) {
    let bestId = -1;
    let bestDist = Infinity;
    let bestX = 0;
    let bestZ = 0;
    for (let i = 0; i < this.flowers.length; i++) {
      const f = this.flowers[i];
      if (f.spawning || excludeIds.has(f.id)) continue;
      const dx = fromX - f.x;
      const dz = fromZ - f.z;
      const d = dx * dx + dz * dz;
      if (d < bestDist) {
        bestDist = d;
        bestId = f.id;
        bestX = f.x;
        bestZ = f.z;
      }
    }
    if (bestId === -1) return null;
    return { id: bestId, x: bestX, z: bestZ };
  }
}

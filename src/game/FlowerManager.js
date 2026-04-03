import * as THREE from 'three';
import CONFIG from '../config.json';

const FLOWER_COLORS = [0xff69b4, 0xff4081, 0xffeb3b, 0xff9800, 0xe040fb, 0xf44336, 0xffffff];
const MEGA_COLOR = 0xff00ff;
const F = CONFIG.collectibles.flowers;

function lookupMax(table, gridSize) {
  return table[gridSize] || table[Object.keys(table).pop()];
}

let nextId = 0;

function createFlower(color, isMega) {
  const group = new THREE.Group();
  const s = isMega ? 1.6 : 1.0;

  const stem = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.5 * s, 0.1 * s),
    new THREE.MeshLambertMaterial({ color: 0x4caf50 })
  );
  stem.position.y = 0.25 * s;
  group.add(stem);

  const petalCount = isMega ? 8 : 5;
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petal = new THREE.Mesh(
      new THREE.BoxGeometry(0.22 * s, 0.12 * s, 0.22 * s),
      new THREE.MeshLambertMaterial({ color })
    );
    petal.position.set(
      Math.cos(angle) * 0.18 * s,
      0.6 * s,
      Math.sin(angle) * 0.18 * s
    );
    group.add(petal);
  }

  const center = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.18 * s, 0.18 * s),
    new THREE.MeshLambertMaterial({ color: isMega ? 0xffd700 : 0xffeb3b })
  );
  center.position.y = 0.62 * s;
  group.add(center);

  const hitRadius = 0.94 * s;
  const hitSphere = new THREE.Mesh(
    new THREE.SphereGeometry(hitRadius, 6, 6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitSphere.position.y = 0.4 * s;
  group.add(hitSphere);

  if (isMega) {
    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.05, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.3 })
    );
    glow.position.y = 0.02;
    group.add(glow);
  }

  group.castShadow = true;
  return group;
}

export class FlowerManager {
  constructor(scene, state, world) {
    this.scene = scene;
    this.state = state;
    this.world = world;
    this.flowers = [];
    this.spawnTimer = 0;
    this.collectAnimations = [];

    const gs = this.world.gridSize;
    const step = 2 + 0.15;
    const offset = ((gs - 1) * step) / 2;
    this.spawnHalf = offset + 0.8;

    for (let i = 0; i < F.initialSpawnCount; i++) {
      this.spawnFlower();
    }
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
    const max = lookupMax(F.maxByGridSize, gs);
    if (this.flowers.length >= max) return;

    const megaChance = this.state.getMegaFlowerChance();
    const isMega = Math.random() < megaChance;

    const p = this._randomPos();

    const color = isMega
      ? MEGA_COLOR
      : FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
    const mesh = createFlower(color, isMega);
    mesh.position.set(p.x, 0.01, p.z);
    mesh.scale.set(0, 0, 0);

    const id = nextId++;
    const value = isMega ? this.state.getMegaFlowerValue() : 1;

    this.scene.add(mesh);
    this.flowers.push({
      id,
      mesh,
      value,
      isMega,
      age: 0,
      spawning: true,
    });
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
        const t = Math.min(flower.age / 0.35, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        flower.mesh.scale.setScalar(ease);
        if (t >= 1) flower.spawning = false;
      }

      const bob = Math.sin(performance.now() * 0.003 + flower.id * 1.7) * 0.04;
      flower.mesh.position.y = 0.01 + bob;

      if (flower.isMega) {
        flower.mesh.rotation.y += dt * 0.5;
      }
    }

    for (let i = this.collectAnimations.length - 1; i >= 0; i--) {
      const anim = this.collectAnimations[i];
      anim.time += dt;
      const t = anim.time / 0.3;

      if (t >= 1) {
        this.scene.remove(anim.mesh);
        this.collectAnimations.splice(i, 1);
      } else {
        anim.mesh.position.y += dt * 4;
        anim.mesh.scale.setScalar(1 - t);
      }
    }
  }

  checkClick(raycaster) {
    for (let i = this.flowers.length - 1; i >= 0; i--) {
      const flower = this.flowers[i];
      if (flower.spawning) continue;
      const hits = raycaster.intersectObjects(flower.mesh.children, true);
      if (hits.length > 0) {
        return this._collectByIndex(i);
      }
    }
    return null;
  }

  collectById(id) {
    const idx = this.flowers.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    return this._collectByIndex(idx);
  }

  _collectByIndex(index) {
    const flower = this.flowers[index];
    this.flowers.splice(index, 1);

    flower.mesh.userData.flowerValue = flower.value;

    this.collectAnimations.push({
      mesh: flower.mesh,
      time: 0,
    });

    return flower.mesh;
  }

  hasFlower(id) {
    return this.flowers.some((f) => f.id === id && !f.spawning);
  }

  getFlowerValue(id) {
    const f = this.flowers.find((fl) => fl.id === id);
    return f ? f.value : 1;
  }

  getCounts() {
    const gs = this.world.gridSize;
    return {
      total: this.flowers.length,
      max: lookupMax(F.maxByGridSize, gs),
    };
  }

  getAvailableFlowers() {
    return this.flowers
      .filter((f) => !f.spawning)
      .map((f) => ({
        id: f.id,
        pos: new THREE.Vector3(f.mesh.position.x, 0, f.mesh.position.z),
      }));
  }
}

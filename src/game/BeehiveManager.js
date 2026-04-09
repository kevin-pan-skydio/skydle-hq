import * as THREE from 'three';

const SPAWN_INTERVAL = 30;
const ACTIVE_DURATION = 20;
const EFFECT_RADIUS = 4.5;
const HIVE_COLOR = 0xffaa00;
const RING_COLOR = 0xffdd44;

export class BeehiveManager {
  constructor(scene, state, world) {
    this.scene = scene;
    this.state = state;
    this.world = world;
    this.active = false;
    this.timer = SPAWN_INTERVAL;
    this.activeTimer = 0;
    this.hiveX = 0;
    this.hiveZ = 0;

    this.hiveMesh = this._buildHiveMesh();
    this.hiveMesh.visible = false;
    this.scene.add(this.hiveMesh);

    this.ringMesh = this._buildRingMesh();
    this.ringMesh.visible = false;
    this.scene.add(this.ringMesh);

    this._pulseDir = 1;
  }

  _buildHiveMesh() {
    const group = new THREE.Group();
    const wood = new THREE.MeshLambertMaterial({ color: 0x6b3a1f });

    // Stand — four legs + platform
    const legGeo = new THREE.BoxGeometry(0.08, 0.45, 0.08);
    for (const [lx, lz] of [[0.22, 0.22], [-0.22, 0.22], [0.22, -0.22], [-0.22, -0.22]]) {
      const leg = new THREE.Mesh(legGeo, wood);
      leg.position.set(lx, 0.225, lz);
      group.add(leg);
    }
    const platformGeo = new THREE.BoxGeometry(0.65, 0.06, 0.65);
    const platform = new THREE.Mesh(platformGeo, wood);
    platform.position.y = 0.48;
    group.add(platform);

    // Hive body — stacked layers for a classic beehive look
    const hiveColor = new THREE.MeshLambertMaterial({ color: HIVE_COLOR });
    const hiveLight = new THREE.MeshLambertMaterial({ color: 0xffcc33 });
    const layers = [
      { r: 0.42, h: 0.18, y: 0.60, mat: hiveColor },
      { r: 0.48, h: 0.18, y: 0.78, mat: hiveLight },
      { r: 0.45, h: 0.18, y: 0.96, mat: hiveColor },
      { r: 0.38, h: 0.16, y: 1.12, mat: hiveLight },
      { r: 0.28, h: 0.14, y: 1.25, mat: hiveColor },
    ];
    for (const l of layers) {
      const geo = new THREE.CylinderGeometry(l.r * 0.85, l.r, l.h, 8);
      const mesh = new THREE.Mesh(geo, l.mat);
      mesh.position.y = l.y;
      group.add(mesh);
    }

    // Roof cap
    const roofGeo = new THREE.ConeGeometry(0.22, 0.18, 8);
    const roof = new THREE.Mesh(roofGeo, wood);
    roof.position.y = 1.41;
    group.add(roof);

    // Entrance hole
    const holeGeo = new THREE.CircleGeometry(0.1, 8);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x1a1000 });
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.position.set(0, 0.72, 0.49);
    group.add(hole);

    return group;
  }

  _buildRingMesh() {
    const discGeo = new THREE.CircleGeometry(EFFECT_RADIUS, 48);
    const discMat = new THREE.MeshBasicMaterial({
      color: RING_COLOR,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.01;
    this._ringMat = discMat;
    return disc;
  }

  _pickRandomPos() {
    const gs = this.world.gridSize;
    const step = 2 + 0.15;
    const half = ((gs - 1) * step) / 2;
    const margin = EFFECT_RADIUS + 0.5;
    return {
      x: (Math.random() - 0.5) * Math.max(0, (half - margin) * 2),
      z: (Math.random() - 0.5) * Math.max(0, (half - margin) * 2),
    };
  }

  _spawn() {
    const pos = this._pickRandomPos();
    this.hiveX = pos.x;
    this.hiveZ = pos.z;
    this.active = true;
    this.activeTimer = ACTIVE_DURATION;

    this.hiveMesh.position.set(this.hiveX, 0, this.hiveZ);
    this.hiveMesh.visible = true;

    this.ringMesh.position.set(this.hiveX, 0.01, this.hiveZ);
    this.ringMesh.visible = true;
    this._ringMat.opacity = 0.18;
  }

  _despawn() {
    this.active = false;
    this.hiveMesh.visible = false;
    this.ringMesh.visible = false;
  }

  isInRadius(x, z) {
    if (!this.active) return false;
    const dx = x - this.hiveX;
    const dz = z - this.hiveZ;
    return dx * dx + dz * dz <= EFFECT_RADIUS * EFFECT_RADIUS;
  }

  update(dt) {
    if (!this.state.hasPerk('beehive')) return;

    if (this.active) {
      this.activeTimer -= dt;
      if (this.activeTimer <= 0) {
        this._despawn();
        this.timer = SPAWN_INTERVAL;
        return;
      }

      this.hiveMesh.position.y = 0 + Math.sin(performance.now() * 0.003) * 0.05;

      const fadeStart = 3;
      if (this.activeTimer < fadeStart) {
        const t = this.activeTimer / fadeStart;
        this._ringMat.opacity = 0.18 * t;
      } else {
        const pulse = 0.14 + 0.06 * Math.sin(performance.now() * 0.004);
        this._ringMat.opacity = pulse;
      }
    } else {
      this.timer -= dt;
      if (this.timer <= 0) {
        this._spawn();
      }
    }
  }

  reset() {
    this._despawn();
    this.timer = SPAWN_INTERVAL;
  }
}

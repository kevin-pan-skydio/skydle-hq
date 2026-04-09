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

    const bodyGeo = new THREE.CylinderGeometry(0.45, 0.55, 0.7, 6);
    const bodyMat = new THREE.MeshLambertMaterial({ color: HIVE_COLOR });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    group.add(body);

    const roofGeo = new THREE.ConeGeometry(0.6, 0.35, 6);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 1.075;
    group.add(roof);

    const holeGeo = new THREE.CircleGeometry(0.12, 8);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x222200 });
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.position.set(0, 0.5, 0.46);
    hole.rotation.y = 0;
    group.add(hole);

    group.castShadow = true;
    return group;
  }

  _buildRingMesh() {
    const ringGeo = new THREE.RingGeometry(EFFECT_RADIUS - 0.08, EFFECT_RADIUS, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: RING_COLOR,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.22;
    this._ringMat = ringMat;
    return ring;
  }

  _pickRandomTile() {
    const tiles = this.world.tiles.filter(t => t.type === 'unoccupied');
    if (tiles.length === 0) return null;
    return tiles[Math.floor(Math.random() * tiles.length)];
  }

  _spawn() {
    const tile = this._pickRandomTile();
    if (!tile) return;
    this.hiveX = tile.x;
    this.hiveZ = tile.z;
    this.active = true;
    this.activeTimer = ACTIVE_DURATION;

    this.hiveMesh.position.set(this.hiveX, 0, this.hiveZ);
    this.hiveMesh.visible = true;

    this.ringMesh.position.set(this.hiveX, 0.22, this.hiveZ);
    this.ringMesh.visible = true;
    this._ringMat.opacity = 0.25;
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
        this._ringMat.opacity = 0.25 * t;
      } else {
        const pulse = 0.2 + 0.1 * Math.sin(performance.now() * 0.004);
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

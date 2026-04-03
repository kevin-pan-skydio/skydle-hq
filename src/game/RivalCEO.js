import * as THREE from 'three';

const INITIAL_DELAY = 300; // 5 minutes before first CEO event
const SPAWN_INTERVAL = 120;
const ACTIVE_DURATION = 20;
const WALK_SPEED = 3.0;
const SLOWDOWN = 0.5;
const PAUSE_MIN = 1.5;
const PAUSE_MAX = 3.5;
const WALK_MIN = 2.5;
const WALK_MAX = 5.0;

function buildCEOModel() {
  const group = new THREE.Group();
  const mat = (c) => new THREE.MeshLambertMaterial({ color: c });

  const legGeo = new THREE.BoxGeometry(0.25, 0.5, 0.25);
  const leftLeg = new THREE.Mesh(legGeo, mat(0x2244aa));
  leftLeg.position.set(-0.14, 0.25, 0);
  const rightLeg = new THREE.Mesh(legGeo, mat(0x2244aa));
  rightLeg.position.set(0.14, 0.25, 0);
  group.add(leftLeg, rightLeg);

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.55, 0.35),
    mat(0x222222)
  );
  torso.position.y = 0.78;
  group.add(torso);

  const logo = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.08, 0.01),
    mat(0x00cccc)
  );
  logo.position.set(0, 0.85, 0.18);
  group.add(logo);

  const armGeo = new THREE.BoxGeometry(0.18, 0.5, 0.22);
  const leftArm = new THREE.Mesh(armGeo, mat(0x222222));
  leftArm.position.set(-0.37, 0.75, 0);
  const rightArm = new THREE.Mesh(armGeo, mat(0x222222));
  rightArm.position.set(0.37, 0.75, 0);
  group.add(leftArm, rightArm);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.35, 0.35),
    mat(0xe8b88a)
  );
  head.position.y = 1.25;
  group.add(head);

  const hairColor = mat(0x5c3317);
  const hairPositions = [
    [0, 1.52, 0], [0.12, 1.55, 0.05], [-0.12, 1.55, 0.05],
    [0.08, 1.6, -0.04], [-0.08, 1.6, -0.04], [0, 1.63, 0.02],
    [0.15, 1.5, -0.08], [-0.15, 1.5, -0.08], [0.06, 1.67, 0],
    [-0.06, 1.67, 0], [0, 1.7, -0.02], [0.1, 1.64, 0.06],
    [-0.1, 1.64, 0.06], [0.18, 1.48, 0], [-0.18, 1.48, 0],
    [0, 1.55, -0.12], [0.12, 1.58, -0.1], [-0.12, 1.58, -0.1],
    [0.05, 1.72, 0], [-0.05, 1.72, 0],
  ];
  const hairGeo = new THREE.BoxGeometry(0.14, 0.12, 0.14);
  for (const [hx, hy, hz] of hairPositions) {
    const h = new THREE.Mesh(hairGeo, hairColor);
    h.position.set(hx, hy, hz);
    group.add(h);
  }

  const shoeGeo = new THREE.BoxGeometry(0.26, 0.1, 0.35);
  const leftShoe = new THREE.Mesh(shoeGeo, mat(0x111111));
  leftShoe.position.set(-0.14, 0.05, 0.04);
  const rightShoe = new THREE.Mesh(shoeGeo, mat(0x111111));
  rightShoe.position.set(0.14, 0.05, 0.04);
  group.add(leftShoe, rightShoe);

  group.userData.leftLeg = leftLeg;
  group.userData.rightLeg = rightLeg;
  group.userData.leftArm = leftArm;
  group.userData.rightArm = rightArm;

  return group;
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

export class RivalCEO {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.mesh = null;
    this.active = false;
    this._devMode = new URLSearchParams(window.location.search).has('dev_rival');

    // Phase: 'initial' (waiting 5 min), 'idle' (between events), 'active' (on field)
    this._phase = this._devMode ? 'initial' : 'initial';
    this._phaseTimer = this._devMode ? 10 : INITIAL_DELAY;
    this.activeTimer = 0;

    // Walk/pause state machine
    this._moving = true;
    this._stateTimer = randRange(WALK_MIN, WALK_MAX);
    this.walkTime = 0;

    this._pathIdx = 0;
    this._pathT = 0;

    this._modalEl = document.getElementById('rival-modal');
    this._countdownEl = document.getElementById('rival-countdown');
    this._countdownTimeEl = document.getElementById('rival-countdown-time');

    this._buildPath();
  }

  _buildPath() {
    const gs = this.world.gridSize;
    const step = 2 + 0.15;
    // Beyond the dock ring: dock extends to (gs)*step from center offset,
    // so the outer edge of docks is at offset + step. Go further out.
    const half = ((gs - 1) * step) / 2 + step + 2.0;

    this._waypoints = [
      { x: -half, z: half },
      { x: half, z: half },
      { x: half, z: -half },
      { x: -half, z: -half },
    ];
  }

  get slowdownMultiplier() {
    return this.active ? SLOWDOWN : 1;
  }

  update(dt) {
    this._updateCountdown();

    if (this._phase === 'initial') {
      this._phaseTimer -= dt;
      if (this._phaseTimer <= 0) {
        this._spawn();
      }
      return;
    }

    if (this._phase === 'idle') {
      this._phaseTimer -= dt;
      if (this._phaseTimer <= 0) {
        this._spawn();
      }
      return;
    }

    // phase === 'active'
    this.activeTimer -= dt;
    if (this.activeTimer <= 0) {
      this._despawn();
      return;
    }

    this._updateMovement(dt);
  }

  _updateCountdown() {
    if (!this._countdownEl) return;

    if (this._phase === 'initial') {
      this._countdownEl.classList.remove('hidden');
      const secs = Math.ceil(this._phaseTimer);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      this._countdownTimeEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    } else if (this._phase === 'idle') {
      this._countdownEl.classList.remove('hidden');
      const secs = Math.ceil(this._phaseTimer);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      this._countdownTimeEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    } else {
      this._countdownEl.classList.add('hidden');
    }
  }

  _spawn() {
    this.active = true;
    this._phase = 'active';
    this.activeTimer = ACTIVE_DURATION;
    this.walkTime = 0;
    this._moving = true;
    this._stateTimer = randRange(WALK_MIN, WALK_MAX);

    const startCorner = Math.floor(Math.random() * 4);
    this._pathIdx = startCorner;
    this._pathT = 0;
    this._direction = Math.random() < 0.5 ? 1 : -1;

    if (!this.mesh) {
      this.mesh = buildCEOModel();
    }

    const wp = this._waypoints[this._pathIdx];
    this.mesh.position.set(wp.x, 0, wp.z);
    this.scene.add(this.mesh);

    if (this._modalEl) this._modalEl.classList.add('visible');
  }

  _despawn() {
    this.active = false;
    this._phase = 'idle';
    this._phaseTimer = this._devMode ? 10 : SPAWN_INTERVAL;

    if (this.mesh) this.scene.remove(this.mesh);
    if (this._modalEl) this._modalEl.classList.remove('visible');
  }

  _updateMovement(dt) {
    this._stateTimer -= dt;

    if (this._stateTimer <= 0) {
      // Toggle between walking and pausing
      this._moving = !this._moving;
      this._stateTimer = this._moving
        ? randRange(WALK_MIN, WALK_MAX)
        : randRange(PAUSE_MIN, PAUSE_MAX);
    }

    const { leftLeg, rightLeg, leftArm, rightArm } = this.mesh.userData;

    if (this._moving) {
      const wps = this._waypoints;
      const len = wps.length;
      const nextIdx = (this._pathIdx + this._direction + len) % len;
      const from = wps[this._pathIdx];
      const to = wps[nextIdx];

      const dx = to.x - from.x;
      const dz = to.z - from.z;
      const segLen = Math.sqrt(dx * dx + dz * dz);

      this._pathT += (WALK_SPEED * dt) / segLen;

      if (this._pathT >= 1) {
        this._pathT -= 1;
        this._pathIdx = nextIdx;
        return;
      }

      const cx = from.x + dx * this._pathT;
      const cz = from.z + dz * this._pathT;
      this.mesh.position.set(cx, 0, cz);
      this.mesh.rotation.y = Math.atan2(dx, dz);

      this.walkTime += dt;
      const swing = Math.sin(this.walkTime * 8) * 0.4;
      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftArm.rotation.x = -swing;
      rightArm.rotation.x = swing;
    } else {
      // Paused — arms at rest, subtle idle sway
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      leftArm.rotation.x = 0;
      rightArm.rotation.x = 0;
    }
  }
}

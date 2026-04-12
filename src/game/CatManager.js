import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import CONFIG from '../config.json';

const CAT_CFG = CONFIG.cats.felix;
const BHV = CAT_CFG.behavior;
const PUP = CAT_CFG.powerup;

const _color = new THREE.Color();

function vc(geo, hex) {
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

const ORANGE = 0xe88830;
const STRIPE = 0xa05818;
const CREAM = 0xf0c890;
const PINK = 0xe07888;
const EYE_GREEN = 0x55cc44;
const NOSE_PINK = 0xd06070;
const PUPIL = 0x111111;

const S = 2.25;

function buildCatModel() {
  const group = new THREE.Group();
  const parts = [];

  const body = new THREE.BoxGeometry(0.35 * S, 0.28 * S, 0.55 * S);
  body.translate(0, 0.28 * S, 0);
  parts.push(vc(body, ORANGE));

  const belly = new THREE.BoxGeometry(0.24 * S, 0.06 * S, 0.4 * S);
  belly.translate(0, 0.15 * S, 0);
  parts.push(vc(belly, CREAM));

  for (let i = -2; i <= 2; i++) {
    const stripe = new THREE.BoxGeometry(0.36 * S, 0.03 * S, 0.06 * S);
    stripe.translate(0, 0.43 * S, i * 0.1 * S);
    parts.push(vc(stripe, STRIPE));
  }

  const head = new THREE.BoxGeometry(0.32 * S, 0.28 * S, 0.28 * S);
  head.translate(0, 0.38 * S, -0.38 * S);
  parts.push(vc(head, ORANGE));

  const markCenter = new THREE.BoxGeometry(0.06 * S, 0.03 * S, 0.01 * S);
  markCenter.translate(0, 0.50 * S, -0.52 * S);
  parts.push(vc(markCenter, STRIPE));
  const markL = new THREE.BoxGeometry(0.04 * S, 0.05 * S, 0.01 * S);
  markL.translate(-0.06 * S, 0.49 * S, -0.52 * S);
  parts.push(vc(markL, STRIPE));
  const markR = new THREE.BoxGeometry(0.04 * S, 0.05 * S, 0.01 * S);
  markR.translate(0.06 * S, 0.49 * S, -0.52 * S);
  parts.push(vc(markR, STRIPE));

  const cheekL = new THREE.BoxGeometry(0.08 * S, 0.08 * S, 0.05 * S);
  cheekL.translate(-0.14 * S, 0.32 * S, -0.50 * S);
  parts.push(vc(cheekL, CREAM));
  const cheekR = new THREE.BoxGeometry(0.08 * S, 0.08 * S, 0.05 * S);
  cheekR.translate(0.14 * S, 0.32 * S, -0.50 * S);
  parts.push(vc(cheekR, CREAM));

  const earL = new THREE.BoxGeometry(0.1 * S, 0.12 * S, 0.06 * S);
  earL.translate(-0.12 * S, 0.56 * S, -0.38 * S);
  parts.push(vc(earL, ORANGE));
  const earR = new THREE.BoxGeometry(0.1 * S, 0.12 * S, 0.06 * S);
  earR.translate(0.12 * S, 0.56 * S, -0.38 * S);
  parts.push(vc(earR, ORANGE));

  const earInL = new THREE.BoxGeometry(0.05 * S, 0.07 * S, 0.02 * S);
  earInL.translate(-0.12 * S, 0.56 * S, -0.41 * S);
  parts.push(vc(earInL, PINK));
  const earInR = new THREE.BoxGeometry(0.05 * S, 0.07 * S, 0.02 * S);
  earInR.translate(0.12 * S, 0.56 * S, -0.41 * S);
  parts.push(vc(earInR, PINK));

  const eyeL = new THREE.BoxGeometry(0.06 * S, 0.06 * S, 0.02 * S);
  eyeL.translate(-0.08 * S, 0.40 * S, -0.52 * S);
  parts.push(vc(eyeL, EYE_GREEN));
  const eyeR = new THREE.BoxGeometry(0.06 * S, 0.06 * S, 0.02 * S);
  eyeR.translate(0.08 * S, 0.40 * S, -0.52 * S);
  parts.push(vc(eyeR, EYE_GREEN));

  const pupilL = new THREE.BoxGeometry(0.025 * S, 0.05 * S, 0.01 * S);
  pupilL.translate(-0.08 * S, 0.40 * S, -0.53 * S);
  parts.push(vc(pupilL, PUPIL));
  const pupilR = new THREE.BoxGeometry(0.025 * S, 0.05 * S, 0.01 * S);
  pupilR.translate(0.08 * S, 0.40 * S, -0.53 * S);
  parts.push(vc(pupilR, PUPIL));

  const nose = new THREE.BoxGeometry(0.04 * S, 0.03 * S, 0.02 * S);
  nose.translate(0, 0.34 * S, -0.52 * S);
  parts.push(vc(nose, NOSE_PINK));

  const legGeo = () => new THREE.BoxGeometry(0.1 * S, 0.16 * S, 0.1 * S);
  const fl = legGeo(); fl.translate(-0.11 * S, 0.08 * S, -0.18 * S);
  parts.push(vc(fl, ORANGE));
  const fr = legGeo(); fr.translate(0.11 * S, 0.08 * S, -0.18 * S);
  parts.push(vc(fr, ORANGE));
  const bl = legGeo(); bl.translate(-0.11 * S, 0.08 * S, 0.18 * S);
  parts.push(vc(bl, ORANGE));
  const br = legGeo(); br.translate(0.11 * S, 0.08 * S, 0.18 * S);
  parts.push(vc(br, ORANGE));

  const pawGeo = () => new THREE.BoxGeometry(0.1 * S, 0.04 * S, 0.12 * S);
  const pfl = pawGeo(); pfl.translate(-0.11 * S, 0.02 * S, -0.18 * S);
  parts.push(vc(pfl, CREAM));
  const pfr = pawGeo(); pfr.translate(0.11 * S, 0.02 * S, -0.18 * S);
  parts.push(vc(pfr, CREAM));
  const pbl = pawGeo(); pbl.translate(-0.11 * S, 0.02 * S, 0.18 * S);
  parts.push(vc(pbl, CREAM));
  const pbr = pawGeo(); pbr.translate(0.11 * S, 0.02 * S, 0.18 * S);
  parts.push(vc(pbr, CREAM));

  const t1 = new THREE.BoxGeometry(0.08 * S, 0.08 * S, 0.2 * S);
  t1.translate(0, 0.32 * S, 0.35 * S);
  parts.push(vc(t1, ORANGE));
  const t2 = new THREE.BoxGeometry(0.07 * S, 0.07 * S, 0.16 * S);
  t2.translate(0, 0.42 * S, 0.48 * S);
  parts.push(vc(t2, STRIPE));
  const t3 = new THREE.BoxGeometry(0.06 * S, 0.06 * S, 0.12 * S);
  t3.translate(0, 0.54 * S, 0.56 * S);
  parts.push(vc(t3, ORANGE));

  const merged = mergeGeometries(parts);
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const mesh = new THREE.Mesh(merged, mat);
  mesh.castShadow = true;
  group.add(mesh);

  return group;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

const TILE_SIZE = 2;
const TILE_GAP = 0.15;
const STEP = TILE_SIZE + TILE_GAP;

const STATE_WALK = 'walk';
const STATE_SIT = 'sit';
const STATE_GROOM = 'groom';
const STATE_OFFERING = 'offering';


function buildOfferSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = '40px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎁', 32, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.2, 1.2, 1);
  sprite.visible = false;
  return sprite;
}

export class CatManager {
  constructor(scene, state, world) {
    this.scene = scene;
    this.state = state;
    this.world = world;
    this.mesh = null;
    this.active = false;

    this._behavior = STATE_WALK;
    this._stateTimer = 0;
    this._walkTime = 0;
    this._groomTime = 0;
    this._facingAngle = 0;
    this._speed = CAT_CFG.speed;

    this._targetX = 0;
    this._targetZ = 0;

    this._offerSprite = null;
    this._offerBobTime = 0;
    this._behaviorsSinceOffer = 0;

    this._computeBounds();
  }

  _computeBounds() {
    const gs = this.world.gridSize;
    const offset = ((gs - 1) * STEP) / 2;

    // Outermost dock tile centers are at row/col -1 and gs
    // Their outer edge is center ± TILE_SIZE/2
    const dockOuterEdge = gs * STEP - offset + TILE_SIZE / 2;

    // Wander band starts just past dock edge, extends 2 block-widths out
    const gap = STEP * 0.25;
    this._innerEdge = dockOuterEdge + gap;
    this._outerEdge = dockOuterEdge + gap + STEP * 2;
  }

  _randomPointInBand() {
    const inner = this._innerEdge;
    const outer = this._outerEdge;
    const bandWidth = outer - inner;

    // 4 sides: top(-z), bottom(+z), left(-x), right(+x)
    // Side strips span the full outer width; corners belong to top/bottom
    const topBottomLen = outer * 2;
    const leftRightLen = (outer - inner) * 0 + (inner * 2);
    const totalWeight = (topBottomLen + leftRightLen) * 2;
    let r = Math.random() * totalWeight;

    if (r < topBottomLen) {
      // Top side: x spans full width, z in band
      return { x: rand(-outer, outer), z: -rand(inner, outer) };
    }
    r -= topBottomLen;
    if (r < topBottomLen) {
      // Bottom side
      return { x: rand(-outer, outer), z: rand(inner, outer) };
    }
    r -= topBottomLen;
    if (r < leftRightLen) {
      // Left side: z only within inner range (corners handled by top/bottom)
      return { x: -rand(inner, outer), z: rand(-inner, inner) };
    }
    // Right side
    return { x: rand(inner, outer), z: rand(-inner, inner) };
  }

  _pickNewTarget() {
    for (let i = 0; i < 10; i++) {
      const pt = this._randomPointInBand();
      if (this._isInBand(pt.x, pt.z)) {
        this._targetX = pt.x;
        this._targetZ = pt.z;
        return;
      }
    }
    const pt = this._randomPointInBand();
    const clamped = this._clampToBand(pt.x, pt.z);
    this._targetX = clamped.x;
    this._targetZ = clamped.z;
  }

  _pickNextBehavior() {
    this._behaviorsSinceOffer++;

    const [minOffer, maxOffer] = PUP.behaviorsBeforeOffer;
    if (this._behaviorsSinceOffer >= minOffer + Math.floor(Math.random() * (maxOffer - minOffer + 1))) {
      this._behavior = STATE_OFFERING;
      this._stateTimer = rand(PUP.offerDuration[0], PUP.offerDuration[1]);
      this._behaviorsSinceOffer = 0;
      this._showOfferSprite();
      return;
    }

    const roll = Math.random();
    if (roll < BHV.walkChance) {
      this._behavior = STATE_WALK;
      this._stateTimer = rand(BHV.walkDuration[0], BHV.walkDuration[1]);
      this._pickNewTarget();
    } else if (roll < BHV.walkChance + BHV.sitChance) {
      this._behavior = STATE_SIT;
      this._stateTimer = rand(BHV.sitDuration[0], BHV.sitDuration[1]);
    } else {
      this._behavior = STATE_GROOM;
      this._stateTimer = rand(BHV.groomDuration[0], BHV.groomDuration[1]);
      this._groomTime = 0;
    }
  }

  _showOfferSprite() {
    if (!this._offerSprite) {
      this._offerSprite = buildOfferSprite();
      this.scene.add(this._offerSprite);
    }
    this._offerSprite.visible = true;
    this._offerBobTime = 0;
  }

  _hideOfferSprite() {
    if (this._offerSprite) this._offerSprite.visible = false;
  }

  get hasOffering() {
    return this._behavior === STATE_OFFERING;
  }

  collectOffering() {
    if (this._behavior !== STATE_OFFERING) return null;
    this._hideOfferSprite();
    this._behavior = STATE_SIT;
    this._stateTimer = rand(2, 4);
    this.state.collectPowerup(PUP.id);
    return PUP;
  }

  getClickTargets() {
    if (!this.mesh || !this.active) return [];
    return [this.mesh.children[0]];
  }

  spawn() {
    if (this.active) return;
    this.active = true;

    if (!this.mesh) {
      this.mesh = buildCatModel();
    }

    const startPt = this._randomPointInBand();
    this.mesh.position.set(startPt.x, 0, startPt.z);

    this._pickNewTarget();
    this._facingAngle = Math.atan2(
      -(this._targetX - startPt.x),
      -(this._targetZ - startPt.z)
    );
    this.mesh.rotation.y = this._facingAngle;

    this._behavior = STATE_WALK;
    this._stateTimer = rand(4, 8);
    this._walkTime = 0;

    this.scene.add(this.mesh);
  }

  despawn() {
    if (!this.active) return;
    this.active = false;
    this._hideOfferSprite();
    if (this.mesh) this.scene.remove(this.mesh);
  }

  reset() {
    this.despawn();
    this._behaviorsSinceOffer = 0;
  }

  update(dt) {
    if (!this.active) {
      if (this.state.hasPerk('felix')) this.spawn();
      return;
    }

    if (!this.state.hasPerk('felix')) {
      this.despawn();
      return;
    }

    this._stateTimer -= dt;
    if (this._stateTimer <= 0) {
      if (this._behavior === STATE_OFFERING) {
        this._hideOfferSprite();
      }
      this._pickNextBehavior();
    }

    if (this._behavior === STATE_WALK) {
      this._updateWalk(dt);
    } else if (this._behavior === STATE_SIT) {
      this._updateSit();
    } else if (this._behavior === STATE_GROOM) {
      this._updateGroom(dt);
    } else if (this._behavior === STATE_OFFERING) {
      this._updateOffering(dt);
    }
  }

  _isInBand(x, z) {
    const inner = this._innerEdge;
    const outer = this._outerEdge;
    const ax = Math.abs(x);
    const az = Math.abs(z);
    return ax <= outer && az <= outer && (ax >= inner || az >= inner);
  }

  _clampToBand(x, z) {
    const inner = this._innerEdge;
    const outer = this._outerEdge;

    x = Math.max(-outer, Math.min(outer, x));
    z = Math.max(-outer, Math.min(outer, z));

    // If both axes are inside inner, push the closer one out to inner
    if (Math.abs(x) < inner && Math.abs(z) < inner) {
      if (Math.abs(x) > Math.abs(z)) {
        x = x >= 0 ? inner : -inner;
      } else {
        z = z >= 0 ? inner : -inner;
      }
    }

    return { x, z };
  }

  _updateWalk(dt) {
    const px = this.mesh.position.x;
    const pz = this.mesh.position.z;
    const dx = this._targetX - px;
    const dz = this._targetZ - pz;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.3) {
      this._pickNewTarget();
      return;
    }

    const move = Math.min(this._speed * dt, dist);
    const nx = dx / dist;
    const nz = dz / dist;

    const clamped = this._clampToBand(px + nx * move, pz + nz * move);
    this.mesh.position.x = clamped.x;
    this.mesh.position.z = clamped.z;

    const targetAngle = Math.atan2(-nx, -nz);
    this._facingAngle = _lerpAngle(this._facingAngle, targetAngle, 1 - Math.pow(0.002, dt));
    this.mesh.rotation.y = this._facingAngle;

    this._walkTime += dt;
    this.mesh.position.y = Math.sin(this._walkTime * 8) * 0.04 * S;
  }

  _updateSit() {
    this.mesh.position.y = 0;
  }

  _updateGroom(dt) {
    this._groomTime += dt;
    const cycle = Math.sin(this._groomTime * 4) * 0.12;
    this.mesh.rotation.x = cycle;
    this.mesh.position.y = 0;

    if (this._stateTimer <= 0) {
      this.mesh.rotation.x = 0;
    }
  }

  _updateOffering(dt) {
    this.mesh.position.y = 0;
    if (this._offerSprite) {
      this._offerBobTime += dt;
      const bobY = this.mesh.position.y + 1.6 * S + Math.sin(this._offerBobTime * 3) * 0.15;
      this._offerSprite.position.set(
        this.mesh.position.x,
        bobY,
        this.mesh.position.z
      );
    }
  }
}

function _lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

import * as THREE from 'three';

const FLOAT_SPEED = 3;
const LIFETIME = 1.0;
const POOL_SIZE = 32;

function createTextSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.5, 1.25, 1);
  sprite.visible = false;
  sprite.userData.canvas = canvas;
  sprite.userData.ctx = ctx;
  sprite.userData.texture = texture;
  return sprite;
}

function writeText(sprite, text) {
  const { canvas, ctx, texture } = sprite.userData;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 3;
  ctx.strokeText(text, 32, 16);
  ctx.fillStyle = '#ffdd44';
  ctx.fillText(text, 32, 16);
  texture.needsUpdate = true;
}

export class FloatingTextManager {
  constructor(scene) {
    this.scene = scene;
    this.texts = [];
    this._pool = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const sprite = createTextSprite();
      this.scene.add(sprite);
      this._pool.push(sprite);
    }
  }

  _acquire() {
    if (this._pool.length > 0) return this._pool.pop();
    const sprite = createTextSprite();
    this.scene.add(sprite);
    return sprite;
  }

  _release(sprite) {
    sprite.visible = false;
    this._pool.push(sprite);
  }

  spawn(x, y, z, text = '+1') {
    const sprite = this._acquire();
    writeText(sprite, text);
    sprite.position.set(x, y + 0.5, z);
    sprite.material.opacity = 1;
    sprite.scale.set(2.5, 1.25, 1);
    sprite.visible = true;
    this.texts.push({ sprite, age: 0 });
  }

  update(dt) {
    let i = this.texts.length;
    while (i-- > 0) {
      const t = this.texts[i];
      t.age += dt;
      const progress = t.age / LIFETIME;

      if (progress >= 1) {
        this._release(t.sprite);
        const last = this.texts.length - 1;
        if (i !== last) this.texts[i] = this.texts[last];
        this.texts.pop();
        continue;
      }

      t.sprite.position.y += FLOAT_SPEED * dt;
      t.sprite.material.opacity = 1 - progress;

      const scale = 1 + progress * 0.3;
      t.sprite.scale.set(2.5 * scale, 1.25 * scale, 1);
    }
  }
}

import * as THREE from 'three';

const FLOAT_SPEED = 3;
const LIFETIME = 1.0;

function createTextSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 3;
  ctx.strokeText(text, 32, 16);

  ctx.fillStyle = '#ffdd44';
  ctx.fillText(text, 32, 16);

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
  return sprite;
}

export class FloatingTextManager {
  constructor(scene) {
    this.scene = scene;
    this.texts = [];
  }

  spawn(x, y, z, text = '+1') {
    const sprite = createTextSprite(text);
    sprite.position.set(x, y + 0.5, z);
    this.scene.add(sprite);
    this.texts.push({ sprite, age: 0 });
  }

  update(dt) {
    let i = this.texts.length;
    while (i-- > 0) {
      const t = this.texts[i];
      t.age += dt;
      const progress = t.age / LIFETIME;

      if (progress >= 1) {
        this.scene.remove(t.sprite);
        t.sprite.material.dispose();
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

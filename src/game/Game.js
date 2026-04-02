import * as THREE from 'three';
import { World } from './World.js';
import { FlowerManager } from './FlowerManager.js';
import { DroneManager } from './DroneManager.js';
import { GameState } from './GameState.js';
import { UI } from './UI.js';
import { FloatingTextManager } from './FloatingText.js';

const PIXEL_RATIO = 3;
const GRID_SIZE = 10;

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x4a2a6a);

    this.setupCamera();
    this.setupRenderer();
    this.setupLighting();

    this.state = new GameState();
    this.floatingText = new FloatingTextManager(this.scene);
    this.world = new World(this.scene, GRID_SIZE);
    this.flowerManager = new FlowerManager(this.scene, this.state, this.world);
    this.droneManager = new DroneManager(this.scene, this.state, this.flowerManager, this.world, this.floatingText);
    this.ui = new UI(this.state, this.droneManager, this.camera, this.renderer);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredTile = null;

    this.setupInput();
    window.addEventListener('resize', () => this.onResize());
  }

  setupCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustum = 18;
    this.camera = new THREE.OrthographicCamera(
      -frustum * aspect, frustum * aspect,
      frustum, -frustum,
      0.1, 1000
    );

    this.camera.position.set(30, 30, 30);
    this.camera.lookAt(0, 0, 0);
    this.camera.zoom = 1.3;
    this.camera.updateProjectionMatrix();
  }

  setupRenderer() {
    const w = Math.floor(window.innerWidth / PIXEL_RATIO);
    const h = Math.floor(window.innerHeight / PIXEL_RATIO);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
    });
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.canvas.style.imageRendering = 'pixelated';
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.0);
    sun.position.set(20, 40, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512);
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    this.scene.add(sun);
  }

  setupInput() {
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
  }

  updateMouseFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  onPointerMove(e) {
    this.updateMouseFromEvent(e);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.hoveredTile) {
      this.hoveredTile.material.color.setHex(this.hoveredTile.userData.baseColor);
      this.hoveredTile = null;
    }

    const dockHits = this.raycaster.intersectObjects(this.world.getAllDockTiles());
    if (dockHits.length > 0) {
      const tile = dockHits[0].object;
      if (this.droneManager.placementMode && !tile.userData.occupied) {
        tile.material.color.setHex(0x7b50a0);
        this.hoveredTile = tile;
      } else if (tile.userData.occupied) {
        tile.material.color.setHex(0xaa6622);
        this.hoveredTile = tile;
      }
    }
  }

  onPointerDown(e) {
    this.updateMouseFromEvent(e);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Placement mode: place drone on a dock tile
    if (this.droneManager.placementMode) {
      const dockHits = this.raycaster.intersectObjects(this.world.getAllDockTiles());
      if (dockHits.length > 0) {
        const tile = dockHits[0].object;
        const { dockRow, dockCol } = tile.userData;
        if (this.droneManager.placeDrone(dockRow, dockCol)) {
          this.ui.showToast('Drone placed!');
        } else {
          this.ui.showToast('Tile already occupied!');
        }
      }
      return;
    }

    // Click occupied dock tile to open drone upgrade popup
    const dockHits = this.raycaster.intersectObjects(this.world.getAllDockTiles());
    if (dockHits.length > 0) {
      const tile = dockHits[0].object;
      if (tile.userData.occupied) {
        const { dockRow, dockCol } = tile.userData;
        const droneIdx = this.droneManager.getDroneByDockTile(dockRow, dockCol);
        if (droneIdx >= 0) {
          this.ui.showDronePopup(droneIdx);
          return;
        }
      }
    }

    this.ui.closeDronePopup();

    const flowerHit = this.flowerManager.checkClick(this.raycaster);
    if (flowerHit) {
      const val = flowerHit.userData.flowerValue || 1;
      this.state.addFlowers(val);
      const p = flowerHit.position;
      this.floatingText.spawn(p.x, p.y, p.z, '+' + val);
    }
  }

  onResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustum = 18;
    this.camera.left = -frustum * aspect;
    this.camera.right = frustum * aspect;
    this.camera.top = frustum;
    this.camera.bottom = -frustum;
    this.camera.updateProjectionMatrix();

    const w = Math.floor(window.innerWidth / PIXEL_RATIO);
    const h = Math.floor(window.innerHeight / PIXEL_RATIO);
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
  }

  start() {
    this.clock = new THREE.Clock();
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = this.clock.getDelta();

    this.flowerManager.update(dt);
    this.droneManager.update(dt);
    this.floatingText.update(dt);
    this.ui.update(dt);

    this.renderer.render(this.scene, this.camera);
  }
}

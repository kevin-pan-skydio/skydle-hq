import * as THREE from 'three';

const TILE_SIZE = 2;
const TILE_GAP = 0.15;
const TILE_HEIGHT = 0.3;
const STEP = TILE_SIZE + TILE_GAP;

const COLORS = {
  tile: 0x2a2a2a,
  tileAlt: 0x252525,
  dock: 0x5c3a7a,
  dockAlt: 0x4f3268,
  dockHover: 0x7b50a0,
  dockOccupied: 0x8b4513,
  dockOccupiedAlt: 0x7a3c10,
  corner: 0x8888aa,
};

export class World {
  constructor(scene, gridSize = 10) {
    this.scene = scene;
    this.gridSize = gridSize;
    this.tiles = [];
    this.tileMap = new Map();
    this.dockTiles = [];
    this.dockTileMap = new Map();
    this.build();
  }

  build() {
    const offset = ((this.gridSize - 1) * STEP) / 2;

    // Grass green center board
    const boardSize = this.gridSize * STEP;
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(boardSize, TILE_HEIGHT, boardSize),
      new THREE.MeshLambertMaterial({ color: 0x2d5a1e })
    );
    board.position.set(0, -TILE_HEIGHT / 2, 0);
    board.receiveShadow = true;
    this.scene.add(board);
    this.board = board;

    this.buildDockTiles(offset);
  }

  buildDockTiles(offset) {
    const gs = this.gridSize;
    const dockPositions = [];

    // Top row (row = -1), Bottom row (row = gs), Left col (col = -1), Right col (col = gs)
    for (let i = -1; i <= gs; i++) {
      dockPositions.push({ row: -1, col: i });
      dockPositions.push({ row: gs, col: i });
    }
    for (let i = 0; i < gs; i++) {
      dockPositions.push({ row: i, col: -1 });
      dockPositions.push({ row: i, col: gs });
    }

    for (const { row, col } of dockPositions) {
      const isDark = (row + col) % 2 === 0;
      const color = isDark ? COLORS.dock : COLORS.dockAlt;
      const geo = new THREE.BoxGeometry(TILE_SIZE, TILE_HEIGHT, TILE_SIZE);
      const mat = new THREE.MeshLambertMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);

      const x = col * STEP - offset;
      const z = row * STEP - offset;
      mesh.position.set(x, -TILE_HEIGHT / 2, z);
      mesh.receiveShadow = true;

      mesh.userData.dockRow = row;
      mesh.userData.dockCol = col;
      mesh.userData.isDock = true;
      mesh.userData.baseColor = color;
      mesh.userData.occupied = false;

      this.scene.add(mesh);
      this.dockTiles.push(mesh);
      this.dockTileMap.set(`${row},${col}`, mesh);
    }
  }

  getTileAt(row, col) {
    return this.tileMap.get(`${row},${col}`);
  }

  getTileWorldPos(row, col) {
    const tile = this.getTileAt(row, col);
    if (!tile) return null;
    return new THREE.Vector3(tile.position.x, 0.01, tile.position.z);
  }

  getDockWorldPos(row, col) {
    const tile = this.dockTileMap.get(`${row},${col}`);
    if (!tile) return null;
    return new THREE.Vector3(tile.position.x, 0.01, tile.position.z);
  }

  markDockOccupied(row, col) {
    const tile = this.dockTileMap.get(`${row},${col}`);
    if (!tile) return;
    tile.userData.occupied = true;
    const isDark = (row + col) % 2 === 0;
    const occColor = isDark ? COLORS.dockOccupied : COLORS.dockOccupiedAlt;
    tile.material.color.setHex(occColor);
    tile.userData.baseColor = occColor;
  }

  getDockTile(row, col) {
    return this.dockTileMap.get(`${row},${col}`) || null;
  }

  isDockOccupied(row, col) {
    const tile = this.dockTileMap.get(`${row},${col}`);
    return tile ? tile.userData.occupied : true;
  }

  getAllTiles() {
    return this.tiles;
  }

  getAllDockTiles() {
    return this.dockTiles;
  }

  resetDocks() {
    for (const tile of this.dockTiles) {
      tile.userData.occupied = false;
      const { dockRow: row, dockCol: col } = tile.userData;
      const isDark = (row + col) % 2 === 0;
      const color = isDark ? COLORS.dock : COLORS.dockAlt;
      tile.material.color.setHex(color);
      tile.userData.baseColor = color;
    }
  }
}

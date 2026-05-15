// ─── CITY GENERATOR ───────────────────────────────────────────────────────
import { Config, WORLD_SIZE, ROAD_WIDTH, IsMobile, Tier } from '../core/config.js';
import { createRoadTexture, createWindowTexture, createGrassTexture, createAsphaltTexture } from '../utils/textureFactory.js';

const MatClass = IsMobile ? THREE.MeshLambertMaterial : THREE.MeshStandardMaterial;

export class CityGenerator {
  constructor(scene) {
    this._scene = scene;
    this.buildings    = [];
    this.buildingGrid = {};
    this.streetLights = [];
    this._roadTex     = createRoadTexture();
    this._grassTex    = createGrassTexture();
    this._asphaltTex  = createAsphaltTexture();
    this._winTexDown  = createWindowTexture(8, 8, true);
    this._winTexSub   = createWindowTexture(5, 5, false);
  }

  generate() {
    this._buildGround();
    this._buildRoads();
    this._buildBlocks();
    if (Config.LIGHTS.LIGHTS_PER_INTERSECTION > 0) this._buildStreetLights();
    this._buildGasStation();
    this._buildStars();
    this._buildSky();
  }

  get skyMesh()    { return this._skyMesh; }
  get starMat()    { return this._starMat; }

  _buildGround() {
    const tex = this._asphaltTex.clone();
    tex.repeat.set(WORLD_SIZE / 10, WORLD_SIZE / 10);
    tex.needsUpdate = true;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_SIZE * 2, WORLD_SIZE * 2),
      new MatClass({ map: tex, roughness: 1.0, metalness: 0.1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = !IsMobile;
    this._scene.add(ground);
  }

  _buildRoads() {
    const { TILE_SIZE: TILE, GRID_SIZE: GRID } = Config.WORLD;
    const roadW = ROAD_WIDTH;
    const half  = WORLD_SIZE / 2;
    const roadMat = new MatClass({ map: this._roadTex, roughness: 0.8, metalness: 0.1 });

    // Merge all road segments into fewer meshes using a merged geometry approach
    // (One horizontal slab per row, one vertical slab per column)
    for (let i = 0; i < GRID; i += 2) {
      const hr = new THREE.Mesh(new THREE.BoxGeometry(WORLD_SIZE, 0.2, roadW), roadMat);
      hr.position.set(half, 0.1, i * TILE - half);
      hr.receiveShadow = !IsMobile;
      this._scene.add(hr);

      const vr = new THREE.Mesh(new THREE.BoxGeometry(roadW, 0.2, WORLD_SIZE), roadMat);
      vr.position.set(i * TILE - half, 0.1, half);
      vr.receiveShadow = !IsMobile;
      this._scene.add(vr);
    }
  }

  _buildBlocks() {
    const { TILE_SIZE: TILE, GRID_SIZE: GRID, DOWNTOWN_DIST, PARK_CHANCE } = Config.WORLD;
    const half = WORLD_SIZE / 2;
    for (let gx = 0; gx < GRID; gx++) {
      for (let gz = 0; gz < GRID; gz++) {
        if (gx % 2 === 0 || gz % 2 === 0) continue;
        const wx = gx * TILE - half;
        const wz = gz * TILE - half;
        const distCenter = Math.sqrt((gx - GRID / 2) ** 2 + (gz - GRID / 2) ** 2);
        const isDowntown = distCenter < DOWNTOWN_DIST;
        if (Math.random() < PARK_CHANCE) { this._buildPark(wx, wz); continue; }
        this._buildBuilding(gx, gz, wx, wz, isDowntown);
      }
    }
  }

  _buildPark(wx, wz) {
    const { TILE_SIZE: TILE } = Config.WORLD;
    const park = new THREE.Mesh(
      new THREE.BoxGeometry(TILE * 0.82, 0.3, TILE * 0.82),
      new MatClass({ map: this._grassTex, roughness: 1.0, metalness: 0.0 }),
    );
    park.position.set(wx, 0.15, wz);
    this._scene.add(park);
    const treeCount = Tier === 'LOW' ? 1 : Tier === 'MED' ? 3 : 6;
    for (let t = 0; t < treeCount; t++)
      this._addTree(wx + (Math.random() - 0.5) * TILE * 0.6, wz + (Math.random() - 0.5) * TILE * 0.6);
  }

  _buildBuilding(gx, gz, wx, wz, isDowntown) {
    const { TILE_SIZE: TILE } = Config.WORLD;
    const bw = TILE * 0.75 + (Math.random() - 0.5) * TILE * 0.15;
    const bh = isDowntown ? 60 + Math.random() * 120 : 12 + Math.random() * 35;
    const bd = TILE * 0.75 + (Math.random() - 0.5) * TILE * 0.15;

    // Reuse cached window textures instead of generating per-building
    const tex = (isDowntown ? this._winTexDown : this._winTexSub).clone();
    tex.repeat.set(bw / 10, bh / 10);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, bd),
      new MatClass({ map: tex, color: 0x444455, roughness: 0.3, metalness: 0.8 }),
    );
    mesh.position.set(wx, bh / 2, wz);
    mesh.castShadow = !IsMobile;
    mesh.receiveShadow = !IsMobile;
    mesh.frustumCulled = true;
    this._scene.add(mesh);

    const data = { mesh, x: wx, z: wz, w: bw / 2, d: bd / 2, h: bh };
    this.buildings.push(data);
    this.buildingGrid[`${gx},${gz}`] = data;

    // Rooftop extras only on HIGH
    if (Tier === 'HIGH' && Math.random() > 0.5) {
      isDowntown && Math.random() > 0.5
        ? this._addBillboard(wx, bh, wz, bw, bd)
        : this._addACUnit(wx, bh, wz);
    }
  }

  _addTree(x, z) {
    const trunkGeo  = new THREE.CylinderGeometry(0.2, 0.4, 4, Tier === 'LOW' ? 4 : 6);
    const foliageGeo = new THREE.DodecahedronGeometry(1.5, 0);
    const trunkMat  = new MatClass({ color: 0x3d2314, roughness: 0.9 });

    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 2, z);
    trunk.castShadow = !IsMobile;
    this._scene.add(trunk);

    const leafColor = new THREE.Color().setHSL(0.3 + Math.random() * 0.05, 0.6, 0.22 + Math.random() * 0.08);
    const foliageMat = new MatClass({ color: leafColor, roughness: 0.8 });
    const clusterCount = Tier === 'LOW' ? 1 : Tier === 'MED' ? 2 : 3;
    const foliageGroup = new THREE.Group();
    for (let i = 0; i < clusterCount; i++) {
      const leaf = new THREE.Mesh(foliageGeo, foliageMat);
      const s = 0.8 + Math.random() * 0.5;
      leaf.scale.set(s, s, s);
      leaf.position.set((Math.random() - 0.5) * 1.5, Math.random() * 1.5, (Math.random() - 0.5) * 1.5);
      leaf.castShadow = !IsMobile;
      foliageGroup.add(leaf);
    }
    foliageGroup.position.set(x, 4.5, z);
    this._scene.add(foliageGroup);
  }

  _addBillboard(x, y, z, bw, bd) {
    const colors = [0xff0055, 0x00ccff, 0x00ff66, 0xffaa00];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const signW = Math.min(10, bw * 0.8);
    const signH = 4 + Math.random() * 4;
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(signW, signH, 0.5),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8 }),
    );
    board.position.set(x, y + 2 + signH / 2, z);
    board.rotation.y = Math.random() > 0.5 ? 0 : Math.PI / 2;
    this._scene.add(board);
  }

  _addACUnit(x, y, z) {
    const ac = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 2),
      new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.6 }),
    );
    ac.position.set(x + (Math.random() - 0.5) * 2, y + 0.75, z + (Math.random() - 0.5) * 2);
    this._scene.add(ac);
  }

  _buildStreetLights() {
    const { TILE_SIZE: TILE, GRID_SIZE: GRID } = Config.WORLD;
    const half = WORLD_SIZE / 2;
    const poleMat = new MatClass({ color: 0x555566, metalness: 0.8, roughness: 0.2 });
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 8, 6);
    const offsets = Config.LIGHTS.LIGHTS_PER_INTERSECTION === 2 ? [[1,1],[-1,-1]] : [[1,1]];

    for (let i = 0; i < GRID; i += 2) {
      for (let j = 0; j < GRID; j += 2) {
        offsets.forEach(([sx, sz]) => {
          const x = i * TILE - half + TILE * 0.32 * sx;
          const z = j * TILE - half + TILE * 0.32 * sz;
          const pole = new THREE.Mesh(poleGeo, poleMat);
          pole.position.set(x, 4, z);
          this._scene.add(pole);
          const light = new THREE.PointLight(0xffdd88, 0, Config.LIGHTS.STREET_RANGE);
          light.position.set(x, Config.LIGHTS.STREET_HEIGHT, z);
          this._scene.add(light);
          this.streetLights.push(light);
        });
      }
    }
  }

  _buildGasStation() {
    const { TILE_SIZE: TILE, GAS_STATION_GX, GAS_STATION_GZ } = Config.WORLD;
    const half = WORLD_SIZE / 2;
    const gsx  = -half + TILE * GAS_STATION_GX;
    const gsz  = -half + TILE * GAS_STATION_GZ;

    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6, 0.5, 16),
      new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.5 }),
    );
    marker.position.set(gsx, 0.3, gsz);
    this._scene.add(marker);

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(10, 4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.4, metalness: 0.5, emissive: 0xff3300, emissiveIntensity: 0.5 }),
    );
    sign.position.set(gsx, 5, gsz);
    this._scene.add(sign);
  }

  _buildStars() {
    const verts = [];
    for (let i = 0; i < 2000; i++) {
      verts.push((Math.random() - 0.5) * 3000, Math.random() * 600 + 200, (Math.random() - 0.5) * 3000);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    this._starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0 });
    this._scene.add(new THREE.Points(geo, this._starMat));
  }

  _buildSky() {
    this._skyMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1800, 16, 8),
      new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: 0x87CEEB }),
    );
    this._scene.add(this._skyMesh);
  }
}

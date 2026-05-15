// ─── VEHICLE FACTORY ──────────────────────────────────────────────────────
import { IsMobile, Tier } from '../core/config.js';

// Use faster materials on mobile
const CarMaterial = IsMobile ? THREE.MeshLambertMaterial : THREE.MeshStandardMaterial;

// Shared geometries (reused across all vehicles to save GPU memory)
let _sharedGeos = null;
function getSharedGeos() {
  if (_sharedGeos) return _sharedGeos;
  const segs = Tier === 'LOW' ? 4 : Tier === 'MED' ? 6 : 12;
  _sharedGeos = {
    tire:    new THREE.CylinderGeometry(0.46, 0.46, 0.44, segs),
    rimBase: new THREE.CylinderGeometry(0.34, 0.34, 0.46, segs),
    cap:     new THREE.CylinderGeometry(0.1, 0.1, 0.47, 6),
  };
  return _sharedGeos;
}

// Shared materials for traffic cars (all same color, just different body)
const _sharedMats = new Map();
function getTrafficMat(color) {
  if (!_sharedMats.has(color)) {
    _sharedMats.set(color, new CarMaterial({ color, metalness: 0.5, roughness: 0.4 }));
  }
  return _sharedMats.get(color);
}

const _sharedBlackMat  = new CarMaterial({ color: 0x111111, roughness: 0.9 });
const _sharedSilverMat = new CarMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
const _sharedGlassMat  = IsMobile
  ? new THREE.MeshLambertMaterial({ color: 0x223366, transparent: true, opacity: 0.7 })
  : new THREE.MeshStandardMaterial({ color: 0x223366, transparent: true, opacity: 0.75, metalness: 0.9, roughness: 0.1 });

export class VehicleFactory {
  static build(isPlayer, color) {
    // On LOW tier, traffic cars are ultra-simple boxes
    if (!isPlayer && Tier === 'LOW') {
      return VehicleFactory._buildSimpleCar(color);
    }
    return VehicleFactory._buildDetailedCar(isPlayer, color);
  }

  /** Ultra-simple box car for LOW-end traffic */
  static _buildSimpleCar(color) {
    const g = new THREE.Group();
    const mat = getTrafficMat(color);
    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 6.0), mat);
    body.position.y = 0.9;
    g.add(body);
    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.7, 2.8),
      new CarMaterial({ color: 0x111111 }));
    cabin.position.set(0, 1.65, -0.15);
    g.add(cabin);
    // Flat wheels (just cylinders, no spokes)
    const wGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.38, 6);
    const wMat = new CarMaterial({ color: 0x111111, roughness: 0.9 });
    [[-1.9, 0.42, 2.0],[1.9, 0.42, 2.0],[-1.9, 0.42,-1.8],[1.9, 0.42,-1.8]].forEach(p => {
      const w = new THREE.Group();
      const wm = new THREE.Mesh(wGeo, wMat);
      wm.rotation.z = Math.PI / 2;
      w.add(wm);
      w.position.set(...p);
      g.add(w);
    });
    g._wheels = g.children.slice(-4);
    g.frustumCulled = true;
    return g;
  }

  static _buildDetailedCar(isPlayer, color) {
    const g = new THREE.Group();
    const fallbackGroup = new THREE.Group();
    g.add(fallbackGroup);

    const mainColor   = isPlayer ? 0xFF6600 : (color || 0xFF6600);
    const bodyMat   = new CarMaterial({ color: mainColor, metalness: 0.7, roughness: 0.2 });
    const blackMat  = _sharedBlackMat;
    const carbonMat = new CarMaterial({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.5 });
    const silverMat = _sharedSilverMat;
    const glassMat  = _sharedGlassMat;
    const whiteMat  = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const redMat    = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // Hull
    const hull = VehicleFactory._mesh(new THREE.BoxGeometry(3.8, 0.7, 6.8), bodyMat, [0, 0.72, 0], fallbackGroup, isPlayer && !IsMobile);
    g._bodyMesh = hull;
    VehicleFactory._mesh(new THREE.BoxGeometry(3.4, 0.5, 5.0), bodyMat, [0, 1.22, -0.2], fallbackGroup, false);

    // Cabin
    VehicleFactory._mesh(new THREE.BoxGeometry(2.6, 0.75, 2.6), blackMat, [0, 1.72, -0.15], fallbackGroup);

    // Glass (skip side windows on low-detail)
    if (Tier !== 'LOW' || isPlayer) {
      const ws = VehicleFactory._mesh(new THREE.BoxGeometry(2.5, 0.72, 0.12), glassMat, [0, 1.82, 1.28], fallbackGroup);
      ws.rotation.x = 0.38;
      const rw = VehicleFactory._mesh(new THREE.BoxGeometry(2.4, 0.6, 0.1), glassMat, [0, 1.72, -1.42], fallbackGroup);
      rw.rotation.x = -0.32;
    }

    if (isPlayer) {
      VehicleFactory._mesh(new THREE.BoxGeometry(0.9, 0.01, 5.2), blackMat, [0, 1.07, 0.2], fallbackGroup);
      VehicleFactory._mesh(new THREE.BoxGeometry(0.35, 0.012, 5.2),
        new THREE.MeshStandardMaterial({ color: 0xFF9900, metalness: 0.6, roughness: 0.3 }),
        [0, 1.075, 0.2], fallbackGroup);
    }

    // Hood
    VehicleFactory._mesh(new THREE.BoxGeometry(3.4, 0.08, 2.2), bodyMat, [0, 1.08, 2.0], fallbackGroup);
    if (isPlayer) {
      VehicleFactory._mesh(new THREE.BoxGeometry(0.7, 0.22, 0.9), carbonMat, [0, 1.22, 1.8], fallbackGroup, true);
    }

    // Front fascia
    VehicleFactory._mesh(new THREE.BoxGeometry(3.2, 0.35, 0.5), bodyMat, [0, 0.55, 3.5], fallbackGroup);

    // Headlights
    [[-1.4, 1.1, 3.45], [1.4, 1.1, 3.45]].forEach(([hx, hy, hz]) => {
      VehicleFactory._mesh(new THREE.BoxGeometry(0.72, 0.22, 0.1), whiteMat, [hx, hy, hz], fallbackGroup);
    });

    // Rear
    VehicleFactory._mesh(new THREE.BoxGeometry(3.6, 0.35, 0.7), carbonMat, [0, 0.3, -3.5], fallbackGroup);
    VehicleFactory._mesh(new THREE.BoxGeometry(3.8, 0.5, 0.15), bodyMat, [0, 0.65, -3.5], fallbackGroup);
    [[-1.5, 1.0, -3.43], [1.5, 1.0, -3.43]].forEach(([tx, ty, tz]) => {
      VehicleFactory._mesh(new THREE.BoxGeometry(0.62, 0.18, 0.08), redMat, [tx, ty, tz], fallbackGroup);
    });

    // Rear wing (player only or high-detail)
    if (isPlayer || Tier === 'HIGH') {
      [-1.1, 1.1].forEach(sx =>
        VehicleFactory._mesh(new THREE.BoxGeometry(0.14, 0.85, 0.14), carbonMat, [sx, 2.0, -3.1], fallbackGroup, true));
      const wing = VehicleFactory._mesh(new THREE.BoxGeometry(3.6, 0.1, 0.75), carbonMat, [0, 2.45, -3.1], fallbackGroup, true);
      wing.rotation.x = -0.18;
    }

    // Wheels
    const wheelPositions = [
      [-2.02, 0.42, 2.2],
      [ 2.02, 0.42, 2.2],
      [-2.02, 0.42,-2.0],
      [ 2.02, 0.42,-2.0],
    ];
    g._wheels = wheelPositions.map((pos, idx) =>
      VehicleFactory._buildWheel(pos, idx < 2, isPlayer, mainColor, silverMat, fallbackGroup));

    if (isPlayer) VehicleFactory._addPlayerEffects(g, carbonMat);

    // Load GLTF only on HIGH tier desktop
    if (isPlayer && Tier === 'HIGH') {
      VehicleFactory._loadGLTF(g, fallbackGroup);
    }

    g.frustumCulled = !isPlayer; // Never cull player car
    return g;
  }

  static _loadGLTF(g, fallbackGroup) {
    const loader = new THREE.GLTFLoader();
    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/gltf/');
    loader.setDRACOLoader(dracoLoader);
    loader.load(
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/models/gltf/ferrari.glb',
      (gltf) => {
        const carModel = gltf.scene;
        carModel.scale.set(1.5, 1.5, 1.5);
        carModel.rotation.y = Math.PI;
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff2800, metalness: 0.8, roughness: 0.1 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.8 });
        carModel.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.name.includes('body')) child.material = bodyMat;
            else if (child.name.includes('glass')) child.material = glassMat;
          }
        });
        fallbackGroup.visible = false;
        g.add(carModel);
      },
      undefined,
      () => { /* silently use fallback */ }
    );
  }

  static _mesh(geo, mat, pos, parent, castShadow = false) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    if (castShadow && !IsMobile) m.castShadow = true;
    m.receiveShadow = !IsMobile;
    parent.add(m);
    return m;
  }

  static _buildWheel(pos, isFront, isPlayer, mainColor, silverMat, parent) {
    const wg = new THREE.Group();
    const geos = getSharedGeos();

    const tire = new THREE.Mesh(geos.tire, _sharedBlackMat);
    tire.rotation.z = Math.PI / 2;
    wg.add(tire);

    const rimBase = new THREE.Mesh(geos.rimBase,
      new CarMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.4 }));
    rimBase.rotation.z = Math.PI / 2;
    wg.add(rimBase);

    // Spokes only on MED/HIGH
    if (Tier !== 'LOW') {
      const spokeCount = Tier === 'HIGH' ? 5 : 3;
      for (let s = 0; s < spokeCount; s++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.46, 0.26), silverMat);
        spoke.rotation.z = Math.PI / 2;
        const a = (s / spokeCount) * Math.PI * 2;
        spoke.position.set(0, Math.sin(a) * 0.17, Math.cos(a) * 0.17);
        wg.add(spoke);
      }
    }

    const cap = new THREE.Mesh(geos.cap,
      new CarMaterial({ color: isPlayer ? 0xFF6600 : mainColor, metalness: 0.8, roughness: 0.2 }));
    cap.rotation.z = Math.PI / 2;
    wg.add(cap);

    wg.position.set(pos[0], pos[1], pos[2]);
    parent.add(wg);
    return wg;
  }

  static _addPlayerEffects(g, carbonMat) {
    [-0.45, 0.45].forEach(ox => {
      const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.4, 8), carbonMat);
      ex.rotation.x = Math.PI / 2;
      ex.position.set(ox, 0.62, -3.52);
      g.add(ex);
    });

    const nosLight = new THREE.PointLight(0xff6600, 0, 30);
    nosLight.position.set(0, 0.6, -3.8);
    g.add(nosLight); g._nosLight = nosLight;

    // Second NOS light only on higher tiers
    if (Tier !== 'LOW') {
      const nosLight2 = new THREE.PointLight(0x0044ff, 0, 20);
      nosLight2.position.set(0, 0.4, -3.4);
      g.add(nosLight2); g._nosLight2 = nosLight2;
    }

    const beamL = new THREE.SpotLight(0xffeedd, 0, 120, Math.PI / 7, 0.3, 2);
    beamL.position.set(-1.4, 1.1, 3.45);
    beamL.target.position.set(-12, -5, 60);
    g.add(beamL); g.add(beamL.target); g._beamL = beamL;

    const beamR = new THREE.SpotLight(0xffeedd, 0, 120, Math.PI / 7, 0.3, 2);
    beamR.position.set(1.4, 1.1, 3.45);
    beamR.target.position.set(12, -5, 60);
    g.add(beamR); g.add(beamR.target); g._beamR = beamR;

    const glowLight = new THREE.PointLight(0xFF6600, 1.0, 10);
    glowLight.position.set(0, -0.1, 0);
    g.add(glowLight); g._glowLight = glowLight;

    // Flames only on MED/HIGH
    if (Tier !== 'LOW') {
      const flameGeo = new THREE.ConeGeometry(0.18, 2.0, 6);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0 });
      const flameL = new THREE.Mesh(flameGeo, flameMat.clone());
      flameL.position.set(-0.45, 0.62, -4.2);
      flameL.rotation.x = Math.PI / 2;
      g.add(flameL); g._flameL = flameL;
      const flameR = new THREE.Mesh(flameGeo, flameMat.clone());
      flameR.position.set(0.45, 0.62, -4.2);
      flameR.rotation.x = Math.PI / 2;
      g.add(flameR); g._flameR = flameR;
    }
  }
}

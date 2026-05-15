// ─── LIGHTING SYSTEM ──────────────────────────────────────────────────────
import { Config, IsMobile } from '../core/config.js';

export class LightingSystem {
  constructor(scene) {
    this._scene=scene; this._streetLights=[]; this._playerBeams=null;
    this._renderer=null; this._isNight=false;
    this._buildSunLight(); this._buildAmbLight();
  }
  init(renderer, streetLights, playerMesh) {
    this._renderer=renderer; this._streetLights=streetLights;
    this._playerBeams={ beamL:playerMesh._beamL, beamR:playerMesh._beamR };
    if (!IsMobile) {
      this._pmremGenerator=new THREE.PMREMGenerator(renderer);
      this._pmremGenerator.compileEquirectangularShader();
    }
  }
  get isNight() { return this._isNight; }
  toggleNight(sky, fogObj, starMat) {
    this._isNight=!this._isNight; const n=this._isNight; const C=Config;
    sky.material.color.setHex(n?0x020510:0x87CEEB);
    fogObj.color.setHex(n?C.RENDERER.FOG_COLOR_NIGHT:C.RENDERER.FOG_COLOR_DAY);
    fogObj.density=n?C.RENDERER.FOG_DENSITY_NIGHT:C.RENDERER.FOG_DENSITY_DAY;
    this._ambLight.intensity=n?C.LIGHTS.AMB_INTENSITY_NIGHT:C.LIGHTS.AMB_INTENSITY_DAY;
    this._sunLight.intensity=n?C.LIGHTS.SUN_INTENSITY_NIGHT:C.LIGHTS.SUN_INTENSITY_DAY;
    if (starMat) starMat.opacity=n?0.9:0;
    const streetI=n?C.LIGHTS.STREET_INTENSITY_NIGHT:0;
    this._streetLights.forEach(l=>{l.intensity=streetI;});
    if(this._playerBeams?.beamL){
      this._playerBeams.beamL.intensity=n?3:0;
      this._playerBeams.beamR.intensity=n?3:0;
    }
    if(this._renderer)
      this._renderer.toneMappingExposure=n?C.RENDERER.TONE_MAPPING_EXP_NIGHT:C.RENDERER.TONE_MAPPING_EXP;
  }
  updateBeamTargets(playerX,playerZ,fwd,right) {
    if(!this._playerBeams?.beamL) return;
    const {beamL,beamR}=this._playerBeams;
    beamL.target.position.set(playerX+fwd.x*60-right.x*8,-5,playerZ+fwd.z*60-right.z*8);
    beamR.target.position.set(playerX+fwd.x*60+right.x*8,-5,playerZ+fwd.z*60+right.z*8);
    beamL.target.updateMatrixWorld(); beamR.target.updateMatrixWorld();
  }
  _buildSunLight() {
    const C=Config.LIGHTS;
    this._sunLight=new THREE.DirectionalLight(0xfff5e0,C.SUN_INTENSITY_DAY);
    this._sunLight.position.set(200,400,100);
    if (!IsMobile) {
      this._sunLight.castShadow=true;
      const s=this._sunLight.shadow;
      s.mapSize.width=Config.RENDERER.SHADOW_MAP_SIZE;
      s.mapSize.height=Config.RENDERER.SHADOW_MAP_SIZE;
      s.camera.near=1; s.camera.far=1200;
      const r=Config.RENDERER.SHADOW_CAM_RANGE;
      s.camera.left=-r; s.camera.right=r; s.camera.top=r; s.camera.bottom=-r;
      s.bias=-0.001;
    }
    this._scene.add(this._sunLight);
  }
  _buildAmbLight() {
    this._ambLight=new THREE.HemisphereLight(0x87ceeb,0x2d5a27,Config.LIGHTS.AMB_INTENSITY_DAY);
    this._scene.add(this._ambLight);
  }
}

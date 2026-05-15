import { Config, WORLD_SIZE, ROAD_WIDTH } from '../core/config.js';
export function createRoadDetector() {
  const TILE=Config.WORLD.TILE_SIZE, HALF=ROAD_WIDTH/2;
  return function isOnRoad(x,z) {
    const pgx=Math.round((x+WORLD_SIZE/2)/TILE), pgz=Math.round((z+WORLD_SIZE/2)/TILE);
    for(let ix=pgx-1;ix<=pgx+1;ix++) if(ix%2===0&&Math.abs(x-(ix*TILE-WORLD_SIZE/2))<HALF) return true;
    for(let iz=pgz-1;iz<=pgz+1;iz++) if(iz%2===0&&Math.abs(z-(iz*TILE-WORLD_SIZE/2))<HALF) return true;
    return false;
  };
}

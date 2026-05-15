// ─── APEX CITY — CENTRALIZED CONFIGURATION ────────────────────────────────
// Performance tiers: LOW (old mobile), MED (mid mobile), HIGH (desktop)

const ua = navigator.userAgent;
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobi|tablet|kindle|silk/i.test(ua) || window.innerWidth < 800;

// Detect GPU tier: check for low-end indicators
const isLowEnd = (() => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return true;
  const dbgInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (!dbgInfo) return isMobile;
  const renderer = gl.getParameter(dbgInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
  // Known low-end GPU signatures
  return /adreno 3|adreno 4|mali-4|mali-t6|powervr sgx|sgx5|apple a[5-8]/i.test(renderer) || isMobile;
})();

const TIER = isMobile ? (isLowEnd ? 'LOW' : 'MED') : 'HIGH';

export const Tier = TIER;
export const IsMobile = isMobile;

export const Config = Object.freeze({

  // ── Renderer ─────────────────────────────────────────────────────────────
  RENDERER: {
    PIXEL_RATIO_MAX:  TIER === 'HIGH' ? 2 : TIER === 'MED' ? 1.5 : 1,
    SHADOW_MAP_SIZE:  TIER === 'HIGH' ? 1024 : 0,   // 0 = disabled
    SHADOW_CAM_RANGE: 400,
    TONE_MAPPING_EXP: 1.2,
    TONE_MAPPING_EXP_NIGHT: 0.55,
    FOG_COLOR_DAY:    0x0a1520,
    FOG_COLOR_NIGHT:  0x020510,
    FOG_DENSITY_DAY:  TIER === 'LOW' ? 0.004 : 0.0022,   // Denser fog = less to draw
    FOG_DENSITY_NIGHT: TIER === 'LOW' ? 0.005 : 0.003,
    FOG_DENSITY_RAIN:  TIER === 'LOW' ? 0.006 : 0.004,
    CLEAR_COLOR:      0x020408,
    BLOOM_STRENGTH:   1.0,
    BLOOM_RADIUS:     0.4,
    BLOOM_THRESHOLD:  0.8,
    TARGET_FPS:       TIER === 'LOW' ? 30 : 60,
    ENABLE_BLOOM:     TIER === 'HIGH',
    ENABLE_SHADOWS:   TIER === 'HIGH',
    ENABLE_AA:        TIER !== 'LOW',
  },

  // ── World ─────────────────────────────────────────────────────────────────
  WORLD: {
    TILE_SIZE:    80,
    GRID_SIZE:    TIER === 'HIGH' ? 14 : TIER === 'MED' ? 6 : 4,
    ROAD_WIDTH_FACTOR: 0.28,
    DOWNTOWN_DIST: 3.5,
    PARK_CHANCE:   TIER === 'LOW' ? 0.3 : 0.18,
    GAS_STATION_GX: 1.5,
    GAS_STATION_GZ: 1.5,
    // Draw distance multiplier — lower = fewer visible objects
    CULL_DISTANCE:  TIER === 'HIGH' ? 3000 : TIER === 'MED' ? 600 : 350,
  },

  // ── Physics ───────────────────────────────────────────────────────────────
  PHYSICS: {
    MAX_SPEED:            110,
    MAX_SPEED_OFFROAD:    45,
    MAX_SPEED_NOS:       160,
    ENGINE_FORCE:       2800,
    ENGINE_FORCE_NOS:   10000,
    BRAKE_FORCE:        4500,
    REVERSE_FORCE:       1000,
    DRAG:               0.985,
    DRAG_OFFROAD:       0.92,
    LATERAL_GRIP:       0.06,
    LATERAL_GRIP_DRIFT: 0.85,
    LATERAL_GRIP_RAIN:  0.15,
    STEER_MAX:          2.2,
    STEER_RATE:         2.4,
    STEER_RATE_DRIFT:   3.8,
    ENGINE_BRAKE:       40,
    COLLISION_BOUNCE:   0.15,
    DRIFT_LAT_THRESHOLD: 2.0,
    GEAR_THRESHOLDS:    [0, 12, 22, 35, 55, 80, 120],
    GEAR_MIN_SPEEDS:    [0,  0, 12, 22, 35, 55,  80],
    RPM_MIN:            800,
    RPM_MAX:           8500,
    RPM_IDLE:           800,
    RPM_DRIVE_BASE:    1200,
    SPEED_KMH_FACTOR:   10.08,
  },

  // ── NOS ───────────────────────────────────────────────────────────────────
  NOS: {
    CAPACITY:         100,
    DRAIN_RATE:        22,
    REGEN_RATE:         3,
    SPEED_THRESHOLD:    5,
    FLASH_ALPHA:      0.2,
  },

  // ── Camera ────────────────────────────────────────────────────────────────
  CAMERA: {
    FOV_DEFAULT:  70,
    FOV_COCKPIT:  95,
    FOV_CINEMA:   50,
    FOV_MAX_SPEED_ADD: 35,
    FOV_NOS_ADD:   25,
    FOLLOW_BACK_BASE:  18,
    FOLLOW_BACK_SPEED: 16,
    FOLLOW_HEIGHT_BASE: 5,
    FOLLOW_HEIGHT_SPEED: 2.5,
    SMOOTH_POS:  0.003,
    SMOOTH_LOOK: 0.002,
    NEAR: 0.5,
    FAR: TIER === 'HIGH' ? 3000 : TIER === 'MED' ? 600 : 350,
  },

  // ── Traffic ───────────────────────────────────────────────────────────────
  TRAFFIC: {
    COUNT:         TIER === 'HIGH' ? 25 : TIER === 'MED' ? 8 : 4,
    SPEED_MIN:     14,
    SPEED_MAX:     30,
    BRAKE_DIST:    22,
    CRASH_DIST:     7,
    TURN_TIMER_MIN: 2,
    TURN_TIMER_MAX: 6,
    COLORS: [0x2ecc71,0x9b59b6,0xf1c40f,0xe67e22,0x3498db,0x1abc9c,0xe74c3c,0xecf0f1],
    // Only update traffic AI every N frames on mobile to save CPU
    UPDATE_INTERVAL: TIER === 'LOW' ? 3 : 1,
  },

  // ── Fuel & Damage ─────────────────────────────────────────────────────────
  VEHICLE: {
    FUEL_CAPACITY:      100,
    FUEL_IDLE_DRAIN:    0.3,
    FUEL_SPEED_FACTOR:  0.025,
    FUEL_NOS_DRAIN:     0.5,
    DAMAGE_IMPACT_THRESHOLD: 4,
    DAMAGE_SPEED_FACTOR: 0.3,
    DAMAGE_WANTED_THRESH: 10,
    GAS_STATION_RADIUS:  9,
    GAS_FUEL_RATE:      28,
    GAS_DAMAGE_RATE:     8,
    GAS_NOS_RATE:       15,
    DAMAGE_MAX_SPEED_PCT: 0.7,
    DAMAGE_THRESH_PCT:   0.7,
  },

  // ── Missions ──────────────────────────────────────────────────────────────
  MISSIONS: {
    PICKUP_RADIUS:   7,
    DROPOFF_RADIUS:  7,
    FARE_AMOUNT:   500,
  },

  // ── Rain ──────────────────────────────────────────────────────────────────
  RAIN: {
    COUNT:         TIER === 'HIGH' ? 2500 : TIER === 'MED' ? 800 : 300,
    FALL_SPEED:    150,
    WIND_SPEED:     25,
    SPAWN_HEIGHT:   70,
    RADIUS:        100,
  },

  // ── Particles ─────────────────────────────────────────────────────────────
  PARTICLES: {
    MAX:           TIER === 'HIGH' ? 500 : TIER === 'MED' ? 80 : 30,
    SIZE:          1.8,
    DECAY: {
      spark: 5.0,
      fire:  2.5,
      nos:   3.0,
      smoke: 1.5,
    },
    SPREAD: {
      fire:  2.5,
      nos:   2.5,
      other: 5.0,
    },
    EXHAUST_INTERVAL_DRIFT:  0.04,
    EXHAUST_INTERVAL_NORMAL: 0.08,
    // Disable particles on low-end
    ENABLED: TIER !== 'LOW',
  },

  // ── Skid Marks ────────────────────────────────────────────────────────────
  SKIDMARKS: {
    MAX: TIER === 'HIGH' ? 2000 : TIER === 'MED' ? 400 : 0,
    WIDTH: 0.3,
    HEIGHT: 0.16,
    ENABLED: TIER !== 'LOW',
  },

  // ── Street Lights ─────────────────────────────────────────────────────────
  LIGHTS: {
    STREET_RANGE:      35,
    STREET_INTENSITY_NIGHT: 1.5,
    STREET_HEIGHT:     8,
    POLE_HEIGHT:       8,
    SUN_INTENSITY_DAY: 0.9,
    SUN_INTENSITY_NIGHT: 0.05,
    AMB_INTENSITY_DAY: 0.35,
    AMB_INTENSITY_NIGHT: 0.05,
    // Reduce active street lights on mobile
    LIGHTS_PER_INTERSECTION: TIER === 'HIGH' ? 2 : 0,  // 0 = skip street lights entirely on mobile
  },

  // ── Debug ─────────────────────────────────────────────────────────────────
  DEBUG: {
    ENABLED: false,
    FPS_INTERVAL: 0.5,
    SHOW_TIER: true,
  },

});

export const WORLD_SIZE = Config.WORLD.TILE_SIZE * Config.WORLD.GRID_SIZE;
export const ROAD_WIDTH  = Config.WORLD.TILE_SIZE * Config.WORLD.ROAD_WIDTH_FACTOR;

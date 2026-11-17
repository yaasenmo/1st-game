export const VIEW_W = 960;
export const VIEW_H = 540;

export const WORLD_W = 2000;
export const FLOOR_H = 200;
export const WALK_Y = 168;
export const FLOORS = [3, 4, 5, 6, 7];

export const ROOM_X = 1180;
export const ROOM_W = 400;
export const KEY_X = 1360;
export const DOOR_X = 1760;

export const PLAYER_START_X = 340;
export const CREATURE_START_X = -1080;

export const PLAYER_SPEED = 188;
export const CREATURE_BASE_SPEED = 124;
export const CREATURE_ACCEL = 1.25;
export const TIMER_SECONDS = 180;
export const PIXELS_PER_METER = 12.5;
export const CATCH_DISTANCE = 40;
export const CLIMB_CLOSE = 0.5;
export const STAIR_REACH = 72;
export const METER_MAX = 120;

export function floorTop(floor) {
  return 40 + (7 - floor) * FLOOR_H;
}

export function floorFeet(floor) {
  return floorTop(floor) + WALK_Y;
}

/** X of the stairs that lead up from this floor. Floor 7 has no stairs up. */
export function stairX(floor) {
  if (floor >= 7) return null;
  return floor % 2 === 1 ? 1840 : 160;
}

export const WORLD_H = floorTop(3) + FLOOR_H + 36;

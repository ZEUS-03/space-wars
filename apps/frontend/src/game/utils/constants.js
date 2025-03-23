export const PLAYER_LIFES = 3;
export const PLAYER_HEALTH = 100;
export const BASE_PATH =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost"
    ? "../../public/assets/"
    : "/assets/";
export const UI_PATH = BASE_PATH + "PNG/UI/";
export const METEOR_PATH = BASE_PATH + "PNG/Meteors/";


import { Vec2 } from "./utils/lib.js"

export const Game = {
  name: 'Hopkit',
  id: 'hopkit',
  isDev: (typeof nw !== "undefined" && nw.App.manifest.dev === true),
  /** @type {HTMLCanvasElement} */
  canvas: null,
  /** @type {HTMLInputElement} */
  textInput: null,
  /** @type {HTMLInputElement} */
  fileInput: null,
  /** @type {CanvasRenderingContext2D} */
  ctx: null,
  lastTimestamp: 0,
  dt: 0,
  fps: 0,
  recentFps: [],
  avgFps: 0,
  recentFrameTimes: [],
  minFrameTime: 0,
  maxFrameTime: 0,
  avgFrameTime: 0,
  dpr: 1,
  gameTime: 0,
  debugText: [],
  inputs: {},
  inputsClicked: {},
  inputsReleased: {},
  keybinds: {},
  keybindsClicked: {},
  keybindsReleased: {},
  mousePos: null,
  prevMousePos: null,
  mouseVel: null,
  setCursor: (type) => {document.documentElement.style.cursor = `url('assets/textures/cursors/${type}.png') 10 5, auto`},
  loading: null,
  loadingText: "",
  textures: {},
  fonts: {},
  debugToggles: [],
  ignoreNextDebugToggle: false,
  entities: {},
};

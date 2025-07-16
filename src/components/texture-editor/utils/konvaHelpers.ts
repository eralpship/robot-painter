// Konva utility functions and constants

export const DISPLAY_SIZE = 512
export const CANVAS_SIZE = 4096
export const SCALE_FACTOR = DISPLAY_SIZE / CANVAS_SIZE

export function getPixelRatio() {
  return window.devicePixelRatio || 1
}
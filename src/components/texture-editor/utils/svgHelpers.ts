// SVG utility functions and constants

export const CANVAS_SIZE = 4096

export function getPixelRatio() {
  return window.devicePixelRatio || 1
}

export function extractTransformValues(transform: string) {
  // Parse CSS transform string to extract translate, scale, rotate values
  const translateMatch = transform.match(/translate\(([^)]+)\)/)
  const scaleMatch = transform.match(/scale\(([^)]+)\)/)
  const rotateMatch = transform.match(/rotate\(([^)]+)deg\)/)
  
  const translate = translateMatch ? translateMatch[1].split(',').map(v => parseFloat(v.trim())) : [0, 0]
  const scale = scaleMatch ? scaleMatch[1].split(',').map(v => parseFloat(v.trim())) : [1, 1]
  const rotate = rotateMatch ? parseFloat(rotateMatch[1]) : 0
  
  return {
    x: translate[0],
    y: translate[1], 
    scaleX: scale[0],
    scaleY: scale.length > 1 ? scale[1] : scale[0],
    rotation: rotate
  }
}

export function calculateFontSize(width: number, height: number): number {
  // Calculate appropriate font size based on element dimensions
  return Math.min(width, height) * 0.8
}
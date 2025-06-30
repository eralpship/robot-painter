import { useRef, useEffect, useContext } from 'react'
import { OVERLAY_TEXTURE_SIZE, OverlayTextureContext } from '../contexts/overlay-texture-canvas-context'
import './TextureCanvasDisplay.css'

export function TextureCanvasDisplay({baseColor}:{baseColor: string}) {
  const { canvas: sourceCanvas } = useContext(OverlayTextureContext)!
  const displayCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const displayCanvas = displayCanvasRef.current
    if (!displayCanvas || !sourceCanvas) return

    const displayCtx = displayCanvas.getContext('2d')!
    
    const updateDisplay = () => {
      displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height)
      displayCtx.drawImage(sourceCanvas, 0, 0, displayCanvas.width, displayCanvas.height)
    }

    // Initial draw
    updateDisplay()

    // Set up periodic updates to reflect changes
    const interval = setInterval(updateDisplay, 100)
    return () => clearInterval(interval)
  }, [sourceCanvas])

  console.log('baseColor', baseColor)

  return (
    <div className="texture-canvas-display-container">
      <canvas 
        ref={displayCanvasRef}
        width={OVERLAY_TEXTURE_SIZE.width}
        height={OVERLAY_TEXTURE_SIZE.height}
        className="texture-canvas-display-canvas"
        style={{backgroundColor: baseColor}}
      />
    </div>
  )
} 
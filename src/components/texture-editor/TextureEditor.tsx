import { useCallback, useContext, useEffect, useRef } from 'react'
import { OverlayTextureContext } from '../../contexts/overlay-texture-canvas-context'
import PaintableUvSvg from './paintable_uv.svg?react'

export const CANVAS_SIZE = 4096;

interface TextureEditorProps {
  baseColor: string
  style?: React.CSSProperties
}

export function TextureEditor({ baseColor, style }: TextureEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const texture = useContext(OverlayTextureContext)
  
  const updateTexture = useCallback( () => {
    if (!texture) return
    texture.context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    if (svgRef.current) {
      const svgString = new XMLSerializer().serializeToString(svgRef.current)
      const img = new Image()
      img.onload = () => {
        texture.context.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE)
        texture.triggerTextureUpdate()
      }
      img.src = 'data:image/svg+xml;base64,' + btoa(svgString)
    }
  }, [])

  useEffect(() => {
    updateTexture()
    // TODO: draw only when something changes
    // const interval = setInterval(updateTexture, 100)
    // return () => clearInterval(interval)  
  }, [])

  return (
    <svg
      ref={svgRef}
      viewBox={ `0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}` }
      style={{ 
        backgroundColor: baseColor, 
        ...style
      }}
      xmlns="http://www.w3.org/2000/svg"
    >  
      <PaintableUvSvg 
        style={{
          width: '100%',
          height: '100%',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"'
        }}
      />
    </svg>
  )
}
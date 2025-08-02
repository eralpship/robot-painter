import { useCallback, useContext, useEffect, useRef } from 'react'
import { CANVAS_SIZE } from './utils/svgHelpers'
import { OverlayTextureContext } from '../../contexts/overlay-texture-canvas-context'
import PaintableUvSvg from './paintable_uv.svg?react'

interface TextureEditorProps {
  baseColor: string
  fontFamily?: string
}

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"' // Modern system font stack

export function TextureEditor({ baseColor }: TextureEditorProps) {
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
    const interval = setInterval(updateTexture, 100)
    return () => clearInterval(interval)  
  }, [])


  return (
        <svg
          ref={svgRef}
          viewBox={ `0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}` }
          style={{ 
            aspectRatio: '1 / 1',
            maxWidth: '100%', 
            maxHeight: '100%',
            backgroundColor: baseColor,
            overflow: 'visible',
          }}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >  
          <PaintableUvSvg 
            style={{
              width: '100%',
              height: '100%',
              fontFamily: fontFamily
            }}
          />
        </svg>
  )
}
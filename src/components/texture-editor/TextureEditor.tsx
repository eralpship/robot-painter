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
  
  const updateTexture = useCallback(() => {
    if (!texture || !svgRef.current) return
    
    const svgString = new XMLSerializer().serializeToString(svgRef.current)
    console.log('SVG string:', svgString.substring(0, 200) + '...')
    
    texture.image.onload = () => {
      console.log('SVG image loaded successfully, dimensions:', texture.image.width, 'x', texture.image.height)
      texture.triggerTextureUpdate()
    }
    texture.image.onerror = (error) => {
      console.error('Failed to load SVG as image:', error)
    }
    
    // Try URL encoding instead of base64
    const encodedSvg = encodeURIComponent(svgString)
    const dataUrl = `data:image/svg+xml,${encodedSvg}`
    console.log('Setting image src to:', dataUrl.substring(0, 100) + '...')
    texture.image.src = dataUrl
  }, [texture])

  useEffect(() => {
    updateTexture()
    // TODO: draw only when something changes
    // const interval = setInterval(updateTexture, 100)
    // return () => clearInterval(interval)  
  }, [])

  return (
    <svg
    width={CANVAS_SIZE}
      height={CANVAS_SIZE}
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
import { useCallback, useContext, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { OverlayTextureContext } from '../../contexts/overlay-texture-canvas-context'
import PaintableUvSvg from './paintable_uv.svg?react'

export const CANVAS_SIZE = 4096;

function serializeSvg(svgElement: SVGSVGElement, filterElements: string[] = []): string {
  const fullSvgString = new XMLSerializer().serializeToString(svgElement)
  if (filterElements.length === 0) {
    return fullSvgString
  }
  const labelPattern = filterElements.map(label => `${label}`).join('|')
  const filterRegex = new RegExp(`<[^>]*inkscape:label=['"](?:${labelPattern})['"][^>]*\/?>`, 'g')
  const cleanedSvgString = fullSvgString.replace(filterRegex, '')
  return cleanedSvgString
}

interface TextureEditorProps {
  baseColor: string
  style?: React.CSSProperties
}

export interface TextureEditorRef {
  updateTexture: () => void
}

export const TextureEditor = forwardRef<TextureEditorRef, TextureEditorProps>(({ baseColor, style }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const texture = useContext(OverlayTextureContext)
  
  const updateTexture = useCallback(() => {
    if (!texture || !svgRef.current) return
    const serializedSvg = serializeSvg(svgRef.current, ["stencil"])
    texture.image.onload = () => {
      texture.triggerTextureUpdate()
    }
    texture.image.onerror = (error) => {
      console.error('Failed to load SVG as image:', error)
    }
    const encodedSvg = encodeURIComponent(serializedSvg)
    const dataUrl = `data:image/svg+xml,${encodedSvg}`
    texture.image.src = dataUrl
  }, [texture])

  useImperativeHandle(ref, () => ({
    updateTexture
  }), [updateTexture])

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
})

TextureEditor.displayName = 'TextureEditor'
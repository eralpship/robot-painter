import { useCallback, useContext, useEffect, useRef } from 'react'
import { OverlayTextureContext } from '../../contexts/overlay-texture-canvas-context'
import StencilUvSvg from './paintable_uv.svg?react'
import {
  CANVAS_SIZE,
  TextureEditorContext,
} from '@/contexts/texture-editor-context'
import Moveable from 'react-moveable'

function serializeSvg(
  svgElement: SVGSVGElement,
  filterElements: string[] = []
): string {
  let svgString = new XMLSerializer().serializeToString(svgElement)

  // Remove background-color from root SVG element only (first occurrence)
  svgString = svgString.replace(
    /(<svg[^>]*style="[^"]*?)background-color:[^;"]*;?([^"]*")/,
    '$1$2'
  )

  // Filter out specific labeled elements
  if (filterElements.length > 0) {
    const labelPattern = filterElements.join('|')
    const filterRegex = new RegExp(
      `<[^>]*(?:inkscape:label=['"](?:${labelPattern})['"]|id=['"](?:${labelPattern})['"])[^>]*\/?>`,
      'g'
    )
    svgString = svgString.replace(filterRegex, '')
  }

  return svgString
}

export function TextureEditor({ style }: { style?: React.CSSProperties }) {
  const editorCtx = useContext(TextureEditorContext)
  const textureCtx = useContext(OverlayTextureContext)

  const svgRef = useRef<SVGSVGElement>(null)

  const updateTexture = useCallback(() => {
    if (!textureCtx || !svgRef.current) return
    const serializedSvg = serializeSvg(svgRef.current, [
      'stencil_left',
      'stencil_right',
      'stencil_front',
      'stencil_back',
      'stencil_lid',
    ])
    textureCtx.image.onload = () => {
      textureCtx.triggerTextureUpdate()
    }
    textureCtx.image.onerror = error => {
      console.error('Failed to load SVG as image:', error)
    }
    const encodedSvg = encodeURIComponent(serializedSvg)
    textureCtx.image.src = `data:image/svg+xml,${encodedSvg}`
  }, [])

  // This re-renders every time anyways, fix that?
  useEffect(() => {
    updateTexture()
  }, [editorCtx.backgroundColor, editorCtx.elements])

  const elementRefs = useRef<Map<string, SVGTextElement | SVGImageElement>>(
    new Map()
  )

  const handleOnMoveableActionEnd = useCallback(
    (target: SVGElement | HTMLElement) => {
      const id = target.getAttribute('id')
      if (!id) {
        return
      }
      const transform = target
        .computedStyleMap()
        .get('transform') as CSSTransformValue
      const translate = transform[0] as CSSTranslate
      const rotate = transform[2] as CSSRotate
      const scale = transform[3] as CSSScale

      editorCtx.updateElement(id, {
        position: {
          // assuming values are px
          x: (translate.x as CSSUnitValue).value,
          y: (translate.x as CSSUnitValue).value,
        },
        scale: {
          x: (scale.x as CSSUnitValue).value,
          y: (scale.x as CSSUnitValue).value,
        },
        // assuming values are deg
        rotation: (rotate.angle as CSSUnitValue).value,
      })

      updateTexture()
    },
    []
  )

  return (
    <>
      <svg
        ref={svgRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
        xmlns="http://www.w3.org/2000/svg"
        style={style}
      >
        <rect
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          fill={editorCtx.backgroundColor}
        />
        <StencilUvSvg style={{ width: '100%', height: '100%' }} />
        {Array.from(editorCtx.elements.entries()).map(([uuid, element]) => {
          switch (element.type) {
            case 'text':
              return (
                <text
                  ref={el => {
                    if (el) {
                      elementRefs.current.set(uuid, el)
                    } else {
                      elementRefs.current.delete(uuid)
                    }
                  }}
                  id={uuid}
                  key={uuid}
                  xmlSpace="preserve"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"',
                    fontWeight: 'bold',
                    fontSize: `${element.fontSize}px`,
                    fill: element.color,
                    cursor: 'pointer',
                    textAlign: 'center',
                    textAnchor: 'middle',
                  }}
                  transform={`rotate(${element.rotation}) translate(${element.position.x}, ${element.position.y}) scale(${element.scale.x}, ${element.scale.y})`}
                  onClick={() => editorCtx.setSelectedElementId(uuid)}
                >
                  {element.text}
                </text>
              )
            case 'image':
              return (
                <image
                  ref={el => {
                    if (el) {
                      elementRefs.current.set(uuid, el)
                    } else {
                      elementRefs.current.delete(uuid)
                    }
                  }}
                  id={uuid}
                  key={uuid}
                  xmlSpace="preserve"
                  href={element.base64data}
                  transform={`rotate(${element.rotation}) translate(${element.position.x}, ${element.position.y}) scale(${element.scale.x}, ${element.scale.y})`}
                  style={{
                    cursor: 'pointer',
                  }}
                  onClick={() => editorCtx.setSelectedElementId(uuid)}
                />
              )
            default:
              return null
          }
        })}
      </svg>
      <Moveable
        target={
          editorCtx.selectedElement?.uuid
            ? elementRefs.current.get(editorCtx.selectedElement.uuid) || null
            : null
        }
        svgOrigin="50% 50%"
        scalable
        draggable
        rotatable
        onScale={e => (e.target.style.cssText += e.cssText)}
        onDrag={e => (e.target.style.cssText += e.cssText)}
        onRotate={e => (e.target.style.cssText += e.cssText)}
        onDragEnd={e => handleOnMoveableActionEnd(e.target)}
        onScaleEnd={e => handleOnMoveableActionEnd(e.target)}
        onRotateEnd={e => handleOnMoveableActionEnd(e.target)}
      />
    </>
  )
}

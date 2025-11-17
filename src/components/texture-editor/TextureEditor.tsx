import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEventHandler,
} from 'react'
import {
  OverlayTextureContext,
  type OverlayTextureSides,
} from '../../contexts/overlay-texture-canvas-context'
import StencilUvSvgLid from './lid.svg?react'
import StencilUvSvgFront from './front.svg?react'
import StencilUvSvgBack from './back.svg?react'
import StencilUvSvgLeft from './left.svg?react'
import StencilUvSvgRight from './right.svg?react'

const stencilSideMap: Record<
  keyof OverlayTextureSides,
  typeof StencilUvSvgLid
> = {
  lid: StencilUvSvgLid,
  front: StencilUvSvgFront,
  back: StencilUvSvgBack,
  left: StencilUvSvgLeft,
  right: StencilUvSvgRight,
}

import {
  CANVAS_SIZE,
  TextureEditorContext,
  type TextureEditorElementPatch,
} from '@/contexts/texture-editor-context'
import Moveable from 'react-moveable'

function serializeSvg(
  svgElement: SVGSVGElement,
  filterElements: string[] = []
): string {
  let svgString = new XMLSerializer().serializeToString(svgElement)

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

export function TextureEditor({
  style,
  side,
}: {
  style?: React.CSSProperties
  side: keyof OverlayTextureSides
}) {
  const editorCtx = useContext(TextureEditorContext)
  const textureCtx = useContext(OverlayTextureContext)

  const svgRef = useRef<SVGSVGElement>(null)
  const moveableRef = useRef<Moveable>(null)

  const hidden = editorCtx.side !== side

  const updateTexture = useCallback(() => {
    if (!textureCtx || !svgRef.current) {
      return
    }
    const serializedSvg = serializeSvg(svgRef.current, [
      'stencil', // root element in the svg needs to have name "stencil" in inkscape
    ])
    const img = new Image()
    img.onload = () => {
      textureCtx.setSide(side, img)
    }
    img.onerror = error => {
      console.error('Failed to load SVG as image:', error)
    }
    const encodedSvg = encodeURIComponent(serializedSvg)
    img.src = `data:image/svg+xml,${encodedSvg}`
  }, [side])

  // This re-renders every time anyways, fix that?
  useEffect(() => {
    updateTexture()
  }, [editorCtx.backgroundColor, editorCtx.elements.size])

  const elementRefs = useRef<Map<string, SVGTextElement | SVGImageElement>>(
    new Map()
  )

  const [moveableKey, setMoveableKey] = useState('not-selected')

  const handleOnElementMouseDown = useCallback<MouseEventHandler<SVGElement>>(
    e => {
      const uuid = e.currentTarget.getAttribute('id')
      if (!uuid || editorCtx.selectedElement?.uuid === uuid) {
        return
      }
      editorCtx.setSelectedElementId(uuid)
      moveableRef.current?.waitToChangeTarget().then(() => {
        moveableRef.current?.dragStart(e.nativeEvent as MouseEvent)
      })
    },
    []
  )

  const handleOnMoveableActionEnd = useCallback(
    (target: SVGElement | HTMLElement) => {
      const uuid = target.getAttribute('id')
      if (!uuid) {
        return
      }
      const computedStyle = target.computedStyleMap()
      const transform = computedStyle?.get('transform')

      const patch: Pick<
        TextureEditorElementPatch,
        'position' | 'scale' | 'rotation'
      > = {}

      // Iterate through transforms and identify by type
      const transforms: string[] = []

      // Check if transform exists and is iterable
      if (transform && transform instanceof CSSTransformValue) {
        for (const component of transform) {
          if (component instanceof CSSTranslate) {
            patch.position = {
              x: component.x.to('px').value,
              y: component.y.to('px').value,
            }
            transforms.push(
              `translate(${patch.position.x}, ${patch.position.y})`
            )
          } else if (component instanceof CSSRotate) {
            patch.rotation = component.angle.to('deg').value
            transforms.push(`rotate(${patch.rotation})`)
          } else if (component instanceof CSSScale) {
            patch.scale = {
              x:
                typeof component.x === 'number'
                  ? component.x
                  : (component.x as CSSUnitValue).value,
              y:
                typeof component.y === 'number'
                  ? component.y
                  : (component.y as CSSUnitValue).value,
            }
            transforms.push(`scale(${patch.scale.x}, ${patch.scale.y})`)
          }
        }

        editorCtx.updateElement(uuid, patch)

        target.setAttribute('transform', transforms.join(', '))

        updateTexture()
        setMoveableKey(uuid)
      }
    },
    [editorCtx, updateTexture]
  )

  const StencilSvg = stencilSideMap[side]

  const elements = useMemo(
    () =>
      Array.from(editorCtx.elements.entries()).filter(
        ([, i]) => i.side === side
      ),
    [editorCtx.elements, side]
  )

  return (
    <>
      <svg
        display={hidden ? 'none' : undefined}
        ref={svgRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{
          ...style,
          userSelect: 'none',
          backgroundColor: editorCtx.backgroundColor,
        }}
      >
        <StencilSvg style={{ width: '100%', height: '100%' }} />
        {elements.map(([uuid, element]) => {
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
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                  transform={`rotate(${element.rotation}) translate(${element.position.x}, ${element.position.y}) scale(${element.scale.x}, ${element.scale.y})`}
                  onMouseDown={handleOnElementMouseDown}
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
                  xlinkHref={element.base64data} // Safari compatibility
                  x={-element.width / 2}
                  y={-element.height / 2}
                  width={element.width}
                  height={element.height}
                  transform={`rotate(${element.rotation}) translate(${element.position.x}, ${element.position.y}) scale(${element.scale.x}, ${element.scale.y})`}
                  style={{
                    cursor: 'pointer',
                  }}
                  onMouseDown={handleOnElementMouseDown}
                  onError={(e) => {
                    console.error('SVG image failed to render:', uuid, e)
                  }}
                />
              )
            default:
              return null
          }
        })}
      </svg>
      <Moveable
        key={moveableKey}
        ref={moveableRef}
        target={
          editorCtx.selectedElement?.uuid
            ? elementRefs.current.get(editorCtx.selectedElement.uuid) || null
            : null
        }
        svgOrigin="50% 50%"
        scalable
        draggable
        rotatable
        keepRatio
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

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
} from '@/contexts/texture-editor-context'
import { toSVGTransform, extractCanonicalTransform } from '@/utils/transforms'
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

  // Update texture when backgroundColor or elements change
  useEffect(() => {
    updateTexture()
  }, [editorCtx.backgroundColor, editorCtx.elements, updateTexture])

  // Notify context when editor is ready (SVG is mounted)
  useEffect(() => {
    if (svgRef.current && !hidden) {
      console.log('[TextureEditor] SVG mounted and visible for side:', side)
      editorCtx.notifyEditorReady()
    }
  }, [hidden, side, editorCtx])

  const elementRefs = useRef<Map<string, SVGTextElement | SVGImageElement>>(
    new Map()
  )

  const [moveableKey, setMoveableKey] = useState('not-selected')

  const handleOnElementMouseDown = useCallback<MouseEventHandler<SVGElement>>(
    e => {
      e.stopPropagation() // Prevent SVG background click from firing
      const uuid = e.currentTarget.getAttribute('id')
      if (!uuid || editorCtx.selectedElement?.uuid === uuid) {
        return
      }
      editorCtx.setSelectedElementId(uuid)
      moveableRef.current?.waitToChangeTarget().then(() => {
        moveableRef.current?.dragStart(e.nativeEvent as MouseEvent)
      })
    },
    [editorCtx]
  )

  const handleSvgBackgroundClick = useCallback<MouseEventHandler<SVGSVGElement>>(
    e => {
      // Only deselect if clicking directly on SVG background, not bubbled from child elements
      if (e.target === e.currentTarget) {
        console.log('[TextureEditor] Clicking SVG background, deselecting element')
        editorCtx.setSelectedElementId(undefined)
      }
    },
    [editorCtx]
  )

  const handleOnMoveableActionEnd = useCallback(
    (target: SVGElement | HTMLElement) => {
      console.log('[TextureEditor] handleOnMoveableActionEnd called')
      const uuid = target.getAttribute('id')
      if (!uuid) {
        console.warn('[TextureEditor] No UUID found on target element')
        return
      }

      console.log('[TextureEditor] Processing element:', uuid)
      console.log('[TextureEditor] Target element:', target)
      console.log('[TextureEditor] Current transform attribute:', target.getAttribute('transform'))
      console.log('[TextureEditor] Current style.transform:', (target as HTMLElement).style.transform)

      // Check if Moveable actually applied any CSS transforms
      const cssTransform = (target as HTMLElement).style.transform
      if (!cssTransform || cssTransform.trim() === '') {
        console.log('[TextureEditor] No CSS transform applied, skipping update (likely just a selection)')
        return
      }

      // Extract canonical transform from the element
      const transform = extractCanonicalTransform(target as SVGElement)
      if (!transform) {
        console.error('[TextureEditor] Failed to extract transform!')
        return
      }

      console.log('[TextureEditor] Extracted transform:', transform)

      // Update element with canonical format
      console.log('[TextureEditor] Updating element in context...')
      editorCtx.updateElement(uuid, { transform })

      // Update SVG attribute for immediate visual feedback
      const svgTransform = toSVGTransform(transform)
      console.log('[TextureEditor] Setting SVG transform attribute to:', svgTransform)
      target.setAttribute('transform', svgTransform)

      // Clear CSS transform now that we've saved it to SVG attribute
      ;(target as HTMLElement).style.transform = ''

      console.log('[TextureEditor] Updating texture...')
      updateTexture()
      setMoveableKey(uuid)
      console.log('[TextureEditor] handleOnMoveableActionEnd complete')
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
        onClick={handleSvgBackgroundClick}
      >
        <StencilSvg style={{ width: '100%', height: '100%' }} />
        {elements.map(([uuid, element]) => {
          switch (element.type) {
            case 'text':
              const textTransform = toSVGTransform(element.transform)
              console.log('[TextureEditor] Rendering text element:', {
                uuid,
                text: element.text,
                transform: element.transform,
                svgTransform: textTransform
              })
              return (
                <text
                  ref={el => {
                    if (el) {
                      elementRefs.current.set(uuid, el)
                      console.log('[TextureEditor] Text element ref set:', uuid)
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
                    dominantBaseline: 'middle',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                  transform={textTransform}
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
                  transform={toSVGTransform(element.transform)}
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

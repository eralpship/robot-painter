import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react'
import { OverlayTextureContext } from '../../contexts/overlay-texture-canvas-context'
import PaintableUvSvg from './paintable_uv.svg?react'

export const CANVAS_SIZE = 4096

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

interface ElementProperties {
  type: 'text'
  text: string
}

interface TextureEditorProps {
  style?: React.CSSProperties
  onSelectedElement?: (svgElementId: string, properties: ElementProperties) => void
}

export interface TextureEditorRef {
  updateTexture: () => void
  setBaseColor: (color: string) => void
  updateElement: (identifier: string, properties: Partial<ElementProperties>) => void
}

export const TextureEditor = forwardRef<TextureEditorRef, TextureEditorProps>(
  ({ style, onSelectedElement }, ref) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const texture = useContext(OverlayTextureContext)

    const updateTexture = useCallback(() => {
      if (!texture || !svgRef.current) return
      const serializedSvg = serializeSvg(svgRef.current, [
        'stencil_left',
        'stencil_right',
        'stencil_front',
        'stencil_back',
        'stencil_lid',
        'frame',
        'selection-rect',
      ])
      texture.image.onload = () => texture.triggerTextureUpdate()
      texture.image.onerror = error =>
        console.error('Failed to load SVG as image:', error)
      const encodedSvg = encodeURIComponent(serializedSvg)
      const dataUrl = `data:image/svg+xml,${encodedSvg}`
      texture.image.src = dataUrl
    }, [texture])

    const [baseColor, setBaseColor] = useState('#ffffff')
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

    const updateElement = useCallback((identifier: string, properties: Partial<ElementProperties>) => {
      const element = paintableUvSvgRef.current?.querySelector(`[inkscape\\:label="${identifier}"]`) as SVGTextElement
      if (!element) {
        console.error('Element not found:', identifier)
        return
      }

      // Update text content
      if (properties.text !== undefined) {
        const tspan = element.querySelector('tspan')
        if (tspan) {
          tspan.textContent = properties.text
        }
        
        // Update texture after text change
        setTimeout(() => {
          updateTexture()
        }, 10)
      }
    }, [updateTexture])

    useImperativeHandle(
      ref,
      () => ({
        updateTexture,
        setBaseColor,
        updateElement,
      }),
      [updateTexture, updateElement]
    )

    useEffect(() => {
      updateTexture()
      // TODO: draw only when something changes
      // const interval = setInterval(updateTexture, 100)
      // return () => clearInterval(interval)
    }, [])

    const selectionRectRef = useRef<SVGRectElement | null>(null)
    const paintableUvSvgRef = useRef<SVGSVGElement | null>(null)
    const makeInteractive = useCallback((element: SVGTextElement) => {
      console.log({ id: element.id })
      if (!element) {
        console.error('element was falsy')
        return
      }

      // Check if already made interactive to avoid duplicate listeners
      if ((element as any)._isInteractive) {
        console.log(
          'Element already interactive, skipping:',
          element.getAttribute('inkscape:label')
        )
        return
      }
      ;(element as any)._isInteractive = true

      let isDragging = false
      let dragStartMousePos = { x: 0, y: 0 }
      let dragStartElementPos = { x: 0, y: 0 }

      const updateSelectionRect = () => {
        // Get bbox and update selection rectangle
        const bbox = element.getBBox({
          fill: true,
          stroke: true,
          markers: true,
        })
        const parentSvg = svgRef.current
        if (parentSvg) {
          const ctm = element.getCTM()
          if (ctm) {
            const corners = [
              { x: bbox.x, y: bbox.y },
              { x: bbox.x + bbox.width, y: bbox.y },
              { x: bbox.x, y: bbox.y + bbox.height },
              { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
            ]

            const transformedCorners = corners.map(corner => {
              const point = parentSvg.createSVGPoint()
              point.x = corner.x
              point.y = corner.y
              return point.matrixTransform(ctm)
            })

            const xs = transformedCorners.map(p => p.x)
            const ys = transformedCorners.map(p => p.y)

            const normalizedBbox = {
              x: Math.min(...xs),
              y: Math.min(...ys),
              width: Math.max(...xs) - Math.min(...xs),
              height: Math.max(...ys) - Math.min(...ys),
            }

            if (selectionRectRef.current) {
              selectionRectRef.current.setAttribute(
                'x',
                normalizedBbox.x.toString()
              )
              selectionRectRef.current.setAttribute(
                'y',
                normalizedBbox.y.toString()
              )
              selectionRectRef.current.setAttribute(
                'width',
                normalizedBbox.width.toString()
              )
              selectionRectRef.current.setAttribute(
                'height',
                normalizedBbox.height.toString()
              )
            }
          }
        }
      }

      const mouseDownHandler = (e: MouseEvent) => {
        const elementId = element.getAttribute('inkscape:label') || element.id
        console.log('MOUSEDOWN on element:', elementId, 'isDragging was:', isDragging)
        
        isDragging = true
        element.style.cursor = 'grabbing'

        // Record starting positions
        dragStartMousePos = { x: e.clientX, y: e.clientY }
        dragStartElementPos = {
          x: parseFloat(element.getAttribute('x') || '0'),
          y: parseFloat(element.getAttribute('y') || '0'),
        }

        // Store globally for SVG mousemove handler
        ;(svgRef.current as any)._draggedElement = element
        ;(svgRef.current as any)._isDragging = true
        ;(svgRef.current as any)._dragStartMousePos = dragStartMousePos
        ;(svgRef.current as any)._dragStartElementPos = dragStartElementPos

        // Report selection to parent
        setSelectedElementId(elementId)
        if (onSelectedElement && elementId) {
          const tspan = element.querySelector('tspan')
          const currentText = tspan?.textContent || ''
          onSelectedElement(elementId, {
            type: 'text',
            text: currentText
          })
        }

        updateSelectionRect()
        e.preventDefault()
        e.stopPropagation()
      }

      const dragEndHandler = () => {
        console.log(
          'DRAG END event received for:',
          element.getAttribute('inkscape:label')
        )
        isDragging = false
        
        // Trigger texture update after drag ends
        updateTexture()
      }

      // Set up MutationObserver to watch for changes to this element
      const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            // Only update texture for position changes if we're not currently dragging
            if (mutation.attributeName === 'x' || mutation.attributeName === 'y') {
              if (!isDragging) {
                console.log('Position changed for:', element.getAttribute('inkscape:label'), '(not dragging)')
                shouldUpdate = true
              } else {
                console.log('Position changed for:', element.getAttribute('inkscape:label'), '(dragging - skipping update)')
              }
            }
          } else if (mutation.type === 'childList' || mutation.type === 'characterData') {
            // Always update for text content changes
            console.log('Content changed for:', element.getAttribute('inkscape:label'))
            shouldUpdate = true
          }
        })
        
        if (shouldUpdate) {
          // Debounce the updates to avoid excessive calls
          setTimeout(() => {
            updateTexture()
          }, 50)
        }
      })
      
      // Observe the text element and its children (tspan)
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['x', 'y'],
        childList: true,
        subtree: true,
        characterData: true
      })
      
      // Store observer for cleanup if needed
      ;(element as any)._mutationObserver = observer

      element.addEventListener('mousedown', mouseDownHandler)
      element.addEventListener('dragEnd', dragEndHandler)
      element.style.cursor = 'grab'
    }, [onSelectedElement, updateTexture])
    useEffect(() => {
      const svg = paintableUvSvgRef.current
      if (!svg) {
        console.error('svg was falsy')
        return
      }
      const children = svg.querySelectorAll('text')
      children.forEach(makeInteractive)

      // Handle drag movement on the background rect
      const parentSvg = svgRef.current
      if (parentSvg) {
        parentSvg.addEventListener('mousemove', e => {
          const draggedElement = (parentSvg as any)._draggedElement
          const isDragging = (parentSvg as any)._isDragging
          const startMousePos = (parentSvg as any)._dragStartMousePos
          const startElementPos = (parentSvg as any)._dragStartElementPos

          if (
            isDragging &&
            draggedElement &&
            startMousePos &&
            startElementPos
          ) {
            console.log(
              'MOUSEMOVE - dragging element:',
              draggedElement.getAttribute('inkscape:label')
            )
            // Calculate mouse movement delta in screen coordinates
            const deltaX = e.clientX - startMousePos.x
            const deltaY = e.clientY - startMousePos.y

            // Convert screen delta to SVG coordinates
            const rect = parentSvg.getBoundingClientRect()
            let svgDeltaX = deltaX * (CANVAS_SIZE / rect.width)
            let svgDeltaY = deltaY * (CANVAS_SIZE / rect.height)

            // Account for element transforms (like scale(-1) for flipped elements)
            const dragCtm = draggedElement.getCTM()
            if (dragCtm) {
              // Apply inverse transform to the delta to get movement in element's coordinate system
              const point = parentSvg.createSVGPoint()
              point.x = svgDeltaX
              point.y = svgDeltaY

              // Get the transformation matrix without translation
              const transformMatrix = parentSvg.createSVGMatrix()
              transformMatrix.a = dragCtm.a // x-scale
              transformMatrix.b = dragCtm.b // x-skew
              transformMatrix.c = dragCtm.c // y-skew
              transformMatrix.d = dragCtm.d // y-scale
              // Don't include e,f (translation) since we only want scale/rotation effects

              const transformedDelta = point.matrixTransform(
                transformMatrix.inverse()
              )
              svgDeltaX = transformedDelta.x
              svgDeltaY = transformedDelta.y
            }

            // Update element position
            const newX = startElementPos.x + svgDeltaX
            const newY = startElementPos.y + svgDeltaY

            draggedElement.setAttribute('x', newX.toString())
            draggedElement.setAttribute('y', newY.toString())

            // Update tspan position too
            const tspan = draggedElement.querySelector('tspan')
            if (tspan) {
              tspan.setAttribute('x', newX.toString())
              tspan.setAttribute('y', newY.toString())
            }

            // Update selection rectangle
            const bbox = draggedElement.getBBox({
              fill: true,
              stroke: true,
              markers: true,
            })
            const selectionCtm = draggedElement.getCTM()
            if (selectionCtm) {
              const corners = [
                { x: bbox.x, y: bbox.y },
                { x: bbox.x + bbox.width, y: bbox.y },
                { x: bbox.x, y: bbox.y + bbox.height },
                { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
              ]

              const transformedCorners = corners.map(corner => {
                const point = parentSvg.createSVGPoint()
                point.x = corner.x
                point.y = corner.y
                return point.matrixTransform(selectionCtm)
              })

              const xs = transformedCorners.map(p => p.x)
              const ys = transformedCorners.map(p => p.y)

              const normalizedBbox = {
                x: Math.min(...xs),
                y: Math.min(...ys),
                width: Math.max(...xs) - Math.min(...xs),
                height: Math.max(...ys) - Math.min(...ys),
              }

              if (selectionRectRef.current) {
                selectionRectRef.current.setAttribute(
                  'x',
                  normalizedBbox.x.toString()
                )
                selectionRectRef.current.setAttribute(
                  'y',
                  normalizedBbox.y.toString()
                )
                selectionRectRef.current.setAttribute(
                  'width',
                  normalizedBbox.width.toString()
                )
                selectionRectRef.current.setAttribute(
                  'height',
                  normalizedBbox.height.toString()
                )
              }
            }
          }
        })

        parentSvg.addEventListener('mouseup', () => {
          const draggedElement = (parentSvg as any)._draggedElement
          console.log(
            'MOUSEUP - ending drag for:',
            draggedElement?.getAttribute('inkscape:label')
          )
          if (draggedElement) {
            draggedElement.style.cursor = 'grab'

            // Reset local state for the dragged element
            // We need to trigger a custom event to reset the local isDragging
            draggedElement.dispatchEvent(new CustomEvent('dragEnd'))
          }
          ;(parentSvg as any)._isDragging = false
          ;(parentSvg as any)._draggedElement = null
          ;(parentSvg as any)._dragStartMousePos = null
          ;(parentSvg as any)._dragStartElementPos = null
        })
      }
    }, [])

    return (
      <svg
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
        style={{
          backgroundColor: baseColor,
          ...style,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="0"
          y="0"
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          fill="transparent"
          stroke="none"
          style={{ pointerEvents: 'all' }}
        />
        <PaintableUvSvg
          ref={paintableUvSvgRef}
          style={{
            userSelect: 'none',
            width: '100%',
            height: '100%',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"',
          }}
        />
        <rect
          ref={selectionRectRef}
          id="selection-rect"
          x="100"
          y="100"
          width="200"
          height="100"
          fill="transparent"
          stroke="#ff0000"
          strokeWidth="5"
          style={{ pointerEvents: 'none' }}
        />
      </svg>
    )
  }
)

TextureEditor.displayName = 'TextureEditor'

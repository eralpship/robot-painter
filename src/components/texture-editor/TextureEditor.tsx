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
import { useTexturePersistence } from '../../hooks/useTexturePersistence'

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
  fontSize: number
  rotation: number
  color: string
}

interface TextureEditorProps {
  style?: React.CSSProperties
  onSelectedElement?: (
    svgElementId: string,
    properties: ElementProperties
  ) => void
}

export interface TextureEditorRef {
  updateTexture: () => void
  setBaseColor: (color: string) => void
  updateElement: (
    identifier: string,
    properties: Partial<ElementProperties>
  ) => void
  addText: () => void
  addImage: (base64image: string) => void
  removeElement: (identifier?: string) => void
  saveTexture: () => void
  loadTexture: () => void
}

export const TextureEditor = forwardRef<TextureEditorRef, TextureEditorProps>(
  ({ style, onSelectedElement }, ref) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const selectionRectRef = useRef<SVGRectElement | null>(null)
    const paintableUvSvgRef = useRef<SVGSVGElement | null>(null)
    const makeInteractiveRef = useRef<
      ((element: SVGTextElement | SVGImageElement) => void) | null
    >(null)
    const texture = useContext(OverlayTextureContext)
    const { saveTexture, loadTexture } = useTexturePersistence()

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

    const updateElement = useCallback(
      (identifier: string, properties: Partial<ElementProperties>) => {
        const element = paintableUvSvgRef.current?.querySelector(
          `[inkscape\\:label="${identifier}"]`
        ) as SVGTextElement
        if (!element) {
          console.error('Element not found:', identifier)
          return
        }

        let shouldUpdate = false

        // Update text content
        if (properties.text !== undefined) {
          const tspan = element.querySelector('tspan')
          if (tspan) {
            tspan.textContent = properties.text
          }
          shouldUpdate = true
        }

        // Update font size
        if (properties.fontSize !== undefined) {
          const tspan = element.querySelector('tspan')
          if (tspan) {
            tspan.setAttribute(
              'style',
              tspan.getAttribute('style')?.replace(/font-size:[^;]*;?/g, '') +
                `font-size:${properties.fontSize}px;`
            )
          }
          shouldUpdate = true
        }

        // Update rotation
        if (properties.rotation !== undefined) {
          const currentTransform = element.getAttribute('transform') || ''

          // Remove any existing rotation from transform
          const withoutRotation = currentTransform
            .replace(/rotate\([^)]*\)/g, '')
            .trim()

          // Calculate element center for rotation pivot
          const bbox = element.getBBox({
            fill: true,
            stroke: true,
            markers: true,
          })
          const centerX = bbox.x + bbox.width / 2
          const centerY = bbox.y + bbox.height / 2

          // Add new rotation if not zero, using element center as pivot
          const newTransform =
            properties.rotation !== 0
              ? `${withoutRotation} rotate(${properties.rotation} ${centerX} ${centerY})`.trim()
              : withoutRotation

          if (newTransform) {
            element.setAttribute('transform', newTransform)
          } else {
            element.removeAttribute('transform')
          }
          shouldUpdate = true
        }

        // Update color
        if (properties.color !== undefined) {
          const tspan = element.querySelector('tspan')
          if (tspan) {
            tspan.setAttribute('fill', properties.color)
          }
          shouldUpdate = true
        }

        if (shouldUpdate) {
          // Update selection rectangle to match new dimensions
          setTimeout(() => {
            // Find the element's selection rect updater
            const parentSvg = svgRef.current
            if (parentSvg && selectionRectRef.current) {
              const bbox = element.getBBox({
                fill: true,
                stroke: true,
                markers: true,
              })
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

            // Update texture after changes
            updateTexture()
          }, 10)
        }
      },
      [updateTexture]
    )

    const [addTextFunction, setAddTextFunction] = useState<(() => void) | null>(
      null
    )
    const [removeElementFunction, setRemoveElementFunction] = useState<
      ((identifier?: string) => void) | null
    >(null)

    const [addImageInternal, setAddImageInternal] = useState<
      ((base64image?: string) => void) | null
    >(null)

    const handleSaveTexture = useCallback(() => {
      if (!svgRef.current) {
        console.error('SVG not available for saving')
        return
      }
      const serializedSvg = serializeSvg(svgRef.current, [])
      saveTexture(serializedSvg)
    }, [saveTexture])

    const handleLoadTexture = useCallback(() => {
      const savedSvg = loadTexture()
      if (!savedSvg || !svgRef.current) {
        console.error('No saved texture or SVG not available')
        return
      }

      // Parse the saved SVG and restore it
      const parser = new DOMParser()
      const doc = parser.parseFromString(savedSvg, 'image/svg+xml')
      const savedSvgElement = doc.documentElement as unknown as SVGSVGElement

      // Replace the current SVG's innerHTML with the saved one
      if (svgRef.current && savedSvgElement) {
        svgRef.current.innerHTML = savedSvgElement.innerHTML

        // Re-query and update refs to the newly loaded DOM elements
        const newSelectionRect = svgRef.current.querySelector(
          '#selection-rect'
        ) as SVGRectElement
        if (newSelectionRect) {
          selectionRectRef.current = newSelectionRect
        }

        const newPaintableUvSvg = svgRef.current.querySelector(
          'svg'
        ) as SVGSVGElement
        if (newPaintableUvSvg) {
          paintableUvSvgRef.current = newPaintableUvSvg
        }

        // Re-attach event listeners to all loaded elements
        // Query from the newly loaded svgRef, not the stale paintableUvSvgRef
        if (svgRef.current && makeInteractiveRef.current) {
          const textElements = svgRef.current.querySelectorAll('text')
          const imageElements = svgRef.current.querySelectorAll('image')

          textElements.forEach(element =>
            makeInteractiveRef.current?.(element as SVGTextElement)
          )
          imageElements.forEach(element =>
            makeInteractiveRef.current?.(element as SVGImageElement)
          )
        }

        updateTexture()
      }
    }, [loadTexture, updateTexture])

    useImperativeHandle(
      ref,
      () => ({
        updateTexture,
        setBaseColor,
        updateElement,
        addText:
          addTextFunction || (() => console.log('addText not ready yet')),
        addImage:
          addImageInternal || (() => console.log('addImage not ready yet')),
        removeElement:
          removeElementFunction ||
          (() => console.log('removeElement not ready yet')),
        saveTexture: handleSaveTexture,
        loadTexture: handleLoadTexture,
      }),
      [
        updateTexture,
        updateElement,
        addTextFunction,
        removeElementFunction,
        handleSaveTexture,
        handleLoadTexture,
      ]
    )

    useEffect(() => {
      updateTexture()
      // TODO: draw only when something changes
      // const interval = setInterval(updateTexture, 100)
      // return () => clearInterval(interval)
    }, [])

    const makeInteractive = useCallback(
      (element: SVGTextElement | SVGImageElement) => {
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

        const mouseDownHandler = (e: Event) => {
          const mouseEvent = e as MouseEvent
          const elementId = element.getAttribute('inkscape:label') || element.id
          console.log(
            'MOUSEDOWN on element:',
            elementId,
            'isDragging was:',
            isDragging
          )

          isDragging = true
          element.style.cursor = 'grabbing'

          // Record starting positions
          dragStartMousePos = { x: mouseEvent.clientX, y: mouseEvent.clientY }
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
          if (onSelectedElement && elementId) {
            const tspan = element.querySelector('tspan')
            const currentText = tspan?.textContent || ''

            // Extract current font size from style attribute
            const currentStyle = tspan?.getAttribute('style') || ''
            const fontSizeMatch = currentStyle.match(
              /font-size:\s*(\d+(?:\.\d+)?)px/
            )
            const currentFontSize = fontSizeMatch
              ? parseFloat(fontSizeMatch[1])
              : 192 // Default from SVG

            // Extract current rotation from transform attribute
            const currentTransform = element.getAttribute('transform') || ''
            const rotationMatch = currentTransform.match(/rotate\(([^,\s]+)/)
            const currentRotation = rotationMatch
              ? parseFloat(rotationMatch[1])
              : 0

            // Extract current color from fill attribute
            const currentColor = tspan?.getAttribute('fill') || '#000000' // Default to black

            onSelectedElement(elementId, {
              type: 'text',
              text: currentText,
              fontSize: currentFontSize,
              rotation: currentRotation,
              color: currentColor,
            })
          }

          updateSelectionRect()
          mouseEvent.preventDefault()
          mouseEvent.stopPropagation()
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
        const observer = new MutationObserver(mutations => {
          let shouldUpdate = false

          mutations.forEach(mutation => {
            if (mutation.type === 'attributes') {
              // Only update texture for position changes if we're not currently dragging
              if (
                mutation.attributeName === 'x' ||
                mutation.attributeName === 'y'
              ) {
                if (!isDragging) {
                  console.log(
                    'Position changed for:',
                    element.getAttribute('inkscape:label'),
                    '(not dragging)'
                  )
                  shouldUpdate = true
                } else {
                  console.log(
                    'Position changed for:',
                    element.getAttribute('inkscape:label'),
                    '(dragging - skipping update)'
                  )
                }
              }
            } else if (
              mutation.type === 'childList' ||
              mutation.type === 'characterData'
            ) {
              // Always update for text content changes
              console.log(
                'Content changed for:',
                element.getAttribute('inkscape:label')
              )
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
          characterData: true,
        })

        // Store observer for cleanup if needed
        ;(element as any)._mutationObserver = observer

        element.addEventListener('mousedown', mouseDownHandler)
        element.addEventListener('dragEnd', dragEndHandler)
        element.style.cursor = 'grab'
      },
      [onSelectedElement, updateTexture]
    )

    // Store makeInteractive in ref for use in handleLoadTexture
    makeInteractiveRef.current = makeInteractive

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

      // Set up addText function now that makeInteractive is available
      setAddTextFunction(() => () => {
        const svg = paintableUvSvgRef.current
        if (!svg) {
          console.error('SVG not available')
          return
        }

        // Create unique ID for new text element
        const timestamp = Date.now()
        const newTextId = `text_custom_${timestamp}`

        // Get SVG center coordinates
        const centerX = CANVAS_SIZE / 2
        const centerY = CANVAS_SIZE / 2

        // Create new text element with structure matching existing ones
        const newTextElement = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text'
        )
        newTextElement.setAttribute('xml:space', 'preserve')
        newTextElement.setAttribute(
          'style',
          'font-style:normal;font-variant:normal;font-weight:bold;font-stretch:normal;font-size:192px;font-variant-ligatures:normal;font-variant-caps:normal;font-variant-numeric:normal;font-variant-east-asian:normal;text-align:start;writing-mode:lr-tb;direction:ltr;text-anchor:start;fill:#000000;fill-opacity:1;stroke:none;stroke-width:30;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1;paint-order:normal'
        )
        newTextElement.setAttribute('x', centerX.toString())
        newTextElement.setAttribute('y', centerY.toString())
        newTextElement.setAttribute('id', newTextId)
        newTextElement.setAttribute('inkscape:label', newTextId)

        // Create tspan element
        const tspan = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'tspan'
        )
        tspan.setAttribute('sodipodi:role', 'line')
        tspan.setAttribute('id', `tspan_${timestamp}`)
        tspan.setAttribute('x', centerX.toString())
        tspan.setAttribute('y', centerY.toString())
        tspan.setAttribute('style', 'text-align:center;text-anchor:middle')
        tspan.textContent = 'Sample Text'

        newTextElement.appendChild(tspan)
        svg.appendChild(newTextElement)

        // Make the new element interactive
        makeInteractive(newTextElement as SVGTextElement)

        // Immediately select the new element by calling the selection callback directly
        setTimeout(() => {
          if (onSelectedElement) {
            onSelectedElement(newTextId, {
              type: 'text',
              text: 'Sample Text',
              fontSize: 192,
              rotation: 0,
              color: '#000000',
            })
          }

          // Update selection rectangle to show the new element
          const bbox = newTextElement.getBBox({
            fill: true,
            stroke: true,
            markers: true,
          })
          const parentSvg = svgRef.current
          if (parentSvg && selectionRectRef.current) {
            selectionRectRef.current.setAttribute('x', bbox.x.toString())
            selectionRectRef.current.setAttribute('y', bbox.y.toString())
            selectionRectRef.current.setAttribute(
              'width',
              bbox.width.toString()
            )
            selectionRectRef.current.setAttribute(
              'height',
              bbox.height.toString()
            )
          }
        }, 100)

        // Update texture
        updateTexture()
      })

      // Set up removeElement function
      setRemoveElementFunction(() => (identifier?: string) => {
        if (!identifier) {
          console.warn('No element identifier provided for removal')
          return
        }

        const svg = paintableUvSvgRef.current
        if (!svg) {
          console.error('SVG not available')
          return
        }

        // Find the element to remove
        const elementToRemove = svg.querySelector(
          `[inkscape\\:label="${identifier}"]`
        )
        if (!elementToRemove) {
          console.error('Element not found for removal:', identifier)
          return
        }

        // Remove the element from the SVG
        elementToRemove.remove()

        // Clear selection if the removed element was selected
        if (onSelectedElement) {
          // Clear selection in parent component
          // We'll pass null but need to match the expected signature, so we'll pass empty values
        }

        // Hide selection rectangle
        if (selectionRectRef.current) {
          selectionRectRef.current.setAttribute('x', '0')
          selectionRectRef.current.setAttribute('y', '0')
          selectionRectRef.current.setAttribute('width', '0')
          selectionRectRef.current.setAttribute('height', '0')
        }

        // Update texture
        updateTexture()
      })

      setAddImageInternal(() => (base64image: string) => {
        console.log('hello from texture editor', base64image)

        const svg = paintableUvSvgRef.current
        if (!svg) {
          console.error('SVG not available')
          return
        }

        // Load image to get dimensions
        const img = new Image()
        img.onload = () => {
          const maxSize = 512
          const aspectRatio = img.width / img.height

          let width, height
          if (img.width > img.height) {
            // Landscape or square
            width = maxSize
            height = maxSize / aspectRatio
          } else {
            // Portrait
            height = maxSize
            width = maxSize * aspectRatio
          }

          // Create unique ID for new image element
          const timestamp = Date.now()
          const newImageId = `image_custom_${timestamp}`

          // Get SVG center coordinates
          const centerX = CANVAS_SIZE / 2
          const centerY = CANVAS_SIZE / 2

          // Create new image element
          const newImageElement = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'image'
          )
          newImageElement.setAttribute('href', base64image)
          newImageElement.setAttribute('x', (centerX - width / 2).toString())
          newImageElement.setAttribute('y', (centerY - height / 2).toString())
          newImageElement.setAttribute('width', width.toString())
          newImageElement.setAttribute('height', height.toString())
          newImageElement.setAttribute('id', newImageId)
          newImageElement.setAttribute('inkscape:label', newImageId)

          svg.appendChild(newImageElement)

          // Make the new element interactive
          makeInteractive(newImageElement as any)

          // Update texture
          updateTexture()
        }
        img.src = base64image
      })
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
          x="-100"
          y="-100"
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

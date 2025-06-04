import { createContext, useContext, useRef, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

const TOOLTIP_OFFSET = {
  x: 10,
  y: 16
}

interface TooltipContextType {
  setTooltip: (text: string | null) => void
}

const TooltipContext = createContext<TooltipContextType | null>(null)

// Custom hook for mouse position that doesn't trigger re-renders
function useMousePosition() {
  const mousePosition = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      mousePosition.current = { x: ev.clientX, y: ev.clientY }
    }

    window.addEventListener('mousemove', updateMousePosition, { passive: true })
    return () => window.removeEventListener('mousemove', updateMousePosition)
  }, [])

  return mousePosition
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [tooltipText, setTooltipText] = useState<string | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const mousePosition = useMousePosition()

  const setTooltip = (text: string | null) => {
    setTooltipText(text)
    document.body.style.cursor = text ? 'pointer' : 'unset'
  }

  // Update tooltip position using requestAnimationFrame
  useEffect(() => {
    let frameId: number

    const updateTooltip = () => {
      if (tooltipRef.current) {
        const { x, y } = mousePosition.current
        const tooltipWidth = tooltipRef.current.offsetWidth
        const tooltipHeight = tooltipRef.current.offsetHeight
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight

        // Check if tooltip would go off the edges of the screen
        const wouldOverflowRight = x + tooltipWidth + TOOLTIP_OFFSET.x > windowWidth
        const wouldOverflowBottom = y + tooltipHeight + TOOLTIP_OFFSET.y > windowHeight

        // Position vertically based on available space
        if (wouldOverflowBottom) {
          // Position above the cursor
          tooltipRef.current.style.top = `${y - tooltipHeight - TOOLTIP_OFFSET.y}px`
        } else {
          // Position below the cursor
          tooltipRef.current.style.top = `${y + TOOLTIP_OFFSET.y}px`
        }
        
        // Position horizontally based on available space
        if (wouldOverflowRight) {
          // Position to the left of the cursor
          tooltipRef.current.style.left = `${x - tooltipWidth - TOOLTIP_OFFSET.x}px`
        } else {
          // Position to the right of the cursor
          tooltipRef.current.style.left = `${x + TOOLTIP_OFFSET.x}px`
        }
      }
      frameId = requestAnimationFrame(updateTooltip)
    }

    frameId = requestAnimationFrame(updateTooltip)
    return () => cancelAnimationFrame(frameId)
  }, [])

  return (
    <TooltipContext.Provider value={{ setTooltip }}>
      {children}
      {tooltipText && (
        <div
          ref={tooltipRef}
          style={{
            pointerEvents: 'none',
            position: 'fixed',
            transform: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 6px',
            borderRadius: '4px',
            fontSize: '14px',
            whiteSpace: 'pre-line',
            zIndex: 1000,
            left: 0,
            top: 0,
            maxWidth: '200px',
            lineHeight: '1.4',
          }}
        >
          {tooltipText}
        </div>
      )}
    </TooltipContext.Provider>
  )
}

export function useTooltip() {
  const context = useContext(TooltipContext)
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider')
  }
  return context
} 
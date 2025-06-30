import React, { createContext, useState, useMemo } from 'react'

interface OverlayTextureContextType {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
}

export const OverlayTextureContext = createContext<OverlayTextureContextType | null>(null)

interface OverlayTextureProviderProps {
  children: React.ReactNode
}

export const OVERLAY_TEXTURE_SIZE = { width: 4096, height: 4096 }

export function OverlayTextureCanvasProvider({ children }: OverlayTextureProviderProps) {
  const [{ canvas, context }] = useState(() => {
    const canvas = document.createElement('canvas')
    canvas.width = OVERLAY_TEXTURE_SIZE.width
    canvas.height = OVERLAY_TEXTURE_SIZE.height
    
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, OVERLAY_TEXTURE_SIZE.width, OVERLAY_TEXTURE_SIZE.height)
    
    return { canvas, context: ctx }
  })
  
  const value = useMemo(() => ({ canvas, context }), [canvas, context])
  
  return (
    <OverlayTextureContext.Provider value={value}>
      {children}
    </OverlayTextureContext.Provider>
  )
} 
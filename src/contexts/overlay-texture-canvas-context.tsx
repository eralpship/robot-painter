import { CANVAS_SIZE } from '@/components/texture-editor/TextureEditor'
import React, { createContext, useState, useMemo, useCallback } from 'react'

interface OverlayTextureContextType {
  image: HTMLImageElement
  triggerTextureUpdate: () => void
  updateTrigger: number
}

export const OverlayTextureContext = createContext<OverlayTextureContextType | null>(null)

interface OverlayTextureProviderProps {
  children: React.ReactNode
}

export const OVERLAY_TEXTURE_SIZE = { width: 4096, height: 4096 }

export function OverlayTextureCanvasProvider({ children }: OverlayTextureProviderProps) {
  const [image] = useState(() => {
    const img = new Image()
    img.width = CANVAS_SIZE
    img.height = CANVAS_SIZE
    // 1x1 transparent pixel
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg=='
    return img
  })
  
  const [updateTrigger, setUpdateTrigger] = useState(0)
  
  const triggerTextureUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1)
  }, [])
  
  const value = useMemo(() => ({ 
    image, 
    triggerTextureUpdate,
    updateTrigger 
  }), [image, triggerTextureUpdate, updateTrigger])
  
  return (
    <OverlayTextureContext.Provider value={value}>
      {children}
    </OverlayTextureContext.Provider>
  )
} 
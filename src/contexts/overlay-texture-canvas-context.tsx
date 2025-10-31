import React, { createContext, useState, useCallback } from 'react'
import { CANVAS_SIZE } from './texture-editor-context'

export type OverlayTextureSides = {
  lid: HTMLImageElement
  left: HTMLImageElement
  right: HTMLImageElement
  front: HTMLImageElement
  back: HTMLImageElement
}

type OverlayTextureContextType = OverlayTextureSides & {
  setSide: (side: keyof OverlayTextureSides, image: HTMLImageElement) => void
}

export const OverlayTextureContext =
  createContext<OverlayTextureContextType | null>(null)

interface OverlayTextureProviderProps {
  children: React.ReactNode
}

export function createBlankTexture(color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  const img = new Image()
  img.src = canvas.toDataURL()
  return img
}

export function OverlayTextureCanvasProvider({
  children,
}: OverlayTextureProviderProps) {
  const lidState = useState(createBlankTexture('white'))
  const leftState = useState(createBlankTexture('white'))
  const rightState = useState(createBlankTexture('white'))
  const frontState = useState(createBlankTexture('white'))
  const backState = useState(createBlankTexture('white'))

  const setterMap: Record<
    keyof OverlayTextureSides,
    React.Dispatch<React.SetStateAction<HTMLImageElement>>
  > = {
    lid: lidState[1],
    left: leftState[1],
    right: rightState[1],
    front: frontState[1],
    back: backState[1],
  }

  const setSide = useCallback<OverlayTextureContextType['setSide']>(
    (side, image) => setterMap[side](image),
    []
  )

  return (
    <OverlayTextureContext.Provider
      value={{
        lid: lidState[0],
        left: leftState[0],
        right: rightState[0],
        front: frontState[0],
        back: backState[0],
        setSide,
      }}
    >
      {children}
    </OverlayTextureContext.Provider>
  )
}

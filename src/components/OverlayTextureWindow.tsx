import React from 'react'
import { Rnd } from 'react-rnd'
import './OverlayTextureWindow.css'

interface OverlayTextureWindowProps {
  // Add props as needed later
}

export const OverlayTextureWindow: React.FC<OverlayTextureWindowProps> = () => {
  return (
    <Rnd
      default={{
        x: 20,
        y: 20,
        width: 300,
        height: 300,
      }}
      minWidth={200}
      minHeight={200}
      bounds="window"
      dragHandleClassName="drag-handle"
      className="overlay-texture-window"
    >
      <div className="overlay-texture-window-container">
        <div className="overlay-texture-window-title drag-handle">
          Texture
        </div>
        <div className="overlay-texture-window-content">
          sample text
        </div>
      </div>
    </Rnd>
  )
} 
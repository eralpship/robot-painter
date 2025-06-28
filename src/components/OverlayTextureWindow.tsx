import React from 'react'
import { Rnd } from 'react-rnd'
import './OverlayTextureWindow.css'

export function OverlayTextureWindow({ title, children }: {

  title: string
  children?: React.ReactNode
}) {
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
          {title}
        </div>
        <div className="overlay-texture-window-content">
          {children}
        </div>
      </div>
    </Rnd>
  )
} 
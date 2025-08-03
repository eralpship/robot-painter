import React, { useState } from 'react'
import { Rnd } from 'react-rnd'
import './FloatingCollapsibleWindow.css'

export function FloatingCollapsibleWindow({ title, children }: {
  title: string
  children?: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [size, setSize] = useState({ width: 540, height: 540 })

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent drag when clicking toggle button
    setIsCollapsed(!isCollapsed)
  }

  return (
    <Rnd
      default={{ x: 20, y: 20, ...size }}
      size={isCollapsed ? { width: size.width, height: 40 } : size}
      onResize={(_e, _direction, ref, _delta, _position) => {
        setSize({
          width: parseInt(ref.style.width),
          height: isCollapsed ? 40 : parseInt(ref.style.height),
        })
      }}
      minWidth={200}
      minHeight={isCollapsed ? 40 : 200}
      maxHeight={isCollapsed ? 40 : undefined}
      bounds="window"
      dragHandleClassName="drag-handle"
      className={`overlay-texture-window ${isCollapsed ? 'collapsed' : ''}`}
      enableResizing={isCollapsed ? { right: true, left: true } : true}
    >
      <div className="overlay-texture-window-container">
        <div className="overlay-texture-window-title">
          <button 
            className="overlay-texture-window-toggle"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg 
              width="12" 
              height="8" 
              viewBox="0 0 9 5" 
              className={`toggle-icon ${isCollapsed ? 'collapsed' : ''}`}
            >
              <path d="M3.8 4.4c.4.3 1 .3 1.4 0L8 1.7A1 1 0 007.4 0H1.6a1 1 0 00-.7 1.7l3 2.7z" fill="currentColor"/>
            </svg>
          </button>
          <span className="overlay-texture-window-title-text drag-handle">{title}</span>
        </div>
          <div className="overlay-texture-window-content">
            {children}
          </div>
      </div>
    </Rnd>
  )
} 
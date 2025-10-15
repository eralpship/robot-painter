import React, { useState } from 'react'
import { Rnd } from 'react-rnd'
import './FloatingCollapsibleWindow.css'

const headerHeight = 40
const minSize = 200

export function FloatingCollapsibleWindow({
  title,
  children,
  x: defaultX,
  y: defaultY,
  width: defaultWidth,
  height: defaultHeight,
}: {
  title: string
  children?: React.ReactNode
  x: number
  y: number
  width: number
  height: number
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [size, setSize] = useState({
    width: defaultWidth,
    height: defaultHeight,
  })

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent drag when clicking toggle button
    setIsCollapsed(!isCollapsed)
  }

  return (
    <Rnd
      default={{ x: defaultX, y: defaultY, ...size }}
      size={isCollapsed ? { width: size.width, height: headerHeight } : size}
      onResize={(_e, _direction, ref, _delta, _position) => {
        setSize({
          width: parseInt(ref.style.width),
          height: isCollapsed ? headerHeight : parseInt(ref.style.height),
        })
      }}
      minWidth={minSize}
      minHeight={isCollapsed ? headerHeight : minSize}
      maxHeight={isCollapsed ? headerHeight : undefined}
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
              <path
                d="M3.8 4.4c.4.3 1 .3 1.4 0L8 1.7A1 1 0 007.4 0H1.6a1 1 0 00-.7 1.7l3 2.7z"
                fill="currentColor"
              />
            </svg>
          </button>
          <span className="overlay-texture-window-title-text drag-handle">
            {title}
          </span>
        </div>
        <div className="overlay-texture-window-content">{children}</div>
      </div>
    </Rnd>
  )
}

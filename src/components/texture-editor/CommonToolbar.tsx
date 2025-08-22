import React from 'react'

interface CommonToolbarProps {
  onRedraw: () => void
  onAddText: () => void
}

export const CommonToolbar: React.FC<CommonToolbarProps> = ({
  onRedraw,
  onAddText,
}) => {
  return (
    <>
      <button onClick={onRedraw}>
        redraw
      </button>
      <button 
        onClick={onAddText}
        style={{
          cursor: 'pointer'
        }}
      >
        add text
      </button>
    </>
  )
}
import React from 'react'

interface ElementToolbarProps {
  onRemove: () => void
  onRotation: () => void
}

export const ElementToolbar: React.FC<ElementToolbarProps> = ({
  onRemove,
  onRotation,
}) => {
  return (
    <>
      <button
        onClick={onRotation}
        style={{
          cursor: 'pointer',
        }}
      >
        rotation
      </button>
      <button
        onClick={onRemove}
        style={{
          cursor: 'pointer',
        }}
      >
        remove
      </button>
    </>
  )
}

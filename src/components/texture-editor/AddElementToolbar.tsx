import React from 'react'

interface AddElementToolbarProps {
  onAddText: () => void
}

export const AddElementToolbar: React.FC<AddElementToolbarProps> = ({
  onAddText,
}) => {
  return (
    <>
      <button
        onClick={onAddText}
        style={{
          cursor: 'pointer',
        }}
      >
        add text
      </button>
    </>
  )
}

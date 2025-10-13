import React from 'react'

interface CommonToolbarProps {
  mode: 'full' | 'basic'
  onSave: () => void
  onLoad: () => void
}

export const CommonToolbar: React.FC<CommonToolbarProps> = ({
  mode,
  onSave,
  onLoad,
}) => {
  const handleNavigation = () => {
    if (mode === 'full') {
      // Robot editor mode - go to main page
      window.location.href = '/'
    } else {
      // Basic texture editor mode - go to texture editor page
      window.location.href = '/texture-editor'
    }
  }

  return (
    <>
      <button
        onClick={handleNavigation}
        style={{
          cursor: 'pointer',
        }}
      >
        {mode === 'full' ? 'robot editor' : 'texture editor'}
      </button>
      <button
        onClick={onSave}
        style={{
          cursor: 'pointer',
        }}
      >
        save
      </button>
      <button
        onClick={onLoad}
        style={{
          cursor: 'pointer',
        }}
      >
        load
      </button>
    </>
  )
}

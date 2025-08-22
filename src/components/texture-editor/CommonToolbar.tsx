import React from 'react'

interface CommonToolbarProps {
  mode: 'full' | 'basic'
}

export const CommonToolbar: React.FC<CommonToolbarProps> = ({ mode }) => {
  const handleNavigation = () => {
    if (mode === 'full') {
      // Robot editor mode - go to main page
      window.location.href = '/'
    } else {
      // Basic texture editor mode - go to texture editor page
      window.location.href = '/texture-editor'
    }
  }

  const getButtonText = () => {
    return mode === 'full' ? 'robot editor' : 'texture editor'
  }

  return (
    <button 
      onClick={handleNavigation}
      style={{
        cursor: 'pointer'
      }}
    >
      {getButtonText()}
    </button>
  )
}
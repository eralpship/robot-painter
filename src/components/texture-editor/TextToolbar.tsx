import React from 'react'

interface TextToolbarProps {
  onChangeText: () => void
  onChangeFontSize: () => void
}

export const TextToolbar: React.FC<TextToolbarProps> = ({
  onChangeText,
  onChangeFontSize,
}) => {
  return (
    <>
      <button 
        onClick={onChangeText}
        style={{
          cursor: 'pointer'
        }}
      >
        change text
      </button>
      <button 
        onClick={onChangeFontSize}
        style={{
          cursor: 'pointer'
        }}
      >
        font size
      </button>
    </>
  )
}
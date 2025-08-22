import React from 'react'

interface TextToolbarProps {
  onChangeText: () => void
  onChangeFontSize: () => void
  onChangeColor: () => void
}

export const TextToolbar: React.FC<TextToolbarProps> = ({
  onChangeText,
  onChangeFontSize,
  onChangeColor,
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
      <button 
        onClick={onChangeColor}
        style={{
          cursor: 'pointer'
        }}
      >
        change color
      </button>
    </>
  )
}
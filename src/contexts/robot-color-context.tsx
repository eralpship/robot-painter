import React, { createContext, useContext, useState } from 'react'

export type RobotColorContextType = {
  color: string
  setColor: (color: string) => void
}

const RobotColorContext = createContext<RobotColorContextType | undefined>(undefined)

const CONTRAST_COLORS = [
  '#ff69b4', // hot pink
  '#e53935', // red
  '#43a047', // green
  '#8e24aa', // purple
  '#1e88e5', // blue
  '#ff9800', // orange
]

export const RobotColorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pick a random color from the palette on mount
  const [color, setColor] = useState(CONTRAST_COLORS[Math.floor(Math.random() * CONTRAST_COLORS.length)])
  return (
    <RobotColorContext.Provider value={{ color, setColor }}>
      {children}
    </RobotColorContext.Provider>
  )
}

export function useRobotColor() {
  const ctx = useContext(RobotColorContext)
  if (!ctx) throw new Error('useRobotColor must be used within a RobotColorProvider')
  return ctx
} 
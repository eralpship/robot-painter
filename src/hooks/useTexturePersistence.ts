import { useCallback } from 'react'

const STORAGE_KEY = 'robot-painting-texture-svg'

export function useTexturePersistence() {
  const saveTexture = useCallback((svgString: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, svgString)
      console.log('Texture saved to localStorage')
    } catch (error) {
      console.error('Failed to save texture:', error)
    }
  }, [])

  const loadTexture = useCallback((): string | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        console.log('Texture loaded from localStorage')
        return saved
      }
      console.log('No saved texture found')
      return null
    } catch (error) {
      console.error('Failed to load texture:', error)
      return null
    }
  }, [])

  return { saveTexture, loadTexture }
}

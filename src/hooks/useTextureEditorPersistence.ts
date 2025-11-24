import { useCallback } from 'react'
import type { TextureEditorElementWithUuid } from '@/contexts/texture-editor-context'

const STORAGE_KEY = 'texture-editor-state'

type PersistedState = {
  backgroundColor: string
  elements: TextureEditorElementWithUuid[]
}

export function useTextureEditorPersistence() {
  const saveState = useCallback(
    (backgroundColor: string, elements: Map<string, TextureEditorElementWithUuid>) => {
      try {
        const state: PersistedState = {
          backgroundColor,
          elements: Array.from(elements.values()),
        }
        const serialized = JSON.stringify(state)
        localStorage.setItem(STORAGE_KEY, serialized)
        console.log('[Persistence] Saved to localStorage', {
          key: STORAGE_KEY,
          backgroundColor,
          elementCount: elements.size,
          serializedLength: serialized.length
        })
      } catch (error) {
        console.error('[Persistence] Failed to save texture editor state:', error)
      }
    },
    []
  )

  const loadState = useCallback((): {
    backgroundColor: string
    elements: Map<string, TextureEditorElementWithUuid>
  } | null => {
    try {
      console.log('[Persistence] Attempting to load from localStorage, key:', STORAGE_KEY)
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        console.log('[Persistence] No data found in localStorage')
        return null
      }

      console.log('[Persistence] Found data in localStorage, length:', stored.length)
      const parsed: PersistedState = JSON.parse(stored)

      // Convert array back to Map, preserving UUIDs
      const elementsMap = new Map<string, TextureEditorElementWithUuid>()
      for (const element of parsed.elements) {
        elementsMap.set(element.uuid, element)
      }

      console.log('[Persistence] Loaded from localStorage', {
        backgroundColor: parsed.backgroundColor,
        elementCount: elementsMap.size
      })

      return {
        backgroundColor: parsed.backgroundColor,
        elements: elementsMap,
      }
    } catch (error) {
      console.error('[Persistence] Failed to load texture editor state:', error)
      return null
    }
  }, [])

  const clearState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear texture editor state:', error)
    }
  }, [])

  return {
    saveState,
    loadState,
    clearState,
  }
}

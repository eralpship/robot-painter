import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { OverlayTextureSides } from './overlay-texture-canvas-context'
import { useTextureEditorPersistence } from '@/hooks/useTextureEditorPersistence'
import type { CanonicalTransform } from '@/utils/transforms'

export const CANVAS_SIZE = 1024 // if you change this also resize the paintable_uv.svg's root size and viewbox size

export type TexureEditorMode = 'full' | 'basic'

type _BaseTextureEditorElement = {
  transform: CanonicalTransform
  side: keyof OverlayTextureSides
}

type _TextureEditorImageElement = {
  type: 'image'
  base64data: string
  width: number
  height: number
}
type _TextureEditorTextElement = {
  type: 'text'
  text: string
  color: string
  fontSize: number
}
export type TextureEditorElementPatch = Partial<
  {
    transform: CanonicalTransform
    side: keyof OverlayTextureSides
  } & (
    | Omit<_TextureEditorImageElement, 'type'>
    | Omit<_TextureEditorTextElement, 'type'>
  )
>

type TextureEditorElement = _BaseTextureEditorElement &
  (_TextureEditorImageElement | _TextureEditorTextElement)
export type TextureEditorElementWithUuid = TextureEditorElement & {
  uuid: string
}

type TextureEditorContextType = {
  mode: TexureEditorMode
  side: keyof OverlayTextureSides
  setSide: (side: keyof OverlayTextureSides) => void
  resetToDefaults: () => void
  addElement: (element: TextureEditorElement) => void
  removeElement: (elementId: string) => void
  setSelectedElementId: (elementId: string) => void
  selectedElement: TextureEditorElementWithUuid | undefined
  updateElement: (elementId: string, patch: TextureEditorElementPatch) => void
  elements: ElementMap
  backgroundColor: string
  setBackgroundColor: (color: string) => void
  center: { x: number; y: number }
  size: { width: number; height: number }
  notifyEditorReady: () => void
}

export const TextureEditorContext = createContext<TextureEditorContextType>(
  {} as TextureEditorContextType
)

type ElementAction =
  | { type: 'add'; value: TextureEditorElement }
  | { type: 'remove'; uuid: string }
  | { type: 'update'; uuid: string; patch: TextureEditorElementPatch }
  | { type: 'reset' }
  | { type: 'load'; elements: Map<string, TextureEditorElementWithUuid> }

type ElementMap = Map<string, TextureEditorElementWithUuid>

const elementReducer = (
  state: ElementMap,
  action: ElementAction
): ElementMap => {
  const newMap = new Map<string, TextureEditorElementWithUuid>(state)
  switch (action.type) {
    case 'add':
      const uuid = uuidv4()
      newMap.set(uuid, { ...action.value, uuid })
      return newMap
    case 'remove':
      newMap.delete(action.uuid)
      return newMap
    case 'update':
      const existing = newMap.get(action.uuid)
      if (!existing) {
        return newMap
      }
      newMap.set(action.uuid, { ...existing, ...action.patch })
      return newMap
    case 'reset':
      return createDefaultElements()
    case 'load':
      return action.elements
    default:
      return state
  }
}

function createDefaultElements() {
  const defaultElements: TextureEditorElement[] = [
    {
      type: 'text' as const,
      text: 'LEFT',
      fontSize: 192,
      transform: {
        centerX: 500,
        centerY: 500,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      color: '#000000',
      side: 'left',
    },
    {
      type: 'text' as const,
      text: 'RIGHT',
      fontSize: 192,
      transform: {
        centerX: 500,
        centerY: 500,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      color: '#000000',
      side: 'right',
    },
    {
      type: 'text' as const,
      text: 'FRONT',
      fontSize: 192,
      transform: {
        centerX: 500,
        centerY: 500,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      color: '#000000',
      side: 'front',
    },
    {
      type: 'text' as const,
      text: 'BACK',
      fontSize: 192,
      transform: {
        centerX: 500,
        centerY: 500,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      color: '#000000',
      side: 'back',
    },
    {
      type: 'text' as const,
      text: 'LID',
      fontSize: 192,
      transform: {
        centerX: 500,
        centerY: 500,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      color: '#000000',
      side: 'lid',
    },
  ]

  return new Map<string, TextureEditorElementWithUuid>(
    defaultElements.map(e => {
      const uuid = uuidv4()
      return [uuid, { ...e, uuid }] as const
    })
  )
}

export function TextureEditorContextProvider({
  mode,
  children,
}: {
  mode: TexureEditorMode
  children: React.ReactNode
}) {
  const { saveState, loadState, clearState } = useTextureEditorPersistence()

  // Always start with defaults - we'll load saved state after render
  const [elements, dispatchElementsAction] = useReducer(
    elementReducer,
    createDefaultElements()
  )

  const [selectedElementId, setSelectedElementId] = useState<
    string | undefined
  >(undefined)

  const [backgroundColor, setBackgroundColor] = useState('#ffffff')

  // Load saved state only after TextureEditor signals it's ready
  const hasLoadedFromStorage = useRef(false)
  const notifyEditorReady = useCallback(() => {
    if (hasLoadedFromStorage.current) {
      return
    }

    console.log('[TextureEditor] Editor is ready, loading saved state')
    const loaded = loadState()
    if (loaded) {
      console.log('[TextureEditor] Loading saved state from localStorage', {
        backgroundColor: loaded.backgroundColor,
        elementCount: loaded.elements.size
      })
      dispatchElementsAction({ type: 'load', elements: loaded.elements })
      setBackgroundColor(loaded.backgroundColor)
      hasLoadedFromStorage.current = true
    } else {
      console.log('[TextureEditor] No saved state found, using defaults')
      hasLoadedFromStorage.current = true
    }
  }, [loadState])

  const resetToDefaults = useCallback(() => {
    console.log('[TextureEditor] Resetting to defaults')
    clearState()
    dispatchElementsAction({ type: 'reset' })
    setBackgroundColor('#ffffff')
    setSelectedElementId(undefined)
    // Don't reload from storage after reset
    hasLoadedFromStorage.current = true
  }, [clearState])

  const addElement = useCallback<TextureEditorContextType['addElement']>(
    element => dispatchElementsAction({ type: 'add', value: element }),
    []
  )

  const removeElement = useCallback<TextureEditorContextType['removeElement']>(
    elementId => dispatchElementsAction({ type: 'remove', uuid: elementId }),
    []
  )

  const updateElement = useCallback<TextureEditorContextType['updateElement']>(
    (elementId, patch) => {
      dispatchElementsAction({
        type: 'update',
        uuid: elementId,
        patch: patch,
      })
    },
    []
  )

  const selectedElement = useMemo(
    () => (selectedElementId ? elements.get(selectedElementId) : undefined),
    [selectedElementId, elements]
  )

  const [side, internalSetSide] = useState<keyof OverlayTextureSides>('front')
  const setSide = useCallback<typeof internalSetSide>(side => {
    internalSetSide(side)
    setSelectedElementId(undefined)
  }, [])

  // Track if user has made any changes to enable auto-save
  const hasUserMadeChanges = useRef(false)
  const mountTimeRef = useRef(Date.now())

  // Auto-sync to localStorage when state changes (only after user interaction)
  useEffect(() => {
    const timeSinceMount = Date.now() - mountTimeRef.current

    // Skip auto-save for the first 2 seconds after mount to avoid saving initial state
    if (timeSinceMount < 2000) {
      console.log('[TextureEditor] Skipping auto-save - within initial mount period', {
        timeSinceMount
      })
      return
    }

    // Enable auto-save after first 2 seconds (user has had time to interact)
    hasUserMadeChanges.current = true

    console.log('[TextureEditor] State changed, scheduling auto-save in 300ms', {
      backgroundColor,
      elementCount: elements.size
    })

    const timeoutId = setTimeout(() => {
      console.log('[TextureEditor] Auto-saving to localStorage', {
        backgroundColor,
        elementCount: elements.size
      })
      saveState(backgroundColor, elements)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [backgroundColor, elements, saveState])

  return (
    <TextureEditorContext.Provider
      value={{
        side,
        setSide,
        mode,
        elements,
        resetToDefaults,
        addElement,
        removeElement,
        selectedElement,
        updateElement,
        center: { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 },
        size: { width: CANVAS_SIZE, height: CANVAS_SIZE },
        setSelectedElementId,
        backgroundColor,
        setBackgroundColor,
        notifyEditorReady,
      }}
    >
      {children}
    </TextureEditorContext.Provider>
  )
}

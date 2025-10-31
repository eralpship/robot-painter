import React, {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  useState,
} from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { OverlayTextureSides } from './overlay-texture-canvas-context'

export const CANVAS_SIZE = 1024 // if you change this also resize the paintable_uv.svg's root size and viewbox size

export type TexureEditorMode = 'full' | 'basic'

type _BaseTextureEditorElement = {
  rotation: number
  position: { x: number; y: number }
  scale: { x: number; y: number }
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
  _BaseTextureEditorElement &
    Omit<_TextureEditorImageElement, 'type'> &
    Omit<_TextureEditorTextElement, 'type'>
>

type TextureEditorElement = _BaseTextureEditorElement &
  (_TextureEditorImageElement | _TextureEditorTextElement)
type TextureEditorElementWithUuid = TextureEditorElement & {
  uuid: string
}

type TextureEditorContextType = {
  mode: TexureEditorMode
  side: keyof OverlayTextureSides
  setSide: (side: keyof OverlayTextureSides) => void
  saveTexture: () => void
  loadTexture: () => void
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
}

export const TextureEditorContext = createContext<TextureEditorContextType>(
  {} as TextureEditorContextType
)

type ElementAction =
  | { type: 'add'; value: TextureEditorElement }
  | { type: 'remove'; uuid: string }
  | { type: 'update'; uuid: string; patch: TextureEditorElementPatch }

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
    default:
      return state
  }
}

function createDefaultElements() {
  return new Map<string, TextureEditorElementWithUuid>(
    (
      [
        {
          type: 'text',
          text: 'LEFT',
          fontSize: 192,
          position: { x: 500, y: 500 },
          scale: { x: 1, y: 1 },
          rotation: 0,
          color: '#000000',
          side: 'left',
        },
        {
          type: 'text',
          text: 'RIGHT',
          fontSize: 192,
          position: { x: 500, y: 500 },
          scale: { x: 1, y: 1 },
          rotation: 0,
          color: '#000000',
          side: 'right',
        },
        {
          type: 'text',
          text: 'FRONT',
          fontSize: 192,
          position: { x: 500, y: 500 },
          scale: { x: 1, y: 1 },
          rotation: 0,
          color: '#000000',
          side: 'front',
        },
        {
          type: 'text',
          text: 'BACK',
          fontSize: 192,
          position: { x: 500, y: 500 },
          scale: { x: 1, y: 1 },
          rotation: 0,
          color: '#000000',
          side: 'back',
        },
        {
          type: 'text',
          text: 'LID',
          fontSize: 192,
          position: { x: 500, y: 500 },
          scale: { x: 1, y: 1 },
          rotation: 0,
          color: '#000000',
          side: 'lid',
        },
      ] as const
    ).map(e => {
      const uuid = uuidv4()
      return [uuid, { uuid, ...e }]
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
  const [elements, dispatchElementsAction] = useReducer(
    elementReducer,
    createDefaultElements()
  )

  const [selectedElementId, setSelectedElementId] = useState<
    string | undefined
  >(undefined)

  const saveTexture = useCallback<
    TextureEditorContextType['saveTexture']
  >(() => {}, [])

  const loadTexture = useCallback<
    TextureEditorContextType['loadTexture']
  >(() => {}, [])

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
  const [backgroundColorCollection, setBackgroundColorCollection] = useState<
    Record<keyof OverlayTextureSides, string>
  >({
    left: '#ffffff',
    right: '#ffffff',
    lid: '#ffffff',
    front: '#ffffff',
    back: '#ffffff',
  })
  const backgroundColor = useMemo(
    () => backgroundColorCollection[side],
    [side, backgroundColorCollection]
  )
  const setBackgroundColor = useCallback(
    (color: string) =>
      setBackgroundColorCollection(prev => ({ ...prev, [side]: color })),
    []
  )

  return (
    <TextureEditorContext.Provider
      value={{
        side,
        setSide,
        mode,
        elements,
        saveTexture,
        loadTexture,
        addElement,
        removeElement,
        selectedElement,
        updateElement,
        center: { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 },
        size: { width: CANVAS_SIZE, height: CANVAS_SIZE },
        setSelectedElementId,
        backgroundColor,
        setBackgroundColor,
      }}
    >
      {children}
    </TextureEditorContext.Provider>
  )
}

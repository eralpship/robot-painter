import React, {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  useState,
} from 'react'
import { v4 as uuidv4 } from 'uuid'

export const CANVAS_SIZE = 4096 // if you change this also resize the paintable_uv.svg's root size and viewbox size

export type TexureEditorMode = 'full' | 'basic'

type _BaseTextureEditorElement = {
  rotation: number
  position: { x: number; y: number }
}

type _TextureEditorImageElement = {
  type: 'image'
  base64data: string
}
type _TextureEditorTextElement = {
  type: 'text'
  text: string
  color: string
  fontSize: number
}
type TextureEditorElementPatch = Partial<
  _BaseTextureEditorElement &
    Omit<_TextureEditorImageElement, 'type'> &
    Omit<_TextureEditorTextElement, 'type'>
>

type TextureEditorElement = _BaseTextureEditorElement &
  (_TextureEditorImageElement | _TextureEditorTextElement)
type TextureEditorElementWithUuid = TextureEditorElement & { uuid: string }

type TextureEditorContextType = {
  mode: TexureEditorMode
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
          position: { x: -2054.9844, y: 668.39893 },
          rotation: -90,
          color: '#000000',
        },
        {
          type: 'text',
          text: 'RIGHT',
          fontSize: 192,
          position: { x: 2041.0156, y: -3423.8533 },
          rotation: 90,
          color: '#000000',
        },
        {
          type: 'text',
          text: 'FRONT',
          fontSize: 192,
          position: { x: 2039.0469, y: 3725.9714 },
          rotation: 0,
          color: '#000000',
        },
        {
          type: 'text',
          text: 'BACK',
          fontSize: 192,
          position: { x: -2058.9219, y: -306.37775 },
          rotation: 180,
          color: '#000000',
        },
        {
          type: 'text',
          text: 'LID',
          fontSize: 192,
          position: { x: 2043.9219, y: 2117.7969 },
          rotation: 0,
          color: '#000000',
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
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')

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

  return (
    <TextureEditorContext.Provider
      value={{
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

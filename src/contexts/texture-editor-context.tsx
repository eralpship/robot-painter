import React, {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  useState,
} from 'react'
import { v4 as uuidv4 } from 'uuid'

export const CANVAS_SIZE = 4096

type TexureEditorMode = 'full' | 'basic'

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

export function TextureEditorContextProvider({
  mode,
  children,
}: {
  mode: TexureEditorMode
  children: React.ReactNode
}) {
  const [elements, dispatchElementsAction] = useReducer(
    elementReducer,
    new Map<string, TextureEditorElementWithUuid>()
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
      }}
    >
      {children}
    </TextureEditorContext.Provider>
  )
}

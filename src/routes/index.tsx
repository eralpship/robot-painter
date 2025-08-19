import { createFileRoute } from '@tanstack/react-router'
import '../App.css'
import { Canvas, useThree } from '@react-three/fiber'
import {
  BASE_COLOR_DEFAULT,
  HEADLIGHT_INTENSITY_DEFAULT,
  Model,
  TAILLIGHT_INTENSITY_DEFAULT,
  type ModelRef,
} from '../components/E-model'
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {
  useRef,
  useEffect,
  Suspense,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react'
import { TooltipProvider } from '../contexts/tooltip-context'
import { OverlayTextureCanvasProvider } from '../contexts/overlay-texture-canvas-context'
import { FloatingCollapsibleWindow } from '../components/FloatingCollapsibleWindow'
import {
  TextureEditorWrapper,
  type TextureEditorWrapperRef,
} from '../components/texture-editor/TextureEditorWrapper'
import { Leva, useControls, button } from 'leva'
import { PerspectiveCamera } from 'three'

const FOV_INITIAL = 20
const INITIAL_AMBIENT_LIGHT = 0.8
const INITIAL_ENVIRONMENT_INTENSITY = 0.7
const INITIAL_BACKGROUND_BLUR = 0.7
const INITIAL_BACKGROUND_INTENSITY = 0.4

const customLevaTheme = {
  sizes: {
    rootWidth: '340px',
  },
}

export const Route = createFileRoute('/')({
  component: App,
})

function useModelControls({
  modelRef,
  cameraControlsRef,
  textureEditorRef,
  cameraControllerRef,
  ambientLightRef,
  environmentWrapperRef,
}: {
  modelRef: React.RefObject<ModelRef | null>
  cameraControlsRef: React.RefObject<OrbitControlsImpl | null>
  textureEditorRef: React.RefObject<TextureEditorWrapperRef | null>
  cameraControllerRef: React.RefObject<CameraControllerRef | null>
  ambientLightRef: React.RefObject<any>
  environmentWrapperRef: React.RefObject<EnvironmentWrapperRef | null>
}) {
  useControls('Appearence', {
    baseColor: {
      value: BASE_COLOR_DEFAULT,
      label: 'Base Color',
      onChange: (value: string) => {
        modelRef.current?.updateBaseColor(value)
        textureEditorRef.current?.setBaseColor(value)
      },
    },
  })

  const [_lighting, setLighting] = useControls('Lighting', () => ({
    headlightsIntensity: {
      value: HEADLIGHT_INTENSITY_DEFAULT,
      label: 'Headlights Intensity',
      max: 60,
      min: 0,
      step: 0.1,
      onChange: (value: number) => {
        modelRef.current?.setHeadlightsIntensity(value)
      },
    },
    taillightsIntensity: {
      value: TAILLIGHT_INTENSITY_DEFAULT,
      label: 'Taillights Intensity',
      max: 60,
      min: 0,
      step: 0.1,
      onChange: (value: number) => {
        modelRef.current?.setTaillightsIntensity(value)
      },
    },
    tailLightColor: {
      value: '#ff0000',
      label: 'Tail Light Color',
      onChange: (value: string) => {
        modelRef.current?.setTailLightColor(value)
      },
    },
  }))

  const [_animation, setAnimation] = useControls('Animation', () => ({
    lidOpen: {
      value: false,
      label: 'Lid Open',
      onChange: (value: boolean) => {
        modelRef.current?.setLidOpen(value)
      },
    },
    bogie: {
      value: 0.5,
      label: 'Bogie',
      min: 0,
      max: 1,
      step: 0.1,
      onChange: (value: number) => {
        modelRef.current?.animateRockerToFrame(value)
      },
    },
    touchFlag: button(() => modelRef.current?.touchFlag()),
  }))

  useControls('Camera', {
    autoRotate: {
      value: true,
      label: 'Auto Rotate',
      onChange: (value: boolean) => {
        if (cameraControlsRef.current) {
          cameraControlsRef.current.autoRotate = value
        }
      },
    },
    fov: {
      value: FOV_INITIAL,
      label: 'FOV',
      min: 5,
      max: 60,
      step: 0.5,
      onChange: (value: number) => {
        cameraControllerRef.current?.setFov(value)
      },
    },
    resetCamera: button(() => cameraControlsRef.current?.reset()),
  })

  const [_environment, setEnvironment] = useControls('Environment', () => ({
    ambientLight: {
      value: INITIAL_AMBIENT_LIGHT,
      label: 'Ambient Light',
      max: 2,
      min: 0,
      step: 0.1,
      onChange: (value: number) => {
        if (ambientLightRef.current) {
          ambientLightRef.current.intensity = value
        }
      },
    },
    backgroundIntensity: {
      value: INITIAL_BACKGROUND_INTENSITY,
      label: 'Background Intensity',
      max: 1,
      min: 0,
      step: 0.01,
      onChange: (value: number) => {
        environmentWrapperRef.current?.setBackgroundIntensity(value)
      },
    },
    backgroundBlur: {
      value: INITIAL_BACKGROUND_BLUR,
      label: 'Background Blur',
      max: 1,
      min: 0,
      step: 0.01,
      onChange: (value: number) => {
        environmentWrapperRef.current?.setBackgroundBlur(value)
      },
    },
    environmentIntensity: {
      value: INITIAL_ENVIRONMENT_INTENSITY,
      label: 'Environment Intensity',
      max: 1,
      min: 0,
      step: 0.01,
      onChange: (value: number) => {
        environmentWrapperRef.current?.setEnvironmentIntensity(value)
      },
    },
  }))

  const setLidOpen = useCallback(
    (lidOpen: boolean) => {
      setAnimation({ lidOpen })
    },
    [setAnimation]
  )
  const setTaillightIntensity = useCallback(
    (taillightsIntensity: number) => {
      setLighting({ taillightsIntensity })
    },
    [setLighting]
  )
  const setHeadlightsIntensity = useCallback(
    (headlightsIntensity: number) => {
      setLighting({ headlightsIntensity })
    },
    [setLighting]
  )

  return {
    setLidOpen,
    setHeadlightsIntensity,
    setTaillightIntensity,
  }
}

type CameraControllerRef = { setFov: (fov: number) => void }
const CameraController = forwardRef<CameraControllerRef>((_, ref) => {
  const { camera } = useThree()

  const setFov = useCallback(
    (fov: number) => {
      if (camera instanceof PerspectiveCamera) {
        camera.fov = fov
        camera.updateProjectionMatrix()
      }
    },
    [camera]
  )

  useImperativeHandle(
    ref,
    () => ({
      setFov,
    }),
    [setFov]
  )

  return null
})

type EnvironmentWrapperRef = {
  setBackgroundIntensity: (value: number) => void
  setBackgroundBlur: (value: number) => void
  setEnvironmentIntensity: (value: number) => void
}

const EnvironmentWrapper = forwardRef<EnvironmentWrapperRef>((_, ref) => {
  const [backgroundIntensity, setBackgroundIntensity] = useState(
    INITIAL_BACKGROUND_INTENSITY
  )
  const [backgroundBlur, setBackgroundBlur] = useState(INITIAL_BACKGROUND_BLUR)
  const [environmentIntensity, setEnvironmentIntensity] = useState(
    INITIAL_ENVIRONMENT_INTENSITY
  )

  useImperativeHandle(
    ref,
    () => ({
      setBackgroundIntensity,
      setBackgroundBlur,
      setEnvironmentIntensity,
    }),
    []
  )

  return (
    <Suspense fallback={null}>
      <Environment
        preset="dawn"
        background
        blur={backgroundBlur}
        backgroundIntensity={backgroundIntensity}
        environmentIntensity={environmentIntensity}
        resolution={256}
      />
    </Suspense>
  )
})

function AppContent() {
  const inactivityTimeout = 5_000
  const hasInteractedRef = useRef(false)
  const lastInteractionTimeRef = useRef(Date.now())
  const cameraControlsRef = useRef<OrbitControlsImpl | null>(null)
  const textureEditorRef = useRef<TextureEditorWrapperRef | null>(null)
  const cameraControllerRef = useRef<CameraControllerRef | null>(null)
  const ambientLightRef = useRef<any>(null)
  const environmentWrapperRef = useRef<EnvironmentWrapperRef | null>(null)

  const modelRef = useRef<ModelRef | null>(null)
  const { setLidOpen, setHeadlightsIntensity, setTaillightIntensity } =
    useModelControls({
      modelRef,
      cameraControlsRef,
      cameraControllerRef,
      textureEditorRef,
      ambientLightRef,
      environmentWrapperRef,
    })

  console.log('AppContent rendered')

  // Static values - never change, no re-renders
  const initialAutoRotate = true

  const handleInteraction = useCallback(() => {
    lastInteractionTimeRef.current = Date.now()
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true
    }

    // Update OrbitControls autoRotate directly
    if (cameraControlsRef.current) {
      cameraControlsRef.current.autoRotate = false
    }
  }, [])

  useEffect(() => {
    let frameId: number

    const checkInactivity = () => {
      const now = Date.now()
      if (
        hasInteractedRef.current &&
        now - lastInteractionTimeRef.current > inactivityTimeout
      ) {
        hasInteractedRef.current = false
        // Update OrbitControls autoRotate directly
        if (cameraControlsRef.current) {
          cameraControlsRef.current.autoRotate = initialAutoRotate
        }
      }
      frameId = requestAnimationFrame(checkInactivity)
    }

    frameId = requestAnimationFrame(checkInactivity)
    return () => cancelAnimationFrame(frameId)
  }, [])

  return (
    <div className="App">
      <Leva
        theme={customLevaTheme}
        collapsed={false}
        titleBar={{ title: 'Options', filter: false }}
      />
      <Canvas
        style={{
          height: '100vh',
          width: '100vw',
        }}
        camera={{
          position: [40, 30, 40],
          fov: FOV_INITIAL,
        }}
      >
        <CameraController ref={cameraControllerRef} />
        <EnvironmentWrapper ref={environmentWrapperRef} />

        {/* Ambient light to control overall brightness */}
        <ambientLight ref={ambientLightRef} intensity={INITIAL_AMBIENT_LIGHT} />

        {/* Simple contact shadow */}
        <ContactShadows
          position={[0, -2.9, 0]}
          opacity={2.5}
          scale={180}
          blur={2}
          far={100}
          resolution={256}
          color="#000000"
        />
        <Model
          ref={modelRef}
          position={[0, -3, 0]}
          scale={1}
          onHeadlightIntensityChanged={setHeadlightsIntensity}
          onTaillightIntensityChanged={setTaillightIntensity}
          onLidOpenChanged={setLidOpen}
        />
        <OrbitControls
          ref={cameraControlsRef}
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={1.55}
          minDistance={10}
          maxDistance={200}
          minAzimuthAngle={-Infinity}
          maxAzimuthAngle={Infinity}
          autoRotate={initialAutoRotate}
          autoRotateSpeed={2}
          onStart={handleInteraction}
        />
      </Canvas>
      <FloatingCollapsibleWindow title="Texture Editor">
        <TextureEditorWrapper ref={textureEditorRef} />
      </FloatingCollapsibleWindow>
    </div>
  )
}

function App() {
  return (
    <OverlayTextureCanvasProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </OverlayTextureCanvasProvider>
  )
}

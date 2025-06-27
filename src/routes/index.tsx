import { createFileRoute } from '@tanstack/react-router'
import '../App.css'
import { Canvas } from '@react-three/fiber'
import { Model, type ModelRef } from '../components/E-model'
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei'
import { useRef, useState, useEffect  } from 'react'
import { TooltipProvider } from '../contexts/tooltip-context'
import { Leva, useControls, button } from 'leva'

const customLevaTheme = {
  sizes: {
    rootWidth: '340px',
  },
}

export const Route = createFileRoute('/')({
  component: App,
})

function AppContent() {
  const [hasInteracted, setHasInteracted] = useState(false)
  const lastInteractionTime = useRef(Date.now())
  const controlsRef = useRef<any>(null)
  const inactivityTimeout = 5_000
  const initialBaseColor = '#ff69b4'
  const modelRef = useRef<ModelRef>(null)

  const [{ tailLightColor, headlightsOn, taillightsOn, headlightsIntensity, taillightsIntensity, lidOpen, autoRotate, ambientLight, backgroundIntensity, backgroundBlur, environmentIntensity }, setControlStates] = useControls(() => ({
    baseColor: {
      value: initialBaseColor,
      label: 'Base Color',
      onChange: (value) => {
        modelRef.current?.updateBaseColor(value)
      },
    },
    tailLightColor: {
      value: '#ff0000',
      label: 'Tail Light Color'
    },
    headlightsOn: { value: true, label: 'Headlights On' },
    headlightsIntensity: { value: 12, label: 'Headlights Intensity', max: 60, min: 0, step: 0.1  },
    taillightsOn: { value: true, label: 'Taillights On' },
    taillightsIntensity: { value: 12, label: 'Taillights Intensity', max: 60, min: 0, step: 0.1  },
    lidOpen: { value: false, label: 'Lid Open' },
    autoRotate: { value: true, label: 'Auto Rotate' },
    ambientLight: { value: 0.8, label: 'Ambient Light', max: 2, min: 0, step: 0.1  },
    backgroundIntensity: { value: 0.4, label: 'Background Intensity', max: 1, min: 0, step: 0.01  },
    backgroundBlur: { value: 0.7, label: 'Background Blur', max: 1, min: 0, step: 0.01  },
    environmentIntensity: { value: 0.7, label: 'Environment Intensity', max: 1, min: 0, step: 0.01  },
    resetCamera: button(() => controlsRef.current?.reset()),
    touchFlag: button(() => modelRef.current?.touchFlag())
  }))

  // Functions to manipulate light states directly in Leva
  const toggleHeadlights = () => {
    console.log('toggleHeadlights called, current state:', headlightsOn)
    const newValue = !headlightsOn
    setControlStates({ headlightsOn: newValue })
    console.log('New headlights state:', newValue)
  }

  const toggleTaillights = () => {
    console.log('toggleTaillights called, current state:', taillightsOn)
    const newValue = !taillightsOn
    setControlStates({ taillightsOn: newValue })
    console.log('New taillights state:', newValue)
  }

  // Handle user interaction
  const handleInteraction = () => {
    lastInteractionTime.current = Date.now()
    if (!hasInteracted) {
      setHasInteracted(true)
    }
  }

  useEffect(() => {
    let frameId: number

    const checkInactivity = () => {
      const now = Date.now()
      if (hasInteracted && now - lastInteractionTime.current > inactivityTimeout) {
        setHasInteracted(false)
      }
      frameId = requestAnimationFrame(checkInactivity)
    }

    frameId = requestAnimationFrame(checkInactivity)
    return () => cancelAnimationFrame(frameId)
  }, [hasInteracted])

  return (
    <div className="App">
      <Leva  theme={customLevaTheme} />
      <Canvas 
        style={{ height: '100vh', width: '100vw' }}
        camera={{ position: [20, 10, 20], fov: 50 }}
      >
        <Environment 
          preset="dawn"
          background
          blur={backgroundBlur}
          backgroundIntensity={backgroundIntensity}
          environmentIntensity={environmentIntensity}
          resolution={256}
        />

        {/* Ambient light to control overall brightness */}
        <ambientLight intensity={ambientLight} />

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
          tailLightColor={tailLightColor}
          headlightsOn={headlightsOn}
          taillightsOn={taillightsOn}
          onToggleHeadlights={toggleHeadlights}
          onToggleTaillights={toggleTaillights}
          lidOpen={lidOpen}
          setLidOpen={lidOpen => setControlStates({ lidOpen })}
          initialBaseColor={initialBaseColor}
          headlightsIntensity={headlightsIntensity}
          taillightsIntensity={taillightsIntensity}
        />
        <OrbitControls 
          ref={controlsRef}
          makeDefault
          minPolarAngle={0} 
          maxPolarAngle={1.55}
          minDistance={10}
          maxDistance={200}
          minAzimuthAngle={-Infinity}
          maxAzimuthAngle={Infinity}
          autoRotate={!hasInteracted && autoRotate}
          autoRotateSpeed={2}
          onStart={handleInteraction}
        />
      </Canvas>
    </div>
  )
}

function App() {
  return (
    <TooltipProvider>
      <AppContent />
    </TooltipProvider>
  )
}

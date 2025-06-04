import { createFileRoute } from '@tanstack/react-router'
import '../App.css'
import { Canvas } from '@react-three/fiber'
import { Model } from '../components/E-model'
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import { TooltipProvider } from '../contexts/tooltip-context'

// Custom hook for mouse position that doesn't trigger re-renders
function useMousePosition() {
  const mousePosition = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      mousePosition.current = { x: ev.clientX, y: ev.clientY }
    }

    window.addEventListener('mousemove', updateMousePosition, { passive: true })
    return () => window.removeEventListener('mousemove', updateMousePosition)
  }, [])

  return mousePosition
}

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [hasInteracted, setHasInteracted] = useState(false)
  const lastInteractionTime = useRef(Date.now())
  const controlsRef = useRef<any>(null)
  const inactivityTimeout = 5000 // 5 seconds

  // Handle user interaction
  const handleInteraction = () => {
    lastInteractionTime.current = Date.now()
    if (!hasInteracted) {
      setHasInteracted(true)
    }
  }

  // Check for inactivity using requestAnimationFrame
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
    <TooltipProvider>
      <div className="App">
        <Canvas 
          style={{ height: '100vh', width: '100vw' }}
          camera={{ position: [20, 10, 20], fov: 50 }}
        >
          <Environment 
            preset="dawn"
            background
            blur={0.7}
            backgroundIntensity={0.4}
            environmentIntensity={0.7}
            resolution={256}
          />

          {/* Ambient light to control overall brightness */}
          <ambientLight intensity={0.8} />

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

          <Model position={[0, -3, 0]} scale={1} />

          <OrbitControls 
            ref={controlsRef}
            makeDefault
            minPolarAngle={0} 
            maxPolarAngle={1.55}
            minDistance={10}
            maxDistance={200}
            minAzimuthAngle={-Infinity}
            maxAzimuthAngle={Infinity}
            autoRotate={!hasInteracted}
            autoRotateSpeed={2}
            onStart={handleInteraction}
          />
        </Canvas>
      </div>
    </TooltipProvider>
  )
}

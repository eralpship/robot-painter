import { createFileRoute } from '@tanstack/react-router'
import '../App.css'
import { Canvas } from '@react-three/fiber'
import { Model } from '../components/E-model'
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [hasInteracted, setHasInteracted] = useState(false)
  const [lastInteractionTime, setLastInteractionTime] = useState(0)
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    const inactivityTimeout = 5000 // 5 seconds
    const interval = setInterval(() => {
      const now = Date.now()
      if (hasInteracted && now - lastInteractionTime > inactivityTimeout) {
        setHasInteracted(false)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [hasInteracted, lastInteractionTime])

  return (
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
          onStart={() => {
            setHasInteracted(true)
            setLastInteractionTime(Date.now())
          }}
        />
      </Canvas>
    </div>
  )
}

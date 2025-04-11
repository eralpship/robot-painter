import { createFileRoute } from '@tanstack/react-router'
import '../App.css'
import { Canvas } from '@react-three/fiber'
import { Model } from '../components/E-model'
import { CameraControls, ContactShadows, Environment } from '@react-three/drei'
import * as THREE from 'three'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="App">
      <Canvas 
        style={{ height: '100vh', width: '100vw' }}
        camera={{ position: [20, 10, 20], fov: 50 }}
      >

        <Environment 
          preset="city"
          background
          blur={0.4}
          backgroundIntensity={0.4}
          environmentIntensity={0.4}
          resolution={256}
        />

        {/* Ambient light to control overall brightness */}
        <ambientLight intensity={1} />

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

        <CameraControls 
          makeDefault
          minPolarAngle={0} 
          maxPolarAngle={1.55}
          minDistance={10}
          maxDistance={200}
          minAzimuthAngle={-Infinity}
          maxAzimuthAngle={Infinity}
        />
      </Canvas>
    </div>
  )
}

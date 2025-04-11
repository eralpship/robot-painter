import { createFileRoute } from '@tanstack/react-router'
import '../App.css'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Model } from '../components/E-model'
import { CameraControls, Environment } from '@react-three/drei'
import { useRef } from 'react'
import { Group } from 'three'

function Lights() {
  const groupRef = useRef<Group>(null)
  const { camera } = useThree()
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(camera.position)
    }
  })

  return (
    <group ref={groupRef}>
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} castShadow />
    </group>
  )
}

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
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.3} />
        <Environment 
          preset="sunset"
          background
          blur={1}
          resolution={256}
        />
        <Model position={[0, -4, 0]} />
        <CameraControls makeDefault />
        <Lights />
      </Canvas>
    </div>
  )
}

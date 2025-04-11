import { createFileRoute } from '@tanstack/react-router'
import '../App.css'
import { Canvas } from '@react-three/fiber'
import { Model } from '../components/E-model'
import { CameraControls, Environment,  ContactShadows } from '@react-three/drei'


export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="App">
      <Canvas 
        style={{ height: '100vh', width: '100vw' }}
        camera={{ position: [20, 10, 20], fov: 50 }}
        shadows
      >
        <Environment 
          preset="warehouse"
          background
          blur={2}
          backgroundIntensity={0.1}
          resolution={256}
        />
        <ContactShadows
          position={[0, -3, 0]}
          opacity={0.8}
          scale={20}
          blur={4}
          far={50.5}
          resolution={256}
          color="#000000"
        />
        <Model position={[0, -3, 0]} scale={1} />
        <CameraControls 
          makeDefault
          minPolarAngle={0} 
          maxPolarAngle={1.65}
          minDistance={10}
          maxDistance={200}
          minAzimuthAngle={-Infinity}
          maxAzimuthAngle={Infinity}
        >
          <directionalLight position={[10, 10, 5]} intensity={0.2} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.2} castShadow />
        </CameraControls>
      </Canvas>
    </div>
  )
}

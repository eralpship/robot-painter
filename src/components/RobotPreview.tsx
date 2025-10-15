import { Canvas } from '@react-three/fiber'
import { Model, type ModelRef } from './E-model'
import { OrbitControls } from '@react-three/drei'
import { useRef } from 'react'

export function RobotPreview() {
  const modelRef = useRef<ModelRef>(null)

  return (
    <Canvas
      style={{ height: '100%', width: '100%', background: 'transparent' }}
      orthographic
      camera={{ position: [10, 5, 10], zoom: 20 }}
    >
      <ambientLight intensity={5} />
      <Model
        ref={modelRef}
        position={[0, -3.5, 0]}
        scale={1}
        onLidOpenChanged={() => {}}
        onTaillightIntensityChanged={() => {}}
        onHeadlightIntensityChanged={() => {}}
        initialHeadlightIntensity={0}
        initialTailLightIntensity={0}
        onBogieAmountChanged={() => {}}
      />
      <OrbitControls
        makeDefault
        enableZoom={true}
        enablePan={false}
        minZoom={10}
        maxZoom={80}
      />
    </Canvas>
  )
}

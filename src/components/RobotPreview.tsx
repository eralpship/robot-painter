import { Canvas } from '@react-three/fiber'
import { Model, type ModelRef } from './E-model'
import { OrbitControls } from '@react-three/drei'
import { useRef } from 'react'

interface RobotPreviewProps {
  baseColor?: string
  overlayTintColor?: string
}

export function RobotPreview({ baseColor = '#ffffff', overlayTintColor = '#ffffff' }: RobotPreviewProps) {
  const modelRef = useRef<ModelRef>(null)

  return (
    <Canvas
      style={{ height: '100%', width: '100%', background: 'transparent' }}
      camera={{ position: [20, 10, 20], fov: 50 }}
    >
      <ambientLight intensity={3} />
      <Model 
        ref={modelRef}
        position={[0, -3, 0]} 
        scale={1} 
        tailLightColor="#ff0000"
        headlightsOn={false}
        taillightsOn={false}
        onToggleHeadlights={() => {}}
        onToggleTaillights={() => {}}
        lidOpen={false}
        setLidOpen={() => {}}
        initialBaseColor={baseColor}
        initialOverlayTintColor={overlayTintColor}
        headlightsIntensity={0}
        taillightsIntensity={0}
      />
      <OrbitControls 
        makeDefault
        enableZoom={false}
      />
    </Canvas>
  )
}
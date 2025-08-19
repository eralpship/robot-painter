import { Canvas } from '@react-three/fiber'
import { Model, type ModelRef } from './E-model'
import { OrbitControls } from '@react-three/drei'
import { useRef, useEffect } from 'react'

interface RobotPreviewProps {
  baseColor?: string
}

export function RobotPreview({ baseColor = '#ffffff' }: RobotPreviewProps) {
  const modelRef = useRef<ModelRef>(null)

  useEffect(() => {
    modelRef.current?.updateBaseColor(baseColor)
  }, [baseColor])

  return (
    <Canvas
      style={{ height: '100%', width: '100%', background: 'transparent' }}
      orthographic
      camera={{ position: [10, 5, 10], zoom: 20 }}
    >
      <ambientLight intensity={8} />
      <Model
        ref={modelRef}
        position={[0, -3, 0]}
        scale={1}
        onLidOpenChanged={() => {}}
        onTaillightIntensityChanged={() => {}}
        onHeadlightIntensityChanged={() => {}}
      />
      <OrbitControls makeDefault enableZoom={true} enablePan={false} />
    </Canvas>
  )
}

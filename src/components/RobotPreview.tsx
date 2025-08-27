import { Canvas } from '@react-three/fiber'
import { Model, type ModelRef } from './E-model'
import { OrbitControls } from '@react-three/drei'
import { useRef, forwardRef, useImperativeHandle } from 'react'

export interface RobotPreviewRef {
  setBaseColor: (color: string) => void
}

export const RobotPreview = forwardRef<RobotPreviewRef>((_, ref) => {
  const modelRef = useRef<ModelRef>(null)

  useImperativeHandle(
    ref,
    () => ({
      setBaseColor: (color: string) => {
        modelRef.current?.updateBaseColor(color)
      },
    }),
    []
  )

  return (
    <Canvas
      style={{ height: '100%', width: '100%', background: 'transparent' }}
      orthographic
      camera={{ position: [10, 5, 10], zoom: 20 }}
    >
      <ambientLight intensity={8} />
      <Model
        ref={modelRef}
        position={[0, -3, -0.3]}
        scale={1}
        onLidOpenChanged={() => {}}
        onTaillightIntensityChanged={() => {}}
        onHeadlightIntensityChanged={() => {}}
        initialHeadlightIntensity={0}
        initialTailLightIntensity={0}
        onBogieAmountChanged={() => {}}
      />
      <OrbitControls makeDefault enableZoom={true} enablePan={false} />
    </Canvas>
  )
})

RobotPreview.displayName = 'RobotPreview'

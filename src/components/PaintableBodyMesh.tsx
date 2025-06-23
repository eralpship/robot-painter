import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useRobotColor } from '../contexts/robot-color-context'

interface PaintableBodyMeshProps extends React.ComponentProps<'mesh'> {
  geometry: THREE.BufferGeometry
}

export function PaintableBodyMesh({ geometry, ...props }: PaintableBodyMeshProps) {
  // Get the material from the loaded GLTF
  const { materials } = useGLTF('/e-model.glb') as any
  const baseMaterial = materials['body paintable new'] as THREE.MeshStandardMaterial

  // Get the base color from context
  const { color: baseColor } = useRobotColor()

  // Base color mesh (no texture)
  const baseColorMaterial = useMemo(() => {
    const mat = baseMaterial.clone()
    mat.map = null
    mat.color.set(baseColor)
    mat.transparent = false
    mat.opacity = 1
    // Set paintable material properties
    mat.metalness = 0.3
    mat.roughness = 0.35
    mat.envMapIntensity = 1.5
    mat.shadowSide = THREE.FrontSide
    mat.side = THREE.DoubleSide
    mat.needsUpdate = true
    return mat
  }, [baseMaterial, baseColor])

  // Overlay mesh (texture, white color, transparent)
  const overlayMaterial = useMemo(() => {
    const mat = baseMaterial.clone()
    mat.transparent = true
    mat.opacity = 1
    mat.depthWrite = false
    // Set paintable material properties
    mat.metalness = 0.3
    mat.roughness = 0.35
    mat.envMapIntensity = 1.5
    mat.shadowSide = THREE.FrontSide
    mat.side = THREE.DoubleSide
    mat.needsUpdate = true
    return mat
  }, [baseMaterial])

  return (
    <>
      <mesh geometry={geometry} material={baseColorMaterial} {...props} />
      <mesh geometry={geometry} material={overlayMaterial} {...props} />
    </>
  )
} 
import * as THREE from 'three'
import { useGLTF, useAnimations } from '@react-three/drei'
import { type GLTF } from 'three-stdlib'
import React, { useState, useEffect, useMemo, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useThree, useFrame } from '@react-three/fiber'
import { useSpring, animated, easings } from '@react-spring/three'
import { useTooltip } from '../contexts/tooltip-context'

type ActionName = 'open lid'

interface GLTFAction extends THREE.AnimationClip {
  name: ActionName
}

type GLTFResult = GLTF & {
  nodes: {
    robot_new: THREE.Mesh
    lid_new: THREE.Mesh
    lid_new_inside: THREE.Mesh
    body_inside_new: THREE.Mesh
    robot_flag_new: THREE.Mesh
    robot_paintable_body_new: THREE.Mesh
    wheel_back_left: THREE.Mesh
    wheel_back_right: THREE.Mesh
    wheel_front_left: THREE.Mesh
    wheel_front_right: THREE.Mesh
    wheel_middle_left: THREE.Mesh
    wheel_middle_right: THREE.Mesh
  }
  materials: {
    ['body new']: THREE.MeshStandardMaterial
    ['lid paint new']: THREE.MeshStandardMaterial
    ['lid inside new']: THREE.MeshStandardMaterial
    ['body inside new']: THREE.MeshStandardMaterial
    ['body paintable new']: THREE.MeshStandardMaterial
    wheel: THREE.MeshPhysicalMaterial
  }
  animations: GLTFAction[]
}

export function Model(props: React.ComponentProps<'group'>) {
  const group = React.useRef<THREE.Group>(null)
  const leftHeadlightRef = useRef<THREE.PointLight>(null)
  const rightHeadlightRef = useRef<THREE.PointLight>(null)
  const tailLightLeftRef = useRef<THREE.PointLight>(null)
  const tailLightMiddleLeftRef = useRef<THREE.PointLight>(null)
  const tailLightMiddleMiddleRef = useRef<THREE.PointLight>(null)
  const tailLightMiddleRightRef = useRef<THREE.PointLight>(null)
  const tailLightRightRef = useRef<THREE.PointLight>(null)

  const { nodes, materials, animations } = useGLTF('/e-model.glb') as unknown as GLTFResult
  const { actions } = useAnimations(animations, group)
  const [isLidOpen, setIsLidOpen] = useState(false)
  const [headlightsOn, setHeadlightsOn] = useState(true)
  const [taillightsOn, setTaillightsOn] = useState(true)
  const { camera, mouse, raycaster } = useThree()
  const { setTooltip } = useTooltip()

  // Animate headlight intensity
  const { headlightIntensity } = useSpring({
    headlightIntensity: headlightsOn ? 6 : 0,
    config: { 
      duration: 300,
      easing: easings.linear
    },
    clamp: true
  })

  // Animate taillight intensity
  const { tailLightIntensity } = useSpring({
    tailLightIntensity: taillightsOn ? 6 : 0,
    config: { 
      duration: 300,
      easing: easings.linear
    },
    clamp: true
  })

  useEffect(() => {
    const action = actions['open lid']
    if (action) {
      action.loop = THREE.LoopOnce
      action.clampWhenFinished = true
    }
  }, [actions])

  useFrame(() => {
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(group.current?.children || [], true)
    const firstIntersect = intersects[0]
    
    if (firstIntersect?.object.name.includes('lid')) {
      setTooltip(`${isLidOpen ? 'Close' : 'Open'} lid`)
    } 
    else if (firstIntersect?.object.name.includes('headlight')) {
      setTooltip(`${headlightsOn ? 'Turn off' : 'Turn on'} headlights`)
    } 
    else if (firstIntersect?.object.name.includes('tail_light')) {
      setTooltip(`${taillightsOn ? 'Turn off' : 'Turn on'} tail lights`)
    }
    else {
      setTooltip(null)
    }
  })

  // Body material - metallic and reflective
  materials['body new'].metalness = 0.3
  materials['body new'].roughness = 0.35
  materials['body new'].envMapIntensity = 1.5
  materials['body new'].shadowSide = THREE.FrontSide
  materials['body new'].side = THREE.DoubleSide

  // Body paintable material - metallic and reflective
  materials['body paintable new'].metalness = 0.3
  materials['body paintable new'].roughness = 0.35
  materials['body paintable new'].envMapIntensity = 1.5
  materials['body paintable new'].shadowSide = THREE.FrontSide
  materials['body paintable new'].side = THREE.DoubleSide

  // Lid paint material - metallic and reflective
  materials['lid paint new'].metalness = 0.3
  materials['lid paint new'].roughness = 0.35
  materials['lid paint new'].envMapIntensity = 1.5
  materials['lid paint new'].shadowSide = THREE.FrontSide
  materials['lid paint new'].side = THREE.DoubleSide

  // Wheel material - rubber-like
  materials.wheel.metalness = 0
  materials.wheel.roughness = 0.85
  materials.wheel.envMapIntensity = 0.3
  materials.wheel.clearcoat = 0.15
  materials.wheel.clearcoatRoughness = 0.7
  materials.wheel.reflectivity = 0.15
  materials.wheel.specularIntensity = 0.5
  materials.wheel.ior = 1.45
  materials.wheel.sheen = 1
  materials.wheel.sheenRoughness = 0.6
  materials.wheel.sheenColor = new THREE.Color(0x404040)
  materials.wheel.normalScale = new THREE.Vector2(4, 4)
  materials.wheel.shadowSide = THREE.FrontSide
  materials.wheel.side = THREE.DoubleSide

  const handleLidClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const action = actions['open lid']
    if (action) {
      if (isLidOpen) {
        action.timeScale = -1
        action.paused = false
        action.play()
      } else {
        action.timeScale = 1
        action.paused = false
        action.play()
      }
      setIsLidOpen(!isLidOpen)
    }
  }

  const handleHitboxClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (e.object.name.includes('headlight')) {
      setHeadlightsOn(prev => !prev)
    } else if (e.object.name.includes('tail_light')) {
      setTaillightsOn(prev => !prev)
    }
  }

  const hitboxes = useMemo(() => {
    const hitboxes = []
    const hitboxRefs = [leftHeadlightRef, rightHeadlightRef, tailLightLeftRef, tailLightMiddleLeftRef, tailLightMiddleMiddleRef, tailLightMiddleRightRef, tailLightRightRef]

    for (const ref of hitboxRefs) {
      if (ref.current) {
        const position = ref.current.position.clone()
        const rotation = ref.current.rotation.clone()
        const scale = ref.current.scale.clone()
        const name = ref.current.name
        
        hitboxes.push(
          <mesh 
            key={`${name}_hitbox`}
            name={`${name}_hitbox`}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={handleHitboxClick}
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color="red" transparent opacity={0.5} visible={false} />
          </mesh>
        )
      }
    }
    return hitboxes
  }, [leftHeadlightRef.current, rightHeadlightRef.current, tailLightLeftRef.current, tailLightMiddleLeftRef.current, tailLightMiddleMiddleRef.current, tailLightMiddleRightRef.current, tailLightRightRef.current])

  return (
    <group ref={group} {...props} dispose={null}>
      <mesh name="robot_new" geometry={nodes.robot_new.geometry} material={materials['body new']} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        <group 
          name="lid_group" 
          position={[0, 447.329, -637.429]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          scale={100}
          onClick={handleLidClick}
        >
          <mesh name="lid_new" geometry={nodes.lid_new.geometry} material={materials['lid paint new']} position={[0, -6.373, -4.474]} rotation={[Math.PI / 2, 0, 0]} scale={0.01} />
          <mesh name="lid_new_inside" geometry={nodes.lid_new_inside.geometry} material={materials['lid inside new']} position={[0, -6.373, -4.474]} rotation={[Math.PI / 2, 0, 0]} scale={0.01} />
        </group>
        {hitboxes}
        <animated.pointLight 
          ref={leftHeadlightRef}
          name="headlight_left" 
          intensity={headlightIntensity} 
          decay={2} 
          color="#ffe8a0" 
          position={[-249.205, 383.607, -291.883]} 
          rotation={[-Math.PI, 0, 0]} 
          scale={100} 
        />
        <animated.pointLight 
          ref={rightHeadlightRef}
          name="headlight_right" 
          intensity={headlightIntensity} 
          decay={2} 
          color="#ffe8a0" 
          position={[244.908, 383.607, -291.883]} 
          rotation={[-Math.PI, 0, 0]} 
          scale={100} 
        />
        <animated.pointLight 
          ref={tailLightLeftRef}
          name="tail_light_left" 
          intensity={tailLightIntensity} 
          decay={2} 
          color="#ff0011" 
          position={[250.51, -326.223, -602.573]} 
          rotation={[-Math.PI, 0, 0]} 
          scale={100} 
        />
        <animated.pointLight 
          ref={tailLightMiddleLeftRef}
          name="tail_light_middle_left" 
          intensity={tailLightIntensity} 
          decay={2} 
          color="#ff0000" 
          position={[38.204, -384.368, -602.573]} 
          rotation={[-Math.PI, 0, 0]} 
          scale={100} 
        />
        <animated.pointLight 
          ref={tailLightMiddleMiddleRef}
          name="tail_light_middle_middle" 
          intensity={tailLightIntensity} 
          decay={2} 
          color="#ff0000" 
          position={[-0.018, -384.368, -602.573]} 
          rotation={[-Math.PI, 0, 0]} 
          scale={100} 
        />
        <animated.pointLight 
          ref={tailLightMiddleRightRef}
          name="tail_light_middle_right" 
          intensity={tailLightIntensity} 
          decay={2} 
          color="#ff0000" 
          position={[-47.829, -384.368, -602.573]} 
          rotation={[-Math.PI, 0, 0]} 
          scale={100} 
        />
        <animated.pointLight 
          ref={tailLightRightRef}
          name="tail_light_right" 
          intensity={tailLightIntensity} 
          decay={2} 
          color="#ff0011" 
          position={[-248.999, -326.223, -602.573]} 
          rotation={[-Math.PI, 0, 0]} 
          scale={100} 
        />
        <mesh name="body_inside_new" geometry={nodes.body_inside_new.geometry} material={materials['body inside new']} position={[0, 0, -1.723]} />
        <mesh name="robot_flag_new" geometry={nodes.robot_flag_new.geometry} material={materials['body new']} />
        <mesh name="robot_paintable_body_new" geometry={nodes.robot_paintable_body_new.geometry} material={materials['body paintable new']} />
        <mesh name="wheel_back_left" geometry={nodes.wheel_back_left.geometry} material={materials.wheel} position={[-322.374, -232.137, -139.723]} />
        <mesh name="wheel_back_right" geometry={nodes.wheel_back_right.geometry} material={materials.wheel} position={[322.257, -232.137, -139.723]} rotation={[-Math.PI, 0, -Math.PI]} />
        <mesh name="wheel_front_left" geometry={nodes.wheel_front_left.geometry} material={materials.wheel} position={[-322.374, 348.386, -139.723]} />
        <mesh name="wheel_front_right" geometry={nodes.wheel_front_right.geometry} material={materials.wheel} position={[322.257, 348.386, -139.723]} rotation={[-Math.PI, 0, -Math.PI]} />
        <mesh name="wheel_middle_left" geometry={nodes.wheel_middle_left.geometry} material={materials.wheel} position={[-322.374, 50.272, -139.723]} />
        <mesh name="wheel_middle_right" geometry={nodes.wheel_middle_right.geometry} material={materials.wheel} position={[322.257, 50.272, -139.723]} rotation={[-Math.PI, 0, -Math.PI]} />
      </mesh>
    </group>
    
  )
}

useGLTF.preload('/e-model.glb')

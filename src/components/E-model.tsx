import * as THREE from 'three'
import { useGLTF, useAnimations } from '@react-three/drei'
import { type GLTF } from 'three-stdlib'
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useThree, useFrame } from '@react-three/fiber'
import { useSpring, animated, easings } from '@react-spring/three'
import { useTooltip } from '../contexts/tooltip-context'

interface GLTFAction extends THREE.AnimationClip {
  name: 'open lid'
}

type GLTFResult = GLTF & {
  nodes: {
    robot_new: THREE.Mesh
    lid_new: THREE.Mesh
    body_inside_new: THREE.Mesh
    flag_rim: THREE.Mesh
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
    ['body paintable new']: THREE.MeshStandardMaterial
    ['body inside new']: THREE.MeshStandardMaterial
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
  const flagRef = useRef<THREE.Mesh>(null)

  const { nodes, materials, animations } = useGLTF('/e-model.glb') as unknown as GLTFResult
  const { actions } = useAnimations(animations, group)
  const [isLidOpen, setIsLidOpen] = useState(false)
  const [headlightsOn, setHeadlightsOn] = useState(true)
  const [taillightsOn, setTaillightsOn] = useState(true)
  const { camera, mouse, raycaster } = useThree()
  const { setTooltip } = useTooltip()
  const currentTooltip = useRef<string | null>(null)

  const { headlightIntensity } = useSpring({
    headlightIntensity: headlightsOn ? 12 : 0,
    config: { 
      duration: 300,
      easing: easings.linear
    },
    clamp: true
  })

  const { tailLightIntensity } = useSpring({
    tailLightIntensity: taillightsOn ? 12 : 0,
    config: { 
      duration: 300,
      easing: easings.linear
    },
    clamp: true
  })

  const [springs, api] = useSpring(() => ({
    rotationX: 0,
    config: { 
      mass: 1.2,
      tension: 800,
      friction: 20,
      velocity: 0
    }
  }))

  useEffect(() => {
    const action = actions['open lid']
    if (action) {
      action.loop = THREE.LoopOnce
      action.clampWhenFinished = true
    }
  }, [actions])

  const handleFlagClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    api.start({
      from: { rotationX: 0 },
      to: { rotationX: 1 },
      config: {
        mass: 1.2,
        tension: 800,
        friction: 20
      },
      onRest: () => {
        api.set({ rotationX: 0 })
      }
    })
  }, [api])

  const interpolatedRotation = springs.rotationX.to({
    range: [0, 0.5, 1],
    output: [0, Math.PI / 6, 0]
  })

  useFrame(() => {
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(group.current?.children || [], true)
    const firstIntersect = intersects[0]
    
    let newTooltip: string | null = null
    if (firstIntersect?.object.name.includes('lid')) {
      newTooltip = `${isLidOpen ? 'Close' : 'Open'} lid`
    } 
    else if (firstIntersect?.object.name.includes('headlight')) {
      newTooltip = `${headlightsOn ? 'Turn off' : 'Turn on'} headlights`
    } 
    else if (firstIntersect?.object.name.includes('tail_light')) {
      newTooltip = `${taillightsOn ? 'Turn off' : 'Turn on'} tail lights`
    }
    else if (firstIntersect?.object.name.includes('flag')) {
      newTooltip = 'Flag'
    }

    if (newTooltip !== currentTooltip.current) {
      currentTooltip.current = newTooltip
      setTooltip(newTooltip)
    }
  })

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

  materials['body paintable new'].transparent = true
  materials['body paintable new'].opacity = 1
  materials['body paintable new'].metalness = 0.3
  materials['body paintable new'].roughness = 0.35
  materials['body paintable new'].envMapIntensity = 1.5
  materials['body paintable new'].alphaTest = 0.01

  materials['body new'].metalness = 0.3
  materials['body new'].roughness = 0.35
  materials['body new'].envMapIntensity = 1.5

  // hot pink
  const [color, _setColor] = useState('#ff69b4')

  const baseColorMaterial = useMemo(() => {
    const mat = materials['body paintable new'].clone()
    mat.map = null
    mat.color.set(color)
    mat.transparent = false
    mat.opacity = 1
    mat.needsUpdate = true
    mat.side = THREE.FrontSide
    return mat
  }, [color])

  const PaintableMesh = useCallback<React.FC<Omit<React.ComponentProps<'mesh'>, 'material'>>>(({ onClick, name, geometry, position, rotation, scale, ...props }) => {
    return (
      <group name={name} onClick={onClick} position={position} rotation={rotation} scale={scale}>
        <mesh {...props} geometry={geometry} material={baseColorMaterial} name={name + '_base'}  />
        <mesh {...props} geometry={geometry} material={materials['body paintable new']} name={name + '_overlay'}  />
      </group>
    )
  }, [baseColorMaterial])

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
          <PaintableMesh 
            name="lid_new" 
            geometry={nodes.lid_new.geometry} 
            position={[0, 447.187, -637.429]}
            onClick={handleLidClick}
          />
          {hitboxes}
          <animated.pointLight 
            ref={leftHeadlightRef}
            name="headlight_left" 
            intensity={headlightIntensity} 
            decay={2} 
            color="#ffe8a0" 
            position={[-235.912, 385.374, -301.501]} 
            rotation={[-Math.PI, 0, 0]} 
            scale={30} 
          />
          <animated.pointLight 
            ref={rightHeadlightRef}
            name="headlight_right" 
            intensity={headlightIntensity} 
            decay={2} 
            color="#ffe8a0" 
            position={[241.584, 386.931, -299.362]} 
            rotation={[-Math.PI, 0, 0]} 
            scale={30} 
          />
          <animated.pointLight 
            ref={tailLightLeftRef}
            name="tail_light_left" 
            intensity={tailLightIntensity} 
            decay={2} 
            color="#ff0011" 
            position={[250.51, -326.223, -602.573]} 
            rotation={[-Math.PI, 0, 0]} 
            scale={25} 
          />
          <animated.pointLight 
            ref={tailLightMiddleLeftRef}
            name="tail_light_middle_left" 
            intensity={tailLightIntensity} 
            decay={2} 
            color="#ff0000" 
            position={[38.204, -384.368, -602.573]} 
            rotation={[-Math.PI, 0, 0]} 
            scale={25} 
          />
          <animated.pointLight 
            ref={tailLightMiddleMiddleRef}
            name="tail_light_middle_middle" 
            intensity={tailLightIntensity} 
            decay={2} 
            color="#ff0000" 
            position={[-0.018, -384.368, -602.573]} 
            rotation={[-Math.PI, 0, 0]} 
            scale={25} 
          />
          <animated.pointLight 
            ref={tailLightMiddleRightRef}
            name="tail_light_middle_right" 
            intensity={tailLightIntensity} 
            decay={2} 
            color="#ff0000" 
            position={[-47.829, -384.368, -602.573]} 
            rotation={[-Math.PI, 0, 0]} 
            scale={25} 
          />
          <animated.pointLight 
            ref={tailLightRightRef}
            name="tail_light_right" 
            intensity={tailLightIntensity} 
            decay={2} 
            color="#ff0011" 
            position={[-248.999, -326.223, -602.573]} 
            rotation={[-Math.PI, 0, 0]} 
            scale={25} 
          />
          <mesh name="body_inside_new" geometry={nodes.body_inside_new.geometry} material={materials['body inside new']} position={[0, 0, -1.723]} />
          <PaintableMesh name="flag_rim" geometry={nodes.flag_rim.geometry} />
          <animated.mesh 
            ref={flagRef}
            name="robot_flag_new" 
            geometry={nodes.robot_flag_new.geometry} 
            material={materials['body new']} 
            position={[-301.249, 198.68, -535.916]} 
            rotation-x={interpolatedRotation}
            onClick={handleFlagClick} 
          />
          <PaintableMesh name="robot_paintable_body_new" geometry={nodes.robot_paintable_body_new.geometry} />
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

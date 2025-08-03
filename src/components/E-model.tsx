import * as THREE from 'three'
import { useAnimations } from '@react-three/drei'
import { GLTFLoader, type GLTF } from 'three-stdlib'
import React, { useEffect, useMemo, useRef, useCallback, useImperativeHandle, forwardRef, useContext } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useThree, useFrame, useLoader } from '@react-three/fiber'
import { useSpring, animated, easings } from '@react-spring/three'
import { useTooltip } from '../contexts/tooltip-context'
import { OverlayTextureContext } from '../contexts/overlay-texture-canvas-context'

interface GLTFAction extends THREE.AnimationClip {
  name: 'open lid'
}

type GLTFResult = GLTF & {
  nodes: {
    robot_new: THREE.Mesh
    lid_new: THREE.Mesh
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
    ['body paintable new']: THREE.MeshStandardMaterial
    ['body inside new']: THREE.MeshStandardMaterial
    wheel: THREE.MeshPhysicalMaterial
    baseColor?: THREE.MeshStandardMaterial
  }
  animations: GLTFAction[]
}

interface ModelProps extends React.ComponentProps<'group'> {
  tailLightColor: string
  headlightsOn: boolean
  taillightsOn: boolean
  onToggleHeadlights: () => void
  onToggleTaillights: () => void
  lidOpen: boolean
  setLidOpen: (open: boolean) => void
  initialBaseColor: string
  initialOverlayTintColor: string
  headlightsIntensity: number
  taillightsIntensity: number
}

export interface ModelRef {
  updateBaseColor: (color: string) => void
  updateOverlayTintColor: (color: string) => void
  touchFlag: () => void
}

function createPixeImageUrl() {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    ctx.fillRect(0, 0, 1, 1)
    return canvas.toDataURL('image/png')
}

const loadingManager = new THREE.LoadingManager()
loadingManager.setURLModifier((url) => {
  if (url.includes('paintable_uv.png')) {
    return createPixeImageUrl()
  }
  return url
})

export const Model = forwardRef<ModelRef, ModelProps>(({ 
  tailLightColor: tailMiddleLightColor,
  headlightsOn,
  taillightsOn,
  onToggleHeadlights, 
  onToggleTaillights, 
  lidOpen,
  setLidOpen,
  initialBaseColor,
  initialOverlayTintColor,
  headlightsIntensity: _headlightsIntensity,
  taillightsIntensity: _taillightsIntensity,
  ...props 
}, ref) => {
  const group = React.useRef<THREE.Group>(null)
  const leftHeadlightRef = useRef<THREE.PointLight>(null)
  const rightHeadlightRef = useRef<THREE.PointLight>(null)
  const tailLightLeftRef = useRef<THREE.PointLight>(null)
  const tailLightMiddleLeftRef = useRef<THREE.PointLight>(null)
  const tailLightMiddleMiddleRef = useRef<THREE.PointLight>(null)
  const tailLightMiddleRightRef = useRef<THREE.PointLight>(null)
  const tailLightRightRef = useRef<THREE.PointLight>(null)
  const flagRef = useRef<THREE.Mesh>(null)

  const { nodes, materials, animations } = useLoader(GLTFLoader, '/e-model.gltf', (loader) => {
    loader.manager = loadingManager
  }) as unknown as GLTFResult

  const { actions } = useAnimations(animations, group)
  const { camera, mouse, raycaster } = useThree()
  const { setTooltip } = useTooltip()
  const currentTooltip = useRef<string | null>(null)
  const { image: overlayImage, updateTrigger } = useContext(OverlayTextureContext)!

  useImperativeHandle(ref, () => ({
    updateBaseColor: (color: string) => {
      if (materials.baseColor) {
        materials.baseColor.color.set(color)
        materials.baseColor.needsUpdate = true
      }
    },
    updateOverlayTintColor: (color: string) => {
      console.log('updating overlay tint color', color)
      if (materials['body paintable new']) {
        materials['body paintable new'].color.set(color)
        materials['body paintable new'].needsUpdate = true
      }
    },
    touchFlag: () => {
      handleFlagClick()
    }
  }), [materials, actions])

  const { headlightIntensity } = useSpring({
    headlightIntensity: headlightsOn ? _headlightsIntensity : 0,
    config: { 
      duration: 300,
      easing: easings.linear
    },
    clamp: true
  })

  const { tailLightIntensity } = useSpring({
    tailLightIntensity: taillightsOn ? _taillightsIntensity : 0,
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

  const handleFlagClick = useCallback((e?: ThreeEvent<MouseEvent>) => {
    e?.stopPropagation()
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
      newTooltip = `${lidOpen ? 'Close' : 'Open'} lid`
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

  useEffect(() => {
    materials.wheel.metalness = 0.3
    materials.wheel.roughness = 0.7
    materials.wheel.envMapIntensity = 0.4
    materials.wheel.clearcoat = 0.2
    materials.wheel.clearcoatRoughness = 0.6
    materials.wheel.reflectivity = 0.25
    materials.wheel.specularIntensity = 0.6
    materials.wheel.ior = 1.6
    materials.wheel.sheen = 0.3
    materials.wheel.sheenRoughness = 0.7
    materials.wheel.sheenColor = new THREE.Color(0x2a2a2a)
    materials.wheel.normalScale = new THREE.Vector2(2.5, 2.5)

    materials['body paintable new'].transparent = true
    materials['body paintable new'].opacity = 1
    materials['body paintable new'].metalness = 0.3
    materials['body paintable new'].roughness = 0.35
    materials['body paintable new'].alphaTest = 0.01

    materials['body new'].metalness = 0.3
    materials['body new'].roughness = 0.35
    
    const baseColorMaterial = materials['body paintable new'].clone()
    baseColorMaterial.map = null
    baseColorMaterial.transparent = false
    baseColorMaterial.opacity = 1
    baseColorMaterial.needsUpdate = true
    baseColorMaterial.side = THREE.FrontSide
    materials.baseColor = baseColorMaterial
    materials.baseColor.color.set(initialBaseColor)

    // swap out the texture for the overlay image
    const originalTexture = materials['body paintable new'].map
    if (!originalTexture) { 
      console.error('no texture')
       return
    }
    if (!originalTexture.image) {
      console.error('no image')
      return
    }
    if (!overlayImage) {
      console.error('no overlay image')
      return
    }
    const imageTexture = originalTexture.clone()
    imageTexture.image = overlayImage
    imageTexture.needsUpdate = true
    materials['body paintable new'].map?.dispose()
    materials['body paintable new'].map = imageTexture
    materials['body paintable new'].map.needsUpdate = true
    materials['body paintable new'].color.set(initialOverlayTintColor)
    materials['body paintable new'].needsUpdate = true
  }, [])

  // Update texture when image changes
  const updateOverlayTexture = useCallback(() => {
    if (!overlayImage || !materials['body paintable new']?.map) return
    
    console.log('E-model: Updating texture with new image')
    // Update the texture image reference and mark as needing update
    materials['body paintable new'].map.image = overlayImage
    materials['body paintable new'].map.needsUpdate = true
    materials['body paintable new'].needsUpdate = true
  }, [overlayImage, materials])

  // Listen for image updates
  useEffect(() => {
    if (updateTrigger > 0) {
      updateOverlayTexture()
    }
  }, [updateTrigger, updateOverlayTexture])

  const PaintableMesh = useCallback<React.FC<Omit<React.ComponentProps<'mesh'>, 'material'>>>(({ onClick, name, geometry, position, rotation, scale, ...props }) => {
    return (
      <group name={name} onClick={onClick} position={position} rotation={rotation} scale={scale}>
        {materials.baseColor ? (
          <mesh {...props} geometry={geometry} material={materials.baseColor} name={name + '_base'}  />
        ) : null}
        <mesh {...props} geometry={geometry} material={materials['body paintable new']} name={name + '_overlay'}  />
      </group>
    )
  }, [])

  const handleLidClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    setLidOpen(!lidOpen)
  }

  useEffect(() => {
    const action = actions['open lid']
    if (!action) {
      return;
    }
    action.timeScale = lidOpen ? 1 : -1
    action.paused = false
    action.play()
  }, [lidOpen])

  const handleHitboxClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    console.log('Hitbox clicked:', e.object.name)
    if (e.object.name.includes('headlight')) {
      console.log('Toggling headlights')
      onToggleHeadlights()
    } else if (e.object.name.includes('tail_light')) {
      console.log('Toggling taillights')
      onToggleTaillights()
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
  }, [handleHitboxClick])

  const headlightColor = '#ffe8a0'
  const tailLightColor = '#ff0011'

  return (
      <group ref={group} {...props} dispose={null}>
        <mesh name="robot_new" geometry={nodes.robot_new.geometry} material={materials['body new']} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>

          {/* Hitboxes */}
          {hitboxes}

          {/* Lid */}
          <PaintableMesh 
            name="lid_new" 
            geometry={nodes.lid_new.geometry} 
            position={[0, 447.187, -637.429]}
            onClick={handleLidClick}
          />

          {/* Headlights */}
          <animated.pointLight 
            ref={leftHeadlightRef}
            name="headlight_left" 
            intensity={headlightIntensity} 
            decay={2} 
            color={headlightColor} 
            position={[-235.912, 385.374, -301.501]} 
            rotation={[-Math.PI, 0, 0]} 
            scale={30} 
          />
          <animated.pointLight 
            ref={rightHeadlightRef}
            name="headlight_right" 
            intensity={headlightIntensity} 
            decay={2} 
            color={headlightColor} 
            position={[241.584, 386.931, -299.362]} 
            rotation={[-Math.PI, 0, 0]} 
            scale={30} 
          />


          {/* Tail Middle Lights */}
          <animated.pointLight 
            ref={tailLightMiddleLeftRef}
            name="tail_light_middle_left" 
            intensity={tailLightIntensity} 
            decay={2} 
            color={tailMiddleLightColor} 
            position={[38.204, -384.368, -602.573]} 
            rotation={[-Math.PI, 0, 0]} 
            scale={25} 
          />
          <animated.pointLight 
            ref={tailLightMiddleMiddleRef}
            name="tail_light_middle_middle" 
            intensity={tailLightIntensity} 
            decay={2} 
            color={tailMiddleLightColor} 
            position={[-0.018, -384.368, -602.573]} 
            rotation={[-Math.PI, 0, 0]} 
            scale={25} 
          />
          <animated.pointLight 
            ref={tailLightMiddleRightRef}
            name="tail_light_middle_right" 
            intensity={tailLightIntensity} 
            decay={2} 
            color={tailMiddleLightColor} 
            position={[-47.829, -384.368, -602.573]} 
            rotation={[-Math.PI, 0, 0]} 
            scale={25} 
          />

          {/* Tail Side Lights */}
          <animated.pointLight 
            ref={tailLightRightRef}
            name="tail_light_right" 
            intensity={tailLightIntensity} 
            decay={2} 
            color={tailLightColor} 
            position={[-248.999, -326.223, -602.573]} 
            rotation={[-Math.PI, 0, 0]} 
            scale={25} 
          />
          <animated.pointLight 
            ref={tailLightLeftRef}
            name="tail_light_left" 
            intensity={tailLightIntensity} 
            decay={2} 
            color={tailLightColor} 
            position={[250.51, -326.223, -602.573]} 
            rotation={[-Math.PI, 0, 0]} 
            scale={25} 
          />


          <mesh name="body_inside_new" geometry={nodes.body_inside_new.geometry} material={materials['body inside new']} position={[0, 0, -1.723]} />
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
          
          {/* Wheels */}
          <mesh name="wheel_back_left" geometry={nodes.wheel_back_left.geometry} material={materials.wheel} position={[-322.374, -232.137, -139.723]} />
          <mesh name="wheel_back_right" geometry={nodes.wheel_back_right.geometry} material={materials.wheel} position={[322.257, -232.137, -139.723]} rotation={[-Math.PI, 0, -Math.PI]} />
          <mesh name="wheel_front_left" geometry={nodes.wheel_front_left.geometry} material={materials.wheel} position={[-322.374, 348.386, -139.723]} />
          <mesh name="wheel_front_right" geometry={nodes.wheel_front_right.geometry} material={materials.wheel} position={[322.257, 348.386, -139.723]} rotation={[-Math.PI, 0, -Math.PI]} />
          <mesh name="wheel_middle_left" geometry={nodes.wheel_middle_left.geometry} material={materials.wheel} position={[-322.374, 50.272, -139.723]} />
          <mesh name="wheel_middle_right" geometry={nodes.wheel_middle_right.geometry} material={materials.wheel} position={[322.257, 50.272, -139.723]} rotation={[-Math.PI, 0, -Math.PI]} />
        </mesh>
      </group>
  )
})

Model.displayName = 'E-Model'

import * as THREE from 'three'
import { useAnimations } from '@react-three/drei'
import { GLTFLoader, type GLTF } from 'three-stdlib'
import React, {
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useContext,
} from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useThree, useFrame, useLoader } from '@react-three/fiber'
import { useSpring, animated, easings } from '@react-spring/three'
import { useTooltip } from '../contexts/tooltip-context'
import {
  createBlankTexture,
  OverlayTextureContext,
} from '../contexts/overlay-texture-canvas-context'

export const HEADLIGHT_INTENSITY_DEFAULT = 12
export const TAILLIGHT_INTENSITY_DEFAULT = 12
export const TAILLIGHT_COLOR_DEFAULT = '#ff0000'

interface GLTFAction extends THREE.AnimationClip {
  name: 'open lid' | 'rocker'
}

type GLTFResult = GLTF & {
  nodes: {
    robot: THREE.Mesh
    lid: THREE.Mesh
    lid_inside: THREE.Mesh
    ['rocker-bogie']: THREE.Mesh
    wheel_back_left: THREE.Mesh
    wheel_back_right: THREE.Mesh
    wheel_middle_left: THREE.Mesh
    wheel_middle_right: THREE.Mesh
    wheel_front_left: THREE.Mesh
    wheel_front_right: THREE.Mesh
    body_back: THREE.Mesh
    body_front: THREE.Mesh
    body_inside: THREE.Mesh
    body_left: THREE.Mesh
    body_right: THREE.Mesh
    robot_flag_new: THREE.Mesh
  }
  materials: {
    body: THREE.MeshStandardMaterial
    Lid: THREE.MeshStandardMaterial
    ['body inside light']: THREE.MeshStandardMaterial
    wheel: THREE.MeshPhysicalMaterial
    Back: THREE.MeshStandardMaterial
    Front: THREE.MeshStandardMaterial
    ['body inside dark']: THREE.MeshStandardMaterial
    Left: THREE.MeshStandardMaterial
    Right: THREE.MeshStandardMaterial
  }
  animations: GLTFAction[]
}

interface ModelProps extends React.ComponentProps<'group'> {
  onHeadlightIntensityChanged: (value: number) => void
  onTaillightIntensityChanged: (value: number) => void
  onLidOpenChanged: (open: boolean) => void
  initialHeadlightIntensity: number
  initialTailLightIntensity: number
  onBogieAmountChanged: (amount: number) => void
}

export interface ModelRef {
  touchFlag: () => void
  setBogieAmount: (amount: number) => void
  setTailLightColor: (color: string) => void
  setLidOpen: (open: boolean) => void
  setHeadlightsIntensity: (intensity: number) => void
  setTaillightsIntensity: (intensity: number) => void
  updateLevaLidState?: (open: boolean) => void
}

const loadingManager = new THREE.LoadingManager()
loadingManager.setURLModifier(url => {
  if (
    ['/front.png', '/back.png', '/left.png', '/right.png', '/lid.png'].includes(
      url
    )
  ) {
    const img = createBlankTexture('transparent')
    return img.src
  }
  return url
})

export const Model = forwardRef<ModelRef, ModelProps>(
  (
    {
      onLidOpenChanged,
      onHeadlightIntensityChanged,
      onTaillightIntensityChanged,
      initialHeadlightIntensity,
      initialTailLightIntensity,
      onBogieAmountChanged,
      ...props
    },
    ref
  ) => {
    const group = React.useRef<THREE.Group>(null)
    const updateLevaLidStateRef = useRef<((open: boolean) => void) | null>(null)
    const leftHeadlightRef = useRef<THREE.PointLight>(null)
    const rightHeadlightRef = useRef<THREE.PointLight>(null)
    const tailLightLeftRef = useRef<THREE.PointLight>(null)
    const tailLightMiddleLeftRef = useRef<THREE.PointLight>(null)
    const tailLightMiddleMiddleRef = useRef<THREE.PointLight>(null)
    const tailLightMiddleRightRef = useRef<THREE.PointLight>(null)
    const tailLightRightRef = useRef<THREE.PointLight>(null)
    const flagRef = useRef<THREE.Mesh>(null)

    console.log('Model component rendered')

    const { nodes, materials, animations } = useLoader(
      GLTFLoader,
      '/e-model.gltf',
      loader => {
        loader.manager = loadingManager
      }
    ) as unknown as GLTFResult

    const { actions } = useAnimations(animations, group)
    const { camera, mouse, raycaster } = useThree()
    const { setTooltip } = useTooltip()
    const currentTooltip = useRef<string | null>(null)
    const textures = useContext(OverlayTextureContext)

    const [rockerSpring, rockerApi] = useSpring(() => ({
      progress: 0.5,
      config: {
        easing: easings.easeOutBounce,
        duration: 1500,
      },
      onStart: () => {
        onBogieAmountChanged(rockerSpring.progress.goal)
      },
      onRest: () => {
        const finalAmount = rockerSpring.progress.get()
        onBogieAmountChanged(finalAmount)
      },
    }))

    const internalSetBogieAmount = (amount: number) => {
      rockerApi.start({ progress: amount })
    }

    useImperativeHandle(
      ref,
      () => ({
        touchFlag: () => {
          handleFlagClick()
        },
        setBogieAmount: (amount: number) => {
          internalSetBogieAmount(amount)
        },
        setTailLightColor: (color: string) => {
          updateTailLightColor(color)
        },
        setLidOpen: (open: boolean) => {
          internalSetLidOpen(open)
        },
        setHeadlightsIntensity: (intensity: number) => {
          updateHeadlights(intensity)
        },
        setTaillightsIntensity: (intensity: number) => {
          updateTaillights(intensity)
        },
        updateLevaLidState: (open: boolean) => {
          if (updateLevaLidStateRef.current) {
            updateLevaLidStateRef.current(open)
          }
        },
      }),
      [materials, actions, rockerApi]
    )

    const toggleHeadlights = () => {
      const wasOn = (leftHeadlightRef.current?.intensity ?? 0) > 0
      const newIntensity = wasOn ? 0 : HEADLIGHT_INTENSITY_DEFAULT
      updateHeadlights(newIntensity)
      onHeadlightIntensityChanged(newIntensity)
    }
    const updateHeadlights = (intensity?: number) => {
      if (leftHeadlightRef.current) {
        leftHeadlightRef.current.intensity = intensity ?? 0
      }
      if (rightHeadlightRef.current) {
        rightHeadlightRef.current.intensity = intensity ?? 0
      }
    }

    const toggleTaillights = () => {
      const wasOn = (tailLightLeftRef.current?.intensity ?? 0) > 0
      const newIntensity = wasOn ? 0 : TAILLIGHT_INTENSITY_DEFAULT
      updateTaillights(newIntensity)
      onTaillightIntensityChanged(newIntensity)
    }
    const updateTaillights = (intensity?: number) => {
      const taillightRefs = [
        tailLightLeftRef,
        tailLightMiddleLeftRef,
        tailLightMiddleMiddleRef,
        tailLightMiddleRightRef,
        tailLightRightRef,
      ]
      taillightRefs.forEach(ref => {
        if (ref.current) {
          ref.current.intensity = intensity ?? 0
        }
      })
    }

    const updateTailLightColor = (color: string) => {
      const taillightRefs = [
        tailLightLeftRef,
        tailLightMiddleLeftRef,
        tailLightMiddleMiddleRef,
        tailLightMiddleRightRef,
        tailLightRightRef,
      ]
      taillightRefs.forEach(ref => {
        if (ref.current) {
          ref.current.color.set(color)
        }
      })
    }

    const internalSetLidOpen = (open: boolean) => {
      const action = actions['open lid']
      if (action) {
        action.timeScale = open ? 1 : -1
        action.paused = false
        action.play()
      }
      onLidOpenChanged(open)
    }

    const [springs, api] = useSpring(() => ({
      rotationX: 0,
      config: {
        mass: 1.2,
        tension: 800,
        friction: 20,
        velocity: 0,
      },
    }))

    useEffect(() => {
      const lidAction = actions['open lid']
      if (lidAction) {
        lidAction.loop = THREE.LoopOnce
        lidAction.clampWhenFinished = true
        lidAction.time = 0
        lidAction.paused = true // Keep it paused at initial position
      }

      const rockerAction = actions['rocker']
      if (rockerAction) {
        rockerAction.loop = THREE.LoopOnce
        rockerAction.clampWhenFinished = true
        rockerAction.timeScale = 1
        rockerAction.play()
        rockerAction.reset()
        rockerAction.paused = true
      }
    }, [actions])

    const handleFlagClick = useCallback(
      (e?: ThreeEvent<MouseEvent>) => {
        e?.stopPropagation()
        api.start({
          from: { rotationX: 0 },
          to: { rotationX: 1 },
          config: {
            mass: 1.2,
            tension: 800,
            friction: 20,
          },
          onRest: () => {
            api.set({ rotationX: 0 })
          },
        })
      },
      [api]
    )

    const interpolatedRotation = springs.rotationX.to({
      range: [0, 0.5, 1],
      output: [0, Math.PI / 6, 0],
    })

    useFrame(() => {
      const rockerAction = actions['rocker']
      if (rockerAction) {
        // const springProgress = rockerSpring.progress.get()
        rockerAction.time =
          rockerAction.getClip().duration * rockerSpring.progress.get()
      }

      // Handle raycasting for tooltips
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(
        group.current?.children || [],
        true
      )
      const firstIntersect = intersects[0]

      let newTooltip: string | null = null
      if (firstIntersect?.object.name.includes('lid')) {
        newTooltip = `Lid (${currentLidStateOpen() ? 'Close' : 'Open'})`
      } else if (firstIntersect?.object.name.includes('headlight')) {
        newTooltip = 'Head Lights (Toggle)'
      } else if (firstIntersect?.object.name.includes('tail_light')) {
        newTooltip = 'Tail Lights (Toggle)'
      } else if (firstIntersect?.object.name.includes('flag')) {
        newTooltip = 'Flag (Flick)'
      } else if (firstIntersect?.object.name.includes('wheel')) {
        newTooltip = 'Wheel (Toggle Bogie)'
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

      materials.Back.transparent = true
      materials.Back.opacity = 1
      materials.Back.metalness = 0.3
      materials.Back.roughness = 0.35
      materials.Back.alphaTest = 0.01

      materials.Front.transparent = true
      materials.Front.opacity = 1
      materials.Front.metalness = 0.3
      materials.Front.roughness = 0.35
      materials.Front.alphaTest = 0.01

      materials.Left.transparent = true
      materials.Left.opacity = 1
      materials.Left.metalness = 0.3
      materials.Left.roughness = 0.35
      materials.Left.alphaTest = 0.01

      materials.Right.transparent = true
      materials.Right.opacity = 1
      materials.Right.metalness = 0.3
      materials.Right.roughness = 0.35
      materials.Right.alphaTest = 0.01

      materials.Lid.transparent = true
      materials.Lid.opacity = 1
      materials.Lid.metalness = 0.3
      materials.Lid.roughness = 0.35
      materials.Lid.alphaTest = 0.01

      materials.body.metalness = 0.3
      materials.body.roughness = 0.35
    }, [])

    useEffect(() => {
      if (textures?.lid && materials.Lid.map) {
        materials.Lid.map.image = textures.lid
        materials.Lid.map.needsUpdate = true
        materials.Lid.needsUpdate = true
      }
    }, [textures?.lid])
    useEffect(() => {
      if (textures?.front && materials.Front.map) {
        materials.Front.map.image = textures.front
        materials.Front.map.needsUpdate = true
        materials.Front.needsUpdate = true
      }
    }, [textures?.front])
    useEffect(() => {
      if (textures?.back && materials.Back.map) {
        materials.Back.map.image = textures.back
        materials.Back.map.needsUpdate = true
        materials.Back.needsUpdate = true
      }
    }, [textures?.back])
    useEffect(() => {
      if (textures?.left && materials.Left.map) {
        materials.Left.map.image = textures.left
        materials.Left.map.needsUpdate = true
        materials.Left.needsUpdate = true
      }
    }, [textures?.left])
    useEffect(() => {
      if (textures?.right && materials.Right.map) {
        materials.Right.map.image = textures.right
        materials.Right.map.needsUpdate = true
        materials.Right.needsUpdate = true
      }
    }, [textures?.right])

    const currentLidStateOpen = useCallback(() => {
      const lidAction = actions['open lid']
      if (!lidAction) return false
      const duration = lidAction.getClip().duration
      const currentProgress = lidAction.time / duration
      return currentProgress >= 0.5
    }, [actions])

    const handleLidClick = useCallback((e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      const newLidOpen = !currentLidStateOpen()
      internalSetLidOpen(newLidOpen)
      if (updateLevaLidStateRef.current) {
        updateLevaLidStateRef.current(newLidOpen)
      }
    }, [])

    const handleHitboxClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      console.log('Hitbox clicked:', e.object.name)
      if (e.object.name.includes('headlight')) {
        console.log('Toggling headlights')
        toggleHeadlights()
      } else if (e.object.name.includes('tail_light')) {
        console.log('Toggling taillights')
        toggleTaillights()
      }
    }

    const toggleBogieToTarget = (target: number) => {
      const currentAmount = rockerSpring.progress.get()
      const distanceToNormal = Math.abs(currentAmount - 0.5)
      const distanceToTarget = Math.abs(currentAmount - target)
      if (distanceToNormal < distanceToTarget) {
        internalSetBogieAmount(target)
      } else {
        internalSetBogieAmount(0.5)
      }
    }

    const hanldeOnFrontWheelClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      toggleBogieToTarget(1)
    }

    const handleOnMiddleWheelClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      toggleBogieToTarget(0)
    }

    const handleOnBackWheelClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      toggleBogieToTarget(1)
    }

    const hitboxes = useMemo(() => {
      const hitboxes = []
      const hitboxRefs = [
        leftHeadlightRef,
        rightHeadlightRef,
        tailLightLeftRef,
        tailLightMiddleLeftRef,
        tailLightMiddleMiddleRef,
        tailLightMiddleRightRef,
        tailLightRightRef,
      ]

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
              <meshBasicMaterial
                color="red"
                transparent
                opacity={0.5}
                visible={false}
              />
            </mesh>
          )
        }
      }
      return hitboxes
    }, [handleHitboxClick])

    const headlightColor = '#ffe8a0'

    return (
      <group ref={group} {...props} dispose={null}>
        <mesh
          name="robot"
          geometry={nodes.robot.geometry}
          material={materials.body}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0.01}
        >
          {/* Hitboxes */}
          {hitboxes}

          {/* Lid */}
          <mesh
            name="lid"
            geometry={nodes.lid.geometry}
            material={materials.Lid}
            position={[0, 447.187, -637.429]}
            onClick={handleLidClick}
          >
            <mesh
              name="lid_inside"
              geometry={nodes.lid_inside.geometry}
              material={materials['body inside dark']} // light
            />
          </mesh>

          {/* Headlights */}
          <pointLight
            ref={leftHeadlightRef}
            name="headlight_left"
            intensity={initialHeadlightIntensity}
            decay={2}
            color={headlightColor}
            position={[-235.912, 385.374, -301.501]}
            rotation={[-Math.PI, 0, 0]}
            scale={30}
          />
          <pointLight
            ref={rightHeadlightRef}
            name="headlight_right"
            intensity={initialHeadlightIntensity}
            decay={2}
            color={headlightColor}
            position={[241.584, 386.931, -299.362]}
            rotation={[-Math.PI, 0, 0]}
            scale={30}
          />

          {/* Tail Middle Lights */}
          <pointLight
            ref={tailLightMiddleLeftRef}
            name="tail_light_middle_left"
            intensity={initialTailLightIntensity}
            decay={2}
            color={TAILLIGHT_COLOR_DEFAULT}
            position={[38.204, -384.368, -602.573]}
            rotation={[-Math.PI, 0, 0]}
            scale={25}
          />
          <pointLight
            ref={tailLightMiddleMiddleRef}
            name="tail_light_middle_middle"
            intensity={initialTailLightIntensity}
            decay={2}
            color={TAILLIGHT_COLOR_DEFAULT}
            position={[-0.018, -384.368, -602.573]}
            rotation={[-Math.PI, 0, 0]}
            scale={25}
          />
          <pointLight
            ref={tailLightMiddleRightRef}
            name="tail_light_middle_right"
            intensity={initialTailLightIntensity}
            decay={2}
            color={TAILLIGHT_COLOR_DEFAULT}
            position={[-47.829, -384.368, -602.573]}
            rotation={[-Math.PI, 0, 0]}
            scale={25}
          />

          {/* Tail Side Lights */}
          <pointLight
            ref={tailLightRightRef}
            name="tail_light_right"
            intensity={initialTailLightIntensity}
            decay={2}
            color={TAILLIGHT_COLOR_DEFAULT}
            position={[-248.999, -326.223, -602.573]}
            rotation={[-Math.PI, 0, 0]}
            scale={25}
          />
          <pointLight
            ref={tailLightLeftRef}
            name="tail_light_left"
            intensity={initialTailLightIntensity}
            decay={2}
            color={TAILLIGHT_COLOR_DEFAULT}
            position={[250.51, -326.223, -602.573]}
            rotation={[-Math.PI, 0, 0]}
            scale={25}
          />

          <animated.mesh
            ref={flagRef}
            name="robot_flag_new"
            geometry={nodes.robot_flag_new.geometry}
            material={materials.body}
            position={[-301.249, 198.68, -535.916]}
            rotation-x={interpolatedRotation}
            onClick={handleFlagClick}
          />

          {/* Body sides */}
          <mesh
            name="body_back"
            geometry={nodes.body_back.geometry}
            material={materials.Back}
          />
          <mesh
            name="body_front"
            geometry={nodes.body_front.geometry}
            material={materials.Front}
          />
          <mesh
            name="body_left"
            geometry={nodes.body_left.geometry}
            material={materials.Left}
          />
          <mesh
            name="body_right"
            geometry={nodes.body_right.geometry}
            material={materials.Right}
          />

          {/* Body inside */}
          <mesh
            name="body_inside"
            geometry={nodes.body_inside.geometry}
            material={materials['body inside dark']}
            position={[0, 0, -1.723]}
          />

          {/* Wheels */}
          <mesh
            name="wheel_front_left"
            onClick={hanldeOnFrontWheelClick}
            geometry={nodes.wheel_front_left.geometry}
            material={materials.wheel}
            position={[-322.374, 348.386, -139.723]}
          />
          <mesh
            name="wheel_front_right"
            onClick={hanldeOnFrontWheelClick}
            geometry={nodes.wheel_front_right.geometry}
            material={materials.wheel}
            position={[322.257, 348.386, -139.723]}
            rotation={[-Math.PI, 0, -Math.PI]}
          />
          <mesh
            name="rocker-bogie"
            geometry={nodes['rocker-bogie'].geometry}
            material={materials.body}
            position={[0.008, -89.078, -141.649]}
          >
            <mesh
              name="wheel_back_left"
              onClick={handleOnBackWheelClick}
              geometry={nodes.wheel_back_left.geometry}
              material={materials.wheel}
              position={[-322.382, -143.059, 1.926]}
            />
            <mesh
              name="wheel_back_right"
              onClick={handleOnBackWheelClick}
              geometry={nodes.wheel_back_right.geometry}
              material={materials.wheel}
              position={[322.249, -143.059, 1.926]}
              rotation={[-Math.PI, 0, -Math.PI]}
            />
            <mesh
              onClick={handleOnMiddleWheelClick}
              name="wheel_middle_left"
              geometry={nodes.wheel_middle_left.geometry}
              material={materials.wheel}
              position={[-322.382, 139.349, 1.926]}
            />
            <mesh
              onClick={handleOnMiddleWheelClick}
              name="wheel_middle_right"
              geometry={nodes.wheel_middle_right.geometry}
              material={materials.wheel}
              position={[322.249, 139.349, 1.926]}
              rotation={[-Math.PI, 0, -Math.PI]}
            />
          </mesh>
        </mesh>
      </group>
    )
  }
)

Model.displayName = 'E-Model'

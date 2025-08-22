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
import { OverlayTextureContext } from '../contexts/overlay-texture-canvas-context'
import { texture } from 'three/tsl'

export const HEADLIGHT_INTENSITY_DEFAULT = 12
export const TAILLIGHT_INTENSITY_DEFAULT = 12
export const TAILLIGHT_COLOR_DEFAULT = '#ff0000'
export const BASE_COLOR_DEFAULT = '#ffffff'

interface GLTFAction extends THREE.AnimationClip {
  name: 'open lid' | 'rocker'
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
    ['rocker-bogie']: THREE.Mesh
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
  onHeadlightIntensityChanged: (value: number) => void
  onTaillightIntensityChanged: (value: number) => void
  onLidOpenChanged: (open: boolean) => void
}

export interface ModelRef {
  updateBaseColor: (color: string) => void
  touchFlag: () => void
  animateRockerToFrame: (frame: number) => void
  setTailLightColor: (color: string) => void
  setLidOpen: (open: boolean) => void
  setHeadlightsIntensity: (intensity: number) => void
  setTaillightsIntensity: (intensity: number) => void
  updateLevaLidState?: (open: boolean) => void
}

function createPixeImageUrl() {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.fillRect(0, 0, 1, 1)
  return canvas.toDataURL('image/png')
}

const loadingManager = new THREE.LoadingManager()
loadingManager.setURLModifier(url => {
  if (url.includes('paintable_uv.png')) {
    return createPixeImageUrl()
  }
  return url
})

export const Model = forwardRef<ModelRef, ModelProps>(
  (
    {
      onLidOpenChanged,
      onHeadlightIntensityChanged,
      onTaillightIntensityChanged,
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
    const texture = useContext(OverlayTextureContext)
    if (!texture) {
      console.error('no texture')
      return
    }
    const { image: overlayImage, updateTrigger } = texture

    const [rockerSpring, rockerApi] = useSpring(() => ({
      progress: 0.5,
      config: {
        easing: easings.easeOutBounce,
        duration: 1500,
      },
    }))

    useImperativeHandle(
      ref,
      () => ({
        updateBaseColor: (color: string) => {
          if (materials.baseColor) {
            materials.baseColor.color.set(color)
            materials.baseColor.needsUpdate = true
          }
        },
        touchFlag: () => {
          handleFlagClick()
        },
        animateRockerToFrame: (frame: number) => {
          rockerApi.start({
            to: { progress: frame },
          })
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
        newTooltip = 'Toggle lid'
      } else if (firstIntersect?.object.name.includes('headlight')) {
        newTooltip = 'Toggle headlights'
      } else if (firstIntersect?.object.name.includes('tail_light')) {
        newTooltip = 'Toggle tail lights'
      } else if (firstIntersect?.object.name.includes('flag')) {
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
      materials.baseColor.color.set('#ffffff') // TODO: refactor this is hardcoded in many places

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

    const PaintableMesh = useCallback<
      React.FC<Omit<React.ComponentProps<'mesh'>, 'material'>>
    >(({ onClick, name, geometry, position, rotation, scale, ...props }) => {
      return (
        <group
          name={name}
          onClick={onClick}
          position={position}
          rotation={rotation}
          scale={scale}
        >
          {materials.baseColor ? (
            <mesh
              {...props}
              geometry={geometry}
              material={materials.baseColor}
              name={name + '_base'}
            />
          ) : null}
          <mesh
            {...props}
            geometry={geometry}
            material={materials['body paintable new']}
            name={name + '_overlay'}
          />
        </group>
      )
    }, [])

    const handleLidClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()

      // Check current animation state to determine if lid is open or closed
      const lidAction = actions['open lid']
      if (!lidAction) return

      const duration = lidAction.getClip().duration
      const currentProgress = lidAction.time / duration

      // If closer to beginning (< 0.5), it's closed, so open it
      // If closer to end (>= 0.5), it's open, so close it
      const isCurrentlyClosed = currentProgress < 0.5
      const newLidOpen = isCurrentlyClosed

      console.log(
        'Lid click - current progress:',
        currentProgress,
        'new state:',
        newLidOpen ? 'open' : 'closed'
      )

      internalSetLidOpen(newLidOpen)

      // Update Leva control to reflect the new state
      if (updateLevaLidStateRef.current) {
        updateLevaLidStateRef.current(newLidOpen)
      }
    }

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
          name="robot_new"
          geometry={nodes.robot_new.geometry}
          material={materials['body new']}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0.01}
        >
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
          <pointLight
            ref={leftHeadlightRef}
            name="headlight_left"
            intensity={HEADLIGHT_INTENSITY_DEFAULT}
            decay={2}
            color={headlightColor}
            position={[-235.912, 385.374, -301.501]}
            rotation={[-Math.PI, 0, 0]}
            scale={30}
          />
          <pointLight
            ref={rightHeadlightRef}
            name="headlight_right"
            intensity={HEADLIGHT_INTENSITY_DEFAULT}
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
            intensity={TAILLIGHT_INTENSITY_DEFAULT}
            decay={2}
            color={TAILLIGHT_COLOR_DEFAULT}
            position={[38.204, -384.368, -602.573]}
            rotation={[-Math.PI, 0, 0]}
            scale={25}
          />
          <pointLight
            ref={tailLightMiddleMiddleRef}
            name="tail_light_middle_middle"
            intensity={TAILLIGHT_INTENSITY_DEFAULT}
            decay={2}
            color={TAILLIGHT_COLOR_DEFAULT}
            position={[-0.018, -384.368, -602.573]}
            rotation={[-Math.PI, 0, 0]}
            scale={25}
          />
          <pointLight
            ref={tailLightMiddleRightRef}
            name="tail_light_middle_right"
            intensity={TAILLIGHT_INTENSITY_DEFAULT}
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
            intensity={TAILLIGHT_INTENSITY_DEFAULT}
            decay={2}
            color={TAILLIGHT_COLOR_DEFAULT}
            position={[-248.999, -326.223, -602.573]}
            rotation={[-Math.PI, 0, 0]}
            scale={25}
          />
          <pointLight
            ref={tailLightLeftRef}
            name="tail_light_left"
            intensity={TAILLIGHT_INTENSITY_DEFAULT}
            decay={2}
            color={TAILLIGHT_COLOR_DEFAULT}
            position={[250.51, -326.223, -602.573]}
            rotation={[-Math.PI, 0, 0]}
            scale={25}
          />

          <mesh
            name="body_inside_new"
            geometry={nodes.body_inside_new.geometry}
            material={materials['body inside new']}
            position={[0, 0, -1.723]}
          />
          <animated.mesh
            ref={flagRef}
            name="robot_flag_new"
            geometry={nodes.robot_flag_new.geometry}
            material={materials['body new']}
            position={[-301.249, 198.68, -535.916]}
            rotation-x={interpolatedRotation}
            onClick={handleFlagClick}
          />
          <PaintableMesh
            name="robot_paintable_body_new"
            geometry={nodes.robot_paintable_body_new.geometry}
          />

          {/* Wheels */}
          <mesh
            name="wheel_front_left"
            geometry={nodes.wheel_front_left.geometry}
            material={materials.wheel}
            position={[-322.374, 348.386, -139.723]}
          />
          <mesh
            name="wheel_front_right"
            geometry={nodes.wheel_front_right.geometry}
            material={materials.wheel}
            position={[322.257, 348.386, -139.723]}
            rotation={[-Math.PI, 0, -Math.PI]}
          />
          <mesh
            name="rocker-bogie"
            geometry={nodes['rocker-bogie'].geometry}
            material={materials['body new']}
            position={[0.008, -89.078, -141.649]}
          >
            <mesh
              name="wheel_back_left"
              geometry={nodes.wheel_back_left.geometry}
              material={materials.wheel}
              position={[-322.382, -143.059, 1.926]}
            />
            <mesh
              name="wheel_back_right"
              geometry={nodes.wheel_back_right.geometry}
              material={materials.wheel}
              position={[322.249, -143.059, 1.926]}
              rotation={[-Math.PI, 0, -Math.PI]}
            />
            <mesh
              name="wheel_middle_left"
              geometry={nodes.wheel_middle_left.geometry}
              material={materials.wheel}
              position={[-322.382, 139.349, 1.926]}
            />
            <mesh
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

import { animated, useSpring } from "@react-spring/three";
import { useAnimations } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import React, {
	forwardRef,
	useCallback,
	useContext,
	useEffect,
	useImperativeHandle,
	useRef,
} from "react";
import * as THREE from "three";
import { type GLTF, GLTFLoader } from "three-stdlib";
import {
	createBlankTexture,
	OverlayTextureContext,
} from "../contexts/overlay-texture-canvas-context";
import { useTooltip } from "../contexts/tooltip-context";
import { useBogieAnimation } from "../hooks/useBogieAnimation";
import { useLidAnimation } from "../hooks/useLidAnimation";
import {
	MODEL_DEFAULTS,
	useHeadlightIntensity,
	useLidOpen,
	useModelStore,
	useTaillightColor,
	useTaillightIntensity,
} from "../stores/model-store";

interface GLTFAction extends THREE.AnimationClip {
	name: "open lid" | "rocker";
}

type GLTFResult = GLTF & {
	nodes: {
		robot: THREE.Mesh;
		lid: THREE.Mesh;
		lid_inside: THREE.Mesh;
		strip: THREE.Mesh;
		"rocker-bogie": THREE.Mesh;
		wheel_back_left: THREE.Mesh;
		wheel_back_right: THREE.Mesh;
		wheel_middle_left: THREE.Mesh;
		wheel_middle_right: THREE.Mesh;
		wheel_front_left: THREE.Mesh;
		wheel_front_right: THREE.Mesh;
		Basket: THREE.Mesh;
		body_back: THREE.Mesh;
		body_front: THREE.Mesh;
		body_inside: THREE.Mesh;
		body_left: THREE.Mesh;
		body_right: THREE.Mesh;
		robot_flag_new: THREE.Mesh;
	};
	materials: {
		body: THREE.MeshStandardMaterial;
		Lid: THREE.MeshStandardMaterial;
		"body inside light": THREE.MeshStandardMaterial;
		"body inside dark": THREE.MeshStandardMaterial;
		strip: THREE.MeshStandardMaterial;
		wheel: THREE.MeshPhysicalMaterial;
		Back: THREE.MeshStandardMaterial;
		Front: THREE.MeshStandardMaterial;
		Left: THREE.MeshStandardMaterial;
		Right: THREE.MeshStandardMaterial;
	};
	animations: GLTFAction[];
};

type ModelProps = React.ComponentProps<"group"> & {
	interactive?: boolean;
	lightsOff?: boolean;
	unlit?: boolean;
};

export interface ModelRef {
	touchFlag: () => void;
}

// Side/lid textures are replaced with blank canvases so users can paint on them.
const TEXTURE_PLACEHOLDER_NAMES = ["front", "back", "left", "right", "lid"];
const loadingManager = new THREE.LoadingManager();
loadingManager.setURLModifier((url) => {
	const baseName = url.replace(/^\//, "").replace(/\.[^.]+$/, "");
	if (TEXTURE_PLACEHOLDER_NAMES.includes(baseName)) {
		const img = createBlankTexture("transparent");
		return img.src;
	}
	// Cache-bust model assets with app version
	if (url.startsWith("/") || url.startsWith("e-model")) {
		const separator = url.includes("?") ? "&" : "?";
		return `${url}${separator}v=${__APP_VERSION__}`;
	}
	return url;
});

export const Model = forwardRef<ModelRef, ModelProps>(
	({ interactive = true, lightsOff = false, unlit = false, ...props }, ref) => {
		const group = React.useRef<THREE.Group>(null);
		const flagRef = useRef<THREE.Mesh>(null);

		const { nodes, materials, animations } = useLoader(
			GLTFLoader,
			`/e-model.gltf?v=${__APP_VERSION__}`,
			(loader) => {
				loader.manager = loadingManager;
			},
		) as unknown as GLTFResult;

		const { actions } = useAnimations(animations, group);
		const { camera, mouse, raycaster } = useThree();
		const { setTooltip } = useTooltip();
		const currentTooltip = useRef<string | null>(null);
		const textures = useContext(OverlayTextureContext);

		// Read state from Zustand store (only for rendering, not for animation)
		const storeHeadlightIntensity = useHeadlightIntensity();
		const storeTaillightIntensity = useTaillightIntensity();
		const taillightColor = useTaillightColor();
		const lidOpen = useLidOpen();

		const headlightIntensity = lightsOff ? 0 : storeHeadlightIntensity;
		const taillightIntensity = lightsOff ? 0 : storeTaillightIntensity;

		// Get store actions
		const setHeadlightIntensity = useModelStore((s) => s.setHeadlightIntensity);
		const setTaillightIntensity = useModelStore((s) => s.setTaillightIntensity);
		const setLidOpen = useModelStore((s) => s.setLidOpen);
		const setBogieTarget = useModelStore((s) => s.setBogieTarget);

		// Bogie animation - encapsulated in custom hook
		useBogieAnimation({ actions, groupRef: group });

		// Lid animation - encapsulated in custom hook with easeOutBounce
		useLidAnimation({ actions, groupRef: group });

		// Flag spring animation
		const [springs, api] = useSpring(() => ({
			rotationX: 0,
			config: {
				mass: 1.2,
				tension: 800,
				friction: 20,
				velocity: 0,
			},
		}));

		const handleFlagClick = useCallback(
			(e?: ThreeEvent<MouseEvent>) => {
				e?.stopPropagation();
				api.start({
					from: { rotationX: 0 },
					to: { rotationX: 1 },
					config: {
						mass: 1.2,
						tension: 800,
						friction: 20,
					},
					onRest: () => {
						api.set({ rotationX: 0 });
					},
				});
			},
			[api],
		);

		// Simplified imperative handle - only touchFlag needed
		useImperativeHandle(
			ref,
			() => ({
				touchFlag: () => {
					handleFlagClick();
				},
			}),
			[handleFlagClick],
		);

		// Toggle handlers write directly to store
		const toggleHeadlights = useCallback(() => {
			const wasOn = headlightIntensity > 0;
			const newIntensity = wasOn ? 0 : MODEL_DEFAULTS.headlightIntensity;
			setHeadlightIntensity(newIntensity);
		}, [headlightIntensity, setHeadlightIntensity]);

		const toggleTaillights = useCallback(() => {
			const wasOn = taillightIntensity > 0;
			const newIntensity = wasOn ? 0 : MODEL_DEFAULTS.taillightIntensity;
			setTaillightIntensity(newIntensity);
		}, [taillightIntensity, setTaillightIntensity]);

		const interpolatedRotation = springs.rotationX.to({
			range: [0, 0.5, 1],
			output: [0, Math.PI / 6, 0],
		});

		// Animation frame - handle tooltips (only when interactive)
		useFrame(() => {
			if (!interactive) return;

			raycaster.setFromCamera(mouse, camera);
			const intersects = raycaster.intersectObjects(
				group.current?.children || [],
				true,
			);
			const firstIntersect = intersects[0];

			let newTooltip: string | null = null;
			if (firstIntersect?.object.name.includes("lid")) {
				newTooltip = `Lid (${lidOpen ? "Close" : "Open"})`;
			} else if (firstIntersect?.object.name.includes("headlight")) {
				newTooltip = "Head Lights (Toggle)";
			} else if (firstIntersect?.object.name.includes("tail_light")) {
				newTooltip = "Tail Lights (Toggle)";
			} else if (firstIntersect?.object.name.includes("flag")) {
				newTooltip = "Flag (Flick)";
			} else if (firstIntersect?.object.name.includes("wheel")) {
				newTooltip = "Wheel (Toggle Bogie)";
			}

			if (newTooltip !== currentTooltip.current) {
				currentTooltip.current = newTooltip;
				setTooltip(newTooltip);
			}
		});

		// Material setup — only override what's needed, rely on GLTF values otherwise
		useEffect(() => {
			// Side/lid materials need transparency for texture painting overlay
			const sideMaterials = [
				materials.Back,
				materials.Front,
				materials.Left,
				materials.Right,
				materials.Lid,
			];
			for (const mat of sideMaterials) {
				mat.transparent = true;
				mat.opacity = 1;
				mat.alphaTest = 0.01;
			}

			// Strip is too reflective — increase roughness for smoother look
			materials.strip.roughness = 0.7;

			// Darken basket interior so details are visible
			materials["body inside light"].color.setHex(0x999999);
			materials["body inside light"].roughness = 0.9;

			// All materials need DoubleSide shadows to prevent light leaking
			const allMaterials = [
				materials.body,
				materials.wheel,
				materials.strip,
				...sideMaterials,
			];
			for (const mat of allMaterials) {
				mat.shadowSide = THREE.DoubleSide;
			}
		}, [
			materials.strip,
			materials["body inside light"],
			materials.Back,
			materials.Front,
			materials.Left,
			materials.Lid,
			materials.Right,
			materials.body,
			materials.wheel,
		]);

		// Unlit mode: swap all materials to MeshBasicMaterial (no lighting)
		useEffect(() => {
			if (!unlit || !group.current) return;
			group.current.traverse((child) => {
				if (child instanceof THREE.Mesh && child.material) {
					const mat = child.material as THREE.MeshStandardMaterial;
					const basic = new THREE.MeshBasicMaterial({
						color: mat.color,
						map: mat.map,
						transparent: mat.transparent,
						opacity: mat.opacity,
						alphaTest: mat.alphaTest,
						side: mat.side,
					});
					child.material = basic;
				}
			});
		}, [unlit]);

		// Texture updates - consolidated
		useEffect(() => {
			const textureMap: [
				HTMLImageElement | undefined,
				THREE.MeshStandardMaterial,
			][] = [
				[textures?.lid, materials.Lid],
				[textures?.front, materials.Front],
				[textures?.back, materials.Back],
				[textures?.left, materials.Left],
				[textures?.right, materials.Right],
			];

			for (const [texture, material] of textureMap) {
				if (texture) {
					if (!material.map) {
						material.map = new THREE.Texture(texture);
					} else {
						material.map.image = texture;
					}
					material.map.needsUpdate = true;
					material.needsUpdate = true;
				}
			}
		}, [
			textures?.lid,
			textures?.front,
			textures?.back,
			textures?.left,
			textures?.right,
			materials.Lid,
			materials.Front,
			materials.Back,
			materials.Left,
			materials.Right,
		]);

		// Click handlers
		const handleLidClick = useCallback(
			(e: ThreeEvent<MouseEvent>) => {
				e.stopPropagation();
				setLidOpen(!lidOpen);
			},
			[lidOpen, setLidOpen],
		);

		const handleHitboxClick = useCallback(
			(e: ThreeEvent<MouseEvent>) => {
				e.stopPropagation();
				if (e.object.name.includes("headlight")) {
					toggleHeadlights();
				} else if (e.object.name.includes("tail_light")) {
					toggleTaillights();
				}
			},
			[toggleHeadlights, toggleTaillights],
		);

		const toggleBogieToTarget = useCallback(
			(target: number) => {
				// Read current target from store
				const currentTarget = useModelStore.getState().bogieTarget;
				const distanceToNormal = Math.abs(currentTarget - 0.5);
				const distanceToTarget = Math.abs(currentTarget - target);
				if (distanceToNormal < distanceToTarget) {
					setBogieTarget(target);
				} else {
					setBogieTarget(0.5);
				}
			},
			[setBogieTarget],
		);

		// Wheel click handlers - front/back use target=1, middle uses target=0
		const handleOuterWheelClick = useCallback(
			(e: ThreeEvent<MouseEvent>) => {
				e.stopPropagation();
				toggleBogieToTarget(1);
			},
			[toggleBogieToTarget],
		);

		const handleMiddleWheelClick = useCallback(
			(e: ThreeEvent<MouseEvent>) => {
				e.stopPropagation();
				toggleBogieToTarget(0);
			},
			[toggleBogieToTarget],
		);

		// Wrapper that renders a real pointLight with limited range
		// plus a glow sphere and invisible hitbox for interaction
		const ClickableLight = ({
			children,
		}: {
			children: React.ReactElement<React.ComponentProps<"pointLight">>;
		}) => {
			const position = children.props.position as [number, number, number];
			const name = children.props.name as string;
			const scale = (children.props.scale as number) ?? 30;
			const color = children.props.color as string | undefined;
			const intensity = (children.props.intensity as number) ?? 0;
			const isOn = intensity > 0;

			return (
				<>
					{/* Real point light with tight range — illuminates nearby surface only */}
					{isOn && (
						<pointLight
							position={position}
							intensity={intensity}
							decay={2}
							distance={scale}
							color={color}
						/>
					)}
					{/* Transparent hitbox for click interaction */}
					<mesh
						name={`${name}_hitbox`}
						position={position}
						onClick={interactive ? handleHitboxClick : undefined}
					>
						<sphereGeometry args={[80, 8, 8]} />
						<meshBasicMaterial transparent opacity={0} depthWrite={false} />
					</mesh>
				</>
			);
		};

		const headlightColor = "#a0d4ff";

		return (
			<group ref={group} {...props} dispose={null}>
				<mesh
					castShadow
					receiveShadow
					name="robot"
					geometry={nodes.robot.geometry}
					material={materials.body}
					position={[0, 0.451, -0.148]}
					rotation={[1.697, 0, 0]}
					scale={0.01}
				>
					{/* Lid */}
					<mesh
						castShadow
						receiveShadow
						name="lid"
						geometry={nodes.lid.geometry}
						material={materials.Lid}
						position={[0, 447.187, -637.429]}
						onClick={interactive ? handleLidClick : undefined}
					>
						<mesh
							name="lid_inside"
							geometry={nodes.lid_inside.geometry}
							material={materials["body inside dark"]}
						/>
						<mesh
							name="strip"
							geometry={nodes.strip.geometry}
							material={materials.strip}
							position={[0, -858.427, 0]}
						/>
					</mesh>

					{/* Headlights */}
					<ClickableLight>
						<pointLight
							name="headlight_left"
							intensity={headlightIntensity}
							decay={2}
							color={headlightColor}
							position={[-238.748, 426.153, -300.432]}
							rotation={[-Math.PI, 0, 0]}
							scale={30}
						/>
					</ClickableLight>
					<ClickableLight>
						<pointLight
							name="headlight_right"
							intensity={headlightIntensity}
							decay={2}
							color={headlightColor}
							position={[238.748, 426.153, -300.432]}
							rotation={[-Math.PI, 0, 0]}
							scale={30}
						/>
					</ClickableLight>

					{/* Tail Middle Lights */}
					<ClickableLight>
						<pointLight
							name="tail_light_middle_left"
							intensity={taillightIntensity}
							decay={2}
							color={taillightColor}
							position={[43.017, -414.368, -602.573]}
							rotation={[-Math.PI, 0, 0]}
							scale={25}
						/>
					</ClickableLight>
					<ClickableLight>
						<pointLight
							name="tail_light_middle_middle"
							intensity={taillightIntensity}
							decay={2}
							color={taillightColor}
							position={[0, -414.368, -602.573]}
							rotation={[-Math.PI, 0, 0]}
							scale={25}
						/>
					</ClickableLight>
					<ClickableLight>
						<pointLight
							name="tail_light_middle_right"
							intensity={taillightIntensity}
							decay={2}
							color={taillightColor}
							position={[-43.017, -414.368, -602.573]}
							rotation={[-Math.PI, 0, 0]}
							scale={25}
						/>
					</ClickableLight>

					{/* Tail Side Lights */}
					<ClickableLight>
						<pointLight
							name="tail_light_right"
							intensity={taillightIntensity}
							decay={2}
							color={taillightColor}
							position={[-249.754, -356.223, -602.573]}
							rotation={[-Math.PI, 0, 0]}
							scale={25}
						/>
					</ClickableLight>
					<ClickableLight>
						<pointLight
							name="tail_light_left"
							intensity={taillightIntensity}
							decay={2}
							color={taillightColor}
							position={[249.754, -356.223, -602.573]}
							rotation={[-Math.PI, 0, 0]}
							scale={25}
						/>
					</ClickableLight>

					<animated.mesh
						castShadow
						receiveShadow
						ref={flagRef}
						name="robot_flag_new"
						geometry={nodes.robot_flag_new.geometry}
						material={materials.body}
						position={[-301.249, 198.68, -535.916]}
						rotation-x={interpolatedRotation}
						onClick={interactive ? handleFlagClick : undefined}
					/>

					{/* Body sides */}
					<mesh
						castShadow
						receiveShadow
						name="body_back"
						geometry={nodes.body_back.geometry}
						material={materials.Back}
					/>
					<mesh
						castShadow
						receiveShadow
						name="body_front"
						geometry={nodes.body_front.geometry}
						material={materials.Front}
					/>
					<mesh
						castShadow
						receiveShadow
						name="body_left"
						geometry={nodes.body_left.geometry}
						material={materials.Left}
					/>
					<mesh
						castShadow
						receiveShadow
						name="body_right"
						geometry={nodes.body_right.geometry}
						material={materials.Right}
					/>

					{/* Basket */}
					<mesh
						receiveShadow
						name="Basket"
						geometry={nodes.Basket.geometry}
						material={materials["body inside light"]}
						position={[0, 0, -628]}
						rotation={[-Math.PI / 2, 0, 0]}
						scale={270.73}
					/>

					{/* Body inside */}
					<mesh
						receiveShadow
						name="body_inside"
						geometry={nodes.body_inside.geometry}
						material={materials["body inside dark"]}
						position={[0, 110.314, -625.656]}
					/>

					{/* Wheels */}
					<mesh
						castShadow
						receiveShadow
						name="wheel_front_left"
						onClick={interactive ? handleOuterWheelClick : undefined}
						geometry={nodes.wheel_front_left.geometry}
						material={materials.wheel}
						position={[-322.374, 348.386, -139.723]}
					/>
					<mesh
						castShadow
						receiveShadow
						name="wheel_front_right"
						onClick={interactive ? handleOuterWheelClick : undefined}
						geometry={nodes.wheel_front_right.geometry}
						material={materials.wheel}
						position={[322.257, 348.386, -139.723]}
						rotation={[-Math.PI, 0, -Math.PI]}
					/>
					<mesh
						castShadow
						receiveShadow
						name="rocker-bogie"
						geometry={nodes["rocker-bogie"].geometry}
						material={materials.body}
						position={[0.008, -89.078, -141.649]}
						rotation={[-Math.PI / 6, 0, 0]}
					>
						<mesh
							castShadow
							receiveShadow
							name="wheel_back_left"
							onClick={interactive ? handleOuterWheelClick : undefined}
							geometry={nodes.wheel_back_left.geometry}
							material={materials.wheel}
							position={[-322.382, -143.059, 1.926]}
						/>
						<mesh
							castShadow
							receiveShadow
							name="wheel_back_right"
							onClick={interactive ? handleOuterWheelClick : undefined}
							geometry={nodes.wheel_back_right.geometry}
							material={materials.wheel}
							position={[322.249, -143.059, 1.926]}
							rotation={[-Math.PI, 0, -Math.PI]}
						/>
						<mesh
							castShadow
							receiveShadow
							onClick={interactive ? handleMiddleWheelClick : undefined}
							name="wheel_middle_left"
							geometry={nodes.wheel_middle_left.geometry}
							material={materials.wheel}
							position={[-322.382, 139.349, 1.926]}
						/>
						<mesh
							castShadow
							receiveShadow
							onClick={interactive ? handleMiddleWheelClick : undefined}
							name="wheel_middle_right"
							geometry={nodes.wheel_middle_right.geometry}
							material={materials.wheel}
							position={[322.249, 139.349, 1.926]}
							rotation={[-Math.PI, 0, -Math.PI]}
						/>
					</mesh>
				</mesh>
			</group>
		);
	},
);

Model.displayName = "E-Model";

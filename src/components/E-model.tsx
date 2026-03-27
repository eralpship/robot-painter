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
};

export interface ModelRef {
	touchFlag: () => void;
}

const loadingManager = new THREE.LoadingManager();
loadingManager.setURLModifier((url) => {
	if (
		["/front.png", "/back.png", "/left.png", "/right.png", "/lid.png"].includes(
			url,
		)
	) {
		const img = createBlankTexture("transparent");
		return img.src;
	}
	return url;
});

export const Model = forwardRef<ModelRef, ModelProps>(
	({ interactive = true, lightsOff = false, ...props }, ref) => {
	const group = React.useRef<THREE.Group>(null);
	const flagRef = useRef<THREE.Mesh>(null);

	const { nodes, materials, animations } = useLoader(
		GLTFLoader,
		"/e-model.gltf",
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

	// Material setup
	useEffect(() => {
		materials.wheel.metalness = 0.3;
		materials.wheel.roughness = 0.7;
		materials.wheel.envMapIntensity = 0.4;
		materials.wheel.clearcoat = 0.2;
		materials.wheel.clearcoatRoughness = 0.6;
		materials.wheel.reflectivity = 0.25;
		materials.wheel.specularIntensity = 0.6;
		materials.wheel.ior = 1.6;
		materials.wheel.sheen = 0.3;
		materials.wheel.sheenRoughness = 0.7;
		materials.wheel.sheenColor = new THREE.Color(0x2a2a2a);
		materials.wheel.normalScale = new THREE.Vector2(2.5, 2.5);

		// Side materials with transparency
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
			mat.metalness = 0.3;
			mat.roughness = 0.35;
			mat.alphaTest = 0.01;
		}

		materials.body.metalness = 0.3;
		materials.body.roughness = 0.35;
	}, [
		materials.Back,
		materials.Front,
		materials.Left,
		materials.Lid,
		materials.Right,
		materials.body,
		materials.wheel,
	]);

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

	// Wrapper component that adds a clickable hitbox to a light
	const ClickableLight = ({
		children,
	}: {
		children: React.ReactElement<React.ComponentProps<"pointLight">>;
	}) => {
		const position = children.props.position as [number, number, number];
		const name = children.props.name as string;
		const scale = (children.props.scale as number) ?? 30;

		return (
			<>
				{children}
				<mesh
					name={`${name}_hitbox`}
					position={position}
					scale={scale}
					onClick={interactive ? handleHitboxClick : undefined}
				>
					<sphereGeometry args={[1, 16, 16]} />
					<meshBasicMaterial
						color="red"
						transparent
						opacity={0.5}
						visible={false}
					/>
				</mesh>
			</>
		);
	};

	const headlightColor = "#ffe8a0";

	return (
		<group ref={group} {...props} dispose={null}>
			<mesh
				castShadow
				name="robot"
				geometry={nodes.robot.geometry}
				material={materials.body}
				rotation={[Math.PI / 2, 0, 0]}
				scale={0.01}
			>
				{/* Lid */}
				<mesh
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
						position={[-235.912, 385.374, -301.501]}
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
						position={[241.584, 386.931, -299.362]}
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
						position={[38.204, -384.368, -602.573]}
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
						position={[-0.018, -384.368, -602.573]}
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
						position={[-47.829, -384.368, -602.573]}
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
						position={[-248.999, -326.223, -602.573]}
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
						position={[250.51, -326.223, -602.573]}
						rotation={[-Math.PI, 0, 0]}
						scale={25}
					/>
				</ClickableLight>

				<animated.mesh
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

				{/* Basket */}
				<mesh
					name="Basket"
					geometry={nodes.Basket.geometry}
					material={materials["body inside light"]}
					position={[0, 0, -628]}
					rotation={[-Math.PI / 2, 0, 0]}
					scale={270.73}
				/>

				{/* Body inside */}
				<mesh
					name="body_inside"
					geometry={nodes.body_inside.geometry}
					material={materials["body inside dark"]}
					position={[0, 110.314, -625.656]}
				/>

				{/* Wheels */}
				<mesh
					castShadow
					name="wheel_front_left"
					onClick={interactive ? handleOuterWheelClick : undefined}
					geometry={nodes.wheel_front_left.geometry}
					material={materials.wheel}
					position={[-322.374, 348.386, -139.723]}
					rotation={[0.14, 0, 0]}
				/>
				<mesh
					castShadow
					name="wheel_front_right"
					onClick={interactive ? handleOuterWheelClick : undefined}
					geometry={nodes.wheel_front_right.geometry}
					material={materials.wheel}
					position={[322.257, 348.386, -139.723]}
					rotation={[-3.002, 0, Math.PI]}
				/>
				<mesh
					name="rocker-bogie"
					geometry={nodes["rocker-bogie"].geometry}
					material={materials.body}
					position={[0.008, -89.078, -141.649]}
					rotation={[-0.013, 0, 0]}
				>
					<mesh
						name="wheel_back_left"
						onClick={interactive ? handleOuterWheelClick : undefined}
						geometry={nodes.wheel_back_left.geometry}
						material={materials.wheel}
						position={[-322.382, -143.059, 1.926]}
						rotation={[-Math.PI / 6, 0, 0]}
					/>
					<mesh
						name="wheel_back_right"
						onClick={interactive ? handleOuterWheelClick : undefined}
						geometry={nodes.wheel_back_right.geometry}
						material={materials.wheel}
						position={[322.249, -143.059, 1.926]}
						rotation={[-Math.PI / 6, 0, Math.PI]}
					/>
					<mesh
						onClick={interactive ? handleMiddleWheelClick : undefined}
						name="wheel_middle_left"
						geometry={nodes.wheel_middle_left.geometry}
						material={materials.wheel}
						position={[-322.382, 139.349, 1.926]}
					/>
					<mesh
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
});

Model.displayName = "E-Model";

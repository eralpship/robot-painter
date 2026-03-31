import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Leva } from "leva";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useLevaModelControls } from "../hooks/useLevaModelControls";
import {
	MODEL_DEFAULTS,
	useAmbientLight,
	useAutoRotate,
	useDirectionalLight,
	useDirectionalLightAngle,
	useDirectionalLightHeight,
	useFov,
} from "../stores/model-store";
import { useScreenshotStore } from "../stores/screenshot-store";
import { Model, type ModelRef } from "./E-model";
import { FloatingCollapsibleWindow } from "./FloatingCollapsibleWindow";
import { TitleBar } from "./TitleBar";
import { TextureEditorWrapper } from "./texture-editor/TextureEditorWrapper";

const customLevaTheme = {
	sizes: {
		rootWidth: "340px",
	},
};

// CameraController reads FOV from store
const CameraController = () => {
	const { camera } = useThree();
	const fov = useFov();

	useEffect(() => {
		if (camera instanceof PerspectiveCamera) {
			camera.fov = fov;
			camera.updateProjectionMatrix();
		}
	}, [fov, camera]);

	return null;
};

// SceneBackground reads from CSS --color-page-background variable
const SceneBackground = () => {
	const { scene } = useThree();
	useEffect(() => {
		const color = getComputedStyle(document.documentElement)
			.getPropertyValue("--color-page-background")
			.trim();
		scene.background = new THREE.Color(color || "#1a1a2e");
	}, [scene]);
	return null;
};

// ScreenshotManager registers gl/scene/camera for external screenshot capture
const ScreenshotManager = () => {
	const { gl, scene, camera } = useThree();
	const register = useScreenshotStore((s) => s.register);
	const unregister = useScreenshotStore((s) => s.unregister);

	useEffect(() => {
		register(gl, scene, camera);
		return () => unregister();
	}, [gl, scene, camera, register, unregister]);

	return null;
};

// AmbientLightWrapper reads from store
const AmbientLightWrapper = () => {
	const ambientLight = useAmbientLight();
	return <ambientLight intensity={ambientLight} />;
};

// DirectionalLightWrapper reads intensity, angle, and height from store
const DirectionalLightWrapper = () => {
	const intensity = useDirectionalLight();
	const angle = useDirectionalLightAngle();
	const height = useDirectionalLightHeight();
	const lightRef = useRef<THREE.DirectionalLight>(null);
	const rad = (angle * Math.PI) / 180;
	const radius = 20;
	const x = Math.sin(rad) * radius;
	const z = Math.cos(rad) * radius;

	// Point the light at the robot center
	useEffect(() => {
		if (lightRef.current) {
			lightRef.current.target.position.set(0, -1, 0);
			lightRef.current.target.updateMatrixWorld();
		}
	}, []);

	return (
		<directionalLight
			ref={lightRef}
			castShadow
			position={[x, height, z]}
			intensity={intensity}
			shadow-mapSize-width={2048}
			shadow-mapSize-height={2048}
			shadow-camera-near={0.1}
			shadow-camera-far={60}
			shadow-camera-left={-10}
			shadow-camera-right={10}
			shadow-camera-top={10}
			shadow-camera-bottom={-10}
			shadow-bias={0}
			shadow-normalBias={0.02}
		/>
	);
};

export function RobotEditorContent() {
	const inactivityTimeout = 5_000;
	const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const cameraControlsRef = useRef<OrbitControlsImpl | null>(null);
	const modelRef = useRef<ModelRef | null>(null);

	// Use the new Leva-Zustand sync hook
	useLevaModelControls(modelRef, cameraControlsRef);

	// Read autoRotate from store
	const autoRotate = useAutoRotate();

	// On interaction: stop rotation, schedule resume after inactivity
	const handleInteraction = useCallback(() => {
		if (cameraControlsRef.current) {
			cameraControlsRef.current.autoRotate = false;
		}

		// Clear existing timer and start new one
		if (inactivityTimerRef.current) {
			clearTimeout(inactivityTimerRef.current);
		}
		inactivityTimerRef.current = setTimeout(() => {
			if (cameraControlsRef.current) {
				cameraControlsRef.current.autoRotate = autoRotate;
			}
		}, inactivityTimeout);
	}, [autoRotate]);

	// Cleanup timer on unmount
	useEffect(() => {
		return () => {
			if (inactivityTimerRef.current) {
				clearTimeout(inactivityTimerRef.current);
			}
		};
	}, []);

	return (
		<>
			<TitleBar />
			<div className="flex-1 min-h-0 relative bg-page-background">
				<div
					className="absolute top-2 right-2 z-50 w-[340px]"
					style={{ fontFamily: "system-ui, sans-serif", fontSize: "11px" }}
				>
					<Leva
						theme={customLevaTheme}
						fill
						titleBar={{ title: "Display Options", filter: false }}
					/>
				</div>
				<Canvas
					className="h-full w-full"
					shadows
					dpr={[1, 2]}
					gl={{ antialias: true, alpha: false }}
					camera={{
						position: [40, 30, 40],
						fov: MODEL_DEFAULTS.fov,
					}}
				>
					<CameraController />
					<SceneBackground />
					<ScreenshotManager />
					<AmbientLightWrapper />

					<DirectionalLightWrapper />

					{/* Ground plane to receive shadows */}
					<mesh
						receiveShadow
						rotation={[-Math.PI / 2, 0, 0]}
						position={[0, -3, 0]}
					>
						<planeGeometry args={[200, 200]} />
						<shadowMaterial transparent opacity={0.3} />
					</mesh>

					<Model ref={modelRef} position={[0, -3, 0]} scale={1} />

					<OrbitControls
						ref={cameraControlsRef}
						makeDefault
						minPolarAngle={0}
						maxPolarAngle={1.55}
						minDistance={10}
						maxDistance={200}
						minAzimuthAngle={-Number.POSITIVE_INFINITY}
						maxAzimuthAngle={Number.POSITIVE_INFINITY}
						autoRotate={autoRotate}
						autoRotateSpeed={2}
						onStart={handleInteraction}
					/>
				</Canvas>
				<FloatingCollapsibleWindow
					title="Texture Editor"
					x={10}
					y={10}
					width={440}
					height={350}
				>
					<TextureEditorWrapper />
				</FloatingCollapsibleWindow>
			</div>
		</>
	);
}

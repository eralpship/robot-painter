import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { createFileRoute } from "@tanstack/react-router";
import { Leva } from "leva";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Model, type ModelRef } from "../components/E-model";
import { FloatingCollapsibleWindow } from "../components/FloatingCollapsibleWindow";
import { PageContainer } from "../components/PageContainer";
import { TitleBar } from "../components/TitleBar";
import { TextureEditorWrapper } from "../components/texture-editor/TextureEditorWrapper";
import { OverlayTextureCanvasProvider } from "../contexts/overlay-texture-canvas-context";
import { TextureEditorContextProvider } from "../contexts/texture-editor-context";
import { TooltipProvider } from "../contexts/tooltip-context";
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
import { validateProjectSearch } from "../utils/projectRouteUtils";

const customLevaTheme = {
	sizes: {
		rootWidth: "340px",
	},
};

export const Route = createFileRoute("/robot-editor")({
	validateSearch: validateProjectSearch,
	component: RobotEditor,
});

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

function RobotEditorContent() {
	const inactivityTimeout = 5_000;
	const hasInteractedRef = useRef(false);
	const lastInteractionTimeRef = useRef(Date.now());
	const cameraControlsRef = useRef<OrbitControlsImpl | null>(null);
	const modelRef = useRef<ModelRef | null>(null);

	// Use the new Leva-Zustand sync hook
	useLevaModelControls(modelRef, cameraControlsRef);

	// Read autoRotate from store
	const autoRotate = useAutoRotate();

	const handleInteraction = useCallback(() => {
		lastInteractionTimeRef.current = Date.now();
		if (
			!hasInteractedRef.current &&
			cameraControlsRef.current?.autoRotate !== false
		) {
			hasInteractedRef.current = true;
		}

		// Update OrbitControls autoRotate directly
		if (cameraControlsRef.current) {
			cameraControlsRef.current.autoRotate = false;
		}
	}, []);

	useEffect(() => {
		let frameId: number;

		const checkInactivity = () => {
			const now = Date.now();
			if (
				hasInteractedRef.current &&
				now - lastInteractionTimeRef.current > inactivityTimeout
			) {
				hasInteractedRef.current = false;
				// Update OrbitControls autoRotate directly
				if (cameraControlsRef.current) {
					cameraControlsRef.current.autoRotate = autoRotate;
				}
			}
			frameId = requestAnimationFrame(checkInactivity);
		};

		frameId = requestAnimationFrame(checkInactivity);
		return () => cancelAnimationFrame(frameId);
	}, [autoRotate]);

	return (
		<>
			<Leva
				theme={customLevaTheme}
				collapsed
				titleBar={{ title: "Options", filter: false }}
			/>
			<TitleBar />
			<div className="flex-1 min-h-0 relative">
				<Canvas
					className="h-full w-full"
					shadows
					dpr={[1, 2]}
					gl={{ antialias: true }}
					camera={{
						position: [40, 30, 40],
						fov: MODEL_DEFAULTS.fov,
					}}
				>
					<CameraController />
					<SceneBackground />
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
					defaultCollapsed
				>
					<TextureEditorWrapper />
				</FloatingCollapsibleWindow>
			</div>
		</>
	);
}

function RobotEditor() {
	const { "project-id": projectId } = Route.useSearch();

	if (projectId === undefined) {
		return (
			<OverlayTextureCanvasProvider>
				<TooltipProvider>
					<TextureEditorContextProvider mode="basic" projectId={undefined}>
						<PageContainer className="flex flex-col">
							<TitleBar />
							<div className="flex-1 flex items-center justify-center">
								<TextureEditorWrapper />
							</div>
						</PageContainer>
					</TextureEditorContextProvider>
				</TooltipProvider>
			</OverlayTextureCanvasProvider>
		);
	}

	return (
		<OverlayTextureCanvasProvider>
			<TooltipProvider>
				<TextureEditorContextProvider mode="basic" projectId={projectId}>
					<PageContainer className="flex flex-col">
						<RobotEditorContent />
					</PageContainer>
				</TextureEditorContextProvider>
			</TooltipProvider>
		</OverlayTextureCanvasProvider>
	);
}

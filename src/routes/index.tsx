import { Environment, Html, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { createFileRoute } from "@tanstack/react-router";
import { Leva } from "leva";
import { Suspense, useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Model, type ModelRef } from "../components/E-model";
import { FloatingCollapsibleWindow } from "../components/FloatingCollapsibleWindow";
import { PageContainer } from "../components/PageContainer";
import { TextureEditorWrapper } from "../components/texture-editor/TextureEditorWrapper";
import { OverlayTextureCanvasProvider } from "../contexts/overlay-texture-canvas-context";
import { TooltipProvider } from "../contexts/tooltip-context";
import { useLevaModelControls } from "../hooks/useLevaModelControls";
import {
	MODEL_DEFAULTS,
	useAmbientLight,
	useAutoRotate,
	useEnvironmentIntensity,
	useFov,
} from "../stores/model-store";
import { validateProjectSearch } from "../utils/projectRouteUtils";

const customLevaTheme = {
	sizes: {
		rootWidth: "340px",
	},
};

export const Route = createFileRoute("/")({
	validateSearch: validateProjectSearch,
	component: App,
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

// SceneBackground sets a solid color background
const SceneBackground = () => {
	const { scene } = useThree();
	useEffect(() => {
		scene.background = new THREE.Color("#1a1a2e");
	}, [scene]);
	return null;
};

// EnvironmentWrapper reads from store — HDR for reflections only, not background
const EnvironmentWrapper = () => {
	const environmentIntensity = useEnvironmentIntensity();

	return (
		<Suspense
			fallback={
				<Html center>
					<div style={{ color: "white", fontSize: "24px" }}>Loading...</div>
				</Html>
			}
		>
			<Environment
				files="/kiara_1_dawn_1k.hdr"
				environmentIntensity={environmentIntensity}
				resolution={256}
			/>
		</Suspense>
	);
};

// AmbientLightWrapper reads from store
const AmbientLightWrapper = () => {
	const ambientLight = useAmbientLight();
	return <ambientLight intensity={ambientLight} />;
};

function AppContent({ projectId }: { projectId?: number }) {
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
		<PageContainer>
			<Leva
				theme={customLevaTheme}
				collapsed={false}
				titleBar={{ title: "Options", filter: false }}
			/>
			<Canvas
				className="h-screen w-screen"
				shadows
				camera={{
					position: [40, 30, 40],
					fov: MODEL_DEFAULTS.fov,
				}}
			>
				<CameraController />
				<SceneBackground />
				<EnvironmentWrapper />
				<AmbientLightWrapper />

				{/* Shadow-casting directional light */}
				<directionalLight
					castShadow
					position={[15, 20, 15]}
					intensity={1.5}
					shadow-mapSize-width={1024}
					shadow-mapSize-height={1024}
					shadow-camera-near={0.1}
					shadow-camera-far={60}
					shadow-camera-left={-15}
					shadow-camera-right={15}
					shadow-camera-top={15}
					shadow-camera-bottom={-15}
					shadow-bias={-0.001}
				/>

				{/* Ground plane to receive shadows */}
				<mesh
					receiveShadow
					rotation={[-Math.PI / 2, 0, 0]}
					position={[0, -3, 0]}
				>
					<planeGeometry args={[200, 200]} />
					<shadowMaterial transparent opacity={0.3} />
				</mesh>

				{/* Model - simplified, no callback props needed */}
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
				width={306}
				height={384}
			>
				<TextureEditorWrapper mode="basic" projectId={projectId} />
			</FloatingCollapsibleWindow>
		</PageContainer>
	);
}

function App() {
	const search = Route.useSearch();
	const projectId = search["project-id"];

	// If no projectId, show only the project selection modal (no 3D model)
	if (projectId === undefined) {
		return (
			<OverlayTextureCanvasProvider>
				<TooltipProvider>
					<PageContainer className="flex items-center justify-center">
						<TextureEditorWrapper mode="basic" projectId={undefined} />
					</PageContainer>
				</TooltipProvider>
			</OverlayTextureCanvasProvider>
		);
	}

	return (
		<OverlayTextureCanvasProvider>
			<TooltipProvider>
				<AppContent projectId={projectId} />
			</TooltipProvider>
		</OverlayTextureCanvasProvider>
	);
}

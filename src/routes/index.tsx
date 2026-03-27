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
import { TextureEditorWrapper } from "../components/texture-editor/TextureEditorWrapper";
import { OverlayTextureCanvasProvider } from "../contexts/overlay-texture-canvas-context";
import { TooltipProvider } from "../contexts/tooltip-context";
import { useLevaModelControls } from "../hooks/useLevaModelControls";
import {
	MODEL_DEFAULTS,
	useAmbientLight,
	useAutoRotate,
	useDirectionalLight,
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

// AmbientLightWrapper reads from store
const AmbientLightWrapper = () => {
	const ambientLight = useAmbientLight();
	return <ambientLight intensity={ambientLight} />;
};

// DirectionalLightWrapper reads intensity from store
const DirectionalLightWrapper = () => {
	const intensity = useDirectionalLight();
	return (
		<directionalLight
			castShadow
			position={[15, 20, 15]}
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
				collapsed
				titleBar={{ title: "Options", filter: false }}
			/>
			<Canvas
				className="h-screen w-screen"
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
				{/* Hemisphere light: sky color from above, ground bounce from below */}

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
				defaultCollapsed
			>
				<TextureEditorWrapper mode="basic" projectId={projectId} />
			</FloatingCollapsibleWindow>
		</PageContainer>
	);
}

function LandingPage() {
	return (
		<PageContainer className="flex items-center justify-center">
			<div className="max-w-xl w-full text-center space-y-8 p-8">
				<div className="space-y-3">
					<h1 className="text-4xl font-bold text-white">Robot Painter</h1>
					<p className="text-lg text-gray-400">
						Design and customize your own Starship delivery robot. Add text,
						images, shapes, and colors to create unique robot skins.
					</p>
				</div>
				<div className="flex flex-col gap-3 items-center">
					<a
						href="/projects"
						className="inline-flex items-center justify-center rounded-md bg-white text-black font-medium px-6 py-3 hover:bg-gray-200 transition-colors w-64"
					>
						Get Started
					</a>
					<a
						href="/projects"
						className="inline-flex items-center justify-center rounded-md border border-gray-600 text-gray-300 font-medium px-6 py-3 hover:bg-gray-800 transition-colors w-64"
					>
						Browse Projects
					</a>
				</div>
			</div>
		</PageContainer>
	);
}

function App() {
	const search = Route.useSearch();
	const projectId = search["project-id"];

	// No project selected — show landing page
	if (projectId === undefined) {
		return <LandingPage />;
	}

	return (
		<OverlayTextureCanvasProvider>
			<TooltipProvider>
				<AppContent projectId={projectId} />
			</TooltipProvider>
		</OverlayTextureCanvasProvider>
	);
}

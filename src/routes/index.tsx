import {
	ContactShadows,
	Environment,
	Html,
	OrbitControls,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { createFileRoute } from "@tanstack/react-router";
import { Leva } from "leva";
import { Suspense, useCallback, useEffect, useRef } from "react";
import { PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Model, type ModelRef } from "../components/E-model";
import { FloatingCollapsibleWindow } from "../components/FloatingCollapsibleWindow";
import { TextureEditorWrapper } from "../components/texture-editor/TextureEditorWrapper";
import { OverlayTextureCanvasProvider } from "../contexts/overlay-texture-canvas-context";
import { TooltipProvider } from "../contexts/tooltip-context";
import { useLevaModelControls } from "../hooks/useLevaModelControls";
import {
	MODEL_DEFAULTS,
	useAmbientLight,
	useAutoRotate,
	useBackgroundBlur,
	useBackgroundIntensity,
	useEnvironmentIntensity,
	useFov,
} from "../stores/model-store";

const customLevaTheme = {
	sizes: {
		rootWidth: "340px",
	},
};

type SearchParams = {
	"project-id"?: number;
};

export const Route = createFileRoute("/")({
	validateSearch: (search: Record<string, unknown>): SearchParams => {
		const id = search["project-id"];
		const numId = Number(id);

		// Valid: positive integers only
		if (numId > 0 && Number.isInteger(numId)) {
			return { "project-id": numId };
		}

		// Invalid: undefined will trigger "no project ID" flow
		return { "project-id": undefined };
	},
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

// EnvironmentWrapper reads from store
const EnvironmentWrapper = () => {
	const backgroundIntensity = useBackgroundIntensity();
	const backgroundBlur = useBackgroundBlur();
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
				background
				blur={backgroundBlur}
				backgroundIntensity={backgroundIntensity}
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
		<div className="h-screen w-screen">
			<Leva
				theme={customLevaTheme}
				collapsed={false}
				titleBar={{ title: "Options", filter: false }}
			/>
			<Canvas
				className="h-screen w-screen"
				camera={{
					position: [40, 30, 40],
					fov: MODEL_DEFAULTS.fov,
				}}
			>
				<CameraController />
				<EnvironmentWrapper />
				<AmbientLightWrapper />

				{/* Simple contact shadow */}
				<ContactShadows
					position={[0, -2.9, 0]}
					opacity={2.5}
					scale={180}
					blur={2}
					far={100}
					resolution={256}
					color="#000000"
				/>

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
		</div>
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
					<div className="h-screen w-screen flex items-center justify-center bg-black">
						<TextureEditorWrapper mode="basic" projectId={undefined} />
					</div>
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

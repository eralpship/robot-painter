import { button, useControls } from "leva";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { MODEL_DEFAULTS, useModelStore } from "../stores/model-store";

interface ModelRefForLeva {
	touchFlag: () => void;
}

export function useLevaModelControls(
	modelRef: React.RefObject<ModelRefForLeva | null>,
	cameraControlsRef: React.RefObject<OrbitControlsImpl | null>,
) {
	// Track if change originated from Leva to avoid feedback loops
	const isLevaChangeRef = useRef(false);
	const hasHydratedRef = useRef(false);
	// Track last known values to prevent Leva re-init from overwriting store
	const lastLevaValuesRef = useRef<{
		bogie: number;
		lidOpen: boolean;
		headlightIntensity: number;
		taillightIntensity: number;
	}>({
		bogie: MODEL_DEFAULTS.bogieTarget,
		lidOpen: MODEL_DEFAULTS.lidOpen,
		headlightIntensity: MODEL_DEFAULTS.headlightIntensity,
		taillightIntensity: MODEL_DEFAULTS.taillightIntensity,
	});

	// Get store actions (stable references)
	const setHeadlightIntensity = useModelStore((s) => s.setHeadlightIntensity);
	const setTaillightIntensity = useModelStore((s) => s.setTaillightIntensity);
	const setTaillightColor = useModelStore((s) => s.setTaillightColor);
	const setLidOpen = useModelStore((s) => s.setLidOpen);
	const setBogieTarget = useModelStore((s) => s.setBogieTarget);
	const setAutoRotate = useModelStore((s) => s.setAutoRotate);
	const setFov = useModelStore((s) => s.setFov);
	const setAmbientLight = useModelStore((s) => s.setAmbientLight);
	const setDirectionalLight = useModelStore((s) => s.setDirectionalLight);
	const setDirectionalLightAngle = useModelStore(
		(s) => s.setDirectionalLightAngle,
	);
	const setDirectionalLightHeight = useModelStore(
		(s) => s.setDirectionalLightHeight,
	);

	// Lighting controls
	const [, setLighting] = useControls("Robot Lights", () => ({
		headlightsIntensity: {
			value: MODEL_DEFAULTS.headlightIntensity,
			label: "Headlights Intensity",
			max: 60,
			min: 0,
			step: 0.1,
			onChange: (v: number) => {
				// Ignore if value hasn't changed from what Leva last knew
				if (v === lastLevaValuesRef.current.headlightIntensity) return;
				lastLevaValuesRef.current.headlightIntensity = v;
				isLevaChangeRef.current = true;
				setHeadlightIntensity(v);
			},
		},
		taillightsIntensity: {
			value: MODEL_DEFAULTS.taillightIntensity,
			label: "Taillights Intensity",
			max: 60,
			min: 0,
			step: 0.1,
			onChange: (v: number) => {
				// Ignore if value hasn't changed from what Leva last knew
				if (v === lastLevaValuesRef.current.taillightIntensity) return;
				lastLevaValuesRef.current.taillightIntensity = v;
				isLevaChangeRef.current = true;
				setTaillightIntensity(v);
			},
		},
		tailLightColor: {
			value: MODEL_DEFAULTS.taillightColor,
			label: "Tail Light Color",
			onChange: (v: string) => {
				// Skip writing to store before hydration completes
				if (!hasHydratedRef.current) return;
				isLevaChangeRef.current = true;
				setTaillightColor(v);
			},
		},
	}));

	// Sync Leva with store after hydration completes
	useEffect(() => {
		// Check if already hydrated
		if (useModelStore.persist.hasHydrated()) {
			hasHydratedRef.current = true;
			const state = useModelStore.getState();
			setLighting({
				tailLightColor: state.taillightColor,
			});
		}

		// Listen for hydration to complete
		const unsubFinishHydration = useModelStore.persist.onFinishHydration(
			(state) => {
				hasHydratedRef.current = true;
				setLighting({
					tailLightColor: state.taillightColor,
				});
			},
		);

		return unsubFinishHydration;
	}, [setLighting]);

	// Subscribe to store lighting changes and sync back to Leva
	// Use separate subscriptions to avoid cross-contamination
	useEffect(() => {
		const unsubHeadlight = useModelStore.subscribe(
			(state) => state.headlightIntensity,
			(headlightIntensity) => {
				if (!isLevaChangeRef.current) {
					lastLevaValuesRef.current.headlightIntensity = headlightIntensity;
					setLighting({ headlightsIntensity: headlightIntensity });
				}
				isLevaChangeRef.current = false;
			},
		);
		const unsubTaillight = useModelStore.subscribe(
			(state) => state.taillightIntensity,
			(taillightIntensity) => {
				if (!isLevaChangeRef.current) {
					lastLevaValuesRef.current.taillightIntensity = taillightIntensity;
					setLighting({ taillightsIntensity: taillightIntensity });
				}
				isLevaChangeRef.current = false;
			},
		);
		const unsubTaillightColor = useModelStore.subscribe(
			(state) => state.taillightColor,
			(taillightColor) => {
				if (!isLevaChangeRef.current) {
					setLighting({ tailLightColor: taillightColor });
				}
				isLevaChangeRef.current = false;
			},
		);
		return () => {
			unsubHeadlight();
			unsubTaillight();
			unsubTaillightColor();
		};
	}, [setLighting]);

	// Animation controls
	const [, setAnimation] = useControls("Robot Animations", () => ({
		lidOpen: {
			value: MODEL_DEFAULTS.lidOpen,
			label: "Lid Open",
			onChange: (v: boolean) => {
				// Ignore if value hasn't changed from what Leva last knew
				if (v === lastLevaValuesRef.current.lidOpen) return;
				lastLevaValuesRef.current.lidOpen = v;
				isLevaChangeRef.current = true;
				setLidOpen(v);
			},
		},
		bogie: {
			value: MODEL_DEFAULTS.bogieTarget,
			label: "Bogie",
			min: 0,
			max: 1,
			step: 0.1,
			onChange: (v: number) => {
				// Ignore if value hasn't changed from what Leva last knew
				// This prevents Leva re-initialization from overwriting store
				if (v === lastLevaValuesRef.current.bogie) return;
				lastLevaValuesRef.current.bogie = v;
				isLevaChangeRef.current = true;
				setBogieTarget(v);
			},
		},
		touchFlag: button(() => modelRef.current?.touchFlag()),
	}));

	// Subscribe to store animation changes and sync back to Leva
	// Use separate subscriptions to avoid cross-contamination
	useEffect(() => {
		const unsubLid = useModelStore.subscribe(
			(state) => state.lidOpen,
			(lidOpen) => {
				if (!isLevaChangeRef.current) {
					lastLevaValuesRef.current.lidOpen = lidOpen;
					setAnimation({ lidOpen });
				}
				isLevaChangeRef.current = false;
			},
		);
		const unsubBogie = useModelStore.subscribe(
			(state) => state.bogieTarget,
			(bogieTarget) => {
				if (!isLevaChangeRef.current) {
					lastLevaValuesRef.current.bogie = bogieTarget;
					setAnimation({ bogie: bogieTarget });
				}
				isLevaChangeRef.current = false;
			},
		);
		return () => {
			unsubLid();
			unsubBogie();
		};
	}, [setAnimation]);

	// Camera controls
	useControls(
		"Camera",
		{
			autoRotate: {
				value: MODEL_DEFAULTS.autoRotate,
				label: "Auto Rotate",
				onChange: (v: boolean) => {
					setAutoRotate(v);
					if (cameraControlsRef.current) {
						cameraControlsRef.current.autoRotate = v;
					}
				},
			},
			fov: {
				value: MODEL_DEFAULTS.fov,
				label: "FOV",
				min: 5,
				max: 60,
				step: 0.5,
				onChange: setFov,
			},
			resetCamera: button(() => cameraControlsRef.current?.reset()),
		},
		{ collapsed: true },
	);

	// Environment controls
	useControls(
		"Environment Lights",
		() => ({
			ambientLight: {
				value: MODEL_DEFAULTS.ambientLight,
				label: "Ambient Intensity",
				max: 40,
				min: 0,
				step: 0.1,
				onChange: setAmbientLight,
			},
			directionalLight: {
				value: MODEL_DEFAULTS.directionalLight,
				label: "Directional Intensity",
				max: 100,
				min: 0,
				step: 0.1,
				onChange: setDirectionalLight,
			},
			directionalLightAngle: {
				value: MODEL_DEFAULTS.directionalLightAngle,
				label: "Angle",
				min: 0,
				max: 360,
				step: 1,
				onChange: setDirectionalLightAngle,
			},
			directionalLightHeight: {
				value: MODEL_DEFAULTS.directionalLightHeight,
				label: "Height",
				min: 1,
				max: 50,
				step: 0.5,
				onChange: setDirectionalLightHeight,
			},
		}),
		{ collapsed: true },
	);
}

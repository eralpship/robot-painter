import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

// Default values (consolidated from E-model.tsx and index.tsx)
export const MODEL_DEFAULTS = {
	headlightIntensity: 12,
	taillightIntensity: 12,
	taillightColor: "#ff0000",
	lidOpen: false,
	bogieTarget: 0.5,
	autoRotate: true,
	fov: 20,
	ambientLight: 5,
	directionalLight: 7.5,
	directionalLightAngle: 64,
	directionalLightHeight: 37,
} as const;

interface ModelState {
	// Lighting
	headlightIntensity: number;
	taillightIntensity: number;
	taillightColor: string;

	// Animation
	lidOpen: boolean;
	bogieTarget: number; // Target value for spring animation (0-1)

	// Camera
	autoRotate: boolean;
	fov: number;

	// Environment
	ambientLight: number;
	directionalLight: number;
	directionalLightAngle: number;
	directionalLightHeight: number;
}

interface ModelActions {
	// Lighting actions
	setHeadlightIntensity: (intensity: number) => void;
	setTaillightIntensity: (intensity: number) => void;
	setTaillightColor: (color: string) => void;

	// Animation actions
	setLidOpen: (open: boolean) => void;
	toggleLidOpen: () => void;
	setBogieTarget: (target: number) => void;

	// Camera actions
	setAutoRotate: (autoRotate: boolean) => void;
	setFov: (fov: number) => void;

	// Environment actions
	setAmbientLight: (intensity: number) => void;
	setDirectionalLight: (intensity: number) => void;
	setDirectionalLightAngle: (angle: number) => void;
	setDirectionalLightHeight: (height: number) => void;

	// Bulk reset
	resetToDefaults: () => void;
}

type ModelStore = ModelState & ModelActions;

export const useModelStore = create<ModelStore>()(
	subscribeWithSelector(
		persist(
			(set) => ({
				// Initial state
				...MODEL_DEFAULTS,

				// Lighting actions
				setHeadlightIntensity: (intensity) =>
					set({ headlightIntensity: intensity }),
				setTaillightIntensity: (intensity) =>
					set({ taillightIntensity: intensity }),
				setTaillightColor: (color) => set({ taillightColor: color }),

				// Animation actions
				setLidOpen: (open) => set({ lidOpen: open }),
				toggleLidOpen: () => set((state) => ({ lidOpen: !state.lidOpen })),
				setBogieTarget: (target) => set({ bogieTarget: target }),

				// Camera actions
				setAutoRotate: (autoRotate) => set({ autoRotate }),
				setFov: (fov) => set({ fov }),

				// Environment actions
				setAmbientLight: (intensity) => set({ ambientLight: intensity }),
				setDirectionalLight: (intensity) =>
					set({ directionalLight: intensity }),
				setDirectionalLightAngle: (angle) =>
					set({ directionalLightAngle: angle }),
				setDirectionalLightHeight: (height) =>
					set({ directionalLightHeight: height }),

				// Bulk reset
				resetToDefaults: () => set(MODEL_DEFAULTS),
			}),
			{
				name: "model-settings",
				// Only persist taillightColor
				partialize: (state) => ({ taillightColor: state.taillightColor }),
			},
		),
	),
);

// Selector hooks for optimized re-renders
export const useHeadlightIntensity = () =>
	useModelStore((s) => s.headlightIntensity);
export const useTaillightIntensity = () =>
	useModelStore((s) => s.taillightIntensity);
export const useTaillightColor = () => useModelStore((s) => s.taillightColor);
export const useLidOpen = () => useModelStore((s) => s.lidOpen);
export const useAutoRotate = () => useModelStore((s) => s.autoRotate);
export const useFov = () => useModelStore((s) => s.fov);
export const useAmbientLight = () => useModelStore((s) => s.ambientLight);
export const useDirectionalLight = () =>
	useModelStore((s) => s.directionalLight);
export const useDirectionalLightAngle = () =>
	useModelStore((s) => s.directionalLightAngle);
export const useDirectionalLightHeight = () =>
	useModelStore((s) => s.directionalLightHeight);

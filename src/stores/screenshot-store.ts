import * as THREE from "three";
import { create } from "zustand";

interface ScreenshotState {
	gl: THREE.WebGLRenderer | null;
	scene: THREE.Scene | null;
	camera: THREE.Camera | null;
}

interface ScreenshotActions {
	register: (
		gl: THREE.WebGLRenderer,
		scene: THREE.Scene,
		camera: THREE.Camera,
	) => void;
	unregister: () => void;
	takeScreenshot: () => void;
}

type ScreenshotStore = ScreenshotState & ScreenshotActions;

export const useScreenshotStore = create<ScreenshotStore>((set, get) => ({
	gl: null,
	scene: null,
	camera: null,

	register: (gl, scene, camera) => set({ gl, scene, camera }),
	unregister: () => set({ gl: null, scene: null, camera: null }),

	takeScreenshot: () => {
		const { gl, scene, camera } = get();
		if (!gl || !scene || !camera) {
			console.warn("[Screenshot] Not ready - gl/scene/camera not registered");
			return;
		}

		// Force all textures to update before render
		scene.traverse((child) => {
			if (child instanceof THREE.Mesh && child.material) {
				const materials = Array.isArray(child.material)
					? child.material
					: [child.material];
				for (const mat of materials) {
					if (mat instanceof THREE.MeshStandardMaterial && mat.map) {
						mat.map.needsUpdate = true;
					}
					mat.needsUpdate = true;
				}
			}
		});

		// Force render before capture
		gl.render(scene, camera);

		// Capture using toBlob (async, memory-efficient)
		gl.domElement.toBlob((blob) => {
			if (!blob) {
				console.error("[Screenshot] Failed to create blob");
				return;
			}

			// Create download link
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `robot-screenshot-${Date.now()}.png`;
			link.click();

			// Cleanup
			URL.revokeObjectURL(url);
		}, "image/png");
	},
}));

// Selector hooks
export const useTakeScreenshot = () =>
	useScreenshotStore((s) => s.takeScreenshot);
export const useScreenshotReady = () =>
	useScreenshotStore((s) => s.gl !== null);

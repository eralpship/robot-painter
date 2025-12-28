import type * as THREE from "three";
import { useModelStore } from "../stores/model-store";
import { useModelAnimation } from "./useModelAnimation";

interface UseLidAnimationOptions {
	actions: Record<string, THREE.AnimationAction | null>;
	groupRef: React.RefObject<THREE.Group | null>;
}

/**
 * Hook that handles lid open/close animation with easeOutBounce easing.
 * Converts boolean lidOpen store value to 0-1 progress for animation.
 *
 * - lidOpen = false → progress = 0 (closed)
 * - lidOpen = true → progress = 1 (open)
 *
 * Uses the generalized useModelAnimation hook internally.
 */
export function useLidAnimation({
	actions,
	groupRef,
}: UseLidAnimationOptions): void {
	useModelAnimation({
		actions,
		groupRef,
		clipName: "open lid",
		getProgress: () => (useModelStore.getState().lidOpen ? 1 : 0),
	});
}

import type * as THREE from "three";
import { useModelStore } from "../stores/model-store";
import { useModelAnimation } from "./useModelAnimation";

interface UseBogieAnimationOptions {
	actions: Record<string, THREE.AnimationAction | null>;
	groupRef: React.RefObject<THREE.Group | null>;
}

/**
 * Hook that handles bogie (rocker) animation with easeOutBounce easing.
 * Animates the robot's suspension based on bogieTarget store value (0-1).
 *
 * Uses the generalized useModelAnimation hook internally.
 */
export function useBogieAnimation({
	actions,
	groupRef,
}: UseBogieAnimationOptions): void {
	useModelAnimation({
		actions,
		groupRef,
		clipName: "rocker",
		getProgress: () => useModelStore.getState().bogieTarget,
	});
}

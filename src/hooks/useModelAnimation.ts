import { easings, useSpringValue } from "@react-spring/three";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type * as THREE from "three";
import { sampleTrackAtTime } from "../utils/animation-utils";

/**
 * Configuration for model animation easing and timing.
 */
export interface ModelAnimationConfig {
	/** Animation duration in milliseconds. Default: 1500 */
	duration?: number;
	/** Easing function. Default: easings.easeOutBounce */
	easing?: (t: number) => number;
}

/**
 * Options for the useModelAnimation hook.
 */
export interface UseModelAnimationOptions {
	/** Animation actions from useAnimations hook */
	actions: Record<string, THREE.AnimationAction | null>;
	/** Reference to the group containing animated objects */
	groupRef: React.RefObject<THREE.Group | null>;
	/** Name of the animation clip to use (e.g., 'rocker', 'open lid') */
	clipName: string;
	/** Function that returns current progress (0-1) from store. Called every frame. */
	getProgress: () => number;
	/** Optional animation config. Uses easeOutBounce with 1500ms duration if not provided. */
	config?: ModelAnimationConfig;
}

/** Default animation configuration */
const DEFAULT_DURATION = 1500;
const DEFAULT_EASING = easings.easeOutBounce;

/**
 * Hook that handles GLTF animation playback with custom easing.
 *
 * Uses react-spring for smooth interpolation and manual clip sampling
 * to bypass Three.js AnimationMixer limitations (which doesn't support custom easing).
 *
 * @param options - Configuration options for the animation
 */
export function useModelAnimation({
	actions,
	groupRef,
	clipName,
	getProgress,
	config = {},
}: UseModelAnimationOptions): void {
	const { duration = DEFAULT_DURATION, easing = DEFAULT_EASING } = config;

	// Animated progress value (0-1) with configured easing
	const progress = useSpringValue(getProgress(), {
		config: { duration, easing },
	});

	// Track last progress to detect changes
	const lastProgressRef = useRef(getProgress());

	// Store reference to the animation clip
	const clipRef = useRef<THREE.AnimationClip | null>(null);

	// Initialize animation clip reference
	useEffect(() => {
		const action = actions[clipName];
		if (!action) return;

		clipRef.current = action.getClip();
		action.stop();
	}, [actions, clipName]);

	// Animation frame - check for progress changes and apply animation
	useFrame(() => {
		const targetProgress = getProgress();
		if (targetProgress !== lastProgressRef.current) {
			lastProgressRef.current = targetProgress;
			progress.start(targetProgress);
		}

		const clip = clipRef.current;
		if (!clip || !groupRef.current) return;

		const currentProgress = progress.get();
		const animTime = clip.duration * currentProgress;

		for (const track of clip.tracks) {
			const [objectName, propertyName] = track.name.split(".");
			const targetObject = groupRef.current.getObjectByName(objectName);

			if (!targetObject) continue;

			const sampledValues = sampleTrackAtTime(track, animTime);

			if (propertyName === "position") {
				targetObject.position.set(
					sampledValues[0],
					sampledValues[1],
					sampledValues[2],
				);
			} else if (propertyName === "quaternion") {
				targetObject.quaternion.set(
					sampledValues[0],
					sampledValues[1],
					sampledValues[2],
					sampledValues[3],
				);
			} else if (propertyName === "scale") {
				targetObject.scale.set(
					sampledValues[0],
					sampledValues[1],
					sampledValues[2],
				);
			}
		}
	});
}

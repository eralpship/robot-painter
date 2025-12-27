import { easings, useSpringValue } from "@react-spring/three";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type * as THREE from "three";
import { useModelStore } from "../stores/model-store";

interface UseBogieAnimationOptions {
	actions: Record<string, THREE.AnimationAction | null>;
	groupRef: React.RefObject<THREE.Group | null>;
}

/**
 * Samples animation track values at a specific time using linear interpolation.
 */
function sampleTrackAtTime(track: THREE.KeyframeTrack, time: number): number[] {
	const times = track.times;
	const values = track.values;
	const valueSize = track.getValueSize();

	// Find the two keyframes to interpolate between
	let i = 0;
	while (i < times.length - 1 && times[i + 1] <= time) {
		i++;
	}

	if (i >= times.length - 1) {
		// Past the last keyframe, return last value
		const startIdx = (times.length - 1) * valueSize;
		return Array.from(values.slice(startIdx, startIdx + valueSize));
	}

	if (time <= times[0]) {
		// Before first keyframe, return first value
		return Array.from(values.slice(0, valueSize));
	}

	// Interpolate between keyframes i and i+1
	const t0 = times[i];
	const t1 = times[i + 1];
	const alpha = (time - t0) / (t1 - t0);

	const startIdx0 = i * valueSize;
	const startIdx1 = (i + 1) * valueSize;

	const result: number[] = [];
	for (let j = 0; j < valueSize; j++) {
		const v0 = values[startIdx0 + j];
		const v1 = values[startIdx1 + j];
		result.push(v0 + (v1 - v0) * alpha);
	}
	return result;
}

/**
 * Hook that handles bogie animation with spring physics.
 * Reads bogieTarget from Zustand store and animates wheels accordingly.
 * Uses react-spring for smooth interpolation and manual clip sampling.
 */
export function useBogieAnimation({
	actions,
	groupRef,
}: UseBogieAnimationOptions): void {
	// Animated progress value (0-1) with easeOutBounce easing
	const progress = useSpringValue(useModelStore.getState().bogieTarget, {
		config: { duration: 1500, easing: easings.easeOutBounce },
	});

	// Track last target to avoid unnecessary spring updates
	const lastTargetRef = useRef(useModelStore.getState().bogieTarget);

	// Store reference to the rocker animation clip
	const rockerClipRef = useRef<THREE.AnimationClip | null>(null);

	// Initialize rocker animation clip
	useEffect(() => {
		const rockerAction = actions.rocker;
		if (!rockerAction) return;

		rockerClipRef.current = rockerAction.getClip();
		rockerAction.stop();
	}, [actions]);

	// Animation frame - read spring value and apply to animation
	useFrame(() => {
		// Check if target changed and update spring
		const target = useModelStore.getState().bogieTarget;
		if (target !== lastTargetRef.current) {
			lastTargetRef.current = target;
			progress.start(target);
		}

		const clip = rockerClipRef.current;
		if (!clip || !groupRef.current) return;

		// Get current animated progress value
		const currentProgress = progress.get();
		const animTime = clip.duration * currentProgress;

		// Apply animation to all tracks
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

import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import type * as THREE from "three";
import { useModelStore } from "../stores/model-store";

interface UseBogieAnimationOptions {
	actions: Record<string, THREE.AnimationAction | null>;
	groupRef: React.RefObject<THREE.Group | null>;
	// Optional: allow customizing spring feel
	stiffness?: number; // default: 120 (matching original react-spring tension)
	damping?: number; // default: 14 (matching original react-spring friction)
}

/**
 * Hook that handles bogie animation with spring physics.
 * Reads bogieTarget from Zustand store and animates wheels accordingly.
 * Uses manual animation clip sampling for robustness across re-renders.
 */
export function useBogieAnimation({
	actions,
	groupRef,
	stiffness = 120,
	damping = 14,
}: UseBogieAnimationOptions): void {
	// Animation state in refs - survives re-renders completely
	const bogieProgressRef = useRef(useModelStore.getState().bogieTarget);
	const bogieVelocityRef = useRef(0);

	// Store reference to the rocker animation clip for manual sampling
	const rockerClipRef = useRef<THREE.AnimationClip | null>(null);
	const rockerActionRef = useRef<THREE.AnimationAction | null>(null);

	// Initialize rocker animation - we'll manually sample it instead of using mixer
	useEffect(() => {
		const rockerAction = actions.rocker;
		if (!rockerAction) return;

		// Skip if we already initialized this exact action
		if (rockerActionRef.current === rockerAction) return;

		const clip = rockerAction.getClip();
		rockerClipRef.current = clip;
		rockerActionRef.current = rockerAction;

		// Don't play through mixer - we'll sample manually
		rockerAction.stop();
	}, [actions]);

	// Helper to sample animation track at a specific time
	const sampleTrackAtTime = useCallback(
		(track: THREE.KeyframeTrack, time: number): number[] => {
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
		},
		[],
	);

	// Animation frame - spring physics for bogie, completely independent of React lifecycle
	useFrame((_, delta) => {
		// Read target directly from store - doesn't trigger React re-renders
		const target = useModelStore.getState().bogieTarget;
		const clip = rockerClipRef.current;

		// Calculate spring force
		const displacement = target - bogieProgressRef.current;
		const springForce = displacement * stiffness;
		const dampingForce = bogieVelocityRef.current * damping;

		// Update velocity and position using delta time
		const acceleration = springForce - dampingForce;
		bogieVelocityRef.current += acceleration * delta;
		bogieProgressRef.current += bogieVelocityRef.current * delta;

		// Clamp to valid range [0, 1]
		if (bogieProgressRef.current < 0) {
			bogieProgressRef.current = 0;
			bogieVelocityRef.current = Math.abs(bogieVelocityRef.current) * 0.3; // Bounce
		} else if (bogieProgressRef.current > 1) {
			bogieProgressRef.current = 1;
			bogieVelocityRef.current = -Math.abs(bogieVelocityRef.current) * 0.3; // Bounce
		}

		// Manually sample and apply animation tracks
		if (clip && groupRef.current) {
			const animTime = clip.duration * bogieProgressRef.current;

			for (const track of clip.tracks) {
				// Parse track name: "objectName.property"
				const [objectName, propertyName] = track.name.split(".");
				const targetObject = groupRef.current.getObjectByName(objectName);

				if (!targetObject) continue;

				const sampledValues = sampleTrackAtTime(track, animTime);

				// Apply sampled values based on property type
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
		}
	});
}

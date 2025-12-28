import type * as THREE from "three";

/**
 * Samples animation track values at a specific time using linear interpolation.
 * Used by useModelAnimation to manually sample GLTF animation clips at arbitrary times.
 *
 * @param track - The THREE.KeyframeTrack to sample from
 * @param time - The time in seconds to sample at
 * @returns Array of interpolated values (size depends on track type: 3 for position/scale, 4 for quaternion)
 */
export function sampleTrackAtTime(
	track: THREE.KeyframeTrack,
	time: number,
): number[] {
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

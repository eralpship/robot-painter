export type CanonicalTransform = {
	centerX: number;
	centerY: number;
	rotation: number;
	scaleX: number;
	scaleY: number;
};

/**
 * Convert canonical transform to SVG transform attribute string
 * Always uses: translate(center) rotate(deg) scale(sx, sy)
 * This is the standard transform order that matches how Moveable saves transforms
 */
export function toSVGTransform(transform: CanonicalTransform): string {
	return `translate(${transform.centerX}, ${transform.centerY}) rotate(${transform.rotation}) scale(${transform.scaleX}, ${transform.scaleY})`;
}

/**
 * Extract canonical transform from SVG element after Moveable interaction
 *
 * Strategy: Read the SVG transform attribute that we previously set, then apply
 * the CSS transform delta on top of it. This preserves the original center position.
 *
 * @param element - SVG element that has been transformed by Moveable
 * @returns Canonical transform object or null if extraction fails
 */
export function extractCanonicalTransform(
	element: SVGElement,
): CanonicalTransform | null {
	// Start with the existing SVG transform attribute (our canonical source of truth)
	const svgTransform = element.getAttribute("transform");

	const baseTransform: CanonicalTransform = {
		centerX: 0,
		centerY: 0,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
	};

	// Parse the SVG transform attribute to get base values
	if (svgTransform) {
		const translateMatch = svgTransform.match(
			/translate\(([-\d.]+),\s*([-\d.]+)\)/,
		);
		const rotateMatch = svgTransform.match(/rotate\(([-\d.]+)\)/);
		const scaleMatch = svgTransform.match(/scale\(([-\d.]+),\s*([-\d.]+)\)/);

		if (translateMatch) {
			baseTransform.centerX = parseFloat(translateMatch[1]);
			baseTransform.centerY = parseFloat(translateMatch[2]);
		}
		if (rotateMatch) {
			baseTransform.rotation = parseFloat(rotateMatch[1]);
		}
		if (scaleMatch) {
			baseTransform.scaleX = parseFloat(scaleMatch[1]);
			baseTransform.scaleY = parseFloat(scaleMatch[2]);
		}
	}

	// Now read CSS transforms applied by Moveable
	const computedStyle = element.computedStyleMap();
	const cssTransform = computedStyle?.get("transform");

	if (!cssTransform || !(cssTransform instanceof CSSTransformValue)) {
		return baseTransform;
	}

	const result = { ...baseTransform };
	let cssTranslateX = 0;
	let cssTranslateY = 0;
	let cssRotation = 0;

	// Extract the CSS deltas applied by Moveable
	for (const component of cssTransform) {
		if (component instanceof CSSTranslate) {
			cssTranslateX += component.x.to("px").value;
			cssTranslateY += component.y.to("px").value;
		} else if (component instanceof CSSRotate) {
			cssRotation = component.angle.to("deg").value;
		} else if (component instanceof CSSScale) {
			const scaleX =
				typeof component.x === "number"
					? component.x
					: (component.x as CSSUnitValue).value;
			const scaleY =
				typeof component.y === "number"
					? component.y
					: (component.y as CSSUnitValue).value;
			result.scaleX *= scaleX;
			result.scaleY *= scaleY;
		}
	}

	// Apply CSS deltas to base transform
	result.centerX += cssTranslateX;
	result.centerY += cssTranslateY;
	result.rotation += cssRotation;

	// Assertions for debugging
	if (Math.abs(result.centerX) > 2000 || Math.abs(result.centerY) > 2000) {
		console.error(
			"[Transform] ASSERTION FAILED: Center values out of expected range!",
			result,
		);
	}
	if (Math.abs(result.rotation) > 360) {
		console.warn("[Transform] Rotation > 360°, normalizing:", result.rotation);
		result.rotation = result.rotation % 360;
	}
	if (
		result.scaleX < 0 ||
		result.scaleY < 0 ||
		result.scaleX > 10 ||
		result.scaleY > 10
	) {
		console.error(
			"[Transform] ASSERTION FAILED: Scale values out of expected range!",
			result,
		);
	}

	return result;
}

/**
 * Pre-caches web fonts as base64 data URIs so they can be embedded
 * in serialized SVGs (which lose access to page CSS fonts).
 */

// Cache: stores all @font-face CSS rules grouped by family name
const fontCache = new Map<string, string[]>();
let initialized = false;

/**
 * Scan document stylesheets for @font-face rules and cache font data as base64.
 * Call once at app startup.
 */
export async function initFontCache(): Promise<void> {
	if (initialized) return;
	initialized = true;

	const fontFaceRules: CSSFontFaceRule[] = [];

	for (const sheet of document.styleSheets) {
		try {
			for (const rule of sheet.cssRules) {
				if (rule instanceof CSSFontFaceRule) {
					fontFaceRules.push(rule);
				}
			}
		} catch {
			// Cross-origin stylesheets throw SecurityError — skip them
		}
	}

	const fetchPromises: Promise<void>[] = [];

	for (const rule of fontFaceRules) {
		const family = rule.style
			.getPropertyValue("font-family")
			.replace(/['"]/g, "")
			.trim();
		if (!family) continue;

		const fontWeight = rule.style.getPropertyValue("font-weight") || "400";
		const fontStyle = rule.style.getPropertyValue("font-style") || "normal";
		const unicodeRange = rule.style.getPropertyValue("unicode-range") || "";

		const srcValue = rule.style.getPropertyValue("src");
		const urlMatch = srcValue.match(/url\(["']?([^"')]+)["']?\)/);
		if (!urlMatch) continue;

		const url = urlMatch[1];
		const formatMatch = srcValue.match(/format\(["']?([^"')]+)["']?\)/);
		const format = formatMatch?.[1] || "woff2";

		fetchPromises.push(
			fetch(url)
				.then((res) => res.arrayBuffer())
				.then((buffer) => {
					const base64 = arrayBufferToBase64(buffer);
					const mimeType =
						format === "woff2"
							? "font/woff2"
							: format === "woff"
								? "font/woff"
								: "font/ttf";
					const dataUri = `data:${mimeType};base64,${base64}`;
					const rangePart = unicodeRange
						? ` unicode-range: ${unicodeRange};`
						: "";

					const css = `@font-face { font-family: '${family}'; font-weight: ${fontWeight}; font-style: ${fontStyle}; src: url('${dataUri}') format('${format}');${rangePart} }`;

					if (!fontCache.has(family)) {
						fontCache.set(family, []);
					}
					fontCache.get(family)?.push(css);
				})
				.catch(() => {
					// Font fetch failed — skip silently
				}),
		);
	}

	await Promise.all(fetchPromises);
}

/**
 * Get embedded @font-face CSS for a list of font families.
 * Returns all cached subsets and weights for each family.
 */
export function getEmbeddedFontCSS(fontFamilies: string[]): string {
	const rules: string[] = [];
	for (const family of fontFamilies) {
		const familyRules = fontCache.get(family);
		if (familyRules) {
			rules.push(...familyRules);
		}
	}
	return rules.join("\n");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	let binary = "";
	const bytes = new Uint8Array(buffer);
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

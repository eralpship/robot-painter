import { useCallback } from "react";

const STORAGE_KEY = "robot-painting-texture-svg";

export function useTexturePersistence() {
	const saveTexture = useCallback((svgString: string) => {
		try {
			localStorage.setItem(STORAGE_KEY, svgString);
		} catch (error) {
			console.error("Failed to save texture:", error);
		}
	}, []);

	const loadTexture = useCallback((): string | null => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			return saved ?? null;
		} catch (error) {
			console.error("Failed to load texture:", error);
			return null;
		}
	}, []);

	return { saveTexture, loadTexture };
}

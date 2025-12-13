import type React from "react";
import {
	createContext,
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { useTextureEditorPersistence } from "@/hooks/useTextureEditorPersistence";
import type { CanonicalTransform } from "@/utils/transforms";
import type { OverlayTextureSides } from "./overlay-texture-canvas-context";

export const CANVAS_SIZE = 1024; // if you change this also resize the paintable_uv.svg's root size and viewbox size

export type TexureEditorMode = "full" | "basic";

type _BaseTextureEditorElement = {
	transform: CanonicalTransform;
	side: keyof OverlayTextureSides;
};

type _TextureEditorImageElement = {
	type: "image";
	base64data: string;
	width: number;
	height: number;
};
type _TextureEditorTextElement = {
	type: "text";
	text: string;
	color: string;
	fontSize: number;
};
export type TextureEditorElementPatch = Partial<
	{
		transform: CanonicalTransform;
		side: keyof OverlayTextureSides;
	} & (
		| Omit<_TextureEditorImageElement, "type">
		| Omit<_TextureEditorTextElement, "type">
	)
>;

type TextureEditorElement = _BaseTextureEditorElement &
	(_TextureEditorImageElement | _TextureEditorTextElement);
export type TextureEditorElementWithUuid = TextureEditorElement & {
	uuid: string;
};

type TextureEditorContextType = {
	mode: TexureEditorMode;
	side: keyof OverlayTextureSides;
	setSide: (side: keyof OverlayTextureSides) => void;
	resetToDefaults: () => void;
	addElement: (element: TextureEditorElement) => void;
	removeElement: (elementId: string) => void;
	setSelectedElementId: (elementId: string | undefined) => void;
	selectedElement: TextureEditorElementWithUuid | undefined;
	updateElement: (elementId: string, patch: TextureEditorElementPatch) => void;
	elements: ElementMap;
	backgroundColor: string;
	setBackgroundColor: (color: string) => void;
	center: { x: number; y: number };
	size: { width: number; height: number };
	notifyEditorReady: () => void;
	createNewProject: (name: string) => Promise<number>;
	isLoaded: boolean;
};

export const TextureEditorContext = createContext<TextureEditorContextType>(
	{} as TextureEditorContextType,
);

type ElementAction =
	| { type: "add"; value: TextureEditorElement }
	| { type: "remove"; uuid: string }
	| { type: "update"; uuid: string; patch: TextureEditorElementPatch }
	| { type: "reset" }
	| { type: "load"; elements: Map<string, TextureEditorElementWithUuid> };

type ElementMap = Map<string, TextureEditorElementWithUuid>;

const elementReducer = (
	state: ElementMap,
	action: ElementAction,
): ElementMap => {
	const newMap = new Map<string, TextureEditorElementWithUuid>(state);
	switch (action.type) {
		case "add": {
			const uuid = uuidv4();
			newMap.set(uuid, { ...action.value, uuid });
			return newMap;
		}
		case "remove":
			newMap.delete(action.uuid);
			return newMap;
		case "update": {
			const existing = newMap.get(action.uuid);
			if (!existing) {
				return newMap;
			}
			newMap.set(action.uuid, { ...existing, ...action.patch });
			return newMap;
		}
		case "reset":
			return createDefaultElements();
		case "load":
			return action.elements;
		default:
			return state;
	}
};

export function createDefaultElements() {
	const defaultElements: TextureEditorElement[] = [
		{
			type: "text" as const,
			text: "LEFT",
			fontSize: 192,
			transform: {
				centerX: 500,
				centerY: 500,
				rotation: 0,
				scaleX: 1,
				scaleY: 1,
			},
			color: "#000000",
			side: "left",
		},
		{
			type: "text" as const,
			text: "RIGHT",
			fontSize: 192,
			transform: {
				centerX: 500,
				centerY: 500,
				rotation: 0,
				scaleX: 1,
				scaleY: 1,
			},
			color: "#000000",
			side: "right",
		},
		{
			type: "text" as const,
			text: "FRONT",
			fontSize: 192,
			transform: {
				centerX: 500,
				centerY: 500,
				rotation: 0,
				scaleX: 1,
				scaleY: 1,
			},
			color: "#000000",
			side: "front",
		},
		{
			type: "text" as const,
			text: "BACK",
			fontSize: 192,
			transform: {
				centerX: 500,
				centerY: 500,
				rotation: 0,
				scaleX: 1,
				scaleY: 1,
			},
			color: "#000000",
			side: "back",
		},
		{
			type: "text" as const,
			text: "LID",
			fontSize: 192,
			transform: {
				centerX: 500,
				centerY: 500,
				rotation: 0,
				scaleX: 1,
				scaleY: 1,
			},
			color: "#000000",
			side: "lid",
		},
	];

	return new Map<string, TextureEditorElementWithUuid>(
		defaultElements.map((e) => {
			const uuid = uuidv4();
			return [uuid, { ...e, uuid }] as const;
		}),
	);
}

export function TextureEditorContextProvider({
	mode,
	projectId,
	children,
}: {
	mode: TexureEditorMode;
	projectId?: number;
	children: React.ReactNode;
}) {
	const { saveState, loadState, getMostRecentProjectId, createProject } =
		useTextureEditorPersistence();

	// Start with empty elements - we'll load from database
	const [elements, dispatchElementsAction] = useReducer(
		elementReducer,
		new Map(),
	);

	const [selectedElementId, setSelectedElementId] = useState<
		string | undefined
	>(undefined);

	const [backgroundColor, setBackgroundColor] = useState("#ffffff");

	// Track whether initial load is complete
	const [isLoaded, setIsLoaded] = useState(false);

	// Load saved state only after TextureEditor signals it's ready
	const hasLoadedFromStorage = useRef(false);
	const redirectCountRef = useRef(0);
	const MAX_REDIRECTS = 3;
	const notifyEditorReady = useCallback(() => {
		if (hasLoadedFromStorage.current) {
			console.log("[TextureEditor] Already loaded from storage, skipping");
			return;
		}

		// Set flag immediately to prevent race conditions from duplicate calls
		hasLoadedFromStorage.current = true;

		console.log(
			"[TextureEditor] Editor is ready, loading saved state from IndexedDB",
			{ projectId },
		);

		// If no projectId provided, redirect to most recent project
		if (projectId === undefined) {
			console.log(
				"[TextureEditor] No project ID in URL, looking up most recent project",
			);
			getMostRecentProjectId()
				.then(async (recentProjectId) => {
					if (recentProjectId !== null) {
						// Check redirect circuit breaker
						if (redirectCountRef.current >= MAX_REDIRECTS) {
							console.error(
								"[TextureEditor] Max redirects exceeded, stopping to prevent infinite loop",
							);
							alert(
								"Unable to load project. Please clear browser data and refresh.",
							);
							setIsLoaded(true);
							return;
						}

						redirectCountRef.current += 1;
						console.log("[TextureEditor] Redirect attempt", {
							count: redirectCountRef.current,
						});

						// Redirect to most recent project
						console.log("[TextureEditor] Redirecting to most recent project", {
							id: recentProjectId,
						});
						const currentPath = mode === "full" ? "/texture-editor" : "/";
						window.location.href = `${currentPath}?project-id=${recentProjectId}`;
					} else {
						// No projects exist - create a default project and reload
						console.log(
							"[TextureEditor] No projects found, creating default project",
						);
						try {
							const defaultProjectId = await createProject("default");
							console.log("[TextureEditor] Created default project", {
								id: defaultProjectId,
							});

							// Check redirect circuit breaker
							if (redirectCountRef.current >= MAX_REDIRECTS) {
								console.error(
									"[TextureEditor] Max redirects exceeded, stopping to prevent infinite loop",
								);
								alert(
									"Unable to load project. Please clear browser data and refresh.",
								);
								setIsLoaded(true);
								return;
							}

							redirectCountRef.current += 1;
							console.log("[TextureEditor] Redirect attempt", {
								count: redirectCountRef.current,
							});

							// Reload page with new project ID
							const currentPath = mode === "full" ? "/texture-editor" : "/";
							window.location.href = `${currentPath}?project-id=${defaultProjectId}`;
						} catch (error) {
							console.error(
								"[TextureEditor] Failed to create default project:",
								error,
							);
							setIsLoaded(true);
						}
					}
				})
				.catch((error) => {
					console.error(
						"[TextureEditor] Failed to get most recent project ID:",
						error,
					);
					setIsLoaded(true);
				});
			return;
		}

		// Load specific project by ID
		loadState(projectId)
			.then(async (loaded) => {
				if (loaded) {
					console.log("[TextureEditor] Loading saved state from IndexedDB", {
						backgroundColor: loaded.backgroundColor,
						elementCount: loaded.elements.size,
					});
					dispatchElementsAction({ type: "load", elements: loaded.elements });
					setBackgroundColor(loaded.backgroundColor);
					setIsLoaded(true);
					redirectCountRef.current = 0; // Reset counter on successful load
				} else {
					// Invalid project ID - check if other projects exist
					alert(`Project with id ${projectId} doesn't exist!`);
					console.log(
						"[TextureEditor] Invalid project ID, checking for other projects",
					);

					const recentProjectId = await getMostRecentProjectId();
					const currentPath = mode === "full" ? "/texture-editor" : "/";

					if (recentProjectId !== null) {
						// Check redirect circuit breaker
						if (redirectCountRef.current >= MAX_REDIRECTS) {
							console.error(
								"[TextureEditor] Max redirects exceeded, stopping to prevent infinite loop",
							);
							alert(
								"Unable to load project. Please clear browser data and refresh.",
							);
							setIsLoaded(true);
							return;
						}

						redirectCountRef.current += 1;
						console.log("[TextureEditor] Redirect attempt", {
							count: redirectCountRef.current,
						});

						// Redirect to most recent project
						console.log("[TextureEditor] Redirecting to most recent project", {
							id: recentProjectId,
						});
						window.location.href = `${currentPath}?project-id=${recentProjectId}`;
					} else {
						// Check redirect circuit breaker
						if (redirectCountRef.current >= MAX_REDIRECTS) {
							console.error(
								"[TextureEditor] Max redirects exceeded, stopping to prevent infinite loop",
							);
							alert(
								"Unable to load project. Please clear browser data and refresh.",
							);
							setIsLoaded(true);
							return;
						}

						redirectCountRef.current += 1;
						console.log("[TextureEditor] Redirect attempt", {
							count: redirectCountRef.current,
						});

						// No projects exist - clear parameter and reload (will trigger default project creation)
						console.log(
							"[TextureEditor] No projects found, clearing parameter to trigger default project creation",
						);
						window.location.href = currentPath;
					}
				}
			})
			.catch((error) => {
				console.error(
					"[TextureEditor] Failed to load state from IndexedDB:",
					error,
				);
				setIsLoaded(true);
			});
	}, [loadState, getMostRecentProjectId, projectId, createProject, mode]);

	const resetToDefaults = useCallback(() => {
		console.log("[TextureEditor] Resetting current project to defaults");
		// Don't clear state - just reset elements and background
		// The auto-save will update the current project
		dispatchElementsAction({ type: "reset" });
		setBackgroundColor("#ffffff");
		setSelectedElementId(undefined);
	}, []);

	const addElement = useCallback<TextureEditorContextType["addElement"]>(
		(element) => dispatchElementsAction({ type: "add", value: element }),
		[],
	);

	const removeElement = useCallback<TextureEditorContextType["removeElement"]>(
		(elementId) => dispatchElementsAction({ type: "remove", uuid: elementId }),
		[],
	);

	const updateElement = useCallback<TextureEditorContextType["updateElement"]>(
		(elementId, patch) => {
			dispatchElementsAction({
				type: "update",
				uuid: elementId,
				patch: patch,
			});
		},
		[],
	);

	const selectedElement = useMemo(
		() => (selectedElementId ? elements.get(selectedElementId) : undefined),
		[selectedElementId, elements],
	);

	const [side, internalSetSide] = useState<keyof OverlayTextureSides>("front");
	const setSide = useCallback<typeof internalSetSide>((side) => {
		internalSetSide(side);
		setSelectedElementId(undefined);
	}, []);

	const createNewProject = useCallback(
		async (name: string): Promise<number> => {
			console.log("[TextureEditor] Creating new project", { name });

			try {
				const newProjectId = await createProject(name);
				console.log("[TextureEditor] New project created", {
					id: newProjectId,
					name,
				});
				return newProjectId;
			} catch (error) {
				console.error("[TextureEditor] Failed to create new project:", error);
				alert("Failed to create new project. Please try again.");
				throw error;
			}
		},
		[createProject],
	);

	// Auto-sync to IndexedDB when state changes (only after load completes)
	useEffect(() => {
		// Skip auto-save until initial load is complete
		if (!isLoaded) {
			console.log("[TextureEditor] Skipping auto-save - not yet loaded");
			return;
		}

		// Skip auto-save if no project ID in URL
		if (!projectId) {
			console.warn("[TextureEditor] No project ID in URL, skipping auto-save");
			return;
		}

		console.log(
			"[TextureEditor] State changed, scheduling auto-save in 300ms",
			{
				backgroundColor,
				elementCount: elements.size,
			},
		);

		const timeoutId = setTimeout(() => {
			console.log("[TextureEditor] Auto-saving to IndexedDB", {
				backgroundColor,
				elementCount: elements.size,
			});
			saveState(projectId, backgroundColor, elements)
				.then(() => {
					console.log("[TextureEditor] Auto-save completed successfully");
				})
				.catch((error) => {
					console.error("[TextureEditor] Auto-save failed:", error);
				});
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [backgroundColor, elements, isLoaded, saveState, projectId]);

	return (
		<TextureEditorContext.Provider
			value={{
				side,
				setSide,
				mode,
				elements,
				resetToDefaults,
				addElement,
				removeElement,
				selectedElement,
				updateElement,
				center: { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 },
				size: { width: CANVAS_SIZE, height: CANVAS_SIZE },
				setSelectedElementId,
				backgroundColor,
				setBackgroundColor,
				notifyEditorReady,
				createNewProject,
				isLoaded,
			}}
		>
			{children}
		</TextureEditorContext.Provider>
	);
}

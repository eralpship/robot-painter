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

export type ProjectModalState =
	| { type: "none" }
	| {
			type: "selection";
			reason: "no-selection" | "not-found" | "first-time";
			invalidProjectId?: number;
			recentProject: { id: number; name: string } | null;
	  };

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
	projectModal: ProjectModalState;
	setProjectModal: (state: ProjectModalState) => void;
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
	const { saveState, loadState, getMostRecentProject, createProject } =
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

	// Modal state for project selection/creation
	const [projectModal, setProjectModal] = useState<ProjectModalState>({
		type: "none",
	});

	// Load saved state only after TextureEditor signals it's ready
	const hasLoadedFromStorage = useRef(false);
	const notifyEditorReady = useCallback(() => {
		if (hasLoadedFromStorage.current) {
			return;
		}

		// Set flag immediately to prevent race conditions from duplicate calls
		hasLoadedFromStorage.current = true;

		// If no projectId provided, show project selection modal
		if (projectId === undefined) {
			getMostRecentProject()
				.then((recentProject) => {
					if (recentProject !== null) {
						// Case #2: No projectId but recent exists - show selection modal
						setProjectModal({
							type: "selection",
							reason: "no-selection",
							recentProject,
						});
					} else {
						// Case #3: No projectId and no projects - show first-time modal
						setProjectModal({
							type: "selection",
							reason: "first-time",
							recentProject: null,
						});
					}
					setIsLoaded(true);
				})
				.catch((error) => {
					console.error(
						"[TextureEditor] Failed to get most recent project:",
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
					dispatchElementsAction({ type: "load", elements: loaded.elements });
					setBackgroundColor(loaded.backgroundColor);
					setIsLoaded(true);
				} else {
					// Invalid project ID - show modal with option to load recent or create new
					const recentProject = await getMostRecentProject();

					if (recentProject !== null) {
						// Case #4: Invalid projectId but recent exists
						setProjectModal({
							type: "selection",
							reason: "not-found",
							invalidProjectId: projectId,
							recentProject,
						});
					} else {
						// Case #5: Invalid projectId and no projects exist
						setProjectModal({
							type: "selection",
							reason: "not-found",
							invalidProjectId: projectId,
							recentProject: null,
						});
					}
					setIsLoaded(true);
				}
			})
			.catch((error) => {
				console.error(
					"[TextureEditor] Failed to load state from IndexedDB:",
					error,
				);
				setIsLoaded(true);
			});
	}, [loadState, getMostRecentProject, projectId]);

	const resetToDefaults = useCallback(() => {
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
			try {
				const newProjectId = await createProject(name);
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
		if (!isLoaded || !projectId) {
			return;
		}

		const timeoutId = setTimeout(() => {
			saveState(projectId, backgroundColor, elements).catch((error) => {
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
				projectModal,
				setProjectModal,
			}}
		>
			{children}
		</TextureEditorContext.Provider>
	);
}

import { useCallback } from "react";
import type { TextureEditorElementWithUuid } from "@/contexts/texture-editor-context";
import { createDefaultElements } from "@/contexts/texture-editor-context";
import { db, type TextureProject } from "@/db/db";

const CURRENT_VERSION = 2;

type PersistedState = {
	version: number;
	backgroundColor: string;
	elements: TextureEditorElementWithUuid[];
};

export function useTextureEditorPersistence() {
	const saveState = useCallback(
		async (
			projectId: number,
			backgroundColor: string,
			elements: Map<string, TextureEditorElementWithUuid>,
		) => {
			try {
				const state: PersistedState = {
					version: CURRENT_VERSION,
					backgroundColor,
					elements: Array.from(elements.values()),
				};

				const json = JSON.stringify(state);

				// Always update the specified project
				await db.textureProjects.update(projectId, {
					json,
					dateModified: new Date(),
				});
				console.log("[Persistence] Updated project", {
					id: projectId,
					version: CURRENT_VERSION,
					backgroundColor,
					elementCount: elements.size,
					jsonLength: json.length,
				});
			} catch (error) {
				console.error(
					"[Persistence] Failed to save texture editor state:",
					error,
				);
			}
		},
		[],
	);

	const getMostRecentProjectId = useCallback(async (): Promise<
		number | null
	> => {
		try {
			const project = await db.textureProjects
				.orderBy("dateModified")
				.reverse()
				.first();

			return project?.id ? (project.id as number) : null;
		} catch (error) {
			console.error(
				"[Persistence] Failed to get most recent project ID:",
				error,
			);
			return null;
		}
	}, []);

	const loadState = useCallback(
		async (
			projectId?: number,
		): Promise<{
			backgroundColor: string;
			elements: Map<string, TextureEditorElementWithUuid>;
		} | null> => {
			try {
				console.log("[Persistence] Attempting to load from IndexedDB", {
					projectId,
				});

				let project: TextureProject | undefined;

				if (projectId !== undefined) {
					// Load specific project by ID
					project = await db.textureProjects.get(projectId);

					if (!project) {
						console.log("[Persistence] Project not found", { projectId });
						return null;
					}
				} else {
					// Get most recently modified project
					project = await db.textureProjects
						.orderBy("dateModified")
						.reverse()
						.first();

					if (!project) {
						console.log("[Persistence] No projects found in IndexedDB");
						return null;
					}
				}

				const parsed: PersistedState = JSON.parse(project.json);

				// Version check - clear incompatible formats
				if (!parsed.version || parsed.version < CURRENT_VERSION) {
					console.log("[Persistence] Incompatible version detected", {
						storedVersion: parsed.version || 1,
						currentVersion: CURRENT_VERSION,
						projectId: project.id,
						action: "skipping this project",
					});
					return null;
				}

				// Convert array back to Map, preserving UUIDs
				const elementsMap = new Map<string, TextureEditorElementWithUuid>();
				for (const element of parsed.elements) {
					elementsMap.set(element.uuid, element);
				}

				console.log("[Persistence] Loaded from IndexedDB", {
					projectId: project.id,
					projectName: project.name,
					version: parsed.version,
					backgroundColor: parsed.backgroundColor,
					elementCount: elementsMap.size,
					dateModified: project.dateModified,
				});

				return {
					backgroundColor: parsed.backgroundColor,
					elements: elementsMap,
				};
			} catch (error) {
				console.error(
					"[Persistence] Failed to load texture editor state:",
					error,
				);
				return null;
			}
		},
		[],
	);

	const createProject = useCallback(async (name: string): Promise<number> => {
		try {
			// Create default elements
			const defaultElements = createDefaultElements();

			const state: PersistedState = {
				version: CURRENT_VERSION,
				backgroundColor: "#ffffff",
				elements: Array.from(defaultElements.values()),
			};

			const json = JSON.stringify(state);

			const id = await db.textureProjects.add({
				name,
				json,
				dateCreated: new Date(),
				dateModified: new Date(),
			});

			console.log("[Persistence] Created new project", {
				id,
				name,
				version: CURRENT_VERSION,
				elementCount: defaultElements.size,
			});

			return id as number;
		} catch (error) {
			console.error("[Persistence] Failed to create project:", error);
			throw error;
		}
	}, []);

	return {
		saveState,
		loadState,
		getMostRecentProjectId,
		createProject,
	};
}

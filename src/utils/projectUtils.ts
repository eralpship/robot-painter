import type { TextureEditorElementWithUuid } from "@/contexts/texture-editor-context";
import { createDefaultElements } from "@/contexts/texture-editor-context";
import { db } from "@/db/db";

const CURRENT_VERSION = 2;

type PersistedState = {
	version: number;
	backgroundColor: string;
	elements: TextureEditorElementWithUuid[];
};

/**
 * Creates a new project with default elements and saves it to the database.
 * @param name - The name for the new project
 * @returns The ID of the newly created project
 */
export async function createProject(name: string): Promise<number> {
	// Create default elements
	const defaultElements = createDefaultElements();

	const state: PersistedState = {
		version: CURRENT_VERSION,
		backgroundColor: "#ffffff",
		elements: Array.from(defaultElements.values()),
	};

	const json = JSON.stringify(state);
	const now = new Date();

	const id = await db.textureProjects.add({
		name,
		json,
		dateCreated: now,
		dateModified: now,
	});

	return id as number;
}

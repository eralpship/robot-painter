/**
 * Test helpers exposed on window for chrome-devtools MCP testing.
 * Only use in development/testing.
 */
import { db } from "@/db/db";

export const testHelpers = {
	/** Delete all projects from IndexedDB */
	async deleteAllProjects(): Promise<void> {
		await db.textureProjects.clear();
		console.log("[TestHelper] Deleted all projects");
	},

	/** Delete a specific project by ID */
	async deleteProject(id: number): Promise<void> {
		await db.textureProjects.delete(id);
		console.log(`[TestHelper] Deleted project ${id}`);
	},

	/** List all projects (for debugging) */
	async listProjects(): Promise<{ id: number; name: string }[]> {
		const projects = await db.textureProjects.toArray();
		return projects.map((p) => ({ id: p.id as number, name: p.name }));
	},

	/** Get project count */
	async getProjectCount(): Promise<number> {
		return await db.textureProjects.count();
	},
};

// Expose on window for chrome-devtools evaluate_script access (development only)
if (import.meta.env.DEV && typeof window !== "undefined") {
	(window as unknown as { testHelpers: typeof testHelpers }).testHelpers =
		testHelpers;
}

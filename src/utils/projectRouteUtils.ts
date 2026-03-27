/**
 * Shared route utilities for project-id search parameter validation.
 * Used by both /robot-editor and /texture-editor routes.
 */

import type { NavigateFn } from "@tanstack/react-router";
import type { TexureEditorMode } from "@/contexts/texture-editor-context";

export type ProjectSearchParams = {
	"project-id"?: number;
};

/**
 * Validates the project-id search parameter.
 * Returns a valid positive integer or undefined (which triggers "no project ID" flow).
 */
export function validateProjectSearch(
	search: Record<string, unknown>,
): ProjectSearchParams {
	const id = search["project-id"];
	const numId = Number(id);

	// Valid: positive integers only
	if (numId > 0 && Number.isInteger(numId)) {
		return { "project-id": numId };
	}

	// Invalid: undefined will trigger "no project ID" flow
	return { "project-id": undefined };
}

/**
 * Navigate to a project by ID. Opens the robot editor or texture editor based on mode.
 */
export function navigateToProject(
	navigate: NavigateFn,
	mode: TexureEditorMode,
	projectId: number,
): void {
	const to = mode === "full" ? "/texture-editor" : "/robot-editor";
	navigate({ to, search: { "project-id": projectId } });
}

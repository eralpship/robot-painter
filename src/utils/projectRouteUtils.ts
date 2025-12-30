/**
 * Shared route utilities for project-id search parameter validation.
 * Used by both / and /texture-editor routes.
 */

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

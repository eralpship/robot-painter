export type ValidationResult = {
	valid: boolean;
	error?: string;
};

const PROJECT_NAME_MAX_LENGTH = 50;
const PROJECT_NAME_REGEX = /^[a-zA-Z0-9 ]+$/;

/**
 * Validates a project name according to the rules:
 * - Not empty (after trimming)
 * - Max 50 characters
 * - Alphanumeric characters and spaces only
 */
export function validateProjectName(name: string): ValidationResult {
	// Check empty
	if (!name || name.trim().length === 0) {
		return { valid: false, error: "Project name cannot be empty" };
	}

	const trimmed = name.trim();

	// Check length
	if (trimmed.length > PROJECT_NAME_MAX_LENGTH) {
		return {
			valid: false,
			error: `Project name must be ${PROJECT_NAME_MAX_LENGTH} characters or less`,
		};
	}

	// Check alphanumeric + spaces only
	if (!PROJECT_NAME_REGEX.test(trimmed)) {
		return {
			valid: false,
			error: "Project name can only contain letters, numbers, and spaces",
		};
	}

	return { valid: true };
}

/**
 * Sanitizes a project name by trimming whitespace
 */
export function sanitizeProjectName(name: string): string {
	return name.trim();
}

import {
	projectExportSchema,
	CURRENT_EXPORT_VERSION,
	type ProjectData,
} from "@/schemas/project-export";

export class ImportError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ImportError";
	}
}

export async function parseImportFile(file: File): Promise<ProjectData> {
	const text = await file.text();

	let json: unknown;
	try {
		json = JSON.parse(text);
	} catch {
		throw new ImportError("Invalid JSON format");
	}

	const result = projectExportSchema.safeParse(json);

	if (!result.success) {
		const firstIssue = result.error.issues[0];
		if (firstIssue?.path.includes("exportVersion")) {
			const parsed = json as { exportVersion?: unknown };
			throw new ImportError(
				`Version mismatch: file has version ${parsed.exportVersion}, expected ${CURRENT_EXPORT_VERSION}`
			);
		}
		throw new ImportError(`Invalid project file: ${firstIssue?.message}`);
	}

	return result.data.data;
}

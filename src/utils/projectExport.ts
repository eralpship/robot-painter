import type { TextureProject } from "@/db/db";
import {
	CURRENT_EXPORT_VERSION,
	type ProjectExport,
} from "@/schemas/project-export";

const APP_NAME = "robot-painting-tool";
const APP_VERSION = "1.0.0";

/**
 * Exports a project as a JSON file download.
 * Creates a ProjectExport JSON structure and triggers browser download.
 * @param project - The TextureProject to export
 */
export function exportProject(project: TextureProject): void {
	const parsedData = JSON.parse(project.json);

	const exportData: ProjectExport = {
		exportVersion: CURRENT_EXPORT_VERSION,
		appName: APP_NAME,
		appVersion: APP_VERSION,
		exportedAt: new Date().toISOString(),
		data: {
			version: parsedData.version,
			backgroundColor: parsedData.backgroundColor,
			elements: parsedData.elements,
		},
	};

	const jsonString = JSON.stringify(exportData, null, 2);
	const blob = new Blob([jsonString], { type: "application/json" });
	const url = URL.createObjectURL(blob);

	const date = new Date().toISOString().split("T")[0];
	const sanitizedName = project.name.replace(/[^a-zA-Z0-9-_]/g, "-");
	const filename = `${APP_NAME}-${sanitizedName}-${date}.json`;

	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

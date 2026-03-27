import { z } from "zod";
import {
	type TextureEditorElementSchema,
	textureEditorElementsArraySchema,
} from "./texture-editor-elements";

// Current export format version
export const CURRENT_EXPORT_VERSION = 1;

// Project data schema (the actual project content)
const projectDataSchema = z.object({
	version: z.number(),
	backgroundColor: z.string(),
	elements: textureEditorElementsArraySchema,
});

// Full export format schema
export const projectExportSchema = z.object({
	exportVersion: z.literal(CURRENT_EXPORT_VERSION),
	appName: z.string(),
	appVersion: z.string(),
	exportedAt: z.string().datetime(), // ISO 8601 format
	data: projectDataSchema,
});

// TypeScript interfaces (inferred from schemas)
export type ProjectData = z.infer<typeof projectDataSchema>;
export type ProjectExport = z.infer<typeof projectExportSchema>;

// Explicit interface for documentation purposes
export interface ProjectExportFormat {
	exportVersion: 1;
	appName: string;
	appVersion: string;
	exportedAt: string; // ISO 8601
	data: {
		version: number;
		backgroundColor: string;
		elements: TextureEditorElementSchema[];
	};
}

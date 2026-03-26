import { z } from "zod";

// Valid side values for elements
const sideSchema = z.enum(["front", "back", "left", "right", "lid"]);

// Canonical transform schema
const canonicalTransformSchema = z.object({
	centerX: z.number(),
	centerY: z.number(),
	rotation: z.number(),
	scaleX: z.number(),
	scaleY: z.number(),
});

// Base element schema (shared by all element types)
const baseElementSchema = z.object({
	uuid: z.string().uuid(),
	side: sideSchema,
	transform: canonicalTransformSchema,
});

// Text element schema
const textElementSchema = baseElementSchema.extend({
	type: z.literal("text"),
	text: z.string(),
	color: z.string(),
	fontSize: z.number().positive(),
});

// Image element schema
const imageElementSchema = baseElementSchema.extend({
	type: z.literal("image"),
	base64data: z.string(),
	width: z.number().positive(),
	height: z.number().positive(),
});

// Rectangle element schema
const rectangleElementSchema = baseElementSchema.extend({
	type: z.literal("rectangle"),
	width: z.number().positive(),
	height: z.number().positive(),
	color: z.string(),
});

// Polygon element schema
const polygonElementSchema = baseElementSchema.extend({
	type: z.literal("polygon"),
	points: z.array(z.object({ x: z.number(), y: z.number() })).min(3),
	color: z.string(),
});

// Combined element schema (discriminated union)
export const textureEditorElementSchema = z.discriminatedUnion("type", [
	textElementSchema,
	imageElementSchema,
	rectangleElementSchema,
	polygonElementSchema,
]);

// Array of elements schema
export const textureEditorElementsArraySchema = z.array(
	textureEditorElementSchema,
);

// Type exports (inferred from schemas)
export type TextureEditorElementSchema = z.infer<
	typeof textureEditorElementSchema
>;
export type TextureEditorElementsArray = z.infer<
	typeof textureEditorElementsArraySchema
>;

// Validation helper with filtering (returns only valid elements)
export function parseAndFilterElements(
	data: unknown[],
): TextureEditorElementSchema[] {
	const validElements: TextureEditorElementSchema[] = [];

	for (let i = 0; i < data.length; i++) {
		const result = textureEditorElementSchema.safeParse(data[i]);
		if (result.success) {
			validElements.push(result.data);
		} else {
			console.warn(
				`[Schema] Invalid element at index ${i}, skipping:`,
				result.error.flatten(),
			);
		}
	}

	return validElements;
}

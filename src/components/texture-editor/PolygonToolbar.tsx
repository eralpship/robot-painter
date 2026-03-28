import { useContext } from "react";
import { ColorPickerButton } from "@/components/ui/ColorPickerButton";
import { TextureEditorContext } from "@/contexts/texture-editor-context";

export function PolygonToolbar() {
	const ctx = useContext(TextureEditorContext);

	const selectedPolygon =
		ctx.selectedElement?.type === "polygon" ? ctx.selectedElement : null;

	return (
		<ColorPickerButton
			label="Color"
			color={selectedPolygon?.color ?? "#3b82f6"}
			onChange={(color) => {
				if (selectedPolygon) {
					ctx.updateElement(selectedPolygon.uuid, { color });
				}
			}}
			disabled={!selectedPolygon}
		/>
	);
}

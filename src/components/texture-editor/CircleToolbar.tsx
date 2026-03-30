import { useContext } from "react";
import { ColorPickerButton } from "@/components/ui/ColorPickerButton";
import { TextureEditorContext } from "@/contexts/texture-editor-context";

export function CircleToolbar() {
	const ctx = useContext(TextureEditorContext);

	const selectedCircle =
		ctx.selectedElement?.type === "circle" ? ctx.selectedElement : null;

	return (
		<ColorPickerButton
			label="Color"
			color={selectedCircle?.color ?? "#3b82f6"}
			onChange={(color) => {
				if (selectedCircle) {
					ctx.updateElement(selectedCircle.uuid, { color });
				}
			}}
			disabled={!selectedCircle}
		/>
	);
}

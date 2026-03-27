import { Palette } from "lucide-react";
import { useContext } from "react";
import { ColorPickerButton } from "@/components/ui/ColorPickerButton";
import { TextureEditorContext } from "@/contexts/texture-editor-context";

export function RectangleToolbar() {
	const ctx = useContext(TextureEditorContext);

	const selectedRectangle =
		ctx.selectedElement?.type === "rectangle" ? ctx.selectedElement : null;

	return (
		<ColorPickerButton
			label="Rectangle"
			color={selectedRectangle?.color ?? "#3b82f6"}
			onChange={(color) => {
				if (selectedRectangle) {
					ctx.updateElement(selectedRectangle.uuid, { color });
				}
			}}
			disabled={!selectedRectangle}
			icon={Palette}
		/>
	);
}

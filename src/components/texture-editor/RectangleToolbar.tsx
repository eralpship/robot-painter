import { useContext } from "react";
import { ColorPickerButton } from "@/components/ui/ColorPickerButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextureEditorContext } from "@/contexts/texture-editor-context";

export function RectangleToolbar() {
	const ctx = useContext(TextureEditorContext);

	const selectedRectangle =
		ctx.selectedElement?.type === "rectangle" ? ctx.selectedElement : null;

	return (
		<>
			<ColorPickerButton
				label="Color"
				color={selectedRectangle?.color ?? "#3b82f6"}
				onChange={(color) => {
					if (selectedRectangle) {
						ctx.updateElement(selectedRectangle.uuid, { color });
					}
				}}
				disabled={!selectedRectangle}
			/>
			<div className="flex flex-col gap-1">
				<Label htmlFor="border-radius" className="text-[10px] text-muted-foreground">
					Corner Radius
				</Label>
				<Input
					id="border-radius"
					type="number"
					min={0}
					value={selectedRectangle?.borderRadius ?? 0}
					onChange={(e) => {
						if (selectedRectangle) {
							const value = Math.max(0, Number.parseInt(e.target.value) || 0);
							ctx.updateElement(selectedRectangle.uuid, { borderRadius: value });
						}
					}}
					disabled={!selectedRectangle}
					className="h-8 text-xs"
					placeholder="0"
				/>
			</div>
		</>
	);
}

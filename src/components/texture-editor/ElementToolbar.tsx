import { formatForDisplay } from "@tanstack/hotkeys";
import { useHotkeys } from "@tanstack/react-hotkeys";
import { Copy, CopyPlus, Trash2 } from "lucide-react";
import { useContext } from "react";
import { Button } from "@/components/ui/Button";
import { TextureEditorContext } from "@/contexts/texture-editor-context";

export function ElementToolbar() {
	const ctx = useContext(TextureEditorContext);

	useHotkeys([
		{
			hotkey: "Mod+C",
			callback: () => {
				if (ctx.selectedElement) ctx.copyElement(ctx.selectedElement.uuid);
			},
			options: { preventDefault: true, enabled: !!ctx.selectedElement },
		},
		{
			hotkey: "Mod+D",
			callback: () => {
				if (ctx.selectedElement) ctx.duplicateElement(ctx.selectedElement.uuid);
			},
			options: { preventDefault: true, enabled: !!ctx.selectedElement },
		},
	]);

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				onClick={() => {
					if (ctx.selectedElement) {
						ctx.copyElement(ctx.selectedElement.uuid);
					}
				}}
				disabled={!ctx.selectedElement}
				title={`Copy (${formatForDisplay("Mod+C")})`}
			>
				<Copy className="size-4" /> Copy
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => {
					if (ctx.selectedElement) {
						ctx.duplicateElement(ctx.selectedElement.uuid);
					}
				}}
				disabled={!ctx.selectedElement}
				title={`Duplicate (${formatForDisplay("Mod+D")})`}
			>
				<CopyPlus className="size-4" /> Duplicate
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => {
					if (ctx.selectedElement) {
						ctx.removeElement(ctx.selectedElement.uuid);
					}
				}}
				disabled={!ctx.selectedElement}
			>
				<Trash2 className="size-4" /> Remove
			</Button>
		</>
	);
}

import { ClipboardPaste, Copy, CopyPlus, Trash2 } from "lucide-react";
import { useContext, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { TextureEditorContext } from "@/contexts/texture-editor-context";

export function ElementToolbar() {
	const ctx = useContext(TextureEditorContext);

	// Keyboard shortcuts for copy/paste/duplicate
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const mod = e.metaKey || e.ctrlKey;
			if (!mod) return;

			if (e.key === "c" && ctx.selectedElement) {
				e.preventDefault();
				ctx.copyElement(ctx.selectedElement.uuid);
			} else if (e.key === "v" && ctx.clipboardElement) {
				e.preventDefault();
				ctx.pasteElement();
			} else if (e.key === "d" && ctx.selectedElement) {
				e.preventDefault();
				ctx.duplicateElement(ctx.selectedElement.uuid);
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [ctx]);

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
				title="Copy (Ctrl+C)"
			>
				<Copy className="size-4" /> Copy
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => ctx.pasteElement()}
				disabled={!ctx.clipboardElement}
				title="Paste (Ctrl+V)"
			>
				<ClipboardPaste className="size-4" /> Paste
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
				title="Duplicate (Ctrl+D)"
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

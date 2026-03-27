import { formatForDisplay } from "@tanstack/hotkeys";
import { useHotkey } from "@tanstack/react-hotkeys";
import { ClipboardPaste, X } from "lucide-react";
import { useContext } from "react";
import { Button } from "@/components/ui/Button";
import { TextureEditorContext } from "@/contexts/texture-editor-context";
import { AddElementToolbar } from "./AddElementToolbar";
import { CommonToolbar } from "./CommonToolbar";
import { ElementToolbar } from "./ElementToolbar";
import { PolygonToolbar } from "./PolygonToolbar";
import { RectangleToolbar } from "./RectangleToolbar";
import { SideSelector } from "./SideSelector";
import { TextToolbar } from "./TextToolbar";

export function Toolbar() {
	const ctx = useContext(TextureEditorContext);

	// Paste hotkey always active when clipboard has content (regardless of selection)
	useHotkey("Mod+V", () => ctx.pasteElement(), {
		preventDefault: true,
		enabled: ctx.mode === "full" && !!ctx.clipboardElement,
	});

	return (
		<div className="p-2 bg-surface border-b border-border flex gap-2 items-center w-full box-border relative">
			<div className="text-xs text-foreground-subtle flex flex-wrap flex-row items-start justify-start gap-2">
				<CommonToolbar />
				<SideSelector />
				{ctx.mode === "full"
					? ctx.isDrawingPolygon
						? (
								<Button
									variant="outline"
									size="sm"
									onClick={() => ctx.cancelPolygonDrawing()}
								>
									<X className="size-4" /> Cancel Drawing
								</Button>
							)
						: (
								<>
									<AddElementToolbar />
									<Button
										variant="outline"
										size="sm"
										onClick={() => ctx.pasteElement()}
										disabled={!ctx.clipboardElement}
										title={`Paste (${formatForDisplay("Mod+V")})`}
									>
										<ClipboardPaste className="size-4" /> Paste
									</Button>
									{ctx.selectedElement ? <ElementToolbar /> : null}
									{ctx.selectedElement?.type === "text" ? (
										<TextToolbar />
									) : null}
									{ctx.selectedElement?.type === "rectangle" ? (
										<RectangleToolbar />
									) : null}
									{ctx.selectedElement?.type === "polygon" ? (
										<PolygonToolbar />
									) : null}
								</>
							)
					: null}
			</div>
		</div>
	);
}

import { formatForDisplay } from "@tanstack/hotkeys";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useNavigate } from "@tanstack/react-router";
import { ClipboardPaste, ExternalLink, X } from "lucide-react";
import { useContext } from "react";
import { Button } from "@/components/ui/Button";
import { ColorPickerButton } from "@/components/ui/ColorPickerButton";
import { TextureEditorContext } from "@/contexts/texture-editor-context";
import { AddElementToolbar } from "./AddElementToolbar";
import { CircleToolbar } from "./CircleToolbar";
import { ElementOrderDropdown } from "./ElementOrderDropdown";
import { ElementToolbar } from "./ElementToolbar";
import { PolygonToolbar } from "./PolygonToolbar";
import { RectangleToolbar } from "./RectangleToolbar";
import { SideSelector } from "./SideSelector";
import { TextToolbar } from "./TextToolbar";

function ToolbarGroup({
	title,
	children,
}: {
	title?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1 w-full">
			{title && (
				<span className="text-[9px] uppercase tracking-wider text-foreground-subtle/60 px-1">
					{title}
				</span>
			)}
			<div className="flex flex-col gap-1 w-full">{children}</div>
		</div>
	);
}

export function Toolbar() {
	const ctx = useContext(TextureEditorContext);
	const navigate = useNavigate();

	// Paste hotkey always active when clipboard has content (regardless of selection)
	useHotkey("Mod+V", () => ctx.pasteElement(), {
		preventDefault: true,
		enabled: !!ctx.clipboardElement,
	});

	return (
		<div className="w-[140px] shrink-0 bg-surface border-r border-border overflow-y-auto overflow-x-hidden">
			<div className="flex flex-col gap-2 p-2 text-xs">
				<SideSelector />

				<ColorPickerButton
					label="Bckgrnd"
					color={ctx.backgroundColor}
					onChange={ctx.setBackgroundColor}
					debounceMs={100}
				/>

				{ctx.isDrawingPolygon ? (
					<Button
						variant="outline"
						size="sm"
						className="w-full"
						onClick={() => ctx.cancelPolygonDrawing()}
					>
						<X className="size-4" /> Cancel
					</Button>
				) : (
					<>
						{ctx.mode === "full" && (
							<ToolbarGroup title="Add">
								<AddElementToolbar />
							</ToolbarGroup>
						)}

						<ToolbarGroup title="Element">
							<Button
								variant="outline"
								size="sm"
								className="w-full justify-start"
								onClick={() => ctx.pasteElement()}
								disabled={!ctx.clipboardElement}
								title={`Paste (${formatForDisplay("Mod+V")})`}
							>
								<ClipboardPaste className="size-4" /> Paste
							</Button>
							<ElementToolbar />
							<ElementOrderDropdown />
						</ToolbarGroup>

						{ctx.selectedElement?.type === "text" && (
							<ToolbarGroup title="Text">
								<TextToolbar />
							</ToolbarGroup>
						)}

						{ctx.selectedElement?.type === "rectangle" && (
							<ToolbarGroup title="Shape">
								<RectangleToolbar />
							</ToolbarGroup>
						)}

						{ctx.selectedElement?.type === "circle" && (
							<ToolbarGroup title="Shape">
								<CircleToolbar />
							</ToolbarGroup>
						)}

						{ctx.selectedElement?.type === "polygon" && (
							<ToolbarGroup title="Shape">
								<PolygonToolbar />
							</ToolbarGroup>
						)}
					</>
				)}

				{ctx.mode === "basic" && (
					<div className="mt-auto pt-2 border-t border-border">
						<Button
							variant="outline"
							size="sm"
							className="w-full justify-start"
							onClick={() =>
								navigate({
									to: "/texture-editor",
									search: (prev) => prev,
								})
							}
						>
							<ExternalLink className="size-4 shrink-0" /> More
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

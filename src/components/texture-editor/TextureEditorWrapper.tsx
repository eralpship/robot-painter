import { useContext } from "react";
import {
	TextureEditorContext,
	TextureEditorContextProvider,
	type TexureEditorMode,
} from "@/contexts/texture-editor-context";
import type { OverlayTextureSides } from "@/contexts/overlay-texture-canvas-context";
import { TextureEditor } from "./TextureEditor";
import { Toolbar } from "./toolbar";

const editorStyle = {
	width: "min(100cqw, 100cqh)",
	height: "min(100cqw, 100cqh)",
	aspectRatio: "1",
};

/**
 * Wrapper that shows/hides a TextureEditor based on whether its side is active.
 * Inactive editors remain mounted but are invisible and don't accept input.
 */
function SideLayer({
	side,
	activeSide,
}: {
	side: keyof OverlayTextureSides;
	activeSide: keyof OverlayTextureSides;
}) {
	const isActive = side === activeSide;

	return (
		<div
			className={`absolute inset-0 flex items-center justify-center ${isActive ? "visible pointer-events-auto" : "invisible pointer-events-none"}`}
		>
			<TextureEditor side={side} style={editorStyle} />
		</div>
	);
}

function BackdropWithDeselect() {
	const editorCtx = useContext(TextureEditorContext);

	const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
		// Only deselect if clicking directly on the backdrop (not its children like SVG)
		if (e.target === e.currentTarget) {
			console.log("[TextureEditorWrapper] Backdrop clicked, deselecting");
			editorCtx.setSelectedElementId(undefined);
		}
	};

	return (
		<div
			id="texture-editor-wrapper-backdrop"
			className="min-h-0 flex items-center justify-center relative checkered-background [container-type:size]"
			onMouseDown={handleBackdropClick}
			role="application"
		>
			<SideLayer side="front" activeSide={editorCtx.side} />
			<SideLayer side="back" activeSide={editorCtx.side} />
			<SideLayer side="left" activeSide={editorCtx.side} />
			<SideLayer side="right" activeSide={editorCtx.side} />
			<SideLayer side="lid" activeSide={editorCtx.side} />
		</div>
	);
}

export function TextureEditorWrapper({
	mode,
	projectId,
}: {
	mode: TexureEditorMode;
	projectId?: number;
}) {
	return (
		<div className="h-full w-full grid grid-rows-[auto_1fr] grid-cols-1">
			<TextureEditorContextProvider mode={mode} projectId={projectId}>
				<Toolbar />
				<BackdropWithDeselect />
			</TextureEditorContextProvider>
		</div>
	);
}

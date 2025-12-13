import { useContext } from "react";
import {
	TextureEditorContext,
	TextureEditorContextProvider,
	type TexureEditorMode,
} from "@/contexts/texture-editor-context";
import { TextureEditor } from "./TextureEditor";
import { Toolbar } from "./toolbar";
import "@/styles/checkered-background.css";

const editorStyle = {
	width: "min(100cqw, 100cqh)",
	height: "min(100cqw, 100cqh)",
	aspectRatio: "1",
};

function BackdropWithDeselect({ children }: { children: React.ReactNode }) {
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
			className="checkered-background"
			onMouseDown={handleBackdropClick}
			role="application"
			style={{
				minHeight: 0,
				containerType: "size",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			{children}
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
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "grid",
				gridTemplateRows: "auto 1fr",
				gridTemplateColumns: "1fr",
			}}
		>
			<TextureEditorContextProvider mode={mode} projectId={projectId}>
				<Toolbar />
				<BackdropWithDeselect>
					<TextureEditor side="front" style={editorStyle} />
					<TextureEditor side="back" style={editorStyle} />
					<TextureEditor side="left" style={editorStyle} />
					<TextureEditor side="right" style={editorStyle} />
					<TextureEditor side="lid" style={editorStyle} />
				</BackdropWithDeselect>
			</TextureEditorContextProvider>
		</div>
	);
}

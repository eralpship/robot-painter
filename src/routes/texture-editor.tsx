import { createFileRoute } from "@tanstack/react-router";
import { FloatingCollapsibleWindow } from "../components/FloatingCollapsibleWindow";
import { RobotPreview } from "../components/RobotPreview";
import { TextureEditorWrapper } from "../components/texture-editor/TextureEditorWrapper";
import { OverlayTextureCanvasProvider } from "../contexts/overlay-texture-canvas-context";

type SearchParams = {
	"project-id"?: number;
};

export const Route = createFileRoute("/texture-editor")({
	validateSearch: (search: Record<string, unknown>): SearchParams => {
		const id = search["project-id"];
		const numId = Number(id);

		// Valid: positive integers only
		if (numId > 0 && Number.isInteger(numId)) {
			return { "project-id": numId };
		}

		// Invalid: undefined will trigger "no project ID" flow
		return { "project-id": undefined };
	},
	component: TextureEditor,
});

function TextureEditor() {
	const search = Route.useSearch();
	const projectId = search["project-id"];

	return (
		<OverlayTextureCanvasProvider>
			<div style={{ height: "100vh", width: "100vw" }}>
				<TextureEditorWrapper mode="full" projectId={projectId} />
				<FloatingCollapsibleWindow
					title="preview"
					x={12}
					y={48}
					width={300}
					height={260}
				>
					<RobotPreview />
				</FloatingCollapsibleWindow>
			</div>
		</OverlayTextureCanvasProvider>
	);
}

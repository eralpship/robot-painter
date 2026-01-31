import { createFileRoute } from "@tanstack/react-router";
import { FloatingCollapsibleWindow } from "../components/FloatingCollapsibleWindow";
import { PageContainer } from "../components/PageContainer";
import { RobotPreview } from "../components/RobotPreview";
import { TextureEditorWrapper } from "../components/texture-editor/TextureEditorWrapper";
import { OverlayTextureCanvasProvider } from "../contexts/overlay-texture-canvas-context";
import { validateProjectSearch } from "../utils/projectRouteUtils";

export const Route = createFileRoute("/texture-editor")({
	validateSearch: validateProjectSearch,
	component: TextureEditor,
});

function TextureEditor() {
	const search = Route.useSearch();
	const projectId = search["project-id"];

	// If no projectId, show only the project selection modal (no preview)
	if (projectId === undefined) {
		return (
			<OverlayTextureCanvasProvider>
				<PageContainer className="flex items-center justify-center">
					<TextureEditorWrapper mode="full" projectId={undefined} />
				</PageContainer>
			</OverlayTextureCanvasProvider>
		);
	}

	return (
		<OverlayTextureCanvasProvider>
			<PageContainer>
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
			</PageContainer>
		</OverlayTextureCanvasProvider>
	);
}

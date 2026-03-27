import { createFileRoute } from "@tanstack/react-router";
import { FloatingCollapsibleWindow } from "../components/FloatingCollapsibleWindow";
import { PageContainer } from "../components/PageContainer";
import { RobotPreview } from "../components/RobotPreview";
import { TitleBar } from "../components/TitleBar";
import { TextureEditorWrapper } from "../components/texture-editor/TextureEditorWrapper";
import { OverlayTextureCanvasProvider } from "../contexts/overlay-texture-canvas-context";
import { TextureEditorContextProvider } from "../contexts/texture-editor-context";
import { validateProjectSearch } from "../utils/projectRouteUtils";

export const Route = createFileRoute("/texture-editor")({
	validateSearch: validateProjectSearch,
	component: TextureEditor,
});

function TextureEditor() {
	const search = Route.useSearch();
	const projectId = search["project-id"];

	if (projectId === undefined) {
		return (
			<OverlayTextureCanvasProvider>
				<TextureEditorContextProvider mode="full" projectId={undefined}>
					<PageContainer className="flex flex-col">
						<TitleBar />
						<TextureEditorWrapper />
					</PageContainer>
				</TextureEditorContextProvider>
			</OverlayTextureCanvasProvider>
		);
	}

	return (
		<OverlayTextureCanvasProvider>
			<TextureEditorContextProvider mode="full" projectId={projectId}>
				<PageContainer className="flex flex-col">
					<TitleBar />
					<div className="flex-1 min-h-0 relative">
						<TextureEditorWrapper />
						<FloatingCollapsibleWindow
							title="preview"
							x={152}
							y={12}
							width={300}
							height={260}
						>
							<RobotPreview />
						</FloatingCollapsibleWindow>
					</div>
				</PageContainer>
			</TextureEditorContextProvider>
		</OverlayTextureCanvasProvider>
	);
}

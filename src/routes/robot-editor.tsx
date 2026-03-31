import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { EditorLoading } from "../components/EditorLoading";
import { PageContainer } from "../components/PageContainer";
import { TextureEditorWrapper } from "../components/texture-editor/TextureEditorWrapper";
import { OverlayTextureCanvasProvider } from "../contexts/overlay-texture-canvas-context";
import { TextureEditorContextProvider } from "../contexts/texture-editor-context";
import { TooltipProvider } from "../contexts/tooltip-context";
import { validateProjectSearch } from "../utils/projectRouteUtils";

// Lazy load the heavy 3D editor content
const RobotEditorContent = lazy(() =>
	import("../components/RobotEditorContent").then((m) => ({
		default: m.RobotEditorContent,
	})),
);

export const Route = createFileRoute("/robot-editor")({
	validateSearch: validateProjectSearch,
	component: RobotEditor,
});

function RobotEditor() {
	const { "project-id": projectId } = Route.useSearch();

	if (projectId === undefined) {
		return (
			<OverlayTextureCanvasProvider>
				<TooltipProvider>
					<TextureEditorContextProvider mode="basic" projectId={undefined}>
						<PageContainer>
							<TextureEditorWrapper />
						</PageContainer>
					</TextureEditorContextProvider>
				</TooltipProvider>
			</OverlayTextureCanvasProvider>
		);
	}

	return (
		<OverlayTextureCanvasProvider>
			<TooltipProvider>
				<TextureEditorContextProvider mode="basic" projectId={projectId}>
					<Suspense fallback={<EditorLoading />}>
						<PageContainer className="flex flex-col">
							<RobotEditorContent />
						</PageContainer>
					</Suspense>
				</TextureEditorContextProvider>
			</TooltipProvider>
		</OverlayTextureCanvasProvider>
	);
}

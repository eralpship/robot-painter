import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { EditorLoading } from "../components/EditorLoading";
import { PageContainer } from "../components/PageContainer";
import { OverlayTextureCanvasProvider } from "../contexts/overlay-texture-canvas-context";
import { TextureEditorContextProvider } from "../contexts/texture-editor-context";
import { validateProjectSearch } from "../utils/projectRouteUtils";

// Lazy load the heavy editor content
const TextureEditorContent = lazy(() =>
	import("../components/TextureEditorContent").then((m) => ({
		default: m.TextureEditorContent,
	})),
);

const TextureEditorContentBasic = lazy(() =>
	import("../components/TextureEditorContent").then((m) => ({
		default: m.TextureEditorContentBasic,
	})),
);

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
					<Suspense fallback={<EditorLoading />}>
						<PageContainer className="flex flex-col">
							<TextureEditorContentBasic />
						</PageContainer>
					</Suspense>
				</TextureEditorContextProvider>
			</OverlayTextureCanvasProvider>
		);
	}

	return (
		<OverlayTextureCanvasProvider>
			<TextureEditorContextProvider mode="full" projectId={projectId}>
				<Suspense fallback={<EditorLoading />}>
					<PageContainer className="flex flex-col">
						<TextureEditorContent />
					</PageContainer>
				</Suspense>
			</TextureEditorContextProvider>
		</OverlayTextureCanvasProvider>
	);
}

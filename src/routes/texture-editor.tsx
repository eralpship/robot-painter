import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { FloatingCollapsibleWindow } from "../components/FloatingCollapsibleWindow";
import { RobotPreview } from "../components/RobotPreview";
import { OverlayTextureCanvasProvider } from "../contexts/overlay-texture-canvas-context";

const TextureEditorWrapper = lazy(() =>
	import("../components/texture-editor/TextureEditorWrapper").then((m) => ({
		default: m.TextureEditorWrapper,
	})),
);

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
			<div className="h-screen w-screen">
				<Suspense fallback={<div>Loading...</div>}>
					<TextureEditorWrapper mode="full" projectId={projectId} />
				</Suspense>
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

import { useNavigate } from "@tanstack/react-router";
import { useContext, useEffect } from "react";
import type { OverlayTextureSides } from "@/contexts/overlay-texture-canvas-context";
import { TextureEditorContext } from "@/contexts/texture-editor-context";
import { useTextureEditorPersistence } from "@/hooks/useTextureEditorPersistence";
import type { ProjectData } from "@/schemas/project-export";
import { navigateToProject } from "@/utils/projectRouteUtils";
import { ProjectCreatedModal } from "./modals/ProjectCreatedModal";
import { ProjectSelectionModal } from "./modals/ProjectSelectionModal";
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
			editorCtx.setSelectedElementId(undefined);
		}
	};

	return (
		<div
			id="texture-editor-wrapper-backdrop"
			className="flex-1 min-h-0 min-w-0 flex items-center justify-center relative checkered-background @container-[size]"
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

function TextureEditorContent() {
	const { projectModal, createNewProject, mode, isLoaded, notifyEditorReady } =
		useContext(TextureEditorContext);
	const navigate = useNavigate();
	const { createProjectFromImport } = useTextureEditorPersistence();

	// Trigger project loading on mount
	useEffect(() => {
		notifyEditorReady();
	}, [notifyEditorReady]);

	// Don't render anything until project state is determined
	if (!isLoaded) {
		return null;
	}

	// When project selection modal is showing, don't render the editor
	// Modal overlay handles backdrop - no extra solid background needed
	if (projectModal.type === "selection") {
		return (
			<ProjectSelectionModal
				open={true}
				reason={projectModal.reason}
				invalidProjectId={projectModal.invalidProjectId}
				recentProject={projectModal.recentProject}
				onLoadRecent={() => {
					if (projectModal.recentProject) {
						navigateToProject(navigate, mode, projectModal.recentProject.id);
					}
				}}
				onBrowseProjects={() => navigate({ to: "/projects" })}
				onCreateProject={async (name) => {
					try {
						const newId = await createNewProject(name);
						navigateToProject(navigate, mode, newId);
					} catch (error) {
						console.error(
							"[TextureEditorWrapper] Failed to create project:",
							error,
						);
					}
				}}
				onImportProject={async (name, data: Omit<ProjectData, "name">) => {
					try {
						const newId = await createProjectFromImport(name, data);
						navigateToProject(navigate, mode, newId);
					} catch (error) {
						console.error(
							"[TextureEditorWrapper] Failed to import project:",
							error,
						);
						throw error;
					}
				}}
			/>
		);
	}

	// When project created modal is showing
	// Modal overlay handles backdrop - no extra solid background needed
	if (projectModal.type === "created") {
		return (
			<ProjectCreatedModal
				open={true}
				projectName={projectModal.projectName}
				onConfirm={() => {
					navigateToProject(navigate, mode, projectModal.projectId);
				}}
			/>
		);
	}

	// Normal rendering when project is loaded
	return (
		<div className="flex flex-row flex-1 h-full w-full min-h-0">
			<Toolbar />
			<BackdropWithDeselect />
		</div>
	);
}

export function TextureEditorWrapper() {
	return (
		<div className="h-full w-full flex-1 flex flex-col min-h-0">
			<TextureEditorContent />
		</div>
	);
}

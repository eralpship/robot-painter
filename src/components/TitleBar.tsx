import { useNavigate, useSearch } from "@tanstack/react-router";
import {
	Download,
	FolderPlus,
	Home,
	Paintbrush,
	Undo2,
	Wrench,
} from "lucide-react";
import { useContext, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextureEditorContext } from "@/contexts/texture-editor-context";
import { db } from "@/db/db";
import { exportProject } from "@/utils/projectExport";
import { NewProjectModal } from "./texture-editor/modals/NewProjectModal";

export function TitleBar() {
	const ctx = useContext(TextureEditorContext);
	const navigate = useNavigate();
	const search = useSearch({ strict: false });
	const projectId = search["project-id"];
	const [isCreatingProject, setIsCreatingProject] = useState(false);
	const [newProjectOpen, setNewProjectOpen] = useState(false);

	const handleExport = async () => {
		if (!projectId) return;
		const project = await db.textureProjects.get(projectId);
		if (project) {
			exportProject(project);
		}
	};

	return (
		<div className="bg-surface border-b border-border flex items-center gap-1 px-2 py-1 w-full shrink-0 overflow-x-auto overflow-y-hidden">
			<Button variant="outline" size="sm" onClick={() => navigate({ to: "/" })}>
				<Home className="size-4" />
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => {
					navigate({
						to: ctx.mode === "full" ? "/robot-editor" : "/texture-editor",
						search: (prev) => prev,
					});
				}}
			>
				{ctx.mode === "full" ? (
					<>
						<Wrench className="size-4" /> Robot Editor
					</>
				) : (
					<>
						<Paintbrush className="size-4" /> Texture Editor
					</>
				)}
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => navigate({ to: "/projects" })}
			>
				Projects
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => {
					if (
						confirm(
							"Reset to defaults? This will clear all elements and restore LEFT/RIGHT/FRONT/BACK/LID text.",
						)
					) {
						ctx.resetToDefaults();
					}
				}}
			>
				<Undo2 className="size-4" /> Reset
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={handleExport}
				disabled={!projectId}
			>
				<Download className="size-4" /> Export
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => {
					if (!isCreatingProject) setNewProjectOpen(true);
				}}
				disabled={isCreatingProject}
			>
				<FolderPlus className="size-4" />
				{isCreatingProject ? "Creating..." : "New Project"}
			</Button>
			<NewProjectModal
				open={newProjectOpen}
				onOpenChange={setNewProjectOpen}
				isSubmitting={isCreatingProject}
				onSubmit={async (sanitizedName) => {
					setIsCreatingProject(true);
					try {
						const newProjectId = await ctx.createNewProject(sanitizedName);
						ctx.showProjectCreatedModal(newProjectId, sanitizedName);
						setNewProjectOpen(false);
					} catch (error) {
						console.error("[TitleBar] Failed to create project:", error);
						setNewProjectOpen(false);
					} finally {
						setIsCreatingProject(false);
					}
				}}
			/>
		</div>
	);
}

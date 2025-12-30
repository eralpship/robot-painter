import { useNavigate } from "@tanstack/react-router";
import { FolderPlus, PaintBucket, Paintbrush, Trash2, Wrench } from "lucide-react";
import { useContext, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ColorPickerButton } from "@/components/ui/ColorPickerButton";
import { TextureEditorContext } from "@/contexts/texture-editor-context";
import { NewProjectModal } from "./modals/NewProjectModal";
import { ProjectCreatedModal } from "./modals/ProjectCreatedModal";

export function CommonToolbar() {
	const ctx = useContext(TextureEditorContext);
	const navigate = useNavigate();
	const [isCreatingProject, setIsCreatingProject] = useState(false);
	const [newProjectOpen, setNewProjectOpen] = useState(false);
	const [pendingProject, setPendingProject] = useState<{
		id: number;
		name: string;
	} | null>(null);

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				onClick={() => {
					navigate({
						to: ctx.mode === "full" ? "/" : "/texture-editor",
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
			<ColorPickerButton
				label="Background"
				color={ctx.backgroundColor}
				onChange={ctx.setBackgroundColor}
				debounceMs={100}
				icon={PaintBucket}
			/>
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
				<Trash2 className="size-4" /> Reset
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => {
					if (!isCreatingProject) {
						setNewProjectOpen(true);
					}
				}}
				className={isCreatingProject ? "opacity-50" : ""}
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
						// Show confirmation modal instead of immediate redirect
						setPendingProject({ id: newProjectId, name: sanitizedName });
						setNewProjectOpen(false);
					} catch (error) {
						console.error(
							"[CommonToolbar] Failed to create new project:",
							error,
						);
						setNewProjectOpen(false);
					} finally {
						setIsCreatingProject(false);
					}
				}}
			/>
			<ProjectCreatedModal
				open={pendingProject !== null}
				projectName={pendingProject?.name ?? ""}
				onConfirm={() => {
					if (pendingProject) {
						const currentPath = ctx.mode === "full" ? "/texture-editor" : "/";
						navigate({ to: currentPath, search: { "project-id": pendingProject.id } });
					}
				}}
			/>
		</>
	);
}

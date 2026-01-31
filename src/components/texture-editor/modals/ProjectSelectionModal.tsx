import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UndismissableDialog } from "@/components/ui/undismissable-dialog";
import {
	sanitizeProjectName,
	validateProjectName,
} from "@/utils/projectValidation";

type ProjectSelectionReason = "no-selection" | "not-found" | "first-time";

interface ProjectSelectionModalProps {
	open: boolean;
	reason: ProjectSelectionReason;
	invalidProjectId?: number;
	recentProject?: { id: number; name: string } | null;
	onLoadRecent: () => void;
	onBrowseProjects: () => void;
	onCreateProject: (name: string) => Promise<void>;
}

const TITLES: Record<ProjectSelectionReason, string> = {
	"no-selection": "Select a Project",
	"first-time": "Create a Project",
	"not-found": "Project Not Found",
};

const DESCRIPTIONS: Record<ProjectSelectionReason, (id?: number) => string> = {
	"no-selection": () =>
		"No project is currently selected. Choose how to continue:",
	"first-time": () => "Create your first project to get started.",
	"not-found": (id) => `The requested project (ID: ${id}) doesn't exist.`,
};

export function ProjectSelectionModal({
	open,
	reason,
	invalidProjectId,
	recentProject,
	onLoadRecent,
	onBrowseProjects,
	onCreateProject,
}: ProjectSelectionModalProps) {
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleCreate = async () => {
		const validation = validateProjectName(name);
		if (!validation.valid) {
			setError(validation.error ?? "Invalid name");
			return;
		}
		setError(null);
		setIsSubmitting(true);
		try {
			await onCreateProject(sanitizeProjectName(name));
		} catch {
			setError("Failed to create project. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const showQuickActions = reason !== "first-time";

	return (
		<UndismissableDialog open={open} className="z-[9999]">
			<DialogHeader>
				<DialogTitle>{TITLES[reason]}</DialogTitle>
				<DialogDescription>
					{DESCRIPTIONS[reason](invalidProjectId)}
				</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4">
				{showQuickActions && (
					<div className="grid gap-2">
						{recentProject && (
							<Button
								onClick={onLoadRecent}
								disabled={isSubmitting}
								variant="outline"
							>
								Load "{recentProject.name}"
							</Button>
						)}
						<Button
							onClick={onBrowseProjects}
							disabled={isSubmitting}
							variant="outline"
						>
							Browse All Projects
						</Button>
					</div>
				)}

				{showQuickActions && (
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-surface px-2 text-muted-foreground">
								or create a new project
							</span>
						</div>
					</div>
				)}

				<div className="grid gap-2">
					<Label htmlFor="project-name">Project Name</Label>
					<Input
						id="project-name"
						value={name}
						onChange={(e) => {
							setName(e.target.value);
							setError(null);
						}}
						placeholder="My Project"
						disabled={isSubmitting}
						onKeyDown={(e) => e.key === "Enter" && handleCreate()}
					/>
					{error && <p className="text-sm text-destructive">{error}</p>}
				</div>

				<Button onClick={handleCreate} disabled={isSubmitting}>
					{isSubmitting ? "Creating..." : "Create Project"}
				</Button>
			</div>
		</UndismissableDialog>
	);
}

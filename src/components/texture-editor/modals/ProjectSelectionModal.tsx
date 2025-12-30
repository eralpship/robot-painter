import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

	return (
		<Dialog open={open} onOpenChange={() => {}}>
			<DialogContent
				showCloseButton={false}
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
				className="z-[9999]"
			>
				<DialogHeader>
					<DialogTitle>{TITLES[reason]}</DialogTitle>
					<DialogDescription>
						{DESCRIPTIONS[reason](invalidProjectId)}
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4">
					{recentProject && (
						<Button
							onClick={onLoadRecent}
							disabled={isSubmitting}
							variant="outline"
						>
							Load "{recentProject.name}"
						</Button>
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
				</div>

				<DialogFooter>
					<Button onClick={handleCreate} disabled={isSubmitting}>
						{isSubmitting ? "..." : "Create Project"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

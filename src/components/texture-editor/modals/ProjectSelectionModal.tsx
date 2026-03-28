import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UndismissableDialog } from "@/components/ui/undismissable-dialog";
import type { ProjectData } from "@/schemas/project-export";
import { ImportError, parseImportFile } from "@/utils/projectImport";
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
	onImportProject: (
		name: string,
		data: Omit<ProjectData, "name">,
	) => Promise<void>;
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
	onImportProject,
}: ProjectSelectionModalProps) {
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Import state
	const [importMode, setImportMode] = useState(false);
	const [importProjectName, setImportProjectName] = useState("");
	const [importError, setImportError] = useState<string | null>(null);
	const [importedData, setImportedData] = useState<ProjectData | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setImportError(null);
		setImportedData(null);

		try {
			const data = await parseImportFile(file);
			setImportedData(data);
			// Suggest a name from the filename
			const suggestedName = file.name
				.replace(/\.json$/i, "")
				.replace(/^robot-painting-tool-/i, "")
				.replace(/-\d{4}-\d{2}-\d{2}$/, "")
				.replace(/-/g, " ");
			setImportProjectName(suggestedName);
		} catch (err) {
			if (err instanceof ImportError) {
				setImportError(err.message);
			} else {
				setImportError("Failed to read file");
			}
		}
	};

	const handleImport = async () => {
		if (!importedData) return;

		const importName = importProjectName.trim() || "Imported Project";
		setIsSubmitting(true);
		try {
			await onImportProject(importName, {
				version: importedData.version,
				backgroundColor: importedData.backgroundColor,
				elements: importedData.elements,
			});
		} catch {
			setImportError("Failed to import project. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetImportState = () => {
		setImportMode(false);
		setImportProjectName("");
		setImportError(null);
		setImportedData(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

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
				{showQuickActions && !importMode && (
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
						<Button
							onClick={() => setImportMode(true)}
							disabled={isSubmitting}
							variant="outline"
						>
							<Upload className="size-4 mr-2" />
							Import Project
						</Button>
					</div>
				)}

				{importMode && (
					<div className="grid gap-3">
						<input
							ref={fileInputRef}
							type="file"
							accept=".json"
							onChange={handleFileSelect}
							className="block w-full text-sm text-gray-400
								file:mr-4 file:py-2 file:px-4
								file:rounded-md file:border-0
								file:text-sm file:font-medium
								file:bg-gray-700 file:text-white
								hover:file:bg-gray-600
								cursor-pointer"
						/>
						{importError && (
							<p className="text-sm text-destructive">{importError}</p>
						)}
						{importedData && (
							<>
								<Label htmlFor="import-project-name">Project Name</Label>
								<Input
									id="import-project-name"
									value={importProjectName}
									onChange={(e) => setImportProjectName(e.target.value)}
									placeholder="Imported Project"
									disabled={isSubmitting}
									onKeyDown={(e) => e.key === "Enter" && handleImport()}
								/>
							</>
						)}
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={resetImportState}
								disabled={isSubmitting}
								className="flex-1"
							>
								Cancel
							</Button>
							<Button
								onClick={handleImport}
								disabled={!importedData || isSubmitting}
								className="flex-1"
							>
								{isSubmitting ? "Importing..." : "Import"}
							</Button>
						</div>
					</div>
				)}

				{showQuickActions && !importMode && (
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

				{!importMode && (
					<>
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
					</>
				)}
			</div>
		</UndismissableDialog>
	);
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Download,
	FolderPlus,
	Pencil,
	Plus,
	Trash,
	Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { PageContainer } from "@/components/PageContainer";
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
import { db } from "@/db/db";
import { useProjects } from "@/hooks/useProjects";
import { useTextureEditorPersistence } from "@/hooks/useTextureEditorPersistence";
import type { ProjectData } from "@/schemas/project-export";
import { exportProject } from "@/utils/projectExport";
import { ImportError, parseImportFile } from "@/utils/projectImport";
import { createProject } from "@/utils/projectUtils";

export const Route = createFileRoute("/projects")({
	component: Projects,
});

function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function Projects() {
	const { projects, isLoading } = useProjects();
	const navigate = useNavigate();
	const { createProjectFromImport, renameProject } =
		useTextureEditorPersistence();
	const [projectToDelete, setProjectToDelete] = useState<{
		id: number;
		name: string;
	} | null>(null);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [newProjectName, setNewProjectName] = useState("");

	// Import modal state
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [importProjectName, setImportProjectName] = useState("");
	const [importError, setImportError] = useState<string | null>(null);
	const [importedData, setImportedData] = useState<ProjectData | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Rename modal state
	const [projectToRename, setProjectToRename] = useState<{
		id: number;
		name: string;
	} | null>(null);
	const [renameValue, setRenameValue] = useState("");
	const [renameError, setRenameError] = useState<string | null>(null);

	const handleDeleteClick = (
		e: React.MouseEvent,
		projectId: number,
		projectName: string,
	) => {
		e.preventDefault();
		e.stopPropagation();
		setProjectToDelete({ id: projectId, name: projectName });
	};

	const confirmDelete = async () => {
		if (projectToDelete) {
			await db.textureProjects.delete(projectToDelete.id);
			setProjectToDelete(null);
		}
	};

	const handleCreateProject = async () => {
		const name = newProjectName.trim() || "Untitled Project";
		const projectId = await createProject(name);
		setIsCreateModalOpen(false);
		setNewProjectName("");
		navigate({ to: "/robot-editor", search: { "project-id": projectId } });
	};

	const handleExportClick = (
		e: React.MouseEvent,
		project: NonNullable<typeof projects>[number],
	) => {
		e.preventDefault();
		e.stopPropagation();
		if (project.id !== undefined) {
			exportProject(project);
		}
	};

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setImportError(null);
		setImportedData(null);

		try {
			const data = await parseImportFile(file);
			setImportedData(data);
			// Suggest a name from the filename (strip extension and app prefix)
			const suggestedName = file.name
				.replace(/\.json$/i, "")
				.replace(/^robot-painting-tool-/i, "")
				.replace(/-\d{4}-\d{2}-\d{2}$/, "") // Remove date suffix
				.replace(/-/g, " ");
			setImportProjectName(suggestedName);
		} catch (error) {
			if (error instanceof ImportError) {
				setImportError(error.message);
			} else {
				setImportError("Failed to read file");
			}
		}
	};

	const handleImportProject = async () => {
		if (!importedData) return;

		const name = importProjectName.trim() || "Imported Project";
		const projectId = await createProjectFromImport(name, {
			version: importedData.version,
			backgroundColor: importedData.backgroundColor,
			elements: importedData.elements,
		});

		closeImportModal();
		navigate({ to: "/robot-editor", search: { "project-id": projectId } });
	};

	const closeImportModal = () => {
		setIsImportModalOpen(false);
		setImportProjectName("");
		setImportError(null);
		setImportedData(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleRenameClick = (
		e: React.MouseEvent,
		projectId: number,
		projectName: string,
	) => {
		e.preventDefault();
		e.stopPropagation();
		setProjectToRename({ id: projectId, name: projectName });
		setRenameValue(projectName);
		setRenameError(null);
	};

	const closeRenameModal = () => {
		setProjectToRename(null);
		setRenameValue("");
		setRenameError(null);
	};

	const confirmRename = async () => {
		if (!projectToRename) return;

		const trimmed = renameValue.trim();
		if (!trimmed) {
			setRenameError("Project name cannot be empty");
			return;
		}
		if (trimmed.length > 100) {
			setRenameError("Project name must be 100 characters or less");
			return;
		}

		try {
			await renameProject(projectToRename.id, trimmed);
			closeRenameModal();
		} catch {
			setRenameError("Failed to rename project");
		}
	};

	return (
		<PageContainer className="text-white p-8 overflow-auto">
			<div className="max-w-4xl mx-auto">
				<div className="flex items-center justify-between mb-8">
					<div>
						<Link to="/" className="text-sm text-gray-400 hover:text-gray-300">
							&larr; Home
						</Link>
						<h1 className="text-3xl font-bold">Projects</h1>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							onClick={() => setIsImportModalOpen(true)}
						>
							<Upload className="size-4 mr-2" />
							Import Project
						</Button>
						<Button onClick={() => setIsCreateModalOpen(true)}>
							<Plus className="size-4 mr-2" />
							Create Project
						</Button>
					</div>
				</div>

				<h2 className="text-xl font-semibold mb-4">Recent Projects</h2>

				{isLoading ? (
					<p className="text-gray-400">Loading projects...</p>
				) : projects && projects.length > 0 ? (
					<div className="grid gap-4">
						{projects.map((project) => (
							<Link
								key={project.id}
								to="/robot-editor"
								search={{ "project-id": project.id }}
								className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
							>
								<div>
									<h2 className="text-xl font-semibold">{project.name}</h2>
									<p className="text-gray-400 text-sm mt-1">
										Last modified: {formatDate(project.dateModified)}
									</p>
								</div>
								{project.id !== undefined && (
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="sm"
											className="text-gray-400 hover:text-gray-300 hover:bg-gray-600"
											onClick={(e) =>
												handleRenameClick(e, project.id as number, project.name)
											}
										>
											<Pencil className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											className="text-gray-400 hover:text-gray-300 hover:bg-gray-600"
											onClick={(e) => handleExportClick(e, project)}
										>
											<Download className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
											onClick={(e) =>
												handleDeleteClick(e, project.id as number, project.name)
											}
										>
											<Trash className="size-4" />
										</Button>
									</div>
								)}
							</Link>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-16 px-4">
						<div className="bg-gray-800 rounded-lg p-8 text-center max-w-md">
							<FolderPlus className="w-16 h-16 mx-auto mb-4 text-gray-400" />
							<h3 className="text-xl font-semibold mb-2">No projects yet</h3>
							<p className="text-gray-400 mb-6">
								Create your first project to get started
							</p>
							<Button onClick={() => setIsCreateModalOpen(true)}>
								<Plus className="w-4 h-4 mr-2" />
								Create Your First Project
							</Button>
						</div>
					</div>
				)}
			</div>

			<Dialog
				open={projectToDelete !== null}
				onOpenChange={(open) => !open && setProjectToDelete(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Project</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{projectToDelete?.name}"? This
							action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setProjectToDelete(null)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={confirmDelete}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isCreateModalOpen}
				onOpenChange={(open) => {
					setIsCreateModalOpen(open);
					if (!open) setNewProjectName("");
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New Project</DialogTitle>
						<DialogDescription>
							Enter a name for your new project.
						</DialogDescription>
					</DialogHeader>
					<Input
						value={newProjectName}
						onChange={(e) => setNewProjectName(e.target.value)}
						placeholder="Project name"
						onKeyDown={(e) => {
							if (e.key === "Enter") handleCreateProject();
						}}
					/>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsCreateModalOpen(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleCreateProject}>Create</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isImportModalOpen}
				onOpenChange={(open) => {
					if (!open) closeImportModal();
					else setIsImportModalOpen(true);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Import Project</DialogTitle>
						<DialogDescription>
							Select a project file to import (.json)
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
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
							<p className="text-red-500 text-sm">{importError}</p>
						)}
						{importedData && (
							<Input
								value={importProjectName}
								onChange={(e) => setImportProjectName(e.target.value)}
								placeholder="Project name"
								onKeyDown={(e) => {
									if (e.key === "Enter") handleImportProject();
								}}
							/>
						)}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={closeImportModal}>
							Cancel
						</Button>
						<Button onClick={handleImportProject} disabled={!importedData}>
							Import
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={projectToRename !== null}
				onOpenChange={(open) => {
					if (!open) closeRenameModal();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Rename Project</DialogTitle>
						<DialogDescription>
							Enter a new name for "{projectToRename?.name}"
						</DialogDescription>
					</DialogHeader>
					<Input
						value={renameValue}
						onChange={(e) => {
							setRenameValue(e.target.value);
							setRenameError(null);
						}}
						placeholder="Project name"
						maxLength={100}
						onKeyDown={(e) => {
							if (e.key === "Enter") confirmRename();
						}}
					/>
					{renameError && <p className="text-red-500 text-sm">{renameError}</p>}
					<DialogFooter>
						<Button variant="outline" onClick={closeRenameModal}>
							Cancel
						</Button>
						<Button onClick={confirmRename}>Save</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageContainer>
	);
}

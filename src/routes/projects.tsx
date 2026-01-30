import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/Button";
import { FolderPlus, Plus, Trash } from "lucide-react";
import { createProject } from "@/utils/projectUtils";
import { db } from "@/db/db";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
	const [projectToDelete, setProjectToDelete] = useState<{
		id: number;
		name: string;
	} | null>(null);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [newProjectName, setNewProjectName] = useState("");

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
		navigate({ to: "/texture-editor", search: { "project-id": projectId } });
	};

	return (
		<div className="min-h-screen w-screen bg-gray-900 text-white p-8">
			<div className="max-w-4xl mx-auto">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-3xl font-bold">Robot Painting Tool</h1>
					<Button onClick={() => setIsCreateModalOpen(true)}>
						<Plus className="size-4 mr-2" />
						Create Project
					</Button>
				</div>

				<h2 className="text-xl font-semibold mb-4">Recent Projects</h2>

				{isLoading ? (
					<p className="text-gray-400">Loading projects...</p>
				) : projects && projects.length > 0 ? (
					<div className="grid gap-4">
						{projects.map((project) => (
							<Link
								key={project.id}
								to="/texture-editor"
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
		</div>
	);
}

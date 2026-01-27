import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/Button";
import { Trash } from "lucide-react";
import { db } from "@/db/db";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

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
	const [projectToDelete, setProjectToDelete] = useState<{
		id: number;
		name: string;
	} | null>(null);

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

	return (
		<div className="min-h-screen w-screen bg-gray-900 text-white p-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold mb-8">Robot Painting Tool</h1>

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
					<p className="text-gray-400">
						No projects yet. Create your first project to get started.
					</p>
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
		</div>
	);
}

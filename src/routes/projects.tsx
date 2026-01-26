import { createFileRoute, Link } from "@tanstack/react-router";
import { useProjects } from "@/hooks/useProjects";

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
								className="block p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
							>
								<h2 className="text-xl font-semibold">{project.name}</h2>
								<p className="text-gray-400 text-sm mt-1">
									Last modified: {formatDate(project.dateModified)}
								</p>
								{/* Align this to right side, and clicking it wont open the project and delete it instead */}
								<button
									type="button"
									className="text-red-500 hover:text-red-400 transition-colors"
								>
									Delete (change to icon)
									{/* we must prompt before deleting */}
								</button>
							</Link>
						))}
					</div>
				) : (
					<p className="text-gray-400">
						No projects yet. Create your first project to get started.
					</p>
				)}
			</div>
		</div>
	);
}

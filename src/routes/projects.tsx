import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects")({
	component: Projects,
});

function Projects() {
	return (
		<div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white">
			<h1 className="text-3xl font-bold mb-4">Projects</h1>
			<p className="text-gray-400">Your projects will be displayed here.</p>
		</div>
	);
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer } from "../components/PageContainer";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	return (
		<PageContainer className="flex items-center justify-center">
			<div className="max-w-xl w-full text-center space-y-8 p-8">
				<div className="space-y-3">
					<h1 className="text-4xl font-bold text-white">Robot Painter</h1>
					<p className="text-lg text-gray-400">
						Design and customize your own Starship delivery robot. Add text,
						images, shapes, and colors to create unique robot skins.
					</p>
				</div>
				<div className="flex flex-col gap-3 items-center">
					<Link
						to="/projects"
						className="inline-flex items-center justify-center rounded-md bg-white text-black font-medium px-6 py-3 hover:bg-gray-200 transition-colors w-64"
					>
						Get Started
					</Link>
					<Link
						to="/projects"
						className="inline-flex items-center justify-center rounded-md border border-gray-600 text-gray-300 font-medium px-6 py-3 hover:bg-gray-800 transition-colors w-64"
					>
						Browse Projects
					</Link>
				</div>
			</div>
		</PageContainer>
	);
}

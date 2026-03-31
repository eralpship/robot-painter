import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer } from "../components/PageContainer";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	return (
		<PageContainer className="flex items-center justify-center">
			<div className="max-w-xl w-full text-center space-y-8 p-10 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/10">
				<div className="space-y-4">
					<h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
						Robot Painter
					</h1>
					<p className="text-lg text-gray-300">
						Design and customize your own delivery robot. Add text, images,
						shapes, and colors to create unique robot skins.
					</p>
				</div>
				<div className="flex flex-col gap-3 items-center">
					<Link
						to="/robot-editor"
						className="inline-flex items-center justify-center rounded-lg bg-white text-black font-semibold px-6 py-3 hover:bg-gray-100 transition-colors w-64 shadow-lg"
					>
						Get Started
					</Link>
					<Link
						to="/projects"
						className="inline-flex items-center justify-center rounded-lg bg-white/10 text-white font-medium px-6 py-3 hover:bg-white/20 transition-colors w-64"
					>
						Browse Projects
					</Link>
				</div>
			</div>
		</PageContainer>
	);
}

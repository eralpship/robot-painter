import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

function GlobalBackground() {
	return (
		<div className="fixed inset-0 -z-10 pointer-events-none">
			{/* Gradient */}
			<div
				className="absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse at bottom center, #1a1e24 0%, #0d0f12 50%, #000000 100%)",
				}}
			/>
			{/* Pattern */}
			<div
				className="absolute inset-0 opacity-[0.08]"
				style={{
					backgroundImage: "url(/robot-pattern.png)",
					backgroundRepeat: "repeat",
					backgroundSize: "27px 27px",
				}}
			/>
		</div>
	);
}

export const Route = createRootRoute({
	component: () => (
		<HotkeysProvider>
			<GlobalBackground />
			<Outlet />
			<TanStackRouterDevtools />
		</HotkeysProvider>
	),
});

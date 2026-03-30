import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

function GlobalBackground() {
	return (
		<div className="fixed inset-0 -z-10 pointer-events-none">
			{/* Gradient - uses global-gradient utility */}
			<div className="absolute inset-0 global-gradient" />
			{/* Pattern - uses CSS variables for opacity and size */}
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: "url(/robot-pattern.png)",
					backgroundRepeat: "repeat",
					backgroundSize: "var(--size-pattern)",
					opacity: "var(--opacity-pattern)",
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

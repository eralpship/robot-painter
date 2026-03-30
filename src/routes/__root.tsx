import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

function GlobalBackground() {
	return (
		<div className="fixed inset-0 -z-10 pointer-events-none">
			{/* Gradient - uses CSS variables for colors */}
			<div
				className="absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse at bottom center, var(--color-gradient-start) 0%, var(--color-gradient-mid) 50%, var(--color-gradient-end) 100%)",
				}}
			/>
			{/* Pattern - uses CSS variable for opacity */}
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: "url(/robot-pattern.png)",
					backgroundRepeat: "repeat",
					backgroundSize: "27px 27px",
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

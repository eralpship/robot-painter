import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "@fontsource-variable/inter";
import "@fontsource/roboto";
import "@fontsource/open-sans";
import "@fontsource/montserrat";
import "@fontsource/oswald";
import "@fontsource/playfair-display";
import "@fontsource/raleway";
import "@fontsource/poppins";
import "@fontsource/lato";
import "@fontsource/inter";
import "@fontsource/permanent-marker";
import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";
import { initFontCache } from "./utils/font-embed";
import { initImageMagick } from "./utils/image-compression";

// Expose test helpers on window for chrome-devtools testing
import "./test-helpers";

// Initialize ImageMagick WASM early
initImageMagick().catch((err) => {
	console.error("[ImageMagick] Failed to initialize:", err);
});

// Initialize font cache for SVG embedding (after fonts are loaded)
document.fonts.ready.then(() => {
	initFontCache().catch((err) => {
		console.error("[FontEmbed] Failed to initialize:", err);
	});
});

// Create a new router instance
const router = createRouter({
	routeTree,
	context: {},
	defaultPreload: "intent",
	scrollRestoration: true,
	defaultStructuralSharing: true,
	defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Render the app
// StrictMode disabled - causes WebGL context loss with R3F in React 19 dev mode
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(<RouterProvider router={router} />);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

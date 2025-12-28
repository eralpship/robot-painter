import { useNavigate } from "@tanstack/react-router";
import { debounce } from "lodash";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextureEditorContext } from "@/contexts/texture-editor-context";
import {
	sanitizeProjectName,
	validateProjectName,
} from "@/utils/projectValidation";

export function CommonToolbar() {
	const ctx = useContext(TextureEditorContext);
	const navigate = useNavigate();
	const [localColor, setLocalColor] = useState(ctx.backgroundColor);
	const [isCreatingProject, setIsCreatingProject] = useState(false);
	const colorInputRef = useRef<HTMLInputElement>(null);

	// Debounced function to update context
	const debouncedSetColor = useCallback(
		debounce((color: string) => {
			ctx.setBackgroundColor(color);
		}, 100),
		[],
	);

	// Sync local color when context changes
	useEffect(() => {
		setLocalColor(ctx.backgroundColor);
	}, [ctx.backgroundColor]);

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				onClick={() => {
					navigate({
						to: ctx.mode === "full" ? "/" : "/texture-editor",
					});
				}}
			>
				{ctx.mode === "full" ? "robot editor" : "texture editor"}
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => colorInputRef.current?.click()}
				className="gap-2"
			>
				background
				<span
					className="w-4 h-4 rounded-sm border border-white/20"
					style={{ backgroundColor: localColor }}
				/>
				<input
					ref={colorInputRef}
					type="color"
					value={localColor}
					onChange={(e) => {
						const newColor = e.target.value;
						setLocalColor(newColor);
						debouncedSetColor(newColor);
					}}
					className="sr-only"
				/>
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => {
					if (
						confirm(
							"Reset to defaults? This will clear all elements and restore LEFT/RIGHT/FRONT/BACK/LID text.",
						)
					) {
						ctx.resetToDefaults();
					}
				}}
			>
				reset
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={async () => {
					if (isCreatingProject) return;

					const name = window.prompt("Enter project name:");

					if (name === null) {
						// User cancelled
						return;
					}

					const validation = validateProjectName(name);

					if (!validation.valid) {
						alert(validation.error);
						return;
					}

					const sanitizedName = sanitizeProjectName(name);

					setIsCreatingProject(true);
					try {
						// Create project and get the new ID
						const newProjectId = await ctx.createNewProject(sanitizedName);

						// Navigate to the current route with the new project-id
						// Use full page reload to ensure context reinitializes with new projectId
						const currentPath = ctx.mode === "full" ? "/texture-editor" : "/";

						// Force full page reload with new URL
						window.location.href = `${currentPath}?project-id=${newProjectId}`;
					} catch (error) {
						console.error(
							"[CommonToolbar] Failed to create new project:",
							error,
						);
						setIsCreatingProject(false);
					}
				}}
				className={isCreatingProject ? "opacity-50" : ""}
				disabled={isCreatingProject}
			>
				{isCreatingProject ? "creating..." : "new project"}
			</Button>
		</>
	);
}

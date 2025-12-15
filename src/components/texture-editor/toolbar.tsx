import { useContext } from "react";
import { TextureEditorContext } from "@/contexts/texture-editor-context";
import { AddElementToolbar } from "./AddElementToolbar";
import { CommonToolbar } from "./CommonToolbar";
import { ElementToolbar } from "./ElementToolbar";
import { SideSelector } from "./SideSelector";
import { TextToolbar } from "./TextToolbar";

export function Toolbar() {
	const ctx = useContext(TextureEditorContext);
	return (
		<div className="p-2 bg-surface border-b border-border flex gap-2 items-center w-full box-border relative">
			<div className="text-xs text-foreground-subtle flex flex-wrap flex-row items-start justify-start gap-2">
				<CommonToolbar />
				<SideSelector />
				{ctx.mode === "full" ? (
					<>
						<AddElementToolbar />
						{ctx.selectedElement ? <ElementToolbar /> : null}
						{ctx.selectedElement?.type === "text" ? <TextToolbar /> : null}
					</>
				) : null}
			</div>
		</div>
	);
}

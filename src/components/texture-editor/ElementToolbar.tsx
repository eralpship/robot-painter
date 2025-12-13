import { useContext } from "react";
import { TextureEditorContext } from "@/contexts/texture-editor-context";

export function ElementToolbar() {
	const ctx = useContext(TextureEditorContext);
	return (
		<button
			type="button"
			onClick={() => {
				const element = ctx.selectedElement;
				if (!element) {
					return;
				}
				ctx.removeElement(element.uuid);
			}}
			style={{
				cursor: "pointer",
			}}
		>
			remove
		</button>
	);
}

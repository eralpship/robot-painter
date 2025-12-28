import { useContext } from "react";
import { Button } from "@/components/ui/button";
import { TextureEditorContext } from "@/contexts/texture-editor-context";

export function ElementToolbar() {
	const ctx = useContext(TextureEditorContext);
	return (
		<Button
			variant="outline"
			size="sm"
			onClick={() => {
				const element = ctx.selectedElement;
				if (!element) {
					return;
				}
				ctx.removeElement(element.uuid);
			}}
		>
			remove
		</Button>
	);
}

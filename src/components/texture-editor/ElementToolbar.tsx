import { Trash2 } from "lucide-react";
import { useContext } from "react";
import { Button } from "@/components/ui/Button";
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
			<Trash2 className="size-4" /> Remove
		</Button>
	);
}

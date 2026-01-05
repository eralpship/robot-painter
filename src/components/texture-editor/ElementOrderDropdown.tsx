import { Layers } from "lucide-react";
import { useContext } from "react";
import { Button } from "@/components/ui/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TextureEditorContext } from "@/contexts/texture-editor-context";

export function ElementOrderDropdown() {
	const ctx = useContext(TextureEditorContext);

	// Only show when an element is selected
	if (!ctx.selectedElement) {
		return null;
	}

	const uuid = ctx.selectedElement.uuid;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm">
					<Layers className="size-4" /> Order
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuItem onClick={() => ctx.moveElementToFront(uuid)}>
					Bring to Front
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => ctx.moveElementForward(uuid)}>
					Bring Forward
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => ctx.moveElementBackward(uuid)}>
					Send Backward
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => ctx.moveElementToBack(uuid)}>
					Send to Back
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

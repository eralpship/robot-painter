import { useContext } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TextureEditorContext } from "../../contexts/texture-editor-context";

export function SideSelector() {
	const ctx = useContext(TextureEditorContext);

	if (!ctx) {
		console.error("SideSelector must be used within TextureEditorProvider");
		return null;
	}

	const { side, setSide } = ctx;

	return (
		<Select value={side} onValueChange={(value) => setSide(value as typeof side)}>
			<SelectTrigger size="sm" className="w-auto">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="lid">Lid</SelectItem>
				<SelectItem value="left">Left</SelectItem>
				<SelectItem value="right">Right</SelectItem>
				<SelectItem value="front">Front</SelectItem>
				<SelectItem value="back">Back</SelectItem>
			</SelectContent>
		</Select>
	);
}

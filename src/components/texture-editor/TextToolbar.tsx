import { useContext, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextureEditorContext } from "@/contexts/texture-editor-context";
import { ChangeColorModal } from "./modals/ChangeColorModal";
import { ChangeTextModal } from "./modals/ChangeTextModal";
import { FontSizeModal } from "./modals/FontSizeModal";

export function TextToolbar() {
	const ctx = useContext(TextureEditorContext);
	const [changeTextOpen, setChangeTextOpen] = useState(false);
	const [changeTextElement, setChangeTextElement] = useState<{
		uuid: string;
		text: string;
	} | null>(null);

	const [fontSizeOpen, setFontSizeOpen] = useState(false);
	const [fontSizeElement, setFontSizeElement] = useState<{
		uuid: string;
		fontSize: number;
	} | null>(null);

	const [colorOpen, setColorOpen] = useState(false);
	const [colorElement, setColorElement] = useState<{
		uuid: string;
		color: string;
	} | null>(null);

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				onClick={() => {
					const element = ctx.selectedElement;
					if (!element) {
						alert(
							"Please select a text element first by clicking on it in the editor.",
						);
						return;
					}
					if (element.type !== "text") {
						alert(
							"The selected element is not a text element. Please select a text element.",
						);
						return;
					}
					setChangeTextElement({ uuid: element.uuid, text: element.text });
					setChangeTextOpen(true);
				}}
			>
				change text
			</Button>
			<ChangeTextModal
				open={changeTextOpen}
				onOpenChange={setChangeTextOpen}
				currentText={changeTextElement?.text ?? ""}
				onSubmit={(text) => {
					if (changeTextElement) {
						ctx.updateElement(changeTextElement.uuid, { text });
					}
				}}
			/>
			<Button
				variant="outline"
				size="sm"
				onClick={() => {
					const element = ctx.selectedElement;
					if (!element) {
						alert(
							"Please select a text element first by clicking on it in the editor.",
						);
						return;
					}
					if (element.type !== "text") {
						alert(
							"The selected element is not a text element. Please select a text element.",
						);
						return;
					}
					setFontSizeElement({ uuid: element.uuid, fontSize: element.fontSize });
					setFontSizeOpen(true);
				}}
			>
				font size
			</Button>
			<FontSizeModal
				open={fontSizeOpen}
				onOpenChange={setFontSizeOpen}
				currentFontSize={fontSizeElement?.fontSize ?? 24}
				onSubmit={(fontSize) => {
					if (fontSizeElement) {
						ctx.updateElement(fontSizeElement.uuid, { fontSize });
					}
				}}
			/>
			<Button
				variant="outline"
				size="sm"
				onClick={() => {
					const element = ctx.selectedElement;
					if (!element) {
						alert(
							"Please select a text element first by clicking on it in the editor.",
						);
						return;
					}
					if (element.type !== "text") {
						alert(
							"The selected element is not a text element. Please select a text element.",
						);
						return;
					}
					setColorElement({ uuid: element.uuid, color: element.color });
					setColorOpen(true);
				}}
			>
				change color
			</Button>
			<ChangeColorModal
				open={colorOpen}
				onOpenChange={setColorOpen}
				currentColor={colorElement?.color ?? "#000000"}
				onSubmit={(color) => {
					if (colorElement) {
						ctx.updateElement(colorElement.uuid, { color });
					}
				}}
			/>
		</>
	);
}

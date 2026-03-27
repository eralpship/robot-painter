import { ALargeSmall, Palette, TextCursorInput } from "lucide-react";
import { useContext, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ColorPickerButton } from "@/components/ui/ColorPickerButton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TextureEditorContext } from "@/contexts/texture-editor-context";
import { ChangeTextModal } from "./modals/ChangeTextModal";
import { FontSizeModal } from "./modals/FontSizeModal";

const AVAILABLE_FONTS = [
	{ value: "system-default", label: "System Default" },
	{ value: "Inter", label: "Inter" },
	{ value: "Roboto", label: "Roboto" },
	{ value: "Open Sans", label: "Open Sans" },
	{ value: "Montserrat", label: "Montserrat" },
	{ value: "Poppins", label: "Poppins" },
	{ value: "Lato", label: "Lato" },
	{ value: "Raleway", label: "Raleway" },
	{ value: "Oswald", label: "Oswald" },
	{ value: "Playfair Display", label: "Playfair Display" },
	{ value: "Permanent Marker", label: "Permanent Marker" },
];

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

	const selectedTextElement =
		ctx.selectedElement?.type === "text" ? ctx.selectedElement : null;

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
				<TextCursorInput className="size-4" /> Change Text
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
					setFontSizeElement({
						uuid: element.uuid,
						fontSize: element.fontSize,
					});
					setFontSizeOpen(true);
				}}
			>
				<ALargeSmall className="size-4" /> Font Size
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
			<ColorPickerButton
				label="Text"
				color={selectedTextElement?.color ?? "#000000"}
				onChange={(color) => {
					if (selectedTextElement) {
						ctx.updateElement(selectedTextElement.uuid, { color });
					}
				}}
				disabled={!selectedTextElement}
				icon={Palette}
			/>
			<Select
				value={selectedTextElement?.fontFamily || "system-default"}
				onValueChange={(value) => {
					if (selectedTextElement) {
						ctx.updateElement(selectedTextElement.uuid, {
							fontFamily: value === "system-default" ? undefined : value,
						});
					}
				}}
				disabled={!selectedTextElement}
			>
				<SelectTrigger size="sm" className="w-auto">
					<SelectValue placeholder="Font" />
				</SelectTrigger>
				<SelectContent>
					{AVAILABLE_FONTS.map((font) => (
						<SelectItem
							key={font.value}
							value={font.value}
							style={{
								fontFamily:
									font.value === "system-default" ? "inherit" : font.value,
							}}
						>
							{font.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</>
	);
}

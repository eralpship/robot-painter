import { TextInputModal } from "@/components/ui/TextInputModal";
import { hexColorRegex } from "../utils/hexColorRegex";

interface ChangeColorModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentColor: string;
	onSubmit: (color: string) => void;
}

export function ChangeColorModal({
	open,
	onOpenChange,
	currentColor,
	onSubmit,
}: ChangeColorModalProps) {
	return (
		<TextInputModal
			open={open}
			onOpenChange={onOpenChange}
			title="Change Color"
			description="Enter hex color (e.g., #ff0000, #000000)"
			label="Hex Color"
			placeholder="#000000"
			defaultValue={currentColor}
			onSubmit={onSubmit}
			validate={(value) => {
				if (!value) return "Please enter a hex color.";
				if (!hexColorRegex.test(value))
					return "Please enter a valid hex color (e.g., #ff0000, #000000).";
				return null;
			}}
			submitText="Update"
		/>
	);
}

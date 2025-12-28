import { TextInputModal } from "@/components/ui/TextInputModal";

interface FontSizeModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentFontSize: number;
	onSubmit: (fontSize: number) => void;
}

export function FontSizeModal({
	open,
	onOpenChange,
	currentFontSize,
	onSubmit,
}: FontSizeModalProps) {
	return (
		<TextInputModal
			open={open}
			onOpenChange={onOpenChange}
			title="Change Font Size"
			description="Enter font size (number only)"
			label="Font Size"
			placeholder="e.g., 24"
			defaultValue={currentFontSize.toString()}
			onSubmit={(value) => onSubmit(parseFloat(value))}
			validate={(value) => {
				if (!value) return "Please enter a font size.";
				const fontSize = parseFloat(value);
				if (Number.isNaN(fontSize)) return "Please enter a valid number.";
				if (fontSize <= 0) return "Font size must be a positive number.";
				return null;
			}}
			submitText="Update"
		/>
	);
}

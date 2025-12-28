import { TextInputModal } from "@/components/ui/TextInputModal";

interface ChangeTextModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentText: string;
	onSubmit: (text: string) => void;
}

export function ChangeTextModal({
	open,
	onOpenChange,
	currentText,
	onSubmit,
}: ChangeTextModalProps) {
	return (
		<TextInputModal
			open={open}
			onOpenChange={onOpenChange}
			title="Change Text"
			label="Text"
			placeholder="Enter text..."
			defaultValue={currentText}
			onSubmit={onSubmit}
			validate={(value) =>
				!value || !value.trim() ? "Text cannot be empty." : null
			}
			submitText="Update"
		/>
	);
}

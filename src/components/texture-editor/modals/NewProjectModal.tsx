import { TextInputModal } from "@/components/ui/TextInputModal";
import {
	sanitizeProjectName,
	validateProjectName,
} from "@/utils/projectValidation";

interface NewProjectModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (sanitizedName: string) => Promise<void>;
	isSubmitting: boolean;
}

export function NewProjectModal({
	open,
	onOpenChange,
	onSubmit,
	isSubmitting,
}: NewProjectModalProps) {
	return (
		<TextInputModal
			open={open}
			onOpenChange={onOpenChange}
			title="New Project"
			description="Enter a name for your new project"
			label="Project Name"
			placeholder="My Project"
			defaultValue=""
			onSubmit={(value) => onSubmit(sanitizeProjectName(value))}
			validate={(value) => {
				const result = validateProjectName(value);
				return result.valid ? null : (result.error ?? "Invalid project name.");
			}}
			submitText="Create"
			isSubmitting={isSubmitting}
			closeOnSubmit={false}
		/>
	);
}

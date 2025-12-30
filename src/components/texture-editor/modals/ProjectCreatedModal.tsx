import { Button } from "@/components/ui/Button";
import {
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { UndismissableDialog } from "@/components/ui/undismissable-dialog";

interface ProjectCreatedModalProps {
	open: boolean;
	projectName: string;
	onConfirm: () => void;
}

export function ProjectCreatedModal({
	open,
	projectName,
	onConfirm,
}: ProjectCreatedModalProps) {
	return (
		<UndismissableDialog open={open}>
			<DialogHeader>
				<DialogTitle>Project Created</DialogTitle>
				<DialogDescription>
					Your new project "{projectName}" has been created.
				</DialogDescription>
			</DialogHeader>
			<DialogFooter>
				<Button onClick={onConfirm}>Open Project</Button>
			</DialogFooter>
		</UndismissableDialog>
	);
}

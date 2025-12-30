import { Button } from "@/components/ui/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

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
		<Dialog open={open} onOpenChange={() => {}}>
			<DialogContent
				showCloseButton={false}
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>Project Created</DialogTitle>
					<DialogDescription>
						Your new project "{projectName}" has been created.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button onClick={onConfirm}>Open Project</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

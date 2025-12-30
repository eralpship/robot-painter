import { Dialog, DialogContent } from "@/components/ui/dialog";

interface UndismissableDialogProps {
	open: boolean;
	children: React.ReactNode;
	className?: string;
}

export function UndismissableDialog({
	open,
	children,
	className,
}: UndismissableDialogProps) {
	return (
		<Dialog open={open} onOpenChange={() => {}}>
			<DialogContent
				showCloseButton={false}
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
				className={className}
			>
				{children}
			</DialogContent>
		</Dialog>
	);
}

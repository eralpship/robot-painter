import { Dialog, DialogContent } from "@/components/ui/dialog";

interface UndismissableDialogProps {
	open: boolean;
	children: React.ReactNode;
	className?: string;
}

/**
 * A dialog that cannot be dismissed by clicking outside or pressing Escape.
 * Uses semi-transparent backdrop to allow GlobalBackground pattern to show through.
 */
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

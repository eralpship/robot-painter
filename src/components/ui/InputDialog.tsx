import { Button } from "./Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./dialog";
import { Input } from "./input";

interface InputDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	error?: string | null;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
	maxLength?: number;
}

export function InputDialog({
	open,
	onOpenChange,
	title,
	description,
	value,
	onChange,
	placeholder = "",
	error,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	onConfirm,
	onCancel,
	maxLength,
}: InputDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<Input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					maxLength={maxLength}
					onKeyDown={(e) => {
						if (e.key === "Enter") onConfirm();
					}}
				/>
				{error && <p className="text-red-500 text-sm">{error}</p>}
				<DialogFooter>
					<Button variant="outline" onClick={onCancel}>
						{cancelLabel}
					</Button>
					<Button onClick={onConfirm}>{confirmLabel}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

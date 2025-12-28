import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface TextInputModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	label: string;
	placeholder?: string;
	defaultValue?: string;
	onSubmit: (value: string) => void;
	validate?: (value: string) => string | null;
	submitText?: string;
	cancelText?: string;
	isSubmitting?: boolean;
	closeOnSubmit?: boolean;
}

export function TextInputModal({
	open,
	onOpenChange,
	title,
	description,
	label,
	placeholder,
	defaultValue = "",
	onSubmit,
	validate,
	submitText = "Save",
	cancelText = "Cancel",
	isSubmitting = false,
	closeOnSubmit = true,
}: TextInputModalProps) {
	const [value, setValue] = useState(defaultValue);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Reset value and error when modal opens
	useEffect(() => {
		if (open) {
			setValue(defaultValue);
			setError(null);
			// Focus input after modal animation completes
			setTimeout(() => {
				inputRef.current?.focus();
				inputRef.current?.select();
			}, 50);
		}
	}, [open, defaultValue]);

	const handleSubmit = () => {
		if (isSubmitting) return;

		if (validate) {
			const validationError = validate(value);
			if (validationError) {
				setError(validationError);
				return;
			}
		}
		setError(null);
		onSubmit(value);
		if (closeOnSubmit) {
			onOpenChange(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !isSubmitting) {
			e.preventDefault();
			handleSubmit();
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				<div className="grid gap-2">
					<Label htmlFor="text-input-modal-input">{label}</Label>
					<Input
						ref={inputRef}
						id="text-input-modal-input"
						value={value}
						onChange={(e) => {
							setValue(e.target.value);
							if (error) setError(null);
						}}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						aria-invalid={!!error}
						disabled={isSubmitting}
					/>
					{error && (
						<p className="text-sm text-destructive" role="alert">
							{error}
						</p>
					)}
				</div>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline" disabled={isSubmitting}>
							{cancelText}
						</Button>
					</DialogClose>
					<Button onClick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting ? "..." : submitText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
